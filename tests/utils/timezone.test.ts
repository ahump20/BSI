import { describe, expect, it, vi } from 'vitest';
import {
  BSI_TIMEZONE,
  formatDateInTimezone,
  formatGameTime,
  formatInTimezone,
  formatScheduleDate,
  formatTimestamp,
  getRelativeTime,
  getTimezoneAbbr,
  getTimezoneLabel,
  isValidTimezone,
} from '@/lib/utils/timezone';

describe('BSI_TIMEZONE constant', () => {
  it('is America/Chicago', () => {
    expect(BSI_TIMEZONE).toBe('America/Chicago');
  });
});

describe('isValidTimezone', () => {
  it('returns true for valid IANA timezones', () => {
    expect(isValidTimezone('America/Chicago')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
  });

  it('returns false for invalid timezone strings', () => {
    expect(isValidTimezone('Not/A/Timezone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone('UTC+5')).toBe(false);
  });
});

describe('getTimezoneLabel', () => {
  it('returns the human-readable label for known timezones', () => {
    expect(getTimezoneLabel('America/Chicago')).toBe('Central Time (CT)');
    expect(getTimezoneLabel('America/New_York')).toBe('Eastern Time (ET)');
    expect(getTimezoneLabel('America/Los_Angeles')).toBe('Pacific Time (PT)');
  });

  it('returns the raw timezone string for unknown timezones', () => {
    expect(getTimezoneLabel('America/Bogota')).toBe('America/Bogota');
  });
});

describe('getTimezoneAbbr', () => {
  it('returns the known abbreviation for listed timezones', () => {
    expect(getTimezoneAbbr('America/Chicago')).toBe('CT');
    expect(getTimezoneAbbr('America/New_York')).toBe('ET');
    expect(getTimezoneAbbr('America/Los_Angeles')).toBe('PT');
  });

  it('returns a non-empty string for unknown but valid timezones', () => {
    const abbr = getTimezoneAbbr('America/Bogota');
    expect(typeof abbr).toBe('string');
    expect(abbr.length).toBeGreaterThan(0);
  });
});

describe('formatInTimezone', () => {
  const isoDate = '2026-07-04T19:05:00Z';

  it('returns "Invalid date" for an unparseable string', () => {
    expect(formatInTimezone('not-a-date')).toBe('Invalid date');
  });

  it('accepts a Date object', () => {
    const date = new Date(isoDate);
    const result = formatInTimezone(date, { timezone: 'America/Chicago', includeTimezone: false });
    expect(result).toContain('2026');
  });

  it('includes the year in medium format', () => {
    const result = formatInTimezone(isoDate, { timezone: 'America/Chicago', includeTimezone: false });
    expect(result).toContain('2026');
  });

  it('can render date-only (no time)', () => {
    const result = formatInTimezone(isoDate, {
      timezone: 'America/Chicago',
      includeTime: false,
      includeTimezone: false,
    });
    expect(result).not.toMatch(/\d:\d\d/); // no time portion
    expect(result).toContain('Jul');
  });

  it('can render time-only (no date)', () => {
    const result = formatInTimezone(isoDate, {
      timezone: 'America/Chicago',
      includeDate: false,
      includeTimezone: false,
    });
    // Should contain a time but no month name or year
    expect(result).toMatch(/\d+:\d\d/);
    expect(result).not.toContain('2026');
  });
});

describe('formatDateInTimezone', () => {
  it('returns a date string without time', () => {
    const result = formatDateInTimezone('2026-07-04T19:05:00Z', 'America/Chicago');
    expect(result).toContain('Jul');
    expect(result).toContain('2026');
    expect(result).not.toMatch(/\d:\d\d/);
  });
});

describe('formatGameTime', () => {
  it('returns "TBD" for an invalid date', () => {
    expect(formatGameTime('invalid')).toBe('TBD');
  });

  it('returns a string with time and timezone abbreviation for valid input', () => {
    const result = formatGameTime('2026-07-04T19:05:00Z', 'America/Chicago');
    expect(result).toMatch(/\d+:\d\d/);
    expect(result).toMatch(/CT|CDT|CST/);
  });

  it('accepts Date objects', () => {
    const result = formatGameTime(new Date('2026-07-04T19:05:00Z'), 'America/Chicago');
    expect(result).not.toBe('TBD');
  });
});

describe('formatTimestamp', () => {
  it('formats a valid ISO string with " CT" suffix', () => {
    const result = formatTimestamp('2026-07-04T14:00:00Z');
    expect(result.endsWith(' CT')).toBe(true);
    expect(result).toContain('2026');
  });

  it('formats the current time when no argument is provided', () => {
    const result = formatTimestamp();
    expect(result.endsWith(' CT')).toBe(true);
  });

  it('returns empty string for empty string input', () => {
    expect(formatTimestamp('')).toBe('');
  });

  it('returns "Invalid date" for a non-parseable string', () => {
    expect(formatTimestamp('garbage')).toBe('Invalid date');
  });
});

describe('formatScheduleDate', () => {
  it('formats a YYYY-MM-DD string as a short weekday date', () => {
    const result = formatScheduleDate('2026-07-04');
    // Should contain a weekday, month, and day
    expect(result).toMatch(/[A-Z][a-z]+/); // e.g. "Sat" or "Jul"
    expect(result).toContain('4');
  });

  it('formats an ISO datetime string', () => {
    const result = formatScheduleDate('2026-07-04T12:00:00');
    expect(result).toContain('4');
  });
});

describe('getRelativeTime', () => {
  it('returns "now" for a date within the current minute', () => {
    const now = new Date();
    expect(getRelativeTime(now)).toBe('now');
  });

  it('returns "in X min" for a date in the near future', () => {
    const future = new Date(Date.now() + 10 * 60_000); // 10 minutes from now
    const result = getRelativeTime(future);
    expect(result).toMatch(/in \d+ min/);
  });

  it('returns "X min ago" for a date in the recent past', () => {
    const past = new Date(Date.now() - 10 * 60_000); // 10 minutes ago
    const result = getRelativeTime(past);
    expect(result).toMatch(/\d+ min ago/);
  });

  it('returns "in Xh" for a date several hours in the future', () => {
    const future = new Date(Date.now() + 5 * 3_600_000); // 5 hours from now
    const result = getRelativeTime(future);
    expect(result).toMatch(/in \d+h/);
  });

  it('returns "Xh ago" for a date several hours in the past', () => {
    const past = new Date(Date.now() - 5 * 3_600_000); // 5 hours ago
    const result = getRelativeTime(past);
    expect(result).toMatch(/\d+h ago/);
  });

  it('returns "tomorrow" for a date ~24h in the future', () => {
    // Pin to noon to avoid midnight boundary edge-cases
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
    const future = new Date('2026-07-16T13:00:00Z'); // exactly 25h later
    expect(getRelativeTime(future)).toBe('tomorrow');
    vi.useRealTimers();
  });

  it('returns "yesterday" for a date ~24h in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
    const past = new Date('2026-07-14T11:00:00Z'); // exactly 25h earlier
    expect(getRelativeTime(past)).toBe('yesterday');
    vi.useRealTimers();
  });

  it('returns a formatted date string for dates more than 7 days away', () => {
    const future = new Date(Date.now() + 10 * 86_400_000); // 10 days from now
    const result = getRelativeTime(future);
    // Falls back to formatDateInTimezone 'short' which gives M/D format
    expect(result).toMatch(/\d+\/\d+/);
  });
});
