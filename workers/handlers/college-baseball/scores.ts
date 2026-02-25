/**
 * College Baseball — scores, game detail, and schedule handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, lookupConference, getScoreboard, getGameSummary, getLogoUrl, metaByEspnId } from './shared';
import { transformHighlightlyGame, transformEspnGameSummary } from './transforms';

export async function handleCollegeBaseballScores(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first if key is available
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getMatches('NCAA', date);
      if (result.success && result.data) {
        await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
        return cachedJson(result.data, 200, HTTP_CACHE.scores, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] scores fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN college baseball scoreboard fallback
  try {
    const espnDate = date ? date.replace(/-/g, '') : undefined;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard${espnDate ? `?dates=${espnDate}` : ''}`;
    const espnRes = await fetch(espnUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (espnRes.ok) {
      const espnRaw = await espnRes.json() as { events?: unknown[] };
      if (espnRaw.events && espnRaw.events.length > 0) {
        const espnData = { data: espnRaw.events, totalCount: espnRaw.events.length };
        await kvPut(env.KV, cacheKey, espnData, CACHE_TTL.scores);
        return cachedJson(espnData, 200, HTTP_CACHE.scores, {
          ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }
  } catch (err) {
    console.error('[espn] college baseball scores fallback:', err instanceof Error ? err.message : err);
  }

  // NCAA client fallback
  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
    }

    return cachedJson(result.data ?? empty, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json(empty, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
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
        const payload = { game, meta: { dataSource: 'highlightly', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
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
        const payload = { game, meta: { dataSource: 'espn', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }

    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  } catch {
    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
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
