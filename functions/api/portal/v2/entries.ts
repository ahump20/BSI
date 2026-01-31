/**
 * Transfer Portal Entries API v2
 *
 * Reads from D1 transfer_portal table with server-side filtering,
 * pagination, and KV caching. Falls back to empty result set (never
 * placeholder strings).
 *
 * GET /api/portal/v2/entries
 *   ?sport=baseball|football
 *   &position=RHP
 *   &conference=SEC
 *   &status=in_portal
 *   &search=jake
 *   &minStars=3
 *   &sort=date|engagement|name
 *   &order=asc|desc
 *   &limit=50
 *   &page=1
 *   &since=ISO8601  (delta fetch — only records updated after this timestamp)
 */

import type { PortalSport, PortalStatus } from '../../../../lib/portal/types';

interface Env {
  GAME_DB: D1Database;
  KV: KVNamespace;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30',
};

const CACHE_TTL_SECONDS = 60;

type SortField = 'date' | 'engagement' | 'name' | 'stars';

function buildCacheKey(params: URLSearchParams): string {
  const keys = ['sport', 'position', 'conference', 'status', 'search', 'minStars', 'sort', 'order', 'limit', 'page', 'since'];
  const parts = keys.map((k) => `${k}=${params.get(k) || ''}`).join('&');
  return `portal:v2:${parts}`;
}

function sortColumn(sort: SortField): string {
  switch (sort) {
    case 'date': return 'event_timestamp';
    case 'engagement': return 'engagement_score';
    case 'name': return 'player_name';
    case 'stars': return 'stars';
    default: return 'event_timestamp';
  }
}

interface D1Row {
  id: string;
  player_name: string;
  sport: string;
  position: string;
  class_year: string;
  from_team: string;
  to_team: string | null;
  from_conference: string;
  to_conference: string | null;
  status: string;
  event_timestamp: string;
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
  source_confidence: number;
  verified: number;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: D1Row): Record<string, unknown> {
  const stats = row.stats_json ? JSON.parse(row.stats_json) : undefined;
  const isPitcher = ['RHP', 'LHP', 'P'].includes(row.position);

  return {
    id: row.id,
    player_name: row.player_name,
    school_from: row.from_team,
    school_to: row.to_team || null,
    position: row.position,
    conference: row.from_conference,
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
    source_confidence: row.source_confidence,
    source_url: row.source_url || undefined,
    source_id: row.source_id || undefined,
    verified: row.verified === 1,
    source: row.source_name,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  try {
    // Check KV cache
    const cacheKey = buildCacheKey(url.searchParams);
    const cached = await env.KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers: HEADERS });
    }

    // Parse params
    const sport = (url.searchParams.get('sport') || 'baseball') as PortalSport;
    const position = url.searchParams.get('position');
    const conference = url.searchParams.get('conference');
    const status = url.searchParams.get('status') as PortalStatus | null;
    const search = url.searchParams.get('search');
    const minStars = url.searchParams.get('minStars');
    const sort = (url.searchParams.get('sort') || 'date') as SortField;
    const order = url.searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const since = url.searchParams.get('since');
    const offset = (page - 1) * limit;

    // Build query
    const conditions: string[] = ['sport = ?1'];
    const params: (string | number)[] = [sport];
    let paramIdx = 1;

    if (position) {
      conditions.push(`position = ?${++paramIdx}`);
      params.push(position);
    }
    if (conference) {
      conditions.push(`from_conference = ?${++paramIdx}`);
      params.push(conference);
    }
    if (status) {
      conditions.push(`status = ?${++paramIdx}`);
      params.push(status);
    }
    if (minStars) {
      conditions.push(`stars >= ?${++paramIdx}`);
      params.push(parseInt(minStars, 10));
    }
    if (search) {
      conditions.push(`(player_name LIKE ?${++paramIdx} OR from_team LIKE ?${paramIdx} OR to_team LIKE ?${paramIdx})`);
      params.push(`%${search}%`);
    }
    if (since) {
      conditions.push(`updated_at > ?${++paramIdx}`);
      params.push(since);
    }

    const whereClause = conditions.join(' AND ');
    const sortCol = sortColumn(sort);

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM transfer_portal WHERE ${whereClause}`;
    const countResult = await env.GAME_DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    // Data query
    const dataQuery = `
      SELECT * FROM transfer_portal
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${order}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataResult = await env.GAME_DB.prepare(dataQuery).bind(...params).all<D1Row>();
    const entries = (dataResult.results || []).map(rowToEntry);

    // Get freshness marker from KV
    const lastUpdated = await env.KV.get('portal:last_updated') || new Date().toISOString();

    const response = JSON.stringify({
      data: entries,
      meta: {
        total,
        page,
        per_page: limit,
        has_more: offset + limit < total,
        last_updated: lastUpdated,
        source: 'bsi-portal-d1',
      },
    });

    // Cache in KV (short TTL for freshness)
    await env.KV.put(cacheKey, response, { expirationTtl: CACHE_TTL_SECONDS });

    return new Response(response, { headers: HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ data: [], meta: { total: 0, page: 1, per_page: 50, has_more: false, last_updated: new Date().toISOString(), source: 'bsi-portal-error' }, error: message }),
      { status: 500, headers: HEADERS }
    );
  }
};
