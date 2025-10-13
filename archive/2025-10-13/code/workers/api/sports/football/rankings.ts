/**
 * Cloudflare Workers API - Football Rankings
 * Real MaxPreps data integration with caching
 */

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const state = url.searchParams.get('state') || 'TX';
    const classification = url.searchParams.get('classification') || '6A';
    const cacheKey = `football:rankings:${state}:${classification}`;

    // Try to get from KV cache first
    const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Fetch fresh data from MaxPreps
    const maxprepsResponse = await fetch(
      `https://api.maxpreps.com/rankings/football?state=${state}&classification=${classification}`,
      {
        headers: {
          'X-API-Key': env.MAXPREPS_API_KEY || '',
          'User-Agent': 'BlazeSportsIntel/1.0',
        },
      }
    );

    if (!maxprepsResponse.ok) {
      throw new Error(`MaxPreps API error: ${maxprepsResponse.status}`);
    }

    const maxprepsData = await maxprepsResponse.json();

    // Transform to Blaze format with composite ratings
    const teams = (maxprepsData.rankings || []).map((team: any, index: number) => {
      const wins = team.wins || 0;
      const losses = team.losses || 0;
      const totalGames = wins + losses;
      const winPct = totalGames > 0 ? wins / totalGames : 0;

      // Blaze Composite Rating Algorithm
      const performance = winPct * 40; // 40% weight
      const talent = (team.avgPlayerRating || 75) * 0.3; // 30% weight
      const historical = (team.programSuccess || 75) * 0.2; // 20% weight
      const strengthOfSchedule = (team.sos || 75) * 0.1; // 10% weight
      const compositeRating = Math.round((performance + talent + historical + strengthOfSchedule) * 10) / 10;

      return {
        rank: index + 1,
        team: team.mascot || team.name,
        school: team.school || team.schoolName,
        city: team.city,
        state: team.state,
        region: getRegion(team.state),
        classification: team.classification || classification,
        record: `${wins}-${losses}${team.ties ? `-${team.ties}` : ''}`,
        wins,
        losses,
        ties: team.ties || 0,
        winPct: Math.round(winPct * 1000) / 1000,
        rating: compositeRating,
        trend: calculateTrend(team.recentGames || []),
        lastGame: team.lastGame ? {
          opponent: team.lastGame.opponent,
          result: team.lastGame.result,
          score: team.lastGame.score,
          date: team.lastGame.date,
        } : null,
        topPlayer: team.topPlayer ? {
          name: team.topPlayer.name,
          position: team.topPlayer.position,
          stats: team.topPlayer.stats,
        } : null,
        collegeCommits: team.collegeCommits || 0,
        compositeFactors: {
          performance: Math.round(performance * 10) / 10,
          talent: Math.round(talent * 10) / 10,
          historical: Math.round(historical * 10) / 10,
          strengthOfSchedule: Math.round(strengthOfSchedule * 10) / 10,
        },
      };
    });

    const response = {
      success: true,
      sport: 'football',
      state,
      classification,
      season: '2025-2026',
      rankings: teams,
      meta: {
        dataSource: 'MaxPreps API',
        methodology: 'Blaze Composite Algorithm: Performance (40%), Talent (30%), Historical (20%), SOS (10%)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        updateFrequency: 'Every 5 minutes during season',
        totalTeams: teams.length,
      },
    };

    // Cache in KV for 5 minutes
    if (env.SPORTS_CACHE) {
      await env.SPORTS_CACHE.put(
        cacheKey,
        JSON.stringify({
          data: response,
          timestamp: Date.now(),
          expires: Date.now() + (5 * 60 * 1000), // 5 minutes
        }),
        { expirationTtl: 300 }
      );
    }

    return new Response(JSON.stringify({ ...response, cached: false }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error: any) {
    console.error('Football rankings error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch football rankings',
      message: error.message,
      sport: 'football',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}

// Helper functions
function getRegion(state: string): string {
  const deepSouthStates = ['TX', 'AL', 'GA', 'LA', 'MS', 'SC', 'FL', 'AR', 'TN'];
  return deepSouthStates.includes(state) ? 'Deep South' : 'Other';
}

function calculateTrend(recentGames: any[]): number {
  if (!recentGames || recentGames.length === 0) return 0;

  const last5 = recentGames.slice(-5);
  const wins = last5.filter((g: any) => g.result === 'W').length;
  const prevWins = recentGames.slice(-10, -5).filter((g: any) => g.result === 'W').length;

  if (wins > prevWins) return 1; // Trending up
  if (wins < prevWins) return -1; // Trending down
  return 0; // Same
}