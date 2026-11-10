import Phaser from 'phaser';
import { generateTextures } from '../assets';
import { preloadAudio } from '../audio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    preloadAudio(this);
    this.load.on('complete', () => {
      // no-op; create runs after preload
    });
  }

  create(): void {
    generateTextures(this);
    this.scene.start('title');
  }
}
