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
  try {
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
        'espn', 'sportsdataio',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.scores, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, cachedPayloadHeaders(cached));

    const raw = await getScoreboard('nfl', toDateString(date)) as Record<string, unknown>;
    const payload = withMeta(transformScoreboard(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLStandings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nfl:standings';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIONFLStandings(await sdio.getNFLStandings()),
        async () => transformStandings(await getStandings('nfl') as Record<string, unknown>, 'nfl') as unknown as BSIStandingsResult,
        cacheKey, env.KV, CACHE_TTL.standings,
        'sportsdataio', 'espn',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.standings, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const raw = await getStandings('nfl') as Record<string, unknown>;
    const payload = withMeta(transformStandings(raw, 'nfl'));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLGame(gameId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nfl:game:${gameId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, cachedPayloadHeaders(cached));

    const raw = await getGameSummary('nfl', gameId) as Record<string, unknown>;
    const payload = withMeta(transformGameSummary(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLPlayer(playerId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nfl:player:${playerId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedPayloadHeaders(cached));

    const raw = await getAthlete('nfl', playerId) as Record<string, unknown>;
    const payload = withMeta(transformAthlete(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLTeam(teamId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `nfl:team:${teamId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('nfl', teamId),
      getTeamRoster('nfl', teamId),
    ]);

    const payload = withMeta(transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLTeamsList(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nfl:teams:list';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIOTeams(await sdio.getNFLTeams()),
        async () => transformTeams(await espnGetTeams('nfl') as Record<string, unknown>) as unknown as BSITeamsResult,
        cacheKey, env.KV, CACHE_TTL.teams,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.team, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const raw = await espnGetTeams('nfl') as Record<string, unknown>;
    const payload = withMeta(transformTeams(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLNews(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nfl:news';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIONews(await sdio.getNFLNews()),
        async () => transformNews(await getNews('nfl') as Record<string, unknown>) as unknown as BSINewsResult,
        cacheKey, env.KV, CACHE_TTL.trending,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.news, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, cachedPayloadHeaders(cached));

    const raw = await getNews('nfl') as Record<string, unknown>;
    const payload = withMeta(transformNews(raw));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, freshDataHeaders());
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLPlayers(url: URL, env: Env): Promise<Response> {
  try {
    const teamId = url.searchParams.get('teamId');

    if (teamId) {
      // Single team roster
      const cacheKey = `nfl:roster:${teamId}`;
      const cached = await kvGet<unknown>(env.KV, cacheKey);
      if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedPayloadHeaders(cached));

      const [teamRaw, rosterRaw] = await Promise.all([
        getTeamDetail('nfl', teamId),
        getTeamRoster('nfl', teamId),
      ]);

      const { team, roster } = transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>);
      const fetchedAt = new Date().toISOString();
      const payload = withMeta({
        timestamp: new Date().toISOString(),
        team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: (team.logos?.[0] as Record<string, unknown>)?.href as string | undefined },
        players: roster.map((p) => ({
          ...p,
          team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: (team.logos?.[0] as Record<string, unknown>)?.href as string | undefined },
        })),
      }, 'espn', { fetchedAt, extra: { totalPlayers: roster.length } });

      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
      return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
    }

    // All players — aggregate a few popular teams
    const cacheKey = 'nfl:players:all';
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedPayloadHeaders(cached));

    const popularTeamIds = ['12', '6', '21', '8', '34', '25', '2', '33']; // KC, DAL, PHI, DET, HOU, SF, BUF, BAL
    const allPlayers: Array<Record<string, unknown>> = [];

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
    const fetchedAt = new Date().toISOString();
    const payload = withMeta({
      timestamp: new Date().toISOString(),
      players: allPlayers.slice(0, limit),
    }, 'espn', { fetchedAt, extra: { totalPlayers: allPlayers.length } });

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleNFLLeaders(env: Env): Promise<Response> {
  try {
    const cacheKey = 'nfl:leaders';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const raw = await getLeaders('nfl') as Record<string, unknown>;

    const categories = ((raw?.leaders || []) as Record<string, unknown>[]).map((cat) => {
      const catLeaders = (cat.leaders || []) as Record<string, unknown>[];
      return {
        name: (cat.name as string) || (cat.displayName as string) || '',
        abbreviation: (cat.abbreviation as string) || '',
        leaders: catLeaders.slice(0, 10).map((leader) => {
          const athlete = (leader.athlete || {}) as Record<string, unknown>;
          const team = (athlete.team || {}) as Record<string, unknown>;
          const headshot = (athlete.headshot || {}) as Record<string, unknown>;
          return {
            name: (athlete.displayName as string) || '',
            id: athlete.id,
            team: (team.abbreviation as string) || '',
            teamId: team.id,
            headshot: (headshot.href as string) || '',
            value: (leader.displayValue as string) || leader.value || '',
            stat: (cat.abbreviation as string) || (cat.name as string) || '',
          };
        }),
      };
    });

    const payload = withMeta({
      categories,
    }, 'espn');

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}
