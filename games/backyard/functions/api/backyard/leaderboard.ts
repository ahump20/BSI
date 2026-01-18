/**
 * Blaze Backyard Baseball - Leaderboard API
 *
 * GET /api/backyard/leaderboard
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
  characterId: string | null;
  gamesPlayed: number;
  totalHomeRuns: number;
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
    const characterId = url.searchParams.get('character'); // Filter by character

    // Try to get cached leaderboard
    const cacheKey = `leaderboard:${period}:${limit}:${offset}:${characterId || 'all'}`;
    const cached = await env.KV.get(cacheKey, 'json');

    if (cached) {
      return jsonResponse({
        success: true,
        ...(cached as any),
        meta: {
          ...(cached as any).meta,
          cached: true,
        },
      });
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

    // Character filter
    let characterFilter = '';
    const bindParams: any[] = [];
    if (characterId) {
      characterFilter = 'AND favorite_character_id = ?';
      bindParams.push(characterId);
    }

    // Query top scores
    const query = `
      SELECT
        player_id,
        player_name,
        high_score,
        favorite_character_id,
        games_played,
        total_home_runs
      FROM backyard_players
      WHERE high_score > 0 ${dateFilter} ${characterFilter}
      ORDER BY high_score DESC
      LIMIT ? OFFSET ?
    `;

    bindParams.push(limit, offset);

    const results = await env.DB.prepare(query)
      .bind(...bindParams)
      .all();

    // Transform results with ranks
    const entries: LeaderboardEntry[] = (results.results || []).map((row: any, index: number) => ({
      rank: offset + index + 1,
      playerId: row.player_id,
      playerName: row.player_name || 'Anonymous',
      score: row.high_score,
      characterId: row.favorite_character_id,
      gamesPlayed: row.games_played,
      totalHomeRuns: row.total_home_runs,
    }));

    // Get total player count
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM backyard_players WHERE high_score > 0 ${dateFilter} ${characterFilter}`
    )
      .bind(...(characterId ? [characterId] : []))
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
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500);
  }
}

/** Helper to create JSON response */
function jsonResponse(data: LeaderboardResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
