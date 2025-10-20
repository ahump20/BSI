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
  Division,
  FeedPrecision,
  GameStatus,
  InningHalf,
  Prisma,
  PrismaClient,
  SeasonType,
  Sport,
} from '@prisma/client';
import { ProviderManager } from '../../lib/adapters/provider-manager';
import type { Env, ProviderGame } from './types';

type IngestPrismaGlobal = {
  __INGEST_PRISMA__?: PrismaClient;
};

const globalForPrisma = globalThis as unknown as IngestPrismaGlobal;

const prisma =
  globalForPrisma.__INGEST_PRISMA__ ??
  new PrismaClient({
    log: ['error'],
  });

if (!globalForPrisma.__INGEST_PRISMA__) {
  globalForPrisma.__INGEST_PRISMA__ = prisma;
}

const GAME_STATUS_VALUES = new Set<GameStatus>(Object.values(GameStatus));

function normalizeGameStatus(status: ProviderGame['status']): GameStatus {
  if (status === 'CANCELLED') {
    return GameStatus.CANCELED;
  }

  return GAME_STATUS_VALUES.has(status as GameStatus)
    ? (status as GameStatus)
    : GameStatus.SCHEDULED;
}

function normalizeInningHalf(half?: ProviderGame['currentInningHalf']): InningHalf | null {
  if (!half) {
    return null;
  }

  return half === 'TOP' ? InningHalf.TOP : InningHalf.BOTTOM;
}

function normalizeFeedPrecision(precision: ProviderGame['feedPrecision']): FeedPrecision {
  return precision;
}

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
      sport: Sport.BASEBALL,
      division: Division.D1,
      date: currentDate,
      status: [GameStatus.SCHEDULED, GameStatus.LIVE, GameStatus.FINAL]
    });

    console.log(`[Ingest] Fetched ${games.length} games from provider`);

    // Batch upsert games
    const upsertPromises = games.map((game) =>
      executeWithConstraintGuard(
        () => {
          const inningHalf = normalizeInningHalf(game.currentInningHalf);

          const createData = {
            externalId: game.id,
            sport: game.sport ?? Sport.BASEBALL,
            division: game.division ?? Division.D1,
            season,
            seasonType: SeasonType.REGULAR,
            scheduledAt: new Date(game.scheduledAt),
            status: normalizeGameStatus(game.status),
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            venueId: game.venueId ?? null,
            currentInning: game.currentInning ?? null,
            currentInningHalf: inningHalf,
            balls: game.balls ?? null,
            strikes: game.strikes ?? null,
            outs: game.outs ?? null,
            providerName: game.providerName,
            feedPrecision: normalizeFeedPrecision(game.feedPrecision),
          } satisfies Prisma.GameUncheckedCreateInput;

          const updateData = {
            status: normalizeGameStatus(game.status),
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            currentInning: game.currentInning ?? null,
            currentInningHalf: inningHalf ?? null,
            balls: game.balls ?? null,
            strikes: game.strikes ?? null,
            outs: game.outs ?? null,
            providerName: game.providerName,
            feedPrecision: normalizeFeedPrecision(game.feedPrecision),
          } satisfies Prisma.GameUncheckedUpdateInput;

          return prisma.game.upsert({
            where: { externalId: game.id },
            update: updateData,
            create: createData,
          });
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
        sport: Sport.BASEBALL,
        division: Division.D1,
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
            () => {
              const updateData = {
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
                hitsTotal: stats.hitsTotal,
                doubles: stats.doubles,
                triples: stats.triples,
                homeRuns: stats.homeRuns,
                stolenBases: stats.stolenBases,
                caughtStealing: stats.caughtStealing,
                battingAvg: stats.battingAvg,
                onBasePct: stats.onBasePct ?? null,
                sluggingPct: stats.sluggingPct ?? null,
                ops: stats.ops ?? null,
                earnedRuns: stats.runsAllowed,
                hitsAllowed: stats.hitsAllowed ?? 0,
                strikeouts: stats.strikeouts ?? 0,
                walks: stats.walks ?? 0,
                era: stats.era,
                whip: stats.whip ?? null,
                fieldingPct: stats.fieldingPct,
                rpi: stats.rpi ?? null,
                strengthOfSched: stats.strengthOfSched ?? null,
                pythagWins: stats.pythagWins ?? null,
                recentForm: stats.recentForm ?? null,
                injuryImpact: stats.injuryImpact ?? null,
                lastUpdated: new Date(),
              } satisfies Prisma.TeamSeasonStatUncheckedUpdateInput;

              const createData = {
                teamId: team.id,
                sport: Sport.BASEBALL,
                season,
                seasonType: SeasonType.REGULAR,
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
                hitsTotal: stats.hitsTotal,
                doubles: stats.doubles,
                triples: stats.triples,
                homeRuns: stats.homeRuns,
                stolenBases: stats.stolenBases,
                caughtStealing: stats.caughtStealing,
                battingAvg: stats.battingAvg,
                onBasePct: stats.onBasePct ?? null,
                sluggingPct: stats.sluggingPct ?? null,
                ops: stats.ops ?? null,
                earnedRuns: stats.runsAllowed,
                hitsAllowed: stats.hitsAllowed ?? 0,
                strikeouts: stats.strikeouts ?? 0,
                walks: stats.walks ?? 0,
                era: stats.era,
                whip: stats.whip ?? null,
                fieldingPct: stats.fieldingPct,
                rpi: stats.rpi ?? null,
                strengthOfSched: stats.strengthOfSched ?? null,
                pythagWins: stats.pythagWins ?? null,
                recentForm: stats.recentForm ?? null,
                injuryImpact: stats.injuryImpact ?? null,
              } satisfies Prisma.TeamSeasonStatUncheckedCreateInput;

              return prisma.teamSeasonStat.upsert({
                where: {
                  teamId_season_seasonType: {
                    teamId: team.id,
                    season,
                    seasonType: SeasonType.REGULAR,
                  },
                },
                update: updateData,
                create: createData,
              });
            },
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
    const standings = await prisma.teamSeasonStat.findMany({
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
  const teams = await prisma.teamSeasonStat.findMany({
    where: { season, seasonType: SeasonType.REGULAR },
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
        prisma.teamSeasonStat.update({
          where: {
            teamId_season_seasonType: {
              teamId: teamStat.teamId,
              season,
              seasonType: SeasonType.REGULAR,
            },
          },
          data: { rpi },
        }),
      `team stats rpi ${teamStat.teamId}`
    );
  }
}

/**
 * Recalculate Strength of Schedule
 */
async function recalculateStrengthOfSchedule(season: number): Promise<void> {
  const teams = await prisma.teamSeasonStat.findMany({
    where: { season, seasonType: SeasonType.REGULAR },
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
        prisma.teamSeasonStat.update({
          where: {
            teamId_season_seasonType: {
              teamId: teamStat.teamId,
              season,
              seasonType: SeasonType.REGULAR,
            },
          },
          data: { strengthOfSched: sos },
        }),
      `team stats sos ${teamStat.teamId}`
    );
  }
}

/**
 * Recalculate Pythagorean Win Expectation
 */
async function recalculatePythagoreanWins(season: number): Promise<void> {
  const teams = await prisma.teamSeasonStat.findMany({
    where: { season, seasonType: SeasonType.REGULAR }
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
          prisma.teamSeasonStat.update({
            where: {
              teamId_season_seasonType: {
                teamId: teamStat.teamId,
                season,
                seasonType: SeasonType.REGULAR,
              },
            },
            data: { pythagWins },
          }),
        `team stats pythag ${teamStat.teamId}`
      );
    }
  }
}
