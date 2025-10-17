/**
 * Rankings API Handler
 * GET /api/v1/rankings
 * GET /api/v1/rankings/history
 *
 * Query Parameters:
 * - pollType: COACHES | BASEBALL_AMERICA | D1BASEBALL | PERFECT_GAME | COMPOSITE
 * - season: Season year (default current year)
 * - week: Week number (default latest)
 * - limit: Number of results (default 25, max 50)
 *
 * Response:
 * {
 *   rankings: RankingEntry[],
 *   metadata: { pollType, season, week, publishedDate }
 * }
 */

import { prisma } from '@/lib/db/prisma';
import { PollType, Prisma } from '@prisma/client';

export interface RankingsQueryParams {
  pollType?: PollType;
  season?: number;
  week?: number;
  limit?: number;
}

export interface RankingEntry {
  rank: number;
  previousRank?: number;
  movement?: 'up' | 'down' | 'same' | 'new';
  movementAmount?: number;
  team: {
    id: string;
    name: string;
    slug: string;
    school: string;
    abbreviation?: string;
    logoUrl?: string;
    conference: {
      id: string;
      name: string;
      slug: string;
    };
  };
  record?: {
    wins: number;
    losses: number;
    winPct: number;
  };
  points?: number;
  firstPlaceVotes?: number;
}

export interface RankingsResponse {
  rankings: RankingEntry[];
  metadata: {
    pollType: PollType;
    season: number;
    week: number;
    publishedDate?: Date;
    totalTeamsRanked: number;
  };
}

export interface RankingsHistoryQueryParams {
  teamId: string;
  pollType?: PollType;
  season?: number;
  limit?: number;
}

export interface RankingsHistoryEntry {
  week: number;
  rank: number;
  points?: number;
  record?: {
    wins: number;
    losses: number;
  };
  publishedDate?: Date;
}

export interface RankingsHistoryResponse {
  team: {
    id: string;
    name: string;
    school: string;
  };
  pollType: PollType;
  season: number;
  history: RankingsHistoryEntry[];
  summary: {
    highestRank: number;
    lowestRank: number;
    weeksRanked: number;
    currentRank?: number;
  };
}

/**
 * Get rankings for a specific poll type and week
 */
export async function getRankings(params: RankingsQueryParams = {}): Promise<RankingsResponse> {
  const currentYear = new Date().getFullYear();
  const {
    pollType = 'COACHES',
    season = currentYear,
    week,
    limit = 25,
  } = params;

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  // If week not specified, get the latest week for this poll/season
  let targetWeek = week;
  if (!targetWeek) {
    const latestRanking = await prisma.ranking.findFirst({
      where: {
        pollType,
        season,
      },
      orderBy: { week: 'desc' },
      select: { week: true },
    });
    targetWeek = latestRanking?.week ?? 1;
  }

  // Get rankings for specified poll/season/week
  const rankings = await prisma.ranking.findMany({
    where: {
      pollType,
      season,
      week: targetWeek,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          logoUrl: true,
          conference: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { rank: 'asc' },
    take: safeLimit,
  });

  // Get team records for the season
  const teamIds = rankings.map((r) => r.teamId);
  const teamStats = await prisma.teamStats.findMany({
    where: {
      teamId: { in: teamIds },
      season,
    },
    select: {
      teamId: true,
      wins: true,
      losses: true,
    },
  });

  const teamStatsMap = new Map(teamStats.map((ts) => [ts.teamId, ts]));

  // Calculate movement
  const rankingEntries: RankingEntry[] = rankings.map((ranking) => {
    const stats = teamStatsMap.get(ranking.teamId);
    const record = stats
      ? {
          wins: stats.wins,
          losses: stats.losses,
          winPct: stats.wins / (stats.wins + stats.losses || 1),
        }
      : undefined;

    let movement: 'up' | 'down' | 'same' | 'new' | undefined;
    let movementAmount: number | undefined;

    if (ranking.previousRank !== null) {
      if (ranking.rank < ranking.previousRank) {
        movement = 'up';
        movementAmount = ranking.previousRank - ranking.rank;
      } else if (ranking.rank > ranking.previousRank) {
        movement = 'down';
        movementAmount = ranking.rank - ranking.previousRank;
      } else {
        movement = 'same';
      }
    } else {
      movement = 'new';
    }

    return {
      rank: ranking.rank,
      previousRank: ranking.previousRank ?? undefined,
      movement,
      movementAmount,
      team: ranking.team as any,
      record,
      points: ranking.points ?? undefined,
      firstPlaceVotes: ranking.firstPlaceVotes ?? undefined,
    };
  }) as any;

  return {
    rankings: rankingEntries,
    metadata: {
      pollType,
      season,
      week: targetWeek,
      publishedDate: rankings[0]?.createdAt,
      totalTeamsRanked: rankings.length,
    },
  };
}

/**
 * Get ranking history for a specific team
 */
export async function getRankingsHistory(
  params: RankingsHistoryQueryParams
): Promise<RankingsHistoryResponse | null> {
  const currentYear = new Date().getFullYear();
  const {
    teamId,
    pollType = 'COACHES',
    season = currentYear,
    limit = 20,
  } = params;

  // Get team info
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      school: true,
    },
  });

  if (!team) {
    return null;
  }

  // Get all rankings for this team/poll/season
  const rankings = await prisma.ranking.findMany({
    where: {
      teamId,
      pollType,
      season,
    },
    orderBy: { week: 'asc' },
    take: limit,
  });

  if (rankings.length === 0) {
    return {
      team: team as any,
      pollType,
      season,
      history: [],
      summary: {
        highestRank: 0,
        lowestRank: 0,
        weeksRanked: 0,
      },
    };
  }

  // Get team stats for each week
  const teamStats = await prisma.teamStats.findFirst({
    where: {
      teamId,
      season,
    },
    select: {
      wins: true,
      losses: true,
    },
  });

  const history: RankingsHistoryEntry[] = rankings.map((ranking) => ({
    week: ranking.week,
    rank: ranking.rank,
    points: ranking.points ?? undefined,
    record: teamStats
      ? {
          wins: teamStats.wins,
          losses: teamStats.losses,
        }
      : undefined,
    publishedDate: ranking.createdAt,
  }));

  // Calculate summary statistics
  const ranks = rankings.map((r) => r.rank);
  const highestRank = Math.min(...ranks);
  const lowestRank = Math.max(...ranks);
  const currentRank = rankings[rankings.length - 1]?.rank;

  return {
    team: team as any,
    pollType,
    season,
    history,
    summary: {
      highestRank,
      lowestRank,
      weeksRanked: rankings.length,
      currentRank,
    },
  };
}

/**
 * Get composite rankings (aggregate across all polls)
 */
export async function getCompositeRankings(
  season?: number,
  week?: number
): Promise<RankingsResponse> {
  const currentYear = new Date().getFullYear();
  const targetSeason = season ?? currentYear;

  // Get latest week if not specified
  let targetWeek = week;
  if (!targetWeek) {
    const latestRanking = await prisma.ranking.findFirst({
      where: {
        pollType: 'COMPOSITE',
        season: targetSeason,
      },
      orderBy: { week: 'desc' },
      select: { week: true },
    });
    targetWeek = latestRanking?.week ?? 1;
  }

  // Use the pre-calculated composite rankings if available
  const compositeRankings = await prisma.ranking.findMany({
    where: {
      pollType: 'COMPOSITE',
      season: targetSeason,
      week: targetWeek,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          logoUrl: true,
          conference: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { rank: 'asc' },
  });

  if (compositeRankings.length > 0) {
    return getRankings({
      pollType: 'COMPOSITE',
      season: targetSeason,
      week: targetWeek,
      limit: 25,
    });
  }

  // If no composite rankings, calculate on-the-fly
  // Get all rankings for this week from different polls
  const allRankings = await prisma.ranking.findMany({
    where: {
      season: targetSeason,
      week: targetWeek,
      pollType: { not: 'COMPOSITE' },
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          logoUrl: true,
          conference: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Aggregate rankings by team
  const teamRankings = new Map<
    string,
    {
      team: any;
      ranks: number[];
      totalPoints: number;
      appearances: number;
    }
  >();

  allRankings.forEach((ranking) => {
    const existing = teamRankings.get(ranking.teamId);
    if (existing) {
      existing.ranks.push(ranking.rank);
      existing.totalPoints += ranking.points ?? 0;
      existing.appearances += 1;
    } else {
      teamRankings.set(ranking.teamId, {
        team: ranking.team,
        ranks: [ranking.rank],
        totalPoints: ranking.points ?? 0,
        appearances: 1,
      });
    }
  });

  // Calculate average rank for each team
  const compositeEntries: RankingEntry[] = Array.from(teamRankings.values())
    .map((entry) => {
      const averageRank = entry.ranks.reduce((a, b) => a + b, 0) / entry.ranks.length;
      return {
        team: entry.team,
        averageRank,
        totalPoints: entry.totalPoints,
        appearances: entry.appearances,
      };
    })
    .sort((a, b) => a.averageRank - b.averageRank)
    .slice(0, 25)
    .map((entry, index) => ({
      rank: index + 1,
      team: entry.team,
      points: entry.totalPoints,
    }));

  return {
    rankings: compositeEntries,
    metadata: {
      pollType: 'COMPOSITE' as PollType,
      season: targetSeason,
      week: targetWeek,
      totalTeamsRanked: compositeEntries.length,
    },
  };
}
