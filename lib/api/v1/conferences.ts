/**
 * Conferences API Handler
 * GET /api/v1/conferences
 * GET /api/v1/conferences/[slug]
 * GET /api/v1/conferences/[slug]/standings
 *
 * List Conferences Query Parameters:
 * - division: D1 | D2 | D3 | JUCO
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset (default 0)
 *
 * Standings Query Parameters:
 * - season: Season year (default current year)
 * - sortBy: wins | winPct | confWins | confWinPct | rpi (default winPct)
 * - order: asc | desc (default desc)
 *
 * Response:
 * {
 *   conferences: Conference[],
 *   pagination: { total, limit, offset, hasMore }
 * }
 */

import { getPrismaClientSingleton } from '@/lib/db/prisma';
import { Conference, Division, Prisma } from '@prisma/client';

const prisma = getPrismaClientSingleton();

export interface ConferencesQueryParams {
  division?: Division;
  limit?: number;
  offset?: number;
}

export interface ConferencesResponse {
  conferences: Array<Conference & {
    teamCount: number;
    _count: { teams: number };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ConferenceDetailResponse extends Conference {
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    school: string;
    abbreviation?: string;
    city?: string;
    state?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>;
  _count: {
    teams: number;
  };
}

export interface StandingsQueryParams {
  season?: number;
  sortBy?: 'wins' | 'winPct' | 'confWins' | 'confWinPct' | 'rpi';
  order?: 'asc' | 'desc';
}

export interface TeamStanding {
  rank: number;
  team: {
    id: string;
    name: string;
    slug: string;
    school: string;
    abbreviation?: string;
    logoUrl?: string;
  };
  record: {
    wins: number;
    losses: number;
    winPct: number;
    confWins: number;
    confLosses: number;
    confWinPct: number;
    gamesBack: number;
    streak?: string;
  };
  stats: {
    runsScored: number;
    runsAllowed: number;
    runDifferential: number;
    homeRecord: string;
    awayRecord: string;
  };
  advanced?: {
    pythagWins?: number;
    rpi?: number;
    strengthOfSched?: number;
  };
}

export interface ConferenceStandingsResponse {
  conference: {
    id: string;
    name: string;
    slug: string;
    shortName?: string;
  };
  season: number;
  standings: TeamStanding[];
  leader: {
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
  };
  lastUpdated: Date;
}

/**
 * List conferences with optional division filter
 */
export async function getConferences(params: ConferencesQueryParams): Promise<ConferencesResponse> {
  const {
    division,
    limit = 50,
    offset = 0,
  } = params;

  // Validate and clamp limit
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  // Build where clause
  const where: Prisma.ConferenceWhereInput = {};

  if (division) {
    where.division = division;
  }

  // Execute queries in parallel
  const [conferences, total] = await Promise.all([
    prisma.conference.findMany({
      where,
      include: {
        _count: {
          select: { teams: true },
        },
      },
      orderBy: [
        { division: 'asc' },
        { name: 'asc' },
      ],
      take: safeLimit,
      skip: offset,
    }),
    prisma.conference.count({ where }),
  ]);

  return {
    conferences: conferences.map((conf) => ({
      ...conf,
      teamCount: conf._count.teams,
    })),
    pagination: {
      total,
      limit: safeLimit,
      offset,
      hasMore: offset + safeLimit < total,
    },
  };
}

/**
 * Get conference by slug with full team listing
 */
export async function getConferenceBySlug(slug: string): Promise<ConferenceDetailResponse | null> {
  const conference = await prisma.conference.findUnique({
    where: { slug },
    include: {
      teams: {
        orderBy: { school: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          city: true,
          state: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      _count: {
        select: { teams: true },
      },
    },
  });

  if (!conference) {
    return null;
  }

  return conference;
}

/**
 * Get conference standings for a specific season
 */
export async function getConferenceStandings(
  slug: string,
  params: StandingsQueryParams = {}
): Promise<ConferenceStandingsResponse | null> {
  const {
    season = new Date().getFullYear(),
    sortBy = 'winPct',
    order = 'desc',
  } = params;

  // Get conference
  const conference = await prisma.conference.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      shortName: true,
    },
  });

  if (!conference) {
    return null;
  }

  // Get all teams in conference with their stats
  const teams = await prisma.team.findMany({
    where: {
      conferenceId: conference.id,
    },
    include: {
      teamStats: {
        where: { season },
        take: 1,
      },
      homeGames: {
        where: {
          scheduledAt: {
            gte: new Date(`${season}-01-01`),
            lt: new Date(`${season + 1}-01-01`),
          },
          status: 'FINAL',
        },
        select: {
          homeScore: true,
          awayScore: true,
        },
      },
      awayGames: {
        where: {
          scheduledAt: {
            gte: new Date(`${season}-01-01`),
            lt: new Date(`${season + 1}-01-01`),
          },
          status: 'FINAL',
        },
        select: {
          homeScore: true,
          awayScore: true,
        },
      },
    },
    orderBy: { school: 'asc' },
  });

  // Calculate standings
  const standingsData = teams.map((team) => {
    const stats = team.teamStats[0];

    if (!stats) {
      return null;
    }

    const totalWins = stats.wins;
    const totalLosses = stats.losses;
    const winPct = totalWins / (totalWins + totalLosses || 1);

    const confWins = stats.confWins;
    const confLosses = stats.confLosses;
    const confWinPct = confWins / (confWins + confLosses || 1);

    // Calculate home/away records
    const homeWins = team.homeGames.filter((g) => g.homeScore! > g.awayScore!).length;
    const homeLosses = team.homeGames.filter((g) => g.homeScore! < g.awayScore!).length;
    const awayWins = team.awayGames.filter((g) => g.awayScore! > g.homeScore!).length;
    const awayLosses = team.awayGames.filter((g) => g.awayScore! < g.homeScore!).length;

    const runDifferential = stats.runsScored - stats.runsAllowed;

    return {
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        school: team.school,
        abbreviation: team.abbreviation,
        logoUrl: team.logoUrl,
      },
      record: {
        wins: totalWins,
        losses: totalLosses,
        winPct,
        confWins,
        confLosses,
        confWinPct,
        gamesBack: 0, // Will be calculated after sorting
        streak: undefined, // TODO: Calculate from recent games
      },
      stats: {
        runsScored: stats.runsScored,
        runsAllowed: stats.runsAllowed,
        runDifferential,
        homeRecord: `${homeWins}-${homeLosses}`,
        awayRecord: `${awayWins}-${awayLosses}`,
      },
      advanced: {
        pythagWins: stats.pythagWins ?? undefined,
        rpi: stats.rpi ?? undefined,
        strengthOfSched: stats.strengthOfSched ?? undefined,
      },
      // Sorting keys
      sortKeys: {
        wins: totalWins,
        winPct,
        confWins,
        confWinPct,
        rpi: stats.rpi ?? 0,
      },
    };
  }).filter((entry) => entry !== null);

  // Sort standings
  standingsData.sort((a, b) => {
    const aValue = a!.sortKeys[sortBy];
    const bValue = b!.sortKeys[sortBy];

    if (order === 'desc') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });

  // Calculate games back and add rank
  const leader = standingsData[0];
  const leaderWins = leader!.record.wins;
  const leaderLosses = leader!.record.losses;

  const standings: TeamStanding[] = standingsData.map((entry, index) => {
    const gamesBack =
      ((leaderWins - entry!.record.wins) + (entry!.record.losses - leaderLosses)) / 2;

    return {
      rank: index + 1,
      team: entry!.team,
      record: {
        ...entry!.record,
        gamesBack,
      },
      stats: entry!.stats,
      advanced: entry!.advanced,
    };
  });

  return {
    conference,
    season,
    standings,
    leader: {
      teamId: leader!.team.id,
      teamName: leader!.team.name,
      wins: leader!.record.wins,
      losses: leader!.record.losses,
    },
    lastUpdated: new Date(),
  };
}
