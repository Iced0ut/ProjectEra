import type { Dir } from '../config';
import type { WeaponDef } from '../content/weapons';

/**
 * Weapon pose profiles for the existing catalog.
 * Times and pixel kicks are proposed starting values, not measured Era data.
 * Art is original pixel work, not Era client sprites.
 *
 * Proposed visuals:
 * pistol 130ms, rifle 150ms, smg 100ms, shotgun 180ms, knife 200ms,
 * sword 280ms, heavy melee 400ms. Muzzle flash 45ms.
 * These do not change fire rate or damage.
 */

export type PosePhase = 'idle' | 'walk' | 'windup' | 'strike' | 'recover' | 'reload';
export type PoseId =
  | 'pistol'
  | 'dual'
  | 'smg'
  | 'rifle'
  | 'shotgun'
  | 'pump'
  | 'sniper'
  | 'lmg'
  | 'minigun'
  | 'launcher'
  | 'energy'
  | 'staff'
  | 'knife'
  | 'sword'
  | 'blunt'
  | 'axe'
  | 'scythe'
  | 'spear'
  | 'shield'
  | 'throw';

export interface WeaponPose {
  id: PoseId;
  visualMs: number;
  kickPx: number;
  melee: boolean;
  pattern: 'single' | 'alternate' | 'both';
  /** Muzzle in 32×32 frame pixels, top-left. Left is the mirror of right. */
  muzzle: { down: { x: number; y: number }; right: { x: number; y: number }; up: { x: number; y: number } };
}

const POSE: Record<PoseId, WeaponPose> = {
  pistol: { id: 'pistol', visualMs: 130, kickPx: 2, melee: false, pattern: 'single', muzzle: { down: { x: 20, y: 20 }, right: { x: 28, y: 17 }, up: { x: 12, y: 6 } } },
  dual: { id: 'dual', visualMs: 120, kickPx: 2, melee: false, pattern: 'alternate', muzzle: { down: { x: 22, y: 20 }, right: { x: 28, y: 18 }, up: { x: 18, y: 6 } } },
  smg: { id: 'smg', visualMs: 100, kickPx: 1, melee: false, pattern: 'single', muzzle: { down: { x: 22, y: 20 }, right: { x: 30, y: 17 }, up: { x: 14, y: 5 } } },
  rifle: { id: 'rifle', visualMs: 150, kickPx: 3, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 19 }, right: { x: 31, y: 16 }, up: { x: 16, y: 4 } } },
  shotgun: { id: 'shotgun', visualMs: 180, kickPx: 3, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 20 }, right: { x: 31, y: 17 }, up: { x: 15, y: 5 } } },
  pump: { id: 'pump', visualMs: 200, kickPx: 3, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 21 }, right: { x: 31, y: 18 }, up: { x: 15, y: 6 } } },
  sniper: { id: 'sniper', visualMs: 170, kickPx: 2, melee: false, pattern: 'single', muzzle: { down: { x: 26, y: 18 }, right: { x: 31, y: 15 }, up: { x: 18, y: 4 } } },
  lmg: { id: 'lmg', visualMs: 120, kickPx: 2, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 20 }, right: { x: 31, y: 17 }, up: { x: 16, y: 5 } } },
  minigun: { id: 'minigun', visualMs: 90, kickPx: 1, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 20 }, right: { x: 31, y: 17 }, up: { x: 16, y: 5 } } },
  launcher: { id: 'launcher', visualMs: 180, kickPx: 3, melee: false, pattern: 'single', muzzle: { down: { x: 24, y: 18 }, right: { x: 30, y: 15 }, up: { x: 16, y: 4 } } },
  energy: { id: 'energy', visualMs: 140, kickPx: 1, melee: false, pattern: 'single', muzzle: { down: { x: 22, y: 18 }, right: { x: 30, y: 16 }, up: { x: 14, y: 5 } } },
  staff: { id: 'staff', visualMs: 240, kickPx: 0, melee: false, pattern: 'single', muzzle: { down: { x: 16, y: 8 }, right: { x: 26, y: 10 }, up: { x: 16, y: 4 } } },
  knife: { id: 'knife', visualMs: 200, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 20, y: 18 }, right: { x: 26, y: 16 }, up: { x: 16, y: 12 } } },
  sword: { id: 'sword', visualMs: 280, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 22, y: 14 }, right: { x: 28, y: 14 }, up: { x: 16, y: 8 } } },
  blunt: { id: 'blunt', visualMs: 400, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 22, y: 16 }, right: { x: 28, y: 16 }, up: { x: 16, y: 10 } } },
  axe: { id: 'axe', visualMs: 420, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 24, y: 14 }, right: { x: 28, y: 14 }, up: { x: 16, y: 8 } } },
  scythe: { id: 'scythe', visualMs: 360, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 26, y: 12 }, right: { x: 30, y: 12 }, up: { x: 14, y: 6 } } },
  spear: { id: 'spear', visualMs: 220, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 16, y: 22 }, right: { x: 30, y: 16 }, up: { x: 16, y: 4 } } },
  shield: { id: 'shield', visualMs: 180, kickPx: 0, melee: true, pattern: 'single', muzzle: { down: { x: 16, y: 16 }, right: { x: 24, y: 16 }, up: { x: 16, y: 14 } } },
  throw: { id: 'throw', visualMs: 200, kickPx: 0, melee: false, pattern: 'single', muzzle: { down: { x: 20, y: 16 }, right: { x: 26, y: 14 }, up: { x: 16, y: 8 } } },
};

export function poseForWeapon(weapon: WeaponDef): WeaponPose {
  const id = weapon.id;
  if (id === 'dual_sidearms') return POSE.dual;
  if (id === 'pump_shotgun') return POSE.pump;
  if (id === 'drum_lmg') return POSE.minigun;
  if (weapon.family === 'staff') return POSE.staff;
  if (id.includes('knife') || id.includes('dagger') || id.includes('bottle')) return POSE.knife;
  if (id.includes('katana') || id.includes('sword') || id.includes('scimitar') || id.includes('cutlass') || id.includes('zanmato') || id.includes('blade')) return POSE.sword;
  if (id.includes('axe')) return POSE.axe;
  if (id.includes('scythe')) return POSE.scythe;
  if (id.includes('rod') || id.includes('prod')) return POSE.spear;
  if (weapon.family === 'shield') return POSE.shield;
  if (weapon.kind === 'throwable') return POSE.throw;
  if (id === 'plasma_beamer' || id === 'vanquisher' || id === 'chroma_nova') return POSE.energy;
  if (weapon.family === 'smg' || id === 'machine_pistol') return POSE.smg;
  if (weapon.family === 'shotgun') return POSE.shotgun;
  if (weapon.family === 'sniper') return POSE.sniper;
  if (weapon.family === 'lmg') return POSE.lmg;
  if (weapon.family === 'launcher') return POSE.launcher;
  if (weapon.family === 'rifle') return POSE.rifle;
  if (weapon.family === 'pistol') return POSE.pistol;
  if (weapon.kind === 'melee') return POSE.blunt;
  return POSE.pistol;
}

export function poseRow(phase: PosePhase): number {
  return { idle: 0, walk: 1, windup: 2, strike: 3, recover: 4, reload: 5 }[phase];
}

type Put = (x: number, y: number, c: string, w?: number, h?: number) => void;

/** Hands and weapon in one pose. Replaces loose arms plus a floating gun. */
export function drawPose(
  put: Put,
  facing: 'down' | 'right' | 'up',
  phase: PosePhase,
  pose: WeaponPose,
  skin: string,
): void {
  const kick =
    phase === 'strike' ? pose.kickPx : phase === 'recover' ? Math.max(0, pose.kickPx - 1) : phase === 'reload' ? 1 : 0;
  const wind = phase === 'windup' ? -2 : 0;
  if (facing === 'up') {
    drawUp(put, pose, kick, wind, phase);
    return;
  }
  if (facing === 'down') {
    drawDown(put, pose, skin, kick, wind, phase);
    return;
  }
  drawSide(put, pose, skin, kick, wind, phase);
}

function drawSide(put: Put, pose: WeaponPose, skin: string, kick: number, wind: number, phase: PosePhase): void {
  const back = kick - wind;
  const metal = pose.id === 'energy' ? '#7ec8ff' : pose.id === 'staff' ? '#6a4a78' : '#2c3138';
  const accent = pose.id === 'energy' ? '#d7f4ff' : '#e2b84a';
  if (pose.melee || pose.id === 'staff' || pose.id === 'spear' || pose.id === 'shield') {
    const reach = phase === 'strike' ? 6 : phase === 'windup' ? -3 : 1;
    if (pose.id === 'knife') {
      put(20 + reach, 15, '#d7dde6', 6, 2);
      put(18, 16, skin, 3, 3);
    } else if (pose.id === 'sword' || pose.id === 'axe' || pose.id === 'scythe') {
      put(18 + reach, 12, '#e8eef5', 2, 10);
      put(16, 16, '#6b4428', 4, 2);
      put(15, 15, skin, 3, 4);
    } else if (pose.id === 'spear' || pose.id === 'staff') {
      put(16 + reach, 15, metal, 12, 2);
      put(26 + reach, 14, accent, 3, 4);
      put(14, 15, skin, 3, 3);
      put(18, 16, skin, 3, 3);
    } else if (pose.id === 'shield') {
      put(20, 12, '#8aa0b4', 6, 10);
      put(18, 15, skin, 3, 4);
    } else {
      put(18 + reach, 10, '#6b4428', 3, 12);
      put(17 + reach, 8, '#d7dbe2', 5, 3);
      put(16, 14, skin, 4, 4);
    }
    return;
  }
  if (pose.id === 'dual') {
    const hand = phase === 'strike' ? back : 0;
    put(18 - hand, 14, metal, 7, 2);
    put(18 - (phase === 'windup' ? back : 0), 18, metal, 7, 2);
    put(16, 14, skin, 3, 3);
    put(16, 18, skin, 3, 3);
    return;
  }
  const len = pose.id === 'sniper' || pose.id === 'rifle' ? 12 : pose.id === 'shotgun' || pose.id === 'pump' || pose.id === 'lmg' || pose.id === 'minigun' ? 11 : pose.id === 'launcher' ? 10 : 8;
  const y = 16 + (phase === 'reload' ? 2 : 0);
  put(18 - back, y, metal, len, 2);
  put(18 - back + len - 2, y, accent, 2, 2);
  put(16 - back, y, skin, 3, 3);
  if (pose.id !== 'pistol') put(20 - back, y + 1, skin, 3, 2);
  if (pose.id === 'pump' && phase === 'recover') put(20, y + 3, skin, 4, 2);
  if (pose.id === 'minigun' && (phase === 'strike' || phase === 'windup')) {
    const spin = phase === 'strike' ? 1 : 0;
    put(24 - back, y - 2 + spin, metal, 4, 2);
  }
}

function drawDown(put: Put, pose: WeaponPose, skin: string, kick: number, wind: number, phase: PosePhase): void {
  const back = kick - wind;
  const metal = pose.id === 'energy' ? '#7ec8ff' : '#2c3138';
  const y = 16 + (phase === 'reload' ? 2 : 0);
  if (pose.id === 'dual') {
    put(8, y - (phase === 'windup' ? back : 0), metal, 3, 7);
    put(20, y - (phase === 'strike' ? back : 0), metal, 3, 7);
    put(7, y + 2, skin, 4, 3);
    put(19, y + 2, skin, 4, 3);
    return;
  }
  if (pose.melee || pose.id === 'shield' || pose.id === 'spear' || pose.id === 'staff') {
    const drop = phase === 'strike' ? 4 : phase === 'windup' ? -3 : 0;
    if (pose.id === 'shield') {
      put(12, 14, '#8aa0b4', 8, 10);
      put(11, 16, skin, 3, 4);
      put(18, 16, skin, 3, 4);
      return;
    }
    put(14, 12 + drop, pose.id === 'knife' ? '#d7dde6' : '#cfd6de', pose.id === 'knife' ? 3 : 2, pose.id === 'blunt' ? 8 : 10);
    put(12, 16 + Math.max(0, drop), skin, 4, 3);
    put(16, 16 + Math.max(0, drop), skin, 4, 3);
    return;
  }
  put(14, y - back, metal, 4, 8);
  put(14, y - back, '#e2b84a', 4, 2);
  put(12, y + 2, skin, 4, 3);
  if (pose.id !== 'pistol') put(17, y + 3, skin, 3, 3);
}

function drawUp(put: Put, pose: WeaponPose, kick: number, _wind: number, phase: PosePhase): void {
  const metal = pose.id === 'energy' ? '#7ec8ff' : '#2c3138';
  const lift = phase === 'strike' ? kick : 0;
  if (pose.id === 'dual') {
    put(8, 6 - lift, metal, 2, 4);
    put(20, 6 - (phase === 'windup' ? kick : 0), metal, 2, 4);
    return;
  }
  put(14, 4 - lift, metal, pose.id === 'sniper' || pose.id === 'rifle' ? 6 : 4, 3);
}

export function muzzleAnchor(pose: WeaponPose, facing: Dir): { x: number; y: number } {
  if (facing === 'left') {
    const right = pose.muzzle.right;
    return { x: 32 - right.x, y: right.y };
  }
  if (facing === 'up') return pose.muzzle.up;
  if (facing === 'down') return pose.muzzle.down;
  return pose.muzzle.right;
}

export function ensureMuzzleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('muzzle-flash')) return;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fff4c4';
  ctx.fillRect(2, 2, 4, 4);
  ctx.fillStyle = '#ffb020';
  ctx.fillRect(3, 1, 2, 6);
  ctx.fillRect(1, 3, 6, 2);
  scene.textures.addCanvas('muzzle-flash', canvas);
}
