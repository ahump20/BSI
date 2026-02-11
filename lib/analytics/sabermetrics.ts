/**
 * Sabermetric Computation Engine
 *
 * Calculates advanced batting and pitching metrics from raw Tank01 stats.
 * Used by the worker for team analytics, player comparison, and readiness scoring.
 */

import type { RawBatter, RawPitcher } from './tank01-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BattingAdvanced {
  playerID: string;
  name: string;
  pos: string;
  pa: number;
  ab: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  iso: number;
  babip: number;
  woba: number;
  bbPct: number;
  kPct: number;
  hrPct: number;
}

export interface PitchingAdvanced {
  playerID: string;
  name: string;
  pos: string;
  ip: number;
  era: number;
  fip: number;
  whip: number;
  kPer9: number;
  bbPer9: number;
  hrPer9: number;
  kPct: number;
  bbPct: number;
  kBbRatio: number;
}

export interface TeamAnalytics {
  avgOps: number;
  avgWoba: number;
  avgBbPct: number;
  avgKPct: number;
  avgIso: number;
  totalPA: number;
  playerCount: number;
}

export interface TeamPitchingAnalytics {
  avgFip: number;
  avgEra: number;
  avgKPer9: number;
  avgBbPer9: number;
  avgWhip: number;
  totalIP: number;
  playerCount: number;
}

// ---------------------------------------------------------------------------
// Constants — linear weight coefficients (2024 MLB environment)
// ---------------------------------------------------------------------------

const WOBA_BB = 0.690;
const WOBA_HBP = 0.722;
const WOBA_1B = 0.888;
const WOBA_2B = 1.271;
const WOBA_3B = 1.616;
const WOBA_HR = 2.101;
const WOBA_SCALE = 1.226;

// FIP constant (league-adjusted, approximate for 2024)
const FIP_CONSTANT = 3.17;

// ---------------------------------------------------------------------------
// Batting Advanced
// ---------------------------------------------------------------------------

export function computeBattingAdvanced(batter: RawBatter): BattingAdvanced {
  const { ab, pa, h, doubles, triples, hr, bb, hbp, so, sf } = batter;
  const singles = h - doubles - triples - hr;
  const safePa = Math.max(pa, 1);
  const safeAb = Math.max(ab, 1);

  const avg = batter.avg || h / safeAb;
  const obp = batter.obp || (h + bb + hbp) / Math.max(pa, 1);
  const slg = batter.slg || (singles + 2 * doubles + 3 * triples + 4 * hr) / safeAb;
  const ops = batter.ops || obp + slg;
  const iso = slg - avg;

  // BABIP: (H - HR) / (AB - SO - HR + SF)
  const babipDenom = ab - so - hr + sf;
  const babip = babipDenom > 0 ? (h - hr) / babipDenom : 0;

  // wOBA
  const wobaDenom = ab + bb - (batter.sf || 0) + hbp;
  const woba = wobaDenom > 0
    ? (WOBA_BB * bb + WOBA_HBP * hbp + WOBA_1B * singles + WOBA_2B * doubles + WOBA_3B * triples + WOBA_HR * hr) / wobaDenom
    : 0;

  return {
    playerID: batter.playerID,
    name: batter.name,
    pos: batter.pos,
    pa,
    ab,
    avg: round3(avg),
    obp: round3(obp),
    slg: round3(slg),
    ops: round3(ops),
    iso: round3(iso),
    babip: round3(babip),
    woba: round3(woba),
    bbPct: round1((bb / safePa) * 100),
    kPct: round1((so / safePa) * 100),
    hrPct: round1((hr / safePa) * 100),
  };
}

// ---------------------------------------------------------------------------
// Pitching Advanced
// ---------------------------------------------------------------------------

export function computePitchingAdvanced(pitcher: RawPitcher): PitchingAdvanced {
  const { ip, era, hr, bb, so, hbp, whip } = pitcher;
  const safeIp = Math.max(ip, 0.1);

  // FIP: ((13*HR + 3*(BB+HBP) - 2*K) / IP) + FIP_CONSTANT
  const fip = ((13 * hr + 3 * (bb + hbp) - 2 * so) / safeIp) + FIP_CONSTANT;

  const kPer9 = pitcher.k9 || (so / safeIp) * 9;
  const bbPer9 = pitcher.bb9 || (bb / safeIp) * 9;
  const hrPer9 = (hr / safeIp) * 9;

  // Batters faced estimate: IP * 3 + H + BB + HBP (rough)
  const bfEst = Math.max(safeIp * 3 + pitcher.h + bb + hbp, 1);
  const kPct = (so / bfEst) * 100;
  const bbPct = (bb / bfEst) * 100;

  return {
    playerID: pitcher.playerID,
    name: pitcher.name,
    pos: pitcher.pos,
    ip,
    era: round2(era),
    fip: round2(Math.max(0, fip)),
    whip: round3(whip || (pitcher.h + bb) / safeIp),
    kPer9: round1(kPer9),
    bbPer9: round1(bbPer9),
    hrPer9: round1(hrPer9),
    kPct: round1(kPct),
    bbPct: round1(bbPct),
    kBbRatio: round2(bb > 0 ? so / bb : so),
  };
}

// ---------------------------------------------------------------------------
// Team Aggregates
// ---------------------------------------------------------------------------

export function aggregateTeamBatting(batters: BattingAdvanced[]): TeamAnalytics {
  if (batters.length === 0) {
    return { avgOps: 0, avgWoba: 0, avgBbPct: 0, avgKPct: 0, avgIso: 0, totalPA: 0, playerCount: 0 };
  }
  const totalPA = batters.reduce((s, b) => s + b.pa, 0);
  // PA-weighted averages
  const weighted = (fn: (b: BattingAdvanced) => number) =>
    totalPA > 0 ? batters.reduce((s, b) => s + fn(b) * b.pa, 0) / totalPA : 0;

  return {
    avgOps: round3(weighted(b => b.ops)),
    avgWoba: round3(weighted(b => b.woba)),
    avgBbPct: round1(weighted(b => b.bbPct)),
    avgKPct: round1(weighted(b => b.kPct)),
    avgIso: round3(weighted(b => b.iso)),
    totalPA,
    playerCount: batters.length,
  };
}

export function aggregateTeamPitching(pitchers: PitchingAdvanced[]): TeamPitchingAnalytics {
  if (pitchers.length === 0) {
    return { avgFip: 0, avgEra: 0, avgKPer9: 0, avgBbPer9: 0, avgWhip: 0, totalIP: 0, playerCount: 0 };
  }
  const totalIP = pitchers.reduce((s, p) => s + p.ip, 0);
  const weighted = (fn: (p: PitchingAdvanced) => number) =>
    totalIP > 0 ? pitchers.reduce((s, p) => s + fn(p) * p.ip, 0) / totalIP : 0;

  return {
    avgFip: round2(weighted(p => p.fip)),
    avgEra: round2(weighted(p => p.era)),
    avgKPer9: round1(weighted(p => p.kPer9)),
    avgBbPer9: round1(weighted(p => p.bbPer9)),
    avgWhip: round3(weighted(p => p.whip)),
    totalIP,
    playerCount: pitchers.length,
  };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

interface ComparisonField {
  label: string;
  p1: number;
  p2: number;
  advantage: 'p1' | 'p2' | 'even';
  higherIsBetter: boolean;
}

export function compareBatters(b1: BattingAdvanced, b2: BattingAdvanced): {
  player1: string;
  player2: string;
  fields: ComparisonField[];
} {
  const compare = (label: string, v1: number, v2: number, higherIsBetter = true): ComparisonField => ({
    label,
    p1: v1,
    p2: v2,
    advantage: v1 === v2 ? 'even' : (higherIsBetter ? (v1 > v2 ? 'p1' : 'p2') : (v1 < v2 ? 'p1' : 'p2')),
    higherIsBetter,
  });

  return {
    player1: b1.name,
    player2: b2.name,
    fields: [
      compare('AVG', b1.avg, b2.avg),
      compare('OBP', b1.obp, b2.obp),
      compare('SLG', b1.slg, b2.slg),
      compare('OPS', b1.ops, b2.ops),
      compare('wOBA', b1.woba, b2.woba),
      compare('ISO', b1.iso, b2.iso),
      compare('BABIP', b1.babip, b2.babip),
      compare('BB%', b1.bbPct, b2.bbPct),
      compare('K%', b1.kPct, b2.kPct, false),
    ],
  };
}

export function comparePitchers(p1: PitchingAdvanced, p2: PitchingAdvanced): {
  player1: string;
  player2: string;
  fields: ComparisonField[];
} {
  const compare = (label: string, v1: number, v2: number, higherIsBetter = true): ComparisonField => ({
    label,
    p1: v1,
    p2: v2,
    advantage: v1 === v2 ? 'even' : (higherIsBetter ? (v1 > v2 ? 'p1' : 'p2') : (v1 < v2 ? 'p1' : 'p2')),
    higherIsBetter,
  });

  return {
    player1: p1.name,
    player2: p2.name,
    fields: [
      compare('ERA', p1.era, p2.era, false),
      compare('FIP', p1.fip, p2.fip, false),
      compare('WHIP', p1.whip, p2.whip, false),
      compare('K/9', p1.kPer9, p2.kPer9),
      compare('BB/9', p1.bbPer9, p2.bbPer9, false),
      compare('K/BB', p1.kBbRatio, p2.kBbRatio),
      compare('K%', p1.kPct, p2.kPct),
      compare('BB%', p1.bbPct, p2.bbPct, false),
    ],
  };
}

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function round3(n: number): number { return Math.round(n * 1000) / 1000; }
