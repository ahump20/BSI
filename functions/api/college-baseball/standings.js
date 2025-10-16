/**
 * College Baseball Standings API
 * Returns conference standings with RPI, SOS data
 * 
 * Caching: 5 minutes
 */

const CACHE_KEY_PREFIX = 'college-baseball:standings';

export async function onRequest(context) {
  const { request, env } = context;
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
    const conference = url.searchParams.get('conference') || 'SEC';
    const division = url.searchParams.get('division') || 'D1';
    
    const cacheKey = `${CACHE_KEY_PREFIX}:${conference}:${division}`;
    
    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          data: data.standings,
          conference: data.conference,
          cached: true,
          cacheTime: data.timestamp
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
          }
        });
      }
    }

    // Fetch standings
    const standings = await fetchStandings(conference, division);
    
    const cacheData = {
      standings,
      conference,
      division,
      timestamp: new Date().toISOString()
    };
    
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300 // 5 minutes
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: standings,
      conference,
      division,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Standings API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch standings',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function fetchStandings(conference, division) {
  // Sample standings data for SEC
  return [
    {
      rank: 1,
      team: {
        id: 'tennessee',
        name: 'Tennessee Volunteers',
        shortName: 'TENN',
        conference: 'SEC'
      },
      overallRecord: { wins: 18, losses: 2 },
      conferenceRecord: { wins: 6, losses: 0 },
      streakType: 'W',
      streakCount: 7,
      last10: '9-1',
      rpi: 0.6842,
      sos: 0.5921
    },
    {
      rank: 2,
      team: {
        id: 'vanderbilt',
        name: 'Vanderbilt Commodores',
        shortName: 'VANDY',
        conference: 'SEC'
      },
      overallRecord: { wins: 17, losses: 3 },
      conferenceRecord: { wins: 5, losses: 1 },
      streakType: 'W',
      streakCount: 4,
      last10: '8-2',
      rpi: 0.6701,
      sos: 0.5734
    },
    {
      rank: 3,
      team: {
        id: 'texas',
        name: 'Texas Longhorns',
        shortName: 'TEX',
        conference: 'SEC'
      },
      overallRecord: { wins: 16, losses: 4 },
      conferenceRecord: { wins: 5, losses: 1 },
      streakType: 'L',
      streakCount: 1,
      last10: '7-3',
      rpi: 0.6523,
      sos: 0.5612
    },
    {
      rank: 4,
      team: {
        id: 'lsu',
        name: 'LSU Tigers',
        shortName: 'LSU',
        conference: 'SEC'
      },
      overallRecord: { wins: 15, losses: 3 },
      conferenceRecord: { wins: 4, losses: 2 },
      streakType: 'W',
      streakCount: 2,
      last10: '8-2',
      rpi: 0.6412,
      sos: 0.5501
    },
    {
      rank: 5,
      team: {
        id: 'arkansas',
        name: 'Arkansas Razorbacks',
        shortName: 'ARK',
        conference: 'SEC'
      },
      overallRecord: { wins: 14, losses: 5 },
      conferenceRecord: { wins: 4, losses: 2 },
      streakType: 'W',
      streakCount: 3,
      last10: '7-3',
      rpi: 0.6289,
      sos: 0.5445
    }
  ];
}
