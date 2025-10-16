/**
 * College Baseball Box Score API
 * Returns detailed box scores with batting/pitching stats
 * 
 * Caching: 15s for live games, 1 hour for final games
 */

const CACHE_KEY_PREFIX = 'college-baseball:boxscore';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const gameId = url.searchParams.get('gameId');
    
    if (!gameId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: gameId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:${gameId}`;
    
    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          data: data.boxscore,
          cached: true,
          cacheTime: data.timestamp,
          source: 'cache'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, stale-while-revalidate=10'
          }
        });
      }
    }

    // Fetch box score
    const boxscore = await fetchBoxScore(gameId);
    
    // Cache with appropriate TTL
    const cacheTTL = boxscore.status === 'final' ? 3600 : 15;
    const cacheData = {
      boxscore,
      timestamp: new Date().toISOString()
    };
    
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: cacheTTL
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: boxscore,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}, stale-while-revalidate=${Math.floor(cacheTTL / 2)}`
      }
    });

  } catch (error) {
    console.error('Box score API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch box score',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function fetchBoxScore(gameId) {
  // Sample box score data - will be replaced with actual scraper/API
  return {
    gameId,
    status: 'live',
    inning: 5,
    inningHalf: 'bottom',
    lastUpdate: new Date().toISOString(),
    homeTeam: {
      team: {
        id: 'lsu',
        name: 'LSU Tigers',
        shortName: 'LSU',
        conference: 'SEC'
      },
      score: 4,
      hits: 8,
      errors: 1,
      lineScore: [0, 2, 0, 1, 1, 0, 0, 0, 0],
      batting: [
        {
          playerId: 'player-1',
          playerName: 'Dylan Crews',
          position: 'CF',
          battingOrder: 1,
          atBats: 3,
          runs: 2,
          hits: 2,
          rbi: 1,
          walks: 0,
          strikeouts: 0,
          avg: 0.345
        },
        {
          playerId: 'player-2',
          playerName: 'Tommy White',
          position: '3B',
          battingOrder: 2,
          atBats: 3,
          runs: 1,
          hits: 2,
          rbi: 2,
          walks: 0,
          strikeouts: 1,
          avg: 0.328
        }
      ],
      pitching: [
        {
          playerId: 'pitcher-1',
          playerName: 'Paul Skenes',
          innings: 5.0,
          hits: 4,
          runs: 2,
          earnedRuns: 1,
          walks: 1,
          strikeouts: 8,
          pitches: 72,
          era: 1.69,
          decision: 'W'
        }
      ]
    },
    awayTeam: {
      team: {
        id: 'tennessee',
        name: 'Tennessee Volunteers',
        shortName: 'TENN',
        conference: 'SEC'
      },
      score: 2,
      hits: 5,
      errors: 0,
      lineScore: [1, 0, 1, 0, 0, 0, 0, 0, 0],
      batting: [
        {
          playerId: 'player-3',
          playerName: 'Blake Burke',
          position: 'RF',
          battingOrder: 1,
          atBats: 3,
          runs: 1,
          hits: 1,
          rbi: 0,
          walks: 0,
          strikeouts: 2,
          avg: 0.312
        }
      ],
      pitching: [
        {
          playerId: 'pitcher-2',
          playerName: 'Drew Beam',
          innings: 4.0,
          hits: 6,
          runs: 4,
          earnedRuns: 3,
          walks: 2,
          strikeouts: 5,
          pitches: 68,
          era: 3.42,
          decision: 'L'
        }
      ]
    }
  };
}
