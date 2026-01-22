import { describe, it, expect } from 'vitest';
import {
  hasKVSafetyMetadata,
  isLegacyCachedData,
  parseKVValue,
  createKVSafetyMetadata,
  wrapWithSafetyMetadata,
  getAgeSeconds,
  isStale,
  type KVSafeData,
  type KVSafetyMetadata,
} from '../kv-safety';

describe('hasKVSafetyMetadata', () => {
  it('returns true for valid KVSafeData', () => {
    const validData: KVSafeData<{ id: number }> = {
      data: [{ id: 1 }],
      meta: {
        httpStatusAtWrite: 200,
        lifecycleState: 'live',
        recordCount: 1,
        ingestedAt: '2025-01-22T12:00:00Z',
        validationStatus: 'valid',
        datasetId: 'test-dataset',
        expectedMinCount: 1,
      },
    };

    expect(hasKVSafetyMetadata(validData)).toBe(true);
  });

  it('returns false for legacy format', () => {
    const legacyData = {
      data: [{ id: 1 }],
      cachedAt: '2025-01-22T12:00:00Z',
      source: 'api',
    };

    expect(hasKVSafetyMetadata(legacyData)).toBe(false);
  });

  it('returns false for raw array', () => {
    expect(hasKVSafetyMetadata([{ id: 1 }])).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasKVSafetyMetadata(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(hasKVSafetyMetadata(undefined)).toBe(false);
  });

  it('returns false for object missing meta fields', () => {
    const partial = {
      data: [{ id: 1 }],
      meta: {
        httpStatusAtWrite: 200,
        // Missing other required fields
      },
    };

    expect(hasKVSafetyMetadata(partial)).toBe(false);
  });

  it('returns false for object with wrong meta types', () => {
    const wrongTypes = {
      data: [{ id: 1 }],
      meta: {
        httpStatusAtWrite: '200', // Should be number
        lifecycleState: 'live',
        recordCount: 1,
        ingestedAt: '2025-01-22T12:00:00Z',
        validationStatus: 'valid',
        datasetId: 'test-dataset',
        expectedMinCount: 1,
      },
    };

    expect(hasKVSafetyMetadata(wrongTypes)).toBe(false);
  });
});

describe('isLegacyCachedData', () => {
  it('returns true for legacy CachedData format', () => {
    const legacyData = {
      data: [{ id: 1 }, { id: 2 }],
      cachedAt: '2025-01-22T12:00:00Z',
      source: 'highlightly',
    };

    expect(isLegacyCachedData(legacyData)).toBe(true);
  });

  it('returns false for new KVSafeData format', () => {
    const newFormat = {
      data: [{ id: 1 }],
      meta: {
        httpStatusAtWrite: 200,
        lifecycleState: 'live',
        recordCount: 1,
        ingestedAt: '2025-01-22T12:00:00Z',
        validationStatus: 'valid',
        datasetId: 'test-dataset',
        expectedMinCount: 1,
      },
    };

    expect(isLegacyCachedData(newFormat)).toBe(false);
  });

  it('returns false for raw array', () => {
    expect(isLegacyCachedData([{ id: 1 }])).toBe(false);
  });

  it('returns false for null', () => {
    expect(isLegacyCachedData(null)).toBe(false);
  });
});

describe('parseKVValue', () => {
  it('parses new format with metadata', () => {
    const newFormat: KVSafeData<{ id: number }> = {
      data: [{ id: 1 }],
      meta: {
        httpStatusAtWrite: 200,
        lifecycleState: 'live',
        recordCount: 1,
        ingestedAt: '2025-01-22T12:00:00Z',
        validationStatus: 'valid',
        datasetId: 'test-dataset',
        expectedMinCount: 1,
      },
    };
    const raw = JSON.stringify(newFormat);

    const result = parseKVValue<{ id: number }>(raw);

    expect(result).not.toBeNull();
    expect(result?.data).toEqual([{ id: 1 }]);
    expect(result?.meta).toBeDefined();
    expect(result?.meta?.httpStatusAtWrite).toBe(200);
    expect(result?.isLegacy).toBe(false);
  });

  it('parses legacy CachedData format', () => {
    const legacyFormat = {
      data: [{ id: 1 }, { id: 2 }],
      cachedAt: '2025-01-22T12:00:00Z',
      source: 'api',
    };
    const raw = JSON.stringify(legacyFormat);

    const result = parseKVValue<{ id: number }>(raw);

    expect(result).not.toBeNull();
    expect(result?.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result?.meta).toBeNull();
    expect(result?.isLegacy).toBe(true);
  });

  it('parses raw array format', () => {
    const rawArray = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const raw = JSON.stringify(rawArray);

    const result = parseKVValue<{ id: number }>(raw);

    expect(result).not.toBeNull();
    expect(result?.data).toEqual(rawArray);
    expect(result?.meta).toBeNull();
    expect(result?.isLegacy).toBe(true);
  });

  it('returns null for invalid JSON', () => {
    const result = parseKVValue('not valid json {');

    expect(result).toBeNull();
  });

  it('returns null for null input', () => {
    const result = parseKVValue(null);

    expect(result).toBeNull();
  });

  it('returns null for non-array/non-object values', () => {
    expect(parseKVValue('"just a string"')).toBeNull();
    expect(parseKVValue('123')).toBeNull();
    expect(parseKVValue('true')).toBeNull();
  });
});

describe('createKVSafetyMetadata', () => {
  it('creates metadata with current timestamp', () => {
    const before = new Date().toISOString();

    const meta = createKVSafetyMetadata({
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 10,
      validationStatus: 'valid',
      datasetId: 'test-dataset',
      expectedMinCount: 1,
    });

    const after = new Date().toISOString();

    expect(meta.httpStatusAtWrite).toBe(200);
    expect(meta.lifecycleState).toBe('live');
    expect(meta.recordCount).toBe(10);
    expect(meta.validationStatus).toBe('valid');
    expect(meta.datasetId).toBe('test-dataset');
    expect(meta.expectedMinCount).toBe(1);
    expect(meta.ingestedAt >= before).toBe(true);
    expect(meta.ingestedAt <= after).toBe(true);
  });
});

describe('wrapWithSafetyMetadata', () => {
  it('wraps data with metadata', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const meta: KVSafetyMetadata = {
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 2,
      ingestedAt: '2025-01-22T12:00:00Z',
      validationStatus: 'valid',
      datasetId: 'test-dataset',
      expectedMinCount: 1,
    };

    const wrapped = wrapWithSafetyMetadata(data, meta);

    expect(wrapped.data).toBe(data);
    expect(wrapped.meta).toBe(meta);
    expect(hasKVSafetyMetadata(wrapped)).toBe(true);
  });
});

describe('getAgeSeconds', () => {
  it('calculates age correctly', () => {
    const meta: KVSafetyMetadata = {
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 1,
      ingestedAt: new Date(Date.now() - 60000).toISOString(), // 60 seconds ago
      validationStatus: 'valid',
      datasetId: 'test-dataset',
      expectedMinCount: 1,
    };

    const age = getAgeSeconds(meta);

    expect(age).toBeGreaterThanOrEqual(59);
    expect(age).toBeLessThanOrEqual(61);
  });
});

describe('isStale', () => {
  it('returns true when age exceeds max', () => {
    const meta: KVSafetyMetadata = {
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 1,
      ingestedAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      validationStatus: 'valid',
      datasetId: 'test-dataset',
      expectedMinCount: 1,
    };

    expect(isStale(meta, 300)).toBe(true); // 5 minute max
  });

  it('returns false when age is within max', () => {
    const meta: KVSafetyMetadata = {
      httpStatusAtWrite: 200,
      lifecycleState: 'live',
      recordCount: 1,
      ingestedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      validationStatus: 'valid',
      datasetId: 'test-dataset',
      expectedMinCount: 1,
    };

    expect(isStale(meta, 300)).toBe(false); // 5 minute max
  });
});
