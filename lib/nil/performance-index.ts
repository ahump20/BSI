/**
 * NIL Performance Index — FMNV-based calculator.
 *
 * Computes a 0-100 index score using the Fair Market NIL Value methodology:
 *   Performance (40%) + Exposure (30%) + Market (30%)
 *
 * Inputs come from BSI Savant compute (wOBA, wRC+, FIP) and conference/market
 * metadata. Returns a tier label, index score, and estimated NIL dollar range.
 *
 * All estimates are clearly labeled as "BSI Estimate" — no fabricated precision.
 */

import {
  WAR_TO_NIL_BASELINE,
  CONFERENCE_TIERS,
  CONFERENCE_EXPOSURE_MULTIPLIER,
  MARKET_SIZE_MULTIPLIER,
  type ConferenceTier,
  type MarketSize,
} from '@/lib/data/nil-market-data';

/* ── Input / Output Types ──────────────────────────────────────── */

export interface NILIndexInput {
  /** Weighted on-base average (batter metric) */
  woba?: number;
  /** Weighted runs created plus, 100 = league average */
  wrc_plus?: number;
  /** Fielding independent pitching (pitcher metric, lower is better) */
  fip?: number;
  /** ERA minus, 100 = league average, lower is better */
  era_minus?: number;
  /** Conference name (e.g., "SEC", "Big 12") */
  conference: string;
  /** Social media followers (optional) */
  followers?: number;
  /** Metro market size classification */
  market_size?: MarketSize;
}

export interface NILIndexBreakdown {
  performance: number; // 0-100
  exposure: number;    // 0-100
  market: number;      // 0-100
}

export type NILTier = 'Elite' | 'High' | 'Above Average' | 'Average' | 'Developing';

export interface NILIndexResult {
  /** Composite index score, 0-100 */
  index: number;
  /** Human-readable tier */
  tier: NILTier;
  /** Estimated NIL dollar range [low, high] */
  estimatedRange: [number, number];
  /** Component scores */
  breakdown: NILIndexBreakdown;
  /** Whether this is a pitcher profile */
  isPitcher: boolean;
}

/* ── League Baselines (D1 college baseball) ────────────────────── */

const LEAGUE_AVG_WOBA = 0.320;
const LEAGUE_AVG_WRC_PLUS = 100;

/* ── Scoring Functions ─────────────────────────────────────────── */

/**
 * Performance score for batters.
 * wOBA and wRC+ are weighted equally within the performance component.
 * Scores are clamped 0-100 with league average at ~50.
 */
function scoreBatter(woba: number, wrcPlus: number): number {
  // wOBA: .250 = floor (~0), .400+ = ceiling (~100)
  const wobaScore = clamp(((woba - 0.250) / (0.400 - 0.250)) * 100, 0, 100);

  // wRC+: 50 = floor, 200+ = ceiling. League avg (100) = ~50 on the scale.
  const wrcScore = clamp(((wrcPlus - 50) / (200 - 50)) * 100, 0, 100);

  return (wobaScore + wrcScore) / 2;
}

/**
 * Performance score for pitchers.
 * FIP and ERA- are inverted scales (lower = better).
 */
function scorePitcher(fip: number, eraMinus?: number): number {
  // FIP: 6.0 = floor (~0), 2.0 = ceiling (~100)
  const fipScore = clamp(((6.0 - fip) / (6.0 - 2.0)) * 100, 0, 100);

  if (eraMinus !== undefined) {
    // ERA-: 150 = floor (~0), 50 = ceiling (~100)
    const eraScore = clamp(((150 - eraMinus) / (150 - 50)) * 100, 0, 100);
    return (fipScore + eraScore) / 2;
  }

  return fipScore;
}

/**
 * Exposure score: conference tier + social following.
 * Conference tier dominates (70% of exposure), social is supplementary (30%).
 */
function scoreExposure(conference: string, followers?: number): number {
  const tier: ConferenceTier = CONFERENCE_TIERS[conference] ?? 'other';
  const confScore = CONFERENCE_EXPOSURE_MULTIPLIER[tier] * 100;

  let socialScore = 20; // default for unknown
  if (followers !== undefined) {
    // 0 followers = 0, 100K+ = 100
    socialScore = clamp((followers / 100_000) * 100, 0, 100);
  }

  return confScore * 0.7 + socialScore * 0.3;
}

/**
 * Market score: metro market size proxy.
 * Simple classification — large/medium/small metro area.
 */
function scoreMarket(marketSize: MarketSize = 'medium'): number {
  return MARKET_SIZE_MULTIPLIER[marketSize] * 100;
}

/* ── Tier Classification ───────────────────────────────────────── */

function classifyTier(index: number): NILTier {
  if (index >= 85) return 'Elite';
  if (index >= 70) return 'High';
  if (index >= 55) return 'Above Average';
  if (index >= 40) return 'Average';
  return 'Developing';
}

/* ── Dollar Estimation ─────────────────────────────────────────── */

/**
 * Converts index score to estimated NIL dollar range.
 * Uses WAR-to-NIL baseline scaled by index position.
 *
 * A 100-index player is roughly 3-4 WAR caliber.
 * The range widens at higher indices to reflect market uncertainty.
 */
function estimateDollarRange(index: number): [number, number] {
  // Map 0-100 index to approximate WAR equivalent (0 to 3.5)
  const warEquivalent = (index / 100) * 3.5;
  const baseValue = warEquivalent * WAR_TO_NIL_BASELINE;

  // Wider confidence band at higher values
  const spreadFactor = 0.2 + (index / 100) * 0.15;
  const low = Math.round(baseValue * (1 - spreadFactor));
  const high = Math.round(baseValue * (1 + spreadFactor));

  return [Math.max(0, low), high];
}

/* ── Main Calculator ───────────────────────────────────────────── */

export function computeNILIndex(input: NILIndexInput): NILIndexResult {
  const { woba, wrc_plus, fip, era_minus, conference, followers, market_size } = input;

  // Determine if pitcher or batter based on available metrics
  const hasBatterMetrics = woba !== undefined || wrc_plus !== undefined;
  const hasPitcherMetrics = fip !== undefined || era_minus !== undefined;
  const isPitcher = hasPitcherMetrics && !hasBatterMetrics;

  // Performance score (40%)
  let performance: number;
  if (isPitcher && fip !== undefined) {
    performance = scorePitcher(fip, era_minus);
  } else {
    performance = scoreBatter(
      woba ?? LEAGUE_AVG_WOBA,
      wrc_plus ?? LEAGUE_AVG_WRC_PLUS
    );
  }

  // Exposure score (30%)
  const exposure = scoreExposure(conference, followers);

  // Market score (30%)
  const market = scoreMarket(market_size);

  // Weighted composite
  const index = Math.round(
    performance * 0.4 + exposure * 0.3 + market * 0.3
  );

  const clampedIndex = clamp(index, 0, 100);

  return {
    index: clampedIndex,
    tier: classifyTier(clampedIndex),
    estimatedRange: estimateDollarRange(clampedIndex),
    breakdown: {
      performance: Math.round(performance),
      exposure: Math.round(exposure),
      market: Math.round(market),
    },
    isPitcher,
  };
}

/* ── Utility ───────────────────────────────────────────────────── */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Format dollar amount for display.
 * Under $1M: "$250K". Over $1M: "$1.2M".
 */
export function formatNILDollar(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount}`;
}
