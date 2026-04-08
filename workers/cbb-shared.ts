/**
 * Shared utilities for BSI college baseball pipeline workers.
 *
 * Used by: bsi-cbb-ingest, bsi-college-baseball-daily.
 * Wrangler bundles each worker independently — shared source, separate deploys.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ESPN_BASE = 'https://site.api.espn.com';
export const CBB_SPORT_PATH = 'baseball/college-baseball';
export const HIGHLIGHTLY_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
export const HIGHLIGHTLY_BASE = `https://${HIGHLIGHTLY_HOST}`;
export const CONFERENCES = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'] as const;
export const DEFAULT_TIMEOUT_MS = 12_000;

// ---------------------------------------------------------------------------
// Season awareness
// ---------------------------------------------------------------------------

/** College baseball runs Feb through June (months 2-6). */
export function isBaseballSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 2 && month <= 6;
}

// ---------------------------------------------------------------------------
// Highlightly API helpers
// ---------------------------------------------------------------------------

export function highlightlyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': HIGHLIGHTLY_HOST,
    Accept: 'application/json',
  };
}

// ---------------------------------------------------------------------------
// safeFetch — timeout-guarded fetch with typed JSON parsing
// ---------------------------------------------------------------------------

export interface FetchResult<T> {
  ok: boolean;
  data?: T;
  status: number;
  error?: string;
  duration_ms: number;
}

/**
 * Fetch with abort timeout, typed JSON parse, and timing.
 * Callers that don't need `status` / `duration_ms` can ignore them.
 */
export async function safeFetch<T>(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<FetchResult<T>> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BSI/1.0', ...headers },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const duration_ms = Date.now() - start;
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, duration_ms };
    return { ok: true, data: (await res.json()) as T, status: res.status, duration_ms };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'Fetch failed', duration_ms: Date.now() - start };
  }
}
