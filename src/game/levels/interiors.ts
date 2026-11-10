import Phaser from 'phaser';
import { LEVEL_TILES, TILE } from '../config';

/**
 * A level is one 64×64 section (1024×1024 px). Buildings link to their own level
 * instead of being painted on the outdoor GMap. Original rooms, not Graal files.
 */

export type InteriorKind =
  | 'house'
  | 'shop'
  | 'hotel'
  | 'gang'
  | 'clinic'
  | 'spar'
  | 'mine'
  | 'cave'
  | 'hall';

export interface InteriorLevel {
  kind: InteriorKind;
  title: string;
  size: number;
  blocked: boolean[][];
  spawnTx: number;
  spawnTy: number;
  exitTx: number;
  exitTy: number;
  noPk: boolean;
  props: { tx: number; ty: number; key: string }[];
}

const FLOOR: Record<InteriorKind, string> = {
  house: '#c4a574',
  shop: '#d5d0c6',
  hotel: '#c9bfb0',
  gang: '#6a4038',
  clinic: '#d5e4ea',
  spar: '#4a3c62',
  mine: '#3a3a42',
  cave: '#2c3138',
  hall: '#b7c0b4',
};

const FLOOR_ALT: Record<InteriorKind, string> = {
  house: '#b08958',
  shop: '#c4bfb4',
  hotel: '#b7ad9e',
  gang: '#54322c',
  clinic: '#c5d6de',
  spar: '#3c3154',
  mine: '#2e2e34',
  cave: '#23272d',
  hall: '#a7b2a4',
};

const WALL = '#3a2e28';
const WALL_TOP = '#5c4638';

export function interiorKindFor(label: string, type: string): InteriorKind {
  const name = label.toLowerCase();
  if (type === 'house' || name.includes('flat')) return 'house';
  if (type === 'shop' || name.includes('mall') || name.includes('gun') || name.includes('shell') || name.includes('motor')) {
    return 'shop';
  }
  if (name.includes('hotel')) return 'hotel';
  if (name.includes('hospital') || name.includes('mercy')) return 'clinic';
  if (name.includes('spar')) return 'spar';
  if (name.includes('mine')) return 'mine';
  if (name.includes('cave')) return 'cave';
  if (
    name.includes('gz') ||
    name.includes('bh') ||
    name.includes('bbz') ||
    name.includes('pirate') ||
    name.includes('guerre') ||
    name.includes('neo') ||
    name.includes('bank')
  ) {
    return 'gang';
  }
  return 'hall';
}

export function buildInterior(kind: InteriorKind, title: string): InteriorLevel {
  const size = LEVEL_TILES;
  const blocked: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    blocked[y] = [];
    for (let x = 0; x < size; x++) {
      const edge = x < 2 || y < 2 || x >= size - 2 || y >= size - 2;
      const door = x >= 30 && x <= 33 && y >= size - 2;
      blocked[y][x] = edge && !door;
    }
  }

  const props: InteriorLevel['props'] = [];
  const wall = (x0: number, y0: number, w: number, h: number, gapX = -1, gapY = -1) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x === gapX || y === gapY) continue;
        if (x < 2 || y < 2 || x >= size - 2 || y >= size - 2) continue;
        blocked[y][x] = true;
      }
    }
  };

  if (kind === 'house') {
    wall(2, 28, 60, 1, 32, -1);
    wall(24, 8, 1, 20, -1, 16);
    props.push(
      { tx: 8, ty: 10, key: 'furniture' },
      { tx: 14, ty: 12, key: 'furniture' },
      { tx: 40, ty: 14, key: 'house' },
      { tx: 48, ty: 36, key: 'furniture' },
      { tx: 12, ty: 40, key: 'crate' },
    );
  } else if (kind === 'shop') {
    wall(10, 18, 44, 2, 32, -1);
    for (let i = 0; i < 5; i++) props.push({ tx: 12 + i * 8, ty: 12, key: 'crate' });
    props.push({ tx: 30, ty: 24, key: 'shop' }, { tx: 44, ty: 40, key: 'furniture' });
  } else if (kind === 'hotel') {
    wall(2, 22, 28, 1, 16, -1);
    wall(36, 22, 26, 1, 48, -1);
    props.push(
      { tx: 10, ty: 12, key: 'furniture' },
      { tx: 18, ty: 12, key: 'furniture' },
      { tx: 44, ty: 12, key: 'furniture' },
      { tx: 30, ty: 36, key: 'house' },
    );
  } else if (kind === 'gang') {
    wall(16, 16, 1, 30, -1, 30);
    wall(46, 16, 1, 30, -1, 30);
    props.push({ tx: 20, ty: 20, key: 'crate' }, { tx: 36, ty: 20, key: 'crate' }, { tx: 28, ty: 40, key: 'crate' });
  } else if (kind === 'clinic') {
    wall(2, 24, 60, 1, 32, -1);
    props.push(
      { tx: 10, ty: 12, key: 'furniture' },
      { tx: 18, ty: 12, key: 'furniture' },
      { tx: 40, ty: 12, key: 'furniture' },
      { tx: 48, ty: 36, key: 'furniture' },
    );
  } else if (kind === 'spar') {
    for (let i = 0; i < 8; i++) {
      const x = 18 + (i % 4) * 8;
      const y = 16 + Math.floor(i / 4) * 16;
      props.push({ tx: x, ty: y, key: 'crate' });
    }
  } else if (kind === 'mine' || kind === 'cave') {
    wall(8, 10, 48, 1, 32, -1);
    wall(8, 36, 48, 1, 20, -1);
    for (let i = 0; i < 6; i++) props.push({ tx: 12 + i * 7, ty: 20 + (i % 2) * 8, key: 'rock' });
  } else {
    wall(20, 8, 1, 18, -1, 16);
    wall(42, 8, 1, 18, -1, 16);
    props.push({ tx: 28, ty: 14, key: 'shop' }, { tx: 14, ty: 40, key: 'furniture' }, { tx: 46, ty: 40, key: 'furniture' });
  }

  return {
    kind,
    title,
    size,
    blocked,
    spawnTx: 32,
    spawnTy: 56,
    exitTx: 31,
    exitTy: 61,
    noPk: kind !== 'gang' && kind !== 'spar' && kind !== 'mine',
    props,
  };
}

export function paintInteriorTexture(scene: Phaser.Scene, level: InteriorLevel): string {
  const key = `interior-${level.kind}`;
  if (scene.textures.exists(key)) return key;
  const size = level.size;
  const canvas = document.createElement('canvas');
  canvas.width = size * TILE;
  canvas.height = size * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return key;
  ctx.imageSmoothingEnabled = false;
  const floor = FLOOR[level.kind];
  const alt = FLOOR_ALT[level.kind];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (level.blocked[y][x]) {
        ctx.fillStyle = (x + y) % 2 === 0 ? WALL : WALL_TOP;
      } else if (x >= 30 && x <= 33 && y >= size - 3) {
        ctx.fillStyle = '#e6c85a';
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? floor : alt;
      }
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  scene.textures.addCanvas(key, canvas);
  return key;
}

export const INTERIOR_ORIGIN_X = 0;
export const INTERIOR_ORIGIN_Y = 80 * TILE;
