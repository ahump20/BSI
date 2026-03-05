'use client';

import { useQuery } from '@tanstack/react-query';
import type { PitcherBiomechanics, CVApiResponse } from './types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/**
 * Fetch latest biomechanics snapshot for a pitcher.
 * Includes fatigue score, injury risk, and risk factors.
 */
export function usePitcherMechanics(playerId: string) {
  return useQuery({
    queryKey: ['cv-pitcher-mechanics', playerId],
    queryFn: () =>
      fetchJson<CVApiResponse<PitcherBiomechanics | null>>(
        `/api/cv/pitcher/${playerId}/mechanics`,
      ),
    enabled: !!playerId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/**
 * Fetch time series of pitcher mechanics over a date range.
 */
export function usePitcherHistory(playerId: string, range = '30d') {
  return useQuery({
    queryKey: ['cv-pitcher-history', playerId, range],
    queryFn: () =>
      fetchJson<CVApiResponse<PitcherBiomechanics[]>>(
        `/api/cv/pitcher/${playerId}/mechanics/history?range=${range}`,
      ),
    enabled: !!playerId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * Fetch players above a fatigue/injury threshold.
 */
export function useInjuryAlerts(sport: string, threshold = 70) {
  return useQuery({
    queryKey: ['cv-injury-alerts', sport, threshold],
    queryFn: () =>
      fetchJson<CVApiResponse<PitcherBiomechanics[]>>(
        `/api/cv/alerts/injury-risk?sport=${sport}&threshold=${threshold}`,
      ),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
