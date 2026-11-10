import Phaser from 'phaser';
import {
  DASH_COOLDOWN_MS,
  DASH_MS,
  DASH_SPEED,
  DIR_VEC,
  MAP_H,
  MAP_W,
  PLAYER_SPEED,
  TILE,
  type Dir,
} from '../config';
import {
  EFFECT_LABELS,
  applyOnHitToStatus,
  createStatus,
  moveSpeedMultiplier,
  tickStatusDamage,
  weaponDamage,
  type StatusState,
} from '../combat';
import { WEAPONS, weaponsByShop, type WeaponDef } from '../content/weapons';
import { AMBIENT_CITIZEN_SPOTS, CITY_NPCS, createCityBots, type BotDef, type NpcDef } from '../content/npcs';
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
import { createWorld, districtNameAt, tileAt, type WorldData } from '../world';
import { playMusic, playSfx } from '../audio';
import { DISTRICTS } from '../content/districts';

interface BotSprite extends Phaser.Physics.Arcade.Sprite {
  bot: BotDef;
  hp: number;
  status: StatusState;
  deadUntil: number;
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
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private shellDrops!: Phaser.Physics.Arcade.Group;
  private citizens!: Phaser.Physics.Arcade.Group;
  private npcSprites: { sprite: Phaser.Physics.Arcade.Image; def: NpcDef }[] = [];
  private nameTag!: Phaser.GameObjects.Text;
  private playerStatus = createStatus();
  private digReady = 0;
  private digSerial = 0;
  private hudTick = 0;

  constructor() {
    super('world');
  }

  init(data: { state: GameState }): void {
    this.state = data.state;
  }

  create(): void {
    this.world = createWorld();
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.drawTiles();

    this.solids = this.physics.add.staticGroup();
    for (const obj of this.world.objects) {
      // Decor only for trees/rocks/crates — collide with buildings/shops/houses
      if (obj.type === 'tree' || obj.type === 'rock' || obj.type === 'crate' || obj.type === 'furniture') {
        this.add.image(obj.x + 16, obj.y + 16, obj.type).setDepth(obj.y);
        continue;
      }
      const sprite = this.solids.create(obj.x + 16, obj.y + 16, obj.type) as Phaser.Physics.Arcade.Sprite;
      sprite.setDepth(obj.y);
      sprite.setSize(50, 36).setOffset(7, 24);
    }

    this.player = this.physics.add.sprite(this.world.spawn.x, this.world.spawn.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1000);
    this.player.setSize(16, 12).setOffset(4, 18);
    this.applyCustomization();

    this.nameTag = this.add
      .text(this.player.x, this.player.y - 28, this.state.profile.name, {
        fontFamily: 'Sora, sans-serif',
        fontSize: '13px',
        fontStyle: '600',
        color: '#eef4ff',
        stroke: '#071018',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setResolution(2);

    this.spawnNpcs();
    this.spawnCitizens();
    this.bots = this.physics.add.group();
    this.spawnBots();
    this.bullets = this.physics.add.group();
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

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(1.1);

    if (!this.input.keyboard) throw new Error('Keyboard required');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys(
      'W,A,S,D,E,Q,SHIFT,SPACE,ONE,TWO,C,I,H,G,M,B,V,R,U,TAB',
    ) as Record<string, Phaser.Input.Keyboard.Key>;

    this.drawDistrictLabels();
    this.drawWarpPads();

    playMusic(this, 'theme_city', 0.26);
    this.game.events.emit('era-state', this.state);
    this.pushChat(`Spawned at Starter Area · ${DISTRICTS.length} districts · ${MAP_W}x${MAP_H} tiles.`);
    this.pushChat(`${CITY_NPCS.length} NPCs · ${AMBIENT_CITIZEN_SPOTS.length} citizens · ${createCityBots().length} bots.`);
    this.pushChat('Mercy Beach is southwest for digging. Bridge/subway leads to Southridge.');
  }

  update(time: number, delta = 16): void {
    if (!this.player?.active) return;
    const dt = delta / 1000;
    this.handleMovement(time);
    this.handleCombat(time);
    this.handleHotkeys();
    this.updateBots(time, dt);
    this.updateCitizens(time);
    this.tickPlayerStatus(time, dt);
    this.nameTag.setPosition(this.player.x, this.player.y - 28);
    this.player.setDepth(this.player.y);

    this.hudTick += delta;
    if (this.hudTick >= 100) {
      this.hudTick = 0;
      const cell = tileAt(this.world, this.player.x, this.player.y);
      if (cell) {
        const pk = cell.noPk ? 'NO-PK' : 'PK';
        const place = districtNameAt(this.world, this.player.x, this.player.y);
        this.game.events.emit('era-region', `${cell.region} · ${place} · ${pk}`);
      }
      this.game.events.emit('era-hint', this.nearInteractLabel());
      this.game.events.emit('era-state', this.state);
    }
  }

  private spawnNpcs(): void {
    this.npcSprites = [];
    for (const npc of CITY_NPCS) {
      const sprite = this.physics.add.staticImage(npc.x * TILE, npc.y * TILE, 'npc');
      if (npc.tint) sprite.setTint(npc.tint);
      sprite.setDepth(npc.y * TILE);
      this.add
        .text(npc.x * TILE, npc.y * TILE - 26, npc.name, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '11px',
          fontStyle: '600',
          color: '#f0c14b',
          stroke: '#071018',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(npc.y * TILE + 1)
        .setResolution(2);
      this.npcSprites.push({ sprite, def: npc });
    }
  }

  private spawnCitizens(): void {
    this.citizens = this.physics.add.group();
    for (const c of AMBIENT_CITIZEN_SPOTS) {
      const spr = this.citizens.create(c.x * TILE, c.y * TILE, 'npc') as CitizenSprite;
      spr.homeX = c.x * TILE;
      spr.homeY = c.y * TILE;
      spr.wanderAt = 0;
      spr.setTint(Phaser.Display.Color.GetColor(120 + ((c.x * 17) % 100), 140 + ((c.y * 13) % 80), 160));
      spr.setDepth(c.y * TILE);
      spr.setSize(16, 12).setOffset(4, 18);
      this.add
        .text(c.x * TILE, c.y * TILE - 22, c.name, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '10px',
          fontStyle: '500',
          color: '#cfe0ff',
          stroke: '#071018',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(c.y * TILE + 1)
        .setResolution(2)
        .setName(`citizen_label_${c.name}`);
    }
  }

  private spawnBots(): void {
    for (const bot of createCityBots()) {
      this.createBotSprite(bot);
    }
  }

  private createBotSprite(bot: BotDef): BotSprite {
    const key =
      bot.kind === 'beach_crab' ? 'crab' : bot.kind === 'training_dummy' ? 'crate' : 'enemy';
    const spr = this.bots.create(bot.x * TILE, bot.y * TILE, key) as BotSprite;
    spr.bot = bot;
    spr.hp = bot.hp;
    spr.status = createStatus();
    spr.deadUntil = 0;
    spr.setDepth(bot.y * TILE);
    if (bot.tint) spr.setTint(bot.tint);
    if (key === 'enemy' || key === 'crab') spr.setSize(16, 12).setOffset(4, 6);
    spr.setData('label', bot.name);
    return spr;
  }

  private drawTiles(): void {
    // Fast span-filled ground (avoids 30k+ texture stamps that freeze the tab)
    const colors: Record<string, number> = {
      grass: 0x3f7a45,
      path: 0x8a7a5c,
      road: 0x4a4f58,
      sidewalk: 0x6b7280,
      water: 0x2a6f9e,
      sand: 0xd2b48c,
      pk: 0x4a2030,
      safe: 0x2a4a3a,
      spar: 0x3a2a55,
      gang: 0x553020,
      snow: 0xdce8f5,
      bridge: 0x6b5a45,
      mine: 0x3a3a42,
    };
    const g = this.add.graphics().setDepth(0);
    for (let y = 0; y < MAP_H; y++) {
      let x = 0;
      while (x < MAP_W) {
        const tile = this.world.cells[y][x].tile;
        let x2 = x + 1;
        while (x2 < MAP_W && this.world.cells[y][x2].tile === tile) x2 += 1;
        g.fillStyle(colors[tile] ?? 0x3f7a45, 1);
        g.fillRect(x * TILE, y * TILE, (x2 - x) * TILE, TILE);
        x = x2;
      }
    }
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

  private applyCustomization(): void {
    if (this.state.profile.customSkinDataUrl && this.textures.exists('custom-skin')) {
      this.player.setTexture('custom-skin');
      return;
    }
    const tint =
      0x100000 * (8 + this.state.profile.shirt) +
      0x001000 * (8 + this.state.profile.pants) +
      0x000010 * (8 + this.state.profile.hair);
    this.player.setTint(tint);
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

    if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) && time > this.dashReady) {
      this.dashingUntil = time + DASH_MS;
      this.dashReady = time + DASH_COOLDOWN_MS;
      playSfx(this, 'dash', 0.35);
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

    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (cell?.blocked) {
      body.setVelocity(0, 0);
      this.player.x -= vx * 4;
      this.player.y -= vy * 4;
    }
  }

  private handleCombat(time: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.useWeaponAbility(time);
      return;
    }
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
      this.doGun(weapon);
    } else if (weapon.kind === 'throwable') {
      this.doThrowable(weapon, time);
    }
  }

  private doMelee(weapon: WeaponDef, time: number): void {
    playSfx(this, 'swing', 0.4);
    const v = DIR_VEC[this.dir];
    const slash = this.add.image(this.player.x + v.x * 28, this.player.y + v.y * 28, 'slash');
    slash.setDepth(this.player.depth + 1);
    slash.setRotation(Math.atan2(v.y, v.x));
    this.tweens.add({ targets: slash, alpha: 0, duration: 140, onComplete: () => slash.destroy() });

    if (weapon.effect === 'heal' || (weapon.ability === 'alt_heal' && this.state.altHealMode)) {
      const heal = weapon.healAmount ?? weapon.effectPower;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
      playSfx(this, 'heal');
      this.pushChat(`Healed +${heal}`);
    }

    this.bots.getChildren().forEach((obj) => {
      const enemy = obj as BotSprite;
      if (!enemy.active || enemy.hp <= 0) return;
      const dist = Phaser.Math.Distance.Between(slash.x, slash.y, enemy.x, enemy.y);
      if (dist <= weapon.range) this.damageBot(enemy, weapon, time);
    });
  }

  private doGun(weapon: WeaponDef): void {
    if (weapon.ammo !== 'none') {
      if (this.state.clipLeft <= 0) {
        const pool = this.state.ammo[weapon.ammo];
        if (pool <= 0) {
          this.pushChat('Out of ammo.');
          playSfx(this, 'ui');
          return;
        }
        const reload = Math.min(weapon.clip ?? 12, pool);
        this.state.ammo[weapon.ammo] -= reload;
        this.state.clipLeft = reload;
        this.pushChat(`Reloaded ${reload} ${weapon.ammo}.`);
      }
      this.state.clipLeft -= 1;
    }

    if (weapon.ability === 'alt_heal' && this.state.altHealMode) {
      const heal = weapon.healAmount ?? 4;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
      playSfx(this, 'heal');
      this.pushChat(`Heal mode +${heal}`);
      return;
    }

    playSfx(this, 'shoot', 0.35);
    const pellets = weapon.pellets ?? 1;
    const spread = weapon.spread ?? 0;
    const base = Math.atan2(DIR_VEC[this.dir].y, DIR_VEC[this.dir].x);
    for (let i = 0; i < pellets; i++) {
      const angle = base + (pellets === 1 ? 0 : -spread + (spread * 2 * i) / Math.max(1, pellets - 1));
      const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Sprite;
      bullet.setDepth(2000);
      bullet.setData('weaponId', weapon.id);
      bullet.setData('damage', weaponDamage(weapon, this.state.clipLeft + 1));
      this.physics.velocityFromRotation(angle, 420, bullet.body!.velocity);
      this.time.delayedCall(800, () => bullet.destroy());
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
          this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
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

  private damageBot(enemy: BotSprite, weapon: WeaponDef, time: number): void {
    if (enemy.bot.kind === 'training_dummy') {
      // still apply visuals/effects for testing
    }
    let dmg = weaponDamage(weapon, this.state.clipLeft);
    if (weapon.kind === 'throwable') dmg = weapon.damage;

    const hit = applyOnHitToStatus(enemy.status, weapon.effect, weapon.effectPower, time);
    if (hit.healAttacker > 0 || weapon.effect === 'lifesteal') {
      const heal = hit.healAttacker || weapon.effectPower;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
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
          enemy.setPosition(enemy.bot.x * TILE, enemy.bot.y * TILE);
          enemy.setActive(true).setVisible(true);
          (enemy.body as Phaser.Physics.Arcade.Body).enable = true;
        }
        return;
      }

      const statusDmg = tickStatusDamage(enemy.status, time, dt);
      if (statusDmg > 0) {
        enemy.hp -= statusDmg;
        if (enemy.hp <= 0) this.killBot(enemy, time);
      }

      const mul = moveSpeedMultiplier(enemy.status, time);
      enemy.setDepth(enemy.y);
      if (enemy.bot.speed <= 0 || mul === 0) {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        return;
      }
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < enemy.bot.aggro) {
        this.physics.moveToObject(enemy, this.player, enemy.bot.speed * mul);
      } else {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
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
    if (!enemy.active || enemy.hp <= 0 || enemy.bot.damage <= 0) return;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (cell?.noPk && enemy.bot.kind !== 'beach_crab') return;
    if (this.time.now < (this.player.getData('iframes') as number)) return;
    this.player.setData('iframes', this.time.now + 450);
    let dmg = enemy.bot.damage;
    if (this.time.now < this.state.shieldUntil) dmg *= 0.5;
    this.state.hp -= dmg;
    playSfx(this, 'hurt');
    this.cameras.main.shake(70, 0.003);
    if (this.state.hp <= 0) this.respawn();
  }

  private respawn(): void {
    this.state.hp = this.state.maxHp;
    this.player.setPosition(this.world.spawn.x, this.world.spawn.y);
    this.playerStatus = createStatus();
    this.pushChat('Knocked out — respawned at the Starter Area.');
  }

  private bulletHit(bullet: Phaser.Physics.Arcade.Sprite, enemy: BotSprite): void {
    const weaponId = bullet.getData('weaponId') as string;
    const weapon = WEAPONS[weaponId] ?? currentWeapon(this.state);
    bullet.destroy();
    if (!enemy.active) return;
    this.damageBot(enemy, weapon, this.time.now);
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) {
      if (this.sound.locked) this.sound.unlock();
      playMusic(this, 'theme_city', 0.26);
      playSfx(this, 'ui');
    }
  }

  private nearInteractLabel(): string {
    const npc = this.nearestNpc();
    if (npc) return `E — ${npc.name} (${npc.role})`;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return '';
    if (cell.tile === 'sand' || cell.zone === 'mercy_beach' || cell.zone === 'south_beach') {
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
    const npc = this.nearestNpc();
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
      else if (npc.role === 'job') this.doRandomJob();
      else if (npc.role === 'pizza') this.doJob('pizza', 'pizza', 10, 15);
      else if (npc.role === 'mail') this.doJob('mail', 'mail', 9, 14);
      else if (npc.role === 'gang') this.gangMenu();
      return;
    }

    // Warp pads without needing exact NPC overlap
    if (this.tryWarpPad()) return;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return;
    if (cell.tile === 'sand' || cell.zone === 'mercy_beach' || cell.zone === 'south_beach') this.digBeach();
    else if (cell.zone === 'south_mines' || cell.zone === 'gun_row') this.doRandomJob();
    else if (cell.zone === 'start_park' || cell.zone === 'downtown') {
      /* plaza - no default job */
    }
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

    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell || (cell.tile !== 'sand' && cell.zone !== 'mercy_beach' && cell.zone !== 'south_beach')) {
      this.pushChat('Dig on beach sand only (Mercy Beach or Southridge Beach).');
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
    const spr = this.createBotSprite(bot);
    spr.setPosition(this.player.x + 20, this.player.y);
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
    const pay = Phaser.Math.Between(payMin, payMax) + this.state.jobLevel[job];
    this.state.gralats += pay;
    addItem(this.state, itemId, 1);
    const leveled = grantJobXp(this.state, job, 8);
    this.pushChat(`Job ${job}: +${pay}g, +1 ${itemId}`);
    if (leveled) {
      playSfx(this, 'levelup');
      this.pushChat(leveled);
    }
    playSfx(this, 'coin', 0.3);
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
    this.pushChat(equipWeapon(this.state, id));
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
    this.pushChat(equipWeapon(this.state, pick.trim().toLowerCase()));
  }

  private cycleOwnedWeapon(): void {
    const list = this.state.ownedWeapons;
    const idx = list.indexOf(this.state.weapon);
    const next = list[(idx + 1) % list.length];
    this.pushChat(equipWeapon(this.state, next));
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

  private gangMenu(): void {
    playSfx(this, 'ui');
    if (!this.state.gangName) {
      const name = window.prompt('Create gang (50g):', 'Neon Crew');
      if (!name) return;
      if (this.state.gralats < 50) return void this.pushChat('Need 50g.');
      this.state.gralats -= 50;
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
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + 15);
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
