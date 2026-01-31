/**
 * Transfer Portal Freshness API
 *
 * Returns last-updated timestamp, recent changelog events,
 * and pipeline health status. Used by the UI for the freshness
 * indicator and "Recent Changes" strip.
 *
 * GET /api/portal/freshness?limit=20&sport=baseball
 */

interface Env {
  GAME_DB: D1Database;
  KV: KVNamespace;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=15',
};

// Freshness thresholds (minutes)
const LIVE_THRESHOLD = 10;
const DELAYED_THRESHOLD = 30;

interface ChangelogRow {
  id: string;
  portal_entry_id: string;
  change_type: string;
  description: string;
  event_timestamp: string;
  player_name: string | null;
  sport: string | null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
    const sport = url.searchParams.get('sport');

    // Get KV freshness marker
    const lastUpdated = await env.KV.get('portal:last_updated');
    const now = new Date();

    // Determine freshness status
    let status: 'live' | 'delayed' | 'stale' = 'stale';
    if (lastUpdated) {
      const ageMinutes = (now.getTime() - new Date(lastUpdated).getTime()) / 60000;
      if (ageMinutes <= LIVE_THRESHOLD) status = 'live';
      else if (ageMinutes <= DELAYED_THRESHOLD) status = 'delayed';
    }

    // Fetch recent changelog with player info
    let query = `
      SELECT c.id, c.portal_entry_id, c.change_type, c.description,
             c.event_timestamp, t.player_name, t.sport
      FROM transfer_portal_changelog c
      LEFT JOIN transfer_portal t ON c.portal_entry_id = t.id
    `;
    const params: string[] = [];
    if (sport) {
      query += ' WHERE t.sport = ?1';
      params.push(sport);
    }
    query += ' ORDER BY c.event_timestamp DESC LIMIT ' + limit;

    const result = params.length > 0
      ? await env.GAME_DB.prepare(query).bind(...params).all<ChangelogRow>()
      : await env.GAME_DB.prepare(query).all<ChangelogRow>();

    const recentChanges = (result.results || []).map((row) => ({
      id: row.id,
      portal_entry_id: row.portal_entry_id,
      change_type: row.change_type,
      description: row.description,
      event_timestamp: row.event_timestamp,
      player_name: row.player_name,
      sport: row.sport,
    }));

    // Count updates in last 24h
    const countQuery = `
      SELECT COUNT(*) as cnt FROM transfer_portal_changelog
      WHERE event_timestamp > datetime('now', '-24 hours')
    `;
    const countResult = await env.GAME_DB.prepare(countQuery).first<{ cnt: number }>();

    return new Response(
      JSON.stringify({
        last_updated: lastUpdated || null,
        update_count_24h: countResult?.cnt ?? 0,
        recent_changes: recentChanges,
        status,
      }),
      { headers: HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ last_updated: null, update_count_24h: 0, recent_changes: [], status: 'stale', error: message }),
      { status: 500, headers: HEADERS }
    );
  }
};
