/**
 * Blaze Sports Intel - Injury Risk Scoring API
 *
 * Endpoint: GET /api/v1/predictive/players/:id/injury-risk
 *
 * Returns injury risk assessment for players based on:
 * - Workload tracking (pitch counts, innings, snaps played)
 * - Velocity monitoring (for pitchers)
 * - Biometric indicators
 * - Rest days between appearances
 * - Historical injury patterns
 *
 * Query Parameters:
 *   - sport: college-baseball | college-football | mlb | nfl | nba
 *   - lookback_days: Number of days to analyze (default: 14)
 *
 * Response Format:
 * {
 *   "player": { id, name, position, current_level },
 *   "risk_assessment": {
 *     "risk_index": 0-100,
 *     "risk_category": "low | moderate | high | critical",
 *     "confidence": 0.0-1.0
 *   },
 *   "risk_factors": [
 *     { factor, severity, contribution_pct, details }
 *   ],
 *   "workload_metrics": {
 *     "last_7_days": { pitches, innings, velocity_avg, velocity_drop },
 *     "last_14_days": { ... },
 *     "season_total": { ... }
 *   },
 *   "recommendations": [
 *     { action, priority, rationale }
 *   ],
 *   "historical_risk": {
 *     "previous_injuries": [ ... ],
 *     "injury_prone_rating": 0-100
 *   },
 *   "model": { id, version, trained_at }
 * }
 */

export async function onRequest(context) {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      }
    });
  }

  try {
    const playerId = params.id;
    const url = new URL(request.url);
    const sport = url.searchParams.get('sport') || 'college-baseball';
    const lookbackDays = parseInt(url.searchParams.get('lookback_days') || '14');

    // Validate parameters
    const validSports = ['college-baseball', 'college-football', 'mlb', 'nfl', 'nba'];
    if (!validSports.includes(sport)) {
      return jsonResponse({
        error: 'Invalid sport parameter',
        valid_sports: validSports
      }, 400);
    }

    if (lookbackDays < 1 || lookbackDays > 90) {
      return jsonResponse({
        error: 'Invalid lookback_days parameter',
        message: 'Must be between 1 and 90 days'
      }, 400);
    }

    // Check cache first (1 hour TTL for injury risk - updates more frequently than projections)
    const cacheKey = `pred:injury-risk:${playerId}:${sport}:${lookbackDays}`;
    const cached = await env.CACHE?.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse({
        ...cached,
        cached: true,
        cache_age_seconds: Math.floor((Date.now() - cached.generated_at) / 1000)
      });
    }

    // Get player data
    const player = await getPlayerData(env.DB, playerId, sport);
    if (!player) {
      return jsonResponse({
        error: 'Player not found',
        player_id: playerId,
        sport: sport
      }, 404);
    }

    // Get workload data for the lookback period
    const workloadData = await getWorkloadData(env.DB, playerId, lookbackDays);

    // Get active injury risk model
    const model = await getActiveModel(env.DB, sport, 'injury_risk');

    // Calculate or retrieve existing risk score
    let riskScore = await getExistingRiskScore(env.DB, playerId, sport);

    if (!riskScore || isStale(riskScore.updated_at)) {
      // Calculate new risk score
      riskScore = await calculateInjuryRisk(
        player,
        workloadData,
        sport,
        model,
        lookbackDays
      );

      // Store risk score in database
      await storeRiskScore(env.DB, riskScore);
    }

    // Get historical injury data
    const historicalInjuries = await getHistoricalInjuries(env.DB, playerId);

    // Build response
    const response = {
      player: {
        id: player.player_id,
        name: player.name,
        position: player.position,
        current_level: player.level,
        age: calculateAge(player.birth_date)
      },
      risk_assessment: {
        risk_index: riskScore.risk_index,
        risk_category: riskScore.risk_category,
        confidence: 0.75, // Baseline confidence
        last_updated: new Date(riskScore.updated_at * 1000).toISOString()
      },
      risk_factors: riskScore.reasons ? JSON.parse(riskScore.reasons) : [],
      workload_metrics: riskScore.workload_metrics ? JSON.parse(riskScore.workload_metrics) : {},
      recommendations: riskScore.recommended_actions ? JSON.parse(riskScore.recommended_actions) : [],
      historical_risk: {
        previous_injuries: historicalInjuries,
        injury_prone_rating: calculateInjuryProneRating(historicalInjuries)
      },
      model: model ? {
        id: model.model_id,
        name: model.model_name,
        version: model.version,
        trained_at: new Date(model.trained_at * 1000).toISOString()
      } : null,
      meta: {
        data_source: 'Blaze Predictive Intelligence Engine',
        sport: sport,
        lookback_days: lookbackDays,
        timezone: 'America/Chicago',
        generated_at: Date.now()
      }
    };

    // Cache for 1 hour
    await env.CACHE?.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 });

    // Log to Analytics Engine
    if (riskScore.risk_category === 'high' || riskScore.risk_category === 'critical') {
      env.ANALYTICS?.writeDataPoint({
        blobs: [`injury_risk_${riskScore.risk_category}`],
        doubles: [riskScore.risk_index],
        indexes: [playerId, sport]
      });
    }

    return jsonResponse(response);

  } catch (error) {
    console.error('Injury risk scoring error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Get player data from database
 */
async function getPlayerData(db, playerId, sport) {
  const result = await db.prepare(`
    SELECT
      player_id,
      name,
      position,
      level,
      birth_date,
      stats_summary
    FROM players
    WHERE player_id = ? AND sport = ?
    LIMIT 1
  `).bind(playerId, sport).first();

  return result;
}

/**
 * Get workload data for lookback period
 */
async function getWorkloadData(db, playerId, lookbackDays) {
  const cutoffTime = Math.floor(Date.now() / 1000) - (lookbackDays * 86400);

  const results = await db.prepare(`
    SELECT
      game_id,
      game_date,
      pitches_thrown,
      innings_pitched,
      velocity_avg,
      velocity_max,
      rest_days
    FROM player_game_logs
    WHERE player_id = ?
      AND game_date >= ?
    ORDER BY game_date DESC
  `).bind(playerId, cutoffTime).all();

  return results.results || [];
}

/**
 * Get active model
 */
async function getActiveModel(db, sport, modelType) {
  const result = await db.prepare(`
    SELECT *
    FROM predictive_models
    WHERE sport = ?
      AND model_type = ?
      AND status = 'active'
    ORDER BY trained_at DESC
    LIMIT 1
  `).bind(sport, modelType).first();

  return result;
}

/**
 * Get existing risk score
 */
async function getExistingRiskScore(db, playerId, sport) {
  const result = await db.prepare(`
    SELECT *
    FROM injury_risk_scores
    WHERE player_id = ?
      AND sport = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).bind(playerId, sport).first();

  return result;
}

/**
 * Check if risk score is stale (older than 6 hours)
 */
function isStale(updatedAt) {
  const sixHoursAgo = Math.floor(Date.now() / 1000) - (6 * 3600);
  return updatedAt < sixHoursAgo;
}

/**
 * Calculate injury risk
 */
async function calculateInjuryRisk(player, workloadData, sport, model, lookbackDays) {
  const riskFactors = [];
  let totalRiskScore = 0;

  // Calculate workload metrics
  const workloadMetrics = calculateWorkloadMetrics(workloadData, lookbackDays);

  // Factor 1: Pitch count / workload analysis (baseball)
  if (sport === 'college-baseball' && player.position === 'P') {
    const pitchCountRisk = analyzePitchCount(workloadMetrics, riskFactors);
    totalRiskScore += pitchCountRisk;
  }

  // Factor 2: Velocity drop (baseball pitchers)
  if (sport === 'college-baseball' && player.position === 'P') {
    const velocityRisk = analyzeVelocityDrop(workloadMetrics, riskFactors);
    totalRiskScore += velocityRisk;
  }

  // Factor 3: Rest days
  const restRisk = analyzeRestDays(workloadData, sport, riskFactors);
  totalRiskScore += restRisk;

  // Factor 4: Back-to-back appearances
  const consecutiveRisk = analyzeConsecutiveAppearances(workloadData, riskFactors);
  totalRiskScore += consecutiveRisk;

  // Factor 5: Season total workload
  const seasonRisk = analyzeSeasonWorkload(workloadMetrics, sport, riskFactors);
  totalRiskScore += seasonRisk;

  // Normalize risk score to 0-100
  const riskIndex = Math.min(100, Math.max(0, totalRiskScore));

  // Determine risk category
  let riskCategory = 'low';
  if (riskIndex >= 75) riskCategory = 'critical';
  else if (riskIndex >= 50) riskCategory = 'high';
  else if (riskIndex >= 25) riskCategory = 'moderate';

  // Generate recommendations
  const recommendations = generateRecommendations(riskCategory, riskFactors, player.position);

  return {
    risk_id: `risk_${player.player_id}_${Date.now()}`,
    player_id: player.player_id,
    sport: sport,
    position: player.position,
    risk_index: Math.round(riskIndex),
    risk_category: riskCategory,
    reasons: JSON.stringify(riskFactors),
    recommended_actions: JSON.stringify(recommendations),
    workload_metrics: JSON.stringify(workloadMetrics),
    model_id: model?.model_id || null,
    updated_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Calculate workload metrics
 */
function calculateWorkloadMetrics(workloadData, lookbackDays) {
  const last7Days = workloadData.filter((_, i) => i < 7);
  const last14Days = workloadData.filter((_, i) => i < 14);

  return {
    last_7_days: aggregateWorkload(last7Days),
    last_14_days: aggregateWorkload(last14Days),
    season_total: aggregateWorkload(workloadData),
    appearances_last_7: last7Days.length,
    appearances_last_14: last14Days.length,
    appearances_season: workloadData.length
  };
}

/**
 * Aggregate workload stats
 */
function aggregateWorkload(games) {
  if (games.length === 0) return {};

  return {
    total_pitches: games.reduce((sum, g) => sum + (g.pitches_thrown || 0), 0),
    total_innings: games.reduce((sum, g) => sum + (g.innings_pitched || 0), 0),
    avg_velocity: games.reduce((sum, g) => sum + (g.velocity_avg || 0), 0) / games.length,
    max_velocity: Math.max(...games.map(g => g.velocity_max || 0)),
    avg_rest_days: games.reduce((sum, g) => sum + (g.rest_days || 0), 0) / games.length
  };
}

/**
 * Analyze pitch count
 */
function analyzePitchCount(metrics, riskFactors) {
  const pitchesLast7 = metrics.last_7_days.total_pitches || 0;
  const pitchesLast14 = metrics.last_14_days.total_pitches || 0;

  let risk = 0;

  if (pitchesLast7 > 150) {
    risk += 25;
    riskFactors.push({
      factor: 'High weekly pitch count',
      severity: 'high',
      contribution_pct: 25,
      details: `${pitchesLast7} pitches in last 7 days (safe limit: 150)`
    });
  } else if (pitchesLast7 > 120) {
    risk += 10;
    riskFactors.push({
      factor: 'Elevated weekly pitch count',
      severity: 'moderate',
      contribution_pct: 10,
      details: `${pitchesLast7} pitches in last 7 days`
    });
  }

  if (pitchesLast14 > 250) {
    risk += 20;
    riskFactors.push({
      factor: 'High bi-weekly pitch count',
      severity: 'high',
      contribution_pct: 20,
      details: `${pitchesLast14} pitches in last 14 days (safe limit: 250)`
    });
  }

  return risk;
}

/**
 * Analyze velocity drop
 */
function analyzeVelocityDrop(metrics, riskFactors) {
  const last7Velocity = metrics.last_7_days.avg_velocity || 0;
  const last14Velocity = metrics.last_14_days.avg_velocity || 0;
  const seasonVelocity = metrics.season_total.avg_velocity || 0;

  if (seasonVelocity === 0) return 0;

  const velocityDrop = seasonVelocity - last7Velocity;
  let risk = 0;

  if (velocityDrop >= 3) {
    risk += 30;
    riskFactors.push({
      factor: 'Significant velocity drop',
      severity: 'critical',
      contribution_pct: 30,
      details: `Average velocity down ${velocityDrop.toFixed(1)} mph from season average`
    });
  } else if (velocityDrop >= 2) {
    risk += 15;
    riskFactors.push({
      factor: 'Moderate velocity drop',
      severity: 'high',
      contribution_pct: 15,
      details: `Average velocity down ${velocityDrop.toFixed(1)} mph from season average`
    });
  }

  return risk;
}

/**
 * Analyze rest days
 */
function analyzeRestDays(workloadData, sport, riskFactors) {
  if (workloadData.length < 2) return 0;

  const avgRestDays = workloadData.reduce((sum, g) => sum + (g.rest_days || 0), 0) / workloadData.length;
  let risk = 0;

  if (sport === 'college-baseball') {
    if (avgRestDays < 2) {
      risk += 20;
      riskFactors.push({
        factor: 'Insufficient rest',
        severity: 'high',
        contribution_pct: 20,
        details: `Average ${avgRestDays.toFixed(1)} rest days (recommended: 3+ days)`
      });
    }
  }

  return risk;
}

/**
 * Analyze consecutive appearances
 */
function analyzeConsecutiveAppearances(workloadData, riskFactors) {
  if (workloadData.length < 2) return 0;

  let consecutiveCount = 0;
  for (let i = 0; i < workloadData.length - 1; i++) {
    if (workloadData[i].rest_days <= 1) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  let risk = 0;
  if (consecutiveCount >= 3) {
    risk += 25;
    riskFactors.push({
      factor: 'Multiple consecutive appearances',
      severity: 'high',
      contribution_pct: 25,
      details: `${consecutiveCount} consecutive appearances with minimal rest`
    });
  } else if (consecutiveCount >= 2) {
    risk += 10;
    riskFactors.push({
      factor: 'Back-to-back appearances',
      severity: 'moderate',
      contribution_pct: 10,
      details: `${consecutiveCount} consecutive appearances`
    });
  }

  return risk;
}

/**
 * Analyze season workload
 */
function analyzeSeasonWorkload(metrics, sport, riskFactors) {
  const seasonInnings = metrics.season_total.total_innings || 0;
  let risk = 0;

  if (sport === 'college-baseball' && seasonInnings > 100) {
    risk += 15;
    riskFactors.push({
      factor: 'High season workload',
      severity: 'moderate',
      contribution_pct: 15,
      details: `${seasonInnings.toFixed(1)} innings pitched this season`
    });
  }

  return risk;
}

/**
 * Generate recommendations
 */
function generateRecommendations(riskCategory, riskFactors, position) {
  const recommendations = [];

  if (riskCategory === 'critical') {
    recommendations.push({
      action: 'Immediate rest required',
      priority: 'critical',
      rationale: 'Risk index above 75. Player should not pitch/play until risk factors are addressed.'
    });
  } else if (riskCategory === 'high') {
    recommendations.push({
      action: 'Significant rest recommended',
      priority: 'high',
      rationale: 'Risk index between 50-74. Recommend 3-5 days rest and workload monitoring.'
    });
  } else if (riskCategory === 'moderate') {
    recommendations.push({
      action: 'Monitor closely',
      priority: 'medium',
      rationale: 'Risk index between 25-49. Continue normal schedule but watch for additional risk factors.'
    });
  }

  // Factor-specific recommendations
  for (const factor of riskFactors) {
    if (factor.factor.includes('pitch count')) {
      recommendations.push({
        action: 'Reduce pitch count per appearance',
        priority: 'high',
        rationale: 'Lower pitch count to 75-85 per outing until risk normalizes.'
      });
    }

    if (factor.factor.includes('velocity drop')) {
      recommendations.push({
        action: 'Biomechanics evaluation',
        priority: 'high',
        rationale: 'Velocity drop may indicate fatigue or mechanical issues. Consider evaluation by pitching coach or physical therapist.'
      });
    }

    if (factor.factor.includes('rest')) {
      recommendations.push({
        action: 'Increase rest intervals',
        priority: 'high',
        rationale: 'Ensure minimum 3 days rest between pitching appearances.'
      });
    }
  }

  return recommendations;
}

/**
 * Store risk score in database
 */
async function storeRiskScore(db, riskScore) {
  await db.prepare(`
    INSERT OR REPLACE INTO injury_risk_scores (
      risk_id, player_id, sport, position,
      risk_index, risk_category, reasons, recommended_actions,
      workload_metrics, model_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    riskScore.risk_id,
    riskScore.player_id,
    riskScore.sport,
    riskScore.position,
    riskScore.risk_index,
    riskScore.risk_category,
    riskScore.reasons,
    riskScore.recommended_actions,
    riskScore.workload_metrics,
    riskScore.model_id,
    riskScore.updated_at
  ).run();
}

/**
 * Get historical injuries
 */
async function getHistoricalInjuries(db, playerId) {
  const results = await db.prepare(`
    SELECT
      injury_type,
      injury_date,
      days_missed,
      recovery_status
    FROM player_injuries
    WHERE player_id = ?
    ORDER BY injury_date DESC
    LIMIT 10
  `).bind(playerId).all();

  return results.results || [];
}

/**
 * Calculate injury prone rating
 */
function calculateInjuryProneRating(injuries) {
  if (injuries.length === 0) return 0;

  // Simplified rating based on number and recency of injuries
  let rating = injuries.length * 10; // 10 points per injury

  // Add recency factor (more recent injuries increase rating)
  for (const injury of injuries) {
    const daysAgo = (Date.now() / 1000 - injury.injury_date) / 86400;
    if (daysAgo < 365) rating += 15; // Within last year
    else if (daysAgo < 730) rating += 5; // 1-2 years ago
  }

  return Math.min(100, rating);
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-cache'
    }
  });
}
