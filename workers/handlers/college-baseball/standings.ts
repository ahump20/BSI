/**
 * College Baseball — standings, rankings, and leaders handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, archiveRawResponse, HTTP_CACHE, CACHE_TTL, teamMetadata, metaByEspnId, getLogoUrl, lookupConference, buildLeaderCategories } from './shared';

export async function handleCollegeBaseballStandings(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  const conference = url.searchParams.get('conference') || 'NCAA';
  const cacheKey = `cb:standings:v3:${conference}`;
  const now = new Date().toISOString();

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  // Only serve cache if it's a properly formatted response (has success + data keys).
  // Raw ESPN arrays from the ingest worker or empty arrays are skipped.
  if (cached && typeof cached === 'object' && !Array.isArray(cached) && 'success' in cached && 'data' in cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const sources: string[] = [];
  let degraded = false;

  // ---------------------------------------------------------------------------
  // Step 1: ESPN skeleton (structural source — conference membership, stable IDs)
  // ---------------------------------------------------------------------------
  const client = getCollegeClient();
  let espnStandings: Array<Record<string, unknown>> = [];
  let espnTimestamp = now;
  let espnOk = false;

  try {
    const result = await client.getStandings();
    espnTimestamp = result.timestamp;
    if (result.data) {
      ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'espn', 'college-baseball-standings', result.data));
    }

    if (result.success && Array.isArray(result.data)) {
      // Flatten nested conference groups: each child has .standings.entries
      const children = result.data as Array<Record<string, unknown>>;
      const entries = children.flatMap((child) => {
        const st = (child.standings as Record<string, unknown>) || {};
        return (st.entries as Array<Record<string, unknown>>) || [];
      });

      // Filter teams by conference
      espnStandings = conference === 'NCAA'
        ? entries
        : entries.filter((entry) => {
            const team = (entry.team as Record<string, unknown>) || {};
            const teamId = String(team.id ?? '');
            const meta = metaByEspnId[teamId];
            if (meta) return meta.conference === conference;
            const name = (team.displayName as string) ?? '';
            return lookupConference(name) === conference;
          });
      espnOk = true;
      sources.push('espn-v2');
    }
  } catch (err) {
    console.error('[espn] standings critical failure:', err instanceof Error ? err.message : err);
  }

  // ---------------------------------------------------------------------------
  // Step 2: Highlightly enrichment (optional overlay — richer conference W-L, rankings)
  // ---------------------------------------------------------------------------
  const hlClient = getHighlightlyClient(env);
  let hlData: unknown[] = [];
  let hlOk = false;

  if (hlClient) {
    try {
      const result = await hlClient.getStandings(conference);
      hlData = Array.isArray(result.data) ? result.data : [];
      if (result.success && hlData.length > 0) {
        ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'highlightly', 'college-baseball-standings', result.data));
        hlOk = true;
        sources.push('highlightly');
      }
    } catch (err) {
      console.error('[highlightly] standings enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Resolve — build final response from available sources
  // ---------------------------------------------------------------------------

  // If ESPN succeeded: use ESPN skeleton, optionally enriched by Highlightly
  if (espnOk && espnStandings.length > 0) {
    // Transform ESPN entries into TeamStanding shape
    const standings = espnStandings.map((entry, index) => {
      const team = (entry.team as Record<string, unknown>) || {};
      const teamId = String(team.id ?? '');
      const meta = metaByEspnId[teamId];
      const wins = Number(entry.wins ?? 0);
      const losses = Number(entry.losses ?? 0);
      const winPct = Number(entry.winPercent ?? 0);
      const leagueWinPct = Number(entry.leagueWinPercent ?? 0);

      const logo = meta
        ? getLogoUrl(meta.espnId, meta.logoId)
        : (team.logo as string) ?? '';

      return {
        rank: index + 1,
        team: {
          id: meta?.slug ?? teamId,
          name: (team.displayName as string) ?? '',
          shortName: meta?.shortName ?? (team.abbreviation as string) ?? '',
          logo,
        },
        conferenceRecord: { wins: 0, losses: 0, pct: leagueWinPct },
        overallRecord: { wins, losses },
        winPct,
        streak: (entry.streak as string) ?? '',
        pointDifferential: Number(entry.pointDifferential ?? 0),
      };
    });

    standings.sort((a, b) => {
      if (b.winPct !== a.winPct) return b.winPct - a.winPct;
      return b.pointDifferential - a.pointDifferential;
    });
    standings.forEach((s, i) => { s.rank = i + 1; });

    if (!hlOk) degraded = true;

    const payload = {
      success: true,
      data: hlOk ? hlData : standings,
      conference,
      timestamp: espnTimestamp,
      meta: {
        source: hlOk ? 'highlightly+espn-v2' : 'espn-v2',
        fetched_at: espnTimestamp,
        timezone: 'America/Chicago',
        sport: 'college-baseball',
        sources,
        degraded,
      },
    };

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, {
      ...dataHeaders(espnTimestamp, sources.join('+')), 'X-Cache': 'MISS',
    });
  }

  // ESPN failed — try Highlightly as sole source
  if (hlOk && hlData.length > 0) {
    const payload = {
      success: true,
      data: hlData,
      conference,
      timestamp: now,
      meta: {
        source: 'highlightly',
        fetched_at: now,
        timezone: 'America/Chicago',
        sport: 'college-baseball',
        sources: ['highlightly'],
        degraded: true,
      },
    };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, {
      ...dataHeaders(now, 'highlightly'), 'X-Cache': 'MISS',
    });
  }

  // Both failed — serve last-known-good from KV (stale key with longer TTL)
  const staleKey = `cb:standings:stale:${conference}`;
  const stale = await kvGet<unknown>(env.KV, staleKey);
  if (stale) {
    return cachedJson(stale, 200, HTTP_CACHE.standings, {
      ...dataHeaders(now, 'stale-cache'), 'X-Cache': 'STALE',
    });
  }

  // Truly nothing — return empty
  const emptyPayload = {
    success: false,
    data: [],
    conference,
    timestamp: now,
    meta: {
      source: 'error',
      fetched_at: now,
      timezone: 'America/Chicago',
      sport: 'college-baseball',
      sources: [],
      degraded: true,
    },
  };
  return cachedJson(emptyPayload, 502, HTTP_CACHE.standings, {
    ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR',
  });
}

/** Flatten ESPN nested poll format into simple { rank, team, record, ... } entries. */
function flattenESPNPolls(polls: unknown[]): unknown[] {
  if (!polls?.length) return [];
  // ESPN returns an array of polls — take the first (D1Baseball Top 25)
  const poll = polls[0] as Record<string, unknown>;
  const ranks = poll?.ranks as Array<Record<string, unknown>> | undefined;
  if (!ranks?.length) return polls; // Not ESPN format, pass through
  return ranks.map((entry) => {
    const team = entry.team as Record<string, unknown> | undefined;
    const teamName = team?.location
      ? `${team.location} ${team.name}`
      : (team?.nickname as string) || (team?.name as string) || 'Unknown';
    return {
      rank: entry.current,
      prev_rank: entry.previous,
      team: teamName,
      record: entry.recordSummary || '',
      points: entry.points,
      firstPlaceVotes: entry.firstPlaceVotes,
      espnId: team?.id || null,
      slug: teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
  });
}

export async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings:v2';
  const prevKey = 'cb:rankings:prev';
  const now = new Date().toISOString();
  const sources: string[] = [];

  async function rotatePrevious() {
    try {
      const current = await kvGet<unknown>(env.KV, cacheKey);
      if (current) {
        await kvPut(env.KV, prevKey, current, 604800); // 7 days
      }
    } catch { /* non-critical */ }
  }

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    const prev = await kvGet<unknown>(env.KV, prevKey);
    return cachedJson({ ...cached, previousRankings: prev || null }, 200, HTTP_CACHE.rankings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Step 1: ESPN rankings (skeleton)
  let espnRankings: unknown[] | null = null;
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const res = await fetch(espnUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      espnRankings = (raw.rankings as unknown[]) || [];
      if (espnRankings.length > 0) sources.push('espn');
    }
  } catch {
    // ESPN rankings failed — non-critical, try other sources
  }

  // Step 2: Highlightly enrichment
  let hlRankings: unknown | null = null;
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        hlRankings = result.data;
        sources.push('highlightly');
      }
    } catch (err) {
      console.error('[highlightly] rankings enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // Step 3: Resolve — prefer Highlightly (richer data), ESPN flattened as fallback
  const flatEspn = espnRankings ? flattenESPNPolls(espnRankings) : null;
  const finalRankings = hlRankings || flatEspn;
  const degraded = !hlRankings && !!flatEspn;

  if (finalRankings) {
    await rotatePrevious();
    const payload = {
      rankings: finalRankings,
      timestamp: now,
      meta: {
        source: sources.join('+') || 'unknown',
        fetched_at: now,
        timezone: 'America/Chicago',
        sport: 'college-baseball',
        sources,
        degraded,
      },
    };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    return cachedJson({ ...payload, previousRankings: null }, 200, HTTP_CACHE.rankings, {
      ...dataHeaders(now, sources.join('+')), 'X-Cache': 'MISS',
    });
  }

  // Both failed — try NCAA client as last resort
  try {
    const client = getCollegeClient();
    const result = await client.getRankings();
    const rankings = Array.isArray(result.data) ? result.data : [];
    await rotatePrevious();
    const payload = {
      rankings,
      timestamp: result.timestamp,
      meta: { source: 'ncaa', fetched_at: result.timestamp, timezone: 'America/Chicago', sport: 'college-baseball', sources: ['ncaa'], degraded: true },
    };
    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }
    return cachedJson({ ...payload, previousRankings: null }, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({
      rankings: [], previousRankings: null,
      meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago', sport: 'college-baseball', sources: [], degraded: true },
    }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

export async function handleCollegeBaseballLeaders(env: Env): Promise<Response> {
  const cacheKey = 'cb:leaders';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    // Query D1 for accumulated season leaders
    const categories = await buildLeaderCategories(env);

    const payload = {
      categories,
      meta: { source: 'd1-accumulated', fetched_at: now, timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch {
    // Fallback: empty categories so the UI renders its placeholder state
    const empty = { categories: [], meta: { source: 'unavailable', fetched_at: now, timezone: 'America/Chicago' } };
    await kvPut(env.KV, cacheKey, empty, 300);
    return cachedJson(empty, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
}
