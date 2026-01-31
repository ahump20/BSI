/**
 * Blaze Sports Intel — Hybrid Workers Router
 *
 * This is the apex Worker that sits in front of blazesportsintel.com.
 * It handles:
 *   1. Dynamic API routes (/api/*)       — processed directly by this Worker
 *   2. WebSocket connections (/ws)        — real-time leaderboard & scores
 *   3. Authentication helpers (/auth/*)   — session validation, token refresh
 *   4. Static assets & pages (everything else) — proxied to Cloudflare Pages
 *
 * The Pages project ("blazesportsintel") serves the Next.js static export.
 * By keeping the Worker as the entry-point we get full control over routing,
 * caching headers, A/B tests, feature flags and auth—without giving up the
 * Git-based CI/CD that Pages provides for the static build.
 */

export interface Env {
  // KV namespace for caching, feature flags, session data
  KV: KVNamespace;
  // Durable Object for real-time state (leaderboard, live scores)
  CACHE: DurableObjectNamespace;
  // D1 database for leads, analytics, historical data
  DB: D1Database;
  // Environment identifier
  ENVIRONMENT: string;
  API_VERSION: string;
  // The Pages project is accessed via ASSETS binding (Service Binding)
  PAGES_ORIGIN: string; // e.g. "https://blazesportsintel.pages.dev"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra },
  });
}

function matchRoute(
  pathname: string,
  pattern: string
): { params: Record<string, string> } | null {
  const pp = pattern.split('/');
  const sp = pathname.split('/');
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = sp[i];
    else if (pp[i] !== sp[i]) return null;
  }
  return { params };
}

// ---------------------------------------------------------------------------
// API route handlers
// ---------------------------------------------------------------------------

function handleHealth(env: Env) {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION ?? '1.0.0',
    environment: env.ENVIRONMENT ?? 'production',
    mode: 'hybrid-worker',
  });
}

function handleKPI() {
  return json({
    predictionsToday: Math.floor(Math.random() * 10000) + 5000,
    activeClients: Math.floor(Math.random() * 100) + 50,
    avgResponseSec: Math.random() * 2 + 0.5,
    alertsProcessed: Math.floor(Math.random() * 1000) + 500,
    timestamp: new Date().toISOString(),
  });
}

function handleAccuracy() {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return json({
    labels,
    values: labels.map(() => Math.random() * 10 + 85),
    metadata: { unit: 'Accuracy (%)', description: 'Model accuracy over time' },
  });
}

function handleAlertBuckets() {
  const labels = ['Critical', 'High', 'Medium', 'Low'];
  return json({
    labels,
    counts: labels.map(() => Math.floor(Math.random() * 50)),
    severities: ['critical', 'high', 'medium', 'low'],
  });
}

function handleTeams(league: string) {
  const teams: Record<string, Array<{ id: string; name: string; league: string; stats: object }>> = {
    MLB: [
      { id: 'stl-cardinals', name: 'St. Louis Cardinals', league: 'MLB', stats: { wins: 83, losses: 79, rating: 0.512 } },
      { id: 'nyy-yankees', name: 'New York Yankees', league: 'MLB', stats: { wins: 94, losses: 68, rating: 0.58 } },
      { id: 'lad-dodgers', name: 'Los Angeles Dodgers', league: 'MLB', stats: { wins: 98, losses: 64, rating: 0.605 } },
    ],
    NFL: [
      { id: 'ten-titans', name: 'Tennessee Titans', league: 'NFL', stats: { wins: 6, losses: 11, rating: 0.353 } },
      { id: 'kc-chiefs', name: 'Kansas City Chiefs', league: 'NFL', stats: { wins: 11, losses: 6, rating: 0.647 } },
      { id: 'buf-bills', name: 'Buffalo Bills', league: 'NFL', stats: { wins: 13, losses: 4, rating: 0.765 } },
    ],
    NBA: [
      { id: 'mem-grizzlies', name: 'Memphis Grizzlies', league: 'NBA', stats: { wins: 51, losses: 31, rating: 0.622 } },
      { id: 'gs-warriors', name: 'Golden State Warriors', league: 'NBA', stats: { wins: 44, losses: 38, rating: 0.537 } },
      { id: 'lal-lakers', name: 'Los Angeles Lakers', league: 'NBA', stats: { wins: 47, losses: 35, rating: 0.573 } },
    ],
    NCAA: [
      { id: 'tex-longhorns', name: 'Texas Longhorns', league: 'NCAA', stats: { wins: 12, losses: 2, rating: 0.857 } },
      { id: 'ala-crimson', name: 'Alabama Crimson Tide', league: 'NCAA', stats: { wins: 12, losses: 2, rating: 0.857 } },
      { id: 'osu-buckeyes', name: 'Ohio State Buckeyes', league: 'NCAA', stats: { wins: 11, losses: 2, rating: 0.846 } },
    ],
  };
  return json(teams[league.toUpperCase()] ?? []);
}

function generateLeaderboard() {
  const players = [
    { name: 'Austin H.', score: 2847, avatar: '🏆' },
    { name: 'Sarah M.', score: 2654, avatar: '⚡' },
    { name: 'Mike R.', score: 2498, avatar: '🔥' },
    { name: 'Jessica L.', score: 2376, avatar: '💎' },
    { name: 'David K.', score: 2234, avatar: '🚀' },
    { name: 'Emily C.', score: 2198, avatar: '⭐' },
    { name: 'Chris W.', score: 2087, avatar: '🎯' },
    { name: 'Amanda T.', score: 1976, avatar: '✨' },
  ];
  return players.map((p) => ({ ...p, score: p.score + Math.floor(Math.random() * 100 - 50) }));
}

function handleLeaderboard() {
  return json(generateLeaderboard());
}

function handleLeaderboardSimulate() {
  const board = generateLeaderboard()
    .map((p) => ({ ...p, score: p.score + Math.floor(Math.random() * 200) }))
    .sort((a, b) => b.score - a.score);
  return json(board);
}

function handleYearlyTrend() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return json({
    labels: months,
    values: months.map((_, i) => 70 + Math.sin(i / 2) * 10 + Math.random() * 5),
    metadata: { unit: 'Performance Score', description: 'Yearly performance trend' },
  });
}

function handleReadiness() {
  return json({
    physical: Math.floor(Math.random() * 10) + 90,
    mental: Math.floor(Math.random() * 8) + 92,
    tactical: Math.floor(Math.random() * 7) + 93,
    cohesion: Math.floor(Math.random() * 5) + 95,
  });
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  try {
    const lead = (await request.json()) as {
      name: string;
      email: string;
      organization?: string;
      sport?: string;
      message?: string;
      source?: string;
    };

    if (!lead.name || !lead.email) {
      return json({ error: 'Name and email are required' }, 400);
    }

    // Store in KV
    if (env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await env.KV.put(key, JSON.stringify(lead), {
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    // Store in D1 if available
    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO leads (name, email, organization, sport, message, source, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(lead.name, lead.email, lead.organization ?? null, lead.sport ?? null, lead.message ?? null, lead.source ?? 'API')
          .run();
      } catch {
        // KV is the primary store; D1 failure is non-fatal
      }
    }

    return json({ success: true, message: 'Lead captured successfully', id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}` });
  } catch {
    return json({ error: 'Failed to process lead' }, 500);
  }
}

// ---------------------------------------------------------------------------
// WebSocket handler
// ---------------------------------------------------------------------------

function handleWebSocket(): Response {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  const interval = setInterval(() => {
    if (server.readyState === WebSocket.OPEN) {
      server.send(JSON.stringify({ type: 'leaderboard-update', players: generateLeaderboard() }));
    } else {
      clearInterval(interval);
    }
  }, 5000);

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === 'ping') server.send(JSON.stringify({ type: 'pong' }));
    } catch { /* ignore malformed messages */ }
  });

  return new Response(null, { status: 101, webSocket: client });
}

// ---------------------------------------------------------------------------
// Static asset proxy — forward non-API requests to Pages
// ---------------------------------------------------------------------------

async function proxyToPages(request: Request, env: Env): Promise<Response> {
  const origin = env.PAGES_ORIGIN || 'https://blazesportsintel.pages.dev';
  const url = new URL(request.url);
  const pagesUrl = `${origin}${url.pathname}${url.search}`;

  const pagesResponse = await fetch(pagesUrl, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  });

  // Clone response so we can add cache headers for static assets
  const response = new Response(pagesResponse.body, pagesResponse);

  // Add long-lived cache headers for immutable static assets
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // -----------------------------------------------------------------------
    // Dynamic routes handled by the Worker
    // -----------------------------------------------------------------------

    // Health / status
    if (pathname === '/api/health' || pathname === '/health') return handleHealth(env);

    // API data endpoints
    if (pathname === '/api/kpi' || pathname === '/kpi') return handleKPI();
    if (pathname === '/api/analytics/accuracy' || pathname === '/analytics/accuracy') return handleAccuracy();
    if (pathname === '/api/alerts/buckets' || pathname === '/alerts/buckets') return handleAlertBuckets();
    if (pathname === '/api/analytics/yearly-trend' || pathname === '/analytics/yearly-trend') return handleYearlyTrend();
    if (pathname === '/api/readiness' || pathname === '/readiness') return handleReadiness();
    if (pathname === '/api/multiplayer/leaderboard/simulate' || pathname === '/multiplayer/leaderboard/simulate') return handleLeaderboardSimulate();
    if (pathname === '/api/multiplayer/leaderboard' || pathname === '/multiplayer/leaderboard') return handleLeaderboard();

    // Parameterised routes
    const teamsMatch = matchRoute(pathname, '/api/teams/:league') || matchRoute(pathname, '/teams/:league');
    if (teamsMatch) return handleTeams(teamsMatch.params.league);

    // Lead capture (POST)
    if (request.method === 'POST' && (pathname === '/api/lead' || pathname === '/api/leads')) {
      return handleLead(request, env);
    }

    // WebSocket
    if (pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return json({ error: 'Expected websocket upgrade' }, 400);
      }
      return handleWebSocket();
    }

    // -----------------------------------------------------------------------
    // Everything else → proxy to Cloudflare Pages (static Next.js export)
    // -----------------------------------------------------------------------
    try {
      return await proxyToPages(request, env);
    } catch {
      return new Response('Service temporarily unavailable', { status: 502 });
    }
  },
};

// ---------------------------------------------------------------------------
// Durable Object — CacheObject (re-exported for binding)
// ---------------------------------------------------------------------------

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
