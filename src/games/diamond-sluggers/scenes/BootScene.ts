/**
 * BootScene - Initial loading and configuration
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load minimal assets needed for preload screen
    this.load.setBaseURL('/game/');

    // Loading bar background
    this.load.image('loading-bg', 'assets/ui/loading-bg.png');
    this.load.image('loading-bar', 'assets/ui/loading-bar.png');
    this.load.image('logo', 'assets/ui/logo.png');
  }

  create(): void {
    // Set up game registry with default values
    this.registry.set('userId', this.getOrCreateUserId());
    this.registry.set('username', 'Player');
    this.registry.set('coins', 0);
    this.registry.set('totalWins', 0);
    this.registry.set('unlockedCharacters', ['maya-thunder', 'jackson-rocket', 'emma-glove']);
    this.registry.set('unlockedStadiums', ['boerne-backyard']);
    this.registry.set('soundEnabled', true);
    this.registry.set('musicEnabled', true);
    this.registry.set('vibrationEnabled', true);

    // Load saved settings from localStorage
    this.loadSettings();

    // Transition to preload scene
    this.scene.start('PreloadScene');
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('diamond-sluggers-user-id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('diamond-sluggers-user-id', userId);
    }
    return userId;
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('diamond-sluggers-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.registry.set('soundEnabled', parsed.soundEnabled ?? true);
        this.registry.set('musicEnabled', parsed.musicEnabled ?? true);
        this.registry.set('vibrationEnabled', parsed.vibrationEnabled ?? true);
        this.registry.set('username', parsed.username ?? 'Player');
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }
}
