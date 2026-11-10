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
  addItem,
  consumeItem,
  currentWeapon,
  equipWeapon,
  grantJobXp,
  unlockAchievement,
  type GameState,
  type JobId,
} from '../state';
import { createWorld, tileAt, type WorldData } from '../world';
import { playMusic, playSfx } from '../audio';

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
  private citizens!: Phaser.Physics.Arcade.Group;
  private npcSprites: { sprite: Phaser.Physics.Arcade.Image; def: NpcDef }[] = [];
  private nameTag!: Phaser.GameObjects.Text;
  private zoneText!: Phaser.GameObjects.Text;
  private interactHint!: Phaser.GameObjects.Text;
  private effectText!: Phaser.GameObjects.Text;
  private playerStatus = createStatus();

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
      const sprite = this.solids.create(obj.x + 16, obj.y + 16, obj.type) as Phaser.Physics.Arcade.Sprite;
      sprite.setDepth(obj.y);
      if (obj.type === 'tree') sprite.setSize(18, 16).setOffset(7, 28);
      if (obj.type === 'building' || obj.type === 'shop' || obj.type === 'house') {
        sprite.setSize(50, 36).setOffset(7, 24);
      }
    }

    this.player = this.physics.add.sprite(this.world.spawn.x, this.world.spawn.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1000);
    this.player.setSize(16, 12).setOffset(4, 18);
    this.applyCustomization();

    this.nameTag = this.add
      .text(this.player.x, this.player.y - 28, this.state.profile.name, {
        fontFamily: 'VT323, monospace',
        fontSize: '18px',
        color: '#e8f0ff',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1001);

    this.zoneText = this.add
      .text(12, 12, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '22px',
        color: '#f0c14b',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(3000);

    this.interactHint = this.add
      .text(this.scale.width / 2, this.scale.height - 28, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '20px',
        color: '#3ecf8e',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000);

    this.effectText = this.add
      .text(12, 172, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '18px',
        color: '#ffb4a0',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(3000);

    this.spawnNpcs();
    this.spawnCitizens();
    this.bots = this.physics.add.group();
    this.spawnBots();
    this.bullets = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.spawnJobPickups();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.bots, this.solids);
    this.physics.add.collider(this.citizens, this.solids);
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => this.collectPickup(item as Phaser.Physics.Arcade.Sprite));
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

    playMusic(this, 'theme_city', 0.26);
    this.game.events.emit('era-state', this.state);
    this.pushChat(`District online: ${CITY_NPCS.length} NPCs, ${AMBIENT_CITIZEN_SPOTS.length} citizens, ${createCityBots().length} bots.`);
    this.pushChat('Shops: guns, melee, exotic. Try effects on spar bots / dummies.');
  }

  update(time: number, delta: number): void {
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

    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (cell) {
      const pk = cell.noPk ? 'NO-PK' : 'PK';
      this.zoneText.setText(`${cell.zone.toUpperCase()}  [${pk}]`);
    }
    this.interactHint.setText(this.nearInteractLabel());
    const wpn = currentWeapon(this.state);
    this.effectText.setText(
      `${wpn.name} | ${EFFECT_LABELS[wpn.effect]} | ${wpn.abilityLabel}${this.state.altHealMode ? ' [HEAL MODE]' : ''}`,
    );
    this.game.events.emit('era-state', this.state);
  }

  private spawnNpcs(): void {
    this.npcSprites = [];
    for (const npc of CITY_NPCS) {
      const sprite = this.physics.add.staticImage(npc.x * TILE, npc.y * TILE, 'npc');
      if (npc.tint) sprite.setTint(npc.tint);
      sprite.setDepth(npc.y * TILE);
      this.add
        .text(npc.x * TILE, npc.y * TILE - 26, npc.name, {
          fontFamily: 'VT323, monospace',
          fontSize: '16px',
          color: '#f0c14b',
          stroke: '#000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(npc.y * TILE + 1);
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
          fontFamily: 'VT323, monospace',
          fontSize: '14px',
          color: '#cfe0ff',
          stroke: '#000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(c.y * TILE + 1)
        .setName(`citizen_label_${c.name}`);
    }
  }

  private spawnBots(): void {
    for (const bot of createCityBots()) {
      this.createBotSprite(bot);
    }
  }

  private createBotSprite(bot: BotDef): BotSprite {
    const key = bot.kind === 'beach_crab' ? 'rock' : bot.kind === 'training_dummy' ? 'crate' : 'enemy';
    const spr = this.bots.create(bot.x * TILE, bot.y * TILE, key) as BotSprite;
    spr.bot = bot;
    spr.hp = bot.hp;
    spr.status = createStatus();
    spr.deadUntil = 0;
    spr.setDepth(bot.y * TILE);
    if (bot.tint) spr.setTint(bot.tint);
    if (key === 'enemy') spr.setSize(16, 12).setOffset(4, 18);
    spr.setData('label', bot.name);
    return spr;
  }

  private drawTiles(): void {
    const keyFor = {
      grass: 'tile-grass',
      path: 'tile-path',
      road: 'tile-road',
      sidewalk: 'tile-sidewalk',
      water: 'tile-water',
      sand: 'tile-sand',
      pk: 'tile-pk',
      safe: 'tile-safe',
      spar: 'tile-spar',
      gang: 'tile-gang',
    } as const;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const cell = this.world.cells[y][x];
        this.add.image(x * TILE + 16, y * TILE + 16, keyFor[cell.tile]).setDepth(0);
      }
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
    enemy.deadUntil = time + enemy.bot.respawnMs;
    this.state.kills += 1;
    this.state.gralats += enemy.bot.loot;
    playSfx(this, 'coin');
    this.pushChat(`${enemy.bot.name} down (+${enemy.bot.loot}g). Kills ${this.state.kills}`);
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
    this.pushChat('Knocked out — respawned in the plaza.');
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
    if (cell.zone === 'beach') return 'E — dig · crabs nearby';
    if (cell.zone === 'jobs') return 'E — city job';
    if (cell.zone === 'spar') return 'Fight spar bots · Q ability';
    if (cell.zone === 'gangbase') return 'G gang · enforcers patrol';
    return 'E talk · TAB weapons · 2 cycle · B bots · V ride · U skin';
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
      else if (npc.role === 'job') this.doRandomJob();
      else if (npc.role === 'pizza') this.doJob('pizza', 'pizza', 10, 15);
      else if (npc.role === 'mail') this.doJob('mail', 'mail', 9, 14);
      else if (npc.role === 'gang') this.gangMenu();
      return;
    }
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return;
    if (cell.zone === 'beach') this.doJob('digging', 'shell', 8, 12);
    else if (cell.zone === 'jobs') this.doRandomJob();
    else if (cell.zone === 'house') this.houseMenu();
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
    for (let i = 0; i < 24; i++) {
      const x = (8 + Math.random() * 50) * TILE;
      const y = (8 + Math.random() * 40) * TILE;
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
