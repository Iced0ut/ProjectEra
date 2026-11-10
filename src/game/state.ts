export type JobId =
  | 'fishing'
  | 'mining'
  | 'digging'
  | 'trash'
  | 'pizza'
  | 'mushrooms'
  | 'flowers'
  | 'mail';

export type WeaponId = 'bat' | 'knife' | 'pistol' | 'smg';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  kind: 'melee' | 'gun';
  damage: number;
  range: number;
  cooldown: number;
  ability: string;
  cost: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  bat: {
    id: 'bat',
    name: 'Street Bat',
    kind: 'melee',
    damage: 8,
    range: 42,
    cooldown: 280,
    ability: 'Dash',
    cost: 0,
  },
  knife: {
    id: 'knife',
    name: 'Hunter Knife',
    kind: 'melee',
    damage: 10,
    range: 38,
    cooldown: 220,
    ability: 'Roll',
    cost: 120,
  },
  pistol: {
    id: 'pistol',
    name: 'City Pistol',
    kind: 'gun',
    damage: 9,
    range: 220,
    cooldown: 320,
    ability: 'Reload Burst',
    cost: 250,
  },
  smg: {
    id: 'smg',
    name: 'Rapid SMG',
    kind: 'gun',
    damage: 6,
    range: 200,
    cooldown: 120,
    ability: 'Spray',
    cost: 480,
  },
};

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
}

export interface GameState {
  profile: PlayerProfile;
  hp: number;
  maxHp: number;
  gralats: number;
  weapon: WeaponId;
  ownedWeapons: WeaponId[];
  inventory: InventoryItem[];
  kills: number;
  jobXp: Record<JobId, number>;
  jobLevel: Record<JobId, number>;
  gangName: string | null;
  gangRank: string;
  houseOwned: boolean;
  furniture: string[];
  achievements: string[];
  chatLog: string[];
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
];

export function createInitialState(profile: PlayerProfile): GameState {
  const jobXp = Object.fromEntries(JOBS.map((j) => [j, 0])) as Record<JobId, number>;
  const jobLevel = Object.fromEntries(JOBS.map((j) => [j, 1])) as Record<JobId, number>;
  return {
    profile,
    hp: 50,
    maxHp: 50,
    gralats: 100,
    weapon: 'bat',
    ownedWeapons: ['bat'],
    inventory: [
      { id: 'food', name: 'Street Snack', count: 3 },
      { id: 'shell', name: 'Shell', count: 0 },
      { id: 'ore', name: 'Ore', count: 0 },
      { id: 'fish', name: 'Fish', count: 0 },
      { id: 'trash', name: 'Trash Bag', count: 0 },
      { id: 'mushroom', name: 'Mushroom', count: 0 },
      { id: 'flower', name: 'Flower', count: 0 },
      { id: 'pizza', name: 'Pizza Box', count: 0 },
      { id: 'mail', name: 'Mail Bundle', count: 0 },
    ],
    kills: 0,
    jobXp,
    jobLevel,
    gangName: null,
    gangRank: 'Recruit',
    houseOwned: false,
    furniture: [],
    achievements: [],
    chatLog: [
      'System: Welcome to ProjectEra — an original city action sandbox.',
      'System: Jobs, spars, gangs, and houses are online in this demo district.',
    ],
  };
}

export function addItem(state: GameState, id: string, amount = 1): void {
  const item = state.inventory.find((i) => i.id === id);
  if (item) item.count += amount;
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
