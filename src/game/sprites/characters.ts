import Phaser from 'phaser';
import type { Dir } from '../config';
import { drawPose, type PosePhase, type WeaponPose } from './weaponPoses';

/** Original layered pixel people (head / body / hat). Not copied from any Era client. */

export interface ActorLook {
  hair: number;
  shirt: number;
  pants: number;
  hat: number;
  skin?: number;
  held?: 'none' | 'melee' | 'gun' | 'staff';
  pose?: WeaponPose;
}

const HAIR = ['#2b2118', '#6b3a1f', '#d7b15a', '#111111', '#8d2448', '#ece7df'];
const SHIRT = ['#2fbf84', '#3d8fd4', '#e15b45', '#e2b84a', '#8a63d2', '#d7e2f2'];
const PANTS = ['#243044', '#4a3428', '#1d3a2c', '#3a3048', '#1c1c1c', '#5c4634'];
const SKIN = ['#f3c99a', '#e0ac69', '#c68642', '#8d5524'];
const OUTLINE = '#1a120e';

const FACINGS: Dir[] = ['down', 'left', 'right', 'up'];

function hex(n: number, list: string[]): string {
  return list[((n % list.length) + list.length) % list.length];
}

export function paintActorSheet(scene: Phaser.Scene, key: string, look: ActorLook): string {
  if (scene.textures.exists(key)) {
    ensureAnims(scene, key);
    return key;
  }
  const fw = 32;
  const fh = 32;
  const phases: PosePhase[] = look.pose
    ? ['idle', 'walk', 'windup', 'strike', 'recover', 'reload']
    : ['idle', 'walk'];
  const canvas = document.createElement('canvas');
  canvas.width = fw * 4;
  canvas.height = fh * phases.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) return key;
  ctx.imageSmoothingEnabled = false;
  phases.forEach((phase, row) => {
    FACINGS.forEach((facing, col) => {
      drawFrame(ctx, col * fw, row * fh, facing, phase === 'walk' ? 1 : 0, look, phase);
    });
  });
  scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth: fw, frameHeight: fh });
  ensureAnims(scene, key);
  return key;
}

function ensureAnims(scene: Phaser.Scene, key: string): void {
  FACINGS.forEach((facing, col) => {
    const idle = `${key}-idle-${facing}`;
    const walk = `${key}-walk-${facing}`;
    if (!scene.anims.exists(idle)) {
      scene.anims.create({ key: idle, frames: [{ key, frame: col }], frameRate: 1, repeat: -1 });
    }
    if (!scene.anims.exists(walk)) {
      scene.anims.create({
        key: walk,
        frames: [
          { key, frame: col },
          { key, frame: col + 4 },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }
  });
}

export function playActorAnim(sprite: Phaser.GameObjects.Sprite, key: string, facing: Dir, moving: boolean): void {
  const anim = `${key}-${moving ? 'walk' : 'idle'}-${facing}`;
  if (sprite.anims.currentAnim?.key === anim) return;
  if (sprite.scene.anims.exists(anim)) sprite.play(anim);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  facing: Dir,
  step: number,
  look: ActorLook,
  phase: PosePhase,
): void {
  ctx.save();
  if (facing === 'left') {
    ctx.translate(ox + 32, oy);
    ctx.scale(-1, 1);
    stamp(ctx, 0, 0, 'right', step, look, phase);
  } else {
    const side: 'down' | 'right' | 'up' = facing === 'up' ? 'up' : facing === 'right' ? 'right' : 'down';
    stamp(ctx, ox, oy, side, step, look, phase);
  }
  ctx.restore();
}

function stamp(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  facing: 'down' | 'right' | 'up',
  step: number,
  look: ActorLook,
  phase: PosePhase,
): void {
  const skin = hex(look.skin ?? 0, SKIN);
  const hair = hex(look.hair, HAIR);
  const shirt = hex(look.shirt, SHIRT);
  const pants = hex(look.pants, PANTS);
  const bob = step ? 1 : 0;
  const put = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, h);
  };

  // ground shadow
  put(10, 29, 'rgba(0,0,0,0.28)', 12, 2);

  const legL = 23 + (step ? 1 : 0);
  const legR = 23 + (step ? 0 : 1);
  if (facing !== 'up') {
    put(12, legL, pants, 3, 6 - bob);
    put(17, legR, pants, 3, 6 - bob);
    put(12, 28, '#2a211c', 3, 2);
    put(17, 28, '#2a211c', 3, 2);
  } else {
    put(12, 23, pants, 8, 6);
    put(12, 28, '#2a211c', 8, 2);
  }

  put(11, 14, shirt, 10, 9);
  put(12, 15, 'rgba(255,255,255,0.22)', 2, 6);
  put(11, 14, OUTLINE, 10, 1);
  if (!look.pose) {
    put(8, 15, shirt, 3, 7);
    put(21, 15, shirt, 3, 7);
    put(8, 15, skin, 2, 2);
    put(22, 15, skin, 2, 2);
  } else if (facing === 'up') {
    drawPose(put, facing, phase, look.pose, skin);
  }

  // head
  put(11, 5, skin, 10, 9);
  put(11, 5, OUTLINE, 10, 1);
  put(11, 5, OUTLINE, 1, 9);
  put(20, 5, OUTLINE, 1, 9);

  if (facing === 'down') {
    put(12, 5, hair, 8, 3);
    put(13, 6, 'rgba(255,255,255,0.28)', 2, 1);
    put(13, 9, '#1a120e', 2, 2);
    put(17, 9, '#1a120e', 2, 2);
    put(15, 12, '#c47878', 2, 1);
  } else if (facing === 'up') {
    put(11, 5, hair, 10, 8);
  } else {
    put(12, 5, hair, 8, 4);
    put(18, 9, '#1a120e', 2, 2);
    put(16, 12, '#c47878', 2, 1);
  }

  drawHat(put, look.hat, facing);
  if (look.pose && facing !== 'up') drawPose(put, facing, phase, look.pose, skin);
  else if (!look.pose) drawHeld(put, look.held ?? 'none', facing);
}

function drawHeld(
  put: (x: number, y: number, c: string, w?: number, h?: number) => void,
  held: 'none' | 'melee' | 'gun' | 'staff',
  facing: 'down' | 'right' | 'up',
): void {
  if (held === 'none') return;
  if (held === 'melee') {
    put(22, 8, '#6b4428', 2, 14);
    put(21, 7, '#d7dbe2', 4, 2);
    return;
  }
  if (held === 'staff') {
    put(23, 4, '#6a4a78', 2, 20);
    put(22, 4, '#e2b84a', 4, 2);
    return;
  }
  if (facing === 'up') {
    put(8, 16, '#2a2e33', 6, 3);
    return;
  }
  put(22, 16, '#2a2e33', 8, 3);
  put(29, 17, '#e2b84a', 2, 1);
}

function drawHat(
  put: (x: number, y: number, c: string, w?: number, h?: number) => void,
  hat: number,
  facing: 'down' | 'right' | 'up',
): void {
  const style = ((hat % 6) + 6) % 6;
  if (style === 0) return;
  if (style === 1) {
    // cap
    put(11, 3, '#243044', 10, 3);
    if (facing !== 'up') put(16, 5, '#243044', 6, 2);
  } else if (style === 2) {
    put(11, 2, '#6b2a3a', 10, 5);
  } else if (style === 3) {
    put(12, 1, '#e2b84a', 8, 2);
    put(11, 3, '#e2b84a', 2, 3);
    put(15, 2, '#e2b84a', 2, 4);
    put(19, 3, '#e2b84a', 2, 3);
  } else if (style === 4) {
    put(10, 3, '#3a2a22', 12, 2);
    put(12, 1, '#3a2a22', 8, 3);
  } else {
    put(11, 3, '#8aa0b4', 10, 4);
    put(12, 6, '#5c6b78', 8, 2);
  }
}

export function actorKeyFor(prefix: string, look: ActorLook): string {
  return `${prefix}-h${look.hair}-s${look.shirt}-p${look.pants}-t${look.hat}-k${look.skin ?? 0}-w${look.pose?.id ?? look.held ?? 'none'}`;
}
