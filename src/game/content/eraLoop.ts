import type { GameState, JobId } from '../state';
import { addItem, grantJobXp, unlockAchievement } from '../state';

/** Local stand-ins for the public Era loops: challenges, sell prices, mining, coins. */

export interface DailyChallenge {
  id: string;
  label: string;
  goal: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

const POOL: { id: string; label: string; goal: number; reward: number }[] = [
  { id: 'dig', label: 'Dig shells', goal: 8, reward: 500 },
  { id: 'crabs', label: 'Kill crabs', goal: 4, reward: 500 },
  { id: 'flowers', label: 'Pick flowers', goal: 12, reward: 800 },
  { id: 'fish', label: 'Catch fish', goal: 6, reward: 500 },
  { id: 'trash', label: 'Pick up trash', goal: 8, reward: 500 },
  { id: 'mushrooms', label: 'Pick mushrooms', goal: 8, reward: 500 },
  { id: 'pizza', label: 'Make pizzas', goal: 6, reward: 600 },
  { id: 'mail', label: 'Deliver mail', goal: 4, reward: 500 },
  { id: 'cars', label: 'Assemble car parts', goal: 2, reward: 700 },
  { id: 'kills', label: 'Defeat fighters', goal: 6, reward: 600 },
  { id: 'sea', label: 'Clear the Sea Dungeon', goal: 1, reward: 1000 },
  { id: 'plasma', label: 'Survive a Plasma wave', goal: 1, reward: 800 },
];

export const SELL_PRICE: Record<string, number> = {
  fish: 8,
  trochus: 3,
  aerolata: 3,
  sand_dollar: 5,
  scallop: 5,
  starfish: 5,
  crab_shell_black: 6,
  crab_shell_blue: 6,
  crab_shell_green: 6,
  crab_shell_red: 6,
  crab_shell_yellow: 6,
  trash: 5,
  mushroom: 4,
  flower: 4,
  ore: 5,
  rock: 2,
  iron: 5,
  gold: 10,
  diamond: 10,
  emerald: 8,
  ruby: 7,
};

const ORES = [
  { id: 'iron', name: 'Iron', chance: 0.12 },
  { id: 'lead', name: 'Lead', chance: 0.12 },
  { id: 'silver', name: 'Silver', chance: 0.12 },
  { id: 'copper', name: 'Copper', chance: 0.12 },
  { id: 'quartz', name: 'Quartz', chance: 0.12 },
  { id: 'gypsum', name: 'Gypsum', chance: 0.12 },
  { id: 'gold', name: 'Gold', chance: 0.007 },
  { id: 'diamond', name: 'Diamond', chance: 0.007 },
  { id: 'emerald', name: 'Emerald', chance: 0.007 },
  { id: 'ruby', name: 'Ruby', chance: 0.007 },
  { id: 'sapphire', name: 'Sapphire', chance: 0.007 },
];

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ensureChallenges(state: GameState): void {
  if (state.dailyStamp === todayKey() && state.dailyChallenges.length === 3) return;
  state.dailyStamp = todayKey();
  const bag = [...POOL].sort(() => Math.random() - 0.5);
  state.dailyChallenges = bag.slice(0, 3).map((row) => ({ ...row, progress: 0, claimed: false }));
}

export function rerollChallenge(state: GameState, index: number): string {
  if (state.gralats < 250) return 'Reroll costs 250g.';
  const current = state.dailyChallenges[index];
  if (!current || current.claimed) return 'That challenge is already claimed.';
  const used = new Set(state.dailyChallenges.map((c) => c.id));
  const next = POOL.find((row) => !used.has(row.id)) ?? POOL[0];
  state.gralats -= 250;
  state.dailyChallenges[index] = { ...next, progress: 0, claimed: false };
  return `Rerolled for 250g: ${next.label}.`;
}

export function noteActivity(state: GameState, id: string, amount = 1): string | null {
  ensureChallenges(state);
  for (const challenge of state.dailyChallenges) {
    if (challenge.id !== id || challenge.claimed) continue;
    challenge.progress = Math.min(challenge.goal, challenge.progress + amount);
    if (challenge.progress >= challenge.goal) return `${challenge.label} is ready to claim.`;
  }
  return null;
}

export function claimChallenges(state: GameState): string {
  ensureChallenges(state);
  let pay = 0;
  let n = 0;
  for (const challenge of state.dailyChallenges) {
    if (challenge.claimed || challenge.progress < challenge.goal) continue;
    challenge.claimed = true;
    pay += challenge.reward;
    n += 1;
    state.challengesClaimed += 1;
  }
  if (!n) return 'Nothing ready to claim.';
  state.gralats += pay;
  const ach = unlockAchievement(state, 'challenges-5', 'Challenge runner');
  return `Claimed ${n} challenge${n === 1 ? '' : 's'} for ${pay}g.${ach ? ` ${ach}` : ''}`;
}

export function challengeLines(state: GameState): string[] {
  ensureChallenges(state);
  return state.dailyChallenges.map(
    (c, i) => `${i + 1}. ${c.label} ${c.progress}/${c.goal} · ${c.reward}g${c.claimed ? ' claimed' : ''}`,
  );
}

export function sellGathered(state: GameState, id: string | null): { sold: number; earned: number } {
  let sold = 0;
  let earned = 0;
  for (const item of state.inventory) {
    if (id && item.id !== id) continue;
    const price = SELL_PRICE[item.id];
    if (!price || item.count <= 0) continue;
    earned += item.count * price;
    sold += item.count;
    item.count = 0;
  }
  state.gralats += earned;
  return { sold, earned };
}

export function feedMiningMachine(state: GameState): string {
  const rocks = state.inventory.find((item) => item.id === 'rock');
  const have = rocks?.count ?? 0;
  const cap = Math.min(10, 2 + Math.floor(state.jobLevel.mining / 2));
  const feed = Math.min(have, cap);
  if (feed <= 0) return 'No rocks. Mine a vein first.';
  if (rocks) rocks.count -= feed;
  const found: string[] = [];
  for (let i = 0; i < feed; i++) {
    const roll = Math.random();
    let cursor = 0;
    for (const ore of ORES) {
      cursor += ore.chance;
      if (roll < cursor) {
        addItem(state, ore.id, 1);
        found.push(ore.name);
        break;
      }
    }
  }
  const leveled = grantJobXp(state, 'mining', feed * 4);
  const ach =
    state.jobLevel.mining >= 10 ? unlockAchievement(state, 'mine-10', 'Mining level 10') : null;
  return `Fed ${feed} rock${feed === 1 ? '' : 's'} (cap ${cap}). ${found.length ? found.join(', ') : 'Nothing this run.'}${leveled ? ` ${leveled}` : ''}${ach ? ` ${ach}` : ''}`;
}

export function spinSlots(state: GameState): string {
  if (state.gralats < 3) return 'Slots cost 3g.';
  state.gralats -= 3;
  const faces = ['cherry', 'bar', 'star', 'shell'];
  const roll = [0, 1, 2].map(() => faces[Math.floor(Math.random() * faces.length)]);
  if (roll[0] === roll[1] && roll[1] === roll[2]) {
    const win = roll[0] === 'star' ? 40 : 18;
    state.gralats += win;
    return `${roll.join(' ')} — won ${win}g.`;
  }
  return `${roll.join(' ')} — no win.`;
}

export function jobActivity(job: JobId): string | null {
  if (job === 'digging') return 'dig';
  if (job === 'fishing') return 'fish';
  if (job === 'trash') return 'trash';
  if (job === 'mushrooms') return 'mushrooms';
  if (job === 'flowers') return 'flowers';
  if (job === 'pizza') return 'pizza';
  if (job === 'mail') return 'mail';
  if (job === 'cars') return 'cars';
  return null;
}
