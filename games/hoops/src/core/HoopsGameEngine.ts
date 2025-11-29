/**
 * Blaze Hoops Shootout - Game Engine
 *
 * Manages the 3D scene, game logic, and physics for the 3-point shootout
 */

import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  ShadowGenerator,
  DirectionalLight,
  Mesh,
  Animation,
  ActionManager,
  ExecuteCodeAction,
} from '@babylonjs/core';
import { HoopsShooter } from '@data/shooters';

/** Game configuration */
const CONFIG = {
  gameDuration: 60000,        // 60 seconds
  ballsPerRack: 5,            // 5 balls per rack
  totalRacks: 5,              // 5 racks total
  moneyBallMultiplier: 2,     // Last ball worth double
  basePoints: 100,            // Points per made shot
  swishBonus: 50,             // Extra points for swish
  streakMultiplierBase: 0.1,  // Multiplier increase per streak
  maxStreakMultiplier: 2.0,   // Cap on streak multiplier
  shotMeterSpeed: 2.0,        // Base meter speed
  perfectZoneSize: 0.15,      // Size of green zone (15%)
  goodZoneSize: 0.25,         // Size of yellow zone (25%)
};

/** Rack positions around the 3-point arc */
const RACK_POSITIONS = [
  { x: -6, z: 0, angle: 0 },        // Left corner
  { x: -4, z: 3, angle: 30 },       // Left wing
  { x: 0, z: 4.5, angle: 90 },      // Top of arc
  { x: 4, z: 3, angle: 150 },       // Right wing
  { x: 6, z: 0, angle: 180 },       // Right corner
];

export interface HoopsGameState {
  score: number;
  timeRemaining: number;
  shotsMade: number;
  shotsAttempted: number;
  currentRack: number;
  currentBall: number;
  streak: number;
  longestStreak: number;
  swishes: number;
  multiplier: number;
  isMoneyBall: boolean;
}

export interface HoopsGameResult {
  finalScore: number;
  shotsMade: number;
  shotsAttempted: number;
  shootingPercentage: number;
  longestStreak: number;
  swishes: number;
  moneyBallsMade: number;
  durationSeconds: number;
  shooterId: string;
}

export interface HoopsGameConfig {
  canvas: HTMLCanvasElement;
  shooter: HoopsShooter;
  onGameStateChange: (state: HoopsGameState) => void;
  onGameOver: (result: HoopsGameResult) => void;
}

export enum ShotResult {
  SWISH = 'swish',
  GOOD = 'good',
  OKAY = 'okay',
  MISS = 'miss',
  AIRBALL = 'airball',
}

export class HoopsGameEngine {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private config: HoopsGameConfig;

  private gameState: HoopsGameState;
  private gameStartTime: number = 0;
  private isPlaying: boolean = false;
  private isShooting: boolean = false;

  // Shot meter
  private shotMeterValue: number = 0;
  private shotMeterDirection: number = 1;
  private shotMeterActive: boolean = false;

  // Meshes
  private ball: Mesh | null = null;
  private hoop: Mesh | null = null;
  private shooter: Mesh | null = null;

  // Stats tracking
  private moneyBallsMade: number = 0;

  private constructor(config: HoopsGameConfig) {
    this.config = config;
    this.engine = new Engine(config.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

    this.camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      15,
      new Vector3(0, 2, 0),
      this.scene
    );
    this.camera.attachControl(config.canvas, false);
    this.camera.lowerRadiusLimit = 10;
    this.camera.upperRadiusLimit = 25;

    this.gameState = this.createInitialState();
  }

  static async create(config: HoopsGameConfig): Promise<HoopsGameEngine> {
    const game = new HoopsGameEngine(config);
    await game.initialize();
    return game;
  }

  private async initialize(): Promise<void> {
    this.createLights();
    this.createCourt();
    this.createHoop();
    this.createBall();
    this.createShooter();
    this.setupInput();
    this.loadSounds();

    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    window.addEventListener('resize', () => this.engine.resize());
  }

  private createInitialState(): HoopsGameState {
    return {
      score: 0,
      timeRemaining: CONFIG.gameDuration,
      shotsMade: 0,
      shotsAttempted: 0,
      currentRack: 1,
      currentBall: 1,
      streak: 0,
      longestStreak: 0,
      swishes: 0,
      multiplier: 1.0,
      isMoneyBall: false,
    };
  }

  private createLights(): void {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.6;

    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), this.scene);
    sun.position = new Vector3(10, 20, 10);
    sun.intensity = 0.8;

    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
  }

  private createCourt(): void {
    // Court floor
    const court = MeshBuilder.CreateGround('court', { width: 20, height: 15 }, this.scene);
    const courtMat = new StandardMaterial('courtMat', this.scene);
    courtMat.diffuseColor = new Color3(0.8, 0.6, 0.4); // Hardwood color
    courtMat.specularColor = new Color3(0.2, 0.2, 0.2);
    court.material = courtMat;
    court.receiveShadows = true;

    // 3-point line (simplified arc)
    const linePoints: Vector3[] = [];
    for (let i = -90; i <= 90; i += 10) {
      const rad = (i * Math.PI) / 180;
      linePoints.push(new Vector3(Math.cos(rad) * 6, 0.01, Math.sin(rad) * 4.5 + 2));
    }
    const threeLine = MeshBuilder.CreateLines('threeLine', { points: linePoints }, this.scene);
    threeLine.color = new Color3(1, 1, 1);
  }

  private createHoop(): void {
    // Backboard
    const backboard = MeshBuilder.CreateBox('backboard', { width: 1.8, height: 1.2, depth: 0.1 }, this.scene);
    backboard.position = new Vector3(0, 3.5, 6);
    const bbMat = new StandardMaterial('bbMat', this.scene);
    bbMat.diffuseColor = new Color3(1, 1, 1);
    bbMat.alpha = 0.8;
    backboard.material = bbMat;

    // Rim
    const rim = MeshBuilder.CreateTorus('rim', { diameter: 0.46, thickness: 0.02, tessellation: 32 }, this.scene);
    rim.position = new Vector3(0, 3.05, 5.6);
    rim.rotation.x = Math.PI / 2;
    const rimMat = new StandardMaterial('rimMat', this.scene);
    rimMat.diffuseColor = new Color3(1, 0.3, 0);
    rim.material = rimMat;
    this.hoop = rim;

    // Pole
    const pole = MeshBuilder.CreateCylinder('pole', { diameter: 0.15, height: 3.5 }, this.scene);
    pole.position = new Vector3(0, 1.75, 6.5);
    const poleMat = new StandardMaterial('poleMat', this.scene);
    poleMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
    pole.material = poleMat;
  }

  private createBall(): void {
    this.ball = MeshBuilder.CreateSphere('ball', { diameter: 0.24, segments: 16 }, this.scene);
    const ballMat = new StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = new Color3(1, 0.5, 0.2);
    ballMat.specularColor = new Color3(0.3, 0.3, 0.3);
    this.ball.material = ballMat;
    this.resetBallPosition();
  }

  private createShooter(): void {
    // Simple shooter representation
    const body = MeshBuilder.CreateCylinder('shooterBody', { diameter: 0.6, height: 1.8 }, this.scene);
    const head = MeshBuilder.CreateSphere('shooterHead', { diameter: 0.3 }, this.scene);
    head.parent = body;
    head.position.y = 1.05;

    const mat = new StandardMaterial('shooterMat', this.scene);
    mat.diffuseColor = Color3.FromHexString(this.config.shooter.jerseyColor);
    body.material = mat;
    head.material = mat;

    this.shooter = body;
    this.moveShooterToRack(0);
  }

  private moveShooterToRack(rackIndex: number): void {
    if (!this.shooter || !this.ball) return;

    const rack = RACK_POSITIONS[rackIndex];
    this.shooter.position = new Vector3(rack.x, 0.9, rack.z - 1);
    this.shooter.rotation.y = (rack.angle * Math.PI) / 180;
    this.resetBallPosition();
  }

  private resetBallPosition(): void {
    if (!this.ball || !this.shooter) return;
    this.ball.position = new Vector3(
      this.shooter.position.x,
      this.shooter.position.y + 0.8,
      this.shooter.position.z + 0.3
    );
  }

  private setupInput(): void {
    // Touch/click to start meter
    this.scene.onPointerDown = () => {
      if (this.isPlaying && !this.isShooting && !this.shotMeterActive) {
        this.startShotMeter();
      }
    };

    // Release to shoot
    this.scene.onPointerUp = () => {
      if (this.shotMeterActive) {
        this.executeShot();
      }
    };

    // Keyboard
    this.scene.actionManager = new ActionManager(this.scene);
    this.scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === ' ' && this.isPlaying && !this.isShooting && !this.shotMeterActive) {
          this.startShotMeter();
        }
      })
    );
    this.scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        if (evt.sourceEvent.key === ' ' && this.shotMeterActive) {
          this.executeShot();
        }
      })
    );
  }

  private loadSounds(): void {
    // Audio setup placeholder for future sound effects
    try {
      Engine.audioEngine?.audioContext;
    } catch {
      console.log('Audio not available');
    }
  }

  async unlockAudio(): Promise<void> {
    try {
      await Engine.audioEngine?.unlock();
    } catch {
      console.log('Failed to unlock audio');
    }
  }

  private startShotMeter(): void {
    this.shotMeterActive = true;
    this.shotMeterValue = 0;
    this.shotMeterDirection = 1;

    // Update UI
    const meterEl = document.getElementById('shotMeter');
    if (meterEl) meterEl.style.display = 'block';
  }

  private executeShot(): void {
    this.shotMeterActive = false;
    this.isShooting = true;

    const meterEl = document.getElementById('shotMeter');
    if (meterEl) meterEl.style.display = 'none';

    // Determine shot result based on meter position
    const result = this.calculateShotResult();
    this.animateShot(result);
  }

  private calculateShotResult(): ShotResult {
    // Perfect zone is 40-55% (center)
    // Good zone is 30-40% and 55-65%
    // Okay zone is 20-30% and 65-75%
    // Miss zone is 10-20% and 75-85%
    // Airball is < 10% or > 85%

    const meter = this.shotMeterValue;
    const shooter = this.config.shooter;
    const accuracyBonus = (shooter.accuracy - 5) * 0.02; // ±4% based on accuracy

    const perfectMin = 0.40 - accuracyBonus;
    const perfectMax = 0.55 + accuracyBonus;
    const goodMin = 0.30 - accuracyBonus;
    const goodMax = 0.65 + accuracyBonus;
    const okayMin = 0.20;
    const okayMax = 0.75;

    if (meter >= perfectMin && meter <= perfectMax) {
      return ShotResult.SWISH;
    } else if ((meter >= goodMin && meter < perfectMin) || (meter > perfectMax && meter <= goodMax)) {
      return Math.random() < 0.85 ? ShotResult.GOOD : ShotResult.MISS;
    } else if ((meter >= okayMin && meter < goodMin) || (meter > goodMax && meter <= okayMax)) {
      return Math.random() < 0.5 ? ShotResult.OKAY : ShotResult.MISS;
    } else if (meter < 0.1 || meter > 0.85) {
      return ShotResult.AIRBALL;
    } else {
      return ShotResult.MISS;
    }
  }

  private animateShot(result: ShotResult): void {
    if (!this.ball || !this.hoop) return;

    const startPos = this.ball.position.clone();
    const endPos = result === ShotResult.AIRBALL
      ? new Vector3(startPos.x + (Math.random() - 0.5) * 2, 1, 8)
      : result === ShotResult.MISS
        ? new Vector3(this.hoop.position.x + (Math.random() - 0.5) * 0.5, 1, 7)
        : this.hoop.position.clone();

    const peakHeight = 5 + Math.random();

    // Create arc animation
    const frameRate = 60;
    const totalFrames = 40;

    const posAnim = new Animation('shotArc', 'position', frameRate, Animation.ANIMATIONTYPE_VECTOR3);

    const keys = [];
    for (let i = 0; i <= totalFrames; i++) {
      const t = i / totalFrames;
      const x = startPos.x + (endPos.x - startPos.x) * t;
      const z = startPos.z + (endPos.z - startPos.z) * t;
      // Parabolic arc
      const y = startPos.y + (peakHeight - startPos.y) * Math.sin(t * Math.PI);
      keys.push({ frame: i, value: new Vector3(x, y, z) });
    }

    posAnim.setKeys(keys);
    this.ball.animations = [posAnim];

    this.scene.beginAnimation(this.ball, 0, totalFrames, false, 1.5, () => {
      this.processResult(result);
    });
  }

  private processResult(result: ShotResult): void {
    this.gameState.shotsAttempted++;
    const isMoneyBall = this.gameState.currentBall === CONFIG.ballsPerRack;

    let points = 0;
    let made = false;

    if (result === ShotResult.SWISH || result === ShotResult.GOOD || result === ShotResult.OKAY) {
      made = true;
      this.gameState.shotsMade++;
      this.gameState.streak++;
      this.gameState.longestStreak = Math.max(this.gameState.longestStreak, this.gameState.streak);

      // Calculate points
      points = CONFIG.basePoints;
      if (result === ShotResult.SWISH) {
        points += CONFIG.swishBonus;
        this.gameState.swishes++;
      }
      if (isMoneyBall) {
        points *= CONFIG.moneyBallMultiplier;
        this.moneyBallsMade++;
      }

      // Apply streak multiplier
      const streakMult = 1 + (this.gameState.streak - 1) * CONFIG.streakMultiplierBase * this.config.shooter.streakBonus;
      this.gameState.multiplier = Math.min(streakMult, CONFIG.maxStreakMultiplier);
      points = Math.floor(points * this.gameState.multiplier);

      this.gameState.score += points;
    } else {
      this.gameState.streak = 0;
      this.gameState.multiplier = 1.0;
    }

    // Move to next ball/rack
    this.advanceBall();

    // Update state
    this.config.onGameStateChange({ ...this.gameState });

    // Show feedback
    this.showFeedback(result, points, made && isMoneyBall);

    // Reset for next shot
    setTimeout(() => {
      this.isShooting = false;
      this.resetBallPosition();
    }, 300);
  }

  private advanceBall(): void {
    if (this.gameState.currentBall < CONFIG.ballsPerRack) {
      this.gameState.currentBall++;
    } else {
      // Next rack
      this.gameState.currentBall = 1;
      if (this.gameState.currentRack < CONFIG.totalRacks) {
        this.gameState.currentRack++;
        this.moveShooterToRack(this.gameState.currentRack - 1);
      }
    }

    this.gameState.isMoneyBall = this.gameState.currentBall === CONFIG.ballsPerRack;
  }

  private showFeedback(result: ShotResult, points: number, isMoneyBall: boolean): void {
    const feedbackEl = document.getElementById('shotFeedback');
    if (!feedbackEl) return;

    let text: string;
    let className: string;

    switch (result) {
      case ShotResult.SWISH:
        text = isMoneyBall ? `SWISH! +${points} 💰` : `SWISH! +${points}`;
        className = 'feedback-swish';
        break;
      case ShotResult.GOOD:
        text = `GOOD! +${points}`;
        className = 'feedback-good';
        break;
      case ShotResult.OKAY:
        text = `OKAY +${points}`;
        className = 'feedback-okay';
        break;
      case ShotResult.MISS:
        text = 'MISS';
        className = 'feedback-miss';
        break;
      case ShotResult.AIRBALL:
        text = 'AIRBALL!';
        className = 'feedback-airball';
        break;
    }

    feedbackEl.textContent = text;
    feedbackEl.className = `show ${className}`;

    setTimeout(() => {
      feedbackEl.className = '';
    }, 800);
  }

  startGame(): void {
    this.gameState = this.createInitialState();
    this.moneyBallsMade = 0;
    this.gameStartTime = Date.now();
    this.isPlaying = true;
    this.isShooting = false;
    this.shotMeterActive = false;

    this.moveShooterToRack(0);
    this.config.onGameStateChange({ ...this.gameState });

    // Show aim hint
    const hintEl = document.getElementById('aimHint');
    if (hintEl) hintEl.style.display = 'block';
  }

  private update(): void {
    if (!this.isPlaying) return;

    // Update timer
    const elapsed = Date.now() - this.gameStartTime;
    this.gameState.timeRemaining = Math.max(0, CONFIG.gameDuration - elapsed);

    // Update shot meter if active
    if (this.shotMeterActive) {
      const speed = CONFIG.shotMeterSpeed * (this.config.shooter.release / 6);
      this.shotMeterValue += this.shotMeterDirection * speed * 0.016;

      if (this.shotMeterValue >= 1) {
        this.shotMeterValue = 1;
        this.shotMeterDirection = -1;
      } else if (this.shotMeterValue <= 0) {
        this.shotMeterValue = 0;
        this.shotMeterDirection = 1;
      }

      // Update meter UI
      const fillEl = document.getElementById('shotMeterFill');
      if (fillEl) fillEl.style.height = `${this.shotMeterValue * 100}%`;
    }

    // Check game over
    if (this.gameState.timeRemaining <= 0 ||
        (this.gameState.currentRack >= CONFIG.totalRacks &&
         this.gameState.currentBall > CONFIG.ballsPerRack)) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.isPlaying = false;

    const hintEl = document.getElementById('aimHint');
    if (hintEl) hintEl.style.display = 'none';

    const result: HoopsGameResult = {
      finalScore: this.gameState.score,
      shotsMade: this.gameState.shotsMade,
      shotsAttempted: this.gameState.shotsAttempted,
      shootingPercentage: this.gameState.shotsAttempted > 0
        ? Math.round((this.gameState.shotsMade / this.gameState.shotsAttempted) * 100)
        : 0,
      longestStreak: this.gameState.longestStreak,
      swishes: this.gameState.swishes,
      moneyBallsMade: this.moneyBallsMade,
      durationSeconds: Math.round((CONFIG.gameDuration - this.gameState.timeRemaining) / 1000),
      shooterId: this.config.shooter.id,
    };

    this.config.onGameOver(result);
  }

  dispose(): void {
    this.isPlaying = false;
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
