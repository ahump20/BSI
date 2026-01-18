/**
 * Semantic Validation Library v3.0
 *
 * Core validation framework for ensuring data integrity in college sports data pipelines.
 * - Empty/null datasets are INVALID, never success
 * - Minimum density thresholds enforced per dataset type
 * - Schema validation ensures required fields exist
 * - KV/D1 writes blocked for invalid data
 * - Read-path re-validates before serving
 *
 * @author BSI Team
 * @created 2025-01-15
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type DatasetStatus = 'valid' | 'invalid' | 'unavailable';

export interface ValidationResult {
  status: DatasetStatus;
  reason: string;
  actualCount: number;
  expectedMin: number;
  datasetId: string;
  timestamp: string;
}

export interface SemanticRule {
  datasetId: string;
  description: string;
  minRecordCount: number;
  requiredFields?: string[];
  seasonMonths?: { start: number; end: number };
}

export interface ValidatedDataset<T> {
  data: T[];
  validation: ValidationResult;
  isValid: boolean;
}

// =============================================================================
// SEMANTIC RULES CONFIGURATION
// =============================================================================

export const SEMANTIC_RULES: Record<string, SemanticRule> = {
  // College Football Rankings
  'cfb-rankings-ap': {
    datasetId: 'cfb-rankings-ap',
    description: 'College Football AP Top 25 Rankings',
    minRecordCount: 25,
    requiredFields: ['team_id', 'team_name', 'rank'],
    seasonMonths: { start: 8, end: 1 }, // August - January
  },
  'cfb-rankings-cfp': {
    datasetId: 'cfb-rankings-cfp',
    description: 'College Football Playoff Rankings',
    minRecordCount: 25,
    requiredFields: ['team_id', 'team_name', 'rank'],
    seasonMonths: { start: 10, end: 1 }, // October - January
  },
  'cfb-rankings-coaches': {
    datasetId: 'cfb-rankings-coaches',
    description: 'College Football Coaches Poll Rankings',
    minRecordCount: 25,
    requiredFields: ['team_id', 'team_name', 'rank'],
    seasonMonths: { start: 8, end: 1 },
  },

  // College Football Standings
  'cfb-standings': {
    datasetId: 'cfb-standings',
    description: 'College Football Conference Standings (FBS)',
    minRecordCount: 100, // FBS has 133 teams
    requiredFields: ['team_id', 'team_name', 'conference', 'overall_wins', 'overall_losses'],
    seasonMonths: { start: 8, end: 1 },
  },

  // College Baseball Rankings
  'cbb-rankings-d1': {
    datasetId: 'cbb-rankings-d1',
    description: 'College Baseball D1 Top 25 Rankings',
    minRecordCount: 25,
    requiredFields: ['team_id', 'team_name', 'rank'],
    seasonMonths: { start: 2, end: 6 }, // February - June
  },

  // College Baseball Standings
  'cbb-standings': {
    datasetId: 'cbb-standings',
    description: 'College Baseball D1 Conference Standings',
    minRecordCount: 200, // D1 has ~300 teams
    requiredFields: ['team_id', 'team_name', 'conference', 'overall_wins', 'overall_losses'],
    seasonMonths: { start: 2, end: 6 },
  },

  // College Baseball Games (Live Scores)
  'cbb-games-live': {
    datasetId: 'cbb-games-live',
    description: 'College Baseball Live Game Scores',
    minRecordCount: 1, // At least 1 game during season
    requiredFields: ['game_id', 'home_team', 'away_team'],
    seasonMonths: { start: 2, end: 6 },
  },

  // College Baseball Teams
  'cbb-teams': {
    datasetId: 'cbb-teams',
    description: 'College Baseball D1 Teams',
    minRecordCount: 250, // D1 has ~300 teams
    requiredFields: ['team_id', 'team_name'],
    seasonMonths: { start: 1, end: 12 }, // Year-round
  },

  // College Baseball Players
  'cbb-players': {
    datasetId: 'cbb-players',
    description: 'College Baseball D1 Player Statistics',
    minRecordCount: 100, // Per-team roster average is ~35
    requiredFields: ['player_id', 'team_id', 'player_name'],
    seasonMonths: { start: 2, end: 6 },
  },

  // College Baseball Box Scores
  'cbb-boxscores': {
    datasetId: 'cbb-boxscores',
    description: 'College Baseball Game Box Scores',
    minRecordCount: 1,
    requiredFields: ['game_id', 'home_team', 'away_team'],
    seasonMonths: { start: 2, end: 6 },
  },
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a dataset type is currently in-season
 */
export function isInSeason(rule: SemanticRule): boolean {
  if (!rule.seasonMonths) return true;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const { start, end } = rule.seasonMonths;

  // Handle wrap-around seasons (e.g., football: Aug-Jan)
  if (start > end) {
    return currentMonth >= start || currentMonth <= end;
  }

  return currentMonth >= start && currentMonth <= end;
}

/**
 * Validate a dataset against semantic rules
 *
 * @param datasetId - The dataset identifier (e.g., 'cfb-rankings-ap')
 * @param data - The data array to validate
 * @returns ValidationResult with status, reason, and counts
 */
export function validateDataset(datasetId: string, data: unknown[]): ValidationResult {
  const now = new Date().toISOString();
  const rule = SEMANTIC_RULES[datasetId];

  // Unknown dataset ID
  if (!rule) {
    return {
      status: 'invalid',
      reason: `Unknown dataset ID: ${datasetId}`,
      actualCount: data?.length || 0,
      expectedMin: 0,
      datasetId,
      timestamp: now,
    };
  }

  // Null or undefined data is INVALID
  if (data === null || data === undefined) {
    return {
      status: 'invalid',
      reason: `Dataset ${datasetId} is null/undefined - INVALID`,
      actualCount: 0,
      expectedMin: rule.minRecordCount,
      datasetId,
      timestamp: now,
    };
  }

  // Empty array is INVALID (never success)
  if (!Array.isArray(data) || data.length === 0) {
    // Check if off-season
    if (!isInSeason(rule)) {
      return {
        status: 'unavailable',
        reason: `Dataset ${datasetId} is off-season (${rule.description})`,
        actualCount: 0,
        expectedMin: rule.minRecordCount,
        datasetId,
        timestamp: now,
      };
    }

    return {
      status: 'invalid',
      reason: `Dataset ${datasetId} is empty - INVALID (expected ${rule.minRecordCount}+ records)`,
      actualCount: 0,
      expectedMin: rule.minRecordCount,
      datasetId,
      timestamp: now,
    };
  }

  // Below minimum threshold
  if (data.length < rule.minRecordCount) {
    return {
      status: 'invalid',
      reason: `Dataset ${datasetId} below threshold: ${data.length} < ${rule.minRecordCount}`,
      actualCount: data.length,
      expectedMin: rule.minRecordCount,
      datasetId,
      timestamp: now,
    };
  }

  // Schema validation (required fields)
  if (rule.requiredFields && rule.requiredFields.length > 0) {
    const sample = data[0] as Record<string, unknown>;
    const missingFields = rule.requiredFields.filter(
      (field) => !(field in sample) || sample[field] === null || sample[field] === undefined
    );

    if (missingFields.length > 0) {
      return {
        status: 'invalid',
        reason: `Dataset ${datasetId} missing required fields: ${missingFields.join(', ')}`,
        actualCount: data.length,
        expectedMin: rule.minRecordCount,
        datasetId,
        timestamp: now,
      };
    }
  }

  // All validations passed
  return {
    status: 'valid',
    reason: `Valid: ${data.length} records (min ${rule.minRecordCount})`,
    actualCount: data.length,
    expectedMin: rule.minRecordCount,
    datasetId,
    timestamp: now,
  };
}

/**
 * Guard KV write - throws if validation fails
 *
 * @param datasetId - The dataset identifier
 * @param data - The data to validate
 * @throws SemanticValidationError if data is invalid
 */
export function guardKVWrite<T>(datasetId: string, data: T[]): ValidatedDataset<T> {
  const validation = validateDataset(datasetId, data as unknown[]);

  if (validation.status !== 'valid') {
    throw new SemanticValidationError(validation);
  }

  return {
    data,
    validation,
    isValid: true,
  };
}

/**
 * Validate data on read path (re-validate before serving)
 *
 * @param datasetId - The dataset identifier
 * @param data - The data retrieved from storage
 * @returns ValidatedDataset with validation result
 */
export function validateOnRead<T>(datasetId: string, data: T[]): ValidatedDataset<T> {
  const validation = validateDataset(datasetId, data as unknown[]);

  return {
    data,
    validation,
    isValid: validation.status === 'valid',
  };
}

// =============================================================================
// ERROR CLASS
// =============================================================================

/**
 * Custom error for semantic validation failures
 */
export class SemanticValidationError extends Error {
  public readonly validation: ValidationResult;
  public readonly datasetId: string;
  public readonly actualCount: number;
  public readonly expectedMin: number;

  constructor(validation: ValidationResult) {
    super(validation.reason);
    this.name = 'SemanticValidationError';
    this.validation = validation;
    this.datasetId = validation.datasetId;
    this.actualCount = validation.actualCount;
    this.expectedMin = validation.expectedMin;

    // Maintains proper stack trace for where our error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SemanticValidationError);
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all dataset IDs for a sport
 */
export function getDatasetsBySport(sport: 'football' | 'baseball'): string[] {
  const prefix = sport === 'football' ? 'cfb-' : 'cbb-';
  return Object.keys(SEMANTIC_RULES).filter((id) => id.startsWith(prefix));
}

/**
 * Get in-season datasets
 */
export function getInSeasonDatasets(): string[] {
  return Object.entries(SEMANTIC_RULES)
    .filter(([_, rule]) => isInSeason(rule))
    .map(([id, _]) => id);
}

/**
 * Get validation thresholds summary
 */
export function getValidationThresholds(): Record<string, { min: number; description: string }> {
  const thresholds: Record<string, { min: number; description: string }> = {};

  for (const [id, rule] of Object.entries(SEMANTIC_RULES)) {
    thresholds[id] = {
      min: rule.minRecordCount,
      description: rule.description,
    };
  }

  return thresholds;
}
