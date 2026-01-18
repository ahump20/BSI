/**
 * Sandlot Sluggers - Game State Management
 * Tracks innings, outs, runs, and at-bat state.
 */

// ============================================================================
// Types
// ============================================================================

export type GameMode = 'practice' | 'quickPlay' | 'hrDerby';

// Game configuration by mode
export const MODE_CONFIG = {
  practice: { innings: Infinity, outsPerInning: 3, derbyOuts: 0 },
  quickPlay: { innings: 3, outsPerInning: 3, derbyOuts: 0 },
  hrDerby: { innings: 1, outsPerInning: 0, derbyOuts: 10 }, // 10 outs in derby
} as const;

export type AtBatResult =
  | 'pending'
  | 'whiff'
  | 'foul'
  | 'out'
  | 'single'
  | 'double'
  | 'triple'
  | 'homeRun';

export type BaseState = {
  first: boolean;
  second: boolean;
  third: boolean;
};

export type GameState = {
  mode: GameMode;
  inning: number;
  topOfInning: boolean; // true = visitor batting, false = home batting
  outs: number;
  runs: { home: number; away: number };
  bases: BaseState;
  strikes: number;
  balls: number;
  pitchCount: number;
  lastResult: AtBatResult;
  gameOver: boolean;
  stats: GameStats;
};

export type GameStats = {
  totalPitches: number;
  totalSwings: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  whiffs: number;
  fouls: number;
  outs: number;
  runs: number;
  longestStreak: number;
  currentStreak: number;
  derbyOuts: number; // For HR Derby mode
};

// ============================================================================
// Initial State
// ============================================================================

export function createInitialState(mode: GameMode): GameState {
  return {
    mode,
    inning: 1,
    topOfInning: true,
    outs: 0,
    runs: { home: 0, away: 0 },
    bases: { first: false, second: false, third: false },
    strikes: 0,
    balls: 0,
    pitchCount: 0,
    lastResult: 'pending',
    gameOver: false,
    stats: {
      totalPitches: 0,
      totalSwings: 0,
      hits: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      whiffs: 0,
      fouls: 0,
      outs: 0,
      runs: 0,
      longestStreak: 0,
      currentStreak: 0,
      derbyOuts: 0,
    },
  };
}

// ============================================================================
// State Updates
// ============================================================================

export function recordPitch(state: GameState): GameState {
  return {
    ...state,
    pitchCount: state.pitchCount + 1,
    stats: {
      ...state.stats,
      totalPitches: state.stats.totalPitches + 1,
    },
  };
}

export function recordSwing(state: GameState): GameState {
  return {
    ...state,
    stats: {
      ...state.stats,
      totalSwings: state.stats.totalSwings + 1,
    },
  };
}

export function recordWhiff(state: GameState): GameState {
  const newStrikes = state.strikes + 1;
  const isStrikeout = newStrikes >= 3;

  let newState = {
    ...state,
    strikes: isStrikeout ? 0 : newStrikes,
    balls: isStrikeout ? 0 : state.balls,
    lastResult: 'whiff' as AtBatResult,
    stats: {
      ...state.stats,
      whiffs: state.stats.whiffs + 1,
      currentStreak: 0, // Reset streak on whiff
    },
  };

  if (isStrikeout) {
    newState = recordOut(newState);
  }

  return newState;
}

export function recordFoul(state: GameState): GameState {
  // Foul with less than 2 strikes adds a strike
  const newStrikes = state.strikes < 2 ? state.strikes + 1 : state.strikes;

  return {
    ...state,
    strikes: newStrikes,
    lastResult: 'foul',
    stats: {
      ...state.stats,
      fouls: state.stats.fouls + 1,
      // Foul doesn't break hit streak in our simplified model
    },
  };
}

export function recordBall(state: GameState): GameState {
  const newBalls = state.balls + 1;
  const isWalk = newBalls >= 4;

  if (isWalk) {
    // Walk advances runners
    return advanceRunners(
      {
        ...state,
        balls: 0,
        strikes: 0,
        lastResult: 'single', // Treat walk like single for simplicity
      },
      1
    );
  }

  return {
    ...state,
    balls: newBalls,
    lastResult: 'pending',
  };
}

export function recordOut(state: GameState): GameState {
  const newOuts = state.outs + 1;
  const isInningOver = newOuts >= 3;

  let newState: GameState = {
    ...state,
    outs: isInningOver ? 0 : newOuts,
    strikes: 0,
    balls: 0,
    lastResult: 'out',
    stats: {
      ...state.stats,
      outs: state.stats.outs + 1,
      currentStreak: 0,
    },
  };

  if (isInningOver) {
    newState = endHalfInning(newState);
  }

  return newState;
}

export function recordHit(
  state: GameState,
  hitType: 'single' | 'double' | 'triple' | 'homeRun'
): GameState {
  const basesToAdvance =
    hitType === 'single' ? 1 : hitType === 'double' ? 2 : hitType === 'triple' ? 3 : 4;

  const newStreak = state.stats.currentStreak + 1;

  let newState: GameState = {
    ...state,
    strikes: 0,
    balls: 0,
    lastResult: hitType,
    stats: {
      ...state.stats,
      hits: state.stats.hits + 1,
      singles: state.stats.singles + (hitType === 'single' ? 1 : 0),
      doubles: state.stats.doubles + (hitType === 'double' ? 1 : 0),
      triples: state.stats.triples + (hitType === 'triple' ? 1 : 0),
      homeRuns: state.stats.homeRuns + (hitType === 'homeRun' ? 1 : 0),
      currentStreak: newStreak,
      longestStreak: Math.max(state.stats.longestStreak, newStreak),
    },
  };

  newState = advanceRunners(newState, basesToAdvance);
  return newState;
}

// ============================================================================
// Base Running
// ============================================================================

export function advanceRunners(state: GameState, bases: number): GameState {
  const { first, second, third } = state.bases;
  let runsScored = 0;
  let newBases: BaseState = { first: false, second: false, third: false };

  if (bases === 4) {
    // Home run - everyone scores
    runsScored = 1 + (first ? 1 : 0) + (second ? 1 : 0) + (third ? 1 : 0);
  } else if (bases === 3) {
    // Triple - batter on third, everyone else scores
    runsScored = (first ? 1 : 0) + (second ? 1 : 0) + (third ? 1 : 0);
    newBases.third = true;
  } else if (bases === 2) {
    // Double - batter on second
    runsScored = (second ? 1 : 0) + (third ? 1 : 0);
    newBases.second = true;
    newBases.third = first;
  } else if (bases === 1) {
    // Single - batter on first
    runsScored = third ? 1 : 0;
    newBases.first = true;
    newBases.second = first;
    newBases.third = second;
  }

  const newRuns = state.topOfInning
    ? { home: state.runs.home, away: state.runs.away + runsScored }
    : { home: state.runs.home + runsScored, away: state.runs.away };

  return {
    ...state,
    bases: newBases,
    runs: newRuns,
    stats: {
      ...state.stats,
      runs: state.stats.runs + runsScored,
    },
  };
}

// ============================================================================
// Inning Management
// ============================================================================

function endHalfInning(state: GameState): GameState {
  // Clear bases
  const newBases: BaseState = { first: false, second: false, third: false };
  const config = MODE_CONFIG[state.mode];

  if (!state.topOfInning) {
    // End of full inning
    const newInning = state.inning + 1;

    // Check for game over based on mode config
    if (newInning > config.innings) {
      return {
        ...state,
        bases: newBases,
        topOfInning: true,
        inning: newInning,
        gameOver: true,
      };
    }

    return {
      ...state,
      bases: newBases,
      topOfInning: true,
      inning: newInning,
    };
  }

  // Switch to bottom of inning
  return {
    ...state,
    bases: newBases,
    topOfInning: false,
  };
}

// ============================================================================
// HR Derby Mode Handlers
// ============================================================================

export function recordDerbyOut(state: GameState): GameState {
  if (state.mode !== 'hrDerby') return state;

  const newDerbyOuts = state.stats.derbyOuts + 1;
  const config = MODE_CONFIG.hrDerby;

  return {
    ...state,
    strikes: 0,
    balls: 0,
    lastResult: 'out',
    gameOver: newDerbyOuts >= config.derbyOuts,
    stats: {
      ...state.stats,
      derbyOuts: newDerbyOuts,
      currentStreak: 0,
    },
  };
}

export function recordDerbyHR(state: GameState): GameState {
  if (state.mode !== 'hrDerby') return recordHit(state, 'homeRun');

  const newStreak = state.stats.currentStreak + 1;

  return {
    ...state,
    strikes: 0,
    balls: 0,
    lastResult: 'homeRun',
    runs: { home: state.runs.home + 1, away: 0 },
    stats: {
      ...state.stats,
      homeRuns: state.stats.homeRuns + 1,
      hits: state.stats.hits + 1,
      runs: state.stats.runs + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(state.stats.longestStreak, newStreak),
    },
  };
}

// ============================================================================
// Display Helpers
// ============================================================================

export function formatCount(state: GameState): string {
  return `${state.balls}-${state.strikes}`;
}

export function formatInning(state: GameState): string {
  const half = state.topOfInning ? 'Top' : 'Bot';
  return `${half} ${state.inning}`;
}

export function formatScore(state: GameState): string {
  return `Away ${state.runs.away} - Home ${state.runs.home}`;
}

export function formatBasesString(state: GameState): string {
  const { first, second, third } = state.bases;
  if (!first && !second && !third) return 'Bases empty';

  const occupied: string[] = [];
  if (first) occupied.push('1st');
  if (second) occupied.push('2nd');
  if (third) occupied.push('3rd');

  return `Runners: ${occupied.join(', ')}`;
}

export function getResultMessage(result: AtBatResult): string {
  switch (result) {
    case 'pending':
      return '';
    case 'whiff':
      return 'Swing and a miss!';
    case 'foul':
      return 'Foul ball!';
    case 'out':
      return 'Out!';
    case 'single':
      return 'Single!';
    case 'double':
      return 'Double!';
    case 'triple':
      return 'Triple!';
    case 'homeRun':
      return 'HOME RUN!';
  }
}

// ============================================================================
// Aliases for engine.ts compatibility
// ============================================================================

export const createGameState = createInitialState;

export function nextPitch(state: GameState): GameState {
  return recordPitch(state);
}

export function recordStrike(state: GameState): GameState {
  const newStrikes = state.strikes + 1;
  if (newStrikes >= 3) {
    // Strikeout
    return recordOut({
      ...state,
      strikes: 0,
      balls: 0,
      lastResult: 'whiff',
      stats: {
        ...state.stats,
        whiffs: state.stats.whiffs + 1,
        currentStreak: 0,
      },
    });
  }
  return {
    ...state,
    strikes: newStrikes,
  };
}

// advanceRunners is already exported above

export type GameStatus = 'playing' | 'strikeout' | 'walk' | 'gameOver';

export function getGameStatus(state: GameState): GameStatus {
  if (state.gameOver) return 'gameOver';
  if (state.strikes >= 3) return 'strikeout';
  if (state.balls >= 4) return 'walk';
  return 'playing';
}
