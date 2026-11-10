import type { WeaponDef, OnHitEffect } from './content/weapons';

export interface StatusState {
  burnUntil: number;
  poisonUntil: number;
  shockUntil: number;
  slowUntil: number;
  gravityUntil: number;
  stunUntil: number;
  bleedUntil: number;
  confusionUntil: number;
  antiHealUntil: number;
  burnDps: number;
  poisonDps: number;
  bleedDps: number;
  nextBurn: number;
  nextPoison: number;
  nextBleed: number;
}

export function createStatus(): StatusState {
  return {
    burnUntil: 0,
    poisonUntil: 0,
    shockUntil: 0,
    slowUntil: 0,
    gravityUntil: 0,
    stunUntil: 0,
    bleedUntil: 0,
    confusionUntil: 0,
    antiHealUntil: 0,
    burnDps: 0,
    poisonDps: 0,
    bleedDps: 0,
    nextBurn: 0,
    nextPoison: 0,
    nextBleed: 0,
  };
}

/** Damage is fixed per hit. Alternate mode and the last-round finisher are the only swaps. */
export function weaponDamage(weapon: WeaponDef, clipLeft?: number, altMode = false): number {
  if (altMode && weapon.damageMax) return weapon.damageMax;
  if (weapon.ability === 'finisher' && clipLeft === 1 && weapon.damageMax) return weapon.damageMax;
  return weapon.damage;
}

export function applyHeal(hp: number, maxHp: number, status: StatusState, now: number, amount: number): number {
  if (now < status.antiHealUntil) return hp;
  return Math.min(maxHp, hp + amount);
}

export function applyOnHitToStatus(
  status: StatusState,
  effect: OnHitEffect,
  power: number,
  now: number,
): { healAttacker: number; knockback: number; explodeRadius: number; shield: number } {
  const result = { healAttacker: 0, knockback: 0, explodeRadius: 0, shield: 0 };
  switch (effect) {
    case 'burn':
      status.burnUntil = Math.max(status.burnUntil, now + 12000);
      status.burnDps = Math.max(status.burnDps, power);
      break;
    case 'poison':
      status.poisonUntil = Math.max(status.poisonUntil, now + 15000);
      status.poisonDps = Math.max(status.poisonDps, power);
      break;
    case 'shock':
      status.shockUntil = Math.max(status.shockUntil, now + 900);
      status.stunUntil = Math.max(status.stunUntil, now + 250);
      break;
    case 'slow':
      status.slowUntil = Math.max(status.slowUntil, now + power);
      break;
    case 'stun':
      status.stunUntil = Math.max(status.stunUntil, now + power);
      break;
    case 'lifesteal':
      result.healAttacker = power;
      break;
    case 'knockback':
      result.knockback = power;
      break;
    case 'heal':
      result.healAttacker = power;
      break;
    case 'explode':
      result.explodeRadius = power;
      break;
    case 'shield':
      result.shield = power;
      break;
    case 'bleed':
      status.bleedUntil = Math.max(status.bleedUntil, now + 12000);
      status.bleedDps = Math.max(status.bleedDps, power || 2);
      status.nextBleed = Math.min(status.nextBleed || now, now);
      break;
    case 'confusion':
      status.confusionUntil = Math.max(status.confusionUntil, now + (power || 5000));
      break;
    case 'antiheal':
      status.antiHealUntil = Math.max(status.antiHealUntil, now + (power || 4500));
      break;
    case 'gravity':
      status.gravityUntil = Math.max(status.gravityUntil, now + (power || 3000));
      break;
    default:
      break;
  }
  if (effect === 'burn') status.nextBurn = Math.min(status.nextBurn || now, now);
  if (effect === 'poison') status.nextPoison = Math.min(status.nextPoison || now, now);
  return result;
}

/** Burn and bleed tick every 3s. Poison ticks every 5s and applies a heavy slow. */
export function tickStatusDamage(status: StatusState, now: number, _dtSec: number): number {
  let dmg = 0;
  if (now < status.burnUntil && now >= status.nextBurn) {
    dmg += status.burnDps || 2;
    status.nextBurn = now + 3000;
  }
  if (now < status.poisonUntil && now >= status.nextPoison) {
    dmg += status.poisonDps || 2;
    status.slowUntil = Math.max(status.slowUntil, now + 2000);
    status.nextPoison = now + 5000;
  }
  if (now < status.bleedUntil && now >= status.nextBleed) {
    dmg += status.bleedDps || 2;
    status.nextBleed = now + 3000;
  }
  return dmg;
}

export function moveSpeedMultiplier(status: StatusState, now: number): number {
  if (now < status.stunUntil) return 0;
  if (now < status.gravityUntil) return 0.25;
  if (now < status.slowUntil) return 0.45;
  if (now < status.shockUntil) return 0.7;
  return 1;
}

export function movementReversed(status: StatusState, now: number): boolean {
  return now < status.confusionUntil;
}

export const EFFECT_LABELS: Record<OnHitEffect, string> = {
  none: 'None',
  burn: 'Burn every 3s',
  poison: 'Poison every 5s',
  shock: 'Electric shock',
  slow: 'Slow',
  stun: 'Stun',
  lifesteal: 'Life steal',
  knockback: 'Knockback',
  heal: 'Heal',
  explode: 'Explosion',
  shield: 'Half damage',
  bleed: 'Bleed every 3s',
  confusion: 'Reversed controls',
  antiheal: 'Anti-heal',
  gravity: 'Heavy slow',
};
