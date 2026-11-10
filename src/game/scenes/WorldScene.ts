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
  WEAPONS,
  addItem,
  consumeItem,
  grantJobXp,
  unlockAchievement,
  type GameState,
  type JobId,
  type WeaponId,
} from '../state';
import { createWorld, tileAt, type WorldData } from '../world';
import { playMusic, playSfx } from '../audio';

interface EnemyBody extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  speed: number;
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
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private nameTag!: Phaser.GameObjects.Text;
  private zoneText!: Phaser.GameObjects.Text;
  private interactHint!: Phaser.GameObjects.Text;

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
        fontSize: '22px',
        color: '#3ecf8e',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000);

    this.enemies = this.physics.add.group();
    for (const e of this.world.enemies) {
      const enemy = this.enemies.create(e.x, e.y, 'enemy') as EnemyBody;
      enemy.hp = 30;
      enemy.speed = 55 + Math.random() * 35;
      enemy.setSize(16, 12).setOffset(4, 18);
      enemy.setDepth(e.y);
    }

    this.bullets = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.spawnJobPickups();

    for (const npc of this.world.npcs) {
      const body = this.physics.add.staticImage(npc.x, npc.y, 'npc');
      body.setData('npc', npc);
      body.setDepth(npc.y);
      this.add
        .text(npc.x, npc.y - 26, npc.name, {
          fontFamily: 'VT323, monospace',
          fontSize: '16px',
          color: '#f0c14b',
          stroke: '#000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(npc.y + 1);
    }

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => this.collectPickup(item as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.bulletHit(b as Phaser.Physics.Arcade.Sprite, e as EnemyBody));
    this.physics.add.overlap(this.player, this.enemies, () => this.playerTouchedEnemy());

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.setZoom(1.15);

    if (!this.input.keyboard) throw new Error('Keyboard required');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SHIFT,SPACE,ONE,C,I,H,G,M') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    playMusic(this, 'theme_city', 0.26);
    this.game.events.emit('era-state', this.state);
    this.pushChat('You enter the downtown district.');
  }

  update(time: number): void {
    if (!this.player?.active) return;
    this.handleMovement(time);
    this.handleCombat(time);
    this.handleHotkeys();
    this.updateEnemyAI();
    this.nameTag.setPosition(this.player.x, this.player.y - 28);
    this.player.setDepth(this.player.y);
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (cell) {
      const pk = cell.noPk ? 'NO-PK' : 'PK';
      this.zoneText.setText(`${cell.zone.toUpperCase()}  [${pk}]`);
    }
    this.interactHint.setText(this.nearInteractLabel());
    this.game.events.emit('era-state', this.state);
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
      this.pushChat('Dash!');
    }

    const speed = time < this.dashingUntil ? DASH_SPEED : PLAYER_SPEED;
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
    if (!Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      return;
    }
    if (time < this.attackReady) return;
    const weapon = WEAPONS[this.state.weapon];
    this.attackReady = time + weapon.cooldown;
    const v = DIR_VEC[this.dir];

    if (weapon.kind === 'melee') {
      playSfx(this, 'swing', 0.4);
      const slash = this.add.image(this.player.x + v.x * 28, this.player.y + v.y * 28, 'slash');
      slash.setDepth(this.player.depth + 1);
      slash.setRotation(Math.atan2(v.y, v.x));
      this.tweens.add({
        targets: slash,
        alpha: 0,
        duration: 140,
        onComplete: () => slash.destroy(),
      });
      this.enemies.getChildren().forEach((obj) => {
        const enemy = obj as EnemyBody;
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(slash.x, slash.y, enemy.x, enemy.y);
        if (dist <= weapon.range) this.damageEnemy(enemy, weapon.damage);
      });
    } else {
      playSfx(this, 'shoot', 0.35);
      const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Sprite;
      bullet.setDepth(2000);
      bullet.setData('damage', weapon.damage);
      this.physics.velocityFromRotation(Math.atan2(v.y, v.x), 420, bullet.body!.velocity);
      this.time.delayedCall(700, () => bullet.destroy());
    }
  }

  private handleHotkeys(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.eatFood();
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.openChat();
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.game.events.emit('era-toggle', 'inventory');
    if (Phaser.Input.Keyboard.JustDown(this.keys.H)) this.houseMenu();
    if (Phaser.Input.Keyboard.JustDown(this.keys.G)) this.gangMenu();
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) {
      if (this.sound.locked) this.sound.unlock();
      playMusic(this, 'theme_city', 0.26);
      playSfx(this, 'ui');
    }
  }

  private nearInteractLabel(): string {
    const npc = this.nearestNpc();
    if (npc) return `E — talk to ${npc.name}`;
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return '';
    if (cell.zone === 'beach') return 'E — dig shells / fight crabs';
    if (cell.zone === 'jobs') return 'E — work a city job';
    if (cell.zone === 'house') return 'H — house menu · E — place furniture';
    if (cell.zone === 'spar') return 'SPACE — spar training bots';
    if (cell.zone === 'gangbase') return 'G — gang menu';
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.world.pizzaStation.x, this.world.pizzaStation.y) < 48) {
      return 'E — make pizzas';
    }
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.world.mailDrop.x, this.world.mailDrop.y) < 48) {
      return 'E — deliver mail';
    }
    return 'E interact · I inventory · C chat · G gang · H house';
  }

  private nearestNpc() {
    let best = null as (typeof this.world.npcs)[number] | null;
    let bestDist = 56;
    for (const npc of this.world.npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d < bestDist) {
        best = npc;
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
      if (npc.role === 'shop') this.openWeaponShop();
      return;
    }

    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (!cell) return;

    if (cell.zone === 'beach') {
      this.doJob('digging', 'shell', 8, 12);
      return;
    }
    if (cell.zone === 'jobs') {
      const jobs: JobId[] = ['trash', 'mushrooms', 'flowers', 'mining', 'fishing'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const item =
        job === 'trash'
          ? 'trash'
          : job === 'mushrooms'
            ? 'mushroom'
            : job === 'flowers'
              ? 'flower'
              : job === 'mining'
                ? 'ore'
                : 'fish';
      this.doJob(job, item, 6, 10);
      return;
    }
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.world.pizzaStation.x, this.world.pizzaStation.y) < 48) {
      this.doJob('pizza', 'pizza', 10, 15);
      return;
    }
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.world.mailDrop.x, this.world.mailDrop.y) < 48) {
      this.doJob('mail', 'mail', 9, 14);
      return;
    }
    if (cell.zone === 'house') {
      this.houseMenu();
    }
  }

  private doJob(job: JobId, itemId: string, payMin: number, payMax: number): void {
    playSfx(this, 'job');
    const pay = Phaser.Math.Between(payMin, payMax) + this.state.jobLevel[job];
    this.state.gralats += pay;
    addItem(this.state, itemId, 1);
    const leveled = grantJobXp(this.state, job, 8);
    this.pushChat(`Job ${job}: +${pay} gralats, +1 ${itemId}`);
    if (leveled) {
      playSfx(this, 'levelup');
      this.pushChat(leveled);
    }
    const ach = unlockAchievement(this.state, `job-${job}`, `Worked ${job}`);
    if (ach) this.pushChat(ach);
    playSfx(this, 'coin', 0.3);
  }

  private openWeaponShop(): void {
    const owned = new Set(this.state.ownedWeapons);
    const options = (Object.keys(WEAPONS) as WeaponId[])
      .filter((id) => !owned.has(id))
      .map((id) => `${id}:${WEAPONS[id].cost}`)
      .join(', ');
    const choice = window.prompt(
      `Weapon shop — you have ${this.state.gralats} gralats.\nOwned: ${this.state.ownedWeapons.join(', ')}\nBuy one of: ${options || 'none'}\nOr type owned id to equip.`,
      this.state.weapon,
    );
    if (!choice) return;
    const id = choice.trim().toLowerCase() as WeaponId;
    if (!(id in WEAPONS)) return;
    if (!owned.has(id)) {
      const cost = WEAPONS[id].cost;
      if (this.state.gralats < cost) {
        this.pushChat('Not enough gralats.');
        return;
      }
      this.state.gralats -= cost;
      this.state.ownedWeapons.push(id);
      playSfx(this, 'coin');
      this.pushChat(`Purchased ${WEAPONS[id].name}`);
    }
    this.state.weapon = id;
    playSfx(this, 'ui');
    this.pushChat(`Equipped ${WEAPONS[id].name} (${WEAPONS[id].ability})`);
  }

  private houseMenu(): void {
    playSfx(this, 'ui');
    if (!this.state.houseOwned) {
      const buy = window.confirm('Buy this house lot for 200 gralats?');
      if (!buy) return;
      if (this.state.gralats < 200) {
        this.pushChat('Need 200 gralats for a house.');
        return;
      }
      this.state.gralats -= 200;
      this.state.houseOwned = true;
      playSfx(this, 'coin');
      this.pushChat('House purchased! Press H to decorate.');
      unlockAchievement(this.state, 'homeowner', 'Homeowner');
      return;
    }
    const item = window.prompt('Place furniture (couch, lamp, rug, plant) — costs 40 gralats', 'couch');
    if (!item) return;
    if (this.state.gralats < 40) {
      this.pushChat('Need 40 gralats.');
      return;
    }
    this.state.gralats -= 40;
    this.state.furniture.push(item.trim().toLowerCase());
    const f = this.solids.create(this.player.x + 20, this.player.y, 'furniture') as Phaser.Physics.Arcade.Sprite;
    f.setDepth(this.player.y);
    playSfx(this, 'pickup');
    this.pushChat(`Placed ${item}. Furniture: ${this.state.furniture.length}`);
  }

  private gangMenu(): void {
    playSfx(this, 'ui');
    if (!this.state.gangName) {
      const name = window.prompt('Create a gang (25 max members in full game). Name:', 'Neon Crew');
      if (!name) return;
      if (this.state.gralats < 50) {
        this.pushChat('Need 50 gralats to create a gang in this demo.');
        return;
      }
      this.state.gralats -= 50;
      this.state.gangName = name.trim().slice(0, 18);
      this.state.gangRank = 'Leader';
      playSfx(this, 'levelup');
      this.pushChat(`Gang founded: ${this.state.gangName}`);
      unlockAchievement(this.state, 'gang', 'Gang Founder');
      return;
    }
    this.pushChat(`${this.state.gangName} · rank ${this.state.gangRank} · allies cannot hurt each other (demo rule).`);
  }

  private openChat(): void {
    const msg = window.prompt('World chat', '');
    if (!msg) return;
    playSfx(this, 'chat');
    this.pushChat(`${this.state.profile.name}: ${msg}`);
  }

  private eatFood(): void {
    if (!consumeItem(this.state, 'food', 1)) {
      this.pushChat('No food left.');
      return;
    }
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + 15);
    playSfx(this, 'heal');
    this.pushChat('Ate a Street Snack (+15 HP).');
  }

  private spawnJobPickups(): void {
    for (let i = 0; i < 20; i++) {
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
    this.pushChat(`Picked up ${kind}`);
  }

  private updateEnemyAI(): void {
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemyBody;
      if (!enemy.active) return;
      enemy.setDepth(enemy.y);
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 260) {
        this.physics.moveToObject(enemy, this.player, enemy.speed);
      } else {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
  }

  private bulletHit(bullet: Phaser.Physics.Arcade.Sprite, enemy: EnemyBody): void {
    const dmg = (bullet.getData('damage') as number) || 8;
    bullet.destroy();
    this.damageEnemy(enemy, dmg);
  }

  private damageEnemy(enemy: EnemyBody, amount: number): void {
    enemy.hp -= amount;
    playSfx(this, 'hit');
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(60, () => enemy.clearTint());
    if (enemy.hp <= 0) {
      enemy.destroy();
      this.state.kills += 1;
      this.state.gralats += 12;
      playSfx(this, 'coin');
      this.pushChat(`Rival down. Kills: ${this.state.kills}`);
      if (this.state.kills === 10) {
        const ach = unlockAchievement(this.state, 'kills10', 'Ten down');
        if (ach) {
          playSfx(this, 'levelup');
          this.pushChat(ach);
        }
      }
    }
  }

  private playerTouchedEnemy(): void {
    const cell = tileAt(this.world, this.player.x, this.player.y);
    if (cell?.noPk) return;
    if (this.time.now < (this.player.getData('iframes') as number)) return;
    this.player.setData('iframes', this.time.now + 500);
    this.state.hp -= 5;
    playSfx(this, 'hurt');
    this.cameras.main.shake(80, 0.004);
    if (this.state.hp <= 0) {
      this.state.hp = this.state.maxHp;
      this.player.setPosition(this.world.spawn.x, this.world.spawn.y);
      this.pushChat('You were knocked out and respawned in the plaza.');
    }
  }

  private pushChat(line: string): void {
    this.state.chatLog.push(line);
    if (this.state.chatLog.length > 40) this.state.chatLog.shift();
    this.game.events.emit('era-chat', line);
  }
}
