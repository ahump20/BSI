'use client';

import type { AtBat } from '@/components/pitch-tracker';

interface GameState {
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  balls: number;
  strikes: number;
  awayScore: number;
  homeScore: number;
  runners: { first: boolean; second: boolean; third: boolean };
}

interface PitchDataOptions {
  pollInterval?: number;
  enablePolling?: boolean;
}

interface PitchDataResult {
  atBats: AtBat[];
  currentAtBatIndex: number;
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
}

export function usePitchData(
  gamePk: number | null,
  _options?: PitchDataOptions
): PitchDataResult {
  return {
    atBats: [],
    currentAtBatIndex: -1,
    gameState: null,
    loading: !!gamePk,
    error: null,
  };
}
