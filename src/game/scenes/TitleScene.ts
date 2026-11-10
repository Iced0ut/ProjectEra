import Phaser from 'phaser';
import { playMusic, playSfx } from '../audio';
import { createInitialState } from '../state';
import { hideTitle, showTitle } from '../ui/domHud';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#071018');
    // Soft vignette only — real UI is HTML for crisp text
    const g = this.add.graphics();
    g.fillStyle(0x0b1a28, 0.35);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
    g.fillStyle(0x3ecf8e, 0.05);
    g.fillCircle(this.scale.width * 0.5, this.scale.height * 0.25, 180);

    playMusic(this, 'theme_title', 0.28);
    this.input.once('pointerdown', () => {
      if (this.sound.locked) this.sound.unlock();
      playMusic(this, 'theme_title', 0.28);
    });

    showTitle(({ profile }) => {
      playSfx(this, 'ui');
      hideTitle();
      const state = createInitialState(profile);
      this.scene.start('world', { state });
      this.scene.launch('hud', { state });
    });
  }

  shutdown(): void {
    hideTitle();
  }
}
