/**
 * BSI Fanbase Validation & Confidence Scoring
 *
 * Implements the validation methodology defined in
 * docs/fanbase-validation-methodology.md
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import type { FanbaseResearchMeta, DataSource, SentimentSnapshot } from './types';

// ============================================================================
// Types
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'stale';

export interface ConfidenceColors {
  bg: string;
  text: string;
  bar: string;
  border: string;
}

export interface RecencyScore {
  score: number;
  category: 'current' | 'recent' | 'aging' | 'stale';
  daysSince: number;
}

export interface SourceDiversityScore {
  score: number;
  sourceCount: number;
}

export interface ConsistencyScore {
  score: number;
  agreementRate: number;
}

export interface ValidationResult {
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  recency: RecencyScore;
  needsReview: boolean;
  nextReviewDate: string;
}

// ============================================================================
// Confidence Level Thresholds
// ============================================================================

const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.5,
  low: 0.25,
} as const;

const RECENCY_WEIGHTS: Record<string, number> = {
  '7': 1.0, // Last 7 days
  '14': 0.8, // 8-14 days
  '30': 0.6, // 15-30 days
  '60': 0.4, // 31-60 days
  '90': 0.2, // 61-90 days
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate confidence level from score.
 */
export function calculateConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  if (score >= CONFIDENCE_THRESHOLDS.low) return 'low';
  return 'stale';
}

/**
 * Get color classes for confidence level.
 */
export function getConfidenceColor(level: ConfidenceLevel): ConfidenceColors {
  const colors: Record<ConfidenceLevel, ConfidenceColors> = {
    high: {
      bg: 'bg-success/20',
      text: 'text-success',
      bar: 'bg-success',
      border: 'border-success/30',
    },
    medium: {
      bg: 'bg-warning/20',
      text: 'text-warning',
      bar: 'bg-warning',
      border: 'border-warning/30',
    },
    low: {
      bg: 'bg-burnt-orange/20',
      text: 'text-burnt-orange',
      bar: 'bg-burnt-orange',
      border: 'border-burnt-orange/30',
    },
    stale: {
      bg: 'bg-error/20',
      text: 'text-error',
      bar: 'bg-error',
      border: 'border-error/30',
    },
  };

  return colors[level];
}

/**
 * Calculate days since last update.
 */
export function getDaysSinceUpdate(lastUpdated: string): number {
  const lastDate = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format relative date string.
 */
export function formatRelativeDate(dateString: string): string {
  const days = getDaysSinceUpdate(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return 'Last month';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Calculate recency score based on days since update.
 */
export function calculateRecencyScore(lastUpdated: string): RecencyScore {
  const daysSince = getDaysSinceUpdate(lastUpdated);

  let score: number;
  let category: RecencyScore['category'];

  if (daysSince <= 7) {
    score = RECENCY_WEIGHTS['7'];
    category = 'current';
  } else if (daysSince <= 14) {
    score = RECENCY_WEIGHTS['14'];
    category = 'recent';
  } else if (daysSince <= 30) {
    score = RECENCY_WEIGHTS['30'];
    category = 'recent';
  } else if (daysSince <= 60) {
    score = RECENCY_WEIGHTS['60'];
    category = 'aging';
  } else if (daysSince <= 90) {
    score = RECENCY_WEIGHTS['90'];
    category = 'aging';
  } else {
    score = 0.1;
    category = 'stale';
  }

  return { score, category, daysSince };
}

/**
 * Calculate source diversity score.
 * More source types = higher confidence.
 */
export function calculateSourceDiversityScore(sources: DataSource[]): SourceDiversityScore {
  const uniqueSources = new Set(sources);
  const sourceCount = uniqueSources.size;

  let score: number;
  if (sourceCount >= 4) score = 1.0;
  else if (sourceCount === 3) score = 0.75;
  else if (sourceCount === 2) score = 0.5;
  else score = 0.25;

  return { score, sourceCount };
}

/**
 * Calculate consistency score based on signal agreement.
 * Used when multiple snapshots or signals are available.
 */
export function calculateConsistencyScore(snapshots: SentimentSnapshot[]): ConsistencyScore {
  if (snapshots.length < 2) {
    return { score: 0.5, agreementRate: 0.5 }; // Default to medium when insufficient data
  }

  // Check directional agreement between consecutive snapshots
  let agreements = 0;
  let comparisons = 0;

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];

    // Compare overall sentiment direction
    const prevDir = prev.sentiment.overall > 0 ? 1 : prev.sentiment.overall < 0 ? -1 : 0;
    const currDir = curr.sentiment.overall > 0 ? 1 : curr.sentiment.overall < 0 ? -1 : 0;

    if (prevDir === currDir || Math.abs(curr.sentiment.overall - prev.sentiment.overall) < 0.1) {
      agreements++;
    }
    comparisons++;
  }

  const agreementRate = comparisons > 0 ? agreements / comparisons : 0.5;

  let score: number;
  if (agreementRate >= 0.75) score = 1.0;
  else if (agreementRate >= 0.5) score = 0.75;
  else score = 0.5;

  return { score, agreementRate };
}

/**
 * Calculate full confidence score using weighted formula.
 *
 * confidence = (recency * 0.4) + (source_diversity * 0.3) + (consistency * 0.3)
 */
export function calculateFullConfidenceScore(
  meta: FanbaseResearchMeta,
  snapshots?: SentimentSnapshot[],
  additionalSources?: DataSource[]
): number {
  // Recency (40%)
  const recency = calculateRecencyScore(meta.lastUpdated);

  // Source diversity (30%)
  const sources = additionalSources ? [meta.dataSource, ...additionalSources] : [meta.dataSource];
  const diversity = calculateSourceDiversityScore(sources);

  // Consistency (30%)
  const consistency = snapshots ? calculateConsistencyScore(snapshots) : { score: meta.confidence }; // Fall back to stored confidence

  const score = recency.score * 0.4 + diversity.score * 0.3 + consistency.score * 0.3;

  return Math.min(1, Math.max(0, score));
}

/**
 * Full validation check for a fanbase profile.
 */
export function validateProfile(
  meta: FanbaseResearchMeta,
  snapshots?: SentimentSnapshot[]
): ValidationResult {
  const confidenceScore = snapshots
    ? calculateFullConfidenceScore(meta, snapshots)
    : meta.confidence;

  const confidenceLevel = calculateConfidenceLevel(confidenceScore);
  const recency = calculateRecencyScore(meta.lastUpdated);

  // Determine if review is needed
  const needsReview =
    confidenceLevel === 'low' || confidenceLevel === 'stale' || recency.daysSince > 30;

  // Calculate next review date
  const nextReviewDate = calculateNextReviewDate(recency.daysSince, confidenceLevel);

  return {
    confidenceScore,
    confidenceLevel,
    recency,
    needsReview,
    nextReviewDate,
  };
}

/**
 * Calculate next recommended review date.
 */
function calculateNextReviewDate(daysSinceLast: number, level: ConfidenceLevel): string {
  const now = new Date();
  let daysUntilReview: number;

  if (level === 'stale' || daysSinceLast > 60) {
    daysUntilReview = 0; // Review immediately
  } else if (level === 'low' || daysSinceLast > 30) {
    daysUntilReview = 7; // Review within a week
  } else if (level === 'medium') {
    daysUntilReview = 14; // Review within two weeks
  } else {
    daysUntilReview = 30; // Review within a month
  }

  const reviewDate = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
  return reviewDate.toISOString().split('T')[0];
}

// ============================================================================
// Batch Validation Utilities
// ============================================================================

/**
 * Profile with validation metadata for batch processing.
 */
export interface ProfileValidation {
  id: string;
  schoolName: string;
  validation: ValidationResult;
}

/**
 * Validate multiple profiles and sort by priority.
 */
export function validateProfiles(
  profiles: Array<{ id: string; shortName: string; meta: FanbaseResearchMeta }>
): ProfileValidation[] {
  return profiles
    .map((p) => ({
      id: p.id,
      schoolName: p.shortName,
      validation: validateProfile(p.meta),
    }))
    .sort((a, b) => {
      // Sort by needsReview first, then by confidence score ascending
      if (a.validation.needsReview !== b.validation.needsReview) {
        return a.validation.needsReview ? -1 : 1;
      }
      return a.validation.confidenceScore - b.validation.confidenceScore;
    });
}

/**
 * Get profiles that need immediate attention.
 */
export function getProfilesNeedingReview(validations: ProfileValidation[]): ProfileValidation[] {
  return validations.filter((v) => v.validation.needsReview);
}

/**
 * Calculate overall data health score for a set of profiles.
 */
export function calculateDataHealthScore(validations: ProfileValidation[]): number {
  if (validations.length === 0) return 0;

  const levelWeights: Record<ConfidenceLevel, number> = {
    high: 1.0,
    medium: 0.7,
    low: 0.3,
    stale: 0.1,
  };

  const totalWeight = validations.reduce(
    (sum, v) => sum + levelWeights[v.validation.confidenceLevel],
    0
  );

  return totalWeight / validations.length;
}
