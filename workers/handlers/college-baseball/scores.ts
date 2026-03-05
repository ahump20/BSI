/**
 * College Baseball — scores, game detail, and schedule handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, archiveRawResponse, HTTP_CACHE, CACHE_TTL, lookupConference, getScoreboard, getGameSummary, getLogoUrl, metaByEspnId } from './shared';
import { transformHighlightlyGame, transformEspnGameSummary } from './transforms';

export async function handleCollegeBaseballScores(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const sources: string[] = [];
  let degraded = false;

  // ---------------------------------------------------------------------------
  // Step 1: ESPN scoreboard (skeleton — game status, team names, basic scores)
  // ---------------------------------------------------------------------------
  let espnData: { data: unknown[]; totalCount: number } | null = null;

  try {
    const espnDate = date ? date.replace(/-/g, '') : undefined;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard${espnDate ? `?dates=${espnDate}` : ''}`;
    const espnRes = await fetch(espnUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (espnRes.ok) {
      const espnRaw = await espnRes.json() as { events?: unknown[] };
      ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'espn', 'college-baseball-scores', espnRaw));
      if (espnRaw.events && espnRaw.events.length > 0) {
        espnData = { data: espnRaw.events, totalCount: espnRaw.events.length };
        sources.push('espn');
      }
    }
  } catch (err) {
    console.error('[espn] college baseball scores critical failure:', err instanceof Error ? err.message : err);
  }

  // ---------------------------------------------------------------------------
  // Step 2: Highlightly enrichment (box scores, detailed inning state, rankings)
  // ---------------------------------------------------------------------------
  let hlData: unknown | null = null;

  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getMatches('NCAA', date);
      if (result.success && result.data) {
        ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'highlightly', 'college-baseball-scores', result.data));
        hlData = result.data;
        sources.push('highlightly');
      }
    } catch (err) {
      console.error('[highlightly] scores enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Resolve — prefer Highlightly when both available (richer data)
  // ---------------------------------------------------------------------------

  // Both available: serve Highlightly (richer) with full source attribution
  if (hlData && espnData) {
    const payload = {
      ...(hlData as Record<string, unknown>),
      meta: { source: 'highlightly+espn', fetched_at: now, timezone: 'America/Chicago', sources, degraded: false },
    };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'highlightly+espn'), 'X-Cache': 'MISS',
    });
  }

  // ESPN only: skeleton mode
  if (espnData) {
    degraded = true;
    const payload = {
      ...espnData,
      meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago', sources, degraded },
    };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
    });
  }

  // Highlightly only (ESPN failed): serve Highlightly as sole source
  if (hlData) {
    degraded = true;
    const payload = {
      ...(hlData as Record<string, unknown>),
      meta: { source: 'highlightly', fetched_at: now, timezone: 'America/Chicago', sources, degraded },
    };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'highlightly'), 'X-Cache': 'MISS',
    });
  }

  // Both failed — NCAA client as last resort
  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);

    const ncaaPayload = {
      ...(result.data as Record<string, unknown> ?? empty),
      meta: { source: 'ncaa', fetched_at: now, timezone: 'America/Chicago', sources: ['ncaa'], degraded: true },
    };

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, ncaaPayload, CACHE_TTL.scores);
    }

    return cachedJson(ncaaPayload, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({ ...empty, meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago', sources: [], degraded: true } }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

export async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:game:${gameId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.game, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first (if API key is set)
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [matchResult, boxResult] = await Promise.all([
        hlClient.getMatch(parseInt(gameId, 10)),
        hlClient.getBoxScore(parseInt(gameId, 10)),
      ]);

      if (matchResult.success && matchResult.data) {
        const game = transformHighlightlyGame(
          matchResult.data,
          boxResult.success ? (boxResult.data ?? null) : null
        );
        const payload = { game, meta: { source: 'highlightly', fetched_at: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] game fallback:', err instanceof Error ? err.message : err);
    }
  }

  // NCAA/ESPN fallback
  try {
    const client = getCollegeClient();
    const matchResult = await client.getMatch(parseInt(gameId, 10));

    if (matchResult.success && matchResult.data) {
      const summary = matchResult.data as Record<string, unknown>;
      const game = transformEspnGameSummary(summary);

      if (game) {
        const payload = { game, meta: { source: 'espn', fetched_at: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }

    return json(
      { game: null, meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  } catch {
    return json(
      { game: null, meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  }
}

export async function handleCollegeBaseballSchedule(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const range = url.searchParams.get('range') || 'week';
  const conference = url.searchParams.get('conference') || '';
  const cacheKey = `cb:schedule:${date}:${range}`;

  // This endpoint powers the live scores page, which polls every 30s.
  // Use scores-level HTTP cache (30s) instead of schedule (3600s) so
  // browsers and Cloudflare CDN don't serve stale data during live games.
  const httpCache = HTTP_CACHE.scores;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, httpCache, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const result = await client.getSchedule(date, range);

  if (!result.success || !result.data) {
    return cachedJson(
      { success: false, data: [], message: 'Failed to fetch schedule', timestamp: result.timestamp },
      502, httpCache, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' }
    );
  }

  const rawEvents = (result.data.data || []) as Record<string, unknown>[];

  // Transform ESPN events into the Game shape the scores page expects
  let games = rawEvents.map((e: Record<string, unknown>) => {
    const status = e.status as Record<string, unknown> || {};
    const state = (status.state as string || '').toLowerCase();
    const homeTeam = e.homeTeam as Record<string, unknown> || {};
    const awayTeam = e.awayTeam as Record<string, unknown> || {};
    const venue = e.venue as Record<string, unknown> | undefined;

    // Map ESPN state to frontend status
    let gameStatus: string;
    if (state === 'in' || state === 'live') gameStatus = 'live';
    else if (state === 'post' || (status.type as string || '').includes('FINAL')) gameStatus = 'final';
    else if ((status.type as string || '').includes('POSTPONED')) gameStatus = 'postponed';
    else if ((status.type as string || '').includes('CANCELED')) gameStatus = 'canceled';
    else gameStatus = 'scheduled';

    // Parse time from date field
    const dateStr = (e.date as string) || '';
    let time = '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        time = d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
      } catch { /* ignore */ }
    }

    // Extract inning for live games
    const period = status.period as number | undefined;

    return {
      id: String(e.id || ''),
      date: dateStr,
      time,
      status: gameStatus,
      inning: gameStatus === 'live' ? period : undefined,
      homeTeam: {
        id: String(homeTeam.id || ''),
        name: (homeTeam.name || '') as string,
        shortName: (homeTeam.abbreviation || '') as string,
        conference: (homeTeam.conference as string) || lookupConference((homeTeam.name || '') as string),
        score: gameStatus !== 'scheduled' ? (e.homeScore ?? null) : null,
        record: (homeTeam.record as { wins: number; losses: number }) ?? { wins: 0, losses: 0 },
      },
      awayTeam: {
        id: String(awayTeam.id || ''),
        name: (awayTeam.name || '') as string,
        shortName: (awayTeam.abbreviation || '') as string,
        conference: (awayTeam.conference as string) || lookupConference((awayTeam.name || '') as string),
        score: gameStatus !== 'scheduled' ? (e.awayScore ?? null) : null,
        record: (awayTeam.record as { wins: number; losses: number }) ?? { wins: 0, losses: 0 },
      },
      venue: venue ? (venue.fullName || venue.name || '') as string : '',
      situation: (status.detail as string) || '',
    };
  });

  // Filter by conference if specified
  if (conference) {
    const confLower = conference.toLowerCase();
    games = games.filter((g) =>
      g.homeTeam.conference.toLowerCase().includes(confLower) ||
      g.awayTeam.conference.toLowerCase().includes(confLower) ||
      g.homeTeam.name.toLowerCase().includes(confLower) ||
      g.awayTeam.name.toLowerCase().includes(confLower)
    );
  }

  const payload = {
    success: true,
    data: games,
    live: games.some((g) => g.status === 'live'),
    timestamp: result.timestamp,
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.schedule);
  return cachedJson(payload, 200, httpCache, {
    ...dataHeaders(result.timestamp), 'X-Cache': 'MISS',
  });
}
