/**
 * ProgressionSystem - XP, levels, and achievements for BlazeCraft
 *
 * Tracks:
 * - City XP earned from task completions, upgrades, agent actions
 * - City level with exponential thresholds
 * - Achievements with unlock conditions
 *
 * Part of Phase 3: Progression System
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ProgressionState {
  xp: number;
  level: number;
  totalTasksCompleted: number;
  totalUpgrades: number;
  sessionStartTime: number;
  totalPlayTime: number; // In seconds
  unlockedAchievements: string[];
  stats: ProgressionStats;
}

export interface ProgressionStats {
  tasksPerHour: number;
  avgTimeBetweenUpgrades: number;
  errorRate: number;
  longestSession: number;
  nightOwlTasks: number; // Tasks after midnight
  perfectRuns: number; // Sessions with 0 errors
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'secret' | 'challenge';
  xpReward: number;
  condition: (state: ProgressionState) => boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpToNext: number;
  progress: number; // 0-1
}

export interface XPEvent {
  type: 'task' | 'upgrade' | 'agent' | 'achievement' | 'streak';
  amount: number;
  description: string;
}

export interface ProgressionCallbacks {
  onXPGain?: (event: XPEvent, newTotal: number) => void;
  onLevelUp?: (level: number, title: string) => void;
  onAchievementUnlock?: (achievement: Achievement) => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

// Level thresholds: 100, 300, 600, 1000, 1500, 2100, 2800...
// Formula: level * (level + 1) * 50
function getXPForLevel(level: number): number {
  return level * (level + 1) * 50;
}

// Level titles
const LEVEL_TITLES: Record<number, string> = {
  1: 'Apprentice',
  2: 'Builder',
  3: 'Craftsman',
  4: 'Architect',
  5: 'Master Builder',
  6: 'City Planner',
  7: 'Grand Architect',
  8: 'Realm Shaper',
  9: 'Domain Lord',
  10: 'Legend',
};

function getLevelTitle(level: number): string {
  if (level <= 10) return LEVEL_TITLES[level] || 'Builder';
  if (level <= 15) return 'Legendary ' + LEVEL_TITLES[10];
  if (level <= 20) return 'Mythic ' + LEVEL_TITLES[10];
  return 'Eternal ' + LEVEL_TITLES[10];
}

// XP rewards
const XP_REWARDS = {
  taskComplete: 10,
  buildingUpgrade: 50,
  agentSpawn: 5,
  errorFree10: 25, // 10 tasks with no errors
  streak5: 15, // 5 tasks in a row
};

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // Milestones
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '👟',
    category: 'milestone',
    xpReward: 25,
    condition: (s) => s.totalTasksCompleted >= 1,
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: '🚀',
    category: 'milestone',
    xpReward: 50,
    condition: (s) => s.totalTasksCompleted >= 10,
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 tasks',
    icon: '💯',
    category: 'milestone',
    xpReward: 250,
    condition: (s) => s.totalTasksCompleted >= 100,
  },
  {
    id: 'master_builder',
    name: 'Master Builder',
    description: 'Reach all buildings at Tier 2',
    icon: '🏰',
    category: 'milestone',
    xpReward: 500,
    condition: (s) => s.totalUpgrades >= 12, // 6 buildings × 2 tiers
  },

  // Skills
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 20+ tasks in one hour',
    icon: '⚡',
    category: 'skill',
    xpReward: 100,
    condition: (s) => s.stats.tasksPerHour >= 20,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 50 tasks with 0 errors',
    icon: '✨',
    category: 'skill',
    xpReward: 150,
    condition: (s) => s.stats.perfectRuns >= 1 && s.totalTasksCompleted >= 50,
  },

  // Challenges
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 tasks after midnight',
    icon: '🦉',
    category: 'challenge',
    xpReward: 75,
    condition: (s) => s.stats.nightOwlTasks >= 10,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play for 4+ hours in one session',
    icon: '🏃',
    category: 'challenge',
    xpReward: 100,
    condition: (s) => s.stats.longestSession >= 4 * 60 * 60,
  },

  // Secrets
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Start a session before 6 AM',
    icon: '🌅',
    category: 'secret',
    xpReward: 50,
    condition: () => {
      const hour = new Date().getHours();
      return hour < 6;
    },
  },
];

// ─────────────────────────────────────────────────────────────
// ProgressionSystem Class
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'blazecraft_progression';

export class ProgressionSystem {
  private state: ProgressionState;
  private callbacks: ProgressionCallbacks;
  private taskStreak = 0;
  private errorsSinceStart = 0;

  constructor(callbacks: ProgressionCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = this.loadState();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Record a task completion
   */
  recordTaskComplete(): void {
    this.state.totalTasksCompleted++;
    this.taskStreak++;

    // Base XP
    let xp = XP_REWARDS.taskComplete;

    // Streak bonus
    if (this.taskStreak >= 5 && this.taskStreak % 5 === 0) {
      xp += XP_REWARDS.streak5;
    }

    // Night owl check
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      this.state.stats.nightOwlTasks++;
    }

    this.addXP(xp, 'task', `Task completed (+${xp} XP)`);
    this.checkAchievements();
    this.saveState();
  }

  /**
   * Record an error (breaks streak)
   */
  recordError(): void {
    this.taskStreak = 0;
    this.errorsSinceStart++;
    this.updateErrorRate();
  }

  /**
   * Record a building upgrade
   */
  recordUpgrade(buildingName: string): void {
    this.state.totalUpgrades++;
    this.addXP(XP_REWARDS.buildingUpgrade, 'upgrade', `${buildingName} upgraded!`);
    this.checkAchievements();
    this.saveState();
  }

  /**
   * Record agent spawn
   */
  recordAgentSpawn(agentName: string): void {
    this.addXP(XP_REWARDS.agentSpawn, 'agent', `${agentName} joined`);
  }

  /**
   * Get current progression state
   */
  getState(): ProgressionState {
    return { ...this.state };
  }

  /**
   * Get current level info
   */
  getLevelInfo(): LevelInfo {
    const currentLevelXP = getXPForLevel(this.state.level);
    const nextLevelXP = getXPForLevel(this.state.level + 1);
    const xpInCurrentLevel = this.state.xp - currentLevelXP;
    const xpNeededForNext = nextLevelXP - currentLevelXP;

    return {
      level: this.state.level,
      title: getLevelTitle(this.state.level),
      xpRequired: currentLevelXP,
      xpToNext: xpNeededForNext,
      progress: Math.min(1, xpInCurrentLevel / xpNeededForNext),
    };
  }

  /**
   * Get all achievements with unlock status
   */
  getAchievements(): (Achievement & { unlocked: boolean })[] {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: this.state.unlockedAchievements.includes(a.id),
    }));
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter((a) => this.state.unlockedAchievements.includes(a.id));
  }

  /**
   * Update session playtime
   */
  updatePlayTime(): void {
    const sessionTime = (Date.now() - this.state.sessionStartTime) / 1000;
    if (sessionTime > this.state.stats.longestSession) {
      this.state.stats.longestSession = sessionTime;
    }
    this.state.totalPlayTime += 1; // Called every second
    this.checkAchievements();
  }

  /**
   * Reset progression (for testing)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.saveState();
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private createInitialState(): ProgressionState {
    return {
      xp: 0,
      level: 1,
      totalTasksCompleted: 0,
      totalUpgrades: 0,
      sessionStartTime: Date.now(),
      totalPlayTime: 0,
      unlockedAchievements: [],
      stats: {
        tasksPerHour: 0,
        avgTimeBetweenUpgrades: 0,
        errorRate: 0,
        longestSession: 0,
        nightOwlTasks: 0,
        perfectRuns: 0,
      },
    };
  }

  private loadState(): ProgressionState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ProgressionState;
        // Reset session-specific data
        parsed.sessionStartTime = Date.now();
        return parsed;
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

  private addXP(amount: number, type: XPEvent['type'], description: string): void {
    const prevLevel = this.state.level;
    this.state.xp += amount;

    // Check for level up
    while (this.state.xp >= getXPForLevel(this.state.level + 1)) {
      this.state.level++;
    }

    // Notify callbacks
    this.callbacks.onXPGain?.({ type, amount, description }, this.state.xp);

    // Level up notification
    if (this.state.level > prevLevel) {
      this.callbacks.onLevelUp?.(this.state.level, getLevelTitle(this.state.level));
    }
  }

  private checkAchievements(): void {
    for (const achievement of ACHIEVEMENTS) {
      if (this.state.unlockedAchievements.includes(achievement.id)) continue;

      if (achievement.condition(this.state)) {
        this.state.unlockedAchievements.push(achievement.id);
        this.addXP(achievement.xpReward, 'achievement', `Achievement: ${achievement.name}`);
        this.callbacks.onAchievementUnlock?.(achievement);
        this.saveState();
      }
    }
  }

  private updateErrorRate(): void {
    if (this.state.totalTasksCompleted > 0) {
      this.state.stats.errorRate = this.errorsSinceStart / this.state.totalTasksCompleted;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createProgressionSystem(callbacks: ProgressionCallbacks = {}): ProgressionSystem {
  return new ProgressionSystem(callbacks);
}

// Re-export level title helper
export { getLevelTitle, getXPForLevel, ACHIEVEMENTS };
