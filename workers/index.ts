/**
 * Blaze Sports Intel — Hono Workers Router
 *
 * Apex Worker for blazesportsintel.com. Routes all traffic:
 *   - /api/* → Hono route modules (SportsDataIO, NCAA, ESPN, D1, KV, R2)
 *   - /mcp   → MCP JSON-RPC 2.0 handler
 *   - /ws    → WebSocket heartbeat
 *   - /*     → proxy to Cloudflare Pages (static Next.js export)
 */

import { Hono } from 'hono';
import type { Env } from './src/env';

// Middleware
import { cors } from './src/middleware/cors';
import { rateLimit } from './src/middleware/rate-limit';
import { securityHeaders } from './src/middleware/security-headers';
import { errorHandler } from './src/middleware/error-handler';

// Route modules
import { collegeBaseballRoutes } from './src/routes/college-baseball';
import { nflRoutes, mlbRoutes, nbaRoutes, cfbRoutes, cbbRoutes, golfRoutes, gridRoutes } from './src/routes/sports-data';
import { newsRoutes } from './src/routes/news';
import { cvIntelRoutes } from './src/routes/cv-intel';
import { analyticsRoutes } from './src/routes/analytics';
import { healthRoutes } from './src/routes/health';
import { searchRoutes } from './src/routes/search';
import { mcpRoutes } from './src/routes/mcp';
import { miscRoutes } from './src/routes/misc';
import { espnTeamsRoutes } from './src/routes/espn-teams';

// Infrastructure
import { proxyToPages } from './src/lib/proxy';

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use('*', securityHeaders());
app.use('/api/*', cors());
app.use('/api/*', rateLimit());

// ---------------------------------------------------------------------------
// Route modules
// ---------------------------------------------------------------------------

// College baseball (NCAA client — direct)
app.route('/api/college-baseball', collegeBaseballRoutes);

// Pro + college sports (SportsDataIO — direct, no double-hop)
app.route('/api/nfl', nflRoutes);
app.route('/api/mlb', mlbRoutes);
app.route('/api/nba', nbaRoutes);
app.route('/api/cfb', cfbRoutes);
app.route('/api/cbb', cbbRoutes);
app.route('/api/golf', golfRoutes);
app.route('/api/grid', gridRoutes);

// ESPN news proxy, CV intelligence, analytics, health, search, teams
app.route('/api/news', newsRoutes);
app.route('/api/cv', cvIntelRoutes);
app.route('/api', analyticsRoutes);
app.route('/api', healthRoutes);
app.route('/api', searchRoutes);
app.route('/api', espnTeamsRoutes);

// Misc API routes (feedback, leads, leaderboard, intel news, CFB articles, presence coach, R2 assets)
app.route('/api', miscRoutes);

// MCP protocol (root-level)
app.route('', mcpRoutes);

// ---------------------------------------------------------------------------
// Root-level routes (not under /api)
// ---------------------------------------------------------------------------

// WebSocket
app.get('/ws', (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'Expected websocket upgrade' }, 400);
  }

  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  const interval = setInterval(() => {
    if (server.readyState === WebSocket.OPEN) {
      server.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
    } else {
      clearInterval(interval);
    }
  }, 5000);

  server.addEventListener('close', () => clearInterval(interval));
  server.addEventListener('error', () => clearInterval(interval));
  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === 'ping') server.send(JSON.stringify({ type: 'pong' }));
    } catch { /* ignore malformed */ }
  });

  return new Response(null, { status: 101, webSocket: client });
});

// Coverage redirect
app.get('/coverage', (c) => {
  const origin = new URL(c.req.url).origin;
  return Response.redirect(origin + '/analytics', 301);
});

// Canonical baseball rankings redirect
app.get('/baseball/rankings', (c) => {
  const origin = new URL(c.req.url).origin;
  return Response.redirect(origin + '/college-baseball/rankings', 301);
});

// ---------------------------------------------------------------------------
// Catch-all: proxy to Cloudflare Pages (static assets + remaining Pages Functions)
// ---------------------------------------------------------------------------

app.all('*', (c) => proxyToPages(c.req.raw, c.env));

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.onError(errorHandler);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default app;
export { CacheObject } from './src/objects/cache-object';
export { PortalPoller } from './src/objects/portal-poller';
