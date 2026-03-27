import { describe, expect, it } from 'vitest';

import {
  advanceBasesForHit,
  advanceBasesForWalk,
  advanceGameStateForPlate,
  buildTeamGameplayProfile,
  computeCoinReward,
  computeRankedScore,
  computeTargetRuns,
  createInitialGameState,
  evaluateSwingContact,
} from '../../games/sandlot-sluggers/src/core.js';

function makeRatings(overrides: Partial<Record<string, number>> = {}) {
  return {
    contactRating: overrides.contactRating ?? 82,
    powerRating: overrides.powerRating ?? 78,
    disciplineRating: overrides.disciplineRating ?? 74,
    speedRating: overrides.speedRating ?? 62,
  };
}

function makeTeamPayload() {
  return {
    team: {
      id: 'texas',
      name: 'Texas Longhorns',
      abbreviation: 'TEX',
      conference: 'SEC',
      colors: { primary: '#BF5700', secondary: '#FFFFFF' },
      stats: {
        wins: 28,
        losses: 8,
        runsScored: 288,
        runsAllowed: 126,
        battingAvg: 0.313,
        era: 3.18,
      },
      roster: [
        {
          id: 'p1',
          name: 'Lead Off',
          position: 'CF',
          number: '1',
          stats: { avg: 0.325, obp: 0.455, slg: 0.49, ops: 0.945, hr: 4, bb: 28, k: 18, sb: 14, ab: 120, gp: 34 },
        },
        {
          id: 'p2',
          name: 'Table Setter',
          position: 'SS',
          number: '2',
          stats: { avg: 0.318, obp: 0.441, slg: 0.48, ops: 0.921, hr: 3, bb: 25, k: 19, sb: 12, ab: 118, gp: 34 },
        },
        {
          id: 'p3',
          name: 'Three Hole',
          position: 'LF',
          number: '3',
          stats: { avg: 0.332, obp: 0.42, slg: 0.59, ops: 1.01, hr: 11, bb: 19, k: 24, sb: 4, ab: 122, gp: 34 },
        },
        {
          id: 'p4',
          name: 'Cleanup',
          position: '1B',
          number: '4',
          stats: { avg: 0.305, obp: 0.395, slg: 0.64, ops: 1.035, hr: 16, bb: 18, k: 29, sb: 1, ab: 119, gp: 33 },
        },
        {
          id: 'p5',
          name: 'Gap Power',
          position: 'RF',
          number: '5',
          stats: { avg: 0.287, obp: 0.372, slg: 0.565, ops: 0.937, hr: 9, bb: 15, k: 31, sb: 3, ab: 115, gp: 33 },
        },
        {
          id: 'p6',
          name: 'Line Drive',
          position: '3B',
          number: '6',
          stats: { avg: 0.294, obp: 0.36, slg: 0.52, ops: 0.88, hr: 7, bb: 13, k: 27, sb: 5, ab: 111, gp: 32 },
        },
        {
          id: 'p7',
          name: 'Backstop',
          position: 'C',
          number: '7',
          stats: { avg: 0.268, obp: 0.349, slg: 0.43, ops: 0.779, hr: 5, bb: 14, k: 26, sb: 0, ab: 108, gp: 31 },
        },
        {
          id: 'p8',
          name: 'Glue Guy',
          position: '2B',
          number: '8',
          stats: { avg: 0.281, obp: 0.338, slg: 0.401, ops: 0.739, hr: 2, bb: 10, k: 22, sb: 6, ab: 107, gp: 32 },
        },
        {
          id: 'p9',
          name: 'Nine Hole',
          position: 'DH',
          number: '9',
          stats: { avg: 0.259, obp: 0.331, slg: 0.389, ops: 0.72, hr: 2, bb: 9, k: 24, sb: 4, ab: 102, gp: 31 },
        },
        {
          id: 'pitcher-1',
          name: 'Friday Starter',
          position: 'P',
          number: '14',
          stats: { avg: 0, obp: 0, slg: 0, ops: 0, hr: 0, bb: 0, k: 0, sb: 0, ab: 0, gp: 12 },
        },
      ],
    },
  };
}

describe('Sandlot Sluggers core loop math', () => {
  it('resolves the contact tiers the at-bat plan calls for', () => {
    const perfect = evaluateSwingContact({
      swingTimeMs: 1000,
      strikeTimeMs: 1000,
      contactPoint: { x: 0, z: 0.8 },
      isInZone: true,
      hitterRatings: makeRatings({ contactRating: 90, disciplineRating: 86, powerRating: 88 }),
      pitchSpeedMph: 91,
      difficulty: 'medium',
    });
    const solid = evaluateSwingContact({
      swingTimeMs: 1022,
      strikeTimeMs: 1000,
      contactPoint: { x: 0.03, z: 0.82 },
      isInZone: true,
      hitterRatings: makeRatings(),
      pitchSpeedMph: 89,
      difficulty: 'medium',
    });
    const weak = evaluateSwingContact({
      swingTimeMs: 1050,
      strikeTimeMs: 1000,
      contactPoint: { x: 0.12, z: 0.8 },
      isInZone: true,
      hitterRatings: makeRatings({ contactRating: 55, disciplineRating: 54, powerRating: 55 }),
      pitchSpeedMph: 88,
      difficulty: 'medium',
    });
    const foul = evaluateSwingContact({
      swingTimeMs: 1074,
      strikeTimeMs: 1000,
      contactPoint: { x: 0, z: 0.8 },
      isInZone: true,
      hitterRatings: makeRatings(),
      pitchSpeedMph: 88,
      difficulty: 'medium',
    });
    const whiff = evaluateSwingContact({
      swingTimeMs: 1210,
      strikeTimeMs: 1000,
      contactPoint: { x: 0.3, z: 1.2 },
      isInZone: false,
      hitterRatings: makeRatings(),
      pitchSpeedMph: 88,
      difficulty: 'medium',
    });

    expect(perfect.tier).toBe('perfect');
    expect(solid.tier).toBe('solid');
    expect(weak.tier).toBe('weak');
    expect(foul.tier).toBe('foul');
    expect(whiff.tier).toBe('whiff');
  });

  it('pushes early contact down and late contact up in launch angle', () => {
    const early = evaluateSwingContact({
      swingTimeMs: 955,
      strikeTimeMs: 1000,
      contactPoint: { x: 0, z: 0.8 },
      isInZone: true,
      hitterRatings: makeRatings(),
      pitchSpeedMph: 90,
      difficulty: 'medium',
    });
    const late = evaluateSwingContact({
      swingTimeMs: 1045,
      strikeTimeMs: 1000,
      contactPoint: { x: 0, z: 0.8 },
      isInZone: true,
      hitterRatings: makeRatings(),
      pitchSpeedMph: 90,
      difficulty: 'medium',
    });

    expect(early.launchAngleDeg).toBeLessThan(late.launchAngleDeg);
    expect(early.sprayAngleDeg).toBeLessThan(0);
    expect(late.sprayAngleDeg).toBeGreaterThan(0);
  });
});

describe('Sandlot Sluggers base advancement', () => {
  it('scores the runner from second on a solid single and holds the runner from first at third', () => {
    const result = advanceBasesForHit([true, true, false], 'single', 'solid');
    expect(result.runs).toBe(1);
    expect(result.bases).toEqual([true, false, true]);
  });

  it('moves a weak-contact double into second-and-third with no run from first', () => {
    const result = advanceBasesForHit([true, false, false], 'double', 'weak');
    expect(result.runs).toBe(0);
    expect(result.bases).toEqual([false, true, true]);
  });

  it('forces in a run on a walk with the bases loaded', () => {
    const result = advanceBasesForWalk([true, true, true]);
    expect(result.runs).toBe(1);
    expect(result.bases).toEqual([true, true, true]);
  });

  it('converts a solid-contact sac fly with a runner on third and fewer than two outs', () => {
    const initial = {
      ...createInitialGameState({ mode: 'quickPlay', difficulty: 'medium', targetRuns: 4 }),
      outs: 1,
      bases: [false, false, true],
      stats: {
        ...createInitialGameState({ mode: 'quickPlay' }).stats,
        runs: 2,
        rbis: 1,
      },
    };

    const next = advanceGameStateForPlate(initial, { type: 'sacFly' });

    expect(next.stats.runs).toBe(3);
    expect(next.stats.rbis).toBe(2);
    expect(next.outs).toBe(2);
    expect(next.bases).toEqual([false, false, false]);
  });
});

describe('Sandlot Sluggers session math', () => {
  it('keeps target-run generation deterministic for a fixed seed', () => {
    const first = computeTargetRuns({
      playerPrevention: 72,
      opponentOffense: 78,
      difficulty: 'hard',
      seed: 424242,
    });
    const second = computeTargetRuns({
      playerPrevention: 72,
      opponentOffense: 78,
      difficulty: 'hard',
      seed: 424242,
    });

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(2);
    expect(first).toBeLessThanOrEqual(10);
  });

  it('maps a full college roster into a playable team profile', () => {
    const profile = buildTeamGameplayProfile(makeTeamPayload(), 'texas');

    expect(profile.source).toBe('api');
    expect(profile.team.id).toBe('texas');
    expect(profile.batters).toHaveLength(9);
    expect(profile.pitchMixProfile.length).toBeGreaterThanOrEqual(3);
    expect(profile.contactRating).toBeGreaterThanOrEqual(35);
    expect(profile.contactRating).toBeLessThanOrEqual(90);
    expect(profile.batters[0].name).toBe('Lead Off');
    expect(profile.batters[1].name).toBe('Table Setter');
  });

  it('falls back to team-level ratings when the roster is too thin', () => {
    const profile = buildTeamGameplayProfile(
      {
        team: {
          id: 'thin-roster',
          name: 'Thin Roster U',
          abbreviation: 'TRU',
          conference: 'Sandlot',
          stats: {
            wins: 18,
            losses: 12,
            runsScored: 171,
            runsAllowed: 144,
            battingAvg: 0.281,
            era: 4.42,
          },
          roster: [
            {
              id: 'one',
              name: 'Only Bat',
              position: 'SS',
              stats: { avg: 0.311, obp: 0.39, slg: 0.51, ops: 0.901, hr: 5, bb: 8, k: 12, sb: 3, ab: 24, gp: 11 },
            },
            {
              id: 'two',
              name: 'Second Bat',
              position: 'CF',
              stats: { avg: 0.277, obp: 0.34, slg: 0.41, ops: 0.75, hr: 2, bb: 4, k: 10, sb: 5, ab: 19, gp: 10 },
            },
            {
              id: 'pitcher',
              name: 'Pitcher',
              position: 'P',
              stats: { avg: 0, obp: 0, slg: 0, ops: 0, hr: 0, bb: 0, k: 0, sb: 0, ab: 0, gp: 10 },
            },
          ],
        },
      },
      'thin-roster',
    );

    expect(profile.source).toBe('fallback-team-stats');
    expect(profile.team.id).toBe('thin-roster');
    expect(profile.batters).toHaveLength(9);
    expect(profile.pitchingRating).toBeGreaterThanOrEqual(35);
    expect(profile.pitchingRating).toBeLessThanOrEqual(90);
  });

  it('caps ranked scores at 200 and keeps practice coinless', () => {
    const ranked = computeRankedScore({
      mode: 'teamMode',
      difficulty: 'hard',
      stats: {
        runs: 12,
        rbis: 18,
        hits: 15,
        walks: 4,
        perfectContacts: 6,
        solidContacts: 8,
        strikeouts: 1,
        homeRuns: 5,
        totalHomeRunDistance: 2160,
      },
    });
    const practiceCoins = computeCoinReward({
      finalScore: 180,
      win: true,
      currentDailyStreak: 4,
      mode: 'practice',
    });

    expect(ranked).toBe(200);
    expect(practiceCoins).toBe(0);
  });
});
