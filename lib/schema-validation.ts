/**
 * BSI Schema Validation System
 * Validates dataset shape against registered schemas at ingestion and read time.
 */

/** Invariant rule types for field validation */
export type InvariantRuleType = 'non_null' | 'range' | 'enum' | 'regex' | 'length';

/** Invariant rule definition */
export interface InvariantRule {
  type: InvariantRuleType;
  field: string;
  /** For range: [min, max] */
  range?: [number, number];
  /** For enum: allowed values */
  values?: (string | number | boolean)[];
  /** For regex: pattern string */
  pattern?: string;
  /** For length: [minLength, maxLength] */
  length?: [number, number];
}

/** Parsed invariants object */
export interface SchemaInvariants {
  rules: InvariantRule[];
}

/** D1 row structure for dataset_schema table */
export interface DatasetSchema {
  id: number;
  datasetId: string;
  schemaVersion: string;
  schemaHash: string;
  requiredFields: string[];
  invariants: SchemaInvariants | null;
  minimumRenderableCount: number;
  sunsetAt: string | null;
  createdAt: string;
  isActive: boolean;
}

/** D1 row from query (snake_case) */
interface D1SchemaRow {
  id: number;
  dataset_id: string;
  schema_version: string;
  schema_hash: string;
  required_fields: string;
  invariants: string | null;
  minimum_renderable_count: number;
  sunset_at: string | null;
  created_at: string;
  is_active: number;
}

/** Schema error reasons */
export type SchemaErrorReason =
  | 'schema_mismatch'
  | 'invariant_violation'
  | 'insufficient_records'
  | 'missing_required_field'
  | 'schema_not_found'
  | 'schema_sunset';

/** Field-level violation detail */
export interface FieldViolation {
  field: string;
  reason: SchemaErrorReason;
  message: string;
  recordIndex?: number;
}

/** Schema validation result */
export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  fieldViolations: FieldViolation[];
  schemaVersion: string | null;
  schemaHash: string | null;
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
}

/**
 * Compute SHA-256 hash of schema definition, truncated to 16 chars.
 * Used for quick schema mismatch detection at edge.
 */
export async function computeSchemaHash(schema: {
  requiredFields: string[];
  invariants: SchemaInvariants | null;
}): Promise<string> {
  const normalized = JSON.stringify({
    requiredFields: [...schema.requiredFields].sort(),
    invariants: schema.invariants,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex.slice(0, 16);
}

/**
 * Load active schema for a dataset from D1.
 * Returns null if no schema is defined (datasets continue to work without schema).
 */
export async function getActiveSchema(
  db: D1Database,
  datasetId: string
): Promise<DatasetSchema | null> {
  const row = await db
    .prepare(
      `SELECT * FROM dataset_schema
       WHERE dataset_id = ? AND is_active = 1
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(datasetId)
    .first<D1SchemaRow>();

  if (!row) {
    return null;
  }

  return mapSchemaRow(row);
}

/**
 * Get schema by version.
 */
export async function getSchemaByVersion(
  db: D1Database,
  datasetId: string,
  schemaVersion: string
): Promise<DatasetSchema | null> {
  const row = await db
    .prepare(
      `SELECT * FROM dataset_schema
       WHERE dataset_id = ? AND schema_version = ?`
    )
    .bind(datasetId, schemaVersion)
    .first<D1SchemaRow>();

  if (!row) {
    return null;
  }

  return mapSchemaRow(row);
}

/**
 * Validate records against a dataset schema.
 * Checks required fields exist and invariants pass.
 */
export async function validateAgainstSchema<T extends Record<string, unknown>>(
  db: D1Database,
  datasetId: string,
  records: T[]
): Promise<SchemaValidationResult> {
  const schema = await getActiveSchema(db, datasetId);

  // No schema defined - pass through (backward compatible)
  if (!schema) {
    return {
      valid: true,
      errors: [],
      fieldViolations: [],
      schemaVersion: null,
      schemaHash: null,
    };
  }

  // Check if schema is sunset
  if (schema.sunsetAt && new Date(schema.sunsetAt) < new Date()) {
    return {
      valid: false,
      errors: [`Schema ${schema.schemaVersion} is sunset as of ${schema.sunsetAt}`],
      fieldViolations: [
        {
          field: '_schema',
          reason: 'schema_sunset',
          message: `Schema ${schema.schemaVersion} is sunset`,
        },
      ],
      schemaVersion: schema.schemaVersion,
      schemaHash: schema.schemaHash,
    };
  }

  const errors: string[] = [];
  const fieldViolations: FieldViolation[] = [];

  // Check minimum renderable count
  if (records.length < schema.minimumRenderableCount) {
    errors.push(
      `Insufficient records: ${records.length} < ${schema.minimumRenderableCount} minimum`
    );
    fieldViolations.push({
      field: '_count',
      reason: 'insufficient_records',
      message: `Expected at least ${schema.minimumRenderableCount} records, got ${records.length}`,
    });
  }

  // Check required fields on each record
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    for (const field of schema.requiredFields) {
      if (!(field in record) || record[field] === undefined) {
        errors.push(`Record ${i}: missing required field '${field}'`);
        fieldViolations.push({
          field,
          reason: 'missing_required_field',
          message: `Missing required field '${field}'`,
          recordIndex: i,
        });
      }
    }
  }

  // Check invariants if defined
  if (schema.invariants?.rules) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      for (const rule of schema.invariants.rules) {
        const violation = checkInvariant(rule, record, i);
        if (violation) {
          errors.push(`Record ${i}: ${violation.message}`);
          fieldViolations.push(violation);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldViolations,
    schemaVersion: schema.schemaVersion,
    schemaHash: schema.schemaHash,
  };
}

/**
 * Check a single invariant rule against a record.
 */
function checkInvariant(
  rule: InvariantRule,
  record: Record<string, unknown>,
  recordIndex: number
): FieldViolation | null {
  const value = record[rule.field];

  switch (rule.type) {
    case 'non_null':
      if (value === null || value === undefined) {
        return {
          field: rule.field,
          reason: 'invariant_violation',
          message: `Field '${rule.field}' must not be null`,
          recordIndex,
        };
      }
      break;

    case 'range':
      if (rule.range && typeof value === 'number') {
        const [min, max] = rule.range;
        if (value < min || value > max) {
          return {
            field: rule.field,
            reason: 'invariant_violation',
            message: `Field '${rule.field}' value ${value} outside range [${min}, ${max}]`,
            recordIndex,
          };
        }
      }
      break;

    case 'enum':
      if (rule.values && !rule.values.includes(value as string | number | boolean)) {
        return {
          field: rule.field,
          reason: 'invariant_violation',
          message: `Field '${rule.field}' value '${value}' not in allowed values`,
          recordIndex,
        };
      }
      break;

    case 'regex':
      if (rule.pattern && typeof value === 'string') {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(value)) {
          return {
            field: rule.field,
            reason: 'invariant_violation',
            message: `Field '${rule.field}' value '${value}' does not match pattern`,
            recordIndex,
          };
        }
      }
      break;

    case 'length':
      if (rule.length && typeof value === 'string') {
        const [minLen, maxLen] = rule.length;
        if (value.length < minLen || value.length > maxLen) {
          return {
            field: rule.field,
            reason: 'invariant_violation',
            message: `Field '${rule.field}' length ${value.length} outside range [${minLen}, ${maxLen}]`,
            recordIndex,
          };
        }
      }
      break;
  }

  return null;
}

/**
 * Check if a schema version is compatible (N or N-1).
 * Supports semver comparison: major changes are breaking, minor/patch are compatible.
 */
export function isSchemaCompatible(currentVersion: string, requestedVersion: string): boolean {
  const current = parseSemver(currentVersion);
  const requested = parseSemver(requestedVersion);

  if (!current || !requested) {
    return currentVersion === requestedVersion;
  }

  // Same major version is compatible
  if (current.major === requested.major) {
    return true;
  }

  // N-1 major version is compatible (dual-read window)
  if (current.major === requested.major + 1) {
    return true;
  }

  return false;
}

/**
 * Check if a schema version can be promoted to KV.
 * Blocks unsupported versions from being served.
 */
export async function canPromoteToKV(
  db: D1Database,
  datasetId: string,
  schemaVersion: string
): Promise<{ canPromote: boolean; reason?: string }> {
  const activeSchema = await getActiveSchema(db, datasetId);

  // No active schema - any version can be promoted
  if (!activeSchema) {
    return { canPromote: true };
  }

  // Check compatibility
  if (!isSchemaCompatible(activeSchema.schemaVersion, schemaVersion)) {
    return {
      canPromote: false,
      reason: `Schema version ${schemaVersion} incompatible with active ${activeSchema.schemaVersion}`,
    };
  }

  return { canPromote: true };
}

/**
 * Create a new schema definition.
 */
export async function createSchema(
  db: D1Database,
  params: {
    datasetId: string;
    schemaVersion: string;
    requiredFields: string[];
    invariants?: SchemaInvariants;
    minimumRenderableCount?: number;
    sunsetAt?: string;
  }
): Promise<{ success: boolean; schemaHash: string; error?: string }> {
  const schemaHash = await computeSchemaHash({
    requiredFields: params.requiredFields,
    invariants: params.invariants ?? null,
  });

  try {
    await db
      .prepare(
        `INSERT INTO dataset_schema
         (dataset_id, schema_version, schema_hash, required_fields, invariants,
          minimum_renderable_count, sunset_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .bind(
        params.datasetId,
        params.schemaVersion,
        schemaHash,
        JSON.stringify(params.requiredFields),
        params.invariants ? JSON.stringify(params.invariants) : null,
        params.minimumRenderableCount ?? 1,
        params.sunsetAt ?? null
      )
      .run();

    return { success: true, schemaHash };
  } catch (e) {
    return {
      success: false,
      schemaHash: '',
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

/**
 * Deactivate a schema (soft delete).
 */
export async function deactivateSchema(
  db: D1Database,
  datasetId: string,
  schemaVersion: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE dataset_schema SET is_active = 0
       WHERE dataset_id = ? AND schema_version = ?`
    )
    .bind(datasetId, schemaVersion)
    .run();
}

/**
 * Parse semver string into components.
 */
function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
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

/**
 * Map D1 row to DatasetSchema.
 */
function mapSchemaRow(row: D1SchemaRow): DatasetSchema {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    schemaVersion: row.schema_version,
    schemaHash: row.schema_hash,
    requiredFields: JSON.parse(row.required_fields) as string[],
    invariants: row.invariants ? (JSON.parse(row.invariants) as SchemaInvariants) : null,
    minimumRenderableCount: row.minimum_renderable_count,
    sunsetAt: row.sunset_at,
    createdAt: row.created_at,
    isActive: row.is_active === 1,
  };
}
