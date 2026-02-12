'use client';

/**
 * BSI Ticker Hook
 *
 * React hook for consuming live ticker data with WebSocket.
 * Use this for custom ticker implementations.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

// Types (matching worker types)
type TickerType = 'score' | 'news' | 'injury' | 'trade' | 'weather';
type League = 'MLB' | 'NFL' | 'NCAAF' | 'NBA' | 'NCAABB';
type Priority = 1 | 2 | 3;

export interface TickerItem {
  id: string;
  type: TickerType;
  league: League;
  headline: string;
  timestamp: number;
  priority: Priority;
  metadata?: {
    teamIds?: string[];
    gameId?: string;
    playerId?: string;
    link?: string;
  };
}

interface WSMessage {
  type: string;
  payload?: unknown;
  timestamp: number;
}

export interface UseTickerOptions {
  /** WebSocket URL */
  url?: string;
  /** Filter by leagues */
  leagues?: League[];
  /** Filter by types */
  types?: TickerType[];
  /** Minimum priority */
  minPriority?: Priority;
  /** Max items to keep */
  maxItems?: number;
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

interface UseTickerReturn {
  /** Current ticker items */
  items: TickerItem[];
  /** Most recent item */
  latestItem: TickerItem | null;
  /** Whether there's a breaking news item */
  hasBreakingNews: boolean;
  /** Connection status */
  isConnected: boolean;
  /** Connect to WebSocket */
  connect: () => void;
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** Update subscription filters */
  subscribe: (options: Pick<UseTickerOptions, 'leagues' | 'types' | 'minPriority'>) => void;
}

const DEFAULT_URL = 'wss://ticker.blazesportsintel.com/ws';

export function useTicker({
  url = DEFAULT_URL,
  leagues,
  types,
  minPriority = 3,
  maxItems = 50,
  autoConnect = true,
}: UseTickerOptions = {}): UseTickerReturn {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef({ leagues, types, minPriority });

  // Update subscription ref when props change
  useEffect(() => {
    subscriptionRef.current = { leagues, types, minPriority };
  }, [leagues, types, minPriority]);

  // Connect function
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);

        // Send subscription
        const { leagues, types, minPriority } = subscriptionRef.current;
        const subscription: WSMessage = {
          type: 'subscribe',
          payload: {
            ...(leagues && { leagues }),
            ...(types && { types }),
            minPriority,
          },
          timestamp: Date.now(),
        };
        wsRef.current?.send(JSON.stringify(subscription));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        }, 25000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;

          if (message.type === 'ticker_batch') {
            setItems(message.payload as TickerItem[]);
          } else if (message.type === 'ticker_item') {
            const newItem = message.payload as TickerItem;
            setItems((prev) => [newItem, ...prev.slice(0, maxItems - 1)]);
          }
        } catch (e) {
          logger.warn({ error: e }, 'Failed to parse ticker message');
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        logger.warn({ error }, 'Ticker WebSocket error');
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to connect to ticker');
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url, maxItems]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Subscribe function for updating filters
  const subscribe = useCallback(
    (options: Pick<UseTickerOptions, 'leagues' | 'types' | 'minPriority'>) => {
      subscriptionRef.current = { ...subscriptionRef.current, ...options };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const subscription: WSMessage = {
          type: 'subscribe',
          payload: options,
          timestamp: Date.now(),
        };
        wsRef.current.send(JSON.stringify(subscription));
      }
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Computed values
  const latestItem = items.length > 0 ? items[0] : null;
  const hasBreakingNews = items.some((item) => item.priority === 1);

  return {
    items,
    latestItem,
    hasBreakingNews,
    isConnected,
    connect,
    disconnect,
    subscribe,
  };
}

export default useTicker;
