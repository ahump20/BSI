/**
 * AnalystSystem - Worker assignment for BlazeCraft
 *
 * Analysts are workers assigned to tasks generated from sports events.
 * Tasks complete after duration and award resources.
 *
 * Features:
 * - Analyst specialties match sports types
 * - Fatigue system requires rest periods
 * - Building tiers affect capacity and efficiency
 */

import type { SportType } from './GameEventContract';
import type { BuildingKind, Tier } from './BuildingSystem';
import type { ResourceDelta } from './ResourceSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AnalystSpecialty = SportType | 'general';
export type AnalystStatus = 'idle' | 'assigned' | 'working' | 'resting';
export type TaskType = 'monitor_game' | 'research_matchup' | 'compile_report' | 'scout_player';

export interface Analyst {
  id: string;
  name: string;
  specialty: AnalystSpecialty;
  status: AnalystStatus;
  efficiency: number;     // 0.5 - 1.5 multiplier
  fatigue: number;        // 0-100, affects efficiency
  assignedTaskId: string | null;
  restUntil: number | null;
  createdAt: number;
  tasksCompleted: number;
}

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  gameId?: string;
  sport?: SportType;
  duration: number;       // Base duration in seconds
  reward: ResourceDelta;
  building: BuildingKind;
  assignedAnalystId: string | null;
  startedAt: number | null;
  expiresAt: number | null;
  createdAt: number;
}

export interface TaskProgress {
  task: Task;
  analyst: Analyst;
  progress: number;       // 0-1
  remainingSeconds: number;
}

export interface AnalystSystemState {
  analysts: Analyst[];
  activeTasks: Task[];
  completedTasks: number;
  lastUpdate: number;
}

export interface AnalystSystemCallbacks {
  onTaskComplete?: (task: Task, analyst: Analyst, reward: ResourceDelta) => void;
  onTaskExpired?: (task: Task) => void;
  onAnalystFatigued?: (analyst: Analyst) => void;
  onAnalystRested?: (analyst: Analyst) => void;
  onNewTaskAvailable?: (task: Task) => void;
}

export interface BuildingEffects {
  analystCapacity: number;    // From Barracks tier
  durationMultiplier: number; // From Workshop tier (lower = faster)
  rewardMultiplier: number;   // From Library tier
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'blazecraft_analysts';
const TICK_INTERVAL_MS = 1000;
const BASE_ANALYST_CAPACITY = 2;
const MAX_ACTIVE_TASKS = 6;
const TASK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const FATIGUE_PER_TASK = 15;
const FATIGUE_THRESHOLD = 80;
const REST_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const FATIGUE_RECOVERY_PER_REST = 50;

/**
 * Analyst name pools by specialty
 */
const ANALYST_NAMES: Record<AnalystSpecialty, string[]> = {
  general: ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor'],
  mlb: ['Scout Rodriguez', 'Stats McGee', 'Diamond Davis'],
  nfl: ['Gridiron Garcia', 'Blitz Baker', 'Tackle Thompson'],
  nba: ['Court Carter', 'Dunk Duncan', 'Rim Robinson'],
  'college-baseball': ['Prospect Perry', 'Draft Day Dale'],
  'college-football': ['Recruit Reynolds', 'Scouting Smith'],
};

/**
 * Task configuration by type
 */
export const TASK_CONFIG: Record<TaskType, {
  title: string;
  description: string;
  baseDuration: number;
  baseReward: ResourceDelta;
  building: BuildingKind;
}> = {
  monitor_game: {
    title: 'Monitor Game',
    description: 'Track live game events and updates',
    baseDuration: 60,
    baseReward: { intel: 10, momentum: 5 },
    building: 'townhall',
  },
  research_matchup: {
    title: 'Research Matchup',
    description: 'Analyze team statistics and history',
    baseDuration: 120,
    baseReward: { intel: 25, influence: 5 },
    building: 'workshop',
  },
  compile_report: {
    title: 'Compile Report',
    description: 'Generate comprehensive analysis report',
    baseDuration: 180,
    baseReward: { intel: 15, influence: 15 },
    building: 'library',
  },
  scout_player: {
    title: 'Scout Player',
    description: 'Deep dive into player performance',
    baseDuration: 90,
    baseReward: { intel: 20, influence: 8 },
    building: 'stables',
  },
};

// ─────────────────────────────────────────────────────────────
// AnalystSystem Class
// ─────────────────────────────────────────────────────────────

export class AnalystSystem {
  private state: AnalystSystemState;
  private callbacks: AnalystSystemCallbacks;
  private effects: BuildingEffects;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private taskIdCounter = 0;

  constructor(callbacks: AnalystSystemCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = this.loadState();
    this.effects = this.createDefaultEffects();

    // Ensure minimum analysts
    if (this.state.analysts.length === 0) {
      this.createAnalyst('general');
      this.createAnalyst('general');
    }

    this.startTicking();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API - Analysts
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all analysts
   */
  getAnalysts(): Analyst[] {
    return [...this.state.analysts];
  }

  /**
   * Get idle analysts
   */
  getIdleAnalysts(): Analyst[] {
    return this.state.analysts.filter(a => a.status === 'idle');
  }

  /**
   * Get working analysts with their task progress
   */
  getWorkingAnalysts(): TaskProgress[] {
    const results: TaskProgress[] = [];

    for (const analyst of this.state.analysts) {
      if (analyst.status !== 'working' || !analyst.assignedTaskId) continue;

      const task = this.state.activeTasks.find(t => t.id === analyst.assignedTaskId);
      if (!task || !task.startedAt) continue;

      const elapsed = (Date.now() - task.startedAt) / 1000;
      const effectiveDuration = this.getEffectiveDuration(task, analyst);
      const progress = Math.min(1, elapsed / effectiveDuration);
      const remaining = Math.max(0, effectiveDuration - elapsed);

      results.push({
        task,
        analyst,
        progress,
        remainingSeconds: Math.ceil(remaining),
      });
    }

    return results;
  }

  /**
   * Get current analyst capacity (base + building bonus)
   */
  getCapacity(): { current: number; max: number } {
    return {
      current: this.state.analysts.length,
      max: this.effects.analystCapacity,
    };
  }

  /**
   * Create a new analyst (if under capacity)
   */
  createAnalyst(specialty: AnalystSpecialty = 'general'): Analyst | null {
    if (this.state.analysts.length >= this.effects.analystCapacity) {
      return null;
    }

    const names = ANALYST_NAMES[specialty];
    const name = names[Math.floor(Math.random() * names.length)];

    const analyst: Analyst = {
      id: `analyst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      specialty,
      status: 'idle',
      efficiency: 0.8 + Math.random() * 0.4, // 0.8 - 1.2
      fatigue: 0,
      assignedTaskId: null,
      restUntil: null,
      createdAt: Date.now(),
      tasksCompleted: 0,
    };

    this.state.analysts.push(analyst);
    this.saveState();

    return analyst;
  }

  // ─────────────────────────────────────────────────────────────
  // Public API - Tasks
  // ─────────────────────────────────────────────────────────────

  /**
   * Get available tasks
   */
  getAvailableTasks(): Task[] {
    return this.state.activeTasks.filter(t => !t.assignedAnalystId);
  }

  /**
   * Get assigned tasks
   */
  getAssignedTasks(): Task[] {
    return this.state.activeTasks.filter(t => t.assignedAnalystId);
  }

  /**
   * Create a task from a game event
   */
  createTaskFromGame(
    type: TaskType,
    gameId: string,
    sport: SportType,
    customTitle?: string
  ): Task {
    const config = TASK_CONFIG[type];

    const task: Task = {
      id: `task-${++this.taskIdCounter}`,
      type,
      title: customTitle ?? config.title,
      description: config.description,
      gameId,
      sport,
      duration: config.baseDuration,
      reward: { ...config.baseReward },
      building: config.building,
      assignedAnalystId: null,
      startedAt: null,
      expiresAt: Date.now() + TASK_EXPIRY_MS,
      createdAt: Date.now(),
    };

    // Limit active tasks
    if (this.state.activeTasks.length >= MAX_ACTIVE_TASKS) {
      // Remove oldest unassigned task
      const oldestUnassigned = this.state.activeTasks
        .filter(t => !t.assignedAnalystId)
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (oldestUnassigned) {
        this.state.activeTasks = this.state.activeTasks.filter(t => t.id !== oldestUnassigned.id);
      }
    }

    this.state.activeTasks.push(task);
    this.saveState();

    this.callbacks.onNewTaskAvailable?.(task);

    return task;
  }

  /**
   * Create a generic task (not tied to a game)
   */
  createTask(type: TaskType, customTitle?: string): Task {
    const config = TASK_CONFIG[type];

    const task: Task = {
      id: `task-${++this.taskIdCounter}`,
      type,
      title: customTitle ?? config.title,
      description: config.description,
      duration: config.baseDuration,
      reward: { ...config.baseReward },
      building: config.building,
      assignedAnalystId: null,
      startedAt: null,
      expiresAt: Date.now() + TASK_EXPIRY_MS,
      createdAt: Date.now(),
    };

    if (this.state.activeTasks.length < MAX_ACTIVE_TASKS) {
      this.state.activeTasks.push(task);
      this.saveState();
      this.callbacks.onNewTaskAvailable?.(task);
    }

    return task;
  }

  /**
   * Assign an analyst to a task
   */
  assignTask(analystId: string, taskId: string): boolean {
    const analyst = this.state.analysts.find(a => a.id === analystId);
    const task = this.state.activeTasks.find(t => t.id === taskId);

    if (!analyst || !task) return false;
    if (analyst.status !== 'idle') return false;
    if (task.assignedAnalystId) return false;

    analyst.status = 'working';
    analyst.assignedTaskId = taskId;
    task.assignedAnalystId = analystId;
    task.startedAt = Date.now();
    task.expiresAt = null; // No longer expires once assigned

    this.saveState();
    return true;
  }

  /**
   * Unassign an analyst from their current task
   */
  unassignAnalyst(analystId: string): boolean {
    const analyst = this.state.analysts.find(a => a.id === analystId);
    if (!analyst || !analyst.assignedTaskId) return false;

    const task = this.state.activeTasks.find(t => t.id === analyst.assignedTaskId);

    analyst.status = 'idle';
    analyst.assignedTaskId = null;

    if (task) {
      task.assignedAnalystId = null;
      task.startedAt = null;
      task.expiresAt = Date.now() + TASK_EXPIRY_MS;
    }

    this.saveState();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // Public API - Building Effects
  // ─────────────────────────────────────────────────────────────

  /**
   * Update building effects based on current building tiers
   */
  updateBuildingEffects(buildings: Record<BuildingKind, { tier: Tier }>): void {
    // Barracks: +1/+2/+3 analyst capacity per tier
    const barracksTier = buildings.barracks?.tier ?? 0;
    this.effects.analystCapacity = BASE_ANALYST_CAPACITY + barracksTier;

    // Workshop: -10%/-20%/-30% duration per tier
    const workshopTier = buildings.workshop?.tier ?? 0;
    this.effects.durationMultiplier = 1 - workshopTier * 0.1;

    // Library: +10%/+20%/+30% reward per tier
    const libraryTier = buildings.library?.tier ?? 0;
    this.effects.rewardMultiplier = 1 + libraryTier * 0.1;
  }

  /**
   * Get current building effects
   */
  getBuildingEffects(): BuildingEffects {
    return { ...this.effects };
  }

  // ─────────────────────────────────────────────────────────────
  // Public API - Stats
  // ─────────────────────────────────────────────────────────────

  /**
   * Get total completed tasks
   */
  getCompletedTaskCount(): number {
    return this.state.completedTasks;
  }

  /**
   * Reset system (for testing)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.createAnalyst('general');
    this.createAnalyst('general');
    this.saveState();
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private createInitialState(): AnalystSystemState {
    return {
      analysts: [],
      activeTasks: [],
      completedTasks: 0,
      lastUpdate: Date.now(),
    };
  }

  private createDefaultEffects(): BuildingEffects {
    return {
      analystCapacity: BASE_ANALYST_CAPACITY,
      durationMultiplier: 1,
      rewardMultiplier: 1,
    };
  }

  private loadState(): AnalystSystemState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AnalystSystemState;
        if (parsed && Array.isArray(parsed.analysts)) {
          // Restore task ID counter
          for (const task of parsed.activeTasks) {
            const num = parseInt(task.id.replace('task-', ''), 10);
            if (!isNaN(num) && num > this.taskIdCounter) {
              this.taskIdCounter = num;
            }
          }
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
      this.state.lastUpdate = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore
    }
  }

  private startTicking(): void {
    if (this.tickTimer) return;

    this.tickTimer = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);
  }

  private tick(): void {
    const now = Date.now();
    let changed = false;

    // Check for task completions
    for (const analyst of this.state.analysts) {
      if (analyst.status === 'working' && analyst.assignedTaskId) {
        const task = this.state.activeTasks.find(t => t.id === analyst.assignedTaskId);
        if (task && task.startedAt) {
          const elapsed = (now - task.startedAt) / 1000;
          const effectiveDuration = this.getEffectiveDuration(task, analyst);

          if (elapsed >= effectiveDuration) {
            this.completeTask(task, analyst);
            changed = true;
          }
        }
      }

      // Check for rest completion
      if (analyst.status === 'resting' && analyst.restUntil && now >= analyst.restUntil) {
        analyst.status = 'idle';
        analyst.fatigue = Math.max(0, analyst.fatigue - FATIGUE_RECOVERY_PER_REST);
        analyst.restUntil = null;
        this.callbacks.onAnalystRested?.(analyst);
        changed = true;
      }
    }

    // Check for task expiration
    const expiredTasks = this.state.activeTasks.filter(
      t => !t.assignedAnalystId && t.expiresAt && now >= t.expiresAt
    );

    for (const task of expiredTasks) {
      this.state.activeTasks = this.state.activeTasks.filter(t => t.id !== task.id);
      this.callbacks.onTaskExpired?.(task);
      changed = true;
    }

    if (changed) {
      this.saveState();
    }
  }

  private completeTask(task: Task, analyst: Analyst): void {
    // Calculate effective reward
    const effectiveReward = this.getEffectiveReward(task, analyst);

    // Update analyst
    analyst.status = 'idle';
    analyst.assignedTaskId = null;
    analyst.tasksCompleted++;
    analyst.fatigue += FATIGUE_PER_TASK;

    // Check for fatigue
    if (analyst.fatigue >= FATIGUE_THRESHOLD) {
      analyst.status = 'resting';
      analyst.restUntil = Date.now() + REST_DURATION_MS;
      this.callbacks.onAnalystFatigued?.(analyst);
    }

    // Remove task from active
    this.state.activeTasks = this.state.activeTasks.filter(t => t.id !== task.id);
    this.state.completedTasks++;

    // Notify
    this.callbacks.onTaskComplete?.(task, analyst, effectiveReward);

    this.saveState();
  }

  private getEffectiveDuration(task: Task, analyst: Analyst): number {
    // Base duration × building modifier × analyst efficiency (inverted for speed)
    const buildingMod = this.effects.durationMultiplier;
    const efficiencyMod = 1 / analyst.efficiency;

    // Specialty bonus: 20% faster for matching sport
    const specialtyMod = task.sport && analyst.specialty === task.sport ? 0.8 : 1;

    // Fatigue penalty: up to 30% slower at max fatigue
    const fatigueMod = 1 + (analyst.fatigue / 100) * 0.3;

    return task.duration * buildingMod * efficiencyMod * specialtyMod * fatigueMod;
  }

  private getEffectiveReward(task: Task, analyst: Analyst): ResourceDelta {
    const multiplier = this.effects.rewardMultiplier * analyst.efficiency;

    // Specialty bonus: 20% more rewards for matching sport
    const specialtyBonus = task.sport && analyst.specialty === task.sport ? 1.2 : 1;

    return {
      intel: task.reward.intel
        ? Math.round(task.reward.intel * multiplier * specialtyBonus)
        : undefined,
      influence: task.reward.influence
        ? Math.round(task.reward.influence * multiplier * specialtyBonus)
        : undefined,
      momentum: task.reward.momentum
        ? Math.round(task.reward.momentum * multiplier * specialtyBonus)
        : undefined,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createAnalystSystem(callbacks: AnalystSystemCallbacks = {}): AnalystSystem {
  return new AnalystSystem(callbacks);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Get analyst status display text
 */
export function getAnalystStatusText(analyst: Analyst): string {
  switch (analyst.status) {
    case 'idle':
      return 'Available';
    case 'assigned':
      return 'Assigned';
    case 'working':
      return 'Working';
    case 'resting':
      return 'Resting';
  }
}

/**
 * Get fatigue level category
 */
export function getFatigueLevel(fatigue: number): 'fresh' | 'tired' | 'exhausted' {
  if (fatigue < 30) return 'fresh';
  if (fatigue < 70) return 'tired';
  return 'exhausted';
}
