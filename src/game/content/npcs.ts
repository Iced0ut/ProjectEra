/** City population: named NPCs, ambient citizens, and combat bots. */

export type NpcRole =
  | 'guide'
  | 'shop_guns'
  | 'shop_melee'
  | 'shop_exotic'
  | 'shop_cars'
  | 'shop_fashion'
  | 'shop_hats'
  | 'job'
  | 'gang'
  | 'spar'
  | 'police'
  | 'vendor'
  | 'mail'
  | 'pizza'
  | 'citizen';

export type BotKind =
  | 'spar_bot'
  | 'street_rival'
  | 'gang_enforcer'
  | 'beach_crab'
  | 'police_bot'
  | 'event_bot'
  | 'training_dummy';

export interface NpcDef {
  id: string;
  name: string;
  role: NpcRole;
  x: number;
  y: number;
  lines: string[];
  tint?: number;
}

export interface BotDef {
  id: string;
  kind: BotKind;
  name: string;
  x: number;
  y: number;
  hp: number;
  speed: number;
  damage: number;
  aggro: number;
  respawnMs: number;
  loot: number;
  tint?: number;
}

export const CITY_NPCS: NpcDef[] = [
  {
    id: 'guide_g',
    name: 'Guide G',
    role: 'guide',
    x: 36,
    y: 26,
    lines: [
      'WASD move, Space attack, Q ability, Shift dash, E talk/shop.',
      'B open bot board. V vehicle. R morph. U upload skin. I inventory.',
      'Safe plaza is NO-PK. Spar, streets, and gang districts allow combat.',
    ],
  },
  {
    id: 'vendor_vee',
    name: 'Vendor Vee',
    role: 'shop_guns',
    x: 31,
    y: 22,
    lines: ['Gun counter is open. Effects and abilities included.', 'Ask me about rifles, SMGs, shotguns, snipers, launchers.'],
    tint: 0x6ec6ff,
  },
  {
    id: 'simon_melee',
    name: 'Simon',
    role: 'shop_melee',
    x: 45,
    y: 22,
    lines: ['Melees, katanas, axes, shields — all with on-hit effects.', 'Bloody Katana steals life. Magma Axe burns.'],
    tint: 0xffb070,
  },
  {
    id: 'exotic_aria',
    name: 'Aria',
    role: 'shop_exotic',
    x: 33,
    y: 30,
    lines: ['Exotics and staffs. Ice Mage Staff can heal.', 'Vanquisher and Chroma Nova swap modes.'],
    tint: 0xd08cff,
  },
  {
    id: 'job_bot',
    name: 'Job Bot',
    role: 'job',
    x: 47,
    y: 24,
    lines: ['Fish, mine, dig, trash, pizza, mushrooms, flowers, mail.', 'Walk to a job zone and press E.'],
    tint: 0xf0c14b,
  },
  {
    id: 'capo_rex',
    name: 'Capo Rex',
    role: 'gang',
    x: 64,
    y: 42,
    lines: ['Found a crew with G. Hold the base.', 'Enforcers patrol this block. Allies do not hurt each other.'],
    tint: 0xff6b4a,
  },
  {
    id: 'spar_host',
    name: 'Spar Host',
    role: 'spar',
    x: 64,
    y: 14,
    lines: ['Spar bots reset forever. Practice weapon effects here.', 'Space to fight. Q for weapon ability.'],
    tint: 0xb08cff,
  },
  {
    id: 'officer_lane',
    name: 'Officer Lane',
    role: 'police',
    x: 40,
    y: 18,
    lines: ['Keep the plaza clean. PK outside safe zones is legal.', 'Police bots will chase troublemakers in downtown edges.'],
    tint: 0x4aa3ff,
  },
  {
    id: 'car_dealer',
    name: 'Rico Motors',
    role: 'shop_cars',
    x: 18,
    y: 20,
    lines: ['Cars and boards. No combat while riding in this district.', 'V to mount/dismount after purchase.'],
    tint: 0x7ad0ff,
  },
  {
    id: 'fashion_faye',
    name: 'Faye',
    role: 'shop_fashion',
    x: 22,
    y: 24,
    lines: ['Bodies, shirts, pants, walk styles.', 'Custom skin upload is U — local preview only.'],
    tint: 0xff8ec8,
  },
  {
    id: 'hat_hiro',
    name: 'Hiro Hats',
    role: 'shop_hats',
    x: 26,
    y: 24,
    lines: ['Hundreds of hat vibes condensed into this demo rack.', 'Pick a hat id and own the look.'],
    tint: 0xffd27a,
  },
  {
    id: 'mailman_mo',
    name: 'Mailman Mo',
    role: 'mail',
    x: 46,
    y: 32,
    lines: ['Deliver mail bundles across the city for gralats.', 'Press E near me to clock a mail run.'],
  },
  {
    id: 'pizza_pat',
    name: 'Pat Pizza',
    role: 'pizza',
    x: 32,
    y: 32,
    lines: ['Speedy pizzas, speedy pay.', 'E to bake a box.'],
    tint: 0xff9a5a,
  },
  {
    id: 'beach_bri',
    name: 'Bri',
    role: 'vendor',
    x: 10,
    y: 46,
    lines: ['Dig shells, dodge crabs.', 'Crab bots respawn on the sand.'],
    tint: 0xffe08a,
  },
  {
    id: 'event_announcer',
    name: 'Event Bot',
    role: 'vendor',
    x: 38,
    y: 16,
    lines: ['Laser Tag, BR, Infection — event stubs are marked on the map.', 'Training bots fill arenas until real matchmaking lands.'],
    tint: 0x8cffb0,
  },
];

export const AMBIENT_CITIZEN_SPOTS: { x: number; y: number; name: string }[] = [
  { x: 29, y: 25, name: 'Jay' },
  { x: 35, y: 28, name: 'Nia' },
  { x: 41, y: 25, name: 'Oz' },
  { x: 43, y: 29, name: 'Quin' },
  { x: 37, y: 21, name: 'Rae' },
  { x: 28, y: 31, name: 'Sky' },
  { x: 48, y: 28, name: 'Tess' },
  { x: 20, y: 28, name: 'Uma' },
  { x: 15, y: 36, name: 'Vic' },
  { x: 12, y: 34, name: 'Wes' },
  { x: 50, y: 40, name: 'Xan' },
  { x: 55, y: 30, name: 'Yuna' },
  { x: 70, y: 28, name: 'Zed' },
  { x: 66, y: 20, name: 'Ash' },
  { x: 62, y: 45, name: 'Bea' },
  { x: 8, y: 12, name: 'Cid' },
  { x: 14, y: 14, name: 'Dot' },
  { x: 52, y: 12, name: 'Eli' },
  { x: 24, y: 40, name: 'Flo' },
  { x: 44, y: 44, name: 'Gus' },
];

export function createCityBots(): BotDef[] {
  const bots: BotDef[] = [];
  let n = 0;
  const add = (partial: Omit<BotDef, 'id'> & { id?: string }) => {
    n += 1;
    bots.push({ id: partial.id ?? `bot_${n}`, ...partial });
  };

  // Spar complex bots
  for (let i = 0; i < 10; i++) {
    add({
      kind: 'spar_bot',
      name: `Spar Bot ${i + 1}`,
      x: 60 + (i % 5) * 2.5,
      y: 10 + Math.floor(i / 5) * 4,
      hp: 50,
      speed: 70,
      damage: 5,
      aggro: 220,
      respawnMs: 4000,
      loot: 8,
      tint: 0xb08cff,
    });
  }

  // Street rivals along roads / downtown edges
  for (let i = 0; i < 14; i++) {
    add({
      kind: 'street_rival',
      name: `Rival ${i + 1}`,
      x: 4 + (i * 5) % 70,
      y: 27 + (i % 3),
      hp: 40,
      speed: 85,
      damage: 6,
      aggro: 180,
      respawnMs: 8000,
      loot: 12,
      tint: 0xff6b4a,
    });
  }

  // Gang enforcers
  for (let i = 0; i < 12; i++) {
    add({
      kind: 'gang_enforcer',
      name: `Enforcer ${i + 1}`,
      x: 59 + (i % 6) * 2.2,
      y: 38 + Math.floor(i / 6) * 5,
      hp: 55,
      speed: 90,
      damage: 7,
      aggro: 240,
      respawnMs: 7000,
      loot: 15,
      tint: 0xff4040,
    });
  }

  // Beach crabs
  for (let i = 0; i < 10; i++) {
    add({
      kind: 'beach_crab',
      name: `Crab ${i + 1}`,
      x: 2 + (i % 8) * 2.5,
      y: 46 + Math.floor(i / 8) * 3,
      hp: 20,
      speed: 55,
      damage: 4,
      aggro: 100,
      respawnMs: 5000,
      loot: 6,
      tint: 0xff9a4a,
    });
  }

  // Police patrol bots near plaza edges
  for (let i = 0; i < 6; i++) {
    add({
      kind: 'police_bot',
      name: `Patrol ${i + 1}`,
      x: 26 + i * 4,
      y: 17 + (i % 2),
      hp: 60,
      speed: 95,
      damage: 6,
      aggro: 160,
      respawnMs: 10000,
      loot: 5,
      tint: 0x4aa3ff,
    });
  }

  // Event / laser-tag training bots
  for (let i = 0; i < 8; i++) {
    add({
      kind: 'event_bot',
      name: `Arena Bot ${i + 1}`,
      x: 70 + (i % 4) * 2,
      y: 2 + Math.floor(i / 4) * 3,
      hp: 45,
      speed: 80,
      damage: 5,
      aggro: 200,
      respawnMs: 4500,
      loot: 10,
      tint: 0x8cffb0,
    });
  }

  // Training dummies near weapon shops
  for (let i = 0; i < 4; i++) {
    add({
      kind: 'training_dummy',
      name: `Dummy ${i + 1}`,
      x: 34 + i * 2,
      y: 34,
      hp: 999,
      speed: 0,
      damage: 0,
      aggro: 0,
      respawnMs: 2000,
      loot: 0,
      tint: 0x888888,
    });
  }

  return bots;
}
