const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>();
let _rateLimitCleanupCounter = 0;

export function checkInMemoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export function maybeCleanupRateLimit(): void {
  if (++_rateLimitCleanupCounter < 500) return;
  _rateLimitCleanupCounter = 0;
  const now = Date.now();
  for (const [key, val] of _rateLimitMap) {
    if (now > val.resetAt) _rateLimitMap.delete(key);
  }
}
