/**
 * Blaze Backyard Baseball - Core Game Engine
 * A 30-90 second batting-only microgame for BlazeSportsIntel.com
 *
 * 100% Original IP - No Humongous Entertainment content
 * Built with Babylon.js 7.x + Havok Physics
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
  PBRMaterial,
  Color3,
  Color4,
  PhysicsAggregate,
  PhysicsShapeType,
  HavokPlugin,
  Mesh,
  ParticleSystem,
  Texture,
  Sound,
  Animation,
  TrailMesh,
  ShadowGenerator,
  DefaultRenderingPipeline,
} from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import type { BackyardCharacter } from '@data/backyardCharacters';
import type { BackyardFieldConfig } from '@data/backyardField';
import { AudioManager } from './AudioManager';

/** Game configuration passed to engine */
export interface BackyardGameConfig {
  canvas: HTMLCanvasElement;
  character: BackyardCharacter;
  fieldConfig: BackyardFieldConfig;
  onGameStateChange: (state: BackyardGameState) => void;
  onGameOver: (result: GameResult) => void;
}

/** Current game state during play */
export interface BackyardGameState {
  score: number;
  outs: number;
  streak: number;
  pitchCount: number;
  lastHitType: HitType | null;
  multiplier: number;
  timeRemaining: number;
}

/** Final game result for submission */
export interface GameResult {
  finalScore: number;
  totalPitches: number;
  totalHits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  whiffs: number;
  longestStreak: number;
  characterId: string;
  durationSeconds: number;
}

/** Types of hits in the game */
export enum HitType {
  WHIFF = 'whiff',
  GROUNDER = 'grounder',
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  HOME_RUN = 'home_run',
}

/** Scoring configuration */
const SCORING = {
  [HitType.WHIFF]: 0,
  [HitType.GROUNDER]: 0,
  [HitType.SINGLE]: 100,
  [HitType.DOUBLE]: 200,
  [HitType.TRIPLE]: 350,
  [HitType.HOME_RUN]: 500,
} as const;

/** Brand colors */
const COLORS = {
  baseball: {
    red: '#CC0000',
    green: '#228B22',
    yellow: '#FFD700',
    gray: '#4A4A4A',
    cream: '#F5F5DC',
  },
  blaze: {
    burntOrange: '#BF5700',
    charcoal: '#1A1A1A',
    ember: '#FF6B35',
  },
} as const;

/** Haptic feedback patterns */
const HAPTIC = {
  TAP: [10],
  SWING: [20, 30, 40], // Build-up swing pattern
  HIT: [50],
  MISS: [10, 20, 10],
  HOME_RUN: [50, 100, 50, 100, 50], // Celebration pattern
};

/**
 * Mobile touch controls with visual button and haptic feedback
 */
class MobileControls {
  private container: HTMLDivElement | null = null;
  private swingButton: HTMLDivElement | null = null;
  private isPressing: boolean = false;
  private swingCallback: (() => void) | null = null;
  private touchId: number | null = null;

  constructor(onSwing: () => void) {
    this.swingCallback = onSwing;
    this.createVisualControls();
    this.setupTouchHandlers();
  }

  private createVisualControls(): void {
    // Main container
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 200px;
      pointer-events: none;
      z-index: 500;
      display: none;
    `;

    // Big swing button - full width at bottom
    this.swingButton = document.createElement('div');
    this.swingButton.id = 'swing-button';
    this.swingButton.innerHTML = `
      <div class="swing-button-inner">
        <span class="swing-text">SWING!</span>
        <span class="swing-hint">Tap anywhere</span>
      </div>
    `;
    this.swingButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: min(300px, 80vw);
      height: 100px;
      background: linear-gradient(135deg, #BF5700 0%, #FF6B35 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
      box-shadow: 0 8px 30px rgba(191, 87, 0, 0.5),
                  0 4px 15px rgba(0, 0, 0, 0.3),
                  inset 0 2px 0 rgba(255, 255, 255, 0.2);
      transition: transform 0.1s ease, box-shadow 0.1s ease;
      cursor: pointer;
    `;

    // Add inner styling
    const style = document.createElement('style');
    style.textContent = `
      .swing-button-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .swing-text {
        font-size: 28px;
        font-weight: 900;
        color: white;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .swing-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      #swing-button.pressing {
        transform: translateX(-50%) scale(0.95);
        box-shadow: 0 4px 15px rgba(191, 87, 0, 0.4),
                    0 2px 8px rgba(0, 0, 0, 0.3),
                    inset 0 2px 0 rgba(255, 255, 255, 0.1);
      }
      #swing-button.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
      #swing-button.ready {
        animation: pulse-ready 1s ease-in-out infinite;
      }
      @keyframes pulse-ready {
        0%, 100% { box-shadow: 0 8px 30px rgba(191, 87, 0, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3); }
        50% { box-shadow: 0 8px 40px rgba(255, 107, 53, 0.8), 0 4px 20px rgba(0, 0, 0, 0.4); }
      }

      /* Touch feedback ripple */
      @keyframes swing-ripple {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .swing-ripple {
        position: absolute;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        pointer-events: none;
        animation: swing-ripple 0.4s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    this.container.appendChild(this.swingButton);
    document.body.appendChild(this.container);
  }

  private setupTouchHandlers(): void {
    if (!this.swingButton) return;

    // Touch start
    this.swingButton.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        if (this.touchId !== null) return;

        const touch = e.changedTouches[0];
        this.touchId = touch.identifier;
        this.isPressing = true;
        this.swingButton!.classList.add('pressing');

        // Trigger haptic
        this.triggerHaptic(HAPTIC.TAP);

        // Add ripple effect
        this.addRipple(touch.clientX, touch.clientY);

        // Trigger swing
        if (this.swingCallback) {
          this.triggerHaptic(HAPTIC.SWING);
          this.swingCallback();
        }
      },
      { passive: false }
    );

    // Touch end
    this.swingButton.addEventListener(
      'touchend',
      (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchId) {
            this.touchId = null;
            this.isPressing = false;
            this.swingButton!.classList.remove('pressing');
            break;
          }
        }
      },
      { passive: false }
    );

    // Touch cancel
    this.swingButton.addEventListener(
      'touchcancel',
      () => {
        this.touchId = null;
        this.isPressing = false;
        this.swingButton!.classList.remove('pressing');
      },
      { passive: false }
    );

    // Mouse support (for testing on desktop)
    this.swingButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isPressing = true;
      this.swingButton!.classList.add('pressing');
      this.addRipple(e.clientX, e.clientY);

      if (this.swingCallback) {
        this.swingCallback();
      }
    });

    this.swingButton.addEventListener('mouseup', () => {
      this.isPressing = false;
      this.swingButton!.classList.remove('pressing');
    });

    this.swingButton.addEventListener('mouseleave', () => {
      this.isPressing = false;
      this.swingButton!.classList.remove('pressing');
    });
  }

  private addRipple(x: number, y: number): void {
    if (!this.swingButton) return;

    const rect = this.swingButton.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'swing-ripple';
    ripple.style.left = `${x - rect.left - 50}px`;
    ripple.style.top = `${y - rect.top - 50}px`;
    this.swingButton.appendChild(ripple);

    setTimeout(() => ripple.remove(), 400);
  }

  private triggerHaptic(pattern: number[]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics not available
      }
    }
  }

  /** Trigger haptic for hit result */
  public hapticForHit(hitType: HitType): void {
    switch (hitType) {
      case HitType.HOME_RUN:
        this.triggerHaptic(HAPTIC.HOME_RUN);
        break;
      case HitType.TRIPLE:
      case HitType.DOUBLE:
      case HitType.SINGLE:
        this.triggerHaptic(HAPTIC.HIT);
        break;
      case HitType.WHIFF:
      case HitType.GROUNDER:
        this.triggerHaptic(HAPTIC.MISS);
        break;
    }
  }

  /** Show controls */
  public show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /** Hide controls */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /** Enable/disable swing button */
  public setEnabled(enabled: boolean): void {
    if (this.swingButton) {
      if (enabled) {
        this.swingButton.classList.remove('disabled');
        this.swingButton.classList.add('ready');
      } else {
        this.swingButton.classList.add('disabled');
        this.swingButton.classList.remove('ready');
      }
    }
  }

  /** Clean up */
  public dispose(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.swingButton = null;
    this.swingCallback = null;
  }
}

export class BackyardGameEngine {
  private engine: Engine;
  private scene: Scene;
  private camera!: ArcRotateCamera;
  private havokInstance: any;

  // Game objects
  private ball: Mesh | null = null;
  private ballPhysics: PhysicsAggregate | null = null;
  private bat: Mesh | null = null;
  private batter: Mesh | null = null;
  private pitcher: Mesh | null = null;

  // Visual effects
  private ballTrail: TrailMesh | null = null;
  private hitParticles: ParticleSystem | null = null;
  private dustParticles: ParticleSystem | null = null;
  private shadowGenerator: ShadowGenerator | null = null;

  // Audio
  private audioManager: AudioManager | null = null;

  // Mobile controls
  private mobileControls: MobileControls | null = null;

  // Game state
  private gameState: BackyardGameState;
  private gameResult: GameResult;
  private isPitching: boolean = false;
  private canSwing: boolean = false;
  private pitchStartTime: number = 0;
  private perfectSwingTime: number = 0;
  private gameStartTime: number = 0;
  private isGameOver: boolean = false;
  private longestStreak: number = 0;

  // Configuration
  private config: BackyardGameConfig;
  private readonly GAME_DURATION_MS = 60000; // 60 second game
  private readonly PITCH_SPEED_BASE = 25; // Base pitch velocity in m/s
  private readonly SWING_WINDOW_MS = 150; // Window for perfect timing

  /** Factory method to create game engine */
  public static async create(config: BackyardGameConfig): Promise<BackyardGameEngine> {
    const engine = new BackyardGameEngine(config);
    await engine.initialize();
    return engine;
  }

  private constructor(config: BackyardGameConfig) {
    this.config = config;

    // Initialize Babylon engine with WebGL2
    this.engine = new Engine(config.canvas, true, {
      adaptToDeviceRatio: true,
      powerPreference: 'high-performance',
      antialias: true,
      stencil: true,
    });

    this.scene = new Scene(this.engine);

    // Initialize game state
    this.gameState = {
      score: 0,
      outs: 0,
      streak: 0,
      pitchCount: 0,
      lastHitType: null,
      multiplier: 1,
      timeRemaining: this.GAME_DURATION_MS,
    };

    // Initialize game result tracker
    this.gameResult = {
      finalScore: 0,
      totalPitches: 0,
      totalHits: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      whiffs: 0,
      longestStreak: 0,
      characterId: config.character.id,
      durationSeconds: 0,
    };
  }

  private async initialize(): Promise<void> {
    // Setup camera - isometric/top-down backyard view
    this.setupCamera();

    // Setup lighting
    this.setupLighting();

    // Setup post-processing
    this.setupPostProcessing();

    // Initialize Havok physics
    await this.initializePhysics();

    // Create the backyard field
    this.createField();

    // Create players
    this.createPlayers();

    // Setup visual effects
    this.createVisualEffects();

    // Setup audio
    this.setupAudio();

    // Setup input handlers
    this.setupInputHandlers();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    // Handle resize
    window.addEventListener('resize', () => this.engine.resize());
  }

  private setupCamera(): void {
    // Isometric-style camera angle looking down at home plate
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2, // alpha - behind home plate
      Math.PI / 4, // beta - 45 degree angle down
      30, // radius
      new Vector3(0, 0, 5), // target - slightly in front of home plate
      this.scene
    );

    // Limit camera movement for consistent gameplay
    this.camera.lowerRadiusLimit = 25;
    this.camera.upperRadiusLimit = 35;
    this.camera.lowerBetaLimit = Math.PI / 6;
    this.camera.upperBetaLimit = Math.PI / 3;

    // Disable user camera control during gameplay
    this.camera.attachControl(this.config.canvas, false);
    this.camera.inputs.clear();
  }

  private setupLighting(): void {
    // Warm afternoon sun
    const sunLight = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.5), this.scene);
    sunLight.intensity = 1.0;
    sunLight.diffuse = new Color3(1.0, 0.95, 0.85);
    sunLight.position = new Vector3(30, 50, -30);

    // Enable shadows
    this.shadowGenerator = new ShadowGenerator(1024, sunLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurScale = 2;

    // Ambient fill light
    const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.4;
    ambientLight.diffuse = new Color3(0.9, 0.95, 1.0);
    ambientLight.groundColor = new Color3(0.4, 0.5, 0.3);

    // Sky color
    this.scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
  }

  private setupPostProcessing(): void {
    const pipeline = new DefaultRenderingPipeline('pipeline', true, this.scene, [this.camera]);

    // Bloom for nice glow on hits
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.7;
    pipeline.bloomWeight = 0.3;
    pipeline.bloomKernel = 64;

    // Subtle vignette
    if (pipeline.imageProcessing) {
      pipeline.imageProcessing.vignetteEnabled = true;
      pipeline.imageProcessing.vignetteWeight = 1.0;
      pipeline.imageProcessing.vignetteStretch = 0.5;
    }

    // Anti-aliasing
    pipeline.fxaaEnabled = true;
    pipeline.samples = 4;
  }

  private async initializePhysics(): Promise<void> {
    this.havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, this.havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
  }

  private createField(): void {
    const fieldConfig = this.config.fieldConfig;

    // Ground plane - backyard grass
    const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, this.scene);
    const grassMat = new PBRMaterial('grass', this.scene);
    grassMat.albedoColor = Color3.FromHexString(COLORS.baseball.green);
    grassMat.roughness = 0.9;
    grassMat.metallic = 0;
    ground.material = grassMat;
    ground.receiveShadows = true;

    // Dirt infield
    const infield = MeshBuilder.CreateDisc('infield', { radius: 15 }, this.scene);
    infield.rotation.x = Math.PI / 2;
    infield.position.y = 0.01;
    const dirtMat = new PBRMaterial('dirt', this.scene);
    dirtMat.albedoColor = new Color3(0.6, 0.4, 0.25);
    dirtMat.roughness = 1.0;
    infield.material = dirtMat;
    infield.receiveShadows = true;

    // Home plate
    const homePlate = MeshBuilder.CreateBox(
      'homePlate',
      { width: 0.45, height: 0.02, depth: 0.45 },
      this.scene
    );
    homePlate.position = new Vector3(0, 0.02, 0);
    const plateMat = new StandardMaterial('plateMat', this.scene);
    plateMat.diffuseColor = Color3.White();
    homePlate.material = plateMat;

    // Pitcher's mound
    const mound = MeshBuilder.CreateCylinder(
      'mound',
      { height: 0.3, diameterTop: 2, diameterBottom: 3 },
      this.scene
    );
    mound.position = new Vector3(0, 0.15, 18);
    mound.material = dirtMat;

    // Pitcher's rubber
    const rubber = MeshBuilder.CreateBox(
      'rubber',
      { width: 0.6, height: 0.05, depth: 0.15 },
      this.scene
    );
    rubber.position = new Vector3(0, 0.32, 18);
    rubber.material = plateMat;

    // Base paths (white lines)
    this.createBasePaths();

    // Backyard fence
    this.createFence(fieldConfig);

    // Environmental props based on field theme
    this.createBackyardProps(fieldConfig);
  }

  private createBasePaths(): void {
    const lineMat = new StandardMaterial('lineMat', this.scene);
    lineMat.diffuseColor = Color3.White();
    lineMat.emissiveColor = new Color3(0.1, 0.1, 0.1);

    // Foul lines
    const foulLineLength = 50;
    const leftLine = MeshBuilder.CreateBox(
      'leftFoulLine',
      { width: 0.1, height: 0.01, depth: foulLineLength },
      this.scene
    );
    leftLine.position = new Vector3(
      (-foulLineLength / 2) * 0.707,
      0.02,
      (foulLineLength / 2) * 0.707
    );
    leftLine.rotation.y = Math.PI / 4;
    leftLine.material = lineMat;

    const rightLine = MeshBuilder.CreateBox(
      'rightFoulLine',
      { width: 0.1, height: 0.01, depth: foulLineLength },
      this.scene
    );
    rightLine.position = new Vector3(
      (foulLineLength / 2) * 0.707,
      0.02,
      (foulLineLength / 2) * 0.707
    );
    rightLine.rotation.y = -Math.PI / 4;
    rightLine.material = lineMat;

    // Batter's box
    const boxWidth = 1.2;
    const boxDepth = 1.8;
    const boxThickness = 0.05;

    [-1, 1].forEach((side) => {
      const box = MeshBuilder.CreateBox(
        `batterBox_${side > 0 ? 'right' : 'left'}`,
        { width: boxWidth, height: 0.01, depth: boxDepth },
        this.scene
      );
      box.position = new Vector3(side * 1.2, 0.02, -0.3);
      const boxMat = new StandardMaterial('boxMat', this.scene);
      boxMat.diffuseColor = Color3.White();
      boxMat.alpha = 0.8;
      box.material = boxMat;
    });
  }

  private createFence(config: BackyardFieldConfig): void {
    const fenceHeight = 2.5;
    const fenceMat = new StandardMaterial('fenceMat', this.scene);
    fenceMat.diffuseColor = new Color3(0.3, 0.2, 0.1);

    // Create curved outfield fence
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI / 2) * (i / segments) - Math.PI / 4;
      const distance =
        config.dimensions.centerField +
        Math.sin(Math.abs(angle) * 2) *
          (config.dimensions.centerField - config.dimensions.leftField);

      const x = Math.sin(angle) * distance;
      const z = Math.cos(angle) * distance;

      const post = MeshBuilder.CreateCylinder(
        `fencePost_${i}`,
        { height: fenceHeight, diameter: 0.15 },
        this.scene
      );
      post.position = new Vector3(x, fenceHeight / 2, z);
      post.material = fenceMat;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(post);
      }
    }
  }

  private createBackyardProps(config: BackyardFieldConfig): void {
    // Add environmental props based on field theme
    const theme = config.theme;

    // Tree (present in most backyard themes)
    if (theme !== 'rooftop') {
      const trunk = MeshBuilder.CreateCylinder(
        'treeTrunk',
        { height: 4, diameter: 0.8 },
        this.scene
      );
      trunk.position = new Vector3(-25, 2, 35);
      const trunkMat = new StandardMaterial('trunkMat', this.scene);
      trunkMat.diffuseColor = new Color3(0.4, 0.25, 0.1);
      trunk.material = trunkMat;

      const leaves = MeshBuilder.CreateSphere('treeLeaves', { diameter: 6 }, this.scene);
      leaves.position = new Vector3(-25, 6, 35);
      const leavesMat = new StandardMaterial('leavesMat', this.scene);
      leavesMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
      leaves.material = leavesMat;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(trunk);
        this.shadowGenerator.addShadowCaster(leaves);
      }
    }

    // Scoreboard (simple box for now)
    const scoreboard = MeshBuilder.CreateBox(
      'scoreboard',
      { width: 4, height: 2, depth: 0.3 },
      this.scene
    );
    scoreboard.position = new Vector3(20, 3, 40);
    scoreboard.rotation.y = -Math.PI / 6;
    const boardMat = new StandardMaterial('boardMat', this.scene);
    boardMat.diffuseColor = Color3.FromHexString(COLORS.blaze.charcoal);
    scoreboard.material = boardMat;
  }

  private createPlayers(): void {
    const character = this.config.character;

    // Batter (stylized capsule for now - will be replaced with proper model)
    this.batter = MeshBuilder.CreateCapsule('batter', { radius: 0.4, height: 1.8 }, this.scene);
    this.batter.position = new Vector3(-1, 0.9, -0.3);
    const batterMat = new StandardMaterial('batterMat', this.scene);
    batterMat.diffuseColor = Color3.FromHexString(character.uniformColor);
    this.batter.material = batterMat;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.batter);
    }

    // Bat
    this.bat = MeshBuilder.CreateCylinder(
      'bat',
      { height: 1.0, diameterTop: 0.08, diameterBottom: 0.05 },
      this.scene
    );
    this.bat.position = new Vector3(-0.5, 1.2, -0.3);
    this.bat.rotation.z = Math.PI / 4;
    const batMat = new StandardMaterial('batMat', this.scene);
    batMat.diffuseColor = new Color3(0.6, 0.4, 0.2);
    this.bat.material = batMat;

    // Pitcher (simplified)
    this.pitcher = MeshBuilder.CreateCapsule('pitcher', { radius: 0.4, height: 1.8 }, this.scene);
    this.pitcher.position = new Vector3(0, 0.9, 18);
    const pitcherMat = new StandardMaterial('pitcherMat', this.scene);
    pitcherMat.diffuseColor = new Color3(0.3, 0.3, 0.7);
    this.pitcher.material = pitcherMat;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.pitcher);
    }
  }

  private createVisualEffects(): void {
    // Hit particles (burst on contact)
    this.hitParticles = new ParticleSystem('hitParticles', 100, this.scene);
    this.hitParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );
    this.hitParticles.emitter = Vector3.Zero();
    this.hitParticles.minSize = 0.1;
    this.hitParticles.maxSize = 0.3;
    this.hitParticles.minLifeTime = 0.2;
    this.hitParticles.maxLifeTime = 0.5;
    this.hitParticles.emitRate = 200;
    this.hitParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.hitParticles.gravity = new Vector3(0, -9.81, 0);
    this.hitParticles.direction1 = new Vector3(-2, 2, -2);
    this.hitParticles.direction2 = new Vector3(2, 4, 2);
    this.hitParticles.color1 = Color3.FromHexString(COLORS.baseball.yellow).toColor4(1);
    this.hitParticles.color2 = Color3.FromHexString(COLORS.blaze.ember).toColor4(1);
    this.hitParticles.colorDead = new Color4(1, 0.5, 0, 0);

    // Dust particles
    this.dustParticles = new ParticleSystem('dustParticles', 50, this.scene);
    this.dustParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/cloud.png',
      this.scene
    );
    this.dustParticles.emitter = Vector3.Zero();
    this.dustParticles.minSize = 0.2;
    this.dustParticles.maxSize = 0.5;
    this.dustParticles.minLifeTime = 0.3;
    this.dustParticles.maxLifeTime = 0.8;
    this.dustParticles.emitRate = 100;
    this.dustParticles.gravity = new Vector3(0, -2, 0);
    this.dustParticles.color1 = new Color4(0.6, 0.5, 0.4, 0.6);
    this.dustParticles.color2 = new Color4(0.4, 0.3, 0.2, 0.4);
    this.dustParticles.colorDead = new Color4(0.2, 0.15, 0.1, 0);
  }

  private setupAudio(): void {
    // Initialize procedural audio manager (no external files needed)
    this.audioManager = new AudioManager(this.scene, {
      masterVolume: 0.7,
      musicVolume: 0.4,
      sfxVolume: 0.8,
      ambientVolume: 0.3,
    });
  }

  /** Unlock audio - call on first user interaction */
  public async unlockAudio(): Promise<void> {
    await this.audioManager?.unlock();
    // Start ambient crowd noise after unlock
    this.audioManager?.startAmbientCrowd();
  }

  private setupInputHandlers(): void {
    // Create mobile controls with visual button
    this.mobileControls = new MobileControls(() => {
      if (this.canSwing) {
        this.handleSwing();
      }
    });

    // Click/tap to swing (for desktop and non-button taps)
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 0 && this.canSwing) {
        this.handleSwing();
      }
    };

    // Spacebar to swing
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.canSwing) {
        e.preventDefault();
        this.handleSwing();
      }
    });
  }

  /** Start the game */
  public startGame(): void {
    this.gameStartTime = performance.now();
    this.isGameOver = false;
    this.resetGameState();

    // Show mobile controls
    this.mobileControls?.show();
    this.mobileControls?.setEnabled(false);

    this.audioManager?.playSFX('game_start');
    this.throwPitch();
  }

  private resetGameState(): void {
    this.gameState = {
      score: 0,
      outs: 0,
      streak: 0,
      pitchCount: 0,
      lastHitType: null,
      multiplier: 1,
      timeRemaining: this.GAME_DURATION_MS,
    };

    this.gameResult = {
      finalScore: 0,
      totalPitches: 0,
      totalHits: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      whiffs: 0,
      longestStreak: 0,
      characterId: this.config.character.id,
      durationSeconds: 0,
    };

    this.longestStreak = 0;
    this.config.onGameStateChange(this.gameState);
  }

  private throwPitch(): void {
    if (this.isGameOver) return;

    this.isPitching = true;
    this.canSwing = false;
    this.audioManager?.playSFX('pitch_throw');

    // Create ball at pitcher
    if (this.ball) {
      this.ball.dispose();
      this.ballPhysics?.dispose();
    }

    this.ball = MeshBuilder.CreateSphere('ball', { diameter: 0.2 }, this.scene);
    this.ball.position = this.pitcher!.position.clone();
    this.ball.position.y = 1.5;

    const ballMat = new StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = Color3.White();
    this.ball.material = ballMat;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.ball);
    }

    // Create ball physics
    this.ballPhysics = new PhysicsAggregate(
      this.ball,
      PhysicsShapeType.SPHERE,
      { mass: 0.145, restitution: 0.5 },
      this.scene
    );

    // Create ball trail
    if (this.ballTrail) {
      this.ballTrail.dispose();
    }
    this.ballTrail = new TrailMesh('ballTrail', this.ball, this.scene, 0.08, 20, true);
    const trailMat = new StandardMaterial('trailMat', this.scene);
    trailMat.emissiveColor = Color3.White();
    trailMat.alpha = 0.4;
    this.ballTrail.material = trailMat;

    // Calculate pitch velocity based on character stats
    const character = this.config.character;
    const pitchVariation = (Math.random() - 0.5) * 5; // Add some randomness
    const pitchSpeed = this.PITCH_SPEED_BASE + pitchVariation;

    // Direction toward home plate
    const target = new Vector3(
      (Math.random() - 0.5) * 0.5, // Horizontal variation
      1.0 + (Math.random() - 0.5) * 0.4, // Height variation
      0
    );
    const direction = target.subtract(this.ball.position).normalize();
    const velocity = direction.scale(pitchSpeed);

    // Apply velocity
    this.ballPhysics.body.setLinearVelocity(velocity);

    // Record pitch timing
    this.pitchStartTime = performance.now();
    const distanceToPlate = 18; // meters
    const timeToPlate = (distanceToPlate / pitchSpeed) * 1000;
    this.perfectSwingTime = this.pitchStartTime + timeToPlate;

    // Enable swing window slightly before ball arrives
    setTimeout(() => {
      if (!this.isGameOver) {
        this.canSwing = true;
        this.mobileControls?.setEnabled(true);
      }
    }, timeToPlate * 0.6);

    // Check if pitch was not swung at
    setTimeout(() => {
      this.checkPitchResult();
    }, timeToPlate + 200);

    // Update state
    this.gameState.pitchCount++;
    this.gameResult.totalPitches++;
    this.config.onGameStateChange(this.gameState);
  }

  private handleSwing(): void {
    if (!this.canSwing || !this.ball || this.isGameOver) return;

    this.canSwing = false;
    this.mobileControls?.setEnabled(false);

    // Animate bat swing
    this.animateBatSwing();

    // Calculate swing timing
    const swingTime = performance.now();
    const timingOffset = swingTime - this.perfectSwingTime;

    // Determine hit result based on timing
    const hitType = this.calculateHitResult(timingOffset);

    // Process hit
    this.processHit(hitType);

    this.isPitching = false;
  }

  private animateBatSwing(): void {
    if (!this.bat) return;

    const swingAnimation = new Animation(
      'batSwing',
      'rotation.z',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: Math.PI / 4 },
      { frame: 10, value: -Math.PI / 3 },
      { frame: 20, value: Math.PI / 4 },
    ];
    swingAnimation.setKeys(keys);

    this.bat.animations = [swingAnimation];
    this.scene.beginAnimation(this.bat, 0, 20, false);
  }

  private calculateHitResult(timingOffset: number): HitType {
    const character = this.config.character;
    const contactBonus = character.contact / 10; // 0-1 bonus from contact stat
    const powerBonus = character.power / 10; // 0-1 bonus from power stat

    // Timing window adjustments based on contact skill
    const adjustedWindow = this.SWING_WINDOW_MS * (1 + contactBonus * 0.5);
    const absOffset = Math.abs(timingOffset);

    // Too early or too late = whiff
    if (absOffset > adjustedWindow * 2) {
      return HitType.WHIFF;
    }

    // Late swing = more likely grounder
    if (timingOffset > adjustedWindow * 1.5) {
      return Math.random() > 0.3 ? HitType.GROUNDER : HitType.SINGLE;
    }

    // Calculate hit quality based on timing
    const timingQuality = 1 - absOffset / adjustedWindow;
    const hitRoll = Math.random() * (1 + powerBonus);

    // Perfect timing + power = home run potential
    if (timingQuality > 0.9 && hitRoll > 0.85) {
      return HitType.HOME_RUN;
    }

    if (timingQuality > 0.8 && hitRoll > 0.7) {
      return HitType.TRIPLE;
    }

    if (timingQuality > 0.6 && hitRoll > 0.5) {
      return HitType.DOUBLE;
    }

    if (timingQuality > 0.3) {
      return HitType.SINGLE;
    }

    // Poor timing = grounder or whiff
    return Math.random() > 0.4 ? HitType.GROUNDER : HitType.WHIFF;
  }

  private processHit(hitType: HitType): void {
    this.gameState.lastHitType = hitType;

    // Trigger haptic feedback for hit result
    this.mobileControls?.hapticForHit(hitType);

    // Play sound effects based on hit type
    if (hitType !== HitType.WHIFF && hitType !== HitType.GROUNDER) {
      this.audioManager?.playSFX('bat_crack');

      // Particle effect at contact point
      if (this.hitParticles && this.ball) {
        this.hitParticles.emitter = this.ball.position.clone();
        this.hitParticles.start();
        setTimeout(() => this.hitParticles?.stop(), 200);
      }
    } else if (hitType === HitType.WHIFF) {
      this.audioManager?.playSFX('bat_miss');
    }

    // Calculate score with multiplier
    const baseScore = SCORING[hitType];
    const points = Math.floor(baseScore * this.gameState.multiplier);

    switch (hitType) {
      case HitType.WHIFF:
        this.gameResult.whiffs++;
        this.gameState.streak = 0;
        this.gameState.multiplier = 1;
        this.gameState.outs++;
        this.audioManager?.playSFX('strike');

        // Dust effect
        if (this.dustParticles && this.batter) {
          this.dustParticles.emitter = this.batter.position.clone();
          this.dustParticles.start();
          setTimeout(() => this.dustParticles?.stop(), 300);
        }
        break;

      case HitType.GROUNDER:
        this.gameState.streak = 0;
        this.gameState.multiplier = 1;
        this.gameState.outs++;
        this.audioManager?.playSFX('out');
        break;

      case HitType.SINGLE:
        this.gameState.score += points;
        this.gameState.streak++;
        this.gameResult.singles++;
        this.gameResult.totalHits++;
        this.updateMultiplier();
        this.audioManager?.playSFX('single');
        break;

      case HitType.DOUBLE:
        this.gameState.score += points;
        this.gameState.streak++;
        this.gameResult.doubles++;
        this.gameResult.totalHits++;
        this.updateMultiplier();
        this.audioManager?.playSFX('double');
        break;

      case HitType.TRIPLE:
        this.gameState.score += points;
        this.gameState.streak++;
        this.gameResult.triples++;
        this.gameResult.totalHits++;
        this.updateMultiplier();
        this.audioManager?.playSFX('triple');
        break;

      case HitType.HOME_RUN:
        this.gameState.score += points;
        this.gameState.streak++;
        this.gameResult.homeRuns++;
        this.gameResult.totalHits++;
        this.updateMultiplier();
        this.audioManager?.playSFX('home_run');
        break;
    }

    // Track longest streak
    if (this.gameState.streak > this.longestStreak) {
      this.longestStreak = this.gameState.streak;
    }

    // Animate ball trajectory for hits
    if (hitType !== HitType.WHIFF && this.ball && this.ballPhysics) {
      this.animateHitBall(hitType);
    }

    // Check game over conditions
    if (this.gameState.outs >= 3) {
      this.endGame();
      return;
    }

    this.config.onGameStateChange(this.gameState);

    // Throw next pitch after delay
    setTimeout(() => {
      if (!this.isGameOver) {
        this.disposeBall();
        this.throwPitch();
      }
    }, 1500);
  }

  private updateMultiplier(): void {
    // Increase multiplier based on streak
    if (this.gameState.streak >= 10) {
      this.gameState.multiplier = 3.0;
    } else if (this.gameState.streak >= 5) {
      this.gameState.multiplier = 2.0;
    } else if (this.gameState.streak >= 3) {
      this.gameState.multiplier = 1.5;
    }
  }

  private animateHitBall(hitType: HitType): void {
    if (!this.ball || !this.ballPhysics) return;

    // Calculate exit velocity and launch angle based on hit type
    let exitVelocity: number;
    let launchAngle: number;
    let sprayAngle: number;

    switch (hitType) {
      case HitType.SINGLE:
        exitVelocity = 25 + Math.random() * 10;
        launchAngle = 10 + Math.random() * 15;
        sprayAngle = (Math.random() - 0.5) * 60;
        break;
      case HitType.DOUBLE:
        exitVelocity = 35 + Math.random() * 10;
        launchAngle = 15 + Math.random() * 15;
        sprayAngle = (Math.random() - 0.5) * 70;
        break;
      case HitType.TRIPLE:
        exitVelocity = 40 + Math.random() * 10;
        launchAngle = 20 + Math.random() * 10;
        sprayAngle = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
        break;
      case HitType.HOME_RUN:
        exitVelocity = 45 + Math.random() * 15;
        launchAngle = 25 + Math.random() * 15;
        sprayAngle = (Math.random() - 0.5) * 40;
        break;
      default:
        exitVelocity = 15;
        launchAngle = -10;
        sprayAngle = (Math.random() - 0.5) * 90;
    }

    const launchRad = (launchAngle * Math.PI) / 180;
    const sprayRad = (sprayAngle * Math.PI) / 180;

    const hitVector = new Vector3(
      Math.sin(sprayRad) * Math.cos(launchRad) * exitVelocity,
      Math.sin(launchRad) * exitVelocity,
      Math.cos(sprayRad) * Math.cos(launchRad) * exitVelocity
    );

    this.ballPhysics.body.setLinearVelocity(hitVector);
  }

  private checkPitchResult(): void {
    if (!this.isPitching || this.isGameOver) return;

    // Ball passed without swing - counts as a strike (simplified rules)
    if (this.canSwing) {
      this.canSwing = false;
      this.processHit(HitType.WHIFF);
    }

    this.isPitching = false;
  }

  private disposeBall(): void {
    if (this.ball) {
      this.ball.dispose();
      this.ball = null;
    }
    if (this.ballPhysics) {
      this.ballPhysics.dispose();
      this.ballPhysics = null;
    }
    if (this.ballTrail) {
      this.ballTrail.dispose();
      this.ballTrail = null;
    }
  }

  private update(): void {
    if (this.isGameOver) return;

    // Update time remaining
    const elapsed = performance.now() - this.gameStartTime;
    this.gameState.timeRemaining = Math.max(0, this.GAME_DURATION_MS - elapsed);

    // Check time-based game over
    if (this.gameState.timeRemaining <= 0) {
      this.endGame();
      return;
    }

    // Update UI periodically
    if (Math.floor(elapsed / 100) !== Math.floor((elapsed - 100) / 100)) {
      this.config.onGameStateChange(this.gameState);
    }
  }

  private endGame(): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.canSwing = false;
    this.isPitching = false;

    // Hide mobile controls
    this.mobileControls?.hide();

    // Stop ambient crowd and play game over sound
    this.audioManager?.stopAmbientCrowd();
    this.audioManager?.playSFX('game_over');

    // Finalize game result
    this.gameResult.finalScore = this.gameState.score;
    this.gameResult.longestStreak = this.longestStreak;
    this.gameResult.durationSeconds = Math.floor((performance.now() - this.gameStartTime) / 1000);

    // Dispose ball
    this.disposeBall();

    // Callback with result
    this.config.onGameOver(this.gameResult);
  }

  /** Get current game state */
  public getGameState(): BackyardGameState {
    return { ...this.gameState };
  }

  /** Get final game result */
  public getGameResult(): GameResult {
    return { ...this.gameResult };
  }

  /** Clean up resources */
  public dispose(): void {
    this.isGameOver = true;
    this.disposeBall();
    this.mobileControls?.dispose();
    this.audioManager?.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
