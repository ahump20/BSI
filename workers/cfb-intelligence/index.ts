/**
 * College Football Intelligence Engine
 *
 * Real-time game tracking, advanced analytics (EPA, success rate),
 * and upset probability modeling for FCS and Group of Five teams.
 *
 * Cron Triggers:
 * - */5 * * * *  : Live game updates (every 5 minutes during game days)
 *
 * Features:
 * - FCS/Group-of-Five priority feed
 * - EPA and success rate tracking
 * - Monte Carlo upset probability engine
 * - Recruiting class impact analysis
 */

export interface Env {
  DB: D1Database;
  CFB_CACHE: KVNamespace;
  GAME_DATA: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface Team {
  id: string;
  name: string;
  conference: string;
  division: string; // FBS, FCS, D2, D3
  recruiting_rank?: number;
}

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  status: 'scheduled' | 'live' | 'final';
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
}

interface GameAnalytics {
  game_id: string;
  timestamp: string;
  home_epa: number;
  away_epa: number;
  home_success_rate: number;
  away_success_rate: number;
  home_win_probability: number;
  upset_probability: number;
}

export default {
  /**
   * HTTP handler for API endpoints
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for mobile app
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/cfb/games/live') {
        return await handleLiveGames(env, corsHeaders);
      }

      if (path === '/cfb/games/upsets') {
        return await handleUpsetAlerts(env, corsHeaders);
      }

      if (path.startsWith('/cfb/team/')) {
        const teamId = path.split('/').pop();
        return await handleTeamAnalytics(env, teamId!, corsHeaders);
      }

      if (path === '/cfb/recruiting/impact') {
        return await handleRecruitingImpact(env, corsHeaders);
      }

      if (path === '/cfb/ingest') {
        // Manual trigger for data ingestion
        return await ingestGameData(env, corsHeaders);
      }

      if (path === '/health' || path === '/cfb/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'cfb-intelligence'
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error('[CFB Intelligence] Request failed:', error);

      // Track error in Analytics Engine
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['cfb_error', path],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

      return new Response(JSON.stringify({
        error: 'Internal server error',
        details: (error as Error).message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[CFB Intelligence] Cron triggered');

    try {
      // Run every 5 minutes during game days
      ctx.waitUntil(ingestGameData(env, {}));

      // Track success
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['cfb_ingest_success'],
          doubles: [1],
          indexes: [new Date().toISOString()]
        });
      }
    } catch (error) {
      console.error('[CFB Intelligence] Cron execution failed:', error);

      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['cfb_ingest_error'],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

      throw error;
    }
  }
};

/**
 * Get live games with FCS/Group-of-Five priority sorting
 */
async function handleLiveGames(env: Env, headers: Record<string, string>): Promise<Response> {
  // Check KV cache first (30s TTL)
  const cached = await env.CFB_CACHE.get('live_games', 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  const { results } = await env.DB.prepare(`
    SELECT
      g.id,
      g.home_team_id,
      g.away_team_id,
      ht.name as home_team,
      at.name as away_team,
      ht.division as home_division,
      at.division as away_division,
      g.home_score,
      g.away_score,
      g.quarter,
      g.time_remaining,
      ga.home_epa,
      ga.away_epa,
      ga.home_success_rate,
      ga.away_success_rate,
      ga.home_win_probability,
      ga.upset_probability
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE g.status = 'live'
    AND ga.timestamp = (
      SELECT MAX(timestamp)
      FROM game_analytics
      WHERE game_id = g.id
    )
    ORDER BY
      CASE
        WHEN ht.division = 'FCS' OR at.division = 'FCS' THEN 0
        WHEN ht.conference IN ('MAC', 'Sun Belt', 'C-USA', 'MWC', 'AAC') THEN 1
        ELSE 2
      END,
      ga.upset_probability DESC
  `).all();

  await env.CFB_CACHE.put('live_games', JSON.stringify(results), {
    expirationTtl: 30
  });

  return new Response(JSON.stringify(results), { headers });
}

/**
 * Get upset alert games (underdog win probability > 30%)
 */
async function handleUpsetAlerts(env: Env, headers: Record<string, string>): Promise<Response> {
  const cached = await env.CFB_CACHE.get('upset_alerts', 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  // Games where underdog has >30% win probability
  const { results } = await env.DB.prepare(`
    SELECT
      g.id,
      ht.name as home_team,
      at.name as away_team,
      ht.division as home_division,
      at.division as away_division,
      g.home_score,
      g.away_score,
      g.status,
      g.scheduled_time,
      ga.upset_probability,
      ga.home_win_probability,
      CASE
        WHEN ga.home_win_probability < 0.5 THEN 'home_underdog'
        ELSE 'away_underdog'
      END as underdog
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    JOIN game_analytics ga ON g.id = ga.game_id
    WHERE ga.upset_probability > 0.30
    AND g.status IN ('scheduled', 'live')
    AND ga.timestamp = (
      SELECT MAX(timestamp)
      FROM game_analytics
      WHERE game_id = g.id
    )
    ORDER BY ga.upset_probability DESC
    LIMIT 20
  `).all();

  await env.CFB_CACHE.put('upset_alerts', JSON.stringify(results), {
    expirationTtl: 300
  });

  return new Response(JSON.stringify(results), { headers });
}

/**
 * Get team analytics with season stats
 */
async function handleTeamAnalytics(
  env: Env,
  teamId: string,
  headers: Record<string, string>
): Promise<Response> {
  const cacheKey = `team_${teamId}`;
  const cached = await env.CFB_CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  // Team overview with season stats
  const { results: teamData } = await env.DB.prepare(`
    SELECT
      t.id,
      t.name,
      t.conference,
      t.division,
      t.recruiting_rank,
      COUNT(DISTINCT g.id) as games_played,
      SUM(CASE
        WHEN (g.home_team_id = t.id AND g.home_score > g.away_score)
          OR (g.away_team_id = t.id AND g.away_score > g.home_score)
        THEN 1 ELSE 0
      END) as wins,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_epa
        ELSE ga.away_epa
      END) as avg_epa,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END) as avg_success_rate
    FROM teams t
    LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      AND g.status = 'final'
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE t.id = ?
    GROUP BY t.id
  `).bind(teamId).all();

  if (!teamData || teamData.length === 0) {
    return new Response(JSON.stringify({ error: 'Team not found' }), {
      status: 404,
      headers
    });
  }

  // Recent games with analytics
  const { results: recentGames } = await env.DB.prepare(`
    SELECT
      g.id,
      g.scheduled_time,
      CASE
        WHEN g.home_team_id = ? THEN at.name
        ELSE ht.name
      END as opponent,
      CASE
        WHEN g.home_team_id = ? THEN 'home'
        ELSE 'away'
      END as location,
      g.home_score,
      g.away_score,
      CASE
        WHEN g.home_team_id = ? THEN ga.home_epa
        ELSE ga.away_epa
      END as team_epa,
      CASE
        WHEN g.home_team_id = ? THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END as team_success_rate
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
    AND g.status = 'final'
    ORDER BY g.scheduled_time DESC
    LIMIT 10
  `).bind(teamId, teamId, teamId, teamId, teamId, teamId).all();

  const response = {
    team: teamData[0],
    recent_games: recentGames
  };

  await env.CFB_CACHE.put(cacheKey, JSON.stringify(response), {
    expirationTtl: 600
  });

  return new Response(JSON.stringify(response), { headers });
}

/**
 * Analyze recruiting impact on performance
 */
async function handleRecruitingImpact(env: Env, headers: Record<string, string>): Promise<Response> {
  // Correlate recruiting rankings to on-field performance
  const { results } = await env.DB.prepare(`
    SELECT
      t.name,
      t.conference,
      t.division,
      t.recruiting_rank,
      COUNT(DISTINCT g.id) as games_played,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_epa
        ELSE ga.away_epa
      END) as avg_epa,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END) as avg_success_rate
    FROM teams t
    LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      AND g.status = 'final'
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE t.recruiting_rank IS NOT NULL
    GROUP BY t.id
    HAVING games_played >= 5
    ORDER BY t.recruiting_rank ASC
    LIMIT 50
  `).all();

  // Calculate correlation coefficient
  const rankings = results.map((r: any) => r.recruiting_rank);
  const epas = results.map((r: any) => r.avg_epa || 0);

  const correlation = calculateCorrelation(rankings, epas);

  return new Response(JSON.stringify({
    teams: results,
    correlation: {
      recruiting_to_epa: correlation,
      interpretation: correlation < -0.5
        ? 'Strong negative correlation: higher recruiting ranks (lower numbers) correlate with better EPA'
        : 'Weak correlation: recruiting rank doesn\'t strongly predict performance'
    }
  }), { headers });
}

/**
 * Ingest game data from external sources
 */
async function ingestGameData(env: Env, headers: Record<string, string>): Promise<Response> {
  const timestamp = new Date().toISOString();

  console.log('[CFB Intelligence] Starting data ingestion...');

  try {
    // TODO: Integrate with real data sources:
    // 1. Fetch from NCAA stats API / ESPN / team websites
    // 2. Parse box scores, play-by-play for EPA calculation
    // 3. Run Monte Carlo simulations for upset probability
    // 4. Store in D1, cache in KV

    // Placeholder for demonstration
    const gamesProcessed = 0;

    // Store ingestion log to R2 for audit trail
    await env.GAME_DATA.put(
      `ingestion_logs/${timestamp}.json`,
      JSON.stringify({
        timestamp,
        status: 'completed',
        games_processed: gamesProcessed
      })
    );

    console.log(`[CFB Intelligence] Data ingestion completed: ${gamesProcessed} games`);

    return new Response(JSON.stringify({
      success: true,
      timestamp,
      games_processed: gamesProcessed
    }), { headers });
  } catch (error) {
    console.error('[CFB Intelligence] Data ingestion failed:', error);

    // Store error log to R2
    await env.GAME_DATA.put(
      `ingestion_logs/error_${timestamp}.json`,
      JSON.stringify({
        timestamp,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );

    throw error;
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}
