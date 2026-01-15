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

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
// import { z } from "zod";
import {
  type CbbEnv,
  createProviders,
  getTeamById,
  getAllTeams,
  getPlayerById,
  getPlayersByTeam,
  searchPlayers,
  getGameById,
  getGamesByDate,
  getLiveGames,
  getGamesByTeam,
  getStandings,
  getNilDealsByPlayer,
  getNilDealsByTeam,
  getRecentNilDeals,
  getEntitySources,
} from "../lib";

// =============================================================================
// APP SETUP
// =============================================================================

type Bindings = CbbEnv;

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["https://blazesportsintel.com", "http://localhost:3000"],
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/cbb/health", async (c) => {
  const env = c.env;

  // Check D1 connectivity
  let dbStatus = "unknown";
  try {
    await env.BSI_DB.prepare("SELECT 1").first();
    dbStatus = "healthy";
  } catch (e) {
    dbStatus = "unhealthy: " + (e instanceof Error ? e.message : "unknown error");
  }

  // Check KV connectivity
  let kvStatus = "unknown";
  try {
    await env.BSI_CACHE.get("health-check-test");
    kvStatus = "healthy";
  } catch (e) {
    kvStatus = "unhealthy: " + (e instanceof Error ? e.message : "unknown error");
  }

  const healthy = dbStatus === "healthy" && kvStatus === "healthy";

  return c.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        cache: kvStatus,
      },
      version: "1.0.0",
    },
    healthy ? 200 : 503
  );
});

// =============================================================================
// SCORES ENDPOINTS
// =============================================================================

app.get("/cbb/scores/live", async (c) => {
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
          return state === "in" || state === "pre";
        });

        return c.json({
          data: liveEvents.map(formatNcaaGame),
          source: "ncaa_api",
          timestamp: new Date().toISOString(),
        });
      } catch (apiError) {
        // Fall through to return empty from DB
      }
    }

    return c.json({
      data: games,
      source: "database",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch live scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/cbb/scores/:date", async (c) => {
  const env = c.env;
  const dateParam = c.req.param("date");

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json(
      {
        error: "Invalid date format",
        message: "Date must be in YYYY-MM-DD format",
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
        source: "database",
        timestamp: new Date().toISOString(),
      });
    }

    // Fall back to NCAA API
    const providers = createProviders(env);
    const scoreboard = await providers.ncaa.getScoreboard(dateParam);

    return c.json({
      data: scoreboard.events.map(formatNcaaGame),
      date: dateParam,
      source: "ncaa_api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // NCAA API returns 404 for dates with no games (off-season)
    if (error instanceof Error && error.message.includes("404")) {
      return c.json({
        data: [],
        date: dateParam,
        source: "ncaa_api",
        note: "No games scheduled for this date",
        timestamp: new Date().toISOString(),
      });
    }
    return c.json(
      {
        error: "Failed to fetch scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// =============================================================================
// STANDINGS ENDPOINT
// =============================================================================

app.get("/cbb/standings", async (c) => {
  const env = c.env;
  const conference = c.req.query("conference");
  const seasonParam = c.req.query("season");

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
      conference: conference ?? "all",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch standings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// =============================================================================
// TEAMS ENDPOINTS
// =============================================================================

app.get("/cbb/teams", async (c) => {
  const env = c.env;
  const conference = c.req.query("conference");

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
        error: "Failed to fetch teams",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/cbb/teams/:id", async (c) => {
  const env = c.env;
  const teamId = c.req.param("id");

  try {
    const team = await getTeamById(env.BSI_DB, teamId);

    if (!team) {
      return c.json({ error: "Team not found", teamId }, 404);
    }

    // Get additional data
    const [players, sources, recentGames] = await Promise.all([
      getPlayersByTeam(env.BSI_DB, teamId),
      getEntitySources(env.BSI_DB, "team", teamId),
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
        error: "Failed to fetch team",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// =============================================================================
// PLAYERS ENDPOINTS
// =============================================================================

app.get("/cbb/players", async (c) => {
  const env = c.env;
  const query = c.req.query("q");
  const teamId = c.req.query("team");
  const limitParam = c.req.query("limit");
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
          error: "Search query required",
          message: "Provide ?q=name (min 2 chars) or ?team=teamId",
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
        error: "Failed to fetch players",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/cbb/players/:id", async (c) => {
  const env = c.env;
  const playerId = c.req.param("id");

  try {
    const player = await getPlayerById(env.BSI_DB, playerId);

    if (!player) {
      return c.json({ error: "Player not found", playerId }, 404);
    }

    // Get additional data
    const [sources, nilDeals] = await Promise.all([
      getEntitySources(env.BSI_DB, "player", playerId),
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
        error: "Failed to fetch player",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// =============================================================================
// GAMES ENDPOINT
// =============================================================================

app.get("/cbb/games/:id", async (c) => {
  const env = c.env;
  const gameId = c.req.param("id");

  try {
    const game = await getGameById(env.BSI_DB, gameId);

    if (!game) {
      return c.json({ error: "Game not found", gameId }, 404);
    }

    // Get team info
    const [homeTeam, awayTeam, sources] = await Promise.all([
      getTeamById(env.BSI_DB, game.home_team_id),
      getTeamById(env.BSI_DB, game.away_team_id),
      getEntitySources(env.BSI_DB, "game", gameId),
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
        error: "Failed to fetch game",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// =============================================================================
// NIL ENDPOINTS
// =============================================================================

app.get("/cbb/nil/deals", async (c) => {
  const env = c.env;
  const playerId = c.req.query("player");
  const teamId = c.req.query("team");
  const limitParam = c.req.query("limit");
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
        error: "Failed to fetch NIL deals",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/cbb/nil/market", async (c) => {
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
        error: "Failed to fetch NIL market data",
        message: error instanceof Error ? error.message : "Unknown error",
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
app.get("/cbb/mlb/live", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const games = await providers.baseball.getMLBLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch MLB live games",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// MLB Scores by Date
app.get("/cbb/mlb/scores/:date", async (c) => {
  const env = c.env;
  const dateParam = c.req.param("date");
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json({ error: "Invalid date format", message: "Date must be YYYY-MM-DD" }, 400);
  }

  try {
    const games = await providers.baseball.getMatchesByDate(dateParam, "MLB");
    return c.json({
      data: games,
      date: dateParam,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch MLB scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// MLB Standings
app.get("/cbb/mlb/standings", async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query("season") ? parseInt(c.req.query("season")!, 10) : undefined;

  if (!providers.baseball) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const standings = await providers.baseball.getMLBStandings(season);
    return c.json({
      data: standings,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch MLB standings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// MLB Teams
app.get("/cbb/mlb/teams", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const teams = await providers.baseball.getMLBTeams();
    return c.json({
      data: teams,
      count: teams.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch MLB teams",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NCAA Baseball Live (Highlightly)
app.get("/cbb/ncaa-baseball/live", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.baseball) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const games = await providers.baseball.getNCAABaseballLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NCAA Baseball live games",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NFL Live Games
app.get("/cbb/nfl/live", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const games = await providers.football.getNFLLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NFL live games",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NFL Scores by Date
app.get("/cbb/nfl/scores/:date", async (c) => {
  const env = c.env;
  const dateParam = c.req.param("date");
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return c.json({ error: "Invalid date format", message: "Date must be YYYY-MM-DD" }, 400);
  }

  try {
    const games = await providers.football.getMatchesByDate(dateParam, "NFL");
    return c.json({
      data: games,
      date: dateParam,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NFL scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NFL Standings
app.get("/cbb/nfl/standings", async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query("season") ? parseInt(c.req.query("season")!, 10) : undefined;

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const standings = await providers.football.getNFLStandings(season);
    return c.json({
      data: standings,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NFL standings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NFL Teams
app.get("/cbb/nfl/teams", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const teams = await providers.football.getNFLTeams();
    return c.json({
      data: teams,
      count: teams.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NFL teams",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NCAA Football Live Games
app.get("/cbb/ncaa-football/live", async (c) => {
  const env = c.env;
  const providers = createProviders(env);

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const games = await providers.football.getNCAAFootballLiveGames();
    return c.json({
      data: games,
      count: games.length,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NCAA Football live games",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// NCAA Football Standings
app.get("/cbb/ncaa-football/standings", async (c) => {
  const env = c.env;
  const providers = createProviders(env);
  const season = c.req.query("season") ? parseInt(c.req.query("season")!, 10) : undefined;

  if (!providers.football) {
    return c.json(
      { error: "Highlightly API not configured", message: "Missing HIGHLIGHTLY_API_KEY" },
      503
    );
  }

  try {
    const standings = await providers.football.getNCAAFootballStandings(season);
    return c.json({
      data: standings,
      source: "highlightly",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to fetch NCAA Football standings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});


// HELPER FUNCTIONS
// =============================================================================

function formatNcaaGame(game: any) {
  const competition = game.competitions?.[0];
  const home = competition?.competitors?.find((c: any) => c.homeAway === "home");
  const away = competition?.competitors?.find((c: any) => c.homeAway === "away");

  return {
    id: game.id,
    date: game.date,
    status: game.status?.type?.state ?? "unknown",
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
// 404 HANDLER
// =============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: "The requested endpoint does not exist",
      path: c.req.path,
    },
    404
  );
});

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.onError((err, c) => {
  console.error("Gateway error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

export default app;
