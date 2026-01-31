/**
 * BSI Dataset Identity
 * Canonical typed identity for every dataset. Backs the existing freeform datasetId
 * with structured fields, season dimension, and collision guards via D1 UNIQUE constraint.
 *
 * The existing key format ({datasetId}:v{n}, {datasetId}:current) continues to work.
 * The datasetId is now derived from SHA-256 of the canonical identity JSON.
 */

/** Identity version — included in canonical JSON for SHA-256. Bump on canonicalization changes. */
export const DATASET_IDENTITY_VERSION = 1;

/** Supported sports */
export type Sport = 'college_baseball' | 'college_football';

/** Competition levels */
export type CompetitionLevel = 'division_1' | 'division_2' | 'division_3';

/** Dataset types */
export type DatasetType =
  | 'rankings'
  | 'games'
  | 'standings'
  | 'roster'
  | 'portal'
  | 'schedule';

/** Branded DatasetId — only produced by registerIdentity / computeDatasetId */
export type DatasetId = string & { readonly __brand: 'DatasetId' };

/** Structured identity for a dataset */
export interface DatasetIdentity {
  sport: Sport;
  competitionLevel: CompetitionLevel;
  season: string; // '2025', '2025-2026'
  datasetType: DatasetType;
  qualifier?: string; // 'ap', 'coaches', 'live' -- for sub-datasets
}

/** Result of computeDatasetId — includes both hash and canonical string */
export interface ComputedDatasetId {
  datasetId: DatasetId;
  canonicalIdentity: string;
}

/** Envelope wrapping every KV/R2 payload for identity assertion on read */
export interface StoredEnvelope<T> {
  datasetId: DatasetId;
  canonicalIdentity: string;
  identity: DatasetIdentity;
  payload: T;
  storedAt: string;
}

/** Error thrown on identity mismatch */
export class DatasetIdentityViolation extends Error {
  constructor(
    message: string,
    public readonly expected: DatasetIdentity,
    public readonly stored: DatasetIdentity
  ) {
    super(message);
    this.name = 'DatasetIdentityViolation';
  }
}

/** D1Database interface (Cloudflare Workers) */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  meta?: { changes: number };
}

/** D1 row shape for dataset_identity table */
interface D1IdentityRow {
  dataset_id: string;
  sport: string;
  competition_level: string;
  season: string;
  dataset_type: string;
  qualifier: string | null;
  legacy_id: string | null;
  identity_version: number;
  canonical_identity: string | null;
  created_at: string;
  last_write_at: string;
  collision_attempts: number;
  last_collision_at: string | null;
  last_good_snapshot_version: number | null;
}

// --- Allowed values for normalization validation ---

const ALLOWED_SPORTS: ReadonlySet<string> = new Set<Sport>([
  'college_baseball',
  'college_football',
]);

const ALLOWED_COMPETITION_LEVELS: ReadonlySet<string> = new Set<CompetitionLevel>([
  'division_1',
  'division_2',
  'division_3',
]);

const ALLOWED_DATASET_TYPES: ReadonlySet<string> = new Set<DatasetType>([
  'rankings',
  'games',
  'standings',
  'roster',
  'portal',
  'schedule',
]);

/**
 * Normalize and validate a DatasetIdentity.
 * Lowercases + trims sport, competitionLevel, datasetType, qualifier.
 * Strips whitespace from season. Throws on unknown union values.
 */
export function normalizeIdentity(raw: DatasetIdentity): DatasetIdentity {
  const sport = raw.sport.toLowerCase().trim();
  const competitionLevel = raw.competitionLevel.toLowerCase().trim();
  const season = raw.season.trim();
  const datasetType = raw.datasetType.toLowerCase().trim();
  const qualifier = raw.qualifier ? raw.qualifier.toLowerCase().trim() : undefined;

  if (!ALLOWED_SPORTS.has(sport)) {
    throw new Error(`Unknown sport: '${sport}'`);
  }
  if (!ALLOWED_COMPETITION_LEVELS.has(competitionLevel)) {
    throw new Error(`Unknown competitionLevel: '${competitionLevel}'`);
  }
  if (!ALLOWED_DATASET_TYPES.has(datasetType)) {
    throw new Error(`Unknown datasetType: '${datasetType}'`);
  }

  return {
    sport: sport as Sport,
    competitionLevel: competitionLevel as CompetitionLevel,
    season,
    datasetType: datasetType as DatasetType,
    qualifier,
  };
}

/**
 * Compute a deterministic datasetId from a DatasetIdentity.
 * SHA-256 of canonical JSON (including identity version), truncated to 16 hex chars.
 * Returns both the hash and the canonical string for storage.
 */
export async function computeDatasetId(identity: DatasetIdentity): Promise<ComputedDatasetId> {
  const normalized = normalizeIdentity(identity);

  const canonicalIdentity = JSON.stringify({
    v: DATASET_IDENTITY_VERSION,
    sport: normalized.sport,
    competitionLevel: normalized.competitionLevel,
    season: normalized.season,
    datasetType: normalized.datasetType,
    qualifier: normalized.qualifier ?? null,
  });

  const encoded = new TextEncoder().encode(canonicalIdentity);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = new Uint8Array(hashBuffer);

  let hex = '';
  for (const byte of hashArray) {
    hex += byte.toString(16).padStart(2, '0');
  }

  return {
    datasetId: hex.slice(0, 16) as DatasetId,
    canonicalIdentity,
  };
}

/**
 * Resolve a datasetId back to its DatasetIdentity from D1.
 * Returns null if not registered.
 */
export async function resolveIdentity(
  datasetId: string,
  db: D1Database
): Promise<DatasetIdentity | null> {
  const row = await db
    .prepare('SELECT * FROM dataset_identity WHERE dataset_id = ?')
    .bind(datasetId)
    .first<D1IdentityRow>();

  if (!row) return null;

  return {
    sport: row.sport as Sport,
    competitionLevel: row.competition_level as CompetitionLevel,
    season: row.season,
    datasetType: row.dataset_type as DatasetType,
    qualifier: row.qualifier ?? undefined,
  };
}

/**
 * Register a DatasetIdentity in D1 (race-safe).
 * Uses INSERT ... ON CONFLICT DO NOTHING then SELECT to handle concurrent ingests.
 * On UNIQUE tuple violation (different datasetId, same identity): increments collision_attempts, throws.
 */
export async function registerIdentity(
  identity: DatasetIdentity,
  db: D1Database,
  datasetId?: string
): Promise<DatasetId> {
  const normalized = normalizeIdentity(identity);
  const computed = await computeDatasetId(normalized);
  const id = (datasetId ?? computed.datasetId) as DatasetId;
  const now = new Date().toISOString();

  // Race-safe upsert: INSERT ON CONFLICT DO NOTHING
  try {
    await db
      .prepare(
        `INSERT INTO dataset_identity
         (dataset_id, sport, competition_level, season, dataset_type, qualifier,
          legacy_id, identity_version, canonical_identity,
          created_at, last_write_at, collision_attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(dataset_id) DO NOTHING`
      )
      .bind(
        id,
        normalized.sport,
        normalized.competitionLevel,
        normalized.season,
        normalized.datasetType,
        normalized.qualifier ?? null,
        datasetId ?? null,
        DATASET_IDENTITY_VERSION,
        computed.canonicalIdentity,
        now,
        now
      )
      .run();
  } catch (err) {
    // UNIQUE tuple violation — different datasetId claims the same identity
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      await db
        .prepare(
          `UPDATE dataset_identity
           SET collision_attempts = collision_attempts + 1, last_collision_at = ?
           WHERE sport = ? AND competition_level = ? AND season = ? AND dataset_type = ?
             AND COALESCE(qualifier, '') = COALESCE(?, '')`
        )
        .bind(
          now,
          normalized.sport,
          normalized.competitionLevel,
          normalized.season,
          normalized.datasetType,
          normalized.qualifier ?? ''
        )
        .run();
      throw new DatasetIdentityViolation(
        `Identity collision: tuple already registered under a different datasetId`,
        normalized,
        normalized
      );
    }
    throw err;
  }

  // SELECT the row and verify fields match
  const row = await db
    .prepare('SELECT * FROM dataset_identity WHERE dataset_id = ?')
    .bind(id)
    .first<D1IdentityRow>();

  if (!row) {
    throw new Error(`registerIdentity: row missing after INSERT for ${id}`);
  }

  const stored: DatasetIdentity = {
    sport: row.sport as Sport,
    competitionLevel: row.competition_level as CompetitionLevel,
    season: row.season,
    datasetType: row.dataset_type as DatasetType,
    qualifier: row.qualifier ?? undefined,
  };

  assertIdentityMatch(normalized, stored);

  // Update last_write_at on subsequent calls
  await db
    .prepare('UPDATE dataset_identity SET last_write_at = ? WHERE dataset_id = ?')
    .bind(now, id)
    .run();

  return id;
}

/**
 * Assert that two DatasetIdentity objects match on all fields.
 * Throws DatasetIdentityViolation on mismatch.
 */
export function assertIdentityMatch(
  expected: DatasetIdentity,
  stored: DatasetIdentity
): void {
  const fields: (keyof DatasetIdentity)[] = [
    'sport',
    'competitionLevel',
    'season',
    'datasetType',
    'qualifier',
  ];

  for (const field of fields) {
    const e = expected[field] ?? null;
    const s = stored[field] ?? null;
    if (e !== s) {
      throw new DatasetIdentityViolation(
        `Identity mismatch on '${field}': expected '${e}', got '${s}'`,
        expected,
        stored
      );
    }
  }
}

/**
 * Assert a StoredEnvelope's identity matches the expected datasetId.
 * Returns the unwrapped payload on success. Throws on mismatch.
 */
export function assertEnvelope<T>(
  envelope: StoredEnvelope<T>,
  expectedDatasetId: DatasetId | string
): T {
  if (envelope.datasetId !== expectedDatasetId) {
    throw new DatasetIdentityViolation(
      `Envelope datasetId mismatch: expected '${expectedDatasetId}', got '${envelope.datasetId}'`,
      envelope.identity,
      envelope.identity
    );
  }
  return envelope.payload;
}

/**
 * Wrap a payload in a StoredEnvelope for KV/R2 writes.
 */
export function wrapEnvelope<T>(
  payload: T,
  datasetId: DatasetId | string,
  identity: DatasetIdentity,
  canonicalIdentity: string
): StoredEnvelope<T> {
  return {
    datasetId: datasetId as DatasetId,
    canonicalIdentity,
    identity,
    payload,
    storedAt: new Date().toISOString(),
  };
}

/** Legacy ID to sport mapping */
const LEGACY_SPORT_MAP: Record<string, Sport> = {
  cfb: 'college_football',
  cbb: 'college_baseball',
};

/** Legacy ID to dataset type mapping */
const LEGACY_TYPE_MAP: Record<string, DatasetType> = {
  rankings: 'rankings',
  games: 'games',
  standings: 'standings',
  roster: 'roster',
  portal: 'portal',
  schedule: 'schedule',
};

/**
 * Map a legacy datasetId string to a structured DatasetIdentity.
 * Handles formats like 'cfb-rankings-ap', 'cfb-games-live', 'cbb-games-upcoming'.
 */
export function legacyIdToIdentity(legacyId: string, season: string): DatasetIdentity {
  const parts = legacyId.split('-');
  if (parts.length < 2) {
    throw new Error(`Cannot parse legacy datasetId: ${legacyId}`);
  }

  const sportKey = parts[0];
  const typeKey = parts[1];
  const qualifier = parts.length > 2 ? parts.slice(2).join('-') : undefined;

  const sport = LEGACY_SPORT_MAP[sportKey];
  if (!sport) {
    throw new Error(`Unknown sport prefix in legacy datasetId: ${sportKey}`);
  }

  const datasetType = LEGACY_TYPE_MAP[typeKey];
  if (!datasetType) {
    throw new Error(`Unknown dataset type in legacy datasetId: ${typeKey}`);
  }

  const raw: DatasetIdentity = {
    sport,
    competitionLevel: 'division_1', // all existing datasets are D1
    season,
    datasetType,
    qualifier,
  };

  return normalizeIdentity(raw);
}
