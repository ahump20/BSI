/**
 * College Baseball Savant — Compute Pipeline
 *
 * Transforms raw player_season_stats rows into advanced metric tables
 * (cbb_batting_advanced, cbb_pitching_advanced, cbb_park_factors,
 * cbb_conference_strength). Pure functions — no I/O, no D1 calls.
 *
 * Input:  player_season_stats rows (ESPN box-score accumulations)
 * Output: structured objects matching the D1 savant table schemas
 *
 * Used by: scripts/seed-savant.ts, workers/bsi-savant-compute/
 */

import type { BattingLine, PitchingLine, LeagueContext } from './savant-metrics';
import {
  MLB_WOBA_WEIGHTS,
  computeFullBattingLine,
  computeFullPitchingLine,
  calculateConferenceStrength,
  calculateFIPConstant,
  calculateWOBAScale,
  calculateWOBA,
  calculateEBA,
  calculateESLG,
  calculateEWOBA,
} from './savant-metrics';

// ---------------------------------------------------------------------------
// Types — raw input from player_season_stats
// ---------------------------------------------------------------------------

/** Row shape from player_season_stats (post-migration 042). */
export interface RawPlayerRow {
  espn_id: string;
  season: number;
  name: string;
  team: string;
  team_id: string | null;
  position: string | null;
  headshot: string | null;

  // Batting
  games_bat: number;
  at_bats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  rbis: number;
  home_runs: number;
  walks_bat: number;
  strikeouts_bat: number;
  stolen_bases: number;
  hit_by_pitch: number;
  sacrifice_flies: number;
  sacrifice_hits: number;
  caught_stealing: number;
  total_bases: number;
  on_base_pct: number;
  slugging_pct: number;

  // Pitching
  games_pitch: number;
  innings_pitched_thirds: number;
  hits_allowed: number;
  runs_allowed: number;
  earned_runs: number;
  walks_pitch: number;
  strikeouts_pitch: number;
  home_runs_allowed: number;
  wins: number;
  losses: number;
  saves: number;
}

/** Team→conference mapping. */
export interface TeamConferenceMap {
  [teamDisplayName: string]: {
    conference: string;
    stadium: string;
  };
}

// ---------------------------------------------------------------------------
// Output shapes — match D1 table schemas
// ---------------------------------------------------------------------------

export interface BattingAdvancedRow {
  player_id: string;
  player_name: string;
  team: string;
  team_id: string | null;
  conference: string | null;
  season: number;
  position: string | null;
  class_year: string | null;
  g: number;
  ab: number;
  pa: number;
  r: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  sb: number;
  cs: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  k_pct: number;
  bb_pct: number;
  iso: number;
  babip: number;
  woba: number;
  wrc_plus: number;
  ops_plus: number;
  e_ba: number | null;
  e_slg: number | null;
  e_woba: number | null;
  park_adjusted: number;
  data_source: string;
  computed_at: string;
}

export interface PitchingAdvancedRow {
  player_id: string;
  player_name: string;
  team: string;
  team_id: string | null;
  conference: string | null;
  season: number;
  position: string | null;
  class_year: string | null;
  g: number;
  gs: number;
  w: number;
  l: number;
  sv: number;
  ip: number;
  h: number;
  er: number;
  bb: number;
  hbp: number;
  so: number;
  era: number;
  whip: number;
  k_9: number;
  bb_9: number;
  hr_9: number;
  fip: number;
  x_fip: number | null;
  era_minus: number;
  k_bb: number;
  lob_pct: number;
  babip: number;
  park_adjusted: number;
  data_source: string;
  computed_at: string;
}

export interface ParkFactorRow {
  team: string;
  team_id: string | null;
  venue_name: string | null;
  conference: string | null;
  season: number;
  runs_factor: number;
  hits_factor: number;
  hr_factor: number;
  bb_factor: number;
  so_factor: number;
  sample_games: number;
  methodology_note: string;
  computed_at: string;
}

export interface ConferenceStrengthRow {
  conference: string;
  season: number;
  strength_index: number;
  run_environment: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  inter_conf_win_pct: number;
  rpi_avg: number;
  is_power: number;
  computed_at: string;
}

export interface ComputeResult {
  batting: BattingAdvancedRow[];
  pitching: PitchingAdvancedRow[];
  parkFactors: ParkFactorRow[];
  conferenceStrength: ConferenceStrengthRow[];
  league: LeagueContext;
  summary: {
    totalPlayers: number;
    qualifiedBatters: number;
    qualifiedPitchers: number;
    venues: number;
    conferences: number;
  };
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const MIN_PA = 20;
const MIN_IP = 5.0;

const POWER_CONFERENCES = new Set(['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert innings_pitched_thirds (integer) to decimal IP. 19 → 6.333 */
function thirdsToIP(thirds: number): number {
  const full = Math.floor(thirds / 3);
  const remainder = thirds % 3;
  return full + remainder / 3;
}

/** Derive PA from box-score columns. */
function derivePA(row: RawPlayerRow): number {
  return row.at_bats + row.walks_bat + row.hit_by_pitch + row.sacrifice_flies;
}

function round(n: number, decimals: number = 3): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ---------------------------------------------------------------------------
// Core compute
// ---------------------------------------------------------------------------

/**
 * Transform raw player_season_stats into all four savant tables.
 *
 * @param rows     All player_season_stats rows for a season
 * @param teamMap  Display name → { conference, stadium } lookup
 * @param season   Season year (default 2026)
 */
export function computeSavantData(
  rows: RawPlayerRow[],
  teamMap: TeamConferenceMap,
  season: number = 2026,
): ComputeResult {
  const now = new Date().toISOString();

  // ── Step 1: Derive league context from aggregate totals ──────────────
  const leagueCtx = deriveLeagueContext(rows);

  // ── Step 2: Build conference strength lookup for e-stat adjustments ──
  // Pre-pass over raw rows so confStrengthMap is populated before Step 3 reads it.
  const confStrengthMap = buildInitialConferenceStrengthMap(rows, teamMap);

  // ── Step 3: Compute batting advanced ─────────────────────────────────
  const batting: BattingAdvancedRow[] = [];
  for (const row of rows) {
    if (row.games_bat <= 0) continue;
    const pa = derivePA(row);
    if (pa < MIN_PA) continue;

    const conf = teamMap[row.team]?.conference ?? null;
    const line: BattingLine = {
      pa,
      ab: row.at_bats,
      h: row.hits,
      doubles: row.doubles,
      triples: row.triples,
      hr: row.home_runs,
      bb: row.walks_bat,
      hbp: row.hit_by_pitch,
      so: row.strikeouts_bat,
      sf: row.sacrifice_flies,
      r: row.runs,
      sb: row.stolen_bases,
      cs: row.caught_stealing,
      avg: row.at_bats > 0 ? row.hits / row.at_bats : 0,
      obp: row.on_base_pct || undefined,
      slg: row.slugging_pct || undefined,
    };

    const advanced = computeFullBattingLine(line, leagueCtx, 1.0, MLB_WOBA_WEIGHTS);

    // Estimated metrics (e-prefix)
    const babip = advanced.babip;
    const hrRate = row.at_bats > 0 ? row.home_runs / row.at_bats : 0;
    const confStrength = confStrengthMap.get(conf ?? '') ?? 50;
    const eBA = calculateEBA(babip, hrRate, advanced.kPct, confStrength);
    const eSLG = calculateESLG(advanced.iso, eBA);
    const eWOBA = calculateEWOBA(eBA, eSLG, advanced.bbPct);

    batting.push({
      player_id: row.espn_id,
      player_name: row.name,
      team: row.team,
      team_id: row.team_id,
      conference: conf,
      season,
      position: row.position,
      class_year: null,
      g: row.games_bat,
      ab: row.at_bats,
      pa,
      r: row.runs,
      h: row.hits,
      doubles: row.doubles,
      triples: row.triples,
      hr: row.home_runs,
      rbi: row.rbis,
      bb: row.walks_bat,
      so: row.strikeouts_bat,
      sb: row.stolen_bases,
      cs: row.caught_stealing,
      avg: round(advanced.avg),
      obp: round(advanced.obp),
      slg: round(advanced.slg),
      ops: round(advanced.ops),
      k_pct: round(advanced.kPct),
      bb_pct: round(advanced.bbPct),
      iso: round(advanced.iso),
      babip: round(advanced.babip),
      woba: round(advanced.woba),
      wrc_plus: round(advanced.wrcPlus, 1),
      ops_plus: round(advanced.opsPlus, 1),
      e_ba: round(eBA),
      e_slg: round(eSLG),
      e_woba: round(eWOBA),
      park_adjusted: 0,
      data_source: 'bsi-savant',
      computed_at: now,
    });
  }

  // ── Step 4: Compute pitching advanced ────────────────────────────────
  const pitching: PitchingAdvancedRow[] = [];
  for (const row of rows) {
    if (row.games_pitch <= 0) continue;
    const ip = thirdsToIP(row.innings_pitched_thirds);
    if (ip < MIN_IP) continue;

    const conf = teamMap[row.team]?.conference ?? null;
    const line: PitchingLine = {
      ip,
      h: row.hits_allowed,
      er: row.earned_runs,
      hr: row.home_runs_allowed,
      bb: row.walks_pitch,
      hbp: row.hit_by_pitch,
      so: row.strikeouts_pitch,
    };

    const advanced = computeFullPitchingLine(line, leagueCtx, 1.0);

    pitching.push({
      player_id: row.espn_id,
      player_name: row.name,
      team: row.team,
      team_id: row.team_id,
      conference: conf,
      season,
      position: row.position,
      class_year: null,
      g: row.games_pitch,
      gs: 0, // Not tracked in player_season_stats
      w: row.wins,
      l: row.losses,
      sv: row.saves,
      ip: round(ip, 1),
      h: row.hits_allowed,
      er: row.earned_runs,
      bb: row.walks_pitch,
      hbp: row.hit_by_pitch,
      so: row.strikeouts_pitch,
      era: round(advanced.era, 2),
      whip: round(advanced.whip, 2),
      k_9: round(advanced.k9, 1),
      bb_9: round(advanced.bb9, 1),
      hr_9: round(advanced.hr9, 1),
      fip: round(advanced.fip, 2),
      x_fip: advanced.xFip != null ? round(advanced.xFip, 2) : null,
      era_minus: round(advanced.eraMinus, 1),
      k_bb: round(advanced.kBB, 2),
      lob_pct: round(advanced.lobPct),
      babip: round(advanced.babip),
      park_adjusted: 0,
      data_source: 'bsi-savant',
      computed_at: now,
    });
  }

  // ── Step 5: Compute park factors per team ────────────────────────────
  // We don't have home/away splits in player_season_stats, so park factors
  // default to 1.0 with a methodology note. Real park factors require
  // game-level home/away data from bsi-game-db.
  const parkFactors: ParkFactorRow[] = [];
  const teamsWithPlayers = new Set<string>();
  for (const row of rows) {
    if (row.games_bat > 0 || row.games_pitch > 0) {
      teamsWithPlayers.add(row.team);
    }
  }
  for (const teamName of teamsWithPlayers) {
    const meta = teamMap[teamName];
    parkFactors.push({
      team: teamName,
      team_id: null,
      venue_name: meta?.stadium ?? null,
      conference: meta?.conference ?? null,
      season,
      runs_factor: 1.0,
      hits_factor: 1.0,
      hr_factor: 1.0,
      bb_factor: 1.0,
      so_factor: 1.0,
      sample_games: 0,
      methodology_note: 'Default neutral — home/away splits not yet available from box-score pipeline',
      computed_at: now,
    });
  }

  // ── Step 6: Compute conference strength ──────────────────────────────
  const confAgg = new Map<string, {
    totalERA: number; eraCount: number;
    totalOPS: number; opsCount: number;
    totalWOBA: number; wobaCount: number;
    totalRuns: number; games: number;
  }>();

  for (const b of batting) {
    if (!b.conference) continue;
    let agg = confAgg.get(b.conference);
    if (!agg) {
      agg = { totalERA: 0, eraCount: 0, totalOPS: 0, opsCount: 0, totalWOBA: 0, wobaCount: 0, totalRuns: 0, games: 0 };
      confAgg.set(b.conference, agg);
    }
    agg.totalOPS += b.ops;
    agg.opsCount += 1;
    agg.totalWOBA += b.woba;
    agg.wobaCount += 1;
    agg.totalRuns += b.r;
    agg.games += b.g;
  }
  for (const p of pitching) {
    if (!p.conference) continue;
    let agg = confAgg.get(p.conference);
    if (!agg) {
      agg = { totalERA: 0, eraCount: 0, totalOPS: 0, opsCount: 0, totalWOBA: 0, wobaCount: 0, totalRuns: 0, games: 0 };
      confAgg.set(p.conference, agg);
    }
    agg.totalERA += p.era;
    agg.eraCount += 1;
  }

  const conferenceStrength: ConferenceStrengthRow[] = [];
  for (const [conf, agg] of confAgg) {
    const avgERA = agg.eraCount > 0 ? agg.totalERA / agg.eraCount : 5.0;
    const avgOPS = agg.opsCount > 0 ? agg.totalOPS / agg.opsCount : 0.700;
    const avgWOBA = agg.wobaCount > 0 ? agg.totalWOBA / agg.wobaCount : 0.320;
    const runEnv = agg.games > 0 ? agg.totalRuns / agg.games : 5.0;

    // Inter-conference win pct and RPI not available from box-score data.
    // Use placeholder values weighted by offensive + pitching quality.
    const estWinPct = 0.50;
    const estRPI = 0.50;

    const strength = calculateConferenceStrength(estWinPct, estRPI, avgWOBA, avgERA);

    conferenceStrength.push({
      conference: conf,
      season,
      strength_index: round(strength, 1),
      run_environment: round(runEnv, 2),
      avg_era: round(avgERA, 2),
      avg_ops: round(avgOPS, 3),
      avg_woba: round(avgWOBA, 3),
      inter_conf_win_pct: round(estWinPct, 3),
      rpi_avg: round(estRPI, 3),
      is_power: POWER_CONFERENCES.has(conf) ? 1 : 0,
      computed_at: now,
    });
  }

  // Update confStrengthMap with post-compute values (uses averaged batting+pitching output).
  // No reads occur after this point — harmless update, available for future park-factor use.
  for (const cs of conferenceStrength) {
    confStrengthMap.set(cs.conference, cs.strength_index);
  }

  return {
    batting,
    pitching,
    parkFactors,
    conferenceStrength,
    league: leagueCtx,
    summary: {
      totalPlayers: rows.length,
      qualifiedBatters: batting.length,
      qualifiedPitchers: pitching.length,
      venues: parkFactors.length,
      conferences: conferenceStrength.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Conference strength pre-pass
// ---------------------------------------------------------------------------

/**
 * Pre-pass: derive per-conference strength from raw rows.
 * Runs before the main batting/pitching compute so confStrengthMap
 * is populated when Step 3 reads it.
 */
function buildInitialConferenceStrengthMap(
  rows: RawPlayerRow[],
  teamMap: TeamConferenceMap,
): Map<string, number> {
  const confAgg = new Map<string, {
    woba: number; wobaCount: number;
    era: number; eraCount: number;
  }>();

  for (const row of rows) {
    const conf = teamMap[row.team]?.conference;
    if (!conf) continue;

    if (!confAgg.has(conf)) confAgg.set(conf, { woba: 0, wobaCount: 0, era: 0, eraCount: 0 });
    const agg = confAgg.get(conf)!;

    if (row.games_bat > 0) {
      const pa = row.at_bats + row.walks_bat + row.hit_by_pitch + row.sacrifice_flies;
      if (pa >= MIN_PA) {
        const line: BattingLine = {
          pa, ab: row.at_bats, h: row.hits,
          doubles: row.doubles, triples: row.triples, hr: row.home_runs,
          bb: row.walks_bat, hbp: row.hit_by_pitch, so: row.strikeouts_bat, sf: row.sacrifice_flies,
        };
        agg.woba += calculateWOBA(line);
        agg.wobaCount += 1;
      }
    }

    if (row.games_pitch > 0) {
      const ip = thirdsToIP(row.innings_pitched_thirds);
      if (ip >= MIN_IP) {
        agg.era += ip > 0 ? (row.earned_runs * 9) / ip : 0;
        agg.eraCount += 1;
      }
    }
  }

  const map = new Map<string, number>();
  for (const [conf, agg] of confAgg) {
    const avgWOBA = agg.wobaCount > 0 ? agg.woba / agg.wobaCount : 0.320;
    const avgERA = agg.eraCount > 0 ? agg.era / agg.eraCount : 4.50;
    map.set(conf, calculateConferenceStrength(0.50, 0.50, avgWOBA, avgERA));
  }
  return map;
}

// ---------------------------------------------------------------------------
// League context derivation
// ---------------------------------------------------------------------------

function deriveLeagueContext(rows: RawPlayerRow[]): LeagueContext {
  // Aggregate all qualified batters for league averages
  let totalPA = 0, totalAB = 0, totalH = 0, totalHR = 0;
  let totalBB = 0, totalHBP = 0, totalSO = 0, totalSF = 0;
  let total2B = 0, total3B = 0;
  let totalR = 0;

  // Aggregate pitching for FIP constant
  let totalIP = 0, totalER = 0;
  let totalPitchHR = 0, totalPitchBB = 0, totalPitchK = 0;

  for (const row of rows) {
    if (row.games_bat > 0) {
      const pa = derivePA(row);
      if (pa >= MIN_PA) {
        totalPA += pa;
        totalAB += row.at_bats;
        totalH += row.hits;
        totalHR += row.home_runs;
        totalBB += row.walks_bat;
        totalHBP += row.hit_by_pitch;
        totalSO += row.strikeouts_bat;
        totalSF += row.sacrifice_flies;
        total2B += row.doubles;
        total3B += row.triples;
        totalR += row.runs;
      }
    }

    if (row.games_pitch > 0) {
      const ip = thirdsToIP(row.innings_pitched_thirds);
      if (ip >= MIN_IP) {
        totalIP += ip;
        totalER += row.earned_runs;
        totalPitchHR += row.home_runs_allowed;
        totalPitchBB += row.walks_pitch;
        totalPitchK += row.strikeouts_pitch;
      }
    }
  }

  // League batting averages
  const lgAVG = totalAB > 0 ? totalH / totalAB : 0.260;
  const lgOBP = totalPA > 0 ? (totalH + totalBB + totalHBP) / totalPA : 0.340;
  const singles = totalH - total2B - total3B - totalHR;
  const lgSLG = totalAB > 0
    ? (singles + 2 * total2B + 3 * total3B + 4 * totalHR) / totalAB
    : 0.400;

  // League wOBA
  const lgBattingLine: BattingLine = {
    pa: totalPA || 1,
    ab: totalAB || 1,
    h: totalH,
    doubles: total2B,
    triples: total3B,
    hr: totalHR,
    bb: totalBB,
    hbp: totalHBP,
    so: totalSO,
    sf: totalSF,
  };
  const lgWOBA = calculateWOBA(lgBattingLine);

  // League ERA
  const lgERA = totalIP > 0 ? (totalER * 9) / totalIP : 4.50;

  // Derived constants
  const fipConstant = calculateFIPConstant(lgERA, totalPitchHR, totalPitchBB, totalPitchK, totalIP);
  const wobaScale = calculateWOBAScale(lgOBP, lgWOBA, lgAVG);
  const runsPerPA = totalPA > 0 ? totalR / totalPA : 0.11;

  return {
    woba: lgWOBA,
    obp: lgOBP,
    avg: lgAVG,
    slg: lgSLG,
    era: lgERA,
    runsPerPA,
    wobaScale,
    fipConstant,
  };
}
