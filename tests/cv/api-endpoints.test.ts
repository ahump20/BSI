import { describe, it, expect } from 'vitest';
import type { CVApiResponse, PitcherBiomechanics } from '@lib/cv/types';
import {
  calcVelocityDelta,
  calcReleasePointDrift,
  pitchesToBiomechanics,
  highlightlyToBiomechanics,
} from '@lib/cv/statcast-adapter';
import type { PitchRecord } from '@lib/cv/statcast-adapter';

// ---------------------------------------------------------------------------
// CVApiResponse structure validation
// ---------------------------------------------------------------------------

describe('CVApiResponse format', () => {
  it('matches the expected wrapper shape', () => {
    const response: CVApiResponse<string> = {
      data: 'test',
      meta: {
        source: 'cv-test',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
        cache_hit: false,
      },
    };

    expect(response.data).toBe('test');
    expect(response.meta.timezone).toBe('America/Chicago');
    expect(response.meta.source).toBe('cv-test');
    expect(typeof response.meta.fetched_at).toBe('string');
    expect(typeof response.meta.cache_hit).toBe('boolean');
  });

  it('wraps null data correctly for 404 responses', () => {
    const response: CVApiResponse<PitcherBiomechanics | null> = {
      data: null,
      meta: {
        source: 'cv-d1',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
        cache_hit: false,
      },
    };

    expect(response.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Statcast Adapter — velocity delta calculation
// ---------------------------------------------------------------------------

describe('calcVelocityDelta', () => {
  it('returns zeros for empty pitch array', () => {
    const result = calcVelocityDelta([]);
    expect(result.velocityStart).toBe(0);
    expect(result.velocityCurrent).toBe(0);
    expect(result.velocityDelta).toBe(0);
  });

  it('calculates velocity drop across innings', () => {
    const pitches: PitchRecord[] = [
      { inning: 1, velocity: 95.0 },
      { inning: 1, velocity: 94.5 },
      { inning: 1, velocity: 95.5 },
      { inning: 5, velocity: 92.0 },
      { inning: 5, velocity: 91.5 },
      { inning: 5, velocity: 92.5 },
    ];
    const result = calcVelocityDelta(pitches);
    expect(result.velocityStart).toBeCloseTo(95.0, 0);
    expect(result.velocityCurrent).toBeCloseTo(92.0, 0);
    expect(result.velocityDelta).toBeLessThan(0);
  });

  it('shows positive delta when velocity increases', () => {
    const pitches: PitchRecord[] = [
      { inning: 1, velocity: 90.0 },
      { inning: 3, velocity: 93.0 },
    ];
    const result = calcVelocityDelta(pitches);
    expect(result.velocityDelta).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Statcast Adapter — release point drift
// ---------------------------------------------------------------------------

describe('calcReleasePointDrift', () => {
  it('returns 0 when fewer than 5 pitches have release data', () => {
    const pitches: PitchRecord[] = [
      { inning: 1, velocity: 94, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 1, velocity: 93, releaseX: 2.1, releaseZ: 6.1 },
    ];
    expect(calcReleasePointDrift(pitches)).toBe(0);
  });

  it('returns low drift for consistent release points', () => {
    const pitches: PitchRecord[] = Array.from({ length: 20 }, (_, i) => ({
      inning: Math.floor(i / 5) + 1,
      velocity: 94,
      releaseX: 2.0 + (Math.random() * 0.02 - 0.01), // tiny variance
      releaseZ: 6.0 + (Math.random() * 0.02 - 0.01),
    }));
    const drift = calcReleasePointDrift(pitches);
    expect(drift).toBeLessThan(1.0);
  });

  it('returns higher drift for inconsistent release points', () => {
    const pitches: PitchRecord[] = [
      { inning: 1, velocity: 94, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 1, velocity: 93, releaseX: 2.3, releaseZ: 6.3 },
      { inning: 2, velocity: 92, releaseX: 1.7, releaseZ: 5.7 },
      { inning: 2, velocity: 91, releaseX: 2.5, releaseZ: 6.5 },
      { inning: 3, velocity: 90, releaseX: 1.5, releaseZ: 5.5 },
      { inning: 3, velocity: 89, releaseX: 2.8, releaseZ: 6.8 },
    ];
    const drift = calcReleasePointDrift(pitches);
    expect(drift).toBeGreaterThan(2.0);
  });
});

// ---------------------------------------------------------------------------
// Statcast Adapter — full normalization
// ---------------------------------------------------------------------------

describe('pitchesToBiomechanics', () => {
  it('produces a valid biomechanics row from pitch data', () => {
    const pitches: PitchRecord[] = [
      { inning: 1, velocity: 95.0, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 1, velocity: 94.5, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 1, velocity: 95.5, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 3, velocity: 93.0, releaseX: 2.1, releaseZ: 5.9 },
      { inning: 3, velocity: 92.5, releaseX: 2.0, releaseZ: 6.0 },
      { inning: 5, velocity: 91.0, releaseX: 2.2, releaseZ: 5.8 },
    ];

    const row = pitchesToBiomechanics(
      'player-123',
      'John Smith',
      'TEX',
      'mlb',
      'game-456',
      '2024-06-15',
      pitches,
    );

    expect(row.player_id).toBe('player-123');
    expect(row.player_name).toBe('John Smith');
    expect(row.team).toBe('TEX');
    expect(row.league).toBe('mlb');
    expect(row.pitch_count).toBe(6);
    expect(row.fatigue_score).toBeGreaterThanOrEqual(0);
    expect(row.fatigue_score).toBeLessThanOrEqual(100);
    expect(row.injury_risk_index).toBeGreaterThanOrEqual(0);
    expect(row.injury_risk_index).toBeLessThanOrEqual(100);
    expect(JSON.parse(row.risk_factors)).toBeInstanceOf(Array);
    // CV-ready fields should be null
    expect(row.arm_slot_angle).toBeNull();
    expect(row.stride_length_pct).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Highlightly adapter
// ---------------------------------------------------------------------------

describe('highlightlyToBiomechanics', () => {
  it('converts a Highlightly pitching line to biomechanics', () => {
    const row = highlightlyToBiomechanics({
      playerId: 'h-100',
      playerName: 'Jane Pitcher',
      team: 'VAN',
      league: 'college-baseball',
      gameId: 'g-200',
      gameDate: '2024-04-10',
      inningsPitched: 7,
      pitchCount: 98,
      hits: 5,
      runs: 2,
      earnedRuns: 2,
      walks: 1,
      strikeouts: 8,
      era: 2.50,
    });

    expect(row.player_id).toBe('h-100');
    expect(row.league).toBe('college-baseball');
    expect(row.pitch_count).toBe(98);
    expect(row.release_point_drift_inches).toBe(0); // Not available from Highlightly
    expect(row.fatigue_score).toBeGreaterThanOrEqual(0);
  });

  it('uses velocity estimates when provided', () => {
    const row = highlightlyToBiomechanics(
      {
        playerId: 'h-101',
        playerName: 'Mike Throw',
        team: 'SEC',
        league: 'college-baseball',
        gameId: 'g-201',
        gameDate: '2024-05-01',
        inningsPitched: 6,
        pitchCount: 88,
        hits: 4,
        runs: 1,
        earnedRuns: 1,
        walks: 2,
        strikeouts: 7,
      },
      93.5, // estimated start velo
      91.0, // estimated current velo
    );

    expect(row.velocity_start).toBe(93.5);
    expect(row.velocity_current).toBe(91.0);
    expect(row.velocity_delta).toBe(-2.5);
  });
});
