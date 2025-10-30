/**
 * Real-Time Data Utilities
 *
 * Hooks and utilities for live-updating data, perfect for sports scores,
 * game stats, and real-time analytics.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Polling configuration
 */
export interface PollingConfig {
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * usePolling - Fetch data at regular intervals
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  config: PollingConfig = {}
): {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { interval = 30000, enabled = true, onError } = config;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Setup polling
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, error, loading, refresh: fetchData };
}

/**
 * useWebSocket - Real-time updates via WebSocket
 */
export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket<T>(config: WebSocketConfig): {
  data: T | null;
  sendMessage: (message: any) => void;
  isConnected: boolean;
  error: Event | null;
} {
  const {
    url,
    reconnect = true,
    reconnectInterval = 5000,
    reconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch {
          setData(event.data as T);
        }
      };

      ws.onerror = (event) => {
        setError(event);
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onClose?.();

        // Reconnect logic
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  }, [url, reconnect, reconnectInterval, reconnectAttempts, onOpen, onClose, onError]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { data, sendMessage, isConnected, error };
}

/**
 * useLiveData - Generic live data hook with fallback
 */
export interface LiveDataConfig<T> extends PollingConfig {
  websocket?: WebSocketConfig;
  initialData?: T;
}

export function useLiveData<T>(
  fetchFn: () => Promise<T>,
  config: LiveDataConfig<T> = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isLive: boolean;
  refresh: () => Promise<void>;
} {
  const pollingResult = usePolling(fetchFn, config);
  const wsResult = config.websocket ? useWebSocket<T>(config.websocket) : null;

  // Prefer WebSocket data if available
  const data = wsResult?.data || pollingResult.data || config.initialData || null;
  const isLive = wsResult?.isConnected || false;

  return {
    data,
    loading: pollingResult.loading,
    error: pollingResult.error,
    isLive,
    refresh: pollingResult.refresh,
  };
}

/**
 * useDataRefresh - Manual refresh with cooldown
 */
export function useDataRefresh<T>(
  fetchFn: () => Promise<T>,
  cooldown = 5000
): {
  data: T | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  canRefresh: boolean;
  lastRefresh: Date | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = async () => {
    if (!canRefresh || isRefreshing) return;

    setIsRefreshing(true);
    setCanRefresh(false);

    try {
      const result = await fetchFn();
      setData(result);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setCanRefresh(true), cooldown);
    }
  };

  return { data, refresh, isRefreshing, canRefresh, lastRefresh };
}

/**
 * Data update animations
 */
export function useDataFlash(dependency: any): boolean {
  const [isFlashing, setIsFlashing] = useState(false);
  const previousValueRef = useRef(dependency);

  useEffect(() => {
    if (previousValueRef.current !== dependency) {
      setIsFlashing(true);
      const timeout = setTimeout(() => setIsFlashing(false), 500);
      previousValueRef.current = dependency;
      return () => clearTimeout(timeout);
    }
  }, [dependency]);

  return isFlashing;
}

/**
 * Optimistic updates
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
): {
  data: T;
  update: (newData: T) => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = async (newData: T) => {
    const previousData = data;
    setData(newData); // Optimistically update
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateFn(newData);
      setData(result);
    } catch (err) {
      setData(previousData); // Rollback on error
      setError(err instanceof Error ? err : new Error('Update failed'));
    } finally {
      setIsUpdating(false);
    }
  };

  return { data, update, isUpdating, error };
}

/**
 * Batch updates to reduce re-renders
 */
export function useBatchedUpdates<T>(
  batchInterval = 1000
): {
  queue: (item: T) => void;
  flush: () => T[];
  items: T[];
} {
  const [items, setItems] = useState<T[]>([]);
  const queueRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const flush = useCallback(() => {
    if (queueRef.current.length > 0) {
      setItems((prev) => [...prev, ...queueRef.current]);
      queueRef.current = [];
    }
    return items;
  }, [items]);

  const queue = useCallback(
    (item: T) => {
      queueRef.current.push(item);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(flush, batchInterval);
    },
    [flush, batchInterval]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { queue, flush, items };
}
