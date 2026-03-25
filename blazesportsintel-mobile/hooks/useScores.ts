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

type ScoresEnvelope = { games?: Score[] } | Score[];

function normalizeScores(payload: ScoresEnvelope): Score[] {
  if (Array.isArray(payload)) return payload;
  const envelope = payload as { games?: Score[] };
  return Array.isArray(envelope.games) ? envelope.games : [];
}

export function useScores(sport: string) {
  return useQuery({
    queryKey: ['scores', sport],
    queryFn: async () => {
      const payload = await apiGet<ScoresEnvelope>(endpointMap[sport] ?? endpointMap.all);
      return normalizeScores(payload);
    },
    refetchInterval: 30_000,
    staleTime: 15_000
  });
}
