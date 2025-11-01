/**
 * Clutch Performance Score Calculator
 *
 * Aggregates player actions during clutch situations into composite performance scores,
 * enriched with wearables biometric context (HRV, recovery, sleep).
 *
 * Clutch Score Formula (0-100):
 * - Success Rate: 40% weight
 * - Points Over Expected (POE): 40% weight
 * - Action Volume: 20% weight
 *
 * @see docs/clutch-wearables-integration-schema.md for detailed methodology
 */

import { createTimeAlignmentService, PregameBaseline } from '../../lib/utils/time-alignment';

// ============================================================================
// TYPES
// ============================================================================

export interface ClutchPerformanceInput {
  player_id: string;
  game_id: string;
  situation_id: string;
}

export interface ClutchPerformanceScore {
  score_id?: string;
  player_id: string;
  game_id: string;
  situation_id: string;

  // Performance metrics
  actions_total: number;
  actions_successful: number;
  success_rate: number; // 0.0-1.0

  points_scored: number;
  assists: number;
  turnovers: number;
  rebounds: number;

  // Expected vs actual
  expected_points: number;
  points_over_expected: number;

  // Clutch score (0-100)
  clutch_score: number;
  clutch_percentile: number | null;

  // Wearables context
  hrv_rmssd_pregame: number | null;
  hrv_baseline_deviation: number | null;
  recovery_score_pregame: number | null;
  sleep_performance_pregame: number | null;
  day_strain_pregame: number | null;

  has_wearables_data: boolean;
  wearables_quality_score: number | null;

  // Model predictions (future)
  predicted_clutch_score: number | null;
  prediction_confidence: number | null;

  calculation_method: string;
}

export interface PlayerAction {
  action_id: string;
  player_id: string;
  action_type: string;
  action_subtype: string | null;
  is_successful: boolean;
  points_scored: number;
  expected_points: number | null;
}

// ============================================================================
// CALCULATOR CLASS
// ============================================================================

export class ClutchPerformanceCalculator {
  private db: any;
  private timeAligner: any;

  constructor(db: any) {
    this.db = db;
    this.timeAligner = createTimeAlignmentService();
  }

  /**
   * Calculate clutch performance score for a player in a specific situation
   */
  async calculateScore(input: ClutchPerformanceInput): Promise<ClutchPerformanceScore> {
    const { player_id, game_id, situation_id } = input;

    // 1. Get all player actions in this clutch situation
    const actionsResult = await this.db.query(`
      SELECT
        action_id,
        player_id,
        action_type,
        action_subtype,
        is_successful,
        points_scored,
        expected_points
      FROM clutch_player_actions
      WHERE situation_id = $1
        AND player_id = $2
      ORDER BY action_timestamp ASC
    `, [situation_id, player_id]);

    const actions: PlayerAction[] = actionsResult.rows;

    if (actions.length === 0) {
      console.log(`[Clutch Calculator] No actions found for player ${player_id} in situation ${situation_id}`);
      return this.createEmptyScore(input);
    }

    // 2. Calculate performance metrics
    const metrics = this.calculatePerformanceMetrics(actions);

    // 3. Get wearables data for game date
    const pregameBaseline = await this.getPregameWearablesData(player_id, game_id);

    // 4. Calculate clutch score
    const clutchScore = this.calculateClutchScore(metrics, pregameBaseline);

    // 5. Calculate percentile (compared to all players in season)
    const percentile = await this.calculatePercentile(clutchScore, game_id);

    // 6. Construct final score object
    const performanceScore: ClutchPerformanceScore = {
      player_id,
      game_id,
      situation_id,

      actions_total: metrics.actions_total,
      actions_successful: metrics.actions_successful,
      success_rate: metrics.success_rate,

      points_scored: metrics.points_scored,
      assists: metrics.assists,
      turnovers: metrics.turnovers,
      rebounds: metrics.rebounds,

      expected_points: metrics.expected_points,
      points_over_expected: metrics.points_over_expected,

      clutch_score: clutchScore,
      clutch_percentile: percentile,

      hrv_rmssd_pregame: pregameBaseline?.hrv_avg ?? null,
      hrv_baseline_deviation: pregameBaseline?.hrv_baseline_deviation ?? null,
      recovery_score_pregame: pregameBaseline?.recovery_score ?? null,
      sleep_performance_pregame: pregameBaseline?.sleep_performance ?? null,
      day_strain_pregame: pregameBaseline?.strain ?? null,

      has_wearables_data: pregameBaseline !== null,
      wearables_quality_score: pregameBaseline?.data_completeness ?? null,

      predicted_clutch_score: null, // Future: hierarchical model prediction
      prediction_confidence: null,

      calculation_method: 'composite_v1',
    };

    // 7. Insert/update in database
    await this.saveScore(performanceScore);

    return performanceScore;
  }

  /**
   * Calculate scores for all players in a game
   */
  async calculateScoresForGame(gameId: string): Promise<ClutchPerformanceScore[]> {
    // Get all situations in this game
    const situationsResult = await this.db.query(`
      SELECT situation_id
      FROM clutch_situations
      WHERE game_id = $1
    `, [gameId]);

    const scores: ClutchPerformanceScore[] = [];

    for (const situation of situationsResult.rows) {
      // Get unique players in this situation
      const playersResult = await this.db.query(`
        SELECT DISTINCT player_id
        FROM clutch_player_actions
        WHERE situation_id = $1
      `, [situation.situation_id]);

      for (const player of playersResult.rows) {
        const score = await this.calculateScore({
          player_id: player.player_id,
          game_id: gameId,
          situation_id: situation.situation_id,
        });
        scores.push(score);
      }
    }

    return scores;
  }

  /**
   * Batch calculate scores for multiple games (for historical backfill)
   */
  async calculateScoresForGames(gameIds: string[]): Promise<{ processed: number; failed: number; errors: any[] }> {
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const gameId of gameIds) {
      try {
        await this.calculateScoresForGame(gameId);
        results.processed++;
      } catch (error) {
        console.error(`[Clutch Calculator] Failed to calculate scores for game ${gameId}:`, error);
        results.failed++;
        results.errors.push({
          game_id: gameId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Calculate performance metrics from player actions
   */
  private calculatePerformanceMetrics(actions: PlayerAction[]): any {
    const total = actions.length;
    const successful = actions.filter(a => a.is_successful).length;
    const successRate = total > 0 ? successful / total : 0;

    const pointsScored = actions.reduce((sum, a) => sum + a.points_scored, 0);
    const expectedPoints = actions.reduce((sum, a) => sum + (a.expected_points || 0), 0);
    const pointsOverExpected = pointsScored - expectedPoints;

    // Count action types
    const assists = actions.filter(a => a.action_type === 'assist').length;
    const turnovers = actions.filter(a => a.action_type === 'turnover').length;
    const rebounds = actions.filter(a => a.action_type === 'rebound').length;

    return {
      actions_total: total,
      actions_successful: successful,
      success_rate: parseFloat(successRate.toFixed(4)),
      points_scored: pointsScored,
      assists,
      turnovers,
      rebounds,
      expected_points: parseFloat(expectedPoints.toFixed(3)),
      points_over_expected: parseFloat(pointsOverExpected.toFixed(3)),
    };
  }

  /**
   * Get pre-game wearables baseline for player on game date
   */
  private async getPregameWearablesData(playerId: string, gameId: string): Promise<PregameBaseline | null> {
    // Get game date
    const gameResult = await this.db.query(`
      SELECT game_date FROM games WHERE game_id = $1
    `, [gameId]);

    if (gameResult.rows.length === 0) {
      return null;
    }

    const gameDate = new Date(gameResult.rows[0].game_date);

    // Get wearables summary for that date
    const wearablesResult = await this.db.query(`
      SELECT
        hrv_rmssd_avg,
        hrv_baseline_deviation,
        recovery_score,
        sleep_performance_score,
        day_strain,
        data_completeness
      FROM wearables_daily_summary
      WHERE player_id = $1
        AND summary_date = $2::date
    `, [playerId, gameDate]);

    if (wearablesResult.rows.length === 0) {
      return null;
    }

    const data = wearablesResult.rows[0];

    return {
      player_id: playerId,
      game_date: gameDate,
      hrv_avg: data.hrv_rmssd_avg,
      hrv_baseline_deviation: data.hrv_baseline_deviation,
      recovery_score: data.recovery_score,
      sleep_performance: data.sleep_performance_score,
      resting_hr: null,
      strain: data.day_strain,
      data_completeness: data.data_completeness,
    };
  }

  /**
   * Calculate clutch score (0-100)
   *
   * Formula:
   * - Success Rate: 40% weight (0-40 points)
   * - Points Over Expected: 40% weight (0-40 points)
   * - Action Volume: 20% weight (0-20 points)
   */
  private calculateClutchScore(metrics: any, wearables: PregameBaseline | null): number {
    // Success rate component (0-40)
    const successComponent = metrics.success_rate * 40;

    // Points over expected component (0-40)
    // Normalize POE: -5 to +5 → 0 to 40
    const poeNormalized = Math.max(0, Math.min(10, metrics.points_over_expected + 5)); // Clamp to 0-10
    const poeComponent = (poeNormalized / 10) * 40;

    // Volume component (0-20)
    // More actions = more clutch moments (max out at 10 actions)
    const volumeNormalized = Math.min(10, metrics.actions_total);
    const volumeComponent = (volumeNormalized / 10) * 20;

    let clutchScore = successComponent + poeComponent + volumeComponent;

    // Optional: Wearables adjustment (experimental)
    // If HRV deviation is high (stressed), apply small penalty
    // If recovery score is low (<50), apply small penalty
    if (wearables) {
      if (wearables.hrv_baseline_deviation && wearables.hrv_baseline_deviation < -20) {
        // HRV 20% below baseline = stressed
        clutchScore *= 0.95; // 5% penalty
      }
      if (wearables.recovery_score && wearables.recovery_score < 50) {
        // Low recovery
        clutchScore *= 0.95; // 5% penalty
      }
    }

    return parseFloat(Math.min(100, Math.max(0, clutchScore)).toFixed(2));
  }

  /**
   * Calculate percentile for clutch score within season
   */
  private async calculatePercentile(clutchScore: number, gameId: string): Promise<number | null> {
    // Get season from game
    const gameResult = await this.db.query(`
      SELECT season FROM games WHERE game_id = $1
    `, [gameId]);

    if (gameResult.rows.length === 0) {
      return null;
    }

    const season = gameResult.rows[0].season;

    // Get all clutch scores for this season
    const scoresResult = await this.db.query(`
      SELECT clutch_score
      FROM clutch_performance_scores cps
      JOIN games g ON cps.game_id = g.game_id
      WHERE g.season = $1
        AND cps.clutch_score IS NOT NULL
      ORDER BY clutch_score ASC
    `, [season]);

    const allScores: number[] = scoresResult.rows.map((r: any) => r.clutch_score);

    if (allScores.length === 0) {
      return null;
    }

    // Calculate percentile
    const lowerCount = allScores.filter(s => s < clutchScore).length;
    const percentile = (lowerCount / allScores.length) * 100;

    return parseFloat(percentile.toFixed(2));
  }

  /**
   * Save score to database
   */
  private async saveScore(score: ClutchPerformanceScore): Promise<void> {
    await this.db.query(`
      INSERT INTO clutch_performance_scores (
        player_id,
        game_id,
        situation_id,
        actions_total,
        actions_successful,
        success_rate,
        points_scored,
        assists,
        turnovers,
        rebounds,
        expected_points,
        points_over_expected,
        clutch_score,
        clutch_percentile,
        hrv_rmssd_pregame,
        hrv_baseline_deviation,
        recovery_score_pregame,
        sleep_performance_pregame,
        day_strain_pregame,
        has_wearables_data,
        wearables_quality_score,
        predicted_clutch_score,
        prediction_confidence,
        calculation_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT (player_id, game_id, situation_id) DO UPDATE
      SET actions_total = EXCLUDED.actions_total,
          actions_successful = EXCLUDED.actions_successful,
          success_rate = EXCLUDED.success_rate,
          points_scored = EXCLUDED.points_scored,
          assists = EXCLUDED.assists,
          turnovers = EXCLUDED.turnovers,
          rebounds = EXCLUDED.rebounds,
          expected_points = EXCLUDED.expected_points,
          points_over_expected = EXCLUDED.points_over_expected,
          clutch_score = EXCLUDED.clutch_score,
          clutch_percentile = EXCLUDED.clutch_percentile,
          hrv_rmssd_pregame = EXCLUDED.hrv_rmssd_pregame,
          hrv_baseline_deviation = EXCLUDED.hrv_baseline_deviation,
          recovery_score_pregame = EXCLUDED.recovery_score_pregame,
          sleep_performance_pregame = EXCLUDED.sleep_performance_pregame,
          day_strain_pregame = EXCLUDED.day_strain_pregame,
          has_wearables_data = EXCLUDED.has_wearables_data,
          wearables_quality_score = EXCLUDED.wearables_quality_score,
          calculation_method = EXCLUDED.calculation_method,
          updated_at = NOW()
    `, [
      score.player_id,
      score.game_id,
      score.situation_id,
      score.actions_total,
      score.actions_successful,
      score.success_rate,
      score.points_scored,
      score.assists,
      score.turnovers,
      score.rebounds,
      score.expected_points,
      score.points_over_expected,
      score.clutch_score,
      score.clutch_percentile,
      score.hrv_rmssd_pregame,
      score.hrv_baseline_deviation,
      score.recovery_score_pregame,
      score.sleep_performance_pregame,
      score.day_strain_pregame,
      score.has_wearables_data,
      score.wearables_quality_score,
      score.predicted_clutch_score,
      score.prediction_confidence,
      score.calculation_method,
    ]);
  }

  /**
   * Create empty score when no actions found
   */
  private createEmptyScore(input: ClutchPerformanceInput): ClutchPerformanceScore {
    return {
      player_id: input.player_id,
      game_id: input.game_id,
      situation_id: input.situation_id,
      actions_total: 0,
      actions_successful: 0,
      success_rate: 0,
      points_scored: 0,
      assists: 0,
      turnovers: 0,
      rebounds: 0,
      expected_points: 0,
      points_over_expected: 0,
      clutch_score: 0,
      clutch_percentile: null,
      hrv_rmssd_pregame: null,
      hrv_baseline_deviation: null,
      recovery_score_pregame: null,
      sleep_performance_pregame: null,
      day_strain_pregame: null,
      has_wearables_data: false,
      wearables_quality_score: null,
      predicted_clutch_score: null,
      prediction_confidence: null,
      calculation_method: 'composite_v1',
    };
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create calculator instance
 */
export function createClutchPerformanceCalculator(db: any): ClutchPerformanceCalculator {
  return new ClutchPerformanceCalculator(db);
}

export default ClutchPerformanceCalculator;
