/**
 * College Baseball — scores, game detail, and schedule handlers.
 */

import type { Env } from './shared';
import { json, errorJson, cachedJson, kvGet, kvPut, dataHeaders, cachedPayloadHeaders, withMeta, getCollegeClient, getHighlightlyClient, archiveRawResponse, logError, HTTP_CACHE, CACHE_TTL, lookupConference, getScoreboard, getGameSummary, getLogoUrl, metaByEspnId, teamMetadata } from './shared';
import { transformHighlightlyGame, transformEspnGameSummary } from './transforms';

// ---------------------------------------------------------------------------
// Game ID mapping — matches Highlightly 7-digit IDs to ESPN 9-digit event IDs
// ---------------------------------------------------------------------------

/** Build a display-name → ESPN team ID lookup from teamMetadata. */
const nameToEspnTeamId: Record<string, string> = {};
for (const [, meta] of Object.entries(teamMetadata)) {
  nameToEspnTeamId[meta.name.toLowerCase()] = meta.espnId;
  nameToEspnTeamId[meta.shortName.toLowerCase()] = meta.espnId;
}

/**
 * Match Highlightly games to ESPN events by team identity + date.
 * Returns a map of Highlightly match ID → ESPN event ID.
 */
function buildGameIdMapping(
  espnEvents: unknown[],
  hlMatches: unknown[],
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedEspnIds = new Set<string>();

  for (const hlRaw of hlMatches as Record<string, unknown>[]) {
    const hlId = String(hlRaw.id ?? '');
    if (!hlId) continue;

    const hlHome = ((hlRaw.homeTeam as Record<string, unknown>)?.displayName as string ?? '').toLowerCase();
    const hlAway = ((hlRaw.awayTeam as Record<string, unknown>)?.displayName as string ?? '').toLowerCase();
    if (!hlHome || !hlAway) continue;

    // Resolve Highlightly team names to ESPN team IDs via metadata
    const hlHomeEspnId = nameToEspnTeamId[hlHome];
    const hlAwayEspnId = nameToEspnTeamId[hlAway];
    if (!hlHomeEspnId || !hlAwayEspnId) continue;

    // Find matching ESPN event
    for (const espnRaw of espnEvents as Record<string, unknown>[]) {
      const espnEventId = String(espnRaw.id ?? '');
      if (!espnEventId || usedEspnIds.has(espnEventId)) continue;

      const competitions = (espnRaw.competitions ?? []) as Record<string, unknown>[];
      if (competitions.length === 0) continue;
      const competitors = (competitions[0].competitors ?? []) as Record<string, unknown>[];
      if (competitors.length < 2) continue;

      let espnHomeId = '';
      let espnAwayId = '';
      for (const comp of competitors) {
        const team = comp.team as Record<string, unknown>;
        const teamId = String(team?.id ?? '');
        if (comp.homeAway === 'home') espnHomeId = teamId;
        else espnAwayId = teamId;
      }

      if (espnHomeId === hlHomeEspnId && espnAwayId === hlAwayEspnId) {
        mapping[hlId] = espnEventId;
        usedEspnIds.add(espnEventId);
        break;
      }
    }
  }

  return mapping;
}

export async function handleCollegeBaseballScores(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  try {
  const rawDate = url.searchParams.get('date');
  // Normalize date to YYYY-MM-DD: accept M/D/YYYY, MM/DD/YYYY, YYYYMMDD, or YYYY-MM-DD
  let date: string;
  if (!rawDate) {
    date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    date = rawDate; // Already YYYY-MM-DD
  } else if (/^\d{8}$/.test(rawDate)) {
    date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  } else {
    // Try parsing M/D/YYYY or other formats via Date constructor
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString().split('T')[0];
    } else {
      date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
    }
  }
  const cacheKey = `cb:scores:${date}`;
  const empty = { data: [], totalCount: 0 };
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, cachedPayloadHeaders(cached));
  }

  const sources: string[] = [];

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
        console.info(`[highlightly] scores enrichment: ${(result.data as { data?: unknown[] })?.data?.length ?? 0} matches, ${result.duration_ms}ms`);
      } else {
        console.warn(`[highlightly] scores returned success=${result.success}, error=${result.error ?? 'none'}, ${result.duration_ms}ms`);
      }
    } catch (err) {
      console.error('[highlightly] scores enrichment failed:', err instanceof Error ? err.message : err);
    }
  } else {
    console.warn('[highlightly] client not available (RAPIDAPI_KEY missing?)');
  }

  // ---------------------------------------------------------------------------
  // Step 3: Resolve — prefer Highlightly when both available (richer data)
  // ---------------------------------------------------------------------------

  // Both available: serve Highlightly (richer) with full source attribution
  if (hlData && espnData) {
    // Build game ID mapping (Highlightly ID → ESPN event ID) for game detail fallback
    const hlMatches = ((hlData as Record<string, unknown>).data ?? []) as unknown[];
    const espnEvents = espnData.data as unknown[];
    const gameIdMap = buildGameIdMapping(espnEvents, hlMatches);
    const mapCount = Object.keys(gameIdMap).length;
    if (mapCount > 0) {
      ctx?.waitUntil(kvPut(env.KV, `game-map:${date}`, gameIdMap, 86400));
      console.info(`[game-map] stored ${mapCount} ID mappings for ${date}`);
    }

    const payload = withMeta(hlData as Record<string, unknown>, 'highlightly+espn', {
      fetchedAt: now,
      sources,
      degraded: false,
    });
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'highlightly+espn'), 'X-Cache': 'MISS',
    });
  }

  // ESPN only: skeleton mode (degraded — missing Highlightly enrichment)
  if (espnData) {
    const payload = withMeta(espnData, 'espn', {
      fetchedAt: now,
      sources,
      degraded: true,
    });
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
    });
  }

  // Highlightly only (ESPN failed): Highlightly is primary — not degraded
  if (hlData) {
    const payload = withMeta(hlData as Record<string, unknown>, 'highlightly', {
      fetchedAt: now,
      sources,
      degraded: false,
    });
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, {
      ...dataHeaders(now, 'highlightly'), 'X-Cache': 'MISS',
    });
  }

  // Both failed — NCAA client as last resort
  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);
    const fallbackData = result.data && typeof result.data === 'object'
      ? result.data as unknown as Record<string, unknown>
      : empty;

    const ncaaPayload = withMeta(fallbackData, 'ncaa', {
      fetchedAt: now,
      sources: ['ncaa'],
      degraded: true,
    });

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, ncaaPayload, CACHE_TTL.scores);
    }

    return cachedJson(ncaaPayload, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json(
      withMeta(empty, 'error', { fetchedAt: now, sources: [], degraded: true }),
      502,
      { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' },
    );
  }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballScores]', msg);
    await logError(env, msg, 'handleCollegeBaseballScores');
    return errorJson('Internal server error');
  }
}

export async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  try {
  const cacheKey = `cb:game:${gameId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.game, cachedPayloadHeaders(cached));
  }

  // Extract numeric ID from composite formats like "highlightly-college_baseball-12345"
  const resolveNumericId = (raw: string): number => {
    if (/^\d+$/.test(raw)) return parseInt(raw, 10);
    const parts = raw.split('-');
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parseInt(parts[i], 10);
    }
    return NaN;
  };

  // Highlightly first (if API key is set)
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const numericGameId = resolveNumericId(gameId);
      if (isNaN(numericGameId)) throw new Error(`Cannot extract numeric gameId from: ${gameId}`);
      const [matchResult, boxResult] = await Promise.all([
        hlClient.getMatch(numericGameId),
        hlClient.getBoxScore(numericGameId),
      ]);

      if (matchResult.success && matchResult.data) {
        const game = transformHighlightlyGame(
          matchResult.data,
          boxResult.success ? (boxResult.data ?? null) : null
        );
        const payload = withMeta({ game }, 'highlightly', { fetchedAt: matchResult.timestamp });
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] game fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN game summary fallback — resolve ESPN event ID from game mapping
  // Highlightly IDs (7-digit) don't match ESPN event IDs (9-digit), so we
  // look up the mapping built during score ingestion first.
  let mappedEspnId: number | null = null;
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
    const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(
      new Date(Date.now() - 86400000)
    );
    for (const d of [today, yesterday]) {
      const mapData = await kvGet<Record<string, string>>(env.KV, `game-map:${d}`);
      if (mapData?.[gameId]) {
        mappedEspnId = parseInt(mapData[gameId], 10);
        console.info(`[game-map] resolved HL ${gameId} → ESPN ${mappedEspnId} from ${d}`);
        break;
      }
    }
  } catch (err) {
    console.warn('[game-map] lookup failed:', err instanceof Error ? err.message : err);
  }

  try {
    const client = getCollegeClient();
    const espnId = mappedEspnId ?? resolveNumericId(gameId);
    const matchResult = await client.getMatch(isNaN(espnId) ? parseInt(gameId, 10) : espnId);

    if (matchResult.success && matchResult.data) {
      const summary = matchResult.data as Record<string, unknown>;
      const game = transformEspnGameSummary(summary);

      if (game) {
        const payload = withMeta({ game }, 'espn', { fetchedAt: matchResult.timestamp });
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }
  } catch (err) {
    console.error('[espn] game detail fallback:', err instanceof Error ? err.message : err);
  }

  // Last resort: extract game from today's cached scores batch in KV.
  // The scores cache stores the raw Highlightly response (data[], plan, pagination, meta).
  // The match shape differs from HighlightlyMatch (uses state/date vs status/startTimestamp),
  // so we do a lightweight transform here instead of using transformHighlightlyGame.
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
    const scoresCached = await kvGet<Record<string, unknown>>(env.KV, `cb:scores:${today}`);
    if (scoresCached) {
      const matches = (scoresCached.data ?? []) as Array<Record<string, unknown>>;
      const numId = resolveNumericId(gameId);
      const match = matches.find((m) => {
        const mId = m.id ?? m.matchId;
        return String(mId) === gameId || Number(mId) === numId;
      });
      if (match) {
        // Lightweight transform from raw Highlightly scores shape
        const state = (match.state as Record<string, unknown>) ?? {};
        const score = (state.score as Record<string, unknown>) ?? {};
        const home = (match.homeTeam as Record<string, unknown>) ?? {};
        const away = (match.awayTeam as Record<string, unknown>) ?? {};
        const homeScore = score.home as Record<string, unknown> | undefined;
        const awayScore = score.away as Record<string, unknown> | undefined;
        const description = String(state.description ?? state.report ?? 'Scheduled');
        const isLive = description.toLowerCase().includes('inning') || description.toLowerCase().includes('progress');
        const isFinal = description.toLowerCase().includes('final');

        const awayScoreNum = Number(String(score.current ?? '0 - 0').split(' - ')[0]) || 0;
        const homeScoreNum = Number(String(score.current ?? '0 - 0').split(' - ').pop()) || 0;

        const game = {
          id: String(match.id),
          date: match.date ?? now,
          status: {
            state: isLive ? 'in' : isFinal ? 'post' : 'pre',
            detailedState: description,
            isLive,
            isFinal,
          },
          teams: {
            away: {
              name: (away.displayName ?? away.name ?? 'Away') as string,
              displayName: (away.displayName ?? away.name ?? 'Away') as string,
              abbreviation: (away.abbreviation ?? away.shortName ?? '') as string,
              score: awayScoreNum,
              isWinner: isFinal && awayScoreNum > homeScoreNum,
              logo: away.logo,
              conference: (away.conference as Record<string, unknown>)?.name,
            },
            home: {
              name: (home.displayName ?? home.name ?? 'Home') as string,
              displayName: (home.displayName ?? home.name ?? 'Home') as string,
              abbreviation: (home.abbreviation ?? home.shortName ?? '') as string,
              score: homeScoreNum,
              isWinner: isFinal && homeScoreNum > awayScoreNum,
              logo: home.logo,
              conference: (home.conference as Record<string, unknown>)?.name,
            },
          },
          venue: { name: (match.venue as Record<string, unknown>)?.name ?? 'TBD' },
        };

        const payload = withMeta({ game }, 'scores-cache', {
          fetchedAt: now,
          degraded: true,
          extra: { note: 'Extracted from scores cache — box score unavailable' },
        });
        await kvPut(env.KV, cacheKey, payload, 60);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(now, 'scores-cache'), 'X-Cache': 'DEGRADED',
        });
      }
    }
  } catch (err) {
    console.error('[scores-cache] game extraction failed:', err instanceof Error ? err.message : err);
  }

  return json(
    withMeta({ game: null }, 'error', { fetchedAt: now }),
    502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
  );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballGame]', msg);
    await logError(env, msg, 'handleCollegeBaseballGame');
    return errorJson('Internal server error');
  }
}

export async function handleCollegeBaseballSchedule(
  url: URL,
  env: Env
): Promise<Response> {
  try {
  const date = url.searchParams.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
  const range = url.searchParams.get('range') || 'week';
  const conference = url.searchParams.get('conference') || '';
  const cacheKey = `cb:schedule:${date}:${range}`;

  // This endpoint powers the live scores page, which polls every 30s.
  // Use scores-level HTTP cache (30s) instead of schedule (3600s) so
  // browsers and Cloudflare CDN don't serve stale data during live games.
  const httpCache = HTTP_CACHE.scores;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, httpCache, cachedPayloadHeaders(cached));
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballSchedule]', msg);
    await logError(env, msg, 'handleCollegeBaseballSchedule');
    return errorJson('Internal server error');
  }
}
