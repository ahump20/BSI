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

export function useScores(sport: string) {
  return useQuery({
    queryKey: ['scores', sport],
    queryFn: () => apiGet<Score[]>(endpointMap[sport] ?? endpointMap.all),
    refetchInterval: 30_000,
    staleTime: 15_000
  });
}
