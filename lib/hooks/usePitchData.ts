/**
 * usePitchData Hook
 *
 * Fetches pitch-by-pitch data from MLB StatsAPI for live game tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface Pitch {
  id: string;
  pitchNumber: number;
  type: string;
  speed: number;
  spinRate?: number;
  result: string;
  zone?: number;
  coordinates?: {
    x: number;
    y: number;
  };
  breakAngle?: number;
  breakLength?: number;
}

interface AtBat {
  atBatIndex: number;
  batter: {
    id: number;
    name: string;
  };
  pitcher: {
    id: number;
    name: string;
  };
  result: string;
  description: string;
  pitches: Pitch[];
  rbi: number;
  isScoring: boolean;
}

interface LiveGameState {
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  balls: number;
  strikes: number;
  runners: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  homeScore: number;
  awayScore: number;
}

interface PitchDataState {
  atBats: AtBat[];
  currentAtBatIndex: number;
  gameState: LiveGameState | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UsePitchDataOptions {
  /** Polling interval in ms for live games (default: 10000) */
  pollInterval?: number;
  /** Whether to poll for updates (default: true for live games) */
  enablePolling?: boolean;
}

const MLB_LIVE_API = 'https://statsapi.mlb.com/api/v1.1/game';

interface MLBLiveFeedResponse {
  liveData?: {
    linescore?: {
      currentInning?: number;
      isTopInning?: boolean;
      outs?: number;
      offense?: { first?: unknown; second?: unknown; third?: unknown };
      teams?: { home?: { runs?: number }; away?: { runs?: number } };
    };
    plays?: {
      allPlays?: unknown[];
      currentPlay?: { atBatIndex?: number; count?: { balls?: number; strikes?: number } };
    };
  };
  gameData?: {
    status?: { abstractGameState?: string };
  };
}

export function usePitchData(
  gamePk: number | null,
  options: UsePitchDataOptions = {}
): PitchDataState & { refresh: () => Promise<void> } {
  const { pollInterval = 10000, enablePolling = true } = options;

  const [state, setState] = useState<PitchDataState>({
    atBats: [],
    currentAtBatIndex: -1,
    gameState: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pitch data
  const fetchPitchData = useCallback(async () => {
    if (!gamePk) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${MLB_LIVE_API}/${gamePk}/feed/live`, {
        signal: abortControllerRef.current.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as MLBLiveFeedResponse;
      const liveData = data.liveData;
      const gameData = data.gameData;

      if (!liveData || !gameData) {
        throw new Error('Invalid game data');
      }

      // Parse game state
      const linescore = liveData.linescore;
      const plays = liveData.plays;

      const gameState: LiveGameState = {
        inning: linescore?.currentInning || 1,
        inningHalf: linescore?.isTopInning ? 'top' : 'bottom',
        outs: linescore?.outs || 0,
        balls: plays?.currentPlay?.count?.balls || 0,
        strikes: plays?.currentPlay?.count?.strikes || 0,
        runners: {
          first: !!linescore?.offense?.first,
          second: !!linescore?.offense?.second,
          third: !!linescore?.offense?.third,
        },
        homeScore: linescore?.teams?.home?.runs || 0,
        awayScore: linescore?.teams?.away?.runs || 0,
      };

      // Parse at-bats with pitch data
      const allPlays = plays?.allPlays || [];
      const atBats: AtBat[] = allPlays.map((play: any, index: number) => ({
        atBatIndex: index,
        batter: {
          id: play.matchup?.batter?.id || 0,
          name: play.matchup?.batter?.fullName || 'Unknown',
        },
        pitcher: {
          id: play.matchup?.pitcher?.id || 0,
          name: play.matchup?.pitcher?.fullName || 'Unknown',
        },
        result: play.result?.type || '',
        description: play.result?.description || '',
        pitches: parsePitches(play.playEvents || []),
        rbi: play.result?.rbi || 0,
        isScoring: play.about?.isScoringPlay || false,
      }));

      // Find current at-bat
      const currentAtBatIndex = plays?.currentPlay?.atBatIndex ?? atBats.length - 1;

      setState({
        atBats,
        currentAtBatIndex,
        gameState,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });

      // Check if game is live for polling
      const gameStatus = gameData.status?.abstractGameState;
      const isLive = gameStatus === 'Live';

      if (enablePolling && isLive) {
        pollTimeoutRef.current = setTimeout(fetchPitchData, pollInterval);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }

      console.error('[usePitchData] Fetch error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pitch data',
      }));
    }
  }, [gamePk, pollInterval, enablePolling]);

  // Parse pitch events from play data
  function parsePitches(playEvents: any[]): Pitch[] {
    return playEvents
      .filter((event) => event.isPitch)
      .map((pitch, index) => ({
        id: `pitch-${pitch.playId || index}`,
        pitchNumber: index + 1,
        type: pitch.details?.type?.description || 'Unknown',
        speed: pitch.pitchData?.startSpeed || 0,
        spinRate: pitch.pitchData?.breaks?.spinRate,
        result: pitch.details?.description || '',
        zone: pitch.pitchData?.zone,
        coordinates: pitch.pitchData?.coordinates
          ? {
              x: pitch.pitchData.coordinates.pX,
              y: pitch.pitchData.coordinates.pZ,
            }
          : undefined,
        breakAngle: pitch.pitchData?.breaks?.breakAngle,
        breakLength: pitch.pitchData?.breaks?.breakLength,
      }));
  }

  // Initial fetch
  useEffect(() => {
    fetchPitchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchPitchData]);

  return {
    ...state,
    refresh: fetchPitchData,
  };
}

/**
 * Hook for fetching pitch data for a specific at-bat
 */
export function useAtBatPitches(gamePk: number | null, atBatIndex: number) {
  const { atBats, loading, error } = usePitchData(gamePk, { enablePolling: false });

  const atBat = atBats[atBatIndex] || null;

  return {
    atBat,
    pitches: atBat?.pitches || [],
    loading,
    error,
  };
}
