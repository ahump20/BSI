/**
 * Games API Handler
 * GET /api/v1/games
 *
 * Query Parameters:
 * - date: YYYY-MM-DD (filter by game date)
 * - status: SCHEDULED | LIVE | FINAL | POSTPONED | DELAYED | SUSPENDED | CANCELED
 * - conference: Conference slug
 * - teamId: Team ID
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset (default 0)
 *
 * Response:
 * {
 *   games: Game[],
 *   pagination: { total, limit, offset, hasMore }
 * }
 */

import { prisma } from '@/lib/db/prisma';
import { Game, GameStatus, Prisma } from '@prisma/client';

export interface GamesQueryParams {
  date?: string;
  status?: GameStatus;
  conference?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}

export interface GamesResponse {
  games: Game[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface GameDetailResponse extends Game {
  events: Array<{
    id: string;
    sequence: number;
    inning: number;
    inningHalf: string;
    outs: number;
    eventType: string;
    description: string;
    homeWinProb?: number;
    wpaSwing?: number;
  }>;
  homeBoxLines: Array<{
    player: {
      id: string;
      firstName: string;
      lastName: string;
      jerseyNumber?: string;
      position: string;
    };
    batting: {
      ab: number;
      r: number;
      h: number;
      rbi: number;
      bb: number;
      so: number;
    };
    pitching?: {
      ip: number;
      h: number;
      r: number;
      er: number;
      bb: number;
      so: number;
    };
  }>;
  awayBoxLines: Array<{
    player: {
      id: string;
      firstName: string;
      lastName: string;
      jerseyNumber?: string;
      position: string;
    };
    batting: {
      ab: number;
      r: number;
      h: number;
      rbi: number;
      bb: number;
      so: number;
    };
    pitching?: {
      ip: number;
      h: number;
      r: number;
      er: number;
      bb: number;
      so: number;
    };
  }>;
}

/**
 * List games with filters
 */
export async function getGames(params: GamesQueryParams): Promise<GamesResponse> {
  const {
    date,
    status,
    conference,
    teamId,
    limit = 50,
    offset = 0,
  } = params;

  // Validate and clamp limit
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  // Build where clause
  const where: Prisma.GameWhereInput = {};

  // Filter by date
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    where.scheduledAt = {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by conference
  if (conference) {
    where.OR = [
      {
        homeTeam: {
          conference: {
            slug: conference,
          },
        },
      },
      {
        awayTeam: {
          conference: {
            slug: conference,
          },
        },
      },
    ];
  }

  // Filter by team
  if (teamId) {
    where.OR = [
      { homeTeamId: teamId },
      { awayTeamId: teamId },
    ];
  }

  // Execute queries in parallel
  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
      include: {
        homeTeam: {
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
        awayTeam: {
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
      orderBy: [
        { scheduledAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: safeLimit,
      skip: offset,
    }),
    prisma.game.count({ where }),
  ]);

  return {
    games,
    pagination: {
      total,
      limit: safeLimit,
      offset,
      hasMore: offset + safeLimit < total,
    },
  };
}

/**
 * Get game by ID with full details (events + box scores)
 */
export async function getGameById(id: string): Promise<GameDetailResponse | null> {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          conference: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: true,
          abbreviation: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          conference: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      events: {
        orderBy: { sequence: 'asc' },
        select: {
          id: true,
          sequence: true,
          inning: true,
          inningHalf: true,
          outs: true,
          eventType: true,
          description: true,
          homeWinProb: true,
          wpaSwing: true,
        },
      },
      boxLines: {
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!game) {
    return null;
  }

  // Separate box lines by team side
  const homeBoxLines = game.boxLines
    .filter((line) => line.side === 'HOME')
    .map((line) => ({
      player: line.player,
      batting: {
        ab: line.atBats,
        r: line.runs,
        h: line.hits,
        rbi: line.rbi,
        bb: line.walks,
        so: line.strikeouts,
      },
      pitching: line.inningsPitched
        ? {
            ip: Number(line.inningsPitched),
            h: line.hitsAllowed ?? 0,
            r: line.runsAllowed ?? 0,
            er: line.earnedRuns ?? 0,
            bb: line.walksAllowed ?? 0,
            so: line.strikeoutsRecorded ?? 0,
          }
        : undefined,
    }));

  const awayBoxLines = game.boxLines
    .filter((line) => line.side === 'AWAY')
    .map((line) => ({
      player: line.player,
      batting: {
        ab: line.atBats,
        r: line.runs,
        h: line.hits,
        rbi: line.rbi,
        bb: line.walks,
        so: line.strikeouts,
      },
      pitching: line.inningsPitched
        ? {
            ip: Number(line.inningsPitched),
            h: line.hitsAllowed ?? 0,
            r: line.runsAllowed ?? 0,
            er: line.earnedRuns ?? 0,
            bb: line.walksAllowed ?? 0,
            so: line.strikeoutsRecorded ?? 0,
          }
        : undefined,
    }));

  return {
    ...game,
    homeBoxLines,
    awayBoxLines,
  };
}
