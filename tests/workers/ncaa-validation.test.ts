/**
 * NCAA Baseball — Validation & v1 API Tests
 *
 * Tests:
 *   - Proving box score rule (PA reconciliation invariant)
 *   - Run conservation cross-table check
 *   - Corrections ledger (host-official workflow, away consent)
 *   - Soft validation flags
 *   - Submission window logic
 *   - v1 API handlers (seasons, teams, players, games, boxscore, pbp, metrics, splits, provenance)
 */
import { describe, expect, it, vi } from 'vitest';
import {
  proveBoxScore,
  computePA,
  validateRunConservation,
  buildCorrectionEntry,
  requiresAwayConsent,
  computeSubmissionWindow,
  isSubmissionLate,
  runSoftValidations,
  type TeamBoxLine,
  type CorrectionRequest,
} from '../../workers/handlers/college-baseball/ncaa-validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBox(overrides: Partial<TeamBoxLine> = {}): TeamBoxLine {
  return {
    teamId: 'team_a',
    isHome: true,
    runs: 4,
    lob: 6,
    ab: 30,
    bb: 3,
    hbp: 1,
    sf: 1,
    sh: 1,
    hits: 9,
    errors: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computePA
// ---------------------------------------------------------------------------
describe('computePA', () => {
  it('sums AB + BB + HBP + SF + SH', () => {
    expect(computePA({ ab: 30, bb: 3, hbp: 1, sf: 1, sh: 1 })).toBe(36);
  });

  it('handles zero values', () => {
    expect(computePA({ ab: 27, bb: 0, hbp: 0, sf: 0, sh: 0 })).toBe(27);
  });
});

// ---------------------------------------------------------------------------
// proveBoxScore — NCAA proving box rule
// ---------------------------------------------------------------------------
describe('proveBoxScore', () => {
  it('passes when both teams balance (9-inning game)', () => {
    // 9-inning game: each team records 27 PO
    // Home: PA=36, R=4, LOB=6, AwayPO=26 (walk-off: only 26 outs)
    // Actually let's do a clean 9-inning where home wins 4-2:
    //   Away records 27 PO against home (home bats all 9)
    //   Home records 24 PO against away (away gets 3 outs in top of 9th too... all 27)
    // For simplicity: both teams get 27 outs
    const home = makeBox({ runs: 4, lob: 5, ab: 29, bb: 2, hbp: 0, sf: 1, sh: 0 });
    // homePA = 29+2+0+1+0 = 32; expected = 4+5+awayPO
    // awayPO = 27 → expected = 36. Let's set to match.
    const homePA = computePA(home); // = 32
    // Make it balance: R+LOB+awayPO = PA → awayPO = PA - R - LOB = 32 - 4 - 5 = 23
    const awayPO = 23;

    const away = makeBox({ teamId: 'team_b', isHome: false, runs: 2, lob: 7, ab: 28, bb: 3, hbp: 0, sf: 0, sh: 1 });
    const awayPA = computePA(away); // = 32
    // homePO = PA - R - LOB = 32 - 2 - 7 = 23
    const homePO = 23;

    const result = proveBoxScore(home, away, homePO, awayPO);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when home PA does not reconcile', () => {
    // home PA computed = 36, but R+LOB+awayPO = 4+6+27 = 37
    const home = makeBox({ runs: 4, lob: 6, ab: 30, bb: 3, hbp: 1, sf: 1, sh: 1 });
    const away = makeBox({ teamId: 'team_b', isHome: false, runs: 3, lob: 5, ab: 28, bb: 2, hbp: 0, sf: 1, sh: 0 });
    // homePA = 36; expected = 4+6+27=37 — mismatch
    const result = proveBoxScore(home, away, 27, 27);
    expect(result.valid).toBe(false);
    expect(result.homeValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Home PA mismatch'))).toBe(true);
  });

  it('fails when away PA does not reconcile', () => {
    // away PA = 31, expected = 3+5+23 = 31 ✓; home PA = 36, expected = 4+6+23 = 33 ✗
    const home = makeBox({ runs: 4, lob: 6, ab: 30, bb: 3, hbp: 1, sf: 1, sh: 1 }); // PA=36
    const away = makeBox({ teamId: 'team_b', isHome: false, runs: 2, lob: 5, ab: 26, bb: 2, hbp: 0, sf: 1, sh: 0 }); // PA=29
    // awayPA=29, expected=2+5+23=30 → mismatch
    const result = proveBoxScore(home, away, 23, 23);
    expect(result.awayValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Away PA mismatch'))).toBe(true);
  });

  it('returns correct PA values in result', () => {
    const home = makeBox({ ab: 27, bb: 2, hbp: 0, sf: 1, sh: 0, runs: 3, lob: 5 });
    const away = makeBox({ teamId: 'team_b', isHome: false, ab: 25, bb: 1, hbp: 0, sf: 0, sh: 1, runs: 1, lob: 6 });
    const result = proveBoxScore(home, away, 21, 22);
    expect(result.homePA).toBe(30);  // 27+2+0+1+0
    expect(result.awayPA).toBe(27);  // 25+1+0+0+1
  });
});

// ---------------------------------------------------------------------------
// validateRunConservation
// ---------------------------------------------------------------------------
describe('validateRunConservation', () => {
  it('passes when all three sources agree', () => {
    const result = validateRunConservation(5, 5, 5);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags box vs PBP mismatch', () => {
    const result = validateRunConservation(5, 4, 5);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('PBP'))).toBe(true);
  });

  it('flags box vs line score mismatch', () => {
    const result = validateRunConservation(5, 5, 4);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('line score'))).toBe(true);
  });

  it('returns both errors when all three differ', () => {
    const result = validateRunConservation(5, 3, 4);
    expect(result.errors).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Corrections ledger
// ---------------------------------------------------------------------------
describe('requiresAwayConsent', () => {
  it('returns true when requested_by is away_sid', () => {
    const req: CorrectionRequest = {
      gameId: 'g_001', table: 'box_player_batting_game', field: 'hr',
      recordId: 'g_001:p_007', oldValue: '1', newValue: '2', requestedBy: 'away_sid',
    };
    expect(requiresAwayConsent(req)).toBe(true);
  });

  it('returns false when requested_by is home_sid', () => {
    const req: CorrectionRequest = {
      gameId: 'g_001', table: 'box_player_batting_game', field: 'hr',
      recordId: 'g_001:p_007', oldValue: '1', newValue: '2', requestedBy: 'home_sid',
    };
    expect(requiresAwayConsent(req)).toBe(false);
  });

  it('returns false when requested_by is official_feed', () => {
    const req: CorrectionRequest = {
      gameId: 'g_001', table: 'box_player_batting_game', field: 'rbi',
      recordId: 'g_001:p_007', oldValue: '0', newValue: '1', requestedBy: 'official_feed',
    };
    expect(requiresAwayConsent(req)).toBe(false);
  });
});

describe('buildCorrectionEntry', () => {
  it('produces a pending correction for home SID without consent requirement', () => {
    const req: CorrectionRequest = {
      gameId: 'g_123', table: 'box_team_game', field: 'runs',
      recordId: 'g_123:team_a', oldValue: '5', newValue: '6', requestedBy: 'home_sid',
    };
    const result = buildCorrectionEntry(req);
    expect(result.status).toBe('pending');
    expect(result.requiresAwayConsent).toBe(false);
    expect(result.correctionId).toMatch(/^corr_g_123_/);
    expect(result.entry.status).toBe('pending');
    expect(result.entry.requires_away_consent).toBe(0);
    expect(result.entry.old_value).toBe('5');
    expect(result.entry.new_value).toBe('6');
  });

  it('produces a pending correction for away SID with consent requirement', () => {
    const req: CorrectionRequest = {
      gameId: 'g_456', table: 'box_player_batting_game', field: 'sb',
      recordId: 'g_456:p_099', oldValue: '0', newValue: '1', requestedBy: 'away_sid',
    };
    const result = buildCorrectionEntry(req);
    expect(result.requiresAwayConsent).toBe(true);
    expect(result.entry.requires_away_consent).toBe(1);
    expect(result.message).toContain('awaiting home SID consent');
  });

  it('generates unique correction IDs', () => {
    const req: CorrectionRequest = {
      gameId: 'g_789', table: 'box_team_game', field: 'hits',
      recordId: 'g_789:team_b', oldValue: null, newValue: '8', requestedBy: 'home_sid',
    };
    const r1 = buildCorrectionEntry(req);
    const r2 = buildCorrectionEntry(req);
    // IDs have random component so should differ (extremely high probability)
    expect(r1.correctionId).not.toBe(r2.correctionId);
  });

  it('stores null old_value when no prior value', () => {
    const req: CorrectionRequest = {
      gameId: 'g_111', table: 'box_team_game', field: 'errors',
      recordId: 'g_111:team_a', oldValue: null, newValue: '0', requestedBy: 'home_sid',
    };
    const result = buildCorrectionEntry(req);
    expect(result.entry.old_value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Submission windows
// ---------------------------------------------------------------------------
describe('computeSubmissionWindow', () => {
  it('sets expectedBy to 2h after game start', () => {
    const result = computeSubmissionWindow({
      gameId: 'g_001',
      gameDateUtc: '2026-04-15T20:00:00Z',
      hasLiveStats: true,
    });
    expect(result.expectedBy).toBe('2026-04-15T22:00:00.000Z');
    expect(result.hasLiveStats).toBe(true);
  });

  it('sets weekly deadline to next Monday 23:59:00 UTC', () => {
    // Wednesday April 15 → next Monday April 20
    const result = computeSubmissionWindow({
      gameId: 'g_002',
      gameDateUtc: '2026-04-15T20:00:00Z',  // Wednesday
      hasLiveStats: false,
    });
    const deadline = new Date(result.weeklyDeadline);
    expect(deadline.getUTCDay()).toBe(1); // Monday
    expect(deadline.getUTCHours()).toBe(23);
    expect(deadline.getUTCMinutes()).toBe(59);
  });
});

describe('isSubmissionLate', () => {
  it('returns false when received before deadline', () => {
    const deadline = '2026-04-20T23:59:00.000Z';
    const receivedAt = '2026-04-18T15:00:00.000Z';
    expect(isSubmissionLate(deadline, receivedAt)).toBe(false);
  });

  it('returns true when received after deadline', () => {
    const deadline = '2026-04-14T23:59:00.000Z';
    const receivedAt = '2026-04-15T10:00:00.000Z';
    expect(isSubmissionLate(deadline, receivedAt)).toBe(true);
  });

  it('returns true when not received and deadline has passed', () => {
    const pastDeadline = '2020-01-01T00:00:00.000Z';
    expect(isSubmissionLate(pastDeadline, null)).toBe(true);
  });

  it('returns false when not received and deadline is in the future', () => {
    const futureDeadline = '2099-12-31T23:59:00.000Z';
    expect(isSubmissionLate(futureDeadline, null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Soft validations
// ---------------------------------------------------------------------------
describe('runSoftValidations', () => {
  const home = makeBox();
  const away = makeBox({ teamId: 'team_b', isHome: false });

  it('returns no flags for a clean lineup', () => {
    const homeLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p_h_${i + 1}`,
      jersey: String(i + 1),
      battingOrder: i + 1,
    }));
    const awayLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p_a_${i + 1}`,
      jersey: String(i + 10),
      battingOrder: i + 1,
    }));
    const result = runSoftValidations(homeLineup, awayLineup, home, away);
    expect(result.flags).toHaveLength(0);
  });

  it('flags duplicate jersey numbers', () => {
    const homeLineup = [
      { playerId: 'p1', jersey: '10', battingOrder: 1 },
      { playerId: 'p2', jersey: '10', battingOrder: 2 }, // duplicate
      ...Array.from({ length: 7 }, (_, i) => ({ playerId: `p${i + 3}`, jersey: String(i + 20), battingOrder: i + 3 })),
    ];
    const awayLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p_a${i}`, jersey: String(i + 1), battingOrder: i + 1,
    }));
    const result = runSoftValidations(homeLineup, awayLineup, home, away);
    expect(result.flags.some((f) => f.includes('home') && f.includes('duplicate jersey'))).toBe(true);
  });

  it('flags missing batting order positions', () => {
    const homeLineup = [
      { playerId: 'p1', jersey: '1', battingOrder: 1 },
      { playerId: 'p2', jersey: '2', battingOrder: 2 },
      // skip position 3
      ...Array.from({ length: 6 }, (_, i) => ({ playerId: `p${i + 3}`, jersey: String(i + 3), battingOrder: i + 4 })),
    ];
    const awayLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `pa${i}`, jersey: String(i + 20), battingOrder: i + 1,
    }));
    const result = runSoftValidations(homeLineup, awayLineup, home, away);
    expect(result.flags.some((f) => f.includes('home') && f.includes('missing batting order'))).toBe(true);
  });

  it('flags implausibly high AB totals', () => {
    const highABHome = makeBox({ ab: 65 });
    const homeLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p_h_${i + 1}`, jersey: String(i + 1), battingOrder: i + 1,
    }));
    const awayLineup = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p_a_${i + 1}`, jersey: String(i + 10), battingOrder: i + 1,
    }));
    const result = runSoftValidations(homeLineup, awayLineup, highABHome, away);
    expect(result.flags.some((f) => f.includes('AB') && f.includes('implausibly high'))).toBe(true);
  });
});
