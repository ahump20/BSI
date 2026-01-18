/**
 * ResourceSystem - Currency management for BlazeCraft
 *
 * Three resources tied to sports/agent events:
 * - Intel: Primary currency from score updates, completed tasks
 * - Influence: Reputation from correct predictions, achievements
 * - Momentum: Volatile currency from lead changes, hot streaks (decays)
 */

import type { GameEventType, SportType } from './GameEventContract';
import type { BuildingKind, Tier } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Resources {
  intel: number;
  influence: number;
  momentum: number;
}

export type ResourceType = keyof Resources;

export interface ResourceDelta {
  intel?: number;
  influence?: number;
  momentum?: number;
}

export interface ResourceEvent {
  type: 'gain' | 'spend' | 'decay';
  delta: ResourceDelta;
  source: string;
  timestamp: number;
}

export interface ResourceState {
  current: Resources;
  lifetime: Resources;
  lastUpdate: number;
  history: ResourceEvent[];
}

export interface ResourceCallbacks {
  onResourceChange?: (resources: Resources, delta: ResourceDelta, source: string) => void;
  onMilestone?: (resource: ResourceType, milestone: number) => void;
}

export interface BuildingModifiers {
  intelMultiplier: number;      // From Workshop upgrades
  influenceMultiplier: number;  // From Library upgrades
  momentumMultiplier: number;   // From Market upgrades
  passiveIntel: number;         // From Town Hall tier
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'blazecraft_resources';
const MAX_HISTORY_ITEMS = 50;
const MOMENTUM_DECAY_INTERVAL_MS = 60000; // 1 minute
const MOMENTUM_DECAY_AMOUNT = 1;

/**
 * Resource rewards per game event type
 */
export const EVENT_REWARDS: Record<GameEventType, ResourceDelta> = {
  WORLD_TICK: {},
  GAME_START: { intel: 5, momentum: 10 },
  GAME_UPDATE: { intel: 2, momentum: 5 },
  GAME_FINAL: { intel: 5 },
  STANDINGS_DELTA: { intel: 15, influence: 5, momentum: 8 },
  LINEUP_POSTED: { intel: 3 },
  ODDS_SHIFT: { intel: 10, influence: 8, momentum: 15 },
  HIGHLIGHT_CLIP: { intel: 5, influence: 2 },
  INJURY_ALERT: { intel: 8 },
};

/**
 * Bonus multipliers for specific play types
 */
export const PLAY_TYPE_BONUSES: Record<string, ResourceDelta> = {
  home_run: { intel: 5, momentum: 15 },
  touchdown: { intel: 8, momentum: 20 },
  three_pointer: { intel: 3, momentum: 8 },
  slam_dunk: { intel: 4, momentum: 12 },
  strikeout: { intel: 2, momentum: 3 },
  interception: { intel: 6, momentum: 10 },
  field_goal: { intel: 2, momentum: 5 },
  lead_change: { momentum: 25 },
};

/**
 * Resource milestones for notifications
 */
const MILESTONES = {
  intel: [50, 100, 250, 500, 1000, 2500, 5000],
  influence: [30, 100, 250, 500, 1000],
  momentum: [50, 100, 200],
};

/**
 * Favorite team bonus multiplier
 */
const FAVORITE_TEAM_MULTIPLIER = 2;

/**
 * Prediction rewards
 */
export const PREDICTION_REWARDS = {
  correct: { intel: 20, influence: 15 },
  incorrect: { intel: 5, influence: -5, momentum: -10 },
};

/**
 * Agent task rewards
 */
export const AGENT_REWARDS = {
  task_complete: { intel: 10, influence: 3, momentum: 2 },
  building_upgrade: { intel: 25, influence: 10, momentum: 5 },
};

// ─────────────────────────────────────────────────────────────
// ResourceSystem Class
// ─────────────────────────────────────────────────────────────

export class ResourceSystem {
  private state: ResourceState;
  private callbacks: ResourceCallbacks;
  private decayTimer: ReturnType<typeof setInterval> | null = null;
  private modifiers: BuildingModifiers;
  private reachedMilestones: Set<string>;

  constructor(callbacks: ResourceCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = this.loadState();
    this.modifiers = this.createDefaultModifiers();
    this.reachedMilestones = this.loadReachedMilestones();
    this.startDecayTimer();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Get current resource values
   */
  getResources(): Resources {
    return { ...this.state.current };
  }

  /**
   * Get lifetime resource totals
   */
  getLifetimeResources(): Resources {
    return { ...this.state.lifetime };
  }

  /**
   * Get recent resource history
   */
  getHistory(): ResourceEvent[] {
    return [...this.state.history];
  }

  /**
   * Add resources from a game event
   */
  addFromGameEvent(
    eventType: GameEventType,
    playType?: string,
    isFavoriteTeam?: boolean
  ): ResourceDelta {
    let delta = { ...EVENT_REWARDS[eventType] };

    // Add play type bonuses
    if (playType && PLAY_TYPE_BONUSES[playType]) {
      const bonus = PLAY_TYPE_BONUSES[playType];
      delta = this.mergeDelta(delta, bonus);
    }

    // Apply favorite team multiplier
    if (isFavoriteTeam) {
      delta = this.multiplyDelta(delta, FAVORITE_TEAM_MULTIPLIER);
    }

    // Apply building modifiers
    delta = this.applyModifiers(delta);

    this.addResources(delta, `game_event:${eventType}${playType ? `:${playType}` : ''}`);
    return delta;
  }

  /**
   * Add resources from agent task completion
   */
  addFromAgentTask(taskType: 'task_complete' | 'building_upgrade'): ResourceDelta {
    const delta = this.applyModifiers({ ...AGENT_REWARDS[taskType] });
    this.addResources(delta, `agent:${taskType}`);
    return delta;
  }

  /**
   * Add resources from prediction result
   */
  addFromPrediction(correct: boolean): ResourceDelta {
    const delta = correct
      ? this.applyModifiers({ ...PREDICTION_REWARDS.correct })
      : { ...PREDICTION_REWARDS.incorrect };

    this.addResources(delta, `prediction:${correct ? 'correct' : 'incorrect'}`);
    return delta;
  }

  /**
   * Spend resources (returns false if insufficient)
   */
  spend(cost: ResourceDelta): boolean {
    if (!this.canAfford(cost)) return false;

    const negativeDelta: ResourceDelta = {};
    if (cost.intel) negativeDelta.intel = -cost.intel;
    if (cost.influence) negativeDelta.influence = -cost.influence;
    if (cost.momentum) negativeDelta.momentum = -cost.momentum;

    this.addResources(negativeDelta, 'spend');
    return true;
  }

  /**
   * Check if player can afford a cost
   */
  canAfford(cost: ResourceDelta): boolean {
    const current = this.state.current;
    if (cost.intel && current.intel < cost.intel) return false;
    if (cost.influence && current.influence < cost.influence) return false;
    if (cost.momentum && current.momentum < cost.momentum) return false;
    return true;
  }

  /**
   * Update building modifiers based on building tiers
   */
  updateModifiers(buildings: Record<BuildingKind, { tier: Tier }>): void {
    // Town Hall: +1 passive Intel per minute per tier
    const townhallTier = buildings.townhall?.tier ?? 0;
    this.modifiers.passiveIntel = townhallTier;

    // Workshop: +10%/20%/30% Intel generation
    const workshopTier = buildings.workshop?.tier ?? 0;
    this.modifiers.intelMultiplier = 1 + workshopTier * 0.1;

    // Library: +10%/20%/30% Influence generation
    const libraryTier = buildings.library?.tier ?? 0;
    this.modifiers.influenceMultiplier = 1 + libraryTier * 0.1;

    // Market: +20%/40%/60% Momentum from odds shifts
    const marketTier = buildings.market?.tier ?? 0;
    this.modifiers.momentumMultiplier = 1 + marketTier * 0.2;
  }

  /**
   * Manually add resources (for testing/admin)
   */
  addResources(delta: ResourceDelta, source: string): void {
    const current = this.state.current;
    const lifetime = this.state.lifetime;

    // Apply delta
    if (delta.intel) {
      current.intel = Math.max(0, current.intel + delta.intel);
      if (delta.intel > 0) lifetime.intel += delta.intel;
    }
    if (delta.influence) {
      current.influence = Math.max(0, current.influence + delta.influence);
      if (delta.influence > 0) lifetime.influence += delta.influence;
    }
    if (delta.momentum) {
      current.momentum = Math.max(0, current.momentum + delta.momentum);
      if (delta.momentum > 0) lifetime.momentum += delta.momentum;
    }

    // Record event
    const event: ResourceEvent = {
      type: delta.intel! < 0 || delta.influence! < 0 || delta.momentum! < 0 ? 'spend' : 'gain',
      delta,
      source,
      timestamp: Date.now(),
    };

    this.state.history = [event, ...this.state.history.slice(0, MAX_HISTORY_ITEMS - 1)];
    this.state.lastUpdate = Date.now();

    // Check milestones
    this.checkMilestones();

    // Notify callback
    this.callbacks.onResourceChange?.(this.getResources(), delta, source);

    // Persist
    this.saveState();
  }

  /**
   * Reset all resources (for testing)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.reachedMilestones.clear();
    this.saveState();
    this.saveReachedMilestones();
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private createInitialState(): ResourceState {
    return {
      current: { intel: 0, influence: 0, momentum: 0 },
      lifetime: { intel: 0, influence: 0, momentum: 0 },
      lastUpdate: Date.now(),
      history: [],
    };
  }

  private createDefaultModifiers(): BuildingModifiers {
    return {
      intelMultiplier: 1,
      influenceMultiplier: 1,
      momentumMultiplier: 1,
      passiveIntel: 0,
    };
  }

  private loadState(): ResourceState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ResourceState;
        if (parsed && typeof parsed.current === 'object') {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return this.createInitialState();
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore
    }
  }

  private loadReachedMilestones(): Set<string> {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_milestones`);
      if (saved) {
        return new Set(JSON.parse(saved) as string[]);
      }
    } catch {
      // Ignore
    }
    return new Set();
  }

  private saveReachedMilestones(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_milestones`, JSON.stringify([...this.reachedMilestones]));
    } catch {
      // Ignore
    }
  }

  private startDecayTimer(): void {
    if (this.decayTimer) return;

    this.decayTimer = setInterval(() => {
      this.applyMomentumDecay();
      this.applyPassiveIncome();
    }, MOMENTUM_DECAY_INTERVAL_MS);
  }

  private applyMomentumDecay(): void {
    if (this.state.current.momentum <= 0) return;

    const decay = Math.min(MOMENTUM_DECAY_AMOUNT, this.state.current.momentum);
    const delta: ResourceDelta = { momentum: -decay };

    const event: ResourceEvent = {
      type: 'decay',
      delta,
      source: 'momentum_decay',
      timestamp: Date.now(),
    };

    this.state.current.momentum -= decay;
    this.state.history = [event, ...this.state.history.slice(0, MAX_HISTORY_ITEMS - 1)];
    this.state.lastUpdate = Date.now();

    this.callbacks.onResourceChange?.(this.getResources(), delta, 'momentum_decay');
    this.saveState();
  }

  private applyPassiveIncome(): void {
    if (this.modifiers.passiveIntel <= 0) return;

    const delta: ResourceDelta = { intel: this.modifiers.passiveIntel };
    this.addResources(delta, 'passive_income:townhall');
  }

  private mergeDelta(base: ResourceDelta, addition: ResourceDelta): ResourceDelta {
    return {
      intel: (base.intel ?? 0) + (addition.intel ?? 0) || undefined,
      influence: (base.influence ?? 0) + (addition.influence ?? 0) || undefined,
      momentum: (base.momentum ?? 0) + (addition.momentum ?? 0) || undefined,
    };
  }

  private multiplyDelta(delta: ResourceDelta, multiplier: number): ResourceDelta {
    return {
      intel: delta.intel ? Math.round(delta.intel * multiplier) : undefined,
      influence: delta.influence ? Math.round(delta.influence * multiplier) : undefined,
      momentum: delta.momentum ? Math.round(delta.momentum * multiplier) : undefined,
    };
  }

  private applyModifiers(delta: ResourceDelta): ResourceDelta {
    return {
      intel: delta.intel ? Math.round(delta.intel * this.modifiers.intelMultiplier) : undefined,
      influence: delta.influence ? Math.round(delta.influence * this.modifiers.influenceMultiplier) : undefined,
      momentum: delta.momentum ? Math.round(delta.momentum * this.modifiers.momentumMultiplier) : undefined,
    };
  }

  private checkMilestones(): void {
    const resources = this.state.current;

    for (const [resource, thresholds] of Object.entries(MILESTONES)) {
      const value = resources[resource as ResourceType];
      for (const threshold of thresholds) {
        const key = `${resource}:${threshold}`;
        if (value >= threshold && !this.reachedMilestones.has(key)) {
          this.reachedMilestones.add(key);
          this.saveReachedMilestones();
          this.callbacks.onMilestone?.(resource as ResourceType, threshold);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createResourceSystem(callbacks: ResourceCallbacks = {}): ResourceSystem {
  return new ResourceSystem(callbacks);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Format resource delta for display (e.g., "+5 Intel, +10 Momentum")
 */
export function formatResourceDelta(delta: ResourceDelta): string {
  const parts: string[] = [];

  if (delta.intel) {
    parts.push(`${delta.intel > 0 ? '+' : ''}${delta.intel} Intel`);
  }
  if (delta.influence) {
    parts.push(`${delta.influence > 0 ? '+' : ''}${delta.influence} Influence`);
  }
  if (delta.momentum) {
    parts.push(`${delta.momentum > 0 ? '+' : ''}${delta.momentum} Momentum`);
  }

  return parts.join(', ') || 'No resources';
}

/**
 * Get resource trend (up/down/stable) based on recent history
 */
export function getResourceTrend(
  history: ResourceEvent[],
  resource: ResourceType
): 'up' | 'down' | 'stable' {
  const recentEvents = history.slice(0, 10);
  let netChange = 0;

  for (const event of recentEvents) {
    const delta = event.delta[resource];
    if (delta) netChange += delta;
  }

  if (netChange > 5) return 'up';
  if (netChange < -5) return 'down';
  return 'stable';
}
