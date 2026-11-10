import Phaser from 'phaser';
import {
  DASH_COOLDOWN_MS,
  DASH_MS,
  DASH_SPEED,
  DIR_VEC,
  MAP_H,
  MAP_PX_H,
  MAP_PX_W,
  MAP_W,
  PLAYER_SPEED,
  TILE,
  type Dir,
} from '../config';
import { saveGame } from '../save';
import {
  challengeLines,
  claimChallenges,
  ensureChallenges,
  feedMiningMachine,
  jobActivity,
  noteActivity,
  rerollChallenge,
  spinSlots,
} from '../content/eraLoop';
import { levelLabel } from '../world/levels';
import {
  INTERIOR_ORIGIN_Y,
  buildInterior,
  interiorKindFor,
  paintInteriorTexture,
  type InteriorKind,
} from '../levels/interiors';
import {
  EFFECT_LABELS,
  applyOnHitToStatus,
  createStatus,
  applyHeal,
  moveSpeedMultiplier,
  movementReversed,
  tickStatusDamage,
  weaponDamage,
  type StatusState,
} from '../combat';
import { WEAPONS, heldStyle, weaponTiming, weaponsByShop, type WeaponDef } from '../content/weapons';
import { AMBIENT_CITIZEN_SPOTS, CITY_NPCS, createCityBots, type BotDef, type NpcDef } from '../content/npcs';
import { INSTANCE_MENU, INSTANCES, instanceForPlace, type InstanceDef } from '../content/instances';
import {
  CRAB_DIG_CHANCE,
  CRAB_SHELL_DROP_CHANCE,
  DIG_COOLDOWN_MS,
  SHELLS,
  SHELL_CLAIM_MS,
  SHOVEL_COST,
  SHOVEL_MAX_USES,
  rollCrabShell,
  rollShell,
  shellById,
} from '../content/digging';
import {
  addItem,
  consumeItem,
  currentWeapon,
  equipWeapon,
  grantJobXp,
  unlockAchievement,
  type GameState,
  type JobId,
} from '../state';
import { createWorld, districtNameAt, resolveStart, tileAt, type JobStation, type WorldData } from '../world';
import { playMusic, playSfx } from '../audio';
import { DISTRICTS } from '../content/districts';
import { actorKeyFor, paintActorSheet, playActorAnim, type ActorLook } from '../sprites/characters';
import { ensureMuzzleTexture, muzzleAnchor, poseForWeapon, poseRow, type PosePhase } from '../sprites/weaponPoses';
import { freshBotMind, thinkBot, type BotMind } from '../ai/botBrain';

interface BotSprite extends Phaser.Physics.Arcade.Sprite {
  bot: BotDef;
  hp: number;
  status: StatusState;
  deadUntil: number;
  mind: BotMind;
}

interface CitizenSprite extends Phaser.Physics.Arcade.Sprite {
  homeX: number;
  homeY: number;
  wanderAt: number;
}

export class WorldScene extends Phaser.Scene {
  private state!: GameState;
  private world!: WorldData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private dir: Dir = 'down';
  private attackReady = 0;
  private dashReady = 0;
  private dashingUntil = 0;
  private bots!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private botShots!: Phaser.Physics.Arcade.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private shellDrops!: Phaser.Physics.Arcade.Group;
  private citizens!: Phaser.Physics.Arcade.Group;
  private npcSprites: { sprite: Phaser.Physics.Arcade.Image; def: NpcDef }[] = [];
  private namePlates: { text: Phaser.GameObjects.Text; x: number; y: number }[] = [];
  private nameTag!: Phaser.GameObjects.Text;
  private playerStatus = createStatus();
  private digReady = 0;
  private digSerial = 0;
  private hudTick = 0;
  private saveTick = 0;
  private actorKey = 'actor-player';
  private frozenUntil = 0;
  private reloadUntil = 0;
  private levelSeen = '';
  private jobWork: { station: JobStation; until: number; originX: number; originY: number } | null = null;
  private jobReadyAt = new Map<string, number>();
  private recentKills: number[] = [];
  private instanceLeft = 0;
  private instanceReward: InstanceDef | null = null;
  private poseKind: 'none' | 'fire' | 'melee' | 'dry' | 'draw' = 'none';
  private poseStarted = 0;
  private poseDuration = 140;
  private poseDir: Dir = 'down';
  private dualHand = 0;
  private meleeHitDone = false;
  private pendingMelee: WeaponDef | null = null;
  private muzzle?: Phaser.GameObjects.Image;
  private muzzleHideAt = 0;
  private suppressFireUntil = 0;
  private posePreview = false;
  private previewSprites: Phaser.GameObjects.Image[] = [];
  private previewText?: Phaser.GameObjects.Text;
  private doors: { x: number; y: number; label: string; kind: InteriorKind }[] = [];
  private inside: {
    title: string;
    noPk: boolean;
    ox: number;
    oy: number;
    blocked: boolean[][];
    exitX: number;
    exitY: number;
    returnX: number;
    returnY: number;
    objects: Phaser.GameObjects.GameObject[];
  } | null = null;

  constructor() {
    super('world');
  }

  init(data: { state: GameState }): void {
    this.state = data.state;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#16324a');
    this.world = createWorld();
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.drawTiles();

    this.solids = this.physics.add.staticGroup();
    for (const obj of this.world.objects) {
      // Bottom is the ground texture. Middle holds walls and trunks. Top is roofs and canopies.
      if (obj.type === 'tree') {
        const trunk = this.solids.create(obj.x + TILE, obj.y + TILE + 10, 'trunk') as Phaser.Physics.Arcade.Sprite;
        trunk.setDepth(obj.y).setDisplaySize(12, 14).setSize(8, 8).setOffset(2, 4);
        this.add.image(obj.x + TILE, obj.y + 2, 'canopy').setDepth(120000).setDisplaySize(36, 22);
        continue;
      }
      if (obj.type === 'rock' || obj.type === 'crate' || obj.type === 'furniture') {
        this.add.image(obj.x + TILE, obj.y + TILE, obj.type).setDepth(obj.y);
        continue;
      }
      const sprite = this.solids.create(obj.x + TILE, obj.y + TILE + 10, obj.type) as Phaser.Physics.Arcade.Sprite;
      sprite.setDepth(obj.y + 10);
      sprite.setDisplaySize(obj.footprintW ?? 28, obj.footprintH ?? 16);
      sprite.setSize(18, 10).setOffset(5, 4);
      const roof = this.add.image(obj.x + TILE, obj.y, 'roof').setDepth(120000);
      roof.setDisplaySize((obj.footprintW ?? 28) + 16, 14);
      const doorX = obj.x + TILE;
      const doorY = obj.y + TILE + 28;
      const kind = interiorKindFor(obj.label ?? 'Building', obj.type);
      this.doors.push({ x: doorX, y: doorY, label: obj.label ?? 'Building', kind });
      this.add.rectangle(doorX, doorY, 16, 8, 0xe6c85a).setDepth(doorY);
    }
    for (const station of this.world.jobStations) {
      const key = station.job === 'trash' ? 'trash-pile' : station.job === 'mining' ? 'ore-vein' : 'assembly-bay';
      this.add.image(station.x, station.y, key).setDepth(station.y).setDisplaySize(28, 18);
    }
    this.events.once('shutdown', () => saveGame(this.state));

    const start = resolveStart(this.world, this.state.worldX, this.state.worldY);
    this.player = this.physics.add.sprite(start.x, start.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1000);
    this.player.setSize(14, 10).setOffset(9, 18);
    this.applyCustomization();

    this.nameTag = this.add
      .text(this.player.x, this.player.y - 18, this.state.profile.name, {
        fontFamily: 'Sora, sans-serif',
        fontSize: '6px',
        fontStyle: '600',
        color: '#eef4ff',
        stroke: '#071018',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setResolution(2);

    this.spawnNpcs();
    this.spawnCitizens();
    this.bots = this.physics.add.group();
    this.spawnBots();
    this.bullets = this.physics.add.group();
    this.botShots = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.shellDrops = this.physics.add.group();
    this.spawnJobPickups();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.bots, this.solids);
    this.physics.add.collider(this.citizens, this.solids);
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => this.collectPickup(item as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.shellDrops, (_p, item) => this.collectShellDrop(item as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.bullets, this.bots, (b, e) => this.bulletHit(b as Phaser.Physics.Arcade.Sprite, e as BotSprite));
    this.physics.add.overlap(this.player, this.bots, (_p, e) => this.playerTouchedBot(e as BotSprite));
    this.physics.add.overlap(this.player, this.botShots, (_p, shot) => this.botShotHit(shot as Phaser.Physics.Arcade.Sprite));

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(2);

    if (!this.input.keyboard) throw new Error('Keyboard required');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys(
      'W,A,S,D,E,Q,SHIFT,SPACE,ONE,TWO,C,I,H,G,M,B,V,R,U,TAB,F',
    ) as Record<string, Phaser.Input.Keyboard.Key>;

    this.drawDistrictLabels();
    this.drawWarpPads();

    playMusic(this, 'theme_city', 0.26);
    this.game.events.emit('era-state', this.state);
    this.pushChat(`Spawned at Starter Area · ${DISTRICTS.length} districts · ${MAP_W}x${MAP_H} tiles.`);
    this.pushChat(`${CITY_NPCS.length} NPCs · ${AMBIENT_CITIZEN_SPOTS.length} citizens · ${createCityBots().length} bots.`);
    this.pushChat('Mercy Beach is along the south shore. Cross the bridge east into Southridge.');
    this.pushChat('Timed jobs: trash piles, South Mines ore, Auto Mile assembly. Your city saves on this computer.');
    this.pushChat('Gold mats are doors. E enters that building as its own 64×64 level.');
    this.pushChat('Cave Entrance is the Sea Dungeon. Event House runs Plasma waves. Job Bot shows daily challenges.');
    ensureChallenges(this.state);
    ensureMuzzleTexture(this);
    this.game.events.on('hidden', this.onAppHidden, this);
    this.game.events.on('visible', this.onAppVisible, this);
    this.events.once('shutdown', () => {
      this.game.events.off('hidden', this.onAppHidden, this);
      this.game.events.off('visible', this.onAppVisible, this);
    });
  }

  update(time: number, delta = 16): void {
    if (!this.player?.active) return;
    const dt = delta / 1000;
    this.handleMovement(time);
    this.handleCombat(time);
    this.tickMeleeWindow(time);
    this.syncMuzzle(time);
    this.handleHotkeys();
    this.updateBots(time, dt);
    this.updateCitizens(time);
    this.tickPlayerStatus(time, dt);
    this.nameTag.setPosition(this.player.x, this.player.y - 18);
    this.player.setDepth(this.player.y);

    this.tickReload(time);
    this.tickJob(time);
    if (time >= this.frozenUntil && this.reloadUntil === 0 && !this.jobWork && this.state.combatNote) {
      this.state.combatNote = '';
    }
    this.saveTick += delta;
    if (this.saveTick >= 5000) {
      this.saveTick = 0;
      if (!this.inside) {
        this.state.worldX = this.player.x;
        this.state.worldY = this.player.y;
      }
      saveGame(this.state);
    }
    this.hudTick += delta;
    if (this.hudTick >= 100) {
      this.hudTick = 0;
      if (this.inside) {
        const pk = this.inside.noPk ? 'NO-PK' : 'PK';
        this.levelSeen = `in:${this.inside.title}`;
        this.game.events.emit('era-region', `${this.inside.title} · ${pk} · level 64×64`);
      } else {
        const cell = tileAt(this.world, this.player.x, this.player.y);
        if (cell) {
          const pk = cell.noPk ? 'NO-PK' : 'PK';
          const place = districtNameAt(this.world, this.player.x, this.player.y);
          const tx = Math.floor(this.player.x / TILE);
          const ty = Math.floor(this.player.y / TILE);
          const level = levelLabel(tx, ty);
          if (this.levelSeen && level !== this.levelSeen && !this.levelSeen.startsWith('in:')) {
            this.pushChat(`Crossed into level ${level}. The city keeps scrolling.`);
          }
          this.levelSeen = level;
          this.game.events.emit('era-region', `${cell.region} · ${place} · ${pk} · ${level}`);
          if (cell.zone === 'bank' && this.state.gangName && time - this.state.bankPaidAt > 60000) {
            this.state.bankPaidAt = time;
            this.state.gralats += 5;
            this.pushChat('Bank holding: +5g (300g an hour while your gang holds it).');
          }
        }
      }
      this.game.events.emit('era-hint', this.nearInteractLabel());
      this.game.events.emit('era-state', this.state);
      for (const plate of this.namePlates) {
        const near = Phaser.Math.Distance.Between(this.player.x, this.player.y, plate.x, plate.y) < 56;
        plate.text.setVisible(near);
      }
    }
  }

  private spawnNpcs(): void {
    this.npcSprites = [];
    for (const npc of CITY_NPCS) {
      const key = this.sheetFor(`${npc.id}`, this.lookFromSeed(npc.id.length + npc.x, npc.role === 'police' ? 1 : 0));
      const sprite = this.physics.add.staticImage(npc.x * TILE, npc.y * TILE, key, 0);
      sprite.setDepth(npc.y * TILE);
      sprite.setDisplaySize(32, 32);
      const tag = this.add
        .text(npc.x * TILE, npc.y * TILE - 18, npc.name, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '6px',
          fontStyle: '600',
          color: '#f0c14b',
          stroke: '#071018',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(npc.y * TILE + 1)
        .setResolution(2)
        .setVisible(false);
      this.namePlates.push({ text: tag, x: npc.x * TILE, y: npc.y * TILE });
      this.npcSprites.push({ sprite, def: npc });
    }
  }

  private spawnCitizens(): void {
    this.citizens = this.physics.add.group();
    for (const c of AMBIENT_CITIZEN_SPOTS) {
      const key = this.sheetFor(c.name, this.lookFromSeed(c.x + c.y, 2));
      const spr = this.citizens.create(c.x * TILE, c.y * TILE, key, 0) as CitizenSprite;
      spr.homeX = c.x * TILE;
      spr.homeY = c.y * TILE;
      spr.wanderAt = 0;
      spr.setDepth(c.y * TILE);
      spr.setDisplaySize(32, 32);
      spr.setSize(16, 12).setOffset(4, 18);
      const tag = this.add
        .text(c.x * TILE, c.y * TILE - 18, c.name, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '6px',
          fontStyle: '500',
          color: '#cfe0ff',
          stroke: '#071018',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(c.y * TILE + 1)
        .setResolution(2)
        .setVisible(false);
      this.namePlates.push({ text: tag, x: c.x * TILE, y: c.y * TILE });
    }
  }

  private spawnBots(): void {
    for (const bot of createCityBots()) {
      this.createBotSprite(bot);
    }
  }

  private createBotSprite(bot: BotDef): BotSprite {
    const look = this.lookFromSeed(bot.name.length, bot.kind === 'police_bot' ? 1 : 3);
    const crowd = Math.abs(look.hair + look.shirt * 3 + look.pants * 5) % 8;
    const key =
      bot.kind === 'beach_crab'
        ? 'crab'
        : bot.kind === 'training_dummy'
          ? 'crate'
          : this.sheetFor(`crowd-${bot.kind}-${crowd}`, look);
    const spr = this.bots.create(bot.x * TILE, bot.y * TILE, key, 0) as BotSprite;
    spr.bot = bot;
    spr.hp = bot.hp;
    spr.status = createStatus();
    spr.deadUntil = 0;
    spr.mind = freshBotMind(bot.x * TILE, bot.y * TILE, bot.name.length % 2 === 0 ? 1 : -1);
    spr.setDepth(bot.y * TILE);
    if (key === 'crab' || key === 'crate') {
      if (bot.tint) spr.setTint(bot.tint);
      spr.setSize(16, 12).setOffset(4, 6);
    } else {
      spr.setDisplaySize(32, 32);
      spr.setSize(14, 10).setOffset(9, 18);
    }
    spr.setData('label', bot.name);
    return spr;
  }

  private drawTiles(): void {
    // One 2352×1008 ground canvas. Built once. Not refreshed per tile or per frame.
    const started = performance.now();
    const canvas = document.createElement('canvas');
    canvas.width = MAP_PX_W;
    canvas.height = MAP_PX_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const sources = new Map<string, CanvasImageSource>();
    const sourceFor = (key: string): CanvasImageSource | null => {
      const cached = sources.get(key);
      if (cached) return cached;
      if (!this.textures.exists(key)) return null;
      const image = this.textures.get(key).getSourceImage() as CanvasImageSource;
      sources.set(key, image);
      return image;
    };
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = this.world.cells[y][x].tile;
        const alt = (x + y) % 2 === 1;
        let key = `tile-${tile}`;
        if (alt && this.textures.exists(`${key}-b`)) key = `${key}-b`;
        const image = sourceFor(key) ?? sourceFor('tile-grass');
        if (image) ctx.drawImage(image, x * TILE, y * TILE);
      }
    }
    if (this.textures.exists('world-ground')) this.textures.remove('world-ground');
    const texture = this.textures.addCanvas('world-ground', canvas);
    texture?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(0, 0, 'world-ground').setOrigin(0, 0).setDepth(0);
    console.info(
      `[projectera] ground ${canvas.width}x${canvas.height} tiles=${MAP_W * MAP_H} buildMs=${(performance.now() - started).toFixed(1)}`,
    );
  }

  private drawDistrictLabels(): void {
    for (const label of this.world.labels) {
      this.add
        .text(label.x, label.y, label.text, {
          fontFamily: 'Sora, sans-serif',
          fontSize: label.text.includes('RIDGE') ? '22px' : '12px',
          fontStyle: '700',
          color: label.color,
          stroke: '#071018',
          strokeThickness: 5,
        })
        .setOrigin(0.5, 0)
        .setDepth(5)
        .setAlpha(0.8)
        .setResolution(2);
    }
  }

  private drawWarpPads(): void {
    for (const pad of this.world.warpPads) {
      const cx = pad.x * TILE;
      const cy = pad.y * TILE;
      this.add.circle(cx, cy, 14, 0x4aa3ff, 0.45).setDepth(6);
      this.add.circle(cx, cy, 8, 0x88cfff, 0.8).setDepth(7);
      this.add
        .text(cx, cy - 22, pad.label, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '11px',
          fontStyle: '600',
          color: '#cfe0ff',
          stroke: '#071018',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(8)
        .setResolution(2);
    }
  }

  private lookFromSeed(seed: number, shirtBias: number): ActorLook {
    return {
      hair: Math.abs(seed) % 6,
      shirt: Math.abs(seed + shirtBias) % 6,
      pants: Math.abs(seed * 3) % 6,
      hat: Math.abs(seed * 5) % 6,
      skin: Math.abs(seed * 7) % 4,
    };
  }

  private sheetFor(id: string, look: ActorLook): string {
    return paintActorSheet(this, actorKeyFor(id.replace(/\s+/g, '-'), look), look);
  }

  private applyCustomization(): void {
    if (this.state.profile.customSkinDataUrl && this.textures.exists('custom-skin')) {
      this.player.anims.stop();
      this.player.setTexture('custom-skin');
      this.player.setDisplaySize(32, 32);
      return;
    }
    const look: ActorLook = {
      hair: this.state.profile.hair,
      shirt: this.state.profile.shirt,
      pants: this.state.profile.pants,
      hat: this.state.profile.hat,
      skin: 0,
      held: heldStyle(currentWeapon(this.state)),
      pose: poseForWeapon(currentWeapon(this.state)),
    };
    this.actorKey = this.sheetFor('player', look);
    this.player.setTexture(this.actorKey, 0);
    this.player.anims.stop();
    this.player.clearTint();
    this.player.setDisplaySize(32, 32);
    if (!look.pose) playActorAnim(this.player, this.actorKey, this.dir, false);
  }

  private handleMovement(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left?.isDown || this.keys.A.isDown) {
      vx = -1;
      this.dir = 'left';
    } else if (this.cursors.right?.isDown || this.keys.D.isDown) {
      vx = 1;
      this.dir = 'right';
    }
    if (this.cursors.up?.isDown || this.keys.W.isDown) {
      vy = -1;
      this.dir = 'up';
    } else if (this.cursors.down?.isDown || this.keys.S.isDown) {
      vy = 1;
      this.dir = 'down';
    }
    if (movementReversed(this.playerStatus, time)) {
      vx = -vx;
      vy = -vy;
    }

    const frozen = time < this.frozenUntil;
    if (!frozen && Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) && time > this.dashReady) {
      this.dashingUntil = time + DASH_MS;
      this.dashReady = time + DASH_COOLDOWN_MS;
      playSfx(this, 'dash', 0.35);
    }
    if (frozen) {
      vx = 0;
      vy = 0;
    }

    const statusMul = moveSpeedMultiplier(this.playerStatus, time);
    const boost = time < this.state.speedBoostUntil ? 1.35 : 1;
    const vehicleMul = this.state.activeCar ? 1.8 : this.state.activeMount ? 1.45 : 1;
    let speed = time < this.dashingUntil ? DASH_SPEED : PLAYER_SPEED;
    speed *= statusMul * boost * vehicleMul;
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    body.setVelocity(vx * speed, vy * speed);
    if (!this.state.profile.customSkinDataUrl) {
      this.showPlayerPose(time, vx !== 0 || vy !== 0);
    }

    const cell = this.footCell(this.player.x, this.player.y);
    if (cell?.blocked) {
      body.setVelocity(0, 0);
      this.player.x -= vx * 4;
      this.player.y -= vy * 4;
    }
  }

  private showPlayerPose(time: number, moving: boolean): void {
    const weapon = currentWeapon(this.state);
    const pose = poseForWeapon(weapon);
    const facing = this.pendingMelee ? this.poseDir : this.dir;
    let phase: PosePhase = moving ? 'walk' : 'idle';
    if (this.reloadUntil > time) phase = 'reload';
    else if (this.poseKind !== 'none' && time < this.poseStarted + this.poseDuration) {
      const along = (time - this.poseStarted) / this.poseDuration;
      if (pose.pattern === 'alternate') phase = this.dualHand % 2 === 0 ? 'strike' : 'windup';
      else phase = along < 0.3 ? 'windup' : along < 0.65 ? 'strike' : 'recover';
    } else if (this.poseKind !== 'none' && time >= this.poseStarted + this.poseDuration) {
      this.poseKind = 'none';
    }
    const col = { down: 0, left: 1, right: 2, up: 3 }[facing];
    const frame = col + poseRow(phase) * 4;
    this.player.anims.stop();
    if (this.player.frame.name !== String(frame)) this.player.setFrame(frame);
    this.syncPosePreview(pose.id, phase);
  }

  private tickMeleeWindow(time: number): void {
    const weapon = this.pendingMelee;
    if (!weapon) return;
    const along = (time - this.poseStarted) / this.poseDuration;
    if (!this.meleeHitDone && along >= 0.34 && along <= 0.7) {
      this.meleeHitDone = true;
      const aim = DIR_VEC[this.poseDir];
      const hx = this.player.x + aim.x * 22;
      const hy = this.player.y + aim.y * 16;
      this.bots.getChildren().forEach((obj) => {
        const enemy = obj as BotSprite;
        if (!enemy.active || enemy.hp <= 0) return;
        if (Phaser.Math.Distance.Between(hx, hy, enemy.x, enemy.y) <= weapon.range) {
          this.damageBot(enemy, weapon, time);
        }
      });
    }
    if (along >= 1) this.pendingMelee = null;
  }

  private segmentClear(x0: number, y0: number, x1: number, y1: number): boolean {
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      const cell = tileAt(this.world, x, y);
      if (cell?.blocked) return false;
    }
    return true;
  }

  private flashMuzzle(x: number, y: number, time: number): void {
    if (!this.muzzle) {
      this.muzzle = this.add.image(x, y, 'muzzle-flash').setVisible(false);
    }
    this.muzzle.setPosition(x, y).setVisible(true).setDepth(this.player.y + 1);
    this.muzzleHideAt = time + 45;
  }

  private syncMuzzle(time: number): void {
    if (this.muzzle?.visible && time >= this.muzzleHideAt) this.muzzle.setVisible(false);
  }

  private onAppHidden(): void {
    this.input.keyboard?.resetKeys();
  }

  private onAppVisible(): void {
    this.input.keyboard?.resetKeys();
    this.suppressFireUntil = this.time.now + 200;
  }

  private cancelWeaponMotion(): void {
    this.reloadUntil = 0;
    this.pendingMelee = null;
    this.meleeHitDone = false;
    this.poseKind = 'draw';
    this.poseStarted = this.time.now;
    this.poseDuration = 160;
    this.poseDir = this.dir;
    if (this.muzzle) this.muzzle.setVisible(false);
  }

  private syncPosePreview(profile: string, phase: PosePhase): void {
    if (!this.posePreview) {
      this.previewSprites.forEach((sprite) => sprite.setVisible(false));
      this.previewText?.setVisible(false);
      return;
    }
    const labels: Dir[] = ['down', 'left', 'right', 'up'];
    if (this.previewSprites.length === 0) {
      labels.forEach(() => {
        const image = this.add.image(0, 0, this.actorKey, 0).setScrollFactor(0).setDepth(300000).setDisplaySize(48, 48);
        this.previewSprites.push(image);
      });
      this.previewText = this.add
        .text(12, 8, '', { fontFamily: 'Sora, sans-serif', fontSize: '13px', color: '#f4f7fb' })
        .setScrollFactor(0)
        .setDepth(300001)
        .setResolution(2);
    }
    labels.forEach((facing, index) => {
      const col = { down: 0, left: 1, right: 2, up: 3 }[facing];
      const image = this.previewSprites[index];
      image.setTexture(this.actorKey, col + poseRow('idle') * 4);
      image.setVisible(true);
      image.setPosition(28 + index * 52, 56);
    });
    this.previewText?.setVisible(true);
    this.previewText?.setText(`${currentWeapon(this.state).name} · ${profile} · ${phase} · F hides`);
  }

  private handleCombat(time: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.useWeaponAbility(time);
      return;
    }
    if (time < this.suppressFireUntil) return;
    if (!Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      return;
    }
    if (this.state.activeCar || this.state.activeMount) {
      this.pushChat('Dismount first (V) to fight.');
      return;
    }
    if (time < this.attackReady) return;
    const weapon = currentWeapon(this.state);
    this.attackReady = time + weapon.cooldown;

    if (weapon.kind === 'melee' || weapon.kind === 'shield') {
      this.doMelee(weapon, time);
    } else if (weapon.kind === 'gun') {
      this.doGun(weapon, time);
    } else if (weapon.kind === 'throwable') {
      this.doThrowable(weapon, time);
    }
  }

  private doMelee(weapon: WeaponDef, time: number): void {
    const timing = weaponTiming(weapon);
    this.frozenUntil = time + timing.freezeMs;
    if (timing.freezeMs >= 60) this.state.combatNote = 'Freeze';
    playSfx(this, 'swing', 0.4);
    const pose = poseForWeapon(weapon);
    this.poseKind = 'melee';
    this.poseStarted = time;
    this.poseDuration = pose.visualMs;
    this.poseDir = this.dir;
    this.pendingMelee = weapon;
    this.meleeHitDone = false;

    if (weapon.effect === 'heal' || (weapon.ability === 'alt_heal' && this.state.altHealMode)) {
      const heal = weapon.healAmount ?? weapon.effectPower;
      this.tryHeal(heal);
      playSfx(this, 'heal');
      this.pushChat(`Healed +${heal}`);
    }
  }

  private doGun(weapon: WeaponDef, time: number): void {
    const timing = weaponTiming(weapon);
    if (time < this.reloadUntil) {
      this.pushChat('Still reloading.');
      return;
    }
    if (weapon.ammo !== 'none') {
      if (this.state.clipLeft <= 0) {
        const pool = this.state.ammo[weapon.ammo];
        if (pool <= 0) {
          this.poseKind = 'dry';
          this.poseStarted = time;
          this.poseDuration = 90;
          this.poseDir = this.dir;
          this.pushChat('Out of ammo.');
          playSfx(this, 'ui');
          return;
        }
        this.reloadUntil = time + timing.reloadMs;
        this.frozenUntil = time + Math.min(120, timing.freezeMs);
        this.state.combatNote = 'Reloading';
        playSfx(this, 'ui');
        this.pushChat(`Reloading (${(timing.reloadMs / 1000).toFixed(1)}s)…`);
        return;
      }
      this.state.clipLeft -= 1;
    }
    this.frozenUntil = Math.max(this.frozenUntil, time + timing.freezeMs);
    if (timing.freezeMs >= 80) this.state.combatNote = 'Freeze';

    if (weapon.ability === 'alt_heal' && this.state.altHealMode) {
      const heal = weapon.healAmount ?? 4;
      this.tryHeal(heal);
      playSfx(this, 'heal');
      this.pushChat(`Heal mode +${heal}`);
      return;
    }

    const pose = poseForWeapon(weapon);
    this.poseKind = 'fire';
    this.poseStarted = time;
    this.poseDuration = pose.visualMs;
    this.poseDir = this.dir;
    if (pose.pattern === 'alternate') this.dualHand += 1;
    const anchor = muzzleAnchor(pose, this.dir);
    const mx = this.player.x + (anchor.x - 16);
    const my = this.player.y + (anchor.y - 16);
    if (!this.segmentClear(this.player.x, this.player.y, mx, my)) {
      this.pushChat('The muzzle is against a wall.');
      return;
    }
    playSfx(this, 'shoot', 0.35);
    this.flashMuzzle(mx, my, time);
    const pellets = weapon.pellets ?? 1;
    const spread = timing.spread;
    const speed = timing.projectileSpeed || 420;
    const base = Math.atan2(DIR_VEC[this.dir].y, DIR_VEC[this.dir].x);
    for (let i = 0; i < pellets; i++) {
      const angle = base + (pellets === 1 ? 0 : -spread + (spread * 2 * i) / Math.max(1, pellets - 1));
      const bullet = this.bullets.create(mx, my, 'bullet') as Phaser.Physics.Arcade.Sprite;
      bullet.setDepth(this.player.y + 1);
      bullet.setData('weaponId', weapon.id);
      bullet.setData('damage', weaponDamage(weapon, this.state.clipLeft + 1, this.state.altHealMode));
      bullet.setData('graze', timing.grazeDamage);
      this.physics.velocityFromRotation(angle, speed, bullet.body!.velocity);
      const life = Math.min(1400, (weapon.range / speed) * 1000 + 120);
      this.time.delayedCall(life, () => {
        if (bullet.active) bullet.destroy();
      });
    }
  }

  private doThrowable(weapon: WeaponDef, time: number): void {
    if (!consumeItem(this.state, weapon.id, 1) && !this.state.ownedWeapons.includes(weapon.id)) {
      // Allow equipped throwable without inventory consume if owned as weapon
      if (!this.state.ownedWeapons.includes(weapon.id)) {
        this.pushChat(`No ${weapon.name} left.`);
        return;
      }
    }
    playSfx(this, 'shoot', 0.3);
    const v = DIR_VEC[this.dir];
    const bomb = this.add.circle(this.player.x + v.x * 20, this.player.y + v.y * 20, 8, 0xff6b4a, 0.9);
    bomb.setDepth(2000);
    this.tweens.add({
      targets: bomb,
      x: this.player.x + v.x * weapon.range,
      y: this.player.y + v.y * weapon.range,
      duration: 280,
      onComplete: () => {
        this.areaEffect(bomb.x, bomb.y, weapon, time);
        bomb.destroy();
      },
    });
  }

  private areaEffect(x: number, y: number, weapon: WeaponDef, time: number): void {
    const radius = Math.max(40, weapon.effectPower || 48);
    const blast = this.add.circle(x, y, radius, 0xffaa55, 0.35).setDepth(1999);
    this.tweens.add({ targets: blast, alpha: 0, duration: 250, onComplete: () => blast.destroy() });
    playSfx(this, 'hit');
    this.bots.getChildren().forEach((obj) => {
      const enemy = obj as BotSprite;
      if (!enemy.active || enemy.hp <= 0) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        this.damageBot(enemy, weapon, time);
      }
    });
  }

  private useWeaponAbility(time: number): void {
    if (time < this.state.abilityReadyAt) {
      this.pushChat('Ability cooling down.');
      return;
    }
    const weapon = currentWeapon(this.state);
    this.state.abilityReadyAt = time + 1200;
    playSfx(this, 'ui');

    switch (weapon.ability) {
      case 'dash':
        this.dashingUntil = time + DASH_MS + 40;
        playSfx(this, 'dash');
        this.pushChat(`${weapon.name}: Dash`);
        break;
      case 'roll':
        this.dashingUntil = time + 160;
        this.player.setData('iframes', time + 280);
        playSfx(this, 'dash');
        this.pushChat(`${weapon.name}: Roll`);
        break;
      case 'heal':
      case 'alt_heal': {
        if (weapon.ability === 'alt_heal') {
          this.state.altHealMode = !this.state.altHealMode;
          this.pushChat(`Heal mode ${this.state.altHealMode ? 'ON' : 'OFF'}`);
        } else {
          const heal = weapon.healAmount ?? 5;
          this.tryHeal(heal);
          playSfx(this, 'heal');
          this.pushChat(`Healed +${heal}`);
        }
        break;
      }
      case 'shield':
        this.state.shieldUntil = time + 2000;
        this.pushChat('Guard up — damage reduced.');
        break;
      case 'mode_switch':
        this.state.altHealMode = !this.state.altHealMode;
        this.pushChat(`Mode switched (${this.state.altHealMode ? 'alt' : 'primary'}).`);
        break;
      case 'rage':
        this.state.speedBoostUntil = time + 2500;
        this.dashingUntil = time + 180;
        this.pushChat('Rage!');
        break;
      case 'blink': {
        const v = DIR_VEC[this.dir];
        this.player.x += v.x * 64;
        this.player.y += v.y * 64;
        playSfx(this, 'dash');
        this.pushChat('Blink');
        break;
      }
      case 'speed_boost':
        this.state.speedBoostUntil = time + 3000;
        this.pushChat('Speed boost');
        break;
      case 'spray':
      case 'burst':
        this.attackReady = 0;
        this.pushChat(`${weapon.abilityLabel} ready — mash Space`);
        break;
      case 'finisher':
        this.pushChat('Finisher: last round hits harder.');
        break;
      default:
        this.pushChat(`${weapon.name} has no hotkey ability.`);
    }
  }

  private damageBot(enemy: BotSprite, weapon: WeaponDef, time: number, amount?: number, graze = false): void {
    if (enemy.bot.kind === 'training_dummy') {
      // still apply visuals/effects for testing
    }
    let dmg = amount ?? weaponDamage(weapon, this.state.clipLeft, this.state.altHealMode);
    if (amount === undefined && weapon.kind === 'throwable') dmg = weapon.damage;

    const hit = applyOnHitToStatus(enemy.status, weapon.effect, weapon.effectPower, time);
    if (hit.healAttacker > 0 || weapon.effect === 'lifesteal') {
      const heal = hit.healAttacker || weapon.effectPower;
      this.tryHeal(heal);
    }
    if (hit.knockback > 0) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      enemy.x += Math.cos(angle) * (hit.knockback * 0.08);
      enemy.y += Math.sin(angle) * (hit.knockback * 0.08);
    }
    if (hit.explodeRadius > 0) {
      this.bots.getChildren().forEach((obj) => {
        const other = obj as BotSprite;
        if (other === enemy || !other.active || other.hp <= 0) return;
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y) <= hit.explodeRadius) {
          other.hp -= Math.max(3, weapon.damage * 0.4);
        }
      });
    }

    enemy.hp -= dmg;
    enemy.mind.alertUntil = time + 8000;
    this.floatHit(enemy.x, enemy.y - 8, graze ? `graze ${Math.round(dmg)}` : `${Math.round(dmg)}`, graze ? '#f0c14b' : '#f4f7fb');
    playSfx(this, 'hit');
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(60, () => {
      if (enemy.active) enemy.setTint(enemy.bot.tint ?? 0xffffff);
    });

    if (enemy.hp <= 0) {
      this.killBot(enemy, time);
    }
  }

  private killBot(enemy: BotSprite, time: number): void {
    if (enemy.bot.kind === 'training_dummy') {
      enemy.hp = enemy.bot.hp;
      this.pushChat('Dummy reset.');
      return;
    }
    enemy.setActive(false).setVisible(false);
    (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
    const permanent = enemy.bot.respawnMs >= 999999;
    enemy.deadUntil = permanent ? Number.POSITIVE_INFINITY : time + enemy.bot.respawnMs;
    this.state.kills += 1;
    this.state.killStreak += 1;
    this.recentKills.push(time);
    this.recentKills = this.recentKills.filter((stamp) => time - stamp < 15000);
    if (this.recentKills.length >= 3) {
      this.state.speedBoostUntil = Math.max(this.state.speedBoostUntil, time + 30000);
      this.pushChat('Speed streak — faster for 30s.');
      this.recentKills = [];
    }
    if (this.state.killStreak > 0 && this.state.killStreak % 50 === 0) {
      this.tryHeal(50);
      this.pushChat(`Kill streak ${this.state.killStreak}. +50 HP.`);
    }
    if (enemy.bot.kind === 'beach_crab') {
      const ready = noteActivity(this.state, 'crabs');
      if (ready) this.pushChat(ready);
    }
    if (enemy.bot.id.startsWith('inst')) {
      this.instanceLeft = Math.max(0, this.instanceLeft - 1);
      if (this.instanceLeft === 0) this.finishInstance();
    }
    const killReady = noteActivity(this.state, 'kills');
    if (killReady) this.pushChat(killReady);
    this.state.gralats += enemy.bot.loot;
    playSfx(this, 'coin');

    if (enemy.bot.kind === 'beach_crab' && Math.random() < CRAB_SHELL_DROP_CHANCE) {
      const drop = rollCrabShell();
      this.spawnShellPickup(enemy.x, enemy.y, drop.id, drop.tint, true);
      this.pushChat(`${enemy.bot.name} dropped ${drop.name}!`);
    } else {
      this.pushChat(`${enemy.bot.name} down (+${enemy.bot.loot}g). Kills ${this.state.kills}`);
    }
    if (permanent) {
      this.time.delayedCall(500, () => enemy.destroy());
    }

    if (this.state.kills === 10) {
      const ach = unlockAchievement(this.state, 'kills10', 'Ten down');
      if (ach) {
        playSfx(this, 'levelup');
        this.pushChat(ach);
      }
    }
  }

  private updateBots(time: number, dt: number): void {
    this.bots.getChildren().forEach((obj) => {
      const enemy = obj as BotSprite;
      if (!enemy.active) {
        if (enemy.deadUntil && time >= enemy.deadUntil) {
          enemy.hp = enemy.bot.hp;
          enemy.status = createStatus();
          enemy.mind = freshBotMind(enemy.bot.x * TILE, enemy.bot.y * TILE, enemy.mind?.strafe ?? 1);
          enemy.setPosition(enemy.bot.x * TILE, enemy.bot.y * TILE);
          enemy.setActive(true).setVisible(true);
          (enemy.body as Phaser.Physics.Arcade.Body).enable = true;
        }
        return;
      }

      const statusDmg = tickStatusDamage(enemy.status, time, dt);
      if (statusDmg > 0) {
        enemy.hp -= statusDmg;
        if (enemy.hp <= 0) {
          this.killBot(enemy, time);
          return;
        }
      }

      const mul = moveSpeedMultiplier(enemy.status, time);
      enemy.setDepth(enemy.y);
      if (enemy.bot.speed <= 0 || mul === 0) {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        return;
      }
      const cell = tileAt(this.world, this.player.x, this.player.y);
      const neighbors = this.bots.getChildren()
        .filter((other) => other !== enemy && (other as BotSprite).active)
        .map((other) => ({ x: (other as BotSprite).x, y: (other as BotSprite).y }));
      const order = thinkBot({
        kind: enemy.bot.kind,
        x: enemy.x,
        y: enemy.y,
        hp: enemy.hp,
        maxHp: enemy.bot.hp,
        speed: enemy.bot.speed * mul,
        aggro: enemy.bot.aggro,
        time,
        px: this.player.x,
        py: this.player.y,
        playerInSafe: !!cell?.noPk,
        neighbors,
        mind: enemy.mind,
      });
      (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(order.vx, order.vy);
      if (order.winding) enemy.setTint(0xffd27a);
      else if (enemy.bot.tint) enemy.setTint(enemy.bot.tint);
      else enemy.clearTint();
      const moving = Math.hypot(order.vx, order.vy) > 8;
      if (enemy.texture.key !== 'crab' && enemy.texture.key !== 'crate') {
        playActorAnim(enemy, enemy.texture.key, order.facing, moving);
      }
      if (order.attack === 'shot') this.fireBotShot(enemy);
      else if (order.attack === 'melee') this.botMelee(enemy, time);
    });
  }

  private botMelee(enemy: BotSprite, time: number): void {
    const reach = 40;
    if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) > reach) return;
    const slash = this.add.image(enemy.x + (this.player.x - enemy.x) * 0.45, enemy.y + (this.player.y - enemy.y) * 0.45, 'slash');
    slash.setDepth(enemy.y + 2);
    this.tweens.add({ targets: slash, alpha: 0, duration: 140, onComplete: () => slash.destroy() });
    this.hurtPlayer(enemy, enemy.bot.damage, time);
  }

  private fireBotShot(enemy: BotSprite): void {
    const shot = this.botShots.create(enemy.x, enemy.y, 'bullet') as Phaser.Physics.Arcade.Sprite;
    shot.setDepth(enemy.y + 1);
    shot.setTint(enemy.bot.kind === 'police_bot' ? 0x4aa3ff : 0xff8a6a);
    shot.setData('owner', enemy.bot.id);
    shot.setData('damage', enemy.bot.damage);
    this.physics.moveToObject(shot, this.player, 210);
    this.time.delayedCall(700, () => {
      if (shot.active) shot.destroy();
    });
  }

  private botShotHit(shot: Phaser.Physics.Arcade.Sprite): void {
    const here = tileAt(this.world, this.player.x, this.player.y);
    if (!this.inside && here?.noPk) {
      shot.destroy();
      return;
    }
    const ownerId = shot.getData('owner') as string;
    const owner = this.bots.getChildren().find((obj) => (obj as BotSprite).bot.id === ownerId) as BotSprite | undefined;
    const damage = (shot.getData('damage') as number) || 4;
    shot.destroy();
    if (!owner) return;
    this.hurtPlayer(owner, damage, this.time.now);
  }

  private updateCitizens(time: number): void {
    this.citizens.getChildren().forEach((obj) => {
      const c = obj as CitizenSprite;
      c.setDepth(c.y);
      if (time > c.wanderAt) {
        c.wanderAt = time + 1500 + Math.random() * 2500;
        const tx = c.homeX + Phaser.Math.Between(-48, 48);
        const ty = c.homeY + Phaser.Math.Between(-48, 48);
        this.physics.moveTo(c, tx, ty, 40);
      }
    });
  }

  private tickPlayerStatus(time: number, dt: number): void {
    const dmg = tickStatusDamage(this.playerStatus, time, dt);
    if (dmg > 0) {
      let final = dmg;
      if (time < this.state.shieldUntil) final *= 0.5;
      this.state.hp -= final;
      if (this.state.hp <= 0) this.respawn();
    }
  }

  private playerTouchedBot(enemy: BotSprite): void {
    this.hurtPlayer(enemy, enemy.bot.damage, this.time.now);
  }

  private hurtPlayer(enemy: BotSprite, amount: number, time: number): void {
    if (!enemy.active || enemy.hp <= 0 || amount <= 0) return;
    const cell = this.inside ? this.footCell(this.player.x, this.player.y) : tileAt(this.world, this.player.x, this.player.y);
    if (!this.inside && cell?.noPk) return;
    if (enemy.bot.kind === 'beach_crab') {
      const nextHit = (enemy.getData('nextCrabHit') as number) || 0;
      if (time < nextHit) return;
      enemy.setData('nextCrabHit', time + 700);
      this.state.hp -= 3;
      this.floatHit(this.player.x, this.player.y - 16, '3', '#ff8a6a');
      playSfx(this, 'hurt');
      this.cameras.main.shake(70, 0.003);
      if (this.state.hp <= 0) this.respawn();
      return;
    }
    if (time < (this.player.getData('iframes') as number)) return;
    this.player.setData('iframes', time + 480);
    let dmg = amount;
    if (time < this.state.shieldUntil) dmg *= 0.5;
    this.state.hp -= dmg;
    this.floatHit(this.player.x, this.player.y - 16, `${Math.round(dmg)}`, '#ff8a6a');
    playSfx(this, 'hurt');
    this.cameras.main.shake(70, 0.003);
    if (this.state.hp <= 0) this.respawn();
  }

  private tryHeal(amount: number): boolean {
    const next = applyHeal(this.state.hp, this.state.maxHp, this.playerStatus, this.time.now, amount);
    if (next === this.state.hp && this.time.now < this.playerStatus.antiHealUntil) {
      this.pushChat('Anti-heal — healing blocked.');
      return false;
    }
    this.state.hp = next;
    return true;
  }

  private respawn(): void {
    if (this.inside) this.leaveInterior();
    this.state.hp = this.state.maxHp;
    this.state.killStreak = 0;
    this.recentKills = [];
    this.player.setPosition(this.world.spawn.x, this.world.spawn.y);
    this.playerStatus = createStatus();
    this.player.setData('iframes', this.time.now + 2000);
    this.pendingMelee = null;
    this.poseKind = 'none';
    if (this.muzzle) this.muzzle.setVisible(false);
    this.pushChat('Knocked out. No gralats or items lost. Spawn protection for 2s at the Starter Area.');
  }

  private bulletHit(bullet: Phaser.Physics.Arcade.Sprite, enemy: BotSprite): void {
    const weaponId = bullet.getData('weaponId') as string;
    const weapon = WEAPONS[weaponId] ?? currentWeapon(this.state);
    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
    const graze = dist > 11;
    const direct = (bullet.getData('damage') as number) || weapon.damage;
    const grazed = (bullet.getData('graze') as number) || Math.max(1, Math.round(direct * 0.45));
    bullet.destroy();
    if (!enemy.active) return;
    this.damageBot(enemy, weapon, this.time.now, graze ? grazed : direct, graze);
  }

  private floatHit(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'Sora, sans-serif',
        fontSize: '11px',
        fontStyle: '700',
        color,
        stroke: '#071018',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(130000)
      .setResolution(2);
    this.tweens.add({
      targets: label,
      y: y - 14,
      alpha: 0,
      duration: 420,
      onComplete: () => label.destroy(),
    });
  }

  private tickReload(time: number): void {
    if (!this.reloadUntil || time < this.reloadUntil) return;
    const weapon = currentWeapon(this.state);
    const timing = weaponTiming(weapon);
    this.reloadUntil = 0;
    if (weapon.ammo === 'none') return;
    const pool = this.state.ammo[weapon.ammo];
    const reload = Math.min(timing.clip || 1, pool);
    this.state.ammo[weapon.ammo] -= reload;
    this.state.clipLeft = reload;
    if (time >= this.frozenUntil) this.state.combatNote = '';
    this.pushChat(`Reloaded ${reload} ${weapon.ammo}.`);
    playSfx(this, 'ui', 0.3);
  }

  private tickJob(time: number): void {
    if (!this.jobWork) return;
    const moved = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.jobWork.originX, this.jobWork.originY);
    if (moved > 22) {
      this.pushChat('Stopped. Stay on the spot to finish the job.');
      this.jobWork = null;
      this.state.combatNote = '';
      return;
    }
    if (time < this.jobWork.until) return;
    const station = this.jobWork.station;
    this.jobWork = null;
    this.state.combatNote = '';
    const wait = station.job === 'cars' ? 5200 : 3600;
    this.jobReadyAt.set(station.id, time + wait);
    if (station.job === 'trash') this.payJob('trash', 'trash', 8, 14, true);
    else if (station.job === 'mining') this.payJob('mining', 'ore', 10, 16, true);
    else if (!consumeItem(this.state, 'ore', 1)) this.pushChat('The ore was not in your pack.');
    else this.payJob('cars', 'car_part', 22, 34, true);
  }

  private nearestStation(): { station: JobStation; dist: number } | null {
    let best: { station: JobStation; dist: number } | null = null;
    for (const station of this.world.jobStations) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y);
      if (dist < 42 && (!best || dist < best.dist)) best = { station, dist };
    }
    return best;
  }

  private startJob(station: JobStation): void {
    if (this.jobWork) return;
    const ready = this.jobReadyAt.get(station.id) ?? 0;
    if (this.time.now < ready) {
      this.pushChat(`${station.label} is empty for a moment.`);
      return;
    }
    if (station.job === 'cars') {
      const ore = this.state.inventory.find((item) => item.id === 'ore')?.count ?? 0;
      if (ore < 1) {
        this.pushChat('Assembly needs 1 ore. Mine a vein in South Mines.');
        return;
      }
    }
    const ms = station.job === 'trash' ? 900 : station.job === 'mining' ? 1300 : 1700;
    this.jobWork = { station, until: this.time.now + ms, originX: this.player.x, originY: this.player.y };
    this.state.combatNote = station.job === 'trash' ? 'Picking up' : station.job === 'mining' ? 'Mining' : 'Assembling';
    playSfx(this, 'job');
    this.pushChat(`${station.label}. Stay still.`);
  }

  private handleHotkeys(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.eatFood();
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.cycleOwnedWeapon();
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.openChat();
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.game.events.emit('era-toggle', 'inventory');
    if (Phaser.Input.Keyboard.JustDown(this.keys.H)) this.houseMenu();
    if (Phaser.Input.Keyboard.JustDown(this.keys.G)) this.gangMenu();
    if (Phaser.Input.Keyboard.JustDown(this.keys.B)) this.botBoard();
    if (Phaser.Input.Keyboard.JustDown(this.keys.V)) this.toggleVehicle();
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.cycleMorph();
    if (Phaser.Input.Keyboard.JustDown(this.keys.U)) this.uploadSkin();
    if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) this.weaponBrowser();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.posePreview = !this.posePreview;
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) {
      if (this.sound.locked) this.sound.unlock();
      playMusic(this, 'theme_city', 0.26);
      playSfx(this, 'ui');
    }
  }

  private nearInteractLabel(): string {
    if (this.nearExit()) return `E — leave ${this.inside?.title ?? 'building'}`;
    if (this.inside) return 'Walk to the gold door and press E to return outside';
    const door = this.nearestDoor();
    const doorDist = door ? Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y) : 999;
    const stationHit = this.nearestStation();
    const npc = this.nearestNpc();
    const npcDist = npc
      ? Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x * TILE, npc.y * TILE)
      : 999;
    const stationDist = stationHit?.dist ?? 999;
    if (door && doorDist <= npcDist && doorDist <= stationDist) return `E — enter ${door.label}`;
    if (stationHit && stationDist <= npcDist) {
      if (stationHit.station.job === 'trash') return 'E — pick up trash (stay still)';
      if (stationHit.station.job === 'mining') return 'E — mine ore (stay still)';
      return 'E — assemble a car part (needs 1 ore)';
    }
    if (npc) return `E — ${npc.name} (${npc.role})`;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return '';
    if (cell.dig && (cell.zone === 'mercy_beach' || cell.zone === 'south_beach')) {
      if (!this.state.shovelCount && this.state.shovelUses <= 0) {
        return 'Buy a shovel at Shell Shack (50g) — Mercy Beach or Southridge';
      }
      if (!this.state.diggingEquipped) return 'E at Shell Shack → equip, then dig sand';
      return `E — dig sand (${this.state.shovelUses} uses · Trochus common)`;
    }
    if (cell.zone === 'spar_complex') return 'Fight spar bots · Q ability';
    if (cell.zone === 'south_mines') return 'Mine pests · Job Foreman nearby';
    if (this.world.warpPads.some((p) => Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x * TILE, p.y * TILE) < 40)) {
      return 'E — ride subway / shuttle warp';
    }
    return 'E talk · Bridge south of harbour · Subway pads · TAB weapons';
  }

  private nearestNpc(): NpcDef | null {
    let best: NpcDef | null = null;
    let bestDist = 56;
    for (const { def } of this.npcSprites) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, def.x * TILE, def.y * TILE);
      if (d < bestDist) {
        best = def;
        bestDist = d;
      }
    }
    return best;
  }

  private interact(): void {
    if (this.nearExit()) {
      this.leaveInterior();
      return;
    }
    if (this.inside) return;
    const door = this.nearestDoor();
    const doorDist = door ? Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y) : 999;
    const stationHit = this.nearestStation();
    const npc = this.nearestNpc();
    const npcDist = npc
      ? Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x * TILE, npc.y * TILE)
      : 999;
    const stationDist = stationHit?.dist ?? 999;
    if (door && doorDist <= npcDist && doorDist <= stationDist) {
      this.enterBuilding(door);
      return;
    }
    if (stationHit && (!npc || stationHit.dist <= npcDist)) {
      this.startJob(stationHit.station);
      return;
    }
    if (npc) {
      playSfx(this, 'chat');
      const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
      this.pushChat(`${npc.name}: ${line}`);
      if (npc.role === 'shop_guns') this.openWeaponShop('guns');
      else if (npc.role === 'shop_melee') this.openWeaponShop('melee');
      else if (npc.role === 'shop_exotic') this.openWeaponShop('exotic');
      else if (npc.role === 'shop_cars') this.buyCar();
      else if (npc.role === 'shop_fashion' || npc.role === 'shop_hats') this.fashionShop(npc.role);
      else       if (npc.role === 'shell_shop') this.shellShopMenu();
      else if (npc.role === 'crab_shack') this.crabShackMenu();
      else if (npc.role === 'warp') this.useNearestWarp();
      else if (npc.role === 'job') this.jobDesk();
      else if (npc.role === 'pizza') this.doJob('pizza', 'pizza', 10, 15);
      else if (npc.role === 'mail') this.doJob('mail', 'mail', 9, 14);
      else if (npc.role === 'gang') this.gangMenu();
      return;
    }

    // Warp pads without needing exact NPC overlap
    if (this.tryWarpPad()) return;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return;
    if (cell.dig) this.digBeach();
    else if (cell.zone === 'south_mines' || cell.zone === 'gun_row') this.doRandomJob();
    else if (cell.zone === 'start_park' || cell.zone === 'downtown') {
      /* plaza - no default job */
    }
  }

  private footCell(wx: number, wy: number) {
    if (this.inside) {
      const tx = Math.floor((wx - this.inside.ox) / TILE);
      const ty = Math.floor((wy - this.inside.oy) / TILE);
      const row = this.inside.blocked[ty];
      const blocked = !row || row[tx] !== false;
      return {
        tile: 'path' as const,
        blocked,
        zone: 'wilderness' as const,
        noPk: this.inside.noPk,
        region: 'northridge' as const,
      };
    }
    return tileAt(this.world, wx, wy);
  }

  private nearestDoor(): { x: number; y: number; label: string; kind: InteriorKind } | null {
    let best: { x: number; y: number; label: string; kind: InteriorKind } | null = null;
    let bestDist = 42;
    for (const door of this.doors) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
      if (dist < bestDist) {
        best = door;
        bestDist = dist;
      }
    }
    return best;
  }

  private nearExit(): boolean {
    if (!this.inside) return false;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.inside.exitX, this.inside.exitY) < 48;
  }

  private enterBuilding(door: { x: number; y: number; label: string; kind: InteriorKind }): void {
    if (this.inside) return;
    const level = buildInterior(door.kind, door.label);
    const key = paintInteriorTexture(this, level);
    const ox = 0;
    const oy = INTERIOR_ORIGIN_Y;
    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(this.add.image(ox, oy, key).setOrigin(0, 0).setDepth(0));
    for (const prop of level.props) {
      const px = ox + prop.tx * TILE + 8;
      const py = oy + prop.ty * TILE + 8;
      if (this.textures.exists(prop.key)) {
        objects.push(this.add.image(px, py, prop.key).setDepth(py).setDisplaySize(26, 20));
      }
      if (prop.label) {
        objects.push(
          this.add
            .text(px, py - 18, prop.label, {
              fontFamily: 'Sora, sans-serif',
              fontSize: '11px',
              fontStyle: '600',
              color: '#f4f7fb',
              stroke: '#1a120e',
              strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(py + 30)
            .setResolution(2),
        );
      }
    }
    objects.push(
      this.add
        .text(ox + 32 * TILE, oy + 8 * TILE, door.label.toUpperCase(), {
          fontFamily: 'Sora, sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          color: '#f4f7fb',
          stroke: '#1a120e',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(oy + 200)
        .setResolution(2),
    );
    const span = level.size * TILE;
    this.inside = {
      title: door.label,
      noPk: level.noPk,
      ox,
      oy,
      blocked: level.blocked,
      exitX: ox + (level.exitTx + 1) * TILE,
      exitY: oy + level.exitTy * TILE,
      returnX: door.x,
      returnY: door.y + 18,
      objects,
    };
    this.physics.world.setBounds(0, 0, Math.max(MAP_W, level.size) * TILE, oy + span);
    this.player.setPosition(ox + level.spawnTx * TILE, oy + level.spawnTy * TILE);
    this.physics.world.setBounds(ox, oy, span, span);
    this.cameras.main.setBounds(ox, oy, span, span);
    playSfx(this, 'ui');
    this.pushChat(`Entered ${door.label}. Own level, 64×64 tiles. Gold door south, E to leave.`);
    this.levelSeen = `in:${door.label}`;
    this.openLinkedInstance(door.label);
  }

  private openLinkedInstance(label: string): void {
    const lower = label.toLowerCase();
    if (lower.includes('event')) {
      const pick = window.prompt(`Event levels: ${INSTANCE_MENU}`, 'plasma');
      const def = pick ? INSTANCES[pick.trim().toLowerCase()] : undefined;
      if (def) this.spawnInstance(def);
      return;
    }
    if (lower.includes('airport')) {
      const pick = window.prompt('Airport gates: arte, tutorial, snow', 'arte');
      const def = pick ? INSTANCES[pick.trim().toLowerCase()] : undefined;
      if (def) this.spawnInstance(def);
      return;
    }
    const linked = instanceForPlace(label);
    if (linked) this.spawnInstance(linked);
  }

  private spawnInstance(def: InstanceDef): void {
    if (!this.inside) return;
    this.inside.noPk = def.noPk;
    this.inside.title = def.title;
    this.instanceReward = def.reward > 0 || def.coin ? def : null;
    this.instanceLeft = 0;
    const ox = this.inside.ox / TILE;
    const oy = this.inside.oy / TILE;
    let n = 0;
    def.waves.forEach((wave, wi) => {
      for (let i = 0; i < wave.count; i++) {
        n += 1;
        const boss = wave.hp >= 180;
        const bot: BotDef = {
          id: `${boss ? 'inst_boss' : 'inst'}_${def.id}_${n}`,
          kind: wave.kind,
          name: wave.name,
          x: ox + 14 + (i % 5) * 6,
          y: oy + 18 + wi * 8,
          hp: wave.hp,
          speed: boss ? 60 : 50,
          damage: wave.damage,
          aggro: def.noPk ? 0 : 320,
          respawnMs: 999999,
          loot: wave.loot,
          tint: wave.tint,
        };
        this.createBotSprite(bot);
        this.instanceLeft += 1;
      }
    });
    this.pushChat(def.blurb);
  }

  private finishInstance(): void {
    const def = this.instanceReward;
    this.instanceReward = null;
    this.instanceLeft = 0;
    if (!def) return;
    if (def.reward > 0) this.state.gralats += def.reward;
    if (def.coin === 'sea') this.state.seaCoins += 1;
    if (def.coin === 'plasma') this.state.plasmaCoins += 1;
    if (def.coin === 'gang') this.state.gangCoins += 1;
    if (def.coin === 'event') addItem(this.state, 'event_coin', 1);
    const ready = noteActivity(this.state, def.id === 'sea' ? 'sea' : def.id === 'plasma' ? 'plasma' : 'kills', 0);
    void ready;
    if (def.id === 'sea') noteActivity(this.state, 'sea');
    if (def.id === 'plasma') noteActivity(this.state, 'plasma');
    unlockAchievement(this.state, `visit-${def.id}`, `Cleared ${def.title}`);
    this.pushChat(`${def.title} clear.${def.reward ? ` +${def.reward}g.` : ''}${def.coin ? ` +1 ${def.coin} coin.` : ''}`);
    playSfx(this, 'levelup');
    saveGame(this.state);
  }

  private leaveInterior(): void {
    if (!this.inside) return;
    const backX = this.inside.returnX;
    const backY = this.inside.returnY;
    const title = this.inside.title;
    for (const obj of this.inside.objects) obj.destroy();
    this.bots.getChildren().forEach((obj) => {
      const bot = obj as BotSprite;
      if (bot.bot.id.startsWith('inst')) bot.destroy();
    });
    this.instanceLeft = 0;
    this.instanceReward = null;
    this.inside = null;
    this.physics.world.setBounds(0, 0, MAP_W * TILE, INTERIOR_ORIGIN_Y + 64 * TILE);
    this.player.setPosition(backX, backY);
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    playSfx(this, 'ui');
    this.pushChat(`Left ${title}. Back on the city map.`);
    this.levelSeen = '';
  }

  private useNearestWarp(): void {
    this.tryWarpPad();
  }

  private tryWarpPad(): boolean {
    for (const pad of this.world.warpPads) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, pad.x * TILE, pad.y * TILE);
      if (d < 40) {
        this.player.setPosition(pad.toX * TILE, pad.toY * TILE);
        playSfx(this, 'dash');
        this.pushChat(`Warped: ${pad.label}`);
        const ach = unlockAchievement(this.state, 'bridge-hopper', 'Island Hopper');
        if (ach) this.pushChat(ach);
        return true;
      }
    }
    return false;
  }

  private shellShopMenu(): void {
    playSfx(this, 'ui');
    const shellSummary = SHELLS.map((s) => {
      const count = this.state.inventory.find((i) => i.id === s.id)?.count ?? 0;
      return `${s.name} x${count} (${s.sellPrice}g)`;
    }).join('\n');
    const choice = window.prompt(
      `SHELL SHACK — ${this.state.gralats}g\nShovels owned: ${this.state.shovelCount} spare · equipped uses: ${this.state.shovelUses}/${SHOVEL_MAX_USES}\nDigging equipped: ${this.state.diggingEquipped ? 'YES' : 'NO'}\n\nYour shells:\n${shellSummary}\n\nType: buy / equip / sell / sellall`,
      this.state.shovelUses > 0 || this.state.shovelCount > 0 ? 'equip' : 'buy',
    );
    if (!choice) return;
    const cmd = choice.trim().toLowerCase();

    if (cmd === 'buy') {
      const qtyRaw = window.prompt('How many shovels? (50g each, recommended 5–10)', '5');
      const qty = Math.max(1, Math.min(20, Number(qtyRaw) || 1));
      const cost = qty * SHOVEL_COST;
      if (this.state.gralats < cost) {
        this.pushChat(`Need ${cost}g for ${qty} shovels.`);
        return;
      }
      this.state.gralats -= cost;
      this.state.shovelCount += qty;
      playSfx(this, 'coin');
      this.pushChat(`Bought ${qty} shovel(s). Spare: ${this.state.shovelCount}. Type equip to dig.`);
      return;
    }

    if (cmd === 'equip') {
      if (this.state.shovelUses <= 0) {
        if (this.state.shovelCount <= 0) {
          this.pushChat('No shovels. Buy some for 50g each.');
          return;
        }
        this.state.shovelCount -= 1;
        this.state.shovelUses = SHOVEL_MAX_USES;
      }
      this.state.diggingEquipped = true;
      playSfx(this, 'ui');
      this.pushChat(`Shovel equipped (${this.state.shovelUses} digs left). Dig on beach sand with E.`);
      return;
    }

    if (cmd === 'sell' || cmd === 'sellall') {
      this.sellShells(cmd === 'sellall' ? null : undefined);
      return;
    }

    this.pushChat('Commands: buy, equip, sell, sellall');
  }

  private sellShells(forceAll: null | undefined): void {
    if (forceAll === null) {
      let earned = 0;
      let sold = 0;
      for (const shell of SHELLS) {
        const item = this.state.inventory.find((i) => i.id === shell.id);
        if (!item || item.count <= 0) continue;
        earned += item.count * shell.sellPrice;
        sold += item.count;
        item.count = 0;
      }
      if (!sold) {
        this.pushChat('No beach shells to sell.');
        return;
      }
      this.state.gralats += earned;
      playSfx(this, 'coin');
      this.pushChat(`Sold ${sold} shells for ${earned}g.`);
      grantJobXp(this.state, 'digging', Math.min(40, sold * 2));
      return;
    }

    const id = window.prompt(
      `Sell which shell?\n${SHELLS.map((s) => s.id).join(', ')}`,
      'trochus',
    );
    if (!id) return;
    const def = SHELLS.find((s) => s.id === id.trim().toLowerCase());
    if (!def) {
      this.pushChat('Unknown shell.');
      return;
    }
    const item = this.state.inventory.find((i) => i.id === def.id);
    if (!item || item.count <= 0) {
      this.pushChat(`No ${def.name}.`);
      return;
    }
    const qtyRaw = window.prompt(`Sell how many ${def.name}? (have ${item.count})`, String(item.count));
    const qty = Math.max(1, Math.min(item.count, Number(qtyRaw) || 1));
    item.count -= qty;
    const earned = qty * def.sellPrice;
    this.state.gralats += earned;
    playSfx(this, 'coin');
    this.pushChat(`Sold ${qty} ${def.name} for ${earned}g.`);
    grantJobXp(this.state, 'digging', qty * 2);
  }

  private crabShackMenu(): void {
    playSfx(this, 'ui');
    const ids = [
      'crab_shell_black',
      'crab_shell_blue',
      'crab_shell_green',
      'crab_shell_red',
      'crab_shell_yellow',
    ];
    let earned = 0;
    let sold = 0;
    for (const id of ids) {
      const item = this.state.inventory.find((i) => i.id === id);
      if (!item || item.count <= 0) continue;
      const def = shellById(id);
      const price = def && 'sellPrice' in def ? def.sellPrice : 6;
      earned += item.count * price;
      sold += item.count;
      item.count = 0;
    }
    if (!sold) {
      this.pushChat('No crab shells. Dig up crabs on the beach and kill them.');
      return;
    }
    this.state.gralats += earned;
    playSfx(this, 'coin');
    this.pushChat(`Wandi bought ${sold} crab shells for ${earned}g.`);
    grantJobXp(this.state, 'digging', sold * 3);
  }

  private digBeach(): void {
    const time = this.time.now;
    if (time < this.digReady) return;
    this.digReady = time + DIG_COOLDOWN_MS;

    if (!this.state.diggingEquipped || this.state.shovelUses <= 0) {
      if (this.state.shovelCount > 0) {
        this.pushChat('Equip a shovel at Isra/Bell Shell Shack first (E → equip).');
      } else {
        this.pushChat('Need a shovel (50g at Shell Shack).');
      }
      return;
    }

    if (this.inside) {
      this.pushChat('Dig only on Mercy Beach or Southridge Beach.');
      return;
    }
    const aim = DIR_VEC[this.dir];
    const cell = tileAt(this.world, this.player.x + aim.x * 14, this.player.y + aim.y * 14);
    const here = tileAt(this.world, this.player.x, this.player.y);
    const target = cell?.dig ? cell : here?.dig ? here : null;
    if (!target?.dig) {
      this.pushChat('Dig only on the sand masks of Mercy Beach and Southridge Beach.');
      return;
    }

    this.state.shovelUses -= 1;
    playSfx(this, 'job');

    // Dig grit visual
    const grit = this.add.circle(this.player.x, this.player.y + 10, 6, 0xd2b48c, 0.7).setDepth(900);
    this.tweens.add({ targets: grit, alpha: 0, y: grit.y + 8, duration: 280, onComplete: () => grit.destroy() });

    if (Math.random() < CRAB_DIG_CHANCE) {
      this.spawnDugCrab();
    } else {
      const shell = rollShell();
      const ox = (Math.random() - 0.5) * 28;
      const oy = 12 + Math.random() * 16;
      this.spawnShellPickup(this.player.x + ox, this.player.y + oy, shell.id, shell.tint, true);
      this.pushChat(`Dug up ${shell.name}! (${shell.sellPrice}g at shack)`);
      if (shell.id === 'trochus') {
        unlockAchievement(this.state, 'first-trochus', 'First Trochus');
      }
    }

    const digReady = noteActivity(this.state, 'dig');
    if (digReady) this.pushChat(digReady);
    const leveled = grantJobXp(this.state, 'digging', 5);
    if (leveled) {
      playSfx(this, 'levelup');
      this.pushChat(leveled);
    }

    if (this.state.shovelUses <= 0) {
      if (this.state.shovelCount > 0) {
        this.state.shovelCount -= 1;
        this.state.shovelUses = SHOVEL_MAX_USES;
        this.pushChat(`Shovel broke! Auto-equipped spare (${this.state.shovelCount} left, ${this.state.shovelUses} uses).`);
      } else {
        this.state.diggingEquipped = false;
        this.pushChat('Shovel broke! Buy more at the Shell Shack.');
        playSfx(this, 'hurt');
      }
    }
  }

  private spawnShellPickup(x: number, y: number, shellId: string, tint: number, claimed: boolean): void {
    const drop = this.shellDrops.create(x, y, 'shell') as Phaser.Physics.Arcade.Sprite;
    drop.setTint(tint);
    drop.setDepth(y);
    drop.setData('shellId', shellId);
    drop.setData('claimUntil', claimed ? this.time.now + SHELL_CLAIM_MS : 0);
    drop.setData('owner', this.state.profile.name);
    this.digSerial += 1;
    // Soft despawn so the beach doesn't fill forever
    this.time.delayedCall(45000, () => {
      if (drop.active) drop.destroy();
    });
  }

  private collectShellDrop(drop: Phaser.Physics.Arcade.Sprite): void {
    const claimUntil = (drop.getData('claimUntil') as number) || 0;
    const owner = drop.getData('owner') as string;
    if (claimUntil > this.time.now && owner && owner !== this.state.profile.name) {
      return; // someone else's fresh dig (future multiplayer)
    }
    const shellId = drop.getData('shellId') as string;
    const def = shellById(shellId);
    addItem(this.state, shellId, 1);
    playSfx(this, 'pickup');
    this.pushChat(`Picked up ${def?.name ?? shellId}`);
    drop.destroy();
  }

  private spawnDugCrab(): void {
    this.digSerial += 1;
    const bot: BotDef = {
      id: `dug_crab_${this.digSerial}`,
      kind: 'beach_crab',
      name: 'Dug Crab',
      x: this.player.x / TILE,
      y: this.player.y / TILE,
      hp: 18,
      speed: 70,
      damage: 3,
      aggro: 200,
      respawnMs: 999999,
      loot: 2,
      tint: 0xff6b4a,
    };
    const land = tileAt(this.world, this.player.x + 16, this.player.y);
    const spot = land?.dig ? { x: this.player.x + 16, y: this.player.y } : { x: this.player.x, y: this.player.y };
    if (!tileAt(this.world, spot.x, spot.y)?.dig) return;
    const spr = this.createBotSprite(bot);
    spr.setPosition(spot.x, spot.y);
    playSfx(this, 'hurt');
    this.pushChat('A crab burst from the sand! (3 dmg — kill it for a crab shell)');
  }

  private doRandomJob(): void {
    const jobs: JobId[] = ['trash', 'mushrooms', 'flowers', 'mining', 'fishing'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const item =
      job === 'trash' ? 'trash' : job === 'mushrooms' ? 'mushroom' : job === 'flowers' ? 'flower' : job === 'mining' ? 'ore' : 'fish';
    this.doJob(job, item, 6, 10);
  }

  private doJob(job: JobId, itemId: string, payMin: number, payMax: number): void {
    playSfx(this, 'job');
    this.payJob(job, itemId, payMin, payMax, true);
  }

  private payJob(job: JobId, itemId: string, payMin: number, payMax: number, grantItem: boolean): void {
    const pay = Phaser.Math.Between(payMin, payMax) + this.state.jobLevel[job];
    this.state.gralats += pay;
    if (grantItem) addItem(this.state, itemId, 1);
    const leveled = grantJobXp(this.state, job, 8);
    if (job === 'mining') addItem(this.state, 'rock', 1);
    const activity = jobActivity(job);
    if (activity) {
      const ready = noteActivity(this.state, activity);
      if (ready) this.pushChat(ready);
    }
    this.pushChat(`Job ${job}: +${pay}g${grantItem ? `, +1 ${itemId}` : ''}`);
    if (leveled) {
      playSfx(this, 'levelup');
      this.pushChat(leveled);
    }
    playSfx(this, 'coin', 0.3);
    saveGame(this.state);
  }

  private openWeaponShop(shop: WeaponDef['shop']): void {
    const list = weaponsByShop(shop).concat(shop === 'guns' ? weaponsByShop('grenades') : []);
    const owned = new Set(this.state.ownedWeapons);
    const forSale = list.filter((w) => !owned.has(w.id)).map((w) => `${w.id}(${w.cost},${w.effect})`);
    const choice = window.prompt(
      `${shop.toUpperCase()} SHOP — ${this.state.gralats}g\nOwned: ${this.state.ownedWeapons.join(', ')}\nBuy id OR equip owned id:\n${forSale.join(' | ') || 'sold out'}`,
      this.state.weapon,
    );
    if (!choice) return;
    const id = choice.trim().toLowerCase();
    const def = WEAPONS[id];
    if (!def) {
      this.pushChat('Unknown weapon id.');
      return;
    }
    if (!owned.has(id)) {
      if (this.state.gralats < def.cost) {
        this.pushChat('Not enough gralats.');
        return;
      }
      this.state.gralats -= def.cost;
      this.state.ownedWeapons.push(id);
      if (def.kind === 'throwable') addItem(this.state, id, 3);
      playSfx(this, 'coin');
      this.pushChat(`Bought ${def.name} [${EFFECT_LABELS[def.effect]}]`);
    }
    this.cancelWeaponMotion();
    this.pushChat(equipWeapon(this.state, id));
    this.applyCustomization();
    saveGame(this.state);
    playSfx(this, 'ui');
  }

  private weaponBrowser(): void {
    playSfx(this, 'ui');
    const owned = this.state.ownedWeapons
      .map((id) => {
        const w = WEAPONS[id];
        return w ? `${w.id}: ${w.name} (${w.effect})` : id;
      })
      .join('\n');
    const pick = window.prompt(`Owned weapons (equip by id):\n${owned}`, this.state.weapon);
    if (!pick) return;
    this.cancelWeaponMotion();
    this.pushChat(equipWeapon(this.state, pick.trim().toLowerCase()));
    this.applyCustomization();
    saveGame(this.state);
  }

  private cycleOwnedWeapon(): void {
    const list = this.state.ownedWeapons;
    const idx = list.indexOf(this.state.weapon);
    const next = list[(idx + 1) % list.length];
    this.cancelWeaponMotion();
    this.pushChat(equipWeapon(this.state, next));
    this.applyCustomization();
    playSfx(this, 'ui');
  }

  private botBoard(): void {
    playSfx(this, 'ui');
    const counts: Record<string, number> = {};
    this.bots.getChildren().forEach((obj) => {
      const b = obj as BotSprite;
      counts[b.bot.kind] = (counts[b.bot.kind] ?? 0) + 1;
    });
    this.pushChat(`Bots: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }

  private toggleVehicle(): void {
    playSfx(this, 'ui');
    if (this.state.activeCar || this.state.activeMount) {
      this.state.activeCar = null;
      this.state.activeMount = null;
      this.pushChat('Dismounted.');
      return;
    }
    if (this.state.ownedCars.length) {
      this.state.activeCar = this.state.ownedCars[0];
      this.pushChat(`Driving ${this.state.activeCar} (no combat while riding).`);
    } else if (this.state.ownedMounts.length) {
      this.state.activeMount = this.state.ownedMounts[0];
      this.pushChat(`Mounted ${this.state.activeMount}.`);
    } else {
      this.pushChat('Buy a car from Rico Motors (west plaza) or unlock a mount.');
    }
  }

  private buyCar(): void {
    const choice = window.prompt('Cars: coupe(800), sedan(1200), skateboard(300), sports(2500)', 'coupe');
    if (!choice) return;
    const prices: Record<string, number> = { coupe: 800, sedan: 1200, skateboard: 300, sports: 2500 };
    const id = choice.trim().toLowerCase();
    const cost = prices[id];
    if (!cost) {
      this.pushChat('Unknown vehicle.');
      return;
    }
    if (this.state.ownedCars.includes(id)) {
      this.state.activeCar = id;
      this.pushChat(`Equipped ${id}`);
      return;
    }
    if (this.state.gralats < cost) {
      this.pushChat('Need more gralats.');
      return;
    }
    this.state.gralats -= cost;
    this.state.ownedCars.push(id);
    this.state.activeCar = id;
    playSfx(this, 'coin');
    this.pushChat(`Purchased ${id}`);
  }

  private fashionShop(role: string): void {
    if (role === 'shop_hats') {
      const hat = window.prompt(`Hats owned: ${this.state.ownedHats.join(', ')}\nBuy/equip: cap, beanie, crown, fedora(400), helmet(600)`, 'fedora');
      if (!hat) return;
      const id = hat.trim().toLowerCase();
      if (!this.state.ownedHats.includes(id)) {
        const cost = id === 'fedora' ? 400 : id === 'helmet' ? 600 : 200;
        if (this.state.gralats < cost) return void this.pushChat('Need more gralats.');
        this.state.gralats -= cost;
        this.state.ownedHats.push(id);
      }
      this.state.equippedHat = id;
      this.state.profile.hat = this.state.ownedHats.indexOf(id);
      playSfx(this, 'coin');
      this.pushChat(`Hat: ${id}`);
      this.applyCustomization();
      saveGame(this.state);
      return;
    }
    const outfit = window.prompt(`Outfits: ${this.state.ownedOutfits.join(', ')}\nBuy/equip street, formal, sport(350), tuxedo(700)`, 'sport');
    if (!outfit) return;
    const id = outfit.trim().toLowerCase();
    if (!this.state.ownedOutfits.includes(id)) {
      const cost = id === 'tuxedo' ? 700 : 350;
      if (this.state.gralats < cost) return void this.pushChat('Need more gralats.');
      this.state.gralats -= cost;
      this.state.ownedOutfits.push(id);
    }
    this.state.profile.shirt = (this.state.profile.shirt + 1) % 6;
    this.applyCustomization();
    playSfx(this, 'ui');
    this.pushChat(`Outfit: ${id}`);
  }

  private cycleMorph(): void {
    const morphs = ['none', 'cat', 'robot', 'ghost', 'slime'];
    for (const m of morphs) {
      if (!this.state.ownedMorphs.includes(m) && m !== 'none') {
        // unlock cheap demo morphs as you cycle once bought
      }
    }
    const locked = morphs.filter((m) => m !== 'none' && !this.state.ownedMorphs.includes(m));
    if (locked.length && this.state.gralats >= 200) {
      const m = locked[0];
      this.state.gralats -= 200;
      this.state.ownedMorphs.push(m);
      this.pushChat(`Unlocked morph ${m}`);
    }
    const list = this.state.ownedMorphs;
    const idx = Math.max(0, list.indexOf(this.state.activeMorph ?? 'none'));
    const next = list[(idx + 1) % list.length];
    this.state.activeMorph = next === 'none' ? null : next;
    if (this.state.activeMorph) this.player.setTint(0xa0ffc8);
    else this.applyCustomization();
    playSfx(this, 'ui');
    this.pushChat(`Morph: ${this.state.activeMorph ?? 'none'}`);
  }

  private uploadSkin(): void {
    playSfx(this, 'ui');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        this.state.profile.customSkinDataUrl = dataUrl;
        if (this.textures.exists('custom-skin')) this.textures.remove('custom-skin');
        this.textures.addBase64('custom-skin', dataUrl);
        this.time.delayedCall(100, () => {
          if (this.textures.exists('custom-skin')) {
            this.player.setTexture('custom-skin');
            this.player.setDisplaySize(24, 32);
            this.pushChat('Custom skin applied (local upload).');
            playSfx(this, 'levelup');
          }
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private houseMenu(): void {
    playSfx(this, 'ui');
    if (!this.state.houseOwned) {
      if (!window.confirm('Buy house lot for 200g?')) return;
      if (this.state.gralats < 200) return void this.pushChat('Need 200g.');
      this.state.gralats -= 200;
      this.state.houseOwned = true;
      playSfx(this, 'coin');
      this.pushChat('House purchased.');
      return;
    }
    const item = window.prompt('Furniture: couch, lamp, rug, plant, arcade (40g)', 'couch');
    if (!item) return;
    if (this.state.gralats < 40) return void this.pushChat('Need 40g.');
    this.state.gralats -= 40;
    this.state.furniture.push(item.trim().toLowerCase());
    this.solids.create(this.player.x + 20, this.player.y, 'furniture');
    playSfx(this, 'pickup');
    this.pushChat(`Placed ${item}. Total ${this.state.furniture.length}`);
  }

  private jobDesk(): void {
    ensureChallenges(this.state);
    const choice = window.prompt(
      `JOB DESK — ${this.state.gralats}g\n${challengeLines(this.state).join('\n')}\nSea ${this.state.seaCoins} · Plasma ${this.state.plasmaCoins} · Gang ${this.state.gangCoins}\n\nclaim / reroll 1-3 / mine / slots / work`,
      'claim',
    );
    if (!choice) return;
    const cmd = choice.trim().toLowerCase();
    if (cmd === 'claim') {
      this.pushChat(claimChallenges(this.state));
      playSfx(this, 'coin');
      return;
    }
    if (cmd.startsWith('reroll')) {
      const index = Math.max(1, Math.min(3, Number(cmd.split(' ')[1]) || 1)) - 1;
      this.pushChat(rerollChallenge(this.state, index));
      return;
    }
    if (cmd === 'mine') {
      this.pushChat(feedMiningMachine(this.state));
      return;
    }
    if (cmd === 'slots') {
      this.pushChat(spinSlots(this.state));
      return;
    }
    this.doRandomJob();
  }

  private gangMenu(): void {
    playSfx(this, 'ui');
    if (!this.state.gangName) {
      const name = window.prompt('Create gang (2000g):', 'Neon Crew');
      if (!name) return;
      if (this.state.gralats < 2000) return void this.pushChat('Need 2000g.');
      this.state.gralats -= 2000;
      this.state.gangName = name.trim().slice(0, 18);
      this.state.gangRank = 'Leader';
      playSfx(this, 'levelup');
      this.pushChat(`Gang founded: ${this.state.gangName}`);
      return;
    }
    this.pushChat(`${this.state.gangName} · ${this.state.gangRank}`);
  }

  private openChat(): void {
    const msg = window.prompt('World chat', '');
    if (!msg) return;
    playSfx(this, 'chat');
    this.pushChat(`${this.state.profile.name}: ${msg}`);
  }

  private eatFood(): void {
    if (!consumeItem(this.state, 'food', 1)) return void this.pushChat('No food left.');
    if (!this.tryHeal(15)) return;
    playSfx(this, 'heal');
    this.pushChat('Ate snack (+15 HP).');
  }

  private spawnJobPickups(): void {
    // Keep flower/mushroom pickups out of Starter Area and beaches
    for (let i = 0; i < 24; i++) {
      const x = (8 + Math.random() * 50) * TILE;
      const y = (8 + Math.random() * 40) * TILE;
      const cell = tileAt(this.world, x, y);
      if (!cell || cell.tile === 'sand' || cell.zone === 'start_park' || cell.zone === 'mercy_beach') continue;
      const p = this.pickups.create(x, y, 'pickup') as Phaser.Physics.Arcade.Sprite;
      p.setData('kind', Math.random() > 0.5 ? 'mushroom' : 'flower');
    }
  }

  private collectPickup(item: Phaser.Physics.Arcade.Sprite): void {
    const kind = (item.getData('kind') as string) || 'mushroom';
    addItem(this.state, kind, 1);
    this.state.gralats += 3;
    playSfx(this, 'pickup');
    item.destroy();
  }

  private pushChat(line: string): void {
    this.state.chatLog.push(line);
    if (this.state.chatLog.length > 50) this.state.chatLog.shift();
    this.game.events.emit('era-chat', line);
  }
}
