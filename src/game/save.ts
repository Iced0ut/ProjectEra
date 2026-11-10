import { MAP_REVISION } from './config';
import { createInitialState, type GameState, type InventoryItem, type PlayerProfile } from './state';

const KEY = 'projectera-save-v1';

/** Local account record: weapons, hats, cars, jobs, and gralats. Single player only. */

function mergeItems(base: InventoryItem[], saved: InventoryItem[] | undefined): InventoryItem[] {
  if (!saved?.length) return base;
  const counts = new Map(saved.map((item) => [item.id, item]));
  const merged = base.map((item) => {
    const found = counts.get(item.id);
    return found ? { ...item, count: found.count } : item;
  });
  for (const item of saved) {
    if (!merged.some((row) => row.id === item.id)) merged.push(item);
  }
  return merged;
}

export function loadOrCreate(profile: PlayerProfile): GameState {
  const fresh = createInitialState(profile);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<GameState>;
    return {
      ...fresh,
      ...saved,
      profile: {
        ...fresh.profile,
        ...(saved.profile ?? {}),
        name: profile.name,
        hair: profile.hair,
        shirt: profile.shirt,
        pants: profile.pants,
        hat: profile.hat,
      },
      ammo: { ...fresh.ammo, ...(saved.ammo ?? {}) },
      jobXp: { ...fresh.jobXp, ...(saved.jobXp ?? {}) },
      jobLevel: { ...fresh.jobLevel, ...(saved.jobLevel ?? {}) },
      inventory: mergeItems(fresh.inventory, saved.inventory),
      ownedWeapons: saved.ownedWeapons?.length ? saved.ownedWeapons : fresh.ownedWeapons,
      chatLog: fresh.chatLog,
      combatNote: '',
      hp: typeof saved.hp === 'number' ? saved.hp : fresh.hp,
      worldX: saved.mapRevision === MAP_REVISION && typeof saved.worldX === 'number' ? saved.worldX : null,
      worldY: saved.mapRevision === MAP_REVISION && typeof saved.worldY === 'number' ? saved.worldY : null,
      mapRevision: MAP_REVISION,
    };
  } catch {
    return fresh;
  }
}

export function saveGame(state: GameState): void {
  try {
    const snapshot: GameState = { ...state, combatNote: '', chatLog: state.chatLog.slice(-12) };
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // private mode or a full disk should not crash the city
  }
}
