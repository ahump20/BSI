/**
 * BSI Readiness Service
 * System-level readiness gates before KV lifecycle checks.
 * Prevents cold starts from poisoning cache or serving uncertain data.
 *
 * Flow: Request -> D1 readiness check -> If not ready: 202/503 + no-store
 *                                     -> If ready: validatedRead(KV/R2)
 */

/** Readiness states at system/scope level */
export type ReadinessState = 'initializing' | 'ready' | 'degraded' | 'unavailable';

/** D1 row structure for system_readiness table */
export interface ReadinessRecord {
  scope: string;
  readinessState: ReadinessState;
  lastTransitionAt: string;
  reason: string | null;
  snapshotValidatedAt: string | null;
  liveIngestionAt: string | null;
}

/** Result of a readiness check */
export interface ReadinessCheckResult {
  isReady: boolean;
  state: ReadinessState;
  allowKVRead: boolean;
  allowCache: boolean;
  httpStatus: 200 | 202 | 503;
  reason: string;
}

/** R2 snapshot format for cold-start recovery */
interface R2Snapshot<T> {
  data: T[];
  validation: {
    status: 'valid' | 'invalid' | 'empty';
    recordCount: number;
    rule: string;
  };
  snapshotAt: string;
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

/** R2Bucket interface (Cloudflare Workers) */
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface R2ObjectBody {
  text(): Promise<string>;
}

/** D1 row from query (snake_case) */
interface D1ReadinessRow {
  scope: string;
  readiness_state: ReadinessState;
  last_transition_at: string;
  reason: string | null;
  snapshot_validated_at: string | null;
  live_ingestion_at: string | null;
}

/**
 * Check readiness state for a given scope.
 * Returns cold-start safe defaults if no record exists.
 */
export async function checkReadiness(db: D1Database, scope: string): Promise<ReadinessCheckResult> {
  try {
    const row = await db
      .prepare('SELECT * FROM system_readiness WHERE scope = ?')
      .bind(scope)
      .first<D1ReadinessRow>();

    // No record = cold start = not ready
    if (!row) {
      return {
        isReady: false,
        state: 'initializing',
        allowKVRead: false,
        allowCache: false,
        httpStatus: 202,
        reason: 'Cold start - awaiting first validation',
      };
    }

    return mapStateToResult(row.readiness_state, row.reason);
  } catch (error) {
    // D1 failure = degraded, allow fallback reads but no cache
    return {
      isReady: false,
      state: 'degraded',
      allowKVRead: true,
      allowCache: false,
      httpStatus: 503,
      reason: `Readiness check failed: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

/**
 * Map readiness state to HTTP semantics.
 */
function mapStateToResult(state: ReadinessState, reason: string | null): ReadinessCheckResult {
  switch (state) {
    case 'ready':
      return {
        isReady: true,
        state: 'ready',
        allowKVRead: true,
        allowCache: true,
        httpStatus: 200,
        reason: reason || 'System ready',
      };

    case 'initializing':
      return {
        isReady: false,
        state: 'initializing',
        allowKVRead: false,
        allowCache: false,
        httpStatus: 202,
        reason: reason || 'First ingestion pending',
      };

    case 'degraded':
      return {
        isReady: false,
        state: 'degraded',
        allowKVRead: true,
        allowCache: false,
        httpStatus: 503,
        reason: reason || 'System degraded',
      };

    case 'unavailable':
      return {
        isReady: false,
        state: 'unavailable',
        allowKVRead: false,
        allowCache: false,
        httpStatus: 503,
        reason: reason || 'System unavailable',
      };
  }
}

/**
 * Transition readiness state atomically with timestamp.
 * Called by ingestion workers after successful validation.
 */
export async function transitionReadiness(
  db: D1Database,
  scope: string,
  newState: ReadinessState,
  reason: string
): Promise<void> {
  const now = new Date().toISOString();

  // Upsert: insert if not exists, update if exists
  await db
    .prepare(
      `INSERT INTO system_readiness (scope, readiness_state, last_transition_at, reason)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(scope) DO UPDATE SET
         readiness_state = excluded.readiness_state,
         last_transition_at = excluded.last_transition_at,
         reason = excluded.reason`
    )
    .bind(scope, newState, now, reason)
    .run();
}

/**
 * Mark a scope as ready after live ingestion.
 * Updates both readiness_state and live_ingestion_at.
 */
export async function markLiveIngestion(
  db: D1Database,
  scope: string,
  reason: string = 'Live ingestion completed'
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO system_readiness (scope, readiness_state, last_transition_at, reason, live_ingestion_at)
       VALUES (?, 'ready', ?, ?, ?)
       ON CONFLICT(scope) DO UPDATE SET
         readiness_state = 'ready',
         last_transition_at = excluded.last_transition_at,
         reason = excluded.reason,
         live_ingestion_at = excluded.live_ingestion_at`
    )
    .bind(scope, now, reason, now)
    .run();
}

/**
 * Validate from R2 snapshot for fast cold-start recovery.
 * If valid snapshot exists (< 24h old, passes schema), transition to ready.
 */
export async function validateFromSnapshot<T>(
  db: D1Database,
  r2: R2Bucket,
  scope: string,
  snapshotKey: string,
  minRecordCount: number = 1
): Promise<boolean> {
  try {
    const object = await r2.get(snapshotKey);

    if (!object) {
      return false;
    }

    const raw = await object.text();
    const snapshot: R2Snapshot<T> = JSON.parse(raw);

    // Validation checks
    const snapshotAge = Date.now() - new Date(snapshot.snapshotAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (snapshotAge > maxAge) {
      return false;
    }

    if (snapshot.validation.status !== 'valid') {
      return false;
    }

    if (snapshot.data.length < minRecordCount) {
      return false;
    }

    // Valid snapshot - transition to ready
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO system_readiness (scope, readiness_state, last_transition_at, reason, snapshot_validated_at)
         VALUES (?, 'ready', ?, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET
           readiness_state = 'ready',
           last_transition_at = excluded.last_transition_at,
           reason = excluded.reason,
           snapshot_validated_at = excluded.snapshot_validated_at`
      )
      .bind(scope, now, `Recovered from snapshot: ${snapshotKey}`, now)
      .run();

    return true;
  } catch {
    return false;
  }
}

/**
 * Get all readiness records for admin dashboard.
 */
export async function getSystemReadiness(db: D1Database): Promise<ReadinessRecord[]> {
  const result = await db
    .prepare('SELECT * FROM system_readiness ORDER BY scope')
    .all<D1ReadinessRow>();

  return result.results.map((row) => ({
    scope: row.scope,
    readinessState: row.readiness_state,
    lastTransitionAt: row.last_transition_at,
    reason: row.reason,
    snapshotValidatedAt: row.snapshot_validated_at,
    liveIngestionAt: row.live_ingestion_at,
  }));
}

/**
 * Get readiness for a single scope (for admin).
 */
export async function getScopeReadiness(
  db: D1Database,
  scope: string
): Promise<ReadinessRecord | null> {
  const row = await db
    .prepare('SELECT * FROM system_readiness WHERE scope = ?')
    .bind(scope)
    .first<D1ReadinessRow>();

  if (!row) {
    return null;
  }

  return {
    scope: row.scope,
    readinessState: row.readiness_state,
    lastTransitionAt: row.last_transition_at,
    reason: row.reason,
    snapshotValidatedAt: row.snapshot_validated_at,
    liveIngestionAt: row.live_ingestion_at,
  };
}

/**
 * Initialize scope to a specific state.
 * Used for testing or manual recovery.
 */
export async function initializeScope(
  db: D1Database,
  scope: string,
  state: ReadinessState = 'initializing',
  reason: string = 'Manual initialization'
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO system_readiness (scope, readiness_state, last_transition_at, reason)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(scope) DO UPDATE SET
         readiness_state = excluded.readiness_state,
         last_transition_at = excluded.last_transition_at,
         reason = excluded.reason`
    )
    .bind(scope, state, now, reason)
    .run();
}

/** LKG status result */
export interface LKGStatus {
  isLKG: boolean;
  reason: string | null;
  lkgVersion: number | null;
}

/** D1 row from dataset_current_version query (snake_case) */
interface D1CurrentVersionRow {
  dataset_id: string;
  current_version: number;
  last_committed_version: number | null;
  last_committed_at: string | null;
  is_serving_lkg: number;
  lkg_reason: string | null;
}

/**
 * Check if a dataset scope is serving Last Known Good (LKG) data.
 */
export async function isServingLKG(db: D1Database, scope: string): Promise<LKGStatus> {
  const row = await db
    .prepare('SELECT * FROM dataset_current_version WHERE dataset_id = ?')
    .bind(scope)
    .first<D1CurrentVersionRow>();

  if (!row) {
    return { isLKG: false, reason: null, lkgVersion: null };
  }

  return {
    isLKG: row.is_serving_lkg === 1,
    reason: row.lkg_reason,
    lkgVersion: row.is_serving_lkg === 1 ? row.last_committed_version : null,
  };
}

/**
 * Mark a dataset scope as serving LKG.
 * Also transitions the system_readiness state to degraded.
 */
export async function markScopeServingLKG(
  db: D1Database,
  scope: string,
  reason: string
): Promise<void> {
  // Update dataset_current_version table
  await db
    .prepare(
      `UPDATE dataset_current_version
       SET is_serving_lkg = 1, lkg_reason = ?
       WHERE dataset_id = ?`
    )
    .bind(reason, scope)
    .run();

  // Transition system_readiness to degraded
  await transitionReadiness(db, scope, 'degraded', `Serving LKG: ${reason}`);
}

/**
 * Clear LKG status for a dataset scope.
 */
export async function clearScopeLKGStatus(db: D1Database, scope: string): Promise<void> {
  await db
    .prepare(
      `UPDATE dataset_current_version
       SET is_serving_lkg = 0, lkg_reason = NULL
       WHERE dataset_id = ?`
    )
    .bind(scope)
    .run();
}
