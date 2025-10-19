// Cloudflare Worker - Backend API for College Baseball Tracker

import {
  mockLiveGames,
  mockBoxScore,
  mockStandings,
  mockPortalActivity,
} from './mockData';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: Get live games
      if (path === '/api/games/live') {
        const games = await fetchLiveGames(env);
        return jsonResponse({ games }, corsHeaders);
      }

      // Route: Transfer portal + recruiting heatmap data
      if (path === '/api/v1/portal/activity') {
        const activity = await fetchPortalActivity(env, url.searchParams);
        return jsonResponse(activity, corsHeaders);
      }

      // Route: Get box score for a specific game
      if (path.match(/^\/api\/games\/[^/]+\/boxscore$/)) {
        const gameId = path.split('/')[3];
        const boxScore = await fetchBoxScore(gameId, env);
        return jsonResponse(boxScore, corsHeaders);
      }

      // Route: Get conference standings
      if (path.match(/^\/api\/standings\/[^/]+$/)) {
        const conference = path.split('/')[3];
        const standings = await fetchStandings(conference, env);
        return jsonResponse(standings, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse(
        { error: error.message },
        corsHeaders,
        500
      );
    }
  },
};

function jsonResponse(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Fetch live games from NCAA or D1Baseball
async function fetchLiveGames(env) {
  // TODO: Implement actual data fetching from NCAA.com or D1Baseball
  // For now, return mock data
  
  // Example real implementation would scrape:
  // - NCAA.com live scoreboard
  // - D1Baseball live scores
  // - Individual conference websites
  
  // Cache in KV for 30 seconds to reduce API calls
  const cached = await env.KV?.get('live-games', 'json');
  if (cached) return cached;

  const games = mockLiveGames;
  
  await env.KV?.put('live-games', JSON.stringify(games), {
    expirationTtl: 30,
  });

  return games;
}

// Fetch detailed box score for a game
async function fetchBoxScore(gameId, env) {
  // TODO: Implement actual data fetching
  // Would scrape from:
  // - NCAA game detail page
  // - Team athletic department sites
  // - Stats services
  
  const cached = await env.KV?.get(`boxscore-${gameId}`, 'json');
  if (cached) return cached;

  const boxScore = mockBoxScore;
  
  await env.KV?.put(`boxscore-${gameId}`, JSON.stringify(boxScore), {
    expirationTtl: 15, // Cache for 15 seconds during live games
  });

  return boxScore;
}

// Fetch conference standings
async function fetchStandings(conference, env) {
  // TODO: Implement actual data fetching
  // Would aggregate from:
  // - Conference websites
  // - Warren Nolan RPI data
  // - Boyd's World statistics
  // - NCAA official standings
  
  const cached = await env.KV?.get(`standings-${conference}`, 'json');
  if (cached) return cached;

  const standings = mockStandings;
  
  await env.KV?.put(`standings-${conference}`, JSON.stringify(standings), {
    expirationTtl: 300, // Cache for 5 minutes
  });

  return standings;
}

async function fetchPortalActivity(env, searchParams) {
  const cacheKey = `portal-activity-${searchParams.toString()}`;
  const cached = await env.KV?.get(cacheKey, 'json');
  if (cached) return cached;

  const timeframeParam = searchParams.get('timeframe');
  const conferenceParam = searchParams.get('conference');
  const positionParam = searchParams.get('position');

  const availableTimeframes = mockPortalActivity.timeframes;
  const defaultTimeframe = mockPortalActivity.defaultTimeframe;
  const timeframe = availableTimeframes.includes(timeframeParam)
    ? timeframeParam
    : defaultTimeframe;

  const conference = conferenceParam && conferenceParam !== 'all'
    ? conferenceParam
    : 'all';
  const position = positionParam && positionParam !== 'all'
    ? positionParam
    : 'all';

  const regions = mockPortalActivity.regions
    .filter((region) =>
      conference === 'all' ? true : region.conferences.includes(conference)
    )
    .filter((region) =>
      position === 'all' ? true : region.positions.includes(position)
    )
    .map((region) => ({
      id: region.id,
      name: region.name,
      coordinates: region.coordinates,
      conferences: region.conferences,
      positions: region.positions,
      topPrograms: region.topPrograms,
      metrics: {
        timeframe,
        ...region.metrics[timeframe],
      },
    }));

  const recentMoves = mockPortalActivity.recentMoves.filter((move) => {
    const matchesTimeframe =
      timeframe === '90d'
        ? true
        : move.timeframe === timeframe ||
          (timeframe === '30d' && move.timeframe === '7d');
    const matchesConference =
      conference === 'all' ? true : move.conferenceTo === conference;
    const matchesPosition = position === 'all' ? true : move.position === position;
    return matchesTimeframe && matchesConference && matchesPosition;
  });

  const trendingPrograms = mockPortalActivity.trendingPrograms
    .filter((program) =>
      conference === 'all' ? true : program.conference === conference
    )
    .filter((program) =>
      position === 'all' ? true : program.positionsNeed.includes(position)
    )
    .map((program) => ({
      program: program.program,
      conference: program.conference,
      geography: program.geography,
      positionsNeed: program.positionsNeed,
      metrics: {
        timeframe,
        ...program.timeframes[timeframe],
      },
    }));

  const response = {
    timeframe,
    filters: {
      availableTimeframes,
      availableConferences: Array.from(
        new Set(mockPortalActivity.regions.flatMap((region) => region.conferences))
      ).sort(),
      availablePositions: Array.from(
        new Set(mockPortalActivity.regions.flatMap((region) => region.positions))
      ).sort(),
    },
    regions,
    recentMoves,
    trendingPrograms,
  };

  await env.KV?.put(cacheKey, JSON.stringify(response), {
    expirationTtl: 60,
  });

  return response;
}

// Helper function to scrape NCAA.com (example)
async function scrapeNCAAScoreboard() {
  // Example implementation
  const response = await fetch('https://www.ncaa.com/scoreboard/baseball/d1');
  const html = await response.text();
  
  // Parse HTML to extract:
  // - Game scores
  // - Current inning/status
  // - Team records
  // - Venue information
  
  return []; // Return parsed games
}

// Helper function to scrape D1Baseball scores
async function scrapeD1Baseball() {
  const response = await fetch('https://d1baseball.com/scores/');
  const html = await response.text();
  
  // Parse live scores and game details
  
  return [];
}
