/**
 * Sandlot Sluggers - UI System
 * HUD overlay for game state display and controls.
 */

import type { GameState, GameMode } from './gameState';
import type { EnginePhase } from './engine';

// ============================================================================
// Types
// ============================================================================

export type UIElements = {
  container: HTMLDivElement;
  scoreboard: HTMLDivElement;
  countDisplay: HTMLDivElement;
  messageDisplay: HTMLDivElement;
  controlHint: HTMLDivElement;
  modeIndicator: HTMLDivElement;
};

export type UIConfig = {
  parent: HTMLElement;
  onSwing?: () => void;
  onNextPitch?: () => void;
};

// ============================================================================
// Styles (inline for simplicity - could be CSS file)
// ============================================================================

const STYLES = `
  .syb-ui {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    font-family: 'Segoe UI', system-ui, sans-serif;
    user-select: none;
  }

  .syb-scoreboard {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    display: flex;
    gap: 24px;
    font-size: 18px;
    font-weight: 600;
  }

  .syb-scoreboard-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .syb-scoreboard-label {
    font-size: 11px;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .syb-scoreboard-value {
    font-size: 24px;
    font-weight: 700;
  }

  .syb-count {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .syb-count-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .syb-count-label {
    font-size: 12px;
    width: 16px;
    opacity: 0.7;
  }

  .syb-count-dots {
    display: flex;
    gap: 4px;
  }

  .syb-count-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: background 0.2s;
  }

  .syb-count-dot.active {
    background: #ffd700;
  }

  .syb-count-dot.strike.active {
    background: #ff4444;
  }

  .syb-count-dot.out.active {
    background: #ff6600;
  }

  .syb-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 24px 48px;
    border-radius: 12px;
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .syb-message.visible {
    opacity: 1;
  }

  .syb-control-hint {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.65);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    pointer-events: auto;
    cursor: pointer;
    transition: background 0.2s;
  }

  .syb-control-hint:hover {
    background: rgba(0, 0, 0, 0.85);
  }

  .syb-control-hint kbd {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    margin: 0 4px;
  }

  .syb-mode {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .syb-bases {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }

  .syb-base {
    width: 16px;
    height: 16px;
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(45deg);
    transition: background 0.2s;
  }

  .syb-base.occupied {
    background: #4CAF50;
  }

  @media (max-width: 600px) {
    .syb-scoreboard {
      padding: 8px 16px;
      gap: 16px;
      font-size: 14px;
    }

    .syb-scoreboard-value {
      font-size: 20px;
    }

    .syb-message {
      font-size: 24px;
      padding: 16px 32px;
    }

    .syb-control-hint {
      font-size: 12px;
      padding: 10px 16px;
    }
  }
`;

// ============================================================================
// UI Factory
// ============================================================================

export function createUI(config: UIConfig): UIElements {
  const { parent, onSwing } = config;

  // Inject styles
  if (!document.getElementById('syb-styles')) {
    const style = document.createElement('style');
    style.id = 'syb-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Container
  const container = document.createElement('div');
  container.className = 'syb-ui';

  // Mode indicator
  const modeIndicator = document.createElement('div');
  modeIndicator.className = 'syb-mode';
  modeIndicator.textContent = 'Practice';
  container.appendChild(modeIndicator);

  // Scoreboard
  const scoreboard = document.createElement('div');
  scoreboard.className = 'syb-scoreboard';
  scoreboard.innerHTML = `
    <div class="syb-scoreboard-item">
      <span class="syb-scoreboard-label">Inning</span>
      <span class="syb-scoreboard-value" data-field="inning">1</span>
    </div>
    <div class="syb-scoreboard-item">
      <span class="syb-scoreboard-label">Runs</span>
      <span class="syb-scoreboard-value" data-field="runs">0</span>
    </div>
    <div class="syb-scoreboard-item">
      <span class="syb-scoreboard-label">Hits</span>
      <span class="syb-scoreboard-value" data-field="hits">0</span>
    </div>
  `;
  container.appendChild(scoreboard);

  // Count display
  const countDisplay = document.createElement('div');
  countDisplay.className = 'syb-count';
  countDisplay.innerHTML = `
    <div class="syb-count-row">
      <span class="syb-count-label">B</span>
      <div class="syb-count-dots" data-field="balls">
        <div class="syb-count-dot"></div>
        <div class="syb-count-dot"></div>
        <div class="syb-count-dot"></div>
        <div class="syb-count-dot"></div>
      </div>
    </div>
    <div class="syb-count-row">
      <span class="syb-count-label">S</span>
      <div class="syb-count-dots" data-field="strikes">
        <div class="syb-count-dot strike"></div>
        <div class="syb-count-dot strike"></div>
        <div class="syb-count-dot strike"></div>
      </div>
    </div>
    <div class="syb-count-row">
      <span class="syb-count-label">O</span>
      <div class="syb-count-dots" data-field="outs">
        <div class="syb-count-dot out"></div>
        <div class="syb-count-dot out"></div>
        <div class="syb-count-dot out"></div>
      </div>
    </div>
    <div class="syb-bases" data-field="bases">
      <div class="syb-base" data-base="1"></div>
      <div class="syb-base" data-base="2"></div>
      <div class="syb-base" data-base="3"></div>
    </div>
  `;
  container.appendChild(countDisplay);

  // Message display
  const messageDisplay = document.createElement('div');
  messageDisplay.className = 'syb-message';
  container.appendChild(messageDisplay);

  // Control hint
  const controlHint = document.createElement('div');
  controlHint.className = 'syb-control-hint';
  controlHint.innerHTML = `Press <kbd>SPACE</kbd> or tap to swing`;
  container.appendChild(controlHint);

  // Event listeners
  controlHint.addEventListener('click', () => {
    onSwing?.();
  });

  parent.appendChild(container);

  return {
    container,
    scoreboard,
    countDisplay,
    messageDisplay,
    controlHint,
    modeIndicator,
  };
}

// ============================================================================
// UI Update Functions
// ============================================================================

export function updateScoreboard(ui: UIElements, state: GameState): void {
  const inningEl = ui.scoreboard.querySelector('[data-field="inning"]');
  const runsEl = ui.scoreboard.querySelector('[data-field="runs"]');
  const hitsEl = ui.scoreboard.querySelector('[data-field="hits"]');

  // HR Derby shows different stats
  if (state.mode === 'hrDerby') {
    const inningLabel =
      ui.scoreboard.querySelector('[data-field="inning"]')?.previousElementSibling;
    const runsLabel = ui.scoreboard.querySelector('[data-field="runs"]')?.previousElementSibling;
    const hitsLabel = ui.scoreboard.querySelector('[data-field="hits"]')?.previousElementSibling;

    if (inningLabel) inningLabel.textContent = 'Outs';
    if (runsLabel) runsLabel.textContent = 'HRs';
    if (hitsLabel) hitsLabel.textContent = 'Streak';

    if (inningEl) inningEl.textContent = `${state.stats.derbyOuts}/10`;
    if (runsEl) runsEl.textContent = String(state.stats.homeRuns);
    if (hitsEl) hitsEl.textContent = String(state.stats.currentStreak);
  } else {
    if (inningEl) inningEl.textContent = String(state.inning);
    if (runsEl) runsEl.textContent = String(state.stats.runs);
    if (hitsEl) hitsEl.textContent = String(state.stats.hits);
  }
}

export function updateCount(ui: UIElements, state: GameState): void {
  // Balls
  const ballDots = ui.countDisplay.querySelectorAll('[data-field="balls"] .syb-count-dot');
  ballDots.forEach((dot, i) => {
    dot.classList.toggle('active', i < state.balls);
  });

  // Strikes
  const strikeDots = ui.countDisplay.querySelectorAll('[data-field="strikes"] .syb-count-dot');
  strikeDots.forEach((dot, i) => {
    dot.classList.toggle('active', i < state.strikes);
  });

  // Outs
  const outDots = ui.countDisplay.querySelectorAll('[data-field="outs"] .syb-count-dot');
  outDots.forEach((dot, i) => {
    dot.classList.toggle('active', i < state.outs);
  });

  // Bases
  const bases = ui.countDisplay.querySelectorAll('[data-field="bases"] .syb-base');
  bases.forEach((base) => {
    const baseNum = base.getAttribute('data-base') || '0';
    const baseKey = baseNum === '1' ? 'first' : baseNum === '2' ? 'second' : 'third';
    const isOccupied = state.bases[baseKey as keyof typeof state.bases];
    base.classList.toggle('occupied', isOccupied);
  });
}

export function updateMode(ui: UIElements, mode: GameMode): void {
  const labels: Record<GameMode, string> = {
    practice: 'Practice Mode',
    quickPlay: '3-Inning Game',
    hrDerby: 'HR Derby',
  };
  ui.modeIndicator.textContent = labels[mode];
}

export function showMessage(ui: UIElements, text: string, duration = 1500): void {
  ui.messageDisplay.textContent = text;
  ui.messageDisplay.classList.add('visible');

  if (duration > 0) {
    setTimeout(() => {
      ui.messageDisplay.classList.remove('visible');
    }, duration);
  }
}

export function hideMessage(ui: UIElements): void {
  ui.messageDisplay.classList.remove('visible');
}

export function updateControlHint(ui: UIElements, phase: EnginePhase): void {
  const hints: Partial<Record<EnginePhase, string>> = {
    ready: `Press <kbd>SPACE</kbd> to start pitch`,
    pitching: `Press <kbd>SPACE</kbd> or tap to swing!`,
    result: 'Get ready...',
    gameOver: 'Game Over! Tap to play again',
  };

  const hint = hints[phase];
  if (hint) {
    ui.controlHint.innerHTML = hint;
    ui.controlHint.style.display = 'block';
  } else {
    ui.controlHint.style.display = 'none';
  }
}

// ============================================================================
// Full UI Update
// ============================================================================

export function updateUI(ui: UIElements, state: GameState, phase: EnginePhase): void {
  updateScoreboard(ui, state);
  updateCount(ui, state);
  updateMode(ui, state.mode);
  updateControlHint(ui, phase);
}
