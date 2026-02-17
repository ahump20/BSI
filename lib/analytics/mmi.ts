/**
 * MMI (Momentum Magnitude Index) — BSI Proprietary Live Game Metric
 *
 * Ported from Sandlot-Sluggers/mmi-live/worker-mmi-engine.js and adapted
 * for college baseball via the Highlightly API data shapes.
 *
 * Formula: z(LI)·0.35 + z(Pressure)·0.20 + z(Fatigue)·0.20 + z(Execution)·0.15 + z(Bio)·0.10
 *
 * Scale: 0–100 (50 = routine, 70+ = elite pressure)
 * Updated in real-time during live games via the bsi-live-scores worker.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MMISnapshot {
  gameId: string;
  timestamp: string;
  mmi: number;
  category: 'Routine' | 'Moderate' | 'High Difficulty' | 'Elite Pressure';
  direction: 'home' | 'away' | 'neutral';
  components: {
    leverageIndex: { raw: number; zScore: number; weight: number };
    pressure: { raw: number; zScore: number; weight: number };
    fatigue: { raw: number; zScore: number; weight: number };
    execution: { raw: number; zScore: number; weight: number };
    bio: { raw: number; zScore: number; weight: number };
  };
  situation: {
    inning: number;
    half: 'top' | 'bottom';
    outs: number;
    score: string;
    scoreDiff: number;
  };
  meta: {
    source: string;
    computed_at: string;
    timezone: 'America/Chicago';
  };
}

export interface GameSituation {
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  homeScore: number;
  awayScore: number;
  runnersOn?: number;
  pitchCount?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEIGHTS = {
  leverageIndex: 0.35,
  pressure: 0.20,
  fatigue: 0.20,
  execution: 0.15,
  bio: 0.10,
};

const NORMALIZATION_PARAMS = {
  leverageIndex: { mean: 1.0, stdDev: 0.8 },
  pressure: { mean: 50, stdDev: 25 },
  fatigue: { mean: 50, stdDev: 20 },
  execution: { mean: 50, stdDev: 15 },
  bio: { mean: 50, stdDev: 10 },
};

// ---------------------------------------------------------------------------
// Core Computation
// ---------------------------------------------------------------------------

export function computeMMI(situation: GameSituation): MMISnapshot {
  const leverageIndex = calculateLeverageIndex(situation);
  const pressure = calculatePressure(situation);
  const fatigue = calculateFatigue(situation);
  const execution = calculateExecution(situation);
  const bio = calculateBioProxies(situation);

  const zScores = {
    leverageIndex: zScore(leverageIndex, NORMALIZATION_PARAMS.leverageIndex),
    pressure: zScore(pressure, NORMALIZATION_PARAMS.pressure),
    fatigue: zScore(fatigue, NORMALIZATION_PARAMS.fatigue),
    execution: zScore(execution, NORMALIZATION_PARAMS.execution),
    bio: zScore(bio, NORMALIZATION_PARAMS.bio),
  };

  const mmiRaw =
    zScores.leverageIndex * WEIGHTS.leverageIndex +
    zScores.pressure * WEIGHTS.pressure +
    zScores.fatigue * WEIGHTS.fatigue +
    zScores.execution * WEIGHTS.execution +
    zScores.bio * WEIGHTS.bio;

  // Transform z-score to 0-100 scale (mean=50, stdDev=15)
  const mmi = Math.max(0, Math.min(100, 50 + mmiRaw * 15));

  const scoreDiff = situation.homeScore - situation.awayScore;

  return {
    gameId: '',
    timestamp: new Date().toISOString(),
    mmi: round1(mmi),
    category: getMmiCategory(mmi),
    direction: scoreDiff > 0 ? 'home' : scoreDiff < 0 ? 'away' : 'neutral',
    components: {
      leverageIndex: { raw: round1(leverageIndex), zScore: round2(zScores.leverageIndex), weight: WEIGHTS.leverageIndex },
      pressure: { raw: round1(pressure), zScore: round2(zScores.pressure), weight: WEIGHTS.pressure },
      fatigue: { raw: round1(fatigue), zScore: round2(zScores.fatigue), weight: WEIGHTS.fatigue },
      execution: { raw: round1(execution), zScore: round2(zScores.execution), weight: WEIGHTS.execution },
      bio: { raw: round1(bio), zScore: round2(zScores.bio), weight: WEIGHTS.bio },
    },
    situation: {
      inning: situation.inning,
      half: situation.inningHalf,
      outs: situation.outs,
      score: `${situation.awayScore}-${situation.homeScore}`,
      scoreDiff,
    },
    meta: {
      source: 'bsi-mmi-engine',
      computed_at: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };
}

// ---------------------------------------------------------------------------
// Component Calculations (ported from Sandlot-Sluggers)
// ---------------------------------------------------------------------------

function calculateLeverageIndex(situation: GameSituation): number {
  const { inning, outs, homeScore, awayScore, runnersOn = 0 } = situation;

  // Inning factor (increases late in game)
  let inningFactor = 1.0;
  if (inning >= 7) inningFactor = 1.5;
  if (inning >= 9) inningFactor = 2.0;
  if (inning > 9) inningFactor = 2.5;

  // Score differential (close games = higher leverage)
  const scoreDiff = Math.abs(homeScore - awayScore);
  let scoreFactor = 1.0;
  if (scoreDiff === 0) scoreFactor = 2.0;
  else if (scoreDiff === 1) scoreFactor = 1.7;
  else if (scoreDiff === 2) scoreFactor = 1.3;
  else if (scoreDiff >= 5) scoreFactor = 0.3;

  // Baserunner factor
  let runnerFactor = 1.0;
  if (runnersOn === 0) runnerFactor = 0.8;
  else if (runnersOn === 1) runnerFactor = 1.2;
  else if (runnersOn === 2) runnerFactor = 1.6;
  else if (runnersOn >= 3) runnerFactor = 2.0;

  // Outs factor (2 outs = higher leverage)
  let outsFactor = 1.0;
  if (outs === 0) outsFactor = 0.9;
  else if (outs === 1) outsFactor = 1.1;
  else if (outs === 2) outsFactor = 1.4;

  return inningFactor * scoreFactor * runnerFactor * outsFactor;
}

function calculatePressure(situation: GameSituation): number {
  const { inning, outs } = situation;

  // Late-inning pressure
  let inningPressure = 30;
  if (inning >= 7) inningPressure = 50;
  if (inning >= 9) inningPressure = 70;
  if (inning > 9) inningPressure = 85;

  // Two-out pressure
  const outsPressure = outs === 2 ? 70 : 40;

  // Score closeness pressure
  const scoreDiff = Math.abs(situation.homeScore - situation.awayScore);
  let scorePressure = 30;
  if (scoreDiff === 0) scorePressure = 80;
  else if (scoreDiff === 1) scorePressure = 65;
  else if (scoreDiff === 2) scorePressure = 50;

  return (inningPressure + outsPressure + scorePressure) / 3;
}

function calculateFatigue(situation: GameSituation): number {
  const pitchCount = situation.pitchCount || 0;

  // Pitch count fatigue (exponential after 80 pitches)
  let pitchFatigue = 30;
  if (pitchCount > 60) pitchFatigue = 40;
  if (pitchCount > 80) pitchFatigue = 60;
  if (pitchCount > 100) pitchFatigue = 80;
  if (pitchCount > 120) pitchFatigue = 95;

  // Inning-based fatigue estimate (college pitchers tire earlier)
  let inningFatigue = 25;
  if (situation.inning >= 5) inningFatigue = 40;
  if (situation.inning >= 7) inningFatigue = 55;
  if (situation.inning >= 9) inningFatigue = 70;

  return pitchFatigue * 0.6 + inningFatigue * 0.4;
}

function calculateExecution(situation: GameSituation): number {
  const { outs, inning } = situation;

  // Base execution difficulty
  let baseDifficulty = 40;

  // Two-out situations require clutch execution
  if (outs === 2) baseDifficulty = 65;
  if (outs === 2 && inning >= 7) baseDifficulty = 80;

  // Runners on base increases execution demand
  if ((situation.runnersOn || 0) >= 2) baseDifficulty += 15;

  return Math.min(100, baseDifficulty);
}

function calculateBioProxies(situation: GameSituation): number {
  // Bio proxies estimated from game state (no direct biometric data)
  // Later innings + high pressure = higher bio impact
  let tempo = 50;
  if (situation.inning >= 7) tempo = 60;
  if (situation.inning >= 9) tempo = 75;

  const scoreDiff = Math.abs(situation.homeScore - situation.awayScore);
  if (scoreDiff <= 1 && situation.inning >= 7) tempo = 80;

  return tempo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zScore(value: number, params: { mean: number; stdDev: number }): number {
  return params.stdDev > 0 ? (value - params.mean) / params.stdDev : 0;
}

function getMmiCategory(mmi: number): MMISnapshot['category'] {
  if (mmi >= 70) return 'Elite Pressure';
  if (mmi >= 55) return 'High Difficulty';
  if (mmi >= 40) return 'Moderate';
  return 'Routine';
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
