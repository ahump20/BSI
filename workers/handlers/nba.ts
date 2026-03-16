import type { Env } from '../shared/types';
import { cachedJson, kvGet, kvPut, getSDIOClient, toDateString, freshDataHeaders, cachedPayloadHeaders, ensurePayloadMeta, fetchResultHeaders, withMeta } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import {
  getScoreboard,
  getStandings,
  getTeams as espnGetTeams,
  getTeamDetail,
  getTeamRoster,
  getGameSummary,
  getAthlete,
  getNews,
  getTeamSchedule,
  transformStandings,
  transformScoreboard,
  transformTeams,
  transformTeamDetail,
  transformAthlete,
  transformNews,
  transformGameSummary,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIONBAScores,
  transformSDIONBAStandings,
  transformSDIOTeams,
  transformSDIONews,
} from '../../lib/api-clients/sportsdataio-api';
import type {
  BSINewsResult,
  BSIScoreboardResult,
  BSIStandingsResult,
  BSITeamsResult,
} from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

export async function handleNBAScores(url: URL, env: Env): Promise<Response> {
  try {
    const date = url.searchParams.get('date') || undefined;
    const dateKey = date?.replace(/-/g, '') || 'today';
    const cacheKey = `nba:scores:${dateKey}`;
    const sdio = getSDIOClient(env);

    if (sdio) {
      // ESPN primary so game IDs match handleNBAGame (which uses ESPN getGameSummary)
      const result = await fetchWithFallback(
        async () => transformScoreboard(await getScoreboard('nba', toDateString(date)) as Record<string, unknown>) as unknown as BSIScoreboardResult,
        async () => transformSDIONBAScores(await sdio.getNBAScores(date)),
        cacheKey, env.KV, CACHE_TTL.scores,
        'espn', 'sportsdataio',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.scores, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, cachedPayloadHeaders(cached));

    const raw = await getScoreboard('nba', toDateString(date));
    const payload = withMeta(transformScoreboard(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders());
  } catch (err) {
    console.error('handleNBAScores error:', err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNBAStandings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nba:standings';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIONBAStandings(await sdio.getNBAStandings()),
        async () => transformStandings(await getStandings('nba') as Record<string, unknown>, 'nba') as unknown as BSIStandingsResult,
        cacheKey, env.KV, CACHE_TTL.standings,
        'sportsdataio', 'espn',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.standings, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const raw = await getStandings('nba');
    const payload = withMeta(transformStandings(raw as Record<string, unknown>, 'nba'));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders());
  } catch (err) {
    console.error('handleNBAStandings error:', err);
    return cachedJson({ error: 'Failed to fetch NBA standings' }, 500, 'no-store');
  }
}

export async function handleNBAGame(gameId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nba:game:${gameId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, cachedPayloadHeaders(cached));

    const raw = await getGameSummary('nba', gameId);
    const payload = withMeta(transformGameSummary(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, freshDataHeaders());
  } catch (err) {
    console.error('handleNBAGame error:', err);
    return cachedJson({ error: 'Failed to fetch NBA game' }, 500, 'no-store');
  }
}

export async function handleNBAPlayer(playerId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nba:player:${playerId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedPayloadHeaders(cached));

    const raw = await getAthlete('nba', playerId);
    const payload = withMeta(transformAthlete(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, freshDataHeaders());
  } catch (err) {
    console.error('handleNBAPlayer error:', err);
    return cachedJson({ error: 'Failed to fetch NBA player' }, 500, 'no-store');
  }
}

export async function handleNBATeam(teamId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nba:team:${teamId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('nba', teamId),
      getTeamRoster('nba', teamId),
    ]);

    const payload = withMeta(transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('handleNBATeam error:', err);
    return cachedJson({ error: 'Failed to fetch NBA team' }, 500, 'no-store');
  }
}

export async function handleNBATeamsList(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nba:teams:list';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIOTeams(await sdio.getNBATeams()),
        async () => transformTeams(await espnGetTeams('nba') as Record<string, unknown>) as unknown as BSITeamsResult,
        cacheKey, env.KV, CACHE_TTL.teams,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.team, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const raw = await espnGetTeams('nba');
    const payload = withMeta(transformTeams(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('handleNBATeamsList error:', err);
    return cachedJson({ error: 'Failed to fetch NBA teams' }, 500, 'no-store');
  }
}

export async function handleNBANews(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nba:news';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIONews(await sdio.getNBANews()),
        async () => transformNews(await getNews('nba') as Record<string, unknown>) as unknown as BSINewsResult,
        cacheKey, env.KV, CACHE_TTL.trending,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.news, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, cachedPayloadHeaders(cached));

    const raw = await getNews('nba');
    const payload = withMeta(transformNews(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, freshDataHeaders());
  } catch (err) {
    console.error('handleNBANews error:', err);
    return cachedJson({ error: 'Failed to fetch NBA news' }, 500, 'no-store');
  }
}

export async function handleNBATeamFull(teamId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nba:team-full:${teamId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const [teamRaw, rosterRaw, scheduleRaw] = await Promise.all([
      getTeamDetail('nba', teamId),
      getTeamRoster('nba', teamId),
      getTeamSchedule('nba', teamId),
    ]);

    const { team, roster } = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);

    // Extract schedule events
    const scheduleData = scheduleRaw as Record<string, unknown>;
    const events = ((scheduleData?.events || []) as Record<string, unknown>[]);
    const schedule = events.map((e) => ({
      id: e.id,
      date: e.date,
      name: (e.name as string) || '',
      shortName: (e.shortName as string) || '',
      competitions: ((e.competitions || []) as Record<string, unknown>[]).map((c) => ({
        competitors: ((c.competitors || []) as Record<string, unknown>[]).map((comp) => {
          const compTeam = (comp.team || {}) as Record<string, unknown>;
          const compLogos = (compTeam.logos || []) as Record<string, unknown>[];
          return {
            id: comp.id,
            homeAway: comp.homeAway,
            team: {
              id: compTeam.id,
              displayName: (compTeam.displayName as string) || '',
              abbreviation: (compTeam.abbreviation as string) || '',
              logo: (compTeam.logo as string) || (compLogos[0]?.href as string) || '',
            },
            score: ((comp.score as Record<string, unknown>)?.displayValue as string) || comp.score,
            winner: comp.winner,
          };
        }),
        status: c.status || {},
      })),
    }));

    const payload = withMeta({
      timestamp: new Date().toISOString(),
      team: {
        ...team,
        record: {
          overall: team.record || '',
          wins: 0,
          losses: 0,
          winPercent: 0,
          home: '-',
          away: '-',
        },
      },
      roster,
      schedule,
    }, 'espn', { extra: { season: '2024-25' } });

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('handleNBATeamFull error:', err);
    return cachedJson({ error: 'Failed to fetch NBA team details' }, 500, 'no-store');
  }
}
