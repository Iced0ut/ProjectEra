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
      const region = opts.region ?? (y < 118 ? 'northridge' : y < 134 ? 'channel' : 'southridge');
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
      const region = y < 118 ? 'northridge' : y < 134 ? 'channel' : 'southridge';
      // Default: ocean everywhere, then stamp landmasses
      cells[y][x] = { tile: 'water', blocked: true, zone: 'wilderness', noPk: true, region };
    }
  }

  // ---- Northridge landmass ----
  fillRect(cells, 4, 4, 152, 112, 'grass', 'parkland', { region: 'northridge' });

  // Major roads (Northridge grid)
  fillRect(cells, 4, 66, 152, 4, 'road', 'downtown', { region: 'northridge' });
  fillRect(cells, 4, 90, 152, 3, 'road', 'harbour', { region: 'northridge' });
  fillRect(cells, 76, 4, 4, 112, 'road', 'downtown', { region: 'northridge' });
  fillRect(cells, 40, 4, 3, 112, 'road', 'mercy_west', { region: 'northridge' });
  fillRect(cells, 116, 4, 3, 112, 'road', 'mercy_east', { region: 'northridge' });

  // District paints
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
  // Starter Area: urban plaza (sidewalk + safe grass) — never sand/beach tiles
  paintDistrict(cells, 'start_park', 'safe');
  fillRect(cells, 70, 72, 20, 14, 'sidewalk', 'start_park', { noPk: true, region: 'northridge' });
  fillRect(cells, 74, 75, 12, 8, 'safe', 'start_park', { noPk: true, region: 'northridge' });
  paintDistrict(cells, 'auction', 'safe');
  paintDistrict(cells, 'bank', 'gang');
  paintDistrict(cells, 'mercy_west', 'safe');
  paintDistrict(cells, 'mercy_east', 'safe');
  paintDistrict(cells, 'blackholst', 'gang');
  paintDistrict(cells, 'bbz', 'gang');
  paintDistrict(cells, 'subway', 'path');
  paintDistrict(cells, 'harbour', 'path');
  paintDistrict(cells, 'mercy_beach', 'sand');
  // Beach water edge
  fillRect(cells, 8, 112, 40, 4, 'water', 'mercy_beach', { blocked: true, noPk: true, region: 'northridge' });

  // ---- Channel / bridge ----
  fillRect(cells, 0, 116, MAP_W, 18, 'water', 'bridge', { blocked: true, noPk: true, region: 'channel' });
  // Bridge span
  fillRect(cells, 74, 116, 12, 18, 'bridge', 'bridge', { noPk: true, region: 'channel' });
  fillRect(cells, 76, 116, 8, 18, 'road', 'bridge', { noPk: true, region: 'channel' });

  // ---- Southridge island ----
  fillRect(cells, 18, 134, 124, 78, 'grass', 'southridge', { region: 'southridge' });
  // South roads
  fillRect(cells, 18, 158, 124, 3, 'road', 'southridge', { region: 'southridge' });
  fillRect(cells, 78, 134, 3, 78, 'road', 'southridge', { region: 'southridge' });

  paintDistrict(cells, 'southridge', 'safe');
  paintDistrict(cells, 'south_hospital', 'safe');
  paintDistrict(cells, 'south_mines', 'mine');
  paintDistrict(cells, 'pirate_zone', 'gang');
  paintDistrict(cells, 'guerre', 'gang');
  paintDistrict(cells, 'neo', 'gang');
  paintDistrict(cells, 'south_beach', 'sand');
  paintDistrict(cells, 'cave_coast', 'path');
  fillRect(cells, 55, 198, 40, 8, 'water', 'south_beach', { blocked: true, noPk: true, region: 'southridge' });

  // Re-stamp bridge ends onto land
  fillRect(cells, 74, 110, 12, 8, 'road', 'harbour', { noPk: true, region: 'northridge' });
  fillRect(cells, 74, 134, 12, 8, 'road', 'southridge', { noPk: true, region: 'southridge' });

  const objects: WorldObjectSpec[] = [];
  const addBuilding = (tx: number, ty: number, type: WorldObjectSpec['type'], label: string) => {
    objects.push({ type, x: tx * TILE, y: ty * TILE, label });
  };

  // Northridge landmarks
  addBuilding(78, 76, 'shop', 'Starter Area Kiosk');
  addBuilding(64, 60, 'shop', 'Gun Point');
  addBuilding(90, 58, 'shop', 'Fashion Mall');
  addBuilding(104, 66, 'shop', 'Rico Motors');
  addBuilding(72, 62, 'building', 'Era Hotel');
  addBuilding(70, 82, 'building', "Speedy's Pizza");
  addBuilding(84, 82, 'building', 'FoodMart');
  addBuilding(60, 78, 'building', 'Police Station');
  addBuilding(46, 80, 'building', 'Auction House');
  addBuilding(90, 80, 'building', 'City Bank');
  addBuilding(32, 74, 'building', 'Mercy West');
  addBuilding(112, 74, 'building', 'Mercy East');
  addBuilding(74, 42, 'building', 'Event House');
  addBuilding(118, 46, 'building', 'Spar Complex');
  addBuilding(16, 26, 'building', 'Airport Terminal');
  addBuilding(120, 14, 'building', 'Snow Lodge');
  addBuilding(24, 40, 'building', 'Water Park');
  addBuilding(134, 74, 'building', 'Power Plant');
  addBuilding(34, 52, 'building', 'Skate Arena');
  addBuilding(14, 100, 'shop', 'Isra Shell Shack');
  addBuilding(28, 102, 'shop', 'Bell Shell Shack');
  addBuilding(10, 104, 'shop', "Wandi's Crab Shack");
  addBuilding(18, 58, 'building', 'GZ Shop');
  addBuilding(22, 88, 'building', 'BH Pizzeria');
  addBuilding(124, 98, 'building', 'BBZ Mines');
  addBuilding(14, 34, 'house', 'Player Starter Flat');

  // Southridge landmarks
  addBuilding(78, 154, 'building', 'Southridge Hospital');
  addBuilding(86, 156, 'building', 'Southridge Pizza');
  addBuilding(36, 154, 'building', 'South Mines');
  addBuilding(110, 158, 'building', 'Pirate Zone HQ');
  addBuilding(46, 178, 'building', 'Guerre Base');
  addBuilding(100, 178, 'building', 'Neo Base');
  addBuilding(24, 180, 'building', 'Cave Entrance');
  addBuilding(70, 188, 'shop', 'South Shell Counter');

  // Light decor scatter (keep counts modest for load time)
  for (let i = 0; i < 48; i++) {
    const x = 6 + ((i * 37) % 148);
    const y = 6 + ((i * 53) % 100);
    if (cells[y][x].tile === 'grass') objects.push({ type: 'tree', x: x * TILE, y: y * TILE });
  }
  for (let i = 0; i < 24; i++) {
    const x = 25 + ((i * 19) % 100);
    const y = 140 + ((i * 23) % 50);
    if (cells[y]?.[x]?.tile === 'grass' || cells[y]?.[x]?.tile === 'mine') {
      objects.push({ type: 'rock', x: x * TILE, y: y * TILE });
    }
  }
  for (let i = 0; i < 12; i++) {
    objects.push({
      type: 'crate',
      x: (50 + (i % 6) * 2) * TILE,
      y: (58 + Math.floor(i / 6) * 2) * TILE,
    });
  }

  const labels: WorldLabel[] = DISTRICTS.map((d) => ({
    x: (d.x + d.w / 2) * TILE,
    y: (d.y + 1) * TILE,
    text: d.name.toUpperCase(),
    color: d.gangBase ? '#ff8a6a' : d.region === 'southridge' ? '#7ad0ff' : '#f0c14b',
  }));
  labels.push(
    { x: 80 * TILE, y: 8 * TILE, text: 'NORTHRIDGE', color: '#3ecf8e' },
    { x: 80 * TILE, y: 71 * TILE, text: 'STARTER AREA', color: '#3ecf8e' },
    { x: 80 * TILE, y: 140 * TILE, text: 'SOUTHRIDGE ISLAND', color: '#7ad0ff' },
    { x: 80 * TILE, y: 124 * TILE, text: 'BRIDGE', color: '#e8f0ff' },
  );

  return {
    cells,
    objects,
    labels,
    // Exact center of Starter Area plaza (never Mercy Beach / sand)
    spawn: { x: 80 * TILE, y: 79 * TILE },
    mailDrop: { x: 84 * TILE, y: 84 * TILE },
    pizzaStation: { x: 72 * TILE, y: 84 * TILE },
    warpPads: [
      { x: 78, y: 94, label: 'Subway → Southridge', toX: 78, toY: 148 },
      { x: 78, y: 148, label: 'Subway → Starter Area', toX: 80, toY: 79 },
      { x: 20, y: 28, label: 'Airport Shuttle → Spar', toX: 120, toY: 50 },
      { x: 120, y: 50, label: 'Spar Shuttle → Airport', toX: 20, toY: 28 },
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
