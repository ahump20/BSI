/**
 * Cloudflare Workers Ingest Layer
 *
 * Scheduled worker for data ingestion with provider failover.
 *
 * Cron Triggers:
 * - */5 * * * *  : Live games (every 5 minutes)
 * - 0 * * * *    : Team stats refresh (hourly)
 * - 0 2 * * *    : Historical aggregations (2am daily)
 *
 * Provider Failover:
 * 1. SportsDataIO (primary)
 * 2. NCAA API (backup)
 * 3. ESPN API (tertiary)
 *
 * Caching Strategy:
 * - Live games: 60s KV TTL
 * - Standings: 4hr KV TTL (14400s)
 * - Historical: R2 archival (immutable)
 */

import {
  Prisma,
  PrismaClient,
  GameStatus,
  SeasonType,
  FeedPrecision,
  BoxLineSide,
  InningHalf
} from '@prisma/client';
import { ProviderManager } from '../../lib/adapters/provider-manager';
import type { Env, ProviderGame, ProviderBoxLine } from './types';

const prisma = new PrismaClient();

async function executeWithConstraintGuard<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(', ')
        : error.meta?.target;
      const diagnostic = target ? ` (${target})` : '';
      const message = `[Ingest] Unique constraint violation${diagnostic} while processing ${context}`;
      console.error(message, error);
      throw new Error(message);
    }

    throw error;
  }
}

export default {
  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const cron = event.cron;

    console.log(`[Ingest Worker] Cron triggered: ${cron}`);

    try {
      switch (cron) {
        case '*/5 * * * *': // Every 5 minutes - live games
          await ingestLiveGames(env, ctx);
          break;

        case '0 * * * *': // Hourly - team stats
          await ingestTeamStats(env, ctx);
          break;

        case '0 2 * * *': // Daily 2am - historical aggregations
          await ingestHistoricalData(env, ctx);
          break;

        default:
          console.warn(`[Ingest Worker] Unknown cron schedule: ${cron}`);
      }
    } catch (error) {
      console.error(`[Ingest Worker] Cron execution failed:`, error);

      // Track error in Analytics Engine
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['ingest_error', cron],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

      // Re-throw to mark execution as failed
      throw error;
    }
  },

  /**
   * HTTP handler for manual triggers and health checks
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ingest-worker'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Manual trigger endpoints (protected by secret)
    const authHeader = request.headers.get('X-Ingest-Secret');
    if (authHeader !== env.INGEST_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      switch (url.pathname) {
        case '/ingest/live':
          ctx.waitUntil(ingestLiveGames(env, ctx));
          return new Response(JSON.stringify({ message: 'Live games ingestion started' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });

        case '/ingest/stats':
          ctx.waitUntil(ingestTeamStats(env, ctx));
          return new Response(JSON.stringify({ message: 'Team stats ingestion started' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });

        case '/ingest/historical':
          ctx.waitUntil(ingestHistoricalData(env, ctx));
          return new Response(JSON.stringify({ message: 'Historical data ingestion started' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error(`[Ingest Worker] Manual trigger failed:`, error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Ingest live games (every 5 minutes)
 */
async function ingestLiveGames(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting live games ingestion...');

  const providerManager = new ProviderManager(env);
  const currentDate = new Date();
  const season = currentDate.getFullYear();

  try {
    // Fetch live games for college baseball
    const games = await providerManager.getGames({
      sport: 'baseball',
      division: 'D1',
      date: currentDate,
      status: ['SCHEDULED', 'LIVE', 'FINAL']
    });

    console.log(`[Ingest] Fetched ${games.length} games from provider`);

    // Resolve provider team IDs to internal team IDs once per batch
    const teamExternalIds = Array.from(
      new Set(
        games.flatMap((game) => [game.homeTeamId, game.awayTeamId, game.boxScore?.map((line) => line.teamId) ?? []]).flat()
      )
    ).filter((id): id is string => Boolean(id));

    const knownTeams = await prisma.team.findMany({
      where: { externalId: { in: teamExternalIds } },
      select: { id: true, externalId: true }
    });

    const teamMap = new Map(
      knownTeams
        .filter((team) => Boolean(team.externalId))
        .map((team) => [team.externalId as string, team.id])
    );

    // Batch upsert games
    const upsertPromises = games.map((game) =>
      executeWithConstraintGuard(
        async () => {
          const normalizedStatus = normalizeGameStatus(game.status);
          const normalizedSeasonType = (game.seasonType ?? 'REGULAR') as SeasonType;
          const feedPrecision = (game.feedPrecision ?? 'EVENT') as FeedPrecision;

          const homeTeamDbId = teamMap.get(game.homeTeamId);
          const awayTeamDbId = teamMap.get(game.awayTeamId);

          if (!homeTeamDbId || !awayTeamDbId) {
            console.warn(
              `[Ingest] Skipping game ${game.id} - missing team mapping (home: ${game.homeTeamId}, away: ${game.awayTeamId})`
            );
            return null;
          }

          const dbGame = await prisma.game.upsert({
            where: { externalId: game.id },
            update: {
              status: normalizedStatus,
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              currentInning: game.currentInning,
              currentInningHalf: mapInningHalf(game.currentInningHalf),
              balls: game.balls,
              strikes: game.strikes,
              outs: game.outs,
              lastUpdated: new Date(),
              homeTeamId: homeTeamDbId,
              awayTeamId: awayTeamDbId,
              feedPrecision
            },
            create: {
              externalId: game.id,
              sport: 'BASEBALL',
              division: 'D1',
              season: game.season ?? season,
              seasonType: normalizedSeasonType,
              scheduledAt: new Date(game.scheduledAt),
              status: normalizedStatus,
              homeTeamId: homeTeamDbId,
              awayTeamId: awayTeamDbId,
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              venueId: game.venueId,
              currentInning: game.currentInning,
              currentInningHalf: mapInningHalf(game.currentInningHalf),
              balls: game.balls,
              strikes: game.strikes,
              outs: game.outs,
              providerName: game.providerName,
              feedPrecision
            }
          });

          await syncGameAncillaryData(dbGame.id, game, teamMap);

          return dbGame;
        },
        `game upsert ${game.id}`
      )
    );

    await Promise.all(upsertPromises);

    console.log(`[Ingest] Successfully upserted ${games.length} games`);

    // Cache live games in KV (60s TTL)
    const cacheKey = `live:games:${season}:${currentDate.toISOString().split('T')[0]}`;
    await env.CACHE.put(cacheKey, JSON.stringify(games), {
      expirationTtl: 60
    });

    // Track success in Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'live_games'],
        doubles: [games.length],
        indexes: [season.toString()]
      });
    }
  } catch (error) {
    console.error('[Ingest] Live games ingestion failed:', error);
    throw error;
  }
}

function normalizeGameStatus(status: ProviderGame['status']): GameStatus {
  switch (status) {
    case 'LIVE':
      return 'LIVE';
    case 'FINAL':
      return 'FINAL';
    case 'POSTPONED':
      return 'POSTPONED';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELED';
    default:
      return 'SCHEDULED';
  }
}

function mapInningHalf(half?: 'TOP' | 'BOTTOM'): InningHalf | null {
  if (!half) {
    return null;
  }

  return half === 'BOTTOM' ? 'BOTTOM' : 'TOP';
}

function mapBoxLineSide(side: ProviderBoxLine['side']): BoxLineSide {
  return side === 'AWAY' ? 'AWAY' : 'HOME';
}

function calculateTotalBases(line: ProviderBoxLine): number {
  const doubles = line.batting.doubles ?? 0;
  const triples = line.batting.triples ?? 0;
  const homeRuns = line.batting.homeRuns ?? 0;
  const singles = Math.max(0, line.batting.h - doubles - triples - homeRuns);

  return singles + doubles * 2 + triples * 3 + homeRuns * 4;
}

async function syncGameAncillaryData(
  gameId: string,
  providerGame: ProviderGame,
  teamMap: Map<string, string>
): Promise<void> {
  // Sync play-by-play events
  if (providerGame.events) {
    const eventData = providerGame.events.map((event, index) => ({
      gameId,
      sequence: event.sequence ?? index + 1,
      inning: event.inning,
      inningHalf: mapInningHalf(event.inningHalf) ?? 'TOP',
      outs: event.outs ?? null,
      eventType: event.eventType,
      description: event.description,
      homeWinProb: event.homeWinProb ?? null,
      wpaSwing: event.wpaSwing ?? null
    }));

    await prisma.$transaction(async (tx) => {
      await tx.event.deleteMany({ where: { gameId } });
      if (eventData.length > 0) {
        await tx.event.createMany({ data: eventData, skipDuplicates: true });
      }
    });
  }

  // Sync box score lines
  if (providerGame.boxScore) {
    const playerExternalIds = Array.from(
      new Set(providerGame.boxScore.map((line) => line.playerId).filter(Boolean))
    );

    const players = playerExternalIds.length
      ? await prisma.player.findMany({
          where: { externalId: { in: playerExternalIds } },
          select: { id: true, externalId: true }
        })
      : [];

    const playerMap = new Map(
      players
        .filter((player) => Boolean(player.externalId))
        .map((player) => [player.externalId as string, player.id])
    );

    const boxLineData: Prisma.GameBoxLineCreateManyInput[] = [];

    for (const line of providerGame.boxScore) {
      const teamId = teamMap.get(line.teamId);
      const playerId = playerMap.get(line.playerId);

      if (!teamId || !playerId) {
        console.warn(
          `[Ingest] Skipping box line for game ${gameId} - missing mapping`,
          JSON.stringify({ playerExternalId: line.playerId, teamExternalId: line.teamId })
        );
        continue;
      }

      boxLineData.push({
        gameId,
        teamId,
        playerId,
        side: mapBoxLineSide(line.side),
        battingOrder: line.battingOrder ?? null,
        ab: line.batting.ab,
        r: line.batting.r,
        h: line.batting.h,
        rbi: line.batting.rbi,
        bb: line.batting.bb,
        so: line.batting.so,
        doubles: line.batting.doubles ?? null,
        triples: line.batting.triples ?? null,
        homeRuns: line.batting.homeRuns ?? null,
        stolenBases: line.batting.stolenBases ?? null,
        caughtStealing: line.batting.caughtStealing ?? null,
        totalBases: calculateTotalBases(line),
        ip: line.pitching?.ip ?? null,
        hitsAllowed: line.pitching?.hitsAllowed ?? null,
        runsAllowed: line.pitching?.runsAllowed ?? null,
        earnedRuns: line.pitching?.earnedRuns ?? null,
        bbAllowed: line.pitching?.bbAllowed ?? null,
        soRecorded: line.pitching?.soRecorded ?? null,
        homeRunsAllowed: line.pitching?.homeRunsAllowed ?? null,
        decision:
          line.pitching?.decision && line.pitching.decision !== 'ND'
            ? line.pitching.decision
            : null
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.gameBoxLine.deleteMany({ where: { gameId } });
      if (boxLineData.length > 0) {
        await tx.gameBoxLine.createMany({ data: boxLineData, skipDuplicates: true });
      }
    });
  }
}

/**
 * Ingest team stats (hourly)
 */
async function ingestTeamStats(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting team stats ingestion...');

  const providerManager = new ProviderManager(env);
  const season = new Date().getFullYear();

  try {
    // Get all D1 teams
    const teams = await prisma.team.findMany({
      where: {
        sport: 'BASEBALL',
        division: 'D1'
      },
      select: {
        id: true,
        externalId: true
      }
    });

    console.log(`[Ingest] Fetching stats for ${teams.length} teams`);

    // Fetch stats with rate limiting (10 concurrent)
    const batchSize = 10;
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);

      const statsPromises = batch.map(async (team) => {
        try {
          const stats = await providerManager.getTeamStats({
            teamId: team.externalId,
            season
          });

          // Upsert team stats
          return executeWithConstraintGuard(
            () =>
              prisma.teamStats.upsert({
                where: {
                  teamId_season: {
                    teamId: team.id,
                    season
                  }
                },
                update: {
                  wins: stats.wins,
                  losses: stats.losses,
                  confWins: stats.confWins,
                  confLosses: stats.confLosses,
                  homeWins: stats.homeWins,
                  homeLosses: stats.homeLosses,
                  awayWins: stats.awayWins,
                  awayLosses: stats.awayLosses,
                  runsScored: stats.runsScored,
                  runsAllowed: stats.runsAllowed,
                  hitsTotal: stats.hitsTotal ?? 0,
                  homeRuns: stats.homeRuns ?? 0,
                  stolenBases: stats.stolenBases ?? 0,
                  battingAvg: stats.battingAvg,
                  onBasePct: stats.onBasePct,
                  sluggingPct: stats.sluggingPct,
                  era: stats.era,
                  fieldingPct: stats.fieldingPct,
                  earnedRuns: stats.earnedRuns ?? stats.runsAllowed ?? 0,
                  hitsAllowed: stats.hitsAllowed ?? 0,
                  strikeouts: stats.strikeouts ?? 0,
                  walks: stats.walks ?? 0,
                  rpi: stats.rpi,
                  strengthOfSched: stats.strengthOfSched,
                  pythagWins: stats.pythagWins,
                  lastUpdated: new Date()
                },
                create: {
                  teamId: team.id,
                  season,
                  wins: stats.wins,
                  losses: stats.losses,
                  confWins: stats.confWins,
                  confLosses: stats.confLosses,
                  homeWins: stats.homeWins,
                  homeLosses: stats.homeLosses,
                  awayWins: stats.awayWins,
                  awayLosses: stats.awayLosses,
                  runsScored: stats.runsScored,
                  runsAllowed: stats.runsAllowed,
                  hitsTotal: stats.hitsTotal ?? 0,
                  homeRuns: stats.homeRuns ?? 0,
                  stolenBases: stats.stolenBases ?? 0,
                  battingAvg: stats.battingAvg,
                  onBasePct: stats.onBasePct,
                  sluggingPct: stats.sluggingPct,
                  era: stats.era,
                  fieldingPct: stats.fieldingPct,
                  earnedRuns: stats.earnedRuns ?? stats.runsAllowed ?? 0,
                  hitsAllowed: stats.hitsAllowed ?? 0,
                  strikeouts: stats.strikeouts ?? 0,
                  walks: stats.walks ?? 0,
                  rpi: stats.rpi,
                  strengthOfSched: stats.strengthOfSched,
                  pythagWins: stats.pythagWins
                }
              }),
            `team stats upsert ${team.id}`
          );
        } catch (error) {
          console.error(`[Ingest] Failed to fetch stats for team ${team.id}:`, error);
          return null;
        }
      });

      await Promise.all(statsPromises);

      // Rate limit pause between batches
      if (i + batchSize < teams.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[Ingest] Successfully ingested stats for ${teams.length} teams`);

    // Cache standings in KV (4hr TTL)
    const standings = await prisma.teamStats.findMany({
      where: { season },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            school: true,
            abbreviation: true,
            conference: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: [
        { wins: 'desc' },
        { losses: 'asc' }
      ]
    });

    const cacheKey = `standings:${season}`;
    await env.CACHE.put(cacheKey, JSON.stringify(standings), {
      expirationTtl: 14400 // 4 hours
    });

    // Track success in Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'team_stats'],
        doubles: [teams.length],
        indexes: [season.toString()]
      });
    }
  } catch (error) {
    console.error('[Ingest] Team stats ingestion failed:', error);
    throw error;
  }
}

/**
 * Ingest historical data (daily 2am)
 */
async function ingestHistoricalData(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting historical data ingestion...');

  const providerManager = new ProviderManager(env);
  const season = new Date().getFullYear();

  try {
    // Aggregate completed games for archival
    const completedGames = await prisma.game.findMany({
      where: {
        season,
        status: 'FINAL',
        archived: false
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        events: true,
        boxLines: true
      }
    });

    console.log(`[Ingest] Archiving ${completedGames.length} completed games`);

    // Archive to R2 (immutable storage)
    if (completedGames.length > 0) {
      const archiveData = {
        season,
        archivedAt: new Date().toISOString(),
        games: completedGames
      };

      const archiveKey = `archives/${season}/${new Date().toISOString().split('T')[0]}.json`;
      await env.R2_BUCKET.put(archiveKey, JSON.stringify(archiveData), {
        customMetadata: {
          season: season.toString(),
          gameCount: completedGames.length.toString(),
          archivedAt: new Date().toISOString()
        }
      });

      // Mark games as archived
      await executeWithConstraintGuard(
        () =>
          prisma.game.updateMany({
            where: {
              id: { in: completedGames.map(g => g.id) }
            },
            data: {
              archived: true,
              archivedAt: new Date()
            }
          }),
        'game archive flag update'
      );

      console.log(`[Ingest] Archived ${completedGames.length} games to R2: ${archiveKey}`);
    }

    // Recalculate advanced stats
    console.log('[Ingest] Recalculating advanced statistics...');

    // Update RPI calculations
    await recalculateRPI(season);

    // Update strength of schedule
    await recalculateStrengthOfSchedule(season);

    // Update Pythagorean win expectations
    await recalculatePythagoreanWins(season);

    console.log('[Ingest] Historical data ingestion complete');

    // Track success in Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'historical'],
        doubles: [completedGames.length],
        indexes: [season.toString()]
      });
    }
  } catch (error) {
    console.error('[Ingest] Historical data ingestion failed:', error);
    throw error;
  }
}

/**
 * Recalculate RPI (Rating Percentage Index)
 */
async function recalculateRPI(season: number): Promise<void> {
  // Get all teams with their records
  const teams = await prisma.teamStats.findMany({
    where: { season },
    include: {
      team: {
        include: {
          homeGames: {
            where: {
              season,
              status: 'FINAL'
            }
          },
          awayGames: {
            where: {
              season,
              status: 'FINAL'
            }
          }
        }
      }
    }
  });

  // RPI formula: (WP * 0.25) + (OWP * 0.50) + (OOWP * 0.25)
  // WP = Winning Percentage
  // OWP = Opponents' Winning Percentage
  // OOWP = Opponents' Opponents' Winning Percentage

  // This is a simplified implementation - full RPI requires complex opponent tracking
  for (const teamStat of teams) {
    const totalGames = teamStat.wins + teamStat.losses;
    const wp = totalGames > 0 ? teamStat.wins / totalGames : 0;

    // For now, use a placeholder OWP/OOWP calculation
    // In production, this would require tracking all opponent relationships
    const rpi = wp * 0.25 + wp * 0.50 + wp * 0.25; // Simplified

    await executeWithConstraintGuard(
      () =>
        prisma.teamStats.update({
          where: {
            teamId_season: {
              teamId: teamStat.teamId,
              season
            }
          },
          data: { rpi }
        }),
      `team stats rpi ${teamStat.teamId}`
    );
  }
}

/**
 * Recalculate Strength of Schedule
 */
async function recalculateStrengthOfSchedule(season: number): Promise<void> {
  const teams = await prisma.teamStats.findMany({
    where: { season },
    include: {
      team: {
        include: {
          homeGames: {
            where: { season, status: 'FINAL' },
            include: { awayTeam: { include: { teamStats: true } } }
          },
          awayGames: {
            where: { season, status: 'FINAL' },
            include: { homeTeam: { include: { teamStats: true } } }
          }
        }
      }
    }
  });

  for (const teamStat of teams) {
    const opponents: number[] = [];

    // Collect opponent win percentages
    teamStat.team.homeGames.forEach(game => {
      const oppStats = game.awayTeam.teamStats.find(s => s.season === season);
      if (oppStats) {
        const oppGames = oppStats.wins + oppStats.losses;
        if (oppGames > 0) {
          opponents.push(oppStats.wins / oppGames);
        }
      }
    });

    teamStat.team.awayGames.forEach(game => {
      const oppStats = game.homeTeam.teamStats.find(s => s.season === season);
      if (oppStats) {
        const oppGames = oppStats.wins + oppStats.losses;
        if (oppGames > 0) {
          opponents.push(oppStats.wins / oppGames);
        }
      }
    });

    // Average opponent win percentage
    const sos = opponents.length > 0
      ? opponents.reduce((sum, wp) => sum + wp, 0) / opponents.length
      : 0;

    await executeWithConstraintGuard(
      () =>
        prisma.teamStats.update({
          where: {
            teamId_season: {
              teamId: teamStat.teamId,
              season
            }
          },
          data: { strengthOfSched: sos }
        }),
      `team stats sos ${teamStat.teamId}`
    );
  }
}

/**
 * Recalculate Pythagorean Win Expectation
 */
async function recalculatePythagoreanWins(season: number): Promise<void> {
  const teams = await prisma.teamStats.findMany({
    where: { season }
  });

  // Baseball exponent: typically 1.83
  const exponent = 1.83;

  for (const teamStat of teams) {
    if (teamStat.runsScored > 0 || teamStat.runsAllowed > 0) {
      const pythagPct =
        Math.pow(teamStat.runsScored, exponent) /
        (Math.pow(teamStat.runsScored, exponent) + Math.pow(teamStat.runsAllowed, exponent));

      const totalGames = teamStat.wins + teamStat.losses;
      const pythagWins = pythagPct * totalGames;

      await executeWithConstraintGuard(
        () =>
          prisma.teamStats.update({
            where: {
              teamId_season: {
                teamId: teamStat.teamId,
                season
              }
            },
            data: { pythagWins }
          }),
        `team stats pythag ${teamStat.teamId}`
      );
    }
  }
}
