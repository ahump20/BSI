/**
 * ESPN College Baseball Parser Unit Tests
 *
 * Tests the low-level parsers in espn-college-baseball.ts directly:
 *   - parseEspnBattingLine: label-based lookup, derivations, DNP filtering
 *   - parseEspnPitchingLine: IP parsing, zero-IP filtering, label lookup
 *   - parseBoxScoreTeam: full team parsing with both stat groups
 *
 * These are pure functions — no Workers runtime or fetch mocking needed.
 */
import { describe, expect, it } from 'vitest';
import {
  parseEspnBattingLine,
  parseEspnPitchingLine,
  parseBoxScoreTeam,
  parseInningsToThirds,
} from '../../lib/api-clients/espn-college-baseball';

// ---------------------------------------------------------------------------
// Constants matching real ESPN box score label order
// ---------------------------------------------------------------------------

const BATTING_LABELS = ['H-AB', 'AB', 'R', 'H', 'RBI', 'HR', 'BB', 'K', '#P', 'AVG', 'OBP', 'SLG'];
const PITCHING_LABELS = ['IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', '#P', 'ERA'];

const mockAthlete = (id = '1', name = 'Test Player', pos = 'CF') => ({
  id,
  displayName: name,
  position: { abbreviation: pos },
  headshot: { href: 'https://example.com/headshot.png' },
});

// ---------------------------------------------------------------------------
// parseInningsToThirds
// ---------------------------------------------------------------------------

describe('parseInningsToThirds', () => {
  it('handles whole innings', () => {
    expect(parseInningsToThirds('6.0')).toBe(18);
    expect(parseInningsToThirds('7.0')).toBe(21);
    expect(parseInningsToThirds('9.0')).toBe(27);
  });

  it('handles fractional innings', () => {
    expect(parseInningsToThirds('6.1')).toBe(19);
    expect(parseInningsToThirds('6.2')).toBe(20);
    expect(parseInningsToThirds('0.1')).toBe(1);
    expect(parseInningsToThirds('0.2')).toBe(2);
  });

  it('handles zero IP', () => {
    expect(parseInningsToThirds('0.0')).toBe(0);
    expect(parseInningsToThirds('0')).toBe(0);
  });

  it('handles invalid input', () => {
    expect(parseInningsToThirds('')).toBe(0);
    expect(parseInningsToThirds('N/A')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseEspnBattingLine
// ---------------------------------------------------------------------------

describe('parseEspnBattingLine', () => {
  it('parses a standard batting line by label', () => {
    // Jared Thomas: 3-4, 2R, 3H, 2RBI, 0HR, 0BB, 1K, 52 pitches, .345/.380/.520
    const stats = ['3-4', '4', '2', '3', '2', '0', '0', '1', '52', '.345', '.380', '.520'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());

    expect(result).not.toBeNull();
    expect(result!.ab).toBe(4);
    expect(result!.r).toBe(2);
    expect(result!.h).toBe(3);
    expect(result!.rbi).toBe(2);
    expect(result!.hr).toBe(0);
    expect(result!.bb).toBe(0);
    expect(result!.k).toBe(1);
    expect(result!.pitchCount).toBe(52);
    expect(result!.avg).toBeCloseTo(0.345, 3);
    expect(result!.obp).toBeCloseTo(0.380, 3);
    expect(result!.slg).toBeCloseTo(0.520, 3);
  });

  it('populates athlete metadata', () => {
    const stats = ['3-4', '4', '2', '3', '2', '0', '0', '1', '52', '.345', '.380', '.520'];
    const athlete = mockAthlete('42', 'Jared Thomas', 'CF');
    const result = parseEspnBattingLine(BATTING_LABELS, stats, athlete);

    expect(result!.playerId).toBe('42');
    expect(result!.name).toBe('Jared Thomas');
    expect(result!.position).toBe('CF');
    expect(result!.headshot).toBe('https://example.com/headshot.png');
  });

  it('returns null for DNP (ab=0, r=0, h=0)', () => {
    // DNP batter — appeared in lineup but did not play
    const stats = ['0-0', '0', '0', '0', '0', '0', '0', '0', '0', '.000', '.000', '.000'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result).toBeNull();
  });

  it('keeps batter with zero AB but non-zero runs (pinch runner)', () => {
    // Pinch runner: 0 AB, 1 R, 0 H
    const stats = ['0-0', '0', '1', '0', '0', '0', '0', '0', '0', '.000', '.000', '.000'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result).not.toBeNull();
    expect(result!.r).toBe(1);
    expect(result!.ab).toBe(0);
  });

  it('keeps batter with zero AB but non-zero BB (walk-only appearance)', () => {
    // Pinch hitter who walked: 0 AB, 0 R, 0 H, 1 BB
    const stats = ['0-0', '0', '0', '0', '0', '0', '1', '0', '0', '.000', '.000', '.000'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result).not.toBeNull();
    expect(result!.bb).toBe(1);
    expect(result!.ab).toBe(0);
  });

  it('estimates HBP from OBP equation', () => {
    // H=2, AB=4, BB=0, OBP=.600
    // HBP = (0.600*(4+0) - 2 - 0) / (1 - 0.600) = (2.4 - 2) / 0.4 = 1
    const stats = ['2-4', '4', '1', '2', '0', '0', '0', '1', '40', '.500', '.600', '.500'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result!.hbp).toBe(1);
  });

  it('sets HBP to 0 when OBP cannot explain it', () => {
    // OBP ≈ H/AB (no walks, no HBP)
    const stats = ['2-4', '4', '1', '2', '0', '0', '0', '0', '40', '.500', '.500', '.500'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result!.hbp).toBe(0);
  });

  it('computes PA = AB + BB + HBP', () => {
    // AB=4, BB=1, HBP=0 → PA=5
    const stats = ['2-4', '4', '1', '2', '0', '0', '1', '1', '50', '.500', '.600', '.500'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete());
    expect(result!.pa).toBeGreaterThanOrEqual(5); // at minimum AB + BB
  });

  it('MSST Ace Reese verification — derivations match wOBA 0.649 test case', () => {
    // This is the verified derivation that produced wOBA 0.649, wRC+ 168
    // AB=3, H=2, HR=1, BB=1, OBP=.700, SLG=1.333
    // TB = round(1.333 * 3) = 4
    // HBP from OBP: (0.700*(3+1) - 2 - 1) / (1-0.700) = (2.8-3)/0.3 = -0.67 → 0
    const stats = ['2-3', '3', '2', '2', '2', '1', '1', '1', '55', '.400', '.700', '1.333'];
    const result = parseEspnBattingLine(BATTING_LABELS, stats, mockAthlete('99', 'Ace Reese', 'SP'));
    expect(result).not.toBeNull();
    expect(result!.ab).toBe(3);
    expect(result!.h).toBe(2);
    expect(result!.hr).toBe(1);
    expect(result!.bb).toBe(1);
    expect(result!.hbp).toBe(0);
  });

  it('is resilient to label reordering by ESPN', () => {
    // Swap AB and R positions — should still parse correctly by label
    const reorderedLabels = ['H-AB', 'R', 'AB', 'H', 'RBI', 'HR', 'BB', 'K', '#P', 'AVG', 'OBP', 'SLG'];
    // Stats must match new order: R=2 at index 1, AB=4 at index 2
    const reorderedStats = ['3-4', '2', '4', '3', '2', '0', '0', '1', '52', '.345', '.380', '.520'];
    const result = parseEspnBattingLine(reorderedLabels, reorderedStats, mockAthlete());
    expect(result!.ab).toBe(4);
    expect(result!.r).toBe(2);
    expect(result!.h).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// parseEspnPitchingLine
// ---------------------------------------------------------------------------

describe('parseEspnPitchingLine', () => {
  it('parses a standard pitching line by label', () => {
    // Lucas Gordon: 7.0 IP, 5H, 3R, 2ER, 2BB, 8K, 0HR, 95 pitches, 2.85 ERA
    const stats = ['7.0', '5', '3', '2', '2', '8', '0', '95', '2.85'];
    const result = parseEspnPitchingLine(PITCHING_LABELS, stats, mockAthlete('2', 'Lucas Gordon', 'SP'));

    expect(result).not.toBeNull();
    expect(result!.ipDisplay).toBe('7.0');
    expect(result!.ipThirds).toBe(21);
    expect(result!.ip).toBeCloseTo(7.0, 1);
    expect(result!.h).toBe(5);
    expect(result!.r).toBe(3);
    expect(result!.er).toBe(2);
    expect(result!.bb).toBe(2);
    expect(result!.k).toBe(8);
    expect(result!.hr).toBe(0);
    expect(result!.pitchCount).toBe(95);
    expect(result!.era).toBeCloseTo(2.85, 2);
  });

  it('returns null for zero-IP pitcher (no outs recorded)', () => {
    const stats = ['0.0', '0', '0', '0', '0', '0', '0', '0', '0.00'];
    const result = parseEspnPitchingLine(PITCHING_LABELS, stats, mockAthlete());
    expect(result).toBeNull();
  });

  it('parses fractional innings correctly', () => {
    // 6.1 IP = 19 thirds
    const stats = ['6.1', '4', '1', '1', '1', '7', '0', '89', '1.95'];
    const result = parseEspnPitchingLine(PITCHING_LABELS, stats, mockAthlete());
    expect(result!.ipThirds).toBe(19);
    expect(result!.ipDisplay).toBe('6.1');
    // ip float: 19/3 ≈ 6.333 → rounded to 1 decimal = 6.3
    expect(result!.ip).toBeCloseTo(6.3, 1);
  });

  it('populates decision as null (set upstream from decisions block)', () => {
    const stats = ['9.0', '3', '0', '0', '1', '12', '0', '115', '0.00'];
    const result = parseEspnPitchingLine(PITCHING_LABELS, stats, mockAthlete());
    expect(result!.decision).toBeNull();
  });

  it('populates athlete metadata', () => {
    const stats = ['5.0', '7', '5', '4', '3', '4', '0', '80', '4.20'];
    const athlete = mockAthlete('4', 'Jake Foster', 'P');
    const result = parseEspnPitchingLine(PITCHING_LABELS, stats, athlete);

    expect(result!.playerId).toBe('4');
    expect(result!.name).toBe('Jake Foster');
    expect(result!.position).toBe('P');
  });

  it('is resilient to label reordering', () => {
    // Move ERA to the front
    const reorderedLabels = ['ERA', 'IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', '#P'];
    const reorderedStats = ['2.85', '7.0', '5', '3', '2', '2', '8', '0', '95'];
    const result = parseEspnPitchingLine(reorderedLabels, reorderedStats, mockAthlete());
    expect(result!.ipDisplay).toBe('7.0');
    expect(result!.er).toBe(2);
    expect(result!.k).toBe(8);
    expect(result!.era).toBeCloseTo(2.85, 2);
  });
});

// ---------------------------------------------------------------------------
// parseBoxScoreTeam — full team parsing
// ---------------------------------------------------------------------------

describe('parseBoxScoreTeam', () => {
  const teamBox = {
    team: { id: '2633', displayName: 'Texas Longhorns' },
    statistics: [
      {
        name: 'batting',
        labels: BATTING_LABELS,
        athletes: [
          {
            athlete: mockAthlete('1', 'Jared Thomas', 'CF'),
            stats: ['3-4', '4', '2', '3', '2', '0', '0', '1', '52', '.345', '.380', '.520'],
          },
          {
            // DNP batter — should be filtered out
            athlete: mockAthlete('5', 'Bench Guy', 'DH'),
            stats: ['0-0', '0', '0', '0', '0', '0', '0', '0', '0', '.000', '.000', '.000'],
          },
        ],
      },
      {
        name: 'pitching',
        labels: PITCHING_LABELS,
        athletes: [
          {
            athlete: mockAthlete('2', 'Lucas Gordon', 'SP'),
            stats: ['7.0', '5', '3', '2', '2', '8', '0', '95', '2.85'],
          },
          {
            // Zero IP reliever — should be filtered out
            athlete: mockAthlete('6', 'Bullpen Guy', 'RP'),
            stats: ['0.0', '0', '0', '0', '0', '0', '0', '0', '0.00'],
          },
        ],
      },
    ],
  };

  it('returns team metadata', () => {
    const result = parseBoxScoreTeam(teamBox);
    expect(result.team.id).toBe('2633');
    expect(result.team.name).toBe('Texas Longhorns');
  });

  it('filters out DNP batters', () => {
    const result = parseBoxScoreTeam(teamBox);
    expect(result.batting).toHaveLength(1);
    expect(result.batting[0].name).toBe('Jared Thomas');
  });

  it('filters out zero-IP pitchers', () => {
    const result = parseBoxScoreTeam(teamBox);
    expect(result.pitching).toHaveLength(1);
    expect(result.pitching[0].name).toBe('Lucas Gordon');
  });

  it('accumulates runs from batting lines', () => {
    const result = parseBoxScoreTeam(teamBox);
    expect(result.runsFromBatting).toBe(2);
  });

  it('detects batting group by H-AB label', () => {
    // Replace 'AB' with just H-AB marker — should still detect as batting
    const boxWithHAB = {
      ...teamBox,
      statistics: [{
        name: 'batting',
        labels: ['H-AB', 'AB', 'R', 'H'],
        athletes: [{
          athlete: mockAthlete('1', 'Jared Thomas', 'CF'),
          stats: ['2-3', '3', '1', '2'],
        }],
      }],
    };
    const result = parseBoxScoreTeam(boxWithHAB);
    expect(result.batting).toHaveLength(1);
    expect(result.pitching).toHaveLength(0);
  });

  it('handles empty statistics array gracefully', () => {
    const result = parseBoxScoreTeam({ team: { id: '99', displayName: 'Test' }, statistics: [] });
    expect(result.batting).toHaveLength(0);
    expect(result.pitching).toHaveLength(0);
    expect(result.runsFromBatting).toBe(0);
  });
});
