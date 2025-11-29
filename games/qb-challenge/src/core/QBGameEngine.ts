/**
 * QB Challenge - Game Engine
 *
 * Core Babylon.js game engine for the QB accuracy challenge.
 * Players throw passes to moving targets within 60 seconds.
 */

import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  ShadowGenerator,
  Animation,
  Mesh,
  PointerEventTypes,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';
import type { Quarterback } from '@data/quarterbacks';

export interface QBGameState {
  score: number;
  timeRemaining: number;
  completions: number;
  attempts: number;
  streak: number;
  currentTarget: string;
  isAiming: boolean;
}

export interface QBGameResult {
  finalScore: number;
  completions: number;
  attempts: number;
  completionPercentage: number;
  longestStreak: number;
  touchdowns: number;
  perfectThrows: number;
  durationSeconds: number;
  qbId: string;
}

export interface QBGameConfig {
  canvas: HTMLCanvasElement;
  qb: Quarterback;
  onGameStateChange: (state: QBGameState) => void;
  onGameOver: (result: QBGameResult) => void;
}

interface Target {
  mesh: Mesh;
  name: string;
  basePosition: Vector3;
  pointValue: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  animation: Animation | null;
}

const GAME_DURATION = 60000; // 60 seconds
const TARGET_SPAWN_INTERVAL = 2500; // New target every 2.5 seconds

export class QBGameEngine {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private shadowGenerator: ShadowGenerator | null = null;
  private football: Mesh | null = null;
  private targets: Target[] = [];
  private activeTarget: Target | null = null;

  private qb: Quarterback;
  private onGameStateChange: (state: QBGameState) => void;
  private onGameOver: (result: QBGameResult) => void;

  private gameStartTime: number = 0;
  private gameInterval: ReturnType<typeof setInterval> | null = null;
  private targetInterval: ReturnType<typeof setInterval> | null = null;
  private isGameActive: boolean = false;
  private isAiming: boolean = false;
  private aimStartTime: number = 0;

  // Game stats
  private score: number = 0;
  private completions: number = 0;
  private attempts: number = 0;
  private streak: number = 0;
  private longestStreak: number = 0;
  private touchdowns: number = 0;
  private perfectThrows: number = 0;

  private constructor(config: QBGameConfig) {
    this.qb = config.qb;
    this.onGameStateChange = config.onGameStateChange;
    this.onGameOver = config.onGameOver;

    this.engine = new Engine(config.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.1, 0.28, 0.16, 1);

    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      30,
      new Vector3(0, 2, 20),
      this.scene
    );
    this.camera.attachControl(config.canvas, false);
    this.camera.lowerRadiusLimit = 20;
    this.camera.upperRadiusLimit = 40;
  }

  static async create(config: QBGameConfig): Promise<QBGameEngine> {
    const engine = new QBGameEngine(config);
    await engine.initializeScene();
    return engine;
  }

  private async initializeScene(): Promise<void> {
    // Lighting
    const hemisphericLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemisphericLight.intensity = 0.6;

    const directionalLight = new DirectionalLight(
      'dirLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    directionalLight.position = new Vector3(20, 40, 20);
    directionalLight.intensity = 0.8;

    // Shadows
    this.shadowGenerator = new ShadowGenerator(2048, directionalLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;

    // Create field
    this.createField();

    // Create football
    this.createFootball();

    // Create target zones
    this.createTargets();

    // Setup input handling
    this.setupInputHandling();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private createField(): void {
    // Main field (grass)
    const field = MeshBuilder.CreateGround(
      'field',
      { width: 60, height: 100 },
      this.scene
    );
    const fieldMat = new StandardMaterial('fieldMat', this.scene);
    fieldMat.diffuseColor = new Color3(0.2, 0.5, 0.2);
    fieldMat.specularColor = new Color3(0.1, 0.1, 0.1);
    field.material = fieldMat;
    field.receiveShadows = true;

    // Field lines
    const createLine = (
      name: string,
      z: number,
      width: number = 60,
      thickness: number = 0.3
    ) => {
      const line = MeshBuilder.CreatePlane(
        name,
        { width, height: thickness },
        this.scene
      );
      line.rotation.x = Math.PI / 2;
      line.position.y = 0.01;
      line.position.z = z;
      const lineMat = new StandardMaterial(`${name}Mat`, this.scene);
      lineMat.diffuseColor = Color3.White();
      lineMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
      line.material = lineMat;
      return line;
    };

    // Yard lines
    for (let i = -40; i <= 40; i += 10) {
      createLine(`yardLine${i}`, i);
    }

    // End zone
    const endZone = MeshBuilder.CreateGround(
      'endZone',
      { width: 60, height: 10 },
      this.scene
    );
    endZone.position.z = -45;
    const endZoneMat = new StandardMaterial('endZoneMat', this.scene);
    endZoneMat.diffuseColor = new Color3(0.6, 0.3, 0.1);
    endZone.material = endZoneMat;
    endZone.receiveShadows = true;

    // Goal posts
    this.createGoalPosts();
  }

  private createGoalPosts(): void {
    const postMat = new StandardMaterial('postMat', this.scene);
    postMat.diffuseColor = new Color3(1, 1, 0);

    // Left upright
    const leftPost = MeshBuilder.CreateCylinder(
      'leftPost',
      { height: 15, diameter: 0.3 },
      this.scene
    );
    leftPost.position = new Vector3(-9, 7.5, -50);
    leftPost.material = postMat;

    // Right upright
    const rightPost = MeshBuilder.CreateCylinder(
      'rightPost',
      { height: 15, diameter: 0.3 },
      this.scene
    );
    rightPost.position = new Vector3(9, 7.5, -50);
    rightPost.material = postMat;

    // Crossbar
    const crossbar = MeshBuilder.CreateCylinder(
      'crossbar',
      { height: 18.6, diameter: 0.3 },
      this.scene
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position = new Vector3(0, 10, -50);
    crossbar.material = postMat;
  }

  private createFootball(): void {
    // Create elongated sphere for football
    this.football = MeshBuilder.CreateSphere(
      'football',
      { diameter: 0.6, segments: 16 },
      this.scene
    );
    this.football.scaling = new Vector3(0.6, 1, 0.6);
    this.football.position = new Vector3(0, 2, 40);

    const footballMat = new StandardMaterial('footballMat', this.scene);
    footballMat.diffuseColor = new Color3(0.55, 0.27, 0.07);
    this.football.material = footballMat;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.football);
    }
  }

  private createTargets(): void {
    const targetPositions = [
      { name: 'Slant Left', pos: new Vector3(-15, 2, 10), difficulty: 'easy' as const, points: 100 },
      { name: 'Slant Right', pos: new Vector3(15, 2, 10), difficulty: 'easy' as const, points: 100 },
      { name: 'Out Left', pos: new Vector3(-25, 2, 0), difficulty: 'medium' as const, points: 200 },
      { name: 'Out Right', pos: new Vector3(25, 2, 0), difficulty: 'medium' as const, points: 200 },
      { name: 'Deep Post', pos: new Vector3(-5, 3, -20), difficulty: 'medium' as const, points: 250 },
      { name: 'Deep Corner', pos: new Vector3(5, 3, -20), difficulty: 'medium' as const, points: 250 },
      { name: 'Streak Left', pos: new Vector3(-10, 3, -35), difficulty: 'hard' as const, points: 400 },
      { name: 'Streak Right', pos: new Vector3(10, 3, -35), difficulty: 'hard' as const, points: 400 },
      { name: 'End Zone', pos: new Vector3(0, 3, -45), difficulty: 'hard' as const, points: 500 },
    ];

    targetPositions.forEach((targetData) => {
      const target = MeshBuilder.CreateTorus(
        `target_${targetData.name}`,
        { diameter: 3, thickness: 0.3, tessellation: 32 },
        this.scene
      );
      target.position = targetData.pos.clone();
      target.rotation.x = Math.PI / 2;

      const targetMat = new StandardMaterial(`targetMat_${targetData.name}`, this.scene);
      targetMat.diffuseColor = this.getDifficultyColor(targetData.difficulty);
      targetMat.emissiveColor = this.getDifficultyColor(targetData.difficulty).scale(0.3);
      targetMat.alpha = 0;
      target.material = targetMat;

      // Center marker
      const center = MeshBuilder.CreateDisc(
        `center_${targetData.name}`,
        { radius: 1, tessellation: 32 },
        this.scene
      );
      center.parent = target;
      center.position.y = 0.01;
      const centerMat = new StandardMaterial(`centerMat_${targetData.name}`, this.scene);
      centerMat.diffuseColor = Color3.White();
      centerMat.alpha = 0;
      center.material = centerMat;

      this.targets.push({
        mesh: target,
        name: targetData.name,
        basePosition: targetData.pos.clone(),
        pointValue: targetData.points,
        difficulty: targetData.difficulty,
        isActive: false,
        animation: null,
      });
    });
  }

  private getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): Color3 {
    switch (difficulty) {
      case 'easy':
        return new Color3(0.2, 0.8, 0.2);
      case 'medium':
        return new Color3(0.8, 0.8, 0.2);
      case 'hard':
        return new Color3(0.8, 0.2, 0.2);
    }
  }

  private setupInputHandling(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.isGameActive) return;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this.startAiming();
          break;
        case PointerEventTypes.POINTERUP:
          this.releaseThrow();
          break;
      }
    });
  }

  private startAiming(): void {
    if (!this.activeTarget || this.isAiming) return;

    this.isAiming = true;
    this.aimStartTime = Date.now();

    // Visual feedback
    if (this.football) {
      this.football.scaling = new Vector3(0.55, 0.9, 0.55);
    }

    this.updateGameState();
  }

  private releaseThrow(): void {
    if (!this.isAiming || !this.football || !this.activeTarget) return;

    this.isAiming = false;
    this.attempts++;

    const aimDuration = Date.now() - this.aimStartTime;
    const perfectAimTime = 500 + (10 - this.qb.release) * 50; // QB release affects optimal timing
    const aimAccuracy = 1 - Math.abs(aimDuration - perfectAimTime) / perfectAimTime;

    // Calculate throw success based on QB stats and timing
    const baseAccuracy = this.qb.accuracy / 10;
    const throwAccuracy = (baseAccuracy * 0.6 + aimAccuracy * 0.4);

    // Random factor based on difficulty
    const difficultyModifier =
      this.activeTarget.difficulty === 'easy' ? 0.9 :
      this.activeTarget.difficulty === 'medium' ? 0.75 : 0.6;

    const successRoll = Math.random();
    const isSuccess = successRoll < throwAccuracy * difficultyModifier;
    const isPerfect = aimAccuracy > 0.85 && isSuccess;

    // Animate the throw
    this.animateThrow(isSuccess, isPerfect);
  }

  private animateThrow(isSuccess: boolean, isPerfect: boolean): void {
    if (!this.football || !this.activeTarget) return;

    const startPos = this.football.position.clone();
    const targetPos = isSuccess
      ? this.activeTarget.mesh.position.clone()
      : this.activeTarget.mesh.position.add(
          new Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
          )
        );

    const throwSpeed = 20 + this.qb.armStrength * 3;
    const distance = Vector3.Distance(startPos, targetPos);
    const duration = (distance / throwSpeed) * 1000;

    // Reset football scale
    this.football.scaling = new Vector3(0.6, 1, 0.6);

    // Create throw animation
    const throwAnim = new Animation(
      'throwAnim',
      'position',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const arcHeight = distance * 0.15;
    const keys = [];
    const totalFrames = Math.round(duration / 16.67);

    for (let i = 0; i <= totalFrames; i++) {
      const t = i / totalFrames;
      const pos = Vector3.Lerp(startPos, targetPos, t);
      pos.y += Math.sin(t * Math.PI) * arcHeight;
      keys.push({ frame: i, value: pos });
    }

    throwAnim.setKeys(keys);
    this.football.animations = [throwAnim];

    this.scene.beginAnimation(this.football, 0, totalFrames, false, 1, () => {
      this.onThrowComplete(isSuccess, isPerfect);
    });

    // Add spiral rotation
    const rotAnim = new Animation(
      'rotAnim',
      'rotation.z',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    rotAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: totalFrames, value: Math.PI * 4 },
    ]);
    this.football.animations.push(rotAnim);
  }

  private onThrowComplete(isSuccess: boolean, isPerfect: boolean): void {
    if (!this.activeTarget) return;

    if (isSuccess) {
      this.completions++;
      this.streak++;
      this.longestStreak = Math.max(this.longestStreak, this.streak);

      // Calculate points with streak multiplier
      let points = this.activeTarget.pointValue;
      if (this.streak >= 3) {
        points = Math.floor(points * (1 + (this.streak - 2) * 0.25));
      }

      if (isPerfect) {
        points = Math.floor(points * 1.5);
        this.perfectThrows++;
      }

      // Touchdown bonus
      if (this.activeTarget.name === 'End Zone') {
        this.touchdowns++;
        points += 100;
      }

      this.score += points;

      // Success particles
      this.createCompletionEffect(this.activeTarget.mesh.position);
    } else {
      this.streak = 0;
    }

    // Hide current target
    this.deactivateTarget(this.activeTarget);
    this.activeTarget = null;

    // Reset football position
    if (this.football) {
      this.football.position = new Vector3(0, 2, 40);
      this.football.rotation.z = 0;
    }

    this.updateGameState();
  }

  private createCompletionEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('completion', 50, this.scene);
    particleSystem.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABSSURBVFiF7c4xCgAgDATBu/9/Wa1EULGwOWYaS0gDBCAAAgCAP3TOvevee48BAAAAAIDP+HwGRgAAgP8rqvq+FQMAAADwY0VV37cCAABYZAFm8Qnqh8pTqwAAAABJRU5ErkJggg==',
      this.scene
    );

    particleSystem.emitter = position;
    particleSystem.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5);

    particleSystem.color1 = new Color4(0.2, 0.8, 0.2, 1);
    particleSystem.color2 = new Color4(0.8, 0.8, 0.2, 1);
    particleSystem.colorDead = new Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.8;

    particleSystem.emitRate = 100;

    particleSystem.gravity = new Vector3(0, -5, 0);

    particleSystem.direction1 = new Vector3(-2, 2, -2);
    particleSystem.direction2 = new Vector3(2, 4, 2);

    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1000);
    }, 200);
  }

  private activateTarget(target: Target): void {
    target.isActive = true;
    const mat = target.mesh.material as StandardMaterial;
    mat.alpha = 1;

    // Get center disc and show it
    const center = target.mesh.getChildren()[0] as Mesh;
    if (center && center.material) {
      (center.material as StandardMaterial).alpha = 0.8;
    }

    // Add movement animation for medium/hard targets
    if (target.difficulty !== 'easy') {
      const moveRange = target.difficulty === 'hard' ? 8 : 5;
      const moveSpeed = target.difficulty === 'hard' ? 1.5 : 1;

      const moveAnim = new Animation(
        'moveAnim',
        'position.x',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const baseX = target.basePosition.x;
      moveAnim.setKeys([
        { frame: 0, value: baseX - moveRange / 2 },
        { frame: 30 / moveSpeed, value: baseX + moveRange / 2 },
        { frame: 60 / moveSpeed, value: baseX - moveRange / 2 },
      ]);

      target.mesh.animations = [moveAnim];
      this.scene.beginAnimation(target.mesh, 0, 60 / moveSpeed, true);
      target.animation = moveAnim;
    }

    // Pulsing effect
    const pulseAnim = new Animation(
      'pulseAnim',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    pulseAnim.setKeys([
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 30, value: new Vector3(1.1, 1.1, 1.1) },
      { frame: 60, value: new Vector3(1, 1, 1) },
    ]);

    target.mesh.animations.push(pulseAnim);
    this.scene.beginAnimation(target.mesh, 0, 60, true, 1);
  }

  private deactivateTarget(target: Target): void {
    target.isActive = false;
    this.scene.stopAnimation(target.mesh);

    const mat = target.mesh.material as StandardMaterial;
    mat.alpha = 0;

    const center = target.mesh.getChildren()[0] as Mesh;
    if (center && center.material) {
      (center.material as StandardMaterial).alpha = 0;
    }

    target.mesh.position = target.basePosition.clone();
    target.mesh.scaling = new Vector3(1, 1, 1);
  }

  private spawnRandomTarget(): void {
    if (!this.isGameActive) return;

    // Deactivate current target if exists
    if (this.activeTarget) {
      this.deactivateTarget(this.activeTarget);
    }

    // Filter inactive targets
    const availableTargets = this.targets.filter((t) => !t.isActive);
    if (availableTargets.length === 0) return;

    // Weighted random selection based on game progress
    const elapsed = Date.now() - this.gameStartTime;
    const progress = elapsed / GAME_DURATION;

    // Later in game = harder targets more likely
    let target: Target;
    if (progress > 0.7 && Math.random() > 0.4) {
      const hardTargets = availableTargets.filter((t) => t.difficulty === 'hard');
      target = hardTargets.length > 0
        ? hardTargets[Math.floor(Math.random() * hardTargets.length)]
        : availableTargets[Math.floor(Math.random() * availableTargets.length)];
    } else if (progress > 0.4 && Math.random() > 0.5) {
      const mediumTargets = availableTargets.filter((t) => t.difficulty !== 'easy');
      target = mediumTargets.length > 0
        ? mediumTargets[Math.floor(Math.random() * mediumTargets.length)]
        : availableTargets[Math.floor(Math.random() * availableTargets.length)];
    } else {
      target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    }

    this.activeTarget = target;
    this.activateTarget(target);
    this.updateGameState();
  }

  private updateGameState(): void {
    const timeRemaining = Math.max(
      0,
      GAME_DURATION - (Date.now() - this.gameStartTime)
    );

    this.onGameStateChange({
      score: this.score,
      timeRemaining,
      completions: this.completions,
      attempts: this.attempts,
      streak: this.streak,
      currentTarget: this.activeTarget?.name || '',
      isAiming: this.isAiming,
    });
  }

  async unlockAudio(): Promise<void> {
    // Audio unlock on user interaction
    Engine.audioEngine?.unlock();
  }

  startGame(): void {
    // Reset state
    this.score = 0;
    this.completions = 0;
    this.attempts = 0;
    this.streak = 0;
    this.longestStreak = 0;
    this.touchdowns = 0;
    this.perfectThrows = 0;
    this.isGameActive = true;
    this.gameStartTime = Date.now();

    // Reset football position
    if (this.football) {
      this.football.position = new Vector3(0, 2, 40);
    }

    // Start target spawning
    this.spawnRandomTarget();
    this.targetInterval = setInterval(() => {
      this.spawnRandomTarget();
    }, TARGET_SPAWN_INTERVAL);

    // Game timer
    this.gameInterval = setInterval(() => {
      this.updateGameState();

      const timeRemaining = GAME_DURATION - (Date.now() - this.gameStartTime);
      if (timeRemaining <= 0) {
        this.endGame();
      }
    }, 100);

    this.updateGameState();
  }

  private endGame(): void {
    this.isGameActive = false;

    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    if (this.targetInterval) {
      clearInterval(this.targetInterval);
      this.targetInterval = null;
    }

    // Deactivate all targets
    this.targets.forEach((target) => {
      if (target.isActive) {
        this.deactivateTarget(target);
      }
    });
    this.activeTarget = null;

    const completionPercentage =
      this.attempts > 0
        ? Math.round((this.completions / this.attempts) * 100)
        : 0;

    this.onGameOver({
      finalScore: this.score,
      completions: this.completions,
      attempts: this.attempts,
      completionPercentage,
      longestStreak: this.longestStreak,
      touchdowns: this.touchdowns,
      perfectThrows: this.perfectThrows,
      durationSeconds: Math.round(GAME_DURATION / 1000),
      qbId: this.qb.id,
    });
  }

  dispose(): void {
    this.isGameActive = false;

    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }

    if (this.targetInterval) {
      clearInterval(this.targetInterval);
    }

    window.removeEventListener('resize', () => this.engine.resize());
    this.scene.dispose();
    this.engine.dispose();
  }
}
