import { MAP_H, MAP_W, TILE } from './config';

export type TileKind =
  | 'grass'
  | 'path'
  | 'road'
  | 'sidewalk'
  | 'water'
  | 'sand'
  | 'pk'
  | 'safe'
  | 'spar'
  | 'gang';

export type ZoneId = 'downtown' | 'beach' | 'spar' | 'gangbase' | 'park' | 'house' | 'jobs';

export interface WorldCell {
  tile: TileKind;
  blocked: boolean;
  zone: ZoneId;
  noPk: boolean;
}

export interface WorldObjectSpec {
  type: 'building' | 'shop' | 'house' | 'tree' | 'rock' | 'crate' | 'furniture';
  x: number;
  y: number;
  label?: string;
}

export interface NpcSpec {
  x: number;
  y: number;
  name: string;
  role: 'shop' | 'job' | 'gang' | 'spar' | 'guide';
  lines: string[];
}

export interface EnemySpec {
  x: number;
  y: number;
}

export interface WorldData {
  cells: WorldCell[][];
  objects: WorldObjectSpec[];
  npcs: NpcSpec[];
  enemies: EnemySpec[];
  spawn: { x: number; y: number };
  mailDrop: { x: number; y: number };
  pizzaStation: { x: number; y: number };
}

function fillRect(
  cells: WorldCell[][],
  x0: number,
  y0: number,
  w: number,
  h: number,
  tile: TileKind,
  zone: ZoneId,
  blocked = false,
  noPk = false,
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      cells[y][x] = { tile, blocked, zone, noPk };
    }
  }
}

export function createWorld(): WorldData {
  const cells: WorldCell[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    cells[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      cells[y][x] = { tile: 'grass', blocked: false, zone: 'park', noPk: false };
    }
  }

  // Downtown safe plaza
  fillRect(cells, 24, 18, 28, 22, 'safe', 'downtown', false, true);
  fillRect(cells, 28, 20, 20, 16, 'sidewalk', 'downtown', false, true);
  fillRect(cells, 34, 22, 8, 12, 'path', 'downtown', false, true);

  // Roads
  fillRect(cells, 0, 28, MAP_W, 4, 'road', 'downtown', false, false);
  fillRect(cells, 38, 0, 4, MAP_H, 'road', 'downtown', false, false);

  // Beach / dig zone
  fillRect(cells, 0, 44, 26, 16, 'sand', 'beach', false, true);
  fillRect(cells, 0, 52, 26, 8, 'water', 'beach', true, true);

  // Spar arena
  fillRect(cells, 58, 8, 18, 14, 'spar', 'spar', false, false);

  // Gang base (PK)
  fillRect(cells, 58, 36, 18, 16, 'gang', 'gangbase', false, false);
  fillRect(cells, 60, 38, 14, 12, 'pk', 'gangbase', false, false);

  // Job strip
  fillRect(cells, 8, 8, 18, 12, 'path', 'jobs', false, true);

  // Player house lot
  fillRect(cells, 10, 32, 12, 10, 'safe', 'house', false, true);

  const objects: WorldObjectSpec[] = [
    { type: 'shop', x: 30 * TILE, y: 20 * TILE, label: 'Weapon Shop' },
    { type: 'shop', x: 44 * TILE, y: 20 * TILE, label: 'Job Board' },
    { type: 'building', x: 30 * TILE, y: 30 * TILE, label: 'Speedy Pizza' },
    { type: 'building', x: 44 * TILE, y: 30 * TILE, label: 'City Hall' },
    { type: 'house', x: 12 * TILE, y: 34 * TILE, label: 'Your House' },
    { type: 'furniture', x: 13 * TILE + 8, y: 36 * TILE + 8, label: 'Couch' },
  ];

  for (let i = 0; i < 40; i++) {
    const x = 2 + Math.floor(Math.random() * 20);
    const y = 2 + Math.floor(Math.random() * 14);
    if (cells[y][x].tile === 'grass') {
      objects.push({ type: 'tree', x: x * TILE, y: y * TILE });
    }
  }

  for (let i = 0; i < 18; i++) {
    objects.push({
      type: 'rock',
      x: (48 + Math.floor(Math.random() * 10)) * TILE,
      y: (46 + Math.floor(Math.random() * 8)) * TILE,
    });
  }

  for (let i = 0; i < 12; i++) {
    objects.push({
      type: 'crate',
      x: (10 + Math.floor(Math.random() * 14)) * TILE,
      y: (10 + Math.floor(Math.random() * 8)) * TILE,
    });
  }

  const npcs: NpcSpec[] = [
    {
      x: 32 * TILE,
      y: 24 * TILE,
      name: 'Vendor Vee',
      role: 'shop',
      lines: ['Weapons for sale. Press E to browse.', 'Guns and knives win spars.'],
    },
    {
      x: 46 * TILE,
      y: 24 * TILE,
      name: 'Job Bot',
      role: 'job',
      lines: ['Fish, mine, dig, trash, pizza, mushrooms, flowers, mail.', 'Walk to a job zone and press E.'],
    },
    {
      x: 36 * TILE,
      y: 26 * TILE,
      name: 'Guide G',
      role: 'guide',
      lines: [
        'WASD move, Space attack, Shift dash, E interact, 1 eat food, C chat, I inventory, H house, G gang.',
        'Safe plaza is no-PK. Spar and gang districts allow combat.',
      ],
    },
    {
      x: 64 * TILE,
      y: 14 * TILE,
      name: 'Spar Host',
      role: 'guide',
      lines: ['Welcome to the Spar Complex.', 'Challenge rivals here for practice kills.'],
    },
    {
      x: 64 * TILE,
      y: 42 * TILE,
      name: 'Capo Rex',
      role: 'gang',
      lines: ['Create or join a crew with G.', 'Hold this base. Allies cannot hurt each other.'],
    },
  ];

  const enemies: EnemySpec[] = [];
  for (let i = 0; i < 8; i++) {
    enemies.push({ x: (60 + Math.random() * 14) * TILE, y: (10 + Math.random() * 10) * TILE });
  }
  for (let i = 0; i < 10; i++) {
    enemies.push({ x: (60 + Math.random() * 14) * TILE, y: (38 + Math.random() * 12) * TILE });
  }

  return {
    cells,
    objects,
    npcs,
    enemies,
    spawn: { x: 36 * TILE, y: 26 * TILE },
    mailDrop: { x: 46 * TILE, y: 32 * TILE },
    pizzaStation: { x: 32 * TILE, y: 32 * TILE },
  };
}

export function tileAt(world: WorldData, wx: number, wy: number): WorldCell | null {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  return world.cells[ty][tx];
}
