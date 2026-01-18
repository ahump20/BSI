/**
 * Sandlot Sluggers - Main Entry Point
 * Boots the game engine and UI.
 */

import { createEngine, type Engine, type EnginePhase } from './syb/engine';
import { createUI, updateUI, showMessage, type UIElements } from './syb/ui';
import type { GameState, GameMode } from './syb/gameState';

// ============================================================================
// Configuration
// ============================================================================

const GLB_URL = import.meta.env.VITE_GLB_URL || '/assets/sandlot-field.glb';
const DEFAULT_MODE: GameMode = 'practice';

// ============================================================================
// Application State
// ============================================================================

let engine: Engine | null = null;
let ui: UIElements | null = null;
let currentMode: GameMode = DEFAULT_MODE;

// ============================================================================
// Input Handling
// ============================================================================

function setupInputHandlers() {
  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  });

  // Touch / Click on canvas
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.addEventListener('click', handleAction);
    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        handleAction();
      },
      { passive: false }
    );
  }
}

function handleAction() {
  if (!engine) return;

  const phase = engine.getPhase();

  switch (phase) {
    case 'ready':
      engine.startNextPitch();
      break;
    case 'pitching':
      engine.triggerSwing();
      break;
    case 'gameOver':
      // Restart game
      restartGame();
      break;
  }
}

// ============================================================================
// Game Lifecycle
// ============================================================================

async function initGame(mode: GameMode = DEFAULT_MODE) {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const container = document.getElementById('game-container');

  if (!canvas || !container) {
    console.error('Required DOM elements not found');
    return;
  }

  // Size canvas to container
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  currentMode = mode;

  // Create UI
  ui = createUI({
    parent: container,
    onSwing: handleAction,
  });

  // Create engine
  engine = createEngine({
    canvas,
    glbUrl: GLB_URL,
    mode,
    onPhaseChange: handlePhaseChange,
    onGameUpdate: handleGameUpdate,
    onGameOver: handleGameOver,
  });

  // Start engine
  try {
    await engine.start();
    showMessage(ui, 'Ready!', 1500);

    // Initial UI update
    updateUI(ui, engine.getGameState(), engine.getPhase());
  } catch (err) {
    console.error('Failed to start game:', err);
    showMessage(ui, 'Failed to load game', 0);
  }
}

function restartGame() {
  if (engine) {
    engine.stop();
  }
  if (ui) {
    ui.container.remove();
  }
  initGame(currentMode);
}

// ============================================================================
// Event Handlers
// ============================================================================

function handlePhaseChange(phase: EnginePhase) {
  if (!ui || !engine) return;

  updateUI(ui, engine.getGameState(), phase);

  // Show phase-specific messages
  switch (phase) {
    case 'swinging':
      // Quick feedback - could add swing animation here
      break;
    case 'fielding':
      // Show ball trajectory (handled by camera switch)
      break;
  }
}

function handleGameUpdate(state: GameState) {
  if (!ui || !engine) return;

  updateUI(ui, state, engine.getPhase());

  // Show count-related messages
  if (state.strikes === 3) {
    showMessage(ui, 'Strike Out!', 1200);
  } else if (state.balls === 4) {
    showMessage(ui, 'Walk!', 1200);
  } else if (state.strikes > 0 && state.balls === 0) {
    showMessage(ui, `Strike ${state.strikes}!`, 800);
  } else if (state.balls > 0 && state.strikes === 0) {
    showMessage(ui, `Ball ${state.balls}`, 800);
  }
}

function handleGameOver(state: GameState) {
  if (!ui) return;

  let message: string;
  if (state.mode === 'practice') {
    message = `Session Over!\nRuns: ${state.stats.runs} | Hits: ${state.stats.hits}`;
  } else if (state.mode === 'hrDerby') {
    message = `DERBY OVER!\n${state.stats.homeRuns} Home Runs\nStreak: ${state.stats.longestStreak}`;
  } else {
    message = `Game Over!\nFinal: ${state.stats.runs} Runs | ${state.stats.hits} Hits`;
  }

  showMessage(ui, message, 0); // Persistent until restart
}

// ============================================================================
// Resize Handling
// ============================================================================

function handleResize() {
  const container = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!container || !canvas || !engine) return;

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  engine.resize(rect.width, rect.height);
}

// ============================================================================
// Mode Selection (URL params or UI)
// ============================================================================

function getModeFromURL(): GameMode {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'quickPlay' || mode === 'practice' || mode === 'hrDerby') {
    return mode;
  }
  return DEFAULT_MODE;
}

// ============================================================================
// Bootstrap
// ============================================================================

function boot() {
  // Get mode from URL
  const mode = getModeFromURL();

  // Setup resize handler
  window.addEventListener('resize', handleResize);

  // Setup input handlers
  setupInputHandlers();

  // Initialize game
  initGame(mode);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Export for potential external control
export { initGame, restartGame, engine };
