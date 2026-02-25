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
import { requireApiKey, provisionKey, emailKey } from './shared/auth';

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
  handleCollegeBaseballTeamSchedule,
  handleCollegeBaseballLeaders,
  handleIngestStats,
  processFinishedGames,
  handleCBBLeagueSabermetrics,
  handleCBBTeamSabermetrics,
  handleCBBTeamSOS,
  handleCBBConferencePowerIndex,
  handleCBBBulkSync,
  handleHighlightlySync,
} from './handlers/college-baseball';

import {
  handleMLBScores,
  handleMLBStandings,
  handleMLBGame,
  handleMLBPlayer,
  handleMLBTeam,
  handleMLBTeamsList,
  handleMLBNews,
  handleMLBStatsLeaders,
  handleMLBLeaderboard,
  handleMLBSpringScores,
  handleMLBSpringStandings,
  handleMLBSpringSchedule,
  handleMLBSpringRoster,
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
  handleCFBTeamsList,
  handleCFBTeam,
  handleCFBGame,
  handleCFBPlayer,
} from './handlers/cfb';

import { handleBlogPostFeedList, handleBlogPostFeedItem } from './handlers/blog-post-feed';
import { handleSearch } from './handlers/search';
import { handleCreateEmbeddedCheckout, handleSessionStatus, handleCustomerPortal } from './handlers/stripe';
import { handleLogin, handleValidateKey } from './handlers/auth';
import { handleScheduled, handleCachedScores, handleHealthProviders } from './handlers/cron';
import { handleHealth, handleAdminHealth, handleAdminErrors, handleWebSocket } from './handlers/health';
import { handleMcpRequest } from './handlers/mcp';
import {
  handleCVPitcherMechanics,
  handleCVPitcherHistory,
  handleCVInjuryAlerts,
  handleCVAdoption,
} from './handlers/cv';
import {
  handleHAVFLeaderboard,
  handleHAVFPlayer,
  handleHAVFCompare,
  handleHAVFCompute,
  handleMMILive,
  handleMMIGame,
  handleMMITrending,
  handleWinProbExample,
  handleMonteCarloExample,
} from './handlers/analytics';
import {
  handleSavantBattingLeaderboard,
  handleSavantPitchingLeaderboard,
  handleSavantPlayer,
  handleSavantParkFactors,
  handleSavantConferenceStrength,
} from './handlers/savant';
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

// --- Auth ---
app.post('/api/auth/login', (c) => handleLogin(c.req.raw, c.env));
app.get('/api/auth/validate', (c) => handleValidateKey(c.req.raw, c.env));
app.all('/api/auth/signup', (c) => c.redirect('/pricing', 302));

// --- Health ---
app.get('/health', (c) => handleHealth(c.env));
app.get('/api/health', (c) => handleHealth(c.env));

// --- Admin auth middleware — requires ADMIN_KEY secret ---
app.use('/api/admin/*', async (c, next) => {
  const key = c.env.ADMIN_KEY;
  const provided = c.req.header('X-Admin-Key') ?? c.req.query('key');
  if (!key || provided !== key) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});

app.get('/api/admin/health', (c) => handleAdminHealth(c.env));
app.get('/api/admin/errors', (c) => handleAdminErrors(new URL(c.req.url), c.env));

// --- Intel news ---
app.get('/api/intel/news', (c) => handleIntelNews(new URL(c.req.url), c.env));

// --- College Baseball ---
app.get('/api/college-baseball/scores', (c) => handleCollegeBaseballScores(new URL(c.req.url), c.env));
app.get('/api/college-baseball/standings', (c) => handleCollegeBaseballStandings(new URL(c.req.url), c.env));
app.get('/api/college-baseball/rankings', (c) => handleCollegeBaseballRankings(c.env));
app.get('/api/college-baseball/leaders', (c) => handleCollegeBaseballLeaders(c.env));
app.get('/api/college-baseball/ingest-stats', (c) => {
  const url = new URL(c.req.url);
  return handleIngestStats(c.env, url.searchParams.get('date') || undefined);
});
app.get('/api/college-baseball/schedule', (c) => handleCollegeBaseballSchedule(new URL(c.req.url), c.env));
app.get('/api/college-baseball/trending', (c) => handleCollegeBaseballTrending(c.env));
app.get('/api/college-baseball/news', (c) => handleCollegeBaseballNews(c.env));
app.get('/api/college-baseball/news/enhanced', (c) => handleCollegeBaseballNewsEnhanced(c.env));
app.get('/api/college-baseball/players', (c) => handleCollegeBaseballPlayersList(new URL(c.req.url), c.env));
app.get('/api/college-baseball/transfer-portal', (c) => handleCollegeBaseballTransferPortal(c.env));
app.get('/api/college-baseball/daily', (c) => handleCollegeBaseballDaily(new URL(c.req.url), c.env));
app.get('/api/college-baseball/sabermetrics', (c) => handleCBBLeagueSabermetrics(c.env));
app.get('/api/college-baseball/teams/:teamId/schedule', (c) => handleCollegeBaseballTeamSchedule(c.req.param('teamId'), c.env));
app.get('/api/college-baseball/teams/:teamId/sabermetrics', (c) => handleCBBTeamSabermetrics(c.req.param('teamId'), c.env));
// Diagnostics endpoint removed after ESPN verification (2026-02-25)
app.get('/api/college-baseball/sync-stats', (c) => handleCBBBulkSync(new URL(c.req.url), c.env));
app.get('/api/college-baseball/sync-highlightly', (c) => handleHighlightlySync(new URL(c.req.url), c.env));
app.get('/api/college-baseball/teams/:teamId/sos', (c) => handleCBBTeamSOS(c.req.param('teamId'), c.env));
app.get('/api/college-baseball/conferences/:conf/power-index', (c) => handleCBBConferencePowerIndex(c.req.param('conf'), c.env));
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
app.get('/api/cfb/teams', (c) => safeESPN(() => handleCFBTeamsList(c.env), 'teams', [], c.env));
app.get('/api/cfb/game/:gameId', (c) => safeESPN(() => handleCFBGame(c.req.param('gameId'), c.env), 'game', null, c.env));
app.get('/api/cfb/players/:playerId', (c) => safeESPN(() => handleCFBPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
app.get('/api/cfb/teams/:teamId', (c) => safeESPN(() => handleCFBTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

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
app.get('/api/mlb/scores', (c) => safeESPN(() => handleMLBScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/mlb/standings', (c) => safeESPN(() => handleMLBStandings(c.env), 'standings', [], c.env));
app.get('/api/mlb/news', (c) => safeESPN(() => handleMLBNews(c.env), 'articles', [], c.env));
app.get('/api/mlb/stats/leaders', (c) => safeESPN(() => handleMLBStatsLeaders(new URL(c.req.url), c.env), 'leaders', [], c.env));
app.get('/api/mlb/leaderboards/:category', (c) => safeESPN(() => handleMLBLeaderboard(c.req.param('category'), new URL(c.req.url), c.env), 'data', [], c.env));
app.get('/api/mlb/teams', (c) => safeESPN(() => handleMLBTeamsList(c.env), 'teams', [], c.env));
// Spring Training
app.get('/api/mlb/spring-training/scores', (c) => safeESPN(() => handleMLBSpringScores(new URL(c.req.url), c.env), 'games', [], c.env));
app.get('/api/mlb/spring-training/standings', (c) => safeESPN(() => handleMLBSpringStandings(c.env), 'standings', {}, c.env));
app.get('/api/mlb/spring-training/schedule', (c) => safeESPN(() => handleMLBSpringSchedule(new URL(c.req.url), c.env), 'schedule', [], c.env));
app.get('/api/mlb/spring-training/roster/:teamKey', (c) => safeESPN(() => handleMLBSpringRoster(c.req.param('teamKey'), c.env), 'roster', [], c.env));
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

// --- Analytics: HAV-F ---
app.get('/api/analytics/havf/leaderboard', (c) => handleHAVFLeaderboard(new URL(c.req.url), c.env));
app.get('/api/analytics/havf/player/:id', (c) => handleHAVFPlayer(c.req.param('id'), c.env));
app.get('/api/analytics/havf/compare/:p1/:p2', (c) => handleHAVFCompare(c.req.param('p1'), c.req.param('p2'), c.env));
app.post('/api/analytics/havf/compute', (c) => handleHAVFCompute(c.req.raw, c.env));

// --- Analytics: MMI ---
app.get('/api/analytics/mmi/live/:gameId', (c) => handleMMILive(c.req.param('gameId'), c.env));
app.get('/api/analytics/mmi/game/:gameId', (c) => handleMMIGame(c.req.param('gameId'), c.env));
app.get('/api/analytics/mmi/trending', (c) => handleMMITrending(c.env));

// --- Savant: College Baseball Advanced Analytics ---
app.get('/api/savant/batting/leaderboard', (c) => handleSavantBattingLeaderboard(new URL(c.req.url), c.env, c.req.raw.headers));
app.get('/api/savant/pitching/leaderboard', (c) => handleSavantPitchingLeaderboard(new URL(c.req.url), c.env, c.req.raw.headers));
app.get('/api/savant/player/:id', (c) => handleSavantPlayer(c.req.param('id'), new URL(c.req.url), c.env, c.req.raw.headers));
app.get('/api/savant/park-factors', (c) => handleSavantParkFactors(new URL(c.req.url), c.env, c.req.raw.headers));
app.get('/api/savant/conference-strength', (c) => handleSavantConferenceStrength(new URL(c.req.url), c.env, c.req.raw.headers));

// --- Cached scores (cron-warmed KV) ---
app.get('/api/scores/cached', (c) => {
  const sport = new URL(c.req.url).searchParams.get('sport') || 'mlb';
  return handleCachedScores(sport, c.env);
});

// --- Provider Health (cron-tracked) ---
app.get('/api/health/providers', (c) => handleHealthProviders(c.env));

// --- Search ---
app.get('/api/search', (c) => handleSearch(new URL(c.req.url), c.env));

// --- ESPN News proxy ---
app.get('/api/news/:sport', (c) => handleESPNNews(c.req.param('sport'), c.env));

// --- Model Health ---
app.get('/api/model-health', (c) => handleModelHealth(c.env));

// --- Model Examples ---
app.get('/api/models/win-probability/example', (c) => handleWinProbExample(c.env));
app.get('/api/models/monte-carlo/example', (c) => handleMonteCarloExample(c.env));

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
app.post('/webhooks/stripe', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  const webhookSecret = (c.env as Env & { STRIPE_WEBHOOK_SECRET?: string }).STRIPE_WEBHOOK_SECRET;

  // HMAC-SHA256 signature verification using Web Crypto (Workers runtime)
  // When webhook secret is configured, signature is mandatory.
  if (webhookSecret && !sig) {
    return c.json({ error: 'Missing stripe-signature header' }, 401);
  }
  if (webhookSecret && sig) {
    const pairs = sig.split(',');
    const tEntry = pairs.find((p) => p.startsWith('t='));
    const v1Entry = pairs.find((p) => p.startsWith('v1='));
    if (!tEntry || !v1Entry) return c.json({ error: 'Invalid signature header' }, 400);

    const timestamp = tEntry.slice(2);
    const expected = v1Entry.slice(3);
    const payload = `${timestamp}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computed !== expected) return c.json({ error: 'Invalid signature' }, 401);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!c.env.BSI_KEYS) {
    return c.json({ error: 'BSI_KEYS namespace not configured' }, 500);
  }

  const kv = c.env.BSI_KEYS;

  // --- checkout.session.completed: provision key for new subscriber ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      customer_email?: string;
      customer_details?: { email?: string };
      customer?: string;
      subscription?: string;
      metadata?: { tier?: string };
    };

    const email =
      session.customer_email ?? session.customer_details?.email ?? '';
    if (!email) return c.json({ error: 'No email in session' }, 400);

    const tier = (session.metadata?.tier as import('./shared/auth').KeyData['tier']) ?? 'pro';

    const apiKey = await provisionKey(kv, email, tier, {
      customerId: session.customer as string | undefined,
      subscriptionId: session.subscription as string | undefined,
    });
    await emailKey(c.env.RESEND_API_KEY, email, apiKey, tier);
  }

  // --- customer.subscription.deleted: revoke access ---
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { customer?: string };
    const customerId = sub.customer;
    if (customerId) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) await kv.delete(`key:${keyUuid}`);
        await kv.delete(`email:${email}`);
        await kv.delete(`stripe:${customerId}`);
        console.log(`[webhook] Revoked access for ${email} (subscription deleted)`);
      }
    }
  }

  // --- customer.subscription.updated: tier change ---
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as {
      customer?: string;
      metadata?: { tier?: string };
    };
    const customerId = sub.customer;
    const newTier = sub.metadata?.tier as import('./shared/auth').KeyData['tier'] | undefined;
    if (customerId && newTier) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) {
          const raw = await kv.get(`key:${keyUuid}`);
          if (raw) {
            const keyData = JSON.parse(raw) as import('./shared/auth').KeyData;
            keyData.tier = newTier;
            await kv.put(`key:${keyUuid}`, JSON.stringify(keyData));
            console.log(`[webhook] Updated tier to ${newTier} for ${email}`);
          }
        }
      }
    }
  }

  // --- customer.subscription.trial_will_end: loss-framed email 3 days before expiry ---
  if (event.type === 'customer.subscription.trial_will_end') {
    const sub = event.data.object as {
      customer?: string;
      trial_end?: number;
    };
    const customerId = sub.customer;
    if (customerId) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email && (c.env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY) {
        const trialEndDate = sub.trial_end
          ? new Date(sub.trial_end * 1000).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })
          : 'soon';

        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${(c.env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BSI <noreply@blazesportsintel.com>',
              to: email,
              subject: 'Your BSI Pro trial ends in 3 days',
              html: `
                <h2>Your BSI Pro trial ends ${trialEndDate}</h2>
                <p>After your trial, here's what you'll lose access to:</p>
                <ul>
                  <li>Live scores across MLB, NFL, NBA, NCAA</li>
                  <li>Real-time game updates every 30 seconds</li>
                  <li>Transfer portal tracking</li>
                  <li>Player pro-projection comps</li>
                  <li>Complete box scores with batting/pitching lines</li>
                  <li>Conference standings and rankings</li>
                  <li>Player comparison tools</li>
                </ul>
                <p><strong>No action needed to keep access</strong> — your card will be charged $12/mo on ${trialEndDate}.</p>
                <p>Questions? Reply to this email.</p>
                <p>— Austin @ BSI</p>
              `,
            }),
          });
          if (emailRes.ok) {
            console.log(`[webhook] Trial ending email sent to ${email}`);
          } else {
            const errBody = await emailRes.text().catch(() => 'unknown');
            console.error(`[webhook] Trial email failed for ${email}: ${emailRes.status} — ${errBody}`);
          }
        } catch (emailErr) {
          console.error(`[webhook] Trial email error for ${email}:`, emailErr);
        }
      }
    }
  }

  // --- invoice.payment_failed: log but don't revoke (Stripe retries) ---
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as { customer?: string; attempt_count?: number };
    console.warn(`[webhook] Payment failed for customer ${invoice.customer} (attempt ${invoice.attempt_count ?? '?'})`);
  }

  // --- invoice.paid: extend expiry on successful renewal ---
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as { customer?: string; billing_reason?: string };
    // Only extend on renewal, not the initial subscription payment
    if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
      const email = await kv.get(`stripe:${invoice.customer}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) {
          const raw = await kv.get(`key:${keyUuid}`);
          if (raw) {
            const keyData = JSON.parse(raw) as import('./shared/auth').KeyData;
            keyData.expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
            await kv.put(`key:${keyUuid}`, JSON.stringify(keyData));
            console.log(`[webhook] Extended expiry for ${email} (renewal paid)`);
          }
        }
      }
    }
  }

  return c.json({ received: true });
});

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
      // Alarm disabled until real data source is wired.
      // When ready: set alarm here with setAlarm(Date.now() + 30_000)
      // and wire alarm() below to fetch from Highlightly /transfer-portal.
      return new Response('PortalPoller stub — alarm not active');
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
    // Stub — no-op until wired to Highlightly /transfer-portal.
    // When active: fetch portal data, write to env.KV key 'portal:latest',
    // update lastPoll in storage, and reschedule with setAlarm().
  }
}
