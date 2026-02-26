import { describe, it, expect } from 'vitest';
import { computeSavantData, type RawPlayerRow, type TeamConferenceMap } from '../../lib/analytics/savant-compute';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const teamMap: TeamConferenceMap = {
  'Texas Longhorns': { conference: 'SEC', stadium: 'UFCU Disch-Falk Field' },
  'TCU Horned Frogs': { conference: 'Big 12', stadium: 'Lupton Stadium' },
};

function makeRow(overrides: Partial<RawPlayerRow> = {}): RawPlayerRow {
  return {
    espn_id: '12345',
    season: 2026,
    name: 'Test Player',
    team: 'Texas Longhorns',
    team_id: '126',
    position: 'SS',
    headshot: null,
    games_bat: 20,
    at_bats: 80,
    runs: 15,
    hits: 28,
    doubles: 6,
    triples: 1,
    rbis: 14,
    home_runs: 3,
    walks_bat: 10,
    strikeouts_bat: 12,
    stolen_bases: 4,
    hit_by_pitch: 2,
    sacrifice_flies: 1,
    sacrifice_hits: 0,
    caught_stealing: 1,
    total_bases: 45,
    on_base_pct: 0,
    slugging_pct: 0,
    games_pitch: 0,
    innings_pitched_thirds: 0,
    hits_allowed: 0,
    runs_allowed: 0,
    earned_runs: 0,
    walks_pitch: 0,
    strikeouts_pitch: 0,
    home_runs_allowed: 0,
    wins: 0,
    losses: 0,
    saves: 0,
    ...overrides,
  };
}

function makePitcher(overrides: Partial<RawPlayerRow> = {}): RawPlayerRow {
  return makeRow({
    espn_id: '67890',
    name: 'Test Pitcher',
    position: 'SP',
    games_bat: 0,
    at_bats: 0,
    runs: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    home_runs: 0,
    walks_bat: 0,
    strikeouts_bat: 0,
    stolen_bases: 0,
    hit_by_pitch: 1,
    sacrifice_flies: 0,
    games_pitch: 10,
    innings_pitched_thirds: 60 * 3, // 60.0 IP
    hits_allowed: 45,
    runs_allowed: 20,
    earned_runs: 18,
    walks_pitch: 15,
    strikeouts_pitch: 55,
    home_runs_allowed: 4,
    wins: 5,
    losses: 2,
    saves: 0,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeSavantData', () => {
  it('returns empty arrays when no rows', () => {
    const result = computeSavantData([], teamMap);
    expect(result.batting).toHaveLength(0);
    expect(result.pitching).toHaveLength(0);
    expect(result.summary.qualifiedBatters).toBe(0);
  });

  it('filters out batters below PA threshold', () => {
    const row = makeRow({ at_bats: 5, walks_bat: 2, hit_by_pitch: 0, sacrifice_flies: 0 });
    // PA = 5 + 2 + 0 + 0 = 7 < MIN_PA (20)
    const result = computeSavantData([row], teamMap);
    expect(result.batting).toHaveLength(0);
  });

  it('filters out pitchers below IP threshold', () => {
    const row = makePitcher({ innings_pitched_thirds: 12 }); // 4.0 IP < 5.0
    const result = computeSavantData([row], teamMap);
    expect(result.pitching).toHaveLength(0);
  });

  it('computes batting advanced for qualified batter', () => {
    const row = makeRow();
    // PA = 80 + 10 + 2 + 1 = 93
    const result = computeSavantData([row], teamMap);
    expect(result.batting).toHaveLength(1);

    const bat = result.batting[0];
    expect(bat.player_id).toBe('12345');
    expect(bat.player_name).toBe('Test Player');
    expect(bat.team).toBe('Texas Longhorns');
    expect(bat.conference).toBe('SEC');
    expect(bat.pa).toBe(93);
    expect(bat.avg).toBeCloseTo(0.350, 2);
    expect(bat.woba).toBeGreaterThan(0);
    expect(bat.wrc_plus).toBeGreaterThan(0);
    expect(bat.iso).toBeGreaterThan(0);
    expect(bat.k_pct).toBeGreaterThan(0);
    expect(bat.bb_pct).toBeGreaterThan(0);
  });

  it('computes pitching advanced for qualified pitcher', () => {
    const row = makePitcher();
    const result = computeSavantData([row], teamMap);
    expect(result.pitching).toHaveLength(1);

    const pitch = result.pitching[0];
    expect(pitch.player_id).toBe('67890');
    expect(pitch.era).toBeCloseTo(2.70, 1);
    expect(pitch.whip).toBeGreaterThan(0);
    expect(pitch.k_9).toBeGreaterThan(0);
    expect(pitch.fip).toBeGreaterThan(0);
    expect(pitch.era_minus).toBeGreaterThan(0);
  });

  it('maps conference from team name', () => {
    const texasRow = makeRow({ team: 'Texas Longhorns' });
    const tcuRow = makeRow({ espn_id: '99', team: 'TCU Horned Frogs' });
    const unknownRow = makeRow({ espn_id: '00', team: 'Random School Bears' });

    const result = computeSavantData([texasRow, tcuRow, unknownRow], teamMap);
    expect(result.batting[0].conference).toBe('SEC');
    expect(result.batting[1].conference).toBe('Big 12');
    expect(result.batting[2].conference).toBeNull();
  });

  it('computes conference strength from aggregated data', () => {
    const rows = [
      makeRow({ espn_id: '1', team: 'Texas Longhorns' }),
      makeRow({ espn_id: '2', team: 'TCU Horned Frogs' }),
      makePitcher({ espn_id: '3', team: 'Texas Longhorns' }),
      makePitcher({ espn_id: '4', team: 'TCU Horned Frogs' }),
    ];
    const result = computeSavantData(rows, teamMap);
    expect(result.conferenceStrength.length).toBeGreaterThanOrEqual(2);

    const sec = result.conferenceStrength.find(c => c.conference === 'SEC');
    expect(sec).toBeDefined();
    expect(sec!.is_power).toBe(1);
    expect(sec!.strength_index).toBeGreaterThan(0);
  });

  it('generates park factors for all teams with players', () => {
    const rows = [
      makeRow({ espn_id: '1', team: 'Texas Longhorns' }),
      makeRow({ espn_id: '2', team: 'TCU Horned Frogs' }),
    ];
    const result = computeSavantData(rows, teamMap);
    expect(result.parkFactors.length).toBe(2);
    // All default to 1.0 since we don't have home/away splits
    expect(result.parkFactors[0].runs_factor).toBe(1.0);
  });

  it('populates summary counts correctly', () => {
    const rows = [
      makeRow({ espn_id: '1' }),
      makeRow({ espn_id: '2' }),
      makePitcher({ espn_id: '3' }),
    ];
    const result = computeSavantData(rows, teamMap);
    expect(result.summary.totalPlayers).toBe(3);
    expect(result.summary.qualifiedBatters).toBe(2);
    expect(result.summary.qualifiedPitchers).toBe(1);
  });

  it('derives league context from aggregated data', () => {
    const rows = [
      makeRow({ espn_id: '1' }),
      makeRow({ espn_id: '2' }),
      makePitcher({ espn_id: '3' }),
    ];
    const result = computeSavantData(rows, teamMap);

    expect(result.league.woba).toBeGreaterThan(0);
    expect(result.league.obp).toBeGreaterThan(0);
    expect(result.league.era).toBeGreaterThan(0);
    expect(result.league.fipConstant).toBeGreaterThanOrEqual(3.0);
    expect(result.league.fipConstant).toBeLessThanOrEqual(5.0);
    expect(result.league.wobaScale).toBeGreaterThanOrEqual(0.8);
    expect(result.league.wobaScale).toBeLessThanOrEqual(1.4);
  });

  it('e-stats use conference strength from pre-pass (not neutral 50)', () => {
    // Two conferences with meaningfully different offensive profiles.
    // SEC batter has high wOBA inputs; weak-conf batter has low.
    // If confStrengthMap is empty at Step 3, all confStrength values are 50
    // and eBA/eWOBA for both batters would be identical (modulo babip/hr differences).
    // The pre-pass ensures SEC gets a higher strength index than the weak conference,
    // producing a measurably lower eBA for the SEC batter (stronger pitching adjustment).
    const secBatter = makeRow({
      espn_id: 'sec-1',
      team: 'Texas Longhorns',
      at_bats: 100, hits: 38, home_runs: 8, doubles: 10, triples: 1,
      walks_bat: 15, hit_by_pitch: 3, strikeouts_bat: 18, sacrifice_flies: 2,
    });
    const weakBatter = makeRow({
      espn_id: 'weak-1',
      team: 'TCU Horned Frogs',
      at_bats: 100, hits: 20, home_runs: 1, doubles: 3, triples: 0,
      walks_bat: 8, hit_by_pitch: 1, strikeouts_bat: 30, sacrifice_flies: 1,
    });
    // Give SEC a strong pitcher to push conference strength up
    const secPitcher = makePitcher({
      espn_id: 'sec-p1',
      team: 'Texas Longhorns',
      innings_pitched_thirds: 60, // 20 IP
      earned_runs: 12,            // 5.40 ERA — not dominant but present
      strikeouts_pitch: 25, walks_pitch: 8, home_runs_allowed: 2,
    });

    const result = computeSavantData([secBatter, weakBatter, secPitcher], teamMap);

    const sec = result.batting.find(b => b.player_id === 'sec-1')!;
    const weak = result.batting.find(b => b.player_id === 'weak-1')!;

    // Both should have non-null e-stats
    expect(sec.e_ba).not.toBeNull();
    expect(weak.e_ba).not.toBeNull();

    // SEC conference should have a computed strength (not the neutral 50 default),
    // producing a different eBA than if strength were always 50.
    // Specifically: SEC has higher offense → higher confStrength → more negative confAdj → lower eBA.
    // Weak conf has lower offense → lower strength → less adjustment.
    // The SEC batter's raw BABIP is higher, so without adjustment SEC eBA > weak eBA.
    // With the strength adjustment applied, the gap should narrow (SEC gets penalized).
    // We verify the adjustment is non-zero by checking e_ba differs from a neutral-strength calculation.
    const neutralEBA = 0.3 + ((sec.babip - 0.3) * 0.6) * (1 - sec.k_pct) + (sec.hr / sec.ab);
    // The actual e_ba should differ from neutral (confAdj != 0 means pre-pass worked)
    expect(sec.e_ba).not.toBeCloseTo(neutralEBA, 4);
  });
});
