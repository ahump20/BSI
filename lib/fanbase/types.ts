/**
 * BSI Fanbase Sentiment & Characteristics
 *
 * Type definitions for college football fanbase profiling with
 * historical sentiment tracking over time.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

// ============================================================================
// Core Enums & Types
// ============================================================================

export type Conference = 'SEC' | 'Big Ten' | 'Big 12' | 'ACC' | 'Pac-12' | 'Independent';

export type DataSource = 'x-research' | 'manual' | 'survey' | 'aggregated';

export type SentimentTrend = 'rising' | 'stable' | 'falling';

// ============================================================================
// Fanbase Profile (Core Characteristics)
// ============================================================================

/**
 * Core sentiment metrics for a fanbase.
 * All values normalized 0.0 to 1.0 (except overall which is -1 to 1).
 */
export interface FanbaseSentiment {
  overall: number; // -1 to 1 (negative to positive)
  optimism: number; // 0-1
  loyalty: number; // 0-1
  volatility: number; // 0-1 (how much sentiment swings)
}

/**
 * Personality traits and behavioral characteristics.
 */
export interface FanbasePersonality {
  traits: string[]; // ["passionate", "traditional", "demanding"]
  rivalries: string[]; // ["oklahoma", "texas-am"]
  traditions: string[]; // ["Hook 'em", "The Eyes of Texas"]
  quirks: string[]; // Unique fanbase behaviors
}

/**
 * Fan engagement metrics.
 * All values normalized 0.0 to 1.0.
 */
export interface FanbaseEngagement {
  socialMediaActivity: number;
  gameAttendance: number;
  travelSupport: number;
  merchandisePurchasing: number;
}

/**
 * Fanbase demographics.
 */
export interface FanbaseDemographics {
  primaryAge: string; // "25-45"
  geographicSpread: string[]; // ["Texas", "National"]
  alumniPercentage: number; // 0-1
}

/**
 * Research metadata for data quality tracking.
 */
export interface FanbaseResearchMeta {
  lastUpdated: string; // ISO 8601
  dataSource: DataSource;
  confidence: number; // 0-1
  sampleSize: number;
  researcher?: string;
}

/**
 * Complete fanbase profile with current characteristics.
 */
export interface FanbaseProfile {
  id: string; // e.g., "texas-longhorns"
  school: string; // "University of Texas"
  shortName: string; // "Texas"
  mascot: string; // "Longhorns"
  conference: Conference;
  primaryColor: string; // "#BF5700"
  secondaryColor: string; // "#FFFFFF"
  logo?: string; // URL to logo

  sentiment: FanbaseSentiment;
  personality: FanbasePersonality;
  engagement: FanbaseEngagement;
  demographics: FanbaseDemographics;

  meta: FanbaseResearchMeta;
}

// ============================================================================
// Historical Sentiment Tracking
// ============================================================================

/**
 * Point-in-time sentiment readings.
 */
export interface SnapshotSentiment {
  overall: number; // -1 to 1
  optimism: number; // 0-1
  coachConfidence: number; // Sentiment toward coaching staff
  playoffHope: number; // Belief in championship contention
}

/**
 * Game/season context for the snapshot.
 */
export interface SnapshotContext {
  recentResult: string; // "W vs Oklahoma 34-21"
  record: string; // "8-1"
  ranking: number | null; // AP ranking
  keyEvents: string[]; // ["Beat rival", "Star player injured"]
}

/**
 * Weekly sentiment snapshot for historical tracking.
 */
export interface SentimentSnapshot {
  id: string; // UUID
  fanbaseId: string; // FK to FanbaseProfile
  timestamp: string; // ISO 8601
  week: number; // CFB week (1-15, or 17 for bowl season)
  season: number; // e.g., 2025

  sentiment: SnapshotSentiment;
  context: SnapshotContext;
  themes: string[]; // ["optimistic", "playoff-bound", "defense-concerns"]

  meta: {
    dataSource: DataSource;
    confidence: number;
    sampleSize: number;
  };
}

/**
 * Sentiment change between two snapshots.
 */
export interface SentimentDelta {
  fanbaseId: string;
  fromWeek: number;
  toWeek: number;
  season: number;

  overallChange: number; // -2 to 2
  optimismChange: number; // -1 to 1
  coachConfidenceChange: number;
  playoffHopeChange: number;

  trend: SentimentTrend;
  significantEvents: string[];
}

// ============================================================================
// Rivalry & Comparison Types
// ============================================================================

/**
 * Rivalry relationship between two fanbases.
 */
export interface FanbaseRivalry {
  id: string;
  teamA: string; // fanbase ID
  teamB: string; // fanbase ID
  name: string; // "Red River Rivalry"
  intensity: number; // 0-1 (1 = most intense)
  historicalRecord?: string; // "Texas leads 63-50-5"
  lastMeeting?: string; // "Texas W 34-30 (2024)"
  trophyName?: string; // "Golden Hat"
}

/**
 * Side-by-side comparison of two fanbases.
 */
export interface FanbaseComparison {
  teamA: FanbaseProfile;
  teamB: FanbaseProfile;
  rivalry?: FanbaseRivalry;

  sentimentComparison: {
    teamA: FanbaseSentiment;
    teamB: FanbaseSentiment;
    advantageTeam: string | null;
  };

  engagementComparison: {
    teamA: FanbaseEngagement;
    teamB: FanbaseEngagement;
    advantageTeam: string | null;
  };

  timestamp: string;
}

// ============================================================================
// Trending & Analytics Types
// ============================================================================

/**
 * Fanbase with significant recent sentiment change.
 */
export interface TrendingFanbase {
  fanbase: FanbaseProfile;
  delta: SentimentDelta;
  rank: number; // Position in trending list
  direction: 'up' | 'down';
}

/**
 * Conference-level aggregated sentiment.
 */
export interface ConferenceSentiment {
  conference: Conference;
  averageOverall: number;
  averageOptimism: number;
  mostPositive: string; // fanbase ID
  mostNegative: string; // fanbase ID
  teamCount: number;
  timestamp: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Query parameters for fanbase list endpoints.
 */
export interface FanbaseListParams {
  conference?: Conference;
  limit?: number;
  offset?: number;
  sortBy?: 'sentiment' | 'volatility' | 'engagement' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for history endpoints.
 */
export interface HistoryParams {
  season?: number;
  startWeek?: number;
  endWeek?: number;
  limit?: number;
}

/**
 * Response for fanbase profile with recent history.
 */
export interface FanbaseProfileWithHistory {
  profile: FanbaseProfile;
  recentSnapshots: SentimentSnapshot[];
  sentimentTrend: SentimentTrend;
  weekOverWeekChange?: SentimentDelta;
}

/**
 * Response for trending fanbases.
 */
export interface TrendingResponse {
  trending: TrendingFanbase[];
  week: number;
  season: number;
  timestamp: string;
}

// ============================================================================
// Admin/Write Types
// ============================================================================

/**
 * Payload for creating/updating a fanbase profile.
 */
export interface FanbaseProfileInput {
  id: string;
  school: string;
  shortName: string;
  mascot: string;
  conference: Conference;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;

  sentiment: FanbaseSentiment;
  personality: FanbasePersonality;
  engagement: FanbaseEngagement;
  demographics: FanbaseDemographics;

  dataSource: DataSource;
  confidence: number;
  sampleSize: number;
}

/**
 * Payload for adding a sentiment snapshot.
 */
export interface SentimentSnapshotInput {
  fanbaseId: string;
  week: number;
  season: number;

  sentiment: SnapshotSentiment;
  context: SnapshotContext;
  themes: string[];

  dataSource: DataSource;
  confidence: number;
  sampleSize: number;
}

// ============================================================================
// D1 Row Types (for database mapping)
// ============================================================================

/**
 * D1 row shape for fanbase_profiles table.
 */
export interface FanbaseProfileRow {
  id: string;
  school: string;
  short_name: string;
  mascot: string;
  conference: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;

  // Sentiment (stored as individual columns for querying)
  sentiment_overall: number;
  sentiment_optimism: number;
  sentiment_loyalty: number;
  sentiment_volatility: number;

  // Engagement
  engagement_social: number;
  engagement_attendance: number;
  engagement_travel: number;
  engagement_merch: number;

  // Demographics
  demo_primary_age: string;
  demo_alumni_pct: number;

  // JSON columns
  personality_json: string; // JSON stringified FanbasePersonality
  demo_geo_json: string; // JSON stringified string[]

  // Meta
  data_source: string;
  confidence: number;
  sample_size: number;
  updated_at: string;
  created_at: string;
}

/**
 * D1 row shape for sentiment_snapshots table.
 */
export interface SentimentSnapshotRow {
  id: string;
  fanbase_id: string;
  week: number;
  season: number;
  timestamp: string;

  // Sentiment
  sentiment_overall: number;
  sentiment_optimism: number;
  sentiment_coach_confidence: number;
  sentiment_playoff_hope: number;

  // Context JSON
  context_json: string; // JSON stringified SnapshotContext
  themes_json: string; // JSON stringified string[]

  // Meta
  data_source: string;
  confidence: number;
  sample_size: number;
  created_at: string;
}

/**
 * D1 row shape for fanbase_rivalries table.
 */
export interface FanbaseRivalryRow {
  id: string;
  team_a_id: string;
  team_b_id: string;
  name: string;
  intensity: number;
  historical_record: string | null;
  last_meeting: string | null;
  trophy_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert D1 row to FanbaseProfile.
 */
export function rowToFanbaseProfile(row: FanbaseProfileRow): FanbaseProfile {
  return {
    id: row.id,
    school: row.school,
    shortName: row.short_name,
    mascot: row.mascot,
    conference: row.conference as Conference,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    logo: row.logo_url ?? undefined,

    sentiment: {
      overall: row.sentiment_overall,
      optimism: row.sentiment_optimism,
      loyalty: row.sentiment_loyalty,
      volatility: row.sentiment_volatility,
    },

    personality: JSON.parse(row.personality_json) as FanbasePersonality,

    engagement: {
      socialMediaActivity: row.engagement_social,
      gameAttendance: row.engagement_attendance,
      travelSupport: row.engagement_travel,
      merchandisePurchasing: row.engagement_merch,
    },

    demographics: {
      primaryAge: row.demo_primary_age,
      geographicSpread: JSON.parse(row.demo_geo_json) as string[],
      alumniPercentage: row.demo_alumni_pct,
    },

    meta: {
      lastUpdated: row.updated_at,
      dataSource: row.data_source as DataSource,
      confidence: row.confidence,
      sampleSize: row.sample_size,
    },
  };
}

/**
 * Convert D1 row to SentimentSnapshot.
 */
export function rowToSentimentSnapshot(row: SentimentSnapshotRow): SentimentSnapshot {
  return {
    id: row.id,
    fanbaseId: row.fanbase_id,
    timestamp: row.timestamp,
    week: row.week,
    season: row.season,

    sentiment: {
      overall: row.sentiment_overall,
      optimism: row.sentiment_optimism,
      coachConfidence: row.sentiment_coach_confidence,
      playoffHope: row.sentiment_playoff_hope,
    },

    context: JSON.parse(row.context_json) as SnapshotContext,
    themes: JSON.parse(row.themes_json) as string[],

    meta: {
      dataSource: row.data_source as DataSource,
      confidence: row.confidence,
      sampleSize: row.sample_size,
    },
  };
}

/**
 * Generate slug from school name.
 * "University of Texas" -> "texas-longhorns"
 */
export function generateFanbaseSlug(shortName: string, mascot: string): string {
  return `${shortName.toLowerCase().replace(/\s+/g, '-')}-${mascot.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Calculate sentiment trend from snapshots.
 */
export function calculateSentimentTrend(snapshots: SentimentSnapshot[]): SentimentTrend {
  if (snapshots.length < 2) return 'stable';

  const sorted = [...snapshots].sort((a, b) => b.week - a.week);
  const recent = sorted[0].sentiment.overall;
  const previous = sorted[1].sentiment.overall;
  const delta = recent - previous;

  if (delta > 0.1) return 'rising';
  if (delta < -0.1) return 'falling';
  return 'stable';
}

/**
 * Calculate sentiment delta between two snapshots.
 */
export function calculateSentimentDelta(
  from: SentimentSnapshot,
  to: SentimentSnapshot
): SentimentDelta {
  return {
    fanbaseId: from.fanbaseId,
    fromWeek: from.week,
    toWeek: to.week,
    season: to.season,

    overallChange: to.sentiment.overall - from.sentiment.overall,
    optimismChange: to.sentiment.optimism - from.sentiment.optimism,
    coachConfidenceChange: to.sentiment.coachConfidence - from.sentiment.coachConfidence,
    playoffHopeChange: to.sentiment.playoffHope - from.sentiment.playoffHope,

    trend: calculateSentimentTrend([from, to]),
    significantEvents: to.context.keyEvents,
  };
}
