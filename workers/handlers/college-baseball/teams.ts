/**
 * College Baseball — team detail, schedule, and trends handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, teamMetadata, metaByEspnId, getLogoUrl, enrichTeamWithD1Stats, transformTeamSchedule, computeTrendSummary } from './shared';
import { transformHighlightlyTeam, transformEspnTeam } from './transforms';

export async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
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

  // Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [teamResult, playersResult] = await Promise.all([
        hlClient.getTeam(numericId),
        hlClient.getTeamPlayers(numericId),
      ]);

      if (teamResult.success && teamResult.data) {
        const team = transformHighlightlyTeam(
          teamResult.data,
          playersResult.success ? (playersResult.data?.data ?? []) : []
        );
        if (team.name) {
          // Override logo with known-good CDN URL when teamMetadata has a logoId
          if (slugMeta) {
            team.logo = getLogoUrl(slugMeta.espnId, slugMeta.logoId);
          }
          const payload: Record<string, unknown> = { team, meta: { source: 'highlightly', fetched_at: teamResult.timestamp, timezone: 'America/Chicago' } };
          await enrichTeamWithD1Stats(payload, String(numericId), env);
          await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
          return cachedJson(payload, 200, HTTP_CACHE.team, {
            ...dataHeaders(teamResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
          });
        }
      }
    } catch (err) {
      console.error('[highlightly] team fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(numericId),
      client.getTeamPlayers(numericId),
    ]);

    if (teamResult.success && teamResult.data) {
      const team = transformEspnTeam(
        teamResult.data as Record<string, unknown>,
        playersResult.data?.data ?? []
      );
      const payload: Record<string, unknown> = { team, meta: { source: 'espn', fetched_at: teamResult.timestamp, timezone: 'America/Chicago' } };
      await enrichTeamWithD1Stats(payload, String(numericId), env);
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
      return cachedJson(payload, 200, HTTP_CACHE.team, {
        ...dataHeaders(teamResult.timestamp, 'espn'), 'X-Cache': 'MISS',
      });
    }

    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  } catch {
    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
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
