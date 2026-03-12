import type { Env } from './types';
import { CACHE_TTL, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS } from './constants';
import {
  HighlightlyApiClient,
  createHighlightlyClient,
} from '../../lib/api-clients/highlightly-api';
import { NcaaApiClient, createNcaaClient } from '../../lib/api-clients/ncaa-api';
import { SportsDataIOClient } from '../../lib/api-clients/sportsdataio-api';

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

export function cachedJson(data: unknown, status: number, maxAge: number, extra: Record<string, string> = {}): Response {
  const headers: Record<string, string> = { 'Cache-Control': `public, max-age=${maxAge}`, ...extra };
  const meta = getPayloadMeta(data);

  // Auto-fill tier-1 freshness headers when X-Cache is present
  if (headers['X-Cache']) {
    if (!headers['X-Last-Updated']) headers['X-Last-Updated'] = meta?.lastUpdated ?? new Date().toISOString();
    if (!headers['X-Cache-State']) {
      const c = headers['X-Cache'];
      headers['X-Cache-State'] = c === 'HIT' ? 'cached' : c === 'STALE' ? 'stale' : c === 'ERROR' ? 'error' : 'fresh';
    }
    if (!headers['X-Data-Source'] && headers['X-Cache'] === 'HIT') {
      headers['X-Data-Source'] = 'cache';
    }
    if (!headers['X-Data-Source'] && meta?.source) {
      headers['X-Data-Source'] = meta.source;
    }
    if (!headers['X-Origin-Data-Source'] && meta?.source) {
      headers['X-Origin-Data-Source'] = meta.source;
    }
  }
  return json(data, status, headers);
}

export async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key, 'text');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvPut(kv: KVNamespace, key: string, data: unknown, ttl: number): Promise<void> {
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
}

export async function logError(env: Env, error: string, context: string): Promise<void> {
  try {
    const kv = env.ERROR_LOG ?? env.KV;
    const key = `err:${Date.now()}`;
    await kv.put(
      key,
      JSON.stringify({ error, context, timestamp: new Date().toISOString() }),
      { expirationTtl: 86400 * 7 }
    );
  } catch (err) {
    console.error('[logError] KV write failed:', err instanceof Error ? err.message : err);
  }
}

export function dataHeaders(lastUpdated: string, source = 'highlightly'): Record<string, string> {
  return {
    'X-Last-Updated': lastUpdated,
    'X-Data-Source': source,
  };
}

export function cachedPayloadHeaders(payload: unknown, source = 'cache'): Record<string, string> {
  const meta = getPayloadMeta(payload);
  const lastUpdated = meta?.lastUpdated ?? new Date().toISOString();
  return {
    ...dataHeaders(lastUpdated, meta?.source ?? source),
    'X-Cache': 'HIT',
    ...(meta?.source ? { 'X-Origin-Data-Source': meta.source } : {}),
  };
}

interface PayloadMetaSnapshot {
  source?: string;
  lastUpdated?: string;
}

function getPayloadMeta(payload: unknown): PayloadMetaSnapshot | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const root = payload as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null
    ? (root.meta as Record<string, unknown>)
    : null;

  const source = [meta?.source, meta?.dataSource, root.source, root.dataSource].find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  const lastUpdated = [meta?.lastUpdated, meta?.fetched_at, root.lastUpdated, root.fetched_at, root.timestamp, root.cacheTime].find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );

  return source || lastUpdated ? { source, lastUpdated } : null;
}

/** Tier-1 response headers for fresh data (cache MISS). */
export function freshDataHeaders(source = 'espn'): Record<string, string> {
  return {
    'X-Cache': 'MISS',
    'X-Data-Source': source,
    'X-Last-Updated': new Date().toISOString(),
    'X-Cache-State': 'fresh',
  };
}

/** Tier-1 response headers for cached data (cache HIT). */
export function cachedDataHeaders(): Record<string, string> {
  return {
    'X-Cache': 'HIT',
    'X-Data-Source': 'cache',
    'X-Last-Updated': new Date().toISOString(),
    'X-Cache-State': 'cached',
  };
}

interface PayloadMetaOptions {
  fetchedAt?: string;
  sources?: string[];
  degraded?: boolean;
  extra?: Record<string, unknown>;
}

export function buildMeta(source = 'espn', options: PayloadMetaOptions = {}): Record<string, unknown> {
  return {
    source,
    fetched_at: options.fetchedAt ?? new Date().toISOString(),
    timezone: 'America/Chicago',
    ...(options.sources ? { sources: options.sources } : {}),
    ...(options.degraded !== undefined ? { degraded: options.degraded } : {}),
    ...(options.extra ?? {}),
  };
}

/** Wrap any payload with standard BSI meta attribution. */
export function withMeta(
  data: unknown,
  source = 'espn',
  options: PayloadMetaOptions = {},
): Record<string, unknown> {
  return {
    ...(data as Record<string, unknown>),
    meta: buildMeta(source, options),
  };
}

export function getSDIOClient(env: Env): SportsDataIOClient | null {
  if (!env.SPORTS_DATA_IO_API_KEY) return null;
  return new SportsDataIOClient(env.SPORTS_DATA_IO_API_KEY);
}

export function getCollegeClient(): NcaaApiClient {
  return createNcaaClient();
}

export function getHighlightlyClient(env: Env): HighlightlyApiClient | null {
  if (!env.RAPIDAPI_KEY) return null;
  return createHighlightlyClient(env.RAPIDAPI_KEY);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export async function checkRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `rl:${ip}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000))}`;
  const count = parseInt((await kv.get(key)) || '0', 10);
  if (count >= RATE_LIMIT_MAX_REQUESTS) return false;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW * 2 });
  return true;
}

export async function safeESPN(
  handler: () => Promise<Response>,
  fallbackKey: string,
  fallbackValue: unknown,
  env: Env,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown ESPN error';
    await logError(env, msg, `espn:${fallbackKey}`);
    return json(
      { [fallbackKey]: fallbackValue, meta: { error: msg, source: 'espn' } },
      502,
    );
  }
}

export function toDateString(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  return dateStr.replace(/-/g, '');
}

interface MetaOptions {
  ttlSeconds?: number;
  sport?: string;
  sources?: string[];
  degraded?: boolean;
}

export function cvApiResponse<T>(
  data: T,
  source: string,
  cacheHit: boolean,
  opts: MetaOptions = {},
): object {
  return {
    data,
    meta: buildMeta(source, {
      sources: opts.sources,
      degraded: opts.degraded,
      extra: {
        cache_hit: cacheHit,
        ...(opts.ttlSeconds !== undefined ? { ttl_seconds: opts.ttlSeconds } : {}),
        ...(opts.sport ? { sport: opts.sport } : {}),
      },
    }),
  };
}

export async function archiveRawResponse(
  bucket: R2Bucket | undefined,
  source: string,
  endpoint: string,
  data: unknown,
): Promise<void> {
  if (!bucket) return;
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toISOString().split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
    const key = `raw-responses/${source}/${endpoint}/${date}/${time}.json`;
    await bucket.put(key, JSON.stringify(data), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { source, endpoint, archived_at: now.toISOString() },
    });
  } catch { /* non-critical — archiving must never block the request */ }
}

export async function responseToJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { error: 'Failed to parse upstream response' };
  }
}
