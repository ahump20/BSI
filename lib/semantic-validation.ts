/**
 * Semantic Validation Layer
 *
 * Defines what constitutes semantically valid data for BSI.
 * Empty, null, or low-density datasets NEVER pass validation.
 *
 * A dataset is either:
 * - VALID: Meets schema and density requirements
 * - INVALID: Fails schema or density checks
 * - UNAVAILABLE: Source explicitly reports no data available
 *
 * Silence is failure. Empty arrays are INVALID, not acceptable.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type DatasetStatus = 'valid' | 'invalid' | 'unavailable';

export interface SemanticRule {
  datasetId: string;
  sport: 'cfb' | 'cbb' | 'mlb' | 'nfl' | 'nba';
  dataType: 'rankings' | 'standings' | 'games' | 'teams' | 'players';
  minRecordCount: number;
  description: string;
  requiredFields: string[];
  seasonalAvailability?: {
    startMonth: number; // 1-12
    endMonth: number; // 1-12
  };
}

export interface ValidationResult {
  status: DatasetStatus;
  datasetId: string;
  recordCount: number;
  expectedMin: number;
  passedSchema: boolean;
  passedDensity: boolean;
  reason: string;
  validatedAt: string;
  schemaErrors?: string[];
}

export interface ValidatedDataset<T> {
  data: T[] | null;
  validation: ValidationResult;
  source: 'kv' | 'r2' | 'd1' | 'live';
  lastUpdated: string | null;
}

// =============================================================================
// SEMANTIC RULES - THE SOURCE OF TRUTH
// =============================================================================

/**
 * NCAA D1 Baseball: ~300 teams, 31 conferences
 * Rankings: D1Baseball Top 25 = 25 teams
 * Standings: At least 250 teams across conferences in-season
 */

/**
 * NCAA D1 Basketball: ~363 teams, 32 conferences
 * Rankings: AP Top 25 = 25 teams
 * Standings: At least 300 teams in-season
 */

/**
 * NCAA FBS Football: 133 teams, 10 conferences (2024)
 * Rankings: AP/CFP/Coaches Top 25 = 25 teams each
 * Standings: At least 100 teams in-season
 */

export const SEMANTIC_RULES: Record<string, SemanticRule> = {
  // College Football
  'cfb-rankings-ap': {
    datasetId: 'cfb-rankings-ap',
    sport: 'cfb',
    dataType: 'rankings',
    minRecordCount: 25,
    description: 'AP Top 25 College Football Rankings',
    requiredFields: ['team_id', 'team_name', 'rank', 'record'],
    seasonalAvailability: { startMonth: 8, endMonth: 1 }, // Aug-Jan
  },
  'cfb-rankings-cfp': {
    datasetId: 'cfb-rankings-cfp',
    sport: 'cfb',
    dataType: 'rankings',
    minRecordCount: 25,
    description: 'CFP Top 25 Rankings',
    requiredFields: ['team_id', 'team_name', 'rank', 'record'],
    seasonalAvailability: { startMonth: 11, endMonth: 1 }, // Nov-Jan (CFP rankings start late)
  },
  'cfb-rankings-coaches': {
    datasetId: 'cfb-rankings-coaches',
    sport: 'cfb',
    dataType: 'rankings',
    minRecordCount: 25,
    description: 'Coaches Poll Top 25',
    requiredFields: ['team_id', 'team_name', 'rank', 'record'],
    seasonalAvailability: { startMonth: 8, endMonth: 1 },
  },
  'cfb-standings': {
    datasetId: 'cfb-standings',
    sport: 'cfb',
    dataType: 'standings',
    minRecordCount: 100, // FBS has 133 teams, expect at least 100 with standings
    description: 'FBS Conference Standings',
    requiredFields: ['team_id', 'team_name', 'conference', 'overall_wins', 'overall_losses'],
    seasonalAvailability: { startMonth: 8, endMonth: 1 },
  },
  'cfb-teams': {
    datasetId: 'cfb-teams',
    sport: 'cfb',
    dataType: 'teams',
    minRecordCount: 130, // FBS teams
    description: 'FBS Teams Master List',
    requiredFields: ['team_id', 'team_name', 'conference'],
  },

  // College Baseball
  'cbb-rankings-d1': {
    datasetId: 'cbb-rankings-d1',
    sport: 'cbb',
    dataType: 'rankings',
    minRecordCount: 25,
    description: 'D1Baseball Top 25 Rankings',
    requiredFields: ['team_id', 'team_name', 'rank', 'record'],
    seasonalAvailability: { startMonth: 2, endMonth: 6 }, // Feb-June
  },
  'cbb-standings': {
    datasetId: 'cbb-standings',
    sport: 'cbb',
    dataType: 'standings',
    minRecordCount: 200, // D1 Baseball has ~300 teams
    description: 'D1 Baseball Conference Standings',
    requiredFields: ['team_id', 'team_name', 'conference', 'overall_wins', 'overall_losses'],
    seasonalAvailability: { startMonth: 2, endMonth: 6 },
  },
  'cbb-teams': {
    datasetId: 'cbb-teams',
    sport: 'cbb',
    dataType: 'teams',
    minRecordCount: 280, // D1 Baseball teams
    description: 'D1 Baseball Teams Master List',
    requiredFields: ['team_id', 'team_name', 'conference'],
  },

  // MLB
  'mlb-standings': {
    datasetId: 'mlb-standings',
    sport: 'mlb',
    dataType: 'standings',
    minRecordCount: 30, // 30 MLB teams
    description: 'MLB Division Standings',
    requiredFields: ['team_id', 'team_name', 'wins', 'losses'],
  },
  'mlb-teams': {
    datasetId: 'mlb-teams',
    sport: 'mlb',
    dataType: 'teams',
    minRecordCount: 30,
    description: 'MLB Teams',
    requiredFields: ['team_id', 'team_name', 'division'],
  },

  // NFL
  'nfl-standings': {
    datasetId: 'nfl-standings',
    sport: 'nfl',
    dataType: 'standings',
    minRecordCount: 32, // 32 NFL teams
    description: 'NFL Division Standings',
    requiredFields: ['team_id', 'team_name', 'wins', 'losses'],
  },
  'nfl-teams': {
    datasetId: 'nfl-teams',
    sport: 'nfl',
    dataType: 'teams',
    minRecordCount: 32,
    description: 'NFL Teams',
    requiredFields: ['team_id', 'team_name', 'division'],
  },

  // NBA
  'nba-standings': {
    datasetId: 'nba-standings',
    sport: 'nba',
    dataType: 'standings',
    minRecordCount: 30, // 30 NBA teams
    description: 'NBA Conference Standings',
    requiredFields: ['team_id', 'team_name', 'wins', 'losses'],
  },
  'nba-teams': {
    datasetId: 'nba-teams',
    sport: 'nba',
    dataType: 'teams',
    minRecordCount: 30,
    description: 'NBA Teams',
    requiredFields: ['team_id', 'team_name', 'conference'],
  },
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a dataset is currently in-season based on semantic rules.
 * Returns true if no seasonal restrictions exist.
 */
export function isInSeason(rule: SemanticRule): boolean {
  if (!rule.seasonalAvailability) return true;

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const { startMonth, endMonth } = rule.seasonalAvailability;

  // Handle wrap-around (e.g., CFB: Aug-Jan = 8-1)
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  } else {
    // Wrap-around case: Aug(8) to Jan(1)
    return month >= startMonth || month <= endMonth;
  }
}

/**
 * Validate schema: check all required fields exist in records
 */
export function validateSchema(
  records: unknown[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(records)) {
    return { valid: false, errors: ['Data is not an array'] };
  }

  if (records.length === 0) {
    return { valid: false, errors: ['Dataset is empty'] };
  }

  // Check first 5 records for required fields
  const sampleSize = Math.min(5, records.length);
  for (let i = 0; i < sampleSize; i++) {
    const record = records[i] as Record<string, unknown>;
    for (const field of requiredFields) {
      if (!(field in record) || record[field] === null || record[field] === undefined) {
        errors.push(`Record ${i}: missing or null field '${field}'`);
      }
    }
  }

  // Check for all-empty string values (another form of invalid data)
  const firstRecord = records[0] as Record<string, unknown>;
  const emptyStringFields = requiredFields.filter(
    (f) =>
      firstRecord[f] === '' ||
      (typeof firstRecord[f] === 'string' && (firstRecord[f] as string).trim() === '')
  );
  if (emptyStringFields.length > 0) {
    errors.push(`Empty string values in fields: ${emptyStringFields.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate density: check record count meets minimum threshold
 */
export function validateDensity(
  recordCount: number,
  minRequired: number
): { valid: boolean; actual: number; expected: number } {
  return {
    valid: recordCount >= minRequired,
    actual: recordCount,
    expected: minRequired,
  };
}

/**
 * Full semantic validation for a dataset
 */
export function validateDataset(
  datasetId: string,
  records: unknown[] | null | undefined,
  options?: {
    explicitUnavailable?: boolean; // Source explicitly said no data
    overrideMinCount?: number; // For testing or special cases
  }
): ValidationResult {
  const rule = SEMANTIC_RULES[datasetId];
  const now = new Date().toISOString();

  if (!rule) {
    return {
      status: 'invalid',
      datasetId,
      recordCount: 0,
      expectedMin: 0,
      passedSchema: false,
      passedDensity: false,
      reason: `Unknown dataset ID: ${datasetId}. No semantic rules defined.`,
      validatedAt: now,
    };
  }

  // Check if source explicitly reported unavailable
  if (options?.explicitUnavailable) {
    return {
      status: 'unavailable',
      datasetId,
      recordCount: 0,
      expectedMin: rule.minRecordCount,
      passedSchema: false,
      passedDensity: false,
      reason: 'Source explicitly reported data unavailable',
      validatedAt: now,
    };
  }

  // Check for null/undefined data
  if (!records || !Array.isArray(records)) {
    return {
      status: 'invalid',
      datasetId,
      recordCount: 0,
      expectedMin: rule.minRecordCount,
      passedSchema: false,
      passedDensity: false,
      reason: 'Data is null, undefined, or not an array',
      validatedAt: now,
    };
  }

  // Check if out-of-season
  if (!isInSeason(rule)) {
    const season = rule.seasonalAvailability!;
    return {
      status: 'unavailable',
      datasetId,
      recordCount: records.length,
      expectedMin: rule.minRecordCount,
      passedSchema: records.length > 0,
      passedDensity: false,
      reason: `Out of season. ${rule.description} available months ${season.startMonth}-${season.endMonth}`,
      validatedAt: now,
    };
  }

  // Validate schema
  const schemaResult = validateSchema(records, rule.requiredFields);

  // Validate density
  const minCount = options?.overrideMinCount ?? rule.minRecordCount;
  const densityResult = validateDensity(records.length, minCount);

  // Determine final status
  const passedBoth = schemaResult.valid && densityResult.valid;

  let reason: string;
  if (passedBoth) {
    reason = `Valid: ${records.length} records (min ${minCount})`;
  } else if (!schemaResult.valid && !densityResult.valid) {
    reason = `Invalid: Schema errors and insufficient density (${records.length}/${minCount})`;
  } else if (!schemaResult.valid) {
    reason = `Invalid schema: ${schemaResult.errors.slice(0, 3).join('; ')}`;
  } else {
    reason = `Insufficient density: ${records.length} records, expected at least ${minCount}`;
  }

  return {
    status: passedBoth ? 'valid' : 'invalid',
    datasetId,
    recordCount: records.length,
    expectedMin: minCount,
    passedSchema: schemaResult.valid,
    passedDensity: densityResult.valid,
    reason,
    validatedAt: now,
    schemaErrors: schemaResult.errors.length > 0 ? schemaResult.errors : undefined,
  };
}

// =============================================================================
// KV WRITE GUARD
// =============================================================================

/**
 * Guard function for KV writes - ONLY allows semantically valid data
 * Returns the data if valid, throws if invalid
 */
export function guardKVWrite<T>(
  datasetId: string,
  records: T[] | null | undefined,
  options?: { explicitUnavailable?: boolean }
): { records: T[]; validation: ValidationResult } {
  const validation = validateDataset(datasetId, records as unknown[] | null | undefined, options);

  if (validation.status !== 'valid') {
    throw new SemanticValidationError(validation);
  }

  return { records: records as T[], validation };
}

/**
 * Custom error class for semantic validation failures
 */
export class SemanticValidationError extends Error {
  public validation: ValidationResult;

  constructor(validation: ValidationResult) {
    super(`Semantic validation failed for ${validation.datasetId}: ${validation.reason}`);
    this.name = 'SemanticValidationError';
    this.validation = validation;
  }
}

// =============================================================================
// READ PATH VALIDATION
// =============================================================================

/**
 * Validate data on read - ensures cached data still meets semantic requirements
 * Use this when reading from KV/R2 before serving to users
 */
export function validateOnRead<T>(
  datasetId: string,
  cachedData: { records: T[]; fetchedAt: string } | null
): ValidatedDataset<T> {
  if (!cachedData) {
    return {
      data: null,
      validation: {
        status: 'unavailable',
        datasetId,
        recordCount: 0,
        expectedMin: SEMANTIC_RULES[datasetId]?.minRecordCount ?? 0,
        passedSchema: false,
        passedDensity: false,
        reason: 'No cached data found',
        validatedAt: new Date().toISOString(),
      },
      source: 'kv',
      lastUpdated: null,
    };
  }

  const validation = validateDataset(datasetId, cachedData.records as unknown[]);

  return {
    data: validation.status === 'valid' ? cachedData.records : null,
    validation,
    source: 'kv',
    lastUpdated: cachedData.fetchedAt,
  };
}

// =============================================================================
// HEALTH REPORTING
// =============================================================================

export interface DatasetHealth {
  datasetId: string;
  description: string;
  status: DatasetStatus;
  recordCount: number;
  expectedMin: number;
  inSeason: boolean;
  lastValidated: string | null;
  lastFailureReason: string | null;
}

/**
 * Get health status for all datasets in a sport
 */
export function getDatasetHealthTemplate(sport: SemanticRule['sport']): DatasetHealth[] {
  return Object.values(SEMANTIC_RULES)
    .filter((rule) => rule.sport === sport)
    .map((rule) => ({
      datasetId: rule.datasetId,
      description: rule.description,
      status: 'unavailable' as DatasetStatus,
      recordCount: 0,
      expectedMin: rule.minRecordCount,
      inSeason: isInSeason(rule),
      lastValidated: null,
      lastFailureReason: null,
    }));
}

// =============================================================================
// R2 SNAPSHOT SYSTEM
// =============================================================================

/**
 * Cloudflare R2 bucket interface (subset of what we need)
 */
export interface R2Bucket {
  put(key: string, value: string | ReadableStream | ArrayBuffer): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: { prefix?: string; limit?: number }): Promise<R2Objects>;
}

interface R2Object {
  key: string;
  uploaded: Date;
}

interface R2ObjectBody extends R2Object {
  text(): Promise<string>;
}

interface R2Objects {
  objects: R2Object[];
}

/**
 * Snapshot data structure stored in R2
 */
export interface Snapshot<T> {
  data: T[];
  validation: ValidationResult;
  snapshotAt: string;
  recordCount: number;
}

/**
 * Store a validated dataset snapshot in R2 for fallback purposes.
 * Only call this AFTER validation passes.
 *
 * Key format: snapshots/{datasetId}/{timestamp}.json
 */
export async function storeSnapshot<T>(
  r2: R2Bucket,
  datasetId: string,
  records: T[],
  validation: ValidationResult
): Promise<void> {
  const key = `snapshots/${datasetId}/${Date.now()}.json`;
  const snapshot: Snapshot<T> = {
    data: records,
    validation,
    snapshotAt: new Date().toISOString(),
    recordCount: records.length,
  };
  await r2.put(key, JSON.stringify(snapshot));
}

/**
 * Retrieve the most recent valid snapshot from R2.
 * Returns null if no snapshots exist for this dataset.
 */
export async function getLatestSnapshot<T>(
  r2: R2Bucket,
  datasetId: string
): Promise<Snapshot<T> | null> {
  const list = await r2.list({ prefix: `snapshots/${datasetId}/`, limit: 10 });

  if (list.objects.length === 0) {
    return null;
  }

  // Sort by upload time descending, get most recent
  const latest = list.objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())[0];

  const obj = await r2.get(latest.key);
  if (!obj) {
    return null;
  }

  const text = await obj.text();
  return JSON.parse(text) as Snapshot<T>;
}

/**
 * Clean up old snapshots, keeping only the N most recent.
 * Call periodically to prevent unbounded R2 growth.
 */
export async function pruneSnapshots(
  r2: R2Bucket,
  datasetId: string,
  keepCount: number = 5
): Promise<number> {
  const list = await r2.list({ prefix: `snapshots/${datasetId}/`, limit: 100 });

  if (list.objects.length <= keepCount) {
    return 0;
  }

  // Sort by upload time descending
  const sorted = list.objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());

  // Delete everything after keepCount
  const toDelete = sorted.slice(keepCount);

  // Note: R2 delete requires separate API call per object
  // For now, return count of what should be deleted
  // Actual deletion would require r2.delete() which isn't in minimal interface
  return toDelete.length;
}
