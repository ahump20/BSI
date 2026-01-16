/**
 * Coverage Matrix API
 * Returns season-by-season data coverage for all sports
 *
 * Endpoint: GET /api/coverage-matrix
 *
 * Returns:
 * {
 *   success: true,
 *   sports: {
 *     "baseball": {
 *       "cws": { // College World Series
 *         "2000": { games: 15, status: "complete", lastUpdated: "2025-01-11T..." },
 *         "2001": { games: 15, status: "complete", lastUpdated: "2025-01-11T..." },
 *         ...
 *       },
 *       "mlb": { ... }
 *     },
 *     "football": { ... }
 *   },
 *   lastUpdated: "2025-01-11T..."
 * }
 */

import { corsHeaders } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const coverageData = {
      success: true,
      sports: {},
    };

    // Baseball coverage
    coverageData.sports.baseball = await getBaseballCoverage(env.DB);

    // Football coverage (placeholder for now)
    coverageData.sports.football = {
      ncaa: await getNCAAFootballCoverage(),
      nfl: await getNFLCoverage(),
    };

    // Basketball coverage (placeholder for now)
    coverageData.sports.basketball = {
      ncaa: await getNCAABasketballCoverage(),
    };

    coverageData.lastUpdated = new Date().toISOString();
    coverageData.timezone = 'America/Chicago';

    return new Response(JSON.stringify(coverageData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Coverage matrix error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate coverage matrix',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get baseball coverage from D1 historical database
 */
async function getBaseballCoverage(db) {
  if (!db) {
    return {
      cws: {},
      note: 'D1 database not available',
    };
  }

  try {
    // Query games grouped by season for College World Series
    const cwsGames = await db
      .prepare(
        `
      SELECT
        SUBSTR(date, 1, 4) as year,
        COUNT(*) as game_count,
        MIN(date) as first_game,
        MAX(date) as last_game
      FROM historical_games
      WHERE sport = 'baseball'
        AND tournament_round LIKE 'College World Series%'
      GROUP BY year
      ORDER BY year DESC
    `
      )
      .all();

    const cwsCoverage = {};

    (cwsGames.results || []).forEach((row) => {
      const year = row.year;
      const gameCount = row.game_count;

      // Determine status based on game count
      // CWS typically has 14-18 games (8-team double elimination)
      let status = 'partial';
      if (gameCount >= 14) status = 'complete';
      if (gameCount < 5) status = 'minimal';

      cwsCoverage[year] = {
        games: gameCount,
        status,
        dateRange: {
          first: row.first_game,
          last: row.last_game,
        },
        lastUpdated: new Date().toISOString(),
      };
    });

    return {
      cws: cwsCoverage,
      mlb: {
        note: 'MLB regular season data available via MLB Stats API (live)',
      },
    };
  } catch (error) {
    console.error('Baseball coverage query error:', error);
    return {
      cws: {},
      error: error.message,
    };
  }
}

/**
 * Get NCAA Football coverage (placeholder)
 */
async function getNCAAFootballCoverage() {
  // TODO: Query historical database when NCAA football data is added
  return {
    note: 'NCAA Football data available via ESPN API (live only)',
    historical: {},
  };
}

/**
 * Get NFL coverage (placeholder)
 */
async function getNFLCoverage() {
  return {
    note: 'NFL data available via ESPN API and SportsDataIO (live only)',
    historical: {},
  };
}

/**
 * Get NCAA Basketball coverage (placeholder)
 */
async function getNCAABasketballCoverage() {
  return {
    note: 'NCAA Basketball data available via ESPN API (live only)',
    historical: {},
  };
}
