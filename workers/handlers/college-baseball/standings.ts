/**
 * College Baseball — standings, rankings, and leaders handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, teamMetadata, metaByEspnId, getLogoUrl, lookupConference, buildLeaderCategories } from './shared';

export async function handleCollegeBaseballStandings(
  url: URL,
  env: Env
): Promise<Response> {
  const conference = url.searchParams.get('conference') || 'NCAA';
  const cacheKey = `cb:standings:v3:${conference}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const wrap = (data: unknown[], source: string, ts: string) => ({
    success: true,
    data,
    conference,
    timestamp: ts,
    meta: { dataSource: source, lastUpdated: ts, sport: 'college-baseball' },
  });

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getStandings(conference);
      const hlData = Array.isArray(result.data) ? result.data : [];
      // Only trust Highlightly if it actually returned teams; empty results for
      // niche conferences (e.g. Independent) should fall through to ESPN v2.
      if (result.success && hlData.length > 0) {
        const payload = wrap(hlData, 'highlightly', result.timestamp);
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
        return cachedJson(payload, 200, HTTP_CACHE.standings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] standings fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN v2 returns all D1 conference groups — flatten entries, filter by conference here
  const client = getCollegeClient();
  const result = await client.getStandings();

  if (!result.success || !Array.isArray(result.data)) {
    const payload = wrap([], 'espn-v2', result.timestamp);
    return cachedJson(payload, 502, HTTP_CACHE.standings, {
      ...dataHeaders(result.timestamp, 'espn-v2'), 'X-Cache': 'MISS',
    });
  }

  // Flatten nested conference groups: each child has .standings.entries
  const children = result.data as Array<Record<string, unknown>>;
  const entries = children.flatMap((child) => {
    const standings = (child.standings as Record<string, unknown>) || {};
    return (standings.entries as Array<Record<string, unknown>>) || [];
  });

  // Filter teams by conference using team-metadata.ts espnId → conference mapping
  const filtered = conference === 'NCAA'
    ? entries
    : entries.filter((entry) => {
        const team = (entry.team as Record<string, unknown>) || {};
        const teamId = String(team.id ?? '');
        const meta = metaByEspnId[teamId];
        if (meta) return meta.conference === conference;
        // Fallback: match by display name
        const name = (team.displayName as string) ?? '';
        return lookupConference(name) === conference;
      });

  // Transform into TeamStanding shape expected by the UI
  const standings = filtered.map((entry, index) => {
    const team = (entry.team as Record<string, unknown>) || {};
    const teamId = String(team.id ?? '');
    const meta = metaByEspnId[teamId];
    const wins = Number(entry.wins ?? 0);
    const losses = Number(entry.losses ?? 0);
    const winPct = Number(entry.winPercent ?? 0);
    const leagueWinPct = Number(entry.leagueWinPercent ?? 0);

    // ESPN v2 standings provides leagueWinPercent but no raw conference W-L.
    // Show the percentage directly rather than deriving bogus W-L numbers.

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

  // Sort by win percentage desc, then point differential as tiebreaker
  standings.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.pointDifferential - a.pointDifferential;
  });

  // Re-rank after sorting
  standings.forEach((s, i) => { s.rank = i + 1; });

  const payload = wrap(standings, 'espn-v2', result.timestamp);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);

  return cachedJson(payload, 200, HTTP_CACHE.standings, {
    ...dataHeaders(result.timestamp, 'espn-v2'), 'X-Cache': 'MISS',
  });
}

export async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings:v2';
  const prevKey = 'cb:rankings:prev';
  const now = new Date().toISOString();

  // Rotate current → previous before fetching new data
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

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        await rotatePrevious();
        const payload = { rankings: result.data, meta: { dataSource: 'highlightly', lastUpdated: result.timestamp, sport: 'college-baseball' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
        return cachedJson({ ...payload, previousRankings: null }, 200, HTTP_CACHE.rankings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] rankings fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN college baseball rankings — returns { rankings: [{ name, ranks: [...] }] }
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(espnUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      const rankings = (raw.rankings as unknown[]) || [];
      await rotatePrevious();
      const payload = {
        rankings,
        timestamp: now,
        meta: { dataSource: 'espn', lastUpdated: now, sport: 'college-baseball' },
      };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
      return cachedJson({ ...payload, previousRankings: null }, 200, HTTP_CACHE.rankings, {
        ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
      });
    }
  } catch {
    // Fall through to ncaa-api client
  }

  // Final fallback: ncaa-api client (returns raw array)
  try {
    const client = getCollegeClient();
    const result = await client.getRankings();
    const rankings = Array.isArray(result.data) ? result.data : [];
    await rotatePrevious();
    const payload = {
      rankings,
      timestamp: result.timestamp,
      meta: { dataSource: 'ncaa', lastUpdated: result.timestamp, sport: 'college-baseball' },
    };

    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }

    return cachedJson({ ...payload, previousRankings: null }, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({ rankings: [], previousRankings: null, meta: { dataSource: 'error', lastUpdated: now, sport: 'college-baseball' } }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
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
      meta: { lastUpdated: now, dataSource: 'd1-accumulated' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch {
    // Fallback: empty categories so the UI renders its placeholder state
    const empty = { categories: [], meta: { lastUpdated: now, dataSource: 'unavailable' } };
    await kvPut(env.KV, cacheKey, empty, 300);
    return cachedJson(empty, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
}
