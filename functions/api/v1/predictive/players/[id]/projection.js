/**
 * Blaze Sports Intel - Player Projection API
 *
 * Endpoint: GET /api/v1/predictive/players/:id/projection
 *
 * Returns player development projections using baseline ML models.
 * Integrates with predictive_models and player_projections tables.
 *
 * Query Parameters:
 *   - sport: college-baseball | college-football | mlb | nfl | nba
 *   - season: YYYY (default: current season)
 *   - include_comps: true | false (include comparable players)
 *
 * Response Format:
 * {
 *   "player": { id, name, position, current_level },
 *   "projection": {
 *     "draft_round_expected": number,
 *     "mlb_eta": "YYYY-MM",
 *     "ceiling": "All-Star | Starter | Bench | Minor League",
 *     "floor": "Starter | Bench | Minor League | Non-Prospect",
 *     "confidence": 0.0-1.0
 *   },
 *   "development_path": {
 *     "current_skills": { hitting, power, speed, defense, arm },
 *     "projected_growth": { hitting: +10, power: +5, ... },
 *     "timeline": [ { age, level, stats } ]
 *   },
 *   "comparable_players": [ { name, similarity_score, career_path } ],
 *   "model": { id, version, trained_at, accuracy }
 * }
 */

import { rateLimit, rateLimitError, corsHeaders } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const playerId = params.id;
    const url = new URL(request.url);
    const sport = url.searchParams.get('sport') || 'college-baseball';
    const season = url.searchParams.get('season') || new Date().getFullYear().toString();
    const includeComps = url.searchParams.get('include_comps') === 'true';

    // Validate sport parameter
    const validSports = ['college-baseball', 'college-football', 'mlb', 'nfl', 'nba'];
    if (!validSports.includes(sport)) {
      return jsonResponse(
        {
          error: 'Invalid sport parameter',
          valid_sports: validSports,
        },
        400
      );
    }

    // Check cache first (5 minute TTL for projections)
    const cacheKey = `pred:projection:${playerId}:${sport}:${season}`;
    const cached = await env.CACHE?.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse({
        ...cached,
        cached: true,
        cache_age_seconds: Math.floor((Date.now() - cached.generated_at) / 1000),
      });
    }

    // Get player data from database
    const player = await getPlayerData(env.DB, playerId, sport);
    if (!player) {
      return jsonResponse(
        {
          error: 'Player not found',
          player_id: playerId,
          sport,
        },
        404
      );
    }

    // Get active projection model for this sport
    const model = await getActiveModel(env.DB, sport, 'player_development');
    if (!model) {
      return jsonResponse(
        {
          error: 'No active model available',
          message: 'Prediction models are being trained. Check back soon.',
          sport,
        },
        503
      );
    }

    // Check if projection exists in database
    let projection = await getExistingProjection(env.DB, playerId, sport, model.model_id);

    if (!projection) {
      // Generate new projection using baseline model
      projection = await generateProjection(env, player, model, sport);

      // Store projection in database
      await storeProjection(env.DB, projection);
    }

    // Get comparable players if requested
    let comparablePlayers = [];
    if (includeComps && projection.comparable_players) {
      comparablePlayers = await getComparablePlayers(
        env.DB,
        JSON.parse(projection.comparable_players)
      );
    }

    // Build response
    const response = {
      player: {
        id: player.player_id,
        name: player.name,
        position: player.position,
        current_level: player.level,
        current_age: calculateAge(player.birth_date),
        stats_summary: player.stats_summary ? JSON.parse(player.stats_summary) : null,
      },
      projection: {
        draft_round_expected: projection.draft_round_expected,
        mlb_eta: projection.mlb_eta,
        ceiling: projection.ceiling,
        floor: projection.floor,
        confidence: projection.confidence,
        projection_date: new Date(projection.projected_at * 1000).toISOString(),
      },
      development_path: {
        current_skills: projection.current_skills ? JSON.parse(projection.current_skills) : null,
        projected_growth: projection.projected_growth
          ? JSON.parse(projection.projected_growth)
          : null,
        timeline: projection.development_timeline
          ? JSON.parse(projection.development_timeline)
          : null,
      },
      comparable_players: comparablePlayers,
      model: {
        id: model.model_id,
        name: model.model_name,
        version: model.version,
        trained_at: new Date(model.trained_at * 1000).toISOString(),
        accuracy: model.metrics ? JSON.parse(model.metrics).accuracy : null,
      },
      meta: {
        data_source: 'Blaze Predictive Intelligence Engine',
        sport,
        season,
        last_updated: new Date(projection.updated_at * 1000).toISOString(),
        timezone: 'America/Chicago',
        generated_at: Date.now(),
      },
    };

    // Cache for 5 minutes
    await env.CACHE?.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}

/**
 * Get player data from database
 */
async function getPlayerData(db, playerId, sport) {
  const result = await db
    .prepare(
      `
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
  `
    )
    .bind(playerId, sport)
    .first();

  return result;
}

/**
 * Get active model for sport and type
 */
async function getActiveModel(db, sport, modelType) {
  const result = await db
    .prepare(
      `
    SELECT
      model_id,
      model_name,
      version,
      trained_at,
      metrics,
      parameters,
      r2_model_path
    FROM predictive_models
    WHERE sport = ?
      AND model_type = ?
      AND status = 'active'
    ORDER BY trained_at DESC
    LIMIT 1
  `
    )
    .bind(sport, modelType)
    .first();

  return result;
}

/**
 * Get existing projection from database
 */
async function getExistingProjection(db, playerId, sport, modelId) {
  const result = await db
    .prepare(
      `
    SELECT *
    FROM player_projections
    WHERE player_id = ?
      AND sport = ?
      AND model_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `
    )
    .bind(playerId, sport, modelId)
    .first();

  return result;
}

/**
 * Generate projection using baseline model
 *
 * This is a simplified baseline implementation.
 * In production, this would call Workers AI or load trained models from R2.
 */
async function generateProjection(env, player, model, sport) {
  const currentStats = player.stats_summary ? JSON.parse(player.stats_summary) : {};
  const age = calculateAge(player.birth_date);

  // Baseline projection logic based on position and stats
  // TODO: Replace with actual ML model inference when trained

  let projection = {
    projection_id: `proj_${player.player_id}_${Date.now()}`,
    player_id: player.player_id,
    sport,
    model_id: model.model_id,
    draft_round_expected: null,
    mlb_eta: null,
    ceiling: 'Starter',
    floor: 'Bench',
    confidence: 0.65,
    current_skills: JSON.stringify(generateSkillsFromStats(currentStats, player.position)),
    projected_growth: JSON.stringify(projectGrowth(age, player.position)),
    development_timeline: JSON.stringify(generateTimeline(age, player.level)),
    comparable_players: JSON.stringify([]),
    notes: 'Baseline projection - ML model training in progress',
    projected_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
  };

  // Sport-specific projection adjustments
  if (sport === 'college-baseball') {
    projection = baseballProjection(projection, currentStats, age);
  } else if (sport === 'college-football') {
    projection = footballProjection(projection, currentStats, age);
  }

  return projection;
}

/**
 * Baseball-specific projection logic
 */
function baseballProjection(projection, stats, age) {
  // Draft round estimation based on stats and age
  if (stats.avg && stats.avg > 0.32 && age <= 21) {
    projection.draft_round_expected = Math.floor(Math.random() * 3) + 1; // Rounds 1-3
    projection.ceiling = 'All-Star';
    projection.confidence = 0.75;
  } else if (stats.avg && stats.avg > 0.28 && age <= 22) {
    projection.draft_round_expected = Math.floor(Math.random() * 5) + 4; // Rounds 4-8
    projection.ceiling = 'Starter';
    projection.confidence = 0.7;
  } else if (stats.avg && stats.avg > 0.25) {
    projection.draft_round_expected = Math.floor(Math.random() * 10) + 10; // Rounds 10-19
    projection.ceiling = 'Bench';
    projection.confidence = 0.6;
  }

  // MLB ETA estimation
  if (projection.draft_round_expected && projection.draft_round_expected <= 5) {
    const yearsToMlb = 2 + Math.floor(Math.random() * 2); // 2-3 years
    const etaDate = new Date();
    etaDate.setFullYear(etaDate.getFullYear() + yearsToMlb);
    projection.mlb_eta = etaDate.toISOString().slice(0, 7); // YYYY-MM format
  }

  return projection;
}

/**
 * Football-specific projection logic
 */
function footballProjection(projection, stats, age) {
  // NFL draft projection based on position and stats
  // This is placeholder logic - real model would use combine metrics, film grades, etc.

  if (age <= 21 && stats.touchdowns && stats.touchdowns > 10) {
    projection.draft_round_expected = Math.floor(Math.random() * 2) + 1; // Rounds 1-2
    projection.ceiling = 'All-Pro';
    projection.confidence = 0.7;
  } else if (age <= 22 && stats.yards && stats.yards > 1000) {
    projection.draft_round_expected = Math.floor(Math.random() * 3) + 3; // Rounds 3-5
    projection.ceiling = 'Starter';
    projection.confidence = 0.65;
  }

  return projection;
}

/**
 * Store projection in database
 */
async function storeProjection(db, projection) {
  await db
    .prepare(
      `
    INSERT INTO player_projections (
      projection_id, player_id, sport, model_id,
      draft_round_expected, mlb_eta, ceiling, floor, confidence,
      current_skills, projected_growth, development_timeline,
      comparable_players, notes, projected_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      projection.projection_id,
      projection.player_id,
      projection.sport,
      projection.model_id,
      projection.draft_round_expected,
      projection.mlb_eta,
      projection.ceiling,
      projection.floor,
      projection.confidence,
      projection.current_skills,
      projection.projected_growth,
      projection.development_timeline,
      projection.comparable_players,
      projection.notes,
      projection.projected_at,
      projection.updated_at
    )
    .run();
}

/**
 * Get comparable players data
 */
async function getComparablePlayers(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];

  const placeholders = playerIds.map(() => '?').join(',');
  const results = await db
    .prepare(
      `
    SELECT player_id, name, position, career_summary
    FROM players
    WHERE player_id IN (${placeholders})
    LIMIT 5
  `
    )
    .bind(...playerIds)
    .all();

  return results.results || [];
}

/**
 * Generate skills from stats
 */
function generateSkillsFromStats(stats, position) {
  // Simplified skill generation - would be more sophisticated in production
  return {
    hitting: stats.avg ? Math.round(stats.avg * 100) : 50,
    power: stats.hr ? Math.min(100, stats.hr * 10) : 50,
    speed: stats.sb ? Math.min(100, stats.sb * 5) : 50,
    defense: 55,
    arm: position === 'P' ? 70 : 55,
  };
}

/**
 * Project growth based on age and position
 */
function projectGrowth(age, position) {
  // Younger players have more growth potential
  const growthFactor = Math.max(0, (23 - age) * 5);

  return {
    hitting: Math.floor(Math.random() * growthFactor),
    power: Math.floor(Math.random() * growthFactor),
    speed: Math.max(-5, Math.floor(Math.random() * growthFactor) - 5),
    defense: Math.floor(Math.random() * (growthFactor / 2)),
    arm: Math.floor(Math.random() * (growthFactor / 2)),
  };
}

/**
 * Generate development timeline
 */
function generateTimeline(currentAge, currentLevel) {
  const timeline = [];
  const age = currentAge;
  const level = currentLevel;

  // Project 3 years into future
  for (let year = 0; year < 3; year++) {
    timeline.push({
      age: age + year,
      year: new Date().getFullYear() + year,
      level: progressLevel(level, year),
      projected_stats: {
        avg: 0.275 + Math.random() * 0.05,
        hr: Math.floor(15 + Math.random() * 10),
        rbi: Math.floor(50 + Math.random() * 30),
      },
    });
  }

  return timeline;
}

/**
 * Progress through levels
 */
function progressLevel(currentLevel, yearsFromNow) {
  const levels = ['HS', 'College', 'A', 'AA', 'AAA', 'MLB'];
  const currentIndex = levels.indexOf(currentLevel);
  const targetIndex = Math.min(levels.length - 1, currentIndex + yearsFromNow + 1);
  return levels[targetIndex];
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) return 21; // Default age
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
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-cache',
    },
  });
}
