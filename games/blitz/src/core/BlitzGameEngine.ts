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
} from '@babylonjs/core';

import { FootballField, FIELD_CONFIG } from './Field';
import { FootballPhysics, PassType } from './BallPhysics';
import { PlayerController, TouchController } from './PlayerController';
import { SteeringBehaviors, DefenderAI, SteeringAgent } from './SteeringAI';
import { AudioManager } from './AudioManager';
import type { BlitzTeam, PlayerPosition } from '@data/teams';
import { FIREBIRDS, SHADOW_WOLVES, OFFENSIVE_POSITIONS, DEFENSIVE_POSITIONS } from '@data/teams';
import type { OffensivePlay, DefensivePlay } from '@data/plays';
import { getAllOffensivePlays, getSmartDefensivePlay } from '@data/plays';

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
  private defenderAIs: DefenderAI[] = [];

  // Player meshes
  private offensivePlayers: Map<string, Mesh> = new Map();
  private defensivePlayers: Map<string, Mesh> = new Map();
  private qbMesh: Mesh | null = null;

  // Visual effects
  private tackleParticles: ParticleSystem | null = null;
  private touchdownParticles: ParticleSystem | null = null;

  // Audio
  private audioManager: AudioManager | null = null;

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
    this.setupPostProcessing();
    this.createField();
    this.createPlayers();
    this.setupBall();
    this.setupControls();
    this.createVisualEffects();
    this.setupAudio();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    // Handle resize
    window.addEventListener('resize', () => this.engine.resize());
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

    const helmetMat = new StandardMaterial(`helmetMat_${id}`, this.scene);
    helmetMat.diffuseColor = Color3.FromHexString(team.helmetColor);
    helmetMat.specularColor = Color3.White();
    helmet.material = helmetMat;

    // Add to shadow caster
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(body);
    }

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
    this.playStartYardLine = this.gameState.lineOfScrimmage;

    // Auto-select first play for simplicity
    const plays = getAllOffensivePlays();
    this.selectedPlay = plays[Math.floor(Math.random() * plays.length)];
    this.gameState.currentPlay = this.selectedPlay;

    // AI selects defensive play
    this.defensivePlay = getSmartDefensivePlay(
      this.gameState.down,
      this.gameState.yardsToGo
    );

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
    setTimeout(() => {
      if (this.gameState.phase === 'pre_snap' && !this.isGameOver) {
        this.snapBall();
      }
    }, 1500);
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

    // Play snap sound
    this.audioManager?.playSFX('snap');

    // Trigger AI reaction delay
    this.defenderAIs.forEach((ai) => ai.triggerReaction(0.2));

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

    // Update time
    const elapsed = performance.now() - this.gameStartTime;
    this.gameState.timeRemaining = Math.max(0, this.GAME_DURATION_MS - elapsed);

    if (this.gameState.timeRemaining <= 0) {
      this.endGame('timeout');
      return;
    }

    // Update based on game phase
    if (this.gameState.phase === 'play_active') {
      this.updatePlayActive(deltaTime);
    }

    // Update UI periodically
    if (Math.floor(elapsed / 100) !== Math.floor((elapsed - 100) / 100)) {
      this.config.onGameStateChange(this.gameState);
    }
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

      // Track turbo yards
      if (this.playerController.isTurboOn()) {
        const velocity = this.playerController.getVelocity();
        const yardsThisFrame = velocity.length() * deltaTime;
        if (velocity.z > 0) { // Moving forward
          this.gameState.turboYards += yardsThisFrame;
        }
      }
    }

    // Update defender AI
    const ballCarrierPos = this.ballCarrierId ? this.getBallCarrierPosition() : null;
    const ballCarrierVel = this.playerController?.getVelocity() || null;
    const ballPos = this.ball?.getPosition() || null;

    // Get all defender agents for separation
    const defenderAgents = this.defenderAIs.map((ai) => ai.getAgent());

    // Build receiver positions map
    const receiverPositions = new Map<string, Vector3>();
    this.offensivePlayers.forEach((mesh, id) => {
      if (id !== 'qb' && id !== 'c') {
        receiverPositions.set(id, mesh.position.clone());
      }
    });

    this.defenderAIs.forEach((ai, idx) => {
      ai.update(
        deltaTime,
        ballCarrierPos,
        ballCarrierVel,
        receiverPositions,
        ballPos,
        defenderAgents
      );

      // Sync mesh position with AI
      const defPos = DEFENSIVE_POSITIONS[idx];
      const mesh = this.defensivePlayers.get(defPos.id);
      if (mesh) {
        const agent = ai.getAgent();
        mesh.position.x = agent.position.x;
        mesh.position.z = agent.position.z;
        mesh.rotation.y = agent.rotation;
      }

      // Check for tackle
      if (ballCarrierPos && ai.canTackle(ballCarrierPos)) {
        this.handleTackle(ai.getAgent().position);
      }
    });

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
    setTimeout(() => {
      if (this.ball?.isCatchable()) {
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
    this.endPlay(false);
  }

  private scoreTouchdown(): void {
    this.gameState.touchdowns++;
    this.gameState.score += SCORING.touchdown;

    // Play touchdown fanfare
    this.audioManager?.playSFX('touchdown');

    // Touchdown particles
    const tdPos = this.getBallCarrierPosition() || new Vector3(0, 0, 100);
    if (this.touchdownParticles) {
      this.touchdownParticles.emitter = tdPos;
      this.touchdownParticles.start();
      setTimeout(() => this.touchdownParticles?.stop(), 2000);
    }

    this.endGame('touchdown');
  }

  private endPlay(isIncomplete: boolean): void {
    this.gameState.phase = 'post_play';
    this.playerController?.blowWhistle();
    this.ball?.markDead();

    // Play whistle sound
    this.audioManager?.playSFX('whistle');

    // Calculate yards gained
    const endYardLine = this.getBallCarrierPosition()?.z || this.gameState.lineOfScrimmage;
    const yardsThisPlay = endYardLine - this.playStartYardLine;

    if (yardsThisPlay > 0 && !isIncomplete) {
      this.gameState.yardsGained += yardsThisPlay;
      this.gameState.score += Math.floor(yardsThisPlay * SCORING.yardsGained);

      // Big play bonus
      if (yardsThisPlay >= 20) {
        this.gameState.bigPlays++;
        this.gameState.score += SCORING.bigPlay;
      }

      // Update longest play
      if (yardsThisPlay > this.gameState.longestPlay) {
        this.gameState.longestPlay = yardsThisPlay;
      }

      // Update line of scrimmage
      this.gameState.lineOfScrimmage = Math.min(FIELD_CONFIG.length - 1, endYardLine);

      // Check for first down
      if (yardsThisPlay >= this.gameState.yardsToGo) {
        this.gameState.firstDowns++;
        this.gameState.score += SCORING.firstDown;
        this.gameState.down = 1;
        this.gameState.yardsToGo = 10;
        // Play first down sound
        this.audioManager?.playSFX('first_down');
      } else {
        this.gameState.down++;
        this.gameState.yardsToGo -= yardsThisPlay;
      }
    } else {
      // No gain or incomplete
      this.gameState.down++;
    }

    // Check for turnover on downs
    if (this.gameState.down > 4) {
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
  }

  /** Select a play */
  public selectPlay(playId: string): void {
    const plays = getAllOffensivePlays();
    const play = plays.find((p) => p.id === playId);
    if (play) {
      this.selectedPlay = play;
      this.gameState.currentPlay = play;
    }
  }

  /** Get current game state */
  public getGameState(): BlitzGameState {
    return { ...this.gameState };
  }

  /** Dispose resources */
  public dispose(): void {
    this.isGameOver = true;
    this.audioManager?.dispose();
    this.field?.dispose();
    this.ball?.dispose();
    this.playerController?.dispose();
    this.tackleParticles?.dispose();
    this.touchdownParticles?.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
