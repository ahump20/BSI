/**
 * Sentiment Engine - Event-Driven Sentiment Updates
 *
 * Adjusts fanbase sentiment based on game results, recruiting news, and other events.
 * Uses exponential decay to normalize extreme sentiment over time.
 */

import type { FanbaseSentiment, SentimentTrend } from './types';

// ============================================================================
// Event Types
// ============================================================================

export type SentimentEventType =
  | 'game_win'
  | 'game_loss'
  | 'recruiting_commit'
  | 'recruiting_decommit'
  | 'coach_hire'
  | 'coach_fire'
  | 'injury_major'
  | 'transfer_portal_gain'
  | 'transfer_portal_loss';

export interface SentimentEvent {
  id: string;
  schoolId: string;
  eventType: SentimentEventType;
  timestamp: string;
  metadata:
    | GameEventMeta
    | RecruitingEventMeta
    | CoachEventMeta
    | InjuryEventMeta
    | PortalEventMeta;
}

export interface GameEventMeta {
  opponentId: string;
  opponentName: string;
  score: { team: number; opponent: number };
  /** Expected win probability pre-game (0-1) */
  expectedWinProb: number;
  /** Was this a rivalry game? */
  isRivalry: boolean;
  /** Conference championship, bowl, playoff? */
  gameType: 'regular' | 'conference_championship' | 'bowl' | 'playoff';
}

export interface RecruitingEventMeta {
  playerName: string;
  position: string;
  /** 247Sports composite rating (0-1) */
  rating: number;
  /** National ranking */
  nationalRank?: number;
  /** Was this a flip from another program? */
  isFlip: boolean;
  flippedFrom?: string;
}

export interface CoachEventMeta {
  coachName: string;
  role: 'head_coach' | 'coordinator' | 'position_coach';
  /** For hires: previous job prestige (0-1) */
  previousPrestige?: number;
  /** For fires: sentiment around departure */
  fanSentimentOnDeparture?: 'positive' | 'negative' | 'mixed';
}

export interface InjuryEventMeta {
  playerName: string;
  position: string;
  severity: 'minor' | 'moderate' | 'season_ending';
  isStarter: boolean;
}

export interface PortalEventMeta {
  playerName: string;
  position: string;
  /** Stars at time of transfer */
  rating: number;
  fromSchool?: string;
  toSchool?: string;
}

// ============================================================================
// Sentiment Adjustment Calculations
// ============================================================================

/**
 * Base adjustment ranges for each event type.
 * Actual adjustment is modified by event-specific factors.
 *
 * Note: FanbaseSentiment has { overall, optimism, loyalty, volatility }
 * - overall: -1 to 1 (general sentiment)
 * - optimism: 0-1 (future outlook)
 * - loyalty: 0-1 (commitment/trust in program)
 * - volatility: 0-1 (how much sentiment swings)
 */
const BASE_ADJUSTMENTS: Record<SentimentEventType, { min: number; max: number }> = {
  game_win: { min: 0.03, max: 0.15 },
  game_loss: { min: -0.15, max: -0.03 },
  recruiting_commit: { min: 0.01, max: 0.08 },
  recruiting_decommit: { min: -0.06, max: -0.02 },
  coach_hire: { min: 0.02, max: 0.12 },
  coach_fire: { min: -0.1, max: 0.05 }, // Can be positive if unwanted coach
  injury_major: { min: -0.08, max: -0.02 },
  transfer_portal_gain: { min: 0.02, max: 0.1 },
  transfer_portal_loss: { min: -0.08, max: -0.01 },
};

/**
 * Calculate sentiment adjustment for a game result.
 *
 * Adjustment magnitude based on:
 * - Upset factor: Bigger swing for unexpected results
 * - Rivalry multiplier: 1.5x for rivalry games
 * - Game importance: Higher stakes = bigger emotional impact
 */
export function calculateGameAdjustment(
  meta: GameEventMeta,
  isWin: boolean
): { overall: number; optimism: number } {
  const { expectedWinProb, isRivalry, gameType } = meta;

  // Upset factor: How unexpected was this result?
  // Win when expected to lose = big positive swing
  // Loss when expected to win = big negative swing
  const upsetFactor = isWin
    ? Math.max(0.5, 1 - expectedWinProb) // Win more impactful when underdog
    : Math.max(0.5, expectedWinProb); // Loss more impactful when favorite

  // Game importance multiplier
  const importanceMultiplier: Record<GameEventMeta['gameType'], number> = {
    regular: 1.0,
    conference_championship: 1.8,
    bowl: 1.4,
    playoff: 2.5,
  };
  const importance = importanceMultiplier[gameType];

  // Rivalry multiplier
  const rivalryMult = isRivalry ? 1.5 : 1.0;

  // Base ranges
  const base = isWin ? BASE_ADJUSTMENTS.game_win : BASE_ADJUSTMENTS.game_loss;
  const range = base.max - base.min;

  // Calculate adjustment (interpolate within range based on factors)
  const intensity = upsetFactor * importance * rivalryMult;
  const normalizedIntensity = Math.min(intensity, 3) / 3; // Cap at 3x, normalize to 0-1

  const adjustment = base.min + range * normalizedIntensity;

  // Big games affect optimism more (playoff implications)
  const optimismMultiplier =
    gameType === 'playoff' ? 1.8 : gameType === 'conference_championship' ? 1.5 : 1.2;

  return {
    overall: adjustment,
    optimism: adjustment * optimismMultiplier,
  };
}

/**
 * Calculate sentiment adjustment for recruiting events.
 */
export function calculateRecruitingAdjustment(
  meta: RecruitingEventMeta,
  isCommit: boolean
): { overall: number; optimism: number } {
  const { rating, isFlip, nationalRank } = meta;

  // Higher rated = bigger impact
  const ratingMultiplier = Math.pow(rating, 2); // Exponential - 5-stars matter way more

  // Flips generate extra excitement/disappointment
  const flipMult = isFlip ? 1.4 : 1.0;

  // Top 100 national recruits get extra attention
  const eliteMult = nationalRank && nationalRank <= 100 ? 1.3 : 1.0;

  const base = isCommit ? BASE_ADJUSTMENTS.recruiting_commit : BASE_ADJUSTMENTS.recruiting_decommit;
  const range = base.max - base.min;

  const intensity = ratingMultiplier * flipMult * eliteMult;
  const normalizedIntensity = Math.min(intensity, 2) / 2;

  const adjustment = base.min + range * normalizedIntensity;

  return {
    overall: adjustment * 0.5, // Recruiting has smaller overall impact
    optimism: adjustment, // But bigger impact on future optimism
  };
}

/**
 * Calculate sentiment adjustment for coaching changes.
 * Uses `loyalty` as the measure of program trust/confidence.
 */
export function calculateCoachAdjustment(
  meta: CoachEventMeta,
  isHire: boolean
): { overall: number; loyalty: number } {
  const { role, previousPrestige, fanSentimentOnDeparture } = meta;

  // Role importance
  const roleMultiplier: Record<CoachEventMeta['role'], number> = {
    head_coach: 1.0,
    coordinator: 0.5,
    position_coach: 0.2,
  };
  const roleMult = roleMultiplier[role];

  let adjustment: number;

  if (isHire) {
    // Hire: Prestige of previous job matters
    const prestige = previousPrestige ?? 0.5;
    const base = BASE_ADJUSTMENTS.coach_hire;
    adjustment = base.min + (base.max - base.min) * prestige;
  } else {
    // Fire: Fan sentiment on departure matters
    const base = BASE_ADJUSTMENTS.coach_fire;
    if (fanSentimentOnDeparture === 'positive') {
      // Fans wanted this - positive adjustment
      adjustment = base.max;
    } else if (fanSentimentOnDeparture === 'negative') {
      // Fans upset - negative adjustment
      adjustment = base.min;
    } else {
      // Mixed feelings
      adjustment = (base.min + base.max) / 2;
    }
  }

  return {
    overall: adjustment * roleMult,
    loyalty: adjustment * roleMult * 1.5, // Coaching changes significantly affect program trust
  };
}

// ============================================================================
// Sentiment Decay Model
// ============================================================================

/**
 * Decay constant (lambda) determines how quickly sentiment returns to baseline.
 * Higher = faster decay. Tunable per fanbase based on volatility.
 *
 * Default: 0.1 (sentiment half-life of ~7 days)
 */
const DEFAULT_DECAY_CONSTANT = 0.1;

/**
 * Baseline sentiment values (neutral state).
 */
const BASELINE_SENTIMENT: FanbaseSentiment = {
  overall: 0,
  optimism: 0.5,
  loyalty: 0.5,
  volatility: 0.3,
};

export interface DecayParams {
  /** Current sentiment values */
  current: FanbaseSentiment;
  /** Peak sentiment (from recent event) */
  peak: FanbaseSentiment;
  /** Days since the peak event */
  daysSincePeak: number;
  /** Decay constant - higher = faster decay */
  lambda?: number;
  /** Fanbase baseline (defaults to neutral) */
  baseline?: FanbaseSentiment;
}

/**
 * Apply exponential decay to sentiment values.
 *
 * Formula: sentiment_t = baseline + (peak - baseline) * e^(-λt)
 *
 * As time passes, sentiment exponentially approaches baseline.
 */
export function applyDecay(params: DecayParams): FanbaseSentiment {
  const {
    peak,
    daysSincePeak,
    lambda = DEFAULT_DECAY_CONSTANT,
    baseline = BASELINE_SENTIMENT,
  } = params;

  // Decay factor: e^(-λt)
  const decayFactor = Math.exp(-lambda * daysSincePeak);

  return {
    overall: baseline.overall + (peak.overall - baseline.overall) * decayFactor,
    optimism: baseline.optimism + (peak.optimism - baseline.optimism) * decayFactor,
    loyalty: baseline.loyalty + (peak.loyalty - baseline.loyalty) * decayFactor,
    volatility: calculateVolatility(peak, baseline, decayFactor),
  };
}

/**
 * Calculate volatility based on how far sentiment is from baseline.
 * More extreme = more volatile.
 */
function calculateVolatility(
  current: FanbaseSentiment,
  baseline: FanbaseSentiment,
  decayFactor: number
): number {
  const overallDelta = Math.abs(current.overall - baseline.overall);
  const optimismDelta = Math.abs(current.optimism - baseline.optimism);
  const loyaltyDelta = Math.abs(current.loyalty - baseline.loyalty);

  // Average delta from baseline
  const avgDelta = (overallDelta + optimismDelta + loyaltyDelta) / 3;

  // Volatility is higher when recently spiked (high decay factor) and far from baseline
  return Math.min(1, avgDelta * (1 + decayFactor));
}

// ============================================================================
// Trend Calculation
// ============================================================================

/**
 * Determine sentiment trend based on recent snapshots.
 */
export function calculateTrend(
  snapshots: Array<{ sentiment: FanbaseSentiment; timestamp: string }>,
  windowDays = 7
): SentimentTrend {
  if (snapshots.length < 2) return 'stable';

  const now = new Date();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Filter to snapshots within window
  const recentSnapshots = snapshots.filter(
    (s) => now.getTime() - new Date(s.timestamp).getTime() <= windowMs
  );

  if (recentSnapshots.length < 2) return 'stable';

  // Sort by timestamp
  recentSnapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Compare first and last
  const first = recentSnapshots[0].sentiment.overall;
  const last = recentSnapshots[recentSnapshots.length - 1].sentiment.overall;
  const delta = last - first;

  // Threshold for trend detection
  const TREND_THRESHOLD = 0.05;

  if (delta > TREND_THRESHOLD) return 'rising';
  if (delta < -TREND_THRESHOLD) return 'falling';
  return 'stable';
}

// ============================================================================
// Event Processing
// ============================================================================

/**
 * Process a sentiment event and return updated sentiment values.
 */
export function processEvent(
  event: SentimentEvent,
  currentSentiment: FanbaseSentiment
): FanbaseSentiment {
  let adjustment: Partial<FanbaseSentiment> = {};

  switch (event.eventType) {
    case 'game_win':
      adjustment = calculateGameAdjustment(event.metadata as GameEventMeta, true);
      break;
    case 'game_loss':
      adjustment = calculateGameAdjustment(event.metadata as GameEventMeta, false);
      break;
    case 'recruiting_commit':
      adjustment = calculateRecruitingAdjustment(event.metadata as RecruitingEventMeta, true);
      break;
    case 'recruiting_decommit':
      adjustment = calculateRecruitingAdjustment(event.metadata as RecruitingEventMeta, false);
      break;
    case 'coach_hire':
      adjustment = calculateCoachAdjustment(event.metadata as CoachEventMeta, true);
      break;
    case 'coach_fire':
      adjustment = calculateCoachAdjustment(event.metadata as CoachEventMeta, false);
      break;
    case 'injury_major': {
      const injuryMeta = event.metadata as InjuryEventMeta;
      const severityMult =
        injuryMeta.severity === 'season_ending'
          ? 1.0
          : injuryMeta.severity === 'moderate'
            ? 0.6
            : 0.3;
      const starterMult = injuryMeta.isStarter ? 1.5 : 1.0;
      const base = BASE_ADJUSTMENTS.injury_major;
      const adj = base.min * severityMult * starterMult;
      adjustment = { overall: adj, optimism: adj * 1.5 }; // Injuries hurt optimism
      break;
    }
    case 'transfer_portal_gain':
    case 'transfer_portal_loss': {
      const isGain = event.eventType === 'transfer_portal_gain';
      const portalMeta = event.metadata as PortalEventMeta;
      const ratingMult = Math.pow(portalMeta.rating / 5, 2);
      const base = isGain
        ? BASE_ADJUSTMENTS.transfer_portal_gain
        : BASE_ADJUSTMENTS.transfer_portal_loss;
      const adj = base.min + (base.max - base.min) * ratingMult;
      adjustment = { overall: adj, optimism: adj * 1.2 };
      break;
    }
  }

  // Apply adjustments with clamping
  return {
    overall: clamp(currentSentiment.overall + (adjustment.overall ?? 0), -1, 1),
    optimism: clamp(currentSentiment.optimism + (adjustment.optimism ?? 0), 0, 1),
    loyalty: clamp(currentSentiment.loyalty + (adjustment.loyalty ?? 0), 0, 1),
    volatility: Math.min(1, currentSentiment.volatility + 0.1), // Events increase volatility
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ============================================================================
// Highlightly API Integration Types
// ============================================================================

/**
 * Convert Highlightly game result to sentiment event.
 */
export interface HighlightlyGameResult {
  gameId: string;
  homeTeam: { id: string; name: string; score: number };
  awayTeam: { id: string; name: string; score: number };
  status: 'final' | 'in_progress' | 'scheduled';
  gameType: 'regular' | 'postseason';
  week?: number;
}

/**
 * Create a sentiment event from a Highlightly game result.
 * Requires expected win probability from a separate source (e.g., predictions API).
 */
export function createGameEvent(
  result: HighlightlyGameResult,
  schoolId: string,
  expectedWinProb: number,
  rivalryInfo?: { isRivalry: boolean }
): SentimentEvent | null {
  if (result.status !== 'final') return null;

  const isHome = result.homeTeam.id === schoolId;
  const teamScore = isHome ? result.homeTeam.score : result.awayTeam.score;
  const opponentScore = isHome ? result.awayTeam.score : result.homeTeam.score;
  const isWin = teamScore > opponentScore;

  const opponent = isHome ? result.awayTeam : result.homeTeam;

  const meta: GameEventMeta = {
    opponentId: opponent.id,
    opponentName: opponent.name,
    score: { team: teamScore, opponent: opponentScore },
    expectedWinProb,
    isRivalry: rivalryInfo?.isRivalry ?? false,
    gameType: result.gameType === 'postseason' ? 'bowl' : 'regular',
  };

  return {
    id: `game-${result.gameId}-${schoolId}`,
    schoolId,
    eventType: isWin ? 'game_win' : 'game_loss',
    timestamp: new Date().toISOString(),
    metadata: meta,
  };
}
