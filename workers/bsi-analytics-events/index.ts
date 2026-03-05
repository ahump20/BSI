/**
 * BSI Analytics Events Worker
 *
 * Ingests behavioral events into D1 for the strategic plan's five queries:
 * cross-sport demand, content conversion, return rates, sport transitions,
 * and paywall funnels.
 *
 * Fire-and-forget: always returns 204. Errors are logged, never surfaced.
 *
 * Deploy: wrangler deploy --config workers/bsi-analytics-events/wrangler.toml
 */

import { Hono } from 'hono';

interface Env {
  EVENTS_DB: D1Database;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
]);

const DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:8787',
  'http://localhost:8790',
]);

function getAllowedOrigin(origin: string | null, env: Env): string {
  if (!origin) return '';
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (origin.endsWith('.blazesportsintel.pages.dev')) return origin;
  if (env.ENVIRONMENT !== 'production' && DEV_ORIGINS.has(origin)) return origin;
  return '';
}

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') ?? null;
  const allowed = getAllowedOrigin(origin, c.env);

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed || '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  if (allowed) {
    c.header('Access-Control-Allow-Origin', allowed);
    c.header('Vary', 'Origin');
  }
});

// ---------------------------------------------------------------------------
// Event validation
// ---------------------------------------------------------------------------

interface EventPayload {
  event_name: string;
  session_id: string;
  visitor_id?: string;
  sport?: string;
  content_type?: string;
  path?: string;
  referrer?: string;
  time_on_page_ms?: number;
  plan?: string;
  properties?: Record<string, unknown>;
}

function validateEvent(body: unknown): EventPayload | null {
  if (!body || typeof body !== 'object') return null;
  const e = body as Record<string, unknown>;

  const event_name = typeof e.event_name === 'string' ? e.event_name.trim() : '';
  const session_id = typeof e.session_id === 'string' ? e.session_id.trim() : '';

  if (!event_name || !session_id) return null;

  return {
    event_name: event_name.slice(0, 64),
    session_id: session_id.slice(0, 128),
    visitor_id: typeof e.visitor_id === 'string' ? e.visitor_id.slice(0, 128) : undefined,
    sport: typeof e.sport === 'string' ? e.sport.slice(0, 32) : undefined,
    content_type: typeof e.content_type === 'string' ? e.content_type.slice(0, 32) : undefined,
    path: typeof e.path === 'string' ? e.path.slice(0, 512) : undefined,
    referrer: typeof e.referrer === 'string' ? e.referrer.slice(0, 512) : undefined,
    time_on_page_ms: typeof e.time_on_page_ms === 'number' ? Math.max(0, Math.floor(e.time_on_page_ms)) : undefined,
    plan: typeof e.plan === 'string' ? e.plan.slice(0, 32) : undefined,
    properties: typeof e.properties === 'object' && e.properties !== null ? e.properties as Record<string, unknown> : undefined,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** POST /api/events — ingest a single event */
app.post('/api/events', async (c) => {
  try {
    const body = await c.req.json();
    const event = validateEvent(body);

    if (!event) {
      // Fire-and-forget: still return 204 even on invalid input
      return new Response(null, { status: 204 });
    }

    // Non-blocking insert — don't await in production for lowest latency
    const insertPromise = c.env.EVENTS_DB.prepare(
      `INSERT INTO events (event_name, session_id, visitor_id, sport, content_type, path, referrer, time_on_page_ms, plan, properties)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      event.event_name,
      event.session_id,
      event.visitor_id ?? null,
      event.sport ?? null,
      event.content_type ?? null,
      event.path ?? null,
      event.referrer ?? null,
      event.time_on_page_ms ?? null,
      event.plan ?? null,
      event.properties ? JSON.stringify(event.properties) : null,
    ).run();

    // Use waitUntil to not block the response
    c.executionCtx.waitUntil(
      insertPromise.catch((err) => {
        console.error('[bsi-analytics-events] D1 insert failed:', err instanceof Error ? err.message : err);
      })
    );
  } catch (err) {
    console.error('[bsi-analytics-events] Request error:', err instanceof Error ? err.message : err);
  }

  return new Response(null, { status: 204 });
});

/** POST /api/events/batch — ingest multiple events at once */
app.post('/api/events/batch', async (c) => {
  try {
    const body = await c.req.json() as { events?: unknown[] };
    const events = Array.isArray(body?.events) ? body.events : [];

    const validated = events
      .map(validateEvent)
      .filter((e): e is EventPayload => e !== null)
      .slice(0, 50); // Cap at 50 events per batch

    if (validated.length === 0) {
      return new Response(null, { status: 204 });
    }

    const stmt = c.env.EVENTS_DB.prepare(
      `INSERT INTO events (event_name, session_id, visitor_id, sport, content_type, path, referrer, time_on_page_ms, plan, properties)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const batch = validated.map((event) =>
      stmt.bind(
        event.event_name,
        event.session_id,
        event.visitor_id ?? null,
        event.sport ?? null,
        event.content_type ?? null,
        event.path ?? null,
        event.referrer ?? null,
        event.time_on_page_ms ?? null,
        event.plan ?? null,
        event.properties ? JSON.stringify(event.properties) : null,
      )
    );

    c.executionCtx.waitUntil(
      c.env.EVENTS_DB.batch(batch).catch((err) => {
        console.error('[bsi-analytics-events] D1 batch insert failed:', err instanceof Error ? err.message : err);
      })
    );
  } catch (err) {
    console.error('[bsi-analytics-events] Batch request error:', err instanceof Error ? err.message : err);
  }

  return new Response(null, { status: 204 });
});

/** GET /api/events/health — basic health check */
app.get('/api/events/health', async (c) => {
  try {
    const result = await c.env.EVENTS_DB.prepare(
      "SELECT COUNT(*) as count FROM events"
    ).first<{ count: number }>();

    return c.json({
      status: 'ok',
      event_count: result?.count ?? 0,
      environment: c.env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export default app;
