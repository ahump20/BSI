/**
 * BSI Data Ingest Worker
 *
 * Scheduled worker for sports data ingestion with provider failover.
 *
 * Cron Triggers:
 * - Every 5 minutes: Live games
 * - Hourly (0 min): Team stats refresh
 * - 2am daily: Historical aggregations
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

interface Env {
  CACHE: KVNamespace;
  R2_BUCKET: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
  INGEST_SECRET: string;
  SPORTSDATAIO_KEY?: string;
  ESPN_API_BASE?: string;
  DB: D1Database;
}

interface GameData {
  id: string;
  sport: string;
  division: string;
  season: number;
  scheduledAt: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  venueId?: string;
  currentInning?: number;
  currentInningHalf?: string;
  providerName?: string;
}

interface TeamStats {
  teamId: string;
  season: number;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  winPct: number;
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
        case '*/5 * * * *':
          await ingestLiveGames(env, ctx);
          break;

        case '0 * * * *':
          await ingestTeamStats(env, ctx);
          break;

        case '0 2 * * *':
          await archiveHistoricalData(env, ctx);
          break;

        default:
          console.warn(`[Ingest Worker] Unknown cron schedule: ${cron}`);
      }
    } catch (error) {
      console.error(`[Ingest Worker] Cron execution failed:`, error);

      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['ingest_error', cron],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

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
      return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'bsi-ingest-worker',
        version: '2.0.0'
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
          return Response.json({ message: 'Live games ingestion started' }, { status: 202 });

        case '/ingest/stats':
          ctx.waitUntil(ingestTeamStats(env, ctx));
          return Response.json({ message: 'Team stats ingestion started' }, { status: 202 });

        case '/ingest/archive':
          ctx.waitUntil(archiveHistoricalData(env, ctx));
          return Response.json({ message: 'Historical archival started' }, { status: 202 });

        case '/ingest/ncaa-baseball':
          const games = await request.json() as any[];
          ctx.waitUntil(ingestNCAABaseball(games, env, ctx));
          return Response.json({ message: 'NCAA baseball ingestion started', count: games.length }, { status: 202 });

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error(`[Ingest Worker] Manual trigger failed:`, error);
      return Response.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Ingest live games from ESPN API
 */
async function ingestLiveGames(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting live games ingestion...');

  const espnBase = env.ESPN_API_BASE || 'https://site.api.espn.com/apis/site/v2/sports';
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const season = new Date().getFullYear();

  try {
    // Fetch MLB games
    const mlbUrl = `${espnBase}/baseball/mlb/scoreboard?dates=${today}`;
    const mlbResponse = await fetch(mlbUrl);

    if (!mlbResponse.ok) {
      console.error(`[Ingest] ESPN MLB API error: ${mlbResponse.status}`);
      throw new Error(`ESPN API returned ${mlbResponse.status}`);
    }

    const mlbData = await mlbResponse.json() as any;
    const games: GameData[] = (mlbData.events || []).map((event: any) => ({
      id: event.id,
      sport: 'baseball',
      division: 'MLB',
      season,
      scheduledAt: event.date,
      status: event.status?.type?.name || 'SCHEDULED',
      homeTeamId: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.id || '',
      awayTeamId: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.id || '',
      homeScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'),
      awayScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'),
      venueId: event.competitions?.[0]?.venue?.id,
      providerName: 'ESPN'
    }));

    console.log(`[Ingest] Fetched ${games.length} MLB games`);

    // Cache live games in KV (60s TTL)
    const cacheKey = `live:games:mlb:${today}`;
    await env.CACHE.put(cacheKey, JSON.stringify({
      games,
      fetchedAt: new Date().toISOString(),
      source: 'ESPN'
    }), {
      expirationTtl: 60
    });

    // Track success
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'live_games'],
        doubles: [games.length],
        indexes: [season.toString()]
      });
    }

    console.log(`[Ingest] Cached ${games.length} live games`);
  } catch (error) {
    console.error('[Ingest] Live games ingestion failed:', error);
    throw error;
  }
}

/**
 * Ingest team standings and stats
 */
async function ingestTeamStats(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting team stats ingestion...');

  const espnBase = env.ESPN_API_BASE || 'https://site.api.espn.com/apis/site/v2/sports';
  const season = new Date().getFullYear();

  try {
    // Fetch MLB standings
    const standingsUrl = `${espnBase}/baseball/mlb/standings`;
    const response = await fetch(standingsUrl);

    if (!response.ok) {
      throw new Error(`ESPN standings API returned ${response.status}`);
    }

    const data = await response.json() as any;
    const standings: TeamStats[] = [];

    // Parse standings from ESPN response
    for (const group of (data.children || [])) {
      for (const division of (group.children || [])) {
        for (const team of (division.standings?.entries || [])) {
          const stats = team.stats || [];
          const getStatValue = (name: string) => {
            const stat = stats.find((s: any) => s.name === name);
            return stat?.value ?? 0;
          };

          standings.push({
            teamId: team.team?.id || '',
            season,
            wins: getStatValue('wins'),
            losses: getStatValue('losses'),
            runsScored: getStatValue('pointsFor'),
            runsAllowed: getStatValue('pointsAgainst'),
            winPct: getStatValue('winPercent')
          });
        }
      }
    }

    console.log(`[Ingest] Fetched standings for ${standings.length} teams`);

    // Cache standings in KV (4hr TTL)
    const cacheKey = `standings:mlb:${season}`;
    await env.CACHE.put(cacheKey, JSON.stringify({
      standings,
      fetchedAt: new Date().toISOString(),
      source: 'ESPN'
    }), {
      expirationTtl: 14400
    });

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'team_stats'],
        doubles: [standings.length],
        indexes: [season.toString()]
      });
    }

    console.log(`[Ingest] Cached standings for ${standings.length} teams`);
  } catch (error) {
    console.error('[Ingest] Team stats ingestion failed:', error);
    throw error;
  }
}

/**
 * Archive completed games to R2
 */
async function archiveHistoricalData(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting historical data archival...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  const season = yesterday.getFullYear();

  try {
    // Get yesterday's cached games
    const cacheKey = `live:games:mlb:${dateStr.replace(/-/g, '')}`;
    const cachedData = await env.CACHE.get(cacheKey);

    if (!cachedData) {
      console.log(`[Ingest] No cached data found for ${dateStr}, skipping archive`);
      return;
    }

    const { games } = JSON.parse(cachedData);
    const completedGames = games.filter((g: GameData) =>
      g.status === 'STATUS_FINAL' || g.status === 'FINAL'
    );

    if (completedGames.length === 0) {
      console.log(`[Ingest] No completed games to archive for ${dateStr}`);
      return;
    }

    // Archive to R2
    const archiveKey = `archives/mlb/${season}/${dateStr}.json`;
    const archiveData = {
      date: dateStr,
      season,
      archivedAt: new Date().toISOString(),
      gameCount: completedGames.length,
      games: completedGames
    };

    await env.R2_BUCKET.put(archiveKey, JSON.stringify(archiveData, null, 2), {
      customMetadata: {
        season: season.toString(),
        date: dateStr,
        gameCount: completedGames.length.toString()
      }
    });

    console.log(`[Ingest] Archived ${completedGames.length} games to R2: ${archiveKey}`);

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'historical_archive'],
        doubles: [completedGames.length],
        indexes: [season.toString(), dateStr]
      });
    }
  } catch (error) {
    console.error('[Ingest] Historical archival failed:', error);
    throw error;
  }
}
