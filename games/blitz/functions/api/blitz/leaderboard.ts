/**
 * Blaze Blitz Football - Leaderboard API
 *
 * GET /api/blitz/leaderboard
 * Returns top scores with caching
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string | null;
  score: number;
  teamId: string | null;
  gamesPlayed: number;
  totalTouchdowns: number;
  totalYards: number;
}

interface LeaderboardResponse {
  success: boolean;
  entries?: LeaderboardEntry[];
  meta?: {
    period: string;
    totalPlayers: number;
    lastUpdated: string;
    cached: boolean;
  };
  error?: string;
}

/** CORS headers */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/** Handle OPTIONS preflight */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

/** Handle GET request for leaderboard */
export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // Parse query parameters
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const period = url.searchParams.get('period') || 'alltime'; // alltime, daily, weekly
    const teamId = url.searchParams.get('team'); // Filter by team

    // Try to get cached leaderboard
    const cacheKey = `blitz:leaderboard:${period}:${limit}:${offset}:${teamId || 'all'}`;
    const cached = await env.KV.get(cacheKey, 'json');

    if (cached) {
      return jsonResponse({
        success: true,
        ...(cached as object),
        meta: {
          ...(cached as { meta?: object }).meta,
          cached: true,
        },
      } as LeaderboardResponse);
    }

    // Build query based on period
    let dateFilter = '';
    if (period === 'daily') {
      dateFilter = "AND DATE(updated_at) = DATE('now')";
    } else if (period === 'weekly') {
      dateFilter = "AND updated_at >= DATE('now', '-7 days')";
    } else if (period === 'monthly') {
      dateFilter = "AND updated_at >= DATE('now', '-30 days')";
    }

    // Team filter
    let teamFilter = '';
    const bindParams: (string | number)[] = [];
    if (teamId) {
      teamFilter = 'AND favorite_team_id = ?';
      bindParams.push(teamId);
    }

    // Query top scores
    const query = `
      SELECT
        player_id,
        player_name,
        high_score,
        favorite_team_id,
        games_played,
        total_touchdowns,
        total_yards
      FROM blitz_players
      WHERE high_score > 0 ${dateFilter} ${teamFilter}
      ORDER BY high_score DESC
      LIMIT ? OFFSET ?
    `;

    bindParams.push(limit, offset);

    const results = await env.DB.prepare(query)
      .bind(...bindParams)
      .all();

    // Transform results with ranks
    const entries: LeaderboardEntry[] = (results.results || []).map(
      (row: Record<string, unknown>, index: number) => ({
        rank: offset + index + 1,
        playerId: row.player_id as string,
        playerName: (row.player_name as string) || 'Anonymous',
        score: row.high_score as number,
        teamId: row.favorite_team_id as string | null,
        gamesPlayed: row.games_played as number,
        totalTouchdowns: row.total_touchdowns as number,
        totalYards: row.total_yards as number,
      })
    );

    // Get total player count
    const countQuery = `SELECT COUNT(*) as count FROM blitz_players WHERE high_score > 0 ${dateFilter} ${teamFilter}`;
    const countBindParams = teamId ? [teamId] : [];
    const countResult = await env.DB.prepare(countQuery)
      .bind(...countBindParams)
      .first();

    const response: LeaderboardResponse = {
      success: true,
      entries,
      meta: {
        period,
        totalPlayers: (countResult?.count as number) || 0,
        lastUpdated: new Date().toISOString(),
        cached: false,
      },
    };

    // Cache for 5 minutes (alltime) or 1 minute (daily/weekly)
    const cacheTtl = period === 'alltime' ? 300 : 60;
    await env.KV.put(cacheKey, JSON.stringify(response), { expirationTtl: cacheTtl });

    return jsonResponse(response);
  } catch (error: unknown) {
    console.error('Leaderboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
}

/** Helper to create JSON response */
function jsonResponse(data: LeaderboardResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
