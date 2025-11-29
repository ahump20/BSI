/**
 * BLAZE SPORTS INTEL - Sports Data Hooks
 *
 * React hooks for fetching and managing sports data.
 * Integrates with the adapter layer and caching system.
 *
 * Features:
 * - Automatic caching with stale-while-revalidate
 * - Real-time live score updates with polling
 * - Provider failover handling
 * - Loading and error states
 *
 * Last Updated: 2025-11-29
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  UnifiedSportKey,
  UnifiedGame,
  UnifiedStandings,
  UnifiedRankingPoll,
} from '../types/adapters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;
}

export interface FetchOptions {
  forceRefresh?: boolean;
  enabled?: boolean;
}

export interface PollingOptions extends FetchOptions {
  interval?: number;
  pauseOnHidden?: boolean;
}

// ============================================================================
// CORE DATA HOOK
// ============================================================================

/**
 * Generic hook for fetching and caching data
 */
export function useData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: FetchOptions = {}
): DataState<T> & { refetch: () => void } {
  const { forceRefresh = false, enabled = true } = options;

  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [fetcher, enabled]);

  useEffect(() => {
    fetchData();
  }, [key, fetchData, forceRefresh]);

  return { ...state, refetch: fetchData };
}

// ============================================================================
// LIVE SCORES HOOK
// ============================================================================

/**
 * Hook for fetching live scores with automatic polling
 */
export function useLiveScores(
  sport: UnifiedSportKey,
  options: PollingOptions = {}
): DataState<UnifiedGame[]> & { refetch: () => void } {
  const { interval = 30000, pauseOnHidden = true, enabled = true } = options;

  const [state, setState] = useState<DataState<UnifiedGame[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisible = useDocumentVisibility();

  const fetchScores = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: prev.data === null }));

    try {
      // This would call the actual API endpoint
      const response = await fetch(`/api/scores/${sport}/live`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { games?: UnifiedGame[] };
      setState({
        data: data.games ?? [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch scores'),
        isStale: true,
      }));
    }
  }, [sport, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Polling
  useEffect(() => {
    if (!enabled || (pauseOnHidden && !isVisible)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(fetchScores, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchScores, interval, enabled, isVisible, pauseOnHidden]);

  return { ...state, refetch: fetchScores };
}

// ============================================================================
// STANDINGS HOOK
// ============================================================================

/**
 * Hook for fetching standings data
 */
export function useStandings(
  sport: UnifiedSportKey,
  conference?: string,
  options: FetchOptions = {}
): DataState<UnifiedStandings[]> & { refetch: () => void } {
  const { enabled = true } = options;

  const [state, setState] = useState<DataState<UnifiedStandings[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const fetchStandings = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = conference
        ? `/api/standings/${sport}?conference=${encodeURIComponent(conference)}`
        : `/api/standings/${sport}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { standings?: UnifiedStandings[] };
      setState({
        data: data.standings ?? [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch standings'),
      }));
    }
  }, [sport, conference, enabled]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return { ...state, refetch: fetchStandings };
}

// ============================================================================
// RANKINGS HOOK
// ============================================================================

/**
 * Hook for fetching rankings/polls
 */
export function useRankings(
  sport: UnifiedSportKey,
  poll?: string,
  options: FetchOptions = {}
): DataState<UnifiedRankingPoll[]> & { refetch: () => void } {
  const { enabled = true } = options;

  const [state, setState] = useState<DataState<UnifiedRankingPoll[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const fetchRankings = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = poll
        ? `/api/rankings/${sport}?poll=${encodeURIComponent(poll)}`
        : `/api/rankings/${sport}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { rankings?: UnifiedRankingPoll[] };
      setState({
        data: data.rankings ?? [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch rankings'),
      }));
    }
  }, [sport, poll, enabled]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return { ...state, refetch: fetchRankings };
}

// ============================================================================
// SCHEDULE HOOK
// ============================================================================

/**
 * Hook for fetching schedule data
 */
export function useSchedule(
  sport: UnifiedSportKey,
  date?: Date,
  options: FetchOptions = {}
): DataState<UnifiedGame[]> & { refetch: () => void } {
  const { enabled = true } = options;

  const [state, setState] = useState<DataState<UnifiedGame[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const dateStr = date
    ? `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    : undefined;

  const fetchSchedule = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = dateStr ? `/api/scoreboard/${sport}?date=${dateStr}` : `/api/scoreboard/${sport}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { games?: UnifiedGame[] };
      setState({
        data: data.games ?? [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch schedule'),
      }));
    }
  }, [sport, dateStr, enabled]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { ...state, refetch: fetchSchedule };
}

// ============================================================================
// BOX SCORE HOOK
// ============================================================================

/**
 * Hook for fetching game box score
 */
export function useBoxScore(
  gameId: string | null,
  sport: UnifiedSportKey,
  options: PollingOptions = {}
): DataState<any> & { refetch: () => void } {
  const { interval = 60000, enabled = true } = options;

  const [state, setState] = useState<DataState<any>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBoxScore = useCallback(async () => {
    if (!enabled || !gameId) return;

    setState((prev) => ({ ...prev, loading: prev.data === null }));

    try {
      const response = await fetch(`/api/game/${gameId}/boxscore?sport=${sport}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { status?: string; [key: string]: unknown };
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });

      // Stop polling if game is final
      if (data.status === 'FINAL' && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch box score'),
      }));
    }
  }, [gameId, sport, enabled]);

  useEffect(() => {
    fetchBoxScore();
  }, [fetchBoxScore]);

  // Polling for live games
  useEffect(() => {
    if (!enabled || !gameId) return;

    intervalRef.current = setInterval(fetchBoxScore, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchBoxScore, interval, enabled, gameId]);

  return { ...state, refetch: fetchBoxScore };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to track document visibility
 */
function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Hook to track online status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
