/**
 * MLB Statcast TypeScript Interfaces
 * PHASE 19: Advanced baseball analytics using Statcast data
 *
 * Statcast is MLB's tracking technology that provides:
 * - Exit velocity and launch angle
 * - Expected batting average (xBA)
 * - Barrel rate
 * - Sprint speed
 * - Defensive metrics
 * - And 50+ additional metrics
 */

/**
 * Core Statcast metrics for a batted ball event
 */
export interface BattedBallEvent {
  gameDate: string;
  gamePk: number;
  playerId: number;
  playerName: string;
  team: string;
  opponent: string;

  // Ball tracking data
  exitVelocity?: number; // mph
  launchAngle?: number; // degrees
  hitDistance?: number; // feet
  hangTime?: number; // seconds

  // Calculated metrics
  xBA?: number; // Expected batting average (0-1)
  estimatedBA?: number; // Similar to xBA
  estimatedWOBA?: number; // Expected weighted on-base average

  // Pitch data
  pitchType?: string; // FF, SL, CH, etc.
  pitchSpeed?: number; // mph

  // Result
  result: string; // Single, Double, HR, Out, etc.
  events: string; // Detailed event description
  description?: string;

  // Barrel classification
  isBarrel: boolean; // True if exit velocity + launch angle in optimal range

  // Hit location
  hitCoordinateX?: number;
  hitCoordinateY?: number;
}

/**
 * Player season-level Statcast summary
 */
export interface StatcastPlayerSummary {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  season: number;

  // Batting metrics
  batting: {
    // Core counting stats
    atBats: number;
    hits: number;
    homeRuns: number;
    battingAverage: number;

    // Statcast metrics
    avgExitVelocity: number; // Average exit velocity (mph)
    maxExitVelocity: number; // Max exit velocity (mph)
    avgLaunchAngle: number; // Average launch angle (degrees)

    // Expected outcomes
    xBA: number; // Expected batting average
    xSLG: number; // Expected slugging percentage
    xWOBA: number; // Expected weighted on-base average
    xWOBACON: number; // xWOBA on contact

    // Barrel metrics
    barrelRate: number; // % of batted balls that are barrels
    barrels: number; // Total barrels
    barrelPerPA: number; // Barrels per plate appearance

    // Sweet spot metrics
    sweetSpotPercent: number; // % of balls hit at 8-32 degree launch angle

    // Hard hit metrics
    hardHitPercent: number; // % of balls hit 95+ mph
    avgHitDistance: number; // Average distance on balls in play

    // Sprint speed
    sprintSpeed?: number; // ft/sec (if available)
  };

  // Sample size
  battedBallEvents: number;
  plateAppearances: number;

  // Data quality
  lastUpdated: string;
  dataSource: string;
}

/**
 * Pitcher season-level Statcast summary
 */
export interface StatcastPitcherSummary {
  playerId: number;
  playerName: string;
  team: string;
  season: number;

  pitching: {
    // Core counting stats
    inningsPitched: number;
    strikeouts: number;
    walks: number;
    earnedRuns: number;
    era: number;

    // Statcast metrics
    avgExitVelocityAllowed: number; // Avg exit velocity against (mph)
    maxExitVelocityAllowed: number; // Max exit velocity against (mph)
    avgLaunchAngleAllowed: number; // Avg launch angle against (degrees)

    // Expected outcomes
    xBA: number; // Expected batting average against
    xSLG: number; // Expected slugging against
    xWOBA: number; // Expected weighted on-base against
    xERA: number; // Expected ERA

    // Barrel metrics
    barrelRateAllowed: number; // % of batted balls that are barrels
    barrelsAllowed: number; // Total barrels allowed

    // Hard hit metrics
    hardHitPercentAllowed: number; // % of balls hit 95+ mph
    avgHitDistanceAllowed: number; // Average distance allowed

    // Pitch arsenal
    fastballVelocity: number; // Average fastball velocity
    maxFastballVelocity: number; // Max fastball velocity
    spinRate?: number; // Average spin rate (rpm)

    // Extension and release
    extensionFeet?: number; // Release point extension
    releaseHeight?: number; // Release point height
  };

  // Sample size
  battedBallEventsAllowed: number;
  pitchesThrown: number;

  // Data quality
  lastUpdated: string;
  dataSource: string;
}

/**
 * League-wide Statcast leaderboard entry
 */
export interface StatcastLeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  team: string;
  position?: string;

  // The metric being ranked
  metric: string; // e.g., "xBA", "barrelRate", "avgExitVelocity"
  value: number; // The metric value

  // Context
  season: number;
  qualifiedPA?: number; // If batting leaderboard
  qualifiedIP?: number; // If pitching leaderboard
}

/**
 * Barrel definition and classification
 * A barrel is defined as a batted ball with optimal exit velocity and launch angle
 */
export interface BarrelDefinition {
  minExitVelocity: number; // Minimum exit velocity (98 mph)
  optimalLaunchAngle: {
    min: number; // 26 degrees
    max: number; // 30 degrees
  };

  // Barrel rate is the percentage of batted ball events that are barrels
  // Barrels have a .500 batting average and 1.500 slugging percentage on average
}

/**
 * Sweet spot definition
 * Sweet spot is launch angle between 8-32 degrees
 */
export interface SweetSpotDefinition {
  launchAngle: {
    min: number; // 8 degrees
    max: number; // 32 degrees
  };

  // Balls hit in the sweet spot have significantly higher batting averages
}

/**
 * Hard hit definition
 * Hard hit is exit velocity of 95+ mph
 */
export interface HardHitDefinition {
  minExitVelocity: number; // 95 mph

  // Hard hit balls have much higher success rates
}

/**
 * API request parameters for Statcast data
 */
export interface StatcastQueryParams {
  // Player identification
  playerId?: number;
  playerName?: string;

  // Team
  team?: string;

  // Time range
  season?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  // Game filters
  gameType?: 'R' | 'P' | 'S' | 'E' | 'A' | 'W'; // Regular, Playoff, Spring, Exhibition, All-Star, World Series

  // Metric filters
  minExitVelocity?: number;
  maxExitVelocity?: number;
  minLaunchAngle?: number;
  maxLaunchAngle?: number;

  // Result filters
  result?: string[]; // Filter by result type

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * API response wrapper for Statcast data
 */
export interface StatcastApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    dataSource: string;
    lastUpdated: string;
    season?: number;
    cached: boolean;
    cacheExpires?: string;
  };
  error?: string;
}

/**
 * Statcast constants and thresholds
 */
export const STATCAST_CONSTANTS = {
  BARREL: {
    MIN_EXIT_VELOCITY: 98, // mph
    OPTIMAL_LAUNCH_ANGLE_MIN: 26, // degrees
    OPTIMAL_LAUNCH_ANGLE_MAX: 30, // degrees
  },

  SWEET_SPOT: {
    MIN_LAUNCH_ANGLE: 8, // degrees
    MAX_LAUNCH_ANGLE: 32, // degrees
  },

  HARD_HIT: {
    MIN_EXIT_VELOCITY: 95, // mph
  },

  // Quality of contact thresholds
  QUALITY: {
    ELITE_EXIT_VELOCITY: 110, // mph
    GOOD_EXIT_VELOCITY: 95, // mph
    AVERAGE_EXIT_VELOCITY: 85, // mph
  },

  // Sprint speed classifications (ft/sec)
  SPRINT_SPEED: {
    ELITE: 30, // ft/sec
    PLUS: 28, // ft/sec
    AVERAGE: 27, // ft/sec
  },
} as const;

/**
 * Helper type for Statcast metric names
 */
export type StatcastMetric =
  | 'xBA'
  | 'xSLG'
  | 'xWOBA'
  | 'barrelRate'
  | 'avgExitVelocity'
  | 'maxExitVelocity'
  | 'avgLaunchAngle'
  | 'hardHitPercent'
  | 'sweetSpotPercent'
  | 'sprintSpeed';
