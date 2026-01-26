/**
 * BSI Validated Read
 * KV read with validation, HTTP status reconstruction, and R2 fallback.
 */

import type { APIResponse, RenderabilityContract } from './api-contract';
import {
  createSuccessResponse,
  createUnavailableResponse,
  buildRenderabilityContract,
} from './api-contract';
import type { KVSafetyMetadata, SafeHTTPStatus } from './kv-safety';
import { parseKVValue, createKVSafetyMetadata } from './kv-safety';
import { validateDataset, getRule, type SemanticRule } from './semantic-validation';
import {
  buildCacheHeaders,
  isCacheEligible,
  mapToHTTPStatus,
  determineLifecycleState,
} from './http-correctness';
import { checkReadiness, isServingLKG, type ReadinessState } from './readiness';
import {
  buildVersionedKey,
  buildCurrentKey,
  getCurrentVersion,
  getLastCommittedVersion,
} from './dataset-commit';
import { getActiveSchema, isSchemaCompatible, type SchemaErrorReason } from './schema-validation';

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

/** Options for validatedRead */
export interface ValidatedReadOptions {
  /** Optional D1 database for readiness check before KV read */
  db?: Parameters<typeof checkReadiness>[0];
  /** Scope for readiness check (defaults to datasetId) */
  readinessScope?: string;
}

/**
 * Read from KV with validation and HTTP status reconstruction.
 * Supports both new KVSafeData format and legacy CachedData format.
 *
 * If db is provided, checks D1 readiness before reading KV.
 * This prevents cold starts from poisoning cache.
 */
export async function validatedRead<T extends Record<string, unknown>>(
  kv: KVNamespace,
  r2: R2Bucket | null,
  cacheKey: string,
  datasetId: string,
  options?: ValidatedReadOptions
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

  // Check readiness if D1 is provided
  if (options?.db) {
    const scope = options.readinessScope ?? datasetId;
    const readiness = await checkReadiness(options.db, scope);

    if (!readiness.allowKVRead) {
      // When allowKVRead is false, httpStatus is always 202 or 503
      const blockedStatus = readiness.httpStatus as 202 | 503;
      return createReadinessBlockedResult<T>(
        readiness.state,
        readiness.reason,
        blockedStatus,
        datasetId
      );
    }
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
  const _lifecycle = determineLifecycleState(validation, true, false);

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

/** Create result when blocked by readiness check */
function createReadinessBlockedResult<T>(
  readinessState: ReadinessState,
  reason: string,
  httpStatus: 202 | 503,
  datasetId: string
): ValidatedReadResult<T> {
  const lifecycle = readinessState === 'initializing' ? 'initializing' : 'unavailable';
  const code = readinessState === 'initializing' ? 'INITIALIZING' : 'NOT_READY';
  const response = createUnavailableResponse<T[]>(code, reason, lifecycle);

  return {
    response,
    httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-BSI-Dataset': datasetId,
      'X-BSI-Lifecycle': lifecycle,
      'X-BSI-Readiness': readinessState,
      'X-BSI-Cache-Eligible': 'false',
      'Retry-After': readinessState === 'initializing' ? '30' : '60',
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

/** D1Database interface (Cloudflare Workers) */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta?: {
    changes: number;
    last_row_id: number;
  };
}

/** Schema assertion result for edge read */
export interface SchemaAssertionInfo {
  passed: boolean;
  reason?: SchemaErrorReason;
  details?: string;
}

/** Extended result with version info */
export interface ValidatedReadVersionedResult<T> extends ValidatedReadResult<T> {
  version: number | null;
  isLKG: boolean;
  lkgReason: string | null;
  /** Schema assertion result (present when schema validation is enabled) */
  schemaAssertion?: SchemaAssertionInfo;
  /** Renderability contract for consumers */
  renderability?: RenderabilityContract;
}

/**
 * Assert shape validity before serving response.
 * Checks:
 * 1. Schema hash matches D1 lastCommittedSchemaHash
 * 2. Schema version is compatible (N or N-1)
 * 3. Required fields exist in data (first record sampled)
 * 4. Record count >= minimumRenderableCount
 *
 * Returns assertion result. On failure, caller should return 422 with no-store.
 */
export async function assertShapeBeforeResponse<T extends Record<string, unknown>>(
  data: T[],
  meta: KVSafetyMetadata | null,
  db: D1Database,
  datasetId: string
): Promise<SchemaAssertionInfo> {
  // No metadata - pass (backward compatible)
  if (!meta) {
    return { passed: true };
  }

  // No schema defined in metadata - pass (backward compatible)
  if (!meta.schemaVersion || !meta.schemaHash) {
    return { passed: true };
  }

  // Get current version info from D1
  const currentVersionInfo = await getCurrentVersion(db, datasetId);

  // No schema tracking in D1 - pass (backward compatible)
  if (!currentVersionInfo?.lastCommittedSchemaHash) {
    return { passed: true };
  }

  // Assertion 1: Schema hash matches
  if (meta.schemaHash !== currentVersionInfo.lastCommittedSchemaHash) {
    return {
      passed: false,
      reason: 'schema_mismatch',
      details: `Data schema hash ${meta.schemaHash} does not match current ${currentVersionInfo.lastCommittedSchemaHash}`,
    };
  }

  // Assertion 2: Schema version compatibility (N or N-1)
  if (
    currentVersionInfo.currentSchemaVersion &&
    !isSchemaCompatible(currentVersionInfo.currentSchemaVersion, meta.schemaVersion)
  ) {
    return {
      passed: false,
      reason: 'schema_mismatch',
      details: `Schema version ${meta.schemaVersion} incompatible with current ${currentVersionInfo.currentSchemaVersion}`,
    };
  }

  // Assertion 3: Check minimum renderable count
  const activeSchema = await getActiveSchema(db, datasetId);
  if (activeSchema && data.length < activeSchema.minimumRenderableCount) {
    return {
      passed: false,
      reason: 'insufficient_records',
      details: `Record count ${data.length} below minimum ${activeSchema.minimumRenderableCount}`,
    };
  }

  // Assertion 4: Spot-check required fields on first record
  if (activeSchema && activeSchema.requiredFields.length > 0 && data.length > 0) {
    const firstRecord = data[0];
    for (const field of activeSchema.requiredFields) {
      if (!(field in firstRecord) || firstRecord[field] === undefined) {
        return {
          passed: false,
          reason: 'missing_required_field',
          details: `First record missing required field '${field}'`,
        };
      }
    }
  }

  return { passed: true };
}

/**
 * Create a schema assertion failed result with 422 status.
 */
function createSchemaAssertionFailedResult<T>(
  assertion: SchemaAssertionInfo,
  datasetId: string,
  version: number | null,
  schemaVersion: string | null,
  currentSchemaVersion: string | null
): ValidatedReadVersionedResult<T> {
  const renderability = buildRenderabilityContract(
    { passed: false, reason: assertion.details },
    schemaVersion,
    currentSchemaVersion
  );

  const response = createUnavailableResponse<T[]>(
    'SCHEMA_ASSERTION_FAILED',
    assertion.details || 'Schema assertion failed',
    'unavailable'
  );

  return {
    response,
    httpStatus: 422,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-BSI-Dataset': datasetId,
      'X-BSI-Lifecycle': 'unavailable',
      'X-BSI-Cache-Eligible': 'false',
      'X-BSI-Schema-Assertion': 'failed',
      'X-BSI-Schema-Error': assertion.reason || 'unknown',
      ...(version !== null && { 'X-BSI-Version': String(version) }),
    },
    source: 'none',
    meta: null,
    version,
    isLKG: false,
    lkgReason: null,
    schemaAssertion: assertion,
    renderability,
  };
}

/**
 * Read from versioned KV with validation and HTTP status reconstruction.
 * Uses the commit boundary system with current pointer and LKG fallback.
 *
 * Read flow:
 * 1. Read :current pointer from KV
 * 2. Read :v{version} data from KV
 * 3. On pointer miss, fallback to D1 dataset_current_version.last_committed_version
 * 4. Assert schema shape before response
 */
export async function validatedReadVersioned<T extends Record<string, unknown>>(
  kv: KVNamespace,
  r2: R2Bucket | null,
  db: D1Database,
  datasetId: string
): Promise<ValidatedReadVersionedResult<T>> {
  const rule = getRule(datasetId);

  // No rule defined
  if (!rule) {
    return {
      ...createErrorResult<T>(
        'NO_RULE',
        `No semantic rule defined for dataset: ${datasetId}`,
        datasetId
      ),
      version: null,
      isLKG: false,
      lkgReason: null,
    };
  }

  // Check readiness first
  const readiness = await checkReadiness(db, datasetId);

  if (!readiness.allowKVRead) {
    const blockedStatus = readiness.httpStatus as 202 | 503;
    return {
      ...createReadinessBlockedResult<T>(
        readiness.state,
        readiness.reason,
        blockedStatus,
        datasetId
      ),
      version: null,
      isLKG: false,
      lkgReason: null,
    };
  }

  // Read current pointer from KV
  const currentKey = buildCurrentKey(datasetId);
  const versionStr = await kv.get(currentKey);

  let version: number | null = null;
  let versionedKey: string;

  if (versionStr) {
    // Current pointer exists in KV
    version = parseInt(versionStr, 10);
    versionedKey = buildVersionedKey(datasetId, version);
  } else {
    // Fallback to D1 for last committed version
    const currentVersionInfo = await getCurrentVersion(db, datasetId);

    if (currentVersionInfo?.lastCommittedVersion) {
      version = currentVersionInfo.lastCommittedVersion;
      versionedKey = buildVersionedKey(datasetId, version);
    } else {
      // Try legacy key as final fallback
      const legacyResult = await validatedRead<T>(kv, r2, datasetId, datasetId, { db });
      return {
        ...legacyResult,
        version: null,
        isLKG: false,
        lkgReason: null,
      };
    }
  }

  // Read versioned data from KV
  const kvRaw = await kv.get(versionedKey);

  if (kvRaw !== null) {
    const parsed = parseKVValue<T>(kvRaw);

    if (parsed !== null && parsed.meta !== null && !parsed.isLegacy) {
      // Assert schema shape before response
      const schemaAssertion = await assertShapeBeforeResponse(
        parsed.data,
        parsed.meta,
        db,
        datasetId
      );

      // Schema assertion failed - return 422
      if (!schemaAssertion.passed) {
        const currentVersionInfo = await getCurrentVersion(db, datasetId);
        return createSchemaAssertionFailedResult<T>(
          schemaAssertion,
          datasetId,
          version,
          parsed.meta.schemaVersion ?? null,
          currentVersionInfo?.currentSchemaVersion ?? null
        );
      }

      const result = createResultFromVersionedData(parsed.data, parsed.meta, rule);

      // Check LKG status
      const lkgStatus = await isServingLKG(db, datasetId);

      // Build renderability contract
      const currentVersionInfo = await getCurrentVersion(db, datasetId);
      const renderability = buildRenderabilityContract(
        { passed: true },
        parsed.meta.schemaVersion ?? null,
        currentVersionInfo?.currentSchemaVersion ?? null
      );

      return {
        ...result,
        version,
        isLKG: lkgStatus.isLKG,
        lkgReason: lkgStatus.reason,
        schemaAssertion,
        renderability,
        headers: {
          ...result.headers,
          'X-BSI-Version': String(version),
          ...(lkgStatus.isLKG && { 'X-BSI-LKG': 'true' }),
          ...(parsed.meta.schemaVersion && { 'X-BSI-Schema-Version': parsed.meta.schemaVersion }),
        },
      };
    }
  }

  // Versioned key missing - try LKG fallback
  const lkg = await getLastCommittedVersion(db, datasetId);

  if (lkg) {
    const lkgKey = buildVersionedKey(datasetId, lkg.version);
    const lkgRaw = await kv.get(lkgKey);

    if (lkgRaw !== null) {
      const parsed = parseKVValue<T>(lkgRaw);

      if (parsed !== null && parsed.meta !== null && !parsed.isLegacy) {
        // Assert schema shape for LKG data
        const schemaAssertion = await assertShapeBeforeResponse(
          parsed.data,
          parsed.meta,
          db,
          datasetId
        );

        // LKG data also fails schema assertion - return 422
        if (!schemaAssertion.passed) {
          const currentVersionInfo = await getCurrentVersion(db, datasetId);
          return createSchemaAssertionFailedResult<T>(
            schemaAssertion,
            datasetId,
            lkg.version,
            parsed.meta.schemaVersion ?? null,
            currentVersionInfo?.currentSchemaVersion ?? null
          );
        }

        const result = createResultFromVersionedData(parsed.data, parsed.meta, rule);

        // Build renderability contract for LKG
        const currentVersionInfo = await getCurrentVersion(db, datasetId);
        const renderability = buildRenderabilityContract(
          { passed: true },
          parsed.meta.schemaVersion ?? null,
          currentVersionInfo?.currentSchemaVersion ?? null
        );

        return {
          ...result,
          version: lkg.version,
          isLKG: true,
          lkgReason: `Current version ${version} missing, fell back to LKG v${lkg.version}`,
          schemaAssertion,
          renderability,
          headers: {
            ...result.headers,
            'X-BSI-Version': String(lkg.version),
            'X-BSI-LKG': 'true',
            'X-BSI-LKG-Reason': 'version_missing',
            ...(parsed.meta.schemaVersion && { 'X-BSI-Schema-Version': parsed.meta.schemaVersion }),
          },
        };
      }
    }
  }

  // Try R2 fallback
  if (r2 !== null) {
    const r2Result = await tryR2FallbackVersioned<T>(r2, datasetId, rule);
    if (r2Result !== null) {
      return r2Result;
    }
  }

  // No data found
  return {
    ...createErrorResult<T>('NOT_FOUND', `No data found for dataset: ${datasetId}`, datasetId),
    version: null,
    isLKG: false,
    lkgReason: null,
  };
}

/** Create result from versioned KVSafeData format */
function createResultFromVersionedData<T>(
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

/** Try R2 fallback for versioned read */
async function tryR2FallbackVersioned<T extends Record<string, unknown>>(
  r2: R2Bucket,
  datasetId: string,
  rule: SemanticRule
): Promise<ValidatedReadVersionedResult<T> | null> {
  try {
    const snapshotKey = `snapshots/${datasetId}/latest.json`;
    const r2Object = await r2.get(snapshotKey);

    if (r2Object === null) {
      return null;
    }

    const r2Raw = await r2Object.text();
    const snapshot = JSON.parse(r2Raw) as {
      data: T[];
      version?: number;
      validation: { status: string; recordCount: number };
      snapshotAt: string;
    };

    if (!Array.isArray(snapshot.data)) {
      return null;
    }

    // Create synthetic metadata
    const syntheticMeta = createKVSafetyMetadata({
      httpStatusAtWrite: 503,
      lifecycleState: 'stale',
      recordCount: snapshot.data.length,
      validationStatus:
        (snapshot.validation?.status as 'valid' | 'invalid' | 'empty' | 'partial') ?? 'valid',
      datasetId,
      expectedMinCount: rule.minRecordCount,
    });

    const headers = buildCacheHeaders(syntheticMeta, rule);
    const response = createSuccessResponse(snapshot.data, 'stale', {
      hit: true,
      ttlSeconds: 0,
      eligible: false,
    });

    return {
      response,
      httpStatus: 503,
      headers: {
        ...headers,
        'X-BSI-Source': 'r2-snapshot',
        'X-BSI-Version': String(snapshot.version ?? 'unknown'),
      },
      source: 'r2',
      meta: syntheticMeta,
      version: snapshot.version ?? null,
      isLKG: true,
      lkgReason: 'Recovered from R2 snapshot',
    };
  } catch {
    return null;
  }
}
