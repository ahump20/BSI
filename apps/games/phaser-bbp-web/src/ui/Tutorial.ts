/**
 * Tutorial Overlay - Original Baseball Game
 * Shows controls and basic instructions
 */

import Phaser from 'phaser';
import { InputSystem } from '@/systems/InputSystem';

export class Tutorial {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onComplete?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2
    );

    this.createTutorial();
  }

  /**
   * Create tutorial UI
   */
  private createTutorial(): void {
    // Semi-transparent background
    const bg = this.scene.add.rectangle(0, 0, 600, 400, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0xffcc00);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(0, -150, 'How to Play', {
      fontSize: '32px',
      color: '#ffcc00',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Instructions
    const isTouchDevice = InputSystem.isTouchDevice();
    const instructions = [
      '⚾ Hit the ball when it crosses the plate!',
      '',
      isTouchDevice
        ? '📱 TAP anywhere to swing'
        : '⌨️  Press SPACE to swing',
      '',
      '🎯 Perfect timing = Home run!',
      '✅ Good timing = Hit!',
      '❌ Poor timing = Out or foul',
      '',
      '🎮 Try to score more runs than the CPU',
      `📊 Game is ${3} innings`
    ];

    const instructionText = this.scene.add.text(0, -50, instructions.join('\n'), {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    });
    instructionText.setOrigin(0.5);
    this.container.add(instructionText);

    // Start button
    const buttonBg = this.scene.add.rectangle(0, 150, 200, 60, 0x00aa00);
    buttonBg.setStrokeStyle(2, 0xffffff);
    buttonBg.setInteractive({ useHandCursor: true });

    const buttonText = this.scene.add.text(0, 150, 'START GAME', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    buttonBg.on('pointerdown', () => this.close());
    buttonBg.on('pointerover', () => buttonBg.setFillStyle(0x00cc00));
    buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x00aa00));

    this.container.add([buttonBg, buttonText]);

    // Set depth to be on top
    this.container.setDepth(1000);
  }

  /**
   * Set callback for when tutorial is complete
   */
  onCompleteTutorial(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Close tutorial
   */
  private close(): void {
    this.container.destroy();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Show tutorial
   */
  show(): void {
    this.container.setVisible(true);
  }

  /**
   * Hide tutorial
   */
  hide(): void {
    this.container.setVisible(false);
  }
}
