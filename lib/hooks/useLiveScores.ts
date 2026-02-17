'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameTeam {
  name: string;
  abbreviation: string;
  score: number;
  logo: string;
  winner: boolean;
}

interface GameSituation {
  balls: number;
  strikes: number;
  outs: number;
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
  batter: string;
  pitcher: string;
}

export interface LiveGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    state: string;
    detail: string;
    period: number;
    completed: boolean;
  };
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  situation?: GameSituation;
}

interface ScoresUpdateMessage {
  type: 'scores_update';
  games: LiveGame[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}

interface UseLiveScoresOptions {
  /** WebSocket URL for the live scores worker. */
  wsUrl?: string;
  /** REST fallback URL for polling. */
  restUrl?: string;
  /** Polling interval in ms when WebSocket is unavailable. Defaults to 30000. */
  pollInterval?: number;
  /** Skip connecting entirely. Defaults to false. */
  skip?: boolean;
}

interface UseLiveScoresReturn {
  /** Map of game ID to game data. Reflects latest state including deltas. */
  games: LiveGame[];
  /** True when the WebSocket connection is active. */
  isLive: boolean;
  /** Timestamp of the last score update received. */
  lastUpdated: Date | null;
  /** Error message if connection or fetch fails. */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WS_URL = 'wss://bsi-live-scores.blazesportsintel.com/ws';
const DEFAULT_REST_URL = 'https://bsi-live-scores.blazesportsintel.com/scores';
const DEFAULT_POLL_INTERVAL = 30_000;
const WS_RECONNECT_BASE_MS = 1_000;
const WS_RECONNECT_MAX_MS = 30_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveScores(options: UseLiveScoresOptions = {}): UseLiveScoresReturn {
  const {
    wsUrl = DEFAULT_WS_URL,
    restUrl = DEFAULT_REST_URL,
    pollInterval = DEFAULT_POLL_INTERVAL,
    skip = false,
  } = options;

  const [gamesMap, setGamesMap] = useState<Map<string, LiveGame>>(new Map());
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Merge incoming games (delta or full) into current state
  const mergeGames = useCallback((incoming: LiveGame[]) => {
    setGamesMap((prev) => {
      const next = new Map(prev);
      for (const game of incoming) {
        next.set(game.id, game);
      }
      return next;
    });
    setLastUpdated(new Date());
    setError(null);
  }, []);

  // REST polling fallback
  const fetchScoresRest = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(restUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`REST fetch failed (${res.status})`);
      }

      const data = (await res.json()) as { games: LiveGame[] };
      if (mountedRef.current && data.games) {
        // Full replace on REST poll
        setGamesMap(new Map(data.games.map((g) => [g.id, g])));
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'REST fetch failed');
      }
    }
  }, [restUrl]);

  // Start REST polling
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    // Fetch immediately, then on interval
    fetchScoresRest();
    pollTimerRef.current = setInterval(fetchScoresRest, pollInterval);
  }, [fetchScoresRest, pollInterval]);

  // Stop REST polling
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (skip || !mountedRef.current) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsLive(true);
        setError(null);
        reconnectAttemptRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data as string) as ScoresUpdateMessage;
          if (data.type === 'scores_update' && Array.isArray(data.games)) {
            mergeGames(data.games);
          }
        } catch {
          // Ignore unparseable messages (e.g., ping empty strings)
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsLive(false);
        wsRef.current = null;

        // Start polling as fallback
        startPolling();

        // Exponential backoff reconnect
        const delay = Math.min(
          WS_RECONNECT_BASE_MS * Math.pow(2, reconnectAttemptRef.current),
          WS_RECONNECT_MAX_MS
        );
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError('WebSocket connection error');
        // onclose will fire after onerror, handling reconnect
      };
    } catch {
      // WebSocket constructor can throw in some environments
      if (mountedRef.current) {
        setIsLive(false);
        setError('WebSocket not supported');
        startPolling();
      }
    }
  }, [wsUrl, skip, mergeGames, startPolling, stopPolling]);

  // Main effect: connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (skip) return;

    connectWebSocket();

    return () => {
      mountedRef.current = false;

      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      // Cleanup reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Cleanup polling
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [connectWebSocket, skip]);

  // Convert map to array for consumers
  const games = Array.from(gamesMap.values());

  return { games, isLive, lastUpdated, error };
}
