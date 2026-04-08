import { describe, expect, it } from 'vitest';
import { getPeriodLabel, getQuarterLabel, getTeamLogo } from '@/lib/utils/game-helpers';

describe('getTeamLogo', () => {
  it('returns null for undefined input', () => {
    expect(getTeamLogo(undefined)).toBeNull();
  });

  it('returns null when no logos are present', () => {
    expect(getTeamLogo({ team: {} })).toBeNull();
    expect(getTeamLogo({ team: { logos: [] } })).toBeNull();
  });

  it('returns the first logos[].href when available', () => {
    const competitor = {
      team: { logos: [{ href: 'https://cdn.espn.com/team1.png' }] },
    };
    expect(getTeamLogo(competitor)).toBe('https://cdn.espn.com/team1.png');
  });

  it('falls back to team.logo when logos array is absent', () => {
    const competitor = { team: { logo: 'https://cdn.espn.com/fallback.png' } };
    expect(getTeamLogo(competitor)).toBe('https://cdn.espn.com/fallback.png');
  });

  it('prefers logos[].href over team.logo', () => {
    const competitor = {
      team: {
        logos: [{ href: 'https://cdn.espn.com/primary.png' }],
        logo: 'https://cdn.espn.com/secondary.png',
      },
    };
    expect(getTeamLogo(competitor)).toBe('https://cdn.espn.com/primary.png');
  });
});

describe('getPeriodLabel', () => {
  it('returns Q1 for index 0', () => {
    expect(getPeriodLabel(0)).toBe('Q1');
  });

  it('returns Q4 for index 3', () => {
    expect(getPeriodLabel(3)).toBe('Q4');
  });

  it('returns OT1 for index 4', () => {
    expect(getPeriodLabel(4)).toBe('OT1');
  });

  it('returns OT2 for index 5', () => {
    expect(getPeriodLabel(5)).toBe('OT2');
  });

  it('returns OT3 for index 6', () => {
    expect(getPeriodLabel(6)).toBe('OT3');
  });
});

describe('getQuarterLabel', () => {
  it('labels quarters 1-4 as "Quarter N"', () => {
    expect(getQuarterLabel(1)).toBe('Quarter 1');
    expect(getQuarterLabel(2)).toBe('Quarter 2');
    expect(getQuarterLabel(3)).toBe('Quarter 3');
    expect(getQuarterLabel(4)).toBe('Quarter 4');
  });

  it('returns OT1 for period 5', () => {
    expect(getQuarterLabel(5)).toBe('OT1');
  });

  it('returns OT2 for period 6', () => {
    expect(getQuarterLabel(6)).toBe('OT2');
  });
});
