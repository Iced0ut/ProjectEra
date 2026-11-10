import { LEVEL_TILES, MAP_H, MAP_W } from '../config';

/** One GMap level is 64×64 tiles. The city scrolls across level borders. */

export interface MapLevel {
  lx: number;
  ly: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function levelGrid(): { cols: number; rows: number } {
  return {
    cols: Math.ceil(MAP_W / LEVEL_TILES),
    rows: Math.ceil(MAP_H / LEVEL_TILES),
  };
}

export function levelAt(tx: number, ty: number): MapLevel {
  const lx = Math.max(0, Math.min(Math.floor(tx / LEVEL_TILES), levelGrid().cols - 1));
  const ly = Math.max(0, Math.min(Math.floor(ty / LEVEL_TILES), levelGrid().rows - 1));
  const x = lx * LEVEL_TILES;
  const y = ly * LEVEL_TILES;
  return {
    lx,
    ly,
    x,
    y,
    w: Math.min(LEVEL_TILES, MAP_W - x),
    h: Math.min(LEVEL_TILES, MAP_H - y),
  };
}

export function levelLabel(tx: number, ty: number): string {
  const level = levelAt(tx, ty);
  return `L${level.lx},${level.ly}`;
}
