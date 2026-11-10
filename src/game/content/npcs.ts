/** City population spread across Northridge + Southridge. */

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
  | 'shell_shop'
  | 'crab_shack'
  | 'warp'
  | 'citizen';

export type BotKind =
  | 'spar_bot'
  | 'street_rival'
  | 'gang_enforcer'
  | 'beach_crab'
  | 'police_bot'
  | 'event_bot'
  | 'training_dummy'
  | 'mine_pest';

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
  // Start Park / Downtown
  {
    id: 'guide_g',
    name: 'Guide G',
    role: 'guide',
    x: 80,
    y: 77,
    lines: [
      'You spawn in the Starter Area (safe plaza) — not the beach.',
      'WASD move, Space attack, Q ability, E talk. Dig shells on Mercy Beach, south shore.',
      'Southridge is east across the bridge, or take the subway pad.',
    ],
  },
  {
    id: 'vendor_vee',
    name: 'Vendor Vee',
    role: 'shop_guns',
    x: 66,
    y: 62,
    lines: ['Gun Point Row. Full catalog with on-hit effects.', 'Snipers, launchers, SMGs — buy with E.'],
    tint: 0x6ec6ff,
  },
  {
    id: 'simon_melee',
    name: 'Simon',
    role: 'shop_melee',
    x: 70,
    y: 62,
    lines: ['Melees and shields. Bloody Katana steals life.', 'Hellfire Katana burns.'],
    tint: 0xffb070,
  },
  {
    id: 'exotic_aria',
    name: 'Aria',
    role: 'shop_exotic',
    x: 68,
    y: 66,
    lines: ['Exotics and staffs. Ice Mage Staff heals.', 'Vanquisher mode-switches.'],
    tint: 0xd08cff,
  },
  {
    id: 'job_bot',
    name: 'Job Bot',
    role: 'job',
    x: 82,
    y: 80,
    lines: ['Jobs across both islands. Digging is best at Mercy Beach.', 'Mines are on Southridge west and BBZ.'],
    tint: 0xf0c14b,
  },
  {
    id: 'officer_lane',
    name: 'Officer Lane',
    role: 'police',
    x: 62,
    y: 80,
    lines: ['Start Park and hospitals are NO-PK.', 'Open PK on roads and gang districts.'],
    tint: 0x4aa3ff,
  },
  {
    id: 'car_dealer',
    name: 'Rico Motors',
    role: 'shop_cars',
    x: 106,
    y: 68,
    lines: ['Auto Mile. Cars and boards. V to ride.', 'No combat while mounted.'],
    tint: 0x7ad0ff,
  },
  {
    id: 'fashion_faye',
    name: 'Faye',
    role: 'shop_fashion',
    x: 92,
    y: 54,
    lines: ['Fashion Mall bodies and outfits.', 'U uploads a custom skin locally.'],
    tint: 0xff8ec8,
  },
  {
    id: 'hat_hiro',
    name: 'Hiro Hats',
    role: 'shop_hats',
    x: 96,
    y: 54,
    lines: ['Hat rack is open.', 'Crown, fedora, helmet — grab a look.'],
    tint: 0xffd27a,
  },
  {
    id: 'mailman_mo',
    name: 'Mailman Mo',
    role: 'mail',
    x: 86,
    y: 84,
    lines: ['Mail runs pay. E to clock a delivery.'],
  },
  {
    id: 'pizza_pat',
    name: 'Pat Pizza',
    role: 'pizza',
    x: 74,
    y: 84,
    lines: ["Speedy's Northridge. E to bake."],
    tint: 0xff9a5a,
  },
  {
    id: 'spar_host',
    name: 'Spar Host',
    role: 'spar',
    x: 120,
    y: 50,
    lines: ['Spar Complex. Bots reset forever.', 'Practice weapon effects here.'],
    tint: 0xb08cff,
  },
  {
    id: 'event_announcer',
    name: 'Event Bot',
    role: 'vendor',
    x: 76,
    y: 44,
    lines: ['Event House lobby. Arenas stubbed on the map.', 'Laser Tag / BR pads coming later.'],
    tint: 0x8cffb0,
  },
  {
    id: 'warp_subway_n',
    name: 'Subway Pad N',
    role: 'warp',
    x: 78,
    y: 94,
    lines: ['Stand here and press E to ride to Southridge Town.'],
    tint: 0x88aaff,
  },

  // Beach / harbour
  {
    id: 'israfel_shells',
    name: 'Isra Shells',
    role: 'shell_shop',
    x: 16,
    y: 102,
    lines: ['Mercy Beach shack. Shovels 50g. Trochus is most common.', 'buy / equip / sellall'],
    tint: 0xffe08a,
  },
  {
    id: 'bell_shells',
    name: 'Bell Shells',
    role: 'shell_shop',
    x: 30,
    y: 104,
    lines: ['Second shack by the harbour.', 'Dig in a straight line along the sand.'],
    tint: 0xf0d090,
  },
  {
    id: 'wandi_crabs',
    name: "Wandi's Crab Shack",
    role: 'crab_shack',
    x: 12,
    y: 106,
    lines: ['Crab shells sell for 6g each color.', 'Crabs spawn while digging.'],
    tint: 0xff8a5a,
  },
  {
    id: 'beach_bri',
    name: 'Bri',
    role: 'vendor',
    x: 20,
    y: 108,
    lines: ['Northridge beach shelling route.', 'Watch for dug crabs — 3 damage.'],
    tint: 0xffe08a,
  },

  // Gang contacts north
  {
    id: 'capo_gz',
    name: 'GZ Capo',
    role: 'gang',
    x: 14,
    y: 60,
    lines: ['Gangster Zone. Create a crew with G.', 'Hold bases for bragging rights.'],
    tint: 0xff6b4a,
  },
  {
    id: 'capo_tachi',
    name: 'Tachi Runner',
    role: 'gang',
    x: 136,
    y: 36,
    lines: ['Tachi Zone overlooks the snow road.'],
    tint: 0xff6b4a,
  },
  {
    id: 'capo_bh',
    name: 'BH Lieutenant',
    role: 'gang',
    x: 26,
    y: 90,
    lines: ['Blackholst. Pizzeria upstairs from the base.'],
    tint: 0xff6b4a,
  },
  {
    id: 'capo_bbz',
    name: 'BBZ Miner',
    role: 'gang',
    x: 128,
    y: 100,
    lines: ['BBZ mines below the base. Bring a drill later.'],
    tint: 0xff6b4a,
  },

  // Southridge
  {
    id: 'south_guide',
    name: 'Island Guide',
    role: 'guide',
    x: 78,
    y: 152,
    lines: ['Southridge Island. Hospital and pizza east of center.', 'Pirate / Guerre / Neo bases — PK heavy.'],
  },
  {
    id: 'south_pizza',
    name: 'South Pat',
    role: 'pizza',
    x: 88,
    y: 158,
    lines: ['Southridge Speedy. E to bake.'],
    tint: 0xff9a5a,
  },
  {
    id: 'south_shells',
    name: 'South Shells',
    role: 'shell_shop',
    x: 72,
    y: 190,
    lines: ['Southern sands also dig Trochus.', 'Same shovel rules as Mercy Beach.'],
    tint: 0xffe08a,
  },
  {
    id: 'mine_foreman',
    name: 'Mine Foreman',
    role: 'job',
    x: 38,
    y: 156,
    lines: ['Southridge Mines. Pest bots inside.', 'Full drill/TNT loop coming — for now clear pests for pay.'],
    tint: 0xc0c0c0,
  },
  {
    id: 'pirate_boss',
    name: 'Pirate Boss',
    role: 'gang',
    x: 112,
    y: 162,
    lines: ['Pirate Zone. Southridge gang warfront.'],
    tint: 0xff6b4a,
  },
  {
    id: 'guerre_boss',
    name: 'Guerre Boss',
    role: 'gang',
    x: 48,
    y: 180,
    lines: ['Guerre mines are hostile. Watch your step.'],
    tint: 0xff6b4a,
  },
  {
    id: 'neo_boss',
    name: 'Neo Boss',
    role: 'gang',
    x: 102,
    y: 180,
    lines: ['Neo Zone holds the southeast.'],
    tint: 0xff6b4a,
  },
  {
    id: 'cave_keeper',
    name: 'Cave Keeper',
    role: 'vendor',
    x: 26,
    y: 182,
    lines: ['Mysterious cave coast. Fossils deeper in (stub).', 'Password rumors say gnomeo…'],
    tint: 0xb0a090,
  },
  {
    id: 'warp_subway_s',
    name: 'Subway Pad S',
    role: 'warp',
    x: 78,
    y: 148,
    lines: ['E to return to Start Park via subway.'],
    tint: 0x88aaff,
  },
];

export const AMBIENT_CITIZEN_SPOTS: { x: number; y: number; name: string }[] = [
  { x: 50, y: 44, name: 'Jay' },
  { x: 56, y: 45, name: 'Nia' },
  { x: 48, y: 47, name: 'Oz' },
  { x: 58, y: 44, name: 'Quin' },
  { x: 44, y: 43, name: 'Rae' },
  { x: 62, y: 46, name: 'Sky' },
  { x: 30, y: 44, name: 'Tess' },
  { x: 8, y: 44, name: 'Uma' },
  { x: 32, y: 30, name: 'Vic' },
  { x: 48, y: 30, name: 'Wes' },
  { x: 6, y: 16, name: 'Ash' },
  { x: 66, y: 6, name: 'Bea' },
  { x: 8, y: 6, name: 'Cid' },
  { x: 128, y: 8, name: 'Dot' },
  { x: 26, y: 16, name: 'Eli' },
  { x: 8, y: 56, name: 'Flo' },
  { x: 56, y: 56, name: 'Gus' },
  { x: 130, y: 10, name: 'Hana' },
  { x: 136, y: 12, name: 'Ivo' },
  { x: 116, y: 20, name: 'Jules' },
  { x: 134, y: 20, name: 'Kira' },
  { x: 118, y: 36, name: 'Lex' },
  { x: 134, y: 36, name: 'Moe' },
  { x: 120, y: 52, name: 'Nyx' },
];

const NPC_SPOTS: Record<string, [number, number]> = {
  guide_g: [54, 45],
  vendor_vee: [28, 44],
  simon_melee: [30, 45],
  exotic_aria: [32, 44],
  job_bot: [56, 46],
  officer_lane: [44, 45],
  car_dealer: [74, 43],
  fashion_faye: [48, 31],
  hat_hiro: [52, 31],
  mailman_mo: [58, 46],
  pizza_pat: [52, 48],
  spar_host: [8, 32],
  event_announcer: [68, 31],
  warp_subway_n: [50, 36],
  israfel_shells: [54, 56],
  bell_shells: [60, 56],
  wandi_crabs: [10, 58],
  beach_bri: [58, 57],
  capo_gz: [86, 32],
  capo_tachi: [76, 18],
  capo_bh: [26, 55],
  capo_bbz: [86, 54],
  south_guide: [128, 6],
  south_pizza: [136, 10],
  south_shells: [122, 52],
  mine_foreman: [116, 20],
  pirate_boss: [134, 20],
  guerre_boss: [116, 36],
  neo_boss: [134, 36],
  cave_keeper: [114, 6],
  warp_subway_s: [132, 12],
};

for (const npc of CITY_NPCS) {
  const spot = NPC_SPOTS[npc.id];
  if (spot) {
    npc.x = spot[0];
    npc.y = spot[1];
  }
}

export function createCityBots(): BotDef[] {
  const bots: BotDef[] = [];
  let n = 0;
  const add = (partial: Omit<BotDef, 'id'> & { id?: string }) => {
    n += 1;
    bots.push({ id: partial.id ?? `bot_${n}`, ...partial });
  };

  // Spar Complex
  for (let i = 0; i < 12; i++) {
    add({
      kind: 'spar_bot',
      name: `Spar Bot ${i + 1}`,
      x: 6 + (i % 6) * 2,
      y: 30 + Math.floor(i / 6) * 3,
      hp: 50,
      speed: 70,
      damage: 5,
      aggro: 220,
      respawnMs: 4000,
      loot: 8,
      tint: 0xb08cff,
    });
  }

  // Street rivals on north roads
  for (let i = 0; i < 18; i++) {
    add({
      kind: 'street_rival',
      name: `Rival ${i + 1}`,
      x: 8 + (i * 5) % 80,
      y: 26 + (i % 2),
      hp: 40,
      speed: 85,
      damage: 6,
      aggro: 180,
      respawnMs: 8000,
      loot: 12,
      tint: 0xff6b4a,
    });
  }

  // Gang enforcers at north bases
  const bases = [
    { x: 84, y: 32, name: 'GZ' },
    { x: 74, y: 18, name: 'Tachi' },
    { x: 24, y: 54, name: 'BH' },
    { x: 86, y: 52, name: 'BBZ' },
    { x: 56, y: 18, name: 'Lethal' },
    { x: 40, y: 18, name: 'Mafia' },
  ];
  bases.forEach((b, bi) => {
    for (let i = 0; i < 3; i++) {
      add({
        kind: 'gang_enforcer',
        name: `${b.name} Enforcer ${i + 1}`,
        x: b.x + i * 2,
        y: b.y + (i % 2),
        hp: 55,
        speed: 90,
        damage: 7,
        aggro: 240,
        respawnMs: 7000,
        loot: 15,
        tint: 0xff4040,
      });
    }
    void bi;
  });

  // Mercy Beach crabs
  for (let i = 0; i < 12; i++) {
    add({
      kind: 'beach_crab',
      name: `Mercy Crab ${i + 1}`,
      x: 54 + (i % 6) * 2,
      y: 55 + Math.floor(i / 6),
      hp: 18,
      speed: 55,
      damage: 3,
      aggro: 110,
      respawnMs: 6000,
      loot: 2,
      tint: 0xff9a4a,
    });
  }

  // South beach crabs
  for (let i = 0; i < 8; i++) {
    add({
      kind: 'beach_crab',
      name: `South Crab ${i + 1}`,
      x: 116 + i * 3,
      y: 52,
      hp: 18,
      speed: 55,
      damage: 3,
      aggro: 110,
      respawnMs: 6000,
      loot: 2,
      tint: 0xff9a4a,
    });
  }

  // Police near hospitals / start
  for (let i = 0; i < 8; i++) {
    add({
      kind: 'police_bot',
      name: `Patrol ${i + 1}`,
      x: 42 + i * 2,
      y: 44 + (i % 2),
      hp: 60,
      speed: 95,
      damage: 6,
      aggro: 160,
      respawnMs: 10000,
      loot: 5,
      tint: 0x4aa3ff,
    });
  }

  // Southridge gang bots
  for (let i = 0; i < 6; i++) {
    add({
      kind: 'gang_enforcer',
      name: `Pirate Guard ${i + 1}`,
      x: 132 + (i % 3) * 2,
      y: 18 + Math.floor(i / 3) * 3,
      hp: 55,
      speed: 88,
      damage: 7,
      aggro: 230,
      respawnMs: 7000,
      loot: 14,
      tint: 0xff5050,
    });
  }
  for (let i = 0; i < 5; i++) {
    add({
      kind: 'gang_enforcer',
      name: `Guerre Guard ${i + 1}`,
      x: 114 + i * 2,
      y: 36,
      hp: 55,
      speed: 88,
      damage: 7,
      aggro: 230,
      respawnMs: 7000,
      loot: 14,
      tint: 0xff5050,
    });
  }
  for (let i = 0; i < 5; i++) {
    add({
      kind: 'gang_enforcer',
      name: `Neo Guard ${i + 1}`,
      x: 132 + i * 2,
      y: 36,
      hp: 55,
      speed: 88,
      damage: 7,
      aggro: 230,
      respawnMs: 7000,
      loot: 14,
      tint: 0xff5050,
    });
  }

  // Mine pests
  for (let i = 0; i < 10; i++) {
    add({
      kind: 'mine_pest',
      name: `Mine Pest ${i + 1}`,
      x: 114 + (i % 5) * 2,
      y: 18 + Math.floor(i / 5) * 3,
      hp: 25,
      speed: 60,
      damage: 4,
      aggro: 140,
      respawnMs: 5000,
      loot: 7,
      tint: 0xa0a0a0,
    });
  }

  // Training dummies at gun row
  for (let i = 0; i < 4; i++) {
    add({
      kind: 'training_dummy',
      name: `Dummy ${i + 1}`,
      x: 26 + i * 2,
      y: 46,
      hp: 999,
      speed: 0,
      damage: 0,
      aggro: 0,
      respawnMs: 2000,
      loot: 0,
      tint: 0x888888,
    });
  }

  // Event bots near event house
  for (let i = 0; i < 6; i++) {
    add({
      kind: 'event_bot',
      name: `Arena Bot ${i + 1}`,
      x: 66 + (i % 3) * 2,
      y: 30 + Math.floor(i / 3) * 2,
      hp: 45,
      speed: 80,
      damage: 5,
      aggro: 200,
      respawnMs: 4500,
      loot: 10,
      tint: 0x8cffb0,
    });
  }

  return bots;
}
