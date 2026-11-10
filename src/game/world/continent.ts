import { MAP_H, MAP_W } from '../config';
import { DISTRICTS, districtAt, districtById, type DistrictId } from '../content/districts';
import type { TileKind, WorldCell } from '../world';

/**
 * Original continent: one landmass split by a river, plus outlying islands.
 * The silhouette is hand-placed and noisy. It is not traced from a game map.
 */

export const LANDMARKS = {
  keep: { x: 196, y: 214 },
  volcano: { x: 392, y: 48 },
  lighthouse: { x: 428, y: 168 },
  westIsle: { x: 52, y: 216 },
  fort: { x: 446, y: 232 },
} as const;

const BLOBS: { x: number; y: number; rx: number; ry: number; sign: number }[] = [
  { x: 165, y: 98, rx: 125, ry: 72, sign: 1 },
  { x: 220, y: 58, rx: 78, ry: 42, sign: 1 },
  { x: 318, y: 112, rx: 108, ry: 68, sign: 1 },
  { x: 378, y: 58, rx: 58, ry: 36, sign: 1 },
  { x: 190, y: 168, rx: 58, ry: 50, sign: 1 },
  { x: 312, y: 182, rx: 58, ry: 44, sign: 1 },
  { x: 118, y: 154, rx: 26, ry: 32, sign: -0.8 },
  { x: 72, y: 108, rx: 20, ry: 24, sign: -0.65 },
  { x: 348, y: 156, rx: 18, ry: 24, sign: -0.5 },
];

const BRIDGES = [
  { x0: 236, x1: 270, y0: 66, y1: 74 },
  { x0: 236, x1: 270, y0: 144, y1: 154 },
];

const TOWNS: DistrictId[] = [
  'downtown',
  'southridge',
  'harbour',
  'hotel_row',
  'fashion_mall',
  'auction',
  'mercy_west',
  'mercy_east',
  'car_row',
  'gun_row',
  'cave_coast',
  'event_house',
  'pirate_zone',
  'guerre',
  'neo',
  'gz',
  'tachi',
  'mafia',
  'lethal',
  'blackholst',
  'bbz',
  'box_factory',
  'bank',
];

function hash2(x: number, y: number): number {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const v00 = hash2(x0, y0);
  const v10 = hash2(x0 + 1, y0);
  const v01 = hash2(x0, y0 + 1);
  const v11 = hash2(x0 + 1, y0 + 1);
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * ty;
}

function fbm(x: number, y: number): number {
  let v = 0;
  let a = 0.55;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * valueNoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return v;
}

function gauss(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return Math.exp(-(dx * dx + dy * dy) * 1.15);
}

function fieldAt(x: number, y: number): number {
  let s = 0;
  for (const b of BLOBS) s += b.sign * gauss(x, y, b.x, b.y, b.rx, b.ry);
  s += (fbm(x / 13, y / 13) - 0.5) * 0.36;
  s += (fbm(x / 34, y / 34) - 0.5) * 0.16;
  return s;
}

function riverCenter(y: number): number {
  return 252 + Math.sin(y * 0.045) * 4;
}

function inRiver(x: number, y: number): boolean {
  if (y < 16 || y > 232) return false;
  const half = y > 176 ? 7 : 5;
  return Math.abs(x - riverCenter(y)) < half;
}

function inLake(x: number, y: number): boolean {
  const dx = (x - 252) / 24;
  const dy = (y - 48) / 15;
  return dx * dx + dy * dy <= 1;
}

function inKeepIsland(x: number, y: number): boolean {
  const dx = (x - 252) / 8;
  const dy = (y - 48) / 5;
  return dx * dx + dy * dy <= 1;
}

function onBridge(x: number, y: number): boolean {
  return BRIDGES.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
}

function makeCell(x: number): WorldCell {
  return {
    tile: 'water',
    blocked: true,
    dig: false,
    zone: 'wilderness',
    noPk: true,
    region: x >= 270 ? 'southridge' : 'northridge',
  };
}

function landRegion(x: number): WorldCell['region'] {
  return x >= 270 ? 'southridge' : 'northridge';
}

export function buildContinent(): WorldCell[][] {
  const cells: WorldCell[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: WorldCell[] = [];
    for (let x = 0; x < MAP_W; x++) row.push(makeCell(x));
    cells.push(row);
  }

  const at = (x: number, y: number): WorldCell | null => cells[y]?.[x] ?? null;

  const setLand = (x: number, y: number, tile: TileKind, blocked = false) => {
    const c = at(x, y);
    if (!c) return;
    c.tile = tile;
    c.blocked = blocked;
    c.noPk = false;
    c.zone = 'wilderness';
    c.region = landRegion(x);
    c.stamp = undefined;
    c.dig = false;
  };

  const setWater = (x: number, y: number, region: WorldCell['region'] = 'channel') => {
    const c = at(x, y);
    if (!c) return;
    c.tile = 'water';
    c.blocked = true;
    c.noPk = true;
    c.zone = 'wilderness';
    c.region = region;
    c.stamp = undefined;
    c.dig = false;
  };

  const setBridge = (x: number, y: number) => {
    const c = at(x, y);
    if (!c) return;
    c.tile = 'bridge';
    c.blocked = false;
    c.noPk = true;
    c.zone = 'bridge';
    c.region = 'channel';
    c.stamp = undefined;
    c.dig = false;
  };

  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (fieldAt(x, y) > 0.4) setLand(x, y, 'grass');
    }
  }

  ensureIsland(52, 216, 34, 24);
  ensureIsland(28, 188, 12, 10);
  ensureIsland(96, 240, 16, 12);
  ensureIsland(34, 146, 12, 18);
  ensureIsland(22, 36, 14, 10);
  ensureIsland(26, 72, 11, 9);
  ensureIsland(LANDMARKS.lighthouse.x, LANDMARKS.lighthouse.y, 12, 15);
  ensureIsland(LANDMARKS.fort.x, LANDMARKS.fort.y, 20, 14);
  ensureIsland(472, 96, 14, 11);
  ensureIsland(468, 146, 10, 12);
  ensureIsland(LANDMARKS.keep.x, LANDMARKS.keep.y, 16, 12);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (inKeepIsland(x, y)) {
        setLand(x, y, 'grass');
        continue;
      }
      if ((inLake(x, y) || inRiver(x, y)) && !onBridge(x, y)) setWater(x, y, 'channel');
    }
  }

  for (const b of BRIDGES) {
    for (let y = b.y0; y < b.y1; y++) {
      for (let x = b.x0; x < b.x1; x++) setBridge(x, y);
    }
  }
  for (let x = 228; x <= 246; x++) {
    for (let y = 46; y <= 50; y++) setBridge(x, y);
  }

  for (const d of DISTRICTS) {
    for (let y = d.y; y < d.y + d.h; y++) {
      for (let x = d.x; x < d.x + d.w; x++) {
        if (d.id === 'bridge') continue;
        const c = at(x, y);
        if (!c) continue;
        if (c.tile === 'water') setLand(x, y, 'grass');
      }
    }
  }

  const ordered = [...DISTRICTS].sort((a, b) => b.w * b.h - a.w * a.h);
  for (const d of ordered) {
    for (let y = d.y; y < d.y + d.h; y++) {
      for (let x = d.x; x < d.x + d.w; x++) {
        const c = at(x, y);
        if (!c) continue;
        c.tile = d.id === 'bridge' ? 'bridge' : d.gangBase ? gangTile(d, x, y) : d.id === 'south_mines' ? mineTile(d, x, y) : surfaceFor(d.id);
        c.blocked = false;
        c.noPk = d.id === 'bridge' ? true : !!d.noPk;
        c.zone = d.id;
        c.region = d.region;
        c.stamp = d.id === 'south_mines' && c.tile === 'grass' && hash2(x, y) < 0.28 ? 'rock' : undefined;
        c.dig = false;
      }
    }
  }

  openShore('mercy_beach', 8);
  openShore('south_beach', 8);
  paintKeep();
  paintVolcano();
  paintFort();
  paintLighthouse();
  paveNetwork();
  carveStreets();
  stampHouses();
  paveIslePath();
  scatterCottages();
  scatterSnow();
  paintBeaches();
  growForest();
  sprayIslets();
  paintPiers();
  foamShores();
  markDig();

  return cells;

  function ensureIsland(cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        if (x < 1 || y < 1 || x >= MAP_W - 1 || y >= MAP_H - 1) continue;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        if (d2 > 0.78 && hash2(x, y) > 0.55) continue;
        const c = at(x, y);
        if (!c || (c.tile !== 'water' && c.tile !== 'shore')) continue;
        setLand(x, y, 'grass');
      }
    }
  }

  function openShore(id: DistrictId, rows: number) {
    const d = districtById(id);
    for (let y = d.y + d.h; y < d.y + d.h + rows && y < MAP_H - 1; y++) {
      for (let x = d.x; x < d.x + d.w; x++) {
        if (id === 'mercy_beach' && x >= 190 && x <= 202) continue;
        setWater(x, y, 'northridge');
      }
    }
  }

  function paintKeep() {
    const { x: cx, y: cy } = LANDMARKS.keep;
    for (let y = cy - 8; y <= cy + 8; y++) {
      for (let x = cx - 10; x <= cx + 10; x++) {
        const c = at(x, y);
        if (!c) continue;
        const edge = x === cx - 10 || x === cx + 10 || y === cy - 8 || y === cy + 8;
        const gate = y === cy - 8 && x >= cx - 2 && x <= cx + 2;
        c.tile = 'stone';
        c.blocked = edge && !gate;
        c.noPk = true;
        c.zone = 'wilderness';
        c.region = 'northridge';
        c.stamp = undefined;
      }
    }
    for (let y = 200; y <= cy - 8; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        const c = at(x, y);
        if (!c || c.tile === 'stone') continue;
        c.tile = 'sand';
        c.blocked = false;
        c.noPk = true;
        c.zone = 'mercy_beach';
        c.region = 'northridge';
      }
    }
  }

  function paintVolcano() {
    const { x: cx, y: cy } = LANDMARKS.volcano;
    for (let y = cy - 18; y <= cy + 16; y++) {
      for (let x = cx - 20; x <= cx + 20; x++) {
        const dx = (x - cx) / 18;
        const dy = (y - cy) / 14;
        const d = Math.hypot(dx, dy);
        if (d > 1.05) continue;
        const c = at(x, y);
        if (!c) continue;
        if (d < 0.34) {
          c.tile = 'lava';
          c.blocked = true;
        } else if (d < 0.62) {
          c.tile = 'mine';
          c.blocked = false;
          c.stamp = hash2(x, y) < 0.35 ? 'rock' : undefined;
        } else if (c.tile === 'water' || c.tile === 'shore') {
          setLand(x, y, 'grass');
          continue;
        } else {
          c.tile = 'grass';
          c.blocked = false;
        }
        c.noPk = false;
        c.zone = 'wilderness';
        c.region = 'southridge';
        c.dig = false;
      }
    }
  }

  function paintFort() {
    const { x: cx, y: cy } = LANDMARKS.fort;
    for (let y = cy - 6; y <= cy + 6; y++) {
      for (let x = cx - 8; x <= cx + 8; x++) {
        const c = at(x, y);
        if (!c) continue;
        const edge = x === cx - 8 || x === cx + 8 || y === cy - 6 || y === cy + 6;
        const gate = y === cy + 6 && x >= cx - 1 && x <= cx + 1;
        c.tile = edge ? 'stone' : 'sidewalk';
        c.blocked = edge && !gate;
        c.noPk = false;
        c.zone = 'wilderness';
        c.region = 'southridge';
        c.stamp = undefined;
      }
    }
  }

  function paintLighthouse() {
    const { x: cx, y: cy } = LANDMARKS.lighthouse;
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        const c = at(x, y);
        if (!c) continue;
        c.tile = 'stone';
        c.blocked = false;
        c.noPk = true;
        c.zone = 'wilderness';
        c.region = 'southridge';
        c.stamp = undefined;
      }
    }
  }

  function pave(x: number, y: number) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const tx = x + dx;
        const c = at(tx, y + dy);
        if (!c) continue;
        if (c.tile === 'lava' || c.tile === 'bridge' || c.tile === 'stone') continue;
        if ((c.tile === 'water' || c.tile === 'shore') && tx >= 230 && tx <= 274) continue;
        if (c.tile === 'water' || c.tile === 'shore') {
          c.tile = 'bridge';
          c.blocked = false;
          c.noPk = true;
          c.stamp = undefined;
          continue;
        }
        if (c.zone === 'mercy_beach' || c.zone === 'south_beach') continue;
        c.tile = 'path';
        c.blocked = false;
        c.stamp = undefined;
      }
    }
  }

  function stampRoad(a: { x: number; y: number }, b: { x: number; y: number }, wobble: number) {
    const steps = Math.max(1, Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wx = wobble ? Math.round(Math.sin(t * 8 + a.x * 0.2) * wobble) : 0;
      const wy = wobble ? Math.round(Math.cos(t * 6 + a.y * 0.2) * wobble * 0.55) : 0;
      const x = Math.round(a.x + (b.x - a.x) * t) + wx;
      const y = Math.round(a.y + (b.y - a.y) * t) + wy;
      pave(x, y);
    }
  }

  function center(id: DistrictId): { x: number; y: number } {
    const d = districtById(id);
    return { x: d.x + Math.floor(d.w / 2), y: d.y + Math.floor(d.h / 2) };
  }

  function connect(a: DistrictId, b: DistrictId) {
    const A = center(a);
    const B = center(b);
    const crosses = (A.x < 236 && B.x > 270) || (B.x < 236 && A.x > 270);
    if (crosses) {
      const bridgeY = (A.y + B.y) / 2 < 110 ? 70 : 148;
      stampRoad(A, { x: 252, y: bridgeY }, 0);
      stampRoad({ x: 252, y: bridgeY }, B, 0);
      return;
    }
    stampRoad(A, B, 2);
  }

  function paveNetwork() {
    const links: [DistrictId, DistrictId][] = [
      ['airport', 'parkland'],
      ['parkland', 'snow_resort'],
      ['parkland', 'skate_park'],
      ['airport', 'water_park'],
      ['water_park', 'spar_complex'],
      ['skate_park', 'mafia'],
      ['mafia', 'lethal'],
      ['lethal', 'tachi'],
      ['tachi', 'fashion_mall'],
      ['spar_complex', 'power_plant'],
      ['spar_complex', 'gz'],
      ['gz', 'hotel_row'],
      ['hotel_row', 'car_row'],
      ['fashion_mall', 'event_house'],
      ['event_house', 'downtown'],
      ['car_row', 'downtown'],
      ['auction', 'gun_row'],
      ['gun_row', 'downtown'],
      ['bbz', 'auction'],
      ['mercy_west', 'blackholst'],
      ['blackholst', 'downtown'],
      ['downtown', 'harbour'],
      ['harbour', 'subway'],
      ['downtown', 'bank'],
      ['mercy_east', 'bank'],
      ['downtown', 'southridge'],
      ['tachi', 'south_mines'],
      ['south_mines', 'cave_coast'],
      ['cave_coast', 'southridge'],
      ['southridge', 'pirate_zone'],
      ['pirate_zone', 'guerre'],
      ['pirate_zone', 'neo'],
      ['neo', 'south_beach'],
      ['guerre', 'south_beach'],
    ];
    for (const [a, b] of links) connect(a, b);
    const mines = center('south_mines');
    stampRoad(mines, { x: LANDMARKS.volcano.x, y: LANDMARKS.volcano.y + 10 }, 3);
    stampRoad({ x: LANDMARKS.volcano.x, y: LANDMARKS.volcano.y + 10 }, { x: 450, y: 90 }, 2);
  }

  function carveStreets() {
    for (const d of DISTRICTS) {
      if (d.id === 'bridge' || d.id === 'mercy_beach' || d.id === 'south_beach') continue;
      const midY = d.y + Math.floor(d.h / 2);
      const midX = d.x + Math.floor(d.w / 2);
      const tile: TileKind = d.noPk ? 'sidewalk' : 'road';
      for (let x = d.x + 1; x < d.x + d.w - 1; x++) setStreet(x, midY, tile, d);
      for (let x = d.x + 1; x < d.x + d.w - 1; x++) setStreet(x, Math.min(d.y + d.h - 2, midY + 1), tile, d);
      for (let y = d.y + 1; y < d.y + d.h - 1; y++) setStreet(midX, y, tile, d);
      for (let y = d.y + 1; y < d.y + d.h - 1; y++) setStreet(Math.min(d.x + d.w - 2, midX + 1), y, tile, d);
    }
  }

  function setStreet(x: number, y: number, tile: TileKind, d: { id: DistrictId; noPk?: boolean; region: WorldCell['region'] }) {
    const owner = districtAt(x, y);
    if (owner && owner.id !== d.id) return;
    const c = at(x, y);
    if (!c || c.tile === 'water' || c.tile === 'stone' || c.tile === 'lava') return;
    c.tile = tile;
    c.blocked = false;
    c.stamp = undefined;
    c.zone = d.id;
    c.noPk = !!d.noPk;
    c.region = d.region;
  }

  function putHouse(x: number, y: number): boolean {
    const spots = [at(x, y), at(x + 1, y), at(x, y + 1), at(x + 1, y + 1)];
    if (spots.some((c) => !c)) return false;
    for (const c of spots) {
      if (!c) return false;
      if (c.blocked || c.tile === 'water' || c.tile === 'shore' || c.tile === 'sand' || c.tile === 'stone' || c.tile === 'lava' || c.tile === 'bridge' || c.tile === 'path' || c.tile === 'road' || c.tile === 'sidewalk' || c.tile === 'roof') {
        return false;
      }
    }
    if ([0, 1, 2, 3].some((i) => districtAt(x + (i % 2), y + Math.floor(i / 2))?.id === 'start_park')) return false;
    for (let i = 0; i < 4; i++) {
      const c = spots[i];
      if (!c) return false;
      c.tile = 'roof';
      c.blocked = true;
      c.stamp = undefined;
    }
    return true;
  }

  function stampHouses() {
    for (const id of TOWNS) {
      const d = districtById(id);
      for (let y = d.y + 2; y < d.y + d.h - 3; y += 6) {
        for (let x = d.x + 2; x < d.x + d.w - 3; x += 6) putHouse(x, y);
      }
    }
  }

  function scatterCottages() {
    let placed = 0;
    for (let y = 4; y < MAP_H - 4 && placed < 110; y++) {
      for (let x = 4; x < MAP_W - 4 && placed < 110; x++) {
        if (cells[y][x].tile !== 'path' || hash2(x, y) > 0.04) continue;
        const hx = x + (hash2(y, x) < 0.5 ? -4 : 3);
        const hy = y - 3;
        if (putHouse(hx, hy)) placed += 1;
      }
    }
  }

  function paveIslePath() {
    const { x, y } = LANDMARKS.westIsle;
    stampRoad({ x: x - 8, y }, { x: x + 10, y }, 0);
    putHouse(x - 4, y - 4);
    putHouse(x + 2, y - 5);
    putHouse(x - 3, y + 2);
  }

  function scatterSnow() {
    const snow = districtById('snow_resort');
    for (let y = snow.y - 8; y < snow.y + snow.h + 8; y++) {
      for (let x = snow.x - 10; x < snow.x + snow.w + 10; x++) {
        const c = at(x, y);
        if (!c || c.tile !== 'grass' || c.zone !== 'wilderness') continue;
        if (hash2(x, y) > 0.32) c.tile = 'snow';
      }
    }
  }

  function paintBeaches() {
    for (let y = 1; y < MAP_H - 2; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        const c = cells[y][x];
        if (c.zone !== 'wilderness' || c.tile !== 'grass' || c.blocked) continue;
        const south = cells[y + 1][x];
        if ((south.tile === 'water' || south.tile === 'shore') && hash2(x, y) < 0.72) {
          c.tile = 'sand';
          c.blocked = false;
        }
      }
    }
  }

  function growForest() {
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        const c = cells[y][x];
        if (c.tile !== 'grass' || c.zone !== 'wilderness') continue;
        if (nearClearing(x, y)) continue;
        c.tile = 'forest';
        const h = hash2(x, y);
        if (h < 0.58) c.stamp = 'tree';
        if (h < 0.08) c.blocked = true;
      }
    }
  }

  function nearClearing(x: number, y: number): boolean {
    for (const d of DISTRICTS) {
      if (x >= d.x - 5 && y >= d.y - 5 && x < d.x + d.w + 5 && y < d.y + d.h + 5) return true;
    }
    for (let dy = -2; dy <= 2; dy++) {
      const row = cells[y + dy];
      if (!row) continue;
      for (let dx = -2; dx <= 2; dx++) {
        const t = row[x + dx]?.tile;
        if (t === 'path' || t === 'road' || t === 'sidewalk' || t === 'bridge' || t === 'sand' || t === 'stone' || t === 'roof') return true;
      }
    }
    return false;
  }

  function sprayIslets() {
    for (let i = 0; i < 42; i++) {
      const x = 4 + Math.floor(hash2(i, 21) * (MAP_W - 8));
      const y = 4 + Math.floor(hash2(i, 33) * (MAP_H - 8));
      let open = true;
      for (let dy = -3; dy <= 3 && open; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (cells[y + dy]?.[x + dx]?.tile !== 'water') open = false;
        }
      }
      if (!open) continue;
      const c = cells[y][x];
      const rock = hash2(i, 8) > 0.45;
      c.tile = rock ? 'stone' : 'grass';
      c.blocked = rock;
      c.noPk = true;
      c.zone = 'wilderness';
    }
  }

  function paintPiers() {
    const beach = districtById('mercy_beach');
    pier(beach.x + 14, beach.y + beach.h, 8, 0, 1);
    const south = districtById('south_beach');
    pier(south.x + 18, south.y + south.h, 7, 0, 1);
    pier(LANDMARKS.westIsle.x + 14, LANDMARKS.westIsle.y, 8, 1, 0);
    pier(LANDMARKS.lighthouse.x, LANDMARKS.lighthouse.y + 8, 6, 0, 1);
  }

  function pier(x: number, y: number, len: number, dx: number, dy: number) {
    for (let i = 0; i < len; i++) {
      const c = at(x + dx * i, y + dy * i);
      if (!c || c.tile === 'stone' || c.tile === 'lava') continue;
      c.tile = 'bridge';
      c.blocked = false;
      c.noPk = true;
      c.stamp = undefined;
    }
  }

  function foamShores() {
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        const c = cells[y][x];
        if (c.tile !== 'water') continue;
        let land = false;
        for (let dy = -1; dy <= 1 && !land; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const t = cells[y + dy][x + dx].tile;
            if (t !== 'water' && t !== 'shore') land = true;
          }
        }
        if (land) {
          c.tile = 'shore';
          c.blocked = true;
        }
      }
    }
  }

  function markDig() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const c = cells[y][x];
        c.dig = !c.blocked && c.tile === 'sand' && (c.zone === 'mercy_beach' || c.zone === 'south_beach');
      }
    }
  }
}

function gangTile(d: { x: number; y: number; w: number; h: number }, x: number, y: number): TileKind {
  const inset = x > d.x + 2 && y > d.y + 2 && x < d.x + d.w - 3 && y < d.y + d.h - 3;
  return inset ? 'pk' : 'grass';
}

function mineTile(d: { x: number; y: number; w: number; h: number }, x: number, y: number): TileKind {
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  return Math.hypot(x - cx, y - cy) < 7 ? 'mine' : 'grass';
}

function surfaceFor(id: DistrictId): TileKind {
  switch (id) {
    case 'start_park':
    case 'subway':
      return 'sidewalk';
    case 'snow_resort':
      return 'snow';
    case 'mercy_beach':
    case 'south_beach':
      return 'sand';
    case 'bridge':
      return 'bridge';
    case 'south_mines':
      return 'mine';
    default:
      return 'grass';
  }
}
