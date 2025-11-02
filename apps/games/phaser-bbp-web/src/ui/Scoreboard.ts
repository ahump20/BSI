/**
 * Scoreboard UI - Original Baseball Game
 * Displays score, inning, balls/strikes, outs
 */

import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { GameState } from '@/systems/GameState';

export class Scoreboard {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private inningText: Phaser.GameObjects.Text;
  private countText: Phaser.GameObjects.Text;
  private outsText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    // Background
    const bg = scene.add.rectangle(0, 0, 380, 120, 0x000000, 0.7);
    bg.setStrokeStyle(2, 0xffffff);
    this.container.add(bg);

    // Score text
    this.scoreText = scene.add.text(-170, -40, 'Score:', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.container.add(this.scoreText);

    // Inning text
    this.inningText = scene.add.text(-170, -10, 'Inning:', {
      fontSize: '18px',
      color: '#ffcc00'
    });
    this.container.add(this.inningText);

    // Count text (balls-strikes)
    this.countText = scene.add.text(-170, 15, 'Count:', {
      fontSize: '18px',
      color: '#00ff00'
    });
    this.container.add(this.countText);

    // Outs text
    this.outsText = scene.add.text(-170, 40, 'Outs:', {
      fontSize: '18px',
      color: '#ff6666'
    });
    this.container.add(this.outsText);
  }

  /**
   * Update scoreboard with current game state
   */
  update(gameState: GameState): void {
    this.scoreText.setText(`Score: Player ${gameState.player.score} - CPU ${gameState.cpu.score}`);

    this.inningText.setText(
      `Inning: ${gameState.inning} ${gameState.isTopOfInning ? '▲' : '▼'}`
    );

    this.countText.setText(`Count: ${gameState.balls}-${gameState.strikes}`);

    this.outsText.setText(`Outs: ${gameState.outs}`);
  }

  /**
   * Show/hide scoreboard
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy();
  }
}
