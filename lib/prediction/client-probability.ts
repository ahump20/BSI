/**
 * Client-safe Win Probability Calculations
 *
 * Sport-specific Pythagorean exponents and probability formulas
 * that can run in the browser without server dependencies.
 *
 * @see https://en.wikipedia.org/wiki/Pythagorean_expectation
 */

export type Sport = 'cfb' | 'nfl' | 'mlb' | 'cbb' | 'nba';

export interface Team {
  id: string;
  name: string;
  rating: number;
  record?: string;
  ranking?: number;
}

export interface FootballState {
  timeRemaining: number; // minutes remaining in game
  possession: 'home' | 'away';
  down: number;
  distance: number;
  fieldPosition: number; // yards from goal
}

export interface BaseballState {
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  runners: string; // e.g., '101' for 1st and 3rd
}

export interface BasketballState {
  timeRemaining: number; // seconds remaining
  possession: 'home' | 'away';
}

export interface ProbabilityInput {
  sport: Sport;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  gameState?: FootballState | BaseballState | BasketballState;
}

export interface ProbabilityResult {
  homeWinProbability: number;
  awayWinProbability: number;
  confidence: number;
  factors: {
    ratingDiff: number;
    scoreDiff: number;
    homeAdvantage: number;
    situationalAdj: number;
  };
}

// Sport-specific Pythagorean exponents (empirically derived)
const PYTHAGOREAN_EXPONENTS: Record<Sport, number> = {
  cfb: 2.37, // College football
  nfl: 2.37, // NFL
  mlb: 1.83, // MLB (Bill James original)
  cbb: 10.25, // College baseball (Davenport)
  nba: 13.91, // NBA (Hollinger)
};

// Home field advantage in win probability points
const HOME_ADVANTAGE: Record<Sport, number> = {
  cfb: 0.07, // 7% in college football
  nfl: 0.045, // 4.5% in NFL
  mlb: 0.04, // 4% in MLB
  cbb: 0.05, // 5% in college baseball
  nba: 0.06, // 6% in NBA
};

// Run expectancy matrix (runners/outs) for baseball
const RUN_EXPECTANCY: Record<string, Record<number, number>> = {
  '000': { 0: 0.48, 1: 0.26, 2: 0.1 },
  '100': { 0: 0.85, 1: 0.51, 2: 0.22 },
  '010': { 0: 1.1, 1: 0.66, 2: 0.32 },
  '001': { 0: 1.35, 1: 0.95, 2: 0.36 },
  '110': { 0: 1.44, 1: 0.9, 2: 0.45 },
  '101': { 0: 1.78, 1: 1.2, 2: 0.49 },
  '011': { 0: 1.96, 1: 1.38, 2: 0.58 },
  '111': { 0: 2.29, 1: 1.54, 2: 0.75 },
};

/**
 * Calculate Pythagorean win expectancy
 * Formula: (R^exp) / (R^exp + RA^exp)
 */
function pythagoreanExpectancy(pointsFor: number, pointsAgainst: number, exponent: number): number {
  if (pointsFor <= 0 || pointsAgainst <= 0) return 0.5;
  const pfExp = Math.pow(pointsFor, exponent);
  const paExp = Math.pow(pointsAgainst, exponent);
  return pfExp / (pfExp + paExp);
}

/**
 * Convert team rating (0-100) to expected points
 */
function ratingToExpectedPoints(rating: number, sport: Sport): number {
  const basePoints: Record<Sport, { avg: number; spread: number }> = {
    cfb: { avg: 28, spread: 14 },
    nfl: { avg: 23, spread: 10 },
    mlb: { avg: 4.5, spread: 1.5 },
    cbb: { avg: 6, spread: 2 },
    nba: { avg: 110, spread: 12 },
  };

  const base = basePoints[sport];
  const deviation = (rating - 75) / 25; // Normalize around 75 rating
  return base.avg + deviation * base.spread;
}

/**
 * Calculate pre-game win probability based on team ratings
 */
function calculatePreGameProbability(input: ProbabilityInput): number {
  const { sport, homeTeam, awayTeam } = input;
  const exponent = PYTHAGOREAN_EXPONENTS[sport];
  const homeAdv = HOME_ADVANTAGE[sport];

  const homeExpectedPts = ratingToExpectedPoints(homeTeam.rating, sport);
  const awayExpectedPts = ratingToExpectedPoints(awayTeam.rating, sport);

  // Pythagorean expectancy for matchup
  const baseProb = pythagoreanExpectancy(homeExpectedPts, awayExpectedPts, exponent);

  // Add home field advantage
  return Math.max(0.01, Math.min(0.99, baseProb + homeAdv));
}

/**
 * Football-specific in-game probability adjustments
 */
function calculateFootballProbability(input: ProbabilityInput): ProbabilityResult {
  const { homeScore, awayScore, gameState } = input;
  const state = gameState as FootballState | undefined;

  let baseProb = calculatePreGameProbability(input);
  const scoreDiff = homeScore - awayScore;

  // If no game state, return pre-game probability adjusted for score
  if (!state) {
    const scoreAdj = scoreDiff * 0.025;
    baseProb = Math.max(0.01, Math.min(0.99, baseProb + scoreAdj));
    return buildResult(input, baseProb, 0);
  }

  // Time factor: score matters more as game progresses
  const timeMultiplier = 1 - state.timeRemaining / 60;
  const scoreImpact = scoreDiff * 0.035 * (0.5 + timeMultiplier);
  baseProb += scoreImpact;

  // Field position value (yards from goal)
  const fieldPosValue = ((100 - state.fieldPosition) / 100) * 0.05;
  const posAdj = state.possession === 'home' ? fieldPosValue : -fieldPosValue;
  baseProb += posAdj;

  // Down and distance
  let downDistAdj = 0;
  if (state.down === 1 && state.distance <= 10) downDistAdj = 0.02;
  else if (state.down === 3 && state.distance > 7) downDistAdj = -0.015;
  else if (state.down === 4) downDistAdj = -0.025;

  if (state.possession === 'home') {
    baseProb += downDistAdj;
  } else {
    baseProb -= downDistAdj;
  }

  // Late game volatility
  if (state.timeRemaining < 10 && Math.abs(scoreDiff) <= 7) {
    baseProb = 0.5 + (baseProb - 0.5) * 1.3;
  }

  const situationalAdj = scoreImpact + posAdj + downDistAdj;
  return buildResult(input, baseProb, situationalAdj);
}

/**
 * Baseball-specific in-game probability adjustments
 */
function calculateBaseballProbability(input: ProbabilityInput): ProbabilityResult {
  const { homeScore, awayScore, gameState } = input;
  const state = gameState as BaseballState | undefined;

  let baseProb = calculatePreGameProbability(input);
  const scoreDiff = homeScore - awayScore;

  if (!state) {
    const scoreAdj = scoreDiff * 0.04;
    baseProb = Math.max(0.01, Math.min(0.99, baseProb + scoreAdj));
    return buildResult(input, baseProb, 0);
  }

  // Inning weight: later innings amplify score differential
  const inningWeight = state.inning / 9;
  const scoreImpact = scoreDiff * 0.06 * inningWeight;
  baseProb += scoreImpact;

  // Late inning leverage
  if (state.inning >= 7) {
    baseProb = 0.5 + (baseProb - 0.5) * (1 + (state.inning - 6) * 0.15);
  }

  // Bottom of inning comeback potential
  if (state.inningHalf === 'bottom' && scoreDiff < 0 && state.inning >= 7) {
    baseProb += 0.03;
  }

  // Run expectancy adjustment
  const currentRE = RUN_EXPECTANCY[state.runners]?.[state.outs] ?? 0.48;
  const reAdjustment = (currentRE - 0.48) * 0.02;

  if (state.inningHalf === 'top') {
    baseProb -= reAdjustment;
  } else {
    baseProb += reAdjustment;
  }

  const situationalAdj = scoreImpact + reAdjustment;
  return buildResult(input, baseProb, situationalAdj);
}

/**
 * Basketball-specific in-game probability adjustments
 */
function calculateBasketballProbability(input: ProbabilityInput): ProbabilityResult {
  const { homeScore, awayScore, gameState } = input;
  const state = gameState as BasketballState | undefined;

  let baseProb = calculatePreGameProbability(input);
  const scoreDiff = homeScore - awayScore;

  if (!state) {
    const scoreAdj = scoreDiff * 0.008;
    baseProb = Math.max(0.01, Math.min(0.99, baseProb + scoreAdj));
    return buildResult(input, baseProb, 0);
  }

  // Total game time varies (college vs pro)
  const totalTime = input.sport === 'nba' ? 48 * 60 : 40 * 60;
  const timeMultiplier = 1 - state.timeRemaining / totalTime;

  // Score impact scales with time remaining
  const scoreImpact = scoreDiff * 0.008 * (0.5 + timeMultiplier);
  baseProb += scoreImpact;

  // Possession value in close games
  let posAdj = 0;
  if (Math.abs(scoreDiff) <= 5 && state.timeRemaining < 120) {
    posAdj = state.possession === 'home' ? 0.02 : -0.02;
    baseProb += posAdj;
  }

  const situationalAdj = scoreImpact + posAdj;
  return buildResult(input, baseProb, situationalAdj);
}

function buildResult(
  input: ProbabilityInput,
  probability: number,
  situationalAdj: number
): ProbabilityResult {
  const clampedProb = Math.max(0.01, Math.min(0.99, probability));

  // Confidence based on rating gap and situational clarity
  const ratingGap = Math.abs(input.homeTeam.rating - input.awayTeam.rating);
  const confidence = Math.min(0.95, 0.6 + ratingGap * 0.01);

  return {
    homeWinProbability: clampedProb,
    awayWinProbability: 1 - clampedProb,
    confidence,
    factors: {
      ratingDiff: input.homeTeam.rating - input.awayTeam.rating,
      scoreDiff: input.homeScore - input.awayScore,
      homeAdvantage: HOME_ADVANTAGE[input.sport],
      situationalAdj,
    },
  };
}

/**
 * Main entry point for win probability calculation
 */
export function calculateWinProbability(input: ProbabilityInput): ProbabilityResult {
  switch (input.sport) {
    case 'cfb':
    case 'nfl':
      return calculateFootballProbability(input);
    case 'mlb':
    case 'cbb':
      return calculateBaseballProbability(input);
    case 'nba':
      return calculateBasketballProbability(input);
    default:
      return buildResult(input, 0.5, 0);
  }
}

/**
 * Pre-game probability (no in-game state)
 */
export function calculatePreGameWinProbability(
  sport: Sport,
  homeTeam: Team,
  awayTeam: Team
): ProbabilityResult {
  return calculateWinProbability({
    sport,
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
  });
}
