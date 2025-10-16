/**
 * BLAZE SPORTS INTEL - COPILOT FEATURED GAMES API
 * Returns featured/trending games based on views and recency
 *
 * Endpoint: GET /api/copilot/featured-games
 *
 * Query Parameters:
 * - limit: Number of results (default: 5, max: 10)
 * - sport: Filter by sport ('NFL', 'MLB', 'CFB', 'CBB', or '' for all)
 *
 * Response Format:
 * {
 *   games: [{ teams, score, sport, date, views, badge }],
 *   meta: { limit, sport, totalGames, lastUpdated, dataSource }
 * }
 *
 * @author Austin Humphrey <austin@blazesportsintel.com>
 * @version 1.0.0
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * Featured games with view counts
 * In production, this would come from D1 database with actual view tracking
 */
const FEATURED_GAMES = [
  {
    teams: 'Chiefs vs Ravens',
    score: '34-20',
    sport: 'NFL',
    date: '2025-01-20',
    views: 12453,
    badge: 'NFL',
    gameId: 'nfl_2025_week1_chiefs_ravens'
  },
  {
    teams: 'Cardinals vs Cubs',
    score: '5-3',
    sport: 'MLB',
    date: '2025-01-19',
    views: 8932,
    badge: 'MLB',
    gameId: 'mlb_2025_cardinals_cubs_001'
  },
  {
    teams: 'Lakers vs Celtics',
    score: '112-108',
    sport: 'NBA',
    date: '2025-01-20',
    views: 7821,
    badge: 'NBA',
    gameId: 'nba_2025_lakers_celtics'
  },
  {
    teams: 'Texas vs Oklahoma',
    score: '34-24',
    sport: 'CFB',
    date: '2025-01-18',
    views: 6543,
    badge: 'CFB',
    gameId: 'cfb_2025_texas_oklahoma'
  },
  {
    teams: 'Duke vs North Carolina',
    score: '85-81',
    sport: 'CBB',
    date: '2025-01-19',
    views: 5234,
    badge: 'CBB',
    gameId: 'cbb_2025_duke_unc'
  },
  {
    teams: 'Dodgers vs Yankees',
    score: '7-4',
    sport: 'MLB',
    date: '2025-01-20',
    views: 4987,
    badge: 'MLB',
    gameId: 'mlb_2025_dodgers_yankees_001'
  },
  {
    teams: 'Patriots vs Bills',
    score: '28-24',
    sport: 'NFL',
    date: '2025-01-19',
    views: 4532,
    badge: 'NFL',
    gameId: 'nfl_2025_week1_patriots_bills'
  },
  {
    teams: 'Alabama vs Georgia',
    score: '31-28',
    sport: 'CFB',
    date: '2025-01-17',
    views: 3876,
    badge: 'CFB',
    gameId: 'cfb_2025_alabama_georgia'
  },
  {
    teams: 'Kentucky vs Louisville',
    score: '78-72',
    sport: 'CBB',
    date: '2025-01-18',
    views: 3245,
    badge: 'CBB',
    gameId: 'cbb_2025_kentucky_louisville'
  },
  {
    teams: 'Astros vs Rangers',
    score: '4-2',
    sport: 'MLB',
    date: '2025-01-18',
    views: 2987,
    badge: 'MLB',
    gameId: 'mlb_2025_astros_rangers_001'
  }
];

/**
 * Filter games by sport
 */
function filterBySport(games, sport) {
  if (!sport) return games;
  return games.filter(game => game.sport === sport);
}

/**
 * Main handler
 */
export async function onRequest({ request, env, ctx }) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 10);
    const sport = url.searchParams.get('sport') || '';

    // Try to fetch from cache (KV)
    const cacheKey = `copilot:featured:${limit}:${sport}`;
    let cachedData = null;

    if (env?.CACHE) {
      try {
        cachedData = await env.CACHE.get(cacheKey, 'json');
        if (cachedData && cachedData.expires > Date.now()) {
          return new Response(
            JSON.stringify({
              ...cachedData.data,
              meta: {
                ...cachedData.data.meta,
                cached: true,
                cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000)
              }
            }),
            {
              headers: {
                ...CORS_HEADERS,
                'Cache-Control': 'public, max-age=180',
                'X-Cache': 'HIT'
              }
            }
          );
        }
      } catch (error) {
        console.error('KV cache read error:', error);
      }
    }

    // Filter and sort featured games
    const filtered = filterBySport(FEATURED_GAMES, sport);
    const games = filtered
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(({ teams, score, sport, date, views, badge, gameId }) => ({
        teams,
        score,
        sport,
        date,
        views,
        badge,
        gameId
      }));

    const totalGames = filtered.length;

    const responseData = {
      games,
      meta: {
        limit,
        sport: sport || 'all',
        totalGames,
        lastUpdated: new Date().toISOString(),
        dataSource: 'Blaze Intelligence Game Analytics',
        cached: false
      }
    };

    // Cache the response (3 minutes for featured games - more dynamic)
    if (env?.CACHE) {
      const ttl = 180;
      try {
        await env.CACHE.put(
          cacheKey,
          JSON.stringify({
            data: responseData,
            timestamp: Date.now(),
            expires: Date.now() + (ttl * 1000)
          }),
          { expirationTtl: ttl }
        );
      } catch (error) {
        console.error('KV cache write error:', error);
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=180',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Featured games endpoint error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        meta: {
          mode: 'ERROR',
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: CORS_HEADERS
      }
    );
  }
}
