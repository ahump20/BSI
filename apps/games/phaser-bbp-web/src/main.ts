/**
 * Main Entry Point - Original Baseball Game
 * Initializes Phaser game with all scenes
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameConfig } from './config/GameConfig';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GameConfig.width,
  height: GameConfig.height,
  backgroundColor: GameConfig.backgroundColor,
  pixelArt: GameConfig.pixelArt,
  physics: GameConfig.physics,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GameConfig.width,
    height: GameConfig.height
  },
  scene: [BootScene, MenuScene, GameScene]
};

// Create game instance
const game = new Phaser.Game(config);

// Expose game instance for debugging
(window as any).game = game;

// Handle window resize for responsive design
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Prevent default touch behaviors on game canvas
const canvas = document.querySelector('canvas');
if (canvas) {
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

export default game;
