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

import { Prisma, PrismaClient } from '@prisma/client';
import { ProviderManager } from '../../lib/adapters/provider-manager';
import type { Env, ProviderGame } from './types';
import {
  ensureWatchlistSchema,
  loadWatchlistEntriesForTeams,
} from '../../db/watchlist/index.js';

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

    // Batch upsert games
    const upsertPromises = games.map((game) =>
      executeWithConstraintGuard(
        () =>
          prisma.game.upsert({
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
          }),
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

    ctx.waitUntil(processWatchlistAlerts(games, env));

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

interface WatchlistNotificationState {
  lastLeadDiff?: number;
  walkoffNotified?: boolean;
  upsetNotified?: boolean;
  baselineWinProb?: number;
}

interface WatchlistAlertPayload {
  type: 'lead-change' | 'walk-off' | 'upset-odds';
  userId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  gameId: string;
  score: { team: number; opponent: number };
  winProbability?: number | null;
  message: string;
  timestamp: string;
}

async function processWatchlistAlerts(games: ProviderGame[], env: Env): Promise<void> {
  if (!games.length) {
    return;
  }

  const teamIds = Array.from(
    new Set(
      games.flatMap((game) => [game.homeTeamId, game.awayTeamId]).filter((value): value is string => Boolean(value))
    )
  );

  if (teamIds.length === 0) {
    return;
  }

  await ensureWatchlistSchema(prisma);
  const watchlistEntries = await loadWatchlistEntriesForTeams(teamIds, prisma);

  if (watchlistEntries.length === 0) {
    return;
  }

  const externalIds = games.map((game) => game.id);
  const dbGames = await prisma.game.findMany({
    where: {
      OR: [
        { externalId: { in: externalIds } },
        { id: { in: externalIds } },
      ],
    },
    include: {
      homeTeam: {
        select: { id: true, name: true, slug: true },
      },
      awayTeam: {
        select: { id: true, name: true, slug: true },
      },
      events: {
        orderBy: { sequence: 'desc' },
        take: 1,
        select: {
          id: true,
          description: true,
          eventType: true,
          inning: true,
          inningHalf: true,
          homeWinProb: true,
        },
      },
    },
  });

  const gameLookup = new Map<string, typeof dbGames[number]>();
  for (const game of dbGames) {
    if (game.externalId) {
      gameLookup.set(game.externalId, game);
    }
    gameLookup.set(game.id, game);
  }

  for (const entry of watchlistEntries) {
    const relevantGames = games.filter(
      (game) => game.homeTeamId === entry.teamId || game.awayTeamId === entry.teamId
    );

    for (const providerGame of relevantGames) {
      const dbGame = gameLookup.get(providerGame.id);
      if (!dbGame) continue;

      const teamIsHome = dbGame.homeTeamId === entry.teamId;
      const teamScore = (teamIsHome ? dbGame.homeScore : dbGame.awayScore) ?? 0;
      const opponentScore = (teamIsHome ? dbGame.awayScore : dbGame.homeScore) ?? 0;
      const scoreDiff = teamScore - opponentScore;
      const latestEvent = dbGame.events[0];
      const homeWinProb = latestEvent?.homeWinProb ?? null;
      const teamWinProb = homeWinProb === null ? null : teamIsHome ? homeWinProb : 1 - homeWinProb;

      const stateKey = `watchlist:state:${entry.userId}:${dbGame.id}`;
      const existingStateRaw = await env.CACHE.get(stateKey);
      const previousState: WatchlistNotificationState = existingStateRaw
        ? JSON.parse(existingStateRaw)
        : {};

      const nextState: WatchlistNotificationState = { ...previousState };
      if (teamWinProb !== null) {
        if (previousState.baselineWinProb === undefined) {
          nextState.baselineWinProb = teamWinProb;
        } else {
          nextState.baselineWinProb = Math.min(previousState.baselineWinProb, teamWinProb);
        }
      }

      const opponentName = teamIsHome ? dbGame.awayTeam.name : dbGame.homeTeam.name;
      const notifications: Array<WatchlistAlertPayload> = [];

      if (entry.alertLeadChanges) {
        const previousDiff = previousState.lastLeadDiff ?? 0;
        const changed = Math.sign(previousDiff) !== Math.sign(scoreDiff) && scoreDiff !== 0;
        if (changed) {
          notifications.push({
            type: 'lead-change',
            userId: entry.userId,
            teamId: entry.teamId,
            teamName: entry.teamName,
            opponentName,
            gameId: dbGame.id,
            score: { team: teamScore, opponent: opponentScore },
            winProbability: teamWinProb,
            message: `${entry.teamName} just took the lead ${teamScore}-${opponentScore} over ${opponentName}.`,
            timestamp: new Date().toISOString(),
          });
        }
        nextState.lastLeadDiff = scoreDiff;
      }

      if (entry.alertWalkOffs && dbGame.status === 'FINAL') {
        const description = latestEvent?.description?.toLowerCase() ?? '';
        const eventType = latestEvent?.eventType?.toLowerCase() ?? '';
        const looksLikeWalkoff = description.includes('walk-off') || eventType.includes('walk');
        if (teamIsHome && looksLikeWalkoff && !previousState.walkoffNotified) {
          notifications.push({
            type: 'walk-off',
            userId: entry.userId,
            teamId: entry.teamId,
            teamName: entry.teamName,
            opponentName,
            gameId: dbGame.id,
            score: { team: teamScore, opponent: opponentScore },
            winProbability: teamWinProb,
            message: `${entry.teamName} walked off ${opponentName} ${teamScore}-${opponentScore}.`,
            timestamp: new Date().toISOString(),
          });
          nextState.walkoffNotified = true;
        }
      }

      if (entry.alertUpsetOdds && teamWinProb !== null && nextState.baselineWinProb !== undefined) {
        const baseline = nextState.baselineWinProb;
        const isUnderdog = baseline <= 0.4;
        const crossedThreshold = teamWinProb >= 0.65;
        if (isUnderdog && crossedThreshold && !previousState.upsetNotified) {
          notifications.push({
            type: 'upset-odds',
            userId: entry.userId,
            teamId: entry.teamId,
            teamName: entry.teamName,
            opponentName,
            gameId: dbGame.id,
            score: { team: teamScore, opponent: opponentScore },
            winProbability: teamWinProb,
            message: `${entry.teamName} now has ${Math.round(teamWinProb * 100)}% win odds against ${opponentName}.`,
            timestamp: new Date().toISOString(),
          });
          nextState.upsetNotified = true;
        }
      }

      if (notifications.length > 0) {
        await Promise.all(notifications.map((payload) => dispatchWatchlistNotification(env, payload)));
      }

      await env.CACHE.put(stateKey, JSON.stringify(nextState), { expirationTtl: 3600 });
    }
  }
}

async function dispatchWatchlistNotification(env: Env, payload: WatchlistAlertPayload): Promise<void> {
  if (env.NOTIFICATION_WEBHOOK) {
    try {
      await fetch(env.NOTIFICATION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return;
    } catch (error) {
      console.error('[Watchlist Alerts] Failed to dispatch webhook notification', error);
    }
  }

  console.log('[Watchlist Alerts]', payload.type, payload.message, {
    userId: payload.userId,
    teamId: payload.teamId,
    gameId: payload.gameId,
  });
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
