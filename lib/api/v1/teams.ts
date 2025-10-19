/**
 * Teams API Handler
 * GET /api/v1/teams
 * GET /api/v1/teams/[slug]
 *
 * List Teams Query Parameters:
 * - conference: Conference slug
 * - division: D1 | D2 | D3 | JUCO
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset (default 0)
 *
 * Response:
 * {
 *   teams: Team[],
 *   pagination: { total, limit, offset, hasMore }
 * }
 */

import { getPrismaClientSingleton } from '@/lib/db/prisma';
import { Team, Division, Prisma } from '@prisma/client';

const prisma = getPrismaClientSingleton();

export interface TeamsQueryParams {
  conference?: string;
  division?: Division;
  limit?: number;
  offset?: number;
}

export interface TeamsResponse {
  teams: Team[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TeamDetailResponse extends Team {
  conference: {
    id: string;
    name: string;
    slug: string;
    shortName?: string;
  };
  roster: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: string;
    position: string;
    bats?: string;
    throws?: string;
    year?: string;
    height?: number;
    weight?: number;
    hometown?: string;
  }>;
  stats: {
    season: number;
    record: {
      wins: number;
      losses: number;
      confWins: number;
      confLosses: number;
      winPct: number;
    };
    batting: {
      runsScored: number;
      hitsTotal: number;
      homeRuns: number;
      stolenBases: number;
      battingAvg?: number;
      onBasePct?: number;
      sluggingPct?: number;
    };
    pitching: {
      runsAllowed: number;
      earnedRuns: number;
      hitsAllowed: number;
      strikeouts: number;
      walks: number;
      era?: number;
      whip?: number;
    };
    advanced?: {
      pythagWins?: number;
      strengthOfSched?: number;
      rpi?: number;
    };
  } | null;
  recentGames: Array<{
    id: string;
    scheduledAt: Date;
    status: string;
    opponent: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string;
    };
    isHome: boolean;
    teamScore?: number;
    opponentScore?: number;
    result?: 'W' | 'L' | null;
  }>;
}

/**
 * List teams with filters
 */
export async function getTeams(params: TeamsQueryParams): Promise<TeamsResponse> {
  const {
    conference,
    division,
    limit = 50,
    offset = 0,
  } = params;

  // Validate and clamp limit
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  // Build where clause
  const where: Prisma.TeamWhereInput = {};

  if (conference) {
    where.conference = {
      slug: conference,
    };
  }

  if (division) {
    where.division = division;
  }

  // Execute queries in parallel
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      include: {
        conference: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
          },
        },
      },
      orderBy: [
        { school: 'asc' },
      ],
      take: safeLimit,
      skip: offset,
    }),
    prisma.team.count({ where }),
  ]);

  return {
    teams,
    pagination: {
      total,
      limit: safeLimit,
      offset,
      hasMore: offset + safeLimit < total,
    },
  };
}

/**
 * Get team by slug with full details (roster + stats + recent games)
 */
export async function getTeamBySlug(slug: string): Promise<TeamDetailResponse | null> {
  const currentSeason = new Date().getFullYear();

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      conference: {
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
        },
      },
      players: {
        orderBy: [
          { position: 'asc' },
          { lastName: 'asc' },
        ],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jerseyNumber: true,
          position: true,
          bats: true,
          throws: true,
          year: true,
          height: true,
          weight: true,
          hometown: true,
        },
      },
      teamStats: {
        where: {
          season: currentSeason,
        },
        take: 1,
        select: {
          season: true,
          wins: true,
          losses: true,
          confWins: true,
          confLosses: true,
          runsScored: true,
          hitsTotal: true,
          homeRuns: true,
          stolenBases: true,
          battingAvg: true,
          onBasePct: true,
          sluggingPct: true,
          runsAllowed: true,
          earnedRuns: true,
          hitsAllowed: true,
          strikeouts: true,
          walks: true,
          era: true,
          whip: true,
          pythagWins: true,
          strengthOfSched: true,
          rpi: true,
        },
      },
      homeGames: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          awayTeam: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      },
      awayGames: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    return null;
  }

  // Combine and sort recent games
  const allGames = [
    ...team.homeGames.map((g) => ({
      ...g,
      isHome: true,
      opponent: g.awayTeam,
      teamScore: g.homeScore,
      opponentScore: g.awayScore,
    })),
    ...team.awayGames.map((g) => ({
      ...g,
      isHome: false,
      opponent: g.homeTeam,
      teamScore: g.awayScore,
      opponentScore: g.homeScore,
    })),
  ]
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, 10);

  const recentGames = allGames.map((game) => ({
    id: game.id,
    scheduledAt: game.scheduledAt,
    status: game.status,
    opponent: game.opponent,
    isHome: game.isHome,
    teamScore: game.teamScore ?? undefined,
    opponentScore: game.opponentScore ?? undefined,
    result:
      game.status === 'FINAL' && game.teamScore !== null && game.opponentScore !== null
        ? (game.teamScore > game.opponentScore ? 'W' : 'L')
        : null,
  }));

  // Format stats
  const rawStats = team.teamStats[0];
  const stats = rawStats
    ? {
        season: rawStats.season,
        record: {
          wins: rawStats.wins,
          losses: rawStats.losses,
          confWins: rawStats.confWins,
          confLosses: rawStats.confLosses,
          winPct: rawStats.wins / (rawStats.wins + rawStats.losses || 1),
        },
        batting: {
          runsScored: rawStats.runsScored,
          hitsTotal: rawStats.hitsTotal,
          homeRuns: rawStats.homeRuns,
          stolenBases: rawStats.stolenBases,
          battingAvg: rawStats.battingAvg ?? undefined,
          onBasePct: rawStats.onBasePct ?? undefined,
          sluggingPct: rawStats.sluggingPct ?? undefined,
        },
        pitching: {
          runsAllowed: rawStats.runsAllowed,
          earnedRuns: rawStats.earnedRuns,
          hitsAllowed: rawStats.hitsAllowed,
          strikeouts: rawStats.strikeouts,
          walks: rawStats.walks,
          era: rawStats.era ?? undefined,
          whip: rawStats.whip ?? undefined,
        },
        advanced: {
          pythagWins: rawStats.pythagWins ?? undefined,
          strengthOfSched: rawStats.strengthOfSched ?? undefined,
          rpi: rawStats.rpi ?? undefined,
        },
      }
    : null;

  return {
    ...team,
    roster: team.players,
    stats,
    recentGames,
  };
}
