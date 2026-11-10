import type { BotKind } from './npcs';
import type { InteriorKind } from '../levels/interiors';

/** Private copies of places described in the public Era world pages. Original layouts. */

export interface InstanceWave {
  name: string;
  hp: number;
  damage: number;
  kind: BotKind;
  count: number;
  loot: number;
  tint?: number;
}

export interface InstanceDef {
  id: string;
  title: string;
  blurb: string;
  kind: InteriorKind;
  noPk: boolean;
  waves: InstanceWave[];
  reward: number;
  coin: 'sea' | 'plasma' | 'gang' | 'event' | null;
}

export const INSTANCES: Record<string, InstanceDef> = {
  sea: {
    id: 'sea',
    title: 'Sea Dungeon',
    blurb: 'Private copy. Fish, then the Statue Boss. A gang would bring up to 4.',
    kind: 'cave',
    noPk: false,
    reward: 800,
    coin: 'sea',
    waves: [
      { name: 'Fish Lurker', hp: 80, damage: 6, kind: 'mine_pest', count: 4, loot: 8, tint: 0x4aa3ff },
      { name: 'Zombie Fish', hp: 120, damage: 8, kind: 'mine_pest', count: 2, loot: 12, tint: 0x6ecf8e },
      { name: 'Statue Boss', hp: 420, damage: 12, kind: 'gang_enforcer', count: 1, loot: 40, tint: 0xc9bfb0 },
    ],
  },
  cavetown: {
    id: 'cavetown',
    title: 'Cave Town',
    blurb: 'Always No-PK. Shops and rest, no fighting.',
    kind: 'hall',
    noPk: true,
    reward: 0,
    coin: null,
    waves: [],
  },
  cavern: {
    id: 'cavern',
    title: 'Hidden Ice Cavern',
    blurb: 'A hidden dig site. Clear the vein boss for gems.',
    kind: 'mine',
    noPk: false,
    reward: 600,
    coin: 'event',
    waves: [
      { name: 'Cave Pest', hp: 50, damage: 4, kind: 'mine_pest', count: 5, loot: 6, tint: 0xa0a8b8 },
      { name: 'Vein Boss', hp: 300, damage: 9, kind: 'gang_enforcer', count: 1, loot: 30, tint: 0x8fd4f2 },
    ],
  },
  plasma: {
    id: 'plasma',
    title: 'Plasma Corp',
    blurb: 'Wave survival. A boss shows up on the last wave.',
    kind: 'spar',
    noPk: false,
    reward: 500,
    coin: 'plasma',
    waves: [
      { name: 'Plasma Drone', hp: 40, damage: 4, kind: 'spar_bot', count: 4, loot: 4, tint: 0x8fd4ff },
      { name: 'Plasma Drone', hp: 55, damage: 5, kind: 'spar_bot', count: 5, loot: 5, tint: 0x6ec6ff },
      { name: 'Plasma Boss', hp: 360, damage: 10, kind: 'event_bot', count: 1, loot: 35, tint: 0xd08cff },
    ],
  },
  crypt: {
    id: 'crypt',
    title: 'Crypt Floor',
    blurb: 'One crypt floor. Deeper runs in Era add a boss every 10 floors.',
    kind: 'cave',
    noPk: false,
    reward: 450,
    coin: 'event',
    waves: [
      { name: 'Crypt Walker', hp: 45, damage: 5, kind: 'street_rival', count: 6, loot: 5, tint: 0x6a8a62 },
      { name: 'Crypt Boss', hp: 380, damage: 11, kind: 'gang_enforcer', count: 1, loot: 30, tint: 0x2a2a2a },
    ],
  },
  snow: {
    id: 'snow',
    title: 'Snow City',
    blurb: 'Winter town. No-PK streets and a lodge.',
    kind: 'hotel',
    noPk: true,
    reward: 100,
    coin: null,
    waves: [],
  },
  arte: {
    id: 'arte',
    title: 'Arte Island',
    blurb: 'A visit counts. A few pests guard the shore.',
    kind: 'hall',
    noPk: false,
    reward: 250,
    coin: 'event',
    waves: [
      { name: 'Shore Pest', hp: 36, damage: 3, kind: 'beach_crab', count: 4, loot: 4, tint: 0xff9a4a },
    ],
  },
  tutorial: {
    id: 'tutorial',
    title: 'Tutorial Map',
    blurb: 'Safe practice: move, attack, and leave by the gold door.',
    kind: 'hall',
    noPk: true,
    reward: 50,
    coin: null,
    waves: [{ name: 'Practice Bot', hp: 25, damage: 1, kind: 'spar_bot', count: 2, loot: 0, tint: 0x888888 }],
  },
  spar: {
    id: 'spar',
    title: 'Spar Room',
    blurb: 'A private duel room. Spectators would be safe; here it is just you and the bot.',
    kind: 'spar',
    noPk: false,
    reward: 200,
    coin: null,
    waves: [{ name: 'Spar Partner', hp: 80, damage: 6, kind: 'spar_bot', count: 1, loot: 15, tint: 0xb08cff }],
  },
  laser: {
    id: 'laser',
    title: 'Laser Tag',
    blurb: 'A short tag match. Era runs CTF and gun game on separate maps.',
    kind: 'spar',
    noPk: false,
    reward: 300,
    coin: 'event',
    waves: [
      { name: 'Tag Bot', hp: 40, damage: 4, kind: 'event_bot', count: 5, loot: 6, tint: 0x7dff6a },
    ],
  },
  fortress: {
    id: 'fortress',
    title: 'Gang Fortress',
    blurb: 'A capturable base stand-in. Clear the flag crew.',
    kind: 'gang',
    noPk: false,
    reward: 400,
    coin: 'gang',
    waves: [
      { name: 'Base Guard', hp: 70, damage: 6, kind: 'gang_enforcer', count: 4, loot: 10, tint: 0xff4040 },
      { name: 'Flag Captain', hp: 260, damage: 9, kind: 'gang_enforcer', count: 1, loot: 25, tint: 0xffd27a },
    ],
  },
  asylum: {
    id: 'asylum',
    title: 'Shadow Creek',
    blurb: 'A short story wing with two bosses.',
    kind: 'clinic',
    noPk: false,
    reward: 550,
    coin: 'event',
    waves: [
      { name: 'Orderly', hp: 50, damage: 4, kind: 'street_rival', count: 3, loot: 5, tint: 0xc5d6de },
      { name: 'Dr. Adam', hp: 180, damage: 8, kind: 'police_bot', count: 1, loot: 15, tint: 0xe8f0ff },
      { name: 'Kastro', hp: 280, damage: 10, kind: 'gang_enforcer', count: 1, loot: 25, tint: 0x6a3048 },
    ],
  },
  phoenix: {
    id: 'phoenix',
    title: 'Phoenix Arena',
    blurb: 'A fire boss that calls embers.',
    kind: 'spar',
    noPk: false,
    reward: 700,
    coin: 'event',
    waves: [
      { name: 'Ember', hp: 30, damage: 4, kind: 'event_bot', count: 4, loot: 4, tint: 0xff6a2a },
      { name: 'Phoenix', hp: 420, damage: 12, kind: 'event_bot', count: 1, loot: 40, tint: 0xffb020 },
    ],
  },
};

export function instanceForPlace(label: string): InstanceDef | null {
  const name = label.toLowerCase();
  if (name.includes('cave entrance')) return INSTANCES.sea;
  if (name.includes('snow')) return INSTANCES.snow;
  if (name.includes('spar complex')) return INSTANCES.spar;
  return null;
}

export const INSTANCE_MENU = Object.values(INSTANCES)
  .map((row) => row.id)
  .join(', ');
