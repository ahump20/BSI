import {
  buildPortalActivityResponse,
  getPortalActivitySnapshot,
  normalizePortalFeedPayload
} from '../lib/portal/activity';
import type { PortalActivitySnapshot } from '../lib/portal/types';

interface Env {
  PORTAL_SOURCE_URL?: string;
  PORTAL_API_TOKEN?: string;
  PORTAL_SYNC_SECRET?: string;
  REDIS_REST_URL?: string;
  REDIS_REST_TOKEN?: string;
  CACHE_TTL_SECONDS?: string;
}

const NIGHTLY_CRON = '0 6 * * *';
const SUMMARY_CACHE_KEY = 'portal:activity:summary';
const HEATMAP_CACHE_KEY = 'portal:activity:heatmap';
const FULL_CACHE_KEY = 'portal:activity:full';
const DEFAULT_CACHE_TTL = 60 * 60; // 1 hour fallback

async function fetchPortalSnapshot(env: Env): Promise<PortalActivitySnapshot> {
  if (!env.PORTAL_SOURCE_URL) {
    console.warn('[portal-sync] PORTAL_SOURCE_URL not set, falling back to static snapshot');
    return getPortalActivitySnapshot();
  }

  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (env.PORTAL_API_TOKEN) {
      headers.set('Authorization', `Bearer ${env.PORTAL_API_TOKEN}`);
    }

    const response = await fetch(env.PORTAL_SOURCE_URL, {
      method: 'GET',
      headers,
      cf: {
        cacheEverything: false
      }
    });

    if (!response.ok) {
      console.error(`[portal-sync] Upstream portal feed failed: ${response.status}`);
      return getPortalActivitySnapshot();
    }

    const payload = await response.json();
    return normalizePortalFeedPayload(payload);
  } catch (error) {
    console.error('[portal-sync] Fetch failed, reverting to static snapshot', error);
    return getPortalActivitySnapshot();
  }
}

async function writeRedis(env: Env, command: (string | number)[]) {
  if (!env.REDIS_REST_URL || !env.REDIS_REST_TOKEN) {
    console.warn('[portal-sync] Redis credentials not configured – skipping cache write');
    return;
  }

  const response = await fetch(env.REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command: command.map((value) => value.toString()) })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[portal-sync] Redis command failed: ${response.status} ${text}`);
  }
}

async function cachePortalHotReads(env: Env, snapshot: PortalActivitySnapshot) {
  const ttl = Number.parseInt(env.CACHE_TTL_SECONDS ?? '', 10) || snapshot.ttlSeconds || DEFAULT_CACHE_TTL;
  const response = buildPortalActivityResponse(snapshot, { topMoversLimit: 6 });

  await Promise.all([
    writeRedis(env, ['SETEX', SUMMARY_CACHE_KEY, ttl, JSON.stringify(response.data.summary)]),
    writeRedis(env, ['SETEX', HEATMAP_CACHE_KEY, ttl, JSON.stringify(response.data.heatmap)]),
    writeRedis(env, ['SETEX', FULL_CACHE_KEY, ttl, JSON.stringify(response)])
  ]);
}

async function syncPortal(env: Env) {
  const snapshot = await fetchPortalSnapshot(env);
  await cachePortalHotReads(env, snapshot);
  console.log('[portal-sync] Portal activity refreshed', snapshot.generatedAt);
  return snapshot;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (event.cron !== NIGHTLY_CRON) {
      console.log(`[portal-sync] Ignoring cron ${event.cron}`);
      return;
    }

    ctx.waitUntil(syncPortal(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'portal-sync', cron: NIGHTLY_CRON, timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (url.pathname === '/sync' && request.method === 'POST') {
      const secret = request.headers.get('X-Portal-Sync-Secret');
      if (!env.PORTAL_SYNC_SECRET || secret !== env.PORTAL_SYNC_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        const snapshot = await syncPortal(env);
        return new Response(
          JSON.stringify({ ok: true, refreshedAt: snapshot.generatedAt }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('[portal-sync] Manual sync failed', error);
        return new Response(
          JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
