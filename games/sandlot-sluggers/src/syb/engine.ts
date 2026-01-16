/**
 * Sandlot Sluggers - Game Engine
 * Main game loop integrating pitch, batting, fielding, and game state.
 */

import * as THREE from 'three';
import type { SceneIndex } from './scene';
import { loadGLB, validateRequiredNodes, buildFallbackScene } from './scene';
import { CameraRig, CAMERA_PRESETS } from './cameras';
import {
  spawnPitch,
  BallPool,
  createBallMesh,
  type PitchController,
  type PitchLane,
  type StrikeCrossEvent,
} from './pitch';
import {
  createSwingState,
  evaluateContact,
  generateBattedBall,
  resolveFieldingPlay,
  type SwingState,
  type BattedBall,
} from './batting';
import {
  createGameState,
  nextPitch,
  recordStrike,
  recordBall,
  recordOut,
  recordHit,
  advanceRunners,
  getGameStatus,
  recordDerbyOut,
  recordDerbyHR,
  type GameState,
  type GameMode,
} from './gameState';

// ============================================================================
// Types
// ============================================================================

export type EnginePhase =
  | 'loading'
  | 'ready'
  | 'pitching'
  | 'swinging'
  | 'fielding'
  | 'result'
  | 'gameOver';

export type EngineConfig = {
  canvas: HTMLCanvasElement;
  glbUrl?: string;
  mode: GameMode;
  onPhaseChange?: (phase: EnginePhase) => void;
  onGameUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
};

export type Engine = {
  start(): Promise<void>;
  stop(): void;
  triggerSwing(): void;
  startNextPitch(): void;
  getPhase(): EnginePhase;
  getGameState(): GameState;
  resize(w: number, h: number): void;
};

// ============================================================================
// Constants
// ============================================================================

const PITCH_LANES: PitchLane[] = [
  'MID_MID',
  'IN_MID',
  'OUT_MID',
  'MID_HIGH',
  'MID_LOW',
  'IN_HIGH',
  'IN_LOW',
  'OUT_HIGH',
  'OUT_LOW',
];

const RESULT_DELAY = 1.5; // seconds to show result before next pitch

// ============================================================================
// Engine Factory
// ============================================================================

export function createEngine(config: EngineConfig): Engine {
  const { canvas, glbUrl, mode, onPhaseChange, onGameUpdate, onGameOver } = config;

  // Three.js setup
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  const cameraRig = new CameraRig(canvas.clientWidth / canvas.clientHeight);

  // Game state
  let sceneIndex: SceneIndex | null = null;
  let gameState = createGameState(mode);
  let phase: EnginePhase = 'loading';
  let running = false;
  let lastTime = 0;

  // Pitch/batting state
  let currentPitch: PitchController | null = null;
  let swingState: SwingState | null = null;
  let battedBall: BattedBall | null = null;
  let resultTimer = 0;
  let pitchSeed = Date.now();

  // Ball pool
  const ballPool = new BallPool(() => createBallMesh());

  // Lighting
  function setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(20, -20, 30);
    sun.castShadow = false;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-10, 10, 5);
    scene.add(fill);
  }

  // Phase management
  function setPhase(newPhase: EnginePhase) {
    if (phase === newPhase) return;
    phase = newPhase;
    onPhaseChange?.(phase);

    // Camera changes based on phase
    switch (phase) {
      case 'ready':
      case 'pitching':
        cameraRig.switchTo(CAMERA_PRESETS.atBat);
        break;
      case 'fielding':
        cameraRig.switchTo(CAMERA_PRESETS.fieldPlay);
        break;
      case 'result':
        // Stay on current camera
        break;
      case 'gameOver':
        cameraRig.switchTo(CAMERA_PRESETS.homeRun);
        break;
    }
  }

  // Pick random pitch lane
  function randomLane(): PitchLane {
    pitchSeed = (pitchSeed * 1103515245 + 12345) >>> 0;
    return PITCH_LANES[pitchSeed % PITCH_LANES.length];
  }

  // Handle strike zone crossing
  function handleStrikeCross(ev: StrikeCrossEvent) {
    if (!swingState || swingState.swingTriggered) return;

    // HR Derby mode - taking a pitch is an out
    if (gameState.mode === 'hrDerby') {
      gameState = recordDerbyOut(gameState);
      onGameUpdate?.(gameState);
      resultTimer = RESULT_DELAY;
      setPhase('result');
      return;
    }

    // Normal mode - determine ball or strike
    if (ev.isInZone) {
      gameState = recordStrike(gameState);
    } else {
      gameState = recordBall(gameState);
    }

    onGameUpdate?.(gameState);

    // Check for strikeout or walk
    const status = getGameStatus(gameState);
    if (status === 'strikeout' || status === 'walk') {
      if (status === 'strikeout') {
        gameState = recordOut(gameState);
      } else {
        gameState = advanceRunners(gameState, 1); // Walk advances runners
      }
      onGameUpdate?.(gameState);
    }

    resultTimer = RESULT_DELAY;
    setPhase('result');
  }

  // Process swing contact
  function processSwing() {
    if (!currentPitch || !swingState || !sceneIndex) return;

    const cross = currentPitch.lastCross;
    if (!cross) {
      // Swing and miss (ball hasn't crossed yet or no cross)
      if (gameState.mode === 'hrDerby') {
        gameState = recordDerbyOut(gameState);
      } else {
        gameState = recordStrike(gameState);
      }
      onGameUpdate?.(gameState);
      resultTimer = RESULT_DELAY;
      setPhase('result');
      return;
    }

    // Evaluate contact
    const contact = evaluateContact(swingState, cross, pitchSeed);

    if (contact.quality === 'whiff') {
      if (gameState.mode === 'hrDerby') {
        gameState = recordDerbyOut(gameState);
      } else {
        gameState = recordStrike(gameState);
      }
      onGameUpdate?.(gameState);
      resultTimer = RESULT_DELAY;
      setPhase('result');
      return;
    }

    // Generate batted ball
    battedBall = generateBattedBall(contact.quality, contact.timing, cross, pitchSeed, 'Z');

    // Camera feedback
    if (contact.quality === 'good' || contact.quality === 'perfect') {
      cameraRig.shake(contact.quality === 'perfect' ? 0.15 : 0.08);
    }

    // Stop pitch, show fielding view
    currentPitch.stop();
    setPhase('fielding');
  }

  // Resolve batted ball outcome
  function resolvePlay() {
    if (!battedBall || !sceneIndex) return;

    const result = resolveFieldingPlay(battedBall, sceneIndex, pitchSeed);

    // HR Derby mode - only HRs count, everything else is an out
    if (gameState.mode === 'hrDerby') {
      if (result.basesAdvanced === 'homeRun') {
        gameState = recordDerbyHR(gameState);
      } else {
        gameState = recordDerbyOut(gameState);
      }
    } else {
      // Normal mode
      if (result.isOut) {
        gameState = recordOut(gameState);
      } else {
        gameState = recordHit(gameState, result.basesAdvanced);
      }
    }

    onGameUpdate?.(gameState);
    battedBall = null;
    resultTimer = RESULT_DELAY;
    setPhase('result');
  }

  // Main update loop
  function update(dt: number) {
    cameraRig.update(dt);

    switch (phase) {
      case 'pitching':
        if (currentPitch?.active) {
          currentPitch.update(dt);

          // Check if swing was triggered
          if (swingState?.swingTriggered && !swingState.contactProcessed) {
            // Wait for optimal contact window
            const swingProgress = (performance.now() - swingState.swingStartTime) / 1000;
            if (swingProgress >= 0.15) {
              // ~150ms swing time
              swingState.contactProcessed = true;
              processSwing();
            }
          }
        } else if (currentPitch && !currentPitch.active) {
          // Pitch finished without swing
          if (phase === 'pitching') {
            resultTimer = RESULT_DELAY;
            setPhase('result');
          }
        }
        break;

      case 'fielding':
        if (battedBall) {
          // Animate ball briefly then resolve
          resultTimer += dt;
          if (resultTimer >= 0.8) {
            resolvePlay();
            resultTimer = 0;
          }
        }
        break;

      case 'result':
        resultTimer -= dt;
        if (resultTimer <= 0) {
          // Check game over conditions
          const status = getGameStatus(gameState);
          if (status === 'gameOver') {
            setPhase('gameOver');
            onGameOver?.(gameState);
          } else {
            gameState = nextPitch(gameState);
            onGameUpdate?.(gameState);
            setPhase('ready');
          }
        }
        break;
    }
  }

  // Render loop
  function render(time: number) {
    if (!running) return;

    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt at 100ms
    lastTime = time;

    update(dt);
    renderer.render(scene, cameraRig.threeCamera);

    requestAnimationFrame(render);
  }

  // Public API
  const engine: Engine = {
    async start() {
      setupLighting();

      // Load GLB or use fallback
      if (glbUrl) {
        try {
          const gltf = await loadGLB(glbUrl);
          scene.add(gltf.scene);
          sceneIndex = gltf.index;

          // Validate nodes
          const validation = validateRequiredNodes(sceneIndex);
          if (!validation.valid) {
            console.warn('GLB validation warnings:', validation.missing);
          }

          cameraRig.bindIndex(sceneIndex);
        } catch (err) {
          console.warn('Failed to load GLB, using fallback:', err);
          sceneIndex = buildFallbackScene(scene);
        }
      } else {
        sceneIndex = buildFallbackScene(scene);
      }

      setPhase('ready');
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(render);
    },

    stop() {
      running = false;
      currentPitch?.stop();
    },

    triggerSwing() {
      if (phase !== 'pitching' || !swingState || swingState.swingTriggered) return;

      swingState.swingTriggered = true;
      swingState.swingStartTime = performance.now();
      setPhase('swinging');
    },

    startNextPitch() {
      if (phase !== 'ready' || !sceneIndex) return;

      const lane = randomLane();
      swingState = createSwingState();

      currentPitch = spawnPitch({
        index: sceneIndex,
        scene,
        lane,
        seed: pitchSeed++,
        upAxis: 'Z',
        ballPool,
        autoReleaseToPool: false,
        onStrikeCross: handleStrikeCross,
      });

      setPhase('pitching');
    },

    getPhase() {
      return phase;
    },

    getGameState() {
      return gameState;
    },

    resize(w: number, h: number) {
      renderer.setSize(w, h);
      cameraRig.setAspect(w / h);
    },
  };

  return engine;
}
