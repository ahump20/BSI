import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context } from 'hono';
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import { getGame, getGamesByDate, getSchedule, getStandings, RepoError } from './repo';

export interface Env {
  DB: D1Database;
  HOT: KVNamespace;
  RAW: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET'],
}));

app.get('/api/college-baseball/games', async (c) => {
  const { date, division = 'D1', conf, status } = c.req.query();
  if (!date) {
    return c.json({ error: 'date required' }, 400);
  }

  try {
    const result = await getGamesByDate(c.env.DB, {
      date,
      division,
      conference: conf,
      status,
    });

    return withCaching(c, result, 300);
  } catch (error) {
    return handleError(c, error);
  }
});

app.get('/api/college-baseball/games/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) {
    return c.json({ error: 'invalid game id' }, 400);
  }

  try {
    const result = await getGame(c.env.DB, id);
    return withCaching(c, result, 60);
  } catch (error) {
    return handleError(c, error);
  }
});

app.get('/api/college-baseball/standings', async (c) => {
  const { division = 'D1', conf } = c.req.query();

  try {
    const result = await getStandings(c.env.DB, {
      division,
      conference: conf,
    });

    return withCaching(c, result, 600);
  } catch (error) {
    return handleError(c, error);
  }
});

app.get('/api/college-baseball/teams/:teamId/schedule', async (c) => {
  const teamId = Number(c.req.param('teamId'));
  if (!Number.isFinite(teamId)) {
    return c.json({ error: 'invalid team id' }, 400);
  }

  const seasonParam = c.req.query('season');
  const season = seasonParam ? Number(seasonParam) : undefined;
  if (seasonParam && !Number.isFinite(Number(seasonParam))) {
    return c.json({ error: 'invalid season' }, 400);
  }

  try {
    const result = await getSchedule(c.env.DB, {
      teamId,
      season,
    });

    return withCaching(c, result, 600);
  } catch (error) {
    return handleError(c, error);
  }
});

app.onError((err, c) => {
  console.error('[api-college-baseball] unhandled error', err);
  return c.json({ error: 'internal_error' }, 500);
});

export default app;

async function withCaching<T>(c: Context, body: T, sMaxAge: number) {
  const payload = JSON.stringify(body);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const etag = toHex(new Uint8Array(digest));
  const headers = new Headers({
    'ETag': `"${etag}"`,
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=60`,
    'Last-Modified': new Date().toUTCString(),
    'Content-Type': 'application/json; charset=utf-8',
  });

  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch && normalizeTag(ifNoneMatch) === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(payload, { status: 200, headers });
}

function normalizeTag(tagHeader: string): string {
  return tagHeader.replace(/W\//g, '').replace(/"/g, '').trim();
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function handleError(c: Context, error: unknown) {
  if (error instanceof RepoError) {
    const status = error.status ?? 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  console.error('[api-college-baseball] handler error', error);
  return c.json({ error: 'internal_error' }, 500);
}
