import Phaser from 'phaser';
import { COLORS } from './config';
import { generatePrettyTiles } from './sprites/tiles';

function px(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function generateTextures(scene: Phaser.Scene): void {
  generatePrettyTiles(scene);
  px(scene, 'tile-grass-legacy', 32, 32, (g) => {
    g.fillStyle(COLORS.grass, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(COLORS.grassDark, 1);
    g.fillRect(4, 8, 2, 2);
    g.fillRect(18, 20, 2, 2);
    g.fillRect(26, 6, 2, 2);
  });

  px(scene, 'tile-path', 32, 32, (g) => {
    g.fillStyle(COLORS.path, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x746848, 1);
    g.fillRect(10, 4, 3, 3);
    g.fillRect(22, 18, 2, 2);
  });

  px(scene, 'tile-road', 32, 32, (g) => {
    g.fillStyle(COLORS.road, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xf0c14b, 1);
    g.fillRect(14, 0, 4, 10);
    g.fillRect(14, 18, 4, 10);
  });

  px(scene, 'tile-sidewalk', 32, 32, (g) => {
    g.fillStyle(COLORS.sidewalk, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x555b66, 1);
    g.strokeRect(0, 0, 32, 32);
  });

  px(scene, 'tile-water', 32, 32, (g) => {
    g.fillStyle(COLORS.water, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(COLORS.waterDeep, 1);
    g.fillRect(4, 10, 10, 3);
    g.fillRect(18, 20, 8, 2);
  });

  px(scene, 'tile-sand', 32, 32, (g) => {
    g.fillStyle(COLORS.sand, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xc4a574, 1);
    g.fillRect(8, 12, 2, 2);
    g.fillRect(20, 22, 2, 2);
  });

  px(scene, 'tile-pk', 32, 32, (g) => {
    g.fillStyle(COLORS.pk, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6a3040, 1);
    g.fillRect(0, 14, 32, 4);
  });

  px(scene, 'tile-safe', 32, 32, (g) => {
    g.fillStyle(COLORS.safe, 1);
    g.fillRect(0, 0, 32, 32);
  });

  px(scene, 'tile-spar', 32, 32, (g) => {
    g.fillStyle(COLORS.spar, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(2, 0xb08cff, 1);
    g.strokeRect(2, 2, 28, 28);
  });

  px(scene, 'tile-gang', 32, 32, (g) => {
    g.fillStyle(COLORS.gang, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xff6b4a, 1);
    g.fillRect(12, 12, 8, 8);
  });

  px(scene, 'tile-snow', 32, 32, (g) => {
    g.fillStyle(COLORS.snow, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xffffff, 1);
    g.fillRect(6, 8, 2, 2);
    g.fillRect(20, 18, 2, 2);
    g.fillRect(14, 4, 2, 2);
  });

  px(scene, 'tile-bridge', 32, 32, (g) => {
    g.fillStyle(COLORS.bridge, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a3a28, 1);
    g.fillRect(0, 0, 32, 3);
    g.fillRect(0, 29, 32, 3);
    g.fillStyle(0x8a7a5c, 1);
    g.fillRect(14, 0, 4, 32);
  });

  px(scene, 'tile-mine', 32, 32, (g) => {
    g.fillStyle(COLORS.mine, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(8, 10, 16, 14);
    g.fillStyle(0x6b4423, 1);
    g.fillRect(4, 8, 24, 4);
  });

  px(scene, 'building', 64, 64, (g) => {
    g.fillStyle(COLORS.building, 1);
    g.fillRect(0, 16, 64, 48);
    g.fillStyle(COLORS.roof, 1);
    g.fillTriangle(0, 16, 32, 0, 64, 16);
    g.fillStyle(0xffe08a, 1);
    g.fillRect(12, 28, 10, 12);
    g.fillRect(42, 28, 10, 12);
    g.fillStyle(0x3a2a20, 1);
    g.fillRect(28, 40, 10, 24);
  });

  px(scene, 'shop', 64, 64, (g) => {
    g.fillStyle(0x4a6d88, 1);
    g.fillRect(0, 16, 64, 48);
    g.fillStyle(0x2f4a60, 1);
    g.fillRect(0, 0, 64, 18);
    g.fillStyle(0xffd27a, 1);
    g.fillRect(8, 26, 48, 16);
    g.fillStyle(0x2a2118, 1);
    g.fillRect(26, 42, 12, 22);
  });

  px(scene, 'house', 64, 64, (g) => {
    g.fillStyle(0x7a5a3a, 1);
    g.fillRect(8, 20, 48, 40);
    g.fillStyle(0x355c3a, 1);
    g.fillTriangle(4, 22, 32, 2, 60, 22);
    g.fillStyle(0x86c5ff, 1);
    g.fillRect(16, 30, 10, 10);
    g.fillStyle(0x3b2918, 1);
    g.fillRect(34, 36, 12, 24);
  });

  px(scene, 'tree', 32, 48, (g) => {
    g.fillStyle(COLORS.trunk, 1);
    g.fillRect(13, 28, 6, 20);
    g.fillStyle(COLORS.tree, 1);
    g.fillCircle(16, 18, 14);
    g.fillStyle(0x2f7a3c, 1);
    g.fillCircle(10, 16, 8);
  });

  px(scene, 'rock', 28, 20, (g) => {
    g.fillStyle(COLORS.rock, 1);
    g.fillEllipse(14, 12, 26, 16);
    g.fillStyle(0x9aa4b4, 1);
    g.fillEllipse(10, 10, 8, 5);
  });

  px(scene, 'crate', 24, 24, (g) => {
    g.fillStyle(0xb8894a, 1);
    g.fillRect(0, 0, 24, 24);
    g.lineStyle(2, 0x6d4c28, 1);
    g.strokeRect(1, 1, 22, 22);
    g.lineBetween(0, 0, 24, 24);
  });

  px(scene, 'player', 24, 32, (g) => {
    g.fillStyle(0xffdbac, 1);
    g.fillCircle(12, 8, 6);
    g.fillStyle(0x3ecf8e, 1);
    g.fillRect(6, 14, 12, 12);
    g.fillStyle(0x2a3d5c, 1);
    g.fillRect(7, 26, 4, 6);
    g.fillRect(13, 26, 4, 6);
  });

  px(scene, 'npc', 24, 32, (g) => {
    g.fillStyle(0xffdbac, 1);
    g.fillCircle(12, 8, 6);
    g.fillStyle(0xf0c14b, 1);
    g.fillRect(6, 14, 12, 12);
    g.fillStyle(0x2a3d5c, 1);
    g.fillRect(7, 26, 4, 6);
    g.fillRect(13, 26, 4, 6);
  });

  px(scene, 'enemy', 24, 32, (g) => {
    g.fillStyle(0xe8a090, 1);
    g.fillCircle(12, 8, 6);
    g.fillStyle(0xff6b4a, 1);
    g.fillRect(6, 14, 12, 12);
    g.fillStyle(0x2a2030, 1);
    g.fillRect(7, 26, 4, 6);
    g.fillRect(13, 26, 4, 6);
  });

  px(scene, 'bullet', 8, 8, (g) => {
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(4, 4, 3);
  });

  px(scene, 'slash', 28, 12, (g) => {
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(14, 6, 28, 10);
  });

  px(scene, 'pickup', 16, 16, (g) => {
    g.fillStyle(0x3ecf8e, 1);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 2);
  });

  px(scene, 'shell', 18, 14, (g) => {
    g.fillStyle(0xe8d5b7, 1);
    g.fillEllipse(9, 8, 16, 10);
    g.fillStyle(0xc4b49a, 1);
    g.fillEllipse(9, 7, 8, 5);
  });

  px(scene, 'shovel', 20, 28, (g) => {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(8, 0, 4, 18);
    g.fillStyle(0x9aa4b4, 1);
    g.fillTriangle(2, 18, 18, 18, 10, 28);
  });

  px(scene, 'crab', 28, 20, (g) => {
    g.fillStyle(0xff6b4a, 1);
    g.fillEllipse(14, 12, 20, 12);
    g.fillStyle(0xff9a5a, 1);
    g.fillCircle(4, 10, 4);
    g.fillCircle(24, 10, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(10, 10, 2);
    g.fillCircle(18, 10, 2);
  });

  px(scene, 'furniture', 28, 20, (g) => {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, 8, 28, 12);
    g.fillStyle(0xc48a4a, 1);
    g.fillRect(2, 0, 24, 10);
  });
}
