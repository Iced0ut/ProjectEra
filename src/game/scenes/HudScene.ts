import Phaser from 'phaser';
import { EFFECT_LABELS } from '../combat';
import { currentWeapon, type GameState } from '../state';
import { playSfx } from '../audio';
import { WEAPON_LIST } from '../content/weapons';

export class HudScene extends Phaser.Scene {
  private state!: GameState;
  private hpText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private gangText!: Phaser.GameObjects.Text;
  private chatText!: Phaser.GameObjects.Text;
  private panelText!: Phaser.GameObjects.Text;
  private showInventory = false;

  constructor() {
    super('hud');
  }

  init(data: { state: GameState }): void {
    this.state = data.state;
  }

  create(): void {
    const style = {
      fontFamily: 'VT323, monospace',
      fontSize: '20px',
      color: '#e8f0ff',
      backgroundColor: '#0b1220cc',
      padding: { x: 8, y: 3 },
    } as const;

    this.hpText = this.add.text(12, 44, '', style).setScrollFactor(0).setDepth(4000);
    this.moneyText = this.add.text(12, 72, '', style).setScrollFactor(0).setDepth(4000);
    this.weaponText = this.add.text(12, 100, '', style).setScrollFactor(0).setDepth(4000);
    this.ammoText = this.add.text(12, 128, '', style).setScrollFactor(0).setDepth(4000);
    this.gangText = this.add.text(12, 156, '', style).setScrollFactor(0).setDepth(4000);
    this.add
      .text(this.scale.width - 12, 12, `Weapons in catalog: ${WEAPON_LIST.length}`, {
        fontFamily: 'VT323, monospace',
        fontSize: '18px',
        color: '#8aa0c0',
        backgroundColor: '#0b1220aa',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(4000);

    this.chatText = this.add
      .text(12, this.scale.height - 150, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '17px',
        color: '#cfe0ff',
        backgroundColor: '#0b1220aa',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 560 },
      })
      .setScrollFactor(0)
      .setDepth(4000);

    this.panelText = this.add
      .text(this.scale.width - 12, 44, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '18px',
        color: '#e8f0ff',
        backgroundColor: '#0b1220dd',
        padding: { x: 10, y: 8 },
        align: 'right',
        wordWrap: { width: 300 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(4000)
      .setVisible(false);

    this.game.events.on('era-state', (state: GameState) => {
      this.state = state;
      this.refresh();
    });
    this.game.events.on('era-chat', () => this.refresh());
    this.game.events.on('era-toggle', (panel: string) => {
      if (panel === 'inventory') {
        this.showInventory = !this.showInventory;
        playSfx(this, 'ui');
        this.refresh();
      }
    });

    this.refresh();
  }

  private refresh(): void {
    if (!this.state) return;
    const w = currentWeapon(this.state);
    this.hpText.setText(`HP ${Math.ceil(this.state.hp)}/${this.state.maxHp}`);
    this.moneyText.setText(`Gralats ${this.state.gralats}`);
    this.weaponText.setText(`${w.name} · ${EFFECT_LABELS[w.effect]} · ${w.abilityLabel}`);
    const ammo =
      w.ammo === 'none'
        ? 'Melee / utility'
        : `Clip ${this.state.clipLeft}/${w.clip ?? 0} · Pool ${this.state.ammo[w.ammo]}`;
    this.ammoText.setText(ammo);
    const ride = this.state.activeCar ?? this.state.activeMount ?? 'on foot';
    this.gangText.setText(
      `${this.state.gangName ? `Gang ${this.state.gangName}` : 'Gang: none'} · ${ride} · hat ${this.state.equippedHat}`,
    );
    this.chatText.setText(this.state.chatLog.slice(-6).join('\n'));

    if (this.showInventory) {
      const inv = this.state.inventory
        .filter((i) => i.count > 0)
        .map((i) => `${i.name}: ${i.count}`)
        .join('\n');
      const guns = this.state.ownedWeapons.length;
      this.panelText.setVisible(true);
      const shells = this.state.inventory
        .filter((i) =>
          ['trochus', 'aerolata', 'sand_dollar', 'scallop', 'starfish'].includes(i.id) && i.count > 0,
        )
        .map((i) => `${i.name}:${i.count}`)
        .join(' ');
      this.panelText.setText(
        `INVENTORY\n${inv || 'empty'}\n\nShovel ${this.state.diggingEquipped ? 'ON' : 'OFF'} · uses ${this.state.shovelUses} · spare ${this.state.shovelCount}\nShells ${shells || 'none'}\nOwned weapons: ${guns}/${WEAPON_LIST.length}\nKills ${this.state.kills}\nMorph ${this.state.activeMorph ?? 'none'}\nCars ${this.state.ownedCars.join(',') || 'none'}`,
      );
    } else {
      this.panelText.setVisible(false);
    }
  }
}
