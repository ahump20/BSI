/**
 * Transfer Portal Live Wire Feed
 *
 * Polling endpoint returning latest changelog events.
 * GET /api/portal/wire?since=ISO8601&limit=20&sport=baseball|football
 *
 * Response: { events: PortalChangeEvent[], last_checked: string }
 */

interface Env {
  KV: KVNamespace;
  GAME_DB: D1Database;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=15',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  try {
    const since = url.searchParams.get('since');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const sport = url.searchParams.get('sport');

    // KV cache key based on params
    const cacheKey = `portal:wire:${sport || 'all'}:${since || 'latest'}:${limit}`;
    const cached = await env.KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers: HEADERS });
    }

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 0;

    if (since) {
      conditions.push(`c.event_timestamp > ?${++idx}`);
      params.push(since);
    }
    if (sport) {
      conditions.push(`c.sport = ?${++idx}`);
      params.push(sport);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT c.id, c.portal_entry_id, c.change_type, c.description,
             c.event_timestamp, c.old_value, c.new_value,
             p.player_name, p.sport, p.from_team, p.to_team, p.position
      FROM transfer_portal_changelog c
      LEFT JOIN transfer_portal p ON c.portal_entry_id = p.id
      ${whereClause}
      ORDER BY c.event_timestamp DESC
      LIMIT ${limit}
    `;

    const { results } = await env.GAME_DB.prepare(query)
      .bind(...params)
      .all();

    const events = (results || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      portal_entry_id: row.portal_entry_id,
      change_type: row.change_type,
      description: row.description,
      event_timestamp: row.event_timestamp,
      player_name: (row.player_name as string) || undefined,
      sport: (row.sport as string) || undefined,
      school_from: (row.from_team as string) || undefined,
      school_to: (row.to_team as string) || undefined,
      position: (row.position as string) || undefined,
    }));

    const body = JSON.stringify({
      events,
      last_checked: new Date().toISOString(),
    });

    // Cache 15s for freshness
    context.waitUntil(env.KV.put(cacheKey, body, { expirationTtl: 15 }));

    return new Response(body, { headers: HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ events: [], last_checked: new Date().toISOString(), error: message }),
      { status: 500, headers: HEADERS }
    );
  }
};
