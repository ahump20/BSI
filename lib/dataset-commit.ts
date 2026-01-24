/**
 * BSI Dataset Commit Boundaries
 * Implements dataset-level ingestion units with LKG (Last Known Good) guarantees.
 * Partial failures do not cascade - each dataset commits independently.
 *
 * KV versioning pattern:
 * - cfb:teams:v123 (versioned data)
 * - cfb:teams:current -> v123 (pointer, atomic swap)
 * - Workers read only :current
 */

import { validateDataset, getRule, type ValidationResult, type SemanticRule } from './semantic-validation';
import { createKVSafetyMetadata, wrapWithSafetyMetadata, type KVSafeData, type KVSafetyMetadata } from './kv-safety';
import { mapToHTTPStatus, determineLifecycleState } from './http-correctness';
import { transitionReadiness, markLiveIngestion, type ReadinessState } from './readiness';
import type { LifecycleState } from './api-contract';

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
  meta?: { changes: number; last_row_id: number };
}

/** KVNamespace interface */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/** R2Bucket interface */
interface R2Bucket {
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType: string }; customMetadata?: Record<string, string> }
  ): Promise<void>;
}

/** Commit record from D1 */
export interface DatasetCommit {
  datasetId: string;
  lastCommittedVersion: number;
  lastCommittedAt: string;
  recordCount: number;
  lastAttemptAt: string;
  lastAttemptStatus: 'success' | 'failed' | 'partial';
  lastAttemptError: string | null;
  isServingLKG: boolean;
  consecutiveFailures: number;
}

/** D1 row format (snake_case) */
interface D1CommitRow {
  dataset_id: string;
  last_committed_version: number;
  last_committed_at: string;
  record_count: number;
  last_attempt_at: string;
  last_attempt_status: 'success' | 'failed' | 'partial';
  last_attempt_error: string | null;
  is_serving_lkg: number;
  consecutive_failures: number;
}

/** Ingestion phase result */
export interface IngestionPhaseResult<T> {
  phase: 'fetch' | 'parse' | 'validate' | 'commit';
  success: boolean;
  data: T[] | null;
  validation: ValidationResult | null;
  error: string | null;
}

/** Commit result returned to callers */
export interface CommitResult {
  success: boolean;
  committed: boolean;
  version: number;
  recordCount: number;
  httpStatus: number;
  lifecycle: LifecycleState;
  isServingLKG: boolean;
  reason: string;
}

/** Options for dataset commit */
export interface CommitOptions {
  datasetId: string;
  cacheKeyPrefix: string;
  db: D1Database;
  kv: KVNamespace;
  r2: R2Bucket;
  cacheTtl?: number;
}

/** Versioned KV key structure */
interface VersionedKey {
  versionedKey: string;
  currentPointer: string;
  version: number;
}

/**
 * Generate versioned KV keys.
 * Pattern: {prefix}:v{version} for data, {prefix}:current for pointer
 */
function makeVersionedKeys(prefix: string, version: number): VersionedKey {
  return {
    versionedKey: `${prefix}:v${version}`,
    currentPointer: `${prefix}:current`,
    version,
  };
}

/**
 * Parse the :current pointer to get the active version number.
 * Returns 0 if no pointer exists (first ingestion).
 */
async function getCurrentVersion(kv: KVNamespace, prefix: string): Promise<number> {
  const pointer = await kv.get(`${prefix}:current`);

  if (!pointer) {
    return 0;
  }

  // Pointer format: "v{number}"
  const match = pointer.match(/^v(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get the latest commit record for a dataset.
 */
export async function getCommitRecord(db: D1Database, datasetId: string): Promise<DatasetCommit | null> {
  const row = await db
    .prepare('SELECT * FROM dataset_commits WHERE dataset_id = ?')
    .bind(datasetId)
    .first<D1CommitRow>();

  if (!row) {
    return null;
  }

  return {
    datasetId: row.dataset_id,
    lastCommittedVersion: row.last_committed_version,
    lastCommittedAt: row.last_committed_at,
    recordCount: row.record_count,
    lastAttemptAt: row.last_attempt_at,
    lastAttemptStatus: row.last_attempt_status,
    lastAttemptError: row.last_attempt_error,
    isServingLKG: row.is_serving_lkg === 1,
    consecutiveFailures: row.consecutive_failures,
  };
}

/**
 * Get all commit records for admin visibility.
 */
export async function getAllCommitRecords(db: D1Database): Promise<DatasetCommit[]> {
  const result = await db.prepare('SELECT * FROM dataset_commits ORDER BY dataset_id').all<D1CommitRow>();

  return result.results.map((row) => ({
    datasetId: row.dataset_id,
    lastCommittedVersion: row.last_committed_version,
    lastCommittedAt: row.last_committed_at,
    recordCount: row.record_count,
    lastAttemptAt: row.last_attempt_at,
    lastAttemptStatus: row.last_attempt_status,
    lastAttemptError: row.last_attempt_error,
    isServingLKG: row.is_serving_lkg === 1,
    consecutiveFailures: row.consecutive_failures,
  }));
}

/**
 * Record a failed ingestion attempt without invalidating LKG.
 * This is the key to the LKG guarantee - failures don't touch KV.
 */
async function recordFailedAttempt(
  db: D1Database,
  datasetId: string,
  error: string,
  existingCommit: DatasetCommit | null
): Promise<void> {
  const now = new Date().toISOString();
  const consecutiveFailures = (existingCommit?.consecutiveFailures ?? 0) + 1;

  await db
    .prepare(
      `INSERT INTO dataset_commits (
        dataset_id, last_committed_version, last_committed_at, record_count,
        last_attempt_at, last_attempt_status, last_attempt_error,
        is_serving_lkg, consecutive_failures, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'failed', ?, 1, ?, ?)
      ON CONFLICT(dataset_id) DO UPDATE SET
        last_attempt_at = excluded.last_attempt_at,
        last_attempt_status = 'failed',
        last_attempt_error = excluded.last_attempt_error,
        is_serving_lkg = CASE WHEN last_committed_version > 0 THEN 1 ELSE 0 END,
        consecutive_failures = consecutive_failures + 1,
        updated_at = excluded.updated_at`
    )
    .bind(
      datasetId,
      existingCommit?.lastCommittedVersion ?? 0,
      existingCommit?.lastCommittedAt ?? now,
      existingCommit?.recordCount ?? 0,
      now,
      error,
      consecutiveFailures,
      now
    )
    .run();
}

/**
 * Record a successful commit with version promotion.
 */
async function recordSuccessfulCommit(
  db: D1Database,
  datasetId: string,
  version: number,
  recordCount: number
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO dataset_commits (
        dataset_id, last_committed_version, last_committed_at, record_count,
        last_attempt_at, last_attempt_status, last_attempt_error,
        is_serving_lkg, consecutive_failures, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'success', NULL, 0, 0, ?)
      ON CONFLICT(dataset_id) DO UPDATE SET
        last_committed_version = excluded.last_committed_version,
        last_committed_at = excluded.last_committed_at,
        record_count = excluded.record_count,
        last_attempt_at = excluded.last_attempt_at,
        last_attempt_status = 'success',
        last_attempt_error = NULL,
        is_serving_lkg = 0,
        consecutive_failures = 0,
        updated_at = excluded.updated_at`
    )
    .bind(datasetId, version, now, recordCount, now, now)
    .run();
}

/**
 * Create R2 snapshot for cold-start recovery.
 */
async function createSnapshot<T>(
  r2: R2Bucket,
  datasetId: string,
  version: number,
  data: T[],
  validation: ValidationResult
): Promise<void> {
  const snapshot = {
    version,
    data,
    validation: {
      status: validation.status,
      recordCount: validation.recordCount,
      rule: datasetId,
    },
    snapshotAt: new Date().toISOString(),
  };

  const snapshotKey = `snapshots/${datasetId}/v${version}.json`;
  const latestKey = `snapshots/${datasetId}/latest.json`;

  // Write versioned snapshot
  await r2.put(snapshotKey, JSON.stringify(snapshot), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      datasetId,
      version: String(version),
      recordCount: String(data.length),
      validationStatus: validation.status,
    },
  });

  // Update latest pointer
  await r2.put(latestKey, JSON.stringify(snapshot), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      datasetId,
      version: String(version),
      recordCount: String(data.length),
      validationStatus: validation.status,
    },
  });
}

/**
 * Commit validated data to KV with versioned keys and atomic pointer swap.
 * This is the core commit operation that guarantees LKG preservation.
 *
 * Flow:
 * 1. Get current version (or 0 if first ingestion)
 * 2. Write data to versioned key (cfb:teams:v124)
 * 3. Write commit record to D1 (source of truth for version)
 * 4. Atomic pointer swap (cfb:teams:current -> v124)
 * 5. Optionally cleanup old versions
 *
 * On failure at any step, the previous version remains active.
 */
export async function commitDataset<T extends Record<string, unknown>>(
  data: T[],
  validation: ValidationResult,
  options: CommitOptions
): Promise<CommitResult> {
  const { datasetId, cacheKeyPrefix, db, kv, r2, cacheTtl = 3600 } = options;
  const rule = getRule(datasetId);

  if (!rule) {
    return {
      success: false,
      committed: false,
      version: 0,
      recordCount: 0,
      httpStatus: 503,
      lifecycle: 'unavailable',
      isServingLKG: false,
      reason: `No semantic rule for dataset: ${datasetId}`,
    };
  }

  // Get existing commit record for LKG fallback
  const existingCommit = await getCommitRecord(db, datasetId);
  const currentVersion = existingCommit?.lastCommittedVersion ?? 0;
  const isFirstIngestion = currentVersion === 0;

  // Determine lifecycle and HTTP status
  const lifecycle = determineLifecycleState(validation, data.length > 0, isFirstIngestion);
  const httpResult = mapToHTTPStatus({
    validationResult: validation,
    lifecycleState: lifecycle,
    recordCount: data.length,
    rule,
  });

  // If validation failed, record failure but DON'T invalidate KV
  if (validation.status === 'invalid' || (validation.status === 'partial' && data.length === 0)) {
    const errorMsg = validation.errors.join('; ') || 'Validation failed';
    await recordFailedAttempt(db, datasetId, errorMsg, existingCommit);
    await transitionReadiness(db, datasetId, 'degraded', errorMsg);

    return {
      success: false,
      committed: false,
      version: currentVersion,
      recordCount: existingCommit?.recordCount ?? 0,
      httpStatus: httpResult.httpStatus,
      lifecycle,
      isServingLKG: currentVersion > 0,
      reason: `Validation failed, serving LKG v${currentVersion}: ${errorMsg}`,
    };
  }

  // Validation passed - proceed with commit
  const newVersion = currentVersion + 1;
  const keys = makeVersionedKeys(cacheKeyPrefix, newVersion);

  // Create safety metadata
  const meta = createKVSafetyMetadata({
    httpStatusAtWrite: httpResult.httpStatus,
    lifecycleState: lifecycle,
    recordCount: data.length,
    validationStatus: validation.status,
    datasetId,
    expectedMinCount: rule.minRecordCount,
  });

  // Wrap data with metadata
  const safeData: KVSafeData<T> = wrapWithSafetyMetadata(data, meta);

  try {
    // Step 1: Write versioned data to KV
    await kv.put(keys.versionedKey, JSON.stringify(safeData), {
      expirationTtl: cacheTtl * 24, // Keep versioned data longer for rollback
    });

    // Step 2: Record commit in D1 (source of truth)
    await recordSuccessfulCommit(db, datasetId, newVersion, data.length);

    // Step 3: Atomic pointer swap (this is what makes data live)
    await kv.put(keys.currentPointer, `v${newVersion}`);

    // Step 4: Update readiness state
    if (httpResult.httpStatus === 200) {
      await markLiveIngestion(db, datasetId, `Committed v${newVersion} with ${data.length} records`);
    }

    // Step 5: Create R2 snapshot for cold-start recovery
    await createSnapshot(r2, datasetId, newVersion, data, validation);

    // Step 6: Cleanup old versions (keep last 3)
    if (currentVersion > 2) {
      const oldVersion = currentVersion - 2;
      const oldKey = `${cacheKeyPrefix}:v${oldVersion}`;
      await kv.delete(oldKey).catch(() => {
        // Ignore cleanup failures
      });
    }

    return {
      success: true,
      committed: true,
      version: newVersion,
      recordCount: data.length,
      httpStatus: httpResult.httpStatus,
      lifecycle,
      isServingLKG: false,
      reason: `Committed v${newVersion} with ${data.length} records`,
    };
  } catch (err) {
    // Commit failed - record failure, LKG preserved
    const errorMsg = err instanceof Error ? err.message : 'Commit failed';
    await recordFailedAttempt(db, datasetId, errorMsg, existingCommit);
    await transitionReadiness(db, datasetId, 'degraded', errorMsg);

    return {
      success: false,
      committed: false,
      version: currentVersion,
      recordCount: existingCommit?.recordCount ?? 0,
      httpStatus: 503,
      lifecycle: 'unavailable',
      isServingLKG: currentVersion > 0,
      reason: `Commit failed, serving LKG v${currentVersion}: ${errorMsg}`,
    };
  }
}

/**
 * Read from the :current versioned key.
 * This is what workers should use to read data.
 */
export async function readCurrentVersion<T>(
  kv: KVNamespace,
  cacheKeyPrefix: string
): Promise<{ data: T[]; meta: KVSafetyMetadata; version: number } | null> {
  const pointer = await kv.get(`${cacheKeyPrefix}:current`);

  if (!pointer) {
    return null;
  }

  const versionedKey = `${cacheKeyPrefix}:${pointer}`;
  const raw = await kv.get(versionedKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as KVSafeData<T>;
    const version = parseInt(pointer.replace('v', ''), 10);

    return {
      data: parsed.data,
      meta: parsed.meta,
      version,
    };
  } catch {
    return null;
  }
}

/**
 * Get dataset health status for admin visibility.
 */
export interface DatasetHealth {
  datasetId: string;
  lastAttemptAt: string | null;
  lastCommittedAt: string | null;
  commitVersion: number;
  recordCount: number;
  isServingLKG: boolean;
  consecutiveFailures: number;
  lastError: string | null;
  readinessState: ReadinessState;
}

/**
 * Get comprehensive health status for a dataset.
 */
export async function getDatasetHealth(db: D1Database, datasetId: string): Promise<DatasetHealth> {
  const commit = await getCommitRecord(db, datasetId);

  // Get readiness state
  const readinessRow = await db
    .prepare('SELECT readiness_state FROM system_readiness WHERE scope = ?')
    .bind(datasetId)
    .first<{ readiness_state: ReadinessState }>();

  return {
    datasetId,
    lastAttemptAt: commit?.lastAttemptAt ?? null,
    lastCommittedAt: commit?.lastCommittedAt ?? null,
    commitVersion: commit?.lastCommittedVersion ?? 0,
    recordCount: commit?.recordCount ?? 0,
    isServingLKG: commit?.isServingLKG ?? false,
    consecutiveFailures: commit?.consecutiveFailures ?? 0,
    lastError: commit?.lastAttemptError ?? null,
    readinessState: readinessRow?.readiness_state ?? 'initializing',
  };
}

/**
 * Orchestrate a full ingestion cycle with commit boundaries.
 * Handles: fetch → parse → validate → commit
 *
 * Each phase can fail independently without affecting LKG data.
 */
export async function orchestrateIngestion<T extends Record<string, unknown>>(
  fetcher: () => Promise<{ data: T[] | null; error: string | null }>,
  options: CommitOptions
): Promise<CommitResult> {
  const { datasetId, db } = options;
  const rule = getRule(datasetId);

  if (!rule) {
    return {
      success: false,
      committed: false,
      version: 0,
      recordCount: 0,
      httpStatus: 503,
      lifecycle: 'unavailable',
      isServingLKG: false,
      reason: `No semantic rule for dataset: ${datasetId}`,
    };
  }

  // Get existing commit for LKG context
  const existingCommit = await getCommitRecord(db, datasetId);

  // Phase 1: Fetch
  const fetchResult = await fetcher();

  if (fetchResult.error || fetchResult.data === null) {
    const errorMsg = fetchResult.error ?? 'Fetch returned null data';
    await recordFailedAttempt(db, datasetId, `Fetch failed: ${errorMsg}`, existingCommit);
    await transitionReadiness(db, datasetId, 'degraded', `Fetch failed: ${errorMsg}`);

    return {
      success: false,
      committed: false,
      version: existingCommit?.lastCommittedVersion ?? 0,
      recordCount: existingCommit?.recordCount ?? 0,
      httpStatus: 503,
      lifecycle: 'unavailable',
      isServingLKG: (existingCommit?.lastCommittedVersion ?? 0) > 0,
      reason: `Fetch failed, serving LKG: ${errorMsg}`,
    };
  }

  // Phase 2: Validate
  const validation = validateDataset(datasetId, fetchResult.data);

  // Phase 3: Commit (handles validation failures internally)
  return commitDataset(fetchResult.data, validation, options);
}
