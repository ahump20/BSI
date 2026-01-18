/**
 * TechTree - Unlock progression for BlazeCraft
 *
 * Three branches matching the three resources:
 * - Analytics (Intel): Data overlays, stats, predictions
 * - Reputation (Influence): Team bonuses, multi-favorites
 * - Operations (Momentum): Refresh rates, alerts, views
 */

import type { Resources, ResourceType, ResourceDelta } from './ResourceSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TechBranch = 'analytics' | 'reputation' | 'operations';
export type TechTier = 1 | 2 | 3;

export type TechNodeId =
  // Analytics branch
  | 'basic_scouting'
  | 'advanced_stats'
  | 'predictive_models'
  // Reputation branch
  | 'local_following'
  | 'regional_recognition'
  | 'national_presence'
  // Operations branch
  | 'quick_response'
  | 'realtime_alerts'
  | 'command_center';

export interface TechNode {
  id: TechNodeId;
  name: string;
  description: string;
  branch: TechBranch;
  tier: TechTier;
  cost: ResourceDelta;
  requires: TechNodeId | null;
  effect: TechEffect;
}

export interface TechEffect {
  type: TechEffectType;
  value: number | string | string[];
  description: string;
}

export type TechEffectType =
  | 'stat_overlay'       // Show additional stats
  | 'intel_bonus'        // % bonus to Intel from favorites
  | 'favorite_slots'     // Additional favorite team slots
  | 'data_access'        // Premium data access level
  | 'refresh_rate'       // Seconds faster refresh
  | 'feature_unlock'     // Unlock specific feature
  | 'view_mode';         // Multi-game view capability

export interface TechTreeState {
  unlockedNodes: TechNodeId[];
  lastUnlock: number;
}

export interface TechTreeCallbacks {
  onNodeUnlock?: (node: TechNode) => void;
  onEffectApply?: (effect: TechEffect) => void;
}

export interface ActiveEffects {
  statOverlays: string[];
  intelBonusPercent: number;
  favoriteSlots: number;
  dataAccessLevel: 'basic' | 'pro' | 'premium';
  refreshRateBonus: number;
  unlockedFeatures: string[];
  multiGameView: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'blazecraft_techtree';

/**
 * All tech nodes in the tree
 */
export const TECH_NODES: Record<TechNodeId, TechNode> = {
  // Analytics Branch (Intel)
  basic_scouting: {
    id: 'basic_scouting',
    name: 'Basic Scouting',
    description: 'See opponent batting averages and basic stats',
    branch: 'analytics',
    tier: 1,
    cost: { intel: 50 },
    requires: null,
    effect: {
      type: 'stat_overlay',
      value: ['batting_avg', 'era'],
      description: 'Show batting average and ERA overlays',
    },
  },
  advanced_stats: {
    id: 'advanced_stats',
    name: 'Advanced Stats',
    description: 'WAR overlay, pitch tracking, detailed analytics',
    branch: 'analytics',
    tier: 2,
    cost: { intel: 150 },
    requires: 'basic_scouting',
    effect: {
      type: 'stat_overlay',
      value: ['war', 'pitch_tracking', 'advanced'],
      description: 'Show WAR, pitch tracking, and advanced metrics',
    },
  },
  predictive_models: {
    id: 'predictive_models',
    name: 'Predictive Models',
    description: 'Win probability calculations and matchup history',
    branch: 'analytics',
    tier: 3,
    cost: { intel: 400 },
    requires: 'advanced_stats',
    effect: {
      type: 'feature_unlock',
      value: ['win_probability', 'matchup_history', 'predictions'],
      description: 'Unlock predictive analysis features',
    },
  },

  // Reputation Branch (Influence)
  local_following: {
    id: 'local_following',
    name: 'Local Following',
    description: '+10% Intel from favorite teams',
    branch: 'reputation',
    tier: 1,
    cost: { influence: 30 },
    requires: null,
    effect: {
      type: 'intel_bonus',
      value: 10,
      description: 'Gain 10% bonus Intel from favorite team events',
    },
  },
  regional_recognition: {
    id: 'regional_recognition',
    name: 'Regional Recognition',
    description: 'Unlock 2nd favorite team slot',
    branch: 'reputation',
    tier: 2,
    cost: { influence: 100 },
    requires: 'local_following',
    effect: {
      type: 'favorite_slots',
      value: 2,
      description: 'Track 2 favorite teams simultaneously',
    },
  },
  national_presence: {
    id: 'national_presence',
    name: 'National Presence',
    description: 'Premium data access, 4 favorite slots',
    branch: 'reputation',
    tier: 3,
    cost: { influence: 250 },
    requires: 'regional_recognition',
    effect: {
      type: 'data_access',
      value: 'premium',
      description: 'Premium data access with 4 favorite team slots',
    },
  },

  // Operations Branch (Momentum)
  quick_response: {
    id: 'quick_response',
    name: 'Quick Response',
    description: '15s faster refresh (vs 30s default)',
    branch: 'operations',
    tier: 1,
    cost: { momentum: 20 },
    requires: null,
    effect: {
      type: 'refresh_rate',
      value: 15,
      description: 'Reduce data refresh interval by 15 seconds',
    },
  },
  realtime_alerts: {
    id: 'realtime_alerts',
    name: 'Real-Time Alerts',
    description: 'Push notifications and priority events',
    branch: 'operations',
    tier: 2,
    cost: { momentum: 60 },
    requires: 'quick_response',
    effect: {
      type: 'feature_unlock',
      value: ['push_notifications', 'priority_events', 'alerts'],
      description: 'Enable real-time alert notifications',
    },
  },
  command_center: {
    id: 'command_center',
    name: 'Command Center',
    description: 'Multi-game view and custom dashboards',
    branch: 'operations',
    tier: 3,
    cost: { momentum: 150 },
    requires: 'realtime_alerts',
    effect: {
      type: 'view_mode',
      value: 'multi_game',
      description: 'Unlock multi-game simultaneous viewing',
    },
  },
};

/**
 * Branch configuration
 */
export const BRANCH_CONFIG: Record<TechBranch, {
  name: string;
  description: string;
  resourceType: ResourceType;
  color: string;
}> = {
  analytics: {
    name: 'Analytics',
    description: 'Data and statistics unlocks',
    resourceType: 'intel',
    color: '#3498DB',
  },
  reputation: {
    name: 'Reputation',
    description: 'Team bonuses and access',
    resourceType: 'influence',
    color: '#9B59B6',
  },
  operations: {
    name: 'Operations',
    description: 'Speed and feature unlocks',
    resourceType: 'momentum',
    color: '#E67E22',
  },
};

// ─────────────────────────────────────────────────────────────
// TechTree Class
// ─────────────────────────────────────────────────────────────

export class TechTree {
  private state: TechTreeState;
  private callbacks: TechTreeCallbacks;

  constructor(callbacks: TechTreeCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = this.loadState();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if a node is unlocked
   */
  isUnlocked(nodeId: TechNodeId): boolean {
    return this.state.unlockedNodes.includes(nodeId);
  }

  /**
   * Check if a node can be unlocked (prerequisites met, not already unlocked)
   */
  canUnlock(nodeId: TechNodeId, resources: Resources): boolean {
    const node = TECH_NODES[nodeId];
    if (!node) return false;

    // Already unlocked
    if (this.isUnlocked(nodeId)) return false;

    // Check prerequisite
    if (node.requires && !this.isUnlocked(node.requires)) return false;

    // Check cost
    if (node.cost.intel && resources.intel < node.cost.intel) return false;
    if (node.cost.influence && resources.influence < node.cost.influence) return false;
    if (node.cost.momentum && resources.momentum < node.cost.momentum) return false;

    return true;
  }

  /**
   * Attempt to unlock a node (returns cost if successful, null if failed)
   */
  unlock(nodeId: TechNodeId, resources: Resources): ResourceDelta | null {
    if (!this.canUnlock(nodeId, resources)) return null;

    const node = TECH_NODES[nodeId];
    this.state.unlockedNodes.push(nodeId);
    this.state.lastUnlock = Date.now();
    this.saveState();

    this.callbacks.onNodeUnlock?.(node);
    this.callbacks.onEffectApply?.(node.effect);

    return node.cost;
  }

  /**
   * Get all nodes in a branch
   */
  getBranchNodes(branch: TechBranch): TechNode[] {
    return Object.values(TECH_NODES)
      .filter(n => n.branch === branch)
      .sort((a, b) => a.tier - b.tier);
  }

  /**
   * Get all unlocked nodes
   */
  getUnlockedNodes(): TechNode[] {
    return this.state.unlockedNodes.map(id => TECH_NODES[id]);
  }

  /**
   * Get next available nodes (unlockable with enough resources)
   */
  getAvailableNodes(resources: Resources): TechNode[] {
    return Object.values(TECH_NODES)
      .filter(node => this.canUnlock(node.id, resources));
  }

  /**
   * Get progress in each branch (0-3)
   */
  getBranchProgress(): Record<TechBranch, number> {
    const progress: Record<TechBranch, number> = {
      analytics: 0,
      reputation: 0,
      operations: 0,
    };

    for (const nodeId of this.state.unlockedNodes) {
      const node = TECH_NODES[nodeId];
      if (node) {
        progress[node.branch] = Math.max(progress[node.branch], node.tier);
      }
    }

    return progress;
  }

  /**
   * Calculate active effects from all unlocked nodes
   */
  getActiveEffects(): ActiveEffects {
    const effects: ActiveEffects = {
      statOverlays: [],
      intelBonusPercent: 0,
      favoriteSlots: 1, // Default 1 slot
      dataAccessLevel: 'basic',
      refreshRateBonus: 0,
      unlockedFeatures: [],
      multiGameView: false,
    };

    for (const nodeId of this.state.unlockedNodes) {
      const node = TECH_NODES[nodeId];
      if (!node) continue;

      switch (node.effect.type) {
        case 'stat_overlay':
          effects.statOverlays.push(...(node.effect.value as string[]));
          break;
        case 'intel_bonus':
          effects.intelBonusPercent += node.effect.value as number;
          break;
        case 'favorite_slots':
          effects.favoriteSlots = Math.max(effects.favoriteSlots, node.effect.value as number);
          break;
        case 'data_access':
          if (node.effect.value === 'premium') {
            effects.dataAccessLevel = 'premium';
            effects.favoriteSlots = 4;
          } else if (node.effect.value === 'pro' && effects.dataAccessLevel === 'basic') {
            effects.dataAccessLevel = 'pro';
          }
          break;
        case 'refresh_rate':
          effects.refreshRateBonus += node.effect.value as number;
          break;
        case 'feature_unlock':
          effects.unlockedFeatures.push(...(node.effect.value as string[]));
          break;
        case 'view_mode':
          if (node.effect.value === 'multi_game') {
            effects.multiGameView = true;
          }
          break;
      }
    }

    return effects;
  }

  /**
   * Get a specific node's info with unlock status
   */
  getNodeInfo(nodeId: TechNodeId): TechNode & { unlocked: boolean; available: boolean } | null {
    const node = TECH_NODES[nodeId];
    if (!node) return null;

    return {
      ...node,
      unlocked: this.isUnlocked(nodeId),
      available: node.requires ? this.isUnlocked(node.requires) : true,
    };
  }

  /**
   * Get total number of unlocked nodes
   */
  getUnlockCount(): number {
    return this.state.unlockedNodes.length;
  }

  /**
   * Reset tech tree (for testing)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.saveState();
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private createInitialState(): TechTreeState {
    return {
      unlockedNodes: [],
      lastUnlock: 0,
    };
  }

  private loadState(): TechTreeState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TechTreeState;
        if (parsed && Array.isArray(parsed.unlockedNodes)) {
          // Validate node IDs
          parsed.unlockedNodes = parsed.unlockedNodes.filter(
            id => TECH_NODES[id as TechNodeId]
          ) as TechNodeId[];
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
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createTechTree(callbacks: TechTreeCallbacks = {}): TechTree {
  return new TechTree(callbacks);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get nodes organized by branch and tier for tree display
 */
export function getTechTreeLayout(): Record<TechBranch, TechNode[]> {
  return {
    analytics: Object.values(TECH_NODES)
      .filter(n => n.branch === 'analytics')
      .sort((a, b) => a.tier - b.tier),
    reputation: Object.values(TECH_NODES)
      .filter(n => n.branch === 'reputation')
      .sort((a, b) => a.tier - b.tier),
    operations: Object.values(TECH_NODES)
      .filter(n => n.branch === 'operations')
      .sort((a, b) => a.tier - b.tier),
  };
}

/**
 * Format cost for display
 */
export function formatTechCost(cost: ResourceDelta): string {
  if (cost.intel) return `${cost.intel} Intel`;
  if (cost.influence) return `${cost.influence} Influence`;
  if (cost.momentum) return `${cost.momentum} Momentum`;
  return 'Free';
}

/**
 * Check if player has unlocked any tier 3 tech
 */
export function hasMaxTierUnlock(state: TechTreeState): boolean {
  return state.unlockedNodes.some(id => TECH_NODES[id]?.tier === 3);
}
