/**
 * College Baseball Sabermetrics MCP Server
 *
 * Implements the Model Context Protocol (MCP) over Streamable HTTP (JSON-RPC 2.0).
 * Exposes BSI's college baseball data — scores, standings, rankings, advanced
 * metrics — as tools that Claude.ai and Claude Code can call directly.
 *
 * Auth: Bearer token (BSI_API_KEY secret). Rate limiting via RATE_LIMIT_KV.
 * Cache: Team stats cached in TEAM_STATS_KV (5-min TTL for live, 60-min for final).
 *
 * Routes:
 *   GET  /health      — liveness check
 *   POST /mcp         — JSON-RPC 2.0 MCP endpoint
 *   GET  /mcp         — SSE stream (not implemented; returns 405)
 *
 * Deploy: wrangler deploy --config workers/college-baseball-mcp/wrangler.toml
 */

export interface Env {
  BSI_API_KEY?: string;
  RATE_LIMIT_KV?: KVNamespace;
  TEAM_STATS_KV?: KVNamespace;
  HIGHLIGHTLY_API_KEY?: string;
  SPORTSDATAIO_API_KEY?: string;
  // Service binding to blazesportsintel-worker-prod (avoids Pages routing)
  BSI_WORKER?: Fetcher;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BSI_WORKER_BASE = 'https://blazesportsintel.com';
const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 30; // requests per minute per token

// ─── MCP Tool Definitions ────────────────────────────────────────────────────

const MCP_TOOLS = [
  {
    name: 'get_college_baseball_scoreboard',
    description:
      'Get today\'s college baseball scores and game results. Returns live and final games with team names, scores, inning, and game status.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today (America/Chicago).',
        },
        conference: {
          type: 'string',
          description: 'Filter by conference (e.g., "SEC", "Big 12", "ACC"). Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_college_baseball_standings',
    description:
      'Get current college baseball conference standings including wins, losses, conference record, run differential, and streak.',
    inputSchema: {
      type: 'object',
      properties: {
        conference: {
          type: 'string',
          description:
            'Conference name (e.g., "SEC", "Big 12", "ACC", "Pac-12", "Big Ten"). Required.',
        },
      },
      required: ['conference'],
    },
  },
  {
    name: 'get_college_baseball_rankings',
    description:
      'Get the latest D1Baseball national rankings (Top 25). Returns rank, team, conference, record, and movement.',
    inputSchema: {
      type: 'object',
      properties: {
        week: {
          type: 'number',
          description: 'Poll week number. Defaults to the current week.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_team_sabermetrics',
    description:
      'Get advanced sabermetric batting and pitching metrics for a college baseball team: wOBA, wRC+, FIP, ERA-, BABIP, ISO, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team name or slug (e.g., "texas", "tennessee", "lsu").',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_sabermetrics_leaderboard',
    description:
      'Get the top college baseball hitters or pitchers by an advanced metric. Returns a ranked leaderboard with player names, teams, and stat values.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description:
            'Metric to rank by: "woba", "wrc_plus", "ops_plus", "fip", "era_minus", "babip", "iso". Default: "woba".',
          enum: ['woba', 'wrc_plus', 'ops_plus', 'fip', 'era_minus', 'babip', 'iso'],
        },
        type: {
          type: 'string',
          description: '"batting" or "pitching". Default: "batting".',
          enum: ['batting', 'pitching'],
        },
        limit: {
          type: 'number',
          description: 'Number of results to return. Default: 20, max: 50.',
        },
        conference: {
          type: 'string',
          description: 'Filter by conference. Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_conference_power_index',
    description:
      'Get the BSI Conference Power Index — a composite strength-of-schedule-adjusted ranking of all D1 conferences.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_player_stats',
    description:
      'Get batting or pitching stats for a specific college baseball player, including traditional and advanced metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        player: {
          type: 'string',
          description: 'Player name (e.g., "Paul Skenes", "Dylan Crews").',
        },
        team: {
          type: 'string',
          description: 'Team name to disambiguate when multiple players share a name. Optional.',
        },
      },
      required: ['player'],
    },
  },
  {
    name: 'get_team_schedule',
    description:
      'Get the full schedule for a college baseball team, including past results and upcoming games.',
    inputSchema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team name or slug.',
        },
      },
      required: ['team'],
    },
  },
];

// ─── JSON-RPC Types ───────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function rpcOk(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function rpcErr(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function extractBearer(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function validateAuth(req: Request, env: Env): boolean {
  // If no key is configured, allow all (dev mode)
  if (!env.BSI_API_KEY) return true;
  const token = extractBearer(req);
  return token === env.BSI_API_KEY;
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

async function checkRateLimit(token: string, env: Env): Promise<boolean> {
  if (!env.RATE_LIMIT_KV) return true; // no KV = no rate limit (dev)

  const key = `rl:${token}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW_S * 1000))}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= RATE_LIMIT_MAX) return false;

  await env.RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_S * 2,
  });
  return true;
}

// ─── BSI API Proxy ────────────────────────────────────────────────────────────

async function bsiFetch(path: string, env: Env): Promise<unknown> {
  const cacheKey = `mcp:${path}`;

  // Check team stats cache first
  if (env.TEAM_STATS_KV) {
    const cached = await env.TEAM_STATS_KV.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // stale/corrupt cache — fall through to fetch
      }
    }
  }

  // Use service binding when available (avoids Cloudflare Pages routing collision).
  // Fall back to HTTP fetch for local dev or when binding is not configured.
  let res: Response;
  if (env.BSI_WORKER) {
    const url = `https://blazesportsintel.com${path}`;
    res = await env.BSI_WORKER.fetch(new Request(url, {
      headers: { 'User-Agent': 'BSI-MCP/1.0' },
    }));
  } else {
    const url = `${BSI_WORKER_BASE}${path}`;
    res = await fetch(url, {
      headers: { 'User-Agent': 'BSI-MCP/1.0' },
    });
  }

  if (!res.ok) {
    throw new Error(`BSI API error: ${res.status} ${res.statusText} for ${path}`);
  }

  const data = await res.json();

  // Cache with TTL based on content type
  if (env.TEAM_STATS_KV) {
    const ttl = path.includes('standings') || path.includes('rankings') ? 120 : 60;
    await env.TEAM_STATS_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl });
  }

  return data;
}

// ─── Tool Dispatch ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<{ content: Array<{ type: string; text: string }> }> {
  let data: unknown;

  switch (name) {
    case 'get_college_baseball_scoreboard': {
      const date = (args.date as string) ?? '';
      const conference = (args.conference as string) ?? '';
      const qs = new URLSearchParams();
      if (date) qs.set('date', date);
      if (conference) qs.set('conference', conference);
      const query = qs.toString() ? `?${qs}` : '';
      data = await bsiFetch(`/api/college-baseball/scores${query}`, env);
      break;
    }

    case 'get_college_baseball_standings': {
      const conference = args.conference as string;
      data = await bsiFetch(
        `/api/college-baseball/standings?conference=${encodeURIComponent(conference)}`,
        env
      );
      break;
    }

    case 'get_college_baseball_rankings': {
      const week = args.week ? `?week=${args.week}` : '';
      data = await bsiFetch(`/api/college-baseball/rankings${week}`, env);
      break;
    }

    case 'get_team_sabermetrics': {
      const team = args.team as string;
      data = await bsiFetch(
        `/api/college-baseball/sabermetrics/team/${encodeURIComponent(team)}`,
        env
      );
      break;
    }

    case 'get_sabermetrics_leaderboard': {
      const metric = (args.metric as string) ?? 'woba';
      const type = (args.type as string) ?? 'batting';
      const limit = Math.min((args.limit as number) ?? 20, 50);
      const conference = args.conference ? `&conference=${encodeURIComponent(args.conference as string)}` : '';
      data = await bsiFetch(
        `/api/college-baseball/sabermetrics/${type}?metric=${metric}&limit=${limit}${conference}`,
        env
      );
      break;
    }

    case 'get_conference_power_index': {
      data = await bsiFetch('/api/college-baseball/sabermetrics/conference', env);
      break;
    }

    case 'get_player_stats': {
      const player = args.player as string;
      const team = args.team ? `&team=${encodeURIComponent(args.team as string)}` : '';
      data = await bsiFetch(
        `/api/college-baseball/players?search=${encodeURIComponent(player)}${team}`,
        env
      );
      break;
    }

    case 'get_team_schedule': {
      const team = args.team as string;
      data = await bsiFetch(
        `/api/college-baseball/team/${encodeURIComponent(team)}/schedule`,
        env
      );
      break;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

// ─── MCP Method Dispatch ──────────────────────────────────────────────────────

async function handleMcpMethod(
  req: JsonRpcRequest,
  env: Env
): Promise<JsonRpcResponse> {
  const { id, method, params = {} } = req;

  switch (method) {
    case 'initialize':
      return rpcOk(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: {
          name: 'college-baseball-sabermetrics',
          version: '1.0.0',
        },
        instructions:
          'BSI College Baseball MCP — provides live scores, standings, national rankings, and advanced sabermetric analytics (wOBA, wRC+, FIP, ERA-) for D1 college baseball. All data is sourced from the Blaze Sports Intel platform and updated every 30–60 seconds during live games.',
      });

    case 'notifications/initialized':
      // Client notification — no response needed per spec, but return empty ok
      return rpcOk(id, null);

    case 'tools/list':
      return rpcOk(id, { tools: MCP_TOOLS });

    case 'tools/call': {
      const toolName = params.name as string;
      const toolArgs = (params.arguments as Record<string, unknown>) ?? {};

      if (!toolName) {
        return rpcErr(id, -32602, 'Missing required param: name');
      }

      const toolDef = MCP_TOOLS.find((t) => t.name === toolName);
      if (!toolDef) {
        return rpcErr(id, -32602, `Unknown tool: ${toolName}`);
      }

      try {
        const result = await executeTool(toolName, toolArgs, env);
        return rpcOk(id, result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return rpcOk(id, {
          content: [{ type: 'text', text: `Error: ${msg}` }],
          isError: true,
        });
      }
    }

    case 'resources/list':
      return rpcOk(id, { resources: [] });

    case 'prompts/list':
      return rpcOk(id, { prompts: [] });

    default:
      return rpcErr(id, -32601, `Method not found: ${method}`);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check — no auth required
    if (pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'college-baseball-sabermetrics-mcp',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    }

    // MCP endpoint
    if (pathname === '/mcp') {
      // SSE (GET) not implemented
      if (method === 'GET') {
        return jsonResponse(
          { error: 'SSE streaming not supported. Use POST for JSON-RPC 2.0.' },
          405
        );
      }

      if (method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      // Rate limit by token if provided, else by IP (MCP endpoint is public)
      const token = extractBearer(request) ?? request.headers.get('CF-Connecting-IP') ?? 'anonymous';
      const allowed = await checkRateLimit(token, env);
      if (!allowed) {
        return jsonResponse(
          rpcErr(null, -32029, `Rate limit exceeded: max ${RATE_LIMIT_MAX} req/min`),
          429
        );
      }

      // Parse body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(rpcErr(null, -32700, 'Parse error: invalid JSON'), 400);
      }

      // Validate JSON-RPC shape
      const rpc = body as JsonRpcRequest;
      if (rpc.jsonrpc !== '2.0' || !rpc.method) {
        return jsonResponse(
          rpcErr(rpc.id ?? null, -32600, 'Invalid Request: must be JSON-RPC 2.0'),
          400
        );
      }

      const response = await handleMcpMethod(rpc, env);
      return jsonResponse(response);
    }

    // Root redirect
    if (pathname === '/') {
      return jsonResponse({
        service: 'BSI College Baseball Sabermetrics MCP',
        version: '1.0.0',
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /mcp (JSON-RPC 2.0)',
        },
        docs: 'https://blazesportsintel.com',
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
