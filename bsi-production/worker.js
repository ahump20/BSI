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

async function handleNCAABaseballScores(env, corsHeaders) {
  try {
    // Check cache first
    const cacheKey = 'ncaa_baseball_scores';
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' });
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
    await env.SESSIONS.put(cacheKey, JSON.stringify({ data: result, expiresAt: Date.now() + 120000 }));

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
