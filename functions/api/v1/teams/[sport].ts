/**
 * BSI Teams API Endpoint
 * Returns team list with current records and ratings for win probability calculator.
 *
 * GET /api/v1/teams/{sport}
 * @param sport - cfb | nfl | mlb | cbb | nba
 * @returns { teams: Team[], source: string, lastUpdated: string }
 */

import {
  ESPNUnifiedAdapter,
  type SportKey,
  type ESPNTeam,
} from '../../../../lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE: KVNamespace;
}

interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

interface TeamResponse {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
  record?: string;
  rating?: number;
  conference?: string;
  ranking?: number;
}

interface TeamsAPIResponse {
  teams: TeamResponse[];
  sport: string;
  source: string;
  lastUpdated: string;
  count: number;
}

const SPORT_MAP: Record<string, SportKey> = {
  cfb: 'ncaaf',
  nfl: 'nfl',
  mlb: 'mlb',
  cbb: 'cbb',
  nba: 'nba',
  ncaab: 'ncaab',
};

const VALID_SPORTS = Object.keys(SPORT_MAP);

const CACHE_TTL = 3600; // 1 hour

function calculateRating(team: ESPNTeam): number {
  // Base rating from ranking if available
  if (team.ranking && team.ranking <= 25) {
    return Math.max(75, 100 - team.ranking * 1.5);
  }

  // Parse record if available for win percentage
  if (team.record) {
    const match = team.record.match(/(\d+)-(\d+)/);
    if (match) {
      const wins = parseInt(match[1], 10);
      const losses = parseInt(match[2], 10);
      const total = wins + losses;
      if (total > 0) {
        const winPct = wins / total;
        return Math.round(50 + winPct * 40);
      }
    }
  }

  // Default rating for teams with no data
  return 70;
}

function transformTeam(team: ESPNTeam): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
    logo: team.logo,
    record: team.record,
    rating: calculateRating(team),
    conference: team.conference,
    ranking: team.ranking,
  };
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const sport = context.params.sport?.toLowerCase();

  if (!sport || !VALID_SPORTS.includes(sport)) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_SPORT',
          message: `Sport must be one of: ${VALID_SPORTS.join(', ')}`,
        },
        teams: [],
        count: 0,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const cacheKey = `teams:${sport}`;
  const sportKey = SPORT_MAP[sport];

  // Check cache first
  try {
    const cached = await context.env.BSI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'HIT',
        },
      });
    }
  } catch (err) {
    console.warn('[teams] Cache read failed:', err);
  }

  // Fetch from ESPN
  try {
    const adapter = new ESPNUnifiedAdapter(context.env.BSI_CACHE);
    const espnTeams = await adapter.getTeams(sportKey);

    const teams = espnTeams.map(transformTeam).sort((a, b) => {
      // Sort by ranking first (if exists), then by rating
      if (a.ranking && b.ranking) return a.ranking - b.ranking;
      if (a.ranking) return -1;
      if (b.ranking) return 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    const response: TeamsAPIResponse = {
      teams,
      sport,
      source: 'ESPN',
      lastUpdated: new Date().toISOString(),
      count: teams.length,
    };

    // Cache the result
    try {
      await context.env.BSI_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: CACHE_TTL,
      });
    } catch (err) {
      console.warn('[teams] Cache write failed:', err);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[teams] ESPN fetch failed:', err);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_ERROR',
          message: err instanceof Error ? err.message : 'Failed to fetch teams',
        },
        teams: [],
        count: 0,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export default { onRequestGet };
