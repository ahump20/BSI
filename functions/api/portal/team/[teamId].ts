/**
 * Transfer Portal Team Detail API
 *
 * Returns incoming and outgoing portal entries for a team.
 * GET /api/portal/team/:teamId
 *
 * teamId is a URL-safe slug (e.g., "texas-a-m", "ohio-state").
 * Matches against from_team and to_team using LIKE with the decoded name.
 *
 * Response: { team: string, incoming: PortalEntry[], outgoing: PortalEntry[], net: number }
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

function slugToTeamName(slug: string): string {
  // Convert URL slug back to approximate team name for LIKE matching
  // "texas-a-m" → "texas a m", "ohio-state" → "ohio state"
  return slug.replace(/-/g, ' ');
}

function teamNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapRow(row: Record<string, unknown>): Record<string, unknown> {
  let baseballStats = undefined;
  let footballStats = undefined;
  if (row.stats_json && typeof row.stats_json === 'string') {
    try {
      const parsed = JSON.parse(row.stats_json as string);
      if (row.sport === 'baseball') baseballStats = parsed;
      else if (row.sport === 'football') footballStats = parsed;
    } catch {
      // skip
    }
  }

  return {
    id: row.id,
    player_name: row.player_name,
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
    blaze_index: (row.blaze_index as number) ?? undefined,
    baseball_stats: baseballStats,
    football_stats: footballStats,
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
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const teamId = params.teamId as string;

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  if (!teamId) {
    return new Response(JSON.stringify({ error: 'Team ID required' }), {
      status: 400,
      headers: HEADERS,
    });
  }

  try {
    const cacheKey = `portal:team:${teamId}`;
    const cached = await env.KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers: HEADERS });
    }

    const db = env.GAME_DB;
    const teamPattern = `%${slugToTeamName(teamId)}%`;

    // Outgoing: players who left this team
    const { results: outgoingRows } = await db
      .prepare(
        'SELECT * FROM transfer_portal WHERE LOWER(from_team) LIKE LOWER(?1) ORDER BY portal_date DESC LIMIT 200'
      )
      .bind(teamPattern)
      .all();

    // Incoming: players committed/signed to this team
    const { results: incomingRows } = await db
      .prepare(
        "SELECT * FROM transfer_portal WHERE LOWER(to_team) LIKE LOWER(?1) AND status IN ('committed', 'signed') ORDER BY commitment_date DESC LIMIT 200"
      )
      .bind(teamPattern)
      .all();

    const outgoing = (outgoingRows || []).map((r) => mapRow(r as Record<string, unknown>));
    const incoming = (incomingRows || []).map((r) => mapRow(r as Record<string, unknown>));

    // Resolve canonical team name from the first match
    const canonicalName =
      ((outgoingRows?.[0] as Record<string, unknown>)?.from_team as string) ||
      ((incomingRows?.[0] as Record<string, unknown>)?.to_team as string) ||
      slugToTeamName(teamId);

    const body = JSON.stringify({
      team: canonicalName,
      team_slug: teamNameToSlug(canonicalName as string),
      incoming,
      outgoing,
      net: incoming.length - outgoing.length,
    });

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
