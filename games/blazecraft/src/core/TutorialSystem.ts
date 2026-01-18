/**
 * TutorialSystem - Golden path onboarding for BlazeCraft
 *
 * Guides new players through the first 30 minutes:
 * - Phase 1: Orientation (0-5 min)
 * - Phase 2: First Upgrade (5-10 min)
 * - Phase 3: Branching (10-15 min)
 * - Phase 4: Tech Unlock (15-20 min)
 * - Phase 5: Expansion (20-25 min)
 * - Phase 6: Mastery Preview (25-30 min)
 */

import type { Resources, ResourceDelta } from './ResourceSystem';
import type { TechNodeId } from './TechTree';
import type { BuildingKind, Tier } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TutorialPhase = 1 | 2 | 3 | 4 | 5 | 6;

export type TutorialStepId =
  // Phase 1: Orientation
  | 'welcome'
  | 'first_event'
  | 'first_resource_gain'
  | 'first_analyst_assigned'
  // Phase 2: First Upgrade
  | 'task_complete'
  | 'building_highlight'
  | 'first_upgrade'
  | 'first_achievement'
  // Phase 3: Branching
  | 'multiple_games'
  | 'choice_moment'
  | 'set_favorite'
  | 'analyst_fatigue'
  // Phase 4: Tech Unlock
  | 'intel_milestone'
  | 'tech_tree_reveal'
  | 'first_research'
  | 'data_enrichment'
  // Phase 5: Expansion
  | 'second_analyst'
  | 'parallel_tasks'
  | 'influence_milestone'
  | 'favorite_bonus'
  // Phase 6: Mastery Preview
  | 'commander_tease'
  | 'session_summary'
  | 'next_goals'
  | 'tutorial_complete';

export interface TutorialStep {
  id: TutorialStepId;
  phase: TutorialPhase;
  title: string;
  message: string;
  target?: string;          // CSS selector or element ID for highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'wait' | 'auto';
  triggerCondition?: TutorialTrigger;
  onComplete?: () => void;
}

export type TutorialTrigger =
  | { type: 'event_received'; eventType: string }
  | { type: 'resource_threshold'; resource: keyof Resources; amount: number }
  | { type: 'task_assigned' }
  | { type: 'task_completed' }
  | { type: 'building_upgraded'; building?: BuildingKind }
  | { type: 'tech_unlocked'; nodeId?: TechNodeId }
  | { type: 'analyst_count'; count: number }
  | { type: 'favorite_set' }
  | { type: 'timeout_ms'; duration: number }
  | { type: 'manual' };

export interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: TutorialStepId[];
  currentPhase: TutorialPhase;
  startTime: number;
  phaseStartTimes: Record<TutorialPhase, number | null>;
  skipped: boolean;
}

export interface TutorialCallbacks {
  onStepStart?: (step: TutorialStep) => void;
  onStepComplete?: (step: TutorialStep) => void;
  onPhaseComplete?: (phase: TutorialPhase) => void;
  onTutorialComplete?: () => void;
  onTutorialSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'blazecraft_tutorial';

/**
 * All tutorial steps in order
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  // Phase 1: Orientation
  {
    id: 'welcome',
    phase: 1,
    title: 'Welcome to BlazeCraft',
    message: 'Your sports intelligence HQ is now operational. Watch as live game data flows in and powers your city.',
    position: 'center',
    action: 'click',
  },
  {
    id: 'first_event',
    phase: 1,
    title: 'First Event Incoming',
    message: 'A game has started! Game events generate Intel, your primary resource.',
    target: '#event-log',
    position: 'right',
    action: 'wait',
    triggerCondition: { type: 'event_received', eventType: 'GAME_START' },
  },
  {
    id: 'first_resource_gain',
    phase: 1,
    title: 'Resources Acquired',
    message: '+5 Intel from the game start. Intel funds upgrades and unlocks.',
    target: '#resource-bar',
    position: 'bottom',
    action: 'wait',
    triggerCondition: { type: 'resource_threshold', resource: 'intel', amount: 5 },
  },
  {
    id: 'first_analyst_assigned',
    phase: 1,
    title: 'Assign Your Analyst',
    message: 'Click on an available task to assign your analyst. They\'ll track the game for bonus Intel.',
    target: '#task-list',
    position: 'left',
    action: 'wait',
    triggerCondition: { type: 'task_assigned' },
  },

  // Phase 2: First Upgrade
  {
    id: 'task_complete',
    phase: 2,
    title: 'Task Complete!',
    message: 'Your analyst finished monitoring the game. +10 Intel earned.',
    target: '#analyst-panel',
    position: 'left',
    action: 'wait',
    triggerCondition: { type: 'task_completed' },
  },
  {
    id: 'building_highlight',
    phase: 2,
    title: 'Building Ready',
    message: 'Your Town Hall can be upgraded! Click on it to see upgrade options.',
    target: '#building-townhall',
    position: 'right',
    action: 'click',
  },
  {
    id: 'first_upgrade',
    phase: 2,
    title: 'Upgrade Complete',
    message: 'Your Town Hall now generates +1 Intel per minute passively.',
    target: '#building-townhall',
    position: 'right',
    action: 'wait',
    triggerCondition: { type: 'building_upgraded', building: 'townhall' },
  },
  {
    id: 'first_achievement',
    phase: 2,
    title: 'Achievement Unlocked!',
    message: '"First Steps" - You\'ve completed your first major action. Many more await.',
    position: 'center',
    action: 'click',
  },

  // Phase 3: Branching
  {
    id: 'multiple_games',
    phase: 3,
    title: 'Multiple Games Active',
    message: 'Several games are now in progress. Each generates different events.',
    target: '#game-list',
    position: 'left',
    action: 'wait',
    triggerCondition: { type: 'timeout_ms', duration: 30000 },
  },
  {
    id: 'choice_moment',
    phase: 3,
    title: 'Choose Your Focus',
    message: 'You can\'t monitor everything. Choose which games matter most to you.',
    target: '#task-list',
    position: 'left',
    action: 'click',
  },
  {
    id: 'set_favorite',
    phase: 3,
    title: 'Set a Favorite Team',
    message: 'Click the star next to a team name to mark them as favorite. Favorites give 2x resources!',
    target: '#team-favorites',
    position: 'right',
    action: 'wait',
    triggerCondition: { type: 'favorite_set' },
  },
  {
    id: 'analyst_fatigue',
    phase: 3,
    title: 'Analyst Needs Rest',
    message: 'Your analyst is getting tired. They\'ll rest briefly, then return refreshed.',
    target: '#analyst-panel',
    position: 'left',
    action: 'click',
  },

  // Phase 4: Tech Unlock
  {
    id: 'intel_milestone',
    phase: 4,
    title: 'Intel Milestone Reached!',
    message: 'You have 50 Intel - enough to unlock your first tech upgrade.',
    target: '#resource-bar',
    position: 'bottom',
    action: 'wait',
    triggerCondition: { type: 'resource_threshold', resource: 'intel', amount: 50 },
  },
  {
    id: 'tech_tree_reveal',
    phase: 4,
    title: 'Tech Tree Unlocked',
    message: 'The Tech Tree has three branches: Analytics, Reputation, and Operations. Each unlocks powerful abilities.',
    target: '#tech-tree-button',
    position: 'bottom',
    action: 'click',
  },
  {
    id: 'first_research',
    phase: 4,
    title: 'Research Complete',
    message: 'Basic Scouting unlocked! You can now see batting averages on game events.',
    target: '#tech-tree-panel',
    position: 'center',
    action: 'wait',
    triggerCondition: { type: 'tech_unlocked', nodeId: 'basic_scouting' },
  },
  {
    id: 'data_enrichment',
    phase: 4,
    title: 'Data Enhanced',
    message: 'Notice the new stats appearing on game events. More unlocks bring more insights.',
    target: '#event-log',
    position: 'right',
    action: 'click',
  },

  // Phase 5: Expansion
  {
    id: 'second_analyst',
    phase: 5,
    title: 'New Analyst Available',
    message: 'Upgrade your Barracks to recruit a second analyst.',
    target: '#building-barracks',
    position: 'right',
    action: 'wait',
    triggerCondition: { type: 'analyst_count', count: 2 },
  },
  {
    id: 'parallel_tasks',
    phase: 5,
    title: 'Parallel Operations',
    message: 'With two analysts, you can monitor multiple games simultaneously.',
    target: '#analyst-panel',
    position: 'left',
    action: 'click',
  },
  {
    id: 'influence_milestone',
    phase: 5,
    title: 'Influence Growing',
    message: 'You have 30 Influence - unlock "Local Following" for favorite team bonuses.',
    target: '#resource-bar',
    position: 'bottom',
    action: 'wait',
    triggerCondition: { type: 'resource_threshold', resource: 'influence', amount: 30 },
  },
  {
    id: 'favorite_bonus',
    phase: 5,
    title: 'Favorite Team Bonus Active',
    message: 'Your favorite team\'s events now generate 10% bonus Intel!',
    position: 'center',
    action: 'click',
  },

  // Phase 6: Mastery Preview
  {
    id: 'commander_tease',
    phase: 6,
    title: 'Commander Mode Preview',
    message: 'As you progress, you\'ll unlock Commander Mode with advanced features and multi-game views.',
    position: 'center',
    action: 'click',
  },
  {
    id: 'session_summary',
    phase: 6,
    title: 'Session Summary',
    message: 'Great progress! You\'ve learned the basics of resource gathering, upgrades, and tech unlocks.',
    position: 'center',
    action: 'click',
  },
  {
    id: 'next_goals',
    phase: 6,
    title: 'Next Goals',
    message: 'Try to: Reach Tier 2 Analytics, unlock a specialist analyst, and explore all three tech branches.',
    position: 'center',
    action: 'click',
  },
  {
    id: 'tutorial_complete',
    phase: 6,
    title: 'Tutorial Complete!',
    message: 'You\'re ready to manage your BlazeCraft HQ. Your progress is saved automatically.',
    position: 'center',
    action: 'click',
  },
];

// ─────────────────────────────────────────────────────────────
// TutorialSystem Class
// ─────────────────────────────────────────────────────────────

export class TutorialSystem {
  private state: TutorialState;
  private callbacks: TutorialCallbacks;
  private pendingTriggers: Map<string, () => void> = new Map();

  constructor(callbacks: TutorialCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = this.loadState();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Start or resume the tutorial
   */
  start(): void {
    if (this.state.skipped || this.isComplete()) return;

    this.state.isActive = true;
    if (this.state.startTime === 0) {
      this.state.startTime = Date.now();
    }

    this.saveState();
    this.showCurrentStep();
  }

  /**
   * Check if tutorial should auto-start (new player)
   */
  shouldAutoStart(): boolean {
    return (
      !this.state.skipped &&
      this.state.completedSteps.length === 0 &&
      !this.isComplete()
    );
  }

  /**
   * Skip the tutorial
   */
  skip(): void {
    this.state.isActive = false;
    this.state.skipped = true;
    this.saveState();
    this.callbacks.onTutorialSkip?.();
  }

  /**
   * Get current tutorial state
   */
  getState(): TutorialState {
    return { ...this.state };
  }

  /**
   * Get current step (or null if not active)
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.state.isActive) return null;
    return TUTORIAL_STEPS[this.state.currentStepIndex] ?? null;
  }

  /**
   * Get current phase info
   */
  getCurrentPhase(): { phase: TutorialPhase; name: string; progress: number } {
    const phaseName = this.getPhaseName(this.state.currentPhase);
    const phaseSteps = TUTORIAL_STEPS.filter(s => s.phase === this.state.currentPhase);
    const completedInPhase = phaseSteps.filter(s =>
      this.state.completedSteps.includes(s.id)
    ).length;

    return {
      phase: this.state.currentPhase,
      name: phaseName,
      progress: phaseSteps.length > 0 ? completedInPhase / phaseSteps.length : 0,
    };
  }

  /**
   * Complete the current step manually (for 'click' actions)
   */
  completeCurrentStep(): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step) return;

    this.markStepComplete(step);
  }

  /**
   * Notify the tutorial system of a game event
   */
  notifyEvent(eventType: string, data?: unknown): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    const trigger = step.triggerCondition;
    if (trigger.type === 'event_received' && trigger.eventType === eventType) {
      this.markStepComplete(step);
    }
  }

  /**
   * Notify of resource changes
   */
  notifyResources(resources: Resources): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    const trigger = step.triggerCondition;
    if (trigger.type === 'resource_threshold') {
      if (resources[trigger.resource] >= trigger.amount) {
        this.markStepComplete(step);
      }
    }
  }

  /**
   * Notify of task assignment
   */
  notifyTaskAssigned(): void {
    this.checkTrigger('task_assigned');
  }

  /**
   * Notify of task completion
   */
  notifyTaskCompleted(): void {
    this.checkTrigger('task_completed');
  }

  /**
   * Notify of building upgrade
   */
  notifyBuildingUpgraded(building: BuildingKind, _tier: Tier): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    const trigger = step.triggerCondition;
    if (
      trigger.type === 'building_upgraded' &&
      (!trigger.building || trigger.building === building)
    ) {
      this.markStepComplete(step);
    }
  }

  /**
   * Notify of tech unlock
   */
  notifyTechUnlocked(nodeId: TechNodeId): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    const trigger = step.triggerCondition;
    if (
      trigger.type === 'tech_unlocked' &&
      (!trigger.nodeId || trigger.nodeId === nodeId)
    ) {
      this.markStepComplete(step);
    }
  }

  /**
   * Notify of analyst count change
   */
  notifyAnalystCount(count: number): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    const trigger = step.triggerCondition;
    if (trigger.type === 'analyst_count' && count >= trigger.count) {
      this.markStepComplete(step);
    }
  }

  /**
   * Notify of favorite team set
   */
  notifyFavoriteSet(): void {
    this.checkTrigger('favorite_set');
  }

  /**
   * Check if tutorial is complete
   */
  isComplete(): boolean {
    return this.state.completedSteps.includes('tutorial_complete');
  }

  /**
   * Check if tutorial is active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Reset tutorial (for testing)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.saveState();
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private createInitialState(): TutorialState {
    return {
      isActive: false,
      currentStepIndex: 0,
      completedSteps: [],
      currentPhase: 1,
      startTime: 0,
      phaseStartTimes: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
      skipped: false,
    };
  }

  private loadState(): TutorialState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TutorialState;
        if (parsed && Array.isArray(parsed.completedSteps)) {
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

  private showCurrentStep(): void {
    const step = this.getCurrentStep();
    if (!step) {
      this.state.isActive = false;
      this.saveState();
      return;
    }

    // Update phase
    if (step.phase !== this.state.currentPhase) {
      const previousPhase = this.state.currentPhase;
      this.state.currentPhase = step.phase;
      this.state.phaseStartTimes[step.phase] = Date.now();
      this.callbacks.onPhaseComplete?.(previousPhase);
    }

    this.callbacks.onStepStart?.(step);

    // Set up timeout triggers
    if (step.triggerCondition?.type === 'timeout_ms') {
      const duration = step.triggerCondition.duration;
      setTimeout(() => {
        if (this.getCurrentStep()?.id === step.id) {
          this.markStepComplete(step);
        }
      }, duration);
    }
  }

  private markStepComplete(step: TutorialStep): void {
    if (this.state.completedSteps.includes(step.id)) return;

    this.state.completedSteps.push(step.id);
    this.state.currentStepIndex++;

    step.onComplete?.();
    this.callbacks.onStepComplete?.(step);

    // Check for tutorial completion
    if (step.id === 'tutorial_complete') {
      this.state.isActive = false;
      this.callbacks.onTutorialComplete?.();
    }

    this.saveState();

    // Show next step
    if (this.state.isActive) {
      this.showCurrentStep();
    }
  }

  private checkTrigger(type: string): void {
    if (!this.state.isActive) return;

    const step = this.getCurrentStep();
    if (!step?.triggerCondition) return;

    if (step.triggerCondition.type === type) {
      this.markStepComplete(step);
    }
  }

  private getPhaseName(phase: TutorialPhase): string {
    const names: Record<TutorialPhase, string> = {
      1: 'Orientation',
      2: 'First Upgrade',
      3: 'Branching',
      4: 'Tech Unlock',
      5: 'Expansion',
      6: 'Mastery Preview',
    };
    return names[phase];
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createTutorialSystem(callbacks: TutorialCallbacks = {}): TutorialSystem {
  return new TutorialSystem(callbacks);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get overall tutorial progress (0-1)
 */
export function getTutorialProgress(state: TutorialState): number {
  return state.completedSteps.length / TUTORIAL_STEPS.length;
}

/**
 * Get step by ID
 */
export function getStepById(id: TutorialStepId): TutorialStep | null {
  return TUTORIAL_STEPS.find(s => s.id === id) ?? null;
}

/**
 * Get all steps for a phase
 */
export function getPhaseSteps(phase: TutorialPhase): TutorialStep[] {
  return TUTORIAL_STEPS.filter(s => s.phase === phase);
}
