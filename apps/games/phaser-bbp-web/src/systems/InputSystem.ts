/**
 * Input System - Original Baseball Game
 * Handles touch and mouse controls with mobile-first design
 */

import Phaser from 'phaser';

export type InputCallback = () => void;

export class InputSystem {
  private scene: Phaser.Scene;
  private swingCallback?: InputCallback;
  private isEnabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  /**
   * Setup touch and keyboard input
   */
  private setupInput(): void {
    // Touch input (mobile-first)
    this.scene.input.on('pointerdown', () => {
      if (this.isEnabled && this.swingCallback) {
        this.swingCallback();
      }
    });

    // Keyboard input (desktop fallback)
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-SPACE', () => {
        if (this.isEnabled && this.swingCallback) {
          this.swingCallback();
        }
      });
    }
  }

  /**
   * Register swing callback
   */
  onSwing(callback: InputCallback): void {
    this.swingCallback = callback;
  }

  /**
   * Enable/disable input
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Clear all callbacks
   */
  clear(): void {
    this.swingCallback = undefined;
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get device pixel ratio for responsive scaling
   */
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }
}
