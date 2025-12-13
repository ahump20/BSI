/**
 * BSI Predictive Modeling Engine - State Tracker
 *
 * Handles persistence of psychological state to D1 database and KV cache.
 * Provides fast reads via KV with D1 as source of truth.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  CloudflareEnv,
  PsychologicalState,
  TeamState,
  PlayerPsychState,
  SupportedSport,
  StoredForecast,
  GamePrediction,
  CalibrationResult,
} from './types';

// Cache TTLs (seconds)
const CACHE_TTL = {
  teamState: 300, // 5 minutes
  playerState: 600, // 10 minutes
  prediction: 3600, // 1 hour
  calibration: 86400, // 24 hours
};

// Cache key prefixes
const CACHE_PREFIX = {
  teamState: 'psych:team:',
  playerState: 'psych:player:',
  prediction: 'pred:',
  calibration: 'cal:',
};

/**
 * StateTracker - Manages persistence of prediction engine state.
 */
export class StateTracker {
  private readonly db: D1Database;
  private readonly cache: KVNamespace;

  constructor(env: CloudflareEnv) {
    this.db = env.DB;
    this.cache = env.PREDICTION_CACHE;
  }

  // ============================================================================
  // Team Psychological State
  // ============================================================================

  /**
   * Get the latest psychological state for a team.
   * Checks cache first, falls back to D1.
   */
  async getTeamState(
    teamId: string,
    sport: SupportedSport,
    season: number
  ): Promise<TeamState | null> {
    const cacheKey = `${CACHE_PREFIX.teamState}${teamId}:${sport}:${season}`;

    // Check cache first
    const cachedStr = await this.cache.get(cacheKey);
    if (cachedStr) {
      return JSON.parse(cachedStr) as TeamState;
    }

    // Query D1 for latest state
    const result = await this.db
      .prepare(
        `
        SELECT * FROM team_psychological_state
        WHERE team_id = ? AND sport = ? AND season = ?
        ORDER BY game_number DESC
        LIMIT 1
      `
      )
      .bind(teamId, sport, season)
      .first<TeamPsychRow>();

    if (!result) {
      return null;
    }

    const state = this.rowToTeamState(result);

    // Cache the result
    await this.cache.put(cacheKey, JSON.stringify(state), {
      expirationTtl: CACHE_TTL.teamState,
    });

    return state;
  }

  /**
   * Get psychological states for multiple teams.
   */
  async getTeamStates(
    teamIds: string[],
    sport: SupportedSport,
    season: number
  ): Promise<Map<string, TeamState>> {
    const results = new Map<string, TeamState>();

    // Parallel fetch from cache
    const cachePromises = teamIds.map(async (teamId) => {
      const state = await this.getTeamState(teamId, sport, season);
      if (state) {
        results.set(teamId, state);
      }
    });

    await Promise.all(cachePromises);

    return results;
  }

  /**
   * Save team psychological state after a game.
   */
  async saveTeamState(state: TeamState): Promise<void> {
    const cacheKey = `${CACHE_PREFIX.teamState}${state.teamId}:${state.sport}:${state.season}`;

    // Insert or replace in D1
    await this.db
      .prepare(
        `
        INSERT OR REPLACE INTO team_psychological_state (
          team_id, sport, season, game_number,
          confidence, focus, cohesion, leadership_influence,
          momentum_score, adversity_response, clutch_factor,
          opponent_id, result, expectation_gap,
          win_probability_pre, win_probability_actual,
          updated_at, model_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        state.teamId,
        state.sport,
        state.season,
        state.gameNumber,
        state.confidence,
        state.focus,
        state.cohesion,
        state.leadershipInfluence,
        state.momentumScore ?? null,
        state.adversityResponse ?? null,
        state.clutchFactor ?? null,
        null, // opponent_id filled by caller if needed
        null, // result filled by caller if needed
        null, // expectation_gap filled by caller if needed
        null, // win_probability_pre
        null, // win_probability_actual
        new Date().toISOString(),
        state.modelVersion
      )
      .run();

    // Update cache
    await this.cache.put(cacheKey, JSON.stringify(state), {
      expirationTtl: CACHE_TTL.teamState,
    });
  }

  /**
   * Update team state after game completion.
   */
  async updateTeamStateAfterGame(
    teamId: string,
    sport: SupportedSport,
    season: number,
    gameNumber: number,
    update: {
      confidence: number;
      focus: number;
      cohesion: number;
      leadershipInfluence: number;
      opponentId: string;
      result: 'W' | 'L' | 'T';
      expectationGap: number;
      winProbabilityPre: number;
    }
  ): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE team_psychological_state
        SET confidence = ?,
            focus = ?,
            cohesion = ?,
            leadership_influence = ?,
            opponent_id = ?,
            result = ?,
            expectation_gap = ?,
            win_probability_pre = ?,
            win_probability_actual = ?,
            updated_at = ?
        WHERE team_id = ? AND sport = ? AND season = ? AND game_number = ?
      `
      )
      .bind(
        update.confidence,
        update.focus,
        update.cohesion,
        update.leadershipInfluence,
        update.opponentId,
        update.result,
        update.expectationGap,
        update.winProbabilityPre,
        update.result === 'W' ? 1.0 : 0.0,
        new Date().toISOString(),
        teamId,
        sport,
        season,
        gameNumber
      )
      .run();

    // Invalidate cache
    const cacheKey = `${CACHE_PREFIX.teamState}${teamId}:${sport}:${season}`;
    await this.cache.delete(cacheKey);
  }

  /**
   * Initialize team state for new season.
   */
  async initializeTeamState(
    teamId: string,
    teamName: string,
    sport: SupportedSport,
    season: number,
    initialState?: Partial<PsychologicalState>
  ): Promise<TeamState> {
    const defaultState: TeamState = {
      teamId,
      teamName,
      sport,
      season,
      gameNumber: 0,
      confidence: initialState?.confidence ?? 0.5,
      focus: initialState?.focus ?? 0.5,
      cohesion: initialState?.cohesion ?? 0.5,
      leadershipInfluence: initialState?.leadershipInfluence ?? 0.5,
      rating: 1500,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pythagoreanExpectation: 0.5,
      recentForm: [],
      streakType: null,
      streakLength: 0,
      injuryImpact: 1.0,
      fatigueIndex: 1.0,
      strengthOfSchedule: 0.5,
      updatedAt: new Date().toISOString(),
      modelVersion: '1.0',
    };

    await this.saveTeamState(defaultState);
    return defaultState;
  }

  // ============================================================================
  // Player Psychological State
  // ============================================================================

  /**
   * Get player psychological state.
   */
  async getPlayerState(
    playerId: string,
    sport: SupportedSport,
    season: number,
    weekNumber: number
  ): Promise<PlayerPsychState | null> {
    const cacheKey = `${CACHE_PREFIX.playerState}${playerId}:${sport}:${season}:${weekNumber}`;

    // Check cache
    const cachedStr = await this.cache.get(cacheKey);
    if (cachedStr) {
      return JSON.parse(cachedStr) as PlayerPsychState;
    }

    // Query D1
    const result = await this.db
      .prepare(
        `
        SELECT * FROM player_psychological_state
        WHERE player_id = ? AND sport = ? AND season = ? AND week_number = ?
      `
      )
      .bind(playerId, sport, season, weekNumber)
      .first<PlayerPsychRow>();

    if (!result) {
      return null;
    }

    const state = this.rowToPlayerState(result);

    await this.cache.put(cacheKey, JSON.stringify(state), {
      expirationTtl: CACHE_TTL.playerState,
    });

    return state;
  }

  /**
   * Save player psychological state.
   */
  async savePlayerState(state: PlayerPsychState): Promise<void> {
    const cacheKey = `${CACHE_PREFIX.playerState}${state.playerId}:${state.sport}:${state.season}:${state.weekNumber}`;

    await this.db
      .prepare(
        `
        INSERT OR REPLACE INTO player_psychological_state (
          player_id, team_id, sport, season, week_number,
          confidence, focus, motivation,
          hrv_baseline_deviation, recovery_score, sleep_performance, strain_level,
          recent_performance_trend, role_change,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        state.playerId,
        state.teamId,
        state.sport,
        state.season,
        state.weekNumber,
        state.confidence,
        state.focus,
        state.motivation,
        state.hrvBaselineDeviation ?? null,
        state.recoveryScore ?? null,
        state.sleepPerformance ?? null,
        state.strainLevel ?? null,
        state.recentPerformanceTrend,
        state.roleChange,
        new Date().toISOString()
      )
      .run();

    await this.cache.put(cacheKey, JSON.stringify(state), {
      expirationTtl: CACHE_TTL.playerState,
    });
  }

  // ============================================================================
  // Predictions
  // ============================================================================

  /**
   * Save a prediction forecast.
   */
  async savePrediction(prediction: GamePrediction): Promise<void> {
    const cacheKey = `${CACHE_PREFIX.prediction}${prediction.gameId}`;

    await this.db
      .prepare(
        `
        INSERT INTO prediction_forecasts (
          game_id, sport, forecast_timestamp,
          home_win_probability, away_win_probability, draw_probability,
          home_win_lower, home_win_upper,
          predicted_spread, predicted_total, spread_confidence,
          model_version, simulation_count, compute_time_ms,
          top_factors_json, shap_summary_json, human_summary,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        prediction.gameId,
        prediction.sport,
        prediction.timestamp,
        prediction.homeWinProbability,
        prediction.awayWinProbability,
        prediction.drawProbability ?? 0,
        prediction.confidenceInterval.lower,
        prediction.confidenceInterval.upper,
        prediction.predictedSpread,
        prediction.predictedTotal,
        prediction.spreadConfidence,
        prediction.modelVersion,
        prediction.simulationCount,
        prediction.computeTimeMs,
        JSON.stringify(prediction.explanation.topFactors),
        JSON.stringify(prediction.explanation.shapSummary),
        prediction.explanation.humanSummary,
        new Date().toISOString()
      )
      .run();

    // Cache prediction
    await this.cache.put(cacheKey, JSON.stringify(prediction), {
      expirationTtl: CACHE_TTL.prediction,
    });
  }

  /**
   * Get latest prediction for a game.
   */
  async getPrediction(gameId: string): Promise<GamePrediction | null> {
    const cacheKey = `${CACHE_PREFIX.prediction}${gameId}`;

    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as GamePrediction;
    }

    const result = await this.db
      .prepare(
        `
        SELECT * FROM prediction_forecasts
        WHERE game_id = ?
        ORDER BY forecast_timestamp DESC
        LIMIT 1
      `
      )
      .bind(gameId)
      .first<StoredForecast>();

    if (!result) {
      return null;
    }

    // Convert to GamePrediction (simplified)
    const prediction: GamePrediction = {
      gameId: result.gameId,
      sport: result.sport as SupportedSport,
      timestamp: result.forecastTimestamp,
      homeTeam: { teamId: '', name: '', state: { confidence: 0.5, focus: 0.5, cohesion: 0.5, leadershipInfluence: 0.5 } },
      awayTeam: { teamId: '', name: '', state: { confidence: 0.5, focus: 0.5, cohesion: 0.5, leadershipInfluence: 0.5 } },
      homeWinProbability: result.homeWinProbability,
      awayWinProbability: result.awayWinProbability,
      drawProbability: result.drawProbability,
      confidenceInterval: {
        lower: result.homeWinLower,
        upper: result.homeWinUpper,
      },
      predictedSpread: result.predictedSpread,
      predictedTotal: result.predictedTotal,
      spreadConfidence: result.spreadConfidence,
      explanation: {
        topFactors: JSON.parse(result.topFactorsJson || '[]'),
        shapSummary: JSON.parse(result.shapSummaryJson || '[]'),
        humanSummary: result.humanSummary,
        confidence: 'medium',
        uncertaintyDrivers: [],
        requiresSubscription: true,
      },
      modelVersion: result.modelVersion,
      simulationCount: result.simulationCount,
      computeTimeMs: result.computeTimeMs ?? 0,
    };

    await this.cache.put(cacheKey, JSON.stringify(prediction), {
      expirationTtl: CACHE_TTL.prediction,
    });

    return prediction;
  }

  /**
   * Update prediction with actual result.
   */
  async updatePredictionResult(
    gameId: string,
    actualResult: 'home' | 'away' | 'draw',
    homeScore: number,
    awayScore: number
  ): Promise<void> {
    // Get prediction to calculate Brier score
    const prediction = await this.getPrediction(gameId);
    if (!prediction) return;

    // Calculate Brier score: (prediction - outcome)^2
    const outcome = actualResult === 'home' ? 1 : 0;
    const brierScore = Math.pow(prediction.homeWinProbability - outcome, 2);

    // Determine calibration bucket (0-10)
    const bucket = Math.min(Math.floor(prediction.homeWinProbability * 10), 9);

    await this.db
      .prepare(
        `
        UPDATE prediction_forecasts
        SET actual_result = ?,
            actual_home_score = ?,
            actual_away_score = ?,
            brier_score = ?,
            calibration_bucket = ?,
            updated_at = ?
        WHERE game_id = ?
        AND forecast_timestamp = (
          SELECT MAX(forecast_timestamp) FROM prediction_forecasts WHERE game_id = ?
        )
      `
      )
      .bind(
        actualResult,
        homeScore,
        awayScore,
        brierScore,
        bucket,
        new Date().toISOString(),
        gameId,
        gameId
      )
      .run();

    // Invalidate cache
    await this.cache.delete(`${CACHE_PREFIX.prediction}${gameId}`);
  }

  // ============================================================================
  // Calibration
  // ============================================================================

  /**
   * Get latest calibration metrics for a sport.
   */
  async getCalibration(sport: SupportedSport): Promise<CalibrationResult | null> {
    const cacheKey = `${CACHE_PREFIX.calibration}${sport}`;

    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as CalibrationResult;
    }

    const result = await this.db
      .prepare(
        `
        SELECT * FROM model_calibration
        WHERE sport = ?
        ORDER BY calibration_date DESC
        LIMIT 1
      `
      )
      .bind(sport)
      .first<CalibrationRow>();

    if (!result) {
      return null;
    }

    const calibration: CalibrationResult = {
      sport,
      modelVersion: result.model_version,
      evaluationDate: result.calibration_date,
      totalPredictions: result.total_predictions,
      brierScore: result.brier_score,
      logLoss: result.log_loss,
      accuracyAt50: result.accuracy_at_50,
      calibrationBuckets: JSON.parse(result.bucket_counts_json || '[]'),
      vsBetaImprovement: result.vs_baseline_improvement,
      vsVegasCorrelation: result.vs_vegas_correlation,
      vsEloImprovement: result.vs_elo_improvement,
      sampleSizeAdequate: Boolean(result.sample_size_adequate),
      reliabilityIndex: 0.9,
    };

    await this.cache.put(cacheKey, JSON.stringify(calibration), {
      expirationTtl: CACHE_TTL.calibration,
    });

    return calibration;
  }

  /**
   * Save calibration metrics.
   */
  async saveCalibration(calibration: CalibrationResult): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT OR REPLACE INTO model_calibration (
          sport, model_version, calibration_date,
          total_predictions, brier_score, log_loss, accuracy_at_50,
          bucket_counts_json, bucket_actual_json,
          vs_baseline_improvement, vs_vegas_correlation, vs_elo_improvement,
          sample_size_adequate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        calibration.sport,
        calibration.modelVersion,
        calibration.evaluationDate,
        calibration.totalPredictions,
        calibration.brierScore,
        calibration.logLoss,
        calibration.accuracyAt50,
        JSON.stringify(calibration.calibrationBuckets.map((b) => b.predictedCount)),
        JSON.stringify(calibration.calibrationBuckets.map((b) => b.actualWinRate)),
        calibration.vsBetaImprovement,
        calibration.vsVegasCorrelation,
        calibration.vsEloImprovement,
        calibration.totalPredictions >= 100 ? 1 : 0,
        new Date().toISOString()
      )
      .run();

    // Invalidate cache
    await this.cache.delete(`${CACHE_PREFIX.calibration}${calibration.sport}`);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private rowToTeamState(row: TeamPsychRow): TeamState {
    return {
      teamId: row.team_id,
      teamName: '', // Not stored in psych table
      sport: row.sport as SupportedSport,
      season: row.season,
      gameNumber: row.game_number,
      confidence: row.confidence,
      focus: row.focus,
      cohesion: row.cohesion,
      leadershipInfluence: row.leadership_influence,
      momentumScore: row.momentum_score ?? undefined,
      adversityResponse: row.adversity_response ?? undefined,
      clutchFactor: row.clutch_factor ?? undefined,
      rating: 1500, // Default, would join with teams table
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pythagoreanExpectation: 0.5,
      recentForm: [],
      streakType: null,
      streakLength: 0,
      injuryImpact: 1.0,
      fatigueIndex: 1.0,
      strengthOfSchedule: 0.5,
      updatedAt: row.updated_at,
      modelVersion: row.model_version,
    };
  }

  private rowToPlayerState(row: PlayerPsychRow): PlayerPsychState {
    return {
      playerId: row.player_id,
      teamId: row.team_id,
      sport: row.sport as SupportedSport,
      season: row.season,
      weekNumber: row.week_number,
      confidence: row.confidence,
      focus: row.focus,
      motivation: row.motivation,
      hrvBaselineDeviation: row.hrv_baseline_deviation ?? undefined,
      recoveryScore: row.recovery_score ?? undefined,
      sleepPerformance: row.sleep_performance ?? undefined,
      strainLevel: row.strain_level ?? undefined,
      recentPerformanceTrend: row.recent_performance_trend ?? 0,
      roleChange: row.role_change as -1 | 0 | 1,
      updatedAt: row.updated_at,
    };
  }
}

// ============================================================================
// Database Row Types
// ============================================================================

interface TeamPsychRow {
  id: number;
  team_id: string;
  sport: string;
  season: number;
  game_number: number;
  confidence: number;
  focus: number;
  cohesion: number;
  leadership_influence: number;
  momentum_score: number | null;
  adversity_response: number | null;
  clutch_factor: number | null;
  opponent_id: string | null;
  result: string | null;
  expectation_gap: number | null;
  win_probability_pre: number | null;
  win_probability_actual: number | null;
  updated_at: string;
  model_version: string;
}

interface PlayerPsychRow {
  id: number;
  player_id: string;
  team_id: string;
  sport: string;
  season: number;
  week_number: number;
  confidence: number;
  focus: number;
  motivation: number;
  hrv_baseline_deviation: number | null;
  recovery_score: number | null;
  sleep_performance: number | null;
  strain_level: number | null;
  recent_performance_trend: number | null;
  role_change: number;
  updated_at: string;
}

interface CalibrationRow {
  id: number;
  sport: string;
  model_version: string;
  calibration_date: string;
  total_predictions: number;
  brier_score: number;
  log_loss: number;
  accuracy_at_50: number;
  bucket_counts_json: string;
  bucket_actual_json: string;
  vs_baseline_improvement: number;
  vs_vegas_correlation: number;
  vs_elo_improvement: number;
  sample_size_adequate: number;
  updated_at: string;
}
