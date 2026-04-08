import { describe, expect, it } from 'vitest';
import {
  fmt1,
  fmt2,
  fmt3,
  fmtInt,
  fmtPct,
  normalizeHeight,
  normalizeTeamName,
  normalizeWeight,
} from '@/lib/utils/format';

describe('fmt3', () => {
  it('formats a rate stat with three decimals and strips leading zero', () => {
    expect(fmt3(0.321)).toBe('.321');
    expect(fmt3(0.3)).toBe('.300');
    expect(fmt3(0.1234)).toBe('.123');
  });

  it('formats values >= 1 without stripping anything', () => {
    expect(fmt3(1.0)).toBe('1.000');
    expect(fmt3(1.234)).toBe('1.234');
  });

  it('handles zero', () => {
    expect(fmt3(0)).toBe('.000');
  });
});

describe('fmt1', () => {
  it('returns em-dash for null', () => {
    expect(fmt1(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(fmt1(undefined)).toBe('—');
  });

  it('formats a number to 1 decimal by default', () => {
    expect(fmt1(3.14159)).toBe('3.1');
    expect(fmt1(0)).toBe('0.0');
    expect(fmt1(100)).toBe('100.0');
  });

  it('respects a custom decimal count', () => {
    expect(fmt1(3.14159, 2)).toBe('3.14');
    expect(fmt1(3.14159, 0)).toBe('3');
  });
});

describe('fmt2', () => {
  it('returns em-dash for null', () => {
    expect(fmt2(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(fmt2(undefined)).toBe('—');
  });

  it('formats a number to 2 decimal places', () => {
    expect(fmt2(3.14159)).toBe('3.14');
    expect(fmt2(0)).toBe('0.00');
    expect(fmt2(1.006)).toBe('1.01');
  });
});

describe('fmtPct', () => {
  it('returns em-dash for null', () => {
    expect(fmtPct(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(fmtPct(undefined)).toBe('—');
  });

  it('converts a 0-1 ratio to a percentage string', () => {
    expect(fmtPct(0.312)).toBe('31.2%');
    expect(fmtPct(0)).toBe('0.0%');
    expect(fmtPct(1)).toBe('100.0%');
    expect(fmtPct(0.5)).toBe('50.0%');
  });
});

describe('fmtInt', () => {
  it('returns em-dash for null', () => {
    expect(fmtInt(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(fmtInt(undefined)).toBe('—');
  });

  it('rounds and formats as integer string', () => {
    expect(fmtInt(3.7)).toBe('4');
    expect(fmtInt(3.2)).toBe('3');
    expect(fmtInt(0)).toBe('0');
    expect(fmtInt(100)).toBe('100');
  });
});

describe('normalizeWeight', () => {
  it('returns empty string for null', () => {
    expect(normalizeWeight(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeWeight(undefined)).toBe('');
  });

  it('strips trailing "lbs" with space', () => {
    expect(normalizeWeight('225 lbs')).toBe('225');
  });

  it('strips trailing "lbs" without space', () => {
    expect(normalizeWeight('225lbs')).toBe('225');
  });

  it('strips trailing "lbs." with period', () => {
    expect(normalizeWeight('225 lbs.')).toBe('225');
  });

  it('passes through a plain number string', () => {
    expect(normalizeWeight('225')).toBe('225');
  });

  it('converts a numeric input to string', () => {
    expect(normalizeWeight(225)).toBe('225');
  });

  it('is case-insensitive', () => {
    expect(normalizeWeight('225 LBS')).toBe('225');
  });
});

describe('normalizeHeight', () => {
  it('returns empty string for null', () => {
    expect(normalizeHeight(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeHeight(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeHeight('')).toBe('');
  });

  it('passes through already-formatted feet-inches strings', () => {
    expect(normalizeHeight("6'2\"")).toBe("6'2\"");
    expect(normalizeHeight("5'11\"")).toBe("5'11\"");
  });

  it('passes through dash-separated format', () => {
    expect(normalizeHeight('6-2')).toBe('6-2');
  });

  it('converts integer inches to feet-inches', () => {
    expect(normalizeHeight(74)).toBe("6'2\"");
    expect(normalizeHeight(72)).toBe("6'0\"");
    expect(normalizeHeight(60)).toBe("5'0\"");
    expect(normalizeHeight(71)).toBe("5'11\"");
  });

  it('converts string integer inches to feet-inches', () => {
    expect(normalizeHeight('74')).toBe("6'2\"");
  });

  it('returns the raw value for out-of-range inch values', () => {
    expect(normalizeHeight('47')).toBe('47'); // < 48
    expect(normalizeHeight('97')).toBe('97'); // > 96
  });
});

describe('normalizeTeamName', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeTeamName('Texas Longhorns')).toBe('texaslonghorns');
    expect(normalizeTeamName('LSU Tigers')).toBe('lsutigers');
    expect(normalizeTeamName("St. John's Red Storm")).toBe('stjohnsredstorm');
  });

  it('handles already-normalized input', () => {
    expect(normalizeTeamName('texaslonghorns')).toBe('texaslonghorns');
  });

  it('strips leading/trailing spaces', () => {
    expect(normalizeTeamName(' Texas ')).toBe('texas');
  });
});
