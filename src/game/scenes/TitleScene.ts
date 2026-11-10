import Phaser from 'phaser';
import { playMusic, playSfx } from '../audio';
import { createInitialState, type PlayerProfile } from '../state';
import { hideTitle, showTitle } from '../ui/domHud';

export class TitleScene extends Phaser.Scene {
  private entering = false;

  constructor() {
    super('title');
  }

  create(): void {
    this.entering = false;
    this.cameras.main.setBackgroundColor('#071018');
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

    const startGame = (profile: PlayerProfile) => {
      if (this.entering) return;
      this.entering = true;
      try {
        playSfx(this, 'ui');
      } catch {
        // ignore audio unlock races
      }
      hideTitle();
      const state = createInitialState(profile);
      this.scene.start('world', { state });
      this.scene.launch('hud', { state });
    };

    showTitle(({ profile }) => startGame(profile));

    const onDomEnter = (ev: Event) => {
      const detail = (ev as CustomEvent<{ profile: PlayerProfile }>).detail;
      if (detail?.profile) startGame(detail.profile);
    };
    window.addEventListener('projectera-enter', onDomEnter);
    this.events.once('shutdown', () => window.removeEventListener('projectera-enter', onDomEnter));
  }

  shutdown(): void {
    hideTitle();
  }
}
