import Phaser from 'phaser';

const SFX = [
  'swing',
  'hit',
  'shoot',
  'dash',
  'pickup',
  'coin',
  'hurt',
  'heal',
  'ui',
  'chat',
  'levelup',
  'job',
] as const;

export type SfxId = (typeof SFX)[number];

export function preloadAudio(scene: Phaser.Scene): void {
  for (const id of SFX) {
    scene.load.audio(id, `/audio/${id}.wav`);
  }
  scene.load.audio('theme_city', '/audio/theme_city.wav');
  scene.load.audio('theme_title', '/audio/theme_title.wav');
}

export function playSfx(scene: Phaser.Scene, id: SfxId, volume = 0.45): void {
  if (!scene.cache.audio.exists(id)) return;
  scene.sound.play(id, { volume });
}

export function playMusic(scene: Phaser.Scene, key: 'theme_city' | 'theme_title', volume = 0.28): void {
  if (!scene.cache.audio.exists(key)) return;
  if (scene.sound.get(key)?.isPlaying) return;
  scene.sound.stopByKey('theme_city');
  scene.sound.stopByKey('theme_title');
  scene.sound.play(key, { loop: key === 'theme_city', volume });
}
