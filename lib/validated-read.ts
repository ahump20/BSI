/**
 * BSI Validated Read
 * KV read with validation, HTTP status reconstruction, and R2 fallback.
 */

import type { APIResponse, LifecycleState } from './api-contract';
import { createSuccessResponse, createUnavailableResponse } from './api-contract';
import type { KVSafetyMetadata, SafeHTTPStatus } from './kv-safety';
import { parseKVValue, hasKVSafetyMetadata, createKVSafetyMetadata } from './kv-safety';
import {
  validateDataset,
  getRule,
  type SemanticRule,
  type ValidationResult,
} from './semantic-validation';
import {
  buildCacheHeaders,
  isCacheEligible,
  mapToHTTPStatus,
  determineLifecycleState,
} from './http-correctness';

/** Result from validatedRead */
export interface ValidatedReadResult<T> {
  response: APIResponse<T[]>;
  httpStatus: SafeHTTPStatus;
  headers: HeadersInit;
  source: 'kv' | 'r2' | 'none';
  meta: KVSafetyMetadata | null;
}

/** KVNamespace type (Cloudflare Workers) */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, options: { type: 'text' }): Promise<string | null>;
  get(key: string, options: { type: 'json' }): Promise<unknown | null>;
}

/** R2Bucket type (Cloudflare Workers) */
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface R2ObjectBody {
  text(): Promise<string>;
}

/**
 * Read from KV with validation and HTTP status reconstruction.
 * Supports both new KVSafeData format and legacy CachedData format.
 */
export async function validatedRead<T extends Record<string, unknown>>(
  kv: KVNamespace,
  r2: R2Bucket | null,
  cacheKey: string,
  datasetId: string
): Promise<ValidatedReadResult<T>> {
  const rule = getRule(datasetId);

  // No rule defined
  if (!rule) {
    return createErrorResult<T>(
      'NO_RULE',
      `No semantic rule defined for dataset: ${datasetId}`,
      datasetId
    );
  }

  // Try KV first
  const kvRaw = await kv.get(cacheKey);

  if (kvRaw !== null) {
    const parsed = parseKVValue<T>(kvRaw);

    if (parsed !== null) {
      // New format with safety metadata
      if (parsed.meta !== null && !parsed.isLegacy) {
        return createResultFromSafeData(parsed.data, parsed.meta, rule);
      }

      // Legacy format - treat as stale until re-ingestion
      return createLegacyResult(parsed.data, datasetId, rule);
    }
  }

  // Try R2 fallback
  if (r2 !== null) {
    const r2Result = await tryR2Fallback<T>(r2, cacheKey, datasetId, rule);
    if (r2Result !== null) {
      return r2Result;
    }
  }

  // No data found
  return createErrorResult<T>('NOT_FOUND', `No data found for key: ${cacheKey}`, datasetId);
}

/** Create result from KVSafeData format */
function createResultFromSafeData<T>(
  data: T[],
  meta: KVSafetyMetadata,
  rule: SemanticRule
): ValidatedReadResult<T> {
  const headers = buildCacheHeaders(meta, rule);
  const lifecycle = meta.lifecycleState;
  const cacheEligible = isCacheEligible(meta);

  const response = createSuccessResponse(data, lifecycle, {
    hit: true,
    ttlSeconds: cacheEligible ? 300 : 0,
    eligible: cacheEligible,
  });

  return {
    response,
    httpStatus: meta.httpStatusAtWrite,
    headers,
    source: 'kv',
    meta,
  };
}

/** Create result from legacy cached data format */
function createLegacyResult<T extends Record<string, unknown>>(
  data: T[],
  datasetId: string,
  rule: SemanticRule
): ValidatedReadResult<T> {
  // Validate the legacy data
  const validation = validateDataset(datasetId, data);
  const lifecycle = determineLifecycleState(validation, true, false);

  // Legacy data is always treated as stale until re-ingestion
  const httpMapping = mapToHTTPStatus({
    validationResult: validation,
    lifecycleState: 'stale',
    recordCount: data.length,
    rule,
  });

  // Create synthetic metadata for headers
  const syntheticMeta = createKVSafetyMetadata({
    httpStatusAtWrite: httpMapping.httpStatus,
    lifecycleState: 'stale',
    recordCount: data.length,
    validationStatus: validation.status,
    datasetId,
    expectedMinCount: rule.minRecordCount,
  });

  const headers = buildCacheHeaders(syntheticMeta, rule);

  const response = createSuccessResponse(data, 'stale', {
    hit: true,
    ttlSeconds: 0,
    eligible: false,
  });

  return {
    response,
    httpStatus: 503, // Legacy data treated as 503 until re-ingestion
    headers: {
      ...headers,
      'X-BSI-Legacy-Format': 'true',
    },
    source: 'kv',
    meta: syntheticMeta,
  };
}

/** Try R2 fallback */
async function tryR2Fallback<T extends Record<string, unknown>>(
  r2: R2Bucket,
  cacheKey: string,
  datasetId: string,
  rule: SemanticRule
): Promise<ValidatedReadResult<T> | null> {
  try {
    const r2Object = await r2.get(cacheKey);

    if (r2Object === null) {
      return null;
    }

    const r2Raw = await r2Object.text();
    const parsed = parseKVValue<T>(r2Raw);

    if (parsed === null) {
      return null;
    }

    // R2 data with safety metadata
    if (parsed.meta !== null && !parsed.isLegacy) {
      const result = createResultFromSafeData(parsed.data, parsed.meta, rule);
      return {
        ...result,
        source: 'r2',
      };
    }

    // R2 legacy format
    const result = createLegacyResult(parsed.data, datasetId, rule);
    return {
      ...result,
      source: 'r2',
    };
  } catch {
    return null;
  }
}

/** Create error result */
function createErrorResult<T>(
  code: string,
  message: string,
  datasetId: string
): ValidatedReadResult<T> {
  const response = createUnavailableResponse<T[]>(code, message, 'unavailable');

  return {
    response,
    httpStatus: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-BSI-Dataset': datasetId,
      'X-BSI-Lifecycle': 'unavailable',
      'X-BSI-Cache-Eligible': 'false',
    },
    source: 'none',
    meta: null,
  };
}

/**
 * Create a Response object from ValidatedReadResult.
 * Convenience helper for Workers.
 */
export function toResponse<T>(result: ValidatedReadResult<T>): Response {
  return new Response(JSON.stringify(result.response), {
    status: result.httpStatus,
    headers: result.headers,
  });
}
