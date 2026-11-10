/** Beach digging loop inspired by Era shelling (original item names/prices from public guides). */

export interface ShellDef {
  id: string;
  name: string;
  sellPrice: number;
  weight: number; // relative drop chance
  tint: number;
}

export interface CrabShellDef {
  id: string;
  name: string;
  sellPrice: number;
  tint: number;
}

/** Common beach shells — Trochus is the most common, matching Era shelling guides. */
export const SHELLS: ShellDef[] = [
  { id: 'trochus', name: 'Trochus', sellPrice: 3, weight: 40, tint: 0xe8d5b7 },
  { id: 'aerolata', name: 'Aerolata', sellPrice: 3, weight: 22, tint: 0xc4b49a },
  { id: 'sand_dollar', name: 'Sand Dollar', sellPrice: 5, weight: 16, tint: 0xf5e6c8 },
  { id: 'scallop', name: 'Scallop', sellPrice: 5, weight: 14, tint: 0xffb4a0 },
  { id: 'starfish', name: 'Starfish', sellPrice: 7, weight: 8, tint: 0xff8a5a },
];

export const CRAB_SHELLS: CrabShellDef[] = [
  { id: 'crab_shell_black', name: 'Black Crab Shell', sellPrice: 6, tint: 0x2a2a2a },
  { id: 'crab_shell_blue', name: 'Blue Crab Shell', sellPrice: 6, tint: 0x4aa3ff },
  { id: 'crab_shell_green', name: 'Green Crab Shell', sellPrice: 6, tint: 0x3ecf8e },
  { id: 'crab_shell_red', name: 'Red Crab Shell', sellPrice: 6, tint: 0xff6b4a },
  { id: 'crab_shell_yellow', name: 'Yellow Crab Shell', sellPrice: 6, tint: 0xf0c14b },
];

export const SHOVEL_COST = 50;
export const SHOVEL_MAX_USES = 25;
export const CRAB_DIG_CHANCE = 0.12;
export const CRAB_SHELL_DROP_CHANCE = 0.55;
export const SHELL_CLAIM_MS = 4000; // briefly yours before free-for-all (demo timer)
export const DIG_COOLDOWN_MS = 420;

export function rollShell(): ShellDef {
  const total = SHELLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const shell of SHELLS) {
    r -= shell.weight;
    if (r <= 0) return shell;
  }
  return SHELLS[0];
}

export function rollCrabShell(): CrabShellDef {
  return CRAB_SHELLS[Math.floor(Math.random() * CRAB_SHELLS.length)];
}

export function shellById(id: string): ShellDef | CrabShellDef | undefined {
  return SHELLS.find((s) => s.id === id) ?? CRAB_SHELLS.find((s) => s.id === id);
}
