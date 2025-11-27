/**
 * Diamond Sluggers - Main Entry Point
 * Mobile backyard baseball game built with Phaser 3
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Create game container if it doesn't exist
  let container = document.getElementById('game-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-container';
    container.style.cssText = `
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #000;
      touch-action: none;
    `;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(container);
  }

  // Create Phaser game instance
  const game = new Phaser.Game(GAME_CONFIG);

  // Handle visibility changes (pause when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.scene.pause('GameScene');
    } else {
      game.scene.resume('GameScene');
    }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });

  // Prevent default touch behaviors
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.target === container || container?.contains(e.target as Node)) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Log game info
  console.log('🎮 Diamond Sluggers v1.0.0');
  console.log('📍 Built by Blaze Sports Intel');
  console.log('🌐 https://blazesportsintel.com/game');
});

// Export for module usage
export { GAME_CONFIG };
