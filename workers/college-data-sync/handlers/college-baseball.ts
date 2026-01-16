/**
 * College Baseball API Handlers
 *
 * HTTP request handlers for the multi-source college baseball data integration.
 * Uses the data aggregator with automatic failover between NCAA, ESPN, and Highlightly APIs.
 *
 * @author BSI Team
 * @created 2025-01-16
 */

import {
  CollegeBaseballAggregator,
  createAggregator,
  type NormalizedGame,
  type NormalizedStanding,
  type NormalizedRanking,
  type AggregatorResponse,
} from '../../../lib/data-aggregator';

import {
  validateDataset,
  type ValidationResult,
} from '../../../lib/semantic-validation';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Env {
  BSI_DB: D1Database;
  BSI_CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  HIGHLIGHTLY_API_KEY?: string;
  NCAA_API_URL?: string;
}

interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

interface SyncResult {
  success: boolean;
  inserted: number;
  updated?: number;
  source: string;
  fallbackUsed: boolean;
  fallbackSources?: string[];
  cached: boolean;
  duration_ms: number;
  validation?: ValidationResult;
  error?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function getCurrentSeason(): number {
  return new Date().getFullYear();
}

function logToAnalytics(
  env: Env,
  eventType: string,
  dataType: string,
  source: string,
  recordCount: number,
  durationMs: number,
  success: boolean
): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [dataType],
      blobs: [eventType, dataType, source, '3.1.0'],
      doubles: [recordCount, durationMs, success ? 1 : 0, success ? 0 : 1],
    });
  } catch {
    // Ignore analytics errors
  }
}

// =============================================================================
// HANDLER FACTORY
// =============================================================================

function createAggregatorForEnv(env: Env): CollegeBaseballAggregator {
  return createAggregator({
    cache: env.BSI_CACHE,
    highlightlyApiKey: env.HIGHLIGHTLY_API_KEY,
    ncaaApiUrl: env.NCAA_API_URL,
    enabledSources: {
      ncaa: true,
      espn: true,
      highlightly: !!env.HIGHLIGHTLY_API_KEY,
    },
    cacheTTL: {
      liveScores: 60, // 1 minute for live data
      standings: 3600, // 1 hour
      rankings: 3600, // 1 hour
      teams: 86400, // 24 hours
      boxScores: 86400, // 24 hours
    },
  });
}

// =============================================================================
// SYNC HANDLERS
// =============================================================================

/**
 * Sync live games from multi-source aggregator
 */
export async function handleSyncGames(env: Env): Promise<Response> {
  const startTime = Date.now();
  const aggregator = createAggregatorForEnv(env);

  try {
    const response = await aggregator.getLiveScores();

    if (!response.success || !response.data) {
      const duration = Date.now() - startTime;
      logToAnalytics(env, 'sync_failure', 'cbb-games', response.source, 0, duration, false);
      return jsonResponse(
        {
          success: false,
          error: response.error || 'Failed to fetch live scores',
          source: response.source,
          fallbackUsed: response.fallbackUsed,
          fallbackSources: response.fallbackSources,
          duration_ms: duration,
        },
        500
      );
    }

    const games = response.data;

    // Validate data
    const validation = validateDataset('cbb-games-live', games);

    // Only write if in-season and we have data (or it's off-season)
    if (validation.status === 'valid' || validation.status === 'unavailable') {
      const season = getCurrentSeason();
      const now = new Date().toISOString();

      // Upsert games into D1
      for (const game of games) {
        try {
          await env.BSI_DB.prepare(
            `INSERT INTO college_baseball_games (
              game_id, ncaa_game_id, espn_event_id, highlightly_match_id,
              home_team_id, away_team_id, home_team_name, away_team_name,
              home_team_logo, away_team_logo, home_team_rank, away_team_rank,
              home_score, away_score, home_hits, away_hits, home_errors, away_errors,
              status, period, period_half, outs,
              home_linescore, away_linescore,
              scheduled_date, scheduled_time, start_timestamp,
              venue_name, venue_city, venue_state, attendance,
              broadcasts, season, data_source, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(game_id) DO UPDATE SET
              home_score = excluded.home_score,
              away_score = excluded.away_score,
              home_hits = excluded.home_hits,
              away_hits = excluded.away_hits,
              home_errors = excluded.home_errors,
              away_errors = excluded.away_errors,
              status = excluded.status,
              period = excluded.period,
              period_half = excluded.period_half,
              outs = excluded.outs,
              home_linescore = excluded.home_linescore,
              away_linescore = excluded.away_linescore,
              attendance = excluded.attendance,
              updated_at = excluded.updated_at`
          )
            .bind(
              game.gameId,
              game.ncaaGameId || null,
              game.espnEventId || null,
              game.highlightlyMatchId || null,
              game.homeTeam.teamId,
              game.awayTeam.teamId,
              game.homeTeam.name,
              game.awayTeam.name,
              game.homeTeam.logo || null,
              game.awayTeam.logo || null,
              game.homeTeam.rank || null,
              game.awayTeam.rank || null,
              game.homeScore,
              game.awayScore,
              game.homeHits || null,
              game.awayHits || null,
              game.homeErrors || null,
              game.awayErrors || null,
              game.status,
              game.inning || null,
              game.inningHalf || null,
              game.outs || null,
              game.homeLinescore ? JSON.stringify(game.homeLinescore) : null,
              game.awayLinescore ? JSON.stringify(game.awayLinescore) : null,
              game.scheduledDate,
              game.scheduledTime || null,
              game.startTimestamp || null,
              game.venue || null,
              game.city || null,
              game.state || null,
              game.attendance || null,
              game.broadcasts ? JSON.stringify(game.broadcasts) : null,
              season,
              game.dataSource,
              now
            )
            .run();
        } catch (err) {
          console.error(`[sync-games] Failed to upsert game ${game.gameId}:`, err);
        }
      }
    }

    const duration = Date.now() - startTime;
    logToAnalytics(env, 'sync_success', 'cbb-games', response.source, games.length, duration, true);

    const result: SyncResult = {
      success: true,
      inserted: games.length,
      source: response.source,
      fallbackUsed: response.fallbackUsed,
      fallbackSources: response.fallbackSources,
      cached: response.cached,
      duration_ms: duration,
      validation,
    };

    return jsonResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    logToAnalytics(env, 'sync_failure', 'cbb-games', 'unknown', 0, duration, false);

    return jsonResponse(
      {
        success: false,
        error: errorMessage,
        duration_ms: duration,
      },
      500
    );
  }
}

/**
 * Sync standings from multi-source aggregator
 */
export async function handleSyncStandingsMultiSource(env: Env): Promise<Response> {
  const startTime = Date.now();
  const aggregator = createAggregatorForEnv(env);

  try {
    const response = await aggregator.getStandings();

    if (!response.success || !response.data) {
      const duration = Date.now() - startTime;
      logToAnalytics(env, 'sync_failure', 'cbb-standings-multi', response.source, 0, duration, false);
      return jsonResponse(
        {
          success: false,
          error: response.error || 'Failed to fetch standings',
          source: response.source,
          fallbackUsed: response.fallbackUsed,
          duration_ms: duration,
        },
        500
      );
    }

    const standings = response.data;
    const validation = validateDataset('cbb-standings', standings);

    const duration = Date.now() - startTime;
    logToAnalytics(
      env,
      validation.status === 'valid' ? 'sync_success' : 'sync_validation_failed',
      'cbb-standings-multi',
      response.source,
      standings.length,
      duration,
      validation.status === 'valid'
    );

    return jsonResponse({
      success: validation.status === 'valid',
      inserted: standings.length,
      source: response.source,
      fallbackUsed: response.fallbackUsed,
      fallbackSources: response.fallbackSources,
      cached: response.cached,
      duration_ms: duration,
      validation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    logToAnalytics(env, 'sync_failure', 'cbb-standings-multi', 'unknown', 0, duration, false);

    return jsonResponse(
      {
        success: false,
        error: errorMessage,
        duration_ms: duration,
      },
      500
    );
  }
}

/**
 * Sync rankings from multi-source aggregator
 */
export async function handleSyncRankingsMultiSource(env: Env): Promise<Response> {
  const startTime = Date.now();
  const aggregator = createAggregatorForEnv(env);

  try {
    const response = await aggregator.getRankings();

    if (!response.success || !response.data) {
      const duration = Date.now() - startTime;
      logToAnalytics(env, 'sync_failure', 'cbb-rankings-multi', response.source, 0, duration, false);
      return jsonResponse(
        {
          success: false,
          error: response.error || 'Failed to fetch rankings',
          source: response.source,
          fallbackUsed: response.fallbackUsed,
          duration_ms: duration,
        },
        500
      );
    }

    const rankings = response.data;
    const validation = validateDataset('cbb-rankings-d1', rankings);

    const duration = Date.now() - startTime;
    logToAnalytics(
      env,
      validation.status === 'valid' ? 'sync_success' : 'sync_validation_failed',
      'cbb-rankings-multi',
      response.source,
      rankings.length,
      duration,
      validation.status === 'valid'
    );

    return jsonResponse({
      success: validation.status === 'valid',
      inserted: rankings.length,
      source: response.source,
      fallbackUsed: response.fallbackUsed,
      fallbackSources: response.fallbackSources,
      cached: response.cached,
      duration_ms: duration,
      validation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    logToAnalytics(env, 'sync_failure', 'cbb-rankings-multi', 'unknown', 0, duration, false);

    return jsonResponse(
      {
        success: false,
        error: errorMessage,
        duration_ms: duration,
      },
      500
    );
  }
}

// =============================================================================
// DATA RETRIEVAL HANDLERS
// =============================================================================

/**
 * Get live games (with caching)
 */
export async function handleGetLiveGames(env: Env): Promise<Response> {
  const startTime = Date.now();
  const aggregator = createAggregatorForEnv(env);

  try {
    const response = await aggregator.getLiveScores();

    return jsonResponse({
      success: response.success,
      games: response.data || [],
      count: response.data?.length || 0,
      source: response.source,
      fallbackUsed: response.fallbackUsed,
      cached: response.cached,
      timestamp: response.timestamp,
      duration_ms: Date.now() - startTime,
      error: response.error,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      500
    );
  }
}

/**
 * Get today's games from D1 database
 */
export async function handleGetTodayGames(env: Env): Promise<Response> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await env.BSI_DB.prepare(
      `SELECT * FROM college_baseball_games
       WHERE scheduled_date = ?
       ORDER BY start_timestamp ASC, home_team_name ASC`
    )
      .bind(today)
      .all();

    // Parse JSON fields
    const games = (result.results || []).map((game: Record<string, unknown>) => ({
      ...game,
      homeLinescore: game.home_linescore ? JSON.parse(game.home_linescore as string) : null,
      awayLinescore: game.away_linescore ? JSON.parse(game.away_linescore as string) : null,
      broadcasts: game.broadcasts ? JSON.parse(game.broadcasts as string) : null,
    }));

    return jsonResponse({
      success: true,
      date: today,
      count: games.length,
      games,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
        hint: 'Run migration 0001_college_baseball_extended.sql first',
      },
      500
    );
  }
}

/**
 * Get games by date from D1 database
 */
export async function handleGetGamesByDate(env: Env, url: URL): Promise<Response> {
  const date = url.searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonResponse(
      {
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      },
      400
    );
  }

  try {
    const result = await env.BSI_DB.prepare(
      `SELECT * FROM college_baseball_games
       WHERE scheduled_date = ?
       ORDER BY start_timestamp ASC, home_team_name ASC`
    )
      .bind(date)
      .all();

    const games = (result.results || []).map((game: Record<string, unknown>) => ({
      ...game,
      homeLinescore: game.home_linescore ? JSON.parse(game.home_linescore as string) : null,
      awayLinescore: game.away_linescore ? JSON.parse(game.away_linescore as string) : null,
      broadcasts: game.broadcasts ? JSON.parse(game.broadcasts as string) : null,
    }));

    return jsonResponse({
      success: true,
      date,
      count: games.length,
      games,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
      },
      500
    );
  }
}

/**
 * Get games by team
 */
export async function handleGetGamesByTeam(env: Env, url: URL): Promise<Response> {
  const teamId = url.searchParams.get('team');
  const season = parseInt(url.searchParams.get('season') || String(getCurrentSeason()), 10);

  if (!teamId) {
    return jsonResponse(
      {
        success: false,
        error: 'Missing required parameter: team',
      },
      400
    );
  }

  try {
    const result = await env.BSI_DB.prepare(
      `SELECT * FROM college_baseball_games
       WHERE (home_team_id = ? OR away_team_id = ?)
       AND season = ?
       ORDER BY scheduled_date DESC, start_timestamp DESC
       LIMIT 100`
    )
      .bind(teamId.toLowerCase(), teamId.toLowerCase(), season)
      .all();

    return jsonResponse({
      success: true,
      team: teamId,
      season,
      count: result.results?.length || 0,
      games: result.results || [],
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
      },
      500
    );
  }
}

// =============================================================================
// HEALTH & STATUS HANDLERS
// =============================================================================

/**
 * Get API source health status
 */
export async function handleSourceHealth(env: Env): Promise<Response> {
  const startTime = Date.now();
  const aggregator = createAggregatorForEnv(env);

  try {
    const healthStatus = await aggregator.checkAllSourceHealth();

    const allHealthy = healthStatus.every((s) => s.healthy);
    const someHealthy = healthStatus.some((s) => s.healthy);

    return jsonResponse({
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      sources: healthStatus,
      enabledSources: {
        ncaa: true,
        espn: true,
        highlightly: !!env.HIGHLIGHTLY_API_KEY,
      },
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      500
    );
  }
}

/**
 * Get teams from D1 database
 */
export async function handleGetTeams(env: Env, url: URL): Promise<Response> {
  const conference = url.searchParams.get('conference');
  const division = url.searchParams.get('division') || 'D1';

  try {
    let query = `SELECT * FROM college_baseball_teams WHERE division = ?`;
    const params: (string | number)[] = [division];

    if (conference) {
      query += ` AND conference = ?`;
      params.push(conference);
    }

    query += ` ORDER BY conference, team_name LIMIT 500`;

    const result = await env.BSI_DB.prepare(query).bind(...params).all();

    // Get available conferences
    const confResult = await env.BSI_DB.prepare(
      `SELECT DISTINCT conference FROM college_baseball_teams WHERE division = ? ORDER BY conference`
    )
      .bind(division)
      .all();

    return jsonResponse({
      success: true,
      division,
      filter: conference || 'all',
      count: result.results?.length || 0,
      availableConferences:
        confResult.results?.map((r: Record<string, unknown>) => r.conference) || [],
      teams: result.results || [],
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
        hint: 'Run migration 0001_college_baseball_extended.sql first',
      },
      500
    );
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const collegeBaseballHandlers = {
  // Sync endpoints
  handleSyncGames,
  handleSyncStandingsMultiSource,
  handleSyncRankingsMultiSource,

  // Data retrieval
  handleGetLiveGames,
  handleGetTodayGames,
  handleGetGamesByDate,
  handleGetGamesByTeam,
  handleGetTeams,

  // Health
  handleSourceHealth,
};
