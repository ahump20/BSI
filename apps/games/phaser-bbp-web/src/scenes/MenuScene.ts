/**
 * Menu Scene - Original Baseball Game
 * Main menu with play button
 */

import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background gradient effect using simple shapes
    const bg1 = this.add.rectangle(width / 2, 0, width, height / 3, 0x1a5f7a);
    const bg2 = this.add.rectangle(width / 2, height / 3, width, height / 3, 0x2d8ca8);
    const bg3 = this.add.rectangle(width / 2, (height * 2) / 3, width, height / 3, 0x4db8d1);

    // Title
    const title = this.add.text(width / 2, height / 3, 'Baseball Game', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 70, 'Original • Mobile-Friendly', {
      fontSize: '24px',
      color: '#ffcc00',
      fontStyle: 'italic'
    });
    subtitle.setOrigin(0.5);

    // Play button
    const playButton = this.createButton(
      width / 2,
      height / 2 + 50,
      'PLAY GAME',
      () => this.scene.start('GameScene')
    );

    // Credits
    const credits = this.add.text(
      width / 2,
      height - 40,
      '© Blaze Sports Intel • All characters and assets are original',
      {
        fontSize: '14px',
        color: '#cccccc'
      }
    );
    credits.setOrigin(0.5);

    // Add bounce animation to title
    this.tweens.add({
      targets: title,
      y: title.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create an interactive button
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 250, 70, 0x00aa00);
    bg.setStrokeStyle(4, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(0, 0, text, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x00cc00);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x00aa00);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    bg.on('pointerdown', onClick);

    container.add([bg, label]);
    return container;
  }
}
