/**
 * Blaze Field — BlazeCraft CDN + API Worker
 *
 * Serves the Canvas2D game dashboard from R2 and provides:
 * - /api/status — synthetic monitor results from MONITOR_KV
 * - /api/agent-events — recent Claude Code hook events for wisp rendering
 * - /api/events/ingest — POST endpoint for hook event ingestion
 * - Cache-Control: immutable for hashed assets, 5min for index.html
 * - COOP/COEP security headers, custom 404
 */

export interface Env {
  ASSETS: R2Bucket;
  MONITOR_KV: KVNamespace;
}

const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'application/gltf+json',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Analytics beacon
    if (url.pathname === '/api/beacon' && request.method === 'POST') {
      // Fire-and-forget — don't block response
      return new Response(null, { status: 204 });
    }

    // CORS preflight for all API routes
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
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

    // Agent event ingestion — receives tool use events from Claude Code hooks
    if ((url.pathname === '/api/blazecraft/events' || url.pathname === '/api/events/ingest') && request.method === 'POST') {
      return handleEventIngest(request, env);
    }

    // Agent events — returns recent events for dashboard
    if (url.pathname === '/api/agent-events') {
      return handleAgentEvents(env);
    }

    // Infrastructure status — reads synthetic monitor results from KV
    if (url.pathname === '/api/status') {
      const latest = await env.MONITOR_KV.get('summary:latest', 'text');
      if (!latest) {
        return new Response(JSON.stringify({ error: 'No monitoring data yet' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      }
      return new Response(latest, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    // Determine asset path
    let path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);

    // Try R2
    const object = await env.ASSETS.get(path);
    if (!object) {
      // SPA fallback — serve index.html for non-asset paths
      const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : '';
      if (!ext) {
        const fallback = await env.ASSETS.get('index.html');
        if (fallback) {
          return buildResponse(fallback, 'index.html', false);
        }
      }
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS },
      });
    }

    const isHashed = /[-\.][a-zA-Z0-9]{8,}\.(js|css|wasm|glb|png|jpg|webp)$/.test(path);
    return buildResponse(object, path, isHashed);
  },
};

const SESSION_KEY_PREFIX = 'agent:session:';
const SESSION_INDEX_KEY = 'agent:sessions';
const MAX_EVENTS_PER_SESSION = 20;
const MAX_SESSIONS = 20;
const EVENT_TTL = 3600; // 1 hour

interface AgentEvent {
  type: string;
  agentId: string;
  agentName: string;
  sessionId?: string;
  timestamp: string;
  data?: Record<string, unknown>;
  receivedAt: string;
}

interface SessionEntry {
  id: string;
  lastSeen: string;
}

const API_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-cache',
};

async function handleEventIngest(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as Record<string, unknown>;

    if (!body.type || !body.agentId) {
      return new Response(JSON.stringify({ error: 'Missing required fields: type, agentId' }), {
        status: 400,
        headers: API_HEADERS,
      });
    }

    const sessionId = body.sessionId ? String(body.sessionId) : String(body.agentId);

    const event: AgentEvent = {
      type: String(body.type),
      agentId: String(body.agentId),
      agentName: String(body.agentName || body.agentId),
      sessionId,
      timestamp: String(body.timestamp || new Date().toISOString()),
      data: typeof body.data === 'object' && body.data !== null ? body.data as Record<string, unknown> : undefined,
      receivedAt: new Date().toISOString(),
    };

    // 1. Append to per-session key (strongly consistent get, no cross-session races)
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const existing = await env.MONITOR_KV.get<AgentEvent[]>(sessionKey, 'json');
    const events = existing ?? [];
    events.push(event);
    const trimmed = events.slice(-MAX_EVENTS_PER_SESSION);

    // 2. Update session index (tracks which sessions exist)
    const index = await env.MONITOR_KV.get<SessionEntry[]>(SESSION_INDEX_KEY, 'json') ?? [];
    const entry = index.find(s => s.id === sessionId);
    if (entry) {
      entry.lastSeen = event.receivedAt;
    } else {
      index.push({ id: sessionId, lastSeen: event.receivedAt });
    }
    // Keep most recent sessions, evict oldest
    index.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    const trimmedIndex = index.slice(0, MAX_SESSIONS);

    // 3. Write both in parallel
    await Promise.all([
      env.MONITOR_KV.put(sessionKey, JSON.stringify(trimmed), { expirationTtl: EVENT_TTL }),
      env.MONITOR_KV.put(SESSION_INDEX_KEY, JSON.stringify(trimmedIndex), { expirationTtl: EVENT_TTL }),
    ]);

    return new Response(JSON.stringify({ ok: true, session: sessionId, count: trimmed.length }), {
      status: 200,
      headers: API_HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: API_HEADERS,
    });
  }
}

async function handleAgentEvents(env: Env): Promise<Response> {
  // Read the session index (specific key = strongly consistent)
  const index = await env.MONITOR_KV.get<SessionEntry[]>(SESSION_INDEX_KEY, 'json');
  if (!index?.length) {
    return new Response(JSON.stringify({ events: [], count: 0 }), {
      headers: API_HEADERS,
    });
  }

  // Fetch all session event arrays in parallel (specific keys = strongly consistent)
  const reads = index.map(s => env.MONITOR_KV.get<AgentEvent[]>(`${SESSION_KEY_PREFIX}${s.id}`, 'json'));
  const results = await Promise.all(reads);

  const allEvents: AgentEvent[] = [];
  for (const sessionEvents of results) {
    if (sessionEvents) allEvents.push(...sessionEvents);
  }

  allEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const capped = allEvents.slice(0, 100);

  return new Response(JSON.stringify({ events: capped, count: capped.length }), {
    headers: API_HEADERS,
  });
}

function buildResponse(object: R2ObjectBody, path: string, immutable: boolean): Response {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : '.html';
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  const cacheControl = immutable
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=300';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'ETag': object.httpEtag,
      ...SECURITY_HEADERS,
    },
  });
}

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blaze Field — Not Found</title>
  <style>
    body { margin:0; background:#0a0a0a; color:#f5f5f5; font-family:system-ui,sans-serif;
           display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { text-align:center; }
    h1 { font-size:4rem; margin:0; color:#f97316; }
    p { font-size:1.2rem; margin:1rem 0; opacity:0.7; }
    a { color:#f97316; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>Play not found. Return to the <a href="/">field</a>.</p>
  </div>
</body>
</html>`;
}
