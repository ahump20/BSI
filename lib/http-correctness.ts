/**
 * BSI HTTP Correctness
 * Single source of truth for HTTP status mapping based on data validity and lifecycle.
 *
 * Truth Table:
 * | Condition                              | Status | Cache-Control |
 * |----------------------------------------|--------|---------------|
 * | Valid + live + >= minCount             | 200    | max-age=TTL   |
 * | First ingestion pending                | 202    | no-store      |
 * | Empty + allowsEmptyWhenOffSeason       | 204    | no-store      |
 * | Failed/stale/missing when expected     | 503    | no-store      |
 */

import type { LifecycleState } from './api-contract';
import type { ValidationResult, SemanticRule } from './semantic-validation';
import type { KVSafetyMetadata, SafeHTTPStatus } from './kv-safety';
import type { ReadinessState } from './readiness';

/** Result of HTTP status mapping */
export interface HTTPMappingResult {
  httpStatus: SafeHTTPStatus;
  cacheEligible: boolean;
  cacheControl: string;
  reason: string;
}

/** Input for mapToHTTPStatus */
export interface HTTPMappingInput {
  validationResult: ValidationResult;
  lifecycleState: LifecycleState;
  recordCount: number;
  rule: SemanticRule;
  /** Optional system-level readiness state. Takes precedence over lifecycle. */
  readinessState?: ReadinessState;
}

/** Cache TTL constants (seconds) */
const CACHE_TTL = {
  LIVE_DATA: 300, // 5 minutes for live valid data
  STALE_HINT: 60, // 1 minute stale-while-revalidate hint
  NO_CACHE: 0,
} as const;

/**
 * Map validation result and lifecycle state to HTTP status.
 * This is the single source of truth for HTTP semantics.
 *
 * Readiness takes precedence: if system is not ready, return 202/503 immediately.
 */
export function mapToHTTPStatus(input: HTTPMappingInput): HTTPMappingResult {
  const { validationResult, lifecycleState, recordCount, rule, readinessState } = input;

  // Case 0: System-level readiness check (takes precedence)
  if (readinessState && readinessState !== 'ready') {
    if (readinessState === 'initializing') {
      return {
        httpStatus: 202,
        cacheEligible: false,
        cacheControl: 'no-store',
        reason: 'System initializing - awaiting first validation',
      };
    }
    // degraded or unavailable
    return {
      httpStatus: 503,
      cacheEligible: false,
      cacheControl: 'no-store',
      reason: `System ${readinessState}`,
    };
  }

  // Case 1: First ingestion pending
  if (lifecycleState === 'initializing') {
    return {
      httpStatus: 202,
      cacheEligible: false,
      cacheControl: 'no-store',
      reason: 'First ingestion pending',
    };
  }

  // Case 2: Empty + off-season allowed
  if (recordCount === 0 && validationResult.isOffSeason && rule.allowsEmptyWhenOffSeason) {
    return {
      httpStatus: 204,
      cacheEligible: false,
      cacheControl: 'no-store',
      reason: 'Legitimately empty during off-season',
    };
  }

  // Case 3: Valid + live + meets threshold
  if (
    validationResult.status === 'valid' &&
    lifecycleState === 'live' &&
    recordCount >= rule.minRecordCount
  ) {
    return {
      httpStatus: 200,
      cacheEligible: true,
      cacheControl: `public, max-age=${CACHE_TTL.LIVE_DATA}, stale-while-revalidate=${CACHE_TTL.STALE_HINT}`,
      reason: 'Valid data, cache eligible',
    };
  }

  // Case 4: Empty but allowed during off-season (but lifecycle not empty_valid)
  if (lifecycleState === 'empty_valid') {
    return {
      httpStatus: 204,
      cacheEligible: false,
      cacheControl: 'no-store',
      reason: 'Empty but valid state',
    };
  }

  // Case 5: Stale data
  if (lifecycleState === 'stale') {
    return {
      httpStatus: 503,
      cacheEligible: false,
      cacheControl: 'no-store',
      reason: 'Data is stale',
    };
  }

  // Case 6: All other failure states
  return {
    httpStatus: 503,
    cacheEligible: false,
    cacheControl: 'no-store',
    reason: `Validation failed: ${validationResult.errors.join('; ') || 'unavailable'}`,
  };
}

/**
 * Determine lifecycle state from validation result and context.
 */
export function determineLifecycleState(
  validationResult: ValidationResult,
  hasExistingData: boolean,
  isFirstIngestion: boolean
): LifecycleState {
  // First ingestion pending
  if (isFirstIngestion && !hasExistingData) {
    return 'initializing';
  }

  // Valid data
  if (validationResult.status === 'valid') {
    return 'live';
  }

  // Empty during off-season
  if (
    validationResult.status === 'empty' &&
    validationResult.isOffSeason &&
    validationResult.rule.allowsEmptyWhenOffSeason
  ) {
    return 'empty_valid';
  }

  // Has some data but validation failed
  if (validationResult.recordCount > 0 && hasExistingData) {
    return 'stale';
  }

  // No data when expected
  return 'unavailable';
}

/**
 * Check if KV entry metadata indicates cache-eligible state.
 * Strict: only 200 + live + meets threshold.
 */
export function isCacheEligible(meta: KVSafetyMetadata): boolean {
  return (
    meta.httpStatusAtWrite === 200 &&
    meta.lifecycleState === 'live' &&
    meta.recordCount >= meta.expectedMinCount
  );
}

/**
 * Build HTTP headers from KV metadata.
 */
export function buildCacheHeaders(meta: KVSafetyMetadata, rule: SemanticRule): HeadersInit {
  const headers: Record<string, string> = {
    'X-BSI-Lifecycle': meta.lifecycleState,
    'X-BSI-Cache-Eligible': String(isCacheEligible(meta)),
    'X-BSI-Dataset': meta.datasetId,
    'X-BSI-Record-Count': String(meta.recordCount),
    'X-BSI-Ingested-At': meta.ingestedAt,
  };

  if (isCacheEligible(meta)) {
    headers['Cache-Control'] =
      `public, max-age=${CACHE_TTL.LIVE_DATA}, stale-while-revalidate=${CACHE_TTL.STALE_HINT}`;
  } else {
    headers['Cache-Control'] = 'no-store';
  }

  return headers;
}

/**
 * Build headers for a given HTTP mapping result.
 */
export function buildHeadersFromMapping(
  result: HTTPMappingResult,
  datasetId: string,
  recordCount: number
): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': result.cacheControl,
    'X-BSI-HTTP-Reason': result.reason,
    'X-BSI-Cache-Eligible': String(result.cacheEligible),
    'X-BSI-Dataset': datasetId,
    'X-BSI-Record-Count': String(recordCount),
  };
}
