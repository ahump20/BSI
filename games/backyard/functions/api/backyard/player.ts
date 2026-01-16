/**
 * Blaze Backyard Baseball - Player Stats API
 *
 * GET /api/backyard/player?id=xxx
 * Returns player stats and unlock status
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface PlayerStats {
  playerId: string;
  playerName: string | null;
  highScore: number;
  gamesPlayed: number;
  totalHits: number;
  totalHomeRuns: number;
  totalSingles: number;
  totalDoubles: number;
  totalTriples: number;
  totalWhiffs: number;
  longestStreak: number;
  totalPlayTimeSeconds: number;
  favoriteCharacterId: string | null;
  unlockedCharacters: string[];
  unlockedFields: string[];
  rank: number;
  createdAt: string;
  updatedAt: string;
}

interface PlayerResponse {
  success: boolean;
  data?: PlayerStats;
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

/** Handle GET request for player stats */
export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    const playerId = url.searchParams.get('id');
    if (!playerId) {
      return jsonResponse({ success: false, error: 'Missing required parameter: id' }, 400);
    }

    // Get player stats
    const player = await env.DB.prepare('SELECT * FROM backyard_players WHERE player_id = ?')
      .bind(playerId)
      .first();

    if (!player) {
      return jsonResponse({ success: false, error: 'Player not found' }, 404);
    }

    // Get player's rank
    const rankResult = await env.DB.prepare(
      `
      SELECT COUNT(*) + 1 as rank FROM backyard_players
      WHERE high_score > ?
    `
    )
      .bind(player.high_score)
      .first();

    // Parse unlocked content
    let unlockedCharacters: string[] = [];
    let unlockedFields: string[] = [];

    try {
      unlockedCharacters = JSON.parse((player.unlocked_characters as string) || '[]');
      unlockedFields = JSON.parse((player.unlocked_fields as string) || '[]');
    } catch {
      // Keep defaults if parse fails
    }

    const stats: PlayerStats = {
      playerId: player.player_id as string,
      playerName: player.player_name as string | null,
      highScore: player.high_score as number,
      gamesPlayed: player.games_played as number,
      totalHits: player.total_hits as number,
      totalHomeRuns: player.total_home_runs as number,
      totalSingles: player.total_singles as number,
      totalDoubles: player.total_doubles as number,
      totalTriples: player.total_triples as number,
      totalWhiffs: player.total_whiffs as number,
      longestStreak: player.longest_streak as number,
      totalPlayTimeSeconds: player.total_play_time_seconds as number,
      favoriteCharacterId: player.favorite_character_id as string | null,
      unlockedCharacters,
      unlockedFields,
      rank: (rankResult?.rank as number) || 1,
      createdAt: player.created_at as string,
      updatedAt: player.updated_at as string,
    };

    return jsonResponse({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Player stats error:', error);
    return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500);
  }
}

/** Helper to create JSON response */
function jsonResponse(data: PlayerResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
