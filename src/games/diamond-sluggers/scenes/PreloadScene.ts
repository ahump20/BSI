/**
 * PreloadScene - Asset loading with progress bar
 */

import Phaser from 'phaser';
import { API_ENDPOINTS } from '../config/game.config';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.cameras.main.setBackgroundColor('#1A1A1A');

    // Progress box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x2d2d2d, 0.8);
    this.progressBox.fillRoundedRect(centerX - 320, centerY - 30, 640, 60, 10);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Title text
    this.add
      .text(centerX, centerY - 100, 'DIAMOND SLUGGERS', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '48px',
        color: '#FF6B35',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Loading text
    this.loadingText = this.add
      .text(centerX, centerY - 50, 'Loading...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Percent text
    this.percentText = this.add
      .text(centerX, centerY, '0%', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#FF6B35',
      })
      .setOrigin(0.5);

    // Asset text
    this.assetText = this.add
      .text(centerX, centerY + 60, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#808080',
      })
      .setOrigin(0.5);

    // Register loading events
    this.load.on('progress', this.onProgress, this);
    this.load.on('fileprogress', this.onFileProgress, this);
    this.load.on('complete', this.onComplete, this);

    // Start loading assets
    this.loadAssets();
  }

  private loadAssets(): void {
    this.load.setBaseURL('/game/');

    // UI Elements
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('button-hover', 'assets/ui/button-hover.png');
    this.load.image('panel', 'assets/ui/panel.png');
    this.load.image('icon-coin', 'assets/ui/icon-coin.png');
    this.load.image('icon-star', 'assets/ui/icon-star.png');

    // Field elements
    this.load.image('field-grass', 'assets/field/grass.png');
    this.load.image('field-dirt', 'assets/field/dirt.png');
    this.load.image('field-base', 'assets/field/base.png');
    this.load.image('field-plate', 'assets/field/home-plate.png');
    this.load.image('field-mound', 'assets/field/mound.png');
    this.load.image('field-fence', 'assets/field/fence.png');

    // Ball and bat
    this.load.image('baseball', 'assets/game/baseball.png');
    this.load.image('bat', 'assets/game/bat.png');
    this.load.image('glove', 'assets/game/glove.png');

    // Placeholder character sprites (will be replaced with real art)
    this.load.spritesheet('player-idle', 'assets/characters/player-idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('player-swing', 'assets/characters/player-swing.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player-pitch', 'assets/characters/player-pitch.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player-run', 'assets/characters/player-run.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Stadium backgrounds
    this.load.image('stadium-boerne', 'assets/stadiums/boerne-backyard.png');
    this.load.image('stadium-sanantonio', 'assets/stadiums/san-antonio-lot.png');
    this.load.image('stadium-austin', 'assets/stadiums/austin-treehouse.png');

    // Effects
    this.load.spritesheet('hit-effect', 'assets/effects/hit-effect.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('dust-puff', 'assets/effects/dust-puff.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Audio
    this.load.audio('bgm-menu', 'assets/audio/bgm-menu.mp3');
    this.load.audio('bgm-game', 'assets/audio/bgm-game.mp3');
    this.load.audio('sfx-hit', 'assets/audio/sfx-hit.mp3');
    this.load.audio('sfx-swing', 'assets/audio/sfx-swing.mp3');
    this.load.audio('sfx-catch', 'assets/audio/sfx-catch.mp3');
    this.load.audio('sfx-pitch', 'assets/audio/sfx-pitch.mp3');
    this.load.audio('sfx-crowd', 'assets/audio/sfx-crowd.mp3');
    this.load.audio('sfx-homerun', 'assets/audio/sfx-homerun.mp3');
    this.load.audio('sfx-strikeout', 'assets/audio/sfx-strikeout.mp3');
    this.load.audio('sfx-button', 'assets/audio/sfx-button.mp3');

    // Start loading
    this.load.start();
  }

  private onProgress(value: number): void {
    this.percentText.setText(`${Math.round(value * 100)}%`);

    this.progressBar.clear();
    this.progressBar.fillStyle(0xff6b35, 1);
    this.progressBar.fillRoundedRect(
      this.cameras.main.width / 2 - 310,
      this.cameras.main.height / 2 - 20,
      620 * value,
      40,
      8
    );
  }

  private onFileProgress(file: Phaser.Loader.File): void {
    this.assetText.setText(`Loading: ${file.key}`);
  }

  private onComplete(): void {
    this.loadingText.setText('Loading game data...');

    // Fetch initial game data from API
    this.fetchGameData()
      .then(() => {
        // Create animations
        this.createAnimations();

        // Transition to menu
        this.time.delayedCall(500, () => {
          this.scene.start('MenuScene');
        });
      })
      .catch((error) => {
        console.error('Failed to fetch game data:', error);
        // Continue anyway with default data
        this.createAnimations();
        this.time.delayedCall(500, () => {
          this.scene.start('MenuScene');
        });
      });
  }

  private async fetchGameData(): Promise<void> {
    const userId = this.registry.get('userId');

    try {
      // Load saved progress
      const progressResponse = await fetch(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.LOAD_GAME}/${userId}`
      );
      if (progressResponse.ok) {
        const data = await progressResponse.json();
        if (data.success && data.data) {
          const { user, progress } = data.data;
          this.registry.set('username', user.username);
          this.registry.set('coins', progress.coins);
          this.registry.set('totalWins', progress.total_wins);
          this.registry.set('unlockedCharacters', progress.unlocked_characters);
          this.registry.set('unlockedStadiums', progress.unlocked_stadiums);
        }
      }

      // Load characters
      const playersResponse = await fetch(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.PLAYERS}?userId=${userId}`
      );
      if (playersResponse.ok) {
        const data = await playersResponse.json();
        if (data.success && data.data) {
          this.registry.set('characters', data.data.characters);
        }
      }

      // Load stadiums
      const stadiumsResponse = await fetch(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.STADIUMS}?userId=${userId}`
      );
      if (stadiumsResponse.ok) {
        const data = await stadiumsResponse.json();
        if (data.success && data.data) {
          this.registry.set('stadiums', data.data.stadiums);
        }
      }
    } catch (error) {
      console.error('API fetch failed:', error);
    }
  }

  private createAnimations(): void {
    // Player idle animation
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    // Player swing animation
    this.anims.create({
      key: 'swing',
      frames: this.anims.generateFrameNumbers('player-swing', { start: 0, end: 7 }),
      frameRate: 24,
      repeat: 0,
    });

    // Player pitch animation
    this.anims.create({
      key: 'pitch',
      frames: this.anims.generateFrameNumbers('player-pitch', { start: 0, end: 11 }),
      frameRate: 18,
      repeat: 0,
    });

    // Player run animation
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });

    // Hit effect
    this.anims.create({
      key: 'hit-spark',
      frames: this.anims.generateFrameNumbers('hit-effect', { start: 0, end: 5 }),
      frameRate: 20,
      repeat: 0,
    });

    // Dust puff
    this.anims.create({
      key: 'dust',
      frames: this.anims.generateFrameNumbers('dust-puff', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: 0,
    });
  }
}
