import { Hono } from 'hono';
import type { Env } from '../env';
import { createNcaaClient } from '../../../lib/api-clients/ncaa-api';
import { withCache, CACHE_TTL, HTTP_CACHE } from '../middleware/cache';
import type { HighlightlyMatch } from '../../../lib/api-clients/highlightly-api';

const app = new Hono<{ Bindings: Env }>();

function dataHeaders(lastUpdated: string): Record<string, string> {
  return { 'X-Last-Updated': lastUpdated, 'X-Data-Source': 'ESPN College Baseball' };
}

function responseMeta(): { dataSource: string; lastUpdated: string; timezone: string } {
  return {
    dataSource: 'ESPN College Baseball',
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago',
  };
}

function cachedResponse(c: any, data: unknown, status: number, maxAge: number, extra: Record<string, string> = {}) {
  return c.json(data, status, {
    'Cache-Control': `public, max-age=${maxAge}`,
    ...extra,
  });
}

async function getD1RankingsFallback(db: Env['DB'] | undefined): Promise<unknown[]> {
  if (!db) return [];

  const queries = [
    `SELECT rank, team AS name, record, conference
     FROM college_baseball_rankings
     ORDER BY rank ASC
     LIMIT 25`,
    `SELECT rank, team_name AS name, record, conference
     FROM d1_baseball_rankings
     ORDER BY rank ASC
     LIMIT 25`,
    `SELECT rank, team_name AS name, record, conference
     FROM rankings
     WHERE sport = 'college-baseball'
     ORDER BY rank ASC
     LIMIT 25`,
  ];

  for (const query of queries) {
    try {
      const { results } = await db.prepare(query).all();
      if (Array.isArray(results) && results.length > 0) {
        return results;
      }
    } catch {
      // Try next candidate query.
    }
  }

  return [];
}

app.get('/scores', async (c) => {
  const date = c.req.query('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.scores, async () => {
      const client = createNcaaClient();
      const result = await client.getMatches('NCAA', date);
      return result.success && result.data ? result.data : empty;
    });
    return cachedResponse(c, { ...data, meta: responseMeta() }, 200, HTTP_CACHE.scores, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ ...empty, meta: responseMeta() }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/standings', async (c) => {
  const conference = c.req.query('conference') || 'NCAA';
  const cacheKey = `cb:standings:${conference}`;

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.standings, async () => {
      const client = createNcaaClient();
      const result = await client.getStandings(conference);
      return result.success && result.data ? result.data : [];
    });
    return cachedResponse(c, { standings: data, meta: responseMeta() }, 200, HTTP_CACHE.standings, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ standings: [], meta: responseMeta() }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/rankings', async (c) => {
  const cacheKey = 'cb:rankings';

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.rankings, async () => {
      const client = createNcaaClient();
      const result = await client.getRankings();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return {
          rankings: result.data,
          dataSource: 'ESPN College Baseball',
          fallback: false,
        };
      }

      const d1FallbackRankings = await getD1RankingsFallback(c.env.DB);
      if (d1FallbackRankings.length > 0) {
        return {
          rankings: d1FallbackRankings,
          dataSource: 'BSI D1 rankings cache',
          fallback: true,
        };
      }

      return {
        rankings: [],
        dataSource: 'ESPN College Baseball',
        fallback: true,
      };
    });

    const payload = (data as {
      rankings?: unknown[];
      dataSource?: string;
      fallback?: boolean;
    }) || { rankings: [] };

    return cachedResponse(c, {
      rankings: payload.rankings || [],
      meta: {
        ...responseMeta(),
        dataSource: payload.dataSource || 'ESPN College Baseball',
        source: payload.dataSource || 'ESPN College Baseball',
        fallback: payload.fallback || false,
      },
    }, 200, HTTP_CACHE.rankings, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ rankings: [], meta: responseMeta() }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/schedule', async (c) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const range = c.req.query('range') || 'week';
  const cacheKey = `cb:schedule:${date}:${range}`;
  const empty = { data: [], totalCount: 0 };

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.schedule, async () => {
      const client = createNcaaClient();
      const result = await client.getSchedule(date, range);
      return result.success && result.data ? result.data : empty;
    });
    return cachedResponse(c, { ...data, meta: responseMeta() }, 200, HTTP_CACHE.schedule, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ ...empty, meta: responseMeta() }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/trending', async (c) => {
  const cacheKey = 'cb:trending';
  const empty = { trendingPlayers: [], topGames: [] };

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.trending, async () => {
      const client = createNcaaClient();
      const result = await client.getMatches('NCAA');

      if (!result.success || !result.data) return empty;

      const games = (result.data.data || []) as HighlightlyMatch[];
      const finishedGames = games
        .filter((g) => g.status?.type === 'finished')
        .sort((a, b) => {
          const marginA = Math.abs(a.homeScore - a.awayScore);
          const marginB = Math.abs(b.homeScore - b.awayScore);
          return marginA - marginB;
        });

      const topGames = finishedGames.slice(0, 5).map((g) => ({
        id: g.id,
        homeTeam: g.homeTeam?.name,
        awayTeam: g.awayTeam?.name,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        margin: Math.abs(g.homeScore - g.awayScore),
      }));

      return { trendingPlayers: [], topGames };
    });
    return cachedResponse(c, data, 200, HTTP_CACHE.trending, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json(empty, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/teams/:teamId', async (c) => {
  const teamId = c.req.param('teamId');
  const cacheKey = `cb:team:${teamId}`;

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.teams, async () => {
      const client = createNcaaClient();
      const [teamResult, playersResult] = await Promise.all([
        client.getTeam(parseInt(teamId, 10)),
        client.getTeamPlayers(parseInt(teamId, 10)),
      ]);
      return { team: teamResult.data ?? null, roster: playersResult.data?.data ?? [] };
    });
    return cachedResponse(c, data, 200, HTTP_CACHE.team, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ team: null, roster: [] }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/players/:playerId', async (c) => {
  const playerId = c.req.param('playerId');
  const cacheKey = `cb:player:${playerId}`;

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.players, async () => {
      const client = createNcaaClient();
      const [playerResult, statsResult] = await Promise.all([
        client.getPlayer(parseInt(playerId, 10)),
        client.getPlayerStatistics(parseInt(playerId, 10)),
      ]);
      return { player: playerResult.data ?? null, statistics: statsResult.data ?? null };
    });
    return cachedResponse(c, data, 200, HTTP_CACHE.player, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ player: null, statistics: null }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/games/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  const cacheKey = `cb:game:${gameId}`;

  try {
    const { data, cacheHit } = await withCache(c.env.KV, cacheKey, CACHE_TTL.games, async () => {
      const client = createNcaaClient();
      const [matchResult, boxResult] = await Promise.all([
        client.getMatch(parseInt(gameId, 10)),
        client.getBoxScore(parseInt(gameId, 10)),
      ]);
      return { match: matchResult.data ?? null, boxScore: boxResult.data ?? null };
    });
    return cachedResponse(c, data, 200, HTTP_CACHE.game, {
      ...dataHeaders(new Date().toISOString()),
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ match: null, boxScore: null }, 502, dataHeaders(new Date().toISOString()));
  }
});

app.get('/transfer-portal', async (c) => {
  const raw = await c.env.KV.get('portal:college-baseball:entries', 'text');
  if (raw) {
    try {
      return c.json(JSON.parse(raw), 200, { 'Cache-Control': `public, max-age=${HTTP_CACHE.trending}` });
    } catch {
      // Corrupt — fall through
    }
  }
  return c.json({ entries: [], lastUpdated: null, message: 'No portal data available yet' });
});

app.get('/editorial/texas-opening-week', async (c) => {
  const cacheKey = 'cb:texas:opening-week:2026';
  const cached = await c.env.KV.get(cacheKey, 'text');
  if (cached) {
    try {
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': 'public, max-age=3600',
        ...dataHeaders(new Date().toISOString()),
      });
    } catch { /* corrupt — fall through */ }
  }
  return c.json({ error: 'Dataset not yet published', meta: responseMeta() }, 404);
});

export { app as collegeBaseballRoutes };
