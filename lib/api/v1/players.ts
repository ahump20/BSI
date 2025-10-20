/**
 * Players API Handler
 * GET /api/v1/players/[id]
 *
 * Response includes:
 * - Player biographical information
 * - Current season statistics (batting + pitching)
 * - Career statistics aggregation
 * - Recent game performances (last 10 games)
 * - Team and conference context
 */

import { getCachedJSON, setCachedJSON } from '@/lib/cache/redis';
import { prisma } from '@/lib/db/prisma';
import { Position, HandedEnum, AcademicYear } from '@prisma/client';

const PLAYERS_CACHE_PREFIX = 'api:v1:players';

export interface PlayerDetailResponse {
  // Biographical
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jerseyNumber?: string;
  position: Position;
  bats?: HandedEnum;
  throws?: HandedEnum;
  year?: AcademicYear;
  height?: number;
  weight?: number;
  hometown?: string;

  // Team context
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

  // Current season statistics
  currentSeason: {
    season: number;
    batting?: {
      gamesPlayed: number;
      atBats: number;
      runs: number;
      hits: number;
      doubles: number;
      triples: number;
      homeRuns: number;
      rbi: number;
      walks: number;
      strikeouts: number;
      stolenBases: number;
      caughtStealing: number;
      battingAvg: number;
      onBasePct: number;
      sluggingPct: number;
      ops: number;
    };
    pitching?: {
      gamesPlayed: number;
      gamesStarted: number;
      wins: number;
      losses: number;
      saves: number;
      inningsPitched: number;
      hitsAllowed: number;
      runsAllowed: number;
      earnedRuns: number;
      walks: number;
      strikeouts: number;
      homeRunsAllowed: number;
      era: number;
      whip: number;
      strikeoutsPerNine: number;
      walksPerNine: number;
    };
  } | null;

  // Career totals
  career: {
    seasons: number;
    batting?: {
      gamesPlayed: number;
      atBats: number;
      runs: number;
      hits: number;
      homeRuns: number;
      rbi: number;
      battingAvg: number;
      onBasePct: number;
      sluggingPct: number;
    };
    pitching?: {
      gamesPlayed: number;
      wins: number;
      losses: number;
      saves: number;
      inningsPitched: number;
      strikeouts: number;
      era: number;
      whip: number;
    };
  };

  // Recent performances
  recentGames: Array<{
    gameId: string;
    gameDate: Date;
    opponent: {
      id: string;
      name: string;
      slug: string;
      abbreviation?: string;
    };
    isHome: boolean;
    gameResult: 'W' | 'L' | null;
    batting?: {
      ab: number;
      r: number;
      h: number;
      rbi: number;
      bb: number;
      so: number;
      avg?: string; // Game batting average for display
    };
    pitching?: {
      ip: number;
      h: number;
      r: number;
      er: number;
      bb: number;
      so: number;
      decision?: 'W' | 'L' | 'S' | null;
    };
  }>;
}

/**
 * Get player by ID with full statistics and recent performances
 */
export async function getPlayerById(id: string): Promise<PlayerDetailResponse | null> {
  const cacheKey = `${PLAYERS_CACHE_PREFIX}:detail:${id}`;
  const cached = await getCachedJSON<PlayerDetailResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const currentSeason = new Date().getFullYear();

  const player = await prisma.player.findUnique({
    where: { id },
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
      playerStats: {
        orderBy: { season: 'desc' },
      },
      boxLines: {
        take: 10,
        orderBy: { game: { scheduledAt: 'desc' } },
        include: {
          game: {
            select: {
              id: true,
              scheduledAt: true,
              homeTeamId: true,
              awayTeamId: true,
              homeScore: true,
              awayScore: true,
              status: true,
              homeTeam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  abbreviation: true,
                },
              },
              awayTeam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  abbreviation: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!player) {
    return null;
  }

  // Get current season stats
  const currentSeasonStats = player.playerStats.find((s) => s.season === currentSeason);

  // Aggregate career stats
  const careerBattingStats = player.playerStats.reduce(
    (acc, stats) => ({
      gamesPlayed: acc.gamesPlayed + stats.gamesPlayed,
      atBats: acc.atBats + stats.atBats,
      runs: acc.runs + stats.runs,
      hits: acc.hits + stats.hits,
      homeRuns: acc.homeRuns + stats.homeRuns,
      rbi: acc.rbi + stats.rbi,
      walks: acc.walks + stats.walks,
      strikeouts: acc.strikeouts + stats.strikeouts,
    }),
    { gamesPlayed: 0, atBats: 0, runs: 0, hits: 0, homeRuns: 0, rbi: 0, walks: 0, strikeouts: 0 }
  );

  const careerPitchingStats = player.playerStats.reduce(
    (acc, stats) => ({
      gamesPlayed: acc.gamesPlayed + stats.gamesPitched,
      wins: acc.wins + stats.wins,
      losses: acc.losses + stats.losses,
      saves: acc.saves + stats.saves,
      inningsPitched: acc.inningsPitched + stats.inningsPitched,
      strikeouts: acc.strikeouts + stats.strikeouts,
      earnedRuns: acc.earnedRuns + stats.earnedRuns,
      hitsAllowed: acc.hitsAllowed + stats.hitsAllowed,
      walksAllowed: acc.walksAllowed + stats.walksAllowed,
    }),
    {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      saves: 0,
      inningsPitched: 0,
      strikeouts: 0,
      earnedRuns: 0,
      hitsAllowed: 0,
      walksAllowed: 0,
    }
  );

  // Calculate career averages
  const careerBattingAvg = careerBattingStats.atBats > 0
    ? careerBattingStats.hits / careerBattingStats.atBats
    : 0;

  const careerOnBasePct = careerBattingStats.atBats > 0
    ? (careerBattingStats.hits + careerBattingStats.walks) /
      (careerBattingStats.atBats + careerBattingStats.walks)
    : 0;

  const totalBases = player.playerStats.reduce(
    (acc, stats) =>
      acc + stats.hits + stats.doubles + stats.triples * 2 + stats.homeRuns * 3,
    0
  );
  const careerSluggingPct = careerBattingStats.atBats > 0
    ? totalBases / careerBattingStats.atBats
    : 0;

  const careerEra = careerPitchingStats.inningsPitched > 0
    ? (careerPitchingStats.earnedRuns * 9) / careerPitchingStats.inningsPitched
    : 0;

  const careerWhip = careerPitchingStats.inningsPitched > 0
    ? (careerPitchingStats.hitsAllowed + careerPitchingStats.walksAllowed) /
      careerPitchingStats.inningsPitched
    : 0;

  // Process recent games
  const recentGames = player.boxLines.map((boxLine) => {
    const game = boxLine.game;
    const isHome = game.homeTeamId === player.teamId;
    const opponent = isHome ? game.awayTeam : game.homeTeam;

    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;

    const gameResult =
      game.status === 'FINAL' && teamScore !== null && opponentScore !== null
        ? teamScore > opponentScore
          ? ('W' as const)
          : ('L' as const)
        : null;

    // Batting stats from box line
    const batting =
      boxLine.ab > 0
        ? {
            ab: boxLine.ab,
            r: boxLine.r,
            h: boxLine.h,
            rbi: boxLine.rbi,
            bb: boxLine.bb,
            so: boxLine.so,
            avg: boxLine.ab > 0 ? (boxLine.h / boxLine.ab).toFixed(3) : undefined,
          }
        : undefined;

    // Pitching stats from box line (if IP > 0)
    const pitching =
      boxLine.ip && boxLine.ip > 0
        ? {
            ip: boxLine.ip,
            h: boxLine.hitsAllowed ?? 0,
            r: boxLine.runsAllowed ?? 0,
            er: boxLine.earnedRuns ?? 0,
            bb: boxLine.bbAllowed ?? 0,
            so: boxLine.soRecorded ?? 0,
            decision: boxLine.decision as 'W' | 'L' | 'S' | null,
          }
        : undefined;

    return {
      gameId: game.id,
      gameDate: game.scheduledAt,
      opponent,
      isHome,
      gameResult,
      batting,
      pitching,
    };
  });

  // Build current season stats
  const currentSeason = currentSeasonStats
    ? {
        season: currentSeasonStats.season,
        batting:
          currentSeasonStats.atBats > 0
            ? {
                gamesPlayed: currentSeasonStats.gamesPlayed,
                atBats: currentSeasonStats.atBats,
                runs: currentSeasonStats.runs,
                hits: currentSeasonStats.hits,
                doubles: currentSeasonStats.doubles,
                triples: currentSeasonStats.triples,
                homeRuns: currentSeasonStats.homeRuns,
                rbi: currentSeasonStats.rbi,
                walks: currentSeasonStats.walks,
                strikeouts: currentSeasonStats.strikeouts,
                stolenBases: currentSeasonStats.stolenBases,
                caughtStealing: currentSeasonStats.caughtStealing,
                battingAvg: currentSeasonStats.battingAvg ?? 0,
                onBasePct: currentSeasonStats.onBasePct ?? 0,
                sluggingPct: currentSeasonStats.sluggingPct ?? 0,
                ops: (currentSeasonStats.onBasePct ?? 0) + (currentSeasonStats.sluggingPct ?? 0),
              }
            : undefined,
        pitching:
          currentSeasonStats.inningsPitched > 0
            ? {
                gamesPlayed: currentSeasonStats.gamesPitched,
                gamesStarted: currentSeasonStats.gamesStarted,
                wins: currentSeasonStats.wins,
                losses: currentSeasonStats.losses,
                saves: currentSeasonStats.saves,
                inningsPitched: currentSeasonStats.inningsPitched,
                hitsAllowed: currentSeasonStats.hitsAllowed,
                runsAllowed: currentSeasonStats.runsAllowed,
                earnedRuns: currentSeasonStats.earnedRuns,
                walks: currentSeasonStats.walksAllowed,
                strikeouts: currentSeasonStats.strikeouts,
                homeRunsAllowed: currentSeasonStats.homeRunsAllowed,
                era: currentSeasonStats.era ?? 0,
                whip: currentSeasonStats.whip ?? 0,
                strikeoutsPerNine: currentSeasonStats.strikeoutsPerNine ?? 0,
                walksPerNine: currentSeasonStats.walksPerNine ?? 0,
              }
            : undefined,
      }
    : null;

  const response: PlayerDetailResponse = {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    fullName: `${player.firstName} ${player.lastName}`,
    jerseyNumber: player.jerseyNumber,
    position: player.position,
    bats: player.bats,
    throws: player.throws,
    year: player.year,
    height: player.height,
    weight: player.weight,
    hometown: player.hometown,
    team: player.team,
    currentSeason,
    career: {
      seasons: player.playerStats.length,
      batting:
        careerBattingStats.atBats > 0
          ? {
              gamesPlayed: careerBattingStats.gamesPlayed,
              atBats: careerBattingStats.atBats,
              runs: careerBattingStats.runs,
              hits: careerBattingStats.hits,
              homeRuns: careerBattingStats.homeRuns,
              rbi: careerBattingStats.rbi,
              battingAvg: careerBattingAvg,
              onBasePct: careerOnBasePct,
              sluggingPct: careerSluggingPct,
            }
          : undefined,
      pitching:
        careerPitchingStats.inningsPitched > 0
          ? {
              gamesPlayed: careerPitchingStats.gamesPlayed,
              wins: careerPitchingStats.wins,
              losses: careerPitchingStats.losses,
              saves: careerPitchingStats.saves,
              inningsPitched: careerPitchingStats.inningsPitched,
              strikeouts: careerPitchingStats.strikeouts,
              era: careerEra,
              whip: careerWhip,
            }
          : undefined,
    },
    recentGames,
  };

  await setCachedJSON(cacheKey, response, 300);

  return response;
}
