'use client';

import { useQuery } from '@tanstack/react-query';

// Sport types supported by the unified live-scores API
export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa-baseball' | 'ncaa-football';

// Query parameter mapping for unified endpoint
const SPORT_QUERY_MAP: Record<Sport, string> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  'ncaa-baseball': 'ncaa-baseball',
  'ncaa-football': 'ncaa',
};

const API_BASE = 'https://blazesportsintel.com/api';

/**
 * Hook for fetching live scores from unified /api/live-scores endpoint
 * Uses React Query for caching, automatic refresh, and stale-while-revalidate
 */
export function useLiveScores(sport: Sport, options?: { date?: string }) {
  const sportQuery = SPORT_QUERY_MAP[sport];

  return useQuery({
    queryKey: ['live-scores', sport, options?.date],
    queryFn: async () => {
      const params = new URLSearchParams({ sport: sportQuery });
      if (options?.date) {
        params.append('date', options.date);
      }

      const response = await fetch(`${API_BASE}/live-scores?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scores: HTTP ${response.status}`);
      }

      return response.json();
    },
    // Refresh every 30 seconds for live game updates
    refetchInterval: 30_000,
    // 10 seconds stale time
    staleTime: 10_000,
  });
}
