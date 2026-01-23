import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  BSI_CACHE: KVNamespace;
}

interface HeadToHeadRecord {
  wins: number;
  losses: number;
  ties: number;
  lastMeeting: {
    date: string;
    score: string;
    winner: string;
  } | null;
}

interface RecentGame {
  date: string;
  opponent: string;
  result: 'W' | 'L' | 'T';
  score: string;
}

interface HeadToHeadResponse {
  headToHead: HeadToHeadRecord;
  recentForm: {
    team1: RecentGame[];
    team2: RecentGame[];
  };
  meta: {
    source: string;
    timestamp: string;
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const team1 = url.searchParams.get('team1');
  const team2 = url.searchParams.get('team2');
  const sport = url.searchParams.get('sport');

  if (!team1 || !team2 || !sport) {
    return new Response(JSON.stringify({ error: 'Missing required params: team1, team2, sport' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Normalize cache key (alphabetical order to avoid duplicates)
  const [teamA, teamB] = [team1, team2].sort();
  const cacheKey = `h2h:${sport}:${teamA}:${teamB}`;

  const cached = await context.env.BSI_CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Placeholder response - wire to ESPN schedule API for historical matchups
  const response: HeadToHeadResponse = {
    headToHead: { wins: 0, losses: 0, ties: 0, lastMeeting: null },
    recentForm: { team1: [], team2: [] },
    meta: { source: 'BSI', timestamp: new Date().toISOString() },
  };

  // Cache for 1 hour
  await context.env.BSI_CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 });

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
};
