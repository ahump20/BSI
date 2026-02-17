import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, getSDIOClient, toDateString } from '../shared/helpers';
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
  transformStandings,
  transformScoreboard,
  transformTeams,
  transformTeamDetail,
  transformAthlete,
  transformNews,
  transformGameSummary,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIOMLBScores,
  transformSDIOMLBStandings,
  transformSDIOTeams,
  transformSDIONews,
  transformSDIOMLBBoxScore,
} from '../../lib/api-clients/sportsdataio-api';
import type { BSIScoreboardResult } from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';
import { getSeasonPhase } from '../../lib/season';

/** Map BSI season phase to ESPN seasontype query param. */
function getESPNSeasonType(date?: Date): number | undefined {
  const season = getSeasonPhase('mlb', date ?? new Date());
  switch (season.phase) {
    case 'preseason': return 1; // Spring Training
    case 'regular': return 2;
    case 'postseason': return 3;
    default: return undefined; // offseason — let ESPN decide
  }
}

export async function handleMLBScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const seasonType = getESPNSeasonType(date ? new Date(date) : undefined);
  const cacheKey = `mlb:scores:${dateKey}:st${seasonType ?? 'auto'}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOMLBScores(await sdio.getMLBScores(date)),
      async () => transformScoreboard(await getScoreboard('mlb', toDateString(date), seasonType) as Record<string, unknown>) as unknown as BSIScoreboardResult,
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('mlb', toDateString(date), seasonType);
  const payload = transformScoreboard(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

export async function handleMLBStandings(env: Env): Promise<Response> {
  const cacheKey = 'mlb:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOMLBStandings(await sdio.getMLBStandings()),
      async () => transformStandings(await getStandings('mlb') as Record<string, unknown>, 'mlb'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('mlb');
  const payload = transformStandings(raw as Record<string, unknown>, 'mlb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

export async function handleMLBGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:game:${gameId}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const numId = parseInt(gameId, 10);
    if (!isNaN(numId)) {
      const result = await fetchWithFallback(
        async () => transformSDIOMLBBoxScore(await sdio.getMLBBoxScore(numId)),
        async () => transformGameSummary(await getGameSummary('mlb', gameId) as Record<string, unknown>),
        cacheKey, env.KV, CACHE_TTL.games,
      );
      return cachedJson(result.data, 200, HTTP_CACHE.game, {
        'X-Cache': result.cached ? 'HIT' : 'MISS',
        'X-Data-Source': result.source,
      });
    }
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('mlb', gameId);
  const payload = transformGameSummary(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

export async function handleMLBPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('mlb', playerId);
  const payload = transformAthlete(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

export async function handleMLBTeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('mlb', teamId),
    getTeamRoster('mlb', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleMLBTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'mlb:teams:list';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getMLBTeams()),
      async () => transformTeams(await espnGetTeams('mlb') as Record<string, unknown>),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('mlb');
  const payload = transformTeams(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleMLBNews(env: Env): Promise<Response> {
  const cacheKey = 'mlb:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getMLBNews()),
      async () => transformNews(await getNews('mlb') as Record<string, unknown>),
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('mlb');
  const payload = transformNews(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}
