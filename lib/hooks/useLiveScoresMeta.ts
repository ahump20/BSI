'use client';

import { useCallback, useEffect, useState } from 'react';

export type LiveScoresMeta = {
  source?: string;
  dataSource?: string;
  fetched_at?: string;
  lastUpdated?: string;
  timezone?: string;
  note?: string;
};

type LiveScoresPayload = {
  meta?: LiveScoresMeta;
};

export function useLiveScoresMeta(refreshIntervalMs = 30000) {
  const [meta, setMeta] = useState<LiveScoresMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/live-scores');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as LiveScoresPayload;
      if (payload.meta) {
        setMeta(payload.meta);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live score metadata');
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (refreshIntervalMs <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      void refresh();
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { meta, error, refresh };
}
