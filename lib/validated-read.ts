/**
 * Validated Read Layer
 *
 * Reads data from KV with semantic validation.
 * Falls back to R2 snapshots if KV data is invalid or missing.
 *
 * This ensures the read path enforces the same truth standards
 * as the write path.
 */

import {
  validateDataset,
  getLatestSnapshot,
  SEMANTIC_RULES,
  type R2Bucket,
  type ValidationResult,
} from './semantic-validation';
import {
  createOkResponse,
  createInvalidResponse,
  createUnavailableResponse,
  type APIResponse,
} from './api-contract';

/**
 * KV namespace interface (Cloudflare Workers)
 */
export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' }): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Shape of cached data in KV
 */
interface CachedData<T> {
  data: T[];
  fetchedAt: string;
  recordCount: number;
}

/**
 * Read data from KV with validation, falling back to R2 if needed.
 *
 * Flow:
 * 1. Read from KV
 * 2. Validate against semantic rules
 * 3. If valid, return with status 'ok'
 * 4. If invalid, try R2 fallback
 * 5. If R2 valid, return with source 'r2-fallback'
 * 6. If both fail, return with status 'invalid'
 *
 * @param kv - KV namespace binding
 * @param r2 - R2 bucket binding (optional, null disables fallback)
 * @param cacheKey - KV key to read from
 * @param datasetId - Semantic rule ID for validation
 */
export async function validatedRead<T>(
  kv: KVNamespace,
  r2: R2Bucket | null,
  cacheKey: string,
  datasetId: string
): Promise<APIResponse<T[]>> {
  const rule = SEMANTIC_RULES[datasetId];

  // Unknown dataset - return unavailable
  if (!rule) {
    return createUnavailableResponse(`Unknown dataset: ${datasetId}. No semantic rules defined.`);
  }

  // Try KV first
  let cached: CachedData<T> | null = null;
  try {
    cached = (await kv.get(cacheKey, { type: 'json' })) as CachedData<T> | null;
  } catch {
    // KV read failed - continue to fallback
  }

  if (cached?.data) {
    const validation = validateDataset(datasetId, cached.data);

    if (validation.status === 'valid') {
      return createOkResponse(cached.data, 'kv', true);
    }

    // KV data invalid - try R2 fallback
    if (r2) {
      const fallbackResult = await tryR2Fallback<T>(r2, datasetId);
      if (fallbackResult) {
        return fallbackResult;
      }
    }

    // Both failed - return invalid with KV validation reason
    return createInvalidResponse(validation.reason, 'kv');
  }

  // KV empty - try R2 fallback
  if (r2) {
    const fallbackResult = await tryR2Fallback<T>(r2, datasetId);
    if (fallbackResult) {
      return fallbackResult;
    }
  }

  // No data anywhere
  return createInvalidResponse(
    `No data available for ${datasetId}. Expected at least ${rule.minRecordCount} records.`,
    'kv'
  );
}

/**
 * Try to get valid data from R2 snapshot
 */
async function tryR2Fallback<T>(r2: R2Bucket, datasetId: string): Promise<APIResponse<T[]> | null> {
  try {
    const snapshot = await getLatestSnapshot<T>(r2, datasetId);

    if (snapshot?.data) {
      const validation = validateDataset(datasetId, snapshot.data);

      if (validation.status === 'valid') {
        return createOkResponse(snapshot.data, 'r2-fallback');
      }
    }
  } catch {
    // R2 read failed - return null to indicate no fallback available
  }

  return null;
}

/**
 * Read with validation but return validation result for diagnostics
 */
export async function validatedReadWithDiagnostics<T>(
  kv: KVNamespace,
  cacheKey: string,
  datasetId: string
): Promise<{
  data: T[] | null;
  validation: ValidationResult;
  source: 'kv' | 'none';
  fetchedAt: string | null;
}> {
  const rule = SEMANTIC_RULES[datasetId];

  if (!rule) {
    return {
      data: null,
      validation: {
        status: 'invalid',
        datasetId,
        recordCount: 0,
        expectedMin: 0,
        passedSchema: false,
        passedDensity: false,
        reason: `Unknown dataset: ${datasetId}`,
        validatedAt: new Date().toISOString(),
      },
      source: 'none',
      fetchedAt: null,
    };
  }

  let cached: CachedData<T> | null = null;
  try {
    cached = (await kv.get(cacheKey, { type: 'json' })) as CachedData<T> | null;
  } catch {
    // KV read failed
  }

  if (!cached?.data) {
    return {
      data: null,
      validation: {
        status: 'unavailable',
        datasetId,
        recordCount: 0,
        expectedMin: rule.minRecordCount,
        passedSchema: false,
        passedDensity: false,
        reason: 'No cached data found',
        validatedAt: new Date().toISOString(),
      },
      source: 'none',
      fetchedAt: null,
    };
  }

  const validation = validateDataset(datasetId, cached.data);

  return {
    data: validation.status === 'valid' ? cached.data : null,
    validation,
    source: 'kv',
    fetchedAt: cached.fetchedAt,
  };
}
