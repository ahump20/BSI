/**
 * Blaze Blitz Football - Ball Physics
 *
 * Arcade-style football physics with:
 * - Bullet pass (flattened arc, high velocity)
 * - Lob pass (higher arc for deep throws)
 * - Magnetic catch radius
 * - Fumble mechanics
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  TrailMesh,
  ParticleSystem,
  Texture,
  Color4,
} from '@babylonjs/core';

/** Ball state */
export type BallState =
  | 'held'        // Ball is being held by a player
  | 'thrown'      // Ball is in the air (pass)
  | 'loose'       // Fumble - anyone can grab it
  | 'dead';       // Play is over

/** Pass type affects trajectory */
export type PassType =
  | 'bullet'      // Flat, fast trajectory
  | 'touch'       // Normal arc
  | 'lob';        // High arc for deep throws

/** Football physics configuration */
export interface BallConfig {
  catchRadius: number;      // Magnetic catch radius (yards)
  fumbleChance: number;     // Base fumble chance on big hits (0-1)
  bulletVelocity: number;   // Bullet pass velocity (yards/sec)
  touchVelocity: number;    // Touch pass velocity
  lobVelocity: number;      // Lob pass velocity
  gravity: number;          // Gravity strength
}

const DEFAULT_CONFIG: BallConfig = {
  catchRadius: 2.5,         // 2.5 yard catch radius
  fumbleChance: 0.15,       // 15% base fumble on big hit
  bulletVelocity: 45,       // Fast bullet pass
  touchVelocity: 35,        // Normal pass
  lobVelocity: 25,          // Slower lob
  gravity: 15,              // Yards/sec^2
};

/** Football physics manager */
export class FootballPhysics {
  private scene: Scene;
  private config: BallConfig;

  // Ball mesh and visual effects
  private ball: Mesh | null = null;
  private ballTrail: TrailMesh | null = null;
  private catchParticles: ParticleSystem | null = null;

  // Ball state
  private state: BallState = 'dead';
  private holder: string | null = null;  // Player ID holding the ball

  // Trajectory tracking
  private velocity: Vector3 = Vector3.Zero();
  private targetPosition: Vector3 | null = null;
  private passType: PassType = 'touch';
  private flightTime: number = 0;
  private maxFlightTime: number = 0;

  constructor(scene: Scene, config: Partial<BallConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Initialize the football */
  public initialize(): void {
    this.createBall();
    this.createVisualEffects();
  }

  /** Create the football mesh */
  private createBall(): void {
    // Create prolate spheroid (football shape)
    this.ball = MeshBuilder.CreateSphere(
      'football',
      {
        diameterX: 0.6,
        diameterY: 0.35,
        diameterZ: 0.35,
        segments: 16,
      },
      this.scene
    );

    // Brown leather material
    const ballMat = new StandardMaterial('footballMat', this.scene);
    ballMat.diffuseColor = new Color3(0.55, 0.27, 0.07);
    ballMat.specularColor = new Color3(0.3, 0.2, 0.1);

    this.ball.material = ballMat;
    this.ball.position.y = 1; // Start above ground
    this.ball.rotation.x = Math.PI / 2; // Point forward

    // Initially hidden until game starts
    this.ball.isVisible = false;
  }

  /** Create visual effects */
  private createVisualEffects(): void {
    if (!this.ball) return;

    // Ball trail when thrown
    this.ballTrail = new TrailMesh(
      'ballTrail',
      this.ball,
      this.scene,
      0.15,
      30,
      true
    );

    const trailMat = new StandardMaterial('trailMat', this.scene);
    trailMat.emissiveColor = new Color3(1, 1, 1);
    trailMat.alpha = 0.3;
    this.ballTrail.material = trailMat;
    this.ballTrail.isVisible = false;

    // Catch particles
    this.catchParticles = new ParticleSystem('catchParticles', 50, this.scene);
    this.catchParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );

    this.catchParticles.emitter = Vector3.Zero();
    this.catchParticles.minSize = 0.2;
    this.catchParticles.maxSize = 0.5;
    this.catchParticles.minLifeTime = 0.2;
    this.catchParticles.maxLifeTime = 0.4;
    this.catchParticles.emitRate = 100;
    this.catchParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.catchParticles.gravity = new Vector3(0, -5, 0);
    this.catchParticles.direction1 = new Vector3(-1, 1, -1);
    this.catchParticles.direction2 = new Vector3(1, 2, 1);
    this.catchParticles.color1 = new Color4(1, 0.8, 0, 1);
    this.catchParticles.color2 = new Color4(1, 0.5, 0, 1);
    this.catchParticles.colorDead = new Color4(1, 0.3, 0, 0);
  }

  /** Give ball to a player */
  public giveTo(playerId: string, position: Vector3): void {
    this.state = 'held';
    this.holder = playerId;
    this.velocity = Vector3.Zero();
    this.targetPosition = null;

    if (this.ball) {
      this.ball.isVisible = true;
      this.ball.position = position.clone();
      this.ball.position.y = 1.2; // Chest height
    }

    if (this.ballTrail) {
      this.ballTrail.isVisible = false;
    }
  }

  /** Throw the ball to a target position */
  public throwTo(
    targetPos: Vector3,
    passType: PassType = 'touch',
    holdTime: number = 0 // How long throw button was held
  ): void {
    if (!this.ball || this.state !== 'held') return;

    this.state = 'thrown';
    this.holder = null;
    this.passType = passType;
    this.targetPosition = targetPos.clone();
    this.flightTime = 0;

    // Determine velocity based on pass type and hold time
    let baseVelocity: number;
    let arcHeight: number;

    switch (passType) {
      case 'bullet':
        baseVelocity = this.config.bulletVelocity * (1 + holdTime * 0.2);
        arcHeight = 0.1; // Very flat
        break;
      case 'lob':
        baseVelocity = this.config.lobVelocity;
        arcHeight = 0.6; // High arc
        break;
      default:
        baseVelocity = this.config.touchVelocity;
        arcHeight = 0.3; // Normal arc
    }

    // Calculate trajectory
    const startPos = this.ball.position.clone();
    const distance = Vector3.Distance(startPos, targetPos);
    this.maxFlightTime = distance / baseVelocity;

    // Initial velocity vector
    const direction = targetPos.subtract(startPos).normalize();
    const horizontalVelocity = direction.scale(baseVelocity);

    // Add vertical component for arc
    const peakHeight = distance * arcHeight;
    const verticalVelocity = (peakHeight + 0.5 * this.config.gravity * Math.pow(this.maxFlightTime / 2, 2)) / (this.maxFlightTime / 2);

    this.velocity = new Vector3(
      horizontalVelocity.x,
      verticalVelocity,
      horizontalVelocity.z
    );

    // Show trail
    if (this.ballTrail) {
      this.ballTrail.isVisible = true;
    }

    // Rotate ball to point in direction of throw
    const angle = Math.atan2(direction.x, direction.z);
    this.ball.rotation.y = angle;
  }

  /** Update ball physics (call every frame) */
  public update(deltaTime: number): void {
    if (!this.ball || this.state !== 'thrown') return;

    this.flightTime += deltaTime;

    // Apply gravity to vertical velocity
    this.velocity.y -= this.config.gravity * deltaTime;

    // Update position
    this.ball.position.addInPlace(this.velocity.scale(deltaTime));

    // Spin the ball
    this.ball.rotation.x += deltaTime * 10;

    // Check if ball hit the ground
    if (this.ball.position.y <= 0.3) {
      this.ball.position.y = 0.3;
      this.state = 'loose'; // Incomplete pass or fumble
      this.velocity = Vector3.Zero();

      if (this.ballTrail) {
        this.ballTrail.isVisible = false;
      }
    }
  }

  /** Check if a player is within catch radius */
  public isInCatchRadius(playerPosition: Vector3): boolean {
    if (!this.ball || this.state !== 'thrown') return false;

    const distance = Vector3.Distance(this.ball.position, playerPosition);
    return distance <= this.config.catchRadius;
  }

  /** Attempt to catch the ball */
  public attemptCatch(
    playerId: string,
    playerPosition: Vector3,
    catchSkill: number = 5 // 1-10 skill
  ): boolean {
    if (!this.ball || this.state !== 'thrown') return false;

    const distance = Vector3.Distance(this.ball.position, playerPosition);

    // Must be within catch radius
    if (distance > this.config.catchRadius) return false;

    // Catch success based on skill and distance
    const baseSuccess = 0.7 + (catchSkill / 10) * 0.25;
    const distancePenalty = (distance / this.config.catchRadius) * 0.2;
    const successChance = baseSuccess - distancePenalty;

    const caught = Math.random() < successChance;

    if (caught) {
      // Magnetic snap to player
      this.giveTo(playerId, playerPosition);

      // Catch particles effect
      if (this.catchParticles) {
        this.catchParticles.emitter = playerPosition.clone();
        this.catchParticles.start();
        setTimeout(() => this.catchParticles?.stop(), 200);
      }

      return true;
    }

    // Dropped - ball becomes loose
    this.state = 'loose';
    return false;
  }

  /** Force a fumble */
  public fumble(tacklerPower: number = 5): boolean {
    if (this.state !== 'held') return false;

    const fumbleChance = this.config.fumbleChance * (tacklerPower / 5);
    const fumbled = Math.random() < fumbleChance;

    if (fumbled) {
      this.state = 'loose';
      this.holder = null;

      if (this.ball) {
        // Ball pops out in random direction
        const randomAngle = Math.random() * Math.PI * 2;
        this.velocity = new Vector3(
          Math.cos(randomAngle) * 5,
          3,
          Math.sin(randomAngle) * 5
        );
      }

      return true;
    }

    return false;
  }

  /** Pick up a loose ball */
  public pickUp(playerId: string, playerPosition: Vector3): boolean {
    if (!this.ball || this.state !== 'loose') return false;

    const distance = Vector3.Distance(this.ball.position, playerPosition);

    if (distance <= 1.5) { // Must be close to pick up
      this.giveTo(playerId, playerPosition);
      return true;
    }

    return false;
  }

  /** Update ball position when held by a player */
  public updateHeldPosition(playerPosition: Vector3, facingAngle: number): void {
    if (!this.ball || this.state !== 'held') return;

    // Position ball at player's side
    const offsetX = Math.sin(facingAngle) * 0.3;
    const offsetZ = Math.cos(facingAngle) * 0.3;

    this.ball.position.x = playerPosition.x + offsetX;
    this.ball.position.y = playerPosition.y + 0.8;
    this.ball.position.z = playerPosition.z + offsetZ;
    this.ball.rotation.y = facingAngle;
  }

  /** Mark ball as dead (play over) */
  public markDead(): void {
    this.state = 'dead';
    this.holder = null;
    this.velocity = Vector3.Zero();

    if (this.ballTrail) {
      this.ballTrail.isVisible = false;
    }
  }

  /** Get current ball state */
  public getState(): BallState {
    return this.state;
  }

  /** Get who is holding the ball */
  public getHolder(): string | null {
    return this.holder;
  }

  /** Get ball position */
  public getPosition(): Vector3 | null {
    return this.ball?.position.clone() || null;
  }

  /** Get ball mesh for collision detection */
  public getMesh(): Mesh | null {
    return this.ball;
  }

  /** Check if ball is catchable (in air) */
  public isCatchable(): boolean {
    return this.state === 'thrown';
  }

  /** Hide the ball */
  public hide(): void {
    if (this.ball) {
      this.ball.isVisible = false;
    }
    if (this.ballTrail) {
      this.ballTrail.isVisible = false;
    }
  }

  /** Show the ball */
  public show(): void {
    if (this.ball) {
      this.ball.isVisible = true;
    }
  }

  /** Dispose resources */
  public dispose(): void {
    this.ball?.dispose();
    this.ballTrail?.dispose();
    this.catchParticles?.dispose();
  }
}
