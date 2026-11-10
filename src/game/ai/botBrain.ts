import type { BotKind } from '../content/npcs';
import type { Dir } from '../config';

/** Per-bot memory. Bots keep a post, then hunt, strafe, or fall back. */

export interface BotMind {
  homeX: number;
  homeY: number;
  aimX: number;
  aimY: number;
  nextAim: number;
  attackAt: number;
  windupUntil: number;
  pendingStrike: boolean;
  alertUntil: number;
  strafe: number;
}

export type BotAttack = 'melee' | 'shot' | null;

export interface BotOrder {
  vx: number;
  vy: number;
  attack: BotAttack;
  facing: Dir;
  winding: boolean;
}

interface Style {
  leash: number;
  prefer: number;
  reach: number;
  attackMs: number;
  windupMs: number;
  retreatHp: number;
  patrol: number;
  shot: boolean;
}

const STYLE: Record<BotKind, Style> = {
  spar_bot: { leash: 260, prefer: 72, reach: 90, attackMs: 780, windupMs: 180, retreatHp: 0.28, patrol: 40, shot: true },
  street_rival: { leash: 190, prefer: 34, reach: 36, attackMs: 640, windupMs: 150, retreatHp: 0.34, patrol: 52, shot: false },
  gang_enforcer: { leash: 160, prefer: 42, reach: 38, attackMs: 700, windupMs: 160, retreatHp: 0.22, patrol: 30, shot: false },
  beach_crab: { leash: 88, prefer: 20, reach: 26, attackMs: 860, windupMs: 90, retreatHp: 0.18, patrol: 36, shot: false },
  police_bot: { leash: 200, prefer: 64, reach: 86, attackMs: 820, windupMs: 200, retreatHp: 0, patrol: 60, shot: true },
  event_bot: { leash: 220, prefer: 80, reach: 96, attackMs: 700, windupMs: 140, retreatHp: 0.3, patrol: 28, shot: true },
  training_dummy: { leash: 0, prefer: 0, reach: 0, attackMs: 99999, windupMs: 0, retreatHp: 0, patrol: 0, shot: false },
  mine_pest: { leash: 100, prefer: 16, reach: 30, attackMs: 1000, windupMs: 220, retreatHp: 0.2, patrol: 22, shot: false },
};

export function freshBotMind(homeX: number, homeY: number, strafe: number): BotMind {
  return {
    homeX,
    homeY,
    aimX: homeX,
    aimY: homeY,
    nextAim: 0,
    attackAt: 0,
    windupUntil: 0,
    pendingStrike: false,
    alertUntil: 0,
    strafe: strafe >= 0 ? 1 : -1,
  };
}

export function thinkBot(input: {
  kind: BotKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  aggro: number;
  time: number;
  px: number;
  py: number;
  playerInSafe: boolean;
  neighbors: { x: number; y: number }[];
  mind: BotMind;
}): BotOrder {
  const style = STYLE[input.kind];
  const mind = input.mind;
  const homeDist = Math.hypot(input.x - mind.homeX, input.y - mind.homeY);
  const pDist = Math.hypot(input.px - input.x, input.py - input.y);
  const facing = facingOf(input.px - input.x, input.py - input.y);
  const hurt = input.maxHp > 0 && input.hp / input.maxHp <= style.retreatHp && style.retreatHp > 0;
  const alert = input.time < mind.alertUntil;
  const notice = Math.min(input.aggro, style.leash + 20);
  const safeBlocks = input.playerInSafe && input.kind === 'police_bot' && !alert;
  const seesPlayer = pDist < notice && homeDist < style.leash + 24 && !safeBlocks;

  if (mind.windupUntil > input.time) {
    return { vx: 0, vy: 0, attack: null, facing, winding: true };
  }
  if (mind.pendingStrike) {
    mind.pendingStrike = false;
    mind.windupUntil = 0;
    const stillClose = pDist <= style.reach + 8;
    const lunge = stillClose ? step(input.px - input.x, input.py - input.y, input.speed * 1.4) : { vx: 0, vy: 0 };
    return {
      vx: lunge.vx,
      vy: lunge.vy,
      attack: stillClose ? (style.shot ? 'shot' : 'melee') : null,
      facing,
      winding: false,
    };
  }

  if (hurt || (seesPlayer && homeDist > style.leash)) {
    return { ...step(mind.homeX - input.x, mind.homeY - input.y, input.speed), attack: null, facing: facingOf(mind.homeX - input.x, mind.homeY - input.y), winding: false };
  }

  if (!seesPlayer) {
    if (input.time > mind.nextAim || Math.hypot(input.x - mind.aimX, input.y - mind.aimY) < 8) {
      const ang = Math.random() * Math.PI * 2;
      const rad = style.patrol * (0.35 + Math.random() * 0.65);
      mind.aimX = mind.homeX + Math.cos(ang) * rad;
      mind.aimY = mind.homeY + Math.sin(ang) * rad;
      mind.nextAim = input.time + 1100 + Math.random() * 1700;
      mind.strafe = Math.random() < 0.5 ? -1 : 1;
    }
    const patrol = step(mind.aimX - input.x, mind.aimY - input.y, input.speed * 0.42);
    return { ...patrol, attack: null, facing: facingOf(patrol.vx, patrol.vy), winding: false };
  }

  if (pDist <= style.reach && input.time >= mind.attackAt) {
    mind.attackAt = input.time + style.attackMs;
    mind.windupUntil = input.time + style.windupMs;
    mind.pendingStrike = true;
    return { vx: 0, vy: 0, attack: null, facing, winding: true };
  }

  let dx = input.px - input.x;
  let dy = input.py - input.y;
  const dist = Math.hypot(dx, dy) || 1;
  let sx = dx / dist;
  let sy = dy / dist;
  let speed = input.speed;
  if (input.kind === 'mine_pest' && dist < 64) {
    speed *= 1.75;
  } else if (input.kind === 'beach_crab') {
    sx = sx * 0.45 + (-dy / dist) * mind.strafe * 0.85;
    sy = sy * 0.45 + (dx / dist) * mind.strafe * 0.85;
  } else if (dist < style.prefer - 8) {
    sx = -sx;
    sy = -sy;
  } else if (dist < style.prefer + 14) {
    sx = (-dy / dist) * mind.strafe;
    sy = (dx / dist) * mind.strafe;
  }

  for (const other of input.neighbors) {
    const ox = input.x - other.x;
    const oy = input.y - other.y;
    const od = Math.hypot(ox, oy);
    if (od > 0 && od < 22) {
      sx += (ox / od) * (22 - od) * 0.08;
      sy += (oy / od) * (22 - od) * 0.08;
    }
  }

  const move = step(sx, sy, speed);
  return { ...move, attack: null, facing: facingOf(move.vx, move.vy), winding: false };
}

function step(dx: number, dy: number, speed: number): { vx: number; vy: number } {
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return { vx: 0, vy: 0 };
  return { vx: (dx / d) * speed, vy: (dy / d) * speed };
}

function facingOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return 'down';
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
