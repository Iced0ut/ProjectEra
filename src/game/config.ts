/** Graal tile: 16×16 px. A level is 64×64 tiles (1024×1024 px). */
export const TILE = 16;
export const LEVEL_TILES = 64;
/** Exported GMap raster, exact. */
export const MAP_PX_W = 2352;
export const MAP_PX_H = 1008;
export const MAP_W = MAP_PX_W / TILE;
export const MAP_H = MAP_PX_H / TILE;
export const PLAYER_HP = 50;
export const PLAYER_SPEED = 96;
export const ATTACK_COOLDOWN_MS = 280;
export const DASH_COOLDOWN_MS = 900;
export const DASH_SPEED = 380;
export const DASH_MS = 120;

export const COLORS = {
  grass: 0x3f7a45,
  grassDark: 0x2f5d36,
  path: 0x8a7a5c,
  road: 0x4a4f58,
  sidewalk: 0x6b7280,
  water: 0x2a6f9e,
  waterDeep: 0x1d4f74,
  sand: 0xd2b48c,
  building: 0x5a6578,
  roof: 0x8b3a3a,
  wall: 0x6d5a4a,
  tree: 0x245c2e,
  trunk: 0x6b4423,
  rock: 0x7a8494,
  pk: 0x4a2030,
  safe: 0x2a4a3a,
  spar: 0x3a2a55,
  gang: 0x553020,
  snow: 0xdce8f5,
  bridge: 0x6b5a45,
  mine: 0x3a3a42,
  plaza: 0x4a6a4a,
};

export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
