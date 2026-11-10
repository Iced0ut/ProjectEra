import { MAP_H, MAP_W, TILE } from './config';
import { DISTRICTS, districtAt, type DistrictId } from './content/districts';

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
  | 'gang'
  | 'snow'
  | 'bridge'
  | 'mine';

export type ZoneId = DistrictId | 'wilderness';

export interface WorldCell {
  tile: TileKind;
  blocked: boolean;
  zone: ZoneId;
  noPk: boolean;
  region: 'northridge' | 'southridge' | 'channel';
}

export interface WorldObjectSpec {
  type: 'building' | 'shop' | 'house' | 'tree' | 'rock' | 'crate' | 'furniture';
  x: number;
  y: number;
  label?: string;
}

export interface JobStation {
  id: string;
  job: 'trash' | 'mining' | 'cars';
  x: number;
  y: number;
  label: string;
}

export interface WorldLabel {
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface WorldData {
  cells: WorldCell[][];
  objects: WorldObjectSpec[];
  labels: WorldLabel[];
  spawn: { x: number; y: number };
  mailDrop: { x: number; y: number };
  pizzaStation: { x: number; y: number };
  warpPads: { x: number; y: number; label: string; toX: number; toY: number }[];
  jobStations: JobStation[];
}

function fillRect(
  cells: WorldCell[][],
  x0: number,
  y0: number,
  w: number,
  h: number,
  tile: TileKind,
  zone: ZoneId,
  opts: { blocked?: boolean; noPk?: boolean; region?: WorldCell['region'] } = {},
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      const region = opts.region ?? (x >= 112 ? 'southridge' : x >= 96 ? 'channel' : 'northridge');
      cells[y][x] = {
        tile,
        blocked: !!opts.blocked,
        zone,
        noPk: !!opts.noPk,
        region,
      };
    }
  }
}

function paintDistrict(cells: WorldCell[][], id: DistrictId, tile: TileKind, extras: { blocked?: boolean } = {}) {
  const d = DISTRICTS.find((x) => x.id === id);
  if (!d) return;
  fillRect(cells, d.x, d.y, d.w, d.h, tile, id, {
    noPk: !!d.noPk && !d.gangBase,
    blocked: extras.blocked,
    region: d.region === 'channel' ? 'channel' : d.region,
  });
  if (d.gangBase) {
    fillRect(cells, d.x + 2, d.y + 2, Math.max(4, d.w - 4), Math.max(4, d.h - 4), 'pk', id, {
      region: d.region === 'channel' ? 'channel' : d.region,
    });
    fillRect(cells, d.x, d.y, d.w, 2, 'gang', id, { region: d.region === 'channel' ? 'channel' : d.region });
  }
}

export function createWorld(): WorldData {
  const cells: WorldCell[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    cells[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      const region = x >= 112 ? 'southridge' : x >= 96 ? 'channel' : 'northridge';
      // Default: ocean everywhere, then stamp landmasses
      cells[y][x] = { tile: 'water', blocked: true, zone: 'wilderness', noPk: true, region };
    }
  }

  // West island = Northridge, east island = Southridge, strip between = channel.
  fillRect(cells, 1, 1, 94, 61, 'grass', 'parkland', { region: 'northridge' });
  fillRect(cells, 112, 1, 34, 61, 'grass', 'southridge', { region: 'southridge' });
  fillRect(cells, 96, 0, 16, MAP_H, 'water', 'bridge', { blocked: true, noPk: true, region: 'channel' });
  fillRect(cells, 98, 24, 12, 14, 'bridge', 'bridge', { noPk: true, region: 'channel' });
  fillRect(cells, 100, 26, 8, 10, 'road', 'bridge', { noPk: true, region: 'channel' });
  fillRect(cells, 90, 28, 8, 6, 'road', 'harbour', { noPk: true, region: 'northridge' });
  fillRect(cells, 110, 28, 8, 6, 'road', 'southridge', { noPk: true, region: 'southridge' });

  fillRect(cells, 2, 26, 92, 2, 'road', 'downtown', { region: 'northridge' });
  fillRect(cells, 46, 2, 2, 52, 'road', 'downtown', { region: 'northridge' });
  fillRect(cells, 112, 30, 34, 2, 'road', 'southridge', { region: 'southridge' });

  paintDistrict(cells, 'parkland', 'grass');
  paintDistrict(cells, 'airport', 'sidewalk');
  paintDistrict(cells, 'snow_resort', 'snow');
  paintDistrict(cells, 'water_park', 'path');
  paintDistrict(cells, 'power_plant', 'sidewalk');
  paintDistrict(cells, 'skate_park', 'path');
  paintDistrict(cells, 'mafia', 'gang');
  paintDistrict(cells, 'lethal', 'gang');
  paintDistrict(cells, 'event_house', 'safe');
  paintDistrict(cells, 'spar_complex', 'spar');
  paintDistrict(cells, 'tachi', 'gang');
  paintDistrict(cells, 'hotel_row', 'sidewalk');
  paintDistrict(cells, 'fashion_mall', 'sidewalk');
  paintDistrict(cells, 'gz', 'gang');
  paintDistrict(cells, 'gun_row', 'path');
  paintDistrict(cells, 'car_row', 'path');
  paintDistrict(cells, 'downtown', 'safe');
  paintDistrict(cells, 'start_park', 'sidewalk');
  fillRect(cells, 48, 43, 12, 6, 'safe', 'start_park', { noPk: true, region: 'northridge' });
  paintDistrict(cells, 'auction', 'safe');
  paintDistrict(cells, 'bank', 'gang');
  paintDistrict(cells, 'mercy_west', 'safe');
  paintDistrict(cells, 'mercy_east', 'safe');
  paintDistrict(cells, 'blackholst', 'gang');
  paintDistrict(cells, 'bbz', 'gang');
  paintDistrict(cells, 'subway', 'path');
  paintDistrict(cells, 'harbour', 'path');
  paintDistrict(cells, 'mercy_beach', 'sand');
  paintDistrict(cells, 'southridge', 'safe');
  paintDistrict(cells, 'south_hospital', 'safe');
  paintDistrict(cells, 'south_mines', 'mine');
  paintDistrict(cells, 'pirate_zone', 'gang');
  paintDistrict(cells, 'guerre', 'gang');
  paintDistrict(cells, 'neo', 'gang');
  paintDistrict(cells, 'south_beach', 'sand');
  paintDistrict(cells, 'cave_coast', 'path');

  const objects: WorldObjectSpec[] = [];
  const addBuilding = (tx: number, ty: number, type: WorldObjectSpec['type'], label: string) => {
    objects.push({ type, x: tx * TILE, y: ty * TILE, label });
  };

  addBuilding(52, 44, 'shop', 'Starter Area Kiosk');
  addBuilding(26, 44, 'shop', 'Gun Point');
  addBuilding(48, 30, 'shop', 'Fashion Mall');
  addBuilding(72, 42, 'shop', 'Rico Motors');
  addBuilding(30, 30, 'building', 'Era Hotel');
  addBuilding(50, 48, 'building', "Speedy's Pizza");
  addBuilding(58, 48, 'building', 'FoodMart');
  addBuilding(42, 44, 'building', 'Police Station');
  addBuilding(6, 44, 'building', 'Auction House');
  addBuilding(72, 57, 'building', 'City Bank');
  addBuilding(6, 56, 'building', 'Mercy West');
  addBuilding(74, 51, 'building', 'Mercy East');
  addBuilding(68, 30, 'building', 'Event House');
  addBuilding(6, 30, 'building', 'Spar Complex');
  addBuilding(6, 4, 'building', 'Airport Terminal');
  addBuilding(66, 4, 'building', 'Snow Lodge');
  addBuilding(4, 16, 'building', 'Water Park');
  addBuilding(86, 42, 'building', 'Power Plant');
  addBuilding(24, 16, 'building', 'Skate Arena');
  addBuilding(54, 56, 'shop', 'Isra Shell Shack');
  addBuilding(60, 56, 'shop', 'Bell Shell Shack');
  addBuilding(8, 58, 'shop', "Wandi's Crab Shack");
  addBuilding(84, 30, 'building', 'GZ Shop');
  addBuilding(24, 54, 'building', 'BH Pizzeria');
  addBuilding(86, 52, 'building', 'BBZ Mines');
  addBuilding(40, 30, 'house', 'Player Starter Flat');
  addBuilding(130, 8, 'building', 'Southridge Hospital');
  addBuilding(136, 10, 'building', 'Southridge Pizza');
  addBuilding(114, 18, 'building', 'South Mines');
  addBuilding(132, 18, 'building', 'Pirate Zone HQ');
  addBuilding(114, 34, 'building', 'Guerre Base');
  addBuilding(132, 34, 'building', 'Neo Base');
  addBuilding(114, 6, 'building', 'Cave Entrance');
  addBuilding(120, 52, 'shop', 'South Shell Counter');

  for (let i = 0; i < 40; i++) {
    const x = 2 + ((i * 17) % 90);
    const y = 2 + ((i * 13) % 58);
    if (cells[y]?.[x]?.tile === 'grass') objects.push({ type: 'tree', x: x * TILE, y: y * TILE });
  }
  for (let i = 0; i < 16; i++) {
    const x = 114 + ((i * 5) % 28);
    const y = 16 + ((i * 7) % 20);
    if (cells[y]?.[x]?.tile === 'grass' || cells[y]?.[x]?.tile === 'mine') {
      objects.push({ type: 'rock', x: x * TILE, y: y * TILE });
    }
  }
  for (let i = 0; i < 8; i++) {
    objects.push({
      type: 'crate',
      x: (26 + (i % 4) * 2) * TILE,
      y: (44 + Math.floor(i / 4) * 2) * TILE,
    });
  }

  const labels: WorldLabel[] = [
    { x: 48 * TILE, y: 4 * TILE, text: 'NORTHRIDGE', color: '#3ecf8e' },
    { x: 54 * TILE, y: 42 * TILE, text: 'STARTER AREA', color: '#3ecf8e' },
    { x: 128 * TILE, y: 4 * TILE, text: 'SOUTHRIDGE', color: '#7ad0ff' },
    { x: 104 * TILE, y: 24 * TILE, text: 'BRIDGE', color: '#e8f0ff' },
  ];

  return {
    cells,
    objects,
    labels,
    spawn: { x: 54 * TILE, y: 46 * TILE },
    mailDrop: { x: 58 * TILE, y: 46 * TILE },
    pizzaStation: { x: 50 * TILE, y: 48 * TILE },
    warpPads: [
      { x: 50, y: 36, label: 'Subway → Southridge', toX: 132, toY: 12 },
      { x: 132, y: 12, label: 'Subway → Starter Area', toX: 54, toY: 46 },
      { x: 8, y: 6, label: 'Airport Shuttle → Spar', toX: 8, toY: 32 },
      { x: 8, y: 32, label: 'Spar Shuttle → Airport', toX: 8, toY: 6 },
    ],
    jobStations: [
      { id: 'trash-plaza', job: 'trash', x: 42 * TILE, y: 48 * TILE, label: 'Trash pile' },
      { id: 'trash-downtown', job: 'trash', x: 62 * TILE, y: 46 * TILE, label: 'Trash pile' },
      { id: 'trash-harbour', job: 'trash', x: 40 * TILE, y: 56 * TILE, label: 'Trash pile' },
      { id: 'mine-a', job: 'mining', x: 116 * TILE, y: 20 * TILE, label: 'Ore vein' },
      { id: 'mine-b', job: 'mining', x: 120 * TILE, y: 24 * TILE, label: 'Ore vein' },
      { id: 'mine-c', job: 'mining', x: 114 * TILE, y: 22 * TILE, label: 'Ore vein' },
      { id: 'garage', job: 'cars', x: 74 * TILE, y: 44 * TILE, label: 'Assembly bay' },
    ],
  };
}

export function tileAt(world: WorldData, wx: number, wy: number): WorldCell | null {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  return world.cells[ty][tx];
}

export function districtNameAt(world: WorldData, wx: number, wy: number): string {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  const d = districtAt(tx, ty);
  if (d) return d.name;
  const cell = tileAt(world, wx, wy);
  if (!cell) return 'Void';
  if (cell.region === 'northridge') return 'Northridge';
  if (cell.region === 'southridge') return 'Southridge';
  return 'Channel';
}
