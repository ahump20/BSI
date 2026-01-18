/**
 * Blaze Blitz Football - Visual Effects System
 *
 * Provides juicy game feel with:
 * - Screen shake for impacts
 * - Slow motion for big plays
 * - Trail effects for fast players
 * - Impact particles for tackles
 * - Highlight effects for ball carrier
 */

import {
  Scene,
  Vector3,
  Color3,
  Color4,
  ParticleSystem,
  Texture,
  Mesh,
  TrailMesh,
  MeshBuilder,
  StandardMaterial,
  Animation,
  EasingFunction,
  QuadraticEase,
  Camera,
  ArcRotateCamera,
  FollowCamera,
} from '@babylonjs/core';

/** Effect intensity levels */
export type EffectIntensity = 'light' | 'medium' | 'heavy' | 'extreme';

/** Screen shake configuration */
interface ShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
}

const SHAKE_PRESETS: Record<EffectIntensity, ShakeConfig> = {
  light: { intensity: 0.1, duration: 150, frequency: 30 },
  medium: { intensity: 0.3, duration: 250, frequency: 40 },
  heavy: { intensity: 0.6, duration: 400, frequency: 50 },
  extreme: { intensity: 1.0, duration: 600, frequency: 60 },
};

export class VisualEffects {
  private scene: Scene;
  private camera: Camera | null = null;
  private originalCameraPosition: Vector3 | null = null;

  // Active effects
  private activeTrails: Map<string, TrailMesh> = new Map();
  private activeParticles: ParticleSystem[] = [];
  private isShaking = false;
  private slowMotionActive = false;
  private originalTimeScale = 1;

  // Highlight effect
  private highlightMesh: Mesh | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Set the camera for effects */
  public setCamera(camera: Camera): void {
    this.camera = camera;
    this.originalCameraPosition = camera.position.clone();
  }

  // ========================================================================
  // Screen Shake
  // ========================================================================

  /** Trigger screen shake */
  public shake(intensity: EffectIntensity = 'medium'): void {
    if (!this.camera || this.isShaking) return;

    const config = SHAKE_PRESETS[intensity];
    this.isShaking = true;

    const startTime = performance.now();
    const startPos = this.camera.position.clone();

    const shakeLoop = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= config.duration) {
        this.camera!.position = startPos;
        this.isShaking = false;
        return;
      }

      // Decay over time
      const progress = elapsed / config.duration;
      const decay = 1 - progress;
      const currentIntensity = config.intensity * decay;

      // Random offset
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * currentIntensity;

      this.camera!.position = startPos.add(new Vector3(offsetX, offsetY, offsetZ));

      requestAnimationFrame(shakeLoop);
    };

    shakeLoop();
  }

  // ========================================================================
  // Slow Motion
  // ========================================================================

  /** Trigger slow motion effect */
  public slowMotion(duration: number = 1000, scale: number = 0.3): void {
    if (this.slowMotionActive) return;

    this.slowMotionActive = true;
    this.originalTimeScale = this.scene.getAnimationRatio();

    // Slow down animations
    this.scene.animationTimeScale = scale;

    // Visual feedback - slight desaturation would go here via post-processing

    setTimeout(() => {
      this.scene.animationTimeScale = this.originalTimeScale;
      this.slowMotionActive = false;
    }, duration * scale);
  }

  /** Check if slow motion is active */
  public isSlowMotion(): boolean {
    return this.slowMotionActive;
  }

  // ========================================================================
  // Trail Effects
  // ========================================================================

  /** Add speed trail to a mesh */
  public addSpeedTrail(mesh: Mesh, color: Color3, id: string): void {
    if (this.activeTrails.has(id)) return;

    const trail = new TrailMesh(
      `trail_${id}`,
      mesh,
      this.scene,
      0.3, // Diameter
      30, // Length
      true // Auto-start
    );

    const trailMat = new StandardMaterial(`trailMat_${id}`, this.scene);
    trailMat.emissiveColor = color;
    trailMat.diffuseColor = color;
    trailMat.alpha = 0.6;
    trailMat.backFaceCulling = false;

    trail.material = trailMat;
    this.activeTrails.set(id, trail);
  }

  /** Remove speed trail */
  public removeSpeedTrail(id: string): void {
    const trail = this.activeTrails.get(id);
    if (trail) {
      trail.dispose();
      this.activeTrails.delete(id);
    }
  }

  /** Update trail visibility based on speed */
  public updateTrailForSpeed(id: string, speed: number, threshold: number = 10): void {
    const trail = this.activeTrails.get(id);
    if (!trail) return;

    const visibility = Math.min(1, Math.max(0, (speed - threshold) / 10));
    (trail.material as StandardMaterial).alpha = visibility * 0.6;
  }

  // ========================================================================
  // Impact Particles
  // ========================================================================

  /** Create tackle impact effect */
  public createTackleImpact(position: Vector3, intensity: EffectIntensity = 'medium'): void {
    const particleCount = {
      light: 20,
      medium: 50,
      heavy: 100,
      extreme: 200,
    }[intensity];

    const impact = new ParticleSystem('tackleImpact', particleCount, this.scene);

    // Simple circle texture
    impact.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA1ElEQVQ4T6WTwQ2DMAxFvwPdoJ2g3aDdoJ2g3aDdoJ0ANuhG7QZwJCcKISTgIyT7+/8ndhzYeOCGf1kgIi8iclHV4yqCiLwB51V1yCm8F5EPkQ9VfZmAiGT5D1U9bIL8CkRgA3wDP4AvEKYqBOAOvAK3UYEIPIAbcAfiKoCu6jkqEAGru0/l/1WBCBjdj0CBCOT7DPgIVqACBri7qh6mCkQg3/tAgQjkuw8UiED+CxS4Qwe8Aw8DLgMFItABr8A9cDPiMlBgDbgGcQa+x1wGVtr/AGqXYxGjmG3wAAAAAElFTkSuQmCC',
      this.scene
    );

    impact.emitter = position;

    // Team color burst
    impact.color1 = new Color4(1, 0.6, 0.1, 1);
    impact.color2 = new Color4(1, 0.3, 0, 1);
    impact.colorDead = new Color4(0.5, 0.2, 0, 0);

    impact.minSize = 0.1;
    impact.maxSize = 0.4;

    impact.minLifeTime = 0.2;
    impact.maxLifeTime = 0.5;

    impact.emitRate = particleCount * 10;

    impact.createSphereEmitter(0.5);

    impact.minEmitPower = 3;
    impact.maxEmitPower = 8;

    impact.gravity = new Vector3(0, -15, 0);

    impact.targetStopDuration = 0.1;
    impact.disposeOnStop = true;

    impact.start();
    this.activeParticles.push(impact);

    // Screen shake
    this.shake(intensity);
  }

  /** Create catch effect */
  public createCatchEffect(position: Vector3): void {
    const catch$ = new ParticleSystem('catchEffect', 30, this.scene);

    catch$.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    catch$.emitter = position;

    catch$.color1 = new Color4(0.2, 1, 0.2, 1);
    catch$.color2 = new Color4(0.8, 1, 0.2, 1);
    catch$.colorDead = new Color4(0, 0.5, 0, 0);

    catch$.minSize = 0.1;
    catch$.maxSize = 0.3;

    catch$.minLifeTime = 0.3;
    catch$.maxLifeTime = 0.6;

    catch$.emitRate = 100;

    catch$.createSphereEmitter(0.3);

    catch$.minEmitPower = 2;
    catch$.maxEmitPower = 5;

    catch$.gravity = new Vector3(0, 2, 0);

    catch$.targetStopDuration = 0.2;
    catch$.disposeOnStop = true;

    catch$.start();
  }

  /** Create first down marker flash */
  public createFirstDownEffect(yardLine: number): void {
    const firstDown = new ParticleSystem('firstDownEffect', 100, this.scene);

    firstDown.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    // Line across field at first down marker
    firstDown.emitter = new Vector3(0, 0.5, yardLine);
    firstDown.minEmitBox = new Vector3(-26, 0, -0.5);
    firstDown.maxEmitBox = new Vector3(26, 0, 0.5);

    firstDown.color1 = new Color4(1, 0.8, 0, 1);
    firstDown.color2 = new Color4(1, 0.6, 0, 1);
    firstDown.colorDead = new Color4(1, 0.4, 0, 0);

    firstDown.minSize = 0.2;
    firstDown.maxSize = 0.5;

    firstDown.minLifeTime = 0.5;
    firstDown.maxLifeTime = 1;

    firstDown.emitRate = 200;

    firstDown.direction1 = new Vector3(0, 1, 0);
    firstDown.direction2 = new Vector3(0, 1, 0);

    firstDown.minEmitPower = 2;
    firstDown.maxEmitPower = 4;

    firstDown.gravity = new Vector3(0, 0, 0);

    firstDown.targetStopDuration = 0.5;
    firstDown.disposeOnStop = true;

    firstDown.start();
  }

  // ========================================================================
  // Ball Carrier Highlight
  // ========================================================================

  /** Add highlight ring around ball carrier */
  public addBallCarrierHighlight(mesh: Mesh): void {
    if (this.highlightMesh) {
      this.highlightMesh.dispose();
    }

    // Create glowing ring
    const highlight = MeshBuilder.CreateTorus(
      'ballCarrierHighlight',
      {
        diameter: 2,
        thickness: 0.1,
        tessellation: 32,
      },
      this.scene
    );

    const highlightMat = new StandardMaterial('highlightMat', this.scene);
    highlightMat.emissiveColor = new Color3(1, 0.8, 0);
    highlightMat.diffuseColor = new Color3(1, 0.8, 0);
    highlightMat.alpha = 0.7;

    highlight.material = highlightMat;
    highlight.parent = mesh;
    highlight.position.y = 0.1;
    highlight.rotation.x = Math.PI / 2;

    // Pulse animation
    const pulse = new Animation(
      'highlightPulse',
      'scaling',
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    pulse.setKeys([
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 15, value: new Vector3(1.2, 1.2, 1) },
      { frame: 30, value: new Vector3(1, 1, 1) },
    ]);

    highlight.animations.push(pulse);
    this.scene.beginAnimation(highlight, 0, 30, true);

    this.highlightMesh = highlight;
  }

  /** Remove ball carrier highlight */
  public removeBallCarrierHighlight(): void {
    if (this.highlightMesh) {
      this.highlightMesh.dispose();
      this.highlightMesh = null;
    }
  }

  // ========================================================================
  // Big Play Effects
  // ========================================================================

  /** Trigger big play celebration */
  public triggerBigPlay(position: Vector3, yards: number): void {
    // Slow motion
    if (yards >= 30) {
      this.slowMotion(800, 0.4);
    }

    // Screen shake
    this.shake(yards >= 40 ? 'heavy' : 'medium');

    // Confetti burst
    const confetti = new ParticleSystem('bigPlayConfetti', 200, this.scene);

    confetti.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQIW2NkYGD4D8QMIAwGABqYAQGXMFz5AAAAAElFTkSuQmCC',
      this.scene
    );

    confetti.emitter = position.add(new Vector3(0, 3, 0));

    confetti.color1 = new Color4(1, 0.8, 0, 1);
    confetti.color2 = new Color4(1, 0.4, 0, 1);
    confetti.colorDead = new Color4(0.5, 0.2, 0, 0);

    confetti.minSize = 0.1;
    confetti.maxSize = 0.3;

    confetti.minLifeTime = 1;
    confetti.maxLifeTime = 3;

    confetti.emitRate = 300;

    confetti.createSphereEmitter(3);

    confetti.minEmitPower = 5;
    confetti.maxEmitPower = 12;

    confetti.gravity = new Vector3(0, -5, 0);

    confetti.targetStopDuration = 0.5;
    confetti.disposeOnStop = true;

    confetti.start();
  }

  /** Trigger touchdown celebration */
  public triggerTouchdown(position: Vector3): void {
    // Epic slow motion
    this.slowMotion(1500, 0.25);

    // Heavy shake
    this.shake('extreme');

    // Massive particle burst
    const touchdown = new ParticleSystem('touchdownBurst', 500, this.scene);

    touchdown.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA1ElEQVQ4T6WTwQ2DMAxFvwPdoJ2g3aDdoJ2g3aDdoJ0ANuhG7QZwJCcKISTgIyT7+/8ndhzYeOCGf1kgIi8iclHV4yqCiLwB51V1yCm8F5EPkQ9VfZmAiGT5D1U9bIL8CkRgA3wDP4AvEKYqBOAOvAK3UYEIPIAbcAfiKoCu6jkqEAGru0/l/1WBCBjdj0CBCOT7DPgIVqACBri7qh6mCkQg3/tAgQjkuw8UiED+CxS4Qwe8Aw8DLgMFItABr8A9cDPiMlBgDbgGcQa+x1wGVtr/AGqXYxGjmG3wAAAAAElFTkSuQmCC',
      this.scene
    );

    touchdown.emitter = position.add(new Vector3(0, 2, 0));

    // Gold and orange burst
    touchdown.color1 = new Color4(1, 0.9, 0, 1);
    touchdown.color2 = new Color4(1, 0.5, 0, 1);
    touchdown.colorDead = new Color4(1, 0.2, 0, 0);

    touchdown.minSize = 0.3;
    touchdown.maxSize = 1;

    touchdown.minLifeTime = 1;
    touchdown.maxLifeTime = 4;

    touchdown.emitRate = 1000;

    touchdown.createSphereEmitter(2);

    touchdown.minEmitPower = 10;
    touchdown.maxEmitPower = 25;

    touchdown.gravity = new Vector3(0, -8, 0);

    touchdown.targetStopDuration = 0.5;
    touchdown.disposeOnStop = true;

    touchdown.start();

    // Create secondary sparkle effect
    setTimeout(() => {
      const sparkles = new ParticleSystem('tdSparkles', 300, this.scene);

      sparkles.particleTexture = new Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
        this.scene
      );

      sparkles.emitter = position.add(new Vector3(0, 5, 0));
      sparkles.minEmitBox = new Vector3(-5, -2, -5);
      sparkles.maxEmitBox = new Vector3(5, 2, 5);

      sparkles.color1 = new Color4(1, 1, 1, 1);
      sparkles.color2 = new Color4(1, 1, 0.5, 1);
      sparkles.colorDead = new Color4(1, 1, 1, 0);

      sparkles.minSize = 0.05;
      sparkles.maxSize = 0.2;

      sparkles.minLifeTime = 0.5;
      sparkles.maxLifeTime = 2;

      sparkles.emitRate = 200;

      sparkles.direction1 = new Vector3(-1, 0, -1);
      sparkles.direction2 = new Vector3(1, 2, 1);

      sparkles.minEmitPower = 1;
      sparkles.maxEmitPower = 3;

      sparkles.gravity = new Vector3(0, -1, 0);

      sparkles.targetStopDuration = 2;
      sparkles.disposeOnStop = true;

      sparkles.start();
    }, 200);
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  /** Dispose all effects */
  public dispose(): void {
    this.activeTrails.forEach((trail) => trail.dispose());
    this.activeTrails.clear();

    this.activeParticles.forEach((ps) => ps.dispose());
    this.activeParticles = [];

    if (this.highlightMesh) {
      this.highlightMesh.dispose();
      this.highlightMesh = null;
    }
  }
}
