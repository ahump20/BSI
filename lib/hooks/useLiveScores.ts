'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface LiveGameTeam {
  id: number;
  name: string;
  shortName: string;
  score: number;
  record: string | undefined;
  conference: string;
  ranking: number | undefined;
}

export interface LiveGame {
  id: string;
  status: 'pre' | 'in' | 'post' | 'postponed' | 'cancelled';
  detailedState: string;
  inning: number | undefined;
  inningHalf: 'top' | 'bottom' | undefined;
  outs: number | undefined;
  awayTeam: LiveGameTeam;
  homeTeam: LiveGameTeam;
  startTime: string;
  venue: string;
}

interface WsMessage {
  type: 'score_update' | 'game_start' | 'game_end' | 'connected' | 'error' | 'heartbeat';
  games?: LiveGame[];
  mmi?: Record<string, number>;
  message?: string;
  timestamp: string;
  meta?: {
    source: string;
    connectedClients: number;
    pollIntervalMs: number;
    sport?: string;
  };
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

interface LiveScoresState {
  games: LiveGame[];
  isLive: boolean;
  lastUpdate: Date | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

interface UseLiveScoresOptions {
  /** Sport to subscribe to (default: 'college-baseball') */
  sport?: 'college-baseball' | 'mlb' | 'nfl' | 'nba';
  /** Polling fallback interval in ms (default: 30000) */
  pollingInterval?: number;
  /** WebSocket URL (default: auto-detect from environment) */
  wsUrl?: string;
  /** Disable WebSocket entirely and only poll (default: false) */
  pollingOnly?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_POLL_INTERVAL = 30_000;
const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

/** Resolve WebSocket URL based on environment and sport. */
function resolveWsUrl(override?: string, sport = 'college-baseball'): string {
  if (override) return override;
  if (typeof window === 'undefined') return '';

  const sportParam = sport !== 'college-baseball' ? `?sport=${sport}` : '';

  // In production, connect to the live-scores worker
  const hostname = window.location.hostname;
  if (hostname === 'blazesportsintel.com' || hostname === 'www.blazesportsintel.com') {
    return `wss://live.blazesportsintel.com/ws${sportParam}`;
  }

  // Dev: assume live-scores worker runs on port 8790
  return `ws://localhost:8790/ws${sportParam}`;
}

// =============================================================================
// Hook
// =============================================================================

export function useLiveScores(
  options: UseLiveScoresOptions = {}
): LiveScoresState & { retry: () => void } {
  const {
    sport = 'college-baseball',
    pollingInterval = DEFAULT_POLL_INTERVAL,
    wsUrl: wsUrlOverride,
    pollingOnly = false,
  } = options;

  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const gameMapRef = useRef<Map<string, LiveGame>>(new Map());

  // ---------------------------------------------------------------------------
  // Apply incoming game updates to local state (merge by game ID)
  // ---------------------------------------------------------------------------

  const applyGames = useCallback((incoming: LiveGame[], replace = false) => {
    if (!mountedRef.current) return;

    if (replace) {
      const map = new Map<string, LiveGame>();
      for (const g of incoming) {
        map.set(g.id, g);
      }
      gameMapRef.current = map;
    } else {
      for (const g of incoming) {
        gameMapRef.current.set(g.id, g);
      }
    }

    setGames(Array.from(gameMapRef.current.values()));
    setLastUpdate(new Date());
  }, []);

  // ---------------------------------------------------------------------------
  // Polling fallback — fetch from REST API
  // ---------------------------------------------------------------------------

  const pollScores = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const res = await fetch('/api/college-baseball/scores');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as {
        data?: Array<Record<string, unknown>>;
        games?: Array<Record<string, unknown>>;
      };

      const raw = data.data ?? data.games ?? [];

      // Map the REST response to LiveGame shape
      const mapped: LiveGame[] = raw.map((g: Record<string, unknown>) => {
        const ht = g.homeTeam as Record<string, unknown> | undefined;
        const at = g.awayTeam as Record<string, unknown> | undefined;
        const rec = (t: Record<string, unknown> | undefined) => {
          const r = t?.record as Record<string, unknown> | undefined;
          if (!r) return undefined;
          return `${r.wins ?? 0}-${r.losses ?? 0}`;
        };

        return {
          id: String(g.id ?? ''),
          status: g.status === 'live' ? 'in' : g.status === 'final' ? 'post' : 'pre',
          detailedState: (g.situation as string) ?? String(g.status ?? 'pre'),
          inning: g.inning as number | undefined,
          inningHalf: undefined,
          outs: undefined,
          awayTeam: {
            id: Number(at?.id ?? 0),
            name: (at?.name as string) ?? 'Away',
            shortName: (at?.shortName as string) ?? '',
            score: Number(at?.score ?? 0),
            record: rec(at),
            conference: (at?.conference as string) ?? '',
            ranking: undefined,
          },
          homeTeam: {
            id: Number(ht?.id ?? 0),
            name: (ht?.name as string) ?? 'Home',
            shortName: (ht?.shortName as string) ?? '',
            score: Number(ht?.score ?? 0),
            record: rec(ht),
            conference: (ht?.conference as string) ?? '',
            ranking: undefined,
          },
          startTime: (g.date as string) ?? '',
          venue: (g.venue as string) ?? '',
        } satisfies LiveGame;
      });

      applyGames(mapped, true);
      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Polling failed');
      }
    }
  }, [applyGames]);

  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) return;
    setConnectionStatus('polling');

    // Immediate fetch, then interval
    pollScores();
    pollingTimerRef.current = setInterval(pollScores, pollingInterval);
  }, [pollScores, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket connection
  // ---------------------------------------------------------------------------

  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current || pollingOnly) return;

    const url = resolveWsUrl(wsUrlOverride, sport);
    if (!url) {
      startPolling();
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsLive(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        stopPolling();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        let msg: WsMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          // Malformed JSON — ignore
          return;
        }

        switch (msg.type) {
          case 'connected':
            // Welcome acknowledged
            break;

          case 'score_update':
          case 'game_start':
          case 'game_end':
            if (msg.games && msg.games.length > 0) {
              applyGames(msg.games);
            }
            break;

          case 'heartbeat':
            // Keep-alive, no action needed
            break;

          case 'error':
            setError(msg.message ?? 'Server error');
            break;
        }

        setLastUpdate(new Date());
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        setIsLive(false);

        if (event.code === 1000) {
          // Clean close — don't reconnect
          setConnectionStatus('disconnected');
          return;
        }

        // Schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        setConnectionStatus('disconnected');

        // Fall back to polling while reconnecting
        startPolling();

        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectWebSocket();
          }
        }, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        // onerror is always followed by onclose, so just set error state
        setError('WebSocket connection error');
      };
    } catch {
      // WebSocket constructor failed (e.g., invalid URL, blocked)
      setConnectionStatus('disconnected');
      startPolling();
    }
  }, [wsUrlOverride, pollingOnly, applyGames, startPolling, stopPolling]);

  // ---------------------------------------------------------------------------
  // Retry — force reconnect
  // ---------------------------------------------------------------------------

  const retry = useCallback(() => {
    // Clean up existing connection
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    stopPolling();

    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    gameMapRef.current.clear();
    setGames([]);
    setError(null);

    if (pollingOnly) {
      startPolling();
    } else {
      connectWebSocket();
    }
  }, [connectWebSocket, startPolling, stopPolling, pollingOnly]);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    if (pollingOnly) {
      startPolling();
    } else {
      connectWebSocket();
    }

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [connectWebSocket, startPolling, pollingOnly]);

  // Send periodic pings to keep connection alive
  useEffect(() => {
    if (!isLive) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30_000);

    return () => clearInterval(pingInterval);
  }, [isLive]);

  return {
    games,
    isLive,
    lastUpdate,
    connectionStatus,
    error,
    retry,
  };
}
