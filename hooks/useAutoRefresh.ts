/**
 * Auto-refresh hook for live sports data
 * 
 * Pattern sourced from: https://github.com/aryaan022/ScorePulse
 * Automatically refetches data at specified intervals with exponential backoff on errors
 * 
 * @example
 * ```tsx
 * const { data, isStale, lastUpdated } = useAutoRefresh(
 *   fetchLiveScores,
 *   { interval: 5000, enabled: isGameLive }
 * );
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseAutoRefreshOptions {
  /** Refresh interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether auto-refresh is enabled (default: true) */
  enabled?: boolean;
  /** Maximum retry attempts on error (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in ms (default: 1000) */
  initialBackoff?: number;
  /** Function called on successful refresh */
  onSuccess?: () => void;
  /** Function called on error */
  onError?: (error: Error) => void;
}

export interface UseAutoRefreshResult<T> {
  /** Current data */
  data: T | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Whether data is considered stale (>2x interval old) */
  isStale: boolean;
  /** Timestamp of last successful update */
  lastUpdated: Date | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  options: UseAutoRefreshOptions = {}
): UseAutoRefreshResult<T> {
  const {
    interval = 30000,
    enabled = true,
    maxRetries = 3,
    initialBackoff = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const staleCheckRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
      setIsStale(false);
      retryCount.current = 0;

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      if (onError) {
        onError(error);
      }

      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        const backoffDelay = initialBackoff * Math.pow(2, retryCount.current - 1);
        
        timeoutRef.current = setTimeout(() => {
          refresh();
        }, backoffDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFn, maxRetries, initialBackoff, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (staleCheckRef.current) {
        clearTimeout(staleCheckRef.current);
      }
      return;
    }

    refresh();

    const intervalId = setInterval(() => {
      refresh();
    }, interval);

    const staleCheckId = setInterval(() => {
      if (lastUpdated) {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime();
        setIsStale(timeSinceUpdate > interval * 2);
      }
    }, 5000);

    staleCheckRef.current = staleCheckId;

    return () => {
      clearInterval(intervalId);
      clearInterval(staleCheckId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, interval, refresh, lastUpdated]);

  return {
    data,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
  };
}
