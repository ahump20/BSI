/**
 * Sandlot Sluggers - Cloudflare Worker
 * Serves game assets from R2 and handles stats/leaderboard API.
 */

export interface Env {
  STATIC_ASSETS: Fetcher;
  R2_ASSETS: R2Bucket;
  DB: D1Database;
  KV: KVNamespace;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Strip /games/sandlot-sluggers prefix when served via main site route
    const path = url.pathname.replace(/^\/games\/sandlot-sluggers/, '') || '/';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path);
    }

    // R2 Asset Routes - only for GLB models at /models/
    if (path.startsWith('/models/')) {
      return handleAsset(request, env, path);
    }

    // Serve all other requests from STATIC_ASSETS (built JS, CSS, HTML, images)
    // This includes /assets/* which contains the built game bundle
    const assetUrl = new URL(request.url);
    assetUrl.pathname = path;
    return env.STATIC_ASSETS.fetch(new Request(assetUrl.toString(), request));
  },
};

// ============================================================================
// API Handlers
// ============================================================================

async function handleAPI(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;

  // POST /api/stats - Submit game stats
  if (path === '/api/stats' && method === 'POST') {
    return submitStats(request, env);
  }

  // GET /api/leaderboard - Get top scores
  if (path === '/api/leaderboard' && method === 'GET') {
    return getLeaderboard(request, env);
  }

  // GET /api/session - Get or create session
  if (path === '/api/session' && method === 'GET') {
    return getSession(request, env);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// Submit game stats
async function submitStats(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      sessionId: string;
      mode: string;
      runs: number;
      hits: number;
      homeRuns: number;
      pitchCount: number;
      duration: number;
    };

    const { sessionId, mode, runs, hits, homeRuns, pitchCount, duration } = body;

    if (!sessionId || !mode) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // Insert stats into D1
    await env.DB.prepare(
      `
      INSERT INTO game_stats (session_id, mode, runs, hits, home_runs, pitch_count, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `
    )
      .bind(sessionId, mode, runs || 0, hits || 0, homeRuns || 0, pitchCount || 0, duration || 0)
      .run();

    // Update session stats in KV
    const sessionData = (await env.KV.get(sessionId, 'json')) as {
      totalGames: number;
      totalRuns: number;
      totalHits: number;
      totalHomeRuns: number;
    } | null;

    const updated = {
      totalGames: (sessionData?.totalGames || 0) + 1,
      totalRuns: (sessionData?.totalRuns || 0) + runs,
      totalHits: (sessionData?.totalHits || 0) + hits,
      totalHomeRuns: (sessionData?.totalHomeRuns || 0) + homeRuns,
      lastPlayed: new Date().toISOString(),
    };

    await env.KV.put(sessionId, JSON.stringify(updated), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });

    return jsonResponse({ success: true, stats: updated });
  } catch (err) {
    console.error('Error submitting stats:', err);
    return jsonResponse({ error: 'Failed to submit stats' }, 500);
  }
}

// Get leaderboard
async function getLeaderboard(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'quickPlay';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);

    const results = await env.DB.prepare(
      `
      SELECT
        session_id,
        mode,
        runs,
        hits,
        home_runs,
        pitch_count,
        duration_ms,
        created_at
      FROM game_stats
      WHERE mode = ?
      ORDER BY runs DESC, hits DESC, created_at DESC
      LIMIT ?
    `
    )
      .bind(mode, limit)
      .all();

    return jsonResponse({
      mode,
      entries: results.results || [],
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return jsonResponse({ error: 'Failed to fetch leaderboard' }, 500);
  }
}

// Get or create session
async function getSession(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let sessionId = url.searchParams.get('id');

  // Generate new session ID if not provided
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  // Get existing session data
  const sessionData = await env.KV.get(sessionId, 'json');

  if (sessionData) {
    return jsonResponse({
      sessionId,
      isNew: false,
      stats: sessionData,
    });
  }

  // Create new session
  const newSession = {
    totalGames: 0,
    totalRuns: 0,
    totalHits: 0,
    totalHomeRuns: 0,
    createdAt: new Date().toISOString(),
  };

  await env.KV.put(sessionId, JSON.stringify(newSession), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });

  return jsonResponse({
    sessionId,
    isNew: true,
    stats: newSession,
  });
}

// ============================================================================
// Asset Handlers
// ============================================================================

async function handleAsset(_request: Request, env: Env, path: string): Promise<Response> {
  // Remove leading /models/
  const key = path.slice(8);

  try {
    const object = await env.R2_ASSETS.get(key);

    if (!object) {
      return new Response('Asset not found', { status: 404 });
    }

    const contentType = getContentType(key);

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('Error fetching asset:', err);
    return new Response('Failed to fetch asset', { status: 500 });
  }
}

// ============================================================================
// Utilities
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    glb: 'model/gltf-binary',
    gltf: 'model/gltf+json',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}
