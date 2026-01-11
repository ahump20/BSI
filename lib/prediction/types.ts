/**
 * BSI Predictive Modeling Engine - Type Definitions
 *
 * Hybrid Monte Carlo + ML prediction engine with stateful psychological modeling.
 * Covers CFB, CBB, NFL, NBA, MLB with SHAP-based explainability.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

// ============================================================================
// Core Enums & Constants
// ============================================================================

export type SupportedSport = 'cfb' | 'cbb' | 'nfl' | 'nba' | 'mlb';

export type GameLocation = 'home' | 'away' | 'neutral';

export type GameResult = 'W' | 'L' | 'T';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type PsychStateTier = 'generational' | 'elite' | 'ascendant' | 'developing';

// Sport-specific exponents for Pythagorean expectation
export const PYTHAGOREAN_EXPONENTS: Record<SupportedSport, number> = {
  cfb: 2.37,
  cbb: 11.5,
  nfl: 2.37,
  nba: 13.91,
  mlb: 1.83,
};

// Home field advantage multipliers
export const HOME_ADVANTAGE: Record<SupportedSport, number> = {
  cfb: 0.08,
  cbb: 0.06,
  nfl: 0.06,
  nba: 0.06,
  mlb: 0.04,
};

// Psychology model parameters
export const PSYCHOLOGY_PARAMS = {
  alpha: 0.75, // Persistence factor (how much previous state carries forward)
  beta: 0.2, // Outcome sensitivity (how much new results affect state)
  epsilon: 0.03, // Random noise amplitude
  minValue: 0.0,
  maxValue: 1.0,
  defaultValue: 0.5,
} as const;

// ============================================================================
// Team & Player State Interfaces
// ============================================================================

/**
 * Core psychological state variables for a team.
 * All values are normalized 0.0 to 1.0.
 */
export interface PsychologicalState {
  confidence: number;
  focus: number;
  cohesion: number;
  leadershipInfluence: number;
}

/**
 * Extended team state including performance metrics.
 */
export interface TeamState extends PsychologicalState {
  teamId: string;
  teamName: string;
  sport: SupportedSport;
  season: number;
  gameNumber: number;

  // Performance metrics
  rating: number; // Elo or power rating
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  pythagoreanExpectation: number;

  // Recent form
  recentForm: GameResult[]; // Last 5 games
  streakType: 'W' | 'L' | null;
  streakLength: number;

  // Context
  injuryImpact: number; // 0-1, 1 = fully healthy
  fatigueIndex: number; // 0-1, 1 = fully rested
  strengthOfSchedule: number; // 0-1

  // Derived scores (from Diamond Certainty Engine)
  momentumScore?: number;
  adversityResponse?: number;
  clutchFactor?: number;

  // Metadata
  updatedAt: string;
  modelVersion: string;
}

/**
 * Player-level psychological state with biometric integration.
 */
export interface PlayerPsychState {
  playerId: string;
  teamId: string;
  sport: SupportedSport;
  season: number;
  weekNumber: number;

  // Core state
  confidence: number;
  focus: number;
  motivation: number;

  // Biometric inputs (from WHOOP)
  hrvBaselineDeviation?: number;
  recoveryScore?: number;
  sleepPerformance?: number;
  strainLevel?: number;

  // Performance context
  recentPerformanceTrend: number; // Rolling 5-game z-score
  roleChange: -1 | 0 | 1; // -1 = demoted, 0 = same, 1 = promoted

  updatedAt: string;
}

// ============================================================================
// Game & Schedule Interfaces
// ============================================================================

/**
 * Scheduled game for simulation.
 */
export interface ScheduledGame {
  gameId: string;
  date: string; // ISO 8601
  homeTeamId: string;
  awayTeamId: string;
  location: GameLocation;
  venueId?: string;
  completed: boolean;
  homeScore?: number;
  awayScore?: number;
  result?: GameResult; // From home team perspective
}

/**
 * Game context for predictions.
 */
export interface GameContext {
  gameId: string;
  sport: SupportedSport;
  season: number;
  week: number;
  date: string;
  location: GameLocation;
  isRivalry: boolean;
  isPlayoff: boolean;
  isConference: boolean;
  weatherConditions?: WeatherConditions;
  travelDistance?: number; // miles
  restDays: { home: number; away: number };
}

export interface WeatherConditions {
  temperature?: number; // Fahrenheit
  precipitation?: number; // inches
  windSpeed?: number; // mph
  dome: boolean;
}

// ============================================================================
// Prediction Interfaces
// ============================================================================

/**
 * Configuration for the prediction engine.
 */
export interface PredictionEngineConfig {
  simulationCount: number; // Default 10,000
  psychologyWeight: number; // 0.15 - 15% of prediction
  mlWeight: number; // 0.50 - 50% ML model
  monteCarloWeight: number; // 0.35 - 35% MC simulation
  sport: SupportedSport;
  modelVersion: string;
}

/**
 * Features used by the ML prediction model.
 */
export interface MLFeatures {
  // Team strength metrics
  homeRating: number;
  awayRating: number;
  ratingDiff: number;
  homePythagorean: number;
  awayPythagorean: number;

  // Recent form
  homeRecentWinPct: number;
  awayRecentWinPct: number;
  homeMomentum: number; // Positive = winning streak
  awayMomentum: number;

  // Contextual factors
  homeFieldAdvantage: number;
  restDaysDiff: number;
  travelDistance: number;
  rivalryMultiplier: number;
  playoffMultiplier: number;

  // Psychological state
  homeConfidence: number;
  awayConfidence: number;
  confidenceDiff: number;
  homeCohesion: number;
  awayCohesion: number;
  homeLeadership: number;
  awayLeadership: number;

  // Diamond Certainty dimensions (aggregated)
  homeClutchGene: number;
  awayClutchGene: number;
  homeMentalFortress: number;
  awayMentalFortress: number;

  // Sport-specific features
  sportSpecific: Record<string, number>;
}

/**
 * SHAP value for a single feature.
 */
export interface ShapValue {
  feature: string;
  displayName: string;
  value: number; // Original feature value
  shapValue: number; // Contribution to prediction
  direction: 'positive' | 'negative';
  importance: number; // Absolute contribution
}

/**
 * Human-readable explanation of a prediction.
 */
export interface PredictionExplanation {
  topFactors: ShapValue[]; // Top 5 contributors
  shapSummary: ShapValue[]; // All factors
  humanSummary: string; // Natural language explanation
  confidence: ConfidenceLevel;
  uncertaintyDrivers: string[];
  requiresSubscription: boolean; // True for detailed SHAP
}

/**
 * Complete prediction for a single game.
 */
export interface GamePrediction {
  gameId: string;
  sport: SupportedSport;
  timestamp: string;

  // Teams
  homeTeam: {
    teamId: string;
    name: string;
    state: PsychologicalState;
    diamondScores?: TeamDiamondScores;
  };
  awayTeam: {
    teamId: string;
    name: string;
    state: PsychologicalState;
    diamondScores?: TeamDiamondScores;
  };

  // Probabilities
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability?: number; // For sports with ties

  // Confidence bounds (90% interval)
  confidenceInterval: {
    lower: number;
    upper: number;
  };

  // Spread predictions
  predictedSpread: number; // Positive = home favored
  predictedTotal: number;
  spreadConfidence: number;

  // Explainability
  explanation: PredictionExplanation;

  // Metadata
  modelVersion: string;
  simulationCount: number;
  computeTimeMs: number;
}

/**
 * Season projection for a team.
 */
export interface SeasonProjection {
  teamId: string;
  teamName: string;
  sport: SupportedSport;
  season: number;
  timestamp: string;

  // Win totals
  projectedWins: number;
  projectedLosses: number;
  winDistribution: number[]; // Probability for each win total

  // Outcome probabilities
  playoffProbability: number;
  divisionWinProbability: number;
  conferenceWinProbability: number;
  championshipProbability: number;

  // Confidence intervals
  confidenceInterval: {
    lower: number; // 5th percentile wins
    median: number;
    upper: number; // 95th percentile wins
  };

  // Remaining schedule impact
  remainingGames: number;
  strengthOfRemainingSchedule: number;

  // Metadata
  simulationCount: number;
  modelVersion: string;
}

/**
 * Multi-season projection with roster evolution.
 */
export interface MultiSeasonProjection {
  teamId: string;
  teamName: string;
  sport: SupportedSport;
  startSeason: number;
  endSeason: number;

  // Per-season projections
  seasonProjections: SeasonProjection[];

  // Aggregate forecasts
  averageWinsPerSeason: number;
  playoffAppearances: number; // Expected count
  championshipProbability: number; // At least one

  // Key transitions
  rosterTurnoverImpact: number[]; // Per-season
  coachingChangeRisk: number[];

  // Metadata
  simulationCount: number;
  modelVersion: string;
  timestamp: string;
}

// ============================================================================
// Simulation Interfaces
// ============================================================================

/**
 * State of a team during simulation.
 */
export interface TeamSimState {
  teamId: string;
  teamName: string;
  sport: SupportedSport;

  // Base metrics
  rating: number;
  pythagorean: number;

  // Current psychological state (evolves during sim)
  psych: PsychologicalState;

  // Running totals
  wins: number;
  losses: number;
  ties: number;

  // Context
  isHome: boolean;
  fatigueIndex: number;
  injuryImpact: number;
}

/**
 * Result of simulating a single game.
 */
export interface SimulatedGameResult {
  gameId: string;
  winnerId: string;
  loserId: string;
  homeScore: number;
  awayScore: number;
  margin: number;
  wasUpset: boolean;
  expectationGap: number; // Actual margin minus expected
}

/**
 * Aggregated results from N simulations.
 */
export interface AggregatedSimulation {
  gameId: string;
  simulationCount: number;

  // Win probabilities
  homeWins: number;
  awayWins: number;
  draws: number;
  homeWinProbability: number;
  awayWinProbability: number;

  // Score distributions
  avgHomeScore: number;
  avgAwayScore: number;
  avgSpread: number;
  avgTotal: number;

  // Spread analysis
  spreadStdDev: number;
  homeCoversSpread: number; // % of sims

  // Confidence
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

/**
 * Full season simulation result.
 */
export interface SeasonSimulation {
  teamId: string;
  season: number;
  simulationRuns: number;

  // Final records
  winsPerSim: number[];
  avgWins: number;
  avgLosses: number;

  // Outcome tracking
  madePlayoffs: number;
  wonDivision: number;
  wonConference: number;
  wonChampionship: number;

  // State evolution
  confidenceTrajectory: number[]; // Per-game confidence
  momentumPeaks: number; // Count of momentum swings
}

// ============================================================================
// State Update Interfaces
// ============================================================================

/**
 * Parameters for psychological state updates.
 */
export interface StateUpdateParams {
  alpha: number; // Persistence (0.7-0.85)
  beta: number; // Outcome sensitivity (0.1-0.3)
  epsilon: number; // Random noise (0.01-0.05)
}

/**
 * Game outcome for state update.
 */
export interface GameOutcome {
  result: GameResult;
  margin: number;
  wasUpset: boolean;
  expectationGap: number;
  performanceRating: number; // 0-1, how well team played
  opponentStrength: number; // 0-1
  isPlayoff: boolean;
  isRivalry: boolean;
}

/**
 * Off-season transition data.
 */
export interface OffseasonTransition {
  teamId: string;
  sport: SupportedSport;
  fromSeason: number;
  toSeason: number;

  // Roster changes
  playersLost: number;
  playersGained: number;
  rosterTurnoverPct: number;
  keyDeparturesImpact: number; // 0-1

  // Coaching
  coachingChange: boolean;
  coordinatorChanges: number;

  // Recruiting
  recruitingRankPctile: number; // 0-100
  transferPortalNetGain: number; // +/-

  // Reset factors
  confidenceCarryover: number; // 0-1, how much to retain
  cohesionReset: number; // New cohesion starting point
}

// ============================================================================
// Calibration & Validation Interfaces
// ============================================================================

/**
 * Calibration bucket for reliability analysis.
 */
export interface CalibrationBucket {
  probabilityRange: [number, number]; // e.g., [0.5, 0.6]
  predictedCount: number;
  actualWinRate: number;
  calibrationError: number; // |predicted - actual|
}

/**
 * Complete calibration result.
 */
export interface CalibrationResult {
  sport: SupportedSport;
  modelVersion: string;
  evaluationDate: string;

  // Overall metrics
  totalPredictions: number;
  brierScore: number; // Target: ~0.075
  logLoss: number;
  accuracyAt50: number; // % correct when prob > 50%

  // Calibration curve
  calibrationBuckets: CalibrationBucket[];

  // Benchmark comparisons
  vsBetaImprovement: number; // % improvement over baseline
  vsVegasCorrelation: number;
  vsEloImprovement: number;

  // Confidence
  sampleSizeAdequate: boolean;
  reliabilityIndex: number;
}

/**
 * Historical backtest result.
 */
export interface BacktestResult {
  sport: SupportedSport;
  startDate: string;
  endDate: string;
  gamesEvaluated: number;

  // Performance
  brierScore: number;
  logLoss: number;
  accuracy: number;
  calibration: CalibrationResult;

  // Notable predictions
  bestPredictions: Array<{
    gameId: string;
    predicted: number;
    actual: GameResult;
    confidence: number;
  }>;
  worstPredictions: Array<{
    gameId: string;
    predicted: number;
    actual: GameResult;
    confidence: number;
  }>;

  // Model insights
  psychologyImpact: number; // Lift from psychology features
  sportSpecificInsights: Record<string, string>;
}

// ============================================================================
// API Interfaces
// ============================================================================

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    processingTimeMs: number;
    modelVersion: string;
    tier: SubscriptionTier;
  };
}

/**
 * Batch prediction request.
 */
export interface BatchPredictionRequest {
  gameIds: string[];
  includeExplanations?: boolean; // Pro/Enterprise only
}

/**
 * Prediction forecast stored in D1.
 */
export interface StoredForecast {
  id: number;
  gameId: string;
  sport: SupportedSport;
  forecastTimestamp: string;
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  homeWinLower: number;
  homeWinUpper: number;
  predictedSpread: number;
  predictedTotal: number;
  spreadConfidence: number;
  modelVersion: string;
  simulationCount: number;
  computeTimeMs: number | null;
  topFactorsJson: string;
  shapSummaryJson: string;
  humanSummary: string;
  actualResult: GameResult | null;
  brierScore: number | null;
  calibrationBucket: number | null;
  updatedAt: string;
}

// ============================================================================
// Diamond Certainty Integration Types
// ============================================================================

/**
 * Champion dimension keys from Diamond Certainty Engine.
 */
export type ChampionDimensionKey =
  | 'clutchGene'
  | 'killerInstinct'
  | 'flowState'
  | 'mentalFortress'
  | 'predatorMindset'
  | 'championAura'
  | 'winnerDNA'
  | 'beastMode';

/**
 * Aggregated Diamond Certainty scores for team.
 */
export interface TeamDiamondScores {
  teamId: string;
  overallScore: number;
  dimensions: Record<ChampionDimensionKey, number>;
  confidence: number;
  timestamp: string;
}

// ============================================================================
// Cloudflare Environment Bindings
// ============================================================================

/**
 * Cloudflare Worker environment bindings.
 * Note: D1Database, KVNamespace, R2Bucket, ExecutionContext are provided
 * by @cloudflare/workers-types and should NOT be redeclared here.
 */
export interface CloudflareEnv {
  // D1 Database
  BSI_HISTORICAL_DB: D1Database;

  // KV Namespaces
  BSI_PREDICTION_CACHE: KVNamespace;
  BSI_SPORTS_CACHE: KVNamespace;

  // R2 Buckets
  BSI_MODEL_STORAGE: R2Bucket;

  // Environment variables
  ENVIRONMENT: string;
  MODEL_VERSION: string;
  SIMULATION_COUNT: string;

  // API Keys
  SPORTSDATAIO_KEY?: string;
  ODDS_API_KEY?: string;
}
