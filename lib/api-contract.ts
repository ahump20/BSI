/**
 * BSI Standard API Response Contract
 *
 * All BSI API routes MUST return this shape. No exceptions.
 *
 * The contract enforces explicit status reporting:
 * - 'ok': Data is valid and ready to display
 * - 'invalid': Data failed validation (show error banner)
 * - 'unavailable': Dataset not available (show unavailable banner)
 *
 * Empty data with status 'ok' is FORBIDDEN. If data is null/empty,
 * status must be 'invalid' or 'unavailable'.
 */

export type ResponseStatus = 'ok' | 'invalid' | 'unavailable';
export type DataSource = 'kv' | 'r2-fallback' | 'live' | 'stale';

/**
 * Standard response shape for all BSI API endpoints
 */
export interface APIResponse<T> {
  /** The payload. Null when status is not 'ok'. */
  data: T | null;

  /** Explicit status - UI renders differently based on this */
  status: ResponseStatus;

  /** Where the data came from */
  source: DataSource;

  /** ISO timestamp in America/Chicago timezone */
  lastUpdated: string;

  /** Human-readable reason when status is not 'ok'. Empty string when 'ok'. */
  reason: string;

  /** Metadata about the request */
  meta: ResponseMeta;
}

export interface ResponseMeta {
  cache: {
    hit: boolean;
    ttlSeconds: number;
  };
  planTier: 'highlightly_pro';
  quota: {
    remaining: number;
    resetAt: string;
  };
}

/**
 * Create a successful response with valid data.
 * Use this when data passes semantic validation.
 */
export function createOkResponse<T>(
  data: T,
  source: DataSource,
  cacheHit: boolean = false,
  ttlSeconds: number = 300
): APIResponse<T> {
  return {
    data,
    status: 'ok',
    source,
    lastUpdated: formatTimestamp(),
    reason: '',
    meta: {
      cache: { hit: cacheHit, ttlSeconds },
      planTier: 'highlightly_pro',
      quota: { remaining: 0, resetAt: '' },
    },
  };
}

/**
 * Create a response for invalid data.
 * Use this when data exists but fails semantic validation.
 */
export function createInvalidResponse<T = unknown>(
  reason: string,
  source: DataSource = 'live'
): APIResponse<T> {
  return {
    data: null,
    status: 'invalid',
    source,
    lastUpdated: formatTimestamp(),
    reason,
    meta: {
      cache: { hit: false, ttlSeconds: 0 },
      planTier: 'highlightly_pro',
      quota: { remaining: 0, resetAt: '' },
    },
  };
}

/**
 * Create a response for unavailable data.
 * Use this when the data source is not accessible or out of season.
 */
export function createUnavailableResponse<T = unknown>(reason: string): APIResponse<T> {
  return {
    data: null,
    status: 'unavailable',
    source: 'live',
    lastUpdated: formatTimestamp(),
    reason,
    meta: {
      cache: { hit: false, ttlSeconds: 0 },
      planTier: 'highlightly_pro',
      quota: { remaining: 0, resetAt: '' },
    },
  };
}

/**
 * Create a response with cached data marked as stale.
 * Use this when serving older data because fresh data is unavailable.
 */
export function createStaleResponse<T>(data: T, cachedAt: string, reason: string): APIResponse<T> {
  return {
    data,
    status: 'ok',
    source: 'stale',
    lastUpdated: cachedAt,
    reason,
    meta: {
      cache: { hit: true, ttlSeconds: 0 },
      planTier: 'highlightly_pro',
      quota: { remaining: 0, resetAt: '' },
    },
  };
}

/**
 * Format timestamp in ISO format.
 * Note: For display purposes, frontend should convert to America/Chicago.
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Type guard to check if a response is successful
 */
export function isOkResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { status: 'ok'; data: T } {
  return response.status === 'ok' && response.data !== null;
}

/**
 * Type guard to check if a response indicates failure
 */
export function isErrorResponse<T>(response: APIResponse<T>): boolean {
  return response.status === 'invalid' || response.status === 'unavailable';
}
