import type { Env } from './types';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;  // per window per IP

/**
 * KV-based IP rate limiter.
 * Key: `rl:{ip}`, Value: `{count}:{windowStart}`
 * TTL auto-expires stale keys.
 */
export async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rl:${ip}`;
  const now = Date.now();

  const raw = await env.RATE_LIMIT.get(key);
  if (!raw) {
    await env.RATE_LIMIT.put(key, `1:${now}`, { expirationTtl: 120 });
    return true;
  }

  const [countStr, startStr] = raw.split(':');
  const count = parseInt(countStr, 10);
  const windowStart = parseInt(startStr, 10);

  if (now - windowStart > WINDOW_MS) {
    // New window
    await env.RATE_LIMIT.put(key, `1:${now}`, { expirationTtl: 120 });
    return true;
  }

  if (count >= MAX_REQUESTS) {
    return false;
  }

  await env.RATE_LIMIT.put(key, `${count + 1}:${windowStart}`, { expirationTtl: 120 });
  return true;
}
