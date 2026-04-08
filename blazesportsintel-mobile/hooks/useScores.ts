import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
import type { Score } from '@shared/types/scores';
=======
import type { Score, TeamScore } from '@shared/types/scores';
>>>>>>> theirs
=======
import type { Score, TeamScore } from '@shared/types/scores';
>>>>>>> theirs
=======
import type { Score, TeamScore } from '@shared/types/scores';
>>>>>>> theirs

const endpointMap: Record<string, string> = {
  all: '/api/scores/cached',
  'college-baseball': '/api/college-baseball/scores',
  mlb: '/api/mlb/scores',
  nfl: '/api/nfl/scores',
  cfb: '/api/cfb/scores',
  nba: '/api/nba/scores'
};

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
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
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function asStatus(value: unknown): Score['status'] {
  if (value === 'live' || value === 'final' || value === 'upcoming') {
    return value;
  }
  return 'upcoming';
}

function normalizeTeamScore(value: unknown): TeamScore {
  const team = (value ?? {}) as Record<string, unknown>;
  return {
    id: String(team.id ?? team.teamId ?? ''),
    name: String(team.name ?? team.teamName ?? 'Unknown Team'),
    abbreviation: String(team.abbreviation ?? team.abbr ?? team.shortName ?? ''),
    score: Number(team.score ?? 0),
    record: typeof team.record === 'string' ? team.record : null
  };
}

function normalizeScore(value: unknown): Score {
  const score = (value ?? {}) as Record<string, unknown>;
  return {
    gameId: String(score.gameId ?? score.id ?? ''),
    sport: String(score.sport ?? 'all'),
    status: asStatus(score.status),
    startTime: String(score.startTime ?? score.scheduled ?? ''),
    homeTeam: normalizeTeamScore(score.homeTeam ?? score.home ?? {}),
    awayTeam: normalizeTeamScore(score.awayTeam ?? score.away ?? {}),
    periodLabel: typeof score.periodLabel === 'string' ? score.periodLabel : null,
    sourceUpdatedAt: typeof score.sourceUpdatedAt === 'string' ? score.sourceUpdatedAt : null,
    raw: score
  };
}

function extractScoreArray(payload: unknown): Score[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeScore).filter((score) => score.gameId.length > 0);
  }

  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    if (Array.isArray(data.games)) {
      return data.games.map(normalizeScore).filter((score) => score.gameId.length > 0);
    }
    if (Array.isArray(data.data)) {
      return data.data.map(normalizeScore).filter((score) => score.gameId.length > 0);
    }
  }

  return [];
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

export function useScores(sport: string) {
  return useQuery({
    queryKey: ['scores', sport],
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    queryFn: () => fetchScores(endpointMap[sport] ?? endpointMap.all),
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    queryFn: async () => {
      const payload = await apiGet<unknown>(endpointMap[sport] ?? endpointMap.all);
      return extractScoreArray(payload);
    },
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    refetchInterval: 30_000,
    staleTime: 15_000
  });
}
