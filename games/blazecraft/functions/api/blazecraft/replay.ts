/**
 * Blazecraft Replay API
 *
 * GET /api/blazecraft/replay?id={id} - Get single replay
 * GET /api/blazecraft/replay - List recent replays
 */

interface Env {
  DB: D1Database;
  BLAZECRAFT_REPLAYS: R2Bucket;
  BLAZECRAFT_CACHE: KVNamespace;
}

interface ReplayRow {
  id: string;
  title: string | null;
  map: string;
  agents: string;
  duration: number;
  uploaded_at: string;
  file_key: string;
  file_size: number;
  metadata: string | null;
  tags: string | null;
  is_public: number;
  view_count: number;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// GET Handler
// ─────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const replayId = url.searchParams.get('id');

  // If ID provided, return single replay with file
  if (replayId) {
    return getReplayById(env, replayId);
  }

  // Otherwise, list recent replays
  return listReplays(env, url.searchParams);
};

// ─────────────────────────────────────────────────────────────
// Get Single Replay
// ─────────────────────────────────────────────────────────────

async function getReplayById(env: Env, id: string): Promise<Response> {
  try {
    // Check cache first
    const cached = await env.BLAZECRAFT_CACHE.get(`replay:${id}`, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    // Get metadata from D1
    const result = await env.DB.prepare(
      'SELECT * FROM replays WHERE id = ?'
    ).bind(id).first<ReplayRow>();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Replay not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get replay file from R2
    const file = await env.BLAZECRAFT_REPLAYS.get(result.file_key);
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Replay file not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const replayData = await file.json();

    // Increment view count (fire and forget)
    env.DB.prepare(
      'UPDATE replays SET view_count = view_count + 1 WHERE id = ?'
    ).bind(id).run();

    // Build response
    const response = {
      id: result.id,
      title: result.title,
      map: result.map,
      agents: JSON.parse(result.agents),
      duration: result.duration,
      uploadedAt: result.uploaded_at,
      fileSize: result.file_size,
      metadata: result.metadata ? JSON.parse(result.metadata) : null,
      tags: result.tags ? JSON.parse(result.tags) : [],
      viewCount: result.view_count + 1,
      replay: replayData,
    };

    // Cache for 5 minutes
    await env.BLAZECRAFT_CACHE.put(
      `replay:${id}`,
      JSON.stringify(response),
      { expirationTtl: 300 }
    );

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('Error fetching replay:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch replay' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// List Replays
// ─────────────────────────────────────────────────────────────

async function listReplays(
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  try {
    const limit = Math.min(parseInt(params.get('limit') ?? '20'), 100);
    const offset = parseInt(params.get('offset') ?? '0');
    const map = params.get('map');
    const sortBy = params.get('sort') ?? 'uploaded_at';

    // Build query
    let query = 'SELECT id, title, map, agents, duration, uploaded_at, file_size, view_count FROM replays WHERE is_public = 1';
    const bindings: (string | number)[] = [];

    if (map) {
      query += ' AND map = ?';
      bindings.push(map);
    }

    // Sort
    const sortColumn = ['uploaded_at', 'view_count', 'duration'].includes(sortBy)
      ? sortBy
      : 'uploaded_at';
    query += ` ORDER BY ${sortColumn} DESC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const results = await env.DB.prepare(query)
      .bind(...bindings)
      .all<ReplayRow>();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM replays WHERE is_public = 1';
    if (map) {
      countQuery += ' AND map = ?';
    }
    const countResult = await env.DB.prepare(countQuery)
      .bind(...(map ? [map] : []))
      .first<{ count: number }>();

    const replays = (results.results ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      map: row.map,
      agents: JSON.parse(row.agents),
      duration: row.duration,
      uploadedAt: row.uploaded_at,
      fileSize: row.file_size,
      viewCount: row.view_count,
    }));

    return new Response(JSON.stringify({
      replays,
      pagination: {
        total: countResult?.count ?? 0,
        limit,
        offset,
        hasMore: offset + replays.length < (countResult?.count ?? 0),
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error listing replays:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list replays' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
