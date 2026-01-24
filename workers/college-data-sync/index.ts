/**
 * BSI College Data Sync Worker
 * Scheduled worker for ingesting college sports data with dataset-level commit boundaries.
 * Uses collegefootballdata.com API for CFB data.
 *
 * Each dataset ingests independently with LKG (Last Known Good) guarantees:
 * - Failures don't invalidate existing KV data
 * - Versioned KV keys with atomic pointer swap
 * - D1 commit records track version history
 */

import { orchestrateIngestion, type CommitResult } from '../../lib/dataset-commit';
import { handleHealthRequest } from '../../lib/admin-health';

/** Environment bindings */
interface Env {
  BSI_CACHE: KVNamespace;
  DB: D1Database;
  SNAPSHOTS: R2Bucket;
  CFB_API_KEY: string;
}

/** CollegeFootballData.com API */
const CFB_API = 'https://api.collegefootballdata.com';

/** Get current year (fallback to 2024 if no data for current year) */
function getCurrentYear(): number {
  // Use 2024 for testing since 2026 season hasn't started
  const actualYear = new Date().getFullYear();
  return actualYear >= 2026 ? 2024 : actualYear;
}

/** Get current week of CFB season (approximate) */
function getCurrentWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24); // ~Aug 24
  const diffMs = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(15, diffWeeks + 1));
}

/** Dataset configuration with dynamic endpoint builder */
interface DatasetConfig {
  datasetId: string;
  buildEndpoint: () => string;
  cacheKey: string;
}

/** Datasets to sync */
const DATASETS: DatasetConfig[] = [
  {
    datasetId: 'cfb-rankings-ap',
    buildEndpoint: () => `/rankings?year=${getCurrentYear()}&seasonType=regular`,
    cacheKey: 'cfb:rankings:ap',
  },
  {
    datasetId: 'cfb-rankings-coaches',
    buildEndpoint: () => `/rankings?year=${getCurrentYear()}&seasonType=regular`,
    cacheKey: 'cfb:rankings:coaches',
  },
  {
    datasetId: 'cfb-games-live',
    buildEndpoint: () => `/games?year=${getCurrentYear()}&week=${getCurrentWeek()}&seasonType=regular`,
    cacheKey: 'cfb:games:live',
  },
];

/** Cache TTL for committed data */
const CACHE_TTL = 3600; // 1 hour

/**
 * Fetch data from CollegeFootballData API
 */
async function fetchFromCFBData<T>(
  endpoint: string,
  apiKey: string
): Promise<{ data: T[] | null; error: string | null }> {
  try {
    const response = await fetch(`${CFB_API}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        data: null,
        error: `API returned ${response.status}: ${response.statusText}`,
      };
    }

    const json = await response.json();

    // CFB API returns arrays directly
    if (Array.isArray(json)) {
      return { data: json as T[], error: null };
    }

    // Handle wrapped response
    if (json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)) {
      return { data: json.data as T[], error: null };
    }

    return { data: [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown fetch error',
    };
  }
}

/** Transform rankings response to match our schema */
function transformRankings(
  rawData: Array<{ season: number; week: number; polls: Array<{ poll: string; ranks: Array<{ rank: number; school: string; conference: string; points: number }> }> }>,
  pollFilter: 'AP Top 25' | 'Coaches Poll'
): Array<{ rank: number; team: string; record: string; conference: string }> {
  const latestWeek = rawData.reduce((max, item) => Math.max(max, item.week), 0);
  const latestData = rawData.find(r => r.week === latestWeek);

  if (!latestData) return [];

  const poll = latestData.polls.find(p => p.poll === pollFilter);
  if (!poll) return [];

  return poll.ranks.map(r => ({
    rank: r.rank,
    team: r.school,
    record: '', // CFB API doesn't include record in rankings
    conference: r.conference || '',
  }));
}

/** Transform games response to match our schema */
function transformGames(
  rawData: Array<{ id: number; homeTeam: string; awayTeam: string; completed: boolean; homePoints: number | null; awayPoints: number | null }>
): Array<{ gameId: string; homeTeam: string; awayTeam: string; status: string }> {
  return rawData.map(g => ({
    gameId: String(g.id),
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    status: g.completed ? 'final' : (g.homePoints !== null ? 'live' : 'scheduled'),
  }));
}

/**
 * Sync a single dataset with commit boundaries.
 * Uses orchestrateIngestion for LKG-safe ingestion.
 * Failures don't invalidate existing KV data.
 */
async function syncDataset(
  config: DatasetConfig,
  env: Env
): Promise<CommitResult> {
  // Create fetcher that transforms data for this specific dataset
  const fetcher = async (): Promise<{ data: Record<string, unknown>[] | null; error: string | null }> => {
    const endpoint = config.buildEndpoint();
    const { data: rawData, error } = await fetchFromCFBData<Record<string, unknown>>(endpoint, env.CFB_API_KEY);

    if (error !== null || rawData === null) {
      return { data: null, error: error ?? 'Fetch returned null' };
    }

    // Transform data based on dataset type
    let transformedData: Record<string, unknown>[];

    if (config.datasetId === 'cfb-rankings-ap') {
      transformedData = transformRankings(rawData as never, 'AP Top 25');
    } else if (config.datasetId === 'cfb-rankings-coaches') {
      transformedData = transformRankings(rawData as never, 'Coaches Poll');
    } else if (config.datasetId === 'cfb-games-live') {
      transformedData = transformGames(rawData as never);
    } else {
      transformedData = rawData;
    }

    return { data: transformedData, error: null };
  };

  // Orchestrate full ingestion with commit boundaries
  return orchestrateIngestion(fetcher, {
    datasetId: config.datasetId,
    cacheKeyPrefix: config.cacheKey,
    db: env.DB,
    kv: env.BSI_CACHE,
    r2: env.SNAPSHOTS,
    cacheTtl: CACHE_TTL,
  });
}

/**
 * Scheduled handler - runs on cron trigger.
 * Each dataset syncs independently - failures in one don't affect others.
 */
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const results: CommitResult[] = [];

    // Sync each dataset independently - failure isolation
    for (const config of DATASETS) {
      const result = await syncDataset(config, env);
      results.push(result);

      // Log per-dataset result
      if (result.success) {
        console.log(`${config.datasetId}: committed v${result.version} (${result.recordCount} records)`);
      } else if (result.isServingLKG) {
        console.warn(`${config.datasetId}: failed, serving LKG v${result.version} - ${result.reason}`);
      } else {
        console.error(`${config.datasetId}: failed, no LKG available - ${result.reason}`);
      }
    }

    const committed = results.filter(r => r.committed).length;
    const servingLKG = results.filter(r => r.isServingLKG).length;
    const unavailable = results.filter(r => !r.success && !r.isServingLKG).length;

    console.log(`College data sync complete: ${committed} committed, ${servingLKG} serving LKG, ${unavailable} unavailable`);
  },

  /**
   * HTTP handler - for manual triggers, health checks, and admin endpoints
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Admin health endpoints
    if (url.pathname.startsWith('/admin/health')) {
      return handleHealthRequest(request, env.DB);
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'college-data-sync' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/sync') {
      const authHeader = request.headers.get('Authorization');

      if (authHeader !== `Bearer ${env.CFB_API_KEY}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const results: CommitResult[] = [];

      for (const config of DATASETS) {
        const result = await syncDataset(config, env);
        results.push({ ...result, datasetId: config.datasetId } as CommitResult & { datasetId: string });
      }

      const committed = results.filter(r => r.committed).length;
      const servingLKG = results.filter(r => r.isServingLKG).length;

      return new Response(JSON.stringify({
        summary: {
          committed,
          servingLKG,
          total: results.length,
        },
        results,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
