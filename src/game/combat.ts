import type { WeaponDef, OnHitEffect } from './content/weapons';

export interface StatusState {
  burnUntil: number;
  poisonUntil: number;
  shockUntil: number;
  slowUntil: number;
  stunUntil: number;
  burnDps: number;
  poisonDps: number;
}

export function createStatus(): StatusState {
  return {
    burnUntil: 0,
    poisonUntil: 0,
    shockUntil: 0,
    slowUntil: 0,
    stunUntil: 0,
    burnDps: 0,
    poisonDps: 0,
  };
}

export function weaponDamage(weapon: WeaponDef, clipLeft?: number): number {
  let dmg = weapon.damage;
  if (weapon.ability === 'finisher' && clipLeft === 1 && weapon.damageMax) {
    dmg = weapon.damageMax;
  } else if (weapon.damageMax && weapon.damageMax > weapon.damage) {
    dmg = weapon.damage + Math.random() * (weapon.damageMax - weapon.damage);
  }
  return dmg;
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
      status.burnUntil = Math.max(status.burnUntil, now + 1800);
      status.burnDps = Math.max(status.burnDps, power);
      break;
    case 'poison':
      status.poisonUntil = Math.max(status.poisonUntil, now + 2200);
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
    default:
      break;
  }
  return result;
}

export function tickStatusDamage(status: StatusState, now: number, dtSec: number): number {
  let dmg = 0;
  if (now < status.burnUntil) dmg += status.burnDps * dtSec;
  if (now < status.poisonUntil) dmg += status.poisonDps * dtSec;
  return dmg;
}

export function moveSpeedMultiplier(status: StatusState, now: number): number {
  if (now < status.stunUntil) return 0;
  if (now < status.slowUntil) return 0.45;
  if (now < status.shockUntil) return 0.7;
  return 1;
}

export const EFFECT_LABELS: Record<OnHitEffect, string> = {
  none: 'None',
  burn: 'Burn DoT',
  poison: 'Poison DoT',
  shock: 'Electric shock',
  slow: 'Slow',
  stun: 'Stun',
  lifesteal: 'Life steal',
  knockback: 'Knockback',
  heal: 'Heal',
  explode: 'Explosion',
  shield: 'Damage reduction',
};
