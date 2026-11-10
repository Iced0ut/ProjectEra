import Phaser from 'phaser';
import type { GameState } from '../state';
import { playSfx } from '../audio';
import { hidePlayHud, renderHud, showPlayHud, toggleInventory } from '../ui/domHud';

export class HudScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super('hud');
  }

  init(data: { state: GameState }): void {
    this.state = data.state;
  }

  create(): void {
    showPlayHud();
    renderHud(this.state);

    this.game.events.on('era-state', (state: GameState) => {
      this.state = state;
      renderHud(state);
    });
    this.game.events.on('era-chat', () => renderHud(this.state));
    this.game.events.on('era-region', (region: string) => renderHud(this.state, { region }));
    this.game.events.on('era-hint', (hint: string) => renderHud(this.state, { hint }));
    this.game.events.on('era-toggle', (panel: string) => {
      if (panel === 'inventory') {
        toggleInventory();
        playSfx(this, 'ui');
        renderHud(this.state);
      }
    });
  }

  shutdown(): void {
    hidePlayHud();
  }
}
