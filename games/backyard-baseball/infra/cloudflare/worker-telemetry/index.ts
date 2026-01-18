interface Env {
  TELEMETRY_DB: D1Database;
  ENVIRONMENT: string;
}

interface TelemetryEvent {
  eventType: string;
  sessionId: string;
  timestamp: string;
  sessionTime?: number;
  data: Record<string, unknown>;
  url?: string;
}

interface TelemetryBatch {
  events: TelemetryEvent[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === '/api/telemetry' && request.method === 'POST') {
      return handleTelemetry(request, env);
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        environment: env.ENVIRONMENT,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  }
};

async function handleTelemetry(request: Request, env: Env): Promise<Response> {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
      return new Response('Invalid Content-Type', { status: 400, headers: CORS_HEADERS });
    }

    const body = await request.text();
    let batch: TelemetryBatch;

    try {
      batch = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: CORS_HEADERS });
    }

    if (!batch.events || !Array.isArray(batch.events)) {
      return new Response('Invalid payload: events array required', { status: 400, headers: CORS_HEADERS });
    }

    if (batch.events.length === 0) {
      return new Response('OK', { status: 200, headers: CORS_HEADERS });
    }

    if (batch.events.length > 100) {
      return new Response('Too many events (max 100)', { status: 400, headers: CORS_HEADERS });
    }

    const stmt = env.TELEMETRY_DB.prepare(`
      INSERT INTO events (event_type, session_id, timestamp, session_time, data, environment, ip_country)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const country = request.headers.get('CF-IPCountry') || 'XX';

    const inserts = batch.events.map(event => {
      const eventType = String(event.eventType || 'unknown').slice(0, 50);
      const sessionId = String(event.sessionId || 'unknown').slice(0, 100);
      const timestamp = String(event.timestamp || new Date().toISOString()).slice(0, 30);
      const sessionTime = typeof event.sessionTime === 'number' ? event.sessionTime : 0;
      const data = JSON.stringify(event.data || {}).slice(0, 10000);

      return stmt.bind(
        eventType,
        sessionId,
        timestamp,
        sessionTime,
        data,
        env.ENVIRONMENT,
        country
      );
    });

    await env.TELEMETRY_DB.batch(inserts);

    return new Response('OK', {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (error) {
    console.error('Telemetry error:', error);
    return new Response('Internal Error', { status: 500, headers: CORS_HEADERS });
  }
}
