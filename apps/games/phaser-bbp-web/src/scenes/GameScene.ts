/**
 * Game Scene - Original Baseball Game
 * Main gameplay with batting mechanics
 */

import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { GameState } from '@/systems/GameState';
import { PhysicsSystem, HitResult } from '@/systems/PhysicsSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { Scoreboard } from '@/ui/Scoreboard';
import { Tutorial } from '@/ui/Tutorial';

type PitchType = 'fastball' | 'changeup' | 'curveball';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private inputSystem!: InputSystem;
  private audioSystem!: AudioSystem;
  private scoreboard!: Scoreboard;

  // Game objects
  private ball!: Phaser.GameObjects.Arc;
  private pitcher!: Phaser.GameObjects.Rectangle;
  private batter!: Phaser.GameObjects.Rectangle;
  private bat!: Phaser.GameObjects.Rectangle;
  private strikeZone!: Phaser.GameObjects.Rectangle;
  private homeBase!: Phaser.GameObjects.Rectangle;

  // Pitch state
  private isPitching: boolean = false;
  private pitchStartTime: number = 0;
  private currentPitch?: PitchType;
  private canSwing: boolean = false;

  // Result display
  private resultText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameState = new GameState();
    this.inputSystem = new InputSystem(this);
    this.audioSystem = new AudioSystem(this);
    this.audioSystem.init();

    this.createField();
    this.createUI();

    // Show tutorial first
    const tutorial = new Tutorial(this);
    tutorial.onCompleteTutorial(() => {
      this.startNewAtBat();
    });
    tutorial.show();

    // Setup swing input
    this.inputSystem.onSwing(() => this.swing());
  }

  /**
   * Create baseball field and players
   */
  private createField(): void {
    const { width, height } = this.cameras.main;

    // Field background (grass)
    const field = this.add.rectangle(width / 2, height / 2, width, height, 0x2d7a2d);

    // Infield (dirt)
    const infield = this.add.ellipse(width / 2, height - 100, 400, 200, 0xc19a6b);

    // Home base
    this.homeBase = this.add.rectangle(width / 2, height - 100, 30, 30, 0xffffff);
    this.homeBase.setStrokeStyle(2, 0x000000);

    // Strike zone (invisible, for reference)
    this.strikeZone = this.add.rectangle(width / 2, height - 200, 80, 120, 0xff0000, 0.1);
    this.strikeZone.setStrokeStyle(2, 0xff0000, 0.3);

    // Pitcher (simple rectangle representing pitcher)
    this.pitcher = this.add.rectangle(width / 2, 150, 40, 60, 0x0066cc);
    this.pitcher.setStrokeStyle(2, 0x003366);

    // Pitcher's mound
    const mound = this.add.ellipse(width / 2, 150, 80, 40, 0xc19a6b);

    // Batter (simple rectangle)
    this.batter = this.add.rectangle(width / 2 + 50, height - 150, 30, 50, 0xcc0000);
    this.batter.setStrokeStyle(2, 0x660000);

    // Bat (initially hidden)
    this.bat = this.add.rectangle(width / 2 + 80, height - 150, 10, 60, 0x8b4513);
    this.bat.setVisible(false);

    // Ball (initially hidden)
    this.ball = this.add.circle(width / 2, 150, 8, 0xffffff);
    this.ball.setStrokeStyle(2, 0xcccccc);
    this.ball.setVisible(false);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    const { width } = this.cameras.main;

    // Scoreboard
    this.scoreboard = new Scoreboard(this, width / 2, 60);
    this.scoreboard.update(this.gameState);

    // Instruction text
    const instruction = this.add.text(width / 2, 450, 'Get ready...', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    instruction.setOrigin(0.5);

    // Store for updates
    this.resultText = instruction;
  }

  /**
   * Start a new at-bat
   */
  private startNewAtBat(): void {
    this.canSwing = false;
    this.isPitching = false;

    if (this.resultText) {
      this.resultText.setText('Get ready...');
    }

    // Wait a moment, then pitch
    this.time.delayedCall(1500, () => {
      this.throwPitch();
    });
  }

  /**
   * Throw a pitch
   */
  private throwPitch(): void {
    // Random pitch type
    const pitchTypes: PitchType[] = ['fastball', 'changeup', 'curveball'];
    this.currentPitch = Phaser.Math.RND.pick(pitchTypes);
    const pitchData = GameConfig.pitches[this.currentPitch];

    // Show ball
    this.ball.setVisible(true);
    this.ball.setPosition(this.cameras.main.width / 2, 150);
    this.ball.setFillStyle(pitchData.color);

    // Animate pitch
    this.isPitching = true;
    this.pitchStartTime = this.time.now;
    this.canSwing = true;

    if (this.resultText) {
      this.resultText.setText(`${pitchData.name}!`);
    }

    // Animate ball to home plate
    this.tweens.add({
      targets: this.ball,
      y: this.cameras.main.height - 200,
      duration: 1000 - pitchData.speed,
      ease: 'Linear',
      onComplete: () => {
        this.onPitchComplete();
      }
    });

    // Enable swinging
    this.inputSystem.setEnabled(true);
  }

  /**
   * Player swings the bat
   */
  private swing(): void {
    if (!this.canSwing || !this.isPitching) return;

    this.canSwing = false;
    this.inputSystem.setEnabled(false);

    // Show bat swing animation
    this.bat.setVisible(true);
    this.tweens.add({
      targets: this.bat,
      angle: -90,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.bat.setVisible(false);
        this.bat.setAngle(0);
      }
    });

    this.audioSystem.play('swing');

    // Calculate timing
    const swingTime = this.time.now;
    const pitchDuration = 1000 - GameConfig.pitches[this.currentPitch!].speed;
    const perfectTime = this.pitchStartTime + pitchDuration;
    const timingOffset = swingTime - perfectTime;

    // Calculate hit result
    const result = PhysicsSystem.calculateHit(
      timingOffset,
      GameConfig.pitches[this.currentPitch!].speed
    );

    this.processHit(result);
  }

  /**
   * Process hit result
   */
  private processHit(result: HitResult): void {
    // Stop pitch animation
    this.tweens.killTweensOf(this.ball);

    if (result.type === 'foul') {
      this.showResult('Foul Ball!', '#ffaa00');
      this.audioSystem.play('strike');

      // Foul counts as a strike (unless already at 2 strikes)
      if (this.gameState.strikes < 2) {
        this.gameState.addStrike();
      }

      this.time.delayedCall(1500, () => {
        this.ball.setVisible(false);
        this.startNewAtBat();
      });
    } else if (result.type === 'out') {
      this.showResult('Strike Out!', '#ff0000');
      this.audioSystem.play('out');
      this.gameState.addOut();

      this.time.delayedCall(2000, () => {
        this.ball.setVisible(false);
        this.checkGameOver();
      });
    } else {
      // Hit!
      this.showResult(this.getHitText(result.type), '#00ff00');
      this.audioSystem.play('hit');
      this.gameState.recordHit(result.type);

      // Animate ball flying
      this.animateBallFlight(result);
    }

    this.scoreboard.update(this.gameState);
  }

  /**
   * Called when pitch reaches plate without a swing
   */
  private onPitchComplete(): void {
    if (!this.canSwing) return; // Already swung

    this.canSwing = false;
    this.inputSystem.setEnabled(false);

    // Check if in strike zone (simplified - 70% chance)
    const isStrike = Math.random() < 0.7;

    if (isStrike) {
      this.showResult('Strike!', '#ff6666');
      this.audioSystem.play('strike');
      this.gameState.addStrike();
    } else {
      this.showResult('Ball', '#6666ff');
      this.gameState.addBall();
    }

    this.scoreboard.update(this.gameState);

    this.time.delayedCall(1500, () => {
      this.ball.setVisible(false);
      this.checkGameOver();
    });
  }

  /**
   * Animate ball flight after hit
   */
  private animateBallFlight(result: HitResult): void {
    const startX = this.ball.x;
    const startY = this.ball.y;

    // Calculate trajectory
    const trajectory = PhysicsSystem.calculateTrajectory(
      startX,
      startY,
      result.distance,
      result.angle,
      20
    );

    // Animate along trajectory
    const timeline = this.tweens.createTimeline();

    trajectory.forEach((point, index) => {
      const duration = index === 0 ? 0 : 100;
      timeline.add({
        targets: this.ball,
        x: point.x,
        y: point.y,
        duration,
        ease: 'Linear'
      });
    });

    timeline.on('complete', () => {
      this.time.delayedCall(1000, () => {
        this.ball.setVisible(false);
        this.ball.setPosition(this.cameras.main.width / 2, 150);
        this.checkGameOver();
      });
    });

    timeline.play();
  }

  /**
   * Check if game is over or continue
   */
  private checkGameOver(): void {
    if (this.gameState.isGameOver) {
      this.showGameOver();
    } else {
      this.startNewAtBat();
    }
  }

  /**
   * Show game over screen
   */
  private showGameOver(): void {
    const { width, height } = this.cameras.main;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // Game over text
    let message = 'Game Over!';
    let color = '#ffffff';

    if (this.gameState.winner === 'player') {
      message = 'You Win!';
      color = '#00ff00';
      this.audioSystem.play('cheer');
    } else if (this.gameState.winner === 'cpu') {
      message = 'CPU Wins!';
      color = '#ff0000';
    } else {
      message = "It's a Tie!";
      color = '#ffaa00';
    }

    const gameOverText = this.add.text(width / 2, height / 2 - 100, message, {
      fontSize: '64px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);

    // Final score
    const scoreText = this.add.text(
      width / 2,
      height / 2,
      `Final Score\nPlayer: ${this.gameState.player.score}\nCPU: ${this.gameState.cpu.score}`,
      {
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10
      }
    );
    scoreText.setOrigin(0.5);

    // Play again button
    const playAgainBg = this.add.rectangle(width / 2, height / 2 + 120, 250, 60, 0x0088ff);
    playAgainBg.setStrokeStyle(2, 0xffffff);
    playAgainBg.setInteractive({ useHandCursor: true });

    const playAgainText = this.add.text(width / 2, height / 2 + 120, 'PLAY AGAIN', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    playAgainText.setOrigin(0.5);

    playAgainBg.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  /**
   * Show result message
   */
  private showResult(text: string, color: string): void {
    if (this.resultText) {
      this.resultText.setText(text);
      this.resultText.setColor(color);
      this.resultText.setFontSize('32px');
      this.resultText.setStroke('#000000', 4);

      // Fade back to normal
      this.time.delayedCall(1000, () => {
        if (this.resultText) {
          this.resultText.setFontSize('24px');
          this.resultText.setStroke('', 0);
        }
      });
    }
  }

  /**
   * Get hit result text
   */
  private getHitText(type: string): string {
    switch (type) {
      case 'homerun':
        return 'HOME RUN!';
      case 'triple':
        return 'Triple!';
      case 'double':
        return 'Double!';
      case 'single':
        return 'Single!';
      default:
        return 'Hit!';
    }
  }

  update(): void {
    // Game loop updates if needed
  }
}
