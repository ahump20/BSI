/**
 * GameScene - Core gameplay with batting mechanics
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/game.config';
import type { GameState, Pitch, PitchType, HitResult, BatSwing } from '../types';

interface GameSceneData {
  stadium: string;
  opponent: string;
  difficulty: string;
}

export class GameScene extends Phaser.Scene {
  // Game state
  private gameState!: GameState;
  private isPaused: boolean = false;

  // Field elements
  private fieldGroup!: Phaser.GameObjects.Group;
  private ball!: Phaser.GameObjects.Sprite;
  private bat!: Phaser.GameObjects.Sprite;
  private batter!: Phaser.GameObjects.Sprite;
  private pitcher!: Phaser.GameObjects.Sprite;

  // HUD elements
  private scoreText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private inningText!: Phaser.GameObjects.Text;
  private basesDisplay!: Phaser.GameObjects.Container;

  // Batting mechanics
  private swingZone!: Phaser.GameObjects.Zone;
  private pitchInProgress: boolean = false;
  private canSwing: boolean = false;
  private swingTiming: number = 0;
  private pitchStartTime: number = 0;
  private currentPitch: Pitch | null = null;

  // Strike zone visualization
  private strikeZone!: Phaser.GameObjects.Rectangle;
  private targetIndicator!: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(_data: GameSceneData): void {
    // Initialize game state
    this.gameState = {
      phase: 'pregame',
      inning: { number: 1, half: 'top' },
      count: { balls: 0, strikes: 0, outs: 0 },
      score: { home: 0, away: 0, homeHits: 0, awayHits: 0, homeErrors: 0, awayErrors: 0 },
      runners: [],
      currentBatter: null,
      currentPitcher: null,
      battingOrder: [],
      battingOrderIndex: 0,
      isUserBatting: true,
      stadium: null,
    };
  }

  create(): void {
    // Fade in
    this.cameras.main.fadeIn(300);

    // Create field
    this.createField();

    // Create HUD
    this.createHUD();

    // Create game entities
    this.createEntities();

    // Set up input
    this.setupInput();

    // Start game music
    if (this.registry.get('musicEnabled') && this.sound.get('bgm-game')) {
      this.sound.play('bgm-game', { loop: true, volume: 0.25 });
    }

    // Start first at-bat
    this.time.delayedCall(1000, () => {
      this.startAtBat();
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update ball physics during pitch
    if (this.pitchInProgress && this.ball && this.currentPitch) {
      this.updatePitchPhysics(delta);
    }

    // Check for pitch arrival at plate
    if (this.pitchInProgress && this.ball.y >= GAME_CONSTANTS.FIELD.HOME_PLATE.y - 50) {
      this.onPitchArrival();
    }
  }

  // ============================================
  // Field Setup
  // ============================================

  private createField(): void {
    const { width, height } = this.cameras.main;

    // Sky background
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xb0e0e6, 0xb0e0e6, 1);
    sky.fillRect(0, 0, width, height * 0.4);

    // Outfield grass
    const outfield = this.add.graphics();
    outfield.fillStyle(0x4caf50, 1);
    outfield.fillRect(0, height * 0.3, width, height * 0.7);

    // Infield dirt
    const infield = this.add.graphics();
    infield.fillStyle(0x8d6e63, 1);
    infield.beginPath();
    infield.moveTo(GAME_CONSTANTS.FIELD.HOME_PLATE.x, GAME_CONSTANTS.FIELD.HOME_PLATE.y);
    infield.lineTo(GAME_CONSTANTS.FIELD.FIRST_BASE.x + 50, GAME_CONSTANTS.FIELD.FIRST_BASE.y);
    infield.lineTo(GAME_CONSTANTS.FIELD.SECOND_BASE.x, GAME_CONSTANTS.FIELD.SECOND_BASE.y - 50);
    infield.lineTo(GAME_CONSTANTS.FIELD.THIRD_BASE.x - 50, GAME_CONSTANTS.FIELD.THIRD_BASE.y);
    infield.closePath();
    infield.fillPath();

    // Base paths (white lines)
    const basePaths = this.add.graphics();
    basePaths.lineStyle(3, 0xffffff, 0.8);
    basePaths.lineBetween(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y,
      GAME_CONSTANTS.FIELD.FIRST_BASE.x,
      GAME_CONSTANTS.FIELD.FIRST_BASE.y
    );
    basePaths.lineBetween(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y,
      GAME_CONSTANTS.FIELD.THIRD_BASE.x,
      GAME_CONSTANTS.FIELD.THIRD_BASE.y
    );

    // Pitcher's mound
    this.add.circle(
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.x,
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.y,
      40,
      0xa1887f
    );

    // Bases
    this.createBase(GAME_CONSTANTS.FIELD.FIRST_BASE.x, GAME_CONSTANTS.FIELD.FIRST_BASE.y);
    this.createBase(GAME_CONSTANTS.FIELD.SECOND_BASE.x, GAME_CONSTANTS.FIELD.SECOND_BASE.y);
    this.createBase(GAME_CONSTANTS.FIELD.THIRD_BASE.x, GAME_CONSTANTS.FIELD.THIRD_BASE.y);

    // Home plate
    this.add.polygon(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y,
      [0, -20, 15, -10, 15, 10, -15, 10, -15, -10],
      0xffffff
    );

    // Strike zone (semi-transparent)
    this.strikeZone = this.add.rectangle(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y - 80,
      120,
      160,
      0xffffff,
      0.1
    );
    this.strikeZone.setStrokeStyle(2, 0xffffff, 0.5);

    // Outfield fence
    const fence = this.add.graphics();
    fence.lineStyle(8, 0x8b4513, 1);
    fence.beginPath();
    fence.arc(width / 2, height + 300, 800, Math.PI, 0, false);
    fence.strokePath();
  }

  private createBase(x: number, y: number): void {
    const base = this.add.rectangle(x, y, 30, 30, 0xffffff);
    base.setAngle(45);
  }

  // ============================================
  // HUD Setup
  // ============================================

  private createHUD(): void {
    const { width } = this.cameras.main;

    // Scoreboard background
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x1a1a1a, 0.9);
    scoreBg.fillRoundedRect(width / 2 - 150, 10, 300, 80, 10);

    // Score text
    this.scoreText = this.add
      .text(width / 2, 35, 'AWAY 0 - 0 HOME', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Inning text
    this.inningText = this.add
      .text(width / 2, 65, '▲ 1st', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#FF6B35',
      })
      .setOrigin(0.5);

    // Count display (balls, strikes, outs)
    const countBg = this.add.graphics();
    countBg.fillStyle(0x1a1a1a, 0.9);
    countBg.fillRoundedRect(20, 10, 140, 80, 10);

    this.countText = this.add
      .text(90, 50, 'B: 0  S: 0\nOuts: 0', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    // Bases display
    this.createBasesDisplay();

    // Pause button
    const pauseBtn = this.add
      .text(width - 50, 30, '⏸', {
        fontSize: '32px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => this.togglePause());
  }

  private createBasesDisplay(): void {
    const { width } = this.cameras.main;

    // Mini diamond for bases display
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a1a, 0.9);
    bg.fillRoundedRect(width - 120, 10, 100, 80, 10);

    const baseSize = 15;
    const centerX = width - 70;
    const centerY = 50;

    // Second base (top)
    const second = this.add.rectangle(centerX, centerY - 20, baseSize, baseSize, 0x808080);
    second.setAngle(45);

    // First base (right)
    const first = this.add.rectangle(centerX + 25, centerY + 5, baseSize, baseSize, 0x808080);
    first.setAngle(45);

    // Third base (left)
    const third = this.add.rectangle(centerX - 25, centerY + 5, baseSize, baseSize, 0x808080);
    third.setAngle(45);

    // Home plate indicator
    const home = this.add.polygon(
      centerX,
      centerY + 30,
      [0, -8, 6, -4, 6, 4, -6, 4, -6, -4],
      0x808080
    );

    this.basesDisplay = this.add.container(0, 0, [second, first, third, home]);
  }

  // ============================================
  // Entity Creation
  // ============================================

  private createEntities(): void {
    // Create pitcher placeholder
    this.pitcher = this.add.sprite(
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.x,
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.y - 30,
      'player-idle'
    );
    this.pitcher.setScale(2);

    // Create batter placeholder
    this.batter = this.add.sprite(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x + 60,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y - 40,
      'player-idle'
    );
    this.batter.setScale(2);
    this.batter.setFlipX(true);

    // Create bat
    this.bat = this.add.sprite(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x + 40,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y - 60,
      'bat'
    );
    this.bat.setScale(1.5);
    this.bat.setAngle(-45);

    // Create ball (hidden initially)
    this.ball = this.add.sprite(
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.x,
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.y - 50,
      'baseball'
    );
    this.ball.setScale(0.8);
    this.ball.setVisible(false);

    // Target indicator for pitch location
    this.targetIndicator = this.add.circle(
      GAME_CONSTANTS.FIELD.HOME_PLATE.x,
      GAME_CONSTANTS.FIELD.HOME_PLATE.y - 80,
      10,
      0xff0000,
      0.5
    );
    this.targetIndicator.setVisible(false);
  }

  // ============================================
  // Input Handling
  // ============================================

  private setupInput(): void {
    // Create swing zone (lower portion of screen for mobile)
    this.swingZone = this.add
      .zone(
        this.cameras.main.width / 2,
        this.cameras.main.height - 150,
        this.cameras.main.width,
        300
      )
      .setInteractive();

    // Swing on tap/click
    this.swingZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.canSwing && this.pitchInProgress) {
        this.performSwing(pointer);
      }
    });

    // Keyboard input for desktop
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.canSwing && this.pitchInProgress) {
        this.performSwing();
      }
    });

    // Escape to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });
  }

  // ============================================
  // Gameplay Logic
  // ============================================

  private startAtBat(): void {
    this.gameState.phase = 'pitching';
    this.canSwing = true;

    // Start pitch sequence after delay
    this.time.delayedCall(1500, () => {
      this.throwPitch();
    });
  }

  private throwPitch(): void {
    if (this.pitchInProgress) return;

    // Determine pitch type (random for now, will be AI-driven)
    const pitchTypes: PitchType[] = ['fastball', 'curveball', 'changeup', 'slider'];
    const pitchType = Phaser.Math.RND.pick(pitchTypes);

    // Calculate pitch parameters
    this.currentPitch = this.calculatePitch(pitchType);

    // Show ball
    this.ball.setPosition(
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.x,
      GAME_CONSTANTS.FIELD.PITCHERS_MOUND.y - 50
    );
    this.ball.setVisible(true);

    // Play pitch animation
    if (this.pitcher.anims) {
      this.pitcher.play('pitch');
    }

    // Play pitch sound
    if (this.registry.get('soundEnabled') && this.sound.get('sfx-pitch')) {
      this.sound.play('sfx-pitch', { volume: 0.5 });
    }

    // Start pitch
    this.pitchInProgress = true;
    this.pitchStartTime = this.time.now;

    // Show target for pitch location (optional, can be difficulty-based)
    this.targetIndicator.setPosition(this.currentPitch.location.x, this.currentPitch.location.y);
    // this.targetIndicator.setVisible(true); // Uncomment to show pitch target
  }

  private calculatePitch(type: PitchType): Pitch {
    const speed =
      GAME_CONSTANTS.PITCH_SPEEDS[type.toUpperCase() as keyof typeof GAME_CONSTANTS.PITCH_SPEEDS];

    // Random movement based on pitch type
    let movement = { x: 0, y: 0 };
    switch (type) {
      case 'curveball':
        movement = { x: Phaser.Math.Between(-100, 100), y: Phaser.Math.Between(50, 100) };
        break;
      case 'slider':
        movement = { x: Phaser.Math.Between(-150, 150), y: Phaser.Math.Between(20, 50) };
        break;
      case 'changeup':
        movement = { x: Phaser.Math.Between(-30, 30), y: Phaser.Math.Between(10, 30) };
        break;
      default:
        movement = { x: Phaser.Math.Between(-20, 20), y: 0 };
    }

    // Random target location
    const isStrike = Phaser.Math.RND.frac() > 0.4; // 60% strikes
    let location: { x: number; y: number };

    if (isStrike) {
      location = {
        x: GAME_CONSTANTS.FIELD.HOME_PLATE.x + Phaser.Math.Between(-50, 50),
        y: GAME_CONSTANTS.FIELD.HOME_PLATE.y - 80 + Phaser.Math.Between(-60, 60),
      };
    } else {
      // Ball - outside strike zone
      const side = Phaser.Math.RND.pick(['left', 'right', 'high', 'low']);
      switch (side) {
        case 'left':
          location = {
            x: GAME_CONSTANTS.FIELD.HOME_PLATE.x - 100,
            y: GAME_CONSTANTS.FIELD.HOME_PLATE.y - 80,
          };
          break;
        case 'right':
          location = {
            x: GAME_CONSTANTS.FIELD.HOME_PLATE.x + 100,
            y: GAME_CONSTANTS.FIELD.HOME_PLATE.y - 80,
          };
          break;
        case 'high':
          location = {
            x: GAME_CONSTANTS.FIELD.HOME_PLATE.x,
            y: GAME_CONSTANTS.FIELD.HOME_PLATE.y - 180,
          };
          break;
        default:
          location = {
            x: GAME_CONSTANTS.FIELD.HOME_PLATE.x,
            y: GAME_CONSTANTS.FIELD.HOME_PLATE.y + 20,
          };
      }
    }

    return { type, speed, movement, location, isStrike };
  }

  private updatePitchPhysics(_delta: number): void {
    if (!this.currentPitch || !this.ball) return;

    const elapsed = this.time.now - this.pitchStartTime;
    const totalTime = 600; // Time for pitch to reach plate (ms)
    const progress = Math.min(elapsed / totalTime, 1);

    // Interpolate position with movement curve
    const startX = GAME_CONSTANTS.FIELD.PITCHERS_MOUND.x;
    const startY = GAME_CONSTANTS.FIELD.PITCHERS_MOUND.y - 50;
    const endX = this.currentPitch.location.x;
    const endY = GAME_CONSTANTS.FIELD.HOME_PLATE.y - 50;

    // Apply movement curve (simulated break)
    const curve = Math.sin(progress * Math.PI);
    const x =
      Phaser.Math.Linear(startX, endX, progress) + this.currentPitch.movement.x * curve * 0.5;
    const y = Phaser.Math.Linear(startY, endY, progress);

    // Scale ball to simulate depth
    const scale = 0.5 + progress * 0.5;

    this.ball.setPosition(x, y);
    this.ball.setScale(scale);
  }

  private performSwing(_pointer?: Phaser.Input.Pointer): void {
    this.canSwing = false;

    // Calculate swing timing
    const swingTime = this.time.now - this.pitchStartTime;
    const optimalTime = 500; // Optimal time to swing (ms)
    const timingDiff = swingTime - optimalTime;

    // Determine timing quality
    let timingQuality: 'perfect' | 'good' | 'okay' | 'early' | 'late';
    if (Math.abs(timingDiff) <= GAME_CONSTANTS.TIMING.PERFECT) {
      timingQuality = 'perfect';
    } else if (Math.abs(timingDiff) <= GAME_CONSTANTS.TIMING.GOOD) {
      timingQuality = 'good';
    } else if (Math.abs(timingDiff) <= GAME_CONSTANTS.TIMING.OKAY) {
      timingQuality = 'okay';
    } else if (timingDiff < 0) {
      timingQuality = 'early';
    } else {
      timingQuality = 'late';
    }

    // Play swing animation
    if (this.batter.anims) {
      this.batter.play('swing');
    }

    // Animate bat swing
    this.tweens.add({
      targets: this.bat,
      angle: 45,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.bat.setAngle(-45);
      },
    });

    // Play swing sound
    if (this.registry.get('soundEnabled') && this.sound.get('sfx-swing')) {
      this.sound.play('sfx-swing', { volume: 0.6 });
    }

    // Calculate hit result
    const swing: BatSwing = {
      timing: timingDiff / 200, // Normalize to -1 to 1
      contact: this.calculateContact(timingQuality),
      angle: this.calculateLaunchAngle(timingQuality),
      exitVelocity: this.calculateExitVelocity(timingQuality),
    };

    this.processSwing(swing, timingQuality);
  }

  private calculateContact(timing: string): number {
    switch (timing) {
      case 'perfect':
        return 1.0;
      case 'good':
        return 0.85;
      case 'okay':
        return 0.65;
      default:
        return 0.3;
    }
  }

  private calculateLaunchAngle(timing: string): number {
    switch (timing) {
      case 'perfect':
        return Phaser.Math.Between(25, 35);
      case 'good':
        return Phaser.Math.Between(15, 30);
      case 'okay':
        return Phaser.Math.Between(5, 25);
      default:
        return Phaser.Math.Between(-10, 50);
    }
  }

  private calculateExitVelocity(timing: string): number {
    const basePower = 7; // Player power stat (placeholder)
    switch (timing) {
      case 'perfect':
        return 95 + basePower * 3;
      case 'good':
        return 85 + basePower * 2;
      case 'okay':
        return 70 + basePower;
      default:
        return 50 + basePower * 0.5;
    }
  }

  private processSwing(swing: BatSwing, _timing: string): void {
    // Determine if contact was made
    const hitChance = swing.contact;
    const madeContact = Phaser.Math.RND.frac() < hitChance;

    if (!madeContact) {
      // Swing and miss
      this.handleStrike('swing');
      return;
    }

    // Determine foul vs fair
    const foulChance = Math.abs(swing.timing) * 0.5;
    const isFoul = Phaser.Math.RND.frac() < foulChance;

    if (isFoul && this.gameState.count.strikes < 2) {
      this.handleFoul();
      return;
    } else if (isFoul) {
      // Foul with 2 strikes - stays at 2 strikes
      this.showHitFeedback('FOUL!', '#FFA500');
      this.nextPitch();
      return;
    }

    // Play hit sound
    if (this.registry.get('soundEnabled') && this.sound.get('sfx-hit')) {
      this.sound.play('sfx-hit', { volume: 0.8 });
    }

    // Calculate hit result
    const result = this.calculateHitResult(swing);
    this.handleHit(result, swing);
  }

  private calculateHitResult(swing: BatSwing): HitResult {
    const distance = swing.exitVelocity * 3 + (swing.angle - 15) * 5;

    if (distance > 400) return 'home_run';
    if (distance > 300) return 'triple';
    if (distance > 200) return 'double';
    if (distance > 100 && swing.contact > 0.5) return 'single';

    // Ground out or fly out
    return 'out';
  }

  private handleHit(result: HitResult, swing: BatSwing): void {
    this.pitchInProgress = false;

    // Animate ball trajectory
    const distance = swing.exitVelocity * 3;
    const angle = (90 - swing.angle) * (Math.PI / 180);
    const targetX = GAME_CONSTANTS.FIELD.HOME_PLATE.x + Math.cos(angle) * distance;
    const targetY = GAME_CONSTANTS.FIELD.HOME_PLATE.y - Math.sin(angle) * distance;

    this.tweens.add({
      targets: this.ball,
      x: targetX,
      y: Math.max(200, targetY),
      scale: result === 'home_run' ? 0.2 : 0.6,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.ball.setVisible(false);
      },
    });

    // Show result feedback
    let feedbackText = '';
    let feedbackColor = '#ffffff';

    switch (result) {
      case 'home_run':
        feedbackText = 'HOME RUN!';
        feedbackColor = '#FFD700';
        this.gameState.score.away += 1;
        if (this.registry.get('soundEnabled') && this.sound.get('sfx-homerun')) {
          this.sound.play('sfx-homerun');
        }
        break;
      case 'triple':
        feedbackText = 'TRIPLE!';
        feedbackColor = '#00FF00';
        this.gameState.score.awayHits += 1;
        break;
      case 'double':
        feedbackText = 'DOUBLE!';
        feedbackColor = '#00BFFF';
        this.gameState.score.awayHits += 1;
        break;
      case 'single':
        feedbackText = 'SINGLE!';
        feedbackColor = '#FFFFFF';
        this.gameState.score.awayHits += 1;
        break;
      case 'out':
        feedbackText = 'OUT!';
        feedbackColor = '#FF4444';
        this.handleOut();
        return;
    }

    this.showHitFeedback(feedbackText, feedbackColor);
    this.updateHUD();
    this.nextPitch();
  }

  private onPitchArrival(): void {
    // Ball arrived at plate without swing
    if (!this.canSwing) return; // Already swung

    this.pitchInProgress = false;
    this.canSwing = false;

    if (this.currentPitch?.isStrike) {
      this.handleStrike('looking');
    } else {
      this.handleBall();
    }
  }

  private handleStrike(type: 'swing' | 'looking'): void {
    this.gameState.count.strikes += 1;
    this.showHitFeedback(type === 'swing' ? 'STRIKE!' : 'STRIKE (looking)', '#FF4444');

    if (this.gameState.count.strikes >= 3) {
      this.handleStrikeout();
    } else {
      this.updateHUD();
      this.nextPitch();
    }
  }

  private handleBall(): void {
    this.gameState.count.balls += 1;
    this.showHitFeedback('BALL', '#4CAF50');

    if (this.gameState.count.balls >= 4) {
      this.handleWalk();
    } else {
      this.updateHUD();
      this.nextPitch();
    }
  }

  private handleFoul(): void {
    if (this.gameState.count.strikes < 2) {
      this.gameState.count.strikes += 1;
    }
    this.showHitFeedback('FOUL!', '#FFA500');
    this.updateHUD();
    this.nextPitch();
  }

  private handleOut(): void {
    this.gameState.count.outs += 1;
    this.showHitFeedback('OUT!', '#FF4444');

    if (this.gameState.count.outs >= 3) {
      this.handleInningChange();
    } else {
      this.resetCount();
      this.updateHUD();
      this.nextPitch();
    }
  }

  private handleStrikeout(): void {
    this.gameState.count.outs += 1;
    this.showHitFeedback('STRIKEOUT!', '#FF0000');

    if (this.registry.get('soundEnabled') && this.sound.get('sfx-strikeout')) {
      this.sound.play('sfx-strikeout');
    }

    if (this.gameState.count.outs >= 3) {
      this.handleInningChange();
    } else {
      this.resetCount();
      this.updateHUD();
      this.nextPitch();
    }
  }

  private handleWalk(): void {
    this.showHitFeedback('WALK!', '#4CAF50');
    this.resetCount();
    this.updateHUD();
    this.nextPitch();
  }

  private handleInningChange(): void {
    this.gameState.count.outs = 0;
    this.resetCount();

    if (this.gameState.inning.half === 'top') {
      this.gameState.inning.half = 'bottom';
      this.gameState.isUserBatting = false;
    } else {
      this.gameState.inning.half = 'top';
      this.gameState.inning.number += 1;
      this.gameState.isUserBatting = true;

      // Check for game over
      if (this.gameState.inning.number > GAME_CONSTANTS.RULES.INNINGS) {
        this.handleGameOver();
        return;
      }
    }

    this.showHitFeedback(
      `${this.gameState.inning.half === 'top' ? '▲' : '▼'} ${this.gameState.inning.number}`,
      '#FFD700'
    );
    this.updateHUD();

    this.time.delayedCall(2000, () => {
      this.nextPitch();
    });
  }

  private handleGameOver(): void {
    this.gameState.phase = 'game_over';
    this.sound.stopByKey('bgm-game');

    const userWon = this.gameState.score.away > this.gameState.score.home;
    const result = userWon
      ? 'win'
      : this.gameState.score.away === this.gameState.score.home
        ? 'tie'
        : 'loss';

    this.scene.start('ResultsScene', {
      result,
      userScore: this.gameState.score.away,
      opponentScore: this.gameState.score.home,
      stats: {
        hits: this.gameState.score.awayHits,
        homeRuns: 0, // Track separately
        strikeouts: 0,
        innings: this.gameState.inning.number - 1,
      },
    });
  }

  private resetCount(): void {
    this.gameState.count.balls = 0;
    this.gameState.count.strikes = 0;
  }

  private nextPitch(): void {
    this.ball.setVisible(false);
    this.targetIndicator.setVisible(false);
    this.currentPitch = null;

    this.time.delayedCall(1500, () => {
      this.canSwing = true;
      this.throwPitch();
    });
  }

  private showHitFeedback(text: string, color: string): void {
    const feedback = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2, text, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '64px',
        color: color,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: feedback.y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => feedback.destroy(),
    });
  }

  private updateHUD(): void {
    const { count, score, inning } = this.gameState;

    this.scoreText.setText(`AWAY ${score.away} - ${score.home} HOME`);
    this.inningText.setText(
      `${inning.half === 'top' ? '▲' : '▼'} ${this.getInningText(inning.number)}`
    );
    this.countText.setText(`B: ${count.balls}  S: ${count.strikes}\nOuts: ${count.outs}`);
  }

  private getInningText(num: number): string {
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
    return `${num}${suffix}`;
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    // TODO: Show pause menu
  }
}
