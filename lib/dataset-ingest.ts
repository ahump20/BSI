/**
 * BSI Dataset Ingestion Pipeline
 * Commit-boundary ingestion with versioned KV and atomic promotion.
 */

import type { DatasetStatus, ValidationResult } from './semantic-validation';
import { validateDataset, getRule } from './semantic-validation';
import { createKVSafetyMetadata, type KVSafeData } from './kv-safety';
import { mapToHTTPStatus, determineLifecycleState } from './http-correctness';
import { transitionReadiness, markLiveIngestion } from './readiness';
import {
  buildVersionedKey,
  buildCurrentKey,
  parseSportFromDatasetId,
  getNextVersion,
  getCurrentVersion,
  getLastCommittedVersion,
  createPendingCommit,
  promoteCommit,
  rollbackCommit,
  markServingLKG,
  clearLKGStatus,
  type DatasetCurrentVersion,
} from './dataset-commit';

/** KVNamespace interface (Cloudflare Workers) */
interface KVNamespace {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
}

/** R2Bucket interface (Cloudflare Workers) */
interface R2Bucket {
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType: string }; customMetadata?: Record<string, string> }
  ): Promise<void>;
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

/** Context for dataset ingestion */
export interface IngestContext {
  datasetId: string;
  kv: KVNamespace;
  db: D1Database;
  r2?: R2Bucket;
  source?: string;
}

/** Result of dataset ingestion */
export interface IngestResult {
  success: boolean;
  version: number;
  committed: boolean;
  isLKG: boolean;
  httpStatus: number;
  recordCount: number;
  validationStatus: DatasetStatus;
  error?: string;
}

/** Cache TTL based on commit status */
const CACHE_TTL = {
  COMMITTED: 3600, // 1 hour for committed data
  PENDING: 300, // 5 minutes for pending data
} as const;

/** R2 snapshot format */
interface R2Snapshot<T> {
  data: T[];
  version: number;
  validation: {
    status: DatasetStatus;
    recordCount: number;
    rule: string;
  };
  snapshotAt: string;
}

/**
 * Ingest dataset with commit boundary.
 * Writes to versioned KV key, validates, then promotes if valid.
 * Falls back to LKG if validation fails.
 */
export async function ingestDataset<T extends Record<string, unknown>>(
  ctx: IngestContext,
  data: T[]
): Promise<IngestResult> {
  const rule = getRule(ctx.datasetId);

  if (!rule) {
    return {
      success: false,
      version: 0,
      committed: false,
      isLKG: false,
      httpStatus: 503,
      recordCount: data.length,
      validationStatus: 'invalid',
      error: `No semantic rule for dataset: ${ctx.datasetId}`,
    };
  }

  // Get next version
  const version = await getNextVersion(ctx.db, ctx.datasetId);
  const sport = parseSportFromDatasetId(ctx.datasetId);
  const versionedKey = buildVersionedKey(ctx.datasetId, version);
  const currentKey = buildCurrentKey(ctx.datasetId);

  // Get previous record count for comparison
  const currentVersionInfo = await getCurrentVersion(ctx.db, ctx.datasetId);
  const previousRecordCount = currentVersionInfo?.currentVersion
    ? await getPreviousRecordCount(ctx.db, ctx.datasetId, currentVersionInfo.currentVersion)
    : null;

  // Validate the data
  const validation = validateDataset(ctx.datasetId, data);
  const lifecycle = determineLifecycleState(validation, data.length > 0, !currentVersionInfo);

  // Map to HTTP status
  const httpResult = mapToHTTPStatus({
    validationResult: validation,
    lifecycleState: lifecycle,
    recordCount: data.length,
    rule,
  });

  // Create safety metadata with version info
  const meta = createKVSafetyMetadata({
    httpStatusAtWrite: httpResult.httpStatus,
    lifecycleState: lifecycle,
    recordCount: data.length,
    validationStatus: validation.status,
    datasetId: ctx.datasetId,
    expectedMinCount: rule.minRecordCount,
  });

  // Extend metadata with version info
  const extendedMeta = {
    ...meta,
    version,
    isLKG: false,
    lkgReason: null as string | null,
  };

  // Wrap data with metadata
  const safeData: KVSafeData<T> = {
    data,
    meta: extendedMeta,
  };

  // Write to versioned KV key (NOT current yet)
  await ctx.kv.put(versionedKey, JSON.stringify(safeData), {
    expirationTtl: CACHE_TTL.PENDING,
  });

  // Create pending commit record
  await createPendingCommit(ctx.db, {
    datasetId: ctx.datasetId,
    sport,
    version,
    recordCount: data.length,
    previousRecordCount,
    validationStatus: validation.status,
    validationErrors: validation.errors.length > 0 ? validation.errors : null,
    kvVersionedKey: versionedKey,
    source: ctx.source,
  });

  // Decision: promote or fallback to LKG
  if (validation.status === 'valid') {
    return await handleSuccessfulIngestion(
      ctx,
      version,
      versionedKey,
      currentKey,
      safeData,
      httpResult
    );
  }

  // Validation failed - check for LKG
  return await handleFailedIngestion(ctx, version, validation, httpResult);
}

/**
 * Handle successful ingestion: promote to current.
 */
async function handleSuccessfulIngestion<T>(
  ctx: IngestContext,
  version: number,
  versionedKey: string,
  currentKey: string,
  safeData: KVSafeData<T>,
  httpResult: { httpStatus: 200 | 202 | 204 | 503; cacheEligible: boolean; reason: string }
): Promise<IngestResult> {
  // Promote commit in D1
  await promoteCommit(ctx.db, ctx.datasetId, version);

  // Write current pointer (atomic swap)
  await ctx.kv.put(currentKey, String(version));

  // Update versioned key TTL to committed duration
  await ctx.kv.put(versionedKey, JSON.stringify(safeData), {
    expirationTtl: CACHE_TTL.COMMITTED,
  });

  // Update readiness state
  await markLiveIngestion(
    ctx.db,
    ctx.datasetId,
    `Committed version ${version} with ${safeData.data.length} records`
  );

  // Create R2 snapshot for cold-start recovery
  if (ctx.r2) {
    await createSnapshot(ctx.r2, ctx.datasetId, safeData.data, version, 'valid');
  }

  return {
    success: true,
    version,
    committed: true,
    isLKG: false,
    httpStatus: httpResult.httpStatus,
    recordCount: safeData.data.length,
    validationStatus: 'valid',
  };
}

/**
 * Handle failed ingestion: fallback to LKG or mark unavailable.
 */
async function handleFailedIngestion(
  ctx: IngestContext,
  version: number,
  validation: ValidationResult,
  httpResult: { httpStatus: 200 | 202 | 204 | 503; cacheEligible: boolean; reason: string }
): Promise<IngestResult> {
  const errorReason = validation.errors.join('; ') || 'Validation failed';

  // Rollback this commit
  await rollbackCommit(ctx.db, ctx.datasetId, version, errorReason);

  // Check for LKG
  const lkg = await getLastCommittedVersion(ctx.db, ctx.datasetId);

  if (lkg) {
    // LKG exists - mark as serving LKG
    await markServingLKG(ctx.db, ctx.datasetId, lkg.version, errorReason);

    // Transition to degraded state
    await transitionReadiness(
      ctx.db,
      ctx.datasetId,
      'degraded',
      `Serving LKG v${lkg.version}: ${errorReason}`
    );

    return {
      success: false,
      version,
      committed: false,
      isLKG: true,
      httpStatus: 503,
      recordCount: validation.recordCount,
      validationStatus: validation.status,
      error: `Validation failed, serving LKG v${lkg.version}: ${errorReason}`,
    };
  }

  // No LKG - mark unavailable
  await transitionReadiness(
    ctx.db,
    ctx.datasetId,
    'unavailable',
    `No LKG available: ${errorReason}`
  );

  return {
    success: false,
    version,
    committed: false,
    isLKG: false,
    httpStatus: 503,
    recordCount: validation.recordCount,
    validationStatus: validation.status,
    error: `Validation failed, no LKG: ${errorReason}`,
  };
}

/**
 * Manually promote a specific version to current.
 * Used for recovery scenarios.
 */
export async function promoteVersion(
  ctx: IngestContext,
  version: number
): Promise<{ success: boolean; error?: string }> {
  const versionedKey = buildVersionedKey(ctx.datasetId, version);
  const currentKey = buildCurrentKey(ctx.datasetId);

  // Verify version exists in KV
  const data = await ctx.kv.get(versionedKey);

  if (!data) {
    return { success: false, error: `Version ${version} not found in KV` };
  }

  // Promote commit in D1
  await promoteCommit(ctx.db, ctx.datasetId, version);

  // Write current pointer
  await ctx.kv.put(currentKey, String(version));

  // Clear LKG status
  await clearLKGStatus(ctx.db, ctx.datasetId);

  // Update readiness
  await markLiveIngestion(ctx.db, ctx.datasetId, `Manually promoted to version ${version}`);

  return { success: true };
}

/**
 * Mark ingestion as failed without creating a pending commit.
 * Used when fetch fails before validation.
 */
export async function markIngestionFailed(ctx: IngestContext, reason: string): Promise<void> {
  const lkg = await getLastCommittedVersion(ctx.db, ctx.datasetId);

  if (lkg) {
    await markServingLKG(ctx.db, ctx.datasetId, lkg.version, reason);
    await transitionReadiness(
      ctx.db,
      ctx.datasetId,
      'degraded',
      `Fetch failed, serving LKG v${lkg.version}: ${reason}`
    );
  } else {
    await transitionReadiness(
      ctx.db,
      ctx.datasetId,
      'unavailable',
      `Fetch failed, no LKG: ${reason}`
    );
  }
}

/**
 * Read data from current version.
 * Falls back to LKG version if current fails.
 */
export async function readCurrentVersion<T>(ctx: IngestContext): Promise<{
  data: T[] | null;
  version: number | null;
  isLKG: boolean;
  meta: DatasetCurrentVersion | null;
}> {
  const currentKey = buildCurrentKey(ctx.datasetId);

  // Read current pointer
  const versionStr = await ctx.kv.get(currentKey);

  if (!versionStr) {
    // No current pointer - check D1 for LKG
    const currentVersion = await getCurrentVersion(ctx.db, ctx.datasetId);

    if (currentVersion?.lastCommittedVersion) {
      const lkgKey = buildVersionedKey(ctx.datasetId, currentVersion.lastCommittedVersion);
      const lkgData = await ctx.kv.get(lkgKey);

      if (lkgData) {
        const parsed = JSON.parse(lkgData) as KVSafeData<T>;
        return {
          data: parsed.data,
          version: currentVersion.lastCommittedVersion,
          isLKG: true,
          meta: currentVersion,
        };
      }
    }

    return { data: null, version: null, isLKG: false, meta: null };
  }

  const version = parseInt(versionStr, 10);
  const versionedKey = buildVersionedKey(ctx.datasetId, version);
  const data = await ctx.kv.get(versionedKey);

  if (!data) {
    // Version missing from KV - try D1 fallback
    const currentVersion = await getCurrentVersion(ctx.db, ctx.datasetId);
    return { data: null, version, isLKG: false, meta: currentVersion };
  }

  const parsed = JSON.parse(data) as KVSafeData<T>;
  const currentVersion = await getCurrentVersion(ctx.db, ctx.datasetId);

  return {
    data: parsed.data,
    version,
    isLKG: currentVersion?.isServingLKG ?? false,
    meta: currentVersion,
  };
}

/**
 * Get previous record count for delta tracking.
 */
async function getPreviousRecordCount(
  db: D1Database,
  datasetId: string,
  version: number
): Promise<number | null> {
  const row = await db
    .prepare(
      `SELECT record_count FROM dataset_commits
       WHERE dataset_id = ? AND version = ?`
    )
    .bind(datasetId, version)
    .first<{ record_count: number }>();

  return row?.record_count ?? null;
}

/**
 * Create R2 snapshot for cold-start recovery.
 */
async function createSnapshot<T>(
  r2: R2Bucket,
  datasetId: string,
  data: T[],
  version: number,
  validationStatus: DatasetStatus
): Promise<void> {
  const snapshot: R2Snapshot<T> = {
    data,
    version,
    validation: {
      status: validationStatus,
      recordCount: data.length,
      rule: datasetId,
    },
    snapshotAt: new Date().toISOString(),
  };

  const snapshotKey = `snapshots/${datasetId}/latest.json`;

  await r2.put(snapshotKey, JSON.stringify(snapshot), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      datasetId,
      version: String(version),
      recordCount: String(data.length),
      validationStatus,
    },
  });
}
