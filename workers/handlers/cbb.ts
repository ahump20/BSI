import type { Env } from '../shared/types';
import { cachedJson, kvGet, kvPut, getSDIOClient, toDateString } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import {
  getScoreboard,
  getStandings,
  getTeams as espnGetTeams,
  getNews,
  transformStandings,
  transformScoreboard,
  transformTeams,
  transformNews,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIOCBBScores,
  transformSDIOCBBStandings,
  transformSDIOTeams,
} from '../../lib/api-clients/sportsdataio-api';
import type { BSIScoreboardResult } from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

export async function handleCBBScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `cbb:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOCBBScores(await sdio.getCBBScores(date)),
      async () => transformScoreboard(await getScoreboard('cbb', toDateString(date)) as Record<string, unknown>) as BSIScoreboardResult,
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('cbb', toDateString(date));
  const payload = transformScoreboard(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

export async function handleCBBStandings(env: Env): Promise<Response> {
  const cacheKey = 'cbb:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOCBBStandings(await sdio.getCBBStandings()),
      async () => transformStandings(await getStandings('cbb') as Record<string, unknown>, 'cbb'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('cbb') as Record<string, unknown>;
  const payload = transformStandings(raw, 'cbb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

export async function handleCBBTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'cbb:teams:list';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getCBBTeams()),
      async () => transformTeams(await espnGetTeams('cbb') as Record<string, unknown>),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('cbb');
  const payload = transformTeams(raw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleCBBNews(env: Env): Promise<Response> {
  const cacheKey = 'cbb:news';

  // CBB news is not available from SDIO — use ESPN directly
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('cbb') as Record<string, unknown>;
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}
