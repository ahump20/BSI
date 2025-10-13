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

import { PrismaClient } from '@prisma/client';
import { ProviderManager } from '../../lib/adapters/provider-manager';
import type { Env } from './types';

const prisma = new PrismaClient();

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

    // Batch upsert games
    const upsertPromises = games.map(game => {
      return prisma.game.upsert({
        where: { externalId: game.id },
        update: {
          status: game.status,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          currentInning: game.currentInning,
          currentInningHalf: game.currentInningHalf,
          balls: game.balls,
          strikes: game.strikes,
          outs: game.outs,
          lastUpdated: new Date()
        },
        create: {
          externalId: game.id,
          sport: 'BASEBALL',
          division: 'D1',
          season,
          seasonType: 'REGULAR',
          scheduledAt: new Date(game.scheduledAt),
          status: game.status,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          venueId: game.venueId,
          currentInning: game.currentInning,
          currentInningHalf: game.currentInningHalf,
          balls: game.balls,
          strikes: game.strikes,
          outs: game.outs,
          providerName: game.providerName,
          feedPrecision: game.feedPrecision
        }
      });
    });

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
          return prisma.teamStats.upsert({
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
              battingAvg: stats.battingAvg,
              era: stats.era,
              fieldingPct: stats.fieldingPct,
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
              battingAvg: stats.battingAvg,
              era: stats.era,
              fieldingPct: stats.fieldingPct,
              rpi: stats.rpi,
              strengthOfSched: stats.strengthOfSched,
              pythagWins: stats.pythagWins
            }
          });
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
      await prisma.game.updateMany({
        where: {
          id: { in: completedGames.map(g => g.id) }
        },
        data: {
          archived: true,
          archivedAt: new Date()
        }
      });

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

    await prisma.teamStats.update({
      where: {
        teamId_season: {
          teamId: teamStat.teamId,
          season
        }
      },
      data: { rpi }
    });
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

    await prisma.teamStats.update({
      where: {
        teamId_season: {
          teamId: teamStat.teamId,
          season
        }
      },
      data: { strengthOfSched: sos }
    });
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

      await prisma.teamStats.update({
        where: {
          teamId_season: {
            teamId: teamStat.teamId,
            season
          }
        },
        data: { pythagWins }
      });
    }
  }
}
