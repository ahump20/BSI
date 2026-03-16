import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, getSDIOClient, toDateString, freshDataHeaders, cachedDataHeaders, withMeta } from '../shared/helpers';
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
import type { BSIScoreboardResult, BSIStandingsResult } from '../../lib/api-clients/espn-types';
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
  try {
    const date = url.searchParams.get('date') || undefined;
    const dateKey = date?.replace(/-/g, '') || 'today';
    const cacheKey = `cfb:scores:${dateKey}`;
    const sdio = getSDIOClient(env);

    if (sdio) {
      // ESPN primary so game IDs match handleCFBGame (which uses ESPN getGameSummary)
      const result = await fetchWithFallback(
        async () => transformScoreboard(await getScoreboard('cfb', toDateString(date)) as Record<string, unknown>) as unknown as BSIScoreboardResult,
        async () => {
          const week = parseInt(url.searchParams.get('week') || '1', 10);
          return transformSDIOCFBScores(await sdio.getCFBScores(undefined, week));
        },
        cacheKey, env.KV, CACHE_TTL.scores,
        'espn', 'sportsdataio',
        { staleKey: `${cacheKey}:stale` },
      );
      return cachedJson(withMeta(result.data, result.source), 200, HTTP_CACHE.scores, {
        'X-Cache': result.cached ? 'HIT' : 'MISS',
        'X-Data-Source': result.source,
      });
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, cachedDataHeaders());

    const raw = await getScoreboard('cfb', toDateString(date)) as Record<string, unknown>;
    const payload = withMeta(transformScoreboard(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBScores]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBStandings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cfb:standings';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIOCFBStandings(await sdio.getCFBStandings()),
        async () => transformStandings(await getStandings('cfb') as Record<string, unknown>, 'cfb') as unknown as BSIStandingsResult,
        cacheKey, env.KV, CACHE_TTL.standings,
        'sportsdataio', 'espn',
        { staleKey: `${cacheKey}:stale` },
      );
      return cachedJson(withMeta(result.data, result.source), 200, HTTP_CACHE.standings, {
        'X-Cache': result.cached ? 'HIT' : 'MISS',
        'X-Data-Source': result.source,
      });
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedDataHeaders());

    const raw = await getStandings('cfb') as Record<string, unknown>;
    const payload = withMeta(transformStandings(raw, 'cfb'));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBStandings]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBNews(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cfb:news';

    // CFB news is not available from SDIO — use ESPN directly
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, cachedDataHeaders());

    const raw = await getNews('cfb') as Record<string, unknown>;
    const payload = withMeta(transformNews(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBNews]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
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
  try {
    const cacheKey = 'cfb:teams:list';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedDataHeaders());

    const raw = await espnGetTeams('cfb') as Record<string, unknown>;
    const payload = withMeta(transformTeams(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBTeamsList]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBTeam(teamId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `cfb:team:${teamId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedDataHeaders());

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('cfb', teamId),
      getTeamRoster('cfb', teamId),
    ]);

    const payload = withMeta(transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBTeam]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBGame(gameId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `cfb:game:${gameId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, cachedDataHeaders());

    const raw = await getGameSummary('cfb', gameId) as Record<string, unknown>;
    const payload = withMeta(transformGameSummary(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBGame]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBRankings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cfb:rankings';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.rankings, cachedDataHeaders());

    // ESPN CFB rankings — AP Poll, Coaches Poll, CFP Rankings
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(espnUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.error('[handleCFBRankings] ESPN returned', res.status);
        return json({ error: 'Rankings unavailable', status: 502 }, 502);
      }

      const raw = (await res.json()) as Record<string, unknown>;
      const polls = (raw.rankings as unknown[]) || [];

      // Transform each poll into a flat, consumer-friendly shape
      const rankings = polls.map((poll) => {
        const p = poll as Record<string, unknown>;
        const ranks = (p.ranks as Array<Record<string, unknown>>) || [];
        return {
          name: p.name || p.shortName || 'Unknown Poll',
          shortName: p.shortName || p.name || '',
          type: p.type || '',
          headline: p.headline || '',
          season: p.season,
          teams: ranks.map((entry) => {
            const team = (entry.team as Record<string, unknown>) || {};
            const logos = (team.logos as Array<Record<string, unknown>>) || [];
            return {
              rank: entry.current,
              previousRank: entry.previous,
              team: {
                id: team.id?.toString(),
                name: team.location
                  ? `${team.location} ${team.nickname || team.name || ''}`
                  : (team.nickname as string) || (team.name as string) || 'Unknown',
                abbreviation: (team.abbreviation as string) || '',
                logo: logos[0]?.href || '',
              },
              record: (entry.recordSummary as string) || '',
              points: entry.points,
              firstPlaceVotes: entry.firstPlaceVotes,
              trend: entry.trend,
            };
          }),
        };
      });

      const payload = withMeta({ rankings, timestamp: new Date().toISOString() }, 'espn');
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
      return cachedJson(payload, 200, HTTP_CACHE.rankings, freshDataHeaders('espn'));
    } catch (fetchErr) {
      clearTimeout(timer);
      throw fetchErr;
    }
  } catch (err) {
    console.error('[handleCFBRankings]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCFBPlayer(playerId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `cfb:player:${playerId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedDataHeaders());

    const raw = await getAthlete('cfb', playerId) as Record<string, unknown>;
    const payload = withMeta(transformAthlete(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, freshDataHeaders());
  } catch (err) {
    console.error('[handleCFBPlayer]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}
