/**
 * Live Game Win Probability Simulation - Type Definitions
 */

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Cache
  CACHE: KVNamespace;

  // R2 for reference data (park factors, historical priors)
  R2_BUCKET?: R2Bucket;

  // Analytics Engine
  ANALYTICS?: AnalyticsEngineDataset;

  // Durable Object binding
  GAME_COORDINATOR: DurableObjectNamespace;

  // Secrets
  INGEST_SECRET?: string;
}

/**
 * Play Event (ingest)
 */
export interface PlayEvent {
  gameId: string;
  sport: 'baseball' | 'football' | 'basketball';
  timestamp: string;
  sequence: number;

  // Baseball specific
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  baseState?: number; // Binary: 1st=1, 2nd=2, 3rd=4, combined e.g., 1st+2nd=3
  balls?: number;
  strikes?: number;

  // Football specific
  quarter?: number;
  clock?: string;
  teamOnOffense?: string;
  down?: number;
  distance?: number;
  yardline?: number;

  // Basketball specific
  period?: number;
  timeRemaining?: number;

  // Universal
  homeScore: number;
  awayScore: number;
  eventType: string; // 'single', 'double', 'strikeout', 'pass_complete', etc.
  description?: string;

  // Actors
  batterId?: string;
  pitcherId?: string;

  // Metrics
  metadata?: {
    epa?: number;
    winProbShift?: number;
    leverageIndex?: number;
  };
}

/**
 * Game State (compact representation)
 */
export interface GameState {
  gameId: string;

  // Baseball
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  baseState?: number;
  balls?: number;
  strikes?: number;

  // Football
  quarter?: number;
  clockSeconds?: number;
  down?: number;
  distance?: number;
  yardline?: number;
  possession?: string;

  // Basketball
  period?: number;
  timeRemaining?: number;

  // Universal
  homeScore: number;
  awayScore: number;
  updatedAt: number;
}

/**
 * Simulation Output (stream to clients)
 */
export interface SimOutput {
  gameId: string;
  timestamp: string;

  // Win probabilities
  winProb: {
    home: number;
    away: number;
  };

  // Next play/possession outcome distribution
  nextPlay?: Record<string, number>;

  // Final score distribution (top 10 most likely)
  finalScoreDist?: Array<{
    homeScore: number;
    awayScore: number;
    probability: number;
  }>;

  // Player projections
  players?: Array<{
    id: string;
    name?: string;
    projections: Record<string, number>; // e.g., { "proj_hits": 1.2, "proj_rbi": 0.8 }
  }>;

  // Metadata
  numSims: number;
  stateHash: string;
  leverageIndex?: number;
}

/**
 * Baseball Player Priors
 */
export interface BaseballPlayerPriors {
  id: string;
  name: string;
  team: string;
  position: string;

  // Batting
  battingAvg?: number;
  obp?: number;
  slg?: number;
  xwoba?: number;
  iso?: number;
  kRate?: number;
  bbRate?: number;

  // Pitching
  era?: number;
  fip?: number;
  whip?: number;
  kPer9?: number;
  bbPer9?: number;
  stuffPlus?: number;

  // Platoon
  vsLhpWoba?: number;
  vsRhpWoba?: number;

  // Park factor
  parkFactor?: number;
}

/**
 * Baseball Outcome Probabilities
 * Context-dependent rates for Monte Carlo sim
 */
export interface BaseballOutcomes {
  // Hit types
  single: number;
  double: number;
  triple: number;
  homeRun: number;

  // Outs
  strikeout: number;
  groundOut: number;
  flyOut: number;
  lineOut: number;

  // Other
  walk: number;
  hitByPitch: number;
  error: number;

  // Baserunning (given hit type)
  stolenBaseSuccess?: number;
  caughtStealing?: number;
  advanceOnOut?: number;
}

/**
 * Football Outcome Probabilities
 * Based on down/distance/field position
 */
export interface FootballOutcomes {
  run: number;
  shortPass: number; // < 15 yards
  deepPass: number; // >= 15 yards
  sack: number;
  interception: number;
  fumble: number;
  punt: number;
  fieldGoal: number;
  touchdown: number;
}

/**
 * Baseball Simulation Context
 */
export interface BaseballSimContext {
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  baseState: number;
  homeScore: number;
  awayScore: number;

  // Current matchup
  batter?: BaseballPlayerPriors;
  pitcher?: BaseballPlayerPriors;

  // Team context
  homeTeam: string;
  awayTeam: string;
  parkFactor?: number;
}

/**
 * Simulation Config
 */
export interface SimConfig {
  numSims: number; // Adaptive: 500 low-leverage, 2000 high-leverage
  seed?: number; // For reproducibility
  adaptiveLeverage?: boolean; // Scale numSims by leverage
}
