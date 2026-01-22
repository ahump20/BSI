/**
 * BSI Semantic Validation
 * Validates datasets against expected schema and business rules.
 */

/** Dataset validation status */
export type DatasetStatus = 'valid' | 'invalid' | 'empty' | 'partial';

/** Season definition with month boundaries */
export interface SeasonMonths {
  start: number; // 1-12
  end: number;   // 1-12
}

/** Semantic rule for dataset validation */
export interface SemanticRule {
  datasetId: string;
  description: string;
  minRecordCount: number;
  requiredFields?: string[];
  seasonMonths?: SeasonMonths;
  allowsEmptyWhenOffSeason?: boolean;
}

/** Validation result with details */
export interface ValidationResult {
  status: DatasetStatus;
  datasetId: string;
  recordCount: number;
  errors: string[];
  warnings: string[];
  rule: SemanticRule;
  isOffSeason: boolean;
}

/** Default rules for BSI datasets */
export const SEMANTIC_RULES: Map<string, SemanticRule> = new Map([
  // College Baseball Games - Season: Feb-Jun
  ['cbb-games-live', {
    datasetId: 'cbb-games-live',
    description: 'Live college baseball game scores',
    minRecordCount: 1,
    requiredFields: ['gameId', 'homeTeam', 'awayTeam', 'status'],
    seasonMonths: { start: 2, end: 6 },
    allowsEmptyWhenOffSeason: true,
  }],
  ['cbb-games-upcoming', {
    datasetId: 'cbb-games-upcoming',
    description: 'Upcoming college baseball games',
    minRecordCount: 1,
    requiredFields: ['gameId', 'homeTeam', 'awayTeam', 'scheduledAt'],
    seasonMonths: { start: 2, end: 6 },
    allowsEmptyWhenOffSeason: true,
  }],
  // College Football Rankings - Season: Aug-Jan
  // Note: collegefootballdata.com doesn't include record in rankings response
  ['cfb-rankings-ap', {
    datasetId: 'cfb-rankings-ap',
    description: 'AP College Football Rankings',
    minRecordCount: 25,
    requiredFields: ['rank', 'team'],
    seasonMonths: { start: 8, end: 1 },
    allowsEmptyWhenOffSeason: true,
  }],
  ['cfb-rankings-coaches', {
    datasetId: 'cfb-rankings-coaches',
    description: 'Coaches Poll College Football Rankings',
    minRecordCount: 25,
    requiredFields: ['rank', 'team'],
    seasonMonths: { start: 8, end: 1 },
    allowsEmptyWhenOffSeason: true,
  }],
  ['cfb-rankings-cfp', {
    datasetId: 'cfb-rankings-cfp',
    description: 'College Football Playoff Rankings',
    minRecordCount: 25,
    requiredFields: ['rank', 'team'],
    seasonMonths: { start: 10, end: 1 },
    allowsEmptyWhenOffSeason: true,
  }],
  // College Football Games
  ['cfb-games-live', {
    datasetId: 'cfb-games-live',
    description: 'Live college football game scores',
    minRecordCount: 1,
    requiredFields: ['gameId', 'homeTeam', 'awayTeam', 'status'],
    seasonMonths: { start: 8, end: 1 },
    allowsEmptyWhenOffSeason: true,
  }],
  // Teams (always expected to have data)
  ['cbb-teams', {
    datasetId: 'cbb-teams',
    description: 'College baseball teams',
    minRecordCount: 100,
    requiredFields: ['teamId', 'name', 'conference'],
    allowsEmptyWhenOffSeason: false,
  }],
  ['cfb-teams', {
    datasetId: 'cfb-teams',
    description: 'College football teams',
    minRecordCount: 100,
    requiredFields: ['teamId', 'name', 'conference'],
    allowsEmptyWhenOffSeason: false,
  }],
]);

/** Check if current date is within season months */
export function isWithinSeason(seasonMonths: SeasonMonths, now: Date = new Date()): boolean {
  const currentMonth = now.getMonth() + 1; // 1-12

  // Handle seasons that span year boundary (e.g., Aug-Jan)
  if (seasonMonths.start > seasonMonths.end) {
    return currentMonth >= seasonMonths.start || currentMonth <= seasonMonths.end;
  }

  return currentMonth >= seasonMonths.start && currentMonth <= seasonMonths.end;
}

/** Check if a record has all required fields */
function hasRequiredFields(record: Record<string, unknown>, requiredFields: string[]): boolean {
  return requiredFields.every(field => {
    const value = record[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/** Get a rule by dataset ID */
export function getRule(datasetId: string): SemanticRule | undefined {
  return SEMANTIC_RULES.get(datasetId);
}

/** Validate a dataset against its semantic rule */
export function validateDataset<T extends Record<string, unknown>>(
  datasetId: string,
  records: T[],
  customRule?: SemanticRule,
  now: Date = new Date()
): ValidationResult {
  const rule = customRule ?? SEMANTIC_RULES.get(datasetId);

  if (!rule) {
    return {
      status: 'invalid',
      datasetId,
      recordCount: records.length,
      errors: [`No semantic rule defined for dataset: ${datasetId}`],
      warnings: [],
      rule: {
        datasetId,
        description: 'Unknown dataset',
        minRecordCount: 0,
      },
      isOffSeason: false,
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if off-season
  const isOffSeason = rule.seasonMonths ? !isWithinSeason(rule.seasonMonths, now) : false;

  // Empty dataset handling
  if (records.length === 0) {
    if (isOffSeason && rule.allowsEmptyWhenOffSeason) {
      return {
        status: 'empty',
        datasetId,
        recordCount: 0,
        errors: [],
        warnings: ['Dataset is empty during off-season (valid)'],
        rule,
        isOffSeason,
      };
    }

    errors.push(`Dataset is empty but expected at least ${rule.minRecordCount} records`);
    return {
      status: 'invalid',
      datasetId,
      recordCount: 0,
      errors,
      warnings,
      rule,
      isOffSeason,
    };
  }

  // Check minimum record count
  if (records.length < rule.minRecordCount) {
    if (isOffSeason && rule.allowsEmptyWhenOffSeason) {
      warnings.push(`Record count (${records.length}) below minimum (${rule.minRecordCount}), but within off-season tolerance`);
    } else {
      errors.push(`Record count (${records.length}) below minimum (${rule.minRecordCount})`);
    }
  }

  // Check required fields on each record
  if (rule.requiredFields && rule.requiredFields.length > 0) {
    let invalidRecordCount = 0;
    const sampleBadRecord: string[] = [];

    for (let i = 0; i < records.length; i++) {
      if (!hasRequiredFields(records[i], rule.requiredFields)) {
        invalidRecordCount++;
        if (sampleBadRecord.length < 3) {
          const missing = rule.requiredFields.filter(f => {
            const val = records[i][f];
            return val === undefined || val === null || val === '';
          });
          sampleBadRecord.push(`Record ${i}: missing [${missing.join(', ')}]`);
        }
      }
    }

    if (invalidRecordCount > 0) {
      const pct = ((invalidRecordCount / records.length) * 100).toFixed(1);
      errors.push(`${invalidRecordCount} records (${pct}%) missing required fields`);
      sampleBadRecord.forEach(s => errors.push(s));
    }
  }

  // Determine final status
  let status: DatasetStatus;
  if (errors.length > 0) {
    status = records.length > 0 ? 'partial' : 'invalid';
  } else if (records.length === 0) {
    status = 'empty';
  } else {
    status = 'valid';
  }

  return {
    status,
    datasetId,
    recordCount: records.length,
    errors,
    warnings,
    rule,
    isOffSeason,
  };
}

/** Check if a validation result represents valid, cacheable data */
export function isValidForCaching(result: ValidationResult): boolean {
  return result.status === 'valid' && result.errors.length === 0;
}
