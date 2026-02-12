/**
 * Transfer Portal Player API
 *
 * Returns detailed information about a single portal entry.
 */

import type {
  BaseballStats,
  FootballStats,
  PortalEntry,
  PortalSport,
} from '../../../../lib/portal/types';

interface Env {
  KV: KVNamespace;
  GAME_DB: D1Database;
  HIGHLIGHTLY_API_KEY?: string;
}

interface D1Row {
  id: string;
  player_name: string;
  sport: PortalSport;
  position: string;
  class_year: string;
  from_team: string;
  to_team: string | null;
  from_conference: string | null;
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
  source_confidence: number | null;
  verified: number;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

const HIGHLIGHTLY_HOSTS: Record<PortalSport, string> = {
  baseball: 'baseball.highlightly.net',
  football: 'american-football.highlightly.net',
};

const HIGHLIGHTLY_BASES: Record<PortalSport, string> = {
  baseball: 'https://baseball.highlightly.net',
  football: 'https://american-football.highlightly.net',
};

const CACHE_TTL_SECONDS = 300;
const HIGHLIGHTLY_STATS_TTL_SECONDS = 21600;

function parseStats(statsJson: string | null): BaseballStats | FootballStats | undefined {
  if (!statsJson) return undefined;
  try {
    return JSON.parse(statsJson) as BaseballStats | FootballStats;
  } catch {
    return undefined;
  }
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapHighlightlyBaseballStats(payload: Record<string, unknown>): BaseballStats {
  const batting = (payload.batting as Record<string, unknown> | undefined) ?? {};
  const pitching = (payload.pitching as Record<string, unknown> | undefined) ?? {};

  return {
    avg: pickNumber(batting.avg ?? payload.avg),
    hr: pickNumber(batting.hr ?? batting.home_runs ?? payload.hr ?? payload.home_runs),
    rbi: pickNumber(batting.rbi ?? payload.rbi),
    sb: pickNumber(batting.sb ?? batting.stolen_bases ?? payload.sb ?? payload.stolen_bases),
    era: pickNumber(pitching.era ?? payload.era),
    wins: pickNumber(pitching.wins ?? payload.wins),
    losses: pickNumber(pitching.losses ?? payload.losses),
    strikeouts: pickNumber(pitching.strikeouts ?? pitching.so ?? payload.strikeouts ?? payload.so),
    innings: pickNumber(
      pitching.innings_pitched ?? pitching.ip ?? payload.innings_pitched ?? payload.ip
    ),
    whip: pickNumber(pitching.whip ?? payload.whip),
  };
}

function mapHighlightlyFootballStats(payload: Record<string, unknown>): FootballStats {
  const passing = (payload.passing as Record<string, unknown> | undefined) ?? {};
  const rushing = (payload.rushing as Record<string, unknown> | undefined) ?? {};
  const receiving = (payload.receiving as Record<string, unknown> | undefined) ?? {};
  const defense = (payload.defense as Record<string, unknown> | undefined) ?? {};

  return {
    pass_yards: pickNumber(passing.yards ?? payload.pass_yards),
    pass_td: pickNumber(
      passing.touchdowns ?? passing.td ?? payload.pass_td ?? payload.pass_touchdowns
    ),
    rush_yards: pickNumber(rushing.yards ?? payload.rush_yards),
    rush_td: pickNumber(
      rushing.touchdowns ?? rushing.td ?? payload.rush_td ?? payload.rush_touchdowns
    ),
    rec_yards: pickNumber(receiving.yards ?? payload.rec_yards),
    rec_td: pickNumber(
      receiving.touchdowns ?? receiving.td ?? payload.rec_td ?? payload.rec_touchdowns
    ),
    tackles: pickNumber(defense.tackles ?? payload.tackles),
    sacks: pickNumber(defense.sacks ?? payload.sacks),
    interceptions: pickNumber(defense.interceptions ?? payload.interceptions),
  };
}

async function fetchHighlightlyStats(
  env: Env,
  sport: PortalSport,
  playerId: string
): Promise<BaseballStats | FootballStats | null> {
  if (!env.HIGHLIGHTLY_API_KEY) return null;

  const cacheKey = `highlightly:portal:player-stats:${sport}:${playerId}`;
  const cached = await env.KV.get(cacheKey, 'json');
  if (cached) {
    return cached as BaseballStats | FootballStats;
  }

  const baseUrl = HIGHLIGHTLY_BASES[sport];
  const host = HIGHLIGHTLY_HOSTS[sport];
  const response = await fetch(`${baseUrl}/players/${playerId}/statistics`, {
    headers: {
      'x-rapidapi-key': env.HIGHLIGHTLY_API_KEY,
      'x-rapidapi-host': host,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const stats =
    sport === 'baseball'
      ? mapHighlightlyBaseballStats(payload)
      : mapHighlightlyFootballStats(payload);

  if (Object.values(stats).some((value) => value !== undefined)) {
    await env.KV.put(cacheKey, JSON.stringify(stats), {
      expirationTtl: HIGHLIGHTLY_STATS_TTL_SECONDS,
    });
    return stats;
  }

  return null;
}

function rowToEntry(row: D1Row, stats: BaseballStats | FootballStats | undefined): PortalEntry {
  return {
    id: row.id,
    player_name: row.player_name,
    school_from: row.from_team,
    school_to: row.to_team || null,
    position: row.position,
    conference: row.from_conference || '',
    class_year: row.class_year as PortalEntry['class_year'],
    status: row.status as PortalEntry['status'],
    portal_date: row.portal_date,
    commitment_date: row.commitment_date || undefined,
    sport: row.sport,
    engagement_score: row.engagement_score ?? undefined,
    stars: row.stars ?? undefined,
    overall_rank: row.overall_rank ?? undefined,
    baseball_stats: row.sport === 'baseball' ? (stats as BaseballStats | undefined) : undefined,
    football_stats: row.sport === 'football' ? (stats as FootballStats | undefined) : undefined,
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context;
  const playerId = params.id as string;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const cacheKey = `portal:player:${playerId}`;
    const cached = await env.KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers });
    }

    const row = await env.GAME_DB.prepare('SELECT * FROM transfer_portal WHERE id = ?1')
      .bind(playerId)
      .first<D1Row>();

    if (!row) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
    }

    const parsedStats = parseStats(row.stats_json);
    const highlightlyId = row.source_id && /^\d+$/.test(row.source_id) ? row.source_id : null;
    const highlightlyStats =
      parsedStats ??
      (highlightlyId ? await fetchHighlightlyStats(env, row.sport, highlightlyId) : null);

    const entry = rowToEntry(row, highlightlyStats ?? undefined);

    const response = JSON.stringify({ data: entry });
    await env.KV.put(cacheKey, response, { expirationTtl: CACHE_TTL_SECONDS });

    return new Response(response, { headers });
  } catch (error) {
    console.error('Portal player API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
};
