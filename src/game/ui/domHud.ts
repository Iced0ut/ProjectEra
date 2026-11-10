import { EFFECT_LABELS } from '../combat';
import { currentWeapon, type GameState, type PlayerProfile } from '../state';
import { WEAPON_LIST } from '../content/weapons';

export interface TitleChoices {
  profile: PlayerProfile;
}

type TitleHandler = (choices: TitleChoices) => void;

let inventoryOpen = false;
let look = { hair: 0, shirt: 0, pants: 0, hat: 0 };
let onEnter: TitleHandler | null = null;

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing UI node #${id}`);
  return node as T;
}

export function initDomHud(): void {
  const grid = el<HTMLDivElement>('look-grid');
  grid.querySelectorAll('button[data-look]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = (btn as HTMLElement).dataset.look as keyof typeof look;
      const max = key === 'hat' ? 5 : 6;
      look[key] = (look[key] + 1) % max;
      const span = btn.querySelector('span');
      if (span) span.textContent = String(look[key]);
    });
  });

  el<HTMLButtonElement>('enter-city').addEventListener('click', () => {
    const name = el<HTMLInputElement>('player-name').value.trim().slice(0, 16) || 'Player';
    onEnter?.({
      profile: {
        name,
        hair: look.hair,
        shirt: look.shirt,
        pants: look.pants,
        hat: look.hat,
      },
    });
  });
}

export function showTitle(handler: TitleHandler): void {
  onEnter = handler;
  el('title-ui').classList.remove('hidden');
  el('play-ui').classList.add('hidden');
}

export function hideTitle(): void {
  el('title-ui').classList.add('hidden');
}

export function showPlayHud(): void {
  el('play-ui').classList.remove('hidden');
  el('title-ui').classList.add('hidden');
}

export function hidePlayHud(): void {
  el('play-ui').classList.add('hidden');
}

export function toggleInventory(force?: boolean): void {
  inventoryOpen = force ?? !inventoryOpen;
  el('inv-panel').classList.toggle('hidden', !inventoryOpen);
}

export function setHint(text: string): void {
  el('hud-hint').textContent = text;
}

export function setRegion(text: string): void {
  el('hud-region').textContent = text;
}

export function pushChatToDom(lines: string[]): void {
  el('hud-chat').textContent = lines.slice(-6).join('\n');
}

export function renderHud(state: GameState, extras?: { region?: string; hint?: string }): void {
  const weapon = currentWeapon(state);
  const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  const fill = el<HTMLDivElement>('hud-hp-fill');
  fill.style.width = `${hpPct}%`;
  fill.classList.toggle('low', state.hp <= state.maxHp * 0.35);
  el('hud-hp-text').textContent = `${Math.ceil(state.hp)}/${state.maxHp}`;
  el('hud-money').textContent = `${state.gralats} g`;
  el('hud-kills').textContent = `${state.kills} kills`;
  el('hud-weapon').textContent = weapon.name;
  el('hud-effect').textContent = `${EFFECT_LABELS[weapon.effect]} · ${weapon.abilityLabel}`;
  el('hud-ammo').textContent =
    weapon.ammo === 'none'
      ? 'Melee / utility'
      : `Clip ${state.clipLeft}/${weapon.clip ?? 0} · ${weapon.ammo} ${state.ammo[weapon.ammo]}`;
  const ride = state.activeCar ?? state.activeMount ?? 'On foot';
  const gang = state.gangName ? `${state.gangName}` : 'No gang';
  el('hud-ride').textContent = `${ride} · ${gang}`;

  if (extras?.region) setRegion(extras.region);
  if (extras?.hint) setHint(extras.hint);
  pushChatToDom(state.chatLog);

  const shells = state.inventory
    .filter((i) => ['trochus', 'aerolata', 'sand_dollar', 'scallop', 'starfish'].includes(i.id) && i.count > 0)
    .map((i) => `${i.name}: ${i.count}`)
    .join('\n');
  const inv = state.inventory
    .filter((i) => i.count > 0)
    .map((i) => `${i.name}: ${i.count}`)
    .join('\n');
  el('inv-count').textContent = `${state.ownedWeapons.length}/${WEAPON_LIST.length}`;
  el('inv-body').textContent = [
    `Shovel ${state.diggingEquipped ? 'ON' : 'OFF'} · uses ${state.shovelUses} · spare ${state.shovelCount}`,
    '',
    'SHELLS',
    shells || 'none',
    '',
    'INVENTORY',
    inv || 'empty',
    '',
    `Morph ${state.activeMorph ?? 'none'}`,
    `Cars ${state.ownedCars.join(', ') || 'none'}`,
    `Furniture ${state.furniture.length}`,
  ].join('\n');
}
