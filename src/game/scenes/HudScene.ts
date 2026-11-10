import Phaser from 'phaser';
import { WEAPONS, type GameState } from '../state';
import { playSfx } from '../audio';

export class HudScene extends Phaser.Scene {
  private state!: GameState;
  private hpText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
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
      fontSize: '22px',
      color: '#e8f0ff',
      backgroundColor: '#0b1220cc',
      padding: { x: 8, y: 4 },
    } as const;

    this.hpText = this.add.text(12, 44, '', style).setScrollFactor(0).setDepth(4000);
    this.moneyText = this.add.text(12, 76, '', style).setScrollFactor(0).setDepth(4000);
    this.weaponText = this.add.text(12, 108, '', style).setScrollFactor(0).setDepth(4000);
    this.gangText = this.add.text(12, 140, '', style).setScrollFactor(0).setDepth(4000);

    this.chatText = this.add
      .text(12, this.scale.height - 150, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '18px',
        color: '#cfe0ff',
        backgroundColor: '#0b1220aa',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 520 },
      })
      .setScrollFactor(0)
      .setDepth(4000);

    this.panelText = this.add
      .text(this.scale.width - 12, 44, '', {
        fontFamily: 'VT323, monospace',
        fontSize: '20px',
        color: '#e8f0ff',
        backgroundColor: '#0b1220dd',
        padding: { x: 10, y: 8 },
        align: 'right',
        wordWrap: { width: 280 },
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
    const w = WEAPONS[this.state.weapon];
    this.hpText.setText(`HP ${this.state.hp}/${this.state.maxHp}`);
    this.moneyText.setText(`Gralats ${this.state.gralats}`);
    this.weaponText.setText(`${w.name} · ${w.ability}`);
    this.gangText.setText(this.state.gangName ? `Gang ${this.state.gangName} (${this.state.gangRank})` : 'Gang: none');
    this.chatText.setText(this.state.chatLog.slice(-6).join('\n'));

    if (this.showInventory) {
      const inv = this.state.inventory
        .filter((i) => i.count > 0)
        .map((i) => `${i.name}: ${i.count}`)
        .join('\n');
      const jobs = Object.entries(this.state.jobLevel)
        .map(([k, v]) => `${k} Lv${v}`)
        .join('\n');
      this.panelText.setVisible(true);
      this.panelText.setText(`INVENTORY\n${inv || 'empty'}\n\nJOBS\n${jobs}\n\nKills ${this.state.kills}\nHouse ${this.state.houseOwned ? 'owned' : 'none'}\nFurniture ${this.state.furniture.length}`);
    } else {
      this.panelText.setVisible(false);
    }
  }
}
