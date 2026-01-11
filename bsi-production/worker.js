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
 * @version 2.5.0
 * @updated 2025-01-11
 */

// Import constants from modules
import {
  SPORTSDATAIO_BASE,
  COLLEGEFOOTBALL_BASE,
  SPORTSRADAR_BASE,
  THEODDS_BASE,
  STRIPE_API_BASE,
  STRIPE_PRICES,
} from './src/workers/api/constants.js';

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

// Demo data generation counts
const STRIKE_ZONE_DEMO_PITCH_COUNT = 150;
const SPRAY_CHART_DEMO_BALL_COUNT = 200;

// Strike zone dimensions (feet from plate center, per MLB rulebook)
const STRIKE_ZONE = {
  LEFT: -0.708,   // plate width / 2
  RIGHT: 0.708,
  TOP: 3.5,       // typical knee-to-letters height
  BOTTOM: 1.5
};

/**
 * Handle diagnostics endpoint - validates data flow chain
 * GET /api/diagnostics/data-flow
 */
async function handleDiagnostics(request, env, corsHeaders, isCanary) {
  const startTime = Date.now();
  const diagnostics = {
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    canary: isCanary,
    worker: {
      status: 'ok',
      version: '2.5.0',
      responseTime: null
    },
    kv: {
      status: 'unknown',
      latency: null
    },
    d1: {
      status: 'unknown',
      latency: null
    },
    r2: {
      status: 'unknown',
      latency: null
    },
    api: {
      highlightly: { status: 'planned', note: 'Integration pending' },
      sportsDataIO: { status: 'unknown', latency: null },
      espn: { status: 'unknown', latency: null }
    }
  };

  // Test KV (BSI_SESSIONS)
  try {
    const kvStart = Date.now();
    await env.BSI_SESSIONS.get('__health_check__');
    diagnostics.kv.status = 'ok';
    diagnostics.kv.latency = Date.now() - kvStart;
  } catch (e) {
    diagnostics.kv.status = 'error';
    diagnostics.kv.error = e.message;
  }

  // Test D1 (BSI_GAME_DB)
  try {
    const d1Start = Date.now();
    await env.BSI_GAME_DB.prepare('SELECT 1').first();
    diagnostics.d1.status = 'ok';
    diagnostics.d1.latency = Date.now() - d1Start;
  } catch (e) {
    diagnostics.d1.status = 'error';
    diagnostics.d1.error = e.message;
  }

  // Test R2 (BSI_ASSETS)
  try {
    const r2Start = Date.now();
    const r2Test = await env.BSI_ASSETS.head('origin/index.html');
    diagnostics.r2.status = r2Test ? 'ok' : 'missing';
    diagnostics.r2.latency = Date.now() - r2Start;
  } catch (e) {
    diagnostics.r2.status = 'error';
    diagnostics.r2.error = e.message;
  }

  // Test SportsDataIO API (quick health check)
  try {
    const apiStart = Date.now();
    const apiKey = env.SPORTSDATAIO_API_KEY;
    if (apiKey) {
      const testUrl = 'https://api.sportsdata.io/v3/mlb/scores/json/AreAnyGamesInProgress';
      const resp = await fetch(testUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });
      diagnostics.api.sportsDataIO.status = resp.ok ? 'ok' : 'quota_exceeded';
      diagnostics.api.sportsDataIO.latency = Date.now() - apiStart;
    } else {
      diagnostics.api.sportsDataIO.status = 'no_key';
    }
  } catch (e) {
    diagnostics.api.sportsDataIO.status = 'error';
    diagnostics.api.sportsDataIO.error = e.message;
  }

  // Test ESPN (free fallback)
  try {
    const espnStart = Date.now();
    const espnResp = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard');
    diagnostics.api.espn.status = espnResp.ok ? 'ok' : 'unavailable';
    diagnostics.api.espn.latency = Date.now() - espnStart;
  } catch (e) {
    diagnostics.api.espn.status = 'error';
    diagnostics.api.espn.error = e.message;
  }

  // Calculate overall status
  const allOk = diagnostics.kv.status === 'ok'
    && diagnostics.d1.status === 'ok'
    && diagnostics.r2.status === 'ok'
    && (diagnostics.api.sportsDataIO.status === 'ok' || diagnostics.api.espn.status === 'ok');

  diagnostics.overall = allOk ? 'healthy' : 'degraded';
  diagnostics.worker.responseTime = Date.now() - startTime;

  return new Response(JSON.stringify(diagnostics, null, 2), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature, X-BSI-Canary',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // === CANARY FLAG DETECTION ===
    const isCanary = request.headers.get('X-BSI-Canary') === 'true'
      || url.searchParams.get('canary') === 'true';

    // === DIAGNOSTICS ENDPOINT ===
    if (path === '/api/diagnostics/data-flow') {
      return handleDiagnostics(request, env, corsHeaders, isCanary);
    }

    // === AUTH ROUTES ===
    if ((path === '/api/auth/register' || path === '/api/auth/signup') && request.method === 'POST') {
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
      const manifest = await env.BSI_ASSETS.get('origin/manifest.json');

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
      const sitemap = await env.BSI_ASSETS.get('origin/sitemap.xml');
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
      const sw = await env.BSI_ASSETS.get('origin/sw.js');

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
      const object = await env.BSI_ASSETS.get(key);

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
      const html = await env.BSI_ASSETS.get('origin/index.html');

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
      const html = await env.BSI_ASSETS.get('origin/analytics.html');

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

    // College Football Data
    if (path.startsWith('/api/cfb/')) {
      return handleCFBRequest(path, url, env, corsHeaders);
    }

    // Betting Odds (TheOddsAPI)
    if (path.startsWith('/api/odds/')) {
      return handleOddsRequest(path, url, env, corsHeaders);
    }

    // NCAA Football Data (FBS teams, transfer portal, schedule from D1)
    if (path.startsWith('/api/ncaa-football/')) {
      return handleNCAAFootballRequest(path, url, env, corsHeaders);
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
        tab: !!(await env.BSI_ASSETS.get('origin/tools/team-archetype-builder/index.html')),
        optimizer: !!(await env.BSI_ASSETS.get('origin/tools/composition-optimizer/index.html')),
        winProbability: !!(await env.BSI_ASSETS.get('origin/tools/win-probability.html')),
        playerComparison: !!(await env.BSI_ASSETS.get('origin/tools/player-comparison.html')),
        draftValue: !!(await env.BSI_ASSETS.get('origin/tools/draft-value.html')),
        scheduleStrength: !!(await env.BSI_ASSETS.get('origin/tools/schedule-strength.html')),
        sitemap: !!(await env.BSI_ASSETS.get('origin/sitemap.xml')),
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



    // === ADMIN ROUTES ===
    // Photo management
    if (path === '/api/admin/photos/upload' && request.method === 'POST') {
      return handlePhotoUpload(request, env, corsHeaders);
    }
    if (path === '/api/admin/photos/bulk-import' && request.method === 'POST') {
      return handleBulkPhotoImport(request, env, corsHeaders);
    }
    if (path === '/api/admin/photos' && request.method === 'GET') {
      return handleListPhotos(url, env, corsHeaders);
    }
    if (path.startsWith('/api/admin/photos/') && request.method === 'DELETE') {
      const photoId = path.split('/').pop();
      return handleDeletePhoto(photoId, env, corsHeaders);
    }

    // Roster management
    if (path === '/api/admin/rosters' && request.method === 'GET') {
      return handleListRosters(url, env, corsHeaders);
    }
    if (path === '/api/admin/rosters' && request.method === 'POST') {
      return handleAddRoster(request, env, corsHeaders);
    }
    if (path === '/api/admin/roster-players' && request.method === 'GET') {
      return handleListRosterPlayers(url, env, corsHeaders);
    }
    if (path === '/api/admin/roster-players' && request.method === 'POST') {
      return handleAddRosterPlayer(request, env, corsHeaders);
    }
    if (path === '/api/admin/roster-verify' && request.method === 'POST') {
      return handleVerifyPortalAgainstRoster(request, env, corsHeaders);
    }

    // Transfer portal notifications
    if (path === '/api/transfer-portal/subscribe' && request.method === 'POST') {
      return handleNotificationSubscribe(request, env, corsHeaders);
    }
    if (path === '/api/transfer-portal/unsubscribe') {
      return handleNotificationUnsubscribe(url, env, corsHeaders);
    }

    if (path === '/api/transfer-portal/notifications/process' && request.method === 'POST') {
      return processTransferNotifications(env, corsHeaders);
    }
    if (path === '/api/transfer-portal/notifications/digest' && request.method === 'POST') {
      const body = await request.json().catch(function() { return {}; });
      const frequency = body.frequency || 'daily';
      return processDigestNotifications(env, frequency, corsHeaders);
    }
    // Admin photos page
    if (path === '/admin/photos' || path === '/admin/photos.html') {
      return serveAsset(env, 'origin/admin/photos.html', 'text/html', corsHeaders);
    }

    // === COLLEGE BASEBALL API ===
    if (path === '/api/college-baseball/conference-flow') {
      return getConferenceFlow(url.searchParams, env, corsHeaders);
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
      const asset = await env.BSI_ASSETS.get(assetPath);
      if (asset) {
        const contentType = assetPath.endsWith('.js') ? 'application/javascript' :
                           assetPath.endsWith('.css') ? 'text/css' : 'text/html';
        return new Response(asset.body, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === COLLEGE FOOTBALL ROUTES ===
    if (path === '/college-football' || path === '/college-football/') {
      return serveAsset(env, 'origin/college-football/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/college-football/')) {
      const subPath = path.replace('/college-football/', '');
      // Try exact file match first
      let assetPath = `origin/college-football/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        // Try as directory index
        assetPath = `origin/college-football/${subPath}/index.html`;
      }
      const asset = await env.BSI_ASSETS.get(assetPath);
      if (asset) {
        const contentType = assetPath.endsWith('.js') ? 'application/javascript' :
                           assetPath.endsWith('.css') ? 'text/css' : 'text/html';
        return new Response(asset.body, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
        });
      }
    }

    // === TRANSFER PORTAL ROUTES ===
    if (path === '/transfer-portal' || path === '/transfer-portal/') {
      return serveAsset(env, 'origin/transfer-portal/index.html', 'text/html', corsHeaders);
    }
    if (path.startsWith('/transfer-portal/')) {
      const subPath = path.replace('/transfer-portal/', '').replace(/\/$/, '');
      let assetPath = `origin/transfer-portal/${subPath}`;
      if (!subPath.endsWith('.html') && !subPath.includes('.')) {
        assetPath = `origin/transfer-portal/${subPath}/index.html`;
      }
      const asset = await env.BSI_ASSETS.get(assetPath);
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
      const asset = await env.BSI_ASSETS.get(assetPath);
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
      const asset = await env.BSI_ASSETS.get(assetPath);
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
      const asset = await env.BSI_ASSETS.get(assetPath);
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
        return fetchESPNMLBScores(corsHeaders);
      }

      const rawData = await response.json();

      // Handle API errors (SportsDataIO returns object with Message on error)
      if (!Array.isArray(rawData)) {
        // Check for quota error and fallback
        if ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403) {
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
      return fetchESPNMLBScores(corsHeaders);
    }
  }

  // Leaders endpoint - fetch from ESPN core API with athlete resolution
  if (endpoint === 'leaders') {
    try {
      const espnUrl = 'https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/2024/types/2/leaders?limit=10';
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
        return fetchESPNNFLScores(corsHeaders);
      }

      const rawData = await response.json();

      // Check for quota error in response body
      if (!Array.isArray(rawData) && ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403)) {
        return fetchESPNNFLScores(corsHeaders);
      }

      return new Response(JSON.stringify({ rawData, source: 'SportsDataIO', fetchedAt: getChicagoTimestamp() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders }
      });
    } catch (error) {
      // On any error, try ESPN fallback
      return fetchESPNNFLScores(corsHeaders);
    }
  }

  // Leaders endpoint - fetch from ESPN core API with athlete resolution
  if (endpoint === 'leaders') {
    try {
      const espnUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/leaders?limit=10';
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
        return fetchESPNNBAScores(corsHeaders);
      }

      const rawData = await response.json();

      // Handle API errors (SportsDataIO returns object with Message on error)
      if (!Array.isArray(rawData)) {
        // Check for quota error and fallback
        if ((rawData.Message || rawData.message || '')?.includes('quota') || rawData.statusCode === 403) {
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

// === TOOLS API HANDLERS ===

// Strike Zone Handler - Pitch location visualization data
async function handleStrikeZone(env, corsHeaders, playerId = null, pitchType = null, hand = null) {
  try {
    // Cache key based on parameters
    const cacheKey = `strike_zone_${playerId || 'default'}_${pitchType || 'all'}_${hand || 'all'}`;
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
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
    const pitchCount = STRIKE_ZONE_DEMO_PITCH_COUNT;
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
        left: STRIKE_ZONE.LEFT,
        right: STRIKE_ZONE.RIGHT,
        top: STRIKE_ZONE.TOP,
        bottom: STRIKE_ZONE.BOTTOM
      },
      source: 'BSI Synthetic Data (connect to Statcast for real data)',
      fetchedAt: getChicagoTimestamp()
    };

    // Cache for 1 hour
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

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
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
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

    const ballCount = SPRAY_CHART_DEMO_BALL_COUNT;
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
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

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
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
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
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

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

async function handleNCAABaseballScores(env, corsHeaders) {
  try {
    // Check cache first
    const cacheKey = 'ncaa_baseball_scores';
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120', ...corsHeaders }
      });
    }

    // Try ESPN college baseball scoreboard
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
    const response = await fetch(espnUrl, {
      headers: { 'User-Agent': 'BlazeIntel/2.4' }
    });

    let games = [];
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

    const result = {
      games,
      count: games.length,
      source: response.ok ? 'ESPN' : 'unavailable',
      fetchedAt: getChicagoTimestamp(),
      season: '2025',
      message: games.length === 0 ? 'No games scheduled. College baseball season starts mid-February 2025.' : null
    };

    // Cache for 2 minutes during games
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 120000 }));

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
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
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
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 1800000 }));

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
    const cached = await env.BSI_SESSIONS.get(cacheKey, { type: 'json' });
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
    await env.BSI_SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 3600000 }));

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
    // Parse request body - support both JSON and form-urlencoded
    const contentType = request.headers.get('content-type') || '';
    let email, password, firstName, lastName, tier;
    const isFormSubmit = contentType.includes('application/x-www-form-urlencoded');

    if (isFormSubmit) {
      const formData = await request.formData();
      email = formData.get('email');
      password = formData.get('password');
      firstName = formData.get('firstName');
      lastName = formData.get('lastName');
      tier = formData.get('tier');
    } else {
      const body = await request.json();
      email = body.email;
      password = body.password;
      firstName = body.firstName;
      lastName = body.lastName;
      tier = body.tier;
    }

    if (!email || !password) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/signup?error=missing_fields', 302);
      }
      return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
    }

    if (password.length < 8) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/signup?error=password_short', 302);
      }
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
    }

    // Combine name fields, default tier to free
    const name = [firstName, lastName].filter(Boolean).join(' ') || null;
    const subscriptionTier = tier || 'free';

    // Check if user exists
    const existing = await env.BSI_GAME_DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/signup?error=email_exists', 302);
      }
      return jsonResponse({ error: 'Email already registered' }, 409, corsHeaders);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user with name and tier (username uses email for legacy schema compatibility)
    await env.BSI_GAME_DB.prepare(
      'INSERT INTO users (id, username, email, password_hash, name, subscription_tier) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), email.toLowerCase(), passwordHash, name, subscriptionTier).run();

    // Create session
    const sessionToken = await createSession(env, userId);

    // Form submits redirect to dashboard, API calls return JSON
    if (isFormSubmit) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://blazesportsintel.com/dashboard',
          'Set-Cookie': `bsi_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
          ...corsHeaders
        }
      });
    }

    return jsonResponse(
      { success: true, user: { id: userId, email: email.toLowerCase(), name, subscriptionTier } },
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
    // Parse request body - support both JSON and form-urlencoded
    const contentType = request.headers.get('content-type') || '';
    let email, password;
    const isFormSubmit = contentType.includes('application/x-www-form-urlencoded');

    if (isFormSubmit) {
      const formData = await request.formData();
      email = formData.get('email');
      password = formData.get('password');
    } else {
      const body = await request.json();
      email = body.email;
      password = body.password;
    }

    if (!email || !password) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/login?error=missing_fields', 302);
      }
      return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
    }

    // Find user
    const user = await env.BSI_GAME_DB.prepare(
      'SELECT id, email, password_hash, subscription_status, subscription_tier FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/login?error=invalid_credentials', 302);
      }
      return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      if (isFormSubmit) {
        return Response.redirect('https://blazesportsintel.com/login?error=invalid_credentials', 302);
      }
      return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Create session
    const sessionToken = await createSession(env, user.id);

    // Form submits redirect to dashboard, API calls return JSON
    if (isFormSubmit) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://blazesportsintel.com/dashboard',
          'Set-Cookie': `bsi_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
          ...corsHeaders
        }
      });
    }

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
      await env.BSI_SESSIONS.delete(sessionToken);
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

    const user = await env.BSI_GAME_DB.prepare(
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
    const user = await env.BSI_GAME_DB.prepare('SELECT email, stripe_customer_id FROM users WHERE id = ?')
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
      await env.BSI_GAME_DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
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
          await env.BSI_GAME_DB.prepare(`
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
          await env.BSI_GAME_DB.prepare(`
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
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by customer ID
        const user = await env.BSI_GAME_DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          const status = subscription.cancel_at_period_end ? 'canceling' : subscription.status;
          await env.BSI_GAME_DB.prepare(`
            UPDATE users SET
              subscription_status = ?,
              subscription_end_date = datetime(?, 'unixepoch'),
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(status, subscription.current_period_end, user.id).run();

          // Update subscription record
          await env.BSI_GAME_DB.prepare(`
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

        const user = await env.BSI_GAME_DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          await env.BSI_GAME_DB.prepare(`
            UPDATE users SET
              subscription_status = 'canceled',
              subscription_tier = 'free',
              subscription_id = NULL,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(user.id).run();

          await env.BSI_GAME_DB.prepare(`
            UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now')
            WHERE stripe_subscription_id = ?
          `).bind(subscription.id).run();
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await env.BSI_GAME_DB.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
          .bind(customerId).first();

        if (user) {
          await env.BSI_GAME_DB.prepare(`
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

    const user = await env.BSI_GAME_DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
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

  await env.BSI_SESSIONS.put(token, JSON.stringify({ userId, expiresAt }), {
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

  const sessionData = await env.BSI_SESSIONS.get(token);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  if (session.expiresAt < Date.now()) {
    await env.BSI_SESSIONS.delete(token);
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
  const asset = await env.BSI_ASSETS.get(key);
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
  const asset = await env.BSI_ASSETS.get(key);
  if (!asset) {
    return new Response('Tool not found', { status: 404 });
  }

  // Get user session for subscription check (tools may have tiered access)
  const session = await getSession(request, env);
  let subscriptionTier = 'free';
  let isLoggedIn = false;

  if (session) {
    isLoggedIn = true;
    const user = await env.BSI_GAME_DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(session.userId).first();
    subscriptionTier = user?.subscription_tier || 'free';
  }

  // Determine if this is a Pro tool
  const proTools = ['composition-optimizer', '3d-showcase', 'draft-value', 'schedule-strength'];
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
  const asset = await env.BSI_ASSETS.get(key);

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
    if (env.BSI_ANALYTICS_KV) {
      const key = `event:${Date.now()}:${crypto.randomUUID()}`;
      await env.BSI_ANALYTICS_KV.put(key, JSON.stringify(enrichedEvent), {
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
    if (env.BSI_ANALYTICS_KV) {
      var key = 'tool:' + Date.now() + ':' + crypto.randomUUID();
      await env.BSI_ANALYTICS_KV.put(key, JSON.stringify(toolEvent), {
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
    await env.BSI_GAME_DB.prepare(`
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
    ncaab: [],
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
          results.ncaab = data.events.map(e => normalizeESPNEvent(e, 'ncaab'));
        }
      })
      .catch(e => results.errors.push({ league: 'ncaab', error: e.message })),

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
  const allGames = [...results.mlb, ...results.nfl, ...results.nba, ...results.ncaab, ...results.ncaaf];
  results.summary = {
    total: allGames.length,
    live: allGames.filter(g => g.isLive).length,
    final: allGames.filter(g => g.isFinal).length,
    byLeague: {
      mlb: results.mlb.length,
      nfl: results.nfl.length,
      nba: results.nba.length,
      ncaab: results.ncaab.length,
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

// =============================================================================
// NCAA FOOTBALL (FBS) API HANDLERS - D1 Database
// =============================================================================

async function handleNCAAFootballRequest(path, url, env, corsHeaders) {
  const endpoint = path.replace('/api/ncaa-football/', '');
  const searchParams = url.searchParams;

  // Teams endpoints
  if (endpoint.startsWith('teams/')) {
    const teamSlug = endpoint.replace('teams/', '').replace('/', '');
    return getFootballTeamFromD1(teamSlug, env, corsHeaders);
  }

  if (endpoint === 'teams') {
    return getFootballTeamsFromD1(searchParams, env, corsHeaders);
  }

  // Transfer Portal endpoints
  if (endpoint === 'transfer-portal/impact-leaders') {
    return getFootballTransferImpactLeaders(searchParams, env, corsHeaders);
  }

  if (endpoint.startsWith('transfer-portal/player/')) {
    const playerId = endpoint.replace('transfer-portal/player/', '');
    return getFootballTransferPlayerDetail(playerId, env, corsHeaders);
  }

  if (endpoint === 'transfer-portal/conference-summary') {
    return getFootballTransferConferenceSummary(searchParams, env, corsHeaders);
  }

  if (endpoint === 'transfer-portal' || endpoint.startsWith('transfer-portal')) {
    return getFootballTransferPortal(searchParams, env, corsHeaders);
  }

  // Schedule/Games endpoints
  if (endpoint.startsWith('schedule/')) {
    const teamSlug = endpoint.replace('schedule/', '');
    return getFootballTeamSchedule(teamSlug, searchParams, env, corsHeaders);
  }

  if (endpoint === 'schedule' || endpoint === 'games') {
    return getFootballSchedule(searchParams, env, corsHeaders);
  }

  if (endpoint.startsWith('games/')) {
    const gameId = endpoint.replace('games/', '');
    return getFootballGameDetail(gameId, env, corsHeaders);
  }

  // Standings
  if (endpoint === 'standings') {
    return getFootballStandings(searchParams, env, corsHeaders);
  }

  // Rankings (CFP, AP, Coaches)
  if (endpoint === 'rankings') {
    return getFootballRankings(searchParams, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'NCAA Football endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Get all FBS teams from D1
async function getFootballTeamsFromD1(searchParams, env, corsHeaders) {
  try {
    const conference = searchParams.get('conference');
    const state = searchParams.get('state');
    const limit = Math.min(parseInt(searchParams.get('limit')) || 150, 200);
    const offset = parseInt(searchParams.get('offset')) || 0;

    let sql = `
      SELECT
        id, name, slug, mascot, conference, division,
        city, state, stadium, stadium_capacity,
        head_coach, primary_color, secondary_color,
        espn_id, wins, losses, conf_wins, conf_losses,
        ap_rank, cfp_rank
      FROM football_teams
      WHERE 1=1
    `;
    const params = [];

    if (conference) {
      sql += ` AND LOWER(conference) = LOWER(?)`;
      params.push(conference);
    }

    if (state) {
      sql += ` AND UPPER(state) = UPPER(?)`;
      params.push(state);
    }

    sql += ` ORDER BY conference, name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();

    // Get total count
    let countSql = `SELECT COUNT(*) as count FROM football_teams WHERE 1=1`;
    const countParams = [];
    if (conference) {
      countSql += ` AND LOWER(conference) = LOWER(?)`;
      countParams.push(conference);
    }
    if (state) {
      countSql += ` AND UPPER(state) = UPPER(?)`;
      countParams.push(state);
    }
    const countResult = await env.BSI_GAME_DB.prepare(countSql).bind(...countParams).first();

    // Get conference summary
    const confSummary = await env.BSI_GAME_DB.prepare(`
      SELECT conference, COUNT(*) as count
      FROM football_teams
      GROUP BY conference
      ORDER BY count DESC
    `).all();

    const teams = results.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      mascot: t.mascot,
      conference: t.conference,
      division: t.division || 'FBS',
      city: t.city,
      state: t.state,
      stadium: t.stadium,
      stadiumCapacity: t.stadium_capacity,
      headCoach: t.head_coach,
      colors: {
        primary: t.primary_color,
        secondary: t.secondary_color
      },
      logo: t.espn_id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.espn_id}.png` : null,
      espnId: t.espn_id,
      record: {
        wins: t.wins || 0,
        losses: t.losses || 0,
        confWins: t.conf_wins || 0,
        confLosses: t.conf_losses || 0
      },
      rankings: {
        ap: t.ap_rank,
        cfp: t.cfp_rank
      }
    }));

    return new Response(JSON.stringify({
      teams,
      total: countResult?.count || teams.length,
      conferences: confSummary.results,
      pagination: {
        limit,
        offset,
        hasMore: offset + teams.length < (countResult?.count || 0)
      },
      filters: {
        conference: conference || 'all',
        state: state || 'all'
      },
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football - D1 Database'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
        'X-Data-Source': 'BSI-D1-NCAAFootball',
        'X-Fetched-At': getChicagoTimestamp(),
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching football teams from D1:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch football teams',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get single FBS team by slug
async function getFootballTeamFromD1(slug, env, corsHeaders) {
  try {
    const team = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_teams WHERE slug = ?
    `).bind(slug).first();

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get recent transfers for this team
    const transfers = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_transfer_portal
      WHERE LOWER(from_school) LIKE LOWER(?) OR LOWER(to_school) LIKE LOWER(?)
      ORDER BY entry_date DESC
      LIMIT 20
    `).bind(`%${team.name.split(' ')[0]}%`, `%${team.name.split(' ')[0]}%`).all();

    return new Response(JSON.stringify({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        mascot: team.mascot,
        conference: team.conference,
        division: team.division || 'FBS',
        city: team.city,
        state: team.state,
        stadium: team.stadium,
        stadiumCapacity: team.stadium_capacity,
        headCoach: team.head_coach,
        colors: {
          primary: team.primary_color,
          secondary: team.secondary_color
        },
        logo: team.espn_id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espn_id}.png` : null,
        espnId: team.espn_id,
        record: {
          wins: team.wins || 0,
          losses: team.losses || 0,
          confWins: team.conf_wins || 0,
          confLosses: team.conf_losses || 0
        },
        rankings: {
          ap: team.ap_rank,
          cfp: team.cfp_rank
        }
      },
      recentTransfers: transfers.results?.map(t => ({
        id: t.id,
        name: t.player_name,
        position: t.position,
        year: t.year,
        fromSchool: t.from_school,
        toSchool: t.to_school,
        status: t.status,
        date: t.entry_date
      })) || [],
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football - D1 Database'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching football team:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch team' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Transfer Portal
async function getFootballTransferPortal(searchParams, env, corsHeaders) {
  const status = searchParams.get('status');
  const position = searchParams.get('position');
  const conference = searchParams.get('conference');
  const stars = searchParams.get('stars');
  const limit = parseInt(searchParams.get('limit')) || 100;

  try {
    let sql = `
      SELECT * FROM football_transfer_portal
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (position && position !== 'all') {
      sql += ' AND position = ?';
      params.push(position);
    }

    if (conference && conference !== 'all') {
      sql += ' AND (from_conference = ? OR to_conference = ?)';
      params.push(conference, conference);
    }

    if (stars) {
      sql += ' AND stars >= ?';
      params.push(parseInt(stars));
    }

    sql += ' ORDER BY impact_score DESC, entry_date DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();

    const players = results.map(row => ({
      id: row.id,
      name: row.player_name,
      firstName: row.first_name,
      lastName: row.last_name,
      year: row.year,
      position: row.position,
      fromSchool: row.from_school,
      fromConf: row.from_conference,
      destination: row.to_school,
      destConf: row.to_conference,
      status: row.status,
      date: row.entry_date,
      commitDate: row.commit_date,
      stars: row.stars,
      impactScore: row.impact_score,
      stats: {
        passingYards: row.stats_passing_yards,
        rushingYards: row.stats_rushing_yards,
        receivingYards: row.stats_receiving_yards,
        tackles: row.stats_tackles,
        sacks: row.stats_sacks,
        interceptions: row.stats_interceptions
      },
      notes: row.notes
    }));

    // Get summary stats
    const summaryQuery = await env.BSI_GAME_DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'in_portal' THEN 1 ELSE 0 END) as inPortal,
        SUM(CASE WHEN status = 'committed' THEN 1 ELSE 0 END) as committed,
        SUM(CASE WHEN status = 'declared' THEN 1 ELSE 0 END) as declared,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn
      FROM football_transfer_portal
    `).first();

    // Get position breakdown
    const positionBreakdown = await env.BSI_GAME_DB.prepare(`
      SELECT position, COUNT(*) as count
      FROM football_transfer_portal
      GROUP BY position
      ORDER BY count DESC
    `).all();

    return new Response(JSON.stringify({
      players,
      total: summaryQuery?.total || 0,
      summary: {
        total: summaryQuery?.total || 0,
        inPortal: summaryQuery?.inPortal || 0,
        committed: summaryQuery?.committed || 0,
        declared: summaryQuery?.declared || 0,
        withdrawn: summaryQuery?.withdrawn || 0
      },
      positionBreakdown: positionBreakdown.results,
      filters: {
        status: status || 'all',
        position: position || 'all',
        conference: conference || 'all',
        stars: stars || 'all'
      },
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football Transfer Portal - D1 Database'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Data-Source': 'BSI-D1-FootballTransfer',
        'X-Fetched-At': getChicagoTimestamp(),
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching football transfer portal:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch transfer portal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Transfer Impact Leaders
async function getFootballTransferImpactLeaders(searchParams, env, corsHeaders) {
  const limit = parseInt(searchParams.get('limit')) || 25;
  const position = searchParams.get('position');

  try {
    let sql = `
      SELECT * FROM football_transfer_portal
      WHERE impact_score IS NOT NULL
    `;
    const params = [];

    if (position && position !== 'all') {
      sql += ' AND position = ?';
      params.push(position);
    }

    sql += ' ORDER BY impact_score DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify({
      leaders: results.map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        name: row.player_name,
        position: row.position,
        year: row.year,
        fromSchool: row.from_school,
        toSchool: row.to_school,
        status: row.status,
        stars: row.stars,
        impactScore: row.impact_score,
        stats: {
          passingYards: row.stats_passing_yards,
          rushingYards: row.stats_rushing_yards,
          receivingYards: row.stats_receiving_yards,
          tackles: row.stats_tackles,
          sacks: row.stats_sacks,
          interceptions: row.stats_interceptions
        }
      })),
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching impact leaders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch impact leaders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Transfer Player Detail
async function getFootballTransferPlayerDetail(playerId, env, corsHeaders) {
  try {
    const player = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_transfer_portal WHERE id = ?
    `).bind(playerId).first();

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      player: {
        id: player.id,
        name: player.player_name,
        firstName: player.first_name,
        lastName: player.last_name,
        position: player.position,
        year: player.year,
        fromSchool: player.from_school,
        fromConference: player.from_conference,
        toSchool: player.to_school,
        toConference: player.to_conference,
        status: player.status,
        entryDate: player.entry_date,
        commitDate: player.commit_date,
        stars: player.stars,
        impactScore: player.impact_score,
        stats: {
          passingYards: player.stats_passing_yards,
          rushingYards: player.stats_rushing_yards,
          receivingYards: player.stats_receiving_yards,
          tackles: player.stats_tackles,
          sacks: player.stats_sacks,
          interceptions: player.stats_interceptions
        },
        notes: player.notes
      },
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching player detail:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Transfer Conference Summary
async function getFootballTransferConferenceSummary(searchParams, env, corsHeaders) {
  try {
    const incoming = await env.BSI_GAME_DB.prepare(`
      SELECT to_conference as conference, COUNT(*) as count
      FROM football_transfer_portal
      WHERE to_conference IS NOT NULL
      GROUP BY to_conference
      ORDER BY count DESC
    `).all();

    const outgoing = await env.BSI_GAME_DB.prepare(`
      SELECT from_conference as conference, COUNT(*) as count
      FROM football_transfer_portal
      GROUP BY from_conference
      ORDER BY count DESC
    `).all();

    const fiveStars = await env.BSI_GAME_DB.prepare(`
      SELECT to_conference as conference, COUNT(*) as count
      FROM football_transfer_portal
      WHERE to_conference IS NOT NULL AND stars = 5
      GROUP BY to_conference
      ORDER BY count DESC
    `).all();

    return new Response(JSON.stringify({
      incoming: incoming.results,
      outgoing: outgoing.results,
      fiveStarLandings: fiveStars.results,
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching conference summary:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch conference summary' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Schedule
async function getFootballSchedule(searchParams, env, corsHeaders) {
  const week = searchParams.get('week');
  const conference = searchParams.get('conference');
  const limit = parseInt(searchParams.get('limit')) || 50;

  try {
    let sql = `
      SELECT * FROM football_games
      WHERE season = 2025
    `;
    const params = [];

    if (week) {
      sql += ' AND week = ?';
      params.push(parseInt(week));
    }

    if (conference) {
      sql += ' AND (home_conference = ? OR away_conference = ?)';
      params.push(conference, conference);
    }

    sql += ' ORDER BY game_date ASC, game_time ASC LIMIT ?';
    params.push(limit);

    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify({
      games: results.map(g => ({
        id: g.id,
        week: g.week,
        date: g.game_date,
        time: g.game_time,
        venue: g.venue,
        homeTeam: {
          id: g.home_team_id,
          name: g.home_team_name,
          conference: g.home_conference,
          score: g.home_score,
          rank: g.home_rank
        },
        awayTeam: {
          id: g.away_team_id,
          name: g.away_team_name,
          conference: g.away_conference,
          score: g.away_score,
          rank: g.away_rank
        },
        status: g.status,
        tvNetwork: g.tv_network,
        isConferenceGame: g.is_conference_game === 1
      })),
      filters: {
        week: week || 'all',
        conference: conference || 'all'
      },
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching football schedule:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch schedule', games: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Team Schedule
async function getFootballTeamSchedule(teamSlug, searchParams, env, corsHeaders) {
  try {
    const team = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_teams WHERE slug = ?
    `).bind(teamSlug).first();

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const games = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_games
      WHERE (home_team_id = ? OR away_team_id = ?) AND season = 2025
      ORDER BY game_date ASC
    `).bind(team.id, team.id).all();

    return new Response(JSON.stringify({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        conference: team.conference
      },
      games: games.results?.map(g => ({
        id: g.id,
        week: g.week,
        date: g.game_date,
        time: g.game_time,
        venue: g.venue,
        opponent: g.home_team_id === team.id ? g.away_team_name : g.home_team_name,
        isHome: g.home_team_id === team.id,
        teamScore: g.home_team_id === team.id ? g.home_score : g.away_score,
        oppScore: g.home_team_id === team.id ? g.away_score : g.home_score,
        status: g.status,
        tvNetwork: g.tv_network
      })) || [],
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch team schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Game Detail
async function getFootballGameDetail(gameId, env, corsHeaders) {
  try {
    const game = await env.BSI_GAME_DB.prepare(`
      SELECT * FROM football_games WHERE id = ?
    `).bind(gameId).first();

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      game: {
        id: game.id,
        season: game.season,
        week: game.week,
        date: game.game_date,
        time: game.game_time,
        venue: game.venue,
        homeTeam: {
          id: game.home_team_id,
          name: game.home_team_name,
          conference: game.home_conference,
          score: game.home_score,
          rank: game.home_rank
        },
        awayTeam: {
          id: game.away_team_id,
          name: game.away_team_name,
          conference: game.away_conference,
          score: game.away_score,
          rank: game.away_rank
        },
        status: game.status,
        tvNetwork: game.tv_network,
        isConferenceGame: game.is_conference_game === 1,
        attendance: game.attendance
      },
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching game detail:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch game' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Standings
async function getFootballStandings(searchParams, env, corsHeaders) {
  const conference = searchParams.get('conference');

  try {
    let sql = `
      SELECT * FROM football_teams
      WHERE 1=1
    `;
    const params = [];

    if (conference) {
      sql += ' AND LOWER(conference) = LOWER(?)';
      params.push(conference);
    }

    sql += ' ORDER BY conference, (wins - losses) DESC, wins DESC';

    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();

    // Group by conference
    const standings = {};
    results.forEach(team => {
      if (!standings[team.conference]) {
        standings[team.conference] = [];
      }
      standings[team.conference].push({
        id: team.id,
        name: team.name,
        slug: team.slug,
        wins: team.wins || 0,
        losses: team.losses || 0,
        confWins: team.conf_wins || 0,
        confLosses: team.conf_losses || 0,
        apRank: team.ap_rank,
        cfpRank: team.cfp_rank,
        logo: team.espn_id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espn_id}.png` : null
      });
    });

    return new Response(JSON.stringify({
      standings,
      conferences: Object.keys(standings),
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch standings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Football Rankings
async function getFootballRankings(searchParams, env, corsHeaders) {
  const poll = searchParams.get('poll') || 'cfp';

  try {
    let sql;
    if (poll === 'cfp') {
      sql = `SELECT * FROM football_teams WHERE cfp_rank IS NOT NULL ORDER BY cfp_rank ASC LIMIT 25`;
    } else if (poll === 'ap') {
      sql = `SELECT * FROM football_teams WHERE ap_rank IS NOT NULL ORDER BY ap_rank ASC LIMIT 25`;
    } else {
      sql = `SELECT * FROM football_teams WHERE ap_rank IS NOT NULL OR cfp_rank IS NOT NULL ORDER BY COALESCE(cfp_rank, ap_rank) ASC LIMIT 25`;
    }

    const { results } = await env.BSI_GAME_DB.prepare(sql).all();

    return new Response(JSON.stringify({
      poll,
      rankings: results.map((team, idx) => ({
        rank: poll === 'cfp' ? team.cfp_rank : (poll === 'ap' ? team.ap_rank : idx + 1),
        team: team.name,
        conference: team.conference,
        record: `${team.wins || 0}-${team.losses || 0}`,
        slug: team.slug,
        logo: team.espn_id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espn_id}.png` : null
      })),
      fetchedAt: getChicagoTimestamp(),
      source: 'BSI NCAA Football'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch rankings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
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


// ============================================
// ADMIN HANDLER FUNCTIONS
// ============================================

function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return { authorized: false, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
  }
  return { authorized: true };
}

async function handlePhotoUpload(request, env, corsHeaders) {
  const auth = verifyAdminAuth(request, env);
  if (!auth.authorized) return auth.response;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const playerName = formData.get('player_name');
    const schoolName = formData.get('school_name');
    const playerId = formData.get('player_id');
    if (!file || !playerName) {
      return new Response(JSON.stringify({ error: 'file and player_name required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const timestamp = Date.now();
    const safeName = playerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ext = file.name?.split('.').pop() || 'jpg';
    const r2Key = 'photos/players/' + safeName + '-' + timestamp + '.' + ext;
    const arrayBuffer = await file.arrayBuffer();
    await env.BSI_ASSETS.put(r2Key, arrayBuffer, { httpMetadata: { contentType: file.type || 'image/jpeg' } });
    const r2Url = 'https://blazesportsintel.com/' + r2Key;
    await env.BSI_GAME_DB.prepare('INSERT INTO player_photos (player_id, player_name, school_name, r2_key, r2_url, photo_type, file_size, uploaded_by, approved) VALUES (?, ?, ?, ?, ?, \'headshot\', ?, \'admin\', 1)').bind(playerId || null, playerName, schoolName || null, r2Key, r2Url, arrayBuffer.byteLength).run();
    return new Response(JSON.stringify({ success: true, r2_key: r2Key, r2_url: r2Url, player_name: playerName }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    console.error('Photo upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleBulkPhotoImport(request, env, corsHeaders) {
  const auth = verifyAdminAuth(request, env);
  if (!auth.authorized) return auth.response;
  try {
    const body = await request.json();
    const { photos } = body;
    if (!photos || !Array.isArray(photos)) {
      return new Response(JSON.stringify({ error: 'photos array required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const results = [];
    for (const photo of photos) {
      try {
        const { player_name, school_name, photo_url, player_id } = photo;
        if (!player_name || !photo_url) { results.push({ player_name, status: 'error', error: 'Missing fields' }); continue; }
        const imageResponse = await fetch(photo_url);
        if (!imageResponse.ok) { results.push({ player_name, status: 'error', error: 'Fetch failed' }); continue; }
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await imageResponse.arrayBuffer();
        const timestamp = Date.now();
        const safeName = player_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        const r2Key = 'photos/players/' + safeName + '-' + timestamp + '.' + ext;
        await env.BSI_ASSETS.put(r2Key, arrayBuffer, { httpMetadata: { contentType } });
        const r2Url = 'https://blazesportsintel.com/' + r2Key;
        await env.BSI_GAME_DB.prepare('INSERT INTO player_photos (player_id, player_name, school_name, r2_key, r2_url, photo_type, file_size, uploaded_by, approved) VALUES (?, ?, ?, ?, ?, \'headshot\', ?, \'bulk-import\', 1)').bind(player_id || null, player_name, school_name || null, r2Key, r2Url, arrayBuffer.byteLength).run();
        results.push({ player_name, status: 'success', r2_key: r2Key });
      } catch (err) { results.push({ player_name: photo.player_name, status: 'error', error: err.message }); }
    }
    const successful = results.filter(r => r.status === 'success').length;
    return new Response(JSON.stringify({ imported: successful, total: photos.length, results }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    console.error('Bulk import error:', error);
    return new Response(JSON.stringify({ error: 'Bulk import failed' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleListPhotos(url, env, corsHeaders) {
  try {
    const school = url.searchParams.get('school');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 500);
    let sql = 'SELECT * FROM player_photos WHERE 1=1';
    const params = [];
    if (school) { sql += ' AND LOWER(school_name) LIKE ?'; params.push('%' + school.toLowerCase() + '%'); }
    sql += ' ORDER BY uploaded_at DESC LIMIT ?';
    params.push(limit);
    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify({ photos: results, count: results.length, fetchedAt: getChicagoTimestamp() }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to list photos' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleDeletePhoto(photoId, env, corsHeaders) {
  try {
    const photo = await env.BSI_GAME_DB.prepare('SELECT * FROM player_photos WHERE id = ?').bind(photoId).first();
    if (!photo) { return new Response(JSON.stringify({ error: 'Photo not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
    if (photo.r2_key) { await env.BSI_ASSETS.delete(photo.r2_key); }
    await env.BSI_GAME_DB.prepare('DELETE FROM player_photos WHERE id = ?').bind(photoId).run();
    return new Response(JSON.stringify({ success: true, deleted: photoId }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete photo' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleListRosters(url, env, corsHeaders) {
  try {
    const season = url.searchParams.get('season') || '2025';
    const { results } = await env.BSI_GAME_DB.prepare('SELECT * FROM roster_sources WHERE season = ? ORDER BY school_name').bind(season).all();
    return new Response(JSON.stringify({ rosters: results, count: results.length, season }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to list rosters' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleAddRoster(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { school_name, source_type, source_url, season } = body;
    if (!school_name || !source_type) { return new Response(JSON.stringify({ error: 'school_name and source_type required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
    await env.BSI_GAME_DB.prepare("INSERT OR REPLACE INTO roster_sources (school_name, source_type, source_url, season, last_scraped, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))").bind(school_name, source_type, source_url || null, season || '2025').run();
    return new Response(JSON.stringify({ success: true, school_name }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add roster' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleListRosterPlayers(url, env, corsHeaders) {
  try {
    const school = url.searchParams.get('school');
    const season = url.searchParams.get('season') || '2025';
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 500);
    let sql = 'SELECT * FROM roster_players WHERE season = ?';
    const params = [season];
    if (school) { sql += ' AND LOWER(school_name) LIKE ?'; params.push('%' + school.toLowerCase() + '%'); }
    sql += ' ORDER BY school_name, player_name LIMIT ?';
    params.push(limit);
    const { results } = await env.BSI_GAME_DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify({ players: results, count: results.length, season }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to list roster players' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleAddRosterPlayer(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { school_name, player_name, jersey_number, position, class_year, hometown, high_school, source_type, season } = body;
    if (!school_name || !player_name) { return new Response(JSON.stringify({ error: 'school_name and player_name required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
    await env.BSI_GAME_DB.prepare("INSERT OR REPLACE INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, source_type, season, scraped_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))").bind(school_name, player_name, jersey_number || null, position || null, class_year || null, hometown || null, high_school || null, source_type || 'manual', season || '2025').run();
    return new Response(JSON.stringify({ success: true, player_name, school_name }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add roster player' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleVerifyPortalAgainstRoster(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const seasonYear = body.season || '2025';
    const { results: portalEntries } = await env.BSI_GAME_DB.prepare("SELECT id, player_name, from_school, to_school, position FROM transfer_portal WHERE status = 'committed' AND to_school IS NOT NULL").all();
    const verifications = [];
    for (const entry of portalEntries) {
      const { results: rosterMatches } = await env.BSI_GAME_DB.prepare('SELECT id, player_name, school_name, position FROM roster_players WHERE season = ? AND LOWER(school_name) LIKE ? AND (LOWER(player_name) LIKE ? OR LOWER(player_name) LIKE ?)').bind(seasonYear, '%' + entry.to_school.toLowerCase() + '%', '%' + entry.player_name.split(' ')[0].toLowerCase() + '%', '%' + entry.player_name.toLowerCase() + '%').all();
      if (rosterMatches.length > 0) { verifications.push({ portal_id: entry.id, player_name: entry.player_name, to_school: entry.to_school, verified: true, roster_match: rosterMatches[0] }); }
    }
    return new Response(JSON.stringify({ verified_count: verifications.length, total_committed: portalEntries.length, verifications }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to verify against roster' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleNotificationSubscribe(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, frequency, filters_position, filters_conference } = body;
    const freq = frequency || 'instant';
    if (!email) { return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
    const unsubscribeToken = crypto.randomUUID();
    await env.BSI_GAME_DB.prepare("INSERT OR REPLACE INTO notification_subscribers (email, frequency, notification_type, filters_position, status, unsubscribe_token, filters_conference) VALUES (?, ?, 'transfer-portal', ?, 'active', ?, ?)").bind(email, freq, filters_position || null, unsubscribeToken, filters_conference || null).run();
    return new Response(JSON.stringify({ success: true, email, unsubscribe_url: 'https://blazesportsintel.com/api/transfer-portal/unsubscribe?token=' + unsubscribeToken }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Subscription failed' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function handleNotificationUnsubscribe(url, env, corsHeaders) {
  try {
    const token = url.searchParams.get('token');
    if (!token) { return new Response('Missing token', { status: 400 }); }
    const result = await env.BSI_GAME_DB.prepare("UPDATE notification_subscribers SET status = 'unsubscribed' WHERE unsubscribe_token = ?").bind(token).run();
    if (result.meta.changes === 0) { return new Response('Invalid or expired token', { status: 404 }); }
    return new Response('<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h1>Unsubscribed Successfully</h1><p>You will no longer receive transfer portal notifications.</p><p><a href="/transfer-portal">Return to Transfer Portal</a></p></body></html>', { headers: { 'Content-Type': 'text/html', ...corsHeaders } });
  } catch (error) {
    return new Response('Unsubscribe failed', { status: 500 });
  }
}

async function getConferenceFlow(searchParams, env, corsHeaders) {
  try {
    const year = searchParams.get('year') || '2025';
    const { results: entries } = await env.BSI_GAME_DB.prepare("SELECT from_conference, to_conference, from_school, to_school, status FROM transfer_portal WHERE substr(entry_date, 1, 4) = ?").bind(year).all();
    const conferenceStats = {};
    entries.forEach(function(entry) {
      if (entry.from_conference) {
        if (!conferenceStats[entry.from_conference]) { conferenceStats[entry.from_conference] = { entries_out: 0, commits_in: 0, schools_out: {}, schools_in: {} }; }
        conferenceStats[entry.from_conference].entries_out++;
        conferenceStats[entry.from_conference].schools_out[entry.from_school] = (conferenceStats[entry.from_conference].schools_out[entry.from_school] || 0) + 1;
      }
      if (entry.status === 'committed' && entry.to_conference) {
        if (!conferenceStats[entry.to_conference]) { conferenceStats[entry.to_conference] = { entries_out: 0, commits_in: 0, schools_out: {}, schools_in: {} }; }
        conferenceStats[entry.to_conference].commits_in++;
        conferenceStats[entry.to_conference].schools_in[entry.to_school] = (conferenceStats[entry.to_conference].schools_in[entry.to_school] || 0) + 1;
      }
    });
    const conferences = Object.entries(conferenceStats).map(function(item) {
      const conference = item[0];
      const stats = item[1];
      const schoolsOut = Object.entries(stats.schools_out);
      const schoolsIn = Object.entries(stats.schools_in);
      const topLoser = schoolsOut.sort(function(a, b) { return b[1] - a[1]; })[0];
      const topGainer = schoolsIn.sort(function(a, b) { return b[1] - a[1]; })[0];
      return { conference: conference, entries_out: stats.entries_out, commits_in: stats.commits_in, net_flow: stats.commits_in - stats.entries_out, top_gainer_school: topGainer ? topGainer[0] : null, top_gainer_count: topGainer ? topGainer[1] : 0, top_loser_school: topLoser ? topLoser[0] : null, top_loser_count: topLoser ? topLoser[1] : 0 };
    }).filter(function(c) { return c.conference && c.conference !== 'Unknown'; }).sort(function(a, b) { return b.net_flow - a.net_flow; });
    return new Response(JSON.stringify({ conferences: conferences, year: year, fetchedAt: getChicagoTimestamp() }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders } });
  } catch (error) {
    console.error('Conference Flow Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate conference flow', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

// =============================================================================
// EMAIL NOTIFICATION SYSTEM - Resend Integration
// =============================================================================

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Blaze Sports Intel <notifications@blazesportsintel.com>',
        to: [to],
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

function generateTransferNotificationEmail(transfers, subscriber) {
  var transferRows = transfers.map(function(t) {
    return '<tr style="border-bottom: 1px solid #333;">' +
      '<td style="padding: 12px; font-weight: 600; color: #FAF8F5;">' + t.player_name + '</td>' +
      '<td style="padding: 12px; color: #999;">' + t.position + '</td>' +
      '<td style="padding: 12px; color: #FF6B35;">' + t.from_school + '</td>' +
      '<td style="padding: 12px; color: #2E7D32;">' + (t.to_school || 'Uncommitted') + '</td>' +
      '<td style="padding: 12px; color: #666;">' + t.status + '</td>' +
      '</tr>';
  }).join('');

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background-color: #0D0D0D; color: #FAF8F5;">' +
    '<div style="max-width: 600px; margin: 0 auto; padding: 20px;">' +
    '<div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #BF5700;">' +
    '<h1 style="margin: 0; color: #BF5700; font-size: 24px;">Transfer Portal Update</h1>' +
    '<p style="margin: 10px 0 0; color: #999; font-size: 14px;">Blaze Sports Intel</p></div>' +
    '<div style="padding: 30px 0;">' +
    '<p style="color: #FAF8F5; font-size: 16px; margin: 0 0 20px;">' + transfers.length + ' new transfer' + (transfers.length > 1 ? 's' : '') + ' matching your preferences:</p>' +
    '<table style="width: 100%; border-collapse: collapse; background-color: #1A1A1A; border-radius: 8px; overflow: hidden;">' +
    '<thead><tr style="background-color: #2A2A2A;">' +
    '<th style="padding: 12px; text-align: left; color: #BF5700; font-size: 12px; text-transform: uppercase;">Player</th>' +
    '<th style="padding: 12px; text-align: left; color: #BF5700; font-size: 12px; text-transform: uppercase;">Pos</th>' +
    '<th style="padding: 12px; text-align: left; color: #BF5700; font-size: 12px; text-transform: uppercase;">From</th>' +
    '<th style="padding: 12px; text-align: left; color: #BF5700; font-size: 12px; text-transform: uppercase;">To</th>' +
    '<th style="padding: 12px; text-align: left; color: #BF5700; font-size: 12px; text-transform: uppercase;">Status</th>' +
    '</tr></thead><tbody>' + transferRows + '</tbody></table>' +
    '<div style="margin-top: 30px; text-align: center;">' +
    '<a href="https://blazesportsintel.com/transfer-portal" style="display: inline-block; background-color: #BF5700; color: #FAF8F5; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">View Full Portal</a></div></div>' +
    '<div style="border-top: 1px solid #333; padding: 20px 0; text-align: center;">' +
    '<p style="color: #666; font-size: 12px; margin: 0;">Born to blaze the path less beaten.</p>' +
    '<p style="color: #666; font-size: 11px; margin: 10px 0 0;">' +
    '<a href="https://blazesportsintel.com/api/transfer-portal/unsubscribe?token=' + subscriber.unsubscribe_token + '" style="color: #999;">Unsubscribe</a></p></div></div></body></html>';
}

async function processTransferNotifications(env, corsHeaders) {
  var results = { processed: 0, sent: 0, errors: [] };

  try {
    var subscribersResult = await env.BSI_GAME_DB.prepare("SELECT * FROM notification_subscribers WHERE status = 'active' AND frequency = 'instant'").all();
    var subscribers = subscribersResult.results;

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: 'No active instant subscribers', processed: 0, sent: 0, errors: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    var transfersResult = await env.BSI_GAME_DB.prepare("SELECT * FROM transfer_portal WHERE datetime(created_at) > datetime('now', '-24 hours') ORDER BY created_at DESC").all();
    var recentTransfers = transfersResult.results;

    if (!recentTransfers || recentTransfers.length === 0) {
      return new Response(JSON.stringify({ message: 'No new transfers in last 24 hours', processed: 0, sent: 0, errors: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    for (var i = 0; i < subscribers.length; i++) {
      var subscriber = subscribers[i];
      results.processed++;
      var matchedTransfers = recentTransfers.slice();

      if (subscriber.filters_position) {
        var positions = subscriber.filters_position.split(',').map(function(p) { return p.trim().toUpperCase(); });
        matchedTransfers = matchedTransfers.filter(function(t) {
          return positions.some(function(p) { return (t.position || '').toUpperCase().indexOf(p) >= 0; });
        });
      }

      if (subscriber.filters_conference) {
        var conferences = subscriber.filters_conference.split(',').map(function(c) { return c.trim().toUpperCase(); });
        matchedTransfers = matchedTransfers.filter(function(t) {
          return conferences.some(function(c) {
            return (t.from_conference || '').toUpperCase().indexOf(c) >= 0 || (t.to_conference || '').toUpperCase().indexOf(c) >= 0;
          });
        });
      }

      if (matchedTransfers.length === 0) continue;

      if (subscriber.last_notified_at) {
        var lastNotified = new Date(subscriber.last_notified_at);
        matchedTransfers = matchedTransfers.filter(function(t) { return new Date(t.created_at) > lastNotified; });
      }

      if (matchedTransfers.length === 0) continue;

      var subject = matchedTransfers.length + ' New Transfer' + (matchedTransfers.length > 1 ? 's' : '') + ' in the Portal';
      var html = generateTransferNotificationEmail(matchedTransfers, subscriber);
      var emailResult = await sendEmail(env, subscriber.email, subject, html);

      if (emailResult.success) {
        results.sent++;
        await env.BSI_GAME_DB.prepare("UPDATE notification_subscribers SET last_notified_at = datetime('now'), notification_count = notification_count + 1, updated_at = datetime('now') WHERE id = ?").bind(subscriber.id).run();
      } else {
        results.errors.push({ email: subscriber.email, error: emailResult.error });
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Processed ' + results.processed + ' subscribers, sent ' + results.sent + ' emails', processed: results.processed, sent: results.sent, errors: results.errors, timestamp: getChicagoTimestamp() }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (error) {
    console.error('Notification processing error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, processed: results.processed, sent: results.sent, errors: results.errors }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

async function processDigestNotifications(env, frequency, corsHeaders) {
  var results = { processed: 0, sent: 0, errors: [] };
  var periodHours = frequency === 'daily' ? 24 : 168;

  try {
    var subscribersResult = await env.BSI_GAME_DB.prepare("SELECT * FROM notification_subscribers WHERE status = 'active' AND frequency = ?").bind(frequency).all();
    var subscribers = subscribersResult.results;

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: 'No active ' + frequency + ' subscribers', processed: 0, sent: 0, errors: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    var transfersResult = await env.BSI_GAME_DB.prepare("SELECT * FROM transfer_portal WHERE datetime(created_at) > datetime('now', '-" + periodHours + " hours') ORDER BY created_at DESC").all();
    var recentTransfers = transfersResult.results;

    if (!recentTransfers || recentTransfers.length === 0) {
      return new Response(JSON.stringify({ message: 'No transfers in last ' + periodHours + ' hours', processed: 0, sent: 0, errors: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    for (var i = 0; i < subscribers.length; i++) {
      var subscriber = subscribers[i];
      results.processed++;
      var matchedTransfers = recentTransfers.slice();

      if (subscriber.filters_position) {
        var positions = subscriber.filters_position.split(',').map(function(p) { return p.trim().toUpperCase(); });
        matchedTransfers = matchedTransfers.filter(function(t) {
          return positions.some(function(p) { return (t.position || '').toUpperCase().indexOf(p) >= 0; });
        });
      }

      if (subscriber.filters_conference) {
        var conferences = subscriber.filters_conference.split(',').map(function(c) { return c.trim().toUpperCase(); });
        matchedTransfers = matchedTransfers.filter(function(t) {
          return conferences.some(function(c) {
            return (t.from_conference || '').toUpperCase().indexOf(c) >= 0 || (t.to_conference || '').toUpperCase().indexOf(c) >= 0;
          });
        });
      }

      if (matchedTransfers.length === 0) continue;

      var periodLabel = frequency === 'daily' ? 'Daily' : 'Weekly';
      var subject = periodLabel + ' Transfer Portal Digest - ' + matchedTransfers.length + ' Update' + (matchedTransfers.length > 1 ? 's' : '');
      var html = generateTransferNotificationEmail(matchedTransfers, subscriber);
      var emailResult = await sendEmail(env, subscriber.email, subject, html);

      if (emailResult.success) {
        results.sent++;
        await env.BSI_GAME_DB.prepare("UPDATE notification_subscribers SET last_notified_at = datetime('now'), notification_count = notification_count + 1, updated_at = datetime('now') WHERE id = ?").bind(subscriber.id).run();
      } else {
        results.errors.push({ email: subscriber.email, error: emailResult.error });
      }
    }

    return new Response(JSON.stringify({ success: true, message: frequency + ' digest: processed ' + results.processed + ', sent ' + results.sent, processed: results.processed, sent: results.sent, errors: results.errors, timestamp: getChicagoTimestamp() }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (error) {
    console.error(frequency + ' digest error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, processed: results.processed, sent: results.sent, errors: results.errors }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}
