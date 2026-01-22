import { describe, it, expect } from 'vitest';
import {
  validateDataset,
  isWithinSeason,
  getRule,
  type SemanticRule,
} from '../semantic-validation';

describe('isWithinSeason', () => {
  it('handles seasons within same year (Feb-Jun)', () => {
    const season = { start: 2, end: 6 };

    // February (in season)
    expect(isWithinSeason(season, new Date('2025-02-15'))).toBe(true);
    // April (in season)
    expect(isWithinSeason(season, new Date('2025-04-15'))).toBe(true);
    // June (in season)
    expect(isWithinSeason(season, new Date('2025-06-15'))).toBe(true);
    // July (off season)
    expect(isWithinSeason(season, new Date('2025-07-15'))).toBe(false);
    // January (off season)
    expect(isWithinSeason(season, new Date('2025-01-15'))).toBe(false);
    // December (off season)
    expect(isWithinSeason(season, new Date('2025-12-15'))).toBe(false);
  });

  it('handles seasons spanning year boundary (Aug-Jan)', () => {
    const season = { start: 8, end: 1 };

    // August (in season)
    expect(isWithinSeason(season, new Date('2025-08-15'))).toBe(true);
    // November (in season)
    expect(isWithinSeason(season, new Date('2025-11-15'))).toBe(true);
    // January (in season)
    expect(isWithinSeason(season, new Date('2025-01-15'))).toBe(true);
    // February (off season)
    expect(isWithinSeason(season, new Date('2025-02-15'))).toBe(false);
    // July (off season)
    expect(isWithinSeason(season, new Date('2025-07-15'))).toBe(false);
  });

  it('handles edge months correctly', () => {
    const season = { start: 10, end: 1 }; // CFP Rankings: Oct-Jan

    // October (in season) - use mid-month to avoid timezone edge cases
    expect(isWithinSeason(season, new Date('2025-10-15T12:00:00'))).toBe(true);
    // January (in season)
    expect(isWithinSeason(season, new Date('2025-01-15T12:00:00'))).toBe(true);
    // September (off season)
    expect(isWithinSeason(season, new Date('2025-09-15T12:00:00'))).toBe(false);
    // February (off season)
    expect(isWithinSeason(season, new Date('2025-02-15T12:00:00'))).toBe(false);
  });
});

describe('validateDataset', () => {
  const createGameRecord = (overrides = {}) => ({
    gameId: 'game-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    status: 'live',
    ...overrides,
  });

  it('returns valid for dataset meeting all criteria', () => {
    const records = [createGameRecord(), createGameRecord({ gameId: 'game-2' })];
    const rule: SemanticRule = {
      datasetId: 'test-games',
      description: 'Test games',
      minRecordCount: 1,
      requiredFields: ['gameId', 'homeTeam', 'awayTeam', 'status'],
    };

    const result = validateDataset('test-games', records, rule);

    expect(result.status).toBe('valid');
    expect(result.recordCount).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty for off-season empty dataset with flag', () => {
    const rule: SemanticRule = {
      datasetId: 'test-games',
      description: 'Test games',
      minRecordCount: 1,
      seasonMonths: { start: 2, end: 6 }, // Feb-Jun
      allowsEmptyWhenOffSeason: true,
    };

    // Off-season date (January)
    const result = validateDataset('test-games', [], rule, new Date('2025-01-15'));

    expect(result.status).toBe('empty');
    expect(result.isOffSeason).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toContain('Dataset is empty during off-season (valid)');
  });

  it('returns invalid for empty dataset without flag', () => {
    const rule: SemanticRule = {
      datasetId: 'test-teams',
      description: 'Test teams',
      minRecordCount: 100,
      allowsEmptyWhenOffSeason: false,
    };

    const result = validateDataset('test-teams', [], rule);

    expect(result.status).toBe('invalid');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('empty');
  });

  it('returns partial for records missing required fields', () => {
    const records = [
      createGameRecord(),
      { gameId: 'game-2', homeTeam: 'Team C' }, // Missing awayTeam and status
    ];
    const rule: SemanticRule = {
      datasetId: 'test-games',
      description: 'Test games',
      minRecordCount: 1,
      requiredFields: ['gameId', 'homeTeam', 'awayTeam', 'status'],
    };

    const result = validateDataset('test-games', records, rule);

    expect(result.status).toBe('partial');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('missing required fields'))).toBe(true);
  });

  it('returns invalid for record count below minimum', () => {
    const records = [createGameRecord()];
    const rule: SemanticRule = {
      datasetId: 'test-rankings',
      description: 'Test rankings',
      minRecordCount: 25,
      requiredFields: ['gameId'],
    };

    const result = validateDataset('test-rankings', records, rule);

    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(true);
  });

  it('returns invalid when no rule exists for unknown dataset', () => {
    const result = validateDataset('unknown-dataset', [{ id: 1 }]);

    expect(result.status).toBe('invalid');
    expect(result.errors[0]).toContain('No semantic rule defined');
  });
});

describe('getRule', () => {
  it('returns rule for known dataset', () => {
    const rule = getRule('cbb-games-live');

    expect(rule).toBeDefined();
    expect(rule?.datasetId).toBe('cbb-games-live');
    expect(rule?.minRecordCount).toBe(1);
    expect(rule?.allowsEmptyWhenOffSeason).toBe(true);
  });

  it('returns undefined for unknown dataset', () => {
    const rule = getRule('nonexistent-dataset');

    expect(rule).toBeUndefined();
  });

  it('defines CFB rankings with correct season bounds', () => {
    const cfbAP = getRule('cfb-rankings-ap');
    const cfbCFP = getRule('cfb-rankings-cfp');

    expect(cfbAP?.seasonMonths).toEqual({ start: 8, end: 1 }); // Aug-Jan
    expect(cfbAP?.minRecordCount).toBe(25);

    expect(cfbCFP?.seasonMonths).toEqual({ start: 10, end: 1 }); // Oct-Jan
    expect(cfbCFP?.minRecordCount).toBe(25);
  });
});
