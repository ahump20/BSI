import type { Env } from '../shared/types';
import { cachedJson, kvGet, kvPut, getSDIOClient, toDateString } from '../shared/helpers';
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
import type { BSIScoreboardResult } from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

export async function handleNBAScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `nba:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    // ESPN primary so game IDs match handleNBAGame (which uses ESPN getGameSummary)
    const result = await fetchWithFallback(
      async () => transformScoreboard(await getScoreboard('nba', toDateString(date)) as Record<string, unknown>) as BSIScoreboardResult,
      async () => transformSDIONBAScores(await sdio.getNBAScores(date)),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nba', toDateString(date));
  const payload = transformScoreboard(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

export async function handleNBAStandings(env: Env): Promise<Response> {
  const cacheKey = 'nba:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONBAStandings(await sdio.getNBAStandings()),
      async () => transformStandings(await getStandings('nba') as Record<string, unknown>, 'nba'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('nba');
  const payload = transformStandings(raw as Record<string, unknown>, 'nba');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

export async function handleNBAGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('nba', gameId);
  const payload = transformGameSummary(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

export async function handleNBAPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('nba', playerId);
  const payload = transformAthlete(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

export async function handleNBATeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('nba', teamId),
    getTeamRoster('nba', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleNBATeamsList(env: Env): Promise<Response> {
  const cacheKey = 'nba:teams:list';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getNBATeams()),
      async () => transformTeams(await espnGetTeams('nba') as Record<string, unknown>),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nba');
  const payload = transformTeams(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleNBANews(env: Env): Promise<Response> {
  const cacheKey = 'nba:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getNBANews()),
      async () => transformNews(await getNews('nba') as Record<string, unknown>),
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nba');
  const payload = transformNews(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

export async function handleNBATeamFull(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:team-full:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw, scheduleRaw] = await Promise.all([
    getTeamDetail('nba', teamId),
    getTeamRoster('nba', teamId),
    getTeamSchedule('nba', teamId),
  ]);

  const { team, roster } = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);

  // Extract schedule events
  const events = (scheduleRaw as any)?.events || [];
  const schedule = events.map((e: any) => ({
    id: e.id,
    date: e.date,
    name: e.name || '',
    shortName: e.shortName || '',
    competitions: e.competitions?.map((c: any) => ({
      competitors: c.competitors?.map((comp: any) => ({
        id: comp.id,
        homeAway: comp.homeAway,
        team: {
          id: comp.team?.id,
          displayName: comp.team?.displayName || '',
          abbreviation: comp.team?.abbreviation || '',
          logo: comp.team?.logo || comp.team?.logos?.[0]?.href || '',
        },
        score: comp.score?.displayValue || comp.score,
        winner: comp.winner,
      })) || [],
      status: c.status || {},
    })) || [],
  }));

  const payload = {
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
    meta: {
      source: 'espn',
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
      season: '2024-25',
    },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}
