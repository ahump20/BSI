import { describe, expect, it, vi } from 'vitest';
import {
  getAgeMinutes,
  getCompactAge,
  getExactAge,
  getFreshnessLevel,
  getRelativeUpdateLabel,
} from '@/lib/utils/data-freshness';

describe('data-freshness utils', () => {
  it('computes age buckets and compact labels consistently', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00Z'));

    expect(getAgeMinutes('2026-02-25T11:59:30Z')).toBe(0);
    expect(getFreshnessLevel(getAgeMinutes('2026-02-25T11:59:30Z'))).toBe('fresh');
    expect(getCompactAge('2026-02-25T11:57:00Z')).toBe('3m ago');
    expect(getFreshnessLevel(getAgeMinutes('2026-02-25T11:57:00Z'))).toBe('degraded');
    expect(getCompactAge('2026-02-25T10:00:00Z')).toBe('2h ago');
    expect(getFreshnessLevel(getAgeMinutes('2026-02-25T10:00:00Z'))).toBe('stale');

    vi.useRealTimers();
  });

  it('returns human-readable relative labels for attribution surfaces', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00Z'));

    expect(getRelativeUpdateLabel('2026-02-25T11:59:50Z')).toBe('Updated 10s ago');
    expect(getRelativeUpdateLabel('2026-02-25T11:58:00Z')).toBe('Updated 2m ago');
    expect(getRelativeUpdateLabel('2026-02-25T10:00:00Z')).toBe('Updated 2h ago');
    expect(getExactAge('2026-02-25T11:30:00Z')).toBe('30m ago');

    vi.useRealTimers();
  });
});

