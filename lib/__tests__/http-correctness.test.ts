import { describe, it, expect } from 'vitest';
import {
  mapToHTTPStatus,
  determineLifecycleState,
  isCacheEligible,
  type HTTPMappingInput,
} from '../http-correctness';
import type { ValidationResult, SemanticRule } from '../semantic-validation';
import type { KVSafetyMetadata } from '../kv-safety';

const createRule = (overrides: Partial<SemanticRule> = {}): SemanticRule => ({
  datasetId: 'test-dataset',
  description: 'Test dataset',
  minRecordCount: 1,
  allowsEmptyWhenOffSeason: true,
  ...overrides,
});

const createValidationResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  status: 'valid',
  datasetId: 'test-dataset',
  recordCount: 10,
  errors: [],
  warnings: [],
  rule: createRule(),
  isOffSeason: false,
  ...overrides,
});

describe('mapToHTTPStatus', () => {
  it('returns 200 when valid + live + meets minCount', () => {
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({ status: 'valid', recordCount: 10 }),
      lifecycleState: 'live',
      recordCount: 10,
      rule: createRule({ minRecordCount: 1 }),
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(200);
    expect(result.cacheEligible).toBe(true);
    expect(result.cacheControl).toContain('public, max-age=300');
    expect(result.reason).toContain('Valid data');
  });

  it('returns 202 when lifecycle is initializing', () => {
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({ status: 'empty', recordCount: 0 }),
      lifecycleState: 'initializing',
      recordCount: 0,
      rule: createRule(),
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(202);
    expect(result.cacheEligible).toBe(false);
    expect(result.cacheControl).toBe('no-store');
    expect(result.reason).toContain('First ingestion pending');
  });

  it('returns 204 when empty + off-season + allowsEmptyWhenOffSeason', () => {
    const rule = createRule({ allowsEmptyWhenOffSeason: true });
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({
        status: 'empty',
        recordCount: 0,
        isOffSeason: true,
        rule,
      }),
      lifecycleState: 'empty_valid',
      recordCount: 0,
      rule,
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(204);
    expect(result.cacheEligible).toBe(false);
    expect(result.cacheControl).toBe('no-store');
  });

  it('returns 503 when validation fails', () => {
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({
        status: 'invalid',
        errors: ['Missing required fields'],
      }),
      lifecycleState: 'unavailable',
      recordCount: 0,
      rule: createRule(),
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(503);
    expect(result.cacheEligible).toBe(false);
    expect(result.cacheControl).toBe('no-store');
    expect(result.reason).toContain('Validation failed');
  });

  it('returns 503 when lifecycle is stale', () => {
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({ status: 'partial' }),
      lifecycleState: 'stale',
      recordCount: 5,
      rule: createRule(),
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(503);
    expect(result.cacheEligible).toBe(false);
    expect(result.reason).toContain('stale');
  });

  it('returns 503 when lifecycle is unavailable', () => {
    const input: HTTPMappingInput = {
      validationResult: createValidationResult({
        status: 'invalid',
        errors: [],
      }),
      lifecycleState: 'unavailable',
      recordCount: 0,
      rule: createRule(),
    };

    const result = mapToHTTPStatus(input);

    expect(result.httpStatus).toBe(503);
    expect(result.cacheEligible).toBe(false);
  });
});

describe('determineLifecycleState', () => {
  it('returns initializing for first ingestion with no data', () => {
    const validationResult = createValidationResult({ status: 'empty', recordCount: 0 });

    const result = determineLifecycleState(validationResult, false, true);

    expect(result).toBe('initializing');
  });

  it('returns live when validation passes', () => {
    const validationResult = createValidationResult({ status: 'valid', recordCount: 10 });

    const result = determineLifecycleState(validationResult, true, false);

    expect(result).toBe('live');
  });

  it('returns empty_valid for off-season empty dataset', () => {
    const rule = createRule({ allowsEmptyWhenOffSeason: true });
    const validationResult = createValidationResult({
      status: 'empty',
      recordCount: 0,
      isOffSeason: true,
      rule,
    });

    const result = determineLifecycleState(validationResult, false, false);

    expect(result).toBe('empty_valid');
  });

  it('returns stale when has data but validation fails', () => {
    const validationResult = createValidationResult({
      status: 'partial',
      recordCount: 5,
      errors: ['Missing fields'],
    });

    const result = determineLifecycleState(validationResult, true, false);

    expect(result).toBe('stale');
  });

  it('returns unavailable when no data and expected', () => {
    const rule = createRule({ allowsEmptyWhenOffSeason: false });
    const validationResult = createValidationResult({
      status: 'invalid',
      recordCount: 0,
      isOffSeason: false,
      rule,
    });

    const result = determineLifecycleState(validationResult, false, false);

    expect(result).toBe('unavailable');
  });
});

describe('isCacheEligible', () => {
  const createMeta = (overrides: Partial<KVSafetyMetadata> = {}): KVSafetyMetadata => ({
    httpStatusAtWrite: 200,
    lifecycleState: 'live',
    recordCount: 10,
    ingestedAt: new Date().toISOString(),
    validationStatus: 'valid',
    datasetId: 'test-dataset',
    expectedMinCount: 1,
    ...overrides,
  });

  it('returns true only for 200 + live + meets threshold', () => {
    const meta = createMeta({
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 10,
      expectedMinCount: 1,
    });

    expect(isCacheEligible(meta)).toBe(true);
  });

  it('returns false for any non-200 status', () => {
    const meta202 = createMeta({ httpStatusAtWrite: 202 });
    const meta204 = createMeta({ httpStatusAtWrite: 204 });
    const meta503 = createMeta({ httpStatusAtWrite: 503 });

    expect(isCacheEligible(meta202)).toBe(false);
    expect(isCacheEligible(meta204)).toBe(false);
    expect(isCacheEligible(meta503)).toBe(false);
  });

  it('returns false for non-live lifecycle state', () => {
    const metaStale = createMeta({ lifecycleState: 'stale' });
    const metaInit = createMeta({ lifecycleState: 'initializing' });
    const metaUnavail = createMeta({ lifecycleState: 'unavailable' });

    expect(isCacheEligible(metaStale)).toBe(false);
    expect(isCacheEligible(metaInit)).toBe(false);
    expect(isCacheEligible(metaUnavail)).toBe(false);
  });

  it('returns false when record count below threshold', () => {
    const meta = createMeta({
      recordCount: 5,
      expectedMinCount: 10,
    });

    expect(isCacheEligible(meta)).toBe(false);
  });
});
