'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveSports,
  normalizeCollegeBaseball,
  normalizeBSIScoreboard,
} from '@/components/home/HomeLiveScores';
import { getDateOffset } from '@/lib/utils/timezone';

export interface SportCounts {
  live: number;
  today: number;
}

/**
 * Lightweight hook that fetches all in-season sport score endpoints
 * and returns live/today game counts per sport.
 * Refreshes every 60s. Shares normalization logic with HomeLiveScores.
 */
export function useMultiSportCounts(): Map<string, SportCounts> {
  const [counts, setCounts] = useState<Map<string, SportCounts>>(new Map());
  // Memoize once per mount — active sports don't change mid-session
  const activeSports = useMemo(() => getActiveSports(), []);

  const fetchCounts = useCallback(async () => {
    const today = getDateOffset(0);
    if (activeSports.length === 0) return;

    const results = await Promise.allSettled(
      activeSports.map(async (sport) => {
        const url = sport.key === 'college-baseball'
          ? `${sport.endpoint}?date=${today}`
          : sport.endpoint;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return { key: sport.key, games: [] };
        const data = await res.json() as Record<string, unknown>;

        const games = sport.key === 'college-baseball'
          ? normalizeCollegeBaseball(data)
          : normalizeBSIScoreboard(data, sport.key, sport.label, sport.scoresHref);

        return { key: sport.key, games };
      }),
    );

    const next = new Map<string, SportCounts>();
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const { key, games } = r.value;
        next.set(key, {
          live: games.filter((g) => g.status === 'live').length,
          today: games.length,
        });
      }
    }
    setCounts(next);
  }, [activeSports]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return counts;
}
