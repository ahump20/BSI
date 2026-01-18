/**
 * AgentTraceParser - Utilities for analyzing and formatting agent decision data
 *
 * Transforms raw AgentState data into human-readable insights.
 * The "why did the AI do that?" engine.
 */

import type { AgentState, IntentType, ReplayTick, BlazecraftReplay } from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface IntentSummary {
  intent: IntentType;
  reason: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  entropyLevel: 'certain' | 'normal' | 'uncertain';
  decisionSpeed: 'fast' | 'normal' | 'slow';
}

export interface IntentTransition {
  fromIntent: IntentType;
  toIntent: IntentType;
  tick: number;
  reason: string;
}

export interface AgentProfile {
  agentId: string;
  dominantIntent: IntentType;
  intentDistribution: Record<IntentType, number>;
  avgConfidence: number;
  avgEntropy: number;
  avgDecisionTime: number;
  intentTransitions: IntentTransition[];
}

// ─────────────────────────────────────────────────────────────
// Intent Descriptions
// ─────────────────────────────────────────────────────────────

const INTENT_DESCRIPTIONS: Record<IntentType, string> = {
  rush: 'Aggressive early attack with minimal economy',
  tech: 'Building up technology and structures',
  eco: 'Economic expansion and resource gathering',
  defend: 'Defensive posture, protecting assets',
  harass: 'Hit-and-run tactics to disrupt enemy',
  scout: 'Gathering information about enemy',
  retreat: 'Tactical withdrawal to preserve forces',
  unknown: 'Unclear or transitional state',
};

const INTENT_ICONS: Record<IntentType, string> = {
  rush: '[ATK]',
  tech: '[TECH]',
  eco: '[ECO]',
  defend: '[DEF]',
  harass: '[HRS]',
  scout: '[SCT]',
  retreat: '[RET]',
  unknown: '[?]',
};

// ─────────────────────────────────────────────────────────────
// Parsing Functions
// ─────────────────────────────────────────────────────────────

/**
 * Parse AgentState into human-readable summary
 */
export function parseAgentState(state: AgentState): IntentSummary {
  return {
    intent: state.intent,
    reason: state.reason,
    confidence: state.confidence,
    confidenceLevel: getConfidenceLevel(state.confidence),
    entropyLevel: getEntropyLevel(state.entropy),
    decisionSpeed: getDecisionSpeed(state.timeToDecision),
  };
}

/**
 * Get confidence level label
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Get entropy level label
 */
function getEntropyLevel(entropy: number): 'certain' | 'normal' | 'uncertain' {
  if (entropy < 0.5) return 'certain';
  if (entropy < 1.5) return 'normal';
  return 'uncertain';
}

/**
 * Get decision speed label
 */
function getDecisionSpeed(timeMs: number): 'fast' | 'normal' | 'slow' {
  if (timeMs < 10) return 'fast';
  if (timeMs < 50) return 'normal';
  return 'slow';
}

/**
 * Get human-readable description of intent
 */
export function getIntentDescription(intent: IntentType): string {
  return INTENT_DESCRIPTIONS[intent];
}

/**
 * Get icon for intent
 */
export function getIntentIcon(intent: IntentType): string {
  return INTENT_ICONS[intent];
}

/**
 * Format confidence as percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Format decision time
 */
export function formatDecisionTime(timeMs: number): string {
  if (timeMs < 1) return '<1ms';
  if (timeMs < 1000) return `${Math.round(timeMs)}ms`;
  return `${(timeMs / 1000).toFixed(2)}s`;
}

// ─────────────────────────────────────────────────────────────
// Analysis Functions
// ─────────────────────────────────────────────────────────────

/**
 * Build agent profile from entire replay
 */
export function buildAgentProfile(
  replay: BlazecraftReplay,
  agentId: string
): AgentProfile | null {
  const agentStates: AgentState[] = [];

  // Collect all states for this agent
  for (const tick of replay.ticks) {
    const state = tick.agentStates.find(s => s.agentId === agentId);
    if (state) {
      agentStates.push(state);
    }
  }

  if (agentStates.length === 0) return null;

  // Calculate intent distribution
  const intentCounts: Record<IntentType, number> = {
    rush: 0, tech: 0, eco: 0, defend: 0,
    harass: 0, scout: 0, retreat: 0, unknown: 0,
  };

  for (const state of agentStates) {
    intentCounts[state.intent]++;
  }

  const intentDistribution: Record<IntentType, number> = {} as Record<IntentType, number>;
  for (const [intent, count] of Object.entries(intentCounts)) {
    intentDistribution[intent as IntentType] = count / agentStates.length;
  }

  // Find dominant intent
  const dominantIntent = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as IntentType;

  // Calculate averages
  const avgConfidence = agentStates.reduce((sum, s) => sum + s.confidence, 0) / agentStates.length;
  const avgEntropy = agentStates.reduce((sum, s) => sum + s.entropy, 0) / agentStates.length;
  const avgDecisionTime = agentStates.reduce((sum, s) => sum + s.timeToDecision, 0) / agentStates.length;

  // Find intent transitions
  const transitions: IntentTransition[] = [];
  for (let i = 1; i < agentStates.length; i++) {
    const prev = agentStates[i - 1];
    const curr = agentStates[i];
    if (prev.intent !== curr.intent) {
      transitions.push({
        fromIntent: prev.intent,
        toIntent: curr.intent,
        tick: replay.ticks.findIndex(t =>
          t.agentStates.some(s => s === curr)
        ),
        reason: curr.reason,
      });
    }
  }

  return {
    agentId,
    dominantIntent,
    intentDistribution,
    avgConfidence,
    avgEntropy,
    avgDecisionTime,
    intentTransitions: transitions,
  };
}

/**
 * Get intent at specific tick for agent
 */
export function getIntentAtTick(
  replay: BlazecraftReplay,
  agentId: string,
  tickNumber: number
): AgentState | null {
  const tick = replay.ticks[tickNumber];
  if (!tick) return null;

  return tick.agentStates.find(s => s.agentId === agentId) ?? null;
}

/**
 * Find ticks where agent changed intent
 */
export function findIntentChangeTicks(
  replay: BlazecraftReplay,
  agentId: string
): number[] {
  const changeTicks: number[] = [];
  let lastIntent: IntentType | null = null;

  for (let i = 0; i < replay.ticks.length; i++) {
    const state = replay.ticks[i].agentStates.find(s => s.agentId === agentId);
    if (state && state.intent !== lastIntent) {
      if (lastIntent !== null) {
        changeTicks.push(i);
      }
      lastIntent = state.intent;
    }
  }

  return changeTicks;
}

/**
 * Get action probabilities formatted for display
 */
export function formatActionProbabilities(
  probabilities: number[] | undefined,
  actionNames?: string[]
): { action: string; probability: number }[] {
  if (!probabilities) return [];

  return probabilities.map((prob, index) => ({
    action: actionNames?.[index] ?? `Action ${index}`,
    probability: prob,
  })).sort((a, b) => b.probability - a.probability);
}

// ─────────────────────────────────────────────────────────────
// Comparison Functions
// ─────────────────────────────────────────────────────────────

/**
 * Compare two agent profiles
 */
export function compareAgentProfiles(
  profile1: AgentProfile,
  profile2: AgentProfile
): {
  moreAggressive: string;
  moreConfident: string;
  fasterDecisions: string;
  styleDifference: string;
} {
  const aggressiveIntents: IntentType[] = ['rush', 'harass'];
  const agg1 = aggressiveIntents.reduce((sum, i) => sum + profile1.intentDistribution[i], 0);
  const agg2 = aggressiveIntents.reduce((sum, i) => sum + profile2.intentDistribution[i], 0);

  return {
    moreAggressive: agg1 > agg2 ? profile1.agentId : profile2.agentId,
    moreConfident: profile1.avgConfidence > profile2.avgConfidence
      ? profile1.agentId : profile2.agentId,
    fasterDecisions: profile1.avgDecisionTime < profile2.avgDecisionTime
      ? profile1.agentId : profile2.agentId,
    styleDifference: profile1.dominantIntent === profile2.dominantIntent
      ? 'Similar playstyles'
      : `${profile1.agentId}: ${profile1.dominantIntent}, ${profile2.agentId}: ${profile2.dominantIntent}`,
  };
}
