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
});
