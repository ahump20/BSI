/**
 * BSI Unified Insight System - Type Definitions
 *
 * Provides a unified insight type that any BSI system can produce
 * and any UI component can consume. Connects predictions, sentiment,
 * portal tracking, and calibration into a single coherent interface.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import type { SupportedSport } from '@/lib/prediction/types';

// ============================================================================
// Core Insight Types
// ============================================================================

/**
 * Source system that generated the insight.
 */
export type InsightSource = 'prediction' | 'sentiment' | 'portal' | 'calibration';

/**
 * Priority level for displaying insights.
 * - critical: Must be seen (e.g., key injury affecting prediction)
 * - high: Important context (e.g., recent portal move)
 * - medium: Relevant information (e.g., sentiment trending)
 * - low: Background context
 */
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * When the insight is most relevant.
 */
export type InsightTiming = 'pre_game' | 'live' | 'post_game' | 'always';

/**
 * Unified insight that any BSI system can produce.
 * Designed for display in ScoreCards, Intel tabs, and game detail views.
 */
export interface UnifiedInsight {
  id: string;
  source: InsightSource;
  priority: InsightPriority;
  timing: InsightTiming;

  /** Associated team ID (optional - some insights are game-level) */
  teamId?: string;
  /** Associated game ID (optional - some insights are team-level) */
  gameId?: string;
  /** Sport context */
  sport: SupportedSport;

  /** Short headline for display (e.g., "Texas +8% win prob after portal gain") */
  headline: string;
  /** 2-3 sentence explanation */
  summary: string;
  /** Actionable advice for the user (optional) */
  actionableAdvice?: string;

  /** Confidence in this insight (0-1) */
  confidence: number;

  /** When this insight was created (ISO 8601) */
  createdAt: string;
  /** When this insight expires/becomes stale (ISO 8601, optional) */
  expiresAt?: string;

  /** Additional structured data specific to insight type */
  metadata?: InsightMetadata;
}

// ============================================================================
// Insight Metadata Types
// ============================================================================

/**
 * Type-specific metadata for insights.
 */
export type InsightMetadata =
  | PredictionInsightMeta
  | SentimentInsightMeta
  | PortalInsightMeta
  | CalibrationInsightMeta;

export interface PredictionInsightMeta {
  type: 'prediction';
  homeWinProbability: number;
  awayWinProbability: number;
  predictedSpread: number;
  topFactor?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface SentimentInsightMeta {
  type: 'sentiment';
  sentimentOverall: number; // -1 to 1
  sentimentTrend: 'rising' | 'stable' | 'falling';
  volatility: number; // 0-1
  recentEvent?: string;
}

export interface PortalInsightMeta {
  type: 'portal';
  playerName: string;
  position: string;
  moveType: 'gain' | 'loss';
  fromSchool?: string;
  toSchool?: string;
  estimatedNILValue?: number;
  impactRating: number; // 0-1
}

export interface CalibrationInsightMeta {
  type: 'calibration';
  predictionAccuracy: number; // 0-1
  brierScore: number;
  wasCorrect: boolean;
  predictionError: number; // actual - predicted
}

// ============================================================================
// ScoreCard Intel Props
// ============================================================================

/**
 * Prediction data for ScoreCard display.
 */
export interface ScoreCardPrediction {
  homeWinProb: number;
  confidence: 'high' | 'medium' | 'low';
  topFactor?: string;
}

/**
 * Sentiment data for ScoreCard display.
 */
export interface ScoreCardSentiment {
  /** Home team sentiment temperature (-1 to 1) */
  homeTemp: number;
  /** Away team sentiment temperature (-1 to 1) */
  awayTemp: number;
}

// ============================================================================
// Intel API Response Types
// ============================================================================

/**
 * Response from the unified intel API endpoint.
 */
export interface GameIntelResponse {
  gameId: string;
  sport: SupportedSport;

  /** Prediction for this game */
  prediction?: {
    homeWinProbability: number;
    awayWinProbability: number;
    predictedSpread: number;
    predictedTotal: number;
    confidence: 'high' | 'medium' | 'low';
    topFactors: string[];
    humanSummary: string;
  };

  /** Sentiment for home team */
  homeSentiment?: {
    overall: number;
    optimism: number;
    trend: 'rising' | 'stable' | 'falling';
    volatility: number;
  };

  /** Sentiment for away team */
  awaySentiment?: {
    overall: number;
    optimism: number;
    trend: 'rising' | 'stable' | 'falling';
    volatility: number;
  };

  /** Relevant insights for this game */
  insights: UnifiedInsight[];

  /** Recent portal moves affecting either team */
  portalMoves?: PortalMove[];

  /** Metadata */
  fetchedAt: string;
  cacheHit: boolean;
}

export interface PortalMove {
  playerName: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  moveDate: string;
  affectedTeam: 'home' | 'away';
  moveType: 'gain' | 'loss';
  impactRating: number;
}

// ============================================================================
// Insight Factory Functions
// ============================================================================

/**
 * Create a prediction insight.
 */
export function createPredictionInsight(params: {
  gameId: string;
  sport: SupportedSport;
  homeTeamName: string;
  awayTeamName: string;
  homeWinProb: number;
  topFactor?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}): UnifiedInsight {
  const { gameId, sport, homeTeamName, awayTeamName, homeWinProb, topFactor, confidenceLevel } =
    params;
  const percentage = Math.round(homeWinProb * 100);
  const favored = homeWinProb >= 0.5 ? homeTeamName : awayTeamName;
  const favoredProb = homeWinProb >= 0.5 ? percentage : 100 - percentage;

  return {
    id: `pred-${gameId}-${Date.now()}`,
    source: 'prediction',
    priority: confidenceLevel === 'high' ? 'high' : 'medium',
    timing: 'pre_game',
    gameId,
    sport,
    headline: `${favored} ${favoredProb}% to win`,
    summary: topFactor
      ? `Our model gives ${favored} a ${favoredProb}% chance to win. Key factor: ${topFactor}.`
      : `Our model gives ${favored} a ${favoredProb}% chance to win based on current matchup analysis.`,
    confidence: confidenceLevel === 'high' ? 0.85 : confidenceLevel === 'medium' ? 0.7 : 0.55,
    createdAt: new Date().toISOString(),
    metadata: {
      type: 'prediction',
      homeWinProbability: homeWinProb,
      awayWinProbability: 1 - homeWinProb,
      predictedSpread: 0, // Would be filled by caller
      topFactor,
      confidenceLevel,
    },
  };
}

/**
 * Create a sentiment insight.
 */
export function createSentimentInsight(params: {
  teamId: string;
  teamName: string;
  sport: SupportedSport;
  sentiment: number;
  trend: 'rising' | 'stable' | 'falling';
  volatility: number;
  recentEvent?: string;
}): UnifiedInsight {
  const { teamId, teamName, sport, sentiment, trend, volatility, recentEvent } = params;

  const sentimentLabel = sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral';
  const trendEmoji = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';

  return {
    id: `sent-${teamId}-${Date.now()}`,
    source: 'sentiment',
    priority: volatility > 0.6 ? 'high' : 'medium',
    timing: 'always',
    teamId,
    sport,
    headline: `${teamName} fanbase ${sentimentLabel} ${trendEmoji}`,
    summary: recentEvent
      ? `${teamName} fan sentiment is ${sentimentLabel} and ${trend}. Recent event: ${recentEvent}.`
      : `${teamName} fan sentiment is ${sentimentLabel} and ${trend}.`,
    confidence: 0.75,
    createdAt: new Date().toISOString(),
    metadata: {
      type: 'sentiment',
      sentimentOverall: sentiment,
      sentimentTrend: trend,
      volatility,
      recentEvent,
    },
  };
}

/**
 * Create a portal insight.
 */
export function createPortalInsight(params: {
  teamId: string;
  teamName: string;
  sport: SupportedSport;
  playerName: string;
  position: string;
  moveType: 'gain' | 'loss';
  fromSchool?: string;
  toSchool?: string;
  nilValue?: number;
  impactRating: number;
}): UnifiedInsight {
  const {
    teamId,
    teamName,
    sport,
    playerName,
    position,
    moveType,
    fromSchool,
    toSchool,
    nilValue,
    impactRating,
  } = params;

  const headline =
    moveType === 'gain'
      ? `${teamName} adds ${playerName} (${position})`
      : `${teamName} loses ${playerName} to portal`;

  let summary =
    moveType === 'gain'
      ? `${playerName} commits to ${teamName}`
      : `${playerName} (${position}) has entered the transfer portal`;

  if (moveType === 'gain' && fromSchool) {
    summary += ` from ${fromSchool}`;
  }
  if (moveType === 'loss' && toSchool) {
    summary += ` and committed to ${toSchool}`;
  }
  if (nilValue) {
    summary += `. Estimated NIL value: $${(nilValue / 1000).toFixed(0)}K.`;
  } else {
    summary += '.';
  }

  return {
    id: `portal-${teamId}-${playerName.replace(/\s/g, '-')}-${Date.now()}`,
    source: 'portal',
    priority: impactRating > 0.7 ? 'high' : impactRating > 0.4 ? 'medium' : 'low',
    timing: 'always',
    teamId,
    sport,
    headline,
    summary,
    confidence: 0.9,
    createdAt: new Date().toISOString(),
    metadata: {
      type: 'portal',
      playerName,
      position,
      moveType,
      fromSchool,
      toSchool,
      estimatedNILValue: nilValue,
      impactRating,
    },
  };
}

/**
 * Create a calibration insight (post-game prediction accuracy feedback).
 */
export function createCalibrationInsight(params: {
  gameId: string;
  sport: SupportedSport;
  homeTeamName: string;
  awayTeamName: string;
  predictedHomeWinProb: number;
  actualWinner: 'home' | 'away';
}): UnifiedInsight {
  const { gameId, sport, homeTeamName, awayTeamName, predictedHomeWinProb, actualWinner } = params;

  const wasCorrect =
    (predictedHomeWinProb >= 0.5 && actualWinner === 'home') ||
    (predictedHomeWinProb < 0.5 && actualWinner === 'away');

  const predictedWinner = predictedHomeWinProb >= 0.5 ? homeTeamName : awayTeamName;
  const predictedProb =
    predictedHomeWinProb >= 0.5 ? predictedHomeWinProb : 1 - predictedHomeWinProb;
  const actualWinnerName = actualWinner === 'home' ? homeTeamName : awayTeamName;

  const brierScore = Math.pow((actualWinner === 'home' ? 1 : 0) - predictedHomeWinProb, 2);

  return {
    id: `cal-${gameId}-${Date.now()}`,
    source: 'calibration',
    priority: 'low',
    timing: 'post_game',
    gameId,
    sport,
    headline: wasCorrect
      ? `Prediction correct: ${actualWinnerName} wins`
      : `Upset: ${actualWinnerName} wins`,
    summary: wasCorrect
      ? `We predicted ${predictedWinner} at ${Math.round(predictedProb * 100)}%. ${actualWinnerName} won.`
      : `We had ${predictedWinner} at ${Math.round(predictedProb * 100)}%, but ${actualWinnerName} pulled the upset.`,
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    metadata: {
      type: 'calibration',
      predictionAccuracy: wasCorrect ? 1 : 0,
      brierScore,
      wasCorrect,
      predictionError: (actualWinner === 'home' ? 1 : 0) - predictedHomeWinProb,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Filter insights by timing relevance.
 */
export function filterInsightsByTiming(
  insights: UnifiedInsight[],
  gameStatus: 'scheduled' | 'live' | 'final'
): UnifiedInsight[] {
  const timingMap: Record<string, InsightTiming[]> = {
    scheduled: ['pre_game', 'always'],
    live: ['live', 'always'],
    final: ['post_game', 'always'],
  };

  const validTimings = timingMap[gameStatus] || ['always'];
  return insights.filter((i) => validTimings.includes(i.timing));
}

/**
 * Sort insights by priority and recency.
 */
export function sortInsights(insights: UnifiedInsight[]): UnifiedInsight[] {
  const priorityOrder: Record<InsightPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...insights].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by recency
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get top N insights, ensuring source diversity.
 */
export function getTopInsights(insights: UnifiedInsight[], maxCount = 3): UnifiedInsight[] {
  const sorted = sortInsights(insights);
  const result: UnifiedInsight[] = [];
  const sourcesUsed = new Set<InsightSource>();

  // First pass: get one insight per source
  for (const insight of sorted) {
    if (result.length >= maxCount) break;
    if (!sourcesUsed.has(insight.source)) {
      result.push(insight);
      sourcesUsed.add(insight.source);
    }
  }

  // Second pass: fill remaining slots with highest priority
  for (const insight of sorted) {
    if (result.length >= maxCount) break;
    if (!result.includes(insight)) {
      result.push(insight);
    }
  }

  return result;
}
