/**
 * BSI College Baseball Gateway Worker
 * Public API for college baseball data
 *
 * Endpoints:
 * - GET /cbb/health - Health check
 * - GET /cbb/scores/live - Live game scores
 * - GET /cbb/scores/:date - Scores for a specific date
 * - GET /cbb/standings - Conference standings
 * - GET /cbb/teams - All teams
 * - GET /cbb/teams/:id - Team details
 * - GET /cbb/players - Search players
 * - GET /cbb/players/:id - Player details
 * - GET /cbb/games/:id - Game details
 * - GET /cbb/nil/deals - Recent NIL deals
 * - GET /cbb/nil/market - NIL market data
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
// import { z } from "zod";
import {
  type CbbEnv,
  createProviders,
  getTeamById,
  getAllTeams,
  getPlayerById,
  getPlayersByTeam,
  searchPlayers,
  searchPlayersAdvanced,
  getPlayersForComparison,
  findSimilarPlayers,
  getTransferPortalPlayers,
  getTeamPositionBreakdown,
  getTeamClassBreakdown,
  getGameById,
  getGamesByDate,
  getLiveGames,
  getGamesByTeam,
  getStandings,
  getNilDealsByPlayer,
  getNilDealsByTeam,
  getRecentNilDeals,
  getEntitySources,
  createESPNFallback,
  type ESPNSportKey,
  createD1BaseballScraper,
  TEAM_SLUG_MAPPINGS,
  getRankings,
  getLatestRankingsWeek,
  getTeamRankingHistory,
  getPlayerStats,
  getPlayerCareerStats,
  getTeamBattingLeaders,
  getTeamPitchingLeaders,
} from '../lib';

// =============================================================================
// APP SETUP
// =============================================================================

type Bindings = CbbEnv;

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['https://blazesportsintel.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/cbb/health', async (c) => {
  const env = c.env;

  // Check D1 connectivity
  let dbStatus = 'unknown';
  try {
    await env.BSI_DB.prepare('SELECT 1').first();
    dbStatus = 'healthy';
  } catch (e) {
    dbStatus = 'unhealthy: ' + (e instanceof Error ? e.message : 'unknown error');
  }

  // Check KV connectivity
  let kvStatus = 'unknown';
  try {
    await env.BSI_CACHE.get('health-check-test');
    kvStatus = 'healthy';
  } catch (e) {
    kvStatus = 'unhealthy: ' + (e instanceof Error ? e.message : 'unknown error');
  }

  const healthy = dbStatus === 'healthy' && kvStatus === 'healthy';

  return c.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        cache: kvStatus,
      },
      version: '1.0.0',
    },
    healthy ? 200 : 503
  );
});

// =============================================================================
// SCORES ENDPOINTS
// =============================================================================

app.get('/cbb/scores/live', async (c) => {
  const env = c.env;

  try {
    // Get live games from database
    const games = await getLiveGames(env.BSI_DB);

    // If no live games in DB, try NCAA API directly
    if (games.length === 0) {
      const providers = createProviders(env);
      try {
        const scoreboard = await providers.ncaa.getScoreboard();
        const liveEvents = scoreboard.events.filter((e) => {
          const state = e.status?.type?.state;
          return state === 'in' || state === 'pre';
        });

        return c.json({
          data: liveEvents.map(formatNcaaGame),
          source: 'ncaa_api',
          timestamp: new Date().toISOString(),
        });
      } catch (apiError) {
        // Fall through to return empty from DB
      }
    }

    return c.json({
      data: games,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch live scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/cbb/scores/:date', async (c) => {
  const env = c.env;
  const dateParam = c.req.param('date');

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json(
      {
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      },
      400
    );
  }

  try {
    // Try database first
    const games = await getGamesByDate(env.BSI_DB, dateParam);

    if (games.length > 0) {
      return c.json({
        data: games,
        date: dateParam,
        source: 'database',
        timestamp: new Date().toISOString(),
      });
    }

    // Fall back to NCAA API
    const providers = createProviders(env);
    const scoreboard = await providers.ncaa.getScoreboard(dateParam);

    return c.json({
      data: scoreboard.events.map(formatNcaaGame),
      date: dateParam,
      source: 'ncaa_api',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // NCAA API returns 404 for dates with no games (off-season)
    if (error instanceof Error && error.message.includes('404')) {
      return c.json({
        data: [],
        date: dateParam,
        source: 'ncaa_api',
        note: 'No games scheduled for this date',
        timestamp: new Date().toISOString(),
      });
    }
    return c.json(
      {
        error: 'Failed to fetch scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// STANDINGS ENDPOINT
// =============================================================================

app.get('/cbb/standings', async (c) => {
  const env = c.env;
  const conference = c.req.query('conference');
  const seasonParam = c.req.query('season');

  // Default to current season (2025)
  const season = seasonParam ? parseInt(seasonParam, 10) : 2025;

  try {
    const standings = await getStandings(env.BSI_DB, season, conference);

    // Group by conference
    const byConference: Record<string, typeof standings> = {};
    for (const row of standings) {
      const conf = row.team_conference;
      if (!byConference[conf]) {
        byConference[conf] = [];
      }
      byConference[conf].push(row);
    }

    return c.json({
      data: byConference,
      season,
      conference: conference ?? 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// TEAMS ENDPOINTS
// =============================================================================

app.get('/cbb/teams', async (c) => {
  const env = c.env;
  const conference = c.req.query('conference');

  try {
    const teams = await getAllTeams(env.BSI_DB, conference);

    return c.json({
      data: teams,
      count: teams.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/cbb/teams/:id', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');

  try {
    const team = await getTeamById(env.BSI_DB, teamId);

    if (!team) {
      return c.json({ error: 'Team not found', teamId }, 404);
    }

    // Get additional data
    const [players, sources, recentGames] = await Promise.all([
      getPlayersByTeam(env.BSI_DB, teamId),
      getEntitySources(env.BSI_DB, 'team', teamId),
      getGamesByTeam(env.BSI_DB, teamId, undefined, 10),
    ]);

    return c.json({
      data: {
        ...team,
        sources,
        roster: players,
        recentGames,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch team',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// PLAYERS ENDPOINTS
// =============================================================================

app.get('/cbb/players', async (c) => {
  const env = c.env;
  const query = c.req.query('q');
  const teamId = c.req.query('team');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

  try {
    let players;
    if (teamId) {
      players = await getPlayersByTeam(env.BSI_DB, teamId);
    } else if (query && query.length >= 2) {
      players = await searchPlayers(env.BSI_DB, query, limit);
    } else {
      return c.json(
        {
          error: 'Search query required',
          message: 'Provide ?q=name (min 2 chars) or ?team=teamId',
        },
        400
      );
    }

    return c.json({
      data: players,
      count: players.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// ADVANCED PLAYER SEARCH & COMPARISON
// =============================================================================

/**
 * Advanced player search with multiple filters
 * GET /cbb/players/search
 * Query params: q, position, classYear, teamId, conference, isTransfer, bats, throws, limit, offset
 */
app.get('/cbb/players/search', async (c) => {
  const env = c.env;

  // Parse query params into filters
  const query = c.req.query('q');
  const position = c.req.query('position');
  const classYear = c.req.query('classYear');
  const teamId = c.req.query('teamId');
  const conference = c.req.query('conference');
  const isTransferParam = c.req.query('isTransfer');
  const bats = c.req.query('bats') as 'L' | 'R' | 'S' | undefined;
  const throws = c.req.query('throws') as 'L' | 'R' | undefined;
  const limitParam = c.req.query('limit');
  const offsetParam = c.req.query('offset');

  const filters = {
    query,
    position: position?.split(','),
    classYear: classYear?.split(','),
    teamId,
    conference,
    isTransfer: isTransferParam ? isTransferParam === 'true' : undefined,
    bats,
    throws,
    limit: limitParam ? parseInt(limitParam, 10) : 50,
    offset: offsetParam ? parseInt(offsetParam, 10) : 0,
  };

  try {
    const result = await searchPlayersAdvanced(env.BSI_DB, filters);

    return c.json({
      data: result.players,
      total: result.total,
      count: result.players.length,
      filters: {
        query,
        position: filters.position,
        classYear: filters.classYear,
        teamId,
        conference,
        isTransfer: filters.isTransfer,
        bats,
        throws,
      },
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + result.players.length < result.total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to search players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Compare multiple players side-by-side
 * POST /cbb/players/compare
 * Body: { playerIds: string[] }
 */
app.post('/cbb/players/compare', async (c) => {
  const env = c.env;

  try {
    const body = await c.req.json();
    const playerIds = body.playerIds as string[];

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return c.json(
        {
          error: 'Invalid request',
          message: 'Provide playerIds array with 1-10 player IDs',
        },
        400
      );
    }

    if (playerIds.length > 10) {
      return c.json(
        {
          error: 'Too many players',
          message: 'Maximum 10 players can be compared at once',
        },
        400
      );
    }

    const players = await getPlayersForComparison(env.BSI_DB, playerIds);

    // Group players by position for easy comparison
    const byPosition: Record<string, typeof players> = {};
    players.forEach((p) => {
      const pos = p.position || 'Unknown';
      if (!byPosition[pos]) byPosition[pos] = [];
      byPosition[pos].push(p);
    });

    return c.json({
      data: {
        players,
        byPosition,
        count: players.length,
        requested: playerIds.length,
        notFound: playerIds.filter((id) => !players.some((p) => p.id === id)),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to compare players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Get transfer portal players
 * GET /cbb/players/transfer-portal
 */
app.get('/cbb/players/transfer-portal', async (c) => {
  const env = c.env;
  const position = c.req.query('position');
  const toConference = c.req.query('conference');
  const limitParam = c.req.query('limit');

  const filters = {
    position,
    toConference,
    limit: limitParam ? parseInt(limitParam, 10) : 50,
  };

  try {
    const players = await getTransferPortalPlayers(env.BSI_DB, filters);

    return c.json({
      data: players,
      count: players.length,
      filters: { position, conference: toConference },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch transfer portal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/cbb/players/:id', async (c) => {
  const env = c.env;
  const playerId = c.req.param('id');

  try {
    const player = await getPlayerById(env.BSI_DB, playerId);

    if (!player) {
      return c.json({ error: 'Player not found', playerId }, 404);
    }

    // Get additional data
    const [sources, nilDeals] = await Promise.all([
      getEntitySources(env.BSI_DB, 'player', playerId),
      getNilDealsByPlayer(env.BSI_DB, playerId),
    ]);

    // Get team info if player has a team
    let team = null;
    if (player.team_id) {
      team = await getTeamById(env.BSI_DB, player.team_id);
    }

    return c.json({
      data: {
        ...player,
        team,
        sources,
        nilDeals,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch player',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Find players similar to a given player
 * GET /cbb/players/:id/similar
 */
app.get('/cbb/players/:id/similar', async (c) => {
  const env = c.env;
  const playerId = c.req.param('id');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 25) : 10;

  try {
    // First verify the player exists
    const player = await getPlayerById(env.BSI_DB, playerId);
    if (!player) {
      return c.json({ error: 'Player not found', playerId }, 404);
    }

    const similarPlayers = await findSimilarPlayers(env.BSI_DB, playerId, limit);

    return c.json({
      data: {
        sourcePlayer: player,
        similarPlayers,
        count: similarPlayers.length,
        criteria: ['position', 'classYear', 'conference', 'bats', 'throws'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to find similar players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Get team roster
 * GET /cbb/teams/:id/roster
 */
app.get('/cbb/teams/:id/roster', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  try {
    const team = await getTeamById(env.BSI_DB, teamId);
    if (!team) return c.json({ error: 'Team not found', teamId }, 404);
    const players = await getPlayersByTeam(env.BSI_DB, teamId);
    return c.json({
      data: {
        team: { id: team.id, name: team.name, conference: team.conference },
        players,
        count: players.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Get team roster breakdown by position
 * GET /cbb/teams/:id/roster/positions
 */
app.get('/cbb/teams/:id/roster/positions', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');

  try {
    // Verify team exists
    const team = await getTeamById(env.BSI_DB, teamId);
    if (!team) {
      return c.json({ error: 'Team not found', teamId }, 404);
    }

    const breakdown = await getTeamPositionBreakdown(env.BSI_DB, teamId);

    // Calculate totals
    const total = breakdown.reduce((sum, pos) => sum + pos.count, 0);

    return c.json({
      data: {
        team: { id: team.id, name: team.name, conference: team.conference },
        positions: breakdown,
        total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to get position breakdown',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Get team roster breakdown by class year
 * GET /cbb/teams/:id/roster/classes
 */
app.get('/cbb/teams/:id/roster/classes', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');

  try {
    // Verify team exists
    const team = await getTeamById(env.BSI_DB, teamId);
    if (!team) {
      return c.json({ error: 'Team not found', teamId }, 404);
    }

    const breakdown = await getTeamClassBreakdown(env.BSI_DB, teamId);

    // Calculate totals and percentages
    const total = breakdown.reduce((sum, cls) => sum + cls.count, 0);
    const withPercentages = breakdown.map((cls) => ({
      ...cls,
      percentage: total > 0 ? Math.round((cls.count / total) * 100) : 0,
    }));

    return c.json({
      data: {
        team: { id: team.id, name: team.name, conference: team.conference },
        classes: withPercentages,
        total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to get class breakdown',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// GAMES ENDPOINT
// =============================================================================

app.get('/cbb/games/:id', async (c) => {
  const env = c.env;
  const gameId = c.req.param('id');

  try {
    const game = await getGameById(env.BSI_DB, gameId);

    if (!game) {
      return c.json({ error: 'Game not found', gameId }, 404);
    }

    // Get team info
    const [homeTeam, awayTeam, sources] = await Promise.all([
      getTeamById(env.BSI_DB, game.home_team_id),
      getTeamById(env.BSI_DB, game.away_team_id),
      getEntitySources(env.BSI_DB, 'game', gameId),
    ]);

    return c.json({
      data: {
        ...game,
        homeTeam,
        awayTeam,
        sources,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch game',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// NIL ENDPOINTS
// =============================================================================

app.get('/cbb/nil/deals', async (c) => {
  const env = c.env;
  const playerId = c.req.query('player');
  const teamId = c.req.query('team');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

  try {
    let deals;
    if (playerId) {
      deals = await getNilDealsByPlayer(env.BSI_DB, playerId);
    } else if (teamId) {
      deals = await getNilDealsByTeam(env.BSI_DB, teamId);
    } else {
      deals = await getRecentNilDeals(env.BSI_DB, limit);
    }

    return c.json({
      data: deals,
      count: deals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NIL deals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/cbb/nil/market', async (c) => {
  const env = c.env;

  try {
    // Get market summary from nil_market_trends
    const results = await env.BSI_DB.prepare(
      `SELECT * FROM nil_market_trends 
       WHERE sport = "baseball" 
       ORDER BY (period_start IS NULL), period_start DESC 
       LIMIT 5`
    ).all();

    return c.json({
      data: results.results ?? [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NIL market data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// =============================================================================
// HIGHLIGHTLY API ENDPOINTS (MLB + NFL + Live Data)
// =============================================================================

// MLB Live Games
app.get('/cbb/mlb/live', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const games = await providers.baseball.getMLBLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch MLB live games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// MLB Scores by Date
app.get('/cbb/mlb/scores/:date', async (c) => {
  const env = c.env;
  const dateParam = c.req.param('date');
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json({ error: 'Invalid date format', message: 'Date must be YYYY-MM-DD' }, 400);
  }

  try {
    const games = await providers.baseball.getMatchesByDate(dateParam, 'MLB');
    return c.json({
      data: games,
      date: dateParam,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch MLB scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// MLB Standings
app.get('/cbb/mlb/standings', async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query('season') ? parseInt(c.req.query('season')!, 10) : undefined;

  if (!providers.baseball) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const standings = await providers.baseball.getMLBStandings(season);
    return c.json({
      data: standings,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch MLB standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// MLB Teams
app.get('/cbb/mlb/teams', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const teams = await providers.baseball.getMLBTeams();
    return c.json({
      data: teams,
      count: teams.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch MLB teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NCAA Baseball Live (Highlightly)
app.get('/cbb/ncaa-baseball/live', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const games = await providers.baseball.getNCAABaseballLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NCAA Baseball live games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NFL Live Games
app.get('/cbb/nfl/live', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const games = await providers.football.getNFLLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NFL live games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NFL Scores by Date
app.get('/cbb/nfl/scores/:date', async (c) => {
  const env = c.env;
  const dateParam = c.req.param('date');
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json({ error: 'Invalid date format', message: 'Date must be YYYY-MM-DD' }, 400);
  }

  try {
    const games = await providers.football.getMatchesByDate(dateParam, 'NFL');
    return c.json({
      data: games,
      date: dateParam,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NFL scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NFL Standings
app.get('/cbb/nfl/standings', async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query('season') ? parseInt(c.req.query('season')!, 10) : undefined;

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const standings = await providers.football.getNFLStandings(season);
    return c.json({
      data: standings,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NFL standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NFL Teams
app.get('/cbb/nfl/teams', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const teams = await providers.football.getNFLTeams();
    return c.json({
      data: teams,
      count: teams.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NFL teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NCAA Football Live Games
app.get('/cbb/ncaa-football/live', async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const games = await providers.football.getNCAAFootballLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NCAA Football live games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NCAA Football Standings
app.get('/cbb/ncaa-football/standings', async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query('season') ? parseInt(c.req.query('season')!, 10) : undefined;

  if (!providers.football) {
    return c.json(
      { error: 'Highlightly API not configured', message: 'Missing HIGHLIGHTLY_API_KEY' },
      503
    );
  }

  try {
    const standings = await providers.football.getNCAAFootballStandings(season);
    return c.json({
      data: standings,
      source: 'highlightly',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch NCAA Football standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================
// ESPN FALLBACK ROSTER ENDPOINTS
// =============================================================================

// NCAA Baseball Team Players (ESPN fallback)
app.get('/cbb/ncaa-baseball/teams/:id/players', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  const espn = createESPNFallback(env.BSI_CACHE);

  try {
    const players = await espn.getTeamRoster('college-baseball' as ESPNSportKey, teamId);
    return c.json({
      data: players,
      teamId,
      count: players.length,
      source: 'espn',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch team roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NCAA Football Team Players (ESPN fallback)
app.get('/cbb/ncaa-football/teams/:id/players', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  const espn = createESPNFallback(env.BSI_CACHE);

  try {
    const players = await espn.getTeamRoster('college-football' as ESPNSportKey, teamId);
    return c.json({
      data: players,
      teamId,
      count: players.length,
      source: 'espn',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch team roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// MLB Team Players (ESPN fallback)
app.get('/cbb/mlb/teams/:id/players', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  const espn = createESPNFallback(env.BSI_CACHE);

  try {
    const players = await espn.getTeamRoster('mlb' as ESPNSportKey, teamId);
    return c.json({
      data: players,
      teamId,
      count: players.length,
      source: 'espn',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch team roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// NFL Team Players (ESPN fallback)
app.get('/cbb/nfl/teams/:id/players', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  const espn = createESPNFallback(env.BSI_CACHE);

  try {
    const players = await espn.getTeamRoster('nfl' as ESPNSportKey, teamId);
    return c.json({
      data: players,
      teamId,
      count: players.length,
      source: 'espn',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch team roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// =============================================================================

// =============================================================================
// D1BASEBALL COLLEGE BASEBALL ROSTERS
// =============================================================================

// Get roster from D1Baseball by team slug
app.get('/cbb/d1baseball/roster/:teamSlug', async (c) => {
  const env = c.env;
  const teamSlug = c.req.param('teamSlug');
  const seasonParam = c.req.query('season');
  const fullParam = c.req.query('full');
  const season = seasonParam ? parseInt(seasonParam, 10) : undefined;

  const scraper = createD1BaseballScraper(env.BSI_CACHE);

  try {
    // Use full roster fetch if ?full=true, otherwise basic (faster)
    const roster =
      fullParam === 'true'
        ? await scraper.getFullRosterBySlug(teamSlug, season)
        : await scraper.getRosterBySlug(teamSlug, season);

    if (!roster) {
      return c.json(
        {
          error: 'Roster not found',
          message: `Could not fetch roster for ${teamSlug}. Check team slug or rate limit.`,
          teamSlug,
        },
        404
      );
    }

    return c.json({
      data: roster,
      source: 'd1baseball',
      fullDetails: fullParam === 'true',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch D1Baseball roster',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Sync D1Baseball roster to BSI database (with full player details)
app.post('/cbb/d1baseball/roster/:teamSlug/sync', async (c) => {
  const env = c.env;
  const teamSlug = c.req.param('teamSlug');

  const scraper = createD1BaseballScraper(env.BSI_CACHE);
  const mapping = scraper.findTeamMapping(teamSlug);

  if (!mapping) {
    return c.json(
      {
        error: 'Team not mapped',
        message: `No BSI team ID mapping for ${teamSlug}. Use /cbb/d1baseball/mappings to see available teams.`,
      },
      400
    );
  }

  try {
    // Always fetch FULL roster for sync (includes player profile details)
    const roster = await scraper.getFullRosterBySlug(mapping.d1baseballSlug);

    if (!roster) {
      return c.json(
        {
          error: 'Roster fetch failed',
          message: `Could not fetch roster for ${teamSlug}`,
        },
        500
      );
    }

    const result = await scraper.syncRosterToDatabase(env.BSI_DB, mapping.bsiTeamId, roster);

    return c.json({
      success: true,
      team: mapping.teamName,
      bsiTeamId: mapping.bsiTeamId,
      d1baseballSlug: mapping.d1baseballSlug,
      playersFound: roster.players.length,
      playersSynced: result.synced,
      errors: result.errors,
      source: 'd1baseball',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// List all available team slug mappings
app.get('/cbb/d1baseball/mappings', async (c) => {
  const conference = c.req.query('conference');

  let mappings = TEAM_SLUG_MAPPINGS;

  // Filter by conference name if provided (simple substring match)
  if (conference) {
    const conf = conference.toLowerCase();
    const confTeams: Record<string, string[]> = {
      big12: [
        'texas',
        'texas-tech',
        'tcu',
        'baylor',
        'oklahoma',
        'oklahoma-state',
        'kansas-state',
        'west-virginia',
        'ucf',
        'byu',
        'cincinnati',
        'houston',
        'kansas',
        'arizona',
        'arizona-state',
        'colorado',
        'utah',
      ],
      sec: [
        'texas-am',
        'lsu',
        'arkansas',
        'ole-miss',
        'mississippi-state',
        'tennessee',
        'vanderbilt',
        'florida',
        'georgia',
        'south-carolina',
        'auburn',
        'alabama',
        'kentucky',
        'missouri',
      ],
      acc: [
        'clemson',
        'florida-state',
        'miami-fl',
        'north-carolina',
        'nc-state',
        'duke',
        'wake-forest',
        'virginia',
        'virginia-tech',
        'louisville',
        'notre-dame',
        'pittsburgh',
        'georgia-tech',
      ],
    };

    const teamSlugs = confTeams[conf] || [];
    if (teamSlugs.length > 0) {
      mappings = mappings.filter((m) => teamSlugs.includes(m.d1baseballSlug));
    }
  }

  return c.json({
    data: mappings,
    count: mappings.length,
    note: 'Use d1baseballSlug in /cbb/d1baseball/roster/:teamSlug endpoint',
    timestamp: new Date().toISOString(),
  });
});

// Bulk sync multiple teams (Big 12, SEC, or ACC)
app.post('/cbb/d1baseball/sync-conference/:conference', async (c) => {
  const env = c.env;
  const conference = c.req.param('conference').toLowerCase();

  const confTeams: Record<string, string[]> = {
    big12: [
      'texas',
      'texas-tech',
      'tcu',
      'baylor',
      'oklahoma',
      'oklahoma-state',
      'kansas-state',
      'west-virginia',
      'ucf',
      'byu',
      'cincinnati',
      'houston',
      'kansas',
      'arizona',
      'arizona-state',
      'colorado',
      'utah',
    ],
    sec: [
      'texas-am',
      'lsu',
      'arkansas',
      'ole-miss',
      'mississippi-state',
      'tennessee',
      'vanderbilt',
      'florida',
      'georgia',
      'south-carolina',
      'auburn',
      'alabama',
      'kentucky',
      'missouri',
    ],
    acc: [
      'clemson',
      'florida-state',
      'miami-fl',
      'north-carolina',
      'nc-state',
      'duke',
      'wake-forest',
      'virginia',
      'virginia-tech',
      'louisville',
      'notre-dame',
      'pittsburgh',
      'georgia-tech',
    ],
    texas: [
      'texas',
      'texas-tech',
      'tcu',
      'baylor',
      'houston',
      'rice',
      'dallas-baptist',
      'sam-houston',
      'utsa',
      'texas-state',
      'ut-arlington',
      'ut-rio-grande-valley',
      'texas-am',
    ],
  };

  const teamSlugs = confTeams[conference];
  if (!teamSlugs) {
    return c.json(
      {
        error: 'Invalid conference',
        valid: Object.keys(confTeams),
      },
      400
    );
  }

  const scraper = createD1BaseballScraper(env.BSI_CACHE);
  const results: Array<{ team: string; status: string; players?: number }> = [];

  // Rate-limited: process 5 teams max per request to stay under rate limits
  const teamsToProcess = teamSlugs.slice(0, 5);

  for (const teamSlug of teamsToProcess) {
    const mapping = TEAM_SLUG_MAPPINGS.find((m) => m.d1baseballSlug === teamSlug);
    if (!mapping) {
      results.push({ team: teamSlug, status: 'no_mapping' });
      continue;
    }

    try {
      const roster = await scraper.getRosterBySlug(mapping.d1baseballSlug);
      if (roster) {
        const syncResult = await scraper.syncRosterToDatabase(
          env.BSI_DB,
          mapping.bsiTeamId,
          roster
        );
        results.push({ team: mapping.teamName, status: 'synced', players: syncResult.synced });
      } else {
        results.push({ team: mapping.teamName, status: 'fetch_failed' });
      }
    } catch (error) {
      results.push({ team: mapping.teamName, status: 'error' });
    }

    // Small delay to be respectful to D1Baseball
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return c.json({
    conference,
    teamsProcessed: teamsToProcess.length,
    totalTeamsInConference: teamSlugs.length,
    note:
      teamsToProcess.length < teamSlugs.length
        ? `Rate limited: processed first ${teamsToProcess.length} teams. Call again to sync more.`
        : undefined,
    results,
    timestamp: new Date().toISOString(),
  });
});

// Bulk sync ALL teams (background processing)
app.post('/cbb/d1baseball/sync-all', async (c) => {
  const env = c.env;
  const scraper = createD1BaseballScraper(env.BSI_CACHE);
  const allMappings = TEAM_SLUG_MAPPINGS;

  // Start background sync using waitUntil
  const syncPromise = (async () => {
    const results: Array<{ team: string; status: string; players?: number }> = [];
    let synced = 0;
    let failed = 0;

    for (const mapping of allMappings) {
      try {
        // Rate limiting: wait 2 seconds between teams
        if (synced > 0 || failed > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        const roster = await scraper.getRosterBySlug(mapping.d1baseballSlug);
        if (roster) {
          const syncResult = await scraper.syncRosterToDatabase(
            env.BSI_DB,
            mapping.bsiTeamId,
            roster
          );
          results.push({ team: mapping.teamName, status: 'synced', players: syncResult.synced });
          synced++;
        } else {
          results.push({ team: mapping.teamName, status: 'fetch_failed' });
          failed++;
        }
      } catch (error) {
        results.push({ team: mapping.teamName, status: 'error' });
        failed++;
      }
    }

    // Store results in KV for later retrieval
    await env.BSI_CACHE.put(
      'd1baseball:sync-all:latest',
      JSON.stringify({ results, synced, failed, completedAt: new Date().toISOString() }),
      { expirationTtl: 86400 }
    );
  })();

  // Use waitUntil for background processing
  c.executionCtx.waitUntil(syncPromise);

  return c.json({
    success: true,
    message: 'Bulk sync started in background',
    totalTeams: allMappings.length,
    note: 'Check /cbb/d1baseball/sync-status for progress. Full sync takes ~2-3 minutes due to rate limiting.',
    timestamp: new Date().toISOString(),
  });
});

// Get status of last bulk sync
app.get('/cbb/d1baseball/sync-status', async (c) => {
  const env = c.env;

  const status = await env.BSI_CACHE.get('d1baseball:sync-all:latest', 'json');

  if (!status) {
    return c.json({
      status: 'no_sync_found',
      message: 'No bulk sync has been run yet. Use POST /cbb/d1baseball/sync-all to start one.',
    });
  }

  return c.json({
    status: 'completed',
    ...(status as Record<string, unknown>),
  });
});

// ADMIN: CACHE DASHBOARD
// =============================================================================

app.get('/cbb/admin/cache-stats', async (c) => {
  const env = c.env;
  const kv = env.BSI_CACHE;

  const prefixes = [
    { name: 'espn:roster', description: 'ESPN roster data', ttl: '24h' },
    { name: 'espn:team', description: 'ESPN team info', ttl: '24h' },
    { name: 'highlightly:scores', description: 'Live scores', ttl: '60s' },
    { name: 'highlightly:standings', description: 'Standings', ttl: '1h' },
    { name: 'highlightly:teams', description: 'Team data', ttl: '24h' },
    { name: 'highlightly:players', description: 'Player data', ttl: '24h' },
    { name: 'highlightly:games', description: 'Game data', ttl: '5m' },
  ];

  const cacheAnalysis = [];

  for (const prefix of prefixes) {
    try {
      const list = await kv.list({ prefix: prefix.name, limit: 100 });
      cacheAnalysis.push({
        prefix: prefix.name,
        description: prefix.description,
        defaultTtl: prefix.ttl,
        keysFound: list.keys.length,
        hasMore: !list.list_complete,
        sampleKeys: list.keys.slice(0, 5).map((k: { name: string }) => k.name),
      });
    } catch (e) {
      cacheAnalysis.push({
        prefix: prefix.name,
        description: prefix.description,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  let totalKeys = 0;
  try {
    const allKeys = await kv.list({ limit: 1000 });
    totalKeys = allKeys.keys.length;
  } catch (e) {}

  return c.json({
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    cache: {
      provider: 'Cloudflare KV',
      namespace: 'BSI_CACHE',
      totalKeysEstimate: totalKeys,
      analysis: cacheAnalysis,
    },
    dataSources: {
      primary: {
        name: 'Highlightly API',
        status: 'active',
        sports: ['ncaa-baseball', 'ncaa-football', 'mlb', 'nfl'],
      },
      fallback: {
        name: 'ESPN API',
        status: 'active',
        sports: ['college-football', 'nfl', 'mlb'],
        note: 'ESPN college-baseball roster data unavailable',
      },
    },
  });
});

app.delete('/cbb/admin/cache/:prefix', async (c) => {
  const env = c.env;
  const kv = env.BSI_CACHE;
  const prefix = c.req.param('prefix');

  const validPrefixes = ['espn:', 'highlightly:'];
  if (!validPrefixes.some((p) => prefix.startsWith(p))) {
    return c.json({ error: 'Invalid prefix', valid: validPrefixes }, 400);
  }

  try {
    const list = await kv.list({ prefix, limit: 100 });
    let deleted = 0;
    for (const key of list.keys) {
      await kv.delete(key.name);
      deleted++;
    }
    return c.json({
      success: true,
      prefix,
      keysDeleted: deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return c.json(
      { error: 'Failed to clear cache', message: e instanceof Error ? e.message : 'Unknown error' },
      500
    );
  }
});

// HELPER FUNCTIONS
// =============================================================================

function formatNcaaGame(game: any) {
  const competition = game.competitions?.[0];
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away');

  return {
    id: game.id,
    date: game.date,
    status: game.status?.type?.state ?? 'unknown',
    statusDetail: game.status?.type?.shortDetail,
    period: game.status?.period,
    clock: game.status?.displayClock,
    homeTeam: {
      id: home?.team?.id,
      name: home?.team?.school ?? home?.team?.name,
      abbreviation: home?.team?.abbreviation,
      logo: home?.team?.logo,
      score: home?.score,
    },
    awayTeam: {
      id: away?.team?.id,
      name: away?.team?.school ?? away?.team?.name,
      abbreviation: away?.team?.abbreviation,
      logo: away?.team?.logo,
      score: away?.score,
    },
    venue: competition?.venue?.fullName,
  };
}

// =============================================================================
// WEBSOCKET ENDPOINTS (Real-Time Live Game Updates)
// =============================================================================

// WebSocket upgrade endpoint for live game updates
app.get('/cbb/ws/game/:gameId', async (c) => {
  const env = c.env;
  const gameId = c.req.param('gameId');

  // Check if Durable Objects are configured
  if (!env.LIVE_GAME_ROOMS) {
    return c.json(
      {
        error: 'WebSocket not available',
        message: 'Live game updates are not configured. Use polling endpoints instead.',
      },
      503
    );
  }

  // Validate upgrade header
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json(
      {
        error: 'WebSocket Required',
        message: 'This endpoint requires a WebSocket connection. Set Upgrade: websocket header.',
      },
      426
    );
  }

  // Get the Durable Object stub for this game
  const id = env.LIVE_GAME_ROOMS.idFromName(gameId);
  const stub = env.LIVE_GAME_ROOMS.get(id);

  // Forward the request to the Durable Object
  const url = new URL(c.req.url);
  url.searchParams.set('gameId', gameId);

  return stub.fetch(
    new Request(url.toString(), {
      headers: c.req.raw.headers,
    })
  );
});

// Get list of active game rooms and connection counts
app.get('/cbb/ws/stats', async (c) => {
  const env = c.env;

  if (!env.LIVE_GAME_ROOMS) {
    return c.json({
      enabled: false,
      message: 'WebSocket not configured',
    });
  }

  return c.json({
    enabled: true,
    endpoint: 'wss://api.blazesportsintel.com/cbb/ws/game/:gameId',
    documentation: {
      connect: 'Connect to wss://api.blazesportsintel.com/cbb/ws/game/{gameId}',
      messageTypes: {
        serverToClient: [
          'score_update - Score changed',
          'inning_update - Inning/period changed',
          'status_update - Game status changed',
          'game_state - Full state refresh',
          'heartbeat - Connection keepalive (every 30s)',
        ],
        clientToServer: [
          'ping - Keepalive ping (receives pong)',
          'subscribe - Subscribe to different game',
          'unsubscribe - Stop receiving updates',
        ],
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Push state update to a game room (internal/admin endpoint)
app.post('/cbb/ws/game/:gameId/update', async (c) => {
  const env = c.env;
  const gameId = c.req.param('gameId');

  if (!env.LIVE_GAME_ROOMS) {
    return c.json({ error: 'WebSocket not available' }, 503);
  }

  // Get the Durable Object stub
  const id = env.LIVE_GAME_ROOMS.idFromName(gameId);
  const stub = env.LIVE_GAME_ROOMS.get(id);

  // Forward the update request
  const body = await c.req.text();
  const response = await stub.fetch(
    new Request('https://internal/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  );

  const result = await response.json();
  return c.json(result, response.ok ? 200 : 500);
});

// Broadcast message to all connections watching a game
app.post('/cbb/ws/game/:gameId/broadcast', async (c) => {
  const env = c.env;
  const gameId = c.req.param('gameId');

  if (!env.LIVE_GAME_ROOMS) {
    return c.json({ error: 'WebSocket not available' }, 503);
  }

  const id = env.LIVE_GAME_ROOMS.idFromName(gameId);
  const stub = env.LIVE_GAME_ROOMS.get(id);

  const body = await c.req.text();
  const response = await stub.fetch(
    new Request('https://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  );

  const result = await response.json();
  return c.json(result, response.ok ? 200 : 500);
});

// =============================================================================
// 404 HANDLER
// =============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      path: c.req.path,
    },
    404
  );
});

// =============================================================================
// =============================================================================
// RANKINGS ENDPOINTS
// =============================================================================

app.get('/cbb/rankings', async (c) => {
  const env = c.env;
  const pollType = c.req.query('poll') ?? undefined;
  const season = c.req.query('season') ? parseInt(c.req.query('season')!) : undefined;
  const week = c.req.query('week') ? parseInt(c.req.query('week')!) : undefined;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '25'), 50);
  const rankings = await getRankings(env.BSI_DB, pollType, season, week, limit);
  const latestWeek = await getLatestRankingsWeek(env.BSI_DB, season, pollType);
  return c.json({
    success: true,
    poll: pollType ?? 'all',
    season: season ?? new Date().getFullYear(),
    week: week ?? latestWeek,
    rankings: rankings.map((r) => ({
      rank: r.rank,
      previousRank: r.previous_rank,
      change: r.previous_rank ? r.previous_rank - r.rank : null,
      team: { id: r.team_id, name: r.team_name, logo: r.team_logo, conference: r.conference },
      points: r.points,
      firstPlaceVotes: r.first_place_votes,
      pollType: r.source,
      record: r.record,
    })),
    timestamp: new Date().toISOString(),
  });
});

app.get('/cbb/rankings/history/:teamId', async (c) => {
  const env = c.env;
  const teamId = c.req.param('teamId');
  const pollType = c.req.query('poll') ?? undefined;
  const season = c.req.query('season') ? parseInt(c.req.query('season')!) : undefined;
  const team = await getTeamById(env.BSI_DB, teamId);
  if (!team) return c.json({ success: false, error: 'Team not found' }, 404);
  const history = await getTeamRankingHistory(env.BSI_DB, teamId, season, pollType);
  return c.json({
    success: true,
    team: { id: team.id, name: team.name, conference: team.conference },
    season: season ?? new Date().getFullYear(),
    poll: pollType ?? 'all',
    history: history.map((r) => ({
      week: r.week,
      rank: r.rank,
      previousRank: r.previous_rank,
      points: r.points,
      pollType: r.source,
      record: r.record,
    })),
    timestamp: new Date().toISOString(),
  });
});

// PLAYER STATS
app.get('/cbb/players/:id/stats', async (c) => {
  const env = c.env;
  const playerId = c.req.param('id');
  const season = c.req.query('season') ? parseInt(c.req.query('season')!) : undefined;
  const player = await getPlayerById(env.BSI_DB, playerId);
  if (!player) return c.json({ success: false, error: 'Player not found' }, 404);
  const stats = season ? await getPlayerStats(env.BSI_DB, playerId, season) : null;
  const careerStats = await getPlayerCareerStats(env.BSI_DB, playerId);
  return c.json({
    success: true,
    player: { id: player.id, name: player.name, teamId: player.team_id, position: player.position },
    currentSeason: stats,
    career: careerStats,
    timestamp: new Date().toISOString(),
  });
});

app.get('/cbb/teams/:id/leaders', async (c) => {
  const env = c.env;
  const teamId = c.req.param('id');
  const season = c.req.query('season') ? parseInt(c.req.query('season')!) : undefined;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '10'), 25);
  const team = await getTeamById(env.BSI_DB, teamId);
  if (!team) return c.json({ success: false, error: 'Team not found' }, 404);
  const [battingAvg, homeRuns, rbi, stolenBases, era, wins, strikeouts] = await Promise.all([
    getTeamBattingLeaders(env.BSI_DB, teamId, season, 'batting_avg', limit),
    getTeamBattingLeaders(env.BSI_DB, teamId, season, 'home_runs', limit),
    getTeamBattingLeaders(env.BSI_DB, teamId, season, 'rbi', limit),
    getTeamBattingLeaders(env.BSI_DB, teamId, season, 'stolen_bases', limit),
    getTeamPitchingLeaders(env.BSI_DB, teamId, season, 'era', limit),
    getTeamPitchingLeaders(env.BSI_DB, teamId, season, 'wins', limit),
    getTeamPitchingLeaders(env.BSI_DB, teamId, season, 'strikeouts_pitching', limit),
  ]);
  return c.json({
    success: true,
    team: { id: team.id, name: team.name, conference: team.conference },
    season: season ?? new Date().getFullYear(),
    batting: { average: battingAvg, homeRuns, rbi, stolenBases },
    pitching: { era, wins, strikeouts },
    timestamp: new Date().toISOString(),
  });
});

// ERROR HANDLER
// =============================================================================

app.onError((err, c) => {
  console.error('Gateway error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Export Durable Object class for Cloudflare Workers runtime
export { LiveGameRoom } from '../lib/live-game-room';

export default app;
