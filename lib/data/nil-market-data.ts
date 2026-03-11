/**
 * NIL Market Data — typed constants from verified research.
 *
 * Source: "The $1 Billion Experiment" (BSI Research Division, March 2026).
 * All figures carry source attribution for UI display.
 * Single source of truth — no hardcoded values in page components.
 */

/* ── Market Growth (Year 1–5) ──────────────────────────────────── */

export interface MarketYearData {
  readonly year: number;
  readonly label: string;
  readonly value: number; // billions USD
  readonly projected?: boolean;
  readonly low?: number;
  readonly high?: number;
}

export const NIL_MARKET_GROWTH: readonly MarketYearData[] = [
  { year: 1, label: '2021-22', value: 0.917 },
  { year: 2, label: '2022-23', value: 1.17 },
  { year: 3, label: '2023-24', value: 1.67 },
  { year: 4, label: '2024-25', value: 2.26 },
  { year: 5, label: '2025-26', value: 2.5, projected: true, low: 2.3, high: 2.75 },
] as const;

export const NIL_MARKET_GROWTH_SOURCE =
  'Opendorse NIL at Four (2025), BSI Research projection for Year 5';

/* ── Gender Equity Split ───────────────────────────────────────── */

export interface GenderEquityData {
  readonly metric: string;
  readonly men: number;
  readonly women: number;
  readonly caveat?: string;
}

export const NIL_GENDER_SPLIT: readonly GenderEquityData[] = [
  {
    metric: 'Deal Count Share',
    men: 57,
    women: 43,
  },
  {
    metric: 'Top-100 by Count',
    men: 48,
    women: 52,
    caveat: 'Women hold majority of top-100 deals by count; dollar share data lacks independent audit.',
  },
] as const;

export const NIL_GENDER_SOURCE =
  'Opendorse NIL at Four (2025); Llontop & Seifried (2024)';

/* ── Sport Distribution ────────────────────────────────────────── */

export interface SportDistributionData {
  readonly sport: string;
  readonly share: number; // percentage
}

export const NIL_SPORT_DISTRIBUTION: readonly SportDistributionData[] = [
  { sport: 'Football', share: 44.5 },
  { sport: "Men's Basketball", share: 15.8 },
  { sport: "Women's Basketball", share: 10.5 },
  { sport: 'Baseball', share: 5.2 },
  { sport: 'Softball', share: 4.1 },
  { sport: 'Volleyball', share: 3.8 },
  { sport: 'Track & Field', share: 2.4 },
  { sport: 'Other', share: 13.7 },
] as const;

export const NIL_SPORT_SOURCE =
  'SponsorUnited (2023), Opendorse activity data (2024-25)';

/* ── Collective Growth ─────────────────────────────────────────── */

export interface CollectiveGrowthData {
  readonly year: string;
  readonly count: number;
  readonly projected?: boolean;
}

export const NIL_COLLECTIVE_GROWTH: readonly CollectiveGrowthData[] = [
  { year: '2022', count: 80 },
  { year: '2023', count: 150 },
  { year: '2024', count: 200 },
  { year: '2025', count: 250, projected: true },
] as const;

export const NIL_COLLECTIVE_CONCENTRATION =
  'Top 10% of collectives account for an estimated 60–70% of total athlete payments.';

export const NIL_COLLECTIVE_SOURCE =
  '247Sports (2025), Front Office Sports (2025)';

/* ── FMNV Methodology Weights ──────────────────────────────────── */

export interface FMNVWeight {
  readonly category: string;
  readonly weight: number; // 0-1
  readonly description: string;
}

export const FMNV_WEIGHTS: readonly FMNVWeight[] = [
  {
    category: 'Performance',
    weight: 0.4,
    description: 'On-field production: wOBA, wRC+, FIP, ERA- normalized against D1 averages.',
  },
  {
    category: 'Exposure',
    weight: 0.3,
    description: 'Conference tier (Power 4 vs. mid-major), social following, media market reach.',
  },
  {
    category: 'Market',
    weight: 0.3,
    description: 'Metro market size, program NIL infrastructure, collective spending tier.',
  },
] as const;

/* ── WAR-to-NIL Baseline ───────────────────────────────────────── */

/**
 * Brook (2025): $7.5M per WAR for college baseball.
 * This is the conversion factor from Wins Above Replacement
 * to estimated NIL dollar value at the D1 level.
 */
export const WAR_TO_NIL_BASELINE = 7_500_000;
export const WAR_TO_NIL_SOURCE = 'Brook (2025), college baseball WAR valuation';

/* ── Conference Tier Mapping ───────────────────────────────────── */

export type ConferenceTier = 'power4' | 'major' | 'mid-major' | 'other';

export const CONFERENCE_TIERS: Record<string, ConferenceTier> = {
  SEC: 'power4',
  'Big Ten': 'power4',
  'Big 12': 'power4',
  ACC: 'power4',
  'Pac-12': 'major',
  AAC: 'major',
  'Mountain West': 'major',
  'Sun Belt': 'mid-major',
  'Conference USA': 'mid-major',
  'Missouri Valley': 'mid-major',
  'Colonial Athletic': 'mid-major',
  WCC: 'mid-major',
  'Big East': 'major',
  A10: 'mid-major',
  MAC: 'mid-major',
  WAC: 'mid-major',
  SWAC: 'other',
  MEAC: 'other',
  Southland: 'other',
  'Big South': 'other',
  'Ohio Valley': 'other',
  Summit: 'other',
  Horizon: 'other',
  NEC: 'other',
  Patriot: 'other',
  ASUN: 'mid-major',
  'America East': 'other',
  CAA: 'mid-major',
  'Big West': 'mid-major',
  Ivy: 'other',
} as const;

/**
 * Exposure multiplier by conference tier.
 * Power 4 conferences generate ~3x the media exposure of mid-majors.
 */
export const CONFERENCE_EXPOSURE_MULTIPLIER: Record<ConferenceTier, number> = {
  power4: 1.0,
  major: 0.7,
  'mid-major': 0.4,
  other: 0.2,
} as const;

/* ── Market Size Proxy ─────────────────────────────────────────── */

export type MarketSize = 'large' | 'medium' | 'small';

/**
 * Simplified market size classification for NIL exposure scoring.
 * Large = top-25 metro, Medium = top-75, Small = everything else.
 */
export const MARKET_SIZE_MULTIPLIER: Record<MarketSize, number> = {
  large: 1.0,
  medium: 0.65,
  small: 0.35,
} as const;
