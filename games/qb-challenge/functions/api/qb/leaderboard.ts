/**
 * Blaze QB Challenge - Leaderboard API
 *
 * GET /api/qb/leaderboard
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  qbId: string;
  gamesPlayed: number;
  totalCompletions: number;
}

interface ApiResponse {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 100);
    const period = url.searchParams.get('period') || 'alltime';

    const cacheKey = `qb:leaderboard:${period}`;

    // Check cache
    const cached = (await env.KV.get(cacheKey, 'json')) as ApiResponse | null;
    if (cached) {
      return jsonResponse({ ...cached, meta: { ...cached.meta!, cached: true } });
    }

    // Query database
    const result = await env.DB.prepare(
      `
      SELECT
        player_id,
        player_name,
        high_score,
        favorite_qb_id,
        games_played,
        total_completions
      FROM qb_players
      ORDER BY high_score DESC
      LIMIT ?
    `
    )
      .bind(limit)
      .all();

    const entries: LeaderboardEntry[] = (result.results || []).map((row, index) => ({
      rank: index + 1,
      playerId: row.player_id as string,
      playerName: (row.player_name as string) || 'Anonymous',
      score: row.high_score as number,
      qbId: row.favorite_qb_id as string,
      gamesPlayed: row.games_played as number,
      totalCompletions: row.total_completions as number,
    }));

    // Get total players
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM qb_players').first();

    const response: ApiResponse = {
      success: true,
      entries,
      meta: {
        period,
        totalPlayers: (countResult?.count as number) || 0,
        lastUpdated: new Date().toISOString(),
        cached: false,
      },
    };

    // Cache for 5 minutes
    await env.KV.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

    return jsonResponse(response);
  } catch (error: unknown) {
    console.error('Leaderboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
}

function jsonResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
