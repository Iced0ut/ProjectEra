/** Original weapon catalog inspired by Era-style families and on-hit effects. */

export type AmmoPool = 'handgun' | 'rifle' | 'smg' | 'shotgun' | 'special' | 'none';
export type WeaponFamily =
  | 'melee'
  | 'pistol'
  | 'rifle'
  | 'smg'
  | 'lmg'
  | 'shotgun'
  | 'sniper'
  | 'launcher'
  | 'staff'
  | 'exotic'
  | 'grenade'
  | 'shield';

export type OnHitEffect =
  | 'none'
  | 'burn'
  | 'poison'
  | 'shock'
  | 'slow'
  | 'stun'
  | 'lifesteal'
  | 'knockback'
  | 'heal'
  | 'explode'
  | 'shield';

export type WeaponAbility =
  | 'none'
  | 'dash'
  | 'roll'
  | 'heal'
  | 'shield'
  | 'mode_switch'
  | 'rage'
  | 'blink'
  | 'spray'
  | 'burst'
  | 'finisher'
  | 'speed_boost'
  | 'alt_heal';

export interface WeaponDef {
  id: string;
  name: string;
  family: WeaponFamily;
  kind: 'melee' | 'gun' | 'throwable' | 'shield';
  damage: number;
  damageMax?: number;
  healAmount?: number;
  range: number;
  cooldown: number;
  /** Edge hit. Defaults from the family when omitted. */
  grazeDamage?: number;
  /** Movement lock after a shot, in ms. */
  freezeMs?: number;
  /** Bullet speed in pixels per second. */
  projectileSpeed?: number;
  /** Time to fill the clip, in ms. */
  reloadMs?: number;
  clip?: number;
  pellets?: number;
  spread?: number;
  ammo: AmmoPool;
  ability: WeaponAbility;
  abilityLabel: string;
  effect: OnHitEffect;
  effectPower: number;
  cost: number;
  shop: 'melee' | 'guns' | 'exotic' | 'event' | 'starter' | 'grenades';
}

function w(partial: WeaponDef): WeaponDef {
  return partial;
}

export const WEAPONS: Record<string, WeaponDef> = {
  // ---- Starter / Melee ----
  street_bat: w({
    id: 'street_bat', name: 'Street Bat', family: 'melee', kind: 'melee',
    damage: 8, range: 42, cooldown: 280, ammo: 'none',
    ability: 'dash', abilityLabel: 'Dash', effect: 'knockback', effectPower: 180,
    cost: 0, shop: 'starter',
  }),
  starter_knife: w({
    id: 'starter_knife', name: 'Starter Knife', family: 'melee', kind: 'melee',
    damage: 7, range: 36, cooldown: 220, ammo: 'none',
    ability: 'roll', abilityLabel: 'Roll', effect: 'none', effectPower: 0,
    cost: 0, shop: 'starter',
  }),
  broken_bottle: w({
    id: 'broken_bottle', name: 'Broken Bottle', family: 'melee', kind: 'melee',
    damage: 5, range: 34, cooldown: 200, ammo: 'none',
    ability: 'none', abilityLabel: 'Bleed Jab', effect: 'poison', effectPower: 3,
    cost: 65, shop: 'melee',
  }),
  nightstick: w({
    id: 'nightstick', name: 'Nightstick', family: 'melee', kind: 'melee',
    damage: 8, range: 40, cooldown: 260, ammo: 'none',
    ability: 'none', abilityLabel: 'Stun Tap', effect: 'stun', effectPower: 700,
    cost: 500, shop: 'melee',
  }),
  wood_plank: w({
    id: 'wood_plank', name: 'Wood Plank', family: 'melee', kind: 'melee',
    damage: 7, range: 44, cooldown: 300, ammo: 'none',
    ability: 'none', abilityLabel: 'Heavy Swing', effect: 'knockback', effectPower: 220,
    cost: 200, shop: 'melee',
  }),
  rainbow_rod: w({
    id: 'rainbow_rod', name: 'Rainbow Rod', family: 'melee', kind: 'melee',
    damage: 6, healAmount: 4, range: 46, cooldown: 280, ammo: 'none',
    ability: 'heal', abilityLabel: 'Heal / Hide', effect: 'heal', effectPower: 4,
    cost: 3000, shop: 'event',
  }),
  bamboo_rod: w({
    id: 'bamboo_rod', name: 'Bamboo Rod', family: 'melee', kind: 'melee',
    damage: 8, range: 50, cooldown: 260, ammo: 'none',
    ability: 'none', abilityLabel: 'Push Wave', effect: 'knockback', effectPower: 260,
    cost: 3500, shop: 'event',
  }),
  golden_knuckles: w({
    id: 'golden_knuckles', name: 'Golden Knuckles', family: 'melee', kind: 'melee',
    damage: 9, range: 32, cooldown: 180, ammo: 'none',
    ability: 'spray', abilityLabel: 'Flurry', effect: 'none', effectPower: 0,
    cost: 2000, shop: 'melee',
  }),
  toxic_dagger: w({
    id: 'toxic_dagger', name: 'Toxic Dagger', family: 'melee', kind: 'melee',
    damage: 12, range: 34, cooldown: 190, ammo: 'none',
    ability: 'none', abilityLabel: 'Venom Push', effect: 'poison', effectPower: 5,
    cost: 9000, shop: 'event',
  }),
  lokki_chucks: w({
    id: 'lokki_chucks', name: "Lokki's Chucks", family: 'melee', kind: 'melee',
    damage: 8, range: 48, cooldown: 240, ammo: 'none',
    ability: 'dash', abilityLabel: 'Chain Dash', effect: 'knockback', effectPower: 160,
    cost: 5000, shop: 'melee',
  }),
  zanmato: w({
    id: 'zanmato', name: 'Zanmato', family: 'melee', kind: 'melee',
    damage: 10, range: 46, cooldown: 230, ammo: 'none',
    ability: 'none', abilityLabel: 'Flame Edge', effect: 'burn', effectPower: 4,
    cost: 8500, shop: 'event',
  }),
  legend_blade: w({
    id: 'legend_blade', name: 'Legend Blade', family: 'melee', kind: 'melee',
    damage: 9, healAmount: 2, range: 44, cooldown: 250, ammo: 'none',
    ability: 'heal', abilityLabel: 'Heal on Hit', effect: 'lifesteal', effectPower: 2,
    cost: 5500, shop: 'exotic',
  }),
  stun_prod: w({
    id: 'stun_prod', name: 'Stun Prod', family: 'melee', kind: 'melee',
    damage: 8, range: 38, cooldown: 260, ammo: 'none',
    ability: 'none', abilityLabel: 'Shock Stun', effect: 'stun', effectPower: 900,
    cost: 4200, shop: 'event',
  }),
  scimitar: w({
    id: 'scimitar', name: 'Desert Scimitar', family: 'melee', kind: 'melee',
    damage: 9, range: 44, cooldown: 240, ammo: 'none',
    ability: 'none', abilityLabel: 'Arc Slash', effect: 'none', effectPower: 0,
    cost: 6500, shop: 'melee',
  }),
  brass_lighter: w({
    id: 'brass_lighter', name: 'Brass Lighter', family: 'melee', kind: 'melee',
    damage: 8, range: 30, cooldown: 210, ammo: 'none',
    ability: 'none', abilityLabel: 'Ignite', effect: 'burn', effectPower: 3,
    cost: 3800, shop: 'event',
  }),
  pirate_cutlass: w({
    id: 'pirate_cutlass', name: 'Pirate Cutlass', family: 'melee', kind: 'melee',
    damage: 9, range: 42, cooldown: 240, ammo: 'none',
    ability: 'none', abilityLabel: 'Boarding Slash', effect: 'none', effectPower: 0,
    cost: 7000, shop: 'melee',
  }),
  gold_captain_sword: w({
    id: 'gold_captain_sword', name: "Captain's Gold Sword", family: 'melee', kind: 'melee',
    damage: 10, range: 44, cooldown: 250, ammo: 'none',
    ability: 'none', abilityLabel: 'Command Cut', effect: 'knockback', effectPower: 150,
    cost: 10000, shop: 'exotic',
  }),
  ghurka_dagger: w({
    id: 'ghurka_dagger', name: 'Ghurka Dagger', family: 'melee', kind: 'melee',
    damage: 10, range: 36, cooldown: 200, ammo: 'none',
    ability: 'roll', abilityLabel: 'Quick Step', effect: 'none', effectPower: 0,
    cost: 10000, shop: 'melee',
  }),
  ninja_hammer: w({
    id: 'ninja_hammer', name: 'Ninja Hammer', family: 'melee', kind: 'melee',
    damage: 10, range: 40, cooldown: 280, ammo: 'none',
    ability: 'blink', abilityLabel: 'Shadow Warp', effect: 'shock', effectPower: 4,
    cost: 15000, shop: 'exotic',
  }),
  moon_staff: w({
    id: 'moon_staff', name: 'Twinkle Moon Staff', family: 'staff', kind: 'melee',
    damage: 8, healAmount: 3, range: 48, cooldown: 270, ammo: 'none',
    ability: 'heal', abilityLabel: 'Moon Heal', effect: 'heal', effectPower: 3,
    cost: 11000, shop: 'exotic',
  }),
  black_katana: w({
    id: 'black_katana', name: 'Black Katana', family: 'melee', kind: 'melee',
    damage: 9, range: 46, cooldown: 190, ammo: 'none',
    ability: 'roll', abilityLabel: 'Quick Recover', effect: 'none', effectPower: 0,
    cost: 4500, shop: 'melee',
  }),
  bloody_katana: w({
    id: 'bloody_katana', name: 'Bloody Katana', family: 'melee', kind: 'melee',
    damage: 9, range: 46, cooldown: 210, ammo: 'none',
    ability: 'none', abilityLabel: 'Life Draw', effect: 'lifesteal', effectPower: 3,
    cost: 8000, shop: 'melee',
  }),
  hellfire_katana: w({
    id: 'hellfire_katana', name: 'Hellfire Katana', family: 'melee', kind: 'melee',
    damage: 10, damageMax: 12, range: 48, cooldown: 230, ammo: 'none',
    ability: 'rage', abilityLabel: 'Rage Dash', effect: 'burn', effectPower: 5,
    cost: 18000, shop: 'exotic',
  }),
  magma_axe: w({
    id: 'magma_axe', name: 'Magma Axe', family: 'melee', kind: 'melee',
    damage: 10, range: 44, cooldown: 320, ammo: 'none',
    ability: 'none', abilityLabel: 'Molten Cleaver', effect: 'burn', effectPower: 4,
    cost: 12000, shop: 'melee',
  }),
  dreaded_axe: w({
    id: 'dreaded_axe', name: 'Dreaded Bloody Axe', family: 'melee', kind: 'melee',
    damage: 8, damageMax: 10, range: 44, cooldown: 300, ammo: 'none',
    ability: 'none', abilityLabel: 'Blood Cleaver', effect: 'lifesteal', effectPower: 3,
    cost: 14000, shop: 'exotic',
  }),
  harvest_blade: w({
    id: 'harvest_blade', name: 'Harvester Blade', family: 'melee', kind: 'melee',
    damage: 9, range: 42, cooldown: 250, ammo: 'none',
    ability: 'none', abilityLabel: 'Root Chop', effect: 'slow', effectPower: 1200,
    cost: 7000, shop: 'event',
  }),
  scythe_reaper: w({
    id: 'scythe_reaper', name: 'Reaper Scythe', family: 'melee', kind: 'melee',
    damage: 11, range: 52, cooldown: 340, ammo: 'none',
    ability: 'dash', abilityLabel: 'Reap Dash', effect: 'lifesteal', effectPower: 2,
    cost: 16000, shop: 'exotic',
  }),
  riot_shield: w({
    id: 'riot_shield', name: 'Riot Shield', family: 'shield', kind: 'shield',
    damage: 4, range: 30, cooldown: 400, ammo: 'none',
    ability: 'shield', abilityLabel: 'Guard (50% DR)', effect: 'shield', effectPower: 0.5,
    cost: 3500, shop: 'melee',
  }),

  // ---- Pistols ----
  city_pistol: w({
    id: 'city_pistol', name: 'City Pistol', family: 'pistol', kind: 'gun',
    damage: 9.5, range: 220, cooldown: 280, clip: 18, ammo: 'handgun',
    ability: 'mode_switch', abilityLabel: 'Alt Fire Mode', effect: 'none', effectPower: 0,
    cost: 250, shop: 'guns',
  }),
  eagle_magnum: w({
    id: 'eagle_magnum', name: 'Eagle Magnum', family: 'pistol', kind: 'gun',
    damage: 11, range: 240, cooldown: 340, clip: 9, ammo: 'handgun',
    ability: 'none', abilityLabel: 'Pinpoint', effect: 'none', effectPower: 0,
    cost: 2200, shop: 'guns',
  }),
  dual_sidearms: w({
    id: 'dual_sidearms', name: 'Dual Sidearms', family: 'pistol', kind: 'gun',
    damage: 8, range: 200, cooldown: 150, clip: 24, ammo: 'handgun',
    ability: 'spray', abilityLabel: 'Twin Fire', effect: 'none', effectPower: 0,
    cost: 5000, shop: 'guns',
  }),
  machine_pistol: w({
    id: 'machine_pistol', name: 'Machine Pistol', family: 'pistol', kind: 'gun',
    damage: 7, range: 190, cooldown: 90, clip: 20, ammo: 'handgun',
    ability: 'spray', abilityLabel: 'Full Auto Sidearm', effect: 'none', effectPower: 0,
    cost: 3200, shop: 'guns',
  }),

  // ---- Rifles / SMG / LMG ----
  urban_rifle: w({
    id: 'urban_rifle', name: 'Urban Rifle', family: 'rifle', kind: 'gun',
    damage: 9.5, range: 280, cooldown: 120, clip: 16, ammo: 'rifle',
    ability: 'none', abilityLabel: 'Full Auto', effect: 'none', effectPower: 0,
    cost: 3500, shop: 'guns',
  }),
  burst_carbine: w({
    id: 'burst_carbine', name: 'Burst Carbine', family: 'rifle', kind: 'gun',
    damage: 11, range: 300, cooldown: 180, clip: 16, ammo: 'rifle',
    ability: 'burst', abilityLabel: '3-Round Burst', effect: 'none', effectPower: 0,
    cost: 4800, shop: 'guns',
  }),
  last_round_rifle: w({
    id: 'last_round_rifle', name: 'Last-Round Rifle', family: 'rifle', kind: 'gun',
    damage: 11, damageMax: 13, range: 290, cooldown: 140, clip: 12, ammo: 'rifle',
    ability: 'finisher', abilityLabel: 'Finisher Round', effect: 'none', effectPower: 0,
    cost: 7000, shop: 'guns',
  }),
  gold_smg: w({
    id: 'gold_smg', name: 'Gold SMG', family: 'smg', kind: 'gun',
    damage: 9, range: 210, cooldown: 90, clip: 20, ammo: 'smg',
    ability: 'spray', abilityLabel: 'Spray', effect: 'none', effectPower: 0,
    cost: 4200, shop: 'guns',
  }),
  rapid_smg: w({
    id: 'rapid_smg', name: 'Rapid SMG', family: 'smg', kind: 'gun',
    damage: 6, range: 200, cooldown: 70, clip: 28, ammo: 'smg',
    ability: 'spray', abilityLabel: 'Clip Dump', effect: 'none', effectPower: 0,
    cost: 2800, shop: 'guns',
  }),
  compact_smg: w({
    id: 'compact_smg', name: 'Compact SMG', family: 'smg', kind: 'gun',
    damage: 7.5, range: 195, cooldown: 85, clip: 22, ammo: 'smg',
    ability: 'roll', abilityLabel: 'Slide Fire', effect: 'none', effectPower: 0,
    cost: 3600, shop: 'guns',
  }),
  drum_lmg: w({
    id: 'drum_lmg', name: 'Drum LMG', family: 'lmg', kind: 'gun',
    damage: 5, range: 260, cooldown: 80, clip: 40, spread: 0.18, ammo: 'handgun',
    ability: 'spray', abilityLabel: 'Suppression', effect: 'none', effectPower: 0,
    cost: 9000, shop: 'guns',
  }),
  heavy_lmg: w({
    id: 'heavy_lmg', name: 'Heavy LMG', family: 'lmg', kind: 'gun',
    damage: 11, range: 270, cooldown: 110, clip: 25, spread: 0.12, ammo: 'rifle',
    ability: 'none', abilityLabel: 'Brace Fire', effect: 'knockback', effectPower: 80,
    cost: 11000, shop: 'guns',
  }),

  // ---- Shotguns / Snipers / Launchers ----
  auto_shotgun: w({
    id: 'auto_shotgun', name: 'Auto Shotgun', family: 'shotgun', kind: 'gun',
    damage: 9.5, range: 140, cooldown: 220, clip: 12, pellets: 3, spread: 0.25, ammo: 'shotgun',
    ability: 'none', abilityLabel: 'Pellet Storm', effect: 'knockback', effectPower: 200,
    cost: 6500, shop: 'guns',
  }),
  deathman_shotgun: w({
    id: 'deathman_shotgun', name: 'Death-Man Shotgun', family: 'shotgun', kind: 'gun',
    damage: 3, range: 130, cooldown: 260, clip: 8, pellets: 4, spread: 0.3, ammo: 'shotgun',
    ability: 'speed_boost', abilityLabel: 'Speed Boost', effect: 'none', effectPower: 0,
    cost: 14000, shop: 'exotic',
  }),
  pump_shotgun: w({
    id: 'pump_shotgun', name: 'Pump Shotgun', family: 'shotgun', kind: 'gun',
    damage: 12, range: 120, cooldown: 450, clip: 6, pellets: 5, spread: 0.28, ammo: 'shotgun',
    ability: 'none', abilityLabel: 'Close Blast', effect: 'knockback', effectPower: 260,
    cost: 4800, shop: 'guns',
  }),
  longshot_sniper: w({
    id: 'longshot_sniper', name: 'Longshot Sniper', family: 'sniper', kind: 'gun',
    damage: 16, range: 480, cooldown: 700, clip: 5, ammo: 'rifle',
    ability: 'none', abilityLabel: 'Hold Breath', effect: 'none', effectPower: 0,
    cost: 12000, shop: 'guns',
  }),
  antimatter_sniper: w({
    id: 'antimatter_sniper', name: 'Anti-Matter Sniper', family: 'sniper', kind: 'gun',
    damage: 18, range: 500, cooldown: 780, clip: 4, ammo: 'special',
    ability: 'none', abilityLabel: 'Pierce Burst', effect: 'explode', effectPower: 40,
    cost: 22000, shop: 'exotic',
  }),
  grenade_launcher: w({
    id: 'grenade_launcher', name: 'Grenade Launcher', family: 'launcher', kind: 'gun',
    damage: 10, range: 260, cooldown: 500, clip: 6, ammo: 'special',
    ability: 'none', abilityLabel: 'Arc Bomb', effect: 'explode', effectPower: 56,
    cost: 15000, shop: 'guns',
  }),
  artillery_cannon: w({
    id: 'artillery_cannon', name: 'Artillery Cannon', family: 'launcher', kind: 'gun',
    damage: 14, range: 300, cooldown: 900, clip: 2, ammo: 'special',
    ability: 'none', abilityLabel: 'Barrage', effect: 'explode', effectPower: 72,
    cost: 25000, shop: 'exotic',
  }),

  // ---- Staffs / Exotics ----
  ice_mage_staff: w({
    id: 'ice_mage_staff', name: 'Ice Mage Staff', family: 'staff', kind: 'gun',
    damage: 8, damageMax: 10, healAmount: 6, range: 240, cooldown: 300, clip: 12, ammo: 'special',
    ability: 'alt_heal', abilityLabel: 'Heal Beam / Frost', effect: 'heal', effectPower: 6,
    cost: 16000, shop: 'exotic',
  }),
  sky_guardian_rifle: w({
    id: 'sky_guardian_rifle', name: 'Sky Guardian Rifle', family: 'rifle', kind: 'gun',
    damage: 10, healAmount: 4, range: 280, cooldown: 160, clip: 18, ammo: 'rifle',
    ability: 'alt_heal', abilityLabel: 'Alt Heal Fire', effect: 'heal', effectPower: 4,
    cost: 19000, shop: 'exotic',
  }),
  vanquisher: w({
    id: 'vanquisher', name: 'Vanquisher', family: 'exotic', kind: 'gun',
    damage: 8, damageMax: 14, range: 260, cooldown: 150, clip: 20, ammo: 'special',
    ability: 'mode_switch', abilityLabel: 'Mode Switch x3', effect: 'shock', effectPower: 4,
    cost: 30000, shop: 'exotic',
  }),
  chroma_nova: w({
    id: 'chroma_nova', name: 'Chroma Nova', family: 'exotic', kind: 'gun',
    damage: 7, damageMax: 11.5, range: 250, cooldown: 140, clip: 22, ammo: 'special',
    ability: 'mode_switch', abilityLabel: 'Prism Modes', effect: 'burn', effectPower: 3,
    cost: 32000, shop: 'exotic',
  }),
  excm_burner: w({
    id: 'excm_burner', name: 'EXCM Burner', family: 'rifle', kind: 'gun',
    damage: 10, damageMax: 11.5, range: 270, cooldown: 150, clip: 14, ammo: 'rifle',
    ability: 'rage', abilityLabel: 'Burn Explosion', effect: 'burn', effectPower: 5,
    cost: 21000, shop: 'exotic',
  }),
  plasma_beamer: w({
    id: 'plasma_beamer', name: 'Plasma Beamer', family: 'exotic', kind: 'gun',
    damage: 9, range: 300, cooldown: 130, clip: 30, ammo: 'special',
    ability: 'none', abilityLabel: 'Beam', effect: 'shock', effectPower: 3,
    cost: 17000, shop: 'exotic',
  }),

  // ---- Grenades ----
  petrol_bomb: w({
    id: 'petrol_bomb', name: 'Petrol Bomb', family: 'grenade', kind: 'throwable',
    damage: 8, range: 120, cooldown: 800, ammo: 'none',
    ability: 'none', abilityLabel: 'Fire Pool', effect: 'burn', effectPower: 4,
    cost: 400, shop: 'grenades',
  }),
  smoke_grenade: w({
    id: 'smoke_grenade', name: 'Smoke Grenade', family: 'grenade', kind: 'throwable',
    damage: 2, range: 130, cooldown: 900, ammo: 'none',
    ability: 'none', abilityLabel: 'Cover Cloud', effect: 'slow', effectPower: 1500,
    cost: 250, shop: 'grenades',
  }),
  trip_mine: w({
    id: 'trip_mine', name: 'Trip Mine', family: 'grenade', kind: 'throwable',
    damage: 12, range: 40, cooldown: 1000, ammo: 'none',
    ability: 'none', abilityLabel: 'Place Trap', effect: 'explode', effectPower: 48,
    cost: 600, shop: 'grenades',
  }),
  satchel_charge: w({
    id: 'satchel_charge', name: 'Satchel Charge', family: 'grenade', kind: 'throwable',
    damage: 14, range: 80, cooldown: 1100, ammo: 'none',
    ability: 'none', abilityLabel: 'Remote Pop', effect: 'explode', effectPower: 64,
    cost: 900, shop: 'grenades',
  }),
  water_bomb: w({
    id: 'water_bomb', name: 'Water Bomb', family: 'grenade', kind: 'throwable',
    damage: 3, range: 110, cooldown: 700, ammo: 'none',
    ability: 'none', abilityLabel: 'Soak', effect: 'slow', effectPower: 1000,
    cost: 150, shop: 'event',
  }),
  garlic_bomb: w({
    id: 'garlic_bomb', name: 'Garlic Bomb', family: 'grenade', kind: 'throwable',
    damage: 5, range: 115, cooldown: 850, ammo: 'none',
    ability: 'none', abilityLabel: 'Gas Cloud', effect: 'poison', effectPower: 4,
    cost: 350, shop: 'grenades',
  }),
  dynamite: w({
    id: 'dynamite', name: 'Dynamite', family: 'grenade', kind: 'throwable',
    damage: 15, range: 100, cooldown: 1200, ammo: 'none',
    ability: 'none', abilityLabel: 'Fuse Boom', effect: 'explode', effectPower: 70,
    cost: 800, shop: 'grenades',
  }),
  c4_pack: w({
    id: 'c4_pack', name: 'C4 Pack', family: 'grenade', kind: 'throwable',
    damage: 18, range: 70, cooldown: 1300, ammo: 'none',
    ability: 'none', abilityLabel: 'Detonate', effect: 'explode', effectPower: 80,
    cost: 1200, shop: 'grenades',
  }),
};

export const WEAPON_LIST = Object.values(WEAPONS);

export type HeldStyle = 'none' | 'melee' | 'gun' | 'staff';

const FAMILY_TIMING: Record<WeaponFamily, { freezeMs: number; projectileSpeed: number; reloadMs: number; graze: number }> = {
  melee: { freezeMs: 70, projectileSpeed: 0, reloadMs: 0, graze: 1 },
  pistol: { freezeMs: 100, projectileSpeed: 460, reloadMs: 800, graze: 0.45 },
  rifle: { freezeMs: 120, projectileSpeed: 520, reloadMs: 1000, graze: 0.5 },
  smg: { freezeMs: 45, projectileSpeed: 500, reloadMs: 950, graze: 0.4 },
  lmg: { freezeMs: 70, projectileSpeed: 480, reloadMs: 1400, graze: 0.4 },
  shotgun: { freezeMs: 170, projectileSpeed: 340, reloadMs: 1200, graze: 0.3 },
  sniper: { freezeMs: 260, projectileSpeed: 780, reloadMs: 1500, graze: 0.6 },
  launcher: { freezeMs: 200, projectileSpeed: 280, reloadMs: 1600, graze: 0.5 },
  staff: { freezeMs: 90, projectileSpeed: 400, reloadMs: 700, graze: 0.5 },
  exotic: { freezeMs: 80, projectileSpeed: 450, reloadMs: 900, graze: 0.45 },
  grenade: { freezeMs: 60, projectileSpeed: 260, reloadMs: 0, graze: 0.5 },
  shield: { freezeMs: 40, projectileSpeed: 0, reloadMs: 0, graze: 1 },
};

export interface WeaponTiming {
  grazeDamage: number;
  freezeMs: number;
  projectileSpeed: number;
  reloadMs: number;
  clip: number;
  spread: number;
}

export function weaponTiming(weapon: WeaponDef): WeaponTiming {
  const family = FAMILY_TIMING[weapon.family];
  const graze = weapon.grazeDamage ?? Math.max(1, Math.round(weapon.damage * family.graze));
  return {
    grazeDamage: graze,
    freezeMs: weapon.freezeMs ?? family.freezeMs,
    projectileSpeed: weapon.projectileSpeed ?? family.projectileSpeed,
    reloadMs: weapon.reloadMs ?? family.reloadMs,
    clip: weapon.clip ?? 0,
    spread: weapon.spread ?? 0,
  };
}

export function heldStyle(weapon: WeaponDef): HeldStyle {
  if (weapon.family === 'staff') return 'staff';
  if (weapon.kind === 'melee' || weapon.kind === 'shield') return 'melee';
  if (weapon.kind === 'gun' || weapon.kind === 'throwable') return 'gun';
  return 'none';
}

export function weaponsByShop(shop: WeaponDef['shop']): WeaponDef[] {
  return WEAPON_LIST.filter((wpn) => wpn.shop === shop);
}

export function weaponsByFamily(family: WeaponFamily): WeaponDef[] {
  return WEAPON_LIST.filter((wpn) => wpn.family === family);
}
