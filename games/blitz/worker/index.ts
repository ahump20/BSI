/**
 * Blaze Blitz Football - Cloudflare Worker
 *
 * Serves the game and handles:
 * - Static asset serving from R2/Assets
 * - Leaderboard API (D1)
 * - Player sessions (KV)
 */

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  STATIC_ASSETS: Fetcher;
  ENVIRONMENT: string;
  GAME_VERSION: string;
}

// Leaderboard entry type
interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  score: number;
  touchdowns: number;
  yards_gained: number;
  game_mode: string;
  created_at: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/games/blitz', '');

    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API routes
    if (path.startsWith('/api/')) {
      return handleAPI(path, request, env, corsHeaders);
    }

    // Serve static assets - assets are at dist/games/blitz/ matching the route
    try {
      const response = await env.STATIC_ASSETS.fetch(request);
      if (response.status === 404) {
        throw new Error('Asset not found');
      }
      const newHeaders = new Headers(response.headers);
      if (path.includes('/assets/')) {
        newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        newHeaders.set('Cache-Control', 'public, max-age=3600');
      }
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch {
      // Fallback to index.html for SPA routing
      const indexUrl = new URL('/games/blitz/index.html', url.origin);
      return env.STATIC_ASSETS.fetch(new Request(indexUrl, request));
    }
  },
};

async function handleAPI(
  path: string,
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const apiPath = path.replace('/api', '');

  // GET /api/leaderboard - Get top scores
  if (apiPath === '/leaderboard' && request.method === 'GET') {
    return getLeaderboard(env, corsHeaders);
  }

  // POST /api/leaderboard - Submit score
  if (apiPath === '/leaderboard' && request.method === 'POST') {
    return submitScore(request, env, corsHeaders);
  }

  // GET /api/health - Health check
  if (apiPath === '/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        version: env.GAME_VERSION,
        environment: env.ENVIRONMENT,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getLeaderboard(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // Try cache first
  const cached = await env.CACHE.get('blitz:leaderboard:top50', 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare(
      `
      SELECT
        player_id,
        player_name,
        score,
        touchdowns,
        yards_gained,
        game_mode,
        created_at
      FROM blitz_leaderboard
      ORDER BY score DESC
      LIMIT 50
    `
    ).all<LeaderboardEntry>();

    const leaderboard = result.results || [];

    // Cache for 5 minutes
    await env.CACHE.put('blitz:leaderboard:top50', JSON.stringify(leaderboard), {
      expirationTtl: 300,
    });

    return new Response(JSON.stringify(leaderboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // If table doesn't exist, return empty array
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function submitScore(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      player_name: string;
      score: number;
      touchdowns: number;
      yards_gained: number;
      game_mode?: string;
    };

    // Validate input
    if (!body.player_name || typeof body.score !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate player ID (or use existing from session)
    const playerId = crypto.randomUUID();

    await env.DB.prepare(
      `
      INSERT INTO blitz_leaderboard (
        player_id,
        player_name,
        score,
        touchdowns,
        yards_gained,
        game_mode,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `
    )
      .bind(
        playerId,
        body.player_name.substring(0, 32),
        body.score,
        body.touchdowns || 0,
        body.yards_gained || 0,
        body.game_mode || 'standard'
      )
      .run();

    // Invalidate cache
    await env.CACHE.delete('blitz:leaderboard:top50');

    return new Response(JSON.stringify({ success: true, player_id: playerId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to submit score' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
