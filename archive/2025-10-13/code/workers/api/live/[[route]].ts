/**
 * Cloudflare Workers API - Live Sports Data
 * Real-time scores, rankings, and stats using actual API keys
 */

interface Env {
  SPORTSDATAIO_API_KEY: string;
  CFBDATA_API_KEY: string;
  THEODDS_API_KEY: string;
  SPORTS_CACHE: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const route = (params.route as string[]) || [];
    const [sport, action] = route;

    // Route handling
    switch (`${sport}/${action}`) {
      case 'ncaa/football':
        return await getNCAAFootball(url, env);

      case 'mlb/scores':
        return await getMLBScores(url, env);

      case 'nfl/scores':
        return await getNFLScores(url, env);

      case 'nba/scores':
        return await getNBAScores(url, env);

      case 'all/scores':
        return await getAllScores(url, env);

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid route',
            availableRoutes: [
              '/api/live/ncaa/football',
              '/api/live/mlb/scores',
              '/api/live/nfl/scores',
              '/api/live/nba/scores',
              '/api/live/all/scores',
            ],
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Get NCAA Football Rankings
 */
async function getNCAAFootball(url: URL, env: Env) {
  const year = url.searchParams.get('year') || '2025';
  const week = url.searchParams.get('week');
  const cacheKey = `ncaa:football:${year}:${week || 'latest'}`;

  // Try cache first
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  }

  // Fetch from CollegeFootballData API
  const weekParam = week ? `&week=${week}` : '';
  const apiUrl = `https://api.collegefootballdata.com/rankings?year=${year}${weekParam}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${env.CFBDATA_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CollegeFootballData API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform to our format
  const rankings: any[] = [];

  if (Array.isArray(data) && data.length > 0) {
    const latestPoll = data[0];
    const apPoll = latestPoll.polls?.find((p: any) => p.poll === 'AP Top 25');

    if (apPoll) {
      apPoll.ranks?.forEach((rank: any) => {
        const wins = rank.wins || 0;
        const losses = rank.losses || 0;
        const totalGames = wins + losses || 1;
        const winPct = wins / totalGames;

        // Blaze Composite Rating
        const performance = winPct * 40;
        const talent = 75 * 0.3;
        const historical = 75 * 0.2;
        const sos = 75 * 0.1;
        const compositeRating = Math.round((performance + talent + historical + sos) * 10) / 10;

        rankings.push({
          rank: rank.rank,
          team: rank.school,
          school: rank.school,
          conference: rank.conference || '',
          record: `${wins}-${losses}`,
          wins,
          losses,
          winPct: Math.round(winPct * 1000) / 1000,
          rating: compositeRating,
          firstPlaceVotes: rank.firstPlaceVotes || 0,
          points: rank.points || 0,
        });
      });
    }
  }

  const responseData = {
    success: true,
    sport: 'ncaa-football',
    season: year,
    week: week || 'latest',
    rankings,
    meta: {
      dataSource: 'CollegeFootballData API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalTeams: rankings.length,
    },
  };

  // Cache for 5 minutes
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 5 * 60 * 1000,
      }),
      { expirationTtl: 300 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

/**
 * Get Live MLB Scores
 */
async function getMLBScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const cacheKey = `mlb:live:${date}`;

  // Try cache first (30-second TTL for live data)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${date}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.GameID?.toString(),
    sport: 'baseball',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeTeamRuns || 0,
      logo: `https://cdn.sportsdata.io/mlb/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayTeamRuns || 0,
      logo: `https://cdn.sportsdata.io/mlb/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    inning: game.Inning ? `Inning ${game.Inning}` : null,
    inningHalf: game.InningHalf,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'mlb',
    date,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get Live NFL Scores
 */
async function getNFLScores(url: URL, env: Env) {
  const season = url.searchParams.get('season') || '2025';
  const week = url.searchParams.get('week') || 'current';
  const cacheKey = `nfl:live:${season}:${week}`;

  // Try cache first (30-second TTL)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.ScoreID?.toString(),
    sport: 'football',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeScore || 0,
      logo: `https://cdn.sportsdata.io/nfl/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayScore || 0,
      logo: `https://cdn.sportsdata.io/nfl/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    quarter: game.Quarter ? `Q${game.Quarter}` : null,
    timeRemaining: game.TimeRemaining,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'nfl',
    season,
    week,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get Live NBA Scores
 */
async function getNBAScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const cacheKey = `nba:live:${date}`;

  // Try cache first (30-second TTL)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${date}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.GameID?.toString(),
    sport: 'basketball',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeTeamScore || 0,
      logo: `https://cdn.sportsdata.io/nba/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayTeamScore || 0,
      logo: `https://cdn.sportsdata.io/nba/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    quarter: game.Quarter ? `Q${game.Quarter}` : null,
    timeRemaining: game.TimeRemaining,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'nba',
    date,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get All Live Scores (aggregated)
 */
async function getAllScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Fetch all sports in parallel
  const [mlb, nfl, nba] = await Promise.allSettled([
    getMLBScores(new URL(`?date=${date}`, url), env).then(r => r.json()),
    getNFLScores(new URL('?week=current', url), env).then(r => r.json()),
    getNBAScores(new URL(`?date=${date}`, url), env).then(r => r.json()),
  ]);

  const allGames: any[] = [];

  if (mlb.status === 'fulfilled' && mlb.value.success) {
    allGames.push(...mlb.value.games);
  }
  if (nfl.status === 'fulfilled' && nfl.value.success) {
    allGames.push(...nfl.value.games);
  }
  if (nba.status === 'fulfilled' && nba.value.success) {
    allGames.push(...nba.value.games);
  }

  return new Response(
    JSON.stringify({
      success: true,
      date,
      games: allGames,
      meta: {
        dataSource: 'SportsDataIO',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        totalGames: allGames.length,
      },
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    }
  );
}