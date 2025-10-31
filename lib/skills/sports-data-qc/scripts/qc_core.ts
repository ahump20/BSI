/**
 * Sports Data Quality Control - Core Module
 *
 * Production-ready QC functions for validating scraped sports data
 * from ESPN, NCAA, and other sources before ingestion into Cloudflare D1.
 *
 * Features:
 * - MAD-based outlier detection for continuous metrics
 * - Rule-based validation for discrete data
 * - Type-safe interfaces for all sports data structures
 * - Comprehensive error handling
 *
 * @module qc_core
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Metadata about the data source and scrape
 */
export interface SourceMetadata {
  source_url: string;
  scrape_timestamp: string; // ISO 8601 format in America/Chicago timezone
  confidence_score?: number; // 0-1 scale
  provider_name: 'ESPN_API' | 'NCAA_API' | 'SPORTSDATA_IO' | 'CUSTOM_SCRAPER';
}

/**
 * Player statistics from box scores
 */
export interface PlayerStats {
  player_id: string;
  player_name: string;
  team_id: string;

  // Batting stats
  at_bats?: number;
  hits?: number;
  runs?: number;
  rbi?: number;
  walks?: number;
  strikeouts?: number;
  batting_avg?: number;

  // Pitching stats
  innings_pitched?: number;
  earned_runs?: number;
  era?: number;
  pitches_thrown?: number;
  strikes?: number;
  balls?: number;

  // Pitch tracking data
  pitch_velocity?: number; // mph
  spin_rate?: number; // rpm
  release_point_x?: number; // feet
  release_point_y?: number; // feet
  release_point_z?: number; // feet
  horizontal_break?: number; // inches
  vertical_break?: number; // inches
  exit_velocity?: number; // mph (for batters)

  metadata: SourceMetadata;
}

/**
 * Game metadata and box score
 */
export interface GameData {
  game_id: string;
  timestamp: string; // ISO 8601
  season: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  final_score?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED';
  venue?: string;

  // Play-by-play aggregation
  total_hits?: number;
  total_runs?: number;
  total_errors?: number;

  metadata: SourceMetadata;
}

/**
 * Game simulator output
 */
export interface SimulationResults {
  simulation_id: string;
  game_id: string;
  timestamp: string;

  // Win probability distribution
  home_win_prob: number;
  away_win_prob: number;
  tie_prob?: number;

  // Score distribution (Monte Carlo)
  score_distribution: Array<{
    home_score: number;
    away_score: number;
    probability: number;
  }>;

  // Simulation parameters
  num_simulations: number;
  random_seed?: number;

  metadata: SourceMetadata;
}

/**
 * QC check result
 */
export interface QCCheckResult {
  check_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  affected_records?: number;
  details?: Record<string, any>;
}

/**
 * Outlier detection result
 */
export interface OutlierResult {
  metric_name: string;
  value: number;
  mad_score: number; // Number of MADs from median
  is_outlier: boolean;
  threshold: number; // MAD threshold used
  recommendation: 'ACCEPT' | 'FLAG' | 'REJECT';
}

/**
 * Complete QC report
 */
export interface QCReport {
  report_id: string;
  timestamp: string;
  data_source: string;

  // Summary statistics
  total_records: number;
  records_passed: number;
  records_flagged: number;
  records_rejected: number;

  // Individual checks
  checks: QCCheckResult[];

  // Outliers detected
  outliers: OutlierResult[];

  // Before/after metrics
  metrics_before: QCMetrics;
  metrics_after: QCMetrics;

  // Recommendations
  recommendations: string[];
}

/**
 * QC metrics for before/after comparison
 */
export interface QCMetrics {
  mean_batting_avg?: number;
  median_pitch_velocity?: number;
  median_exit_velocity?: number;
  total_games: number;
  games_with_complete_data: number;
  completeness_percentage: number;
}

// ============================================================================
// VALIDATION THRESHOLDS
// ============================================================================

export const VALIDATION_THRESHOLDS = {
  // Batting averages
  MIN_BATTING_AVG: 0.0,
  MAX_BATTING_AVG: 1.0,

  // Pitch velocity (mph)
  MIN_PITCH_VELOCITY: 40,
  MAX_PITCH_VELOCITY: 110,

  // Exit velocity (mph)
  MIN_EXIT_VELOCITY: 0,
  MAX_EXIT_VELOCITY: 120,

  // Spin rate (rpm)
  MIN_SPIN_RATE: 0,
  MAX_SPIN_RATE: 4000,

  // ERA
  MIN_ERA: 0,
  MAX_ERA: 99.99,

  // MAD outlier thresholds (number of MADs from median)
  MAD_THRESHOLD_PERMISSIVE: 5.0, // Flag but don't reject
  MAD_THRESHOLD_STRICT: 7.0, // Strong evidence of error

  // Temporal constraints
  MIN_SEASON_YEAR: 1900,
  MAX_SEASON_YEAR: new Date().getFullYear() + 1, // Allow next year's scheduling

  // Required fields for games
  REQUIRED_GAME_FIELDS: ['game_id', 'timestamp', 'home_team', 'away_team'] as const,

  // Probability constraints
  MIN_PROBABILITY: 0.0,
  MAX_PROBABILITY: 1.0,
  PROBABILITY_SUM_TOLERANCE: 0.001, // Allow 0.1% rounding error
} as const;

// ============================================================================
// MAD-BASED OUTLIER DETECTION
// ============================================================================

/**
 * Calculate the Median Absolute Deviation (MAD) for a dataset
 * MAD is a robust measure of variability that's resistant to outliers
 *
 * @param values - Array of numeric values
 * @returns MAD value
 */
export function calculateMAD(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate MAD for empty array');
  }

  // Calculate median
  const median = calculateMedian(values);

  // Calculate absolute deviations from median
  const absoluteDeviations = values.map(v => Math.abs(v - median));

  // MAD is the median of absolute deviations
  const mad = calculateMedian(absoluteDeviations);

  return mad;
}

/**
 * Calculate median of an array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate median for empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Detect outliers using MAD-based approach
 *
 * @param values - Array of numeric values to check
 * @param metricName - Name of the metric being checked
 * @param threshold - Number of MADs from median to consider outlier (default: 5.0)
 * @returns Array of outlier results
 */
export function detectOutliersMAD(
  values: number[],
  metricName: string,
  threshold: number = VALIDATION_THRESHOLDS.MAD_THRESHOLD_PERMISSIVE
): OutlierResult[] {
  if (values.length === 0) {
    return [];
  }

  const median = calculateMedian(values);
  const mad = calculateMAD(values);

  // Handle case where MAD is 0 (all values identical)
  if (mad === 0) {
    return values.map(v => ({
      metric_name: metricName,
      value: v,
      mad_score: 0,
      is_outlier: false,
      threshold,
      recommendation: 'ACCEPT'
    }));
  }

  // Calculate MAD score for each value
  const results: OutlierResult[] = values.map(value => {
    const madScore = Math.abs(value - median) / mad;
    const isOutlier = madScore > threshold;

    // Determine recommendation based on severity
    let recommendation: 'ACCEPT' | 'FLAG' | 'REJECT';
    if (madScore <= VALIDATION_THRESHOLDS.MAD_THRESHOLD_PERMISSIVE) {
      recommendation = 'ACCEPT';
    } else if (madScore <= VALIDATION_THRESHOLDS.MAD_THRESHOLD_STRICT) {
      recommendation = 'FLAG'; // Flag for human review
    } else {
      recommendation = 'REJECT'; // Very likely an error
    }

    return {
      metric_name: metricName,
      value,
      mad_score: madScore,
      is_outlier: isOutlier,
      threshold,
      recommendation
    };
  });

  return results;
}

// ============================================================================
// RANGE VALIDATION
// ============================================================================

/**
 * Validate that a value falls within an acceptable range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): QCCheckResult {
  if (value < min || value > max) {
    return {
      check_name: `range_validation_${fieldName}`,
      status: 'FAIL',
      message: `${fieldName} value ${value} outside acceptable range [${min}, ${max}]`,
      affected_records: 1
    };
  }

  return {
    check_name: `range_validation_${fieldName}`,
    status: 'PASS',
    message: `${fieldName} value ${value} within range [${min}, ${max}]`
  };
}

/**
 * Validate batting average
 */
export function validateBattingAverage(battingAvg: number): QCCheckResult {
  return validateRange(
    battingAvg,
    VALIDATION_THRESHOLDS.MIN_BATTING_AVG,
    VALIDATION_THRESHOLDS.MAX_BATTING_AVG,
    'batting_average'
  );
}

/**
 * Validate pitch velocity
 */
export function validatePitchVelocity(velocity: number): QCCheckResult {
  return validateRange(
    velocity,
    VALIDATION_THRESHOLDS.MIN_PITCH_VELOCITY,
    VALIDATION_THRESHOLDS.MAX_PITCH_VELOCITY,
    'pitch_velocity'
  );
}

/**
 * Validate exit velocity
 */
export function validateExitVelocity(velocity: number): QCCheckResult {
  return validateRange(
    velocity,
    VALIDATION_THRESHOLDS.MIN_EXIT_VELOCITY,
    VALIDATION_THRESHOLDS.MAX_EXIT_VELOCITY,
    'exit_velocity'
  );
}

/**
 * Validate ERA
 */
export function validateERA(era: number): QCCheckResult {
  return validateRange(
    era,
    VALIDATION_THRESHOLDS.MIN_ERA,
    VALIDATION_THRESHOLDS.MAX_ERA,
    'era'
  );
}

// ============================================================================
// COMPLETENESS VALIDATION
// ============================================================================

/**
 * Check if all required fields are present and non-null
 */
export function validateCompleteness<T extends Record<string, any>>(
  data: T,
  requiredFields: readonly string[]
): QCCheckResult {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      check_name: 'completeness_check',
      status: 'FAIL',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      affected_records: 1,
      details: { missing_fields: missingFields }
    };
  }

  return {
    check_name: 'completeness_check',
    status: 'PASS',
    message: 'All required fields present'
  };
}

/**
 * Validate game data completeness
 */
export function validateGameCompleteness(game: GameData): QCCheckResult {
  return validateCompleteness(game, VALIDATION_THRESHOLDS.REQUIRED_GAME_FIELDS);
}

// ============================================================================
// CONSISTENCY VALIDATION
// ============================================================================

/**
 * Validate that box score totals match play-by-play aggregation
 */
export function validateBoxScoreConsistency(
  boxScoreTotal: number,
  playByPlayTotal: number,
  metricName: string,
  tolerance: number = 0
): QCCheckResult {
  const difference = Math.abs(boxScoreTotal - playByPlayTotal);

  if (difference > tolerance) {
    return {
      check_name: `consistency_${metricName}`,
      status: 'FAIL',
      message: `Box score total (${boxScoreTotal}) doesn't match play-by-play total (${playByPlayTotal}) for ${metricName}`,
      details: {
        box_score: boxScoreTotal,
        play_by_play: playByPlayTotal,
        difference
      }
    };
  }

  return {
    check_name: `consistency_${metricName}`,
    status: 'PASS',
    message: `Box score and play-by-play totals match for ${metricName}`
  };
}

/**
 * Validate that win probabilities sum to approximately 1.0
 */
export function validateProbabilitySum(simulation: SimulationResults): QCCheckResult {
  const sum = simulation.home_win_prob + simulation.away_win_prob + (simulation.tie_prob || 0);
  const difference = Math.abs(sum - 1.0);

  if (difference > VALIDATION_THRESHOLDS.PROBABILITY_SUM_TOLERANCE) {
    return {
      check_name: 'probability_sum',
      status: 'FAIL',
      message: `Win probabilities sum to ${sum.toFixed(4)}, expected 1.0`,
      details: {
        home_win_prob: simulation.home_win_prob,
        away_win_prob: simulation.away_win_prob,
        tie_prob: simulation.tie_prob,
        sum,
        difference
      }
    };
  }

  return {
    check_name: 'probability_sum',
    status: 'PASS',
    message: `Win probabilities sum to ${sum.toFixed(4)} (within tolerance)`
  };
}

/**
 * Validate that all probabilities in score distribution are valid
 */
export function validateScoreDistribution(simulation: SimulationResults): QCCheckResult {
  const invalidProbs = simulation.score_distribution.filter(
    outcome => outcome.probability < VALIDATION_THRESHOLDS.MIN_PROBABILITY ||
               outcome.probability > VALIDATION_THRESHOLDS.MAX_PROBABILITY
  );

  if (invalidProbs.length > 0) {
    return {
      check_name: 'score_distribution_probabilities',
      status: 'FAIL',
      message: `${invalidProbs.length} outcomes have invalid probabilities`,
      affected_records: invalidProbs.length,
      details: { invalid_outcomes: invalidProbs }
    };
  }

  // Check if probabilities sum to approximately 1.0
  const totalProb = simulation.score_distribution.reduce((sum, outcome) => sum + outcome.probability, 0);
  const difference = Math.abs(totalProb - 1.0);

  if (difference > VALIDATION_THRESHOLDS.PROBABILITY_SUM_TOLERANCE) {
    return {
      check_name: 'score_distribution_probabilities',
      status: 'WARNING',
      message: `Score distribution probabilities sum to ${totalProb.toFixed(4)}, expected 1.0`,
      details: { total_probability: totalProb, difference }
    };
  }

  return {
    check_name: 'score_distribution_probabilities',
    status: 'PASS',
    message: 'All score distribution probabilities are valid'
  };
}

// ============================================================================
// TEMPORAL VALIDATION
// ============================================================================

/**
 * Validate timestamp format and ensure it's not in the future
 */
export function validateTimestamp(timestamp: string, allowFuture: boolean = false): QCCheckResult {
  // Check if valid ISO 8601 format
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return {
      check_name: 'timestamp_format',
      status: 'FAIL',
      message: `Invalid timestamp format: ${timestamp}`
    };
  }

  // Check if in the future
  if (!allowFuture && date > new Date()) {
    return {
      check_name: 'timestamp_future',
      status: 'FAIL',
      message: `Timestamp ${timestamp} is in the future`,
      details: { timestamp, current_time: new Date().toISOString() }
    };
  }

  return {
    check_name: 'timestamp_validation',
    status: 'PASS',
    message: 'Timestamp is valid'
  };
}

/**
 * Validate that season year is reasonable
 */
export function validateSeasonYear(season: number): QCCheckResult {
  return validateRange(
    season,
    VALIDATION_THRESHOLDS.MIN_SEASON_YEAR,
    VALIDATION_THRESHOLDS.MAX_SEASON_YEAR,
    'season_year'
  );
}

/**
 * Validate that game timestamp aligns with season
 */
export function validateSeasonAlignment(game: GameData): QCCheckResult {
  const gameDate = new Date(game.timestamp);
  const gameYear = gameDate.getFullYear();
  const gameMonth = gameDate.getMonth() + 1; // 0-indexed

  // College baseball season typically runs Feb-June
  // Allow scheduling data from previous fall (Oct-Dec) for next season
  let expectedSeason: number;
  if (gameMonth >= 10) {
    // Fall scheduling for next year's season
    expectedSeason = gameYear + 1;
  } else if (gameMonth >= 2 && gameMonth <= 6) {
    // Spring season
    expectedSeason = gameYear;
  } else {
    // Off-season games (summer leagues, fall ball)
    expectedSeason = gameYear;
  }

  if (game.season !== expectedSeason && game.season !== gameYear) {
    return {
      check_name: 'season_alignment',
      status: 'WARNING',
      message: `Game season ${game.season} may not align with game date ${game.timestamp}`,
      details: {
        game_season: game.season,
        game_year: gameYear,
        game_month: gameMonth,
        expected_season: expectedSeason
      }
    };
  }

  return {
    check_name: 'season_alignment',
    status: 'PASS',
    message: 'Game season aligns with game date'
  };
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Run all validation checks on player stats
 */
export function validatePlayerStats(stats: PlayerStats): QCCheckResult[] {
  const results: QCCheckResult[] = [];

  // Range validations
  if (stats.batting_avg !== undefined) {
    results.push(validateBattingAverage(stats.batting_avg));
  }

  if (stats.pitch_velocity !== undefined) {
    results.push(validatePitchVelocity(stats.pitch_velocity));
  }

  if (stats.exit_velocity !== undefined) {
    results.push(validateExitVelocity(stats.exit_velocity));
  }

  if (stats.era !== undefined) {
    results.push(validateERA(stats.era));
  }

  // Validate metadata timestamp
  results.push(validateTimestamp(stats.metadata.scrape_timestamp));

  return results;
}

/**
 * Run all validation checks on game data
 */
export function validateGameData(game: GameData): QCCheckResult[] {
  const results: QCCheckResult[] = [];

  // Completeness check
  results.push(validateGameCompleteness(game));

  // Temporal validations
  results.push(validateTimestamp(game.timestamp, true)); // Allow future for scheduled games
  results.push(validateSeasonYear(game.season));
  results.push(validateSeasonAlignment(game));

  // Validate metadata timestamp
  results.push(validateTimestamp(game.metadata.scrape_timestamp));

  // Score validation (if game is final)
  if (game.status === 'FINAL') {
    if (game.home_score < 0 || game.away_score < 0) {
      results.push({
        check_name: 'final_score_validation',
        status: 'FAIL',
        message: 'Final game has negative score'
      });
    }
  }

  return results;
}

/**
 * Run all validation checks on simulation results
 */
export function validateSimulationResults(simulation: SimulationResults): QCCheckResult[] {
  const results: QCCheckResult[] = [];

  // Probability validations
  results.push(validateProbabilitySum(simulation));
  results.push(validateScoreDistribution(simulation));

  // Temporal validation
  results.push(validateTimestamp(simulation.timestamp));
  results.push(validateTimestamp(simulation.metadata.scrape_timestamp));

  // Validate number of simulations
  if (simulation.num_simulations <= 0) {
    results.push({
      check_name: 'num_simulations',
      status: 'FAIL',
      message: `Invalid number of simulations: ${simulation.num_simulations}`
    });
  }

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate QC metrics for a dataset
 */
export function calculateQCMetrics(
  games: GameData[],
  playerStats: PlayerStats[]
): QCMetrics {
  // Calculate batting average metrics
  const battingAvgs = playerStats
    .map(p => p.batting_avg)
    .filter((ba): ba is number => ba !== undefined);

  const meanBattingAvg = battingAvgs.length > 0
    ? battingAvgs.reduce((sum, ba) => sum + ba, 0) / battingAvgs.length
    : undefined;

  // Calculate pitch velocity metrics
  const pitchVelocities = playerStats
    .map(p => p.pitch_velocity)
    .filter((v): v is number => v !== undefined);

  const medianPitchVelocity = pitchVelocities.length > 0
    ? calculateMedian(pitchVelocities)
    : undefined;

  // Calculate exit velocity metrics
  const exitVelocities = playerStats
    .map(p => p.exit_velocity)
    .filter((v): v is number => v !== undefined);

  const medianExitVelocity = exitVelocities.length > 0
    ? calculateMedian(exitVelocities)
    : undefined;

  // Count games with complete required fields
  const gamesWithCompleteData = games.filter(game => {
    const result = validateGameCompleteness(game);
    return result.status === 'PASS';
  }).length;

  const completenessPercentage = games.length > 0
    ? (gamesWithCompleteData / games.length) * 100
    : 0;

  return {
    mean_batting_avg: meanBattingAvg,
    median_pitch_velocity: medianPitchVelocity,
    median_exit_velocity: medianExitVelocity,
    total_games: games.length,
    games_with_complete_data: gamesWithCompleteData,
    completeness_percentage: completenessPercentage
  };
}

/**
 * Generate a unique report ID
 */
export function generateReportId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `qc-${timestamp}-${random}`;
}
