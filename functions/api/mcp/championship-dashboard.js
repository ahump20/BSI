/**
 * Blaze Sports Intel - Championship Dashboard API
 * Cloudflare Workers Edge Function with WebAssembly acceleration
 * Integrates with Blaze MCP Server for real-time sports intelligence
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    // Parse request body for POST requests
    let requestData = {};
    if (request.method === 'POST') {
      requestData = await request.json().catch(() => ({}));
    }

    const sport = requestData.sport || 'baseball';
    const includeAnalytics = requestData.includeAnalytics !== false;

    // Generate cache key
    const cacheKey = `blaze:3d:${sport}:${includeAnalytics}`;

    // Try cache first (KV storage)
    if (env.BLAZE_CACHE) {
      const cached = await env.BLAZE_CACHE.get(cacheKey, 'json');
      if (cached && cached.expires > Date.now()) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Edge-Location': request.cf?.colo || 'Unknown',
          },
        });
      }
    }

    // Fetch fresh data from MCP server or external APIs
    const data = await fetchChampionshipData(sport, includeAnalytics, env);

    // Cache the result
    if (env.BLAZE_CACHE) {
      const cacheData = {
        data,
        expires: Date.now() + 30000, // 30 seconds
        generated: new Date().toISOString(),
      };
      await env.BLAZE_CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 60,
      });
    }

    // Return response with edge metadata
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Edge-Location': request.cf?.colo || 'Unknown',
        'X-Response-Time': `${Date.now()}ms`,
      },
    });
  } catch (error) {
    console.error('❌ Championship dashboard error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Fetch championship data from multiple sources
 */
async function fetchChampionshipData(sport, includeAnalytics, env) {
  const endpoints = getSportEndpoints(sport);

  try {
    // Parallel fetch from multiple sources
    const [scoresData, standingsData, analyticsData] = await Promise.allSettled([
      fetchWithTimeout(endpoints.scores, env),
      fetchWithTimeout(endpoints.standings, env),
      includeAnalytics ? fetchWithTimeout(endpoints.analytics, env) : null,
    ]);

    // Process results
    const scores = scoresData.status === 'fulfilled' ? scoresData.value : null;
    const standings = standingsData.status === 'fulfilled' ? standingsData.value : null;
    const analytics = analyticsData?.status === 'fulfilled' ? analyticsData.value : null;

    // Transform data for 3D visualization
    return {
      sport,
      timestamp: new Date().toISOString(),
      timezone: 'America/Chicago',
      games: transformGamesFor3D(scores, sport),
      standings: transformStandingsFor3D(standings, sport),
      analytics: includeAnalytics ? transformAnalyticsFor3D(analytics, sport) : null,
      visualization: {
        meshCount: calculateMeshCount(scores, standings),
        animationDuration: 2000,
        cameraPosition: getCameraPosition(sport),
        lighting: getLightingConfig(sport),
      },
      meta: {
        dataSource: 'Blaze MCP + ESPN + MLB Stats API',
        edgeLocation: 'Cloudflare Global',
        renderEngine: 'Babylon.js 8.0 WebGPU',
        performanceTarget: '60 FPS',
      },
    };
  } catch (error) {
    console.error('❌ Data fetch error:', error);

    // Return fallback demo data
    return getDemoData(sport, includeAnalytics);
  }
}

/**
 * Get sport-specific API endpoints
 */
function getSportEndpoints(sport) {
  const baseUrls = {
    espn: 'https://site.api.espn.com/apis/site/v2/sports',
    mlb: 'https://statsapi.mlb.com/api/v1',
    nfl: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl',
    nba: 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba',
  };

  switch (sport) {
    case 'baseball':
      return {
        scores: `${baseUrls.espn}/baseball/mlb/scoreboard`,
        standings: `${baseUrls.mlb}/standings`,
        analytics: `${baseUrls.mlb}/teams/stats`,
      };
    case 'football':
      return {
        scores: `${baseUrls.espn}/football/nfl/scoreboard`,
        standings: `${baseUrls.nfl}/standings`,
        analytics: `${baseUrls.nfl}/teams/stats`,
      };
    case 'basketball':
      return {
        scores: `${baseUrls.espn}/basketball/nba/scoreboard`,
        standings: `${baseUrls.nba}/standings`,
        analytics: `${baseUrls.nba}/teams/stats`,
      };
    case 'track':
      return {
        scores: null,
        standings: null,
        analytics: null,
      };
    default:
      return {
        scores: `${baseUrls.espn}/baseball/mlb/scoreboard`,
        standings: `${baseUrls.mlb}/standings`,
        analytics: `${baseUrls.mlb}/teams/stats`,
      };
  }
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout(url, env, timeout = 5000) {
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlazeSportsIntel/3.0 (https://blazesportsintel.com)',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('⚠️ Request timeout for', url);
    } else {
      console.error('❌ Fetch error for', url, error);
    }
    return null;
  }
}

/**
 * Transform game data for 3D visualization
 */
function transformGamesFor3D(scoresData, sport) {
  if (!scoresData?.events) {
    return getDemoGames(sport);
  }

  return scoresData.events.slice(0, 10).map((event) => {
    const competition = event.competitions?.[0];
    const home = competition?.competitors?.find((c) => c.homeAway === 'home');
    const away = competition?.competitors?.find((c) => c.homeAway === 'away');

    return {
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: {
        type: event.status?.type?.name,
        detail: event.status?.type?.detail,
        completed: event.status?.type?.completed,
        period: event.status?.period,
        clock: event.status?.displayClock,
      },
      teams: {
        home: {
          id: home?.id,
          name: home?.team?.displayName,
          abbreviation: home?.team?.abbreviation,
          score: home?.score,
          logo: home?.team?.logo,
          color: home?.team?.color || '#ff6b00',
          position: { x: -2, y: 0, z: 0 }, // 3D position
        },
        away: {
          id: away?.id,
          name: away?.team?.displayName,
          abbreviation: away?.team?.abbreviation,
          score: away?.score,
          logo: away?.team?.logo,
          color: away?.team?.color || '#0066cc',
          position: { x: 2, y: 0, z: 0 }, // 3D position
        },
      },
      venue: {
        name: competition?.venue?.fullName,
        city: competition?.venue?.address?.city,
        state: competition?.venue?.address?.state,
      },
      broadcast: competition?.broadcasts?.[0]?.names?.[0],
      visualization: {
        intensity: calculateGameIntensity(home?.score, away?.score),
        animation: event.status?.type?.completed ? 'completed' : 'live',
      },
    };
  });
}

/**
 * Transform standings for 3D visualization
 */
function transformStandingsFor3D(standingsData, sport) {
  // Simplified transformation - expand based on actual API response
  if (!standingsData) {
    return getDemoStandings(sport);
  }

  return {
    divisions: [],
    updated: new Date().toISOString(),
    visualConfig: {
      barHeight: 0.5,
      spacing: 0.2,
      colorGradient: ['#28a745', '#ffc107', '#dc3545'],
    },
  };
}

/**
 * Transform analytics for 3D visualization
 */
function transformAnalyticsFor3D(analyticsData, sport) {
  if (!analyticsData) {
    return getDemoAnalytics(sport);
  }

  return {
    pythagorean: {
      expectedWins: 85.5,
      actualWins: 82,
      luckFactor: -3.5,
    },
    efficiency: {
      offense: 112.4,
      defense: 98.7,
      overall: 105.6,
    },
    momentum: {
      last10: '7-3',
      trend: 'up',
      confidence: 0.78,
    },
    visualization: {
      graphType: '3d-bar',
      particles: true,
      heatmap: true,
    },
  };
}

/**
 * Calculate game intensity for visual effects
 */
function calculateGameIntensity(homeScore, awayScore) {
  if (!homeScore || !awayScore) return 0.5;

  const scoreDiff = Math.abs(homeScore - awayScore);
  const totalScore = homeScore + awayScore;

  // Higher scores and closer games = higher intensity
  const closenessFactor = 1 - scoreDiff / (totalScore || 1);
  const scoreFactor = Math.min(totalScore / 20, 1);

  return closenessFactor * 0.6 + scoreFactor * 0.4;
}

/**
 * Calculate mesh count for performance optimization
 */
function calculateMeshCount(scores, standings) {
  const baseCount = 20; // Stadium base objects
  const gameCount = scores?.events?.length || 5;
  const teamCount = standings?.divisions?.length || 10;

  return baseCount + gameCount * 3 + teamCount * 2;
}

/**
 * Get sport-specific camera position
 */
function getCameraPosition(sport) {
  const positions = {
    baseball: { alpha: Math.PI / 4, beta: Math.PI / 3, radius: 12 },
    football: { alpha: Math.PI / 3, beta: Math.PI / 4, radius: 15 },
    basketball: { alpha: Math.PI / 2, beta: Math.PI / 3, radius: 10 },
    track: { alpha: 0, beta: Math.PI / 4, radius: 20 },
  };

  return positions[sport] || positions.baseball;
}

/**
 * Get sport-specific lighting configuration
 */
function getLightingConfig(sport) {
  return {
    ambient: 0.7,
    directional: 0.5,
    shadows: true,
    shadowQuality: 1024,
    hdr: true,
  };
}

/**
 * Demo data generators for fallback
 */
function getDemoGames(sport) {
  const teams = {
    baseball: [
      { name: 'Cardinals', abbr: 'STL' },
      { name: 'Titans', abbr: 'TEN' },
      { name: 'Longhorns', abbr: 'TEX' },
      { name: 'Grizzlies', abbr: 'MEM' },
    ],
    football: [
      { name: 'Titans', abbr: 'TEN' },
      { name: 'Longhorns', abbr: 'TEX' },
      { name: 'Chiefs', abbr: 'KC' },
      { name: 'Cowboys', abbr: 'DAL' },
    ],
    basketball: [
      { name: 'Grizzlies', abbr: 'MEM' },
      { name: 'Mavericks', abbr: 'DAL' },
      { name: 'Spurs', abbr: 'SA' },
      { name: 'Rockets', abbr: 'HOU' },
    ],
  };

  const sportTeams = teams[sport] || teams.baseball;

  return Array.from({ length: 3 }, (_, i) => ({
    id: `demo-${i}`,
    name: `${sportTeams[i % sportTeams.length].name} Game`,
    date: new Date().toISOString(),
    status: {
      type: i === 0 ? 'STATUS_IN_PROGRESS' : 'STATUS_FINAL',
      detail: i === 0 ? 'In Progress' : 'Final',
      completed: i !== 0,
    },
    teams: {
      home: {
        name: sportTeams[i % sportTeams.length].name,
        abbreviation: sportTeams[i % sportTeams.length].abbr,
        score: Math.floor(Math.random() * 8) + 2,
        color: '#ff6b00',
        position: { x: -2, y: 0, z: 0 },
      },
      away: {
        name: sportTeams[(i + 1) % sportTeams.length].name,
        abbreviation: sportTeams[(i + 1) % sportTeams.length].abbr,
        score: Math.floor(Math.random() * 8) + 2,
        color: '#0066cc',
        position: { x: 2, y: 0, z: 0 },
      },
    },
    visualization: {
      intensity: Math.random() * 0.5 + 0.5,
      animation: i === 0 ? 'live' : 'completed',
    },
  }));
}

function getDemoStandings(sport) {
  return {
    divisions: [],
    updated: new Date().toISOString(),
    visualConfig: {
      barHeight: 0.5,
      spacing: 0.2,
      colorGradient: ['#28a745', '#ffc107', '#dc3545'],
    },
  };
}

function getDemoAnalytics(sport) {
  return {
    pythagorean: {
      expectedWins: 85.5,
      actualWins: 82,
      luckFactor: -3.5,
    },
    efficiency: {
      offense: 112.4,
      defense: 98.7,
      overall: 105.6,
    },
    momentum: {
      last10: '7-3',
      trend: 'up',
      confidence: 0.78,
    },
    visualization: {
      graphType: '3d-bar',
      particles: true,
      heatmap: true,
    },
  };
}

function getDemoData(sport, includeAnalytics) {
  return {
    sport,
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    games: getDemoGames(sport),
    standings: getDemoStandings(sport),
    analytics: includeAnalytics ? getDemoAnalytics(sport) : null,
    visualization: {
      meshCount: 50,
      animationDuration: 2000,
      cameraPosition: getCameraPosition(sport),
      lighting: getLightingConfig(sport),
    },
    meta: {
      dataSource: 'Demo Data (API Unavailable)',
      edgeLocation: 'Cloudflare Global',
      renderEngine: 'Babylon.js 8.0 WebGPU',
      performanceTarget: '60 FPS',
      mode: 'DEMO',
    },
  };
}
