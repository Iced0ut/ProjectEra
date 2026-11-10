import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { WorldScene } from './game/scenes/WorldScene';
import { HudScene } from './game/scenes/HudScene';

const parent = document.getElementById('game-root') ?? undefined;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#0b1220',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, WorldScene, HudScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  audio: {
    disableWebAudio: false,
  },
};

// Avoid duplicate game instances during Vite HMR.
const existing = (window as unknown as { __projectEraGame?: Phaser.Game }).__projectEraGame;
if (existing) existing.destroy(true);
const game = new Phaser.Game(config);
(window as unknown as { __projectEraGame?: Phaser.Game }).__projectEraGame = game;
