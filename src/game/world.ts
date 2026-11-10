import { MAP_H, MAP_W, TILE } from './config';
import { districtAt, districtById, type DistrictId } from './content/districts';
import { LANDMARKS, buildContinent } from './world/continent';

export type TileKind =
  | 'grass'
  | 'forest'
  | 'path'
  | 'road'
  | 'sidewalk'
  | 'water'
  | 'shore'
  | 'sand'
  | 'pk'
  | 'safe'
  | 'spar'
  | 'gang'
  | 'snow'
  | 'bridge'
  | 'mine'
  | 'roof'
  | 'lava'
  | 'stone';

export type ZoneId = DistrictId | 'wilderness';

export interface WorldCell {
  tile: TileKind;
  blocked: boolean;
  /** Sand mask for Mercy Beach and Southridge Beach only. Not inferred from pixel color. */
  dig: boolean;
  zone: ZoneId;
  noPk: boolean;
  region: 'northridge' | 'southridge' | 'channel';
  /** Extra sprite painted onto the ground canvas. Not a physics body. */
  stamp?: 'tree' | 'rock';
}

export interface WorldObjectSpec {
  type: 'building' | 'shop' | 'house' | 'tree' | 'rock' | 'crate' | 'furniture';
  x: number;
  y: number;
  label?: string;
  /** Wall footprint in pixels. The roof image may be larger and must not collide. */
  footprintW?: number;
  footprintH?: number;
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

interface BuildingSpot {
  tx: number;
  ty: number;
  type: WorldObjectSpec['type'];
  label: string;
}

export function createWorld(): WorldData {
  const cells = buildContinent();
  const objects: WorldObjectSpec[] = [];

  const place = (spot: BuildingSpot) => {
    const tx = spot.tx;
    const ty = spot.ty;
    objects.push({
      type: spot.type,
      x: tx * TILE,
      y: ty * TILE,
      label: spot.label,
      footprintW: 46,
      footprintH: 26,
    });
    for (let y = ty - 1; y <= ty + 2; y++) {
      for (let x = tx - 1; x <= tx + 2; x++) {
        const cell = cells[y]?.[x];
        if (!cell || cell.tile !== 'roof') continue;
        cell.tile = cell.zone === 'mercy_beach' || cell.zone === 'south_beach' ? 'sand' : 'sidewalk';
        cell.blocked = false;
        cell.stamp = undefined;
      }
    }
  };

  const atDistrict = (id: DistrictId, ox: number, oy: number, type: WorldObjectSpec['type'], label: string) => {
    const d = districtById(id);
    place({ tx: d.x + ox, ty: d.y + oy, type, label });
  };

  atDistrict('start_park', 4, 3, 'shop', 'Starter Area Kiosk');
  atDistrict('start_park', 16, 8, 'house', 'Player Starter Flat');
  atDistrict('gun_row', 4, 3, 'shop', 'Gun Point');
  atDistrict('fashion_mall', 6, 3, 'shop', 'Fashion Mall');
  atDistrict('car_row', 4, 3, 'shop', 'Rico Motors');
  atDistrict('hotel_row', 6, 3, 'building', 'Era Hotel');
  atDistrict('downtown', 8, 22, 'building', "Speedy's Pizza");
  atDistrict('downtown', 30, 8, 'building', 'FoodMart');
  atDistrict('downtown', 10, 8, 'building', 'Police Station');
  atDistrict('auction', 6, 4, 'building', 'Auction House');
  atDistrict('bank', 4, 4, 'building', 'Era Bank');
  atDistrict('box_factory', 4, 4, 'building', 'Box Factory Zone');
  atDistrict('mercy_west', 6, 4, 'building', 'Mercy West');
  atDistrict('mercy_east', 4, 4, 'building', 'Mercy East');
  atDistrict('event_house', 6, 4, 'building', 'Event House');
  atDistrict('spar_complex', 8, 4, 'building', 'Spar Complex');
  atDistrict('airport', 8, 4, 'building', 'Airport Terminal');
  atDistrict('snow_resort', 10, 4, 'building', 'Snow Lodge');
  atDistrict('water_park', 6, 4, 'building', 'Water Park');
  atDistrict('power_plant', 6, 4, 'building', 'Power Plant');
  atDistrict('skate_park', 6, 4, 'building', 'Skate Arena');
  atDistrict('mercy_beach', 8, 4, 'shop', 'Isra Shell Shack');
  atDistrict('mercy_beach', 28, 6, 'shop', 'Bell Shell Shack');
  atDistrict('mercy_beach', 48, 4, 'shop', "Wandi's Crab Shack");
  atDistrict('gz', 4, 4, 'building', 'GZ Shop');
  atDistrict('blackholst', 4, 4, 'building', 'BH Pizzeria');
  atDistrict('bbz', 4, 4, 'building', 'BBZ Mines');
  atDistrict('south_hospital', 4, 4, 'building', 'Southridge Hospital');
  atDistrict('southridge', 26, 8, 'building', 'Southridge Pizza');
  atDistrict('south_mines', 8, 8, 'building', 'South Mines');
  atDistrict('pirate_zone', 6, 4, 'building', 'Pirate Zone HQ');
  atDistrict('guerre', 6, 4, 'building', 'Guerre Base');
  atDistrict('neo', 6, 4, 'building', 'Neo Base');
  atDistrict('cave_coast', 6, 4, 'building', 'Cave Entrance');
  atDistrict('south_beach', 12, 4, 'shop', 'South Shell Counter');
  place({ tx: LANDMARKS.keep.x, ty: LANDMARKS.keep.y, type: 'building', label: 'South Keep' });
  place({ tx: LANDMARKS.lighthouse.x, ty: LANDMARKS.lighthouse.y, type: 'building', label: 'Lighthouse' });
  place({ tx: LANDMARKS.fort.x, ty: LANDMARKS.fort.y, type: 'building', label: 'South Fort' });
  place({ tx: LANDMARKS.westIsle.x - 2, ty: LANDMARKS.westIsle.y - 1, type: 'house', label: 'Isle Inn' });

  const start = districtById('start_park');
  const sx = start.x + Math.floor(start.w / 2);
  const sy = start.y + Math.floor(start.h / 2);
  for (let y = sy - 2; y <= sy + 2; y++) {
    for (let x = sx - 2; x <= sx + 2; x++) {
      const cell = cells[y]?.[x];
      if (!cell) continue;
      cell.tile = 'sidewalk';
      cell.blocked = false;
      cell.noPk = true;
      cell.zone = 'start_park';
      cell.region = 'northridge';
      cell.dig = false;
      cell.stamp = undefined;
    }
  }

  const stand = (tx: number, ty: number) => {
    const cell = cells[ty]?.[tx];
    if (!cell) return;
    if (cell.tile === 'water' || cell.tile === 'shore' || cell.tile === 'lava' || cell.tile === 'roof') {
      cell.tile = 'sidewalk';
    }
    cell.blocked = false;
    cell.dig = false;
  };

  const downtown = districtById('downtown');
  const harbour = districtById('harbour');
  const south = districtById('southridge');
  const mines = districtById('south_mines');
  const cars = districtById('car_row');
  const subway = districtById('subway');
  const airport = districtById('airport');
  const spar = districtById('spar_complex');
  const southBeach = districtById('south_beach');

  const pads = [
    { x: subway.x + 6, y: subway.y + 3, label: 'Subway → Southridge', toX: south.x + 12, toY: south.y + 18 },
    { x: south.x + 12, y: south.y + 18, label: 'Subway → Starter Area', toX: subway.x + 6, toY: subway.y + 3 },
    { x: airport.x + 8, y: airport.y + 8, label: 'Shuttle → Spar', toX: spar.x + 10, toY: spar.y + 8 },
    { x: spar.x + 10, y: spar.y + 8, label: 'Shuttle → Airport', toX: airport.x + 8, toY: airport.y + 8 },
    { x: harbour.x + 10, y: harbour.y + 6, label: 'Boat → West Isle', toX: LANDMARKS.westIsle.x, toY: LANDMARKS.westIsle.y },
    { x: LANDMARKS.westIsle.x, y: LANDMARKS.westIsle.y, label: 'Boat → Harbour', toX: harbour.x + 10, toY: harbour.y + 6 },
    { x: southBeach.x + 10, y: southBeach.y + 6, label: 'Boat → South Fort', toX: LANDMARKS.fort.x, toY: LANDMARKS.fort.y },
    { x: LANDMARKS.fort.x, y: LANDMARKS.fort.y, label: 'Boat → South Beach', toX: southBeach.x + 10, toY: southBeach.y + 6 },
  ];
  for (const pad of pads) {
    stand(pad.x, pad.y);
    stand(pad.toX, pad.toY);
  }
  stand(sx, sy);

  const spawnCell = cells[sy]?.[sx];
  if (!spawnCell || spawnCell.blocked || spawnCell.tile === 'sand' || spawnCell.tile === 'water') {
    throw new Error(`Starter Area spawn is not a sidewalk (${sx},${sy} ${spawnCell?.tile ?? 'missing'})`);
  }

  return {
    cells,
    objects,
    labels: [
      { x: 150 * TILE, y: 16 * TILE, text: 'NORTHRIDGE', color: '#d7ffe8' },
      { x: 340 * TILE, y: 78 * TILE, text: 'SOUTHRIDGE', color: '#d6ecff' },
      { x: sx * TILE, y: (start.y - 2) * TILE, text: 'STARTER AREA', color: '#e7fff2' },
      { x: 190 * TILE, y: 182 * TILE, text: 'MERCY BEACH', color: '#ffe7b8' },
      { x: 306 * TILE, y: 194 * TILE, text: 'SOUTH BEACH', color: '#ffe7b8' },
      { x: LANDMARKS.volcano.x * TILE, y: (LANDMARKS.volcano.y - 16) * TILE, text: 'VOLCANO', color: '#ffb0a0' },
    ],
    spawn: { x: sx * TILE + 8, y: sy * TILE + 8 },
    mailDrop: { x: (sx + 4) * TILE, y: sy * TILE },
    pizzaStation: { x: (downtown.x + 8) * TILE, y: (downtown.y + 22) * TILE },
    warpPads: pads,
    jobStations: [
      { id: 'trash-plaza', job: 'trash', x: (downtown.x + 8) * TILE, y: (downtown.y + 26) * TILE, label: 'Trash pile' },
      { id: 'trash-harbour', job: 'trash', x: (harbour.x + 18) * TILE, y: (harbour.y + 6) * TILE, label: 'Trash pile' },
      { id: 'trash-south', job: 'trash', x: (south.x + 8) * TILE, y: (south.y + 20) * TILE, label: 'Trash pile' },
      { id: 'mine-a', job: 'mining', x: (mines.x + 6) * TILE, y: (mines.y + 6) * TILE, label: 'Ore vein' },
      { id: 'mine-b', job: 'mining', x: (mines.x + 16) * TILE, y: (mines.y + 12) * TILE, label: 'Ore vein' },
      { id: 'mine-c', job: 'mining', x: (mines.x + 24) * TILE, y: (mines.y + 6) * TILE, label: 'Ore vein' },
      { id: 'garage', job: 'cars', x: (cars.x + 10) * TILE, y: (cars.y + 6) * TILE, label: 'Assembly bay' },
    ],
  };
}

export function isRestorablePosition(world: WorldData, wx: number, wy: number): boolean {
  const cell = tileAt(world, wx, wy);
  return !!cell && !cell.blocked;
}

/** Saved outdoor coordinates, or the Starter Area. Never a beach fallback. */
export function resolveStart(world: WorldData, wx?: number | null, wy?: number | null): { x: number; y: number } {
  if (typeof wx === 'number' && typeof wy === 'number' && isRestorablePosition(world, wx, wy)) {
    return { x: wx, y: wy };
  }
  return world.spawn;
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
  if (!cell) return 'Ocean';
  if (cell.tile === 'water' || cell.tile === 'shore') return 'Ocean';
  if (cell.region === 'northridge') return 'Northridge';
  if (cell.region === 'southridge') return 'Southridge';
  return 'Channel';
}
