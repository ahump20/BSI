/**
 * Blaze Sports Intel - Prediction Accuracy Tracker
 *
 * Tracks prediction accuracy over time and computes performance metrics.
 *
 * Features:
 * - Prediction vs actual outcome tracking
 * - Brier score calculation (accuracy metric for probabilistic predictions)
 * - Calibration analysis (are 70% predictions correct 70% of the time?)
 * - Sport-specific accuracy metrics
 * - Historical accuracy trends
 * - Model performance comparison
 */

/**
 * Record a prediction before game completion
 * @param {string} gameId - Game identifier
 * @param {Object} prediction - Prediction data
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Recorded prediction
 */
export async function recordPrediction(gameId, prediction, env) {
  try {
    const predictionRecord = {
      gameId,
      timestamp: new Date().toISOString(),
      sport: prediction.sport,
      homeTeam: prediction.homeTeam,
      awayTeam: prediction.awayTeam,
      predictedHomeWinProb: prediction.homeWinProbability,
      predictedAwayWinProb: prediction.awayWinProbability,
      confidence: prediction.confidence?.level || 'unknown',
      gameState: prediction.gameState || null,
      actualOutcome: null, // To be filled when game completes
      actualHomeScore: null,
      actualAwayScore: null,
      brierScore: null,
      correct: null
    };

    // Store in D1 database
    await env.DB.prepare(`
      INSERT INTO prediction_records
        (game_id, timestamp, sport, home_team, away_team,
         predicted_home_win_prob, predicted_away_win_prob,
         confidence, game_state_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      predictionRecord.gameId,
      predictionRecord.timestamp,
      predictionRecord.sport,
      predictionRecord.homeTeam,
      predictionRecord.awayTeam,
      predictionRecord.predictedHomeWinProb,
      predictionRecord.predictedAwayWinProb,
      predictionRecord.confidence,
      JSON.stringify(predictionRecord.gameState)
    ).run();

    return predictionRecord;

  } catch (error) {
    console.error('Error recording prediction:', error);
    throw error;
  }
}

/**
 * Update prediction with actual outcome
 * @param {string} gameId - Game identifier
 * @param {Object} actualOutcome - Actual game result
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Updated prediction with accuracy metrics
 */
export async function updateActualOutcome(gameId, actualOutcome, env) {
  try {
    // Get stored prediction
    const predictionRecord = await env.DB.prepare(`
      SELECT * FROM prediction_records WHERE game_id = ?
    `).bind(gameId).first();

    if (!predictionRecord) {
      throw new Error(`No prediction found for game ${gameId}`);
    }

    // Determine actual winner
    const actualWinner = actualOutcome.homeScore > actualOutcome.awayScore ? 'home' : 'away';
    const actualHomeWin = actualWinner === 'home' ? 1 : 0;
    const actualAwayWin = actualWinner === 'away' ? 1 : 0;

    // Calculate Brier score (lower is better, perfect = 0, worst = 1)
    const brierScore = calculateBrierScore(
      predictionRecord.predicted_home_win_prob,
      actualHomeWin
    );

    // Check if prediction was correct (predicted winner matches actual winner)
    const predictedWinner = predictionRecord.predicted_home_win_prob > 0.5 ? 'home' : 'away';
    const correct = predictedWinner === actualWinner;

    // Update database with actual outcome
    await env.DB.prepare(`
      UPDATE prediction_records
      SET
        actual_outcome = ?,
        actual_home_score = ?,
        actual_away_score = ?,
        actual_home_win = ?,
        actual_away_win = ?,
        brier_score = ?,
        correct = ?,
        updated_at = ?
      WHERE game_id = ?
    `).bind(
      actualWinner,
      actualOutcome.homeScore,
      actualOutcome.awayScore,
      actualHomeWin,
      actualAwayWin,
      brierScore,
      correct ? 1 : 0,
      new Date().toISOString(),
      gameId
    ).run();

    return {
      gameId,
      predictedHomeWinProb: predictionRecord.predicted_home_win_prob,
      actualWinner,
      brierScore,
      correct,
      actualOutcome
    };

  } catch (error) {
    console.error('Error updating actual outcome:', error);
    throw error;
  }
}

/**
 * Calculate Brier score for probabilistic prediction
 * Brier score = (predicted_prob - actual_outcome)^2
 * @param {number} predictedProb - Predicted probability (0-1)
 * @param {number} actualOutcome - Actual outcome (0 or 1)
 * @returns {number} Brier score
 */
function calculateBrierScore(predictedProb, actualOutcome) {
  return Math.pow(predictedProb - actualOutcome, 2);
}

/**
 * Get overall accuracy metrics
 * @param {Object} env - Cloudflare environment
 * @param {Object} filters - Optional filters (sport, dateRange, confidence)
 * @returns {Promise<Object>} Accuracy metrics
 */
export async function getAccuracyMetrics(env, filters = {}) {
  try {
    // Build query with filters
    let query = `
      SELECT
        COUNT(*) as total_predictions,
        SUM(correct) as correct_predictions,
        AVG(brier_score) as avg_brier_score,
        sport,
        confidence
      FROM prediction_records
      WHERE actual_outcome IS NOT NULL
    `;

    const bindings = [];

    if (filters.sport) {
      query += ` AND sport = ?`;
      bindings.push(filters.sport);
    }

    if (filters.startDate) {
      query += ` AND timestamp >= ?`;
      bindings.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND timestamp <= ?`;
      bindings.push(filters.endDate);
    }

    if (filters.confidence) {
      query += ` AND confidence = ?`;
      bindings.push(filters.confidence);
    }

    query += ` GROUP BY sport, confidence`;

    const results = await env.DB.prepare(query).bind(...bindings).all();

    // Calculate overall metrics
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalBrierScore = 0;

    const bySport = {};
    const byConfidence = {};

    for (const row of results.results) {
      totalPredictions += row.total_predictions;
      correctPredictions += row.correct_predictions;
      totalBrierScore += row.avg_brier_score * row.total_predictions;

      // Group by sport
      if (!bySport[row.sport]) {
        bySport[row.sport] = {
          total: 0,
          correct: 0,
          brierScore: 0
        };
      }
      bySport[row.sport].total += row.total_predictions;
      bySport[row.sport].correct += row.correct_predictions;
      bySport[row.sport].brierScore += row.avg_brier_score * row.total_predictions;

      // Group by confidence
      if (!byConfidence[row.confidence]) {
        byConfidence[row.confidence] = {
          total: 0,
          correct: 0,
          brierScore: 0
        };
      }
      byConfidence[row.confidence].total += row.total_predictions;
      byConfidence[row.confidence].correct += row.correct_predictions;
      byConfidence[row.confidence].brierScore += row.avg_brier_score * row.total_predictions;
    }

    // Calculate percentages
    const overallAccuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const overallBrierScore = totalPredictions > 0 ? totalBrierScore / totalPredictions : 0;

    // Calculate sport-specific metrics
    const sportMetrics = {};
    for (const sport in bySport) {
      const data = bySport[sport];
      sportMetrics[sport] = {
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: (data.correct / data.total) * 100,
        brierScore: data.brierScore / data.total
      };
    }

    // Calculate confidence-specific metrics
    const confidenceMetrics = {};
    for (const conf in byConfidence) {
      const data = byConfidence[conf];
      confidenceMetrics[conf] = {
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: (data.correct / data.total) * 100,
        brierScore: data.brierScore / data.total
      };
    }

    return {
      overall: {
        totalPredictions,
        correctPredictions,
        accuracy: Math.round(overallAccuracy * 10) / 10,
        brierScore: Math.round(overallBrierScore * 1000) / 1000
      },
      bySport: sportMetrics,
      byConfidence: confidenceMetrics,
      filters
    };

  } catch (error) {
    console.error('Error getting accuracy metrics:', error);
    throw error;
  }
}

/**
 * Analyze calibration (are X% predictions correct X% of the time?)
 * @param {Object} env - Cloudflare environment
 * @param {string} sport - Sport to analyze
 * @returns {Promise<Object>} Calibration analysis
 */
export async function analyzeCalibration(env, sport = null) {
  try {
    // Get all predictions with outcomes
    let query = `
      SELECT
        predicted_home_win_prob,
        actual_home_win
      FROM prediction_records
      WHERE actual_outcome IS NOT NULL
    `;

    const bindings = [];
    if (sport) {
      query += ` AND sport = ?`;
      bindings.push(sport);
    }

    const results = await env.DB.prepare(query).bind(...bindings).all();

    // Group predictions into probability buckets
    const buckets = {
      '0-10%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '10-20%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '20-30%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '30-40%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '40-50%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '50-60%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '60-70%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '70-80%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '80-90%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 },
      '90-100%': { total: 0, correct: 0, avgProb: 0, sumProb: 0 }
    };

    // Populate buckets
    for (const row of results.results) {
      const prob = row.predicted_home_win_prob;
      const correct = row.actual_home_win === 1;

      let bucketKey;
      if (prob < 0.1) bucketKey = '0-10%';
      else if (prob < 0.2) bucketKey = '10-20%';
      else if (prob < 0.3) bucketKey = '20-30%';
      else if (prob < 0.4) bucketKey = '30-40%';
      else if (prob < 0.5) bucketKey = '40-50%';
      else if (prob < 0.6) bucketKey = '50-60%';
      else if (prob < 0.7) bucketKey = '60-70%';
      else if (prob < 0.8) bucketKey = '70-80%';
      else if (prob < 0.9) bucketKey = '80-90%';
      else bucketKey = '90-100%';

      buckets[bucketKey].total++;
      buckets[bucketKey].sumProb += prob;
      if (correct) buckets[bucketKey].correct++;
    }

    // Calculate calibration metrics
    const calibrationData = [];
    let totalCalibrationError = 0;
    let bucketsWithData = 0;

    for (const bucket in buckets) {
      const data = buckets[bucket];
      if (data.total > 0) {
        data.avgProb = data.sumProb / data.total;
        const actualRate = data.correct / data.total;
        const calibrationError = Math.abs(data.avgProb - actualRate);

        calibrationData.push({
          bucket,
          totalPredictions: data.total,
          predictedWinRate: Math.round(data.avgProb * 1000) / 10,
          actualWinRate: Math.round(actualRate * 1000) / 10,
          calibrationError: Math.round(calibrationError * 1000) / 10
        });

        totalCalibrationError += calibrationError;
        bucketsWithData++;
      }
    }

    // Overall calibration score (lower is better)
    const overallCalibrationError = bucketsWithData > 0
      ? (totalCalibrationError / bucketsWithData) * 100
      : 0;

    return {
      sport: sport || 'all',
      totalPredictions: results.results.length,
      overallCalibrationError: Math.round(overallCalibrationError * 10) / 10,
      calibrationQuality: overallCalibrationError < 5 ? 'excellent' :
                          overallCalibrationError < 10 ? 'good' :
                          overallCalibrationError < 15 ? 'fair' : 'poor',
      buckets: calibrationData
    };

  } catch (error) {
    console.error('Error analyzing calibration:', error);
    throw error;
  }
}

/**
 * Get prediction accuracy trend over time
 * @param {Object} env - Cloudflare environment
 * @param {string} sport - Optional sport filter
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Accuracy trend data
 */
export async function getAccuracyTrend(env, sport = null, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = `
      SELECT
        DATE(timestamp) as prediction_date,
        COUNT(*) as total,
        SUM(correct) as correct,
        AVG(brier_score) as avg_brier
      FROM prediction_records
      WHERE actual_outcome IS NOT NULL
        AND timestamp >= ?
    `;

    const bindings = [startDate.toISOString()];

    if (sport) {
      query += ` AND sport = ?`;
      bindings.push(sport);
    }

    query += ` GROUP BY DATE(timestamp) ORDER BY prediction_date ASC`;

    const results = await env.DB.prepare(query).bind(...bindings).all();

    const trendData = results.results.map(row => ({
      date: row.prediction_date,
      totalPredictions: row.total,
      correctPredictions: row.correct,
      accuracy: Math.round((row.correct / row.total) * 1000) / 10,
      brierScore: Math.round(row.avg_brier * 1000) / 1000
    }));

    // Calculate moving average (7-day)
    const movingAvgWindow = 7;
    trendData.forEach((day, index) => {
      if (index >= movingAvgWindow - 1) {
        const window = trendData.slice(index - movingAvgWindow + 1, index + 1);
        const avgAccuracy = window.reduce((sum, d) => sum + d.accuracy, 0) / movingAvgWindow;
        day.movingAvgAccuracy = Math.round(avgAccuracy * 10) / 10;
      } else {
        day.movingAvgAccuracy = null;
      }
    });

    return {
      sport: sport || 'all',
      days,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      trend: trendData
    };

  } catch (error) {
    console.error('Error getting accuracy trend:', error);
    throw error;
  }
}

/**
 * Compare model performance across sports
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Cross-sport performance comparison
 */
export async function compareModelPerformance(env) {
  try {
    const query = `
      SELECT
        sport,
        COUNT(*) as total_predictions,
        SUM(correct) as correct_predictions,
        AVG(brier_score) as avg_brier_score,
        AVG(CASE WHEN confidence = 'high' THEN CAST(correct AS REAL) ELSE NULL END) as high_conf_accuracy,
        AVG(CASE WHEN confidence = 'medium' THEN CAST(correct AS REAL) ELSE NULL END) as medium_conf_accuracy,
        AVG(CASE WHEN confidence = 'low' THEN CAST(correct AS REAL) ELSE NULL END) as low_conf_accuracy
      FROM prediction_records
      WHERE actual_outcome IS NOT NULL
      GROUP BY sport
      ORDER BY sport
    `;

    const results = await env.DB.prepare(query).all();

    const comparison = results.results.map(row => ({
      sport: row.sport,
      totalPredictions: row.total_predictions,
      overallAccuracy: Math.round((row.correct_predictions / row.total_predictions) * 1000) / 10,
      brierScore: Math.round(row.avg_brier_score * 1000) / 1000,
      accuracyByConfidence: {
        high: row.high_conf_accuracy ? Math.round(row.high_conf_accuracy * 1000) / 10 : null,
        medium: row.medium_conf_accuracy ? Math.round(row.medium_conf_accuracy * 1000) / 10 : null,
        low: row.low_conf_accuracy ? Math.round(row.low_conf_accuracy * 1000) / 10 : null
      }
    }));

    // Rank sports by accuracy
    comparison.sort((a, b) => b.overallAccuracy - a.overallAccuracy);

    return {
      timestamp: new Date().toISOString(),
      totalSports: comparison.length,
      comparison,
      bestPerformingSport: comparison[0]?.sport || null,
      worstPerformingSport: comparison[comparison.length - 1]?.sport || null
    };

  } catch (error) {
    console.error('Error comparing model performance:', error);
    throw error;
  }
}

/**
 * Get model performance dashboard data
 * @param {Object} env - Cloudflare environment
 * @param {string} sport - Optional sport filter
 * @returns {Promise<Object>} Complete dashboard data
 */
export async function getPerformanceDashboard(env, sport = null) {
  try {
    const [accuracy, calibration, trend, comparison] = await Promise.all([
      getAccuracyMetrics(env, { sport }),
      analyzeCalibration(env, sport),
      getAccuracyTrend(env, sport, 30),
      compareModelPerformance(env)
    ]);

    return {
      timestamp: new Date().toISOString(),
      sport: sport || 'all',
      accuracy,
      calibration,
      trend,
      comparison
    };

  } catch (error) {
    console.error('Error getting performance dashboard:', error);
    throw error;
  }
}
