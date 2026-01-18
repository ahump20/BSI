/**
 * UIMode - Mode system for BlazeCraft UI
 *
 * Three progressive disclosure modes:
 * - Spectator: Watch city, view scores, ticker (Free)
 * - Manager: Select buildings, event log, minimap, favorites (Free)
 * - Commander: Lineups, odds, highlights, agent commands, exports (Pro/Elite)
 *
 * Each mode unlocks additional UI panels and keyboard shortcuts.
 */

import type { PremiumTier } from './GameEventContract';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type UIMode = 'spectator' | 'manager' | 'commander';

export interface UIModeConfig {
  id: UIMode;
  label: string;
  description: string;
  requiredTier: PremiumTier;
  panels: PanelVisibility;
  shortcuts: KeyboardShortcut[];
}

export interface PanelVisibility {
  sportsTicker: boolean;
  minimap: boolean;
  eventLog: boolean;
  selectedPanel: boolean;
  heroPortrait: boolean;
  timelineScrubber: boolean;
  agentCard: boolean;
  lineupPanel: boolean;
  oddsPanel: boolean;
  highlightsPanel: boolean;
  exportPanel: boolean;
  favorites: boolean;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
}

// ─────────────────────────────────────────────────────────────
// Mode Configurations
// ─────────────────────────────────────────────────────────────

const SPECTATOR_MODE: UIModeConfig = {
  id: 'spectator',
  label: 'Spectator',
  description: 'Watch the city react to live games',
  requiredTier: null,
  panels: {
    sportsTicker: true,
    minimap: false,
    eventLog: false,
    selectedPanel: false,
    heroPortrait: true,
    timelineScrubber: false,
    agentCard: false,
    lineupPanel: false,
    oddsPanel: false,
    highlightsPanel: false,
    exportPanel: false,
    favorites: false,
  },
  shortcuts: [
    { key: 'Space', description: 'Pause/Resume', action: 'togglePause' },
    { key: 'Escape', description: 'Exit fullscreen', action: 'exitFullscreen' },
  ],
};

const MANAGER_MODE: UIModeConfig = {
  id: 'manager',
  label: 'Manager',
  description: 'Interact with buildings and track events',
  requiredTier: null,
  panels: {
    sportsTicker: true,
    minimap: true,
    eventLog: true,
    selectedPanel: true,
    heroPortrait: true,
    timelineScrubber: true,
    agentCard: false,
    lineupPanel: false,
    oddsPanel: false,
    highlightsPanel: false,
    exportPanel: false,
    favorites: true,
  },
  shortcuts: [
    { key: 'Space', description: 'Pause/Resume', action: 'togglePause' },
    { key: 'Escape', description: 'Deselect / Exit', action: 'deselect' },
    { key: 'M', description: 'Toggle minimap', action: 'toggleMinimap' },
    { key: 'E', description: 'Toggle event log', action: 'toggleEventLog' },
    { key: 'T', description: 'Toggle timeline', action: 'toggleTimeline' },
    { key: 'F', description: 'Favorite selected team', action: 'favoriteTeam' },
    { key: '1', description: 'Select MLB building', action: 'selectBuilding:townhall' },
    { key: '2', description: 'Select NFL building', action: 'selectBuilding:workshop' },
    { key: '3', description: 'Select NBA building', action: 'selectBuilding:library' },
  ],
};

const COMMANDER_MODE: UIModeConfig = {
  id: 'commander',
  label: 'Commander',
  description: 'Full control with premium data and exports',
  requiredTier: 'pro',
  panels: {
    sportsTicker: true,
    minimap: true,
    eventLog: true,
    selectedPanel: true,
    heroPortrait: true,
    timelineScrubber: true,
    agentCard: true,
    lineupPanel: true,
    oddsPanel: true,
    highlightsPanel: true,
    exportPanel: true,
    favorites: true,
  },
  shortcuts: [
    { key: 'Space', description: 'Pause/Resume', action: 'togglePause' },
    { key: 'Escape', description: 'Deselect / Exit', action: 'deselect' },
    { key: 'M', description: 'Toggle minimap', action: 'toggleMinimap' },
    { key: 'E', description: 'Toggle event log', action: 'toggleEventLog' },
    { key: 'T', description: 'Toggle timeline', action: 'toggleTimeline' },
    { key: 'F', description: 'Favorite selected team', action: 'favoriteTeam' },
    { key: 'L', description: 'Show lineups', action: 'showLineups' },
    { key: 'O', description: 'Show odds', action: 'showOdds' },
    { key: 'H', description: 'Show highlights', action: 'showHighlights' },
    { key: 'X', description: 'Export data', action: 'exportData' },
    { key: 'A', description: 'Agent commands', action: 'agentCommands' },
    { key: '1', description: 'Select MLB building', action: 'selectBuilding:townhall' },
    { key: '2', description: 'Select NFL building', action: 'selectBuilding:workshop' },
    { key: '3', description: 'Select NBA building', action: 'selectBuilding:library' },
    { key: 'S', description: 'Screenshot', action: 'screenshot', modifiers: ['ctrl'] },
  ],
};

// ─────────────────────────────────────────────────────────────
// Mode Registry
// ─────────────────────────────────────────────────────────────

export const UI_MODES: Record<UIMode, UIModeConfig> = {
  spectator: SPECTATOR_MODE,
  manager: MANAGER_MODE,
  commander: COMMANDER_MODE,
};

export const MODE_ORDER: UIMode[] = ['spectator', 'manager', 'commander'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getModeConfig(mode: UIMode): UIModeConfig {
  return UI_MODES[mode];
}

export function getDefaultMode(): UIMode {
  return 'manager';
}

export function canAccessMode(mode: UIMode, userTier: PremiumTier): boolean {
  const config = UI_MODES[mode];
  if (config.requiredTier === null) return true;
  if (userTier === 'elite') return true;
  if (userTier === 'pro' && config.requiredTier === 'pro') return true;
  return false;
}

export function getAvailableModes(userTier: PremiumTier): UIMode[] {
  return MODE_ORDER.filter((mode) => canAccessMode(mode, userTier));
}

export function getNextMode(current: UIMode, userTier: PremiumTier): UIMode {
  const available = getAvailableModes(userTier);
  const currentIndex = available.indexOf(current);
  if (currentIndex === -1) return available[0];
  return available[(currentIndex + 1) % available.length];
}

export function getPreviousMode(current: UIMode, userTier: PremiumTier): UIMode {
  const available = getAvailableModes(userTier);
  const currentIndex = available.indexOf(current);
  if (currentIndex === -1) return available[0];
  return available[(currentIndex - 1 + available.length) % available.length];
}

export function isPanelVisible(mode: UIMode, panel: keyof PanelVisibility): boolean {
  return UI_MODES[mode].panels[panel];
}

export function getShortcutsForMode(mode: UIMode): KeyboardShortcut[] {
  return UI_MODES[mode].shortcuts;
}

export function findShortcutAction(
  mode: UIMode,
  key: string,
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean }
): string | null {
  const shortcuts = UI_MODES[mode].shortcuts;

  for (const shortcut of shortcuts) {
    if (shortcut.key.toLowerCase() !== key.toLowerCase()) continue;

    const requiredMods = shortcut.modifiers || [];
    const hasCtrl = requiredMods.includes('ctrl');
    const hasShift = requiredMods.includes('shift');
    const hasAlt = requiredMods.includes('alt');

    if (
      hasCtrl === modifiers.ctrl &&
      hasShift === modifiers.shift &&
      hasAlt === modifiers.alt
    ) {
      return shortcut.action;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Mode State Hook Helper
// ─────────────────────────────────────────────────────────────

export interface UIModeState {
  mode: UIMode;
  config: UIModeConfig;
  setMode: (mode: UIMode) => void;
  cycleMode: () => void;
  isPanelVisible: (panel: keyof PanelVisibility) => boolean;
  handleKeyDown: (event: KeyboardEvent) => string | null;
}

/**
 * Creates initial mode state for use in React components.
 * Usage: const [modeState, setModeState] = useState(() => createInitialModeState(userTier));
 */
export function createInitialModeState(userTier: PremiumTier): { mode: UIMode; config: UIModeConfig } {
  const defaultMode = getDefaultMode();
  const mode = canAccessMode(defaultMode, userTier) ? defaultMode : 'spectator';
  return {
    mode,
    config: getModeConfig(mode),
  };
}
