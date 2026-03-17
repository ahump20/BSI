'use client';

import type { NormalizedDataMeta } from '@/lib/utils/data-meta';
import { useSportData } from './useSportData';

export interface ScoresOverviewData {
  data: Record<string, unknown>;
  errors?: Record<string, string>;
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    sports: Record<string, string>;
  };
}

/**
 * Fetch aggregated scores across all sports from /api/scores/overview.
 * Auto-refreshes every 60 seconds.
 */
export interface ScoresOverviewReturn {
  data: ScoresOverviewData | null;
  meta: NormalizedDataMeta | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  retry: () => void;
  refresh: () => void;
}

export function useScoresOverview(date?: string): ScoresOverviewReturn {
  const url = date
    ? `/api/scores/overview?date=${encodeURIComponent(date)}`
    : '/api/scores/overview';

  return useSportData<ScoresOverviewData>(url, {
    refreshInterval: 60_000,
  });
}
