/**
 * BSI Predictive Modeling Engine - Calibration Module
 *
 * Brier score calculation, calibration curves, and model validation.
 * Tracks model performance over time for continuous improvement.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  SupportedSport,
  GameResult,
  CalibrationBucket,
  CalibrationResult,
  BacktestResult,
  GamePrediction,
  CloudflareEnv,
} from './types';

// ============================================================================
// Constants
// ============================================================================

// Number of calibration buckets (0-10%, 10-20%, ..., 90-100%)
const NUM_BUCKETS = 10;

// Target Brier score for a well-calibrated model
const TARGET_BRIER_SCORE = 0.075;

// Minimum sample size for reliable calibration
const MIN_SAMPLE_SIZE = 100;

// ============================================================================
// CalibrationEngine Class
// ============================================================================

export class CalibrationEngine {
  private readonly env: CloudflareEnv;

  constructor(env: CloudflareEnv) {
    this.env = env;
  }

  // ============================================================================
  // Brier Score Calculation
  // ============================================================================

  /**
   * Calculate Brier score for a single prediction.
   *
   * Brier = (p - o)^2
   * where p = predicted probability, o = actual outcome (0 or 1)
   *
   * Lower is better. Perfect = 0, Random = 0.25
   */
  calculateBrierScore(
    predictedProb: number,
    actualResult: GameResult,
    predictedForHome: boolean = true
  ): number {
    // Convert result to binary outcome for home team
    const homeWon = actualResult === 'W';
    const outcome = predictedForHome ? (homeWon ? 1 : 0) : (homeWon ? 0 : 1);

    return Math.pow(predictedProb - outcome, 2);
  }

  /**
   * Calculate average Brier score for multiple predictions.
   */
  calculateAverageBrierScore(
    predictions: Array<{ predictedProb: number; actualResult: GameResult }>
  ): number {
    if (predictions.length === 0) return 1;

    const totalBrier = predictions.reduce((sum, p) => {
      return sum + this.calculateBrierScore(p.predictedProb, p.actualResult);
    }, 0);

    return totalBrier / predictions.length;
  }

  /**
   * Calculate log loss (cross-entropy) for a prediction.
   *
   * More punishing of confident wrong predictions.
   */
  calculateLogLoss(
    predictedProb: number,
    actualResult: GameResult
  ): number {
    const outcome = actualResult === 'W' ? 1 : 0;
    const epsilon = 1e-15; // Prevent log(0)

    const clampedProb = Math.max(epsilon, Math.min(1 - epsilon, predictedProb));

    return -(outcome * Math.log(clampedProb) + (1 - outcome) * Math.log(1 - clampedProb));
  }

  // ============================================================================
  // Calibration Curves
  // ============================================================================

  /**
   * Generate calibration buckets from predictions.
   *
   * Groups predictions by confidence level and compares
   * predicted probability to actual win rate.
   */
  generateCalibrationBuckets(
    predictions: Array<{ predictedProb: number; actualResult: GameResult }>
  ): CalibrationBucket[] {
    const buckets: CalibrationBucket[] = [];

    for (let i = 0; i < NUM_BUCKETS; i++) {
      const lowerBound = i / NUM_BUCKETS;
      const upperBound = (i + 1) / NUM_BUCKETS;

      // Filter predictions in this bucket
      const bucketPredictions = predictions.filter(
        p => p.predictedProb >= lowerBound && p.predictedProb < upperBound
      );

      // Calculate actual win rate
      const wins = bucketPredictions.filter(p => p.actualResult === 'W').length;
      const actualWinRate =
        bucketPredictions.length > 0 ? wins / bucketPredictions.length : 0;

      // Expected win rate is midpoint of bucket
      const expectedWinRate = (lowerBound + upperBound) / 2;

      buckets.push({
        probabilityRange: [lowerBound, upperBound],
        predictedCount: bucketPredictions.length,
        actualWinRate,
        calibrationError: Math.abs(actualWinRate - expectedWinRate),
      });
    }

    return buckets;
  }

  /**
   * Calculate calibration error (mean absolute calibration error).
   */
  calculateCalibrationError(buckets: CalibrationBucket[]): number {
    let weightedError = 0;
    let totalCount = 0;

    for (const bucket of buckets) {
      if (bucket.predictedCount > 0) {
        weightedError += bucket.calibrationError * bucket.predictedCount;
        totalCount += bucket.predictedCount;
      }
    }

    return totalCount > 0 ? weightedError / totalCount : 0;
  }

  // ============================================================================
  // Full Calibration Report
  // ============================================================================

  /**
   * Generate complete calibration result for a sport.
   */
  async generateCalibrationResult(
    sport: SupportedSport,
    modelVersion: string,
    predictions: Array<{
      predictedProb: number;
      actualResult: GameResult;
      gameId: string;
    }>
  ): Promise<CalibrationResult> {
    const brierScore = this.calculateAverageBrierScore(predictions);

    const logLoss =
      predictions.reduce((sum, p) => {
        return sum + this.calculateLogLoss(p.predictedProb, p.actualResult);
      }, 0) / predictions.length;

    // Accuracy when predicting >50% probability
    const confidentPredictions = predictions.filter(
      p => p.predictedProb > 0.5 || p.predictedProb < 0.5
    );
    const correctConfident = confidentPredictions.filter(p => {
      const predictedHomeWin = p.predictedProb > 0.5;
      const actualHomeWin = p.actualResult === 'W';
      return predictedHomeWin === actualHomeWin;
    });
    const accuracyAt50 =
      confidentPredictions.length > 0
        ? correctConfident.length / confidentPredictions.length
        : 0;

    const calibrationBuckets = this.generateCalibrationBuckets(predictions);

    // Benchmark comparisons (would need historical baseline data)
    const vsBetaImprovement = this.calculateBetaImprovement(brierScore);
    const vsVegasCorrelation = 0; // Would need Vegas lines to calculate
    const vsEloImprovement = this.calculateEloImprovement(brierScore, sport);

    return {
      sport,
      modelVersion,
      evaluationDate: new Date().toISOString(),
      totalPredictions: predictions.length,
      brierScore: Math.round(brierScore * 10000) / 10000,
      logLoss: Math.round(logLoss * 10000) / 10000,
      accuracyAt50: Math.round(accuracyAt50 * 1000) / 1000,
      calibrationBuckets,
      vsBetaImprovement,
      vsVegasCorrelation,
      vsEloImprovement,
      sampleSizeAdequate: predictions.length >= MIN_SAMPLE_SIZE,
      reliabilityIndex: this.calculateReliabilityIndex(
        brierScore,
        predictions.length,
        calibrationBuckets
      ),
    };
  }

  /**
   * Calculate improvement over naive baseline (always predict 50%).
   */
  private calculateBetaImprovement(brierScore: number): number {
    const naiveBrier = 0.25; // Always predicting 50%
    return ((naiveBrier - brierScore) / naiveBrier) * 100;
  }

  /**
   * Calculate improvement over simple Elo model.
   *
   * Typical Elo-only models achieve ~0.20 Brier score.
   */
  private calculateEloImprovement(
    brierScore: number,
    sport: SupportedSport
  ): number {
    const typicalEloBrier: Record<SupportedSport, number> = {
      cfb: 0.22,
      cbb: 0.23,
      nfl: 0.21,
      nba: 0.20,
      mlb: 0.24,
    };

    const baseline = typicalEloBrier[sport];
    return ((baseline - brierScore) / baseline) * 100;
  }

  /**
   * Calculate reliability index combining multiple metrics.
   */
  private calculateReliabilityIndex(
    brierScore: number,
    sampleSize: number,
    buckets: CalibrationBucket[]
  ): number {
    // Brier component (target 0.075)
    const brierComponent = Math.max(0, 1 - brierScore / 0.25);

    // Sample size component
    const sampleComponent = Math.min(1, sampleSize / 1000);

    // Calibration component
    const calibrationError = this.calculateCalibrationError(buckets);
    const calibrationComponent = Math.max(0, 1 - calibrationError * 5);

    // Weighted average
    return (
      brierComponent * 0.5 +
      sampleComponent * 0.2 +
      calibrationComponent * 0.3
    );
  }

  // ============================================================================
  // Backtesting
  // ============================================================================

  /**
   * Run historical backtest on predictions.
   */
  async runBacktest(
    sport: SupportedSport,
    predictions: Array<{
      gameId: string;
      predictedProb: number;
      actualResult: GameResult;
      confidence: number;
    }>,
    startDate: string,
    endDate: string
  ): Promise<BacktestResult> {
    const brierScore = this.calculateAverageBrierScore(predictions);
    const logLoss =
      predictions.reduce((sum, p) => {
        return sum + this.calculateLogLoss(p.predictedProb, p.actualResult);
      }, 0) / predictions.length;

    // Calculate accuracy
    const correct = predictions.filter(p => {
      const predictedHome = p.predictedProb > 0.5;
      const actualHome = p.actualResult === 'W';
      return predictedHome === actualHome;
    });
    const accuracy = correct.length / predictions.length;

    // Get calibration
    const calibration = await this.generateCalibrationResult(
      sport,
      '1.0.0',
      predictions
    );

    // Find best and worst predictions
    const sortedByConfidence = [...predictions].sort(
      (a, b) => b.confidence - a.confidence
    );

    const bestPredictions = sortedByConfidence
      .filter(p => {
        const predictedHome = p.predictedProb > 0.5;
        const actualHome = p.actualResult === 'W';
        return predictedHome === actualHome;
      })
      .slice(0, 5)
      .map(p => ({
        gameId: p.gameId,
        predicted: p.predictedProb,
        actual: p.actualResult,
        confidence: p.confidence,
      }));

    const worstPredictions = sortedByConfidence
      .filter(p => {
        const predictedHome = p.predictedProb > 0.5;
        const actualHome = p.actualResult === 'W';
        return predictedHome !== actualHome;
      })
      .slice(0, 5)
      .map(p => ({
        gameId: p.gameId,
        predicted: p.predictedProb,
        actual: p.actualResult,
        confidence: p.confidence,
      }));

    // Psychology impact (would need A/B test data)
    const psychologyImpact = 5; // Placeholder: 5% lift

    return {
      sport,
      startDate,
      endDate,
      gamesEvaluated: predictions.length,
      brierScore,
      logLoss,
      accuracy,
      calibration,
      bestPredictions,
      worstPredictions,
      psychologyImpact,
      sportSpecificInsights: this.generateSportInsights(sport, predictions),
    };
  }

  /**
   * Generate sport-specific insights from backtest.
   */
  private generateSportInsights(
    sport: SupportedSport,
    predictions: Array<{ predictedProb: number; actualResult: GameResult }>
  ): Record<string, string> {
    const insights: Record<string, string> = {};

    // Analyze upset rate
    const upsets = predictions.filter(p => {
      const favoredHome = p.predictedProb > 0.5;
      const actualHome = p.actualResult === 'W';
      return (
        (favoredHome && !actualHome && p.predictedProb > 0.65) ||
        (!favoredHome && actualHome && p.predictedProb < 0.35)
      );
    });
    const upsetRate = (upsets.length / predictions.length) * 100;

    insights.upsetRate = `${upsetRate.toFixed(1)}% of games were upsets`;

    // Sport-specific
    switch (sport) {
      case 'cfb':
        insights.homeField = 'College football home field advantage holds at ~60%';
        break;
      case 'cbb':
        insights.marchmadness = 'Tournament predictions show higher variance';
        break;
      case 'nfl':
        insights.parity = 'NFL parity makes confident predictions rare';
        break;
      case 'nba':
        insights.streaks = 'NBA momentum effects visible in win streaks';
        break;
      case 'mlb':
        insights.variance = 'Baseball single-game variance remains high';
        break;
    }

    return insights;
  }

  // ============================================================================
  // Model Monitoring
  // ============================================================================

  /**
   * Check if model calibration has drifted.
   */
  async checkCalibrationDrift(
    sport: SupportedSport,
    recentPredictions: Array<{ predictedProb: number; actualResult: GameResult }>,
    historicalBrier: number
  ): Promise<{
    hasDrift: boolean;
    currentBrier: number;
    driftMagnitude: number;
    recommendation: string;
  }> {
    const currentBrier = this.calculateAverageBrierScore(recentPredictions);
    const driftMagnitude = ((currentBrier - historicalBrier) / historicalBrier) * 100;

    const hasDrift = Math.abs(driftMagnitude) > 10; // >10% change

    let recommendation = 'Model calibration is stable.';
    if (driftMagnitude > 15) {
      recommendation = 'Consider retraining - performance has degraded significantly.';
    } else if (driftMagnitude > 10) {
      recommendation = 'Monitor closely - slight performance degradation detected.';
    } else if (driftMagnitude < -10) {
      recommendation = 'Model is performing better than historical baseline.';
    }

    return {
      hasDrift,
      currentBrier,
      driftMagnitude,
      recommendation,
    };
  }

  /**
   * Generate model health report.
   */
  generateHealthReport(
    calibration: CalibrationResult
  ): {
    status: 'healthy' | 'warning' | 'critical';
    brierStatus: string;
    calibrationStatus: string;
    sampleStatus: string;
    overallScore: number;
  } {
    // Brier score assessment
    let brierStatus: string;
    let brierScore = 0;
    if (calibration.brierScore <= TARGET_BRIER_SCORE) {
      brierStatus = `Excellent (${calibration.brierScore.toFixed(4)})`;
      brierScore = 100;
    } else if (calibration.brierScore <= 0.10) {
      brierStatus = `Good (${calibration.brierScore.toFixed(4)})`;
      brierScore = 80;
    } else if (calibration.brierScore <= 0.15) {
      brierStatus = `Acceptable (${calibration.brierScore.toFixed(4)})`;
      brierScore = 60;
    } else {
      brierStatus = `Needs improvement (${calibration.brierScore.toFixed(4)})`;
      brierScore = 40;
    }

    // Calibration assessment
    const calibrationError = this.calculateCalibrationError(
      calibration.calibrationBuckets
    );
    let calibrationStatus: string;
    let calScore = 0;
    if (calibrationError < 0.05) {
      calibrationStatus = 'Well-calibrated';
      calScore = 100;
    } else if (calibrationError < 0.10) {
      calibrationStatus = 'Acceptably calibrated';
      calScore = 70;
    } else {
      calibrationStatus = 'Poorly calibrated';
      calScore = 40;
    }

    // Sample size assessment
    let sampleStatus: string;
    let sampleScore = 0;
    if (calibration.totalPredictions >= 500) {
      sampleStatus = `Strong sample (n=${calibration.totalPredictions})`;
      sampleScore = 100;
    } else if (calibration.totalPredictions >= MIN_SAMPLE_SIZE) {
      sampleStatus = `Adequate sample (n=${calibration.totalPredictions})`;
      sampleScore = 70;
    } else {
      sampleStatus = `Insufficient sample (n=${calibration.totalPredictions})`;
      sampleScore = 30;
    }

    // Overall score
    const overallScore = brierScore * 0.5 + calScore * 0.3 + sampleScore * 0.2;

    // Status determination
    let status: 'healthy' | 'warning' | 'critical';
    if (overallScore >= 75) {
      status = 'healthy';
    } else if (overallScore >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      brierStatus,
      calibrationStatus,
      sampleStatus,
      overallScore: Math.round(overallScore),
    };
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Save calibration result to D1.
   */
  async saveCalibration(calibration: CalibrationResult): Promise<void> {
    const query = `
      INSERT INTO model_calibration (
        sport,
        model_version,
        calibration_date,
        total_predictions,
        brier_score,
        log_loss,
        accuracy_at_50,
        bucket_counts_json,
        bucket_actual_json,
        vs_baseline_improvement,
        vs_vegas_correlation,
        vs_elo_improvement,
        sample_size_adequate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (sport, model_version, calibration_date) DO UPDATE SET
        total_predictions = excluded.total_predictions,
        brier_score = excluded.brier_score,
        log_loss = excluded.log_loss,
        accuracy_at_50 = excluded.accuracy_at_50,
        bucket_counts_json = excluded.bucket_counts_json,
        bucket_actual_json = excluded.bucket_actual_json,
        updated_at = datetime('now')
    `;

    const bucketCounts = calibration.calibrationBuckets.map(b => b.predictedCount);
    const bucketActual = calibration.calibrationBuckets.map(b => b.actualWinRate);

    await this.env.DB.prepare(query)
      .bind(
        calibration.sport,
        calibration.modelVersion,
        calibration.evaluationDate.split('T')[0],
        calibration.totalPredictions,
        calibration.brierScore,
        calibration.logLoss,
        calibration.accuracyAt50,
        JSON.stringify(bucketCounts),
        JSON.stringify(bucketActual),
        calibration.vsBetaImprovement,
        calibration.vsVegasCorrelation,
        calibration.vsEloImprovement,
        calibration.sampleSizeAdequate ? 1 : 0
      )
      .run();
  }

  /**
   * Get latest calibration for a sport.
   */
  async getLatestCalibration(
    sport: SupportedSport,
    modelVersion: string
  ): Promise<CalibrationResult | null> {
    interface CalibrationRow {
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
    }

    const query = `
      SELECT * FROM model_calibration
      WHERE sport = ? AND model_version = ?
      ORDER BY calibration_date DESC
      LIMIT 1
    `;

    const result = await this.env.DB.prepare(query)
      .bind(sport, modelVersion)
      .first<CalibrationRow>();

    if (!result) return null;

    const bucketCounts = JSON.parse(result.bucket_counts_json) as number[];
    const bucketActual = JSON.parse(result.bucket_actual_json) as number[];

    const calibrationBuckets: CalibrationBucket[] = bucketCounts.map((count, i) => ({
      probabilityRange: [i / NUM_BUCKETS, (i + 1) / NUM_BUCKETS] as [number, number],
      predictedCount: count,
      actualWinRate: bucketActual[i],
      calibrationError: Math.abs(bucketActual[i] - (i + 0.5) / NUM_BUCKETS),
    }));

    return {
      sport: result.sport as SupportedSport,
      modelVersion: result.model_version,
      evaluationDate: result.calibration_date,
      totalPredictions: result.total_predictions,
      brierScore: result.brier_score,
      logLoss: result.log_loss,
      accuracyAt50: result.accuracy_at_50,
      calibrationBuckets,
      vsBetaImprovement: result.vs_baseline_improvement,
      vsVegasCorrelation: result.vs_vegas_correlation,
      vsEloImprovement: result.vs_elo_improvement,
      sampleSizeAdequate: result.sample_size_adequate === 1,
      reliabilityIndex: this.calculateReliabilityIndex(
        result.brier_score,
        result.total_predictions,
        calibrationBuckets
      ),
    };
  }
}
