/**
 * BSI API Contract Types
 * Central type definitions for API responses across all BSI services.
 */

/** Client-visible lifecycle states for datasets */
export type LifecycleState =
  | 'initializing' // First ingestion pending
  | 'live' // Active, valid data
  | 'stale' // Data exists but outdated
  | 'empty_valid' // Legitimately empty (off-season)
  | 'unavailable'; // Failed or missing when expected

/** Response status indicating data validity */
export type ResponseStatus = 'ok' | 'invalid' | 'unavailable';

/** Cache metadata in response */
export interface CacheMeta {
  hit: boolean;
  ttlSeconds: number;
  eligible: boolean;
}

/** Quota information for rate limiting */
export interface QuotaMeta {
  remaining: number;
  resetAt: string;
}

/** Full response metadata */
export interface ResponseMeta {
  cache: CacheMeta;
  planTier: 'highlightly_pro';
  quota: QuotaMeta;
  lifecycle: LifecycleState;
}

/** Standard BSI API response wrapper */
export interface APIResponse<T> {
  status: ResponseStatus;
  data: T | null;
  meta: ResponseMeta;
  error?: {
    code: string;
    message: string;
  };
}

/** Factory options for creating API responses */
export interface CreateResponseOptions<T> {
  status: ResponseStatus;
  data: T | null;
  cacheHit: boolean;
  cacheTtlSeconds: number;
  cacheEligible: boolean;
  lifecycle: LifecycleState;
  quotaRemaining: number;
  quotaResetAt: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Create a standard API response */
export function createAPIResponse<T>(options: CreateResponseOptions<T>): APIResponse<T> {
  const response: APIResponse<T> = {
    status: options.status,
    data: options.data,
    meta: {
      cache: {
        hit: options.cacheHit,
        ttlSeconds: options.cacheTtlSeconds,
        eligible: options.cacheEligible,
      },
      planTier: 'highlightly_pro',
      quota: {
        remaining: options.quotaRemaining,
        resetAt: options.quotaResetAt,
      },
      lifecycle: options.lifecycle,
    },
  };

  if (options.errorCode && options.errorMessage) {
    response.error = {
      code: options.errorCode,
      message: options.errorMessage,
    };
  }

  return response;
}

/** Create a successful response */
export function createSuccessResponse<T>(
  data: T,
  lifecycle: LifecycleState = 'live',
  cacheOpts: { hit: boolean; ttlSeconds: number; eligible: boolean } = {
    hit: false,
    ttlSeconds: 300,
    eligible: true,
  }
): APIResponse<T> {
  return createAPIResponse({
    status: 'ok',
    data,
    cacheHit: cacheOpts.hit,
    cacheTtlSeconds: cacheOpts.ttlSeconds,
    cacheEligible: cacheOpts.eligible,
    lifecycle,
    quotaRemaining: 1000,
    quotaResetAt: new Date(Date.now() + 86400000).toISOString(),
  });
}

/** Create an unavailable response */
export function createUnavailableResponse<T>(
  errorCode: string,
  errorMessage: string,
  lifecycle: LifecycleState = 'unavailable'
): APIResponse<T> {
  return createAPIResponse({
    status: 'unavailable',
    data: null,
    cacheHit: false,
    cacheTtlSeconds: 0,
    cacheEligible: false,
    lifecycle,
    quotaRemaining: 1000,
    quotaResetAt: new Date(Date.now() + 86400000).toISOString(),
    errorCode,
    errorMessage,
  });
}

/** Create an invalid response */
export function createInvalidResponse<T>(errorCode: string, errorMessage: string): APIResponse<T> {
  return createAPIResponse({
    status: 'invalid',
    data: null,
    cacheHit: false,
    cacheTtlSeconds: 0,
    cacheEligible: false,
    lifecycle: 'unavailable',
    quotaRemaining: 1000,
    quotaResetAt: new Date(Date.now() + 86400000).toISOString(),
    errorCode,
    errorMessage,
  });
}
