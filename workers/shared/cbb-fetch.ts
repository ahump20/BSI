/**
 * Shared college baseball fetch helpers used across satellite workers.
 * Consumed by: bsi-cbb-ingest, bsi-college-baseball-daily
 *
 * No Env dependency — safe to import from any worker.
 */

import { HIGHLIGHTLY_HOST, FETCH_TIMEOUT_MS } from './cbb-constants';

export interface SafeFetchResult<T> {
  ok: boolean;
  data?: T;
  status: number;
  error?: string;
  duration_ms: number;
}

/**
 * Fetch with timeout, abort controller, and structured error handling.
 * Returns status + duration for observability; callers can ignore if unneeded.
 */
export async function safeFetch<T>(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<SafeFetchResult<T>> {
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

/**
 * Build Highlightly/RapidAPI auth headers.
 */
export function highlightlyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': HIGHLIGHTLY_HOST,
    Accept: 'application/json',
  };
}

/**
 * College baseball runs Feb through June.
 */
export function isBaseballSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 2 && month <= 6;
}
