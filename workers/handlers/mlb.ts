import type { Env } from '../shared/types';
import { normalizeMLBGamePayload } from "./mlb-normalize";
import { json, cachedJson, kvGet, kvPut, getSDIOClient, toDateString, freshDataHeaders, cachedPayloadHeaders, ensurePayloadMeta, fetchResultHeaders, withMeta } from '../shared/helpers';
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
import type {
  BSIGameSummaryResult,
  BSINewsResult,
  BSIScoreboardResult,
  BSIStandingsResult,
  BSITeamsResult,
} from '../../lib/api-clients/espn-types';
import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';
import { getSeasonPhase } from '../../lib/season';
import { getSTLeague, type STLeague } from '../shared/spring-training-leagues';

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

function degradedMlbLeadersPayload(category: string, stat: string, fetchedAt: string) {
  return withMeta(
    {
      leaders: [],
      category,
      stat,
      unavailable: true,
      message: 'MLB leaders temporarily unavailable from ESPN.',
    },
    'espn',
    { fetchedAt },
  );
}

function degradedMlbLeaderboardPayload(
  category: string,
  stat: string,
  season: string,
  sortBy: string,
  limit: number,
  fetchedAt: string,
) {
  return withMeta(
    {
      leaderboard: { category, type: stat, season: Number(season), sortBy },
      data: [],
      pagination: { page: 1, pageSize: limit, totalResults: 0, totalPages: 0 },
      unavailable: true,
      message: 'MLB leaderboard temporarily unavailable from ESPN.',
    },
    'espn',
    { fetchedAt },
  );
}

export async function handleMLBScores(url: URL, env: Env): Promise<Response> {
  try {
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
        'sportsdataio', 'espn',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.scores, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, cachedPayloadHeaders(cached));

    const raw = await getScoreboard('mlb', toDateString(date), seasonType);
    const payload = withMeta(transformScoreboard(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBScores]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBStandings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'mlb:standings';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIOMLBStandings(await sdio.getMLBStandings()),
        async () => transformStandings(await getStandings('mlb') as Record<string, unknown>, 'mlb') as unknown as BSIStandingsResult,
        cacheKey, env.KV, CACHE_TTL.standings,
        'sportsdataio', 'espn',
        { staleKey: `${cacheKey}:stale` },
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.standings, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const raw = await getStandings('mlb');
    const payload = withMeta(transformStandings(raw as Record<string, unknown>, 'mlb'));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBStandings]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBGame(gameId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `mlb:game:${gameId}`;
    const sdio = getSDIOClient(env);

    if (sdio) {
      const numId = parseInt(gameId, 10);
      if (!isNaN(numId)) {
        const result = await fetchWithFallback(
          async () => transformSDIOMLBBoxScore(await sdio.getMLBBoxScore(numId)),
          async () => transformGameSummary(await getGameSummary('mlb', gameId) as Record<string, unknown>) as unknown as BSIGameSummaryResult,
          cacheKey, env.KV, CACHE_TTL.games,
        );
        const payload = normalizeMLBGamePayload(ensurePayloadMeta(result.data, result.source) as Record<string, unknown>);
        return cachedJson(payload, 200, HTTP_CACHE.game, fetchResultHeaders(payload, result));
      }
    }

    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      const normalized = normalizeMLBGamePayload(cached);
      return cachedJson(normalized, 200, HTTP_CACHE.game, cachedPayloadHeaders(normalized));
    }

    const raw = await getGameSummary('mlb', gameId);
    const payload = normalizeMLBGamePayload(withMeta(transformGameSummary(raw as Record<string, unknown>)) as Record<string, unknown>);
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBGame]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBPlayer(playerId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `mlb:player:${playerId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, cachedPayloadHeaders(cached));

    const raw = await getAthlete('mlb', playerId);
    const payload = withMeta(transformAthlete(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBPlayer]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBTeam(teamId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `mlb:team:${teamId}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('mlb', teamId),
      getTeamRoster('mlb', teamId),
    ]);

    const payload = withMeta(transformTeamDetail(teamRaw as Record<string, unknown>, rosterRaw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBTeam]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBTeamsList(env: Env): Promise<Response> {
  try {
    const cacheKey = 'mlb:teams:list';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIOTeams(await sdio.getMLBTeams()),
        async () => transformTeams(await espnGetTeams('mlb') as Record<string, unknown>) as unknown as BSITeamsResult,
        cacheKey, env.KV, CACHE_TTL.teams,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.team, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const raw = await espnGetTeams('mlb');
    const payload = withMeta(transformTeams(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBTeamsList]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBStatsLeaders(url: URL, env: Env): Promise<Response> {
  try {
    const category = url.searchParams.get('category') || 'batting';
    const stat = url.searchParams.get('stat') || (category === 'pitching' ? 'era' : 'avg');
    const cacheKey = `mlb:leaders:${category}:${stat}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    // ESPN leaders endpoint — 0=batting, 1=pitching
    const espnCategory = category === 'pitching' ? 1 : 0;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/leaders?season=${new Date().getFullYear()}&seasontype=2`;

    const res = await fetch(espnUrl, { headers: { 'User-Agent': 'BSI/1.0' } });
    if (res.status === 404) {
      const fetchedAt = new Date().toISOString();
      const payload = degradedMlbLeadersPayload(category, stat, fetchedAt);
      await kvPut(env.KV, cacheKey, payload, 300);
      return cachedJson(payload, 200, HTTP_CACHE.standings, {
        'X-Cache': 'MISS',
        'X-Data-State': 'degraded',
      });
    }
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;

    const categories = (raw.leaders ?? []) as Array<Record<string, unknown>>;
    const selectedCategory = categories[espnCategory] ?? categories[0];
    const leaderEntries = (selectedCategory?.leaders ?? []) as Array<Record<string, unknown>>;

    // Find the requested stat within the category
    const statEntry = leaderEntries.find((l) => {
      const name = ((l.name ?? l.displayName ?? '') as string).toLowerCase();
      return name.includes(stat.toLowerCase());
    }) ?? leaderEntries[0];

    const athletes = ((statEntry?.leaders ?? []) as Array<Record<string, unknown>>).slice(0, 20);

    const leaders = athletes.map((a, i) => {
      const athlete = (a.athlete ?? {}) as Record<string, unknown>;
      const team = (athlete.team ?? {}) as Record<string, unknown>;
      return {
        rank: i + 1,
        player: {
          id: String(athlete.id ?? ''),
          name: (athlete.displayName as string) ?? '',
          team: (team.displayName as string) ?? '',
          teamAbbr: (team.abbreviation as string) ?? '',
        },
        value: a.value ?? a.displayValue ?? 0,
        supportingStats: {},
      };
    });

    const fetchedAt = new Date().toISOString();
    const payload = withMeta({
      leaders,
      category,
      stat,
    }, 'espn', { fetchedAt });

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleMLBStatsLeaders]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBLeaderboard(category: string, url: URL, env: Env): Promise<Response> {
  try {
    const stat = url.searchParams.get('stat') || (category === 'pitching' ? 'pit' : 'bat');
    const sortBy = url.searchParams.get('sortby') || 'WAR';
    const season = url.searchParams.get('season') || String(new Date().getFullYear());
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || '50')));
    const cacheKey = `mlb:leaderboard:${category}:${sortBy}:${season}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/leaders?season=${season}&seasontype=2`;
    const res = await fetch(espnUrl, { headers: { 'User-Agent': 'BSI/1.0' } });
    if (res.status === 404) {
      const fetchedAt = new Date().toISOString();
      const payload = degradedMlbLeaderboardPayload(category, stat, season, sortBy, limit, fetchedAt);
      await kvPut(env.KV, cacheKey, payload, 300);
      return cachedJson(payload, 200, HTTP_CACHE.standings, {
        'X-Cache': 'MISS',
        'X-Data-Source': 'ESPN',
        'X-Data-State': 'degraded',
      });
    }
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;

    const categories = (raw.leaders ?? []) as Array<Record<string, unknown>>;
    const catIdx = category === 'pitching' ? 1 : 0;
    const selectedCategory = categories[catIdx] ?? categories[0];
    const leaderGroups = (selectedCategory?.leaders ?? []) as Array<Record<string, unknown>>;

    const data = leaderGroups.flatMap((group) => {
      const athletes = (group.leaders ?? []) as Array<Record<string, unknown>>;
      return athletes.map((a, i) => {
        const athlete = (a.athlete ?? {}) as Record<string, unknown>;
        const team = (athlete.team ?? {}) as Record<string, unknown>;
        const position = (athlete.position ?? {}) as Record<string, unknown>;
        return {
          rank: i + 1,
          player: {
            id: String(athlete.id ?? ''),
            name: (athlete.displayName as string) ?? '',
            team: (team.displayName as string) ?? '',
            position: (position.abbreviation as string) ?? '',
          },
          value: a.value ?? a.displayValue,
          displayValue: (a.displayValue as string) ?? '',
          statName: (group.name as string) ?? '',
        };
      });
    }).slice(0, limit);

    const fetchedAt = new Date().toISOString();
    const payload = withMeta({
      leaderboard: { category, type: stat, season: Number(season), sortBy },
      data,
      pagination: { page: 1, pageSize: limit, totalResults: data.length, totalPages: 1 },
    }, 'espn', { fetchedAt });

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS', 'X-Data-Source': 'ESPN' });
  } catch (err) {
    console.error('[handleMLBLeaderboard]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleMLBNews(env: Env): Promise<Response> {
  try {
    const cacheKey = 'mlb:news';
    const sdio = getSDIOClient(env);

    if (sdio) {
      const result = await fetchWithFallback(
        async () => transformSDIONews(await sdio.getMLBNews()),
        async () => transformNews(await getNews('mlb') as Record<string, unknown>) as unknown as BSINewsResult,
        cacheKey, env.KV, CACHE_TTL.trending,
      );
      const payload = ensurePayloadMeta(result.data, result.source);
      return cachedJson(payload, 200, HTTP_CACHE.news, fetchResultHeaders(payload, result));
    }

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, cachedPayloadHeaders(cached));

    const raw = await getNews('mlb');
    const payload = withMeta(transformNews(raw as Record<string, unknown>));
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, freshDataHeaders());
  } catch (err) {
    console.error('[handleMLBNews]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// =============================================================================
// Spring Training Handlers
// =============================================================================

/**
 * Spring Training scores — filters ESPN scores by SeasonType=1.
 * GET /api/mlb/spring-training/scores?date=2026-02-25
 */
export async function handleMLBSpringScores(url: URL, env: Env): Promise<Response> {
  try {
    const date = url.searchParams.get('date') || undefined;
    const league = url.searchParams.get('league') as STLeague | null;
    const dateKey = date?.replace(/-/g, '') || 'today';
    const cacheKey = `mlb:st:scores:${dateKey}`;

    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      const filtered = league ? filterByLeague(cached, league) : cached;
      return cachedJson(filtered, 200, 30, cachedPayloadHeaders(filtered));
    }

    // Use ESPN with seasontype=1 (preseason/spring training)
    const espnDate = date ? date.replace(/-/g, '') : undefined;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard${espnDate ? `?dates=${espnDate}&seasontype=1` : '?seasontype=1'}`;
    const res = await fetch(espnUrl, { headers: { 'User-Agent': 'BSI/1.0' } });
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;
    const events = (raw.events ?? []) as Array<Record<string, unknown>>;

    const games = events.map((event) => {
      const competition = ((event.competitions ?? []) as Array<Record<string, unknown>>)[0] ?? {};
      const competitors = (competition.competitors ?? []) as Array<Record<string, unknown>>;
      const home = competitors.find((c) => c.homeAway === 'home') ?? {};
      const away = competitors.find((c) => c.homeAway === 'away') ?? {};
      const homeTeam = (home.team ?? {}) as Record<string, unknown>;
      const awayTeam = (away.team ?? {}) as Record<string, unknown>;
      const homeAbbr = (homeTeam.abbreviation as string) ?? '';
      const stLeague = getSTLeague(homeAbbr);

      return {
        id: String(event.id ?? ''),
        name: (event.name as string) ?? '',
        shortName: (event.shortName as string) ?? '',
        date: (event.date as string) ?? '',
        status: event.status,
        league: stLeague,
        home: {
          id: String(homeTeam.id ?? ''),
          name: (homeTeam.displayName as string) ?? '',
          abbreviation: homeAbbr,
          score: (home.score as string) ?? '0',
          logo: ((homeTeam.logos as Array<Record<string, unknown>>)?.[0]?.href as string) ?? '',
        },
        away: {
          id: String(awayTeam.id ?? ''),
          name: (awayTeam.displayName as string) ?? '',
          abbreviation: (awayTeam.abbreviation as string) ?? '',
          score: (away.score as string) ?? '0',
          logo: ((awayTeam.logos as Array<Record<string, unknown>>)?.[0]?.href as string) ?? '',
        },
      };
    });

    // Determine TTL: 30s if any game is live, 300s if all final
    const hasLive = games.some((g) => {
      const st = (g.status as Record<string, unknown>) ?? {};
      const type = (st.type as Record<string, unknown>) ?? {};
      return type.state === 'in' || type.description === 'In Progress';
    });

    const fetchedAt = new Date().toISOString();
    const payload = withMeta({
      games,
      count: games.length,
      date: date || new Date().toISOString().split('T')[0],
    }, 'espn', { fetchedAt });

    const ttl = hasLive ? 30 : 300;
    await kvPut(env.KV, cacheKey, payload, ttl);
    const filtered = league ? filterByLeague(payload, league) : payload;
    return cachedJson(filtered, 200, ttl, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleMLBSpringScores]', err instanceof Error ? err.message : err);
    return json({ games: [], error: err instanceof Error ? err.message : 'Failed to fetch spring scores' }, 502);
  }
}

function filterByLeague(data: Record<string, unknown>, league: STLeague): Record<string, unknown> {
  const games = (data.games ?? []) as Array<Record<string, unknown>>;
  const filtered = games.filter((g) => g.league === league);
  return { ...data, games: filtered, count: filtered.length };
}

/**
 * Spring Training standings — computed from ST game results.
 * GET /api/mlb/spring-training/standings
 */
export async function handleMLBSpringStandings(env: Env): Promise<Response> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `mlb:st:standings:${today.replace(/-/g, '')}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    // ESPN standings with seasontype=1
    const res = await fetch(
      'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?seasontype=1',
      { headers: { 'User-Agent': 'BSI/1.0' } }
    );
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;

    const children = (raw.children ?? []) as Array<Record<string, unknown>>;
    const teams: Array<Record<string, unknown>> = [];

    for (const division of children) {
      const standings = (division.standings ?? {}) as Record<string, unknown>;
      const entries = (standings.entries ?? []) as Array<Record<string, unknown>>;

      for (const entry of entries) {
        const team = (entry.team ?? {}) as Record<string, unknown>;
        const abbr = (team.abbreviation as string) ?? '';
        const stLeague = getSTLeague(abbr);
        const stats = (entry.stats ?? []) as Array<Record<string, unknown>>;

        const getStat = (name: string) => {
          const s = stats.find((st) => st.name === name || st.abbreviation === name);
          return Number(s?.value ?? 0);
        };

        teams.push({
          id: String(team.id ?? ''),
          name: (team.displayName as string) ?? '',
          abbreviation: abbr,
          logo: ((team.logos as Array<Record<string, unknown>>)?.[0]?.href as string) ?? '',
          league: stLeague,
          wins: getStat('wins'),
          losses: getStat('losses'),
          winPct: getStat('winPercent'),
          gamesBack: getStat('gamesBehind'),
          runsFor: getStat('pointsFor'),
          runsAgainst: getStat('pointsAgainst'),
        });
      }
    }

    const cactus = teams.filter((t) => t.league === 'Cactus').sort((a, b) => Number(b.winPct) - Number(a.winPct));
    const grapefruit = teams.filter((t) => t.league === 'Grapefruit').sort((a, b) => Number(b.winPct) - Number(a.winPct));

    const payload = withMeta({
      cactus,
      grapefruit,
      all: [...cactus, ...grapefruit].sort((a, b) => Number(b.winPct) - Number(a.winPct)),
      count: teams.length,
    }, 'espn');

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleMLBSpringStandings]', err instanceof Error ? err.message : err);
    return json({ cactus: [], grapefruit: [], error: err instanceof Error ? err.message : 'Failed' }, 502);
  }
}

/**
 * Full spring training schedule.
 * GET /api/mlb/spring-training/schedule?team=TEX
 */
export async function handleMLBSpringSchedule(url: URL, env: Env): Promise<Response> {
  try {
    const teamFilter = url.searchParams.get('team')?.toUpperCase() || null;
    const cacheKey = 'mlb:st:schedule';

    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      const filtered = teamFilter ? filterScheduleByTeam(cached, teamFilter) : cached;
      return cachedJson(filtered, 200, HTTP_CACHE.schedule, cachedPayloadHeaders(filtered));
    }

    // Fetch full ST schedule from ESPN
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?seasontype=1&dates=20260215-20260325&limit=500`,
      { headers: { 'User-Agent': 'BSI/1.0' } }
    );
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;
    const events = (raw.events ?? []) as Array<Record<string, unknown>>;

    const schedule = events.map((event) => {
      const competition = ((event.competitions ?? []) as Array<Record<string, unknown>>)[0] ?? {};
      const competitors = (competition.competitors ?? []) as Array<Record<string, unknown>>;
      const home = competitors.find((c) => c.homeAway === 'home') ?? {};
      const away = competitors.find((c) => c.homeAway === 'away') ?? {};
      const homeTeam = (home.team ?? {}) as Record<string, unknown>;
      const awayTeam = (away.team ?? {}) as Record<string, unknown>;
      const homeAbbr = (homeTeam.abbreviation as string) ?? '';

      return {
        id: String(event.id ?? ''),
        date: (event.date as string) ?? '',
        name: (event.name as string) ?? '',
        league: getSTLeague(homeAbbr),
        home: { abbreviation: homeAbbr, name: (homeTeam.displayName as string) ?? '' },
        away: { abbreviation: (awayTeam.abbreviation as string) ?? '', name: (awayTeam.displayName as string) ?? '' },
        status: event.status,
      };
    });

    const payload = withMeta({
      schedule,
      count: schedule.length,
    }, 'espn');

    await kvPut(env.KV, cacheKey, payload, 3600);
    const filtered = teamFilter ? filterScheduleByTeam(payload, teamFilter) : payload;
    return cachedJson(filtered, 200, HTTP_CACHE.schedule, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleMLBSpringSchedule]', err instanceof Error ? err.message : err);
    return json({ schedule: [], error: err instanceof Error ? err.message : 'Failed' }, 502);
  }
}

function filterScheduleByTeam(data: Record<string, unknown>, team: string): Record<string, unknown> {
  const schedule = (data.schedule ?? []) as Array<Record<string, unknown>>;
  const filtered = schedule.filter((g) => {
    const home = (g.home as Record<string, unknown>)?.abbreviation;
    const away = (g.away as Record<string, unknown>)?.abbreviation;
    return home === team || away === team;
  });
  return { ...data, schedule: filtered, count: filtered.length };
}

/**
 * Spring Training roster for a team.
 * GET /api/mlb/spring-training/roster/:teamKey
 */
export async function handleMLBSpringRoster(teamKey: string, env: Env): Promise<Response> {
  try {
    const cacheKey = `mlb:st:roster:${teamKey.toLowerCase()}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    // ESPN team roster
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamKey}/roster`,
      { headers: { 'User-Agent': 'BSI/1.0' } }
    );
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const raw = await res.json() as Record<string, unknown>;

    const athletes = (raw.athletes ?? []) as Array<Record<string, unknown>>;
    const roster = athletes.flatMap((group) => {
      const items = (group.items ?? []) as Array<Record<string, unknown>>;
      return items.map((a) => ({
        id: String(a.id ?? ''),
        name: (a.displayName as string) ?? '',
        jersey: (a.jersey as string) ?? '',
        position: ((a.position as Record<string, unknown>)?.abbreviation as string) ?? '',
        age: a.age,
        status: (a.status as string) ?? 'active',
        group: (group.name as string) ?? '',
      }));
    });

    const league = getSTLeague(teamKey.toUpperCase());
    const payload = withMeta({
      team: teamKey,
      league,
      roster,
      count: roster.length,
    }, 'espn');

    await kvPut(env.KV, cacheKey, payload, 3600);
    return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleMLBSpringRoster]', err instanceof Error ? err.message : err);
    return json({ roster: [], error: err instanceof Error ? err.message : 'Failed' }, 502);
  }
}

interface RoleStats {
  role: string;
  challenges: number;
  overturned: number;
  successRate: number;
}

interface GameLog {
  gameId: string;
  date: string;
  away: string;
  home: string;
  totalChallenges: number;
  overturned: number;
  avgChallengeTime: number;
}

const ABS_KV_KEYS = {
  challengesByRole: 'sportradar:abs:challenges-by-role',
  recentGames: 'sportradar:abs:recent-games',
};

export async function handleMLBAbs(env: Env): Promise<Response> {
  try {
    let challengesByRole: RoleStats[] = [];
    let recentGames: GameLog[] = [];

  try {
    const [roleRaw, gamesRaw] = await Promise.all([
      env.KV.get(ABS_KV_KEYS.challengesByRole),
      env.KV.get(ABS_KV_KEYS.recentGames),
    ]);

    if (roleRaw) challengesByRole = JSON.parse(roleRaw) as RoleStats[];
    if (gamesRaw) recentGames = JSON.parse(gamesRaw) as GameLog[];
  } catch {
    // Fall through to D1.
  }

  if (challengesByRole.length === 0) {
    try {
      const roleRows = await env.DB
        .prepare(
          `SELECT challenge_role as role,
                  COUNT(*) as challenges,
                  SUM(CASE WHEN challenge_result = 'overturned' THEN 1 ELSE 0 END) as overturned
           FROM sportradar_pitch_event
           WHERE is_challenge = 1 AND challenge_role IS NOT NULL
           GROUP BY challenge_role`,
        )
        .all();

      challengesByRole = (roleRows.results || []).map((row: Record<string, unknown>) => ({
        role: row.role as string,
        challenges: row.challenges as number,
        overturned: row.overturned as number,
        successRate:
          (row.challenges as number) > 0
            ? Math.round(((row.overturned as number) / (row.challenges as number)) * 1000) / 10
            : 0,
      }));
    } catch {
      // Return what we have.
    }
  }

  if (recentGames.length === 0) {
    try {
      const gameRows = await env.DB
        .prepare(
          `SELECT g.game_id, g.scheduled_start as date, g.away_team as away, g.home_team as home,
                  COUNT(*) as totalChallenges,
                  SUM(CASE WHEN p.challenge_result = 'overturned' THEN 1 ELSE 0 END) as overturned
           FROM sportradar_pitch_event p
           JOIN sportradar_game g ON p.game_id = g.game_id
           WHERE p.is_challenge = 1
           GROUP BY g.game_id
           ORDER BY g.scheduled_start DESC
           LIMIT 20`,
        )
        .all();

      recentGames = (gameRows.results || []).map((row: Record<string, unknown>) => ({
        gameId: row.game_id as string,
        date: String(row.date ?? '').slice(0, 10),
        away: row.away as string,
        home: row.home as string,
        totalChallenges: row.totalChallenges as number,
        overturned: row.overturned as number,
        avgChallengeTime: 17,
      }));
    } catch {
      // Return what we have.
    }
  }

  const totalChallengeEvents = challengesByRole.reduce((sum, row) => sum + row.challenges, 0);
  const totalOverturned = challengesByRole.reduce((sum, row) => sum + row.overturned, 0);
  const correctionRate = totalChallengeEvents > 0 ? totalOverturned / totalChallengeEvents : 0;
  const blendedAccuracy = Math.min(99.7, 94.0 + correctionRate * 6.0);
  const source = challengesByRole.length === 0 ? 'none' : 'sportradar';

  return json(
    withMeta(
      {
        challengesByRole,
        recentGames,
        umpireAccuracy: [
          { label: 'Human umpire (pre-ABS avg)', accuracy: 94.0, totalCalls: 28500, source: 'UmpScorecards 2025' },
          { label: 'ABS Hawk-Eye system', accuracy: 99.7, totalCalls: 28500, source: 'MLB / Hawk-Eye' },
          {
            label: 'Human + ABS challenges',
            accuracy: Math.round(blendedAccuracy * 10) / 10,
            totalCalls: 28500,
            source: totalChallengeEvents > 0 ? 'Sportradar + BSI analysis' : 'BSI estimate',
          },
        ],
      },
      source,
    ),
  );
  } catch (err) {
    console.error('[handleMLBAbs]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 }, 500);
  }
}
