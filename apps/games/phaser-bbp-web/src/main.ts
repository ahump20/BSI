import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

const canvasParent = document.getElementById('game-container');

if (!canvasParent) {
  throw new Error('Game container missing');
}

document.addEventListener('gesturestart', (event) => {
  event.preventDefault();
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 420,
  height: 720,
  parent: canvasParent,
  backgroundColor: '#071224',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 420,
    height: 720
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

// Delay instantiation slightly so preload message renders
window.setTimeout(() => {
  // eslint-disable-next-line no-new
  new Phaser.Game(config);
  const preloadMessage = document.getElementById('preload-message');
  if (preloadMessage && preloadMessage.parentElement) {
    preloadMessage.parentElement.removeChild(preloadMessage);
  }
}, 120);
