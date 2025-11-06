// Cloudflare Worker - Backend API for College Baseball Tracker
// ✅ PHASE 16: Removed mockData import - all functions now use real/minimal data structures

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

// Fetch live games from NCAA via /api/live/ncaa/games
async function fetchLiveGames(env) {
  // ✅ PHASE 16: Real API integration - replaced mockData

  // Try cache first (30 seconds TTL)
  const cached = await env.KV?.get('live-games', 'json');
  if (cached) return cached;

  try {
    // Call our new /api/live/ncaa/games endpoint
    const response = await fetch('https://blazesportsintel.com/api/live/ncaa/games');

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.games)) {
      const games = data.games;

      // Cache for 30 seconds
      await env.KV?.put('live-games', JSON.stringify(games), {
        expirationTtl: 30,
      });

      return games;
    }

    // If no games or unsuccessful, return empty array
    return [];

  } catch (error) {
    console.error('[fetchLiveGames] Error:', error);

    // Return empty array on error (graceful degradation)
    return [];
  }
}

// Fetch detailed box score for a game
async function fetchBoxScore(gameId, env) {
  // ✅ PHASE 16: Removed mockData dependency
  // TODO: Implement full NCAA box score scraping from NCAA.com game pages

  const cached = await env.KV?.get(`boxscore-${gameId}`, 'json');
  if (cached) return cached;

  // Minimal box score structure (to be enhanced with real data)
  const boxScore = {
    gameId,
    status: 'unavailable',
    lineScore: {
      innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      away: { innings: [], runs: 0, hits: 0, errors: 0 },
      home: { innings: [], runs: 0, hits: 0, errors: 0 },
    },
    batting: { away: [], home: [] },
    pitching: { away: [], home: [] },
    meta: {
      dataSource: 'NCAA.com (pending implementation)',
      note: 'Box score data will be available during baseball season',
    },
  };

  await env.KV?.put(`boxscore-${gameId}`, JSON.stringify(boxScore), {
    expirationTtl: 300, // 5 min cache for unavailable data
  });

  return boxScore;
}

// Fetch conference standings
async function fetchStandings(conference, env) {
  // ✅ PHASE 16: Removed mockData dependency
  // TODO: Implement full NCAA standings aggregation from conference websites

  const cached = await env.KV?.get(`standings-${conference}`, 'json');
  if (cached) return cached;

  // Minimal standings structure (to be enhanced with real data)
  const standings = {
    conference: conference || 'all',
    season: new Date().getFullYear(),
    status: 'unavailable',
    teams: [],
    meta: {
      dataSource: 'Conference websites (pending implementation)',
      note: 'Standings data will be available during baseball season',
    },
  };

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
