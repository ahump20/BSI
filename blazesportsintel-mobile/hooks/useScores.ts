import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Score } from '@shared/types/scores';

const endpointMap: Record<string, string> = {
  all: '/api/scores/cached',
  'college-baseball': '/api/college-baseball/scores',
  mlb: '/api/mlb/scores',
  nfl: '/api/nfl/scores',
  cfb: '/api/cfb/scores',
  nba: '/api/nba/scores'
};

// All BSI API responses are wrapped: { data: T, meta: { source, fetched_at, ... } }
interface ApiEnvelope {
  data?: unknown;
  games?: unknown;
  [key: string]: unknown;
}

async function fetchScores(path: string): Promise<Score[]> {
  const envelope = await apiGet<ApiEnvelope>(path);
  // Handle both { data: [...] } and { games: [...] } shapes, plus bare arrays
  const payload = envelope?.data ?? envelope?.games ?? envelope;
  return Array.isArray(payload) ? (payload as Score[]) : [];
}

export function useScores(sport: string) {
  return useQuery({
    queryKey: ['scores', sport],
    queryFn: () => fetchScores(endpointMap[sport] ?? endpointMap.all),
    refetchInterval: 30_000,
    staleTime: 15_000
  });
}
