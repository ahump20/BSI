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

export async function handleMLBStatsLeaders(url: URL, env: Env): Promise<Response> {
  const category = url.searchParams.get('category') || 'batting';
  const stat = url.searchParams.get('stat') || (category === 'pitching' ? 'era' : 'avg');
  const cacheKey = `mlb:leaders:${category}:${stat}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  // ESPN leaders endpoint — 0=batting, 1=pitching
  const espnCategory = category === 'pitching' ? 1 : 0;
  const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/leaders?season=${new Date().getFullYear()}&seasontype=2`;

  try {
    const res = await fetch(espnUrl, { headers: { 'User-Agent': 'BSI/1.0' } });
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

    const payload = {
      leaders,
      category,
      stat,
      meta: {
        dataSource: 'ESPN',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({
      leaders: [],
      category,
      stat,
      meta: {
        dataSource: 'ESPN',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        error: err instanceof Error ? err.message : 'Failed to fetch leaders',
      },
    }, 502);
  }
}

export async function handleMLBLeaderboard(category: string, url: URL, env: Env): Promise<Response> {
  const stat = url.searchParams.get('stat') || (category === 'pitching' ? 'pit' : 'bat');
  const sortBy = url.searchParams.get('sortby') || 'WAR';
  const season = url.searchParams.get('season') || String(new Date().getFullYear());
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || '50')));
  const cacheKey = `mlb:leaderboard:${category}:${sortBy}:${season}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/leaders?season=${season}&seasontype=2`;
    const res = await fetch(espnUrl, { headers: { 'User-Agent': 'BSI/1.0' } });
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

    const payload = {
      leaderboard: { category, type: stat, season: Number(season), sortBy },
      data,
      pagination: { page: 1, pageSize: limit, totalResults: data.length, totalPages: 1 },
      meta: { dataSource: 'ESPN', lastUpdated: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS', 'X-Data-Source': 'ESPN' });
  } catch (err) {
    return json({
      leaderboard: { category, type: stat, season: Number(season), sortBy },
      data: [],
      pagination: { page, pageSize: limit, totalResults: 0, totalPages: 0 },
      meta: {
        dataSource: 'none',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        error: err instanceof Error ? err.message : 'Failed to fetch leaderboard',
      },
    }, 502);
  }
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

// =============================================================================
// Spring Training Handlers
// =============================================================================

/**
 * Spring Training scores — filters ESPN scores by SeasonType=1.
 * GET /api/mlb/spring-training/scores?date=2026-02-25
 */
export async function handleMLBSpringScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const league = url.searchParams.get('league') as STLeague | null;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `mlb:st:scores:${dateKey}`;

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    const filtered = league ? filterByLeague(cached, league) : cached;
    return cachedJson(filtered, 200, 30, { 'X-Cache': 'HIT' });
  }

  // Use ESPN with seasontype=1 (preseason/spring training)
  const espnDate = date ? date.replace(/-/g, '') : undefined;
  const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard${espnDate ? `?dates=${espnDate}&seasontype=1` : '?seasontype=1'}`;

  try {
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

    const payload = {
      games,
      count: games.length,
      date: date || new Date().toISOString().split('T')[0],
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    const ttl = hasLive ? 30 : 300;
    await kvPut(env.KV, cacheKey, payload, ttl);
    const filtered = league ? filterByLeague(payload, league) : payload;
    return cachedJson(filtered, 200, ttl, { 'X-Cache': 'MISS' });
  } catch (err) {
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
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `mlb:st:standings:${today.replace(/-/g, '')}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  // ESPN standings with seasontype=1
  try {
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

    const payload = {
      cactus,
      grapefruit,
      all: [...cactus, ...grapefruit].sort((a, b) => Number(b.winPct) - Number(a.winPct)),
      count: teams.length,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ cactus: [], grapefruit: [], error: err instanceof Error ? err.message : 'Failed' }, 502);
  }
}

/**
 * Full spring training schedule.
 * GET /api/mlb/spring-training/schedule?team=TEX
 */
export async function handleMLBSpringSchedule(url: URL, env: Env): Promise<Response> {
  const teamFilter = url.searchParams.get('team')?.toUpperCase() || null;
  const cacheKey = 'mlb:st:schedule';

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    const filtered = teamFilter ? filterScheduleByTeam(cached, teamFilter) : cached;
    return cachedJson(filtered, 200, HTTP_CACHE.schedule, { 'X-Cache': 'HIT' });
  }

  try {
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

    const payload = {
      schedule,
      count: schedule.length,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 3600);
    const filtered = teamFilter ? filterScheduleByTeam(payload, teamFilter) : payload;
    return cachedJson(filtered, 200, HTTP_CACHE.schedule, { 'X-Cache': 'MISS' });
  } catch (err) {
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
  const cacheKey = `mlb:st:roster:${teamKey.toLowerCase()}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  // ESPN team roster
  try {
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
    const payload = {
      team: teamKey,
      league,
      roster,
      count: roster.length,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 3600);
    return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ roster: [], error: err instanceof Error ? err.message : 'Failed' }, 502);
  }
}
