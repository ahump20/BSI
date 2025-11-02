/**
 * Audio System - Original Baseball Game
 * Manages sound effects and music (placeholder system)
 */

import Phaser from 'phaser';

export type SoundEffect = 'swing' | 'hit' | 'strike' | 'out' | 'cheer';

export class AudioSystem {
  private scene: Phaser.Scene;
  private sounds: Map<SoundEffect, Phaser.Sound.BaseSound | null> = new Map();
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initialize audio (to be called after assets are loaded)
   * For now, this is a placeholder - sounds will be added later
   */
  init(): void {
    // Placeholder - will load actual sounds when assets are available
    this.sounds.set('swing', null);
    this.sounds.set('hit', null);
    this.sounds.set('strike', null);
    this.sounds.set('out', null);
    this.sounds.set('cheer', null);
  }

  /**
   * Play sound effect
   * Currently a placeholder - will play actual sounds when assets are available
   */
  play(effect: SoundEffect): void {
    if (this.isMuted) return;

    const sound = this.sounds.get(effect);
    if (sound && sound.play) {
      sound.play();
    } else {
      // Placeholder: Log to console during development
      console.log(`[Audio] ${effect}`);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.scene.sound.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.scene.sound.stopAll();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAll();
    this.sounds.clear();
  }
}
