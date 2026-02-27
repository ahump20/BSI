/**
 * College Baseball — team detail, schedule, and trends handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, archiveRawResponse, HTTP_CACHE, CACHE_TTL, teamMetadata, metaByEspnId, getLogoUrl, enrichTeamWithD1Stats, transformTeamSchedule, computeTrendSummary } from './shared';
import { transformHighlightlyTeam, transformCollegeBaseballTeamDetail } from './transforms';

export async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  // Resolve slug → ESPN numeric ID via team metadata
  const slugMeta = teamMetadata[teamId];
  const espnId = slugMeta?.espnId ?? teamId;
  const numericId = parseInt(espnId, 10);

  if (isNaN(numericId)) {
    return json({ team: null, error: 'Unknown team' }, 404);
  }

  const cacheKey = `cb:team:${teamId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.team, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const sources: string[] = [];

  // ---------------------------------------------------------------------------
  // Step 1: ESPN skeleton (stable IDs, conference membership, basic roster)
  // ---------------------------------------------------------------------------
  let espnTeam: Record<string, unknown> | null = null;
  let espnPlayers: unknown[] = [];
  let espnTimestamp = now;

  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(numericId),
      client.getTeamPlayers(numericId),
    ]);

    if (teamResult.success && teamResult.data) {
      ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'espn', `college-baseball-team-${teamId}`, teamResult.data));
      espnTeam = teamResult.data as Record<string, unknown>;
      espnPlayers = playersResult.data?.data ?? [];
      espnTimestamp = teamResult.timestamp;
      sources.push('espn');
    }
  } catch (err) {
    console.error('[espn] team critical failure:', err instanceof Error ? err.message : err);
  }

  // ---------------------------------------------------------------------------
  // Step 2: Highlightly enrichment (richer team details, advanced stats)
  // ---------------------------------------------------------------------------
  let hlTeamData: unknown = null;
  let hlPlayers: unknown[] = [];
  let hlTimestamp = now;

  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [teamResult, playersResult] = await Promise.all([
        hlClient.getTeam(numericId),
        hlClient.getTeamPlayers(numericId),
      ]);

      if (teamResult.success && teamResult.data) {
        ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'highlightly', `college-baseball-team-${teamId}`, teamResult.data));
        hlTeamData = teamResult.data;
        hlPlayers = playersResult.success ? (playersResult.data?.data ?? []) : [];
        hlTimestamp = teamResult.timestamp;
        sources.push('highlightly');
      }
    } catch (err) {
      console.error('[highlightly] team enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Resolve — prefer Highlightly when available (richer), ESPN as skeleton
  // ---------------------------------------------------------------------------
  const degraded = !hlTeamData && !!espnTeam;

  // Highlightly available: use its richer transform
  if (hlTeamData) {
    const team = transformHighlightlyTeam(hlTeamData, hlPlayers);
    if (team.name) {
      if (slugMeta) {
        team.logo = getLogoUrl(slugMeta.espnId, slugMeta.logoId);
      }
      const payload: Record<string, unknown> = {
        team,
        meta: { source: sources.join('+'), fetched_at: hlTimestamp, timezone: 'America/Chicago', sources, degraded: false },
      };
      await enrichTeamWithD1Stats(payload, String(numericId), env);
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
      return cachedJson(payload, 200, HTTP_CACHE.team, {
        ...dataHeaders(hlTimestamp, sources.join('+')), 'X-Cache': 'MISS',
      });
    }
  }

  // ESPN skeleton only
  if (espnTeam) {
    const team = transformCollegeBaseballTeamDetail(espnTeam, espnPlayers, slugMeta?.conference);
    const payload: Record<string, unknown> = {
      team,
      meta: { source: 'espn', fetched_at: espnTimestamp, timezone: 'America/Chicago', sources, degraded },
    };
    await enrichTeamWithD1Stats(payload, String(numericId), env);
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, {
      ...dataHeaders(espnTimestamp, 'espn'), 'X-Cache': 'MISS',
    });
  }

  return json(
    { team: null, meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago', sources: [], degraded: true } },
    502,
    { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' },
  );
}

export async function handleCollegeBaseballTeamSchedule(
  teamId: string,
  env: Env
): Promise<Response> {
  const scheduleMeta = teamMetadata[teamId];
  const espnId = scheduleMeta?.espnId ?? teamId;
  const numericId = parseInt(espnId, 10);
  if (isNaN(numericId)) return json({ schedule: null, error: 'Unknown team' }, 404);

  const cacheKey = `cb:team-schedule:${teamId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const result = await client.getTeamSchedule(numericId);
    if (result.success && result.data) {
      const raw = result.data as Record<string, unknown>;
      const events = (raw.events ?? []) as Record<string, unknown>[];
      const schedule = transformTeamSchedule(events, scheduleMeta?.shortName ?? '');
      const payload = { schedule, meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.schedule);
      return cachedJson(payload, 200, HTTP_CACHE.schedule, { ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS' });
    }
  } catch (err) {
    console.error('[espn] team schedule:', err instanceof Error ? err.message : err);
  }

  return json({ schedule: [], meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' } }, 502);
}

// ── Bulk teams endpoint ─────────────────────────────────────────────────────

interface BulkTeamItem {
  id: number;
  name: string;
  abbreviation: string;
  slug: string;
  logo: string;
  primaryColor: string;
  conference: string;
  conferenceId: number;
  record: { wins: number; losses: number };
  ranking?: number;
  source: 'highlightly' | 'espn' | 'merged';
}

/**
 * GET /api/college-baseball/teams/all
 * Returns all ~300 college baseball teams with logos, conferences, and records.
 * Merges ESPN bulk data with teamMetadata for logo overrides.
 */
export async function handleCollegeBaseballTeamsAll(
  env: Env,
): Promise<Response> {
  const cacheKey = 'cb:teams:all';
  const now = new Date().toISOString();

  // KV cache — 1 hour TTL
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.team, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const teams: BulkTeamItem[] = [];
  const sources: string[] = [];

  // Step 1: ESPN bulk teams (direct fetch — no client method for bulk)
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=400',
      { signal: AbortSignal.timeout(10000) },
    );
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      const sports = (data.sports as unknown[]) ?? [];
      const sport0 = sports[0] as Record<string, unknown> | undefined;
      const leagues = (sport0?.leagues as unknown[]) ?? [];
      const league = leagues[0] as Record<string, unknown> | undefined;
      const rawTeams = (league?.teams ?? []) as Array<{ team: Record<string, unknown> }>;

      for (const entry of rawTeams) {
        const t = entry.team ?? entry;
        const espnId = String(t.id ?? '');
        const name = String(t.displayName ?? t.name ?? '');
        const abbr = String(t.abbreviation ?? '');
        const slug = String(t.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const logos = (t.logos as Array<{ href: string }>) ?? [];
        const logo = logos[0]?.href ?? '';
        const color = String(t.color ?? '333333');
        const group = t.groups as Record<string, unknown> | undefined;
        const confName = String(group?.name ?? group?.shortName ?? 'Independent');
        const confId = Number(group?.id ?? 0);

        // Check if we have a teamMetadata override for logo
        const metaEntry = metaByEspnId[espnId];
        const resolvedLogo = metaEntry ? getLogoUrl(metaEntry.espnId, metaEntry.logoId) : logo;

        // Record from ESPN
        const recordObj = (t.record as Record<string, unknown>) ?? {};
        const items = (recordObj.items ?? []) as Array<{ summary?: string }>;
        const overall = items[0]?.summary ?? '0-0';
        const [wins, losses] = overall.split('-').map(Number);

        teams.push({
          id: Number(espnId),
          name,
          abbreviation: abbr,
          slug: metaEntry ? Object.entries(teamMetadata).find(([, v]) => v.espnId === espnId)?.[0] ?? slug : slug,
          logo: resolvedLogo,
          primaryColor: `#${color}`,
          conference: metaEntry?.conference ?? confName,
          conferenceId: confId,
          record: { wins: wins || 0, losses: losses || 0 },
          source: metaEntry ? 'merged' : 'espn',
        });
      }

      sources.push('espn');
    }
  } catch (err) {
    console.error('[teams/all] ESPN bulk fetch failed:', err instanceof Error ? err.message : err);
  }

  // Step 2: Fill in any teams from teamMetadata not in ESPN response
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    const exists = teams.some((t) => String(t.id) === meta.espnId);
    if (!exists) {
      teams.push({
        id: Number(meta.espnId),
        name: meta.name,
        abbreviation: meta.abbreviation,
        slug,
        logo: getLogoUrl(meta.espnId, meta.logoId),
        primaryColor: meta.colors.primary,
        conference: meta.conference,
        conferenceId: 0,
        record: { wins: 0, losses: 0 },
        source: 'merged',
      });
    }
  }

  // Sort by conference then name
  teams.sort((a, b) => a.conference.localeCompare(b.conference) || a.name.localeCompare(b.name));

  const payload = {
    teams,
    meta: {
      source: sources.join('+') || 'metadata',
      fetched_at: now,
      timezone: 'America/Chicago' as const,
      teamCount: teams.length,
    },
  };

  // Cache for 1 hour
  await kvPut(env.KV, cacheKey, payload, 3600);
  return cachedJson(payload, 200, HTTP_CACHE.team, { ...dataHeaders(now, sources.join('+') || 'metadata'), 'X-Cache': 'MISS' });
}

export async function handleCollegeBaseballTrends(teamId: string, env: Env): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM standings_snapshots WHERE team_id = ? ORDER BY snapshot_date DESC LIMIT 30'
    ).bind(teamId).all();

    const rows = (result?.results ?? []) as Array<{
      team_id: string; team_name: string; conference: string;
      wins: number; losses: number; conference_wins: number; conference_losses: number;
      rpi: number | null; ranking: number | null; run_differential: number; snapshot_date: string;
    }>;

    const snapshots = rows.reverse().map(r => ({
      date: r.snapshot_date,
      wins: r.wins,
      losses: r.losses,
      winPct: r.wins + r.losses > 0 ? Math.round((r.wins / (r.wins + r.losses)) * 1000) / 1000 : 0,
      ranking: r.ranking,
      rpi: r.rpi,
      runDifferential: r.run_differential,
    }));

    const team = rows.length > 0
      ? { id: rows[0].team_id, name: rows[0].team_name, conference: rows[0].conference }
      : { id: teamId, name: 'Unknown', conference: 'Unknown' };

    const summary = computeTrendSummary(snapshots.map(s => ({ wins: s.wins, losses: s.losses, ranking: s.ranking })));

    return json({
      team,
      snapshots,
      summary,
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[trends] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      team: { id: teamId, name: 'Unknown', conference: 'Unknown' },
      snapshots: [],
      summary: { currentStreak: 'N/A', last10: 'N/A', rankingChange: null },
      message: 'Trend data temporarily unavailable.',
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    }, 503);
  }
}
