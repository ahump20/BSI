/**
 * Blaze Blitz Football - Core Game Engine
 * A 60-90 second arcade football microgame for BlazeSportsIntel.com
 *
 * 100% Original IP - No NFL content
 * Built with Babylon.js 7.x + Havok Physics
 */

import {
  Engine,
  Scene,
  ArcRotateCamera,
  FollowCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Color4,
  Mesh,
  ParticleSystem,
  Texture,
  ShadowGenerator,
  DefaultRenderingPipeline,
  GlowLayer,
  SceneLoader,
  DynamicTexture,
} from '@babylonjs/core';

import { FootballField, FIELD_CONFIG } from './Field';
import { FootballPhysics, PassType } from './BallPhysics';
import { PlayerController, TouchController } from './PlayerController';
import { SteeringBehaviors, DefenderAI, SteeringAgent } from './SteeringAI';
import { AISystem, CoverageScheme, type DefenderRole } from './AISystem';
import { ScoreSystem } from './ScoreSystem';
import { AudioManager } from './AudioManager';
import { DriveSystem } from './DriveSystem';
import { PlaybookSystem, type EnhancedOffensivePlay, type GameSituation } from './PlaybookSystem';
import type { BlitzTeam, PlayerPosition } from '@data/teams';
import { FIREBIRDS, SHADOW_WOLVES, OFFENSIVE_POSITIONS, DEFENSIVE_POSITIONS } from '@data/teams';
import type { OffensivePlay, DefensivePlay, RouteType } from '@data/plays';
import { getAllOffensivePlays, getSmartDefensivePlay } from '@data/plays';
import { GenieSystem } from '../dynamics/GenieSystem';
import { PlayerType, PlayAction, FootballEntity, blitzIdToPlayerType } from '../dynamics/FootballAdapter';

/** Game phase */
export type GamePhase =
  | 'pre_snap'      // Selecting play, setting up
  | 'play_active'   // Ball is live
  | 'post_play'     // After whistle, before next play
  | 'game_over';    // Drive finished

/** Game state */
export interface BlitzGameState {
  score: number;
  yardsGained: number;
  touchdowns: number;
  firstDowns: number;
  bigPlays: number;       // 20+ yard plays
  turnovers: number;
  turboYards: number;     // Yards gained while using turbo
  stiffArms: number;
  jukes: number;
  tacklesMade: number;

  // Current drive info
  down: number;           // 1-4
  yardsToGo: number;
  lineOfScrimmage: number; // Yard line (0-100)
  timeRemaining: number;  // Milliseconds

  // Current play
  phase: GamePhase;
  currentPlay: OffensivePlay | null;
  longestPlay: number;
}

/** Final game result */
export interface BlitzGameResult {
  finalScore: number;
  yardsGained: number;
  touchdowns: number;
  firstDowns: number;
  bigPlays: number;
  turnovers: number;
  tacklesMade: number;
  stiffArms: number;
  jukes: number;
  turboYards: number;
  longestPlay: number;
  result: 'touchdown' | 'turnover' | 'timeout' | 'incomplete';
  durationSeconds: number;
  teamId: string;
}

/** Scoring configuration */
const SCORING = {
  yardsGained: 10,        // Per yard
  turboYards: 15,         // Per yard while turbo
  firstDown: 100,         // Bonus per first down
  bigPlay: 200,           // 20+ yard plays
  touchdown: 700,         // Touchdown bonus
  stiffArm: 50,           // Per successful stiff-arm
  juke: 75,               // Per successful juke
} as const;

/** Game configuration */
export interface BlitzGameConfig {
  canvas: HTMLCanvasElement;
  homeTeam: BlitzTeam;
  awayTeam: BlitzTeam;
  onGameStateChange: (state: BlitzGameState) => void;
  onGameOver: (result: BlitzGameResult) => void;
  onPlayFeedback?: (text: string, style: string) => void;
}

/** Brand colors */
const COLORS = {
  blaze: {
    burntOrange: '#BF5700',
    ember: '#FF6B35',
    gold: '#C9A227',
    charcoal: '#1A1A1A',
    midnight: '#0D0D0D',
  },
  arcade: {
    neonGreen: '#39FF14',
    hotPink: '#FF6EC7',
    constructionYellow: '#FFD700',
  },
} as const;

export class BlitzGameEngine {
  private engine: Engine;
  private scene: Scene;
  private camera!: FollowCamera;
  private shadowGenerator: ShadowGenerator | null = null;
  private glowLayer: GlowLayer | null = null;

  // Game components
  private field: FootballField | null = null;
  private ball: FootballPhysics | null = null;
  private playerController: PlayerController | null = null;
  private touchController: TouchController | null = null;
  private defenderAIs: DefenderAI[] = []; // legacy, kept for mesh sync
  private aiSystem: AISystem;
  private scoreSystem: ScoreSystem;

  // Player meshes
  private offensivePlayers: Map<string, Mesh> = new Map();
  private defensivePlayers: Map<string, Mesh> = new Map();
  private qbMesh: Mesh | null = null;

  // Visual effects
  private tackleParticles: ParticleSystem | null = null;
  private touchdownParticles: ParticleSystem | null = null;
  private turfSpray: ParticleSystem | null = null;
  private speedLines: ParticleSystem | null = null;
  private pipeline: DefaultRenderingPipeline | null = null;
  private skyDome: Mesh | null = null;

  // Camera effects
  private cameraShakeDuration = 0;
  private cameraShakeTimeRemaining = 0;
  private cameraShakeIntensity = 0;
  private cameraBaseRotationOffset = 180;

  // Cleanup tracking
  private resizeHandler: (() => void) | null = null;
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  private pendingIntervals: Set<ReturnType<typeof setInterval>> = new Set();

  // Audio
  private audioManager: AudioManager | null = null;

  // Genie Dynamics
  private genieSystem: GenieSystem | null = null;

  // New systems
  private driveSystem: DriveSystem;
  private playbookSystem: PlaybookSystem;

  // Game state
  private gameState: BlitzGameState;
  private config: BlitzGameConfig;
  private gameStartTime: number = 0;
  private isGameOver: boolean = false;
  private readonly GAME_DURATION_MS = 60000; // 60 seconds

  // Play state
  private selectedPlay: OffensivePlay | null = null;
  private defensivePlay: DefensivePlay | null = null;
  private ballCarrierId: string | null = null;
  private playStartYardLine: number = 0;

  /** Factory method */
  public static async create(config: BlitzGameConfig): Promise<BlitzGameEngine> {
    const engine = new BlitzGameEngine(config);
    await engine.initialize();
    return engine;
  }

  private constructor(config: BlitzGameConfig) {
    this.config = config;

    // Initialize Babylon engine
    this.engine = new Engine(config.canvas, true, {
      adaptToDeviceRatio: true,
      powerPreference: 'high-performance',
      antialias: true,
      stencil: true,
    });

    this.scene = new Scene(this.engine);

    // Initialize new systems
    this.driveSystem = new DriveSystem({ startingYardLine: 20 });
    this.playbookSystem = new PlaybookSystem();
    this.aiSystem = new AISystem();
    this.scoreSystem = new ScoreSystem({ quarterLengthSec: 120 });

    // Initialize game state
    this.gameState = {
      score: 0,
      yardsGained: 0,
      touchdowns: 0,
      firstDowns: 0,
      bigPlays: 0,
      turnovers: 0,
      turboYards: 0,
      stiffArms: 0,
      jukes: 0,
      tacklesMade: 0,
      down: 1,
      yardsToGo: 10,
      lineOfScrimmage: 20, // Start at own 20
      timeRemaining: this.GAME_DURATION_MS,
      phase: 'pre_snap',
      currentPlay: null,
      longestPlay: 0,
    };
  }

  private async initialize(): Promise<void> {
    this.setupCamera();
    this.setupLighting();
    this.createSkyDome();
    this.setupPostProcessing();
    this.createField();
    this.createPlayers();
    this.setupBall();
    this.setupControls();
    this.createVisualEffects();
    this.setupAudio();
    this.genieSystem = new GenieSystem(this.scene, this.glowLayer);

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    // Handle resize
    this.resizeHandler = () => this.engine.resize();
    window.addEventListener('resize', this.resizeHandler);
  }

  /** Setup procedural audio */
  private setupAudio(): void {
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
    this.audioManager?.startAmbientCrowd();
  }

  private setupCamera(): void {
    // Follow camera that tracks the ball carrier
    this.camera = new FollowCamera(
      'camera',
      new Vector3(0, 20, -15),
      this.scene
    );

    this.camera.heightOffset = 25;
    this.camera.radius = 35;
    this.camera.rotationOffset = 180;
    this.camera.cameraAcceleration = 0.1;
    this.camera.maxCameraSpeed = 20;
    this.cameraBaseRotationOffset = this.camera.rotationOffset;

    // Initial target (will be updated)
    const targetMesh = MeshBuilder.CreateBox('cameraTarget', { size: 0.1 }, this.scene);
    targetMesh.isVisible = false;
    targetMesh.position = new Vector3(0, 0, 20);
    this.camera.lockedTarget = targetMesh;
  }

  private setupLighting(): void {
    // Stadium lights (bright)
    const mainLight = new DirectionalLight(
      'mainLight',
      new Vector3(-0.5, -1, 0.5),
      this.scene
    );
    mainLight.intensity = 1.2;
    mainLight.diffuse = Color3.White();
    mainLight.position = new Vector3(50, 80, -50);

    // Shadows
    this.shadowGenerator = new ShadowGenerator(2048, mainLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurScale = 2;

    // Ambient fill
    const ambientLight = new HemisphericLight(
      'ambient',
      new Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.5;
    ambientLight.diffuse = new Color3(0.9, 0.9, 1.0);
    ambientLight.groundColor = new Color3(0.2, 0.4, 0.2);

    // Night sky
    this.scene.clearColor = new Color4(0.05, 0.05, 0.1, 1.0);

    // Rim/back light for depth
    const rimLight = new DirectionalLight('rimLight', new Vector3(-30, 40, 60).normalize(), this.scene);
    rimLight.intensity = 0.4;
    rimLight.diffuse = Color3.FromHexString('#FFF5E0');

    const fieldGlow = new HemisphericLight('fieldGlow', new Vector3(0, 1, 1), this.scene);
    fieldGlow.intensity = 0.2;
    fieldGlow.diffuse = Color3.FromHexString('#FFB870');
    fieldGlow.groundColor = new Color3(0.1, 0.1, 0.12);

    // Exponential fog
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.0008;
    this.scene.fogColor = new Color3(0.05, 0.05, 0.1);
  }

  private createSkyDome(): void {
    const dome = MeshBuilder.CreateSphere(
      'skyDome',
      { diameter: 500, segments: 32 },
      this.scene
    );
    const skyMat = new StandardMaterial('skyMat', this.scene);
    skyMat.backFaceCulling = false;
    skyMat.disableLighting = true;

    const texture = new DynamicTexture(
      'skyTexture',
      { width: 512, height: 512 },
      this.scene,
      true
    );
    const ctx = texture.getContext() as CanvasRenderingContext2D;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0B1020');
    gradient.addColorStop(0.5, '#141B2D');
    gradient.addColorStop(1, '#1B2235');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 1.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    texture.update();
    skyMat.diffuseTexture = texture;
    skyMat.emissiveColor = new Color3(0.4, 0.45, 0.6);
    dome.material = skyMat;
    dome.isPickable = false;
    this.skyDome = dome;
  }

  private setupPostProcessing(): void {
    const pipeline = new DefaultRenderingPipeline(
      'pipeline',
      true,
      this.scene,
      [this.camera]
    );

    // Bloom for arcade glow
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.6;
    pipeline.bloomWeight = 0.5;
    pipeline.bloomKernel = 64;

    // Glow layer for UI elements
    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.8;

    // Anti-aliasing
    pipeline.fxaaEnabled = true;
    pipeline.samples = 4;

    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 0.3;

    pipeline.grainEnabled = true;
    pipeline.grain.intensity = 8;
    pipeline.grain.animated = true;

    this.pipeline = pipeline;
  }

  private createField(): void {
    this.field = new FootballField(
      this.scene,
      this.config.homeTeam,
      this.config.awayTeam
    );
    this.field.build();
  }

  private createPlayers(): void {
    const homeTeam = this.config.homeTeam;
    const awayTeam = this.config.awayTeam;

    // Create offensive players (home team)
    OFFENSIVE_POSITIONS.forEach((pos) => {
      const player = this.createPlayerMesh(pos.id, homeTeam, true);
      this.offensivePlayers.set(pos.id, player);

      if (pos.id === 'qb') {
        this.qbMesh = player;
      }
    });

    // Create defensive players (away team) with AI
    DEFENSIVE_POSITIONS.forEach((pos) => {
      const player = this.createPlayerMesh(pos.id, awayTeam, false);
      this.defensivePlayers.set(pos.id, player);

      // Create AI for this defender
      const agent: SteeringAgent = {
        id: pos.id,
        position: player.position.clone(),
        velocity: Vector3.Zero(),
        maxSpeed: 12 + (awayTeam.speed / 10) * 5,
        maxForce: 20,
        mass: 1,
        rotation: 0,
      };

      const ai = new DefenderAI(agent, {
        pursuitLookAhead: 0.4,
        coverageAggressiveness: awayTeam.defense / 10,
      });

      this.defenderAIs.push(ai);

      // Register with AISystem v2
      this.aiSystem.addDefender(agent);
    });
  }

  private createPlayerMesh(
    id: string,
    team: BlitzTeam,
    isOffense: boolean
  ): Mesh {
    // Capsule body (blocky/low-poly style)
    const body = MeshBuilder.CreateCapsule(
      `player_${id}`,
      { radius: 0.5, height: 2 },
      this.scene
    );

    // Team color material
    const mat = new StandardMaterial(`playerMat_${id}`, this.scene);
    mat.diffuseColor = Color3.FromHexString(team.primaryColor);
    mat.specularColor = Color3.FromHexString(team.secondaryColor);
    body.material = mat;

    // Helmet (sphere on top)
    const helmet = MeshBuilder.CreateSphere(
      `helmet_${id}`,
      { diameter: 0.6 },
      this.scene
    );
    helmet.position.y = 1.1;
    helmet.parent = body;

    const helmetMat = new PBRMaterial(`helmetMat_${id}`, this.scene);
    helmetMat.albedoColor = Color3.FromHexString(team.helmetColor);
    helmetMat.metallic = 0.7;
    helmetMat.roughness = 0.25;
    helmet.material = helmetMat;

    // Add to shadow caster
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(body);
    }

    // Glow will be managed dynamically for ball carrier

    // Initial position off-field
    body.position.y = 1;
    body.position.x = isOffense ? -30 : 30;

    return body;
  }

  private setupBall(): void {
    this.ball = new FootballPhysics(this.scene, {
      catchRadius: 2.5,
      bulletVelocity: 50,
      touchVelocity: 38,
    });
    this.ball.initialize();
  }

  private setupControls(): void {
    // Keyboard/mouse controls
    this.playerController = new PlayerController(
      new Vector3(0, 0, this.gameState.lineOfScrimmage - 5),
      {
        baseSpeed: 15,
        turboMultiplier: 1.5,
        accelerationTime: 0.2,
      }
    );

    // Touch controls for mobile
    if ('ontouchstart' in window) {
      this.touchController = new TouchController(this.config.canvas);
    }
  }

  private createVisualEffects(): void {
    // Tackle impact particles
    this.tackleParticles = new ParticleSystem('tackleParticles', 100, this.scene);
    this.tackleParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );
    this.tackleParticles.emitter = Vector3.Zero();
    this.tackleParticles.minSize = 0.3;
    this.tackleParticles.maxSize = 0.8;
    this.tackleParticles.minLifeTime = 0.2;
    this.tackleParticles.maxLifeTime = 0.5;
    this.tackleParticles.emitRate = 150;
    this.tackleParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.tackleParticles.gravity = new Vector3(0, -10, 0);
    this.tackleParticles.direction1 = new Vector3(-3, 2, -3);
    this.tackleParticles.direction2 = new Vector3(3, 5, 3);
    this.tackleParticles.color1 = Color3.FromHexString(COLORS.arcade.neonGreen).toColor4(1);
    this.tackleParticles.color2 = Color3.FromHexString(COLORS.arcade.constructionYellow).toColor4(1);
    this.tackleParticles.colorDead = new Color4(0, 1, 0, 0);

    // Touchdown celebration particles
    this.touchdownParticles = new ParticleSystem('tdParticles', 500, this.scene);
    this.touchdownParticles.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );
    this.touchdownParticles.emitter = Vector3.Zero();
    this.touchdownParticles.minSize = 0.5;
    this.touchdownParticles.maxSize = 1.5;
    this.touchdownParticles.minLifeTime = 1;
    this.touchdownParticles.maxLifeTime = 2;
    this.touchdownParticles.emitRate = 200;
    this.touchdownParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.touchdownParticles.gravity = new Vector3(0, -5, 0);
    this.touchdownParticles.direction1 = new Vector3(-5, 10, -5);
    this.touchdownParticles.direction2 = new Vector3(5, 20, 5);
    this.touchdownParticles.color1 = Color3.FromHexString(COLORS.blaze.burntOrange).toColor4(1);
    this.touchdownParticles.color2 = Color3.FromHexString(COLORS.blaze.gold).toColor4(1);
    this.touchdownParticles.colorDead = new Color4(1, 0.5, 0, 0);

    // Turf spray - emitted on juke/spin moves
    this.turfSpray = new ParticleSystem('turfSpray', 30, this.scene);
    this.turfSpray.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );
    this.turfSpray.emitter = Vector3.Zero();
    this.turfSpray.minSize = 0.03;
    this.turfSpray.maxSize = 0.07;
    this.turfSpray.minLifeTime = 0.1;
    this.turfSpray.maxLifeTime = 0.3;
    this.turfSpray.emitRate = 80;
    this.turfSpray.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    this.turfSpray.gravity = new Vector3(0, -5, 0);
    this.turfSpray.direction1 = new Vector3(-1, 1, -1);
    this.turfSpray.direction2 = new Vector3(1, 2, 1);
    this.turfSpray.color1 = new Color4(0.4, 0.25, 0.1, 0.8);
    this.turfSpray.color2 = new Color4(0.3, 0.2, 0.08, 0.6);
    this.turfSpray.colorDead = new Color4(0.2, 0.15, 0.05, 0);

    // Speed lines - emitted during turbo
    this.speedLines = new ParticleSystem('speedLines', 20, this.scene);
    this.speedLines.particleTexture = new Texture(
      'https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png',
      this.scene
    );
    this.speedLines.emitter = Vector3.Zero();
    this.speedLines.minSize = 0.05;
    this.speedLines.maxSize = 0.15;
    this.speedLines.minLifeTime = 0.05;
    this.speedLines.maxLifeTime = 0.15;
    this.speedLines.emitRate = 60;
    this.speedLines.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.speedLines.gravity = Vector3.Zero();
    this.speedLines.color1 = new Color4(1, 1, 1, 0.6);
    this.speedLines.color2 = new Color4(0.9, 0.9, 1, 0.4);
    this.speedLines.colorDead = new Color4(1, 1, 1, 0);
  }

  /** Start the game */
  public startGame(): void {
    this.gameStartTime = performance.now();
    this.isGameOver = false;
    this.resetGameState();
    this.setupNewPlay();
    this.config.onGameStateChange(this.gameState);

    // Play game start sound
    this.audioManager?.playSFX('game_start');
  }

  private resetGameState(): void {
    this.driveSystem.reset(20);
    this.aiSystem.reset();
    this.gameState = {
      score: 0,
      yardsGained: 0,
      touchdowns: 0,
      firstDowns: 0,
      bigPlays: 0,
      turnovers: 0,
      turboYards: 0,
      stiffArms: 0,
      jukes: 0,
      tacklesMade: 0,
      down: 1,
      yardsToGo: 10,
      lineOfScrimmage: 20,
      timeRemaining: this.GAME_DURATION_MS,
      phase: 'pre_snap',
      currentPlay: null,
      longestPlay: 0,
    };
  }

  /** Setup for a new play */
  private setupNewPlay(): void {
    this.gameState.phase = 'pre_snap';

    // Sync drive state into game state
    const driveState = this.driveSystem.getState();
    this.gameState.down = driveState.down;
    this.gameState.yardsToGo = driveState.yardsToGo;
    this.gameState.lineOfScrimmage = driveState.lineOfScrimmage;
    this.playStartYardLine = driveState.lineOfScrimmage;

    // Build game situation for smart play selection
    const situation: GameSituation = {
      down: driveState.down,
      yardsToGo: driveState.yardsToGo,
      yardLine: driveState.lineOfScrimmage,
      scoreDiff: 0,
      timeRemaining: this.gameState.timeRemaining / 1000,
      quarter: 1,
    };

    // Recommend a play (engine auto-selects first recommendation for arcade pace)
    const recommendations = this.playbookSystem.getPlayRecommendations(situation, 1);
    this.selectedPlay = recommendations[0] ?? getAllOffensivePlays()[0];
    this.gameState.currentPlay = this.selectedPlay;

    // AI selects defensive play using PlaybookSystem
    this.defensivePlay = this.playbookSystem.selectDefensivePlay(situation);

    // Configure AISystem v2 for this play
    this.aiSystem.setLineOfScrimmage(driveState.lineOfScrimmage);
    this.aiSystem.setScheme(CoverageScheme.Cover3);

    // Position players
    this.positionPlayersForPlay();

    // Give ball to QB
    const qbPos = this.qbMesh?.position || new Vector3(0, 0, this.gameState.lineOfScrimmage - 5);
    this.ball?.giveTo('qb', qbPos);
    this.ballCarrierId = 'qb';

    // Update camera target
    if (this.camera.lockedTarget && this.qbMesh) {
      (this.camera.lockedTarget as Mesh).position = this.qbMesh.position.clone();
    }

    // Auto-snap after short delay (arcade style - no huddle)
    const snapTimer = setTimeout(() => {
      this.pendingTimeouts.delete(snapTimer);
      if (this.gameState.phase === 'pre_snap' && !this.isGameOver) {
        this.snapBall();
      }
    }, 1500);
    this.pendingTimeouts.add(snapTimer);
  }

  private positionPlayersForPlay(): void {
    const los = this.gameState.lineOfScrimmage;

    // Position offensive players
    OFFENSIVE_POSITIONS.forEach((pos) => {
      const mesh = this.offensivePlayers.get(pos.id);
      if (mesh) {
        mesh.position.x = pos.defaultZ; // Z in formation = X on field
        mesh.position.z = los + pos.defaultX;
        mesh.position.y = 1;
      }
    });

    // Position defensive players
    DEFENSIVE_POSITIONS.forEach((pos, idx) => {
      const mesh = this.defensivePlayers.get(pos.id);
      if (mesh) {
        mesh.position.x = pos.defaultZ;
        mesh.position.z = los + pos.defaultX;
        mesh.position.y = 1;

        // Update AI position
        if (this.defenderAIs[idx]) {
          this.defenderAIs[idx].setPosition(mesh.position);
        }
      }
    });

    // Set player controller position (QB)
    this.playerController?.setPosition(new Vector3(0, 0, los - 5));
  }

  private snapBall(): void {
    this.gameState.phase = 'play_active';

    // Notify Genie of play start
    this.genieSystem?.onPlayStart();

    // Play snap sound
    this.audioManager?.playSFX('snap');

    // Start ScoreSystem game clock
    this.scoreSystem.startClock();

    // Trigger AI reaction delay (v2)
    this.aiSystem.triggerReaction(0.2);

    // Start route running (simplified - receivers move to targets)
    if (this.selectedPlay) {
      this.runRoutes();
    }

    this.config.onGameStateChange(this.gameState);
  }

  private runRoutes(): void {
    if (!this.selectedPlay) return;

    // Animate receivers running routes
    this.selectedPlay.routes.forEach((route) => {
      const mesh = this.offensivePlayers.get(route.positionId);
      if (!mesh || route.routeType === 'block' || route.positionId === 'qb') return;

      // Calculate route target position
      const startPos = mesh.position.clone();
      const targetPos = new Vector3(
        startPos.x + route.routeWidth,
        1,
        startPos.z + route.routeDepth
      );

      // Simple linear route animation (could be enhanced with bezier curves)
      this.animatePlayerToPosition(mesh, targetPos, 2000);
    });
  }

  private animatePlayerToPosition(mesh: Mesh, target: Vector3, duration: number): void {
    const startPos = mesh.position.clone();
    const startTime = performance.now();

    const animate = () => {
      if (this.gameState.phase !== 'play_active') return;

      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      mesh.position = Vector3.Lerp(startPos, target, t);

      // Face movement direction
      const dir = target.subtract(startPos);
      mesh.rotation.y = Math.atan2(dir.x, dir.z);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /** Main game loop update */
  private update(): void {
    if (this.isGameOver) return;

    const deltaTime = this.engine.getDeltaTime() / 1000;

    // Tick ScoreSystem clock (replaces raw elapsed-based timer)
    if (this.gameState.phase === 'play_active') {
      const quarterEnded = this.scoreSystem.tick(deltaTime);
      if (quarterEnded && this.scoreSystem.getClock().isGameOver) {
        this.endGame('timeout');
        return;
      }
    }
    // Sync time remaining from ScoreSystem
    this.gameState.timeRemaining = this.scoreSystem.getClock().timeRemainingSec * 1000;

    // Update based on game phase
    if (this.gameState.phase === 'play_active') {
      this.updatePlayActive(deltaTime);
    }

    // Update UI
    this.config.onGameStateChange(this.gameState);
  }

  private updatePlayActive(deltaTime: number): void {
    // Update player controller
    this.playerController?.update(deltaTime);

    // Update ball physics
    this.ball?.update(deltaTime);

    // Update QB mesh to follow controller
    if (this.ballCarrierId === 'qb' && this.qbMesh && this.playerController) {
      const pos = this.playerController.getPosition();
      this.qbMesh.position = pos;
      this.qbMesh.rotation.y = this.playerController.getRotation();

      // Update ball position
      this.ball?.updateHeldPosition(pos, this.playerController.getRotation());

      // Update camera target
      if (this.camera.lockedTarget) {
        (this.camera.lockedTarget as Mesh).position = pos;
      }

      const targetRadius = 34 + Math.min(10, speed * 0.6);
      const targetHeight = 24 + Math.min(8, speed * 0.4);
      let radius = targetRadius;
      let height = targetHeight;

      if (this.cameraShakeTimeRemaining > 0) {
        this.cameraShakeTimeRemaining = Math.max(0, this.cameraShakeTimeRemaining - deltaTime);
        const intensityScale = this.cameraShakeDuration > 0
          ? this.cameraShakeTimeRemaining / this.cameraShakeDuration
          : 0;
        const jitter = (Math.random() * 2 - 1) * this.cameraShakeIntensity * intensityScale;
        radius += jitter * 0.6;
        height += jitter * 0.4;
        this.camera.rotationOffset = this.cameraBaseRotationOffset + jitter;
      } else {
        this.camera.rotationOffset = this.cameraBaseRotationOffset;
      }

      this.camera.radius = radius;
      this.camera.heightOffset = height;
        const velocity = this.playerController.getVelocity();
        const yardsThisFrame = velocity.length() * deltaTime;
        if (velocity.z > 0) { // Moving forward
          this.gameState.turboYards += yardsThisFrame;
        }

        // Speed lines during turbo
        if (this.speedLines && this.playerController) {
          const vel = this.playerController.getVelocity();
          this.speedLines.emitter = this.playerController.getPosition().clone();
          this.speedLines.direction1 = vel.normalize().scale(-2);
          this.speedLines.direction2 = vel.normalize().scale(-3);
          if (!this.speedLines.isStarted) this.speedLines.start();
        }
      } else {
        this.speedLines?.stop();
      }
    }

    // Update defender AI (v2 — AISystem with zone/man coverage)
    const ballCarrierPos = this.ballCarrierId ? this.getBallCarrierPosition() : null;
    const ballCarrierVel = this.playerController?.getVelocity() || null;
    const ballPos = this.ball?.getPosition() || null;

    // Build receiver positions + velocities maps
    const receiverPositions = new Map<string, Vector3>();
    const receiverVelocities = new Map<string, Vector3>();
    this.offensivePlayers.forEach((mesh, id) => {
      if (id !== 'qb' && id !== 'c') {
        receiverPositions.set(id, mesh.position.clone());
        // Approximate velocity from mesh movement (receivers are AI-driven)
        receiverVelocities.set(id, Vector3.Zero());
      }
    });

    // Feed QB look direction to AI for read-react
    if (this.playerController) {
      const rot = this.playerController.getRotation();
      this.aiSystem.setQBEyeDirection(new Vector3(Math.sin(rot), 0, Math.cos(rot)));
    }

    // AISystem v2 single-call update
    this.aiSystem.update(deltaTime, ballCarrierPos, ballCarrierVel, ballPos, receiverPositions, receiverVelocities);

    // Sync AI agent positions back to meshes + check tackles
    DEFENSIVE_POSITIONS.forEach((defPos) => {
      const mesh = this.defensivePlayers.get(defPos.id);
      const agent = this.aiSystem.getAgent(defPos.id);
      if (mesh && agent) {
        mesh.position.x = agent.position.x;
        mesh.position.z = agent.position.z;
        mesh.rotation.y = agent.rotation;

        // Tackle check
        if (ballCarrierPos && Vector3.Distance(agent.position, ballCarrierPos) < 1.5) {
          this.handleTackle(agent.position);
        }
      }
    });

    // Manage ball carrier glow
    if (this.glowLayer && this.ballCarrierId) {
      const carrierMesh = this.ballCarrierId === 'qb' ? this.qbMesh : this.offensivePlayers.get(this.ballCarrierId);
      if (carrierMesh) {
        this.glowLayer.addIncludedOnlyMesh(carrierMesh as Mesh);
      }
    }

    // Observe entities for Genie dynamics
    if (this.genieSystem) {
      this.offensivePlayers.forEach((mesh, id) => {
        if (id === 'c') return;
        const pType = blitzIdToPlayerType(id);
        const action = id === this.ballCarrierId ? PlayAction.CATCH
          : id === 'qb' ? PlayAction.SNAP : PlayAction.RUN_ROUTE;
        this.genieSystem!.observeEntity({
          id, type: pType, position: mesh.position.clone(),
          action, stamina: 100,
        });
      });

      const currentEntities = new Map<string, { position: Vector3; type: PlayerType }>();
      this.offensivePlayers.forEach((mesh, id) => {
        currentEntities.set(id, { position: mesh.position.clone(), type: blitzIdToPlayerType(id) });
      });
      this.genieSystem.renderGhosts(currentEntities);
    }

    // Check for throw (space bar)
    if (this.ballCarrierId === 'qb' && this.playerController?.isActionDown()) {
      const selectedIdx = this.playerController.getSelectedReceiver();
      if (selectedIdx !== null) {
        this.attemptThrow(selectedIdx);
      }
    }

    // Check for touchdown
    const carrierZ = ballCarrierPos?.z || 0;
    if (carrierZ >= FIELD_CONFIG.length) {
      this.scoreTouchdown();
    }

    // Check for out of bounds
    if (ballCarrierPos && !FootballField.isInBounds(ballCarrierPos.x, ballCarrierPos.z)) {
      this.endPlay(false);
    }
  }

  private getBallCarrierPosition(): Vector3 | null {
    if (!this.ballCarrierId) return null;

    if (this.ballCarrierId === 'qb') {
      return this.playerController?.getPosition() || null;
    }

    const mesh = this.offensivePlayers.get(this.ballCarrierId);
    return mesh?.position.clone() || null;
  }

  private attemptThrow(receiverIndex: number): void {
    // Map index to receiver position ID
    const receiverIds = ['wr1', 'wr2', 'wr3', 'te', 'rb'];
    const targetId = receiverIds[receiverIndex];
    if (!targetId) return;

    const targetMesh = this.offensivePlayers.get(targetId);
    if (!targetMesh) return;

    // Determine pass type based on hold time
    const holdTime = this.playerController?.getActionHoldTime() || 0;
    let passType: PassType = 'touch';
    if (holdTime > 0.3) {
      passType = 'bullet';
    } else if (holdTime < 0.1) {
      passType = 'lob';
    }

    // Lead the receiver
    const leadDistance = 5;
    const targetPos = targetMesh.position.clone();
    targetPos.z += leadDistance;

    // Throw the ball
    this.ball?.throwTo(targetPos, passType, holdTime);
    this.ballCarrierId = null;

    // Play pass throw sound
    this.audioManager?.playSFX('pass_throw');

    // Check for catch after flight time
    const catchTimer = setTimeout(() => {
      this.pendingTimeouts.delete(catchTimer);
      if (this.isGameOver || !this.ball) return;
      if (this.ball.isCatchable()) {
        const caught = this.ball.attemptCatch(
          targetId,
          targetMesh.position,
          7 // Catch skill
        );

        if (caught) {
          this.ballCarrierId = targetId;
          // Play catch sound
          this.audioManager?.playSFX('catch');
          // Switch camera to follow receiver
          if (this.camera.lockedTarget) {
            (this.camera.lockedTarget as Mesh).position = targetMesh.position;
          }
        } else {
          // Incomplete pass
          this.audioManager?.playSFX('incomplete');
          this.endPlay(true);
        }
      }
    }, 800);
    this.pendingTimeouts.add(catchTimer);
  }

  private handleTackle(tacklerPosition: Vector3): void {
    if (this.gameState.phase !== 'play_active') return;

    // Play tackle sound (big tackle if high velocity collision)
    const carrierVelocity = this.playerController?.getVelocity()?.length() || 0;
    if (carrierVelocity > 10) {
      this.audioManager?.playSFX('tackle_big');
    } else {
      this.audioManager?.playSFX('tackle');
    }

    // Tackle particles
    if (this.tackleParticles && this.ballCarrierId) {
      const carrierPos = this.getBallCarrierPosition();
      if (carrierPos) {
        this.tackleParticles.emitter = carrierPos;
        this.tackleParticles.start();
        setTimeout(() => this.tackleParticles?.stop(), 300);
      }
    }

    this.gameState.tacklesMade++;
    this.triggerCameraShake(1.2, 350);
    this.endPlay(false);
  }

  private scoreTouchdown(): void {
    this.gameState.touchdowns++;
    this.gameState.score += SCORING.touchdown;
    this.scoreSystem.scoreTouchdown('home');
    this.field?.updateJumbotron(this.gameState.score, 0);

    // Play touchdown fanfare
    this.audioManager?.playSFX('touchdown');
    this.audioManager?.setCrowdIntensity(3);
    this.triggerCameraShake(1.6, 600);

    // Touchdown particles
    const tdPos = this.getBallCarrierPosition() || new Vector3(0, 0, 100);
    if (this.touchdownParticles) {
      this.touchdownParticles.emitter = tdPos;
      this.touchdownParticles.start();
      const tdStopTimer = setTimeout(() => { this.pendingTimeouts.delete(tdStopTimer); this.touchdownParticles?.stop(); }, 2000);
      this.pendingTimeouts.add(tdStopTimer);
    }

    // Mascot Easter egg — appears after 3+ touchdowns
    if (this.gameState.touchdowns >= 3) {
      this.spawnMascot();
    }

    // TD light flicker — animate lights with sine wave over 2s
    const lights = this.scene.lights;
    const originalIntensities = lights.map(l => l.intensity);
    let flickerStart = performance.now();
    const flickerInterval = setInterval(() => {
      const elapsed = (performance.now() - flickerStart) / 1000;
      if (elapsed > 2) {
        lights.forEach((l, i) => l.intensity = originalIntensities[i]);
        clearInterval(flickerInterval);
        this.pendingIntervals.delete(flickerInterval);
        return;
      }
      const flicker = 1 + 0.3 * Math.sin(elapsed * Math.PI * 6);
      lights.forEach((l, i) => l.intensity = originalIntensities[i] * flicker);
    }, 33);
    this.pendingIntervals.add(flickerInterval);

    this.endGame('touchdown');
  }

  private triggerCameraShake(intensity: number, durationMs: number): void {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeDuration = durationMs / 1000;
    this.cameraShakeTimeRemaining = this.cameraShakeDuration;
  }

  private endPlay(isIncomplete: boolean): void {
    this.gameState.phase = 'post_play';
    this.scoreSystem.stopClock();
    this.genieSystem?.onPlayEnd();
    this.playerController?.blowWhistle();
    this.ball?.markDead();

    // Play whistle sound
    this.audioManager?.playSFX('whistle');
    this.audioManager?.setCrowdIntensity(0.3);

    // Calculate yards gained
    const endYardLine = this.getBallCarrierPosition()?.z || this.gameState.lineOfScrimmage;
    const yardsThisPlay = isIncomplete ? 0 : Math.max(0, endYardLine - this.playStartYardLine);

    // Record pass attempt in ScoreSystem
    this.scoreSystem.recordPassAttempt('home', !isIncomplete, yardsThisPlay, false, false);

    // Process play through DriveSystem
    const playResult = this.driveSystem.processPlay(yardsThisPlay, {
      isComplete: !isIncomplete,
    });

    // Update game state from drive
    if (yardsThisPlay > 0 && !isIncomplete) {
      this.gameState.yardsGained += yardsThisPlay;
      this.gameState.score += Math.floor(yardsThisPlay * SCORING.yardsGained);

      if (playResult.bigPlay) {
        this.gameState.bigPlays++;
        this.gameState.score += SCORING.bigPlay;
      }
      if (yardsThisPlay > this.gameState.longestPlay) {
        this.gameState.longestPlay = yardsThisPlay;
      }
    }

    // Sync drive state back
    const driveState = this.driveSystem.getState();
    this.gameState.lineOfScrimmage = driveState.lineOfScrimmage;
    this.gameState.down = driveState.down;
    this.gameState.yardsToGo = driveState.yardsToGo;

    if (playResult.isFirstDown) {
      this.gameState.firstDowns++;
      this.gameState.score += SCORING.firstDown;
      this.audioManager?.playSFX('first_down');
    }

    // Check for turnover on downs
    if (playResult.isTurnover || this.driveSystem.isOver()) {
      this.endGame('turnover');
      return;
    }

    this.config.onGameStateChange(this.gameState);

    // Setup next play after delay
    setTimeout(() => {
      if (!this.isGameOver) {
        this.setupNewPlay();
      }
    }, 1500);
  }

  private endGame(result: 'touchdown' | 'turnover' | 'timeout' | 'incomplete'): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.gameState.phase = 'game_over';

    // Stop ambient crowd and play game over sound
    this.audioManager?.stopAmbientCrowd();
    if (result !== 'touchdown') {
      // Don't play game_over if touchdown (that already played its fanfare)
      this.audioManager?.playSFX('game_over');
    }

    const gameResult: BlitzGameResult = {
      finalScore: this.gameState.score,
      yardsGained: this.gameState.yardsGained,
      touchdowns: this.gameState.touchdowns,
      firstDowns: this.gameState.firstDowns,
      bigPlays: this.gameState.bigPlays,
      turnovers: this.gameState.turnovers,
      tacklesMade: this.gameState.tacklesMade,
      stiffArms: this.gameState.stiffArms,
      jukes: this.gameState.jukes,
      turboYards: Math.floor(this.gameState.turboYards),
      longestPlay: this.gameState.longestPlay,
      result,
      durationSeconds: Math.floor((performance.now() - this.gameStartTime) / 1000),
      teamId: this.config.homeTeam.id,
    };

    this.config.onGameOver(gameResult);

    // Submit to arcade leaderboard
    this.submitToLeaderboard(gameResult);
  }

  /** Submit final score to BlazeCraft Arcade leaderboard */
  private async submitToLeaderboard(result: BlitzGameResult): Promise<void> {
    try {
      const playerName = this.config.homeTeam?.name || 'Anonymous';
      const res = await fetch('/api/mini-games/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'blitz',
          playerName,
          score: result.finalScore,
          metadata: {
            touchdowns: result.touchdowns,
            yardsGained: result.yardsGained,
            result: result.result,
          },
        }),
      });
      if (!res.ok) console.warn('[Blitz] Leaderboard submit failed:', res.status);
    } catch {
      // Leaderboard is non-critical — fail silently
    }
  }

  /** Select a play by ID (legacy) */
  public selectPlay(playId: string): void {
    const plays = getAllOffensivePlays();
    const play = plays.find((p) => p.id === playId);
    if (play) {
      this.selectedPlay = play;
      this.gameState.currentPlay = play;
    }
  }

  /** Set play directly from PlaybookSystem selection */
  public setSelectedPlay(play: OffensivePlay): void {
    this.selectedPlay = play;
    this.gameState.currentPlay = play;
  }

  /** Trigger snap from external UI */
  public triggerSnap(): void {
    if (this.gameState.phase === 'pre_snap' && !this.isGameOver) {
      this.snapBall();
    }
  }

  /** Get current game state */
  public getGameState(): BlitzGameState {
    return { ...this.gameState };
  }

  /** Expose ScoreSystem for external UI reads */
  public getScoreSystem(): ScoreSystem {
    return this.scoreSystem;
  }

  // ---------------------------------------------------------------------------
  // Special Moves (called from InputSystem events)
  // ---------------------------------------------------------------------------

  /** Juke: lateral burst in the given direction. Awards points on success. */
  public performJuke(direction: Vector3): void {
    if (this.gameState.phase !== 'play_active' || !this.ballCarrierId) return;
    if (!this.playerController) return;

    // Apply lateral velocity burst
    const jukeStrength = 8;
    const pos = this.playerController.getPosition();
    const lateralOffset = direction.normalize().scale(jukeStrength * 0.15);
    this.playerController.setPosition(pos.add(lateralOffset));

    this.gameState.jukes++;
    this.gameState.score += SCORING.juke;
    this.audioManager?.playSFX('juke');

    if (this.turfSpray) {
      this.turfSpray.emitter = this.playerController!.getPosition().clone();
      this.turfSpray.start();
      setTimeout(() => this.turfSpray?.stop(), 200);
    }
  }

  /** Spin move: brief rotation + speed burst. */
  public performSpin(): void {
    if (this.gameState.phase !== 'play_active' || !this.ballCarrierId) return;
    if (!this.playerController) return;

    // Briefly boost forward speed
    const pos = this.playerController.getPosition();
    const rot = this.playerController.getRotation();
    const forward = new Vector3(Math.sin(rot), 0, Math.cos(rot));
    this.playerController.setPosition(pos.add(forward.scale(1.5)));

    this.gameState.score += SCORING.juke; // reuse juke scoring for now
    this.audioManager?.playSFX('juke');

    if (this.turfSpray) {
      this.turfSpray.emitter = this.playerController!.getPosition().clone();
      this.turfSpray.start();
      setTimeout(() => this.turfSpray?.stop(), 200);
    }
  }

  /** Truck stick: power through a tackle attempt. */
  public performTruck(): void {
    if (this.gameState.phase !== 'play_active' || !this.ballCarrierId) return;
    if (!this.playerController) return;

    this.gameState.stiffArms++;
    this.gameState.score += SCORING.stiffArm;
    this.audioManager?.playSFX('stiff_arm');
  }

  /** Dive forward: lunge for extra yardage, ends the play. */
  public performDive(direction: Vector3): void {
    if (this.gameState.phase !== 'play_active' || !this.ballCarrierId) return;
    if (!this.playerController) return;

    const pos = this.playerController.getPosition();
    const diveVector = direction.length() > 0 ? direction.normalize() : new Vector3(0, 0, 1);
    this.playerController.setPosition(pos.add(diveVector.scale(3)));

    // Dive ends the play
    this.endPlay(false);
  }

  /** Call an audible — pick a new recommended play pre-snap */
  public callAudible(): void {
    if (this.gameState.phase !== 'pre_snap') return;
    const driveState = this.driveSystem.getState();
    const situation: GameSituation = {
      down: driveState.down,
      yardsToGo: driveState.yardsToGo,
      yardLine: driveState.lineOfScrimmage,
      scoreDiff: 0,
      timeRemaining: this.gameState.timeRemaining / 1000,
      quarter: 1,
    };
    const recs = this.playbookSystem.getPlayRecommendations(situation, 4);
    // Pick a different play than current if possible
    const alt = recs.find((p) => p.name !== this.selectedPlay?.name) ?? recs[0];
    if (alt) {
      this.setSelectedPlay(alt);
      this.config.onPlayFeedback?.('AUDIBLE!', 'firstdown');
    }
  }

  /** Change a receiver's route pre-snap (hot route) */
  public setHotRoute(receiverIndex: number, routeType: RouteType): void {
    if (this.gameState.phase !== 'pre_snap' || !this.selectedPlay) return;
    const receiverIds = ['wr1', 'wr2', 'wr3', 'te', 'rb'];
    const targetId = receiverIds[receiverIndex];
    if (!targetId) return;

    const route = this.selectedPlay.routes.find((r) => r.positionId === targetId);
    if (route) {
      (route as { routeType: RouteType }).routeType = routeType;
    }
  }

  /** Pump fake — freezes defenders briefly */
  public pumpFake(): void {
    if (this.gameState.phase !== 'play_active' || this.ballCarrierId !== 'qb') return;
    this.aiSystem.triggerReaction(0.4); // Defenders hesitate
    this.config.onPlayFeedback?.('PUMP FAKE', 'firstdown');
  }

  /** Throw the ball away — intentional incompletion to avoid sack */
  public throwAway(): void {
    if (this.gameState.phase !== 'play_active' || this.ballCarrierId !== 'qb') return;
    const qbPos = this.playerController?.getPosition();
    if (qbPos && this.ball) {
      // Throw to sideline
      const sidelineTarget = new Vector3(
        qbPos.x > 0 ? FIELD_CONFIG.width / 2 + 5 : -(FIELD_CONFIG.width / 2 + 5),
        5,
        qbPos.z + 10,
      );
      this.ball.throwTo(sidelineTarget, 'bullet', 0);
    }
    this.ballCarrierId = null;
    this.scoreSystem.stopClock();
    this.scoreSystem.recordPassAttempt('home', false, 0, false, false);
    setTimeout(() => this.endPlay(true), 600);
  }

  private spawnMascot(): void {
    SceneLoader.ImportMeshAsync('', '/assets/', 'blaze_mascot.glb', this.scene).then((result) => {
      const mascotRoot = result.meshes[0];
      mascotRoot.scaling = new Vector3(2, 2, 2);

      // Position at end zone center
      const startZ = FIELD_CONFIG.totalLength / 2 + 5;
      mascotRoot.position = new Vector3(0, 0, startZ);

      // Animate running across end zone over 3 seconds
      const startX = -15;
      const endX = 15;
      mascotRoot.position.x = startX;
      const runStart = performance.now();
      const runDuration = 3000;

      const runInterval = setInterval(() => {
        const elapsed = performance.now() - runStart;
        const t = Math.min(elapsed / runDuration, 1);
        mascotRoot.position.x = startX + (endX - startX) * t;

        // Bobbing animation
        mascotRoot.position.y = Math.abs(Math.sin(t * Math.PI * 6)) * 1.5;

        if (t >= 1) {
          clearInterval(runInterval);
          this.pendingIntervals.delete(runInterval);

          // Firework particle burst
          const fireworks = new ParticleSystem('mascotFireworks', 500, this.scene);
          fireworks.emitter = mascotRoot.position.clone();
          fireworks.minSize = 0.1;
          fireworks.maxSize = 0.4;
          fireworks.minLifeTime = 0.5;
          fireworks.maxLifeTime = 2.0;
          fireworks.emitRate = 500;
          fireworks.blendMode = ParticleSystem.BLENDMODE_ADD;
          fireworks.direction1 = new Vector3(-5, 8, -5);
          fireworks.direction2 = new Vector3(5, 15, 5);
          fireworks.gravity = new Vector3(0, -9.8, 0);
          fireworks.color1 = new Color4(1.0, 0.5, 0.0, 1.0); // Orange
          fireworks.color2 = new Color4(1.0, 0.84, 0.0, 1.0); // Gold
          fireworks.colorDead = new Color4(1.0, 0.2, 0.0, 0.0);
          fireworks.createPointEmitter(new Vector3(-1, 0, -1), new Vector3(1, 1, 1));
          fireworks.targetStopDuration = 2;
          fireworks.disposeOnStop = true;
          fireworks.start();

          // Dispose mascot after fireworks
          const mascotTimer = setTimeout(() => { this.pendingTimeouts.delete(mascotTimer); mascotRoot.dispose(); }, 2500);
          this.pendingTimeouts.add(mascotTimer);
        }
      }, 16);
      this.pendingIntervals.add(runInterval);
    }).catch((err) => {
      console.warn('Failed to load mascot:', err);
    });
  }

  /** Dispose resources */
  public dispose(): void {
    this.isGameOver = true;

    // Clear all tracked timers
    for (const t of this.pendingTimeouts) clearTimeout(t);
    this.pendingTimeouts.clear();
    for (const i of this.pendingIntervals) clearInterval(i);
    this.pendingIntervals.clear();

    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Dispose camera target mesh
    if (this.camera?.lockedTarget) {
      (this.camera.lockedTarget as Mesh).dispose();
    }

    this.genieSystem?.dispose();
    this.audioManager?.dispose();
    this.field?.dispose();
    this.ball?.dispose();
    this.playerController?.dispose();
    this.tackleParticles?.dispose();
    this.touchdownParticles?.dispose();
    this.turfSpray?.dispose();
    this.speedLines?.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
