import { WEAPONS } from './content/weapons';

export type JobId =
  | 'fishing'
  | 'mining'
  | 'digging'
  | 'trash'
  | 'pizza'
  | 'mushrooms'
  | 'flowers'
  | 'mail'
  | 'cars';

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
}

export interface PlayerProfile {
  name: string;
  hair: number;
  shirt: number;
  pants: number;
  hat: number;
  customSkinDataUrl?: string;
}

export interface AmmoPools {
  handgun: number;
  rifle: number;
  smg: number;
  shotgun: number;
  special: number;
}

export interface GameState {
  profile: PlayerProfile;
  hp: number;
  maxHp: number;
  gralats: number;
  weapon: string;
  ownedWeapons: string[];
  ammo: AmmoPools;
  clipLeft: number;
  inventory: InventoryItem[];
  kills: number;
  jobXp: Record<JobId, number>;
  jobLevel: Record<JobId, number>;
  gangName: string | null;
  gangRank: string;
  houseOwned: boolean;
  furniture: string[];
  ownedHats: string[];
  ownedOutfits: string[];
  ownedMounts: string[];
  ownedCars: string[];
  ownedMorphs: string[];
  activeMount: string | null;
  activeCar: string | null;
  activeMorph: string | null;
  equippedHat: string;
  shovelCount: number;
  shovelUses: number;
  diggingEquipped: boolean;
  shieldUntil: number;
  speedBoostUntil: number;
  abilityReadyAt: number;
  altHealMode: boolean;
  achievements: string[];
  chatLog: string[];
  /** Short combat readout: Reloading, Freeze, or a job. Not stored as progress. */
  combatNote: string;
  killStreak: number;
  dailyStamp: string;
  dailyChallenges: { id: string; label: string; goal: number; progress: number; reward: number; claimed: boolean }[];
  challengesClaimed: number;
  seaCoins: number;
  plasmaCoins: number;
  gangCoins: number;
  bankPaidAt: number;
  /** Last outdoor position. Null until the player has stood on the city map. */
  worldX: number | null;
  worldY: number | null;
}

const JOBS: JobId[] = [
  'fishing',
  'mining',
  'digging',
  'trash',
  'pizza',
  'mushrooms',
  'flowers',
  'mail',
  'cars',
];

export function createInitialState(profile: PlayerProfile): GameState {
  const jobXp = Object.fromEntries(JOBS.map((j) => [j, 0])) as Record<JobId, number>;
  const jobLevel = Object.fromEntries(JOBS.map((j) => [j, 1])) as Record<JobId, number>;
  return {
    profile,
    hp: 50,
    maxHp: 50,
    gralats: 2500,
    weapon: 'street_bat',
    ownedWeapons: ['street_bat', 'starter_knife', 'city_pistol'],
    ammo: { handgun: 120, rifle: 90, smg: 120, shotgun: 40, special: 30 },
    clipLeft: WEAPONS.city_pistol.clip ?? 0,
    inventory: [
      { id: 'food', name: 'Street Snack', count: 5 },
      { id: 'trochus', name: 'Trochus', count: 0 },
      { id: 'aerolata', name: 'Aerolata', count: 0 },
      { id: 'sand_dollar', name: 'Sand Dollar', count: 0 },
      { id: 'scallop', name: 'Scallop', count: 0 },
      { id: 'starfish', name: 'Starfish', count: 0 },
      { id: 'crab_shell_black', name: 'Black Crab Shell', count: 0 },
      { id: 'crab_shell_blue', name: 'Blue Crab Shell', count: 0 },
      { id: 'crab_shell_green', name: 'Green Crab Shell', count: 0 },
      { id: 'crab_shell_red', name: 'Red Crab Shell', count: 0 },
      { id: 'crab_shell_yellow', name: 'Yellow Crab Shell', count: 0 },
      { id: 'ore', name: 'Ore', count: 0 },
      { id: 'rock', name: 'Rock', count: 0 },
      { id: 'iron', name: 'Iron', count: 0 },
      { id: 'gold', name: 'Gold', count: 0 },
      { id: 'diamond', name: 'Diamond', count: 0 },
      { id: 'fish', name: 'Fish', count: 0 },
      { id: 'trash', name: 'Trash Bag', count: 0 },
      { id: 'mushroom', name: 'Mushroom', count: 0 },
      { id: 'flower', name: 'Flower', count: 0 },
      { id: 'pizza', name: 'Pizza Box', count: 0 },
      { id: 'mail', name: 'Mail Bundle', count: 0 },
      { id: 'car_part', name: 'Car Part', count: 0 },
      { id: 'petrol_bomb', name: 'Petrol Bomb', count: 2 },
      { id: 'smoke_grenade', name: 'Smoke Grenade', count: 2 },
    ],
    kills: 0,
    jobXp,
    jobLevel,
    gangName: null,
    gangRank: 'Recruit',
    houseOwned: false,
    furniture: [],
    ownedHats: ['none', 'cap', 'beanie', 'crown'],
    ownedOutfits: ['starter', 'street', 'formal'],
    ownedMounts: [],
    ownedCars: [],
    ownedMorphs: ['none'],
    activeMount: null,
    activeCar: null,
    activeMorph: null,
    equippedHat: 'none',
    shovelCount: 0,
    shovelUses: 0,
    diggingEquipped: false,
    shieldUntil: 0,
    speedBoostUntil: 0,
    abilityReadyAt: 0,
    altHealMode: false,
    achievements: [],
    combatNote: '',
    killStreak: 0,
    dailyStamp: '',
    dailyChallenges: [],
    challengesClaimed: 0,
    seaCoins: 0,
    plasmaCoins: 0,
    gangCoins: 0,
    bankPaidAt: 0,
    worldX: null,
    worldY: null,
    chatLog: [
      'System: Welcome to ProjectEra — you are in the Starter Area (safe plaza).',
      'System: Digging is at Mercy Beach / Southridge Beach — not here. Buy shovels at Shell Shack.',
      'System: Trochus is the most common shell; crabs can spawn while digging.',
    ],
  };
}

export function currentWeapon(state: GameState) {
  return WEAPONS[state.weapon] ?? WEAPONS.street_bat;
}

export function addItem(state: GameState, id: string, amount = 1): void {
  const item = state.inventory.find((i) => i.id === id);
  if (item) item.count += amount;
  else state.inventory.push({ id, name: id, count: amount });
}

export function consumeItem(state: GameState, id: string, amount = 1): boolean {
  const item = state.inventory.find((i) => i.id === id);
  if (!item || item.count < amount) return false;
  item.count -= amount;
  return true;
}

export function grantJobXp(state: GameState, job: JobId, amount: number): string | null {
  state.jobXp[job] += amount;
  const need = state.jobLevel[job] * 25;
  if (state.jobXp[job] >= need) {
    state.jobXp[job] -= need;
    state.jobLevel[job] += 1;
    return `${job} is now level ${state.jobLevel[job]}!`;
  }
  return null;
}

export function unlockAchievement(state: GameState, id: string, label: string): string | null {
  if (state.achievements.includes(id)) return null;
  state.achievements.push(id);
  return `Achievement: ${label}`;
}

export function equipWeapon(state: GameState, id: string): string {
  const def = WEAPONS[id];
  if (!def) return 'Unknown weapon.';
  if (!state.ownedWeapons.includes(id)) return 'You do not own that weapon.';
  state.weapon = id;
  state.clipLeft = def.clip ?? 0;
  state.altHealMode = false;
  return `Equipped ${def.name} · ${def.abilityLabel} · effect ${def.effect}`;
}
