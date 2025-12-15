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

// ============================================================================
// GAME DETAIL HOOKS
// ============================================================================

import type {
  UnifiedBoxScore,
  NormalizedPlay,
  PlayByPlaySection,
  PlayFilter,
  VideoHighlight,
  VideoFetchResult,
  Headline,
  HeadlinesFeedResult,
  GameDetailTab,
  GameRecap,
} from '../types/adapters';

export interface GameDetailState {
  game: UnifiedGame | null;
  boxScore: UnifiedBoxScore | null;
  plays: NormalizedPlay[];
  playsSections: PlayByPlaySection[];
  videos: VideoHighlight[];
  recap: GameRecap | null;
  activeTab: GameDetailTab;
  loading: {
    game: boolean;
    boxScore: boolean;
    plays: boolean;
    videos: boolean;
    recap: boolean;
  };
  error: Error | null;
}

/**
 * Master hook for game detail modal
 * Manages all data for Gamecast, Box Score, Play-by-Play, Videos tabs
 */
export function useGameDetail(
  gameId: string | null,
  sport: UnifiedSportKey,
  options: PollingOptions = {}
): GameDetailState & {
  setActiveTab: (tab: GameDetailTab) => void;
  refetch: () => void;
} {
  const { interval = 30000, enabled = true } = options;

  const [state, setState] = useState<GameDetailState>({
    game: null,
    boxScore: null,
    plays: [],
    playsSections: [],
    videos: [],
    recap: null,
    activeTab: 'gamecast',
    loading: { game: true, boxScore: true, plays: true, videos: true, recap: true },
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisible = useDocumentVisibility();

  const fetchGameDetail = useCallback(async () => {
    if (!enabled || !gameId) return;

    setState((prev) => ({
      ...prev,
      loading: { ...prev.loading, game: true, boxScore: true },
      error: null,
    }));

    try {
      // Fetch game summary (includes basic game info + box score)
      const summaryRes = await fetch(`/api/game/${gameId}/summary?sport=${sport}`);
      if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}`);

      const summary = await summaryRes.json();

      setState((prev) => ({
        ...prev,
        game: summary.game || null,
        boxScore: summary.boxScore || null,
        loading: { ...prev.loading, game: false, boxScore: false },
      }));

      // Stop polling if game is final
      if (summary.game?.status === 'FINAL' && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, game: false, boxScore: false },
        error: error instanceof Error ? error : new Error('Failed to fetch game'),
      }));
    }
  }, [gameId, sport, enabled]);

  // Fetch plays lazily when tab is selected
  const fetchPlays = useCallback(async () => {
    if (!gameId) return;

    setState((prev) => ({ ...prev, loading: { ...prev.loading, plays: true } }));

    try {
      const res = await fetch(`/api/game/${gameId}/plays?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const plays = data.plays || [];

      // Group plays into sections by period
      const sections = groupPlaysBySections(plays, sport);

      setState((prev) => ({
        ...prev,
        plays,
        playsSections: sections,
        loading: { ...prev.loading, plays: false },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, plays: false },
        error: error instanceof Error ? error : new Error('Failed to fetch plays'),
      }));
    }
  }, [gameId, sport]);

  // Fetch videos lazily when tab is selected
  const fetchVideos = useCallback(async () => {
    if (!gameId) return;

    setState((prev) => ({ ...prev, loading: { ...prev.loading, videos: true } }));

    try {
      const res = await fetch(`/api/game/${gameId}/videos?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as VideoFetchResult;
      setState((prev) => ({
        ...prev,
        videos: data.videos || [],
        loading: { ...prev.loading, videos: false },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        videos: [],
        loading: { ...prev.loading, videos: false },
      }));
    }
  }, [gameId, sport]);

  // Fetch recap for finished games
  const fetchRecap = useCallback(async () => {
    if (!gameId || state.game?.status !== 'FINAL') return;

    setState((prev) => ({ ...prev, loading: { ...prev.loading, recap: true } }));

    try {
      const res = await fetch(`/api/game/${gameId}/recap?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setState((prev) => ({
        ...prev,
        recap: data.recap || null,
        loading: { ...prev.loading, recap: false },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, recap: false },
      }));
    }
  }, [gameId, sport, state.game?.status]);

  // Initial fetch
  useEffect(() => {
    fetchGameDetail();
  }, [fetchGameDetail]);

  // Polling for live games
  useEffect(() => {
    if (!enabled || !gameId || state.game?.status === 'FINAL') return;
    if (!isVisible) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(fetchGameDetail, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchGameDetail, interval, enabled, gameId, state.game?.status, isVisible]);

  // Lazy load tab content
  useEffect(() => {
    if (state.activeTab === 'playbyplay' && state.plays.length === 0) {
      fetchPlays();
    }
    if (state.activeTab === 'videos' && state.videos.length === 0) {
      fetchVideos();
    }
    if (state.activeTab === 'recap' && !state.recap && state.game?.status === 'FINAL') {
      fetchRecap();
    }
  }, [
    state.activeTab,
    state.plays.length,
    state.videos.length,
    state.recap,
    state.game?.status,
    fetchPlays,
    fetchVideos,
    fetchRecap,
  ]);

  const setActiveTab = useCallback((tab: GameDetailTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  return {
    ...state,
    setActiveTab,
    refetch: fetchGameDetail,
  };
}

/**
 * Hook for play-by-play with filtering
 */
export function usePlayByPlay(
  gameId: string | null,
  sport: UnifiedSportKey,
  filter: PlayFilter = 'all',
  options: PollingOptions = {}
): DataState<NormalizedPlay[]> & {
  sections: PlayByPlaySection[];
  refetch: () => void;
} {
  const { interval = 30000, enabled = true } = options;

  const [state, setState] = useState<DataState<NormalizedPlay[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });
  const [sections, setSections] = useState<PlayByPlaySection[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlays = useCallback(async () => {
    if (!enabled || !gameId) return;

    setState((prev) => ({ ...prev, loading: prev.data === null }));

    try {
      const res = await fetch(`/api/game/${gameId}/plays?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      let plays: NormalizedPlay[] = data.plays || [];

      // Apply filter
      if (filter === 'scoring') {
        plays = plays.filter((p) => p.isScoring);
      } else if (filter === 'key') {
        plays = plays.filter((p) => p.isKeyPlay || p.isScoring);
      }

      // Group into sections
      const grouped = groupPlaysBySections(plays, sport);

      setState({
        data: plays,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
      setSections(grouped);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch plays'),
      }));
    }
  }, [gameId, sport, filter, enabled]);

  useEffect(() => {
    fetchPlays();
  }, [fetchPlays]);

  // Polling
  useEffect(() => {
    if (!enabled || !gameId) return;

    intervalRef.current = setInterval(fetchPlays, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPlays, interval, enabled, gameId]);

  return { ...state, sections, refetch: fetchPlays };
}

/**
 * Hook for game video highlights
 */
export function useGameMedia(
  gameId: string | null,
  sport: UnifiedSportKey,
  options: FetchOptions = {}
): DataState<VideoFetchResult> & { refetch: () => void } {
  const { enabled = true } = options;

  const [state, setState] = useState<DataState<VideoFetchResult>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const fetchMedia = useCallback(async () => {
    if (!enabled || !gameId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`/api/game/${gameId}/videos?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as VideoFetchResult;
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
        error: error instanceof Error ? error : new Error('Failed to fetch videos'),
      }));
    }
  }, [gameId, sport, enabled]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { ...state, refetch: fetchMedia };
}

/**
 * Hook for headlines/news feed
 */
export function useHeadlines(
  sport: UnifiedSportKey | 'ALL',
  options: PollingOptions = {}
): DataState<Headline[]> & { refetch: () => void } {
  const { interval = 300000, enabled = true } = options; // 5 min default

  const [state, setState] = useState<DataState<Headline[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isStale: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHeadlines = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: prev.data === null }));

    try {
      const res = await fetch(`/api/headlines?sport=${sport}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as HeadlinesFeedResult;
      setState({
        data: data.headlines || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch headlines'),
      }));
    }
  }, [sport, enabled]);

  useEffect(() => {
    fetchHeadlines();
  }, [fetchHeadlines]);

  // Polling
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(fetchHeadlines, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchHeadlines, interval, enabled]);

  return { ...state, refetch: fetchHeadlines };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Group plays into sections by period/inning
 */
function groupPlaysBySections(
  plays: NormalizedPlay[],
  sport: UnifiedSportKey
): PlayByPlaySection[] {
  const groups = new Map<string | number, NormalizedPlay[]>();

  for (const play of plays) {
    const key = play.period;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(play);
  }

  const sections: PlayByPlaySection[] = [];
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const numA = typeof a === 'number' ? a : parseInt(String(a), 10) || 0;
    const numB = typeof b === 'number' ? b : parseInt(String(b), 10) || 0;
    return numB - numA; // Most recent first
  });

  for (const key of sortedKeys) {
    sections.push({
      label: formatPeriodLabel(key, sport),
      period: key,
      plays: groups.get(key) || [],
      isExpanded: sections.length === 0, // First section expanded by default
    });
  }

  return sections;
}

function formatPeriodLabel(period: string | number, sport: UnifiedSportKey): string {
  const num = typeof period === 'number' ? period : parseInt(String(period), 10);

  if (sport === 'mlb' || sport === 'cbb') {
    return `${getOrdinal(num)} Inning`;
  }
  if (sport === 'nfl' || sport === 'ncaaf') {
    return `${getOrdinal(num)} Quarter`;
  }
  if (sport === 'nba' || sport === 'ncaab' || sport === 'wcbb' || sport === 'wnba') {
    if (num <= 4) return `${getOrdinal(num)} Quarter`;
    return `OT${num - 4}`;
  }
  if (sport === 'nhl') {
    if (num <= 3) return `${getOrdinal(num)} Period`;
    return `OT${num - 3}`;
  }
  return String(period);
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
