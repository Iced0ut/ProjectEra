/** City population spread across the continent. */

import { districtById, type DistrictId } from './districts';

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
      'You spawn in the Starter Area plaza — not on the sand.',
      'WASD move, Space attack, Q ability, E talk. Dig shells on Mercy Beach, the south shore.',
      'Southridge is east across the river bridges, or take the subway pad.',
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
  ...crowd('start_park', ['Jay', 'Nia', 'Oz', 'Quin', 'Rae']),
  ...crowd('downtown', ['Sky', 'Tess', 'Uma']),
  ...crowd('fashion_mall', ['Vic', 'Wes']),
  ...crowd('harbour', ['Flo', 'Gus']),
  ...crowd('airport', ['Ash', 'Cid']),
  ...crowd('snow_resort', ['Bea', 'Eli']),
  ...crowd('southridge', ['Dot', 'Hana', 'Ivo']),
  ...crowd('south_beach', ['Nyx', 'Jules']),
  ...crowd('mercy_beach', ['Kira', 'Lex']),
];

function crowd(id: DistrictId, names: string[]): { x: number; y: number; name: string }[] {
  const d = districtById(id);
  const y = d.y + Math.max(1, Math.floor(d.h / 2));
  return names.map((name, i) => ({
    x: Math.min(d.x + d.w - 2, d.x + 2 + i * 2),
    y,
    name,
  }));
}

function at(id: DistrictId, ox: number, oy: number): [number, number] {
  const d = districtById(id);
  const y = d.y + Math.max(1, Math.min(d.h - 2, Math.floor(d.h / 2) + (oy % 2)));
  const x = d.x + Math.max(1, Math.min(d.w - 2, ox));
  return [x, y];
}

const NPC_SPOTS: Record<string, [number, number]> = {
  guide_g: at('start_park', 6, 5),
  vendor_vee: at('gun_row', 8, 4),
  simon_melee: at('gun_row', 12, 6),
  exotic_aria: at('gun_row', 6, 8),
  job_bot: at('start_park', 14, 6),
  officer_lane: at('start_park', 4, 8),
  car_dealer: at('car_row', 8, 6),
  fashion_faye: at('fashion_mall', 8, 5),
  hat_hiro: at('fashion_mall', 14, 6),
  mailman_mo: at('start_park', 16, 4),
  pizza_pat: at('downtown', 12, 22),
  spar_host: at('spar_complex', 12, 8),
  event_announcer: at('event_house', 10, 6),
  warp_subway_n: at('subway', 6, 4),
  israfel_shells: at('mercy_beach', 12, 5),
  bell_shells: at('mercy_beach', 30, 7),
  wandi_crabs: at('mercy_beach', 50, 5),
  beach_bri: at('mercy_beach', 20, 8),
  capo_gz: at('gz', 8, 6),
  capo_tachi: at('tachi', 10, 6),
  capo_bh: at('blackholst', 8, 6),
  capo_bbz: at('bbz', 8, 6),
  south_guide: at('southridge', 8, 8),
  south_pizza: at('southridge', 28, 10),
  south_shells: at('south_beach', 16, 6),
  mine_foreman: at('south_mines', 10, 10),
  pirate_boss: at('pirate_zone', 10, 6),
  guerre_boss: at('guerre', 10, 6),
  neo_boss: at('neo', 10, 6),
  cave_keeper: at('cave_coast', 8, 6),
  warp_subway_s: at('southridge', 14, 18),
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
  const d = districtById;

  const spar = d('spar_complex');
  for (let i = 0; i < 8; i++) {
    add({
      kind: 'spar_bot',
      name: `Spar Bot ${i + 1}`,
      x: spar.x + 3 + (i % 4) * 4,
      y: spar.y + 3 + Math.floor(i / 4) * 5,
      hp: 50,
      speed: 70,
      damage: 5,
      aggro: 220,
      respawnMs: 4000,
      loot: 8,
      tint: 0xb08cff,
    });
  }

  const rivals = [
    ['parkland', 8, 8],
    ['skate_park', 6, 6],
    ['hotel_row', 6, 6],
    ['car_row', 6, 6],
    ['gun_row', 6, 4],
    ['harbour', 8, 4],
    ['southridge', 8, 6],
    ['cave_coast', 6, 6],
    ['south_mines', 8, 8],
    ['water_park', 6, 6],
    ['power_plant', 6, 6],
    ['auction', 8, 4],
  ] as const;
  rivals.forEach(([id, ox], i) => {
    const spot = d(id);
    add({
      kind: 'street_rival',
      name: `Rival ${i + 1}`,
      x: spot.x + Math.min(spot.w - 2, ox),
      y: spot.y + Math.floor(spot.h / 2),
      hp: 40,
      speed: 85,
      damage: 6,
      aggro: 180,
      respawnMs: 8000,
      loot: 12,
      tint: 0xff6b4a,
    });
  });

  const bases = ['gz', 'tachi', 'blackholst', 'bbz', 'lethal', 'mafia', 'pirate_zone', 'guerre', 'neo', 'box_factory'] as const;
  bases.forEach((id) => {
    const spot = d(id);
    for (let i = 0; i < 2; i++) {
      add({
        kind: 'gang_enforcer',
        name: `${spot.name.split(' ')[0]} Guard ${i + 1}`,
        x: spot.x + 3 + i * 3,
        y: spot.y + Math.floor(spot.h / 2),
        hp: 55,
        speed: 90,
        damage: 7,
        aggro: 240,
        respawnMs: 7000,
        loot: 15,
        tint: 0xff4040,
      });
    }
  });

  const mercy = d('mercy_beach');
  for (let i = 0; i < 8; i++) {
    add({
      kind: 'beach_crab',
      name: `Mercy Crab ${i + 1}`,
      x: mercy.x + 6 + (i % 4) * 8,
      y: mercy.y + 4 + Math.floor(i / 4) * 4,
      hp: 18,
      speed: 55,
      damage: 3,
      aggro: 110,
      respawnMs: 6000,
      loot: 2,
      tint: 0xff9a4a,
    });
  }
  const southSand = d('south_beach');
  for (let i = 0; i < 6; i++) {
    add({
      kind: 'beach_crab',
      name: `South Crab ${i + 1}`,
      x: southSand.x + 8 + i * 6,
      y: southSand.y + 6,
      hp: 18,
      speed: 55,
      damage: 3,
      aggro: 110,
      respawnMs: 6000,
      loot: 2,
      tint: 0xff9a4a,
    });
  }

  const plaza = d('start_park');
  for (let i = 0; i < 4; i++) {
    add({
      kind: 'police_bot',
      name: `Patrol ${i + 1}`,
      x: plaza.x + 3 + i * 4,
      y: plaza.y + 10,
      hp: 60,
      speed: 95,
      damage: 6,
      aggro: 160,
      respawnMs: 10000,
      loot: 5,
      tint: 0x4aa3ff,
    });
  }

  const mines = d('south_mines');
  for (let i = 0; i < 6; i++) {
    add({
      kind: 'mine_pest',
      name: `Mine Pest ${i + 1}`,
      x: mines.x + 4 + (i % 3) * 6,
      y: mines.y + 4 + Math.floor(i / 3) * 6,
      hp: 25,
      speed: 60,
      damage: 4,
      aggro: 140,
      respawnMs: 5000,
      loot: 7,
      tint: 0xa0a0a0,
    });
  }

  const guns = d('gun_row');
  for (let i = 0; i < 3; i++) {
    add({
      kind: 'training_dummy',
      name: `Dummy ${i + 1}`,
      x: guns.x + 4 + i * 4,
      y: guns.y + 8,
      hp: 999,
      speed: 0,
      damage: 0,
      aggro: 0,
      respawnMs: 2000,
      loot: 0,
      tint: 0x888888,
    });
  }

  const event = d('event_house');
  for (let i = 0; i < 4; i++) {
    add({
      kind: 'event_bot',
      name: `Arena Bot ${i + 1}`,
      x: event.x + 4 + (i % 2) * 6,
      y: event.y + 4 + Math.floor(i / 2) * 4,
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
