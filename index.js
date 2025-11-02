// Cloudflare Worker - Backend API for College Baseball Tracker

import { mockLiveGames, mockBoxScore, mockStandings } from './mockData';

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

      if (path.match(/^\/api\/analytics\/baseball\/games\/[^/]+$/)) {
        const gameId = path.split('/')[4];
        const refresh = url.searchParams.get('refresh') === '1';
        const analytics = await fetchDiamondProAnalytics(gameId, env, refresh);
        return jsonResponse(analytics, corsHeaders);
      }

      if (path === '/api/billing/entitlements') {
        const userId =
          request.headers.get('x-user-id') ||
          url.searchParams.get('userId') ||
          'anonymous';
        const entitlements = await fetchStripeEntitlements(userId, env);
        return jsonResponse(entitlements, corsHeaders);
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

  const boxScore = await enrichBoxScoreWithAdvanced(mockBoxScore, env, gameId);

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

async function enrichBoxScoreWithAdvanced(boxScore, env, gameId) {
  const clone = typeof structuredClone === 'function'
    ? structuredClone(boxScore)
    : JSON.parse(JSON.stringify(boxScore));

  if (!clone.advanced) {
    return clone;
  }

  if (Array.isArray(clone.advanced.media)) {
    const signedMedia = [];
    for (const mediaItem of clone.advanced.media) {
      const signedUrl = await signMediaUrl(mediaItem.assetUrl, env);
      signedMedia.push({
        ...mediaItem,
        signedUrl,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
      });
    }
    clone.advanced.media = signedMedia;
  }

  clone.advanced.generatedAt = new Date().toISOString();

  try {
    clone.diamondInsights = await fetchDiamondProAnalytics(gameId || clone?.metadata?.id || 'unknown', env);
  } catch (error) {
    console.warn('Diamond Pro analytics unavailable', error);
  }

  return clone;
}

async function fetchDiamondProAnalytics(gameId, env, refresh = false) {
  const apiBase = (env?.ANALYTICS_API_BASE || 'http://localhost:8000').replace(/\/$/, '');
  const url = new URL(`${apiBase}/analytics/baseball/games/${gameId}`);
  if (refresh || env?.ANALYTICS_FORCE_REFRESH === 'true') {
    url.searchParams.set('refresh', '1');
  }
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Diamond Pro analytics fetch failed with status ${response.status}`);
  }
  return response.json();
}

async function signMediaUrl(url, env, ttlSeconds = 300) {
  if (!url) return url;

  const secret = env.MEDIA_SIGNING_SECRET || 'dev-diamond-insights-secret';
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${url}:${expires}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}expires=${expires}&sig=${signature}`;
}

async function fetchStripeEntitlements(userId, env) {
  const cacheKey = `entitlements-${userId}`;
  const cached = await env.KV?.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  const proUsers = (env.STRIPE_PRO_USERS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const isPro = proUsers.includes(userId);
  const entitlement = {
    userId,
    isPro,
    plan: isPro ? 'diamond_pro' : 'free',
    features: isPro
      ? ['advanced_box_score', 'video_highlights', 'diamond_pro_insights']
      : [],
    refreshedAt: new Date().toISOString(),
    ttlSeconds: 60,
  };

  await env.KV?.put(cacheKey, JSON.stringify(entitlement), {
    expirationTtl: entitlement.ttlSeconds,
  });

  return entitlement;
}
