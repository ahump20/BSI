'use client';

import { useSportData } from './useSportData';

export interface ScoresOverviewSportMeta {
  endpoint: string;
  fetched_at: string;
  source: string;
  timezone: 'America/Chicago';
}

export interface ScoresOverviewResponse {
  data: Record<string, Record<string, unknown> | null>;
  errors: Record<string, string>;
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    sports: Record<string, ScoresOverviewSportMeta>;
  };
}

export function useScoresOverview(date?: string) {
  const url = date
    ? `/api/scores/overview?date=${encodeURIComponent(date)}`
    : '/api/scores/overview';

  return useSportData<ScoresOverviewResponse>(url, {
    refreshInterval: 60_000,
    timeout: 8_000,
  });
}
