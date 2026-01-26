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

/** Consumer compatibility status for schema versioning */
export type ConsumerCompatibility = 'compatible' | 'incompatible' | 'unknown';

/** Renderability contract for schema-validated responses */
export interface RenderabilityContract {
  renderable: boolean;
  schemaVersion: string | null;
  consumerCompatibility: ConsumerCompatibility;
  reason?: string;
}

/** Full response metadata */
export interface ResponseMeta {
  cache: CacheMeta;
  planTier: 'highlightly_pro';
  quota: QuotaMeta;
  lifecycle: LifecycleState;
  /** Schema renderability contract (present when schema validation is enabled) */
  renderability?: RenderabilityContract;
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

/** Schema assertion result for building renderability contract */
export interface SchemaAssertionResult {
  passed: boolean;
  reason?: string;
}

/**
 * Build a RenderabilityContract from schema assertion result.
 * Used to inform consumers whether data is structurally valid.
 */
export function buildRenderabilityContract(
  schemaAssertion: SchemaAssertionResult | undefined,
  schemaVersion: string | null,
  currentSchemaVersion: string | null
): RenderabilityContract {
  // No schema defined - unknown compatibility
  if (!schemaVersion) {
    return {
      renderable: true,
      schemaVersion: null,
      consumerCompatibility: 'unknown',
    };
  }

  // Schema assertion failed
  if (schemaAssertion && !schemaAssertion.passed) {
    return {
      renderable: false,
      schemaVersion,
      consumerCompatibility: 'incompatible',
      reason: schemaAssertion.reason,
    };
  }

  // Check version compatibility (N or N-1)
  const compatibility = determineCompatibility(schemaVersion, currentSchemaVersion);

  return {
    renderable: schemaAssertion?.passed ?? true,
    schemaVersion,
    consumerCompatibility: compatibility,
    reason: compatibility === 'incompatible' ? `Schema version mismatch` : undefined,
  };
}

/**
 * Determine consumer compatibility based on schema versions.
 * Compatible if data version is N or N-1 relative to current active version.
 */
function determineCompatibility(
  dataVersion: string,
  currentVersion: string | null
): ConsumerCompatibility {
  if (!currentVersion) {
    return 'unknown';
  }

  const dataSemver = parseSemverSimple(dataVersion);
  const currentSemver = parseSemverSimple(currentVersion);

  if (!dataSemver || !currentSemver) {
    return dataVersion === currentVersion ? 'compatible' : 'unknown';
  }

  // Same major version is compatible
  if (dataSemver.major === currentSemver.major) {
    return 'compatible';
  }

  // N-1 major version is compatible
  if (currentSemver.major === dataSemver.major + 1) {
    return 'compatible';
  }

  return 'incompatible';
}

/**
 * Parse semver string (simple implementation).
 */
function parseSemverSimple(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}
