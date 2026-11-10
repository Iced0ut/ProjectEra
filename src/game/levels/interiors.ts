import Phaser from 'phaser';
import { LEVEL_TILES, TILE } from '../config';

/**
 * Each building opens a 64×64 level dressed for that shop or base.
 * Original rooms, not copied maps.
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

export interface InteriorProp {
  tx: number;
  ty: number;
  key: string;
  label?: string;
}

export interface FloorMark {
  tx: number;
  ty: number;
  tw: number;
  th: number;
  color: string;
}

export interface InteriorLevel {
  kind: InteriorKind;
  theme: string;
  title: string;
  size: number;
  blocked: boolean[][];
  marks: FloorMark[];
  spawnTx: number;
  spawnTy: number;
  exitTx: number;
  exitTy: number;
  noPk: boolean;
  props: InteriorProp[];
}

const THEME_KIND: Record<string, InteriorKind> = {
  kiosk: 'shop',
  guns: 'shop',
  fashion: 'shop',
  motors: 'shop',
  pizza: 'shop',
  market: 'shop',
  shells: 'shop',
  crabs: 'shop',
  house: 'house',
  hotel: 'hotel',
  police: 'hall',
  auction: 'hall',
  bank: 'gang',
  clinic: 'clinic',
  event: 'hall',
  spar: 'spar',
  airport: 'hall',
  snow: 'hotel',
  water: 'hall',
  power: 'mine',
  skate: 'hall',
  gang: 'gang',
  mine: 'mine',
  cave: 'cave',
  hall: 'hall',
};

const FLOOR: Record<string, [string, string]> = {
  kiosk: ['#d7c4a4', '#c9b48f'],
  guns: ['#4a4f58', '#3e444c'],
  fashion: ['#e7d4e4', '#d8c0d4'],
  motors: ['#6a7078', '#5c626a'],
  pizza: ['#e2c2a4', '#d4b090'],
  market: ['#d5d8cf', '#c5c9bf'],
  shells: ['#e4c48a', '#d2b48c'],
  crabs: ['#e8b48a', '#d59a72'],
  house: ['#c4a574', '#b08958'],
  hotel: ['#c9bfb0', '#b7ad9e'],
  police: ['#c5ced6', '#b3bdc6'],
  auction: ['#d8c89a', '#c9b784'],
  bank: ['#c5cdd6', '#b0bac4'],
  clinic: ['#d5e4ea', '#c5d6de'],
  event: ['#c9c4dc', '#b7b0cc'],
  spar: ['#4a3c62', '#3c3154'],
  airport: ['#d5dde6', '#c5ced8'],
  snow: ['#e7eef5', '#d5e0ea'],
  water: ['#b7d4e4', '#9ec4d8'],
  power: ['#6a6e62', '#5a5e54'],
  skate: ['#c4b89a', '#b4a684'],
  gang: ['#6a4038', '#54322c'],
  mine: ['#3a3a42', '#2e2e34'],
  cave: ['#2c3138', '#23272d'],
  hall: ['#b7c0b4', '#a7b2a4'],
};

export function themeFor(label: string, type: string): string {
  const name = label.toLowerCase();
  if (name.includes('kiosk')) return 'kiosk';
  if (name.includes('gun')) return 'guns';
  if (name.includes('fashion') || name.includes('mall')) return 'fashion';
  if (name.includes('motor') || name.includes('rico')) return 'motors';
  if (name.includes('pizza') || name.includes('pizzeria')) return 'pizza';
  if (name.includes('food')) return 'market';
  if (name.includes('crab') || name.includes('wandi')) return 'crabs';
  if (name.includes('shell')) return 'shells';
  if (type === 'house' || name.includes('flat')) return 'house';
  if (name.includes('hotel')) return 'hotel';
  if (name.includes('police')) return 'police';
  if (name.includes('auction')) return 'auction';
  if (name.includes('bank')) return 'bank';
  if (name.includes('hospital') || name.includes('mercy')) return 'clinic';
  if (name.includes('event')) return 'event';
  if (name.includes('spar')) return 'spar';
  if (name.includes('airport')) return 'airport';
  if (name.includes('snow')) return 'snow';
  if (name.includes('water')) return 'water';
  if (name.includes('power')) return 'power';
  if (name.includes('skate')) return 'skate';
  if (name.includes('mine')) return 'mine';
  if (name.includes('cave')) return 'cave';
  if (
    name.includes('gz') ||
    name.includes('bh') ||
    name.includes('bbz') ||
    name.includes('pirate') ||
    name.includes('guerre') ||
    name.includes('neo')
  ) {
    return 'gang';
  }
  return 'hall';
}

export function interiorKindFor(label: string, type: string): InteriorKind {
  return THEME_KIND[themeFor(label, type)] ?? 'hall';
}

export function buildInterior(kind: InteriorKind, title: string): InteriorLevel {
  const theme = themeFor(title, kind);
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
  const props: InteriorProp[] = [];
  const marks: FloorMark[] = [];
  const resolved = THEME_KIND[theme] ?? kind;
  furnish(theme, blocked, props, marks);
  return {
    kind: resolved,
    theme,
    title,
    size,
    blocked,
    marks,
    spawnTx: 32,
    spawnTy: 56,
    exitTx: 31,
    exitTy: 61,
    noPk: resolved !== 'gang' && resolved !== 'spar' && resolved !== 'mine',
    props,
  };
}

function blockRect(
  blocked: boolean[][],
  x0: number,
  y0: number,
  w: number,
  h: number,
  gapX = -99,
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 2 || y < 2 || x >= 62 || y >= 62) continue;
      if (x === gapX || x === gapX + 1) continue;
      blocked[y][x] = true;
    }
  }
}

function rowProps(
  props: InteriorProp[],
  key: string,
  tx: number,
  ty: number,
  count: number,
  step: number,
  labels: string[] = [],
) {
  for (let i = 0; i < count; i++) {
    props.push({ tx: tx + i * step, ty, key, label: labels[i] });
  }
}

function furnish(theme: string, blocked: boolean[][], props: InteriorProp[], marks: FloorMark[]) {
  if (theme === 'guns') {
    marks.push({ tx: 8, ty: 30, tw: 10, th: 22, color: '#2a2e33' });
    marks.push({ tx: 27, ty: 30, tw: 10, th: 22, color: '#2a2e33' });
    marks.push({ tx: 46, ty: 30, tw: 10, th: 22, color: '#2a2e33' });
    blockRect(blocked, 8, 16, 48, 2, 32);
    rowProps(props, 'crate', 6, 6, 8, 6, ['Pistols', 'Rifles', 'SMGs', 'LMGs', 'Shotguns', 'Snipers', 'Launchers', 'Exotics']);
    rowProps(props, 'shop', 8, 22, 6, 8, ['Counter', 'Ammo', 'Melee', 'Grenades', 'Repair', 'Clerk']);
    props.push({ tx: 32, ty: 40, key: 'crate', label: 'Range' });
    return;
  }
  if (theme === 'fashion') {
    marks.push({ tx: 8, ty: 34, tw: 14, th: 10, color: '#f3e4ee' });
    marks.push({ tx: 42, ty: 34, tw: 14, th: 10, color: '#f3e4ee' });
    blockRect(blocked, 6, 20, 16, 1);
    blockRect(blocked, 42, 20, 16, 1);
    rowProps(props, 'house', 6, 8, 4, 5, ['Hats', 'Caps', 'Crowns', 'Helmets']);
    rowProps(props, 'furniture', 34, 8, 4, 5, ['Shirts', 'Pants', 'Coats', 'Dresses']);
    rowProps(props, 'shop', 10, 28, 3, 14, ['Mirror', 'Fitting', 'Register']);
    props.push({ tx: 14, ty: 40, key: 'crate', label: 'Changing 1' }, { tx: 46, ty: 40, key: 'crate', label: 'Changing 2' });
    return;
  }
  if (theme === 'motors') {
    marks.push({ tx: 6, ty: 8, tw: 14, th: 18, color: '#3a4048' });
    marks.push({ tx: 25, ty: 8, tw: 14, th: 18, color: '#3a4048' });
    marks.push({ tx: 44, ty: 8, tw: 14, th: 18, color: '#3a4048' });
    props.push(
      { tx: 10, ty: 14, key: 'shop', label: 'Coupe bay' },
      { tx: 29, ty: 14, key: 'shop', label: 'Sedan bay' },
      { tx: 48, ty: 14, key: 'shop', label: 'Sports bay' },
    );
    rowProps(props, 'crate', 8, 32, 6, 8, ['Tools', 'Tires', 'Paint', 'Boards', 'Parts', 'Desk']);
    props.push({ tx: 32, ty: 44, key: 'furniture', label: 'Showroom' });
    return;
  }
  if (theme === 'pizza') {
    blockRect(blocked, 8, 12, 48, 2, 32);
    rowProps(props, 'crate', 8, 6, 6, 8, ['Oven', 'Dough', 'Sauce', 'Cheese', 'Peel', 'Orders']);
    rowProps(props, 'furniture', 10, 24, 4, 12, ['Table 1', 'Table 2', 'Table 3', 'Table 4']);
    rowProps(props, 'furniture', 10, 40, 4, 12, ['Booth', 'Booth', 'Booth', 'Counter']);
    return;
  }
  if (theme === 'market') {
    for (let aisle = 0; aisle < 4; aisle++) {
      const y = 8 + aisle * 8;
      blockRect(blocked, 8, y, 48, 1, 32);
      rowProps(props, 'crate', 8, y - 1, 6, 7, aisle === 0 ? ['Produce', 'Snacks', 'Drinks', 'Frozen', 'Bread', 'Tins'] : []);
    }
    props.push({ tx: 32, ty: 42, key: 'shop', label: 'Checkout' });
    return;
  }
  if (theme === 'shells') {
    marks.push({ tx: 10, ty: 28, tw: 44, th: 16, color: '#ecd7a8' });
    blockRect(blocked, 10, 18, 44, 2, 32);
    rowProps(props, 'shell', 8, 8, 5, 8, ['Trochus', 'Aerolata', 'Sand Dollar', 'Scallop', 'Starfish']);
    rowProps(props, 'shovel', 12, 24, 4, 10, ['Shovels', 'Spare', 'Buckets', 'Sell']);
    props.push({ tx: 44, ty: 40, key: 'crate', label: 'Buy / sell' });
    return;
  }
  if (theme === 'crabs') {
    rowProps(props, 'crab', 8, 10, 5, 8, ['Pots', 'Catch', 'Boil', 'Shells', 'Special']);
    rowProps(props, 'furniture', 10, 28, 4, 10, ['Table', 'Table', 'Table', 'Bar']);
    rowProps(props, 'crate', 10, 42, 4, 10, ['Ice', 'Nets', 'Sauce', 'Register']);
    return;
  }
  if (theme === 'kiosk') {
    marks.push({ tx: 18, ty: 22, tw: 28, th: 16, color: '#efe4cf' });
    blockRect(blocked, 16, 18, 32, 2, 32);
    rowProps(props, 'crate', 18, 10, 4, 6, ['Snacks', 'Drinks', 'Maps', 'News']);
    props.push({ tx: 30, ty: 26, key: 'shop', label: 'Kiosk' }, { tx: 40, ty: 40, key: 'furniture', label: 'Seat' });
    return;
  }
  if (theme === 'house') {
    blockRect(blocked, 2, 30, 60, 1, 32);
    blockRect(blocked, 24, 4, 1, 26, -99);
    blocked[16][24] = false;
    props.push(
      { tx: 8, ty: 10, key: 'furniture', label: 'Bed' },
      { tx: 14, ty: 18, key: 'furniture', label: 'Dresser' },
      { tx: 36, ty: 10, key: 'house', label: 'Closet' },
      { tx: 48, ty: 16, key: 'furniture', label: 'Desk' },
      { tx: 10, ty: 40, key: 'furniture', label: 'Couch' },
      { tx: 22, ty: 44, key: 'furniture', label: 'Table' },
      { tx: 40, ty: 40, key: 'crate', label: 'Kitchen' },
      { tx: 50, ty: 44, key: 'crate', label: 'Stove' },
    );
    return;
  }
  if (theme === 'hotel') {
    blockRect(blocked, 2, 24, 60, 1, 32);
    rowProps(props, 'furniture', 8, 10, 5, 8, ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5']);
    rowProps(props, 'furniture', 8, 34, 4, 10, ['Lobby', 'Sofa', 'Sofa', 'Desk']);
    props.push({ tx: 46, ty: 40, key: 'shop', label: 'Check-in' });
    return;
  }
  if (theme === 'police') {
    blockRect(blocked, 8, 20, 48, 2, 32);
    blockRect(blocked, 8, 8, 12, 8);
    blockRect(blocked, 44, 8, 12, 8);
    props.push(
      { tx: 12, ty: 10, key: 'crate', label: 'Cell A' },
      { tx: 48, ty: 10, key: 'crate', label: 'Cell B' },
      { tx: 28, ty: 28, key: 'shop', label: 'Front desk' },
      { tx: 14, ty: 42, key: 'furniture', label: 'Bench' },
      { tx: 44, ty: 42, key: 'furniture', label: 'Bench' },
    );
    return;
  }
  if (theme === 'auction') {
    marks.push({ tx: 24, ty: 14, tw: 16, th: 10, color: '#8a7048' });
    props.push({ tx: 30, ty: 16, key: 'shop', label: 'Block' });
    rowProps(props, 'furniture', 8, 32, 6, 8, ['Seat', 'Seat', 'Seat', 'Seat', 'Seat', 'Seat']);
    rowProps(props, 'furniture', 8, 42, 6, 8);
    props.push({ tx: 48, ty: 16, key: 'crate', label: 'Lots' });
    return;
  }
  if (theme === 'bank') {
    blockRect(blocked, 10, 16, 44, 2);
    for (const gap of [20, 32, 44]) {
      blocked[16][gap] = false;
      blocked[17][gap] = false;
    }
    rowProps(props, 'shop', 16, 10, 3, 14, ['Teller 1', 'Teller 2', 'Teller 3']);
    blockRect(blocked, 20, 6, 24, 1);
    props.push({ tx: 30, ty: 4, key: 'house', label: 'Vault' }, { tx: 32, ty: 36, key: 'furniture', label: 'Queue' });
    return;
  }
  if (theme === 'clinic') {
    blockRect(blocked, 2, 28, 60, 1, 32);
    rowProps(props, 'furniture', 8, 10, 4, 8, ['Bed', 'Bed', 'Bed', 'Bed']);
    rowProps(props, 'furniture', 8, 36, 4, 8, ['Bed', 'Bed', 'Triage', 'Nurse']);
    props.push({ tx: 48, ty: 16, key: 'shop', label: 'Pharmacy' });
    return;
  }
  if (theme === 'event') {
    marks.push({ tx: 16, ty: 8, tw: 32, th: 8, color: '#6a5a88' });
    props.push({ tx: 30, ty: 10, key: 'shop', label: 'Stage' });
    rowProps(props, 'furniture', 8, 24, 6, 8, ['Plasma', 'Crypt', 'Laser', 'Spar', 'Snow', 'Island']);
    rowProps(props, 'crate', 10, 40, 5, 8, ['Board', 'Lobby', 'Lockers', 'Prizes', 'Exit info']);
    return;
  }
  if (theme === 'spar') {
    marks.push({ tx: 16, ty: 16, tw: 32, th: 24, color: '#2a2040' });
    props.push(
      { tx: 16, ty: 16, key: 'crate', label: 'Corner' },
      { tx: 44, ty: 16, key: 'crate', label: 'Corner' },
      { tx: 16, ty: 36, key: 'crate', label: 'Corner' },
      { tx: 44, ty: 36, key: 'crate', label: 'Corner' },
      { tx: 30, ty: 26, key: 'shop', label: 'Ring' },
    );
    rowProps(props, 'furniture', 8, 46, 4, 12, ['Bench', 'Bench', 'Bench', 'Score']);
    return;
  }
  if (theme === 'airport') {
    blockRect(blocked, 8, 14, 48, 2, 18);
    blockRect(blocked, 8, 14, 48, 2, 32);
    blockRect(blocked, 8, 14, 48, 2, 46);
    rowProps(props, 'shop', 12, 8, 3, 16, ['Gate A Arte', 'Gate B Tutorial', 'Gate C Snow']);
    rowProps(props, 'furniture', 8, 28, 6, 8, ['Seats', 'Seats', 'Seats', 'Seats', 'Seats', 'Info']);
    props.push({ tx: 32, ty: 44, key: 'crate', label: 'Bags' });
    return;
  }
  if (theme === 'snow') {
    marks.push({ tx: 20, ty: 20, tw: 24, th: 16, color: '#f4f7fb' });
    props.push({ tx: 30, ty: 12, key: 'house', label: 'Hearth' });
    rowProps(props, 'furniture', 8, 28, 5, 8, ['Bench', 'Bench', 'Lodge', 'Bench', 'Bench']);
    rowProps(props, 'crate', 10, 44, 4, 10, ['Skis', 'Coats', 'Cocoa', 'Desk']);
    return;
  }
  if (theme === 'water') {
    marks.push({ tx: 14, ty: 12, tw: 36, th: 22, color: '#2f86c4' });
    props.push({ tx: 30, ty: 20, key: 'shop', label: 'Pool' });
    rowProps(props, 'crate', 6, 40, 6, 8, ['Lockers', 'Towels', 'Floats', 'Snack', 'First aid', 'Desk']);
    return;
  }
  if (theme === 'power') {
    marks.push({ tx: 8, ty: 8, tw: 48, th: 4, color: '#e6c85a' });
    marks.push({ tx: 8, ty: 40, tw: 48, th: 4, color: '#e6c85a' });
    rowProps(props, 'crate', 8, 16, 5, 10, ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Cooling']);
    rowProps(props, 'rock', 10, 30, 4, 10, ['Core', 'Pipes', 'Fuel', 'Control']);
    return;
  }
  if (theme === 'skate') {
    marks.push({ tx: 8, ty: 12, tw: 20, th: 8, color: '#8a5a32' });
    marks.push({ tx: 36, ty: 28, tw: 20, th: 8, color: '#8a5a32' });
    props.push({ tx: 14, ty: 14, key: 'crate', label: 'Ramp' }, { tx: 42, ty: 30, key: 'crate', label: 'Ramp' });
    rowProps(props, 'furniture', 8, 44, 5, 8, ['Rail', 'Bench', 'Shop', 'Pads', 'Board']);
    return;
  }
  if (theme === 'mine') {
    marks.push({ tx: 8, ty: 20, tw: 48, th: 4, color: '#6b5a45' });
    blockRect(blocked, 8, 12, 48, 1, 32);
    blockRect(blocked, 8, 36, 48, 1, 20);
    rowProps(props, 'rock', 8, 8, 6, 8, ['Vein', 'Vein', 'Vein', 'Vein', 'Vein', 'Vein']);
    props.push({ tx: 30, ty: 28, key: 'crate', label: 'Crusher' }, { tx: 44, ty: 44, key: 'shop', label: 'Ore desk' });
    return;
  }
  if (theme === 'cave') {
    blockRect(blocked, 8, 14, 48, 1, 32);
    blockRect(blocked, 8, 32, 48, 1, 18);
    rowProps(props, 'rock', 10, 8, 5, 8);
    props.push(
      { tx: 32, ty: 20, key: 'shop', label: 'Sea Dungeon' },
      { tx: 18, ty: 40, key: 'furniture', label: 'Cave Town' },
      { tx: 44, ty: 40, key: 'crate', label: 'Ice cavern' },
    );
    return;
  }
  if (theme === 'gang') {
    marks.push({ tx: 22, ty: 14, tw: 20, th: 12, color: '#4a2030' });
    props.push({ tx: 30, ty: 18, key: 'shop', label: 'Flag' });
    rowProps(props, 'crate', 8, 8, 4, 12, ['Armory', 'Ammo', 'Plans', 'Loot']);
    rowProps(props, 'crate', 8, 36, 4, 12, ['Barricade', 'Bench', 'Bench', 'Door watch']);
    return;
  }
  rowProps(props, 'shop', 20, 16, 3, 8, ['Desk', 'Board', 'Counter']);
  rowProps(props, 'furniture', 12, 36, 4, 10, ['Seat', 'Seat', 'Seat', 'Seat']);
}

export function paintInteriorTexture(scene: Phaser.Scene, level: InteriorLevel): string {
  const key = `interior-${level.theme}`;
  if (scene.textures.exists(key)) return key;
  const size = level.size;
  const canvas = document.createElement('canvas');
  canvas.width = size * TILE;
  canvas.height = size * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return key;
  ctx.imageSmoothingEnabled = false;
  const pair = FLOOR[level.theme] ?? FLOOR.hall;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? pair[0] : pair[1];
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  for (const mark of level.marks) {
    ctx.fillStyle = mark.color;
    ctx.fillRect(mark.tx * TILE, mark.ty * TILE, mark.tw * TILE, mark.th * TILE);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!level.blocked[y][x]) continue;
      ctx.fillStyle = (x + y) % 2 === 0 ? '#3a2e28' : '#5c4638';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  ctx.fillStyle = '#e6c85a';
  ctx.fillRect(30 * TILE, (size - 3) * TILE, 4 * TILE, 3 * TILE);
  scene.textures.addCanvas(key, canvas);
  return key;
}

export const INTERIOR_ORIGIN_X = 0;
export const INTERIOR_ORIGIN_Y = 80 * TILE;
