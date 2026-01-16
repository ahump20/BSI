/**
 * Blaze Blitz Football - Power-Up System
 *
 * Arcade-style power-ups that spawn on the field:
 * - Speed Boost: Increased player speed
 * - Super Arm: Passes travel faster and farther
 * - Iron Will: Can't be tackled for first hit
 * - Magnet Hands: Auto-catch any nearby pass
 * - Freeze Defense: Defenders slow down temporarily
 */

import {
  Scene,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  ParticleSystem,
  Texture,
  Animation,
  GlowLayer,
} from '@babylonjs/core';
import { FIELD_CONFIG } from './Field';

/** Power-up types */
export type PowerUpType = 'speedBoost' | 'superArm' | 'ironWill' | 'magnetHands' | 'freezeDefense';

/** Power-up definition */
export interface PowerUpDef {
  type: PowerUpType;
  name: string;
  description: string;
  duration: number; // ms
  color: Color3;
  symbol: string;
}

/** Power-up definitions */
const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  speedBoost: {
    type: 'speedBoost',
    name: 'Speed Boost',
    description: '+50% speed for 8 seconds',
    duration: 8000,
    color: new Color3(0.2, 0.8, 1),
    symbol: '⚡',
  },
  superArm: {
    type: 'superArm',
    name: 'Super Arm',
    description: 'Rocket passes for 10 seconds',
    duration: 10000,
    color: new Color3(1, 0.5, 0),
    symbol: '💪',
  },
  ironWill: {
    type: 'ironWill',
    name: 'Iron Will',
    description: 'Break one tackle automatically',
    duration: 15000,
    color: new Color3(0.5, 0.5, 0.5),
    symbol: '🛡️',
  },
  magnetHands: {
    type: 'magnetHands',
    name: 'Magnet Hands',
    description: 'Catch any pass within range',
    duration: 12000,
    color: new Color3(1, 0, 1),
    symbol: '🧲',
  },
  freezeDefense: {
    type: 'freezeDefense',
    name: 'Freeze Defense',
    description: 'Defenders move 50% slower',
    duration: 6000,
    color: new Color3(0, 0.5, 1),
    symbol: '❄️',
  },
};

/** Spawned power-up */
export interface SpawnedPowerUp {
  type: PowerUpType;
  mesh: Mesh;
  particles: ParticleSystem;
  position: Vector3;
  spawnTime: number;
  collected: boolean;
}

/** Active power-up effect */
export interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  duration: number;
  remaining: number;
}

export class PowerUpSystem {
  private scene: Scene;
  private glowLayer: GlowLayer | null = null;

  // Spawned power-ups on field
  private spawnedPowerUps: SpawnedPowerUp[] = [];

  // Currently active power-ups
  private activePowerUps: ActivePowerUp[] = [];

  // Spawn configuration
  private readonly spawnInterval = 15000; // ms between spawns
  private readonly maxSpawned = 3;
  private readonly despawnTime = 12000; // ms before despawn
  private lastSpawnTime = 0;

  // Callbacks
  private onCollect: ((type: PowerUpType) => void) | null = null;
  private onExpire: ((type: PowerUpType) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create glow layer for power-ups
    this.glowLayer = new GlowLayer('powerUpGlow', scene);
    this.glowLayer.intensity = 1.2;
  }

  /** Set collection callback */
  public setOnCollect(callback: (type: PowerUpType) => void): void {
    this.onCollect = callback;
  }

  /** Set expiration callback */
  public setOnExpire(callback: (type: PowerUpType) => void): void {
    this.onExpire = callback;
  }

  // ========================================================================
  // Spawning
  // ========================================================================

  /** Update spawning (call in game loop) */
  public update(deltaTime: number, ballCarrierPosition: Vector3 | null): void {
    const now = performance.now();

    // Try to spawn new power-up
    if (
      now - this.lastSpawnTime > this.spawnInterval &&
      this.spawnedPowerUps.filter((p) => !p.collected).length < this.maxSpawned
    ) {
      this.spawnRandomPowerUp();
      this.lastSpawnTime = now;
    }

    // Check for collection
    if (ballCarrierPosition) {
      this.checkCollection(ballCarrierPosition);
    }

    // Despawn old power-ups
    this.spawnedPowerUps.forEach((powerUp) => {
      if (!powerUp.collected && now - powerUp.spawnTime > this.despawnTime) {
        this.despawnPowerUp(powerUp);
      }
    });

    // Update active power-up timers
    this.activePowerUps = this.activePowerUps.filter((active) => {
      const elapsed = now - active.startTime;
      active.remaining = Math.max(0, active.duration - elapsed);

      if (active.remaining <= 0) {
        this.onExpire?.(active.type);
        return false;
      }
      return true;
    });

    // Animate spawned power-ups
    this.spawnedPowerUps.forEach((powerUp) => {
      if (!powerUp.collected) {
        // Bob up and down
        powerUp.mesh.position.y = 1.5 + Math.sin(now / 500) * 0.3;
        // Rotate
        powerUp.mesh.rotation.y += deltaTime * 2;
      }
    });
  }

  /** Spawn a random power-up */
  public spawnRandomPowerUp(): void {
    const types = Object.keys(POWERUP_DEFS) as PowerUpType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    this.spawnPowerUp(randomType);
  }

  /** Spawn specific power-up */
  public spawnPowerUp(type: PowerUpType): void {
    const def = POWERUP_DEFS[type];

    // Random position on field
    const x = (Math.random() - 0.5) * (FIELD_CONFIG.width - 10);
    const z = 20 + Math.random() * (FIELD_CONFIG.length - 40);
    const position = new Vector3(x, 1.5, z);

    // Create mesh (octahedron shape)
    const mesh = MeshBuilder.CreatePolyhedron(
      `powerup_${type}_${Date.now()}`,
      {
        type: 1, // Octahedron
        size: 0.8,
      },
      this.scene
    );

    // Material with glow
    const mat = new StandardMaterial(`powerupMat_${type}`, this.scene);
    mat.diffuseColor = def.color;
    mat.emissiveColor = def.color.scale(0.5);
    mat.specularColor = Color3.White();

    mesh.material = mat;
    mesh.position = position;

    // Add to glow layer
    if (this.glowLayer) {
      this.glowLayer.addIncludedOnlyMesh(mesh);
    }

    // Create particle effect
    const particles = this.createPowerUpParticles(position, def.color);

    // Add idle animation
    const float = new Animation(
      'floatAnim',
      'position.y',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    float.setKeys([
      { frame: 0, value: 1.5 },
      { frame: 30, value: 2.2 },
      { frame: 60, value: 1.5 },
    ]);

    mesh.animations.push(float);
    this.scene.beginAnimation(mesh, 0, 60, true);

    // Track spawned power-up
    this.spawnedPowerUps.push({
      type,
      mesh,
      particles,
      position,
      spawnTime: performance.now(),
      collected: false,
    });
  }

  /** Create particle effect for power-up */
  private createPowerUpParticles(position: Vector3, color: Color3): ParticleSystem {
    const particles = new ParticleSystem('powerUpParticles', 50, this.scene);

    particles.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    particles.emitter = position;
    particles.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    particles.maxEmitBox = new Vector3(0.5, 0.5, 0.5);

    particles.color1 = color.toColor4(1);
    particles.color2 = color.toColor4(0.5);
    particles.colorDead = new Color4(0, 0, 0, 0);

    particles.minSize = 0.05;
    particles.maxSize = 0.15;

    particles.minLifeTime = 0.5;
    particles.maxLifeTime = 1.5;

    particles.emitRate = 30;

    particles.direction1 = new Vector3(-0.5, 1, -0.5);
    particles.direction2 = new Vector3(0.5, 2, 0.5);

    particles.minEmitPower = 0.5;
    particles.maxEmitPower = 1.5;

    particles.gravity = new Vector3(0, -1, 0);

    particles.start();

    return particles;
  }

  /** Check if ball carrier collects any power-up */
  private checkCollection(ballCarrierPosition: Vector3): void {
    const collectionRadius = 2;

    this.spawnedPowerUps.forEach((powerUp) => {
      if (powerUp.collected) return;

      const distance = Vector3.Distance(ballCarrierPosition, powerUp.position);
      if (distance < collectionRadius) {
        this.collectPowerUp(powerUp);
      }
    });
  }

  /** Collect a power-up */
  private collectPowerUp(powerUp: SpawnedPowerUp): void {
    powerUp.collected = true;

    // Create collection burst
    this.createCollectionBurst(powerUp.position, POWERUP_DEFS[powerUp.type].color);

    // Add to active power-ups
    const def = POWERUP_DEFS[powerUp.type];
    this.activePowerUps.push({
      type: powerUp.type,
      startTime: performance.now(),
      duration: def.duration,
      remaining: def.duration,
    });

    // Callback
    this.onCollect?.(powerUp.type);

    // Clean up mesh
    powerUp.particles.stop();
    setTimeout(() => {
      powerUp.mesh.dispose();
      powerUp.particles.dispose();
    }, 100);
  }

  /** Despawn uncollected power-up */
  private despawnPowerUp(powerUp: SpawnedPowerUp): void {
    powerUp.collected = true;
    powerUp.particles.stop();

    // Fade out animation
    const fadeOut = new Animation(
      'fadeOut',
      'visibility',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    fadeOut.setKeys([
      { frame: 0, value: 1 },
      { frame: 30, value: 0 },
    ]);

    powerUp.mesh.animations = [fadeOut];
    this.scene.beginAnimation(powerUp.mesh, 0, 30, false, 1, () => {
      powerUp.mesh.dispose();
      powerUp.particles.dispose();
    });
  }

  /** Create collection burst effect */
  private createCollectionBurst(position: Vector3, color: Color3): void {
    const burst = new ParticleSystem('collectionBurst', 100, this.scene);

    burst.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    burst.emitter = position;
    burst.createSphereEmitter(1);

    burst.color1 = color.toColor4(1);
    burst.color2 = Color3.White().toColor4(1);
    burst.colorDead = new Color4(0, 0, 0, 0);

    burst.minSize = 0.2;
    burst.maxSize = 0.5;

    burst.minLifeTime = 0.3;
    burst.maxLifeTime = 0.8;

    burst.emitRate = 500;

    burst.minEmitPower = 5;
    burst.maxEmitPower = 10;

    burst.gravity = new Vector3(0, -5, 0);

    burst.targetStopDuration = 0.1;
    burst.disposeOnStop = true;

    burst.start();
  }

  // ========================================================================
  // Active Power-Up Queries
  // ========================================================================

  /** Check if power-up type is active */
  public isActive(type: PowerUpType): boolean {
    return this.activePowerUps.some((p) => p.type === type);
  }

  /** Get remaining time for power-up (0 if not active) */
  public getRemainingTime(type: PowerUpType): number {
    const active = this.activePowerUps.find((p) => p.type === type);
    return active?.remaining ?? 0;
  }

  /** Get all active power-ups */
  public getActivePowerUps(): ActivePowerUp[] {
    return [...this.activePowerUps];
  }

  /** Get power-up definition */
  public static getDef(type: PowerUpType): PowerUpDef {
    return POWERUP_DEFS[type];
  }

  /** Get all power-up definitions */
  public static getAllDefs(): Record<PowerUpType, PowerUpDef> {
    return { ...POWERUP_DEFS };
  }

  // ========================================================================
  // Effect Modifiers
  // ========================================================================

  /** Get speed multiplier from active power-ups */
  public getSpeedMultiplier(): number {
    if (this.isActive('speedBoost')) return 1.5;
    return 1;
  }

  /** Get pass velocity multiplier from active power-ups */
  public getPassMultiplier(): number {
    if (this.isActive('superArm')) return 1.4;
    return 1;
  }

  /** Check if can break tackle (iron will) */
  public canBreakTackle(): boolean {
    if (this.isActive('ironWill')) {
      // Consume iron will
      this.activePowerUps = this.activePowerUps.filter((p) => p.type !== 'ironWill');
      return true;
    }
    return false;
  }

  /** Get catch radius multiplier */
  public getCatchRadiusMultiplier(): number {
    if (this.isActive('magnetHands')) return 2;
    return 1;
  }

  /** Get defender speed multiplier (for freeze effect) */
  public getDefenderSpeedMultiplier(): number {
    if (this.isActive('freezeDefense')) return 0.5;
    return 1;
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  /** Clear all power-ups */
  public clear(): void {
    this.spawnedPowerUps.forEach((p) => {
      p.mesh.dispose();
      p.particles.dispose();
    });
    this.spawnedPowerUps = [];
    this.activePowerUps = [];
  }

  /** Dispose the system */
  public dispose(): void {
    this.clear();
    this.glowLayer?.dispose();
    this.glowLayer = null;
  }
}
