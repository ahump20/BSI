'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSportDataOptions {
  /** Auto-refresh interval in ms (0 = disabled). Defaults to 0. */
  refreshInterval?: number;
  /** Only auto-refresh when this is true (e.g., when live games exist). */
  refreshWhen?: boolean;
  /** Skip the initial fetch (useful for conditional fetching). */
  skip?: boolean;
}

interface UseSportDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  retry: () => void;
  refresh: () => void;
}

export function useSportData<T>(
  url: string | null,
  options: UseSportDataOptions = {}
): UseSportDataReturn<T> {
  const { refreshInterval = 0, refreshWhen = true, skip = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip && !!url);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!url || skip) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!hasFetchedRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to fetch data (${res.status})`);
        }
        const json = (await res.json()) as T;
        setData(json);
        setLastUpdated(new Date());
        hasFetchedRef.current = true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [url, skip]
  );

  // Initial fetch
  useEffect(() => {
    hasFetchedRef.current = false;
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval || !refreshWhen || skip || !url) return;

    const interval = setInterval(() => fetchData(true), refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refreshWhen, skip, url, fetchData]);

  const retry = useCallback(() => {
    hasFetchedRef.current = false;
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, lastUpdated, isRefreshing, retry, refresh };
}
