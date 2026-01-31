/**
 * Neural Coach Session Storage API
 * Cloudflare Pages Function
 *
 * POST /api/v1/neural-coach/sessions - Save a coaching session
 * GET /api/v1/neural-coach/sessions - List recent sessions
 * GET /api/v1/neural-coach/sessions/:id - Get specific session
 */

interface Env {
  KV: KVNamespace;
}

interface SessionData {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  averageFusion: number;
  predictions: number;
  coachInterventions: number;
  metrics: {
    posture: number;
    voice: number;
    face: number;
    attention: number;
  };
  patterns: string[];
  userId?: string;
}

interface SessionRecord {
  session: SessionData;
  createdAt: string;
  userAgent: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function generateSessionId(): string {
  return `nc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as SessionData;

    if (!body.startTime || !body.duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: startTime, duration' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const sessionId = body.id || generateSessionId();
    const record: SessionRecord = {
      session: { ...body, id: sessionId },
      createdAt: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent') || 'unknown',
    };

    // Store with session: prefix per KV namespace convention
    const key = `session:neural-coach:${sessionId}`;
    await env.KV.put(key, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 90, // 90 days retention
    });

    // Update session index for listing
    const indexKey = 'session:neural-coach:index';
    const existingIndex = await env.KV.get(indexKey);
    const index: string[] = existingIndex ? JSON.parse(existingIndex) : [];

    // Add to front, keep last 100 sessions
    index.unshift(sessionId);
    if (index.length > 100) index.pop();

    await env.KV.put(indexKey, JSON.stringify(index));

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        message: 'Session saved successfully',
      }),
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Failed to save session: ${message}` }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Check if requesting specific session: /api/v1/neural-coach/sessions/:id
  const sessionIdIndex = pathParts.indexOf('sessions') + 1;
  const sessionId = pathParts[sessionIdIndex];

  try {
    if (sessionId && sessionId !== '') {
      // Get specific session
      const key = `session:neural-coach:${sessionId}`;
      const data = await env.KV.get(key);

      if (!data) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      return new Response(data, { headers: CORS_HEADERS });
    }

    // List sessions
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const indexKey = 'session:neural-coach:index';
    const indexData = await env.KV.get(indexKey);

    if (!indexData) {
      return new Response(JSON.stringify({ sessions: [], total: 0 }), { headers: CORS_HEADERS });
    }

    const index: string[] = JSON.parse(indexData);
    const sessionIds = index.slice(0, limit);

    // Fetch session summaries
    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const key = `session:neural-coach:${id}`;
        const data = await env.KV.get(key);
        if (!data) return null;

        const record: SessionRecord = JSON.parse(data);
        return {
          id: record.session.id,
          createdAt: record.createdAt,
          duration: record.session.duration,
          averageFusion: record.session.averageFusion,
          predictions: record.session.predictions,
          coachInterventions: record.session.coachInterventions,
        };
      })
    );

    return new Response(
      JSON.stringify({
        sessions: sessions.filter(Boolean),
        total: index.length,
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Failed to fetch sessions: ${message}` }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
