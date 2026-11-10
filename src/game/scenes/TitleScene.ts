import Phaser from 'phaser';
import { playMusic, playSfx } from '../audio';
import { createInitialState, type PlayerProfile } from '../state';

export class TitleScene extends Phaser.Scene {
  private nameValue = 'Player';
  private hair = 0;
  private shirt = 0;
  private pants = 0;
  private hat = 0;

  constructor() {
    super('title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b1220');
    playMusic(this, 'theme_title', 0.32);
    this.input.once('pointerdown', () => {
      if (this.sound.locked) this.sound.unlock();
      playMusic(this, 'theme_title', 0.32);
    });

    this.add
      .text(width / 2, height * 0.18, 'PROJECTERA', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: '#3ecf8e',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28, 'City action sandbox — original demo district', {
        fontFamily: 'VT323, monospace',
        fontSize: '28px',
        color: '#8aa0c0',
      })
      .setOrigin(0.5);

    const panel = this.add.rectangle(width / 2, height * 0.58, 520, 280, 0x101a2c, 0.95).setStrokeStyle(2, 0x2a3d5c);

    const nameText = this.add
      .text(width / 2, panel.y - 90, `Name: ${this.nameValue}`, {
        fontFamily: 'VT323, monospace',
        fontSize: '30px',
        color: '#e8f0ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    nameText.on('pointerdown', () => {
      const next = window.prompt('Character name', this.nameValue);
      if (next && next.trim()) {
        this.nameValue = next.trim().slice(0, 16);
        nameText.setText(`Name: ${this.nameValue}`);
      }
    });

    const styleText = this.add
      .text(width / 2, panel.y - 40, this.styleLabel(), {
        fontFamily: 'VT323, monospace',
        fontSize: '24px',
        color: '#f0c14b',
      })
      .setOrigin(0.5);

    this.makeButton(width / 2 - 160, panel.y + 20, 'Hair', () => {
      this.hair = (this.hair + 1) % 6;
      styleText.setText(this.styleLabel());
    });
    this.makeButton(width / 2 - 40, panel.y + 20, 'Shirt', () => {
      this.shirt = (this.shirt + 1) % 6;
      styleText.setText(this.styleLabel());
    });
    this.makeButton(width / 2 + 80, panel.y + 20, 'Pants', () => {
      this.pants = (this.pants + 1) % 6;
      styleText.setText(this.styleLabel());
    });
    this.makeButton(width / 2 + 200, panel.y + 20, 'Hat', () => {
      this.hat = (this.hat + 1) % 5;
      styleText.setText(this.styleLabel());
    });

    this.makeButton(width / 2, panel.y + 90, 'ENTER CITY', () => {
      playSfx(this, 'ui');
      const profile: PlayerProfile = {
        name: this.nameValue,
        hair: this.hair,
        shirt: this.shirt,
        pants: this.pants,
        hat: this.hat,
      };
      const state = createInitialState(profile);
      this.scene.start('world', { state });
      this.scene.launch('hud', { state });
    });

      this.add
      .text(width / 2, height * 0.86, 'Guns · Melees · Effects · NPCs · Bots · Shops · Rides · Skins', {
        fontFamily: 'VT323, monospace',
        fontSize: '22px',
        color: '#8aa0c0',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.92, 'Desktop: npm run dist:win · npm run dist:mac', {
        fontFamily: 'VT323, monospace',
        fontSize: '20px',
        color: '#6a8098',
      })
      .setOrigin(0.5);
  }

  private styleLabel(): string {
    return `Look  hair:${this.hair} shirt:${this.shirt} pants:${this.pants} hat:${this.hat}`;
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, Math.max(100, label.length * 12), 40, 0x1b2a44).setStrokeStyle(2, 0x3ecf8e);
    const text = this.add
      .text(x, y, label, { fontFamily: 'VT323, monospace', fontSize: '24px', color: '#e8f0ff' })
      .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x243856));
    bg.on('pointerout', () => bg.setFillStyle(0x1b2a44));
    bg.on('pointerdown', onClick);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', onClick);
  }
}
