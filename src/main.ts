import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { WorldScene } from './game/scenes/WorldScene';
import { HudScene } from './game/scenes/HudScene';
import { initDomHud } from './game/ui/domHud';

initDomHud();

const parent = document.getElementById('game-root') ?? undefined;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#071018',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
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
    // Pixel world sprites, but avoid forcing nearest-neighbor on the whole canvas UI feel
    pixelArt: true,
    antialias: true,
    roundPixels: true,
  },
  audio: {
    disableWebAudio: false,
  },
};

const existing = (window as unknown as { __projectEraGame?: Phaser.Game }).__projectEraGame;
if (existing) existing.destroy(true);
const game = new Phaser.Game(config);
(window as unknown as { __projectEraGame?: Phaser.Game }).__projectEraGame = game;
