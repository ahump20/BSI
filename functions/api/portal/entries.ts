/**
 * Transfer Portal Entries API
 *
 * Returns college baseball transfer portal entries with filtering.
 * Source: NCAA official portal data, verified social media, D1Baseball
 * Updated: Every 5 minutes during active portal windows
 */

interface Env {
  KV: KVNamespace;
  GAME_DB: D1Database;
}

interface D1Row {
  id: string;
  player_name: string;
  sport: string;
  position: string;
  class_year: string;
  from_team: string;
  to_team: string | null;
  from_conference: string | null;
  to_conference: string | null;
  status: string;
  portal_date: string;
  commitment_date: string | null;
  stats_json: string | null;
  engagement_score: number | null;
  stars: number | null;
  overall_rank: number | null;
  source_url: string | null;
  source_id: string | null;
  source_name: string;
  is_partial: number;
  needs_review: number;
  source_confidence: number | null;
  verified: number;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

function parseStats(statsJson: string | null): unknown | undefined {
  if (!statsJson) return undefined;
  try {
    return JSON.parse(statsJson);
  } catch {
    return undefined;
  }
}

function formatChicagoTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const offsetToken = get('timeZoneName');
  const offsetMatch = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offsetToken);
  const sign = offsetMatch?.[1] ?? '+';
  const hours = offsetMatch?.[2]?.padStart(2, '0') ?? '00';
  const minutes = offsetMatch?.[3]?.padStart(2, '0') ?? '00';
  const offset = `${sign}${hours}:${minutes}`;

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${offset}`;
}

function rowToEntry(row: D1Row): Record<string, unknown> {
  const stats = parseStats(row.stats_json);
  return {
    id: row.id,
    player_name: row.player_name,
    school_from: row.from_team,
    school_to: row.to_team || null,
    position: row.position,
    conference: row.from_conference || '',
    class_year: row.class_year,
    status: row.status,
    portal_date: row.portal_date,
    commitment_date: row.commitment_date || undefined,
    sport: row.sport,
    engagement_score: row.engagement_score ?? undefined,
    stars: row.stars ?? undefined,
    overall_rank: row.overall_rank ?? undefined,
    baseball_stats: row.sport === 'baseball' ? stats : undefined,
    football_stats: row.sport === 'football' ? stats : undefined,
    is_partial: row.is_partial === 1,
    needs_review: row.needs_review === 1,
    source_confidence: row.source_confidence ?? 1,
    source_url: row.source_url || undefined,
    source_id: row.source_id || undefined,
    verified: row.verified === 1,
    source: row.source_name,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // Parse query params
  const sport = url.searchParams.get('sport') || 'baseball';
  const position = url.searchParams.get('position') || '';
  const conference = url.searchParams.get('conference') || '';
  const status = url.searchParams.get('status') || '';
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    // Check KV cache first
    const cacheKey = `portal:entries:${position}:${conference}:${status}:${limit}:${offset}`;
    const cached = await env.KV?.get(cacheKey);

    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const conditions: string[] = ['sport = ?1'];
    const params: (string | number)[] = [sport];
    let paramIdx = 1;

    if (position) {
      conditions.push(`position LIKE ?${++paramIdx}`);
      params.push(`%${position}%`);
    }
    if (conference) {
      conditions.push(`from_conference = ?${++paramIdx}`);
      params.push(conference);
    }
    if (status) {
      conditions.push(`status = ?${++paramIdx}`);
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM transfer_portal WHERE ${whereClause}`;
    const countResult = await env.GAME_DB.prepare(countQuery)
      .bind(...params)
      .first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const dataQuery = `
      SELECT * FROM transfer_portal
      WHERE ${whereClause}
      ORDER BY event_timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataResult = await env.GAME_DB.prepare(dataQuery)
      .bind(...params)
      .all<D1Row>();
    const paginatedEntries = (dataResult.results || []).map(rowToEntry);

    const lastUpdated = (await env.KV.get('portal:last_updated')) || formatChicagoTimestamp();

    const response = {
      data: paginatedEntries,
      meta: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
        last_updated: lastUpdated,
        source: 'bsi-portal-d1',
      },
    };

    const responseJson = JSON.stringify(response);

    // Cache for 5 minutes
    await env.KV?.put(cacheKey, responseJson, { expirationTtl: 300 });

    return new Response(responseJson, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Portal entries error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch portal entries',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: formatChicagoTimestamp(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
