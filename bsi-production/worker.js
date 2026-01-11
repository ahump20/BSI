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
 * @version 2.4.0
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

// Highlightly API (PRIMARY source - Pro subscription)
const HIGHLIGHTLY_MLB_BASE = 'https://baseball.highlightly.net';
const HIGHLIGHTLY_NFL_BASE = 'https://american-football.highlightly.net';
const HIGHLIGHTLY_NBA_BASE = 'https://nba.highlightly.net';

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

    // Tool Launch Analytics (dedicated endpoint for Pro/Free tool tracking)
    if (path === '/api/analytics/tool-launch' && request.method === 'POST') {
      return handleToolLaunchAnalytics(request, env, corsHeaders);
    }

    // === EMAIL CAPTURE (paywall leads) ===
    if (path === '/api/leads/capture' && request.method === 'POST') {
      return handleLeadCapture(request, env, corsHeaders);
    }

    // === NEWSLETTER SUBSCRIPTION ===
    if (path === '/api/newsletter/subscribe' && request.method === 'POST') {
      return handleNewsletterSubscribe(request, env, corsHeaders);
    }

    // === PUSH NOTIFICATIONS ROUTES ===
    if (path === '/api/notifications/vapid-key' && request.method === 'GET') {
      return handleGetVapidKey(env, corsHeaders);
    }
    if (path === '/api/notifications/subscribe' && request.method === 'POST') {
      return handlePushSubscribe(request, env, corsHeaders);
    }
    if (path === '/api/notifications/unsubscribe' && request.method === 'POST') {
      return handlePushUnsubscribe(request, env, corsHeaders);
    }
    if (path === '/api/notifications/preferences' && request.method === 'POST') {
      return handlePushPreferences(request, env, corsHeaders);
    }
    if (path === '/api/notifications/preferences' && request.method === 'GET') {
      return handleGetPushPreferences(request, env, corsHeaders);
    }
    if (path === '/api/notifications/test' && request.method === 'POST') {
      return handleTestNotification(request, env, corsHeaders);
    }

    // === VISION COACH API ROUTES ===
    if (path === '/api/vision-coach/sessions' && request.method === 'GET') {
      return handleGetVisionCoachSessions(request, env, corsHeaders);
    }
    if (path === '/api/vision-coach/sessions' && request.method === 'POST') {
      return handleSaveVisionCoachSession(request, env, corsHeaders);
    }
    if (path === '/api/vision-coach/challenges' && request.method === 'GET') {
      return handleGetVisionCoachChallenges(request, env, corsHeaders);
    }
    if (path === '/api/vision-coach/challenges' && request.method === 'POST') {
      return handleSaveVisionCoachChallenges(request, env, corsHeaders);
    }
    if (path === '/api/vision-coach/stats' && request.method === 'GET') {
      return handleGetVisionCoachStats(request, env, corsHeaders);
    }

    // === SEARCH API ===
    if (path === '/api/search' && request.method === 'GET') {
      return handleSearch(request, env, corsHeaders);
    }

    // Search index admin endpoints (KV management)
    if (path === '/api/search/index' && request.method === 'POST') {
      return handleSearchIndexRefresh(request, env, corsHeaders);
    }
    if (path === '/api/search/index/add' && request.method === 'POST') {
      return handleSearchIndexAdd(request, env, corsHeaders);
    }

    // === FAVORITES SYNC API ===
    if (path === '/api/favorites/sync' && request.method === 'POST') {
      return handleFavoritesSync(request, env, corsHeaders);
    }
    if (path === '/api/favorites' && request.method === 'GET') {
      return handleGetFavorites(request, env, corsHeaders);
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
    if (path === '/pricing' || path === '/pricing.html') {
      return serveAsset(env, 'origin/pricing.html', 'text/html', corsHeaders);
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

    // Serve video assets from R2
    if (path.startsWith('/assets/video/')) {
      const videoPath = 'origin/video/' + path.replace('/assets/video/', '');
      const video = await env.ASSETS.get(videoPath);

      if (!video) {
        // Return 404 - the frontend will fall back to poster image
        return new Response('Video not found', { status: 404 });
      }

      const contentType = path.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      return new Response(video.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Accept-Ranges': 'bytes',
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

    // === PROMO PAGES ===
    // ESPN vs BSI campaign
    if (path === '/promo/espn-cant-find-it' || path === '/promo/espn-cant-find-it/') {
      return serveAsset(env, 'origin/promo/espn-cant-find-it.html', 'text/html', corsHeaders);
    }

    // === COMPONENT SCRIPTS ===
    // Score ticker component
    if (path === '/src/components/score-ticker.js') {
      return serveAsset(env, 'origin/src/components/score-ticker.js', 'application/javascript', corsHeaders);
    }

    // === SITE JAVASCRIPT ===
    // Analytics and tracking scripts
    if (path.startsWith('/src/js/')) {
      const key = `origin${path}`;
      const asset = await env.ASSETS.get(key);
      if (asset) {
        return new Response(asset.body, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=86400',
            ...corsHeaders
          }
        });
      }
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
    // Player Comparison (Pro)
    if (path === '/tools/player-comparison' || path === '/tools/player-comparison/') {
      return serveToolAsset(env, 'origin/tools/player-comparison/index.html', 'text/html', corsHeaders, request);
    }
    // Draft Pick Value Calculator (Pro)
    if (path === '/tools/draft-value' || path === '/tools/draft-value/') {
      return serveToolAsset(env, 'origin/tools/draft-value/index.html', 'text/html', corsHeaders, request);
    }
    // Schedule Strength Analyzer (Pro)
    if (path === '/tools/schedule-strength' || path === '/tools/schedule-strength/') {
      return serveToolAsset(env, 'origin/tools/schedule-strength/index.html', 'text/html', corsHeaders, request);
    }
    // NIL Valuation Calculator (Pro)
    if (path === '/tools/nil-valuation' || path === '/tools/nil-valuation/') {
      return serveToolAsset(env, 'origin/tools/nil-valuation/index.html', 'text/html', corsHeaders, request);
    }
    // Prospect Tracker (Pro)
    if (path === '/tools/prospect-tracker' || path === '/tools/prospect-tracker/') {
      return serveToolAsset(env, 'origin/tools/prospect-tracker/index.html', 'text/html', corsHeaders, request);
    }
    // Pitch Arsenal Analyzer (Pro)
    if (path === '/tools/pitch-arsenal' || path === '/tools/pitch-arsenal/') {
      return serveToolAsset(env, 'origin/tools/pitch-arsenal/index.html', 'text/html', corsHeaders, request);
    }
    // Recruiting Tracker (Pro)
    if (path === '/tools/recruiting-tracker' || path === '/tools/recruiting-tracker/') {
      return serveToolAsset(env, 'origin/tools/recruiting-tracker/index.html', 'text/html', corsHeaders, request);
    }
    // Strike Zone Analyzer (Pro)
    if (path === '/tools/strike-zone' || path === '/tools/strike-zone/') {
      return serveToolAsset(env, 'origin/tools/strike-zone/index.html', 'text/html', corsHeaders, request);
    }
    // Spray Chart Analyzer (Pro)
    if (path === '/tools/spray-chart' || path === '/tools/spray-chart/') {
      return serveToolAsset(env, 'origin/tools/spray-chart/index.html', 'text/html', corsHeaders, request);
    }
    // Vision Coach - Biometric Presence Training (Pro)
    if (path === '/tools/vision-coach' || path === '/tools/vision-coach/') {
      return serveToolAsset(env, 'origin/tools/vision-coach/index.html', 'text/html', corsHeaders, request);
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

    // === NCAA BASEBALL ROUTES ===
    if (path === '/api/ncaa/baseball/rankings') {
      return handleNCAABaseballRankings(env, corsHeaders);
    }
    if (path === '/api/ncaa/baseball/scores') {
      return handleNCAABaseballScores(env, corsHeaders);
    }
    if (path === '/api/ncaa/baseball/standings') {
      const conference = url.searchParams.get('conference');
      return handleNCAABaseballStandings(env, corsHeaders, conference);
    }
    if (path === '/api/ncaa/baseball/schedule') {
      const team = url.searchParams.get('team');
      return handleNCAABaseballSchedule(env, corsHeaders, team);
    }

    // === COLLEGE BASEBALL ROUTE ALIASES ===
    // These map /api/college-baseball/* to the NCAA baseball handlers
    if (path === '/api/college-baseball/rankings') {
      return handleNCAABaseballRankings(env, corsHeaders);
    }
    if (path === '/api/college-baseball/scores') {
      return handleNCAABaseballScores(request, env, corsHeaders);
    }
    if (path === '/api/college-baseball/standings') {
      const conference = url.searchParams.get('conference');
      return handleNCAABaseballStandings(env, corsHeaders, conference);
    }
    if (path === '/api/college-baseball/schedule') {
      const team = url.searchParams.get('team');
      return handleNCAABaseballSchedule(env, corsHeaders, team);
    }
    // Box score endpoint for individual game details
    if (path.startsWith('/api/college-baseball/box-score/')) {
      const gameId = path.split('/').pop();
      return handleNCAABaseballBoxScore(env, corsHeaders, gameId);
    }
    // Leaders endpoint for top batting/pitching stats
    if (path === '/api/college-baseball/leaders') {
      return handleNCAABaseballLeaders(env, corsHeaders);
    }
    // Player detail endpoint
    if (path.startsWith('/api/college-baseball/player/')) {
      const playerId = path.split('/').pop();
      return handleNCAABaseballPlayer(env, corsHeaders, playerId);
    }

    // === UNIFIED SCORES ENDPOINT ===
    // Aggregates all sports scores in one call for scores dashboard
    if (path === '/api/scores/all') {
      return handleUnifiedScores(env, corsHeaders);
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

    // College Basketball (NCAAB) Data
    if (path.startsWith('/api/ncaab/')) {
      return handleNCAABRequest(path, url, env, corsHeaders);
    }
    // CBB alias for NCAAB
    if (path.startsWith('/api/cbb/')) {
      return handleNCAABRequest(path.replace('/api/cbb/', '/api/ncaab/'), url, env, corsHeaders);
    }
    // College Football Data (CFB and NCAAF aliases)
    if (path.startsWith('/api/cfb/')) {
      return handleCFBRequest(path, url, env, corsHeaders);
    }
    if (path.startsWith('/api/ncaaf/')) {
      // Alias /api/ncaaf/ to /api/cfb/ for consistency with NCAAB naming
      const cfbPath = path.replace('/api/ncaaf/', '/api/cfb/');
      return handleCFBRequest(cfbPath, url, env, corsHeaders);
    }

    // Betting Odds (TheOddsAPI)
    if (path.startsWith('/api/odds/')) {
      return handleOddsRequest(path, url, env, corsHeaders);
    }

    // === TOOLS API ROUTES ===
    if (path === '/api/tools/strike-zone') {
      const playerId = url.searchParams.get('player') || url.searchParams.get('pitcher');
      const pitchType = url.searchParams.get('type');
      const hand = url.searchParams.get('hand');
      return handleStrikeZone(env, corsHeaders, playerId, pitchType, hand);
    }
    if (path === '/api/tools/spray-chart') {
      const playerId = url.searchParams.get('player') || url.searchParams.get('batter');
      const hitType = url.searchParams.get('type');
      const season = url.searchParams.get('season') || '2024';
      return handleSprayChart(env, corsHeaders, playerId, hitType, season);
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
        primarySource: 'Highlightly',
        fallback: {
          chain: ['Highlightly', 'SportsDataIO', 'ESPN'],
          espn: true,
          sports: ['mlb', 'nfl', 'nba'],
          note: 'Highlightly Pro is primary; SportsDataIO secondary; ESPN tertiary fallback'
        },
        tools: toolsHealth,
        keysConfigured: {
          highlightly: !!env.HIGHLIGHTLY_API_KEY,
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

    // Admin ingest status endpoint - observability for data pipeline health
    if (path === '/api/admin/ingest-status') {
      return handleIngestStatus(env, corsHeaders);
    }

    // === COLLEGE BASEBALL ROUTES ===
    if (path === '/college-baseball' || path === '/college-baseball/') {
      return serveAsset(env, 'origin/college-baseball/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/college-baseball/')) {
      const subPath = path.replace('/college-baseball/', '');
      let asset = null;

      if (subPath.endsWith('.html') || subPath.includes('.')) {
        asset = await env.ASSETS.get(`origin/college-baseball/${subPath}`);
      } else {
        // Try .html extension first, then /index.html fallback
        asset = await env.ASSETS.get(`origin/college-baseball/${subPath}.html`);
        if (!asset) {
          asset = await env.ASSETS.get(`origin/college-baseball/${subPath}/index.html`);
        }
      }

      if (asset) {
        const assetPath = subPath.endsWith('.js') ? 'js' : subPath.endsWith('.css') ? 'css' : 'html';
        const contentType = assetPath === 'js' ? 'application/javascript' :
                           assetPath === 'css' ? 'text/css' : 'text/html';
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
      let asset = null;

      if (subPath.endsWith('.html') || subPath.includes('.')) {
        asset = await env.ASSETS.get(`origin/mlb/${subPath}`);
      } else {
        // Try .html extension first, then /index.html fallback
        asset = await env.ASSETS.get(`origin/mlb/${subPath}.html`);
        if (!asset) {
          asset = await env.ASSETS.get(`origin/mlb/${subPath}/index.html`);
        }
      }

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
      let asset = null;

      if (subPath.endsWith('.html') || subPath.includes('.')) {
        // Has extension, use as-is
        asset = await env.ASSETS.get(`origin/nfl/${subPath}`);
      } else {
        // Try .html extension first, then /index.html fallback
        asset = await env.ASSETS.get(`origin/nfl/${subPath}.html`);
        if (!asset) {
          asset = await env.ASSETS.get(`origin/nfl/${subPath}/index.html`);
        }
      }

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
        assetPath = `origin/nba/${subPath}.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        return new Response(asset.body, {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }


    // === NCAAB (College Basketball) ROUTES ===
    if (path === '/ncaab' || path === '/ncaab/') {
      return serveAsset(env, 'origin/ncaab/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/ncaab/') && !path.startsWith('/ncaab/api')) {
      const subPath = path.replace('/ncaab/', '');
      let assetPath = `origin/ncaab/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/ncaab/${subPath}.html`;
      }
      const asset = await env.ASSETS.get(assetPath);
      if (asset) {
        return new Response(asset.body, {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === NCAAF (College Football) ROUTES ===
    if (path === '/college-football' || path === '/college-football/') {
      return serveAsset(env, 'origin/college-football/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/college-football/') && !path.startsWith('/college-football/api')) {
      const subPath = path.replace('/college-football/', '');
      let assetPath = `origin/college-football/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/college-football/${subPath}.html`;
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

  /**
   * Scheduled handler for cron-triggered data ingestion
   * Crons defined in wrangler.toml:
   *   - Every 15 min   → Scores (CFB + CBB)
   *   - Every 6 hours  → Standings (CFB + CBB)
   *   - Daily 8am CT   → Rankings (CFB + CBB)
   */
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    const startTime = Date.now();
    const results = [];

    console.log(`[CRON] Starting scheduled job: ${cron}`);

    try {
      // Scores: every 15 minutes
      if (cron === '*/15 * * * *') {
        results.push(await syncScores(env, 'cfb'));
        results.push(await syncScores(env, 'cbb'));
        results.push(await syncScores(env, 'ncaabb')); // College baseball
        // Check for score notifications
        await checkAndNotifyScores(env, 'nfl');
        await checkAndNotifyScores(env, 'nba');
      }

      // Standings: every 6 hours
      if (cron === '0 */6 * * *') {
        results.push(await syncStandings(env, 'cfb'));
        results.push(await syncStandings(env, 'cbb'));
        results.push(await syncStandings(env, 'ncaabb')); // College baseball
      }

      // Rankings: daily at 8am CT (14:00 UTC)
      if (cron === '0 14 * * *') {
        results.push(await syncRankings(env, 'cfb'));
        results.push(await syncRankings(env, 'cbb'));
        results.push(await syncRankings(env, 'ncaabb')); // College baseball
      }

      const duration = Date.now() - startTime;
      console.log(`[CRON] Completed ${cron} in ${duration}ms:`, JSON.stringify(results));

    } catch (error) {
      console.error(`[CRON] Failed ${cron}:`, error.message);
      await logIngest(env, {
        sport: 'system',
        dataType: 'scheduled',
        source: 'espn',
        success: false,
        errorMessage: error.message,
        errorStack: error.stack
      });
    }
  }
};

// === SCHEDULED SYNC FUNCTIONS ===

/**
 * Log ingestion run to D1 for observability
 */
async function logIngest(env, params) {
  const {
    sport,
    dataType,
    source,
    season = new Date().getFullYear(),
    dateParam = null,
    recordsFetched = 0,
    recordsInserted = 0,
    recordsUpdated = 0,
    durationMs = 0,
    success = true,
    errorMessage = null,
    errorStack = null
  } = params;

  try {
    await env.DB.prepare(`
      INSERT INTO ingest_log (
        sport, data_type, source, season, date_param,
        records_fetched, records_inserted, records_updated,
        duration_ms, success, error_message, error_stack
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sport,
      dataType,
      source,
      season,
      dateParam,
      recordsFetched,
      recordsInserted,
      recordsUpdated,
      durationMs,
      success ? 1 : 0,
      errorMessage,
      errorStack
    ).run();
  } catch (err) {
    console.error('[logIngest] Failed to log:', err.message);
  }
}

/**
 * Update sync metadata in D1
 */
async function updateSyncMetadata(env, key, value) {
  try {
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `).bind(key, value).run();
  } catch (err) {
    console.error('[updateSyncMetadata] Failed:', err.message);
  }
}

/**
 * Normalize ESPN game event to canonical format
 */
function normalizeESPNGameForDB(event, sport) {
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  const status = event.status?.type?.name;

  // Map ESPN status to our canonical status
  const statusMap = {
    'STATUS_SCHEDULED': 'scheduled',
    'STATUS_IN_PROGRESS': 'live',
    'STATUS_HALFTIME': 'live',
    'STATUS_END_OF_PERIOD': 'live',
    'STATUS_FINAL': 'final',
    'STATUS_POSTPONED': 'postponed',
    'STATUS_CANCELED': 'canceled',
    'STATUS_DELAYED': 'delayed'
  };

  return {
    id: `${sport}_espn_${event.id}`,
    sport: sport === 'cfb' ? 'college_football' : 'college_basketball',
    season: new Date().getFullYear(),
    date: event.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    startTime: event.date,
    homeTeamId: home?.team?.id || 'unknown',
    awayTeamId: away?.team?.id || 'unknown',
    homeTeamName: home?.team?.displayName || 'TBD',
    awayTeamName: away?.team?.displayName || 'TBD',
    homeTeamLogo: home?.team?.logo || null,
    awayTeamLogo: away?.team?.logo || null,
    homeTeamAbbrev: home?.team?.abbreviation || 'TBD',
    awayTeamAbbrev: away?.team?.abbreviation || 'TBD',
    homeRank: home?.curatedRank?.current || null,
    awayRank: away?.curatedRank?.current || null,
    homeScore: parseInt(home?.score) || 0,
    awayScore: parseInt(away?.score) || 0,
    status: statusMap[status] || 'scheduled',
    period: comp?.status?.period || null,
    periodDetail: comp?.status?.type?.detail || null,
    clock: comp?.status?.displayClock || null,
    venue: comp?.venue?.fullName || null,
    broadcast: comp?.broadcasts?.[0]?.names?.[0] || null,
    isConferenceGame: comp?.conferenceCompetition ? 1 : 0,
    source: 'espn',
    sourceId: event.id
  };
}

/**
 * Upsert games to D1 database
 */
async function upsertGames(env, games, sport) {
  let inserted = 0;
  let updated = 0;

  for (const game of games) {
    try {
      // Check if game exists
      const existing = await env.DB.prepare(`
        SELECT id FROM games WHERE sport = ? AND source = ? AND source_id = ?
      `).bind(
        sport === 'cfb' ? 'college_football' : 'college_basketball',
        'espn',
        game.sourceId
      ).first();

      if (existing) {
        // Update existing game
        await env.DB.prepare(`
          UPDATE games SET
            home_score = ?, away_score = ?, status = ?,
            period = ?, period_detail = ?, clock = ?,
            last_updated = datetime('now')
          WHERE id = ?
        `).bind(
          game.homeScore,
          game.awayScore,
          game.status,
          game.period,
          game.periodDetail,
          game.clock,
          existing.id
        ).run();
        updated++;
      } else {
        // Insert new game
        await env.DB.prepare(`
          INSERT INTO games (
            id, sport, season, date, start_time,
            home_team_id, away_team_id, home_team_name, away_team_name,
            home_team_logo, away_team_logo, home_team_abbrev, away_team_abbrev,
            home_rank, away_rank, home_score, away_score,
            status, period, period_detail, clock, venue, broadcast,
            is_conference_game, source, source_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          game.id,
          game.sport,
          game.season,
          game.date,
          game.startTime,
          game.homeTeamId,
          game.awayTeamId,
          game.homeTeamName,
          game.awayTeamName,
          game.homeTeamLogo,
          game.awayTeamLogo,
          game.homeTeamAbbrev,
          game.awayTeamAbbrev,
          game.homeRank,
          game.awayRank,
          game.homeScore,
          game.awayScore,
          game.status,
          game.period,
          game.periodDetail,
          game.clock,
          game.venue,
          game.broadcast,
          game.isConferenceGame,
          game.source,
          game.sourceId
        ).run();
        inserted++;
      }
    } catch (err) {
      console.error(`[upsertGames] Failed for game ${game.sourceId}:`, err.message);
    }
  }

  return { inserted, updated };
}

/**
 * Sync scores from ESPN for CFB or CBB
 */
async function syncScores(env, sport) {
  const startTime = Date.now();
  const dataType = 'scores';
  const source = 'espn';

  try {
    // ESPN endpoint based on sport
    const espnSportMap = {
      'cfb': 'football/college-football',
      'cbb': 'basketball/mens-college-basketball',
      'ncaabb': 'baseball/college-baseball'
    };
    const espnSport = espnSportMap[sport] || 'basketball/mens-college-basketball';
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/scoreboard`;

    console.log(`[syncScores] Fetching ${sport} from ${url}`);

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const events = data.events || [];

    if (!Array.isArray(events)) {
      throw new Error('Invalid response format: events not an array');
    }

    console.log(`[syncScores] Fetched ${events.length} ${sport} games`);

    // Transform to canonical format
    const normalizedGames = events.map(event => normalizeESPNGameForDB(event, sport));

    // Upsert to D1
    const { inserted, updated } = await upsertGames(env, normalizedGames, sport);

    // Write to KV cache for fast reads
    const kvKey = `${sport.toUpperCase()}_SCORES_CURRENT`;
    const cachePayload = {
      data: normalizedGames,
      lastUpdated: new Date().toISOString(),
      source: 'espn',
      meta: { count: normalizedGames.length, sport, season: new Date().getFullYear() }
    };

    // Determine TTL: 60s if live games, 1 hour otherwise
    const hasLiveGames = normalizedGames.some(g => g.status === 'live');
    const ttl = hasLiveGames ? 60 : 3600;

    if (env.SPORT_CACHE) {
      await env.SPORT_CACHE.put(kvKey, JSON.stringify(cachePayload), { expirationTtl: ttl });
      console.log(`[syncScores] Cached ${kvKey} with TTL ${ttl}s`);
    }

    // Write R2 snapshot for fallback
    if (env.ASSETS) {
      try {
        const snapshotPayload = {
          ...cachePayload,
          snapshotCreated: new Date().toISOString()
        };
        await env.ASSETS.put(
          `snapshots/${sport}/scores-latest.json`,
          JSON.stringify(snapshotPayload),
          { httpMetadata: { contentType: 'application/json' } }
        );
        console.log(`[syncScores] R2 snapshot written for ${sport}`);
      } catch (r2Err) {
        console.error(`[syncScores] R2 snapshot failed:`, r2Err.message);
      }
    }

    // Update sync metadata
    await updateSyncMetadata(env, `${sport}_scores_last_sync`, new Date().toISOString());
    await updateSyncMetadata(env, `${sport}_scores_source`, source);

    const duration = Date.now() - startTime;

    // Log success
    await logIngest(env, {
      sport,
      dataType,
      source,
      recordsFetched: events.length,
      recordsInserted: inserted,
      recordsUpdated: updated,
      durationMs: duration,
      success: true
    });

    return { sport, dataType, success: true, fetched: events.length, inserted, updated, duration };

  } catch (error) {
    const duration = Date.now() - startTime;

    await logIngest(env, {
      sport,
      dataType,
      source,
      durationMs: duration,
      success: false,
      errorMessage: error.message,
      errorStack: error.stack
    });

    return { sport, dataType, success: false, error: error.message, duration };
  }
}

/**
 * Sync standings from ESPN for CFB or CBB
 */
async function syncStandings(env, sport) {
  const startTime = Date.now();
  const dataType = 'standings';
  const source = 'espn';

  try {
    // ESPN standings endpoint
    const espnSportMap = {
      'cfb': 'football/college-football',
      'cbb': 'basketball/mens-college-basketball',
      'ncaabb': 'baseball/college-baseball'
    };
    const espnSport = espnSportMap[sport] || 'basketball/mens-college-basketball';
    const url = `https://site.api.espn.com/apis/v2/sports/${espnSport}/standings`;

    console.log(`[syncStandings] Fetching ${sport} from ${url}`);

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const conferences = data.children || [];

    let totalTeams = 0;
    for (const conf of conferences) {
      const standings = conf.standings?.entries || [];
      totalTeams += standings.length;
    }

    console.log(`[syncStandings] Fetched ${conferences.length} conferences, ${totalTeams} teams`);

    // Write to KV cache for fast reads
    const season = new Date().getFullYear();
    const kvKey = `${sport.toUpperCase()}_STANDINGS_${season}`;
    const cachePayload = {
      data: conferences,
      lastUpdated: new Date().toISOString(),
      source: 'espn',
      meta: { conferenceCount: conferences.length, teamCount: totalTeams, sport, season }
    };

    if (env.SPORT_CACHE) {
      // 6 hour TTL for standings
      await env.SPORT_CACHE.put(kvKey, JSON.stringify(cachePayload), { expirationTtl: 21600 });
      console.log(`[syncStandings] Cached ${kvKey} with TTL 6h`);
    }

    // Write R2 snapshot for fallback
    if (env.ASSETS) {
      try {
        const snapshotPayload = {
          ...cachePayload,
          snapshotCreated: new Date().toISOString()
        };
        await env.ASSETS.put(
          `snapshots/${sport}/standings-${season}.json`,
          JSON.stringify(snapshotPayload),
          { httpMetadata: { contentType: 'application/json' } }
        );
        console.log(`[syncStandings] R2 snapshot written for ${sport}`);
      } catch (r2Err) {
        console.error(`[syncStandings] R2 snapshot failed:`, r2Err.message);
      }
    }

    // Update sync metadata
    await updateSyncMetadata(env, `${sport}_standings_last_sync`, new Date().toISOString());
    await updateSyncMetadata(env, `${sport}_standings_source`, source);

    const duration = Date.now() - startTime;

    await logIngest(env, {
      sport,
      dataType,
      source,
      recordsFetched: totalTeams,
      durationMs: duration,
      success: true
    });

    return { sport, dataType, success: true, conferences: conferences.length, teams: totalTeams, duration };

  } catch (error) {
    const duration = Date.now() - startTime;

    await logIngest(env, {
      sport,
      dataType,
      source,
      durationMs: duration,
      success: false,
      errorMessage: error.message,
      errorStack: error.stack
    });

    return { sport, dataType, success: false, error: error.message, duration };
  }
}

/**
 * Sync rankings from ESPN for CFB or CBB
 */
async function syncRankings(env, sport) {
  const startTime = Date.now();
  const dataType = 'rankings';
  const source = 'espn';

  try {
    // ESPN rankings endpoint
    const espnSportMap = {
      'cfb': 'football/college-football',
      'cbb': 'basketball/mens-college-basketball',
      'ncaabb': 'baseball/college-baseball'
    };
    const espnSport = espnSportMap[sport] || 'basketball/mens-college-basketball';
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/rankings`;

    console.log(`[syncRankings] Fetching ${sport} from ${url}`);

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const rankings = data.rankings || [];

    let totalRanked = 0;
    for (const poll of rankings) {
      totalRanked += poll.ranks?.length || 0;
    }

    console.log(`[syncRankings] Fetched ${rankings.length} polls, ${totalRanked} ranked teams`);

    // Write to KV cache for fast reads
    const kvKey = `${sport.toUpperCase()}_RANKINGS_CURRENT`;
    const cachePayload = {
      data: rankings,
      lastUpdated: new Date().toISOString(),
      source: 'espn',
      meta: { pollCount: rankings.length, rankedCount: totalRanked, sport }
    };

    if (env.SPORT_CACHE) {
      // 24 hour TTL for rankings
      await env.SPORT_CACHE.put(kvKey, JSON.stringify(cachePayload), { expirationTtl: 86400 });
      console.log(`[syncRankings] Cached ${kvKey} with TTL 24h`);
    }

    // Write R2 snapshot for fallback
    if (env.ASSETS) {
      try {
        const snapshotPayload = {
          ...cachePayload,
          snapshotCreated: new Date().toISOString()
        };
        await env.ASSETS.put(
          `snapshots/${sport}/rankings-latest.json`,
          JSON.stringify(snapshotPayload),
          { httpMetadata: { contentType: 'application/json' } }
        );
        console.log(`[syncRankings] R2 snapshot written for ${sport}`);
      } catch (r2Err) {
        console.error(`[syncRankings] R2 snapshot failed:`, r2Err.message);
      }
    }

    // Update sync metadata
    await updateSyncMetadata(env, `${sport}_rankings_last_sync`, new Date().toISOString());
    await updateSyncMetadata(env, `${sport}_rankings_source`, source);

    const duration = Date.now() - startTime;

    await logIngest(env, {
      sport,
      dataType,
      source,
      recordsFetched: totalRanked,
      durationMs: duration,
      success: true
    });

    return { sport, dataType, success: true, polls: rankings.length, ranked: totalRanked, duration };

  } catch (error) {
    const duration = Date.now() - startTime;

    await logIngest(env, {
      sport,
      dataType,
      source,
      durationMs: duration,
      success: false,
      errorMessage: error.message,
      errorStack: error.stack
    });

    return { sport, dataType, success: false, error: error.message, duration };
  }
}

/**
 * Admin endpoint for data pipeline observability
 * GET /api/admin/ingest-status
 */
async function handleIngestStatus(env, corsHeaders) {
  try {
    // Get 24-hour ingest summary using the view
    const summaryResult = await env.DB.prepare(`
      SELECT
        sport,
        data_type,
        source,
        COUNT(*) as total_runs,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
        ROUND(AVG(duration_ms), 0) as avg_duration_ms,
        SUM(records_fetched) as total_fetched,
        SUM(records_inserted) as total_inserted,
        SUM(records_updated) as total_updated,
        MAX(created_at) as last_run
      FROM ingest_log
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY sport, data_type, source
      ORDER BY sport, data_type
    `).all();

    // Get recent failures
    const failuresResult = await env.DB.prepare(`
      SELECT sport, data_type, source, error_message, created_at
      FROM ingest_log
      WHERE success = 0 AND created_at >= datetime('now', '-24 hours')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // Get sync metadata
    const metadataResult = await env.DB.prepare(`
      SELECT key, value, updated_at
      FROM sync_metadata
      WHERE key LIKE '%_last_sync' OR key LIKE '%_source'
      ORDER BY key
    `).all();

    // Check KV cache status
    const kvStatus = {
      cfbScores: false,
      cbbScores: false,
      cfbStandings: false,
      cbbStandings: false,
      cfbRankings: false,
      cbbRankings: false
    };

    if (env.SPORT_CACHE) {
      kvStatus.cfbScores = !!(await env.SPORT_CACHE.get('CFB_SCORES_CURRENT'));
      kvStatus.cbbScores = !!(await env.SPORT_CACHE.get('CBB_SCORES_CURRENT'));
      kvStatus.cfbStandings = !!(await env.SPORT_CACHE.get(`CFB_STANDINGS_${new Date().getFullYear()}`));
      kvStatus.cbbStandings = !!(await env.SPORT_CACHE.get(`CBB_STANDINGS_${new Date().getFullYear()}`));
      kvStatus.cfbRankings = !!(await env.SPORT_CACHE.get('CFB_RANKINGS_CURRENT'));
      kvStatus.cbbRankings = !!(await env.SPORT_CACHE.get('CBB_RANKINGS_CURRENT'));
    }

    // Calculate health score
    const summary = summaryResult.results || [];
    const totalRuns = summary.reduce((acc, row) => acc + (row.total_runs || 0), 0);
    const successfulRuns = summary.reduce((acc, row) => acc + (row.successful || 0), 0);
    const healthScore = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

    const healthStatus = healthScore >= 95 ? 'healthy' :
                         healthScore >= 80 ? 'degraded' : 'unhealthy';

    return new Response(JSON.stringify({
      health: {
        score: healthScore,
        status: healthStatus,
        lastCheck: getChicagoTimestamp()
      },
      summary: summary,
      recentFailures: failuresResult.results || [],
      syncStatus: metadataResult.results || [],
      kvStatus: kvStatus,
      meta: {
        totalRuns24h: totalRuns,
        successRate: totalRuns > 0 ? `${healthScore}%` : 'N/A',
        generated: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to retrieve ingest status',
      message: error.message,
      health: { status: 'error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// === API HANDLER FUNCTIONS ===

async function handleMLBRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/mlb/', '');
  const highlightlyKey = env.HIGHLIGHTLY_API_KEY;
  const sportsdataioKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch today's games
  // Fallback chain: Highlightly → SportsDataIO → ESPN
  if (endpoint === 'scores') {
    // 1. Try Highlightly FIRST (PRIMARY source)
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyMLBScores(highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }

    // 2. Fallback to SportsDataIO (SECONDARY)
    const today = getTodayDate();
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/GamesByDate/${today}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': sportsdataioKey }
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

      const seasonPhase = getMLBSeasonPhase();
      return new Response(JSON.stringify({ games, source: 'SportsDataIO', seasonPhase, fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    } catch (error) {
      // 3. On any error, try ESPN fallback (TERTIARY)
      console.log(`SportsDataIO MLB error: ${error.message}, falling back to ESPN`);
      return fetchESPNMLBScores(corsHeaders);
    }
  }

  // Leaders endpoint - fetch from ESPN core API with athlete resolution
  if (endpoint === 'leaders') {
    try {
      const currentYear = new Date().getFullYear();
      const espnUrl = `https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/${currentYear}/types/2/leaders?limit=10`;
      const response = await fetch(espnUrl);
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch MLB leaders',
          fetchedAt: getChicagoTimestamp()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await response.json();

      // Map category names to our format
      const battingCats = { 'avg': 'avg', 'homeRuns': 'hr', 'RBIs': 'rbi' };
      const pitchingCats = { 'ERA': 'era', 'wins': 'wins', 'strikeoutsPitching': 'strikeouts' };

      const batting = { avg: [], hr: [], rbi: [] };
      const pitching = { era: [], wins: [], strikeouts: [] };

      // Collect all athlete refs to fetch in parallel
      const athleteRefs = new Map();
      const teamRefs = new Map();

      if (data.categories) {
        for (const cat of data.categories) {
          const isBatting = battingCats[cat.name];
          const isPitching = pitchingCats[cat.name];
          if (!isBatting && !isPitching) continue;

          for (const leader of (cat.leaders || []).slice(0, 5)) {
            if (leader.athlete?.$ref) athleteRefs.set(leader.athlete.$ref, null);
            if (leader.team?.$ref) teamRefs.set(leader.team.$ref, null);
          }
        }
      }

      // Fetch athlete names in parallel
      const athletePromises = Array.from(athleteRefs.keys()).slice(0, 25).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            athleteRefs.set(ref, d.displayName || d.fullName || 'Unknown');
          }
        } catch (e) { /* ignore */ }
      });

      // Fetch team abbreviations
      const teamPromises = Array.from(teamRefs.keys()).slice(0, 15).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            teamRefs.set(ref, d.abbreviation || '');
          }
        } catch (e) { /* ignore */ }
      });

      await Promise.all([...athletePromises, ...teamPromises]);

      // Build leaders with resolved names
      if (data.categories) {
        for (const cat of data.categories) {
          const battingKey = battingCats[cat.name];
          const pitchingKey = pitchingCats[cat.name];
          if (!battingKey && !pitchingKey) continue;

          const leaderList = (cat.leaders || []).slice(0, 5).map(l => {
            // For batting avg, extract just the decimal value
            let val = l.displayValue || String(l.value) || '0';
            if (cat.name === 'avg' && l.value) {
              val = l.value.toFixed(3);
            }
            return {
              name: athleteRefs.get(l.athlete?.$ref) || 'Unknown',
              team: teamRefs.get(l.team?.$ref) || '',
              value: val
            };
          });

          if (battingKey) batting[battingKey] = leaderList;
          if (pitchingKey) pitching[pitchingKey] = leaderList;
        }
      }

      return new Response(JSON.stringify({
        batting,
        pitching,
        source: 'ESPN',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
      });
    } catch (error) {
      console.log(`ESPN MLB leaders error: ${error.message}`);
      return new Response(JSON.stringify({
        error: error.message,
        batting: { avg: [], hr: [], rbi: [] },
        pitching: { era: [], wins: [], strikeouts: [] },
        fetchedAt: getChicagoTimestamp()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }


  // Standings endpoint - try Highlightly first, then SportsDataIO, then ESPN, then static 2024 fallback
  if (endpoint === 'standings') {
    // Check if we're in off-season
    const seasonPhase = getMLBSeasonPhase();

    // 1. Try Highlightly FIRST (PRIMARY source)
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyStandings('mlb', highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }

    // 2. Try SportsDataIO (SECONDARY)
    try {
      const standingsUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/Standings/2025`;
      const response = await fetch(standingsUrl + `?key=${sportsdataioKey}`, {
        headers: { 'Ocp-Apim-Subscription-Key': sportsdataioKey }
      });

      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({
          standings: data,
          source: 'SportsDataIO',
          season: '2025',
          seasonPhase: seasonPhase.phase,
          fetchedAt: getChicagoTimestamp()
        }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
        });
      }

      // If quota exceeded or error, continue to fallback
      console.log(`SportsDataIO MLB standings returned ${response.status}, trying ESPN fallback`);
    } catch (error) {
      console.log(`SportsDataIO MLB standings error: ${error.message}, trying ESPN fallback`);
    }

    // 3. Try ESPN (TERTIARY)
    try {
      const espnUrl = 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings';
      const espnResponse = await fetch(espnUrl, {
        headers: { 'User-Agent': 'BlazeIntel/2.4' }
      });

      if (espnResponse.ok) {
        const espnData = await espnResponse.json();
        // Transform ESPN data to our format
        const standings = [];
        if (espnData.children) {
          for (const league of espnData.children) {
            for (const division of (league.children || [])) {
              for (const team of (division.standings?.entries || [])) {
                const stats = team.stats || [];
                const getStatValue = (name) => {
                  const stat = stats.find(s => s.name === name || s.abbreviation === name);
                  return stat ? (stat.value || stat.displayValue || '0') : '0';
                };
                standings.push({
                  Team: team.team?.displayName || team.team?.name || 'Unknown',
                  City: team.team?.location || '',
                  Division: division.name || league.name || 'Unknown',
                  League: league.name || 'Unknown',
                  Wins: parseInt(getStatValue('wins')) || 0,
                  Losses: parseInt(getStatValue('losses')) || 0,
                  Percentage: parseFloat(getStatValue('winPercent')) || 0,
                  GamesBehind: getStatValue('gamesBehind') || '-',
                  TeamID: team.team?.id || null
                });
              }
            }
          }
        }

        // Only return ESPN data if we actually got standings
        if (standings.length > 0) {
          return new Response(JSON.stringify({
            standings,
            source: 'ESPN',
            season: '2024',
            seasonPhase: seasonPhase.phase,
            fetchedAt: getChicagoTimestamp()
          }), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
          });
        }
        console.log('ESPN returned empty standings, using static 2024 fallback');
      }
    } catch (error) {
      console.log(`ESPN MLB standings error: ${error.message}, using static 2024 fallback`);
    }

    // 4. Ultimate fallback: 2024 Final Standings (static data)
    const finalStandings2024 = getMLB2024FinalStandings();
    return new Response(JSON.stringify({
      standings: finalStandings2024,
      source: 'BSI Archive (2024 Final)',
      season: '2024',
      seasonPhase: seasonPhase.phase,
      message: seasonPhase.isOffseason
        ? 'Off-season. Showing 2024 final standings. Spring Training begins Feb 20, 2025.'
        : 'Live data temporarily unavailable. Showing 2024 final standings.',
      fetchedAt: getChicagoTimestamp()
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  }

  const routes = {
    'teams': '/mlb/scores/json/Teams',
    'schedule': '/mlb/scores/json/Games/2025',
    'cardinals': '/mlb/scores/json/TeamSeasonStats/2025?team=STL',
    'scores/today': '/mlb/scores/json/GamesByDate/' + getTodayDate(),
    'players/cardinals': '/mlb/scores/json/Players/STL',
  };

  const apiPath = routes[endpoint] || `/mlb/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, sportsdataioKey, corsHeaders, 300);
}

async function handleNFLRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/nfl/', '');
  const highlightlyKey = env.HIGHLIGHTLY_API_KEY;
  const sportsdataioKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch current week games
  // Fallback chain: Highlightly → SportsDataIO → ESPN
  if (endpoint === 'scores') {
    // 1. Try Highlightly FIRST (PRIMARY source)
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyNFLScores(highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }

    // 2. Fallback to SportsDataIO (SECONDARY)
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/scores/json/ScoresByWeek/2024/REG/13`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': sportsdataioKey }
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
      // 3. On any error, try ESPN fallback (TERTIARY)
      console.log(`SportsDataIO NFL error: ${error.message}, falling back to ESPN`);
      return fetchESPNNFLScores(corsHeaders);
    }
  }

  // Leaders endpoint - fetch from ESPN core API with athlete resolution
  if (endpoint === 'leaders') {
    try {
      const currentYear = new Date().getFullYear();
      const espnUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${currentYear}/types/2/leaders?limit=10`;
      const response = await fetch(espnUrl);
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch NFL leaders',
          fetchedAt: getChicagoTimestamp()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await response.json();

      // Map category names to our format
      const categoryMap = {
        'passingYards': 'passingYards',
        'rushingYards': 'rushingYards',
        'receivingYards': 'receivingYards',
        'totalTouchdowns': 'touchdowns',
        'sacks': 'sacks',
        'interceptions': 'interceptions'
      };

      const leaders = {
        passingYards: [],
        rushingYards: [],
        receivingYards: [],
        touchdowns: [],
        sacks: [],
        interceptions: []
      };

      // Collect all athlete refs to fetch in parallel
      const athleteRefs = new Map();
      const teamRefs = new Map();

      if (data.categories) {
        for (const cat of data.categories) {
          const targetKey = categoryMap[cat.name];
          if (!targetKey) continue;

          for (const leader of (cat.leaders || []).slice(0, 5)) {
            if (leader.athlete?.$ref) athleteRefs.set(leader.athlete.$ref, null);
            if (leader.team?.$ref) teamRefs.set(leader.team.$ref, null);
          }
        }
      }

      // Fetch athlete names in parallel
      const athletePromises = Array.from(athleteRefs.keys()).slice(0, 25).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            athleteRefs.set(ref, d.displayName || d.fullName || 'Unknown');
          }
        } catch (e) { /* ignore */ }
      });

      // Fetch team abbreviations
      const teamPromises = Array.from(teamRefs.keys()).slice(0, 15).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            teamRefs.set(ref, d.abbreviation || '');
          }
        } catch (e) { /* ignore */ }
      });

      await Promise.all([...athletePromises, ...teamPromises]);

      // Build leaders with resolved names
      if (data.categories) {
        for (const cat of data.categories) {
          const targetKey = categoryMap[cat.name];
          if (!targetKey) continue;

          leaders[targetKey] = (cat.leaders || []).slice(0, 5).map(l => ({
            name: athleteRefs.get(l.athlete?.$ref) || 'Unknown',
            team: teamRefs.get(l.team?.$ref) || '',
            value: l.displayValue || String(l.value) || '0'
          }));
        }
      }

      return new Response(JSON.stringify({
        ...leaders,
        source: 'ESPN',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
      });
    } catch (error) {
      console.log(`ESPN NFL leaders error: ${error.message}`);
      return new Response(JSON.stringify({
        error: error.message,
        passingYards: [],
        rushingYards: [],
        receivingYards: [],
        touchdowns: [],
        sacks: [],
        interceptions: [],
        fetchedAt: getChicagoTimestamp()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Standings endpoint - try Highlightly first
  if (endpoint === 'standings') {
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyStandings('nfl', highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }
    // Fallback to SportsDataIO
    return fetchSportsData(`${SPORTSDATAIO_BASE}/nfl/scores/json/Standings/2024`, sportsdataioKey, corsHeaders, 300);
  }

  // Box score endpoint - /api/nfl/box-score/:matchId
  if (endpoint.startsWith('box-score/')) {
    const matchId = endpoint.replace('box-score/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const boxScore = await fetchHighlightlyBoxScore('nfl', matchId, highlightlyKey, corsHeaders, env);
      if (boxScore) return boxScore;
    }
    return new Response(JSON.stringify({ error: 'Box score not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Match details endpoint - /api/nfl/match/:matchId
  if (endpoint.startsWith('match/')) {
    const matchId = endpoint.replace('match/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const matchDetails = await fetchHighlightlyMatchDetails('nfl', matchId, highlightlyKey, corsHeaders, env);
      if (matchDetails) return matchDetails;
    }
    return new Response(JSON.stringify({ error: 'Match details not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Lineups endpoint - /api/nfl/lineups/:matchId
  if (endpoint.startsWith('lineups/')) {
    const matchId = endpoint.replace('lineups/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const lineups = await fetchHighlightlyLineups('nfl', matchId, highlightlyKey, corsHeaders, env);
      if (lineups) return lineups;
    }
    return new Response(JSON.stringify({ error: 'Lineups not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Highlights endpoint - /api/nfl/highlights?date=YYYY-MM-DD&matchId=123
  if (endpoint === 'highlights') {
    const date = url.searchParams.get('date');
    const matchId = url.searchParams.get('matchId');
    if (highlightlyKey) {
      const highlights = await fetchHighlightlyHighlights('nfl', highlightlyKey, corsHeaders, env, date, matchId);
      if (highlights) return highlights;
    }
    return new Response(JSON.stringify({ highlights: [], source: 'Highlightly', error: 'No highlights available' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Player stats endpoint - /api/nfl/players/:playerId/stats
  if (endpoint.match(/^players\/[^\/]+\/stats$/)) {
    const playerId = endpoint.split('/')[1];
    if (highlightlyKey) {
      const stats = await fetchHighlightlyPlayerStats('nfl', playerId, highlightlyKey, corsHeaders, env);
      if (stats) return stats;
    }
    return new Response(JSON.stringify({ error: 'Player stats not available', playerId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Head-to-head endpoint - /api/nfl/h2h?teamOne=10&teamTwo=11
  if (endpoint === 'h2h') {
    const teamOne = url.searchParams.get('teamOne');
    const teamTwo = url.searchParams.get('teamTwo');
    if (!teamOne || !teamTwo) {
      return new Response(JSON.stringify({ error: 'Both teamOne and teamTwo are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const h2h = await fetchHighlightlyHeadToHead('nfl', teamOne, teamTwo, highlightlyKey, corsHeaders, env);
      if (h2h) return h2h;
    }
    return new Response(JSON.stringify({ error: 'Head-to-head data not available', teamOne, teamTwo }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Odds endpoint - /api/nfl/odds/:matchId
  if (endpoint.startsWith('odds/')) {
    const matchId = endpoint.replace('odds/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const odds = await fetchHighlightlyOdds('nfl', matchId, highlightlyKey, corsHeaders, env);
      if (odds) return odds;
    }
    return new Response(JSON.stringify({ error: 'Odds not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const routes = {
    'teams': '/nfl/scores/json/Teams',
    'schedule': '/nfl/scores/json/Schedules/2024',
    'titans': '/nfl/scores/json/TeamSeasonStats/2024/TEN',
    'scores/current': '/nfl/scores/json/ScoresByWeek/2024/REG/13',
    'players/titans': '/nfl/scores/json/Players/TEN',
  };

  const apiPath = routes[endpoint] || `/nfl/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, sportsdataioKey, corsHeaders, 300);
}

async function handleNBARequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/nba/', '');
  const highlightlyKey = env.HIGHLIGHTLY_API_KEY;
  const sportsdataioKey = env.SPORTSDATAIO_API_KEY;

  // Live scores endpoint - fetch today's games
  // Fallback chain: Highlightly → SportsDataIO → ESPN
  if (endpoint === 'scores') {
    // 1. Try Highlightly FIRST (PRIMARY source)
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyNBAScores(highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }

    // 2. Fallback to SportsDataIO (SECONDARY)
    const today = getTodayDate();
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/scores/json/GamesByDate/${today}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': sportsdataioKey }
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
      // 3. On any error, try ESPN fallback (TERTIARY)
      console.log(`SportsDataIO NBA error: ${error.message}, falling back to ESPN`);
      return fetchESPNNBAScores(corsHeaders);
    }
  }

  // Leaders endpoint - fetch from ESPN core API with athlete resolution
  if (endpoint === 'leaders') {
    try {
      const espnUrl = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2025/types/2/leaders?limit=10';
      const response = await fetch(espnUrl);
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch NBA leaders',
          fetchedAt: getChicagoTimestamp()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await response.json();

      // Map category names to our format
      const categoryMap = {
        'pointsPerGame': 'points',
        'reboundsPerGame': 'rebounds',
        'assistsPerGame': 'assists',
        'stealsPerGame': 'steals',
        'blocksPerGame': 'blocks',
        'threePointFieldGoalsMade': 'threePointers'
      };

      const leaders = {
        points: [],
        rebounds: [],
        assists: [],
        steals: [],
        blocks: [],
        threePointers: []
      };

      // Collect all athlete refs to fetch in parallel
      const athleteRefs = new Map();
      const teamRefs = new Map();

      if (data.categories) {
        for (const cat of data.categories) {
          const targetKey = categoryMap[cat.name];
          if (!targetKey) continue;

          for (const leader of (cat.leaders || []).slice(0, 5)) {
            if (leader.athlete?.$ref) athleteRefs.set(leader.athlete.$ref, null);
            if (leader.team?.$ref) teamRefs.set(leader.team.$ref, null);
          }
        }
      }

      // Fetch athlete names in parallel (limit to first 20 to avoid too many requests)
      const athletePromises = Array.from(athleteRefs.keys()).slice(0, 20).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            athleteRefs.set(ref, d.displayName || d.fullName || 'Unknown');
          }
        } catch (e) { /* ignore */ }
      });

      // Fetch team abbreviations
      const teamPromises = Array.from(teamRefs.keys()).slice(0, 10).map(async (ref) => {
        try {
          const r = await fetch(ref);
          if (r.ok) {
            const d = await r.json();
            teamRefs.set(ref, d.abbreviation || '');
          }
        } catch (e) { /* ignore */ }
      });

      await Promise.all([...athletePromises, ...teamPromises]);

      // Now build leaders with resolved names
      if (data.categories) {
        for (const cat of data.categories) {
          const targetKey = categoryMap[cat.name];
          if (!targetKey) continue;

          leaders[targetKey] = (cat.leaders || []).slice(0, 5).map(l => ({
            name: athleteRefs.get(l.athlete?.$ref) || 'Unknown',
            team: teamRefs.get(l.team?.$ref) || '',
            value: l.displayValue || String(l.value) || '0'
          }));
        }
      }

      return new Response(JSON.stringify({
        ...leaders,
        source: 'ESPN',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
      });
    } catch (error) {
      console.log(`ESPN NBA leaders error: ${error.message}`);
      return new Response(JSON.stringify({
        error: error.message,
        points: [],
        rebounds: [],
        assists: [],
        steals: [],
        blocks: [],
        threePointers: [],
        fetchedAt: getChicagoTimestamp()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // === NBA PLAYER ENDPOINTS (ESPN) ===

  // Player Search - /api/nba/players?name=LeBron&offset=0&limit=20
  if (endpoint === 'players') {
    const nameQuery = url.searchParams.get('name') || '';
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);

    try {
      // Get all NBA team rosters from ESPN
      const teamsUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=30';
      const teamsResp = await fetch(teamsUrl);
      if (!teamsResp.ok) throw new Error('Failed to fetch NBA teams');
      
      const teamsData = await teamsResp.json();
      const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
      
      // Collect all players from rosters in parallel
      const rosterPromises = teams.slice(0, 30).map(async (t) => {
        try {
          const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${t.team.id}/roster`;
          const resp = await fetch(rosterUrl);
          if (!resp.ok) return [];
          const data = await resp.json();
          return (data.athletes || []).map(a => ({
            id: a.id,
            fullName: a.fullName || a.displayName,
            logo: a.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${a.id}.png`,
            team: t.team.displayName,
            teamAbbr: t.team.abbreviation,
            position: a.position?.abbreviation || ''
          }));
        } catch (e) { return []; }
      });

      const rosters = await Promise.all(rosterPromises);
      let allPlayers = rosters.flat();

      // Filter by name if provided
      if (nameQuery) {
        const query = nameQuery.toLowerCase();
        allPlayers = allPlayers.filter(p => 
          (p.fullName || '').toLowerCase().includes(query)
        );
      }

      // Sort alphabetically and paginate
      allPlayers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      const paginated = allPlayers.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        players: paginated.map(p => ({ id: p.id, logo: p.logo, fullName: p.fullName })),
        pagination: { offset, limit, total: allPlayers.length, hasMore: offset + limit < allPlayers.length },
        source: 'ESPN',
        league: 'NBA',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NBA player search error: ${error.message}`);
      return new Response(JSON.stringify({ 
        players: [], error: error.message, fetchedAt: getChicagoTimestamp() 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Player Profile - /api/nba/players/{playerId}
  if (endpoint.match(/^players\/[^\/]+$/) && !endpoint.includes('/statistics')) {
    const playerId = endpoint.split('/')[1];

    try {
      const profileUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes/${playerId}`;
      const resp = await fetch(profileUrl);
      
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: 'Player not found', playerId }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const p = await resp.json();
      const birthCity = p.birthPlace?.city || null;
      const birthState = p.birthPlace?.state || p.birthPlace?.country || '';

      const profile = {
        id: p.id,
        fullName: p.fullName || p.displayName,
        jersey: p.jersey || null,
        isActive: p.active !== undefined ? p.active : true,
        height: p.height || null,
        weight: p.weight || null,
        birthDate: p.dateOfBirth || null,
        birthPlace: birthCity ? (birthCity + (birthState ? ', ' + birthState : '')) : null,
        position: {
          main: p.position?.displayName || null,
          abbreviation: p.position?.abbreviation || null
        },
        team: p.team ? {
          id: p.team.id,
          name: p.team.shortDisplayName || p.team.displayName,
          displayName: p.team.displayName,
          abbreviation: p.team.abbreviation,
          logo: p.team.logos?.[0]?.href || null,
          league: 'NBA'
        } : null,
        headshot: p.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${p.id}.png`,
        college: p.college?.name || null,
        draft: p.draft ? { year: p.draft.year, round: p.draft.round, pick: p.draft.selection } : null
      };

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NBA player profile error: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message, playerId }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Player Statistics - /api/nba/players/{playerId}/statistics
  if (endpoint.match(/^players\/[^\/]+\/statistics$/)) {
    const playerId = endpoint.split('/')[1];

    try {
      const statsUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes/${playerId}/statistics`;
      const resp = await fetch(statsUrl);
      
      if (!resp.ok) {
        return new Response(JSON.stringify({ playerId, perSeason: [], error: 'No statistics available', fetchedAt: getChicagoTimestamp() }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await resp.json();
      const defenseNames = ['blocks', 'steals', 'defensive rebounds'];
      const generalNames = ['minutes', 'games played', 'games started', 'fouls', 'rebounds'];

      const categorizeStats = (categories) => {
        const defense = [], general = [], offense = [];
        for (const cat of (categories || [])) {
          for (const stat of (cat.stats || [])) {
            const formatted = { name: stat.displayName || stat.name, value: stat.value || 0 };
            const nameLower = (formatted.name || '').toLowerCase();
            if (defenseNames.some(d => nameLower.includes(d))) { defense.push(formatted); }
            else if (generalNames.some(g => nameLower.includes(g))) { general.push(formatted); }
            else { offense.push(formatted); }
          }
        }
        return { defense, general, offense };
      };

      const perSeason = [];
      if (data.splits?.categories) {
        const categorized = categorizeStats(data.splits.categories);
        perSeason.push({ season: new Date().getFullYear(), league: 'NBA', teams: [], ...categorized });
      }

      return new Response(JSON.stringify({ playerId, perSeason, source: 'ESPN', league: 'NBA', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NBA player stats error: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message, playerId, perSeason: [] }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }


  // Standings endpoint - try Highlightly first
  if (endpoint === 'standings') {
    if (highlightlyKey) {
      const highlightlyResponse = await fetchHighlightlyStandings('nba', highlightlyKey, corsHeaders, env);
      if (highlightlyResponse) {
        return highlightlyResponse;
      }
    }
    // Fallback to SportsDataIO
    return fetchSportsData(`${SPORTSDATAIO_BASE}/nba/scores/json/Standings/2025`, sportsdataioKey, corsHeaders, 300);
  }

  // Box score endpoint - /api/nba/box-score/:matchId
  if (endpoint.startsWith('box-score/')) {
    const matchId = endpoint.replace('box-score/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const boxScore = await fetchHighlightlyBoxScore('nba', matchId, highlightlyKey, corsHeaders, env);
      if (boxScore) return boxScore;
    }
    return new Response(JSON.stringify({ error: 'Box score not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Match details endpoint - /api/nba/match/:matchId
  if (endpoint.startsWith('match/')) {
    const matchId = endpoint.replace('match/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const matchDetails = await fetchHighlightlyMatchDetails('nba', matchId, highlightlyKey, corsHeaders, env);
      if (matchDetails) return matchDetails;
    }
    return new Response(JSON.stringify({ error: 'Match details not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Lineups endpoint - /api/nba/lineups/:matchId
  if (endpoint.startsWith('lineups/')) {
    const matchId = endpoint.replace('lineups/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const lineups = await fetchHighlightlyLineups('nba', matchId, highlightlyKey, corsHeaders, env);
      if (lineups) return lineups;
    }
    return new Response(JSON.stringify({ error: 'Lineups not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Highlights endpoint - /api/nba/highlights?date=YYYY-MM-DD&matchId=123
  if (endpoint === 'highlights') {
    const date = url.searchParams.get('date');
    const matchId = url.searchParams.get('matchId');
    if (highlightlyKey) {
      const highlights = await fetchHighlightlyHighlights('nba', highlightlyKey, corsHeaders, env, date, matchId);
      if (highlights) return highlights;
    }
    return new Response(JSON.stringify({ highlights: [], source: 'Highlightly', error: 'No highlights available' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Highlightly player stats endpoint - /api/nba/players/:playerId/highlightly-stats
  // (separate from ESPN /statistics endpoint)
  if (endpoint.match(/^players\/[^\/]+\/highlightly-stats$/)) {
    const playerId = endpoint.split('/')[1];
    if (highlightlyKey) {
      const stats = await fetchHighlightlyPlayerStats('nba', playerId, highlightlyKey, corsHeaders, env);
      if (stats) return stats;
    }
    return new Response(JSON.stringify({ error: 'Highlightly player stats not available', playerId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Head-to-head endpoint - /api/nba/h2h?teamOne=10&teamTwo=11
  if (endpoint === 'h2h') {
    const teamOne = url.searchParams.get('teamOne');
    const teamTwo = url.searchParams.get('teamTwo');
    if (!teamOne || !teamTwo) {
      return new Response(JSON.stringify({ error: 'Both teamOne and teamTwo are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const h2h = await fetchHighlightlyHeadToHead('nba', teamOne, teamTwo, highlightlyKey, corsHeaders, env);
      if (h2h) return h2h;
    }
    return new Response(JSON.stringify({ error: 'Head-to-head data not available', teamOne, teamTwo }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Odds endpoint - /api/nba/odds/:matchId
  if (endpoint.startsWith('odds/')) {
    const matchId = endpoint.replace('odds/', '');
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (highlightlyKey) {
      const odds = await fetchHighlightlyOdds('nba', matchId, highlightlyKey, corsHeaders, env);
      if (odds) return odds;
    }
    return new Response(JSON.stringify({ error: 'Odds not available', matchId }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const routes = {
    'teams': '/nba/scores/json/Teams',
    'schedule': '/nba/scores/json/Games/2025',
    'grizzlies': '/nba/scores/json/TeamSeasonStats/2025/MEM',
    'scores/today': '/nba/scores/json/GamesByDate/' + getTodayDate(),
    'players/grizzlies': '/nba/scores/json/Players/MEM',
  };

  const apiPath = routes[endpoint] || `/nba/scores/json/${endpoint}`;
  return fetchSportsData(`${SPORTSDATAIO_BASE}${apiPath}`, sportsdataioKey, corsHeaders, 300);
}



// === NCAAB (College Basketball) Handler ===
async function handleNCAABRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/ncaab/', '');

  // === PLAYER ENDPOINTS (ESPN) ===

  // Player Search - /api/ncaab/players?name=Cooper&offset=0&limit=50
  if (endpoint === 'players') {
    const nameQuery = url.searchParams.get('name') || '';
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);

    try {
      // Get all men's college basketball teams from ESPN
      const teamsUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=50&groups=50'; // Top 50 D1 teams
      const teamsResp = await fetch(teamsUrl);
      if (!teamsResp.ok) throw new Error('Failed to fetch NCAAB teams');
      
      const teamsData = await teamsResp.json();
      const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
      
      // Collect players from rosters in parallel (limit to top 30 teams for performance)
      const rosterPromises = teams.slice(0, 30).map(async (t) => {
        try {
          const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${t.team.id}/roster`;
          const resp = await fetch(rosterUrl);
          if (!resp.ok) return [];
          const data = await resp.json();
          return (data.athletes || []).map(a => ({
            id: a.id,
            fullName: a.fullName || a.displayName,
            logo: a.headshot?.href || `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${a.id}.png`,
            team: t.team.displayName,
            teamAbbr: t.team.abbreviation,
            position: a.position?.abbreviation || '',
            class: a.experience?.displayValue || null
          }));
        } catch (e) { return []; }
      });

      const rosters = await Promise.all(rosterPromises);
      let allPlayers = rosters.flat();

      // Filter by name if provided
      if (nameQuery) {
        const query = nameQuery.toLowerCase();
        allPlayers = allPlayers.filter(p => 
          (p.fullName || '').toLowerCase().includes(query)
        );
      }

      // Sort alphabetically and paginate
      allPlayers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      const paginated = allPlayers.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        players: paginated.map(p => ({ id: p.id, logo: p.logo, fullName: p.fullName })),
        pagination: { offset, limit, total: allPlayers.length, hasMore: offset + limit < allPlayers.length },
        source: 'ESPN',
        league: 'NCAAB',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NCAAB player search error: ${error.message}`);
      return new Response(JSON.stringify({ 
        players: [], error: error.message, fetchedAt: getChicagoTimestamp() 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Player Profile - /api/ncaab/players/{playerId}
  if (endpoint.match(/^players\/[^\/]+$/) && !endpoint.includes('/statistics')) {
    const playerId = endpoint.split('/')[1];

    try {
      const profileUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/mens-college-basketball/athletes/${playerId}`;
      const resp = await fetch(profileUrl);
      
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: 'Player not found', playerId }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const p = await resp.json();
      const birthCity = p.birthPlace?.city || null;
      const birthState = p.birthPlace?.state || p.birthPlace?.country || '';

      const profile = {
        id: p.id,
        fullName: p.fullName || p.displayName,
        jersey: p.jersey || null,
        isActive: p.active !== undefined ? p.active : true,
        height: p.height || null,
        weight: p.weight || null,
        birthDate: p.dateOfBirth || null,
        birthPlace: birthCity ? (birthCity + (birthState ? ', ' + birthState : '')) : null,
        class: p.experience?.displayValue || null,
        eligibility: p.eligibilityYear || null,
        position: {
          main: p.position?.displayName || null,
          abbreviation: p.position?.abbreviation || null
        },
        team: p.team ? {
          id: p.team.id,
          name: p.team.shortDisplayName || p.team.displayName,
          displayName: p.team.displayName,
          abbreviation: p.team.abbreviation,
          logo: p.team.logos?.[0]?.href || null,
          conference: null,
          league: 'NCAAB'
        } : null,
        headshot: p.headshot?.href || `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${p.id}.png`,
        highSchool: p.highSchool?.name || null
      };

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NCAAB player profile error: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message, playerId }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Player Statistics - /api/ncaab/players/{playerId}/statistics
  if (endpoint.match(/^players\/[^\/]+\/statistics$/)) {
    const playerId = endpoint.split('/')[1];

    try {
      const statsUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/mens-college-basketball/athletes/${playerId}/statistics`;
      const resp = await fetch(statsUrl);
      
      if (!resp.ok) {
        return new Response(JSON.stringify({ playerId, perSeason: [], error: 'No statistics available', fetchedAt: getChicagoTimestamp() }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await resp.json();
      const defenseNames = ['blocks', 'steals', 'defensive rebounds'];
      const generalNames = ['minutes', 'games played', 'games started', 'fouls', 'rebounds'];

      const categorizeStats = (categories) => {
        const defense = [], general = [], offense = [];
        for (const cat of (categories || [])) {
          for (const stat of (cat.stats || [])) {
            const formatted = { name: stat.displayName || stat.name, value: stat.value || 0 };
            const nameLower = (formatted.name || '').toLowerCase();
            if (defenseNames.some(d => nameLower.includes(d))) { defense.push(formatted); }
            else if (generalNames.some(g => nameLower.includes(g))) { general.push(formatted); }
            else { offense.push(formatted); }
          }
        }
        return { defense, general, offense };
      };

      const perSeason = [];
      if (data.splits?.categories) {
        const categorized = categorizeStats(data.splits.categories);
        perSeason.push({ season: new Date().getFullYear(), league: 'NCAAB', teams: [], ...categorized });
      }

      return new Response(JSON.stringify({ playerId, perSeason, source: 'ESPN', league: 'NCAAB', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    } catch (error) {
      console.log(`NCAAB player stats error: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message, playerId, perSeason: [] }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Scores endpoint - KV first, then ESPN fallback
  if (endpoint === 'scores') {
    // Try KV cache first
    if (env.SPORT_CACHE) {
      try {
        const cached = await env.SPORT_CACHE.get('CBB_SCORES_CURRENT', { type: 'json' });
        if (cached && cached.data && cached.data.length > 0) {
          // Transform cached data to legacy format
          const games = cached.data.map(g => ({
            id: g.sourceId,
            Status: g.status === 'live' ? 'In Progress' : g.status === 'final' ? 'Final' : 'Scheduled',
            HomeTeam: g.homeTeamAbbrev,
            AwayTeam: g.awayTeamAbbrev,
            HomeTeamScore: g.homeScore,
            AwayTeamScore: g.awayScore,
            Period: g.period || 0,
            TimeRemaining: g.clock || '',
            DateTime: g.startTime
          }));
          return new Response(JSON.stringify({
            data: games,
            games, // Legacy format
            lastUpdated: cached.lastUpdated,
            source: 'ESPN',
            status: 'cached',
            league: 'NCAAB',
            fetchedAt: getChicagoTimestamp()
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=15',
              'X-Cache-Status': 'HIT',
              ...corsHeaders
            }
          });
        }
      } catch (e) {
        console.log('[CBB Scores] KV read failed:', e.message);
      }
    }

    // KV miss - fetch live from ESPN
    try {
      const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
      const response = await fetch(espnUrl);
      if (!response.ok) throw new Error('ESPN NCAAB API failed');

      const data = await response.json();
      const games = (data.events || []).map(event => {
        const comp = event.competitions?.[0];
        const homeTeam = comp?.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = comp?.competitors?.find(c => c.homeAway === 'away');
        return {
          id: event.id,
          Status: event.status?.type?.description || 'Unknown',
          HomeTeam: homeTeam?.team?.abbreviation || 'TBD',
          AwayTeam: awayTeam?.team?.abbreviation || 'TBD',
          HomeTeamScore: parseInt(homeTeam?.score) || 0,
          AwayTeamScore: parseInt(awayTeam?.score) || 0,
          Period: comp?.status?.period || 0,
          TimeRemaining: comp?.status?.displayClock || '',
          DateTime: event.date
        };
      });

      return new Response(JSON.stringify({
        data: games,
        games, // Legacy format
        lastUpdated: new Date().toISOString(),
        source: 'ESPN',
        status: 'live',
        league: 'NCAAB',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-Cache-Status': 'MISS',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        data: [],
        games: [],
        error: error.message,
        status: 'error',
        fetchedAt: getChicagoTimestamp()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // === STANDINGS ENDPOINT ===
  if (endpoint === 'standings') {
    const conferenceFilter = url.searchParams.get('conference');
    try {
      // Fetch standings for major conferences from ESPN
      const conferences = [
        { id: '8', name: 'SEC' },
        { id: '4', name: 'Big 12' },
        { id: '7', name: 'Big Ten' },
        { id: '2', name: 'ACC' },
        { id: '3', name: 'Big East' },
        { id: '21', name: 'Pac-12' },
        { id: '62', name: 'AAC' },
        { id: '44', name: 'Mountain West' },
        { id: '50', name: 'WCC' },
        { id: '1', name: 'America East' },
        { id: '5', name: 'Big Sky' },
        { id: '6', name: 'Big South' },
        { id: '9', name: 'Colonial' },
        { id: '10', name: 'Conference USA' },
        { id: '11', name: 'Horizon' },
        { id: '12', name: 'Ivy' },
        { id: '13', name: 'MAAC' },
        { id: '14', name: 'MAC' },
        { id: '16', name: 'MEAC' },
        { id: '18', name: 'Missouri Valley' },
        { id: '20', name: 'Ohio Valley' },
        { id: '22', name: 'Patriot' },
        { id: '24', name: 'Southern' },
        { id: '25', name: 'Southland' },
        { id: '26', name: 'SWAC' },
        { id: '27', name: 'Sun Belt' },
        { id: '29', name: 'Atlantic 10' },
        { id: '30', name: 'WAC' },
        { id: '45', name: 'ASUN' },
        { id: '46', name: 'Big West' },
        { id: '49', name: 'Summit' },
        { id: '48', name: 'NEC' }
      ];

      let filteredConferences = conferences;
      if (conferenceFilter && conferenceFilter !== 'all') {
        filteredConferences = conferences.filter(c =>
          c.name.toLowerCase().includes(conferenceFilter.toLowerCase())
        );
      }

      const standingsData = await Promise.all(
        filteredConferences.slice(0, 10).map(async (conf) => {
          try {
            const standingsUrl = `https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?group=${conf.id}`;
            const resp = await fetch(standingsUrl);
            if (!resp.ok) return null;
            const data = await resp.json();

            const teams = (data.standings?.entries || []).map(entry => ({
              name: entry.team?.displayName || 'Unknown',
              abbreviation: entry.team?.abbreviation || '',
              logo: entry.team?.logos?.[0]?.href || null,
              rank: entry.team?.rank || null,
              conferenceWins: entry.stats?.find(s => s.name === 'wins')?.value || 0,
              conferenceLosses: entry.stats?.find(s => s.name === 'losses')?.value || 0,
              wins: entry.stats?.find(s => s.name === 'overall')?.displayValue?.split('-')?.[0] || 0,
              losses: entry.stats?.find(s => s.name === 'overall')?.displayValue?.split('-')?.[1] || 0,
              streak: entry.stats?.find(s => s.name === 'streak')?.displayValue || '--'
            }));

            return { name: conf.name, teams };
          } catch (e) {
            console.log(`Error fetching ${conf.name}: ${e.message}`);
            return null;
          }
        })
      );

      const standings = standingsData.filter(s => s && s.teams.length > 0);

      return new Response(JSON.stringify({
        standings,
        source: 'ESPN',
        league: 'NCAAB',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ standings: [], error: error.message, fetchedAt: getChicagoTimestamp() }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Default: return available endpoints
  return new Response(JSON.stringify({
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/ncaab/scores',
      '/api/ncaab/standings',
      '/api/ncaab/players',
      '/api/ncaab/players/{id}',
      '/api/ncaab/players/{id}/statistics'
    ],
    fetchedAt: getChicagoTimestamp()
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleCFBRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/cfb/', '');
  const apiKey = env.COLLEGEFOOTBALLDATA_API_KEY;

  // Scores endpoint - KV first, then ESPN fallback
  if (endpoint === 'scores') {
    // Try KV cache first
    if (env.SPORT_CACHE) {
      try {
        const cached = await env.SPORT_CACHE.get('CFB_SCORES_CURRENT', { type: 'json' });
        if (cached && cached.data && cached.data.length > 0) {
          // Transform cached data to legacy format
          const games = cached.data.map(g => ({
            id: g.sourceId,
            Status: g.status === 'live' ? 'In Progress' : g.status === 'final' ? 'Final' : 'Scheduled',
            HomeTeam: g.homeTeamAbbrev,
            AwayTeam: g.awayTeamAbbrev,
            HomeTeamScore: g.homeScore,
            AwayTeamScore: g.awayScore,
            Quarter: g.period || 0,
            TimeRemaining: g.clock || '',
            DateTime: g.startTime,
            HomeRank: g.homeRank,
            AwayRank: g.awayRank
          }));
          return new Response(JSON.stringify({
            data: games,
            games, // Legacy format
            lastUpdated: cached.lastUpdated,
            source: 'ESPN',
            status: 'cached',
            league: 'NCAAF',
            fetchedAt: getChicagoTimestamp()
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=15',
              'X-Cache-Status': 'HIT',
              ...corsHeaders
            }
          });
        }
      } catch (e) {
        console.log('[CFB Scores] KV read failed:', e.message);
      }
    }

    // KV miss - fetch live from ESPN
    try {
      const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';
      const response = await fetch(espnUrl);
      if (!response.ok) throw new Error('ESPN CFB API failed');

      const data = await response.json();
      const games = (data.events || []).map(event => {
        const comp = event.competitions?.[0];
        const homeTeam = comp?.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = comp?.competitors?.find(c => c.homeAway === 'away');
        return {
          id: event.id,
          Status: event.status?.type?.description || 'Unknown',
          HomeTeam: homeTeam?.team?.abbreviation || 'TBD',
          AwayTeam: awayTeam?.team?.abbreviation || 'TBD',
          HomeTeamScore: parseInt(homeTeam?.score) || 0,
          AwayTeamScore: parseInt(awayTeam?.score) || 0,
          Quarter: comp?.status?.period || 0,
          TimeRemaining: comp?.status?.displayClock || '',
          DateTime: event.date,
          HomeRank: homeTeam?.curatedRank?.current || null,
          AwayRank: awayTeam?.curatedRank?.current || null
        };
      });

      return new Response(JSON.stringify({
        data: games,
        games, // Legacy format
        lastUpdated: new Date().toISOString(),
        source: 'ESPN',
        status: 'live',
        league: 'NCAAF',
        fetchedAt: getChicagoTimestamp()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-Cache-Status': 'MISS',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        data: [],
        games: [],
        error: error.message,
        status: 'error',
        fetchedAt: getChicagoTimestamp()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

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

// === HIGHLIGHTLY API FUNCTIONS (PRIMARY SOURCE) ===
// All Highlightly functions use KV caching to reduce API calls

/**
 * Fetch MLB scores from Highlightly (PRIMARY source)
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment with KV bindings
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyMLBScores(apiKey, corsHeaders, env) {
  const cacheKey = 'HIGHLIGHTLY_MLB_SCORES';

  // Check KV cache first
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] MLB scores cache HIT`);
        return new Response(JSON.stringify({
          ...cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetchWithRetry(`${HIGHLIGHTLY_MLB_BASE}/matches?date=${today}&league=mlb`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly MLB returned ${response.status}, falling back to SportsDataIO`);
      return null;
    }

    const data = await response.json();
    const matches = data.matches || data.data || data || [];

    const games = matches.map(match => ({
      id: match.id || match.matchId,
      status: {
        state: match.status || 'scheduled',
        isLive: match.status === 'live' || match.isLive,
        inning: match.inning || match.period || null,
        inningState: match.inningHalf || match.periodType || null,
        detailedState: match.statusText || match.status
      },
      teams: {
        away: {
          name: match.awayTeam || match.away?.name,
          abbreviation: match.awayTeamAbbr || match.away?.abbreviation,
          score: match.awayScore ?? match.away?.score ?? 0
        },
        home: {
          name: match.homeTeam || match.home?.name,
          abbreviation: match.homeTeamAbbr || match.home?.abbreviation,
          score: match.homeScore ?? match.home?.score ?? 0
        }
      },
      dateTime: match.startTime || match.dateTime || match.date
    }));

    const hasLiveGames = games.some(g => g.status?.isLive);
    const seasonPhase = getMLBSeasonPhase();
    const payload = {
      games,
      source: 'Highlightly',
      seasonPhase,
      fetchedAt: getChicagoTimestamp()
    };

    // Cache with appropriate TTL (60s for live, 300s otherwise)
    if (env?.SPORT_CACHE) {
      const ttl = hasLiveGames ? 60 : 300;
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: ttl });
      console.log(`[Highlightly] MLB scores cached with TTL ${ttl}s`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly MLB error: ${error.message}, falling back to SportsDataIO`);
    return null;
  }
}

/**
 * Fetch NFL scores from Highlightly (PRIMARY source)
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment with KV bindings
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyNFLScores(apiKey, corsHeaders, env) {
  const cacheKey = 'HIGHLIGHTLY_NFL_SCORES';

  // Check KV cache first
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] NFL scores cache HIT`);
        return new Response(JSON.stringify({
          ...cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const response = await fetchWithRetry(`${HIGHLIGHTLY_NFL_BASE}/matches?league=nfl&season=2024`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly NFL returned ${response.status}, falling back to SportsDataIO`);
      return null;
    }

    const data = await response.json();
    const matches = data.matches || data.data || data || [];

    const games = matches.map(match => ({
      GameID: match.id || match.matchId,
      Status: match.status || 'Scheduled',
      AwayTeam: match.awayTeam || match.away?.name,
      HomeTeam: match.homeTeam || match.home?.name,
      AwayScore: match.awayScore ?? match.away?.score ?? 0,
      HomeScore: match.homeScore ?? match.home?.score ?? 0,
      Quarter: match.period || match.quarter || null,
      TimeRemaining: match.clock || match.timeRemaining || null,
      DateTime: match.startTime || match.dateTime || match.date
    }));

    const hasLiveGames = games.some(g => g.Status === 'InProgress' || g.Status === 'live');
    const payload = {
      games,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache with appropriate TTL (60s for live, 300s otherwise)
    if (env?.SPORT_CACHE) {
      const ttl = hasLiveGames ? 60 : 300;
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: ttl });
      console.log(`[Highlightly] NFL scores cached with TTL ${ttl}s`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly NFL error: ${error.message}, falling back to SportsDataIO`);
    return null;
  }
}

/**
 * Fetch NBA scores from Highlightly (PRIMARY source)
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment with KV bindings
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyNBAScores(apiKey, corsHeaders, env) {
  const cacheKey = 'HIGHLIGHTLY_NBA_SCORES';

  // Check KV cache first
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] NBA scores cache HIT`);
        return new Response(JSON.stringify({
          ...cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetchWithRetry(`${HIGHLIGHTLY_NBA_BASE}/matches?date=${today}&league=nba`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly NBA returned ${response.status}, falling back to SportsDataIO`);
      return null;
    }

    const data = await response.json();
    const matches = data.matches || data.data || data || [];

    const games = matches.map(match => ({
      id: match.id || match.matchId,
      GameID: match.id || match.matchId,
      Status: match.status || 'Scheduled',
      AwayTeam: match.awayTeam || match.away?.name,
      HomeTeam: match.homeTeam || match.home?.name,
      AwayTeamScore: match.awayScore ?? match.away?.score ?? 0,
      HomeTeamScore: match.homeScore ?? match.home?.score ?? 0,
      Quarter: match.period || match.quarter || null,
      TimeRemaining: match.clock || match.timeRemaining || null,
      DateTime: match.startTime || match.dateTime || match.date
    }));

    const hasLiveGames = games.some(g => g.Status === 'InProgress' || g.Status === 'live');
    const payload = {
      games,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache with appropriate TTL (60s for live, 300s otherwise)
    if (env?.SPORT_CACHE) {
      const ttl = hasLiveGames ? 60 : 300;
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: ttl });
      console.log(`[Highlightly] NBA scores cached with TTL ${ttl}s`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly NBA error: ${error.message}, falling back to SportsDataIO`);
    return null;
  }
}

/**
 * Fetch standings from Highlightly (PRIMARY source)
 * @param {string} sport - Sport type (mlb, nfl, nba)
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment with KV bindings
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyStandings(sport, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_${sport.toUpperCase()}_STANDINGS`;

  // Check KV cache first (standings have 6 hour TTL)
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] ${sport.toUpperCase()} standings cache HIT`);
        return new Response(JSON.stringify({
          ...cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = {
      mlb: HIGHLIGHTLY_MLB_BASE,
      nfl: HIGHLIGHTLY_NFL_BASE,
      nba: HIGHLIGHTLY_NBA_BASE
    };

    const response = await fetchWithRetry(`${baseUrls[sport]}/standings?season=2024`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} standings returned ${response.status}, falling back`);
      return null;
    }

    const data = await response.json();
    const payload = {
      standings: data.standings || data.data || data,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache standings for 6 hours
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 21600 });
      console.log(`[Highlightly] ${sport.toUpperCase()} standings cached with TTL 6h`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} standings error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch box score from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} matchId - Match ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyBoxScore(sport, matchId, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_BOXSCORE_${sport.toUpperCase()}_${matchId}`;

  // Check cache first (box scores cached for 2 minutes during live games)
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Box score cache HIT for ${matchId}`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = {
      nfl: HIGHLIGHTLY_NFL_BASE,
      nba: HIGHLIGHTLY_NBA_BASE
    };

    const response = await fetchWithRetry(`${baseUrls[sport]}/box-score/${matchId}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} box-score returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      boxScore: data,
      matchId,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache box scores for 2 minutes (live data changes frequently)
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 120 });
      console.log(`[Highlightly] Box score cached for ${matchId}`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} box-score error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch match details from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} matchId - Match ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyMatchDetails(sport, matchId, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_MATCH_${sport.toUpperCase()}_${matchId}`;

  // Check cache first (match details cached for 5 minutes)
  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Match details cache HIT for ${matchId}`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = {
      nfl: HIGHLIGHTLY_NFL_BASE,
      nba: HIGHLIGHTLY_NBA_BASE
    };

    const response = await fetchWithRetry(`${baseUrls[sport]}/matches/${matchId}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} match details returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      match: data,
      matchId,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache match details for 5 minutes
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 });
      console.log(`[Highlightly] Match details cached for ${matchId}`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} match details error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch lineups from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} matchId - Match ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyLineups(sport, matchId, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_LINEUPS_${sport.toUpperCase()}_${matchId}`;

  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Lineups cache HIT for ${matchId}`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = { nfl: HIGHLIGHTLY_NFL_BASE, nba: HIGHLIGHTLY_NBA_BASE };
    const response = await fetchWithRetry(`${baseUrls[sport]}/lineups/${matchId}`, {
      headers: { 'x-rapidapi-key': apiKey, 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} lineups returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      lineups: data.lineups || data.home || data,
      matchId,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache lineups for 30 minutes (stable pre-game, updates at game time)
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 1800 });
      console.log(`[Highlightly] Lineups cached for ${matchId}`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} lineups error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch highlights from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @param {string} date - Optional date filter (YYYY-MM-DD)
 * @param {string} matchId - Optional match ID filter
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyHighlights(sport, apiKey, corsHeaders, env, date = null, matchId = null) {
  const today = date || new Date().toISOString().split('T')[0];
  const cacheKey = matchId
    ? `HIGHLIGHTLY_HIGHLIGHTS_${sport.toUpperCase()}_${matchId}`
    : `HIGHLIGHTLY_HIGHLIGHTS_${sport.toUpperCase()}_${today}`;

  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Highlights cache HIT`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = { nfl: HIGHLIGHTLY_NFL_BASE, nba: HIGHLIGHTLY_NBA_BASE };
    const league = sport === 'nfl' ? 'nfl' : 'nba';
    let url = `${baseUrls[sport]}/highlights?league=${league}&date=${today}`;
    if (matchId) url += `&matchId=${matchId}`;

    const response = await fetchWithRetry(url, {
      headers: { 'x-rapidapi-key': apiKey, 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} highlights returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      highlights: data.highlights || data.data || data || [],
      date: today,
      matchId: matchId || null,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache highlights for 5 minutes
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 });
      console.log(`[Highlightly] Highlights cached`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} highlights error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch player stats from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} playerId - Player ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyPlayerStats(sport, playerId, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_PLAYERSTATS_${sport.toUpperCase()}_${playerId}`;

  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Player stats cache HIT for ${playerId}`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = { nfl: HIGHLIGHTLY_NFL_BASE, nba: HIGHLIGHTLY_NBA_BASE };
    const response = await fetchWithRetry(`${baseUrls[sport]}/players/${playerId}/statistics`, {
      headers: { 'x-rapidapi-key': apiKey, 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} player stats returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      player: data.player || data,
      statistics: data.statistics || data.seasons || data.stats || [],
      playerId,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache player stats for 1 hour
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 3600 });
      console.log(`[Highlightly] Player stats cached for ${playerId}`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} player stats error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch head-to-head from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} teamOne - First team ID
 * @param {string} teamTwo - Second team ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyHeadToHead(sport, teamOne, teamTwo, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_H2H_${sport.toUpperCase()}_${teamOne}_${teamTwo}`;

  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] H2H cache HIT`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = { nfl: HIGHLIGHTLY_NFL_BASE, nba: HIGHLIGHTLY_NBA_BASE };
    const response = await fetchWithRetry(
      `${baseUrls[sport]}/head-2-head?teamIdOne=${teamOne}&teamIdTwo=${teamTwo}`,
      { headers: { 'x-rapidapi-key': apiKey, 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} H2H returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      matches: data.matches || data.games || data || [],
      teamOne,
      teamTwo,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache H2H for 6 hours (historical data doesn't change often)
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 21600 });
      console.log(`[Highlightly] H2H cached`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} H2H error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch odds from Highlightly
 * @param {string} sport - 'nfl' or 'nba'
 * @param {string} matchId - Match ID
 * @param {string} apiKey - Highlightly API key
 * @param {Object} corsHeaders - CORS headers
 * @param {Object} env - Worker environment
 * @returns {Promise<Response>}
 */
async function fetchHighlightlyOdds(sport, matchId, apiKey, corsHeaders, env) {
  const cacheKey = `HIGHLIGHTLY_ODDS_${sport.toUpperCase()}_${matchId}`;

  if (env?.SPORT_CACHE) {
    try {
      const cached = await env.SPORT_CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log(`[Highlightly] Odds cache HIT for ${matchId}`);
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (e) {
      console.log(`[Highlightly] Cache read error: ${e.message}`);
    }
  }

  try {
    const baseUrls = { nfl: HIGHLIGHTLY_NFL_BASE, nba: HIGHLIGHTLY_NBA_BASE };
    const response = await fetchWithRetry(`${baseUrls[sport]}/odds?matchId=${matchId}`, {
      headers: { 'x-rapidapi-key': apiKey, 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log(`Highlightly ${sport.toUpperCase()} odds returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const payload = {
      odds: data.odds || data.bookmakers || data || [],
      matchId,
      sport,
      source: 'Highlightly',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache odds for 2 minutes (live odds change frequently)
    if (env?.SPORT_CACHE) {
      await env.SPORT_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 120 });
      console.log(`[Highlightly] Odds cached for ${matchId}`);
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.log(`Highlightly ${sport.toUpperCase()} odds error: ${error.message}`);
    return null;
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
    const seasonPhase = getMLBSeasonPhase();

    return new Response(JSON.stringify({
      games,
      source: 'ESPN',
      fallback: true,
      seasonPhase,
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
    const seasonPhase = getMLBSeasonPhase();
    return new Response(JSON.stringify({
      error: error.message,
      games: [],
      source: 'ESPN',
      fallback: true,
      seasonPhase
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

// MLB Season Phase Detection
function getMLBSeasonPhase() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Spring Training: Feb 20 - Mar 25 (approximate)
  if ((month === 2 && day >= 20) || (month === 3 && day <= 25)) {
    return {
      phase: 'spring_training',
      label: 'Spring Training',
      isSpringTraining: true,
      isRegularSeason: false,
      isPostseason: false,
      isOffseason: false
    };
  }

  // Regular Season: Late March - Late September
  if ((month === 3 && day > 25) || (month >= 4 && month <= 9)) {
    return {
      phase: 'regular',
      label: 'Regular Season',
      isSpringTraining: false,
      isRegularSeason: true,
      isPostseason: false,
      isOffseason: false
    };
  }

  // Postseason: October
  if (month === 10) {
    return {
      phase: 'postseason',
      label: 'Postseason',
      isSpringTraining: false,
      isRegularSeason: false,
      isPostseason: true,
      isOffseason: false
    };
  }

  // Offseason: November - February 19
  return {
    phase: 'offseason',
    label: 'Offseason',
    isSpringTraining: false,
    isRegularSeason: false,
    isPostseason: false,
    isOffseason: true
  };
}

// 2024 Final MLB Standings - Authoritative fallback data
// Source: Baseball-Reference, verified November 2024
function getMLB2024FinalStandings() {
  return [
    // AL East
    { Team: 'New York Yankees', City: 'New York', Division: 'AL East', League: 'American', Wins: 94, Losses: 68, Percentage: 0.580, GamesBehind: '-' },
    { Team: 'Baltimore Orioles', City: 'Baltimore', Division: 'AL East', League: 'American', Wins: 91, Losses: 71, Percentage: 0.562, GamesBehind: '3' },
    { Team: 'Boston Red Sox', City: 'Boston', Division: 'AL East', League: 'American', Wins: 81, Losses: 81, Percentage: 0.500, GamesBehind: '13' },
    { Team: 'Tampa Bay Rays', City: 'Tampa Bay', Division: 'AL East', League: 'American', Wins: 80, Losses: 82, Percentage: 0.494, GamesBehind: '14' },
    { Team: 'Toronto Blue Jays', City: 'Toronto', Division: 'AL East', League: 'American', Wins: 74, Losses: 88, Percentage: 0.457, GamesBehind: '20' },
    // AL Central
    { Team: 'Cleveland Guardians', City: 'Cleveland', Division: 'AL Central', League: 'American', Wins: 92, Losses: 70, Percentage: 0.568, GamesBehind: '-' },
    { Team: 'Kansas City Royals', City: 'Kansas City', Division: 'AL Central', League: 'American', Wins: 86, Losses: 76, Percentage: 0.531, GamesBehind: '6' },
    { Team: 'Minnesota Twins', City: 'Minnesota', Division: 'AL Central', League: 'American', Wins: 82, Losses: 80, Percentage: 0.506, GamesBehind: '10' },
    { Team: 'Detroit Tigers', City: 'Detroit', Division: 'AL Central', League: 'American', Wins: 86, Losses: 76, Percentage: 0.531, GamesBehind: '6' },
    { Team: 'Chicago White Sox', City: 'Chicago', Division: 'AL Central', League: 'American', Wins: 41, Losses: 121, Percentage: 0.253, GamesBehind: '51' },
    // AL West
    { Team: 'Houston Astros', City: 'Houston', Division: 'AL West', League: 'American', Wins: 88, Losses: 74, Percentage: 0.543, GamesBehind: '-' },
    { Team: 'Seattle Mariners', City: 'Seattle', Division: 'AL West', League: 'American', Wins: 85, Losses: 77, Percentage: 0.525, GamesBehind: '3' },
    { Team: 'Texas Rangers', City: 'Texas', Division: 'AL West', League: 'American', Wins: 78, Losses: 84, Percentage: 0.481, GamesBehind: '10' },
    { Team: 'Los Angeles Angels', City: 'Los Angeles', Division: 'AL West', League: 'American', Wins: 63, Losses: 99, Percentage: 0.389, GamesBehind: '25' },
    { Team: 'Oakland Athletics', City: 'Oakland', Division: 'AL West', League: 'American', Wins: 69, Losses: 93, Percentage: 0.426, GamesBehind: '19' },
    // NL East
    { Team: 'Philadelphia Phillies', City: 'Philadelphia', Division: 'NL East', League: 'National', Wins: 95, Losses: 67, Percentage: 0.586, GamesBehind: '-' },
    { Team: 'New York Mets', City: 'New York', Division: 'NL East', League: 'National', Wins: 89, Losses: 73, Percentage: 0.549, GamesBehind: '6' },
    { Team: 'Atlanta Braves', City: 'Atlanta', Division: 'NL East', League: 'National', Wins: 89, Losses: 73, Percentage: 0.549, GamesBehind: '6' },
    { Team: 'Washington Nationals', City: 'Washington', Division: 'NL East', League: 'National', Wins: 71, Losses: 91, Percentage: 0.438, GamesBehind: '24' },
    { Team: 'Miami Marlins', City: 'Miami', Division: 'NL East', League: 'National', Wins: 62, Losses: 100, Percentage: 0.383, GamesBehind: '33' },
    // NL Central
    { Team: 'Milwaukee Brewers', City: 'Milwaukee', Division: 'NL Central', League: 'National', Wins: 93, Losses: 69, Percentage: 0.574, GamesBehind: '-' },
    { Team: 'St. Louis Cardinals', City: 'St. Louis', Division: 'NL Central', League: 'National', Wins: 83, Losses: 79, Percentage: 0.512, GamesBehind: '10' },
    { Team: 'Chicago Cubs', City: 'Chicago', Division: 'NL Central', League: 'National', Wins: 83, Losses: 79, Percentage: 0.512, GamesBehind: '10' },
    { Team: 'Pittsburgh Pirates', City: 'Pittsburgh', Division: 'NL Central', League: 'National', Wins: 76, Losses: 86, Percentage: 0.469, GamesBehind: '17' },
    { Team: 'Cincinnati Reds', City: 'Cincinnati', Division: 'NL Central', League: 'National', Wins: 77, Losses: 85, Percentage: 0.475, GamesBehind: '16' },
    // NL West
    { Team: 'Los Angeles Dodgers', City: 'Los Angeles', Division: 'NL West', League: 'National', Wins: 98, Losses: 64, Percentage: 0.605, GamesBehind: '-' },
    { Team: 'San Diego Padres', City: 'San Diego', Division: 'NL West', League: 'National', Wins: 93, Losses: 69, Percentage: 0.574, GamesBehind: '5' },
    { Team: 'Arizona Diamondbacks', City: 'Arizona', Division: 'NL West', League: 'National', Wins: 89, Losses: 73, Percentage: 0.549, GamesBehind: '9' },
    { Team: 'San Francisco Giants', City: 'San Francisco', Division: 'NL West', League: 'National', Wins: 80, Losses: 82, Percentage: 0.494, GamesBehind: '18' },
    { Team: 'Colorado Rockies', City: 'Colorado', Division: 'NL West', League: 'National', Wins: 61, Losses: 101, Percentage: 0.377, GamesBehind: '37' }
  ];
}

// === TOOLS API HANDLERS ===

// Strike Zone Handler - Pitch location visualization data
async function handleStrikeZone(env, corsHeaders, playerId = null, pitchType = null, hand = null) {
  try {
    // Cache key based on parameters
    const cacheKey = `strike_zone_${playerId || 'default'}_${pitchType || 'all'}_${hand || 'all'}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    // Strike zone is 17" wide (x: -8.5 to 8.5) and varies by batter height (typical y: 1.5 to 3.5 feet)
    // Generate realistic pitch distribution data
    const pitchTypes = ['FF', 'SL', 'CH', 'CU', 'SI', 'FC', 'FS'];
    const pitchNames = {
      'FF': 'Four-Seam Fastball',
      'SL': 'Slider',
      'CH': 'Changeup',
      'CU': 'Curveball',
      'SI': 'Sinker',
      'FC': 'Cutter',
      'FS': 'Splitter'
    };

    // Generate synthetic pitch data (would be replaced by real API data)
    const generatePitches = (count, type = null) => {
      const pitches = [];
      for (let i = 0; i < count; i++) {
        const selectedType = type || pitchTypes[Math.floor(Math.random() * pitchTypes.length)];
        // Realistic pitch locations with clustering patterns
        const isStrike = Math.random() > 0.4;
        let px, pz;

        if (isStrike) {
          // Inside strike zone with some variation
          px = (Math.random() - 0.5) * 1.4; // -0.7 to 0.7 feet
          pz = 2.0 + (Math.random() - 0.3) * 1.2; // ~1.8 to 3.2 feet
        } else {
          // Outside strike zone
          const corner = Math.floor(Math.random() * 4);
          switch (corner) {
            case 0: px = -1.0 - Math.random() * 0.5; pz = 2.5 + Math.random() * 0.5; break; // Left
            case 1: px = 1.0 + Math.random() * 0.5; pz = 2.5 + Math.random() * 0.5; break; // Right
            case 2: px = (Math.random() - 0.5) * 1.2; pz = 3.5 + Math.random() * 0.5; break; // High
            case 3: px = (Math.random() - 0.5) * 1.2; pz = 1.2 - Math.random() * 0.4; break; // Low
          }
        }

        // Velocity based on pitch type
        const velocityRanges = {
          'FF': [93, 98], 'SL': [82, 88], 'CH': [82, 88], 'CU': [75, 82],
          'SI': [91, 96], 'FC': [88, 93], 'FS': [84, 89]
        };
        const [minV, maxV] = velocityRanges[selectedType] || [85, 95];
        const velocity = minV + Math.random() * (maxV - minV);

        pitches.push({
          type: selectedType,
          typeName: pitchNames[selectedType],
          px: Math.round(px * 100) / 100,
          pz: Math.round(pz * 100) / 100,
          velocity: Math.round(velocity * 10) / 10,
          isStrike: isStrike,
          result: isStrike ? (Math.random() > 0.6 ? 'called_strike' : 'swinging_strike') : (Math.random() > 0.5 ? 'ball' : 'hit_into_play')
        });
      }
      return pitches;
    };

    // Filter by pitch type if specified
    const pitchCount = 150;
    let pitches = pitchType ? generatePitches(pitchCount, pitchType.toUpperCase()) : generatePitches(pitchCount);

    // Calculate zone breakdown
    const zoneBreakdown = {};
    pitchTypes.forEach(type => {
      const typePitches = pitches.filter(p => p.type === type);
      if (typePitches.length > 0) {
        zoneBreakdown[type] = {
          name: pitchNames[type],
          count: typePitches.length,
          strikeRate: Math.round((typePitches.filter(p => p.isStrike).length / typePitches.length) * 100),
          avgVelocity: Math.round(typePitches.reduce((sum, p) => sum + p.velocity, 0) / typePitches.length * 10) / 10
        };
      }
    });

    const result = {
      player: playerId || 'Sample Pitcher',
      pitchType: pitchType || 'all',
      batterHand: hand || 'all',
      pitches: pitches,
      summary: {
        totalPitches: pitches.length,
        strikes: pitches.filter(p => p.isStrike).length,
        balls: pitches.filter(p => !p.isStrike).length,
        strikeRate: Math.round((pitches.filter(p => p.isStrike).length / pitches.length) * 100)
      },
      zoneBreakdown: zoneBreakdown,
      strikezone: {
        left: -0.708, // feet from center of plate
        right: 0.708,
        top: 3.5,     // typical top
        bottom: 1.5   // typical bottom
      },
      source: 'BSI Synthetic Data (connect to Statcast for real data)',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('Strike Zone error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Spray Chart Handler - Batted ball distribution visualization
async function handleSprayChart(env, corsHeaders, playerId = null, hitType = null, season = '2024') {
  try {
    const cacheKey = `spray_chart_${playerId || 'default'}_${hitType || 'all'}_${season}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    const hitTypes = ['single', 'double', 'triple', 'home_run', 'groundout', 'flyout', 'lineout'];
    const hitTypeLabels = {
      'single': 'Single', 'double': 'Double', 'triple': 'Triple',
      'home_run': 'Home Run', 'groundout': 'Ground Out',
      'flyout': 'Fly Out', 'lineout': 'Line Out'
    };

    // Field dimensions (from home plate in feet)
    // Standard field: LF line 330', CF 400', RF line 330'
    // Angles: -45deg (LF line) to +45deg (RF line)
    const generateBattedBalls = (count, type = null) => {
      const balls = [];
      for (let i = 0; i < count; i++) {
        const selectedType = type || hitTypes[Math.floor(Math.random() * hitTypes.length)];
        let angle, distance, exitVelo, launchAngle;

        // Different hit types have different typical distributions
        switch (selectedType) {
          case 'home_run':
            angle = (Math.random() - 0.5) * 70; // -35 to +35 degrees
            distance = 380 + Math.random() * 50;
            exitVelo = 100 + Math.random() * 12;
            launchAngle = 25 + Math.random() * 15;
            break;
          case 'triple':
            angle = Math.random() > 0.5 ? (-30 - Math.random() * 15) : (30 + Math.random() * 15); // Gaps
            distance = 350 + Math.random() * 40;
            exitVelo = 95 + Math.random() * 10;
            launchAngle = 15 + Math.random() * 15;
            break;
          case 'double':
            angle = (Math.random() - 0.5) * 80;
            distance = 280 + Math.random() * 70;
            exitVelo = 90 + Math.random() * 15;
            launchAngle = 15 + Math.random() * 20;
            break;
          case 'single':
            angle = (Math.random() - 0.5) * 90;
            distance = 150 + Math.random() * 150;
            exitVelo = 80 + Math.random() * 20;
            launchAngle = 5 + Math.random() * 20;
            break;
          case 'groundout':
            angle = (Math.random() - 0.5) * 90;
            distance = 80 + Math.random() * 120;
            exitVelo = 70 + Math.random() * 30;
            launchAngle = -10 + Math.random() * 15;
            break;
          case 'flyout':
            angle = (Math.random() - 0.5) * 80;
            distance = 200 + Math.random() * 150;
            exitVelo = 85 + Math.random() * 15;
            launchAngle = 30 + Math.random() * 25;
            break;
          case 'lineout':
            angle = (Math.random() - 0.5) * 80;
            distance = 150 + Math.random() * 150;
            exitVelo = 95 + Math.random() * 15;
            launchAngle = 10 + Math.random() * 15;
            break;
        }

        // Convert polar to cartesian (x = distance * sin(angle), y = distance * cos(angle))
        const angleRad = angle * Math.PI / 180;
        const x = distance * Math.sin(angleRad);
        const y = distance * Math.cos(angleRad);

        // Determine field zone
        let zone;
        if (angle < -15) zone = 'left';
        else if (angle > 15) zone = 'right';
        else zone = 'center';

        balls.push({
          type: selectedType,
          typeName: hitTypeLabels[selectedType],
          x: Math.round(x),
          y: Math.round(y),
          distance: Math.round(distance),
          angle: Math.round(angle),
          exitVelo: Math.round(exitVelo * 10) / 10,
          launchAngle: Math.round(launchAngle * 10) / 10,
          zone: zone,
          isHit: ['single', 'double', 'triple', 'home_run'].includes(selectedType)
        });
      }
      return balls;
    };

    const ballCount = 200;
    const validHitTypes = ['single', 'double', 'triple', 'home_run', 'groundout', 'flyout', 'lineout'];
    const normalizedType = hitType && validHitTypes.includes(hitType.toLowerCase()) ? hitType.toLowerCase() : null;
    let battedBalls = normalizedType ? generateBattedBalls(ballCount, normalizedType) : generateBattedBalls(ballCount);

    // Calculate spray breakdown
    const zoneStats = { left: [], center: [], right: [] };
    battedBalls.forEach(ball => {
      zoneStats[ball.zone].push(ball);
    });

    const calculateZoneStats = (balls) => ({
      count: balls.length,
      hits: balls.filter(b => b.isHit).length,
      avg: balls.length > 0 ? Math.round((balls.filter(b => b.isHit).length / balls.length) * 1000) / 1000 : 0,
      avgExitVelo: balls.length > 0 ? Math.round(balls.reduce((sum, b) => sum + b.exitVelo, 0) / balls.length * 10) / 10 : 0,
      avgDistance: balls.length > 0 ? Math.round(balls.reduce((sum, b) => sum + b.distance, 0) / balls.length) : 0
    });

    const result = {
      player: playerId || 'Sample Batter',
      hitType: hitType || 'all',
      season: season,
      battedBalls: battedBalls,
      summary: {
        totalBattedBalls: battedBalls.length,
        hits: battedBalls.filter(b => b.isHit).length,
        outs: battedBalls.filter(b => !b.isHit).length,
        battingAvg: Math.round((battedBalls.filter(b => b.isHit).length / battedBalls.length) * 1000) / 1000,
        avgExitVelo: Math.round(battedBalls.reduce((sum, b) => sum + b.exitVelo, 0) / battedBalls.length * 10) / 10,
        avgLaunchAngle: Math.round(battedBalls.reduce((sum, b) => sum + b.launchAngle, 0) / battedBalls.length * 10) / 10
      },
      zoneBreakdown: {
        left: calculateZoneStats(zoneStats.left),
        center: calculateZoneStats(zoneStats.center),
        right: calculateZoneStats(zoneStats.right)
      },
      fieldDimensions: {
        leftLine: 330,
        centerField: 400,
        rightLine: 330,
        warningTrack: 380
      },
      source: 'BSI Synthetic Data (connect to Statcast for real data)',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('Spray Chart error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
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

// === NCAA BASEBALL HANDLER FUNCTIONS ===

async function handleNCAABaseballRankings(env, corsHeaders) {
  try {
    // Check cache first
    const cacheKey = 'ncaa_baseball_rankings';
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    // Try ESPN college baseball rankings
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const response = await fetch(espnUrl, {
      headers: { 'User-Agent': 'BlazeIntel/2.4' }
    });

    let rankings = [];
    if (response.ok) {
      const data = await response.json();
      if (data.rankings && data.rankings[0] && data.rankings[0].ranks) {
        rankings = data.rankings[0].ranks.map((team, idx) => ({
          rank: team.current || idx + 1,
          previousRank: team.previous || null,
          team: team.team?.displayName || team.team?.name || 'Unknown',
          abbreviation: team.team?.abbreviation || '',
          conference: team.team?.groups?.parent?.name || team.team?.conference || '',
          record: team.recordSummary || '',
          logo: team.team?.logos?.[0]?.href || null
        }));
      }
    }

    // If no ESPN data, provide D1Baseball-style placeholder
    if (rankings.length === 0) {
      rankings = getNCAABaseballRankingsPlaceholder();
    }

    const result = {
      rankings,
      source: response.ok ? 'ESPN' : 'D1Baseball Reference',
      fetchedAt: getChicagoTimestamp(),
      poll: 'D1Baseball Top 25'
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Rankings error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      rankings: getNCAABaseballRankingsPlaceholder(),
      source: 'fallback',
      fetchedAt: getChicagoTimestamp()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function getNCAABaseballRankingsPlaceholder() {
  // 2025 preseason-style rankings based on D1Baseball projections
  return [
    { rank: 1, team: 'Texas', abbreviation: 'TEX', conference: 'SEC', record: '0-0' },
    { rank: 2, team: 'LSU', abbreviation: 'LSU', conference: 'SEC', record: '0-0' },
    { rank: 3, team: 'Texas A&M', abbreviation: 'TAMU', conference: 'SEC', record: '0-0' },
    { rank: 4, team: 'Florida', abbreviation: 'FLA', conference: 'SEC', record: '0-0' },
    { rank: 5, team: 'Tennessee', abbreviation: 'TENN', conference: 'SEC', record: '0-0' },
    { rank: 6, team: 'Wake Forest', abbreviation: 'WAKE', conference: 'ACC', record: '0-0' },
    { rank: 7, team: 'Virginia', abbreviation: 'UVA', conference: 'ACC', record: '0-0' },
    { rank: 8, team: 'Arkansas', abbreviation: 'ARK', conference: 'SEC', record: '0-0' },
    { rank: 9, team: 'Oregon State', abbreviation: 'ORST', conference: 'Pac-12', record: '0-0' },
    { rank: 10, team: 'Vanderbilt', abbreviation: 'VAN', conference: 'SEC', record: '0-0' },
    { rank: 11, team: 'Stanford', abbreviation: 'STAN', conference: 'ACC', record: '0-0' },
    { rank: 12, team: 'Georgia', abbreviation: 'UGA', conference: 'SEC', record: '0-0' },
    { rank: 13, team: 'Clemson', abbreviation: 'CLEM', conference: 'ACC', record: '0-0' },
    { rank: 14, team: 'Florida State', abbreviation: 'FSU', conference: 'ACC', record: '0-0' },
    { rank: 15, team: 'NC State', abbreviation: 'NCST', conference: 'ACC', record: '0-0' },
    { rank: 16, team: 'Ole Miss', abbreviation: 'MISS', conference: 'SEC', record: '0-0' },
    { rank: 17, team: 'TCU', abbreviation: 'TCU', conference: 'Big 12', record: '0-0' },
    { rank: 18, team: 'Kentucky', abbreviation: 'UK', conference: 'SEC', record: '0-0' },
    { rank: 19, team: 'Alabama', abbreviation: 'BAMA', conference: 'SEC', record: '0-0' },
    { rank: 20, team: 'South Carolina', abbreviation: 'SCAR', conference: 'SEC', record: '0-0' },
    { rank: 21, team: 'Arizona', abbreviation: 'ARIZ', conference: 'Big 12', record: '0-0' },
    { rank: 22, team: 'Oklahoma State', abbreviation: 'OKST', conference: 'Big 12', record: '0-0' },
    { rank: 23, team: 'East Carolina', abbreviation: 'ECU', conference: 'American', record: '0-0' },
    { rank: 24, team: 'Miami', abbreviation: 'MIA', conference: 'ACC', record: '0-0' },
    { rank: 25, team: 'West Virginia', abbreviation: 'WVU', conference: 'Big 12', record: '0-0' }
  ];
}

async function handleNCAABaseballScores(request, env, corsHeaders) {
  try {
    // Check user subscription for content gating
    const session = await getSession(request, env);
    let isPro = false;
    if (session?.user_id) {
      const userResult = await env.DB.prepare('SELECT subscription_tier, subscription_status FROM users WHERE id = ?')
        .bind(session.user_id)
        .first();
      isPro = userResult?.subscription_tier === 'pro' && userResult?.subscription_status === 'active';
    }

    // Check cache first
    const cacheKey = 'ncaa_baseball_scores';
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    let games = [];
    let fromCache = false;

    if (cached && cached.expiresAt > Date.now()) {
      games = cached.data.games || [];
      fromCache = true;
    } else {
      // Try ESPN college baseball scoreboard
      const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
      const response = await fetch(espnUrl, {
        headers: { 'User-Agent': 'BlazeIntel/2.4' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.events) {
          games = data.events.map(event => {
            const competition = event.competitions?.[0];
            const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
            const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');

            return {
              id: event.id,
              name: event.name || event.shortName,
              status: event.status?.type?.description || 'Scheduled',
              inning: event.status?.period || null,
              inningState: event.status?.type?.state || null,
              homeTeam: {
                name: homeTeam?.team?.displayName || homeTeam?.team?.name || 'TBD',
                abbreviation: homeTeam?.team?.abbreviation || '',
                score: parseInt(homeTeam?.score) || 0,
                logo: homeTeam?.team?.logo || null,
                rank: homeTeam?.curatedRank?.current || null
              },
              awayTeam: {
                name: awayTeam?.team?.displayName || awayTeam?.team?.name || 'TBD',
                abbreviation: awayTeam?.team?.abbreviation || '',
                score: parseInt(awayTeam?.score) || 0,
                logo: awayTeam?.team?.logo || null,
                rank: awayTeam?.curatedRank?.current || null
              },
              startTime: event.date,
              venue: competition?.venue?.fullName || null,
              broadcast: competition?.broadcasts?.[0]?.names?.[0] || null
            };
          });
        }
      }

      // Cache for 2 minutes (full data, gating applied per-request)
      const fullResult = { games, expiresAt: Date.now() + 120000 };
      await env.SESSIONS.put(cacheKey, JSON.stringify({ data: fullResult, expiresAt: Date.now() + 120000 }));
    }

    // Apply content gating for free users
    const totalGames = games.length;
    const FREE_GAME_LIMIT = 3;

    if (!isPro && games.length > FREE_GAME_LIMIT) {
      games = games.slice(0, FREE_GAME_LIMIT);
    }

    const result = {
      games,
      count: games.length,
      totalCount: totalGames,
      source: fromCache ? 'ESPN (cached)' : 'ESPN',
      fetchedAt: getChicagoTimestamp(),
      season: '2025',
      message: totalGames === 0 ? 'No games scheduled. College baseball season starts mid-February 2025.' : null,
      // Content gating info
      isPro,
      preview: !isPro && totalGames > FREE_GAME_LIMIT,
      upgradeRequired: !isPro && totalGames > FREE_GAME_LIMIT,
      hiddenGames: !isPro ? Math.max(0, totalGames - FREE_GAME_LIMIT) : 0,
      upgradeMessage: !isPro && totalGames > FREE_GAME_LIMIT
        ? `Upgrade to Pro to see all ${totalGames} games`
        : null
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Scores error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      games: [],
      source: 'error',
      fetchedAt: getChicagoTimestamp(),
      message: 'College baseball season starts mid-February 2025.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleNCAABaseballStandings(env, corsHeaders, conference = null) {
  try {
    // Check cache
    const cacheKey = `ncaa_baseball_standings_${conference || 'all'}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800', ...corsHeaders }
      });
    }

    // ESPN doesn't have great standings endpoint for college baseball
    // Provide conference-based structure
    const conferences = getNCAABaseballConferences();
    let standings = conferences;

    if (conference) {
      const confLower = conference.toLowerCase();
      standings = conferences.filter(c =>
        c.name.toLowerCase().includes(confLower) ||
        c.abbreviation.toLowerCase() === confLower
      );
    }

    const result = {
      conferences: standings,
      filter: conference || 'all',
      source: 'D1Baseball Reference',
      fetchedAt: getChicagoTimestamp(),
      season: '2025',
      note: 'Conference standings update daily during the season'
    };

    // Cache for 30 minutes
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 1800000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Standings error:', error);
    return new Response(JSON.stringify({ error: error.message, conferences: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function getNCAABaseballConferences() {
  return [
    { name: 'Southeastern Conference', abbreviation: 'SEC', teams: ['Texas', 'Texas A&M', 'LSU', 'Florida', 'Tennessee', 'Vanderbilt', 'Arkansas', 'Ole Miss', 'Georgia', 'Kentucky', 'Alabama', 'South Carolina', 'Auburn', 'Mississippi State', 'Missouri', 'Oklahoma'] },
    { name: 'Atlantic Coast Conference', abbreviation: 'ACC', teams: ['Wake Forest', 'Virginia', 'Clemson', 'Florida State', 'NC State', 'Miami', 'Duke', 'North Carolina', 'Georgia Tech', 'Louisville', 'Notre Dame', 'Pittsburgh', 'Virginia Tech', 'Boston College', 'Stanford', 'California', 'SMU'] },
    { name: 'Big 12 Conference', abbreviation: 'Big 12', teams: ['TCU', 'Oklahoma State', 'Arizona', 'West Virginia', 'Texas Tech', 'Kansas State', 'Baylor', 'Kansas', 'BYU', 'Arizona State', 'UCF', 'Houston', 'Cincinnati', 'Colorado'] },
    { name: 'Big Ten Conference', abbreviation: 'Big Ten', teams: ['Indiana', 'Maryland', 'Michigan', 'Nebraska', 'Ohio State', 'Penn State', 'Rutgers', 'Illinois', 'Iowa', 'Michigan State', 'Minnesota', 'Northwestern', 'Purdue', 'Oregon', 'UCLA', 'USC', 'Washington'] },
    { name: 'Pac-12 Conference', abbreviation: 'Pac-12', teams: ['Oregon State', 'Washington State', 'Colorado State', 'Fresno State'] },
    { name: 'American Athletic Conference', abbreviation: 'American', teams: ['East Carolina', 'Tulane', 'Wichita State', 'Charlotte', 'Memphis', 'Rice', 'South Florida', 'UTSA', 'UAB', 'FAU', 'Temple', 'North Texas'] }
  ];
}

async function handleNCAABaseballSchedule(env, corsHeaders, team = null) {
  try {
    // Check cache
    const cacheKey = `ncaa_baseball_schedule_${team || 'featured'}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    let games = [];

    // If specific team requested, try ESPN team schedule
    if (team) {
      const teamId = getESPNTeamId(team);
      if (teamId) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule`;
        const response = await fetch(url, { headers: { 'User-Agent': 'BlazeIntel/2.4' } });

        if (response.ok) {
          const data = await response.json();
          if (data.events) {
            games = data.events.map(event => ({
              id: event.id,
              date: event.date,
              name: event.name,
              opponent: event.competitions?.[0]?.competitors?.find(c => c.id !== teamId)?.team?.displayName || 'TBD',
              homeAway: event.competitions?.[0]?.competitors?.find(c => c.id === teamId)?.homeAway || 'neutral',
              venue: event.competitions?.[0]?.venue?.fullName || null,
              result: event.competitions?.[0]?.status?.type?.completed ?
                (event.competitions?.[0]?.competitors?.find(c => c.id === teamId)?.winner ? 'W' : 'L') : null
            }));
          }
        }
      }
    }

    // If no team or no results, return upcoming featured games
    if (games.length === 0) {
      games = getFeaturedNCAABaseballGames();
    }

    const result = {
      team: team || 'Featured Games',
      games,
      count: games.length,
      source: team ? 'ESPN' : 'curated',
      fetchedAt: getChicagoTimestamp(),
      season: '2025'
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Schedule error:', error);
    return new Response(JSON.stringify({ error: error.message, games: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Box score handler - detailed game statistics
async function handleNCAABaseballBoxScore(env, corsHeaders, gameId) {
  try {
    const cacheKey = `ncaa_baseball_boxscore_${gameId}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    }

    // Fetch from ESPN event API
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary?event=${gameId}`;
    const response = await fetch(espnUrl, { headers: { 'User-Agent': 'BlazeIntel/2.4' } });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Game not found', gameId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const data = await response.json();
    const boxscore = data.boxscore || {};
    const gameInfo = data.header?.competitions?.[0] || {};

    // Parse teams
    const teams = (boxscore.teams || []).map(team => ({
      id: team.team?.id,
      name: team.team?.displayName || team.team?.name,
      abbreviation: team.team?.abbreviation,
      logo: team.team?.logo,
      homeAway: team.homeAway,
      score: parseInt(gameInfo.competitors?.find(c => c.id === team.team?.id)?.score) || 0,
      linescores: (gameInfo.competitors?.find(c => c.id === team.team?.id)?.linescores || []).map(ls => parseInt(ls.value) || 0),
      batting: (team.statistics || []).filter(s => ['avg', 'rbi', 'hr', 'hits', 'runs', 'strikeouts', 'walks'].includes(s.name)).map(s => ({
        name: s.name,
        displayName: s.displayName,
        value: s.displayValue
      })),
      pitching: (team.statistics || []).filter(s => ['era', 'strikeouts', 'walks', 'earnedRuns', 'inningsPitched'].includes(s.name)).map(s => ({
        name: s.name,
        displayName: s.displayName,
        value: s.displayValue
      }))
    }));

    // Parse players
    const players = (boxscore.players || []).map(teamPlayers => ({
      team: teamPlayers.team?.displayName,
      batters: (teamPlayers.statistics?.[0]?.athletes || []).map(p => ({
        id: p.athlete?.id,
        name: p.athlete?.displayName,
        position: p.athlete?.position?.abbreviation,
        stats: p.stats || []
      })),
      pitchers: (teamPlayers.statistics?.[1]?.athletes || []).map(p => ({
        id: p.athlete?.id,
        name: p.athlete?.displayName,
        position: 'P',
        stats: p.stats || []
      }))
    }));

    const result = {
      gameId,
      status: data.header?.gameNote || gameInfo.status?.type?.description || 'Scheduled',
      inning: gameInfo.status?.period || null,
      venue: gameInfo.venue?.fullName || null,
      attendance: gameInfo.attendance,
      teams,
      players,
      source: 'ESPN',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 minute during games, 1 hour if final
    const isFinal = gameInfo.status?.type?.completed;
    const ttl = isFinal ? 3600000 : 60000;
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + ttl }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${isFinal ? 3600 : 60}`, ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Box Score error:', error);
    return new Response(JSON.stringify({ error: error.message, gameId }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Leaders handler - top batting/pitching stats
async function handleNCAABaseballLeaders(env, corsHeaders) {
  try {
    const cacheKey = 'ncaa_baseball_leaders';
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    // ESPN doesn't have a direct leaders endpoint for college baseball
    // Fetch from their stat leaders page or use curated data
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/leaders';
    const response = await fetch(espnUrl, { headers: { 'User-Agent': 'BlazeIntel/2.4' } });

    let batting = [];
    let pitching = [];

    if (response.ok) {
      const data = await response.json();
      // Parse ESPN leaders format
      const categories = data.leaders?.categories || [];

      const battingCat = categories.find(c => c.name === 'batting' || c.abbreviation === 'batting');
      const pitchingCat = categories.find(c => c.name === 'pitching' || c.abbreviation === 'pitching');

      if (battingCat?.leaders) {
        batting = battingCat.leaders.slice(0, 25).map((leader, idx) => ({
          rank: idx + 1,
          name: leader.athlete?.displayName || leader.displayName,
          team: leader.team?.displayName || leader.athlete?.team?.displayName,
          position: leader.athlete?.position?.abbreviation,
          stat: leader.displayValue,
          category: battingCat.displayName
        }));
      }

      if (pitchingCat?.leaders) {
        pitching = pitchingCat.leaders.slice(0, 25).map((leader, idx) => ({
          rank: idx + 1,
          name: leader.athlete?.displayName || leader.displayName,
          team: leader.team?.displayName || leader.athlete?.team?.displayName,
          position: 'P',
          stat: leader.displayValue,
          category: pitchingCat.displayName
        }));
      }
    }

    // Fallback with placeholder data if ESPN doesn't have leaders yet (preseason)
    if (batting.length === 0) {
      batting = [
        { rank: 1, name: 'Season starts Feb 14', team: 'Check back after opening day', position: '-', stat: '-', category: 'Batting Average' }
      ];
      pitching = [
        { rank: 1, name: 'Season starts Feb 14', team: 'Check back after opening day', position: 'P', stat: '-', category: 'ERA' }
      ];
    }

    const result = {
      batting,
      pitching,
      categories: {
        batting: ['AVG', 'HR', 'RBI', 'H', 'R', 'SB'],
        pitching: ['ERA', 'W', 'K', 'SV', 'IP', 'WHIP']
      },
      season: '2025',
      source: response.ok && batting.length > 1 ? 'ESPN' : 'Preseason',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Leaders error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      batting: [],
      pitching: [],
      source: 'error',
      fetchedAt: getChicagoTimestamp()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Player detail handler - individual player stats
async function handleNCAABaseballPlayer(env, corsHeaders, playerId) {
  try {
    const cacheKey = `ncaa_baseball_player_${playerId}`;
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    // Fetch from ESPN athlete endpoint
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${playerId}`;
    const response = await fetch(espnUrl, { headers: { 'User-Agent': 'BlazeIntel/2.4' } });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Player not found', playerId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const data = await response.json();
    const athlete = data.athlete || data;

    const result = {
      id: playerId,
      name: athlete.displayName || athlete.fullName,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      jersey: athlete.jersey,
      position: athlete.position?.displayName || athlete.position?.abbreviation,
      height: athlete.displayHeight,
      weight: athlete.displayWeight,
      birthplace: athlete.birthPlace?.city && athlete.birthPlace?.state
        ? `${athlete.birthPlace.city}, ${athlete.birthPlace.state}` : null,
      experience: athlete.experience?.displayValue,
      team: {
        id: athlete.team?.id,
        name: athlete.team?.displayName || athlete.team?.name,
        abbreviation: athlete.team?.abbreviation,
        logo: athlete.team?.logos?.[0]?.href
      },
      headshot: athlete.headshot?.href || null,
      statistics: (athlete.statistics || []).map(stat => ({
        season: stat.season?.displayName || stat.season?.year,
        splits: (stat.splits || []).map(split => ({
          name: split.displayName,
          stats: (split.stats || []).map(s => ({
            name: s.name,
            value: s.displayValue,
            description: s.description
          }))
        }))
      })),
      source: 'ESPN',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 hour
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
    });
  } catch (error) {
    console.error('NCAA Baseball Player error:', error);
    return new Response(JSON.stringify({ error: error.message, playerId }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function getESPNTeamId(teamName) {
  const teamIds = {
    'texas': '251', 'longhorns': '251',
    'lsu': '99', 'tigers': '99',
    'texas a&m': '245', 'aggies': '245', 'tamu': '245',
    'florida': '57', 'gators': '57',
    'tennessee': '2633', 'volunteers': '2633', 'vols': '2633',
    'vanderbilt': '238', 'commodores': '238',
    'arkansas': '8', 'razorbacks': '8',
    'ole miss': '145', 'rebels': '145',
    'georgia': '61', 'bulldogs': '61',
    'wake forest': '154', 'demon deacons': '154',
    'virginia': '258', 'cavaliers': '258',
    'oregon state': '204', 'beavers': '204',
    'stanford': '24', 'cardinal': '24',
    'clemson': '228',
    'florida state': '52', 'seminoles': '52',
    'nc state': '152', 'wolfpack': '152',
    'miami': '2390',
    'tcu': '2628', 'horned frogs': '2628'
  };
  return teamIds[teamName.toLowerCase()] || null;
}

function getFeaturedNCAABaseballGames() {
  // Season starts mid-February 2025
  return [
    { date: '2025-02-14', name: 'Opening Day', opponent: 'Season Opener', homeAway: 'home', venue: 'Various' },
    { date: '2025-02-14', name: 'Texas vs. Rice', opponent: 'Rice', homeAway: 'home', venue: 'UFCU Disch-Falk Field' },
    { date: '2025-02-21', name: 'Shriners Classic', opponent: 'Multiple Teams', homeAway: 'neutral', venue: 'Minute Maid Park' },
    { date: '2025-02-28', name: 'Round Rock Classic', opponent: 'Multiple Teams', homeAway: 'neutral', venue: 'Dell Diamond' },
    { date: '2025-03-07', name: 'SEC Opening Weekend', opponent: 'Conference Play Begins', homeAway: 'neutral', venue: 'Various' }
  ];
}

// === AUTH HANDLER FUNCTIONS ===

async function handleRegister(request, env, corsHeaders) {
  try {
    const { email, password, name } = await request.json();

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

    // Create user with name (username uses email for legacy schema compatibility)
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, username, subscription_tier, subscription_status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), passwordHash, name || null, email.toLowerCase(), 'free', 'active').run();

    // Create session
    const sessionToken = await createSession(env, userId);

    return jsonResponse(
      { success: true, user: { id: userId, email: email.toLowerCase(), name: name || null, subscription_tier: 'free' } },
      201,
      corsHeaders,
      sessionToken
    );
  } catch (error) {
    console.error('Register error:', error);
    return jsonResponse({ error: 'Registration failed: ' + error.message }, 500, corsHeaders);
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

// Serve tool HTML with subscription check and soft paywall
async function serveToolAsset(env, key, contentType, corsHeaders, request) {
  const asset = await env.ASSETS.get(key);
  if (!asset) {
    return new Response('Tool not found', { status: 404 });
  }

  // Get user session for subscription check (tools may have tiered access)
  const session = await getSession(request, env);
  let subscriptionTier = 'free';
  let isLoggedIn = false;

  if (session) {
    isLoggedIn = true;
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(session.userId).first();
    subscriptionTier = user?.subscription_tier || 'free';
  }

  // Determine if this is a Pro tool
  const proTools = ['composition-optimizer', '3d-showcase', 'draft-value', 'schedule-strength', 'vision-coach'];
  const toolName = key.split('/').slice(-2, -1)[0] || '';
  const isProTool = proTools.includes(toolName);
  const hasProAccess = subscriptionTier === 'pro' || subscriptionTier === 'enterprise';

  // Generate soft paywall script (all values are server-controlled, no user input)
  const paywallScript = generatePaywallScript(subscriptionTier, isLoggedIn, isProTool, hasProAccess);

  // Inject subscription tier and paywall system into HTML
  let html = await asset.text();
  html = html.replace('</head>', paywallScript + '</head>');

  return new Response(html, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'no-cache',
      ...corsHeaders
    }
  });
}

// Generate soft paywall script with server-controlled values only
function generatePaywallScript(tier, loggedIn, isProTool, hasAccess) {
  return `
<script>
window.BSI_USER_TIER = "${tier}";
window.BSI_LOGGED_IN = ${loggedIn};
window.BSI_IS_PRO_TOOL = ${isProTool};
window.BSI_HAS_PRO_ACCESS = ${hasAccess};

(function() {
  var FREE_USES = 3;
  var STORAGE_KEY = 'bsi_tool_uses';
  if (window.BSI_HAS_PRO_ACCESS || !window.BSI_IS_PRO_TOOL) return;
  var uses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  var toolKey = window.location.pathname;
  uses[toolKey] = (uses[toolKey] || 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uses));
  var currentUses = uses[toolKey];
  var remaining = Math.max(0, FREE_USES - currentUses);
  if (currentUses > FREE_USES) {
    setTimeout(function() { BSI.showPaywall(window.BSI_LOGGED_IN); }, 1500);
  } else if (remaining <= 2 && remaining > 0) {
    BSI.showNotice(remaining);
  }
})();

window.BSI = window.BSI || {};
BSI.showNotice = function(remaining) {
  var notice = document.createElement('div');
  notice.id = 'bsi-notice';
  notice.style.cssText = 'position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#1A1A1A,#2A2A2A);border:1px solid rgba(191,87,0,0.3);border-radius:12px;padding:16px 20px;max-width:320px;z-index:9998;font-family:-apple-system,sans-serif;animation:bsiSlide 0.3s ease';
  var style = document.createElement('style');
  style.textContent = '@keyframes bsiSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(style);
  var p = document.createElement('p');
  p.style.cssText = 'color:#F5F5F0;font-size:14px;margin:0 0 12px';
  p.appendChild(document.createElement('strong')).textContent = remaining + ' free use' + (remaining === 1 ? '' : 's') + ' remaining.';
  p.appendChild(document.createTextNode(' Upgrade to Pro for unlimited access.'));
  var a = document.createElement('a');
  a.href = '/pricing';
  a.style.cssText = 'display:inline-block;padding:8px 16px;background:linear-gradient(135deg,#BF5700,#FF6B35);border-radius:6px;color:white;text-decoration:none;font-size:13px;font-weight:600';
  a.textContent = 'View Plans →';
  var btn = document.createElement('button');
  btn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;color:#6B7280;cursor:pointer;font-size:18px';
  btn.textContent = '×';
  btn.onclick = function() { notice.remove(); };
  notice.appendChild(btn);
  notice.appendChild(p);
  notice.appendChild(a);
  document.body.appendChild(notice);
  setTimeout(function() { if (notice.parentNode) notice.remove(); }, 10000);
};

BSI.showPaywall = function(loggedIn) {
  var overlay = document.createElement('div');
  overlay.id = 'bsi-paywall';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:bsiFade 0.3s ease';
  var style = document.createElement('style');
  style.textContent = '@keyframes bsiFade{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);
  var content = document.createElement('div');
  content.style.cssText = 'background:linear-gradient(135deg,#1A1A1A,#0D0D0D);border:1px solid rgba(191,87,0,0.4);border-radius:16px;padding:40px;max-width:480px;text-align:center;font-family:-apple-system,sans-serif';
  var icon = document.createElement('div');
  icon.style.cssText = 'font-size:48px;margin-bottom:20px';
  icon.textContent = '🔐';
  var title = document.createElement('h2');
  title.style.cssText = 'color:#F5F5F0;font-size:24px;font-weight:700;margin:0 0 12px';
  title.textContent = 'Unlock Pro Tools';
  var desc = document.createElement('p');
  desc.style.cssText = 'color:#9CA3AF;font-size:15px;line-height:1.6;margin:0 0 24px';
  desc.textContent = "You've used your 3 free sessions. Upgrade to Pro for unlimited access.";
  var price = document.createElement('div');
  price.style.cssText = 'color:#BF5700;font-size:32px;font-weight:700;margin-bottom:4px';
  price.textContent = '$29';
  var perMonth = document.createElement('span');
  perMonth.style.cssText = 'font-size:16px;color:#6B7280;font-weight:400';
  perMonth.textContent = '/month';
  price.appendChild(perMonth);
  var features = ['Unlimited Monte Carlo simulations','100,000 iteration limit (vs 1,000 free)','Advanced 3D visualizations','Priority data access','Export & share capabilities'];
  var ul = document.createElement('ul');
  ul.style.cssText = 'text-align:left;margin:0 0 28px;padding:0;list-style:none';
  features.forEach(function(f) {
    var li = document.createElement('li');
    li.style.cssText = 'color:#D1D5DB;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px';
    var check = document.createElement('span');
    check.style.cssText = 'color:#10B981;font-weight:bold';
    check.textContent = '✓';
    li.appendChild(check);
    li.appendChild(document.createTextNode(f));
    ul.appendChild(li);
  });
  var cta = document.createElement('a');
  cta.href = '/pricing';
  cta.style.cssText = 'display:block;width:100%;padding:14px 24px;background:linear-gradient(135deg,#BF5700,#FF6B35);border:none;border-radius:10px;color:white;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:16px;text-decoration:none;box-sizing:border-box';
  cta.textContent = 'Upgrade to Pro';
  // Email capture section
  var divider = document.createElement('div');
  divider.style.cssText = 'display:flex;align-items:center;gap:12px;margin:16px 0;color:#6B7280;font-size:12px';
  var line1 = document.createElement('div');
  line1.style.cssText = 'flex:1;height:1px;background:rgba(255,255,255,0.1)';
  var orText = document.createElement('span');
  orText.textContent = 'or get notified of deals';
  var line2 = document.createElement('div');
  line2.style.cssText = 'flex:1;height:1px;background:rgba(255,255,255,0.1)';
  divider.appendChild(line1);
  divider.appendChild(orText);
  divider.appendChild(line2);
  var emailForm = document.createElement('div');
  emailForm.id = 'bsi-email-form';
  emailForm.style.cssText = 'display:flex;gap:8px;margin-bottom:16px';
  var emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'Enter your email';
  emailInput.style.cssText = 'flex:1;padding:12px 16px;background:#2A2A2A;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#F5F5F0;font-size:14px;outline:none';
  var emailBtn = document.createElement('button');
  emailBtn.type = 'button';
  emailBtn.textContent = 'Notify Me';
  emailBtn.style.cssText = 'padding:12px 20px;background:#374151;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer';
  emailBtn.onclick = function() {
    var email = emailInput.value.trim();
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      emailInput.style.borderColor = '#EF4444';
      return;
    }
    emailBtn.disabled = true;
    emailBtn.textContent = '...';
    fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, source: 'paywall', tool: window.location.pathname })
    }).then(function(r) { return r.json(); }).then(function(data) {
      emailForm.style.display = 'none';
      var thanks = document.createElement('p');
      thanks.style.cssText = 'color:#10B981;font-size:14px;margin:0 0 16px';
      thanks.textContent = '✓ Thanks! We\\'ll notify you of deals and new features.';
      emailForm.parentNode.insertBefore(thanks, emailForm.nextSibling);
    }).catch(function() {
      emailBtn.disabled = false;
      emailBtn.textContent = 'Try Again';
    });
  };
  emailForm.appendChild(emailInput);
  emailForm.appendChild(emailBtn);
  var secondary = document.createElement('p');
  secondary.style.cssText = 'color:#6B7280;font-size:13px;margin:0';
  if (!loggedIn) {
    var signin = document.createElement('a');
    signin.href = '/login';
    signin.style.cssText = 'color:#FF6B35;text-decoration:none';
    signin.textContent = 'Sign in';
    secondary.appendChild(signin);
    secondary.appendChild(document.createTextNode(' if you have a subscription. '));
  }
  var home = document.createElement('a');
  home.href = '/';
  home.style.cssText = 'color:#FF6B35;text-decoration:none';
  home.textContent = 'Return to home';
  secondary.appendChild(home);
  content.appendChild(icon);
  content.appendChild(title);
  content.appendChild(desc);
  content.appendChild(price);
  content.appendChild(ul);
  content.appendChild(cta);
  content.appendChild(divider);
  content.appendChild(emailForm);
  content.appendChild(secondary);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
};
</script>`;
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
    if (env.ANALYTICS_KV) {
      const key = `event:${Date.now()}:${crypto.randomUUID()}`;
      await env.ANALYTICS_KV.put(key, JSON.stringify(enrichedEvent), {
        expirationTtl: 86400 * 7 // 7 days
      });
    }

    // Log to Cloudflare Analytics Engine (if bound)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [event.event, event.properties?.tool || 'unknown', enrichedEvent.country || 'unknown'],
        doubles: [1], // event count
        indexes: [event.event]
      });
    }

    // Always return success (analytics should never block)
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    // Fail silently for analytics - return success anyway
    return jsonResponse({ success: true }, 200, corsHeaders);
  }
}

// === TOOL LAUNCH ANALYTICS HANDLER ===
async function handleToolLaunchAnalytics(request, env, corsHeaders) {
  try {
    var body = await request.text();
    var data = JSON.parse(body);

    // Validate required fields
    if (!data.tool) {
      return jsonResponse({ error: 'Missing tool name' }, 400, corsHeaders);
    }

    var toolEvent = {
      event: 'tool_launch',
      tool: data.tool,
      tier: data.tier || 'unknown',
      timestamp: data.timestamp || new Date().toISOString(),
      serverTimestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.headers.get('CF-IPCountry'),
      ray: request.headers.get('CF-Ray'),
    };

    // Store in KV for analysis
    if (env.ANALYTICS_KV) {
      var key = 'tool:' + Date.now() + ':' + crypto.randomUUID();
      await env.ANALYTICS_KV.put(key, JSON.stringify(toolEvent), {
        expirationTtl: 86400 * 30 // 30 days for tool analytics
      });
    }

    // Log to Analytics Engine with tool-specific indexing
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['tool_launch', data.tool, data.tier || 'unknown', toolEvent.country || 'unknown'],
        doubles: [1],
        indexes: ['tool_launch', data.tool]
      });
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    // Fail silently
    return jsonResponse({ success: true }, 200, corsHeaders);
  }
}

// === LEAD CAPTURE HANDLER (paywall email collection) ===
async function handleLeadCapture(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, source, tool } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400, corsHeaders);
    }

    // Store lead in D1
    const leadId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO leads (id, email, source, tool, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(email) DO UPDATE SET
        source = excluded.source,
        tool = excluded.tool,
        updated_at = datetime('now')
    `).bind(leadId, email.toLowerCase(), source || 'paywall', tool || 'unknown').run();

    // Log to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['lead_capture', source || 'paywall', tool || 'unknown'],
        doubles: [1],
        indexes: ['lead_capture']
      });
    }

    return jsonResponse({ success: true, message: 'Thanks! We\'ll be in touch.' }, 200, corsHeaders);
  } catch (e) {
    console.error('Lead capture error:', e);
    return jsonResponse({ error: 'Failed to save email' }, 500, corsHeaders);
  }
}

// === NEWSLETTER SUBSCRIPTION HANDLER ===
async function handleNewsletterSubscribe(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, source } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Please enter a valid email address' }, 400, corsHeaders);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Store in D1 newsletter_subscribers table
    const subscriberId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO newsletter_subscribers (id, email, source, subscribed_at, status)
      VALUES (?, ?, ?, datetime('now'), 'active')
      ON CONFLICT(email) DO UPDATE SET
        status = 'active',
        resubscribed_at = datetime('now')
    `).bind(subscriberId, normalizedEmail, source || 'footer').run();

    // Log to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['newsletter_subscribe', source || 'footer'],
        doubles: [1],
        indexes: ['newsletter']
      });
    }

    return jsonResponse({
      success: true,
      message: 'Welcome to the Blaze! Check your inbox for updates.'
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Newsletter subscribe error:', e);
    // Check for unique constraint violation (already subscribed)
    if (e.message && e.message.includes('UNIQUE constraint')) {
      return jsonResponse({
        success: true,
        message: 'You\'re already subscribed! We appreciate your enthusiasm.'
      }, 200, corsHeaders);
    }
    return jsonResponse({ error: 'Failed to subscribe. Please try again.' }, 500, corsHeaders);
  }
}

// === SEARCH API HANDLER ===

/**
 * @typedef {Object} SearchResult
 * @property {string} type - 'team' | 'page' | 'tool' | 'stat'
 * @property {string} name - Display name
 * @property {string} url - URL to navigate
 * @property {string} [icon] - Icon type
 * @property {string} [sport] - Sport category
 * @property {number} score - Relevance score
 */

/**
 * Search teams, pages, tools, and stats
 * KV-backed with fallback to hardcoded index
 * @param {Request} request
 * @param {Object} env
 * @param {Object} corsHeaders
 * @returns {Promise<Response>}
 */
async function handleSearch(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').toLowerCase().trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const type = url.searchParams.get('type'); // Filter by type

    if (!query || query.length < 2) {
      return jsonResponse({ results: [], query }, 200, corsHeaders);
    }

    // Fetch search index from KV with fallback to hardcoded
    const searchIndex = await getSearchIndexFromKV(env);

    // Filter and score results
    const results = searchIndex
      .filter(item => {
        if (type && item.type !== type) return false;
        const searchText = `${item.name} ${item.keywords || ''} ${item.sport || ''}`.toLowerCase();
        return searchText.includes(query);
      })
      .map(item => {
        // Calculate relevance score
        let score = 0;
        const name = item.name.toLowerCase();
        if (name === query) score = 100;
        else if (name.startsWith(query)) score = 80;
        else if (name.includes(query)) score = 60;
        else score = 40;

        // Boost teams
        if (item.type === 'team') score += 10;

        return { ...item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache the response for 5 minutes
    return jsonResponse(
      { results, query, count: results.length },
      200,
      {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300'
      }
    );
  } catch (e) {
    console.error('Search error:', e);
    return jsonResponse({ error: 'Search failed', results: [] }, 500, corsHeaders);
  }
}

/**
 * Get search index - combines teams, pages, and tools
 * @returns {Array<Object>}
 */
function getSearchIndex() {
  return [
    // MLB Teams
    { type: 'team', name: 'St. Louis Cardinals', url: '/mlb?team=STL', icon: 'team', sport: 'MLB', keywords: 'cardinals stl redbirds' },
    { type: 'team', name: 'Houston Astros', url: '/mlb?team=HOU', icon: 'team', sport: 'MLB', keywords: 'astros houston' },
    { type: 'team', name: 'Texas Rangers', url: '/mlb?team=TEX', icon: 'team', sport: 'MLB', keywords: 'rangers texas arlington' },
    { type: 'team', name: 'New York Yankees', url: '/mlb?team=NYY', icon: 'team', sport: 'MLB', keywords: 'yankees ny bronx bombers' },
    { type: 'team', name: 'Los Angeles Dodgers', url: '/mlb?team=LAD', icon: 'team', sport: 'MLB', keywords: 'dodgers la los angeles' },
    { type: 'team', name: 'Atlanta Braves', url: '/mlb?team=ATL', icon: 'team', sport: 'MLB', keywords: 'braves atlanta' },

    // NFL Teams
    { type: 'team', name: 'Tennessee Titans', url: '/nfl?team=TEN', icon: 'team', sport: 'NFL', keywords: 'titans tennessee nashville' },
    { type: 'team', name: 'Dallas Cowboys', url: '/nfl?team=DAL', icon: 'team', sport: 'NFL', keywords: 'cowboys dallas americas team' },
    { type: 'team', name: 'Houston Texans', url: '/nfl?team=HOU', icon: 'team', sport: 'NFL', keywords: 'texans houston' },
    { type: 'team', name: 'Kansas City Chiefs', url: '/nfl?team=KC', icon: 'team', sport: 'NFL', keywords: 'chiefs kansas city kc' },

    // NBA Teams
    { type: 'team', name: 'Memphis Grizzlies', url: '/nba?team=MEM', icon: 'team', sport: 'NBA', keywords: 'grizzlies memphis grizz' },
    { type: 'team', name: 'San Antonio Spurs', url: '/nba?team=SAS', icon: 'team', sport: 'NBA', keywords: 'spurs san antonio' },
    { type: 'team', name: 'Houston Rockets', url: '/nba?team=HOU', icon: 'team', sport: 'NBA', keywords: 'rockets houston' },
    { type: 'team', name: 'Dallas Mavericks', url: '/nba?team=DAL', icon: 'team', sport: 'NBA', keywords: 'mavericks mavs dallas luka' },

    // College Baseball
    { type: 'team', name: 'Texas Longhorns Baseball', url: '/college-baseball?team=texas', icon: 'team', sport: 'NCAA', keywords: 'texas longhorns ut austin hook em' },
    { type: 'team', name: 'Texas A&M Aggies Baseball', url: '/college-baseball?team=tamu', icon: 'team', sport: 'NCAA', keywords: 'aggies tamu texas am college station' },
    { type: 'team', name: 'LSU Tigers Baseball', url: '/college-baseball?team=lsu', icon: 'team', sport: 'NCAA', keywords: 'lsu tigers louisiana geaux' },
    { type: 'team', name: 'Florida Gators Baseball', url: '/college-baseball?team=florida', icon: 'team', sport: 'NCAA', keywords: 'florida gators' },
    { type: 'team', name: 'Vanderbilt Commodores Baseball', url: '/college-baseball?team=vanderbilt', icon: 'team', sport: 'NCAA', keywords: 'vandy vanderbilt commodores' },

    // Pages
    { type: 'page', name: 'Live Scores', url: '/#live-scores', icon: 'page', keywords: 'scores live games today' },
    { type: 'page', name: 'MLB Scores', url: '/mlb', icon: 'page', sport: 'MLB', keywords: 'mlb baseball scores standings' },
    { type: 'page', name: 'NFL Scores', url: '/nfl', icon: 'page', sport: 'NFL', keywords: 'nfl football scores standings' },
    { type: 'page', name: 'NBA Scores', url: '/nba', icon: 'page', sport: 'NBA', keywords: 'nba basketball scores standings' },
    { type: 'page', name: 'College Baseball', url: '/college-baseball', icon: 'page', sport: 'NCAA', keywords: 'ncaa college baseball d1' },
    { type: 'page', name: 'Pricing', url: '/pricing', icon: 'page', keywords: 'pricing pro subscription plans cost' },
    { type: 'page', name: 'About Us', url: '/about', icon: 'page', keywords: 'about story founder austin' },
    { type: 'page', name: 'Dashboard', url: '/dashboard', icon: 'page', keywords: 'dashboard account profile settings' },

    // Pro Tools
    { type: 'tool', name: 'Pitch Arsenal Analyzer', url: '/tools/pitch-arsenal', icon: 'tool', keywords: 'pitch arsenal analyzer spin rate velocity' },
    { type: 'tool', name: 'Player Comparison', url: '/tools/player-comparison', icon: 'tool', keywords: 'compare players stats head to head' },
    { type: 'tool', name: 'Strike Zone Heatmap', url: '/tools/strike-zone', icon: 'tool', keywords: 'strike zone heatmap pitching location' },
    { type: 'tool', name: 'Spray Chart', url: '/tools/spray-chart', icon: 'tool', keywords: 'spray chart hitting batted ball' },
    { type: 'tool', name: 'NIL Valuation Calculator', url: '/tools/nil-valuation', icon: 'tool', keywords: 'nil name image likeness value calculator' },
    { type: 'tool', name: 'Draft Value Calculator', url: '/tools/draft-value', icon: 'tool', keywords: 'draft value trade calculator picks' },
    { type: 'tool', name: 'Schedule Strength', url: '/tools/schedule-strength', icon: 'tool', keywords: 'schedule strength sos rpi ranking' },
    { type: 'tool', name: 'Prospect Tracker', url: '/tools/prospect-tracker', icon: 'tool', keywords: 'prospect tracker top 100 draft' },
    { type: 'tool', name: 'Recruiting Tracker', url: '/tools/recruiting-tracker', icon: 'tool', keywords: 'recruiting commits class rankings' },
    { type: 'tool', name: '3D Showcase', url: '/tools/3d-showcase', icon: 'tool', keywords: '3d visualization batting swing' }
  ];
}

/**
 * Get search index from KV with fallback to hardcoded
 * @param {Object} env - Worker environment bindings
 * @returns {Promise<Array<Object>>}
 */
async function getSearchIndexFromKV(env) {
  const KV_KEY = 'search:index';

  try {
    // Try to get from KV first
    const cached = await env.SPORT_CACHE.get(KV_KEY, { type: 'json' });
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (e) {
    console.error('KV read error for search index:', e);
  }

  // Fallback to hardcoded index
  return getSearchIndex();
}

/**
 * Initialize or update the search index in KV
 * POST /api/search/index - Refreshes the KV cache with latest index
 * @param {Request} request
 * @param {Object} env
 * @param {Object} corsHeaders
 * @returns {Promise<Response>}
 */
async function handleSearchIndexRefresh(request, env, corsHeaders) {
  try {
    // Optional: Add admin auth check here
    // const authHeader = request.headers.get('X-Admin-Key');
    // if (authHeader !== env.ADMIN_KEY) return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);

    const KV_KEY = 'search:index';
    const searchIndex = getSearchIndex();

    // Store in KV with 24-hour TTL (auto-refresh daily)
    await env.SPORT_CACHE.put(KV_KEY, JSON.stringify(searchIndex), {
      expirationTtl: 86400 // 24 hours
    });

    return jsonResponse({
      success: true,
      message: 'Search index refreshed',
      count: searchIndex.length,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Search index refresh error:', e);
    return jsonResponse({ error: 'Failed to refresh search index' }, 500, corsHeaders);
  }
}

/**
 * Add items to the search index dynamically
 * POST /api/search/index/add - Add new items without redeploying
 * @param {Request} request
 * @param {Object} env
 * @param {Object} corsHeaders
 * @returns {Promise<Response>}
 */
async function handleSearchIndexAdd(request, env, corsHeaders) {
  try {
    const KV_KEY = 'search:index';
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return jsonResponse({ error: 'Missing items array' }, 400, corsHeaders);
    }

    // Validate items have required fields
    const validItems = body.items.filter(item =>
      item.type && item.name && item.url
    );

    if (validItems.length === 0) {
      return jsonResponse({ error: 'No valid items provided' }, 400, corsHeaders);
    }

    // Get current index
    let currentIndex = await getSearchIndexFromKV(env);

    // Merge new items (avoid duplicates by URL)
    const existingUrls = new Set(currentIndex.map(i => i.url));
    const newItems = validItems.filter(i => !existingUrls.has(i.url));

    const updatedIndex = [...currentIndex, ...newItems];

    // Store updated index
    await env.SPORT_CACHE.put(KV_KEY, JSON.stringify(updatedIndex), {
      expirationTtl: 86400
    });

    return jsonResponse({
      success: true,
      added: newItems.length,
      total: updatedIndex.length,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Search index add error:', e);
    return jsonResponse({ error: 'Failed to add items to search index' }, 500, corsHeaders);
  }
}

// === FAVORITES SYNC HANDLERS ===

/**
 * Sync favorites from localStorage to KV for logged-in users
 * @param {Request} request
 * @param {Object} env
 * @param {Object} corsHeaders
 * @returns {Promise<Response>}
 */
async function handleFavoritesSync(request, env, corsHeaders) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token, env);
    if (!user) {
      return jsonResponse({ error: 'Invalid token' }, 401, corsHeaders);
    }

    const body = await request.json();
    const { favorites } = body;

    if (!Array.isArray(favorites)) {
      return jsonResponse({ error: 'Invalid favorites format' }, 400, corsHeaders);
    }

    // Validate and sanitize favorites (max 50 teams)
    const validFavorites = favorites
      .filter(f => typeof f === 'string' && f.length < 100)
      .slice(0, 50);

    // Store in KV with user ID as key
    const kvKey = `favorites:${user.id}`;
    await env.BSI_KV.put(kvKey, JSON.stringify({
      teams: validFavorites,
      updatedAt: new Date().toISOString()
    }), {
      expirationTtl: 60 * 60 * 24 * 365 // 1 year
    });

    return jsonResponse({
      success: true,
      count: validFavorites.length,
      synced: validFavorites
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Favorites sync error:', e);
    return jsonResponse({ error: 'Sync failed' }, 500, corsHeaders);
  }
}

/**
 * Get user favorites from KV
 * @param {Request} request
 * @param {Object} env
 * @param {Object} corsHeaders
 * @returns {Promise<Response>}
 */
async function handleGetFavorites(request, env, corsHeaders) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token, env);
    if (!user) {
      return jsonResponse({ error: 'Invalid token' }, 401, corsHeaders);
    }

    // Get from KV
    const kvKey = `favorites:${user.id}`;
    const stored = await env.BSI_KV.get(kvKey, { type: 'json' });

    if (!stored) {
      return jsonResponse({ teams: [], updatedAt: null }, 200, corsHeaders);
    }

    return jsonResponse(stored, 200, corsHeaders);
  } catch (e) {
    console.error('Get favorites error:', e);
    return jsonResponse({ error: 'Failed to retrieve favorites', teams: [] }, 500, corsHeaders);
  }
}

// === PUSH NOTIFICATIONS HANDLERS ===

/**
 * Return VAPID public key for client-side push subscription
 */
async function handleGetVapidKey(env, corsHeaders) {
  // Public key is safe to expose - it's meant for the client
  const publicKey = env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return jsonResponse({ error: 'Push notifications not configured' }, 500, corsHeaders);
  }
  return jsonResponse({ publicKey }, 200, corsHeaders);
}

/**
 * Save push subscription to D1
 */
async function handlePushSubscribe(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { subscription, preferences } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return jsonResponse({ error: 'Invalid subscription object' }, 400, corsHeaders);
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return jsonResponse({ error: 'Missing subscription keys' }, 400, corsHeaders);
    }

    // Default preferences
    const teams = preferences?.teams ? JSON.stringify(preferences.teams) : null;
    const sports = preferences?.sports ? JSON.stringify(preferences.sports) : JSON.stringify(['nfl', 'nba', 'mlb']);
    const notifyScores = preferences?.notifyScores !== false ? 1 : 0;
    const notifyLineups = preferences?.notifyLineups !== false ? 1 : 0;
    const notifyOdds = preferences?.notifyOdds === true ? 1 : 0;

    // Upsert subscription
    await env.DB.prepare(`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth, teams, sports, notify_scores, notify_lineups, notify_odds, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        teams = excluded.teams,
        sports = excluded.sports,
        notify_scores = excluded.notify_scores,
        notify_lineups = excluded.notify_lineups,
        notify_odds = excluded.notify_odds,
        updated_at = datetime('now')
    `).bind(endpoint, p256dh, auth, teams, sports, notifyScores, notifyLineups, notifyOdds).run();

    // Log to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['push_subscribe', sports],
        doubles: [1],
        indexes: ['push_subscribe']
      });
    }

    return jsonResponse({ success: true, message: 'Subscribed to notifications' }, 200, corsHeaders);
  } catch (e) {
    console.error('Push subscribe error:', e);
    return jsonResponse({ error: 'Failed to save subscription' }, 500, corsHeaders);
  }
}

/**
 * Remove push subscription from D1
 */
async function handlePushUnsubscribe(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return jsonResponse({ error: 'Missing endpoint' }, 400, corsHeaders);
    }

    await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();

    // Log to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['push_unsubscribe'],
        doubles: [1],
        indexes: ['push_unsubscribe']
      });
    }

    return jsonResponse({ success: true, message: 'Unsubscribed from notifications' }, 200, corsHeaders);
  } catch (e) {
    console.error('Push unsubscribe error:', e);
    return jsonResponse({ error: 'Failed to remove subscription' }, 500, corsHeaders);
  }
}

/**
 * Update push subscription preferences
 */
async function handlePushPreferences(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { endpoint, preferences } = body;

    if (!endpoint) {
      return jsonResponse({ error: 'Missing endpoint' }, 400, corsHeaders);
    }

    const teams = preferences?.teams ? JSON.stringify(preferences.teams) : null;
    const sports = preferences?.sports ? JSON.stringify(preferences.sports) : null;
    const notifyScores = preferences?.notifyScores !== undefined ? (preferences.notifyScores ? 1 : 0) : null;
    const notifyLineups = preferences?.notifyLineups !== undefined ? (preferences.notifyLineups ? 1 : 0) : null;
    const notifyOdds = preferences?.notifyOdds !== undefined ? (preferences.notifyOdds ? 1 : 0) : null;

    // Build dynamic update query
    const updates = [];
    const values = [];
    if (teams !== null) { updates.push('teams = ?'); values.push(teams); }
    if (sports !== null) { updates.push('sports = ?'); values.push(sports); }
    if (notifyScores !== null) { updates.push('notify_scores = ?'); values.push(notifyScores); }
    if (notifyLineups !== null) { updates.push('notify_lineups = ?'); values.push(notifyLineups); }
    if (notifyOdds !== null) { updates.push('notify_odds = ?'); values.push(notifyOdds); }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No preferences to update' }, 400, corsHeaders);
    }

    updates.push('updated_at = datetime("now")');
    values.push(endpoint);

    await env.DB.prepare(
      `UPDATE push_subscriptions SET ${updates.join(', ')} WHERE endpoint = ?`
    ).bind(...values).run();

    return jsonResponse({ success: true, message: 'Preferences updated' }, 200, corsHeaders);
  } catch (e) {
    console.error('Push preferences error:', e);
    return jsonResponse({ error: 'Failed to update preferences' }, 500, corsHeaders);
  }
}

/**
 * Get current subscription preferences
 */
async function handleGetPushPreferences(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
      return jsonResponse({ error: 'Missing endpoint parameter' }, 400, corsHeaders);
    }

    const sub = await env.DB.prepare(
      'SELECT teams, sports, notify_scores, notify_lineups, notify_odds FROM push_subscriptions WHERE endpoint = ?'
    ).bind(endpoint).first();

    if (!sub) {
      return jsonResponse({ error: 'Subscription not found' }, 404, corsHeaders);
    }

    return jsonResponse({
      teams: sub.teams ? JSON.parse(sub.teams) : [],
      sports: sub.sports ? JSON.parse(sub.sports) : ['nfl', 'nba', 'mlb'],
      notifyScores: !!sub.notify_scores,
      notifyLineups: !!sub.notify_lineups,
      notifyOdds: !!sub.notify_odds
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Get preferences error:', e);
    return jsonResponse({ error: 'Failed to get preferences' }, 500, corsHeaders);
  }
}

// === WEB PUSH SENDER (Cloudflare Workers Native Implementation) ===

/**
 * Base64URL encode a buffer
 */
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode to Uint8Array
 */
function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

/**
 * Import VAPID private key for signing
 */
async function importVapidPrivateKey(base64PrivateKey) {
  const privateKeyBytes = base64UrlDecode(base64PrivateKey);

  // Create JWK for P-256 private key
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(privateKeyBytes.slice(0, 32)),
    y: base64UrlEncode(privateKeyBytes.slice(32, 64)),
    d: base64UrlEncode(privateKeyBytes)
  };

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/**
 * Create VAPID JWT for authorization
 */
async function createVapidJwt(audience, subject, privateKey) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400, // 24 hours
    sub: subject
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

/**
 * Send a push notification to a single subscription
 */
async function sendPushNotification(subscription, payload, env) {
  try {
    const endpoint = subscription.endpoint;
    const audience = new URL(endpoint).origin;

    // Import private key and create JWT
    const privateKey = await importVapidPrivateKey(env.VAPID_PRIVATE_KEY);
    const jwt = await createVapidJwt(audience, env.VAPID_SUBJECT, privateKey);

    // Prepare headers
    const headers = {
      'Authorization': `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/json',
      'TTL': '86400'
    };

    // Send the notification (unencrypted for simplicity - works with most browsers)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, endpoint };
    } else if (response.status === 410 || response.status === 404) {
      // Subscription expired or invalid - remove from database
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
      return { success: false, expired: true, endpoint };
    } else {
      return { success: false, status: response.status, endpoint };
    }
  } catch (error) {
    console.error('Push send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notifications to all subscribers matching criteria
 */
async function broadcastNotification(env, notification, filters = {}) {
  let query = 'SELECT endpoint, p256dh, auth, teams, sports FROM push_subscriptions WHERE 1=1';
  const params = [];

  // Filter by notification type
  if (filters.type === 'score') {
    query += ' AND notify_scores = 1';
  } else if (filters.type === 'lineup') {
    query += ' AND notify_lineups = 1';
  } else if (filters.type === 'odds') {
    query += ' AND notify_odds = 1';
  }

  const subscriptions = await env.DB.prepare(query).bind(...params).all();

  if (!subscriptions.results || subscriptions.results.length === 0) {
    return { sent: 0, failed: 0, expired: 0 };
  }

  let sent = 0, failed = 0, expired = 0;

  // Filter by sport/team on client side for flexibility
  for (const sub of subscriptions.results) {
    // Check sport filter
    if (filters.sport) {
      const sports = sub.sports ? JSON.parse(sub.sports) : ['nfl', 'nba', 'mlb'];
      if (!sports.includes(filters.sport)) continue;
    }

    // Check team filter
    if (filters.team && sub.teams) {
      const teams = JSON.parse(sub.teams);
      if (teams.length > 0 && !teams.includes(filters.team)) continue;
    }

    const result = await sendPushNotification(sub, notification, env);
    if (result.success) sent++;
    else if (result.expired) expired++;
    else failed++;
  }

  console.log(`[PUSH] Broadcast complete: ${sent} sent, ${failed} failed, ${expired} expired`);
  return { sent, failed, expired };
}

/**
 * Check for score updates and send notifications
 */
async function checkAndNotifyScores(env, sport) {
  const cacheKey = `push:last_scores:${sport}`;
  const lastCheck = await env.SPORT_CACHE.get(cacheKey);
  const lastScores = lastCheck ? JSON.parse(lastCheck) : {};

  // Fetch current scores
  let scores = [];
  try {
    if (sport === 'nfl') {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`);
      const data = await res.json();
      scores = (data.events || []).map(e => ({
        id: e.id,
        status: e.status?.type?.state,
        home: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
        away: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')
      }));
    } else if (sport === 'nba') {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`);
      const data = await res.json();
      scores = (data.events || []).map(e => ({
        id: e.id,
        status: e.status?.type?.state,
        home: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
        away: e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')
      }));
    }
  } catch (e) {
    console.error(`[PUSH] Failed to fetch ${sport} scores:`, e);
    return;
  }

  // Check for newly completed games
  for (const game of scores) {
    if (game.status === 'post' && lastScores[game.id] !== 'post') {
      // Game just ended - send notification
      const homeName = game.home?.team?.shortDisplayName || game.home?.team?.abbreviation || 'Home';
      const awayName = game.away?.team?.shortDisplayName || game.away?.team?.abbreviation || 'Away';
      const homeScore = game.home?.score || '0';
      const awayScore = game.away?.score || '0';
      const winner = parseInt(homeScore) > parseInt(awayScore) ? homeName : awayName;

      await broadcastNotification(env, {
        title: `${sport.toUpperCase()} Final`,
        body: `${awayName} ${awayScore} - ${homeName} ${homeScore}`,
        icon: '/images/bsi-logo-192.png',
        badge: '/images/bsi-logo-96.png',
        tag: `score-${game.id}`,
        data: { url: `/${sport}/scores.html`, gameId: game.id }
      }, { sport, type: 'score' });
    }
  }

  // Update cache
  const newScores = {};
  scores.forEach(g => { newScores[g.id] = g.status; });
  await env.SPORT_CACHE.put(cacheKey, JSON.stringify(newScores), { expirationTtl: 3600 });
}

/**
 * Admin endpoint to send test notification
 */
async function handleTestNotification(request, env, corsHeaders) {
  // Simple admin check (in production, use proper auth)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  try {
    const body = await request.json();
    const { title, body: msgBody, sport, type } = body;

    const result = await broadcastNotification(env, {
      title: title || 'BSI Alert',
      body: msgBody || 'Test notification from Blaze Sports Intel',
      icon: '/images/bsi-logo-192.png',
      badge: '/images/bsi-logo-96.png',
      tag: `test-${Date.now()}`,
      data: { url: '/' }
    }, { sport, type });

    return jsonResponse(result, 200, corsHeaders);
  } catch (e) {
    console.error('Test notification error:', e);
    return jsonResponse({ error: 'Failed to send notification' }, 500, corsHeaders);
  }
}

// === VISION COACH API HANDLERS ===

/**
 * Get authenticated user from session cookie
 */
async function getAuthenticatedUser(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const sessionId = match[1];
  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(sessionId).first();

  if (!session) return null;

  const user = await env.DB.prepare(
    'SELECT id, email, name, subscription_tier FROM users WHERE id = ?'
  ).bind(session.user_id).first();

  return user;
}

/**
 * GET /api/vision-coach/sessions - List user's vision coach sessions
 */
async function handleGetVisionCoachSessions(request, env, corsHeaders) {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sessions = await env.DB.prepare(`
      SELECT id, date, duration, attractor, avg_presence, avg_stability, peak_presence,
             composite_score, composite_grade, presence_history, snapshots
      FROM vision_coach_sessions
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    // Parse JSON fields
    const parsed = sessions.results.map(s => ({
      ...s,
      presenceHistory: s.presence_history ? JSON.parse(s.presence_history) : [],
      snapshots: s.snapshots ? JSON.parse(s.snapshots) : [],
      avgPresence: s.avg_presence,
      avgStability: s.avg_stability,
      peakPresence: s.peak_presence,
      compositeScore: s.composite_score,
      compositeGrade: s.composite_grade
    }));

    return jsonResponse({ sessions: parsed, total: sessions.results.length }, 200, corsHeaders);
  } catch (e) {
    console.error('Vision Coach sessions error:', e);
    return jsonResponse({ error: 'Failed to load sessions' }, 500, corsHeaders);
  }
}

/**
 * POST /api/vision-coach/sessions - Save a new session
 */
async function handleSaveVisionCoachSession(request, env, corsHeaders) {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
    }

    // Check session limit for free tier
    if (user.subscription_tier === 'free' || !user.subscription_tier) {
      const count = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM vision_coach_sessions WHERE user_id = ?'
      ).bind(user.id).first();
      if (count.count >= 10) {
        return jsonResponse({ error: 'Free tier limited to 10 saved sessions. Upgrade to Pro for unlimited.' }, 403, corsHeaders);
      }
    }

    const body = await request.json();
    const sessionId = body.id || crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO vision_coach_sessions (
        id, user_id, date, duration, attractor, avg_presence, avg_stability, peak_presence,
        avg_pitch, avg_voice_energy, composite_score, composite_grade, presence_history, snapshots
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      user.id,
      body.date || new Date().toISOString(),
      body.duration || 0,
      body.attractor || 'Lorenz',
      body.avgPresence || 0,
      body.avgStability || 0,
      body.peakPresence || 0,
      body.avgPitch || 0,
      body.avgVoiceEnergy || 0,
      body.compositeScore || 0,
      body.compositeGrade || 'C',
      JSON.stringify(body.presenceHistory || []),
      JSON.stringify(body.snapshots || [])
    ).run();

    return jsonResponse({ success: true, id: sessionId }, 200, corsHeaders);
  } catch (e) {
    console.error('Vision Coach save session error:', e);
    return jsonResponse({ error: 'Failed to save session' }, 500, corsHeaders);
  }
}

/**
 * GET /api/vision-coach/challenges - Get user's completed challenges
 */
async function handleGetVisionCoachChallenges(request, env, corsHeaders) {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
    }

    const challenges = await env.DB.prepare(`
      SELECT challenge_id, completed_at, badge, xp
      FROM vision_coach_challenges
      WHERE user_id = ?
    `).bind(user.id).all();

    // Convert to object format matching frontend
    const challengeMap = {};
    challenges.results.forEach(c => {
      challengeMap[c.challenge_id] = {
        completedAt: c.completed_at,
        badge: c.badge,
        xp: c.xp
      };
    });

    return jsonResponse({ challenges: challengeMap }, 200, corsHeaders);
  } catch (e) {
    console.error('Vision Coach challenges error:', e);
    return jsonResponse({ error: 'Failed to load challenges' }, 500, corsHeaders);
  }
}

/**
 * POST /api/vision-coach/challenges - Save completed challenges
 */
async function handleSaveVisionCoachChallenges(request, env, corsHeaders) {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
    }

    const body = await request.json();
    const { challenges } = body;

    if (!challenges || typeof challenges !== 'object') {
      return jsonResponse({ error: 'Invalid challenges data' }, 400, corsHeaders);
    }

    // Upsert each challenge
    for (const [challengeId, data] of Object.entries(challenges)) {
      await env.DB.prepare(`
        INSERT INTO vision_coach_challenges (user_id, challenge_id, completed_at, badge, xp)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, challenge_id) DO UPDATE SET
          completed_at = excluded.completed_at,
          badge = excluded.badge,
          xp = excluded.xp
      `).bind(
        user.id,
        challengeId,
        data.completedAt || new Date().toISOString(),
        data.badge || 'bronze',
        data.xp || 0
      ).run();
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error('Vision Coach save challenges error:', e);
    return jsonResponse({ error: 'Failed to save challenges' }, 500, corsHeaders);
  }
}

/**
 * GET /api/vision-coach/stats - Get user's aggregate stats
 */
async function handleGetVisionCoachStats(request, env, corsHeaders) {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
    }

    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(duration) as total_duration,
        AVG(avg_presence) as avg_presence,
        MAX(peak_presence) as best_presence,
        AVG(composite_score) as avg_grade,
        MAX(date) as last_session
      FROM vision_coach_sessions
      WHERE user_id = ?
    `).bind(user.id).first();

    const challengeStats = await env.DB.prepare(`
      SELECT SUM(xp) as total_xp, COUNT(*) as completed_count
      FROM vision_coach_challenges
      WHERE user_id = ?
    `).bind(user.id).first();

    return jsonResponse({
      sessions: {
        total: stats.total_sessions || 0,
        totalMinutes: Math.round((stats.total_duration || 0) / 60),
        avgPresence: Math.round(stats.avg_presence || 0),
        bestPresence: Math.round(stats.best_presence || 0),
        avgGrade: Math.round(stats.avg_grade || 0),
        lastSession: stats.last_session
      },
      challenges: {
        completed: challengeStats.completed_count || 0,
        totalXP: challengeStats.total_xp || 0
      }
    }, 200, corsHeaders);
  } catch (e) {
    console.error('Vision Coach stats error:', e);
    return jsonResponse({ error: 'Failed to load stats' }, 500, corsHeaders);
  }
}

// === UNIFIED SCORES HANDLER ===
/**
 * Fetch all sports scores in one aggregated call
 * Returns normalized data for MLB, NFL, NBA, College Baseball, College Football
 */
async function handleUnifiedScores(env, corsHeaders) {
  const results = {
    mlb: [],
    nfl: [],
    nba: [],
    college_baseball: [],
    ncaaf: [],
    errors: [],
    fetchedAt: getChicagoTimestamp(),
    timezone: 'America/Chicago'
  };

  // Helper to normalize ESPN event data
  function normalizeESPNEvent(event, league) {
    const competition = event.competitions?.[0];
    const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
    const statusType = event.status?.type;
    const isLive = statusType?.state === 'in' || statusType?.name === 'STATUS_IN_PROGRESS';
    const isFinal = statusType?.state === 'post' || statusType?.completed;

    return {
      id: event.id,
      league: league,
      isLive: isLive,
      isFinal: isFinal,
      status: statusType?.shortDetail || statusType?.name || 'Unknown',
      startTime: event.date,
      period: event.status?.period || null,
      clock: event.status?.displayClock || null,
      away: {
        name: awayTeam?.team?.shortDisplayName || awayTeam?.team?.displayName || 'Away',
        abbreviation: awayTeam?.team?.abbreviation || 'AWY',
        score: parseInt(awayTeam?.score || 0),
        record: awayTeam?.records?.[0]?.summary || null
      },
      home: {
        name: homeTeam?.team?.shortDisplayName || homeTeam?.team?.displayName || 'Home',
        abbreviation: homeTeam?.team?.abbreviation || 'HME',
        score: parseInt(homeTeam?.score || 0),
        record: homeTeam?.records?.[0]?.summary || null
      }
    };
  }

  // Fetch all sources in parallel
  const fetchPromises = [
    // MLB from ESPN
    fetchWithRetry(`${ESPN_BASE}/baseball/mlb/scoreboard`)
      .then(r => r.json())
      .then(data => {
        if (data?.events) {
          results.mlb = data.events.map(e => normalizeESPNEvent(e, 'mlb'));
        }
      })
      .catch(e => results.errors.push({ league: 'mlb', error: e.message })),

    // NFL from ESPN
    fetchWithRetry(`${ESPN_BASE}/football/nfl/scoreboard`)
      .then(r => r.json())
      .then(data => {
        if (data?.events) {
          results.nfl = data.events.map(e => normalizeESPNEvent(e, 'nfl'));
        }
      })
      .catch(e => results.errors.push({ league: 'nfl', error: e.message })),

    // NBA from ESPN
    fetchWithRetry(`${ESPN_BASE}/basketball/nba/scoreboard`)
      .then(r => r.json())
      .then(data => {
        if (data?.events) {
          results.nba = data.events.map(e => normalizeESPNEvent(e, 'nba'));
        }
      })
      .catch(e => results.errors.push({ league: 'nba', error: e.message })),

    // College Baseball from ESPN
    fetchWithRetry(`${ESPN_BASE}/baseball/college-baseball/scoreboard`)
      .then(r => r.json())
      .then(data => {
        if (data?.events) {
          results.college_baseball = data.events.map(e => normalizeESPNEvent(e, 'college_baseball'));
        }
      })
      .catch(e => results.errors.push({ league: 'college_baseball', error: e.message })),

    // College Football from ESPN
    fetchWithRetry(`${ESPN_BASE}/football/college-football/scoreboard`)
      .then(r => r.json())
      .then(data => {
        if (data?.events) {
          results.ncaaf = data.events.map(e => normalizeESPNEvent(e, 'ncaaf'));
        }
      })
      .catch(e => results.errors.push({ league: 'ncaaf', error: e.message }))
  ];

  await Promise.allSettled(fetchPromises);

  // Summary stats
  const allGames = [...results.mlb, ...results.nfl, ...results.nba, ...results.college_baseball, ...results.ncaaf];
  results.summary = {
    total: allGames.length,
    live: allGames.filter(g => g.isLive).length,
    final: allGames.filter(g => g.isFinal).length,
    byLeague: {
      mlb: results.mlb.length,
      nfl: results.nfl.length,
      nba: results.nba.length,
      college_baseball: results.college_baseball.length,
      ncaaf: results.ncaaf.length
    }
  };

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=15',
      'X-Data-Source': 'ESPN',
      ...corsHeaders
    }
  });
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
