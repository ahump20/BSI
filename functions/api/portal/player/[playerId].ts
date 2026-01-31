/**
 * Transfer Portal Player Detail API
 *
 * Returns a single portal entry with changelog timeline.
 * GET /api/portal/player/:playerId
 *
 * Response: { data: PortalEntry, changes: PortalChangeEvent[] }
 */

interface Env {
  KV: KVNamespace;
  GAME_DB: D1Database;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const playerId = params.playerId as string;

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'Player ID required' }), {
      status: 400,
      headers: HEADERS,
    });
  }

  try {
    // Check KV cache first (60s TTL)
    const cacheKey = `portal:player:${playerId}`;
    const cached = await env.KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers: HEADERS });
    }

    const db = env.GAME_DB;

    // Fetch player from D1
    const row = await db
      .prepare('SELECT * FROM transfer_portal WHERE id = ?1')
      .bind(playerId)
      .first<Record<string, unknown>>();

    if (!row) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: HEADERS,
      });
    }

    // Fetch changelog events
    const { results: changeRows } = await db
      .prepare(
        'SELECT id, portal_entry_id, change_type, description, old_value, new_value, event_timestamp FROM transfer_portal_changelog WHERE portal_entry_id = ?1 ORDER BY event_timestamp DESC LIMIT 50'
      )
      .bind(playerId)
      .all();

    // Parse stats_json
    let baseballStats = undefined;
    let footballStats = undefined;
    if (row.stats_json && typeof row.stats_json === 'string') {
      try {
        const parsed = JSON.parse(row.stats_json);
        if (row.sport === 'baseball') baseballStats = parsed;
        else if (row.sport === 'football') footballStats = parsed;
      } catch {
        // Invalid JSON in stats_json — skip
      }
    }

    // Map D1 columns → PortalEntry shape
    const entry = {
      id: row.id as string,
      player_name: row.player_name as string,
      school_from: (row.from_team as string) || '',
      school_to: (row.to_team as string) || null,
      position: (row.position as string) || '',
      conference: (row.from_conference as string) || '',
      class_year: (row.class_year as string) || 'Jr',
      status: (row.status as string) || 'in_portal',
      portal_date: (row.portal_date as string) || '',
      commitment_date: (row.commitment_date as string) || undefined,
      sport: (row.sport as string) || 'baseball',
      engagement_score: (row.engagement_score as number) || undefined,
      stars: (row.stars as number) || undefined,
      overall_rank: (row.overall_rank as number) || undefined,
      baseball_stats: baseballStats,
      football_stats: footballStats,
      headshot_url: (row.headshot_url as string) || undefined,
      highlight_url: (row.highlight_url as string) || undefined,
      is_partial: Boolean(row.is_partial),
      needs_review: Boolean(row.needs_review),
      source_confidence: (row.source_confidence as number) ?? 1.0,
      source_url: (row.source_url as string) || undefined,
      source_id: (row.source_id as string) || undefined,
      verified: Boolean(row.verified),
      source: (row.source_name as string) || '',
      last_verified_at: (row.last_verified_at as string) || '',
      created_at: (row.created_at as string) || '',
      updated_at: (row.updated_at as string) || '',
    };

    const changes = (changeRows || []).map((c: Record<string, unknown>) => ({
      id: c.id,
      portal_entry_id: c.portal_entry_id,
      change_type: c.change_type,
      description: c.description,
      old_value: c.old_value || null,
      new_value: c.new_value || null,
      event_timestamp: c.event_timestamp,
    }));

    const body = JSON.stringify({ data: entry, changes });

    // Cache in KV for 60s
    context.waitUntil(env.KV.put(cacheKey, body, { expirationTtl: 60 }));

    return new Response(body, { headers: HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: HEADERS,
    });
  }
};
