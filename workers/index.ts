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
import { checkInMemoryRateLimit, checkPostRateLimit, maybeCleanupRateLimit } from './shared/rate-limit';
import { proxyToPages } from './shared/proxy';

// --- Handlers ---
import {
  handleCollegeBaseballScores,
  handleCollegeBaseballStandings,
  handleCollegeBaseballRankings,
  handleCollegeBaseballTeam,
  handleCollegeBaseballPlayer,
  handleCollegeBaseballGame,
  handleCollegeBaseballSchedule,
  handleCollegeBaseballTrending,
  handleCollegeBaseballDaily,
  handleCollegeBaseballNews,
  handleCollegeBaseballPlayersList,
  handleCollegeBaseballTransferPortal,
  handleCollegeBaseballEditorialList,
  handleCollegeBaseballEditorialContent,
  handleCollegeBaseballNewsEnhanced,
  handleCollegeBaseballPlayerCompare,
  handleCollegeBaseballTrends,
} from './handlers/college-baseball';

import {
  handleMLBScores,
  handleMLBStandings,
  handleMLBGame,
  handleMLBPlayer,
  handleMLBTeam,
  handleMLBTeamsList,
  handleMLBNews,
} from './handlers/mlb';

import {
  handleNFLScores,
  handleNFLStandings,
  handleNFLGame,
  handleNFLPlayer,
  handleNFLTeam,
  handleNFLTeamsList,
  handleNFLNews,
  handleNFLPlayers,
  handleNFLLeaders,
} from './handlers/nfl';

import {
  handleNBAScores,
  handleNBAStandings,
  handleNBAGame,
  handleNBAPlayer,
  handleNBATeamFull,
  handleNBATeamsList,
  handleNBANews,
} from './handlers/nba';

import {
  handleCFBTransferPortal,
  handleCFBScores,
  handleCFBStandings,
  handleCFBNews,
  handleCFBArticle,
  handleCFBArticlesList,
} from './handlers/cfb';

import { handleSearch } from './handlers/search';
import { handleHealth, handleAdminHealth, handleAdminErrors, handleWebSocket } from './handlers/health';
import { handleMcpRequest } from './handlers/mcp';
import {
  handleCVPitcherMechanics,
  handleCVPitcherHistory,
  handleCVInjuryAlerts,
  handleCVAdoption,
} from './handlers/cv';
import {
  handleHAVFPlayer,
  handleHAVFLeaderboard,
  handleHAVFCompare,
  handleMMILive,
  handleMMIGame,
  handleMMITrending,
} from './handlers/analytics';
import { handleLeaderboard, handleLeaderboardSubmit, handleGameAsset, handleArcadeStats, handleGameLeaderboard } from './handlers/games';
import {
  handleTeams,
  handleLead,
  handleFeedback,
  handleIntelNews,
  handleESPNNews,
  handleModelHealth,
  handlePredictionSubmit,
  handlePredictionAccuracy,
  handleAnalyticsEvent,
  handleContact,
  handleCSPReport,
} from './handlers/misc';

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
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  c.res.headers.set('Access-Control-Max-Age', '86400');
  c.res.headers.set('Vary', 'Origin');
});

// --- Middleware: Security headers ---
app.use('*', async (c, next) => {
  await next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    c.res.headers.set(key, value);
  }
});

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
  return c.json({ error: publicMessage }, 500);
});

// =============================================================================
// Routes
// =============================================================================

// --- MCP Protocol ---
app.all('/mcp', (c) => handleMcpRequest(c.req.raw, c.env));

// --- Auth stubs ---
app.all('/api/auth/login', (c) => c.json({ error: 'Authentication is not yet available.' }, 501));
app.all('/api/auth/signup', (c) => c.json({ error: 'Authentication is not yet available.' }, 501));

// --- Health ---
app.get('/health', (c) => handleHealth(c.env));
app.get('/api/health', (c) => handleHealth(c.env));
app.get('/api/admin/health', (c) => handleAdminHealth(c.env));
app.get('/api/admin/errors', (c) => handleAdminErrors(new URL(c.req.url), c.env));

// --- Intel news ---
app.get('/api/intel/news', (c) => handleIntelNews(new URL(c.req.url), c.env));

// --- College Baseball ---
app.get('/api/college-baseball/scores', (c) => handleCollegeBaseballScores(new URL(c.req.url), c.env));
app.get('/api/college-baseball/standings', (c) => handleCollegeBaseballStandings(new URL(c.req.url), c.env));
app.get('/api/college-baseball/rankings', (c) => handleCollegeBaseballRankings(c.env));
app.get('/api/college-baseball/schedule', (c) => handleCollegeBaseballSchedule(new URL(c.req.url), c.env));
app.get('/api/college-baseball/trending', (c) => handleCollegeBaseballTrending(c.env));
app.get('/api/college-baseball/news', (c) => handleCollegeBaseballNews(c.env));
app.get('/api/college-baseball/news/enhanced', (c) => handleCollegeBaseballNewsEnhanced(c.env));
app.get('/api/college-baseball/players', (c) => handleCollegeBaseballPlayersList(new URL(c.req.url), c.env));
app.get('/api/college-baseball/transfer-portal', (c) => handleCollegeBaseballTransferPortal(c.env));
app.get('/api/college-baseball/daily', (c) => handleCollegeBaseballDaily(new URL(c.req.url), c.env));
app.get('/api/college-baseball/teams/:teamId', (c) => handleCollegeBaseballTeam(c.req.param('teamId'), c.env));
app.get('/api/college-baseball/players/compare/:p1/:p2', (c) => handleCollegeBaseballPlayerCompare(c.req.param('p1'), c.req.param('p2'), c.env));
app.get('/api/college-baseball/players/:playerId', (c) => handleCollegeBaseballPlayer(c.req.param('playerId'), c.env));
app.get('/api/college-baseball/game/:gameId', (c) => handleCollegeBaseballGame(c.req.param('gameId'), c.env));
app.get('/api/college-baseball/games/:gameId', (c) => handleCollegeBaseballGame(c.req.param('gameId'), c.env));
app.get('/api/college-baseball/trends/:teamId', (c) => handleCollegeBaseballTrends(c.req.param('teamId'), c.env));
app.get('/api/college-baseball/editorial/list', (c) => handleCollegeBaseballEditorialList(c.env));
app.get('/api/college-baseball/editorial/daily/:date', (c) => handleCollegeBaseballEditorialContent(c.req.param('date'), c.env));
app.get('/api/college-baseball/scores/ws', (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'Expected websocket upgrade' }, 400);
  }
  return c.json({ error: 'WebSocket scores available at bsi-live-scores worker', redirect: true }, 501);
});

// --- CFB ---
app.get('/api/cfb/transfer-portal', (c) => handleCFBTransferPortal(c.env));
app.get('/api/cfb/scores', (c) => safeESPN(() => handleCFBScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/cfb/standings', (c) => safeESPN(() => handleCFBStandings(c.env), 'standings', [], c.env));
app.get('/api/cfb/news', (c) => safeESPN(() => handleCFBNews(c.env), 'articles', [], c.env));
app.get('/api/ncaa/scores', (c) => {
  if (c.req.query('sport') === 'football') return safeESPN(() => handleCFBScores(new URL(c.req.url), c.env), 'games', [], c.env);
  return c.json({ error: 'Specify ?sport=football' }, 400);
});
app.get('/api/ncaa/standings', (c) => {
  if (c.req.query('sport') === 'football') return safeESPN(() => handleCFBStandings(c.env), 'standings', [], c.env);
  return c.json({ error: 'Specify ?sport=football' }, 400);
});
app.get('/api/college-football/articles', (c) => handleCFBArticlesList(new URL(c.req.url), c.env));
app.get('/api/college-football/articles/:slug', (c) => handleCFBArticle(c.req.param('slug'), c.env));

// --- MLB ---
app.get('/api/mlb/scores', (c) => safeESPN(() => handleMLBScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/mlb/standings', (c) => safeESPN(() => handleMLBStandings(c.env), 'standings', [], c.env));
app.get('/api/mlb/news', (c) => safeESPN(() => handleMLBNews(c.env), 'articles', [], c.env));
app.get('/api/mlb/teams', (c) => safeESPN(() => handleMLBTeamsList(c.env), 'teams', [], c.env));
app.get('/api/mlb/game/:gameId', (c) => safeESPN(() => handleMLBGame(c.req.param('gameId'), c.env), 'game', null, c.env));
app.get('/api/mlb/players/:playerId', (c) => safeESPN(() => handleMLBPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
app.get('/api/mlb/teams/:teamId', (c) => safeESPN(() => handleMLBTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

// --- NFL ---
app.get('/api/nfl/scores', (c) => safeESPN(() => handleNFLScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/nfl/standings', (c) => safeESPN(() => handleNFLStandings(c.env), 'standings', [], c.env));
app.get('/api/nfl/news', (c) => safeESPN(() => handleNFLNews(c.env), 'articles', [], c.env));
app.get('/api/nfl/teams', (c) => safeESPN(() => handleNFLTeamsList(c.env), 'teams', [], c.env));
app.get('/api/nfl/players', (c) => safeESPN(() => handleNFLPlayers(new URL(c.req.url), c.env), 'players', [], c.env));
app.get('/api/nfl/leaders', (c) => safeESPN(() => handleNFLLeaders(c.env), 'categories', [], c.env));
app.get('/api/nfl/game/:gameId', (c) => safeESPN(() => handleNFLGame(c.req.param('gameId'), c.env), 'game', null, c.env));
app.get('/api/nfl/players/:playerId', (c) => safeESPN(() => handleNFLPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
app.get('/api/nfl/teams/:teamId', (c) => safeESPN(() => handleNFLTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

// --- NBA ---
app.get('/api/nba/scores', (c) => safeESPN(() => handleNBAScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/nba/scoreboard', (c) => safeESPN(() => handleNBAScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/nba/standings', (c) => safeESPN(() => handleNBAStandings(c.env), 'standings', [], c.env));
app.get('/api/nba/news', (c) => safeESPN(() => handleNBANews(c.env), 'articles', [], c.env));
app.get('/api/nba/teams', (c) => safeESPN(() => handleNBATeamsList(c.env), 'teams', [], c.env));
app.get('/api/nba/game/:gameId', (c) => safeESPN(() => handleNBAGame(c.req.param('gameId'), c.env), 'game', null, c.env));
app.get('/api/nba/players/:playerId', (c) => safeESPN(() => handleNBAPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
app.get('/api/nba/teams/:teamId', (c) => safeESPN(() => handleNBATeamFull(c.req.param('teamId'), c.env), 'team', null, c.env));

// --- R2 Game assets ---
app.get('/api/games/assets/*', (c) => {
  const path = c.req.path.replace('/api/games/assets/', '');
  return path ? handleGameAsset(path, c.env) : c.json({ error: 'Asset path required' }, 400);
});

// --- CV Intelligence ---
app.get('/api/cv/pitcher/:playerId/mechanics/history', (c) => handleCVPitcherHistory(c.req.param('playerId'), new URL(c.req.url), c.env));
app.get('/api/cv/pitcher/:playerId/mechanics', (c) => handleCVPitcherMechanics(c.req.param('playerId'), c.env));
app.get('/api/cv/alerts/injury-risk', (c) => handleCVInjuryAlerts(new URL(c.req.url), c.env));
app.get('/api/cv/adoption', (c) => handleCVAdoption(new URL(c.req.url), c.env));

// --- HAV-F Analytics ---
app.get('/api/analytics/havf/leaderboard', (c) => handleHAVFLeaderboard(new URL(c.req.url), c.env));
app.get('/api/analytics/havf/compare/:p1/:p2', (c) => handleHAVFCompare(c.req.param('p1'), c.req.param('p2'), c.env));
app.get('/api/analytics/havf/player/:playerId', (c) => handleHAVFPlayer(c.req.param('playerId'), c.env));

// --- MMI (Momentum Magnitude Index) ---
app.get('/api/analytics/mmi/live/:gameId', (c) => handleMMILive(c.req.param('gameId'), c.env));
app.get('/api/analytics/mmi/game/:gameId', (c) => handleMMIGame(c.req.param('gameId'), c.env));
app.get('/api/analytics/mmi/trending', (c) => handleMMITrending(new URL(c.req.url), c.env));

// --- Search ---
app.get('/api/search', (c) => handleSearch(new URL(c.req.url), c.env));

// --- ESPN News proxy ---
app.get('/api/news/:sport', (c) => handleESPNNews(c.req.param('sport'), c.env));

// --- Model Health ---
app.get('/api/model-health', (c) => handleModelHealth(c.env));

// --- Predictions ---
app.post('/api/predictions', (c) => handlePredictionSubmit(c.req.raw, c.env));
app.get('/api/predictions/accuracy', (c) => handlePredictionAccuracy(c.env));

// --- Analytics ---
app.post('/api/analytics/event', (c) => handleAnalyticsEvent(c.req.raw, c.env));

// --- Feedback ---
app.post('/api/feedback', (c) => handleFeedback(c.req.raw, c.env));

// --- CSP Reports ---
app.post('/_csp/report', (c) => handleCSPReport(c.req.raw, c.env));

// --- Leaderboard ---
app.get('/api/multiplayer/leaderboard', (c) => handleLeaderboard(new URL(c.req.url), c.env));
app.post('/api/multiplayer/leaderboard', (c) => handleLeaderboardSubmit(c.req.raw, c.env));
app.get('/multiplayer/leaderboard', (c) => handleLeaderboard(new URL(c.req.url), c.env));
app.post('/multiplayer/leaderboard', (c) => handleLeaderboardSubmit(c.req.raw, c.env));

// --- Arcade ---
app.get('/api/arcade/stats', (c) => handleArcadeStats(c.env));
app.get('/api/arcade/leaderboard/:gameId', (c) => handleGameLeaderboard(c.req.param('gameId'), new URL(c.req.url), c.env));

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

// --- Fallback: proxy to Cloudflare Pages ---
app.all('*', (c) => proxyToPages(c.req.raw, c.env));

export default app;

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

// =============================================================================
// Durable Object — PortalPoller
// =============================================================================

export class PortalPoller {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/start') {
      const currentAlarm = await this.state.storage.getAlarm();
      if (!currentAlarm) {
        await this.state.storage.setAlarm(Date.now() + 30_000);
      }
      return new Response('PortalPoller started');
    }

    if (url.pathname === '/stop') {
      await this.state.storage.deleteAlarm();
      return new Response('PortalPoller stopped');
    }

    if (url.pathname === '/status') {
      const alarm = await this.state.storage.getAlarm();
      const lastPoll = await this.state.storage.get<string>('lastPoll');
      return new Response(
        JSON.stringify({ alarmSet: !!alarm, lastPoll: lastPoll || 'never' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.state.storage.put('lastPoll', now);
      // TODO: Wire to a real data source when available
    } catch (err) {
      console.error('[PortalPoller] alarm error:', err instanceof Error ? err.message : err);
    }
  }
}
