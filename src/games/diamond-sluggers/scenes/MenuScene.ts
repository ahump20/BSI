/**
 * MenuScene - Main menu with play button and navigation
 */

import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private playButton!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4caf50, 0x4caf50, 1);
    bg.fillRect(0, 0, width, height);

    // Add grass at bottom
    const grass = this.add.graphics();
    grass.fillStyle(0x4caf50, 1);
    grass.fillRect(0, height - 200, width, 200);

    // Dirt infield hint
    const dirt = this.add.graphics();
    dirt.fillStyle(0x8d6e63, 1);
    dirt.fillEllipse(centerX, height - 50, 600, 150);

    // Game title
    this.titleText = this.add
      .text(centerX, 150, 'DIAMOND\nSLUGGERS', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '72px',
        color: '#ffffff',
        stroke: '#BF5700',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(centerX, 280, 'Texas Backyard Baseball', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#BF5700',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Play button
    this.createPlayButton(centerX, centerY + 50);

    // Secondary buttons
    this.createMenuButton(centerX - 200, height - 120, 'LEADERBOARD', () => {
      console.log('Show leaderboard');
    });

    this.createMenuButton(centerX, height - 120, 'SETTINGS', () => {
      console.log('Show settings');
    });

    this.createMenuButton(centerX + 200, height - 120, 'SHOP', () => {
      console.log('Show shop');
    });

    // Coins display
    const coins = this.registry.get('coins') || 0;
    this.add
      .text(width - 30, 30, `${coins}`, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    // Username
    const username = this.registry.get('username') || 'Player';
    this.add.text(30, 30, username, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });

    // Start background music if enabled
    if (this.registry.get('musicEnabled')) {
      if (this.sound.get('bgm-menu')) {
        this.sound.play('bgm-menu', { loop: true, volume: 0.3 });
      }
    }

    // Animate title entrance
    this.titleText.setScale(0);
    this.tweens.add({
      targets: this.titleText,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });
  }

  private createPlayButton(x: number, y: number): void {
    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xbf5700, 1);
    buttonBg.fillCircle(0, 0, 80);

    // Button highlight
    const highlight = this.add.graphics();
    highlight.fillStyle(0xff6b35, 1);
    highlight.fillCircle(0, -10, 70);

    // Play text
    const playText = this.add
      .text(0, 0, 'PLAY', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Container
    this.playButton = this.add.container(x, y, [buttonBg, highlight, playText]);
    this.playButton.setSize(160, 160);
    this.playButton.setInteractive({ useHandCursor: true });

    // Pulse animation
    this.tweens.add({
      targets: this.playButton,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Click handler
    this.playButton.on('pointerdown', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.startGame();
        },
      });
    });

    // Hover effects
    this.playButton.on('pointerover', () => {
      highlight.clear();
      highlight.fillStyle(0xffa500, 1);
      highlight.fillCircle(0, -10, 70);
    });

    this.playButton.on('pointerout', () => {
      highlight.clear();
      highlight.fillStyle(0xff6b35, 1);
      highlight.fillCircle(0, -10, 70);
    });
  }

  private createMenuButton(x: number, y: number, text: string, onClick: () => void): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a1a, 0.8);
    bg.fillRoundedRect(-80, -25, 160, 50, 10);

    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const container = this.add.container(x, y, [bg, label]);
    container.setSize(160, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', onClick);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xbf5700, 0.9);
      bg.fillRoundedRect(-80, -25, 160, 50, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a1a, 0.8);
      bg.fillRoundedRect(-80, -25, 160, 50, 10);
    });
  }

  private startGame(): void {
    // Stop menu music
    this.sound.stopByKey('bgm-menu');

    // Play button sound
    if (this.registry.get('soundEnabled') && this.sound.get('sfx-button')) {
      this.sound.play('sfx-button');
    }

    // Fade out and start game
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', {
        stadium: 'boerne-backyard',
        opponent: 'cpu',
        difficulty: 'normal',
      });
    });
  }
}
