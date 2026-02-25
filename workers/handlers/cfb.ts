import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, getSDIOClient, toDateString } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import {
  getScoreboard,
  getStandings,
  getNews,
  getTeams as espnGetTeams,
  getTeamDetail,
  getTeamRoster,
  getGameSummary,
  getAthlete,
  transformStandings,
  transformScoreboard,
  transformNews,
  transformTeams,
  transformTeamDetail,
  transformAthlete,
  transformGameSummary,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIOCFBScores,
  transformSDIOCFBStandings,
} from '../../lib/api-clients/sportsdataio-api';
import type { BSIScoreboardResult } from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

export async function handleCFBTransferPortal(env: Env): Promise<Response> {
  const raw = await env.KV.get('portal:cfb:entries', 'text');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      return cachedJson(data, 200, HTTP_CACHE.trending);
    } catch {
      // Corrupt KV entry — fall through
    }
  }
  return json({ entries: [], lastUpdated: null, message: 'No portal data available yet' }, 200);
}

export async function handleCFBScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `cfb:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => {
        const week = parseInt(url.searchParams.get('week') || '1', 10);
        return transformSDIOCFBScores(await sdio.getCFBScores(undefined, week));
      },
      async () => transformScoreboard(await getScoreboard('cfb', toDateString(date)) as Record<string, unknown>) as unknown as BSIScoreboardResult,
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('cfb', toDateString(date)) as Record<string, unknown>;
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

export async function handleCFBStandings(env: Env): Promise<Response> {
  const cacheKey = 'cfb:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOCFBStandings(await sdio.getCFBStandings()),
      async () => transformStandings(await getStandings('cfb') as Record<string, unknown>, 'cfb'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('cfb') as Record<string, unknown>;
  const payload = transformStandings(raw, 'cfb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

export async function handleCFBNews(env: Env): Promise<Response> {
  const cacheKey = 'cfb:news';

  // CFB news is not available from SDIO — use ESPN directly
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('cfb') as Record<string, unknown>;
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

export async function handleCFBArticle(slug: string, env: Env): Promise<Response> {
  const cacheKey = `cfb:article:${slug}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM articles WHERE slug = ? AND sport = 'college-football' LIMIT 1`
    ).bind(slug).first();

    if (!row) {
      return json({ error: 'Article not found' }, 404);
    }

    const payload = {
      article: row,
      meta: { source: 'BSI D1', timezone: 'America/Chicago' },
    };
    await kvPut(env.KV, cacheKey, payload, 900);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ error: 'Article not found' }, 404);
  }
}

export async function handleCFBArticlesList(url: URL, env: Env): Promise<Response> {
  const type = url.searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const cacheKey = `cfb:articles:${type}:${limit}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  try {
    const whereClause = type !== 'all'
      ? `WHERE sport = 'college-football' AND article_type = ?`
      : `WHERE sport = 'college-football'`;
    const bindings = type !== 'all' ? [type, limit] : [limit];

    const { results } = await env.DB.prepare(
      `SELECT id, article_type, title, slug, summary, home_team_name, away_team_name,
              game_date, conference, published_at
       FROM articles ${whereClause}
       ORDER BY published_at DESC LIMIT ?`
    ).bind(...bindings).all();

    const payload = { articles: results || [], meta: { source: 'BSI D1' } };
    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ articles: [], meta: { source: 'BSI D1' } }, 200);
  }
}

export async function handleCFBTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'cfb:teams:list';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('cfb') as Record<string, unknown>;
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleCFBTeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `cfb:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('cfb', teamId),
    getTeamRoster('cfb', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleCFBGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `cfb:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('cfb', gameId) as Record<string, unknown>;
  const payload = transformGameSummary(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

export async function handleCFBPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `cfb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('cfb', playerId) as Record<string, unknown>;
  const payload = transformAthlete(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}
