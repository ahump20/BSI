import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Generate placeholder textures programmatically to avoid binary assets.
    const bat = this.add.graphics();
    bat.fillStyle(0xf59e0b, 1);
    bat.fillRoundedRect(0, 0, 200, 24, 12);
    bat.generateTexture('bat', 200, 24);
    bat.destroy();

    const ball = this.add.graphics();
    ball.fillStyle(0xf87171, 1);
    ball.fillCircle(24, 24, 24);
    ball.lineStyle(4, 0xffffff, 1);
    ball.beginPath();
    ball.moveTo(8, 16);
    ball.quadraticCurveTo(24, 8, 40, 16);
    ball.moveTo(8, 32);
    ball.quadraticCurveTo(24, 40, 40, 32);
    ball.strokePath();
    ball.generateTexture('ball', 48, 48);
    ball.destroy();

    const player = this.add.graphics();
    player.fillStyle(0x38bdf8, 1);
    player.fillRoundedRect(0, 0, 80, 120, 16);
    player.fillStyle(0x1f2937, 1);
    player.fillRoundedRect(16, 16, 48, 48, 12);
    player.fillStyle(0xfbbf24, 1);
    player.fillCircle(40, 92, 20);
    player.generateTexture('player', 80, 120);
    player.destroy();

    const catcher = this.add.graphics();
    catcher.fillStyle(0x4ade80, 1);
    catcher.fillRoundedRect(0, 0, 80, 120, 16);
    catcher.fillStyle(0x1f2937, 1);
    catcher.fillRoundedRect(16, 16, 48, 48, 12);
    catcher.fillStyle(0x22d3ee, 1);
    catcher.fillCircle(40, 92, 20);
    catcher.generateTexture('catcher', 80, 120);
    catcher.destroy();

    this.load.audio('bleep', 'data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAA');
  }

  create() {
    this.scene.start('Menu');
  }
}
