/**
 * BSI Home Worker - Serves BlazeSportsIntel.com with PWA support
 * Cloudflare Worker for blazesportsintel.com
 *
 * Sports Data APIs:
 * - SportsDataIO: MLB, NFL, NBA (primary)
 * - ESPN: MLB, NFL, NBA (free fallback when quota exceeded)
 * - SportsRadar: Advanced stats
 * - College Football Data: NCAA Football
 * - TheOddsAPI: Betting odds
 *
 * Module Structure (src/workers/api/):
 * - constants.js       : API URLs, Stripe prices, CORS headers
 * - index.js           : Barrel export for all modules
 * - handlers/sports.js : MLB, NFL, NBA, CFB, Odds handlers
 * - utils/helpers.js   : Date, fetch, and response utilities
 *
 * Migration: Functions are being extracted to modules for better
 * maintainability. Import from './src/workers/api/index.js' when ready.
 *
 * @version 2.2.0
 * @updated 2025-01-08
 */

// API base URLs
const SPORTSDATAIO_BASE = 'https://api.sportsdata.io/v3';
const COLLEGEFOOTBALL_BASE = 'https://api.collegefootballdata.com';
const SPORTSRADAR_BASE = 'https://api.sportradar.com';
const THEODDS_BASE = 'https://api.the-odds-api.com/v4';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

// ESPN API (free fallback - no API key required)
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

/**
 * Fetch with exponential backoff retry
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Return on success or client error (4xx) - don't retry those
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      // Server error (5xx) - will retry
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    // Exponential backoff: 1s, 2s, 4s...
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// Stripe Price IDs
const STRIPE_PRICES = {
  pro: 'price_1SX9voLvpRBk20R2pW0AjUIv',         // $29/mo
  enterprise: 'price_1SX9w7LvpRBk20R2DJkKAH3y'   // $199/mo
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // === AUTH ROUTES ===
    if (path === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env, corsHeaders);
    }
    if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env, corsHeaders);
    }
    if (path === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request, env, corsHeaders);
    }
    if (path === '/api/auth/me') {
      return handleGetUser(request, env, corsHeaders);
    }

    // === STRIPE ROUTES ===
    if (path === '/api/stripe/create-checkout-session' && request.method === 'POST') {
      return handleCreateCheckoutSession(request, env, corsHeaders);
    }
    if (path === '/api/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env, corsHeaders);
    }
    if (path === '/api/stripe/portal' && request.method === 'POST') {
      return handleCustomerPortal(request, env, corsHeaders);
    }

    // === ANALYTICS ROUTES ===
    if (path === '/api/analytics/event' && request.method === 'POST') {
      return handleAnalyticsEvent(request, env, corsHeaders);
    }

    // === AUTH PAGES ===
    if (path === '/login' || path === '/login.html') {
      return serveAsset(env, 'origin/login.html', 'text/html', corsHeaders);
    }
    if (path === '/signup' || path === '/signup.html') {
      return serveAsset(env, 'origin/signup.html', 'text/html', corsHeaders);
    }
    if (path === '/dashboard' || path === '/dashboard.html') {
      return serveAsset(env, 'origin/dashboard.html', 'text/html', corsHeaders);
    }

    // === STATIC PAGES ===
    if (path === '/about' || path === '/about.html') {
      return serveAsset(env, 'origin/about.html', 'text/html', corsHeaders);
    }
    if (path === '/scores' || path === '/scores.html') {
      return serveAsset(env, 'origin/scores.html', 'text/html', corsHeaders);
    }

    // API Documentation
    if (path === '/api-docs' || path === '/api-docs/') {
      return serveAsset(env, 'origin/api-docs.html', 'text/html', corsHeaders);
    }

    // Serve PWA manifest
    if (path === '/manifest.json') {
      const manifest = await env.ASSETS.get('origin/manifest.json');

      if (!manifest) {
        return new Response('Manifest not found', { status: 404 });
      }

      const headers = new Headers({
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders,
      });

      return new Response(manifest.body, { headers });
    }

    // Serve sitemap
    if (path === '/sitemap.xml') {
      const sitemap = await env.ASSETS.get('origin/sitemap.xml');
      if (!sitemap) {
        return new Response('Sitemap not found', { status: 404 });
      }
      return new Response(sitemap.body, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders,
        },
      });
    }

    // Serve robots.txt
    if (path === '/robots.txt') {
      const robots = `User-agent: *
Allow: /
Sitemap: https://blazesportsintel.com/sitemap.xml`;
      return new Response(robots, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders,
        },
      });
    }

    // Serve service worker
    if (path === '/sw.js') {
      const sw = await env.ASSETS.get('origin/sw.js');

      if (!sw) {
        return new Response('Service worker not found', { status: 404 });
      }

      const headers = new Headers({
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Service-Worker-Allowed': '/',
        ...corsHeaders,
      });

      return new Response(sw.body, { headers });
    }

    // Serve images from R2
    if (path.startsWith('/images/')) {
      const key = `origin${path}`;
      const object = await env.ASSETS.get(key);

      if (!object) {
        return new Response('Image not found', { status: 404 });
      }

      // Determine content type
      const ext = path.split('.').pop()?.toLowerCase();
      const contentTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      };

      const headers = new Headers({
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders,
      });

      return new Response(object.body, { headers });
    }

    // Serve home page for root and index.html
    if (path === '/' || path === '/index.html') {
      const html = await env.ASSETS.get('origin/index.html');

      if (!html) {
        return new Response('Page not found', { status: 404 });
      }

      const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders,
      });

      return new Response(html.body, { headers });
    }

    // Serve analytics page
    if (path === '/analytics' || path === '/analytics.html') {
      const html = await env.ASSETS.get('origin/analytics.html');

      if (!html) {
        return new Response('Analytics page not found', { status: 404 });
      }

      const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        ...corsHeaders,
      });

      return new Response(html.body, { headers });
    }

    // === SPORT-SPECIFIC SCORES PAGES ===
    if (path === '/scores/mlb' || path === '/scores/mlb/') {
      return serveAsset(env, 'origin/scores-mlb.html', 'text/html', corsHeaders);
    }
    if (path === '/scores/nfl' || path === '/scores/nfl/') {
      return serveAsset(env, 'origin/scores-nfl.html', 'text/html', corsHeaders);
    }
    if (path === '/scores/nba' || path === '/scores/nba/') {
      return serveAsset(env, 'origin/scores-nba.html', 'text/html', corsHeaders);
    }

    // === INTERACTIVE TOOLS ===
    // Tools landing page
    if (path === '/tools' || path === '/tools/') {
      return serveAsset(env, 'origin/tools.html', 'text/html', corsHeaders);
    }
    // Team Archetype Builder
    if (path === '/tools/team-archetype-builder' || path === '/tools/team-archetype-builder/') {
      return serveToolAsset(env, 'origin/tools/team-archetype-builder/index.html', 'text/html', corsHeaders, request);
    }
    // Composition Optimizer (Monte Carlo)
    if (path === '/tools/composition-optimizer' || path === '/tools/composition-optimizer/') {
      return serveToolAsset(env, 'origin/tools/composition-optimizer/index.html', 'text/html', corsHeaders, request);
    }
    // 3D Visualization Showcase
    if (path === '/tools/3d-showcase' || path === '/tools/3d-showcase/') {
      return serveToolAsset(env, 'origin/tools/3d-showcase/index.html', 'text/html', corsHeaders, request);
    }
    // Win Probability Calculator
    if (path === '/tools/win-probability' || path === '/tools/win-probability/') {
      return serveAsset(env, 'origin/tools/win-probability.html', 'text/html', corsHeaders);
    }
    // Player Comparison
    if (path === '/tools/player-comparison' || path === '/tools/player-comparison/') {
      return serveAsset(env, 'origin/tools/player-comparison.html', 'text/html', corsHeaders);
    }
    // Draft Pick Value Calculator
    if (path === '/tools/draft-value' || path === '/tools/draft-value/') {
      return serveAsset(env, 'origin/tools/draft-value.html', 'text/html', corsHeaders);
    }
    // Schedule Strength Analyzer
    if (path === '/tools/schedule-strength' || path === '/tools/schedule-strength/') {
      return serveAsset(env, 'origin/tools/schedule-strength.html', 'text/html', corsHeaders);
    }
    // Serve tool assets (JS, CSS)
    if (path.startsWith('/tools/')) {
      return serveToolStaticAsset(env, path, corsHeaders);
    }

    // === SPORTS DATA API ROUTES ===

    // NIL Valuations API
    if (path === '/api/nil/valuations') {
      return handleNILRequest(env, corsHeaders);
    }

    // NCAA Football Scores
    if (path === '/api/ncaa/football-scores') {
      return handleNCAAFootballScores(env, corsHeaders);
    }

    // MLB Data (SportsDataIO)
    if (path.startsWith('/api/mlb/')) {
      return handleMLBRequest(path, url, env, corsHeaders);
    }

    // NFL Data (SportsDataIO)
    if (path.startsWith('/api/nfl/')) {
      return handleNFLRequest(path, url, env, corsHeaders);
    }

    // NBA Data (SportsDataIO)
    if (path.startsWith('/api/nba/')) {
      return handleNBARequest(path, url, env, corsHeaders);
    }

    // College Football Data
    if (path.startsWith('/api/cfb/')) {
      return handleCFBRequest(path, url, env, corsHeaders);
    }

    // Betting Odds (TheOddsAPI)
    if (path.startsWith('/api/odds/')) {
      return handleOddsRequest(path, url, env, corsHeaders);
    }

    // API health check
    if (path === '/api/health') {
      // Check tool assets exist
      const toolsHealth = {
        tab: !!(await env.ASSETS.get('origin/tools/team-archetype-builder/index.html')),
        optimizer: !!(await env.ASSETS.get('origin/tools/composition-optimizer/index.html')),
        winProbability: !!(await env.ASSETS.get('origin/tools/win-probability.html')),
        playerComparison: !!(await env.ASSETS.get('origin/tools/player-comparison.html')),
        draftValue: !!(await env.ASSETS.get('origin/tools/draft-value.html')),
        scheduleStrength: !!(await env.ASSETS.get('origin/tools/schedule-strength.html')),
        sitemap: !!(await env.ASSETS.get('origin/sitemap.xml')),
      };

      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
        version: '2.1.0',
        apis: ['mlb', 'nfl', 'nba', 'cfb', 'odds', 'analytics'],
        fallback: {
          espn: true,
          sports: ['mlb', 'nfl', 'nba'],
          note: 'ESPN used automatically when SportsDataIO quota exceeded'
        },
        tools: toolsHealth,
        keysConfigured: {
          sportsdataio: !!env.SPORTSDATAIO_API_KEY,
          cfb: !!env.COLLEGEFOOTBALLDATA_API_KEY,
          odds: !!env.THEODDSAPI_KEY,
          sportsradar: !!env.SPORTSRADAR_MASTER_API_KEY,
          stripe: !!env.STRIPE_SECRET_KEY,
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // === COLLEGE BASEBALL ROUTES ===
    if (path === '/college-baseball' || path === '/college-baseball/') {
      return serveAsset(env, 'origin/college-baseball/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/college-baseball/')) {
      const subPath = path.replace('/college-baseball/', '');
      // Try exact file match first
      let assetPath = `origin/college-baseball/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        // Try as directory index
        assetPath = `origin/college-baseball/${subPath}/index.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        const contentType = assetPath.endsWith('.js') ? 'application/javascript' :
                           assetPath.endsWith('.css') ? 'text/css' : 'text/html';
        return new Response(asset.body, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === MLB ROUTES ===
    if (path === '/mlb' || path === '/mlb/') {
      return serveAsset(env, 'origin/mlb/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/mlb/') && !path.startsWith('/mlb/api')) {
      const subPath = path.replace('/mlb/', '');
      let assetPath = `origin/mlb/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/mlb/${subPath}/index.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        return new Response(asset.body, {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === NFL ROUTES ===
    if (path === '/nfl' || path === '/nfl/') {
      return serveAsset(env, 'origin/nfl/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/nfl/') && !path.startsWith('/nfl/api')) {
      const subPath = path.replace('/nfl/', '');
      let assetPath = `origin/nfl/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/nfl/${subPath}/index.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        return new Response(asset.body, {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === NBA ROUTES ===
    if (path === '/nba' || path === '/nba/') {
      return serveAsset(env, 'origin/nba/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/nba/') && !path.startsWith('/nba/api')) {
      const subPath = path.replace('/nba/', '');
      let assetPath = `origin/nba/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/nba/${subPath}/index.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        return new Response(asset.body, {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // 404 for other paths (or forward to existing app)
    return new Response('Not found', { status: 404 });
  },
};

// === API HANDLER FUNCTIONS ===

async function handleMLBRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/mlb/', '');
  const apiKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch today's games
  if (endpoint === 'scores') {
    const today = getTodayDate();
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/GamesByDate/${today}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      // Fallback to ESPN on 403 (quota exceeded) or other errors
      if (response.status === 403 || !response.ok) {
        console.log(`SportsDataIO MLB returned ${response.status}, falling back to ESPN`);
        return fetchESPNMLBScores(corsHeaders);
      }

      const rawData = await response.json();

      // Handle API errors (SportsDataIO returns object with Message on error)
      if (!Array.isArray(rawData)) {
        // Check for quota error and fallback
        if ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403) {
          console.log('SportsDataIO MLB quota exceeded, falling back to ESPN');
          return fetchESPNMLBScores(corsHeaders);
        }
        return new Response(JSON.stringify({
          error: rawData.Message || rawData.message || 'Invalid API response',
          games: [],
          apiResponse: rawData,
          source: 'SportsDataIO',
          fetchedAt: getChicagoTimestamp()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Transform to standardized format
      const games = rawData.map(game => ({
        id: game.GameID,
        status: {
          state: game.Status,
          isLive: game.Status === 'InProgress',
          inning: game.Inning,
          inningState: game.InningHalf,
          detailedState: game.Status === 'Final' ? 'Final' : `${game.InningHalf || ''} ${game.Inning || ''}`.trim()
        },
        teams: {
          away: {
            name: game.AwayTeam,
            abbreviation: game.AwayTeam,
            score: game.AwayTeamRuns || 0
          },
          home: {
            name: game.HomeTeam,
            abbreviation: game.HomeTeam,
            score: game.HomeTeamRuns || 0
          }
        },
        dateTime: game.DateTime
      }));

      return new Response(JSON.stringify({ games, source: 'SportsDataIO', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    } catch (error) {
      // On any error, try ESPN fallback
      console.log(`SportsDataIO MLB error: ${error.message}, falling back to ESPN`);
      return fetchESPNMLBScores(corsHeaders);
    }
  }

  const routes = {
    'standings': '/mlb/scores/json/Standings/2025',
    'teams': '/mlb/scores/json/Teams',
    'schedule': '/mlb/scores/json/Games/2025',
    'cardinals': '/mlb/scores/json/TeamSeasonStats/2025?team=STL',
    'scores/today': '/mlb/scores/json/GamesByDate/' + getTodayDate(),
    'players/cardinals': '/mlb/scores/json/Players/STL',
  };

  const apiPath = routes[endpoint] || `/mlb/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, apiKey, corsHeaders, 300);
}

async function handleNFLRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/nfl/', '');
  const apiKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch current week games
  if (endpoint === 'scores') {
    // Get current NFL week (2024 season is in progress, 2025 will start in September)
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/scores/json/ScoresByWeek/2024/REG/13`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      // Fallback to ESPN on 403 (quota exceeded) or other errors
      if (response.status === 403 || !response.ok) {
        console.log(`SportsDataIO NFL returned ${response.status}, falling back to ESPN`);
        return fetchESPNNFLScores(corsHeaders);
      }

      const rawData = await response.json();

      // Check for quota error in response body
      if (!Array.isArray(rawData) && ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403)) {
        console.log('SportsDataIO NFL quota exceeded, falling back to ESPN');
        return fetchESPNNFLScores(corsHeaders);
      }

      return new Response(JSON.stringify({ rawData, source: 'SportsDataIO', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    } catch (error) {
      // On any error, try ESPN fallback
      console.log(`SportsDataIO NFL error: ${error.message}, falling back to ESPN`);
      return fetchESPNNFLScores(corsHeaders);
    }
  }

  const routes = {
    'standings': '/nfl/scores/json/Standings/2024',
    'teams': '/nfl/scores/json/Teams',
    'schedule': '/nfl/scores/json/Schedules/2024',
    'titans': '/nfl/scores/json/TeamSeasonStats/2024/TEN',
    'scores/current': '/nfl/scores/json/ScoresByWeek/2024/REG/13',
    'players/titans': '/nfl/scores/json/Players/TEN',
  };

  const apiPath = routes[endpoint] || `/nfl/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, apiKey, corsHeaders, 300);
}

async function handleNBARequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/nba/', '');
  const apiKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch today's games
  if (endpoint === 'scores') {
    const today = getTodayDate();
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/scores/json/GamesByDate/${today}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      // Fallback to ESPN on 403 (quota exceeded) or other errors
      if (response.status === 403 || !response.ok) {
        console.log(`SportsDataIO NBA returned ${response.status}, falling back to ESPN`);
        return fetchESPNNBAScores(corsHeaders);
      }

      const rawData = await response.json();

      // Handle API errors (SportsDataIO returns object with Message on error)
      if (!Array.isArray(rawData)) {
        // Check for quota error and fallback
        if ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403) {
          console.log('SportsDataIO NBA quota exceeded, falling back to ESPN');
          return fetchESPNNBAScores(corsHeaders);
        }
        return new Response(JSON.stringify({
          error: rawData.Message || rawData.message || 'Invalid API response',
          games: [],
          apiResponse: rawData,
          source: 'SportsDataIO',
          fetchedAt: getChicagoTimestamp()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Transform to standardized format
      const games = rawData.map(game => ({
        id: game.GameID,
        Status: game.Status,
        AwayTeam: game.AwayTeam,
        HomeTeam: game.HomeTeam,
        AwayTeamScore: game.AwayTeamScore || 0,
        HomeTeamScore: game.HomeTeamScore || 0,
        Quarter: game.Quarter,
        TimeRemaining: game.TimeRemainingMinutes ? `${game.TimeRemainingMinutes}:${String(game.TimeRemainingSeconds || 0).padStart(2, '0')}` : '',
        DateTime: game.DateTime
      }));

      return new Response(JSON.stringify({ games, source: 'SportsDataIO', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    } catch (error) {
      // On any error, try ESPN fallback
      console.log(`SportsDataIO NBA error: ${error.message}, falling back to ESPN`);
      return fetchESPNNBAScores(corsHeaders);
    }
  }

  const routes = {
    'standings': '/nba/scores/json/Standings/2025',
    'teams': '/nba/scores/json/Teams',
    'schedule': '/nba/scores/json/Games/2025',
    'grizzlies': '/nba/scores/json/TeamSeasonStats/2025/MEM',
    'scores/today': '/nba/scores/json/GamesByDate/' + getTodayDate(),
    'players/grizzlies': '/nba/scores/json/Players/MEM',
  };

  const apiPath = routes[endpoint] || `/nba/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, apiKey, corsHeaders, 300);
}

async function handleCFBRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/cfb/', '');
  const apiKey = env.COLLEGEFOOTBALLDATA_API_KEY;

  const routes = {
    'rankings': '/rankings?year=2025&seasonType=regular',
    'teams': '/teams',
    'texas': '/teams?conference=Big%2012',
    'games': '/games?year=2025&seasonType=regular',
    'games/texas': '/games?year=2025&team=Texas',
    'stats/texas': '/stats/season?year=2025&team=Texas',
    'records': '/records?year=2025',
  };

  const apiPath = routes[endpoint] || `/${endpoint}`;
  return fetchCFBData(`${COLLEGEFOOTBALL_BASE}${apiPath}`, apiKey, corsHeaders, 600);
}

async function handleOddsRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/odds/', '');
  const apiKey = env.THEODDSAPI_KEY;

  const routes = {
    'mlb': '/sports/baseball_mlb/odds',
    'nfl': '/sports/americanfootball_nfl/odds',
    'nba': '/sports/basketball_nba/odds',
    'ncaaf': '/sports/americanfootball_ncaaf/odds',
    'sports': '/sports',
  };

  const sport = routes[endpoint] || `/sports/${endpoint}/odds`;
  const oddsUrl = `${THEODDS_BASE}${sport}?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`;

  try {
    const response = await fetch(oddsUrl);
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
        'X-Data-Source': 'TheOddsAPI',
        'X-Fetched-At': new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        ...corsHeaders,
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// === UTILITY FUNCTIONS ===

async function fetchSportsData(url, apiKey, corsHeaders, cacheTTL = 300) {
  try {
    // SportsDataIO uses Ocp-Apim-Subscription-Key header
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}key=${apiKey}`;

    const response = await fetch(fullUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({
        error: `SportsDataIO API error: ${response.status}`,
        details: errorText,
        url: url.split('?')[0]
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
        'X-Data-Source': 'SportsDataIO',
        'X-Fetched-At': new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        ...corsHeaders,
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function fetchCFBData(url, apiKey, corsHeaders, cacheTTL = 600) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    });
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
        'X-Data-Source': 'CollegeFootballData',
        'X-Fetched-At': new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        ...corsHeaders,
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// === ESPN API FALLBACK FUNCTIONS ===

/**
 * Fetch MLB scores from ESPN (fallback when SportsDataIO quota exceeded)
 * ESPN endpoint: /baseball/mlb/scoreboard
 */
async function fetchESPNMLBScores(corsHeaders) {
  try {
    const response = await fetchWithRetry(`${ESPN_BASE}/baseball/mlb/scoreboard`);
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }
    const data = await response.json();
    const games = transformESPNMLBGames(data);

    return new Response(JSON.stringify({
      games,
      source: 'ESPN',
      fallback: true,
      fetchedAt: getChicagoTimestamp()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'X-Data-Source': 'ESPN (fallback)',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      games: [],
      source: 'ESPN',
      fallback: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Transform ESPN MLB response to match our standardized format
 */
function transformESPNMLBGames(espnData) {
  if (!espnData?.events) return [];

  return espnData.events.map(event => {
    const competition = event.competitions?.[0];
    const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
    const situation = competition?.situation;

    return {
      id: event.id,
      status: {
        state: event.status?.type?.name || 'Unknown',
        isLive: event.status?.type?.state === 'in',
        inning: situation?.inning || null,
        inningState: situation?.inningHalf === 1 ? 'Top' : situation?.inningHalf === 2 ? 'Bottom' : null,
        detailedState: event.status?.type?.detail || event.status?.type?.shortDetail || ''
      },
      teams: {
        away: {
          name: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Away',
          abbreviation: awayTeam?.team?.abbreviation || 'AWY',
          score: parseInt(awayTeam?.score || 0)
        },
        home: {
          name: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Home',
          abbreviation: homeTeam?.team?.abbreviation || 'HME',
          score: parseInt(homeTeam?.score || 0)
        }
      },
      dateTime: event.date
    };
  });
}

/**
 * Fetch NFL scores from ESPN (fallback when SportsDataIO quota exceeded)
 * ESPN endpoint: /football/nfl/scoreboard
 */
async function fetchESPNNFLScores(corsHeaders) {
  try {
    const response = await fetchWithRetry(`${ESPN_BASE}/football/nfl/scoreboard`);
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }
    const data = await response.json();
    const games = transformESPNNFLGames(data);

    return new Response(JSON.stringify({
      rawData: games,
      source: 'ESPN',
      fallback: true,
      fetchedAt: getChicagoTimestamp()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'X-Data-Source': 'ESPN (fallback)',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      rawData: [],
      source: 'ESPN',
      fallback: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Transform ESPN NFL response to match our format
 */
function transformESPNNFLGames(espnData) {
  if (!espnData?.events) return [];

  return espnData.events.map(event => {
    const competition = event.competitions?.[0];
    const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');

    return {
      GameID: event.id,
      Status: event.status?.type?.name || 'Unknown',
      AwayTeam: awayTeam?.team?.abbreviation || 'AWY',
      HomeTeam: homeTeam?.team?.abbreviation || 'HME',
      AwayScore: parseInt(awayTeam?.score || 0),
      HomeScore: parseInt(homeTeam?.score || 0),
      Quarter: event.status?.period || null,
      TimeRemaining: event.status?.displayClock || '',
      DateTime: event.date,
      AwayTeamName: awayTeam?.team?.displayName || '',
      HomeTeamName: homeTeam?.team?.displayName || ''
    };
  });
}

/**
 * Fetch NBA scores from ESPN (fallback when SportsDataIO quota exceeded)
 * ESPN endpoint: /basketball/nba/scoreboard
 */
async function fetchESPNNBAScores(corsHeaders) {
  try {
    const response = await fetchWithRetry(`${ESPN_BASE}/basketball/nba/scoreboard`);
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }
    const data = await response.json();
    const games = transformESPNNBAGames(data);

    return new Response(JSON.stringify({
      games,
      source: 'ESPN',
      fallback: true,
      fetchedAt: getChicagoTimestamp()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'X-Data-Source': 'ESPN (fallback)',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      games: [],
      source: 'ESPN',
      fallback: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Transform ESPN NBA response to match our format
 */
function transformESPNNBAGames(espnData) {
  if (!espnData?.events) return [];

  return espnData.events.map(event => {
    const competition = event.competitions?.[0];
    const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');

    return {
      id: event.id,
      Status: event.status?.type?.name || 'Unknown',
      AwayTeam: awayTeam?.team?.abbreviation || 'AWY',
      HomeTeam: homeTeam?.team?.abbreviation || 'HME',
      AwayTeamScore: parseInt(awayTeam?.score || 0),
      HomeTeamScore: parseInt(homeTeam?.score || 0),
      Quarter: event.status?.period || null,
      TimeRemaining: event.status?.displayClock || '',
      DateTime: event.date,
      AwayTeamName: awayTeam?.team?.displayName || '',
      HomeTeamName: homeTeam?.team?.displayName || ''
    };
  });
}

function getTodayDate() {
  const now = new Date();
  const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year = chicagoTime.getFullYear();
  const month = String(chicagoTime.getMonth() + 1).padStart(2, '0');
  const day = String(chicagoTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthAbbrev() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return months[chicagoTime.getMonth()];
}

function getChicagoTimestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
}

// NIL Valuations Handler
async function handleNILRequest(env, corsHeaders) {
  // Real NIL data from On3 rankings (updated November 2024)
  const nilData = {
    programs: [
      { rank: 1, school: 'Texas', conference: 'SEC', totalRosterValue: 22000000, yearOverYearChange: 2100000 },
      { rank: 2, school: 'Alabama', conference: 'SEC', totalRosterValue: 18400000, yearOverYearChange: 2400000 },
      { rank: 3, school: 'Ohio State', conference: 'Big Ten', totalRosterValue: 18300000, yearOverYearChange: 4700000 },
      { rank: 4, school: 'Georgia', conference: 'SEC', totalRosterValue: 17800000, yearOverYearChange: 1900000 },
      { rank: 5, school: 'Tennessee', conference: 'SEC', totalRosterValue: 15200000, yearOverYearChange: 3100000 },
      { rank: 6, school: 'Oregon', conference: 'Big Ten', totalRosterValue: 14900000, yearOverYearChange: 2800000 },
      { rank: 7, school: 'LSU', conference: 'SEC', totalRosterValue: 14100000, yearOverYearChange: 1500000 },
      { rank: 8, school: 'USC', conference: 'Big Ten', totalRosterValue: 13800000, yearOverYearChange: 2200000 },
      { rank: 9, school: 'Miami', conference: 'ACC', totalRosterValue: 13500000, yearOverYearChange: 4100000 },
      { rank: 10, school: 'Michigan', conference: 'Big Ten', totalRosterValue: 12900000, yearOverYearChange: 1200000 },
    ],
    lastUpdated: getChicagoTimestamp(),
    source: 'On3 NIL Valuations'
  };

  return new Response(JSON.stringify(nilData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders
    }
  });
}

// NCAA Football Scores Handler
async function handleNCAAFootballScores(env, corsHeaders) {
  const apiKey = env.COLLEGEFOOTBALLDATA_API_KEY;

  try {
    // Fetch current week's games from College Football Data API
    const response = await fetch(`${COLLEGEFOOTBALL_BASE}/games?year=2024&week=14&seasonType=regular`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const rawData = await response.json();

    // Handle API errors (returns object with error message on failure)
    if (!Array.isArray(rawData)) {
      return new Response(JSON.stringify({
        error: rawData.error || rawData.message || 'Invalid API response',
        games: [],
        source: 'CollegeFootballData',
        fetchedAt: getChicagoTimestamp()
      }), {
        status: response.ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Transform to standardized format
    const games = rawData.slice(0, 10).map(game => ({
      id: game.id,
      status: game.completed ? 'Final' : (game.start_time_tbd ? 'TBD' : 'Scheduled'),
      awayTeam: game.away_team,
      homeTeam: game.home_team,
      awayScore: game.away_points || 0,
      homeScore: game.home_points || 0,
      statusDetail: game.completed ? 'Final' : formatGameDate(game.start_date),
      venue: game.venue,
      conference: game.conference_game ? 'Conference' : 'Non-Conference'
    }));

    return new Response(JSON.stringify({ games, rawData: rawData.slice(0, 10), source: 'CollegeFootballData', fetchedAt: getChicagoTimestamp() }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, games: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function formatGameDate(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' CT';
}

// === AUTH HANDLER FUNCTIONS ===

async function handleRegister(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
    }

    // Check if user exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
      return jsonResponse({ error: 'Email already registered' }, 409, corsHeaders);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
    ).bind(userId, email.toLowerCase(), passwordHash).run();

    // Create session
    const sessionToken = await createSession(env, userId);

    return jsonResponse(
      { success: true, user: { id: userId, email: email.toLowerCase() } },
      201,
      corsHeaders,
      sessionToken
    );
  } catch (error) {
    console.error('Register error:', error);
    return jsonResponse({ error: 'Registration failed' }, 500, corsHeaders);
  }
}

async function handleLogin(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
    }

    // Find user
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, subscription_status, subscription_tier FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Create session
    const sessionToken = await createSession(env, user.id);

    return jsonResponse(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscription_status,
          subscriptionTier: user.subscription_tier
        }
      },
      200,
      corsHeaders,
      sessionToken
    );
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: 'Login failed' }, 500, corsHeaders);
  }
}

async function handleLogout(request, env, corsHeaders) {
  try {
    const sessionToken = getSessionToken(request);
    if (sessionToken) {
      await env.SESSIONS.delete(sessionToken);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'bsi_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        ...corsHeaders
      }
    });
  } catch (error) {
    return jsonResponse({ error: 'Logout failed' }, 500, corsHeaders);
  }
}

async function handleGetUser(request, env, corsHeaders) {
  try {
    const session = await getSession(request, env);
    if (!session) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const user = await env.DB.prepare(
      'SELECT id, email, subscription_status, subscription_tier, subscription_end_date FROM users WHERE id = ?'
    ).bind(session.userId).first();

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404, corsHeaders);
    }

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status,
        subscriptionTier: user.subscription_tier,
        subscriptionEndDate: user.subscription_end_date
      }
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: 'Failed to get user' }, 500, corsHeaders);
  }
}

// === STRIPE HANDLER FUNCTIONS ===

async function handleCreateCheckoutSession(request, env, corsHeaders) {
  try {
    const session = await getSession(request, env);
    if (!session) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { tier } = await request.json();
    if (!tier || !STRIPE_PRICES[tier]) {
      return jsonResponse({ error: 'Invalid subscription tier' }, 400, corsHeaders);
    }

    // Get user for email
    const user = await env.DB.prepare('SELECT email, stripe_customer_id FROM users WHERE id = ?')
      .bind(session.userId).first();

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customerResponse = await fetch(`${STRIPE_API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(user.email)}&metadata[user_id]=${session.userId}`,
      });
      const customer = await customerResponse.json();
      customerId = customer.id;

      // Save customer ID
      await env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
        .bind(customerId, session.userId).run();
    }

    // Create checkout session
    const params = new URLSearchParams({
      'customer': customerId,
      'mode': 'subscription',
      'line_items[0][price]': STRIPE_PRICES[tier],
      'line_items[0][quantity]': '1',
      'success_url': 'https://blazesportsintel.com/dashboard?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url': 'https://blazesportsintel.com/pricing',
      'metadata[user_id]': session.userId,
      'metadata[tier]': tier,
    });

    const checkoutResponse = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const checkoutSession = await checkoutResponse.json();

    if (checkoutSession.error) {
      return jsonResponse({ error: checkoutSession.error.message }, 400, corsHeaders);
    }

    return jsonResponse({ url: checkoutSession.url, sessionId: checkoutSession.id }, 200, corsHeaders);
  } catch (error) {
    console.error('Checkout error:', error);
    return jsonResponse({ error: 'Failed to create checkout session' }, 500, corsHeaders);
  }
}

async function handleStripeWebhook(request, env, corsHeaders) {
  try {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid Stripe webhook signature');
      return jsonResponse({ error: 'Invalid signature' }, 400, corsHeaders);
    }

    const event = JSON.parse(body);
    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier || 'pro';
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          // Get subscription details
          const subResponse = await fetch(`${STRIPE_API_BASE}/subscriptions/${subscriptionId}`, {
            headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
          });
          const subscription = await subResponse.json();

          // Update user
          await env.DB.prepare(`
            UPDATE users SET
              stripe_customer_id = ?,
              subscription_status = 'active',
              subscription_tier = ?,
              subscription_id = ?,
              subscription_end_date = datetime(?, 'unixepoch'),
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            customerId,
            tier,
            subscriptionId,
            subscription.current_period_end,
            userId
          ).run();

          // Insert subscription record
          await env.DB.prepare(`
            INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id, tier, status, current_period_start, current_period_end)
            VALUES (?, ?, ?, ?, ?, ?, 'active', datetime(?, 'unixepoch'), datetime(?, 'unixepoch'))
          `).bind(
            crypto.randomUUID(),
            userId,
            subscriptionId,
            customerId,
            STRIPE_PRICES[tier],
            tier,
            subscription.current_period_start,
            subscription.current_period_end
          ).run();

          console.log(`Subscription activated for user ${userId}: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by customer ID
        const user = await env.DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          const status = subscription.cancel_at_period_end ? 'canceling' : subscription.status;
          await env.DB.prepare(`
            UPDATE users SET
              subscription_status = ?,
              subscription_end_date = datetime(?, 'unixepoch'),
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(status, subscription.current_period_end, user.id).run();

          // Update subscription record
          await env.DB.prepare(`
            UPDATE subscriptions SET
              status = ?,
              current_period_end = datetime(?, 'unixepoch'),
              cancel_at_period_end = ?,
              updated_at = datetime('now')
            WHERE stripe_subscription_id = ?
          `).bind(status, subscription.current_period_end, subscription.cancel_at_period_end ? 1 : 0, subscription.id).run();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await env.DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          await env.DB.prepare(`
            UPDATE users SET
              subscription_status = 'canceled',
              subscription_tier = 'free',
              subscription_id = NULL,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(user.id).run();

          await env.DB.prepare(`
            UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now')
            WHERE stripe_subscription_id = ?
          `).bind(subscription.id).run();
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await env.DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          await env.DB.prepare(`
            UPDATE users SET subscription_status = 'past_due', updated_at = datetime('now') WHERE id = ?
          `).bind(user.id).run();
        }
        break;
      }
    }

    return jsonResponse({ received: true }, 200, corsHeaders);
  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ error: 'Webhook processing failed' }, 500, corsHeaders);
  }
}

async function handleCustomerPortal(request, env, corsHeaders) {
  try {
    const session = await getSession(request, env);
    if (!session) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const user = await env.DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
      .bind(session.userId).first();

    if (!user?.stripe_customer_id) {
      return jsonResponse({ error: 'No subscription found' }, 400, corsHeaders);
    }

    const portalResponse = await fetch(`${STRIPE_API_BASE}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `customer=${user.stripe_customer_id}&return_url=https://blazesportsintel.com/dashboard`,
    });

    const portal = await portalResponse.json();
    return jsonResponse({ url: portal.url }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: 'Failed to create portal session' }, 500, corsHeaders);
  }
}

// === AUTH UTILITY FUNCTIONS ===

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password, storedHash) {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const storedHashBytes = combined.slice(16);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArray = new Uint8Array(hash);

  if (hashArray.length !== storedHashBytes.length) return false;
  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== storedHashBytes[i]) return false;
  }
  return true;
}

async function createSession(env, userId) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  await env.SESSIONS.put(token, JSON.stringify({ userId, expiresAt }), {
    expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
  });

  return token;
}

function getSessionToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/bsi_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getSession(request, env) {
  const token = getSessionToken(request);
  if (!token) return null;

  const sessionData = await env.SESSIONS.get(token);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  if (session.expiresAt < Date.now()) {
    await env.SESSIONS.delete(token);
    return null;
  }

  return session;
}

async function verifyStripeSignature(payload, signature, secret) {
  if (!signature || !secret) return false;

  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const sig = parts['v1'];
  if (!timestamp || !sig) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );

  const signedPayload = `${timestamp}.${payload}`;
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return sig === expectedSig;
}

// === ASSET SERVING ===

async function serveAsset(env, key, contentType, corsHeaders) {
  const asset = await env.ASSETS.get(key);
  if (!asset) {
    return new Response('Page not found', { status: 404 });
  }
  return new Response(asset.body, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'public, max-age=300',
      ...corsHeaders
    }
  });
}

// Serve tool HTML with subscription check
async function serveToolAsset(env, key, contentType, corsHeaders, request) {
  const asset = await env.ASSETS.get(key);
  if (!asset) {
    return new Response('Tool not found', { status: 404 });
  }

  // Get user session for subscription check (tools may have tiered access)
  const session = await getSession(request, env);
  let subscriptionTier = 'free';

  if (session) {
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(session.userId).first();
    subscriptionTier = user?.subscription_tier || 'free';
  }

  // Inject subscription tier into HTML for client-side feature gating
  let html = await asset.text();
  html = html.replace(
    '</head>',
    `<script>window.BSI_USER_TIER = "${subscriptionTier}";</script></head>`
  );

  return new Response(html, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'no-cache',
      ...corsHeaders
    }
  });
}

// Serve tool static assets (JS, CSS, etc.)
async function serveToolStaticAsset(env, path, corsHeaders) {
  const key = `origin${path}`;
  const asset = await env.ASSETS.get(key);

  if (!asset) {
    return new Response('Asset not found', { status: 404 });
  }

  // Determine content type from extension
  const ext = path.split('.').pop()?.toLowerCase();
  const contentTypes = {
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';
  const cacheTime = ext === 'html' ? 300 : 31536000; // Long cache for static assets

  return new Response(asset.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${cacheTime}${cacheTime > 3600 ? ', immutable' : ''}`,
      ...corsHeaders
    }
  });
}

// === ANALYTICS HANDLER ===
async function handleAnalyticsEvent(request, env, corsHeaders) {
  // #region agent log
  const bindingsStatus = {hasAnalyticsKV:!!env.ANALYTICS_KV,hasAnalytics:!!env.ANALYTICS,analyticsKVType:typeof env.ANALYTICS_KV,analyticsType:typeof env.ANALYTICS};
  console.log('[DEBUG] handleAnalyticsEvent entry - bindings:', bindingsStatus);
  fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1252',message:'handleAnalyticsEvent entry',data:bindingsStatus,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // Validate required fields
    if (!event.event) {
      return jsonResponse({ error: 'Missing event name' }, 400, corsHeaders);
    }

    // Add server-side metadata
    const enrichedEvent = {
      ...event,
      serverTimestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.headers.get('CF-IPCountry'),
      ray: request.headers.get('CF-Ray'),
    };

    // Store in KV for batch processing (if KV is bound)
    // #region agent log
    console.log('[DEBUG] Before ANALYTICS_KV check:', {checkResult:!!env.ANALYTICS_KV,eventName:event.event});
    fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1275',message:'Before ANALYTICS_KV check',data:{checkResult:!!env.ANALYTICS_KV,eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (env.ANALYTICS_KV) {
      // #region agent log
      console.log('[DEBUG] ANALYTICS_KV write attempted:', {eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1281',message:'ANALYTICS_KV write attempted',data:{eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      const key = `event:${Date.now()}:${crypto.randomUUID()}`;
      await env.ANALYTICS_KV.put(key, JSON.stringify(enrichedEvent), {
        expirationTtl: 86400 * 7 // 7 days
      });
      // #region agent log
      console.log('[DEBUG] ANALYTICS_KV write completed:', {key,eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1288',message:'ANALYTICS_KV write completed',data:{key,eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } else {
      // #region agent log
      console.log('[DEBUG] ANALYTICS_KV skipped - binding not available:', {eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1292',message:'ANALYTICS_KV skipped - binding not available',data:{eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    }

    // Log to Cloudflare Analytics Engine (if bound)
    // #region agent log
    console.log('[DEBUG] Before ANALYTICS check:', {checkResult:!!env.ANALYTICS,eventName:event.event});
    fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1298',message:'Before ANALYTICS check',data:{checkResult:!!env.ANALYTICS,eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (env.ANALYTICS) {
      // #region agent log
      console.log('[DEBUG] ANALYTICS write attempted:', {eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1302',message:'ANALYTICS write attempted',data:{eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      env.ANALYTICS.writeDataPoint({
        blobs: [event.event, event.properties?.tool || 'unknown', enrichedEvent.country || 'unknown'],
        doubles: [1], // event count
        indexes: [event.event]
      });
      // #region agent log
      console.log('[DEBUG] ANALYTICS write completed:', {eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1310',message:'ANALYTICS write completed',data:{eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } else {
      // #region agent log
      console.log('[DEBUG] ANALYTICS skipped - binding not available:', {eventName:event.event});
      fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1314',message:'ANALYTICS skipped - binding not available',data:{eventName:event.event},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    }

    // Always return success (analytics should never block)
    // #region agent log
    const finalStatus = {eventName:event.event,kvSkipped:!env.ANALYTICS_KV,analyticsSkipped:!env.ANALYTICS};
    console.log('[DEBUG] handleAnalyticsEvent returning success:', finalStatus);
    fetch('http://127.0.0.1:7242/ingest/c7de4ae1-6da5-40ba-af46-1bd4e8490c58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker.js:1320',message:'handleAnalyticsEvent returning success',data:finalStatus,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    // Fail silently for analytics - return success anyway
    console.error('Analytics error:', e);
    return jsonResponse({ success: true }, 200, corsHeaders);
  }
}

function jsonResponse(data, status, corsHeaders, sessionToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders
  };

  if (sessionToken) {
    headers['Set-Cookie'] = `bsi_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
  }

  return new Response(JSON.stringify(data), { status, headers });
}
