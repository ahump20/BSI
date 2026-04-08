/**
 * Blaze Sports Intel — Hybrid Workers Router (Hono)
 *
 * This is the apex Worker that sits in front of blazesportsintel.com.
 * Routes are declared via Hono; cross-cutting concerns (CORS, rate limiting,
 * security headers, redirects) are handled by middleware.
 *
 * All handler logic lives in workers/handlers/*.ts
 * Shared utilities live in workers/shared/*.ts
 */

import { Hono } from 'hono';

// --- Shared ---
import type { Env } from './shared/types';
import { SECURITY_HEADERS, GHOST_REDIRECTS } from './shared/constants';
import { logError, safeESPN } from './shared/helpers';
import { corsOrigin, corsHeaders } from './shared/cors';
import { securityMiddleware } from './shared/security';
import { checkInMemoryRateLimit, checkPostRateLimit, maybeCleanupRateLimit } from './shared/rate-limit';
import { proxyToPages } from './shared/proxy';
import { requireApiKey } from './shared/auth';
import { handleScoutingReport } from './handlers/scouting';
import { handleAssetRequest } from './handlers/assets';

// --- Domain Routers (extracted from this file — see workers/routes/*.ts) ---
import { cbb } from './routes/college-baseball';
import { mlb } from './routes/mlb';
import { nfl } from './routes/nfl';
import { nba } from './routes/nba';
import { cfb, cfbEditorial } from './routes/cfb';
import { analytics, savant, nil, models } from './routes/analytics';

// --- Handlers (shared / non-domain-specific) ---
import { handleBlogPostFeedList, handleBlogPostFeedItem } from './handlers/blog-post-feed';
import { handleSearch } from './handlers/search';
import { handleEvaluatePlayer, handleEvaluateSearch } from './handlers/evaluate';
import { handlePushRegister, handlePushSend } from './handlers/push';
import { handleCreateEmbeddedCheckout, handleSessionStatus, handleCustomerPortal, handleStripeWebhook } from './handlers/stripe';
import { handleLogin, handleValidateKey } from './handlers/auth';
import { handleScheduled, handleCachedScores, handleHealthProviders } from './handlers/cron';
import { handleHealth, handleStatus, handleAdminHealth, handleAdminErrors, handleWebSocket } from './handlers/health';
import { handleFreshness } from './handlers/freshness';
import { handleMcpRequest } from './handlers/mcp';
import { handleHeroScores } from './handlers/hero-scores';
import { handleScoresOverview } from './handlers/scores';
import {
  handleLeaderboard,
  handleLeaderboardSubmit,
  handleGameAsset,
  handleArcadeGames,
  handleArcadeStats,
  handleArcadeSession,
} from './handlers/games';
import { handleTeams, handleModelHealth, handleAnalyticsEvent, handleWeeklyBrief } from './handlers/general';
import { handleContact, handleLead, handleFeedback, handleCSPReport } from './handlers/lead';
import { handlePredictionSubmit, handlePredictionAccuracy } from './handlers/predictions';
import { handleIntelNews, handleESPNNews } from './handlers/news';
import { handlePortalPlayerDetail } from './handlers/college-baseball';
import { processFinishedGames } from './handlers/college-baseball';
import {
  handleV1Seasons, handleV1Teams, handleV1Team, handleV1Players, handleV1Player,
  handleV1Games, handleV1Game, handleV1Boxscore, handleV1PBP,
  handleV1MetricsPlayers, handleV1MetricsTeams, handleV1PlayerSplits, handleV1Provenance,
} from './handlers/college-baseball/ncaa-v1';
import { handleCBBScores as handleCBBBasketballScores, handleCBBStandings as handleCBBBasketballStandings, handleCBBTeams as handleCBBBasketballTeams } from './handlers/cbb';

// =============================================================================
// Hono App
// =============================================================================


const app = new Hono<{ Bindings: Env }>();

// --- Middleware: www → apex canonical redirect ---
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === 'www.blazesportsintel.com') {
    url.hostname = 'blazesportsintel.com';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  // wbc.blazesportsintel.com → blazesportsintel.com/wbc (301 redirect)
  if (url.hostname === 'wbc.blazesportsintel.com') {
    const target = `https://blazesportsintel.com/wbc${url.pathname === '/' ? '' : url.pathname}${url.search}`;
    return new Response(null, { status: 301, headers: { Location: target } });
  }
  // labs.blazesportsintel.com → blazesportsintel.com (301 redirect, consolidated)
  if (url.hostname === 'labs.blazesportsintel.com') {
    const labsRouteMap: Record<string, string> = {
      '/': '/college-baseball/savant/',
      '/leaderboards': '/college-baseball/savant/',
      '/standings': '/college-baseball/standings/',
      '/rankings': '/college-baseball/rankings/',
      '/games': '/college-baseball/games/',
      '/compare': '/college-baseball/compare/',
      '/conferences': '/college-baseball/conferences/',
      '/park-factors': '/college-baseball/savant/park-factors/',
      '/glossary': '/college-baseball/savant/glossary/',
      '/visuals': '/college-baseball/savant/visuals/',
      '/bubble': '/college-baseball/savant/bubble/',
      '/radar-lab': '/college-baseball/savant/',
      '/nil-explorer': '/nil-valuation/',
      '/athletic-analysis': '/college-baseball/savant/',
    };
    const path = url.pathname.replace(/\/$/, '') || '/';
    // Player detail: /players/:id → /college-baseball/savant/player/:id/
    const playerMatch = path.match(/^\/players\/(\d+)/);
    if (playerMatch) {
      return new Response(null, { status: 301, headers: { Location: `https://blazesportsintel.com/college-baseball/savant/player/${playerMatch[1]}/` } });
    }
    // Team detail: /teams/:id → /college-baseball/teams/:id/
    const teamMatch = path.match(/^\/teams\/(.+)/);
    if (teamMatch) {
      return new Response(null, { status: 301, headers: { Location: `https://blazesportsintel.com/college-baseball/teams/${teamMatch[1]}/` } });
    }
    const target = labsRouteMap[path] || '/college-baseball/savant/';
    return new Response(null, { status: 301, headers: { Location: `https://blazesportsintel.com${target}` } });
  }
  await next();
});

// --- Middleware: Trailing slash normalization (static page paths only) ---
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  // Only redirect page-like paths — skip API, WebSocket, health, MCP, file extensions
  if (
    path === '/' ||
    path.startsWith('/api/') ||
    path.startsWith('/webhooks') ||
    path.startsWith('/_csp/') ||
    path.startsWith('/_next/') ||
    path === '/ws' ||
    path === '/health' ||
    path === '/mcp' ||
    path.endsWith('/') ||
    path.includes('.')
  ) {
    await next();
    return;
  }
  url.pathname = path + '/';
  return new Response(null, { status: 301, headers: { Location: url.toString() } });
});

// --- Middleware: CORS ---
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(c.req.raw, c.env) });
  }
  await next();
  const origin = corsOrigin(c.req.raw, c.env);
  c.res.headers.set('Access-Control-Allow-Origin', origin);
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-BSI-Key');
  c.res.headers.set('Access-Control-Max-Age', '86400');
  c.res.headers.set('Vary', 'Origin, Accept-Encoding');
});

// --- Middleware: Security headers ---
app.use('*', securityMiddleware);

// --- Middleware: Rate limiting on /api/* ---
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  maybeCleanupRateLimit();
  if (!checkInMemoryRateLimit(ip)) {
    console.warn('[rate-limit]', ip);
    return c.json({ error: 'Rate limit exceeded. Try again shortly.' }, 429);
  }
  // Tighter limit for POST endpoints (10/min vs 120/min)
  if (c.req.method === 'POST' && !checkPostRateLimit(ip)) {
    return c.json({ error: 'Too many submissions. Try again shortly.' }, 429);
  }
  await next();
});

// --- Middleware: Ghost route redirects ---
app.use('*', async (c, next) => {
  const redirect = GHOST_REDIRECTS[c.req.path];
  if (redirect) {
    const url = new URL(c.req.url);
    return new Response(null, {
      status: 301,
      headers: { Location: url.origin + redirect },
    });
  }
  await next();
});

// --- Error handler ---
app.onError(async (err, c) => {
  const detail = err instanceof Error ? err.message : 'Internal server error';
  await logError(c.env, detail, c.req.path);
  const publicMessage = c.env.ENVIRONMENT === 'production' ? 'Internal server error' : detail;
  return c.json({ error: publicMessage, code: 'INTERNAL_ERROR', status: 500 }, 500);
});

// =============================================================================
// Routes
// =============================================================================

// --- MCP Protocol ---
app.all('/mcp', (c) => handleMcpRequest(c.req.raw, c.env));

// --- Auth ---
app.post('/api/auth/login', (c) => handleLogin(c.req.raw, c.env));
app.get('/api/auth/validate', (c) => handleValidateKey(c.req.raw, c.env));
app.all('/api/auth/signup', (c) => c.redirect('/pricing', 302));

// --- Hero Scores (homepage strip) ---
app.get('/api/hero-scores', (c) => handleHeroScores(new URL(c.req.url), c.env));

// --- R2 Asset Delivery ---
app.get('/api/assets/:bucket/*', (c) => {
  const bucket = c.req.param('bucket');
  const objectKey = c.req.path.replace(`/api/assets/${bucket}/`, '');
  return handleAssetRequest(c.req.raw, c.env, bucket, objectKey);
});

// --- Health ---
app.get('/health', (c) => handleHealth(c.env));
app.get('/api/health', (c) => handleHealth(c.env));
app.get('/api/status', (c) => handleStatus(c.env));

// --- Admin auth middleware — requires ADMIN_KEY secret ---
app.use('/api/admin/*', async (c, next) => {
  const key = c.env.ADMIN_KEY;
  const provided = c.req.header('X-Admin-Key') ?? c.req.query('key');
  if (!key || provided !== key) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});

app.get('/api/admin/health', (c) => handleAdminHealth(c.env));
app.get('/api/admin/freshness', (c) => handleFreshness(c.req.raw, c.env));
app.get('/api/admin/errors', (c) => handleAdminErrors(new URL(c.req.url), c.env));

// --- Intel news ---
app.get('/api/intel/news', (c) => handleIntelNews(new URL(c.req.url), c.env));

// --- Live Game Widget ---
app.get('/api/live/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  
  // Try BSI_PROD_CACHE first
  const cached = await c.env.BSI_PROD_CACHE?.get(`live:${gameId}`);
  if (cached) {
    return c.json(JSON.parse(cached), 200, {
      'Cache-Control': 'public, max-age=15',
      'Access-Control-Allow-Origin': '*',
    });
  }
  
  // Fallback: return a demo/stub for unknown game IDs
  // (real data comes from bsi-intelligence-stream writing to BSI_PROD_CACHE)
  return c.json({
    game_id: gameId,
    home: { abbr: 'TEX', score: 0, record: '0-0' },
    away: { abbr: 'OPP', score: 0 },
    inning: 1,
    half: 'top',
    situation: {
      outs: 0,
      runners: [],
      leverage: 'LOW',
      description: 'Game data loading...',
    },
    win_probability: { home: 0.5, away: 0.5 },
    current_pitcher: { name: '—', pitch_count: 0, era: 0.0 },
    last_play: '—',
    recent_pitches: [],
    meta: { source: 'BSI', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  }, 200, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
});

// CORS preflight for widget embeds
app.options('/api/live/*', (c) => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
});

// =============================================================================
// Domain Routers (see workers/routes/*.ts for route definitions)
// =============================================================================
app.route('/api/college-baseball', cbb);
app.get('/api/portal/player/:playerId', (c) => handlePortalPlayerDetail(c.req.param('playerId'), c.env));

// --- NCAA Baseball v1 API ---
// Default cache headers for v1 API responses (60s browser, 5min edge)
app.use('/v1/*', async (c, next) => {
  await next();
  if (c.res.ok && !c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }
});
app.get('/v1/seasons', (c) => handleV1Seasons(new URL(c.req.url), c.env));
app.get('/v1/teams', (c) => handleV1Teams(new URL(c.req.url), c.env));
app.get('/v1/teams/:teamId', (c) => handleV1Team(c.req.param('teamId'), c.env));
app.get('/v1/players', (c) => handleV1Players(new URL(c.req.url), c.env));
app.get('/v1/players/:playerId/splits', (c) => handleV1PlayerSplits(c.req.param('playerId'), new URL(c.req.url), c.env));
app.get('/v1/players/:playerId', (c) => handleV1Player(c.req.param('playerId'), c.env));
app.get('/v1/games', (c) => handleV1Games(new URL(c.req.url), c.env));
app.get('/v1/games/:gameId/boxscore', (c) => handleV1Boxscore(c.req.param('gameId'), new URL(c.req.url), c.env));
app.get('/v1/games/:gameId/pbp', (c) => handleV1PBP(c.req.param('gameId'), new URL(c.req.url), c.env));
app.get('/v1/games/:gameId', (c) => handleV1Game(c.req.param('gameId'), c.env));
app.get('/v1/metrics/players', (c) => handleV1MetricsPlayers(new URL(c.req.url), c.env));
app.get('/v1/metrics/teams', (c) => handleV1MetricsTeams(new URL(c.req.url), c.env));
app.get('/v1/provenance/:resource', (c) => handleV1Provenance(c.req.param('resource'), new URL(c.req.url), c.env));

// --- CFB ---
app.route('/api/cfb', cfb);
app.route('/api/college-football', cfbEditorial);
app.get('/api/ncaa/scores', (c) => {
  if (c.req.query('sport') === 'football') return safeESPN(() => import('./handlers/cfb').then(m => m.handleCFBScores(new URL(c.req.url), c.env)), 'games', [], c.env);
  return c.json({ error: 'Specify ?sport=football' }, 400);
});
app.get('/api/ncaa/standings', (c) => {
  if (c.req.query('sport') === 'football') return safeESPN(() => import('./handlers/cfb').then(m => m.handleCFBStandings(c.env)), 'standings', [], c.env);
  return c.json({ error: 'Specify ?sport=football' }, 400);
});

// --- Blog Post Feed ---
app.get('/api/blog-post-feed', (c) =>
  handleBlogPostFeedList(c.env, {
    category: c.req.query('category') ?? undefined,
    featured: c.req.query('featured') === 'true',
    limit: Math.min(Number(c.req.query('limit') || 20), 50),
    offset: Number(c.req.query('offset') || 0),
  })
);
app.get('/api/blog-post-feed/:slug', (c) =>
  handleBlogPostFeedItem(c.req.param('slug'), c.env)
);

// --- MLB ---
app.route('/api/mlb', mlb);

// --- NFL, NBA ---
app.route('/api/nfl', nfl);
app.route('/api/nba', nba);

// --- CBB (College Basketball) ---
app.get('/api/cbb/scores', (c) => handleCBBBasketballScores(new URL(c.req.url), c.env));
app.get('/api/cbb/standings', (c) => handleCBBBasketballStandings(c.env));
app.get('/api/cbb/teams', (c) => handleCBBBasketballTeams(c.env));

// --- R2 Game assets ---
app.get('/api/games/assets/*', (c) => {
  const path = c.req.path.replace('/api/games/assets/', '');
  return path ? handleGameAsset(path, c.env) : c.json({ error: 'Asset path required' }, 400);
});

// --- Analytics, Savant, NIL, CV (see workers/routes/analytics.ts) ---
app.route('/api/analytics', analytics);
app.route('/api/savant', savant);
app.route('/api/nil', nil);
app.route('/api/models', models);

// --- Cached scores (cron-warmed KV) ---
app.get('/api/scores/cached', (c) => {
  const sport = new URL(c.req.url).searchParams.get('sport') || 'mlb';
  return handleCachedScores(sport, c.env);
});
app.get('/api/scores/overview', (c) => {
  let ctx: ExecutionContext | undefined;
  try { ctx = c.executionCtx; } catch { /* test env */ }
  return handleScoresOverview(new URL(c.req.url), c.env, ctx);
});

// --- Provider Health (cron-tracked) ---
app.get('/api/health/providers', (c) => handleHealthProviders(c.env));

// --- Push Notifications ---
app.post('/api/push/register', (c) => handlePushRegister(c.req.raw, c.env));
app.post('/api/push/send', (c) => handlePushSend(c.env));

// --- Search ---
app.get('/api/search', (c) => handleSearch(new URL(c.req.url), c.env));

// --- Player Evaluation ---
app.get('/api/evaluate/player/:sport/:playerId', (c) => handleEvaluatePlayer(c.req.param('sport'), c.req.param('playerId'), c.env));
app.get('/api/evaluate/search', (c) => handleEvaluateSearch(new URL(c.req.url), c.env));

// --- ESPN News proxy ---
app.get('/api/news/:sport', (c) => handleESPNNews(c.req.param('sport'), c.env));

// --- Model Health ---
app.get('/api/model-health', (c) => handleModelHealth(c.env));

// --- Intel Weekly Brief ---
app.get('/api/intel/weekly-brief', (c) => handleWeeklyBrief(c.env));

// --- Stripe ---
app.get('/api/stripe/session-status', (c) => handleSessionStatus(new URL(c.req.url), c.env));
app.post('/api/stripe/create-embedded-checkout', (c) => handleCreateEmbeddedCheckout(c.req.raw, c.env));
app.post('/api/stripe/customer-portal', (c) => handleCustomerPortal(c.req.raw, c.env));

// --- Predictions ---
app.post('/api/predictions', (c) => handlePredictionSubmit(c.req.raw, c.env));
app.get('/api/predictions/accuracy', (c) => handlePredictionAccuracy(c.env));

// --- Analytics ---
app.post('/api/analytics/event', (c) => handleAnalyticsEvent(c.req.raw, c.env));

// --- Feedback ---
app.post('/api/feedback', (c) => handleFeedback(c.req.raw, c.env));

// --- CSP Reports ---
app.post('/_csp/report', (c) => handleCSPReport(c.req.raw, c.env));

// --- Arcade ---
app.get('/api/arcade/games', (c) => handleArcadeGames(new URL(c.req.url)));
app.get('/api/arcade/stats', (c) => handleArcadeStats(new URL(c.req.url), c.env));
app.post('/api/arcade/sessions', (c) => handleArcadeSession(c.req.raw, c.env));

// --- Leaderboard ---
app.get('/api/multiplayer/leaderboard', (c) => handleLeaderboard(new URL(c.req.url), c.env));
app.post('/api/multiplayer/leaderboard', (c) => handleLeaderboardSubmit(c.req.raw, c.env));
app.get('/multiplayer/leaderboard', (c) => handleLeaderboard(new URL(c.req.url), c.env));
app.post('/multiplayer/leaderboard', (c) => handleLeaderboardSubmit(c.req.raw, c.env));

// --- Teams ---
app.get('/api/teams/:league', (c) => safeESPN(() => handleTeams(c.req.param('league'), c.env), 'teams', [], c.env));
app.get('/teams/:league', (c) => safeESPN(() => handleTeams(c.req.param('league'), c.env), 'teams', [], c.env));

// --- Contact + Lead capture ---
app.post('/api/contact', (c) => handleContact(c.req.raw, c.env));
app.post('/api/lead', (c) => handleLead(c.req.raw, c.env));
app.post('/api/leads', (c) => handleLead(c.req.raw, c.env));

// --- WebSocket ---
app.get('/ws', (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'Expected websocket upgrade' }, 400);
  }
  return handleWebSocket();
});

// --- Premium API routes — require valid BSI key ---
app.use('/api/premium/*', requireApiKey);

app.get('/api/premium/predictions/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  // Forward to bsi-prediction-api or read from PREDICTION_CACHE KV
  const cached = await c.env.PREDICTION_CACHE?.get(`pred:${gameId}`);
  if (cached) return c.json(JSON.parse(cached));
  return c.json({ error: 'Game not found', gameId }, 404);
});

app.get('/api/premium/live/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  const cached = await c.env.BSI_PROD_CACHE?.get(`live:${gameId}`);
  if (cached) return c.json(JSON.parse(cached));
  return c.json({ error: 'Game not found', gameId }, 404);
});

// --- Stripe webhook — provision key on successful checkout ---
app.post('/webhooks/stripe', (c) => handleStripeWebhook(c));

// --- Fallback: proxy to Cloudflare Pages ---
app.all('*', (c) => proxyToPages(c.req.raw, c.env));

// Module export with fetch (Hono) + scheduled (cron) handlers
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    await handleScheduled(env);
  },
};

// =============================================================================
// Durable Object — CacheObject
// =============================================================================

export class CacheObject {
  private state: DurableObjectState;
  private cache: Map<string, { data: unknown; expires: number }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.cache = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (request.method === 'GET' && key) {
      const cached = this.cache.get(key);
      if (cached && cached.expires > Date.now()) {
        return new Response(JSON.stringify(cached.data));
      }
      return new Response('null');
    }

    if (request.method === 'PUT' && key) {
      const ttl = parseInt(url.searchParams.get('ttl') || '60000');
      const data = await request.json();
      this.cache.set(key, { data, expires: Date.now() + ttl });
      return new Response('OK');
    }

    return new Response('Method not allowed', { status: 405 });
  }
}

/**
 * PortalPoller — stub for Durable Objects migration cleanup.
 * The real PortalPoller was removed but Cloudflare requires the class to
 * exist during the delete-class migration transition. Safe to remove once
 * the v2 migration has been applied to all environments.
 */
export class PortalPoller {
  constructor(private state: DurableObjectState) {}
  async fetch(): Promise<Response> {
    return new Response('PortalPoller deprecated', { status: 410 });
  }
}

