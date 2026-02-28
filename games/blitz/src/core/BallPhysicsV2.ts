/**
 * Blaze Blitz Football - Ball Physics v2
 *
 * Enhanced physics:
 * - Wind effects on deep passes
 * - Spin (spiral) affecting accuracy and wobble
 * - Receiver-in-stride catch mechanics
 * - Tipped ball and contested catch support
 * - Improved trajectory with variable arc types
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
  TrailMesh,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';

// ============================================================================
// Types
// ============================================================================

export type BallState = 'held' | 'thrown' | 'tipped' | 'loose' | 'dead';

export type PassType = 'bullet' | 'touch' | 'lob' | 'screen';

export interface BallConfig {
  catchRadius: number;
  contestedCatchRadius: number;
  fumbleChance: number;
  bulletVelocity: number;
  touchVelocity: number;
  lobVelocity: number;
  screenVelocity: number;
  gravity: number;
  windEnabled: boolean;
  windDirection: Vector3;
  windStrength: number;
  spiralTightness: number;
}

export interface CatchAttemptResult {
  caught: boolean;
  tipped: boolean;
  contested: boolean;
  inStride: boolean;
  catchDifficulty: number;
}

export interface ThrowParams {
  target: Vector3;
  passType: PassType;
  holdTime: number;
  leadAmount: number;
  receiverVelocity: Vector3 | null;
  throwPower: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: BallConfig = {
  catchRadius: 2.8,
  contestedCatchRadius: 1.5,
  fumbleChance: 0.12,
  bulletVelocity: 50,
  touchVelocity: 38,
  lobVelocity: 26,
  screenVelocity: 20,
  gravity: 14,
  windEnabled: true,
  windDirection: new Vector3(1, 0, 0),
  windStrength: 0,
  spiralTightness: 0.9,
};

// ============================================================================
// Football Physics v2
// ============================================================================

export class FootballPhysicsV2 {
  private scene: Scene;
  private config: BallConfig;

  private ball: Mesh | null = null;
  private ballTrail: TrailMesh | null = null;
  private catchParticles: ParticleSystem | null = null;

  private state: BallState = 'dead';
  private holder: string | null = null;

  // Trajectory
  private velocity: Vector3 = Vector3.Zero();
  private angularVelocity: Vector3 = Vector3.Zero();
  private targetPosition: Vector3 | null = null;
  private passType: PassType = 'touch';
  private flightTime = 0;
  private maxFlightTime = 0;
  private spiralDecay = 0;
  private tipVelocity: Vector3 | null = null;

  // Wind (randomized per game)
  private windVector: Vector3 = Vector3.Zero();

  // Catch tracking
  private lastThrowParams: ThrowParams | null = null;

  constructor(scene: Scene, config: Partial<BallConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.randomizeWind();
  }

  /** Randomize wind for this game session */
  public randomizeWind(): void {
    if (!this.config.windEnabled) {
      this.windVector = Vector3.Zero();
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const strength = Math.random() * 3; // 0-3 yard/s wind
    this.windVector = new Vector3(
      Math.cos(angle) * strength,
      0,
      Math.sin(angle) * strength,
    );
    this.config.windStrength = strength;
    this.config.windDirection = this.windVector.normalize();
  }

  public getWindVector(): Vector3 {
    return this.windVector.clone();
  }

  public getWindStrength(): number {
    return this.config.windStrength;
  }

  public initialize(): void {
    this.createBall();
    this.createVisualEffects();
  }

  private createBall(): void {
    this.ball = MeshBuilder.CreateSphere(
      'football',
      { diameterX: 0.6, diameterY: 0.35, diameterZ: 0.35, segments: 16 },
      this.scene,
    );

    const mat = new StandardMaterial('footballMat', this.scene);
    mat.diffuseColor = new Color3(0.55, 0.27, 0.07);
    mat.specularColor = new Color3(0.3, 0.2, 0.1);
    this.ball.material = mat;
    this.ball.position.y = 1;
    this.ball.rotation.x = Math.PI / 2;
    this.ball.isVisible = false;
  }

  private createVisualEffects(): void {
    if (!this.ball) return;

    this.ballTrail = new TrailMesh('ballTrail', this.ball, this.scene, 0.15, 30, true);
    const trailMat = new StandardMaterial('trailMat', this.scene);
    trailMat.emissiveColor = new Color3(1, 1, 1);
    trailMat.alpha = 0.3;
    this.ballTrail.material = trailMat;
    this.ballTrail.isVisible = false;

    this.catchParticles = new ParticleSystem('catchParticles', 60, this.scene);
    this.catchParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene,
    );
    this.catchParticles.emitter = Vector3.Zero();
    this.catchParticles.minSize = 0.2;
    this.catchParticles.maxSize = 0.5;
    this.catchParticles.minLifeTime = 0.2;
    this.catchParticles.maxLifeTime = 0.5;
    this.catchParticles.emitRate = 120;
    this.catchParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.catchParticles.gravity = new Vector3(0, -5, 0);
    this.catchParticles.direction1 = new Vector3(-1, 1, -1);
    this.catchParticles.direction2 = new Vector3(1, 3, 1);
    this.catchParticles.color1 = new Color4(1, 0.8, 0, 1);
    this.catchParticles.color2 = new Color4(1, 0.5, 0, 1);
    this.catchParticles.colorDead = new Color4(1, 0.3, 0, 0);
  }

  // ── Ball possession ──

  public giveTo(playerId: string, position: Vector3): void {
    this.state = 'held';
    this.holder = playerId;
    this.velocity = Vector3.Zero();
    this.angularVelocity = Vector3.Zero();
    this.targetPosition = null;
    this.tipVelocity = null;

    if (this.ball) {
      this.ball.isVisible = true;
      this.ball.position = position.clone();
      this.ball.position.y = 1.2;
    }
    if (this.ballTrail) this.ballTrail.isVisible = false;
  }

  // ── Throwing ──

  public throwTo(params: ThrowParams): void {
    if (!this.ball || this.state !== 'held') return;

    this.state = 'thrown';
    this.holder = null;
    this.passType = params.passType;
    this.flightTime = 0;
    this.spiralDecay = 0;
    this.lastThrowParams = params;

    // Lead the receiver if moving
    const actualTarget = params.target.clone();
    if (params.receiverVelocity && params.leadAmount > 0) {
      const leadTime = params.leadAmount * 0.6; // seconds of lead
      actualTarget.addInPlace(params.receiverVelocity.scale(leadTime));
    }
    this.targetPosition = actualTarget;

    // Velocity based on pass type
    let baseVelocity: number;
    let arcHeight: number;
    switch (params.passType) {
      case 'bullet':
        baseVelocity = this.config.bulletVelocity * (1 + params.holdTime * 0.15);
        arcHeight = 0.08;
        break;
      case 'lob':
        baseVelocity = this.config.lobVelocity;
        arcHeight = 0.55;
        break;
      case 'screen':
        baseVelocity = this.config.screenVelocity;
        arcHeight = 0.15;
        break;
      default:
        baseVelocity = this.config.touchVelocity * (0.9 + params.throwPower * 0.2);
        arcHeight = 0.28;
    }

    const startPos = this.ball.position.clone();
    const distance = Vector3.Distance(startPos, actualTarget);
    this.maxFlightTime = distance / baseVelocity;

    const direction = actualTarget.subtract(startPos).normalize();
    const horizontalVelocity = direction.scale(baseVelocity);

    const peakHeight = distance * arcHeight;
    const halfTime = this.maxFlightTime / 2;
    const verticalVelocity = halfTime > 0
      ? (peakHeight + 0.5 * this.config.gravity * halfTime * halfTime) / halfTime
      : 5;

    this.velocity = new Vector3(horizontalVelocity.x, verticalVelocity, horizontalVelocity.z);

    // Spiral angular velocity (tight spiral = more stable)
    const spiralSpeed = this.config.spiralTightness * 15;
    this.angularVelocity = new Vector3(spiralSpeed, 0, spiralSpeed * 0.3);

    if (this.ballTrail) this.ballTrail.isVisible = true;
    this.ball.rotation.y = Math.atan2(direction.x, direction.z);
  }

  /** Legacy-compatible throwTo */
  public throwToSimple(targetPos: Vector3, passType: PassType = 'touch', holdTime = 0): void {
    this.throwTo({
      target: targetPos,
      passType,
      holdTime,
      leadAmount: 0,
      receiverVelocity: null,
      throwPower: 1,
    });
  }

  // ── Frame update ──

  public update(deltaTime: number): void {
    if (!this.ball) return;

    if (this.state === 'thrown') {
      this.updateThrown(deltaTime);
    } else if (this.state === 'tipped') {
      this.updateTipped(deltaTime);
    } else if (this.state === 'loose') {
      this.updateLoose(deltaTime);
    }
  }

  private updateThrown(dt: number): void {
    if (!this.ball) return;
    this.flightTime += dt;

    // Gravity
    this.velocity.y -= this.config.gravity * dt;

    // Wind effect (stronger on lobs, weaker on bullets)
    const windFactor = this.passType === 'lob' ? 1.0
      : this.passType === 'touch' ? 0.5
      : this.passType === 'screen' ? 0.3
      : 0.15;
    this.velocity.addInPlace(this.windVector.scale(dt * windFactor));

    // Spiral decay over distance (wobble on long throws)
    this.spiralDecay += dt * 0.3;
    const wobble = Math.max(0, this.spiralDecay - 1.5) * 0.5;
    if (wobble > 0) {
      this.velocity.x += (Math.random() - 0.5) * wobble * dt;
      this.velocity.z += (Math.random() - 0.5) * wobble * dt;
    }

    // Move ball
    this.ball.position.addInPlace(this.velocity.scale(dt));

    // Spin animation
    this.ball.rotation.x += this.angularVelocity.x * dt;
    this.ball.rotation.z += this.angularVelocity.z * dt * 0.5;

    // Ground check
    if (this.ball.position.y <= 0.3) {
      this.ball.position.y = 0.3;
      this.state = 'loose';
      this.velocity = Vector3.Zero();
      if (this.ballTrail) this.ballTrail.isVisible = false;
    }
  }

  private updateTipped(dt: number): void {
    if (!this.ball || !this.tipVelocity) return;

    // Tipped ball has reduced velocity and random tumble
    this.tipVelocity.y -= this.config.gravity * 1.2 * dt;
    this.ball.position.addInPlace(this.tipVelocity.scale(dt));

    // Tumble rotation
    this.ball.rotation.x += dt * 8;
    this.ball.rotation.z += dt * 5;

    if (this.ball.position.y <= 0.3) {
      this.ball.position.y = 0.3;
      this.state = 'loose';
      this.tipVelocity = null;
      if (this.ballTrail) this.ballTrail.isVisible = false;
    }
  }

  private updateLoose(dt: number): void {
    if (!this.ball) return;
    // Loose ball bounces and decelerates
    if (this.velocity.length() > 0.1) {
      this.velocity.scaleInPlace(1 - dt * 3);
      this.ball.position.addInPlace(this.velocity.scale(dt));
      this.ball.rotation.x += dt * 3;
    }
  }

  // ── Catch mechanics ──

  /**
   * Attempt a catch with in-stride and contested mechanics.
   * Returns detailed result for UI feedback.
   */
  public attemptCatchV2(
    playerId: string,
    playerPosition: Vector3,
    playerVelocity: Vector3,
    catchSkill: number,
    isContested: boolean,
    defenderDistance: number,
  ): CatchAttemptResult {
    const result: CatchAttemptResult = {
      caught: false,
      tipped: false,
      contested: isContested,
      inStride: false,
      catchDifficulty: 0,
    };

    if (!this.ball || (this.state !== 'thrown' && this.state !== 'tipped')) return result;

    const distance = Vector3.Distance(this.ball.position, playerPosition);
    const radius = isContested ? this.config.contestedCatchRadius : this.config.catchRadius;
    if (distance > radius) return result;

    // In-stride: receiver moving in same direction as ball travel
    let strideFactor = 0;
    if (this.lastThrowParams?.receiverVelocity && playerVelocity.length() > 2) {
      const ballDir = this.velocity.normalize();
      const playerDir = playerVelocity.normalize();
      strideFactor = Math.max(0, Vector3.Dot(ballDir, playerDir));
      result.inStride = strideFactor > 0.6;
    }

    // Catch difficulty (0 = easy, 1 = very hard)
    const distancePenalty = distance / radius;
    const contestPenalty = isContested ? 0.25 : 0;
    const stridBonus = result.inStride ? -0.15 : 0;
    const tipPenalty = this.state === 'tipped' ? 0.3 : 0;
    result.catchDifficulty = Math.min(1, distancePenalty * 0.4 + contestPenalty + stridBonus + tipPenalty);

    // Base success: 65-90% based on skill
    const baseSuccess = 0.65 + (catchSkill / 10) * 0.25;
    const successChance = Math.max(0.05, baseSuccess - result.catchDifficulty);

    const roll = Math.random();

    if (roll < successChance) {
      result.caught = true;
      this.giveTo(playerId, playerPosition);

      if (this.catchParticles) {
        this.catchParticles.emitter = playerPosition.clone();
        this.catchParticles.start();
        setTimeout(() => this.catchParticles?.stop(), 250);
      }
    } else if (isContested && roll < successChance + 0.2) {
      // Tipped ball
      result.tipped = true;
      this.state = 'tipped';
      const tipDir = new Vector3(
        (Math.random() - 0.5) * 6,
        3 + Math.random() * 3,
        (Math.random() - 0.5) * 6,
      );
      this.tipVelocity = tipDir;
    } else {
      // Dropped
      this.state = 'loose';
    }

    return result;
  }

  /** Legacy-compatible catch attempt */
  public attemptCatch(playerId: string, playerPosition: Vector3, catchSkill = 5): boolean {
    const result = this.attemptCatchV2(
      playerId,
      playerPosition,
      Vector3.Zero(),
      catchSkill,
      false,
      999,
    );
    return result.caught;
  }

  // ── Fumble ──

  public fumble(tacklerPower = 5): boolean {
    if (this.state !== 'held') return false;
    const chance = this.config.fumbleChance * (tacklerPower / 5);
    if (Math.random() >= chance) return false;

    this.state = 'loose';
    this.holder = null;
    if (this.ball) {
      const angle = Math.random() * Math.PI * 2;
      this.velocity = new Vector3(Math.cos(angle) * 5, 3, Math.sin(angle) * 5);
    }
    return true;
  }

  public pickUp(playerId: string, playerPosition: Vector3): boolean {
    if (!this.ball || this.state !== 'loose') return false;
    if (Vector3.Distance(this.ball.position, playerPosition) > 1.5) return false;
    this.giveTo(playerId, playerPosition);
    return true;
  }

  // ── Accessors ──

  public updateHeldPosition(playerPosition: Vector3, facingAngle: number): void {
    if (!this.ball || this.state !== 'held') return;
    this.ball.position.x = playerPosition.x + Math.sin(facingAngle) * 0.3;
    this.ball.position.y = playerPosition.y + 0.8;
    this.ball.position.z = playerPosition.z + Math.cos(facingAngle) * 0.3;
    this.ball.rotation.y = facingAngle;
  }

  public markDead(): void {
    this.state = 'dead';
    this.holder = null;
    this.velocity = Vector3.Zero();
    this.tipVelocity = null;
    if (this.ballTrail) this.ballTrail.isVisible = false;
  }

  public getState(): BallState { return this.state; }
  public getHolder(): string | null { return this.holder; }
  public getPosition(): Vector3 | null { return this.ball?.position.clone() ?? null; }
  public getVelocity(): Vector3 { return this.velocity.clone(); }
  public getMesh(): Mesh | null { return this.ball; }
  public isCatchable(): boolean { return this.state === 'thrown' || this.state === 'tipped'; }
  public getFlightProgress(): number { return this.maxFlightTime > 0 ? this.flightTime / this.maxFlightTime : 0; }

  public hide(): void {
    if (this.ball) this.ball.isVisible = false;
    if (this.ballTrail) this.ballTrail.isVisible = false;
  }

  public show(): void {
    if (this.ball) this.ball.isVisible = true;
  }

  public dispose(): void {
    this.ball?.dispose();
    this.ballTrail?.dispose();
    this.catchParticles?.dispose();
  }
}
