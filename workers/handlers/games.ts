import type { Env } from '../shared/types';
import { json } from '../shared/helpers';

/**
 * /api/multiplayer/leaderboard — Read top scores from D1.
 * Query: ?game=blitz&limit=25 (default: all games, top 25)
 */
export async function handleLeaderboard(url: URL, env: Env): Promise<Response> {
  const gameId = url.searchParams.get('game');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);

  try {
    let stmt;
    if (gameId) {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard WHERE game_id = ? ORDER BY score DESC LIMIT ?'
      ).bind(gameId, limit);
    } else {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard ORDER BY score DESC LIMIT ?'
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return json(results ?? []);
  } catch (err) {
    // Table might not exist yet — return empty gracefully
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) {
      return json([]);
    }
    return json({ error: msg }, 500);
  }
}

/**
 * POST /api/multiplayer/leaderboard — Submit a score.
 * Body: { name: string, score: number, game: string, avatar?: string }
 */
export async function handleLeaderboardSubmit(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { name?: string; score?: number; game?: string; avatar?: string };

  if (!body.name || typeof body.score !== 'number' || !body.game) {
    return json({ error: 'name, score (number), and game are required' }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leaderboard (player_name, game_id, score, avatar, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(player_name, game_id) DO UPDATE SET
         score = MAX(leaderboard.score, excluded.score),
         avatar = excluded.avatar,
         updated_at = datetime('now')`
    ).bind(body.name, body.game, body.score, body.avatar || '\uD83C\uDFAE').run();

    return json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return json({ error: msg }, 500);
  }
}

export async function handleGameAsset(
  assetPath: string,
  env: Env
): Promise<Response> {
  const object = await env.ASSETS_BUCKET.get(assetPath);

  if (!object) {
    return json({ error: 'Asset not found' }, 404);
  }

  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=86400, immutable',
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
  };

  if (object.httpMetadata?.contentEncoding) {
    headers['Content-Encoding'] = object.httpMetadata.contentEncoding;
  }

  return new Response(object.body, { headers });
}
