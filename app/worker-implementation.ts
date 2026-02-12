// Cloudflare Worker Implementation Guide for Blaze Intelligence
// This is a complete example implementation of the data endpoints

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  CACHE: DurableObjectNamespace;
}

// Helper function to match routes
function matchRoute(pathname: string, pattern: string): { params: Record<string, string> } | null {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return { params };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Sample data generators (replace with real data sources)
function generateKPI() {
  return {
    predictionsToday: Math.floor(Math.random() * 10000) + 5000,
    activeClients: Math.floor(Math.random() * 100) + 50,
    avgResponseSec: Math.random() * 2 + 0.5,
    alertsProcessed: Math.floor(Math.random() * 1000) + 500,
    timestamp: new Date().toISOString(),
  };
}

function generateAccuracyData() {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = labels.map(() => Math.random() * 10 + 85);
  return {
    labels,
    values,
    metadata: {
      unit: 'Accuracy (%)',
      description: 'Model accuracy over time',
    },
  };
}

function generateAlertBuckets() {
  const labels = ['Critical', 'High', 'Medium', 'Low'];
  const counts = labels.map(() => Math.floor(Math.random() * 50));
  const severities = ['critical', 'high', 'medium', 'low'] as const;
  return { labels, counts, severities };
}

function generateTeams(league: string) {
  const teams = {
    MLB: [
      {
        id: 'stl-cardinals',
        name: 'St. Louis Cardinals',
        league: 'MLB',
        stats: { wins: 83, losses: 79, rating: 0.512 },
      },
      {
        id: 'nyy-yankees',
        name: 'New York Yankees',
        league: 'MLB',
        stats: { wins: 94, losses: 68, rating: 0.58 },
      },
      {
        id: 'lad-dodgers',
        name: 'Los Angeles Dodgers',
        league: 'MLB',
        stats: { wins: 98, losses: 64, rating: 0.605 },
      },
    ],
    NFL: [
      {
        id: 'ten-titans',
        name: 'Tennessee Titans',
        league: 'NFL',
        stats: { wins: 6, losses: 11, rating: 0.353 },
      },
      {
        id: 'kc-chiefs',
        name: 'Kansas City Chiefs',
        league: 'NFL',
        stats: { wins: 11, losses: 6, rating: 0.647 },
      },
      {
        id: 'buf-bills',
        name: 'Buffalo Bills',
        league: 'NFL',
        stats: { wins: 13, losses: 4, rating: 0.765 },
      },
    ],
    NBA: [
      {
        id: 'mem-grizzlies',
        name: 'Memphis Grizzlies',
        league: 'NBA',
        stats: { wins: 51, losses: 31, rating: 0.622 },
      },
      {
        id: 'gs-warriors',
        name: 'Golden State Warriors',
        league: 'NBA',
        stats: { wins: 44, losses: 38, rating: 0.537 },
      },
      {
        id: 'lal-lakers',
        name: 'Los Angeles Lakers',
        league: 'NBA',
        stats: { wins: 47, losses: 35, rating: 0.573 },
      },
    ],
    NCAA: [
      {
        id: 'tex-longhorns',
        name: 'Texas Longhorns',
        league: 'NCAA',
        stats: { wins: 12, losses: 2, rating: 0.857 },
      },
      {
        id: 'ala-crimson',
        name: 'Alabama Crimson Tide',
        league: 'NCAA',
        stats: { wins: 12, losses: 2, rating: 0.857 },
      },
      {
        id: 'osu-buckeyes',
        name: 'Ohio State Buckeyes',
        league: 'NCAA',
        stats: { wins: 11, losses: 2, rating: 0.846 },
      },
    ],
  };

  return teams[league.toUpperCase()] || [];
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

  // Add some randomness to scores
  return players.map((p) => ({
    ...p,
    score: p.score + Math.floor(Math.random() * 100 - 50),
  }));
}

function simulateLeaderboard() {
  const current = generateLeaderboard();
  // Simulate match results
  return current
    .map((p) => ({
      ...p,
      score: p.score + Math.floor(Math.random() * 200),
    }))
    .sort((a, b) => b.score - a.score);
}

function generateYearlyTrend() {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const values = months.map((_, i) => 70 + Math.sin(i / 2) * 10 + Math.random() * 5);
  return {
    labels: months,
    values,
    metadata: {
      unit: 'Performance Score',
      description: 'Yearly performance trend',
    },
  };
}

function generateReadiness() {
  return {
    physical: Math.floor(Math.random() * 10) + 90,
    mental: Math.floor(Math.random() * 8) + 92,
    tactical: Math.floor(Math.random() * 7) + 93,
    cohesion: Math.floor(Math.random() * 5) + 95,
  };
}

interface LeadData {
  name: string;
  email: string;
  organization?: string;
  sport?: string;
  message?: string;
  source?: string;
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  try {
    const lead = (await request.json()) as LeadData;

    // Validate required fields
    if (!lead.name || !lead.email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store in D1 if available
    if (env.DB) {
      try {
        await env.DB.prepare(
          `
          INSERT INTO leads (name, email, organization, sport, message, source, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `
        )
          .bind(
            lead.name,
            lead.email,
            lead.organization || null,
            lead.sport || null,
            lead.message || null,
            lead.source || 'API'
          )
          .run();
      } catch (_dbError) {
        // Continue even if DB fails - we can still send to other services
      }
    }

    // Store in KV as backup
    if (env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await env.KV.put(key, JSON.stringify(lead), {
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    // TODO: Send to HubSpot
    // TODO: Send email notification

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead captured successfully',
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Failed to process lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Main worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...corsHeaders,
      'Cache-Control': 'no-cache',
    };

    try {
      // Handle POST requests to /api/lead
      if (request.method === 'POST' && url.pathname === '/api/lead') {
        return await handleLead(request, env);
      }

      // Route handlers for GET requests
      const routes: Record<string, (params?: any) => any> = {
        '/health': () => ({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }),
        '/kpi': generateKPI,
        '/analytics/accuracy': generateAccuracyData,
        '/alerts/buckets': generateAlertBuckets,
        '/teams/:league': (params) => generateTeams(params.league),
        '/multiplayer/leaderboard': generateLeaderboard,
        '/multiplayer/leaderboard/simulate': simulateLeaderboard,
        '/analytics/yearly-trend': generateYearlyTrend,
        '/readiness': generateReadiness,
      };

      // Match route and execute
      for (const [pattern, handler] of Object.entries(routes)) {
        const match = matchRoute(url.pathname, pattern);
        if (match) {
          const data = await handler(match.params);
          return new Response(JSON.stringify(data), { headers });
        }
      }

      // WebSocket endpoint for real-time updates
      if (url.pathname === '/ws') {
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader !== 'websocket') {
          return new Response('Expected websocket', { status: 400 });
        }

        const [client, server] = Object.values(new WebSocketPair());

        // Accept the WebSocket connection
        server.accept();

        // Send periodic updates
        const interval = setInterval(() => {
          if (server.readyState === WebSocket.OPEN) {
            server.send(
              JSON.stringify({
                type: 'leaderboard-update',
                players: generateLeaderboard(),
              })
            );
          } else {
            clearInterval(interval);
          }
        }, 5000);

        // Handle client messages
        server.addEventListener('message', (event) => {
          const _data = JSON.parse(event.data as string);
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
          headers,
        });
      }

      return new Response('Not Found', { status: 404, headers });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: error.message || 'Internal Server Error',
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers }
      );
    }
  },
};

// Durable Object for caching (optional)
export class CacheObject {
  state: DurableObjectState;
  cache: Map<string, { data: any; expires: number }>;

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
      this.cache.set(key, {
        data,
        expires: Date.now() + ttl,
      });
      return new Response('OK');
    }

    return new Response('Method not allowed', { status: 405 });
  }
}
