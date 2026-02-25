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
  getLeaders,
  transformStandings,
  transformScoreboard,
  transformTeams,
  transformTeamDetail,
  transformAthlete,
  transformNews,
  transformGameSummary,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIONFLScores,
  transformSDIONFLStandings,
  transformSDIOTeams,
  transformSDIONews,
} from '../../lib/api-clients/sportsdataio-api';
import type {
  BSIScoreboardResult,
  BSIStandingsResult,
  BSITeamsResult,
  BSINewsResult,
} from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

export async function handleNFLScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `nfl:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    // ESPN primary so game IDs match handleNFLGame (which uses ESPN getGameSummary)
    const result = await fetchWithFallback(
      async () => transformScoreboard(await getScoreboard('nfl', toDateString(date)) as Record<string, unknown>) as unknown as BSIScoreboardResult,
      async () => transformSDIONFLScores(await sdio.getNFLScoresByDate(date)),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nfl', toDateString(date)) as Record<string, unknown>;
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

export async function handleNFLStandings(env: Env): Promise<Response> {
  const cacheKey = 'nfl:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONFLStandings(await sdio.getNFLStandings()),
      async () => transformStandings(await getStandings('nfl') as Record<string, unknown>, 'nfl') as unknown as BSIStandingsResult,
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('nfl') as Record<string, unknown>;
  const payload = transformStandings(raw, 'nfl');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

export async function handleNFLGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('nfl', gameId) as Record<string, unknown>;
  const payload = transformGameSummary(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

export async function handleNFLPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('nfl', playerId) as Record<string, unknown>;
  const payload = transformAthlete(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

export async function handleNFLTeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('nfl', teamId),
    getTeamRoster('nfl', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleNFLTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'nfl:teams:list';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getNFLTeams()),
      async () => transformTeams(await espnGetTeams('nfl') as Record<string, unknown>) as unknown as BSITeamsResult,
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nfl') as Record<string, unknown>;
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

export async function handleNFLNews(env: Env): Promise<Response> {
  const cacheKey = 'nfl:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getNFLNews()),
      async () => transformNews(await getNews('nfl') as Record<string, unknown>) as unknown as BSINewsResult,
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nfl') as Record<string, unknown>;
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

export async function handleNFLPlayers(url: URL, env: Env): Promise<Response> {
  const teamId = url.searchParams.get('teamId');

  if (teamId) {
    // Single team roster
    const cacheKey = `nfl:roster:${teamId}`;
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('nfl', teamId),
      getTeamRoster('nfl', teamId),
    ]);

    const { team, roster } = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
    const payload = {
      timestamp: new Date().toISOString(),
      team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: (team.logos?.[0] as Record<string, unknown>)?.href as string | undefined },
      players: roster.map((p: any) => ({
        ...p,
        team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: (team.logos?.[0] as Record<string, unknown>)?.href as string | undefined },
      })),
      meta: { dataSource: 'espn', lastUpdated: new Date().toISOString(), totalPlayers: roster.length },
    };

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  }

  // All players — aggregate a few popular teams
  const cacheKey = 'nfl:players:all';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const popularTeamIds = ['12', '6', '21', '8', '34', '25', '2', '33']; // KC, DAL, PHI, DET, HOU, SF, BUF, BAL
  const allPlayers: any[] = [];

  const results = await Promise.allSettled(
    popularTeamIds.map(async (id) => {
      const [teamRaw, rosterRaw] = await Promise.all([
        getTeamDetail('nfl', id),
        getTeamRoster('nfl', id),
      ]);
      return transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { team, roster } = result.value;
      for (const p of roster) {
        allPlayers.push({
          ...p,
          team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: (team.logos?.[0] as Record<string, unknown>)?.href as string | undefined },
        });
      }
    }
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);
  const payload = {
    timestamp: new Date().toISOString(),
    players: allPlayers.slice(0, limit),
    meta: { dataSource: 'espn', lastUpdated: new Date().toISOString(), totalPlayers: allPlayers.length },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

export async function handleNFLLeaders(env: Env): Promise<Response> {
  const cacheKey = 'nfl:leaders';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getLeaders('nfl') as any;

  const categories = (raw?.leaders || []).map((cat: any) => ({
    name: cat.name || cat.displayName || '',
    abbreviation: cat.abbreviation || '',
    leaders: (cat.leaders || []).slice(0, 10).map((leader: any) => ({
      name: leader.athlete?.displayName || '',
      id: leader.athlete?.id,
      team: leader.athlete?.team?.abbreviation || '',
      teamId: leader.athlete?.team?.id,
      headshot: leader.athlete?.headshot?.href || '',
      value: leader.displayValue || leader.value || '',
      stat: cat.abbreviation || cat.name || '',
    })),
  }));

  const payload = {
    categories,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}
