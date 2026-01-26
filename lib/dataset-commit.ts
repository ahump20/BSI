/**
 * BSI Dataset Commit Boundary System
 * Types and helpers for versioned KV keys and atomic promotion.
 */

import type { DatasetStatus } from './semantic-validation';

/** Commit status for dataset versions */
export type CommitStatus = 'pending' | 'committed' | 'rolled_back' | 'superseded';

/** D1 row structure for dataset_commits table */
export interface DatasetCommit {
  datasetId: string;
  sport: string;
  version: number;
  status: CommitStatus;
  recordCount: number;
  previousRecordCount: number | null;
  validationStatus: DatasetStatus;
  validationErrors: string[] | null;
  ingestedAt: string;
  committedAt: string | null;
  kvVersionedKey: string;
  source: string;
  /** Schema version at time of commit (semver) */
  schemaVersion: string | null;
  /** Schema hash for quick mismatch detection */
  schemaHash: string | null;
}

/** D1 row structure for dataset_current_version table */
export interface DatasetCurrentVersion {
  datasetId: string;
  currentVersion: number;
  lastCommittedVersion: number | null;
  lastCommittedAt: string | null;
  isServingLKG: boolean;
  lkgReason: string | null;
  /** Current active schema version */
  currentSchemaVersion: string | null;
  /** Schema hash of last committed data */
  lastCommittedSchemaHash: string | null;
}

/** D1 row from query (snake_case) */
interface D1CommitRow {
  id: number;
  dataset_id: string;
  sport: string;
  version: number;
  status: CommitStatus;
  record_count: number;
  previous_record_count: number | null;
  validation_status: DatasetStatus;
  validation_errors: string | null;
  ingested_at: string;
  committed_at: string | null;
  kv_versioned_key: string;
  source: string;
  schema_version: string | null;
  schema_hash: string | null;
}

/** D1 row from query (snake_case) */
interface D1CurrentVersionRow {
  dataset_id: string;
  current_version: number;
  last_committed_version: number | null;
  last_committed_at: string | null;
  is_serving_lkg: number;
  lkg_reason: string | null;
  current_schema_version: string | null;
  last_committed_schema_hash: string | null;
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

/**
 * Build versioned KV key for a dataset version.
 * Format: {datasetId}:v{version}
 */
export function buildVersionedKey(datasetId: string, version: number): string {
  return `${datasetId}:v${version}`;
}

/**
 * Build current pointer KV key for a dataset.
 * Format: {datasetId}:current
 */
export function buildCurrentKey(datasetId: string): string {
  return `${datasetId}:current`;
}

/**
 * Parse sport from datasetId.
 * Assumes format: {sport}-{type} (e.g., cfb-rankings-ap -> cfb)
 */
export function parseSportFromDatasetId(datasetId: string): string {
  const parts = datasetId.split('-');
  return parts[0] || 'unknown';
}

/**
 * Get the next version number for a dataset.
 * Returns 1 if no versions exist.
 */
export async function getNextVersion(db: D1Database, datasetId: string): Promise<number> {
  const row = await db
    .prepare('SELECT MAX(version) as max_version FROM dataset_commits WHERE dataset_id = ?')
    .bind(datasetId)
    .first<{ max_version: number | null }>();

  return (row?.max_version ?? 0) + 1;
}

/**
 * Get current version info for a dataset.
 * Returns null if no version tracking exists.
 */
export async function getCurrentVersion(
  db: D1Database,
  datasetId: string
): Promise<DatasetCurrentVersion | null> {
  const row = await db
    .prepare('SELECT * FROM dataset_current_version WHERE dataset_id = ?')
    .bind(datasetId)
    .first<D1CurrentVersionRow>();

  if (!row) {
    return null;
  }

  return {
    datasetId: row.dataset_id,
    currentVersion: row.current_version,
    lastCommittedVersion: row.last_committed_version,
    lastCommittedAt: row.last_committed_at,
    isServingLKG: row.is_serving_lkg === 1,
    lkgReason: row.lkg_reason,
    currentSchemaVersion: row.current_schema_version,
    lastCommittedSchemaHash: row.last_committed_schema_hash,
  };
}

/**
 * Get a specific commit record.
 */
export async function getCommit(
  db: D1Database,
  datasetId: string,
  version: number
): Promise<DatasetCommit | null> {
  const row = await db
    .prepare('SELECT * FROM dataset_commits WHERE dataset_id = ? AND version = ?')
    .bind(datasetId, version)
    .first<D1CommitRow>();

  if (!row) {
    return null;
  }

  return mapCommitRow(row);
}

/**
 * Get recent commits for a dataset.
 */
export async function getRecentCommits(
  db: D1Database,
  datasetId: string,
  limit: number = 10
): Promise<DatasetCommit[]> {
  const result = await db
    .prepare('SELECT * FROM dataset_commits WHERE dataset_id = ? ORDER BY version DESC LIMIT ?')
    .bind(datasetId, limit)
    .all<D1CommitRow>();

  return result.results.map(mapCommitRow);
}

/**
 * Get the last committed version for a dataset (LKG).
 * Returns null if no committed version exists.
 */
export async function getLastCommittedVersion(
  db: D1Database,
  datasetId: string
): Promise<DatasetCommit | null> {
  const row = await db
    .prepare(
      `SELECT * FROM dataset_commits
       WHERE dataset_id = ? AND status = 'committed'
       ORDER BY version DESC LIMIT 1`
    )
    .bind(datasetId)
    .first<D1CommitRow>();

  if (!row) {
    return null;
  }

  return mapCommitRow(row);
}

/**
 * Create a pending commit record.
 * Does NOT promote to current - call promoteCommit separately.
 */
export async function createPendingCommit(
  db: D1Database,
  params: {
    datasetId: string;
    sport: string;
    version: number;
    recordCount: number;
    previousRecordCount: number | null;
    validationStatus: DatasetStatus;
    validationErrors: string[] | null;
    kvVersionedKey: string;
    source?: string;
    /** Schema version (semver) at time of commit */
    schemaVersion?: string;
    /** Schema hash for quick validation */
    schemaHash?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const errorsJson = params.validationErrors ? JSON.stringify(params.validationErrors) : null;

  await db
    .prepare(
      `INSERT INTO dataset_commits
       (dataset_id, sport, version, status, record_count, previous_record_count,
        validation_status, validation_errors, ingested_at, kv_versioned_key, source,
        schema_version, schema_hash)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      params.datasetId,
      params.sport,
      params.version,
      params.recordCount,
      params.previousRecordCount,
      params.validationStatus,
      errorsJson,
      now,
      params.kvVersionedKey,
      params.source ?? 'highlightly',
      params.schemaVersion ?? null,
      params.schemaHash ?? null
    )
    .run();
}

/**
 * Promote a pending commit to current.
 * Updates commit status and dataset_current_version atomically.
 */
export async function promoteCommit(
  db: D1Database,
  datasetId: string,
  version: number,
  schemaInfo?: { schemaVersion: string; schemaHash: string }
): Promise<boolean> {
  const now = new Date().toISOString();

  // Mark previous committed version as superseded
  await db
    .prepare(
      `UPDATE dataset_commits
       SET status = 'superseded'
       WHERE dataset_id = ? AND status = 'committed'`
    )
    .bind(datasetId)
    .run();

  // Promote this version to committed
  await db
    .prepare(
      `UPDATE dataset_commits
       SET status = 'committed', committed_at = ?
       WHERE dataset_id = ? AND version = ?`
    )
    .bind(now, datasetId, version)
    .run();

  // Update current version pointer with schema info
  await db
    .prepare(
      `INSERT INTO dataset_current_version
       (dataset_id, current_version, last_committed_version, last_committed_at,
        is_serving_lkg, lkg_reason, current_schema_version, last_committed_schema_hash)
       VALUES (?, ?, ?, ?, 0, NULL, ?, ?)
       ON CONFLICT(dataset_id) DO UPDATE SET
         current_version = excluded.current_version,
         last_committed_version = excluded.last_committed_version,
         last_committed_at = excluded.last_committed_at,
         is_serving_lkg = 0,
         lkg_reason = NULL,
         current_schema_version = excluded.current_schema_version,
         last_committed_schema_hash = excluded.last_committed_schema_hash`
    )
    .bind(
      datasetId,
      version,
      version,
      now,
      schemaInfo?.schemaVersion ?? null,
      schemaInfo?.schemaHash ?? null
    )
    .run();

  return true;
}

/**
 * Mark a commit as rolled back (failed validation, no promotion).
 */
export async function rollbackCommit(
  db: D1Database,
  datasetId: string,
  version: number,
  reason: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE dataset_commits
       SET status = 'rolled_back', validation_errors = ?
       WHERE dataset_id = ? AND version = ?`
    )
    .bind(JSON.stringify([reason]), datasetId, version)
    .run();
}

/**
 * Mark a dataset as serving LKG (Last Known Good).
 * Called when new ingestion fails but LKG exists.
 */
export async function markServingLKG(
  db: D1Database,
  datasetId: string,
  lkgVersion: number,
  reason: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE dataset_current_version
       SET is_serving_lkg = 1, lkg_reason = ?
       WHERE dataset_id = ?`
    )
    .bind(reason, datasetId)
    .run();
}

/**
 * Clear LKG status after successful recovery.
 */
export async function clearLKGStatus(db: D1Database, datasetId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE dataset_current_version
       SET is_serving_lkg = 0, lkg_reason = NULL
       WHERE dataset_id = ?`
    )
    .bind(datasetId)
    .run();
}

/**
 * Get all datasets currently serving LKG.
 */
export async function getDatasetsServingLKG(db: D1Database): Promise<DatasetCurrentVersion[]> {
  const result = await db
    .prepare('SELECT * FROM dataset_current_version WHERE is_serving_lkg = 1')
    .all<D1CurrentVersionRow>();

  return result.results.map((row) => ({
    datasetId: row.dataset_id,
    currentVersion: row.current_version,
    lastCommittedVersion: row.last_committed_version,
    lastCommittedAt: row.last_committed_at,
    isServingLKG: row.is_serving_lkg === 1,
    lkgReason: row.lkg_reason,
    currentSchemaVersion: row.current_schema_version,
    lastCommittedSchemaHash: row.last_committed_schema_hash,
  }));
}

/**
 * Get all current version records for admin dashboard.
 */
export async function getAllCurrentVersions(db: D1Database): Promise<DatasetCurrentVersion[]> {
  const result = await db
    .prepare('SELECT * FROM dataset_current_version ORDER BY dataset_id')
    .all<D1CurrentVersionRow>();

  return result.results.map((row) => ({
    datasetId: row.dataset_id,
    currentVersion: row.current_version,
    lastCommittedVersion: row.last_committed_version,
    lastCommittedAt: row.last_committed_at,
    isServingLKG: row.is_serving_lkg === 1,
    lkgReason: row.lkg_reason,
    currentSchemaVersion: row.current_schema_version,
    lastCommittedSchemaHash: row.last_committed_schema_hash,
  }));
}

/** Map D1 row to DatasetCommit */
function mapCommitRow(row: D1CommitRow): DatasetCommit {
  return {
    datasetId: row.dataset_id,
    sport: row.sport,
    version: row.version,
    status: row.status,
    recordCount: row.record_count,
    previousRecordCount: row.previous_record_count,
    validationStatus: row.validation_status,
    validationErrors: row.validation_errors ? JSON.parse(row.validation_errors) : null,
    ingestedAt: row.ingested_at,
    committedAt: row.committed_at,
    kvVersionedKey: row.kv_versioned_key,
    source: row.source,
    schemaVersion: row.schema_version,
    schemaHash: row.schema_hash,
  };
}
