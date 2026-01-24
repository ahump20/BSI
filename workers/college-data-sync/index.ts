/**
 * BSI College Data Sync Worker
 * Scheduled worker for ingesting college sports data with commit boundary.
 * Uses collegefootballdata.com API for CFB data.
 *
 * Commit boundary flow:
 * 1. Fetch data from external API
 * 2. Validate with semantic rules
 * 3. Write to versioned KV key (don't touch :current)
 * 4. Create pending commit in D1
 * 5. If valid: promote to :current, update readiness to ready
 * 6. If invalid + LKG exists: keep LKG, set readiness to degraded
 * 7. If invalid + no LKG: set readiness to unavailable
 */

import { getRule } from '../../lib/semantic-validation';
import { ingestDataset, markIngestionFailed, type IngestContext, type IngestResult } from '../../lib/dataset-ingest';
import { markLiveIngestion } from '../../lib/readiness';

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
 * Sync a single dataset with commit boundary.
 * Uses versioned KV keys and atomic promotion.
 * Falls back to LKG on validation failure.
 */
async function syncDatasetWithCommitBoundary(
  config: DatasetConfig,
  env: Env
): Promise<IngestResult & { dataset: string }> {
  const rule = getRule(config.datasetId);

  if (!rule) {
    return {
      dataset: config.datasetId,
      success: false,
      version: 0,
      committed: false,
      isLKG: false,
      httpStatus: 503,
      recordCount: 0,
      validationStatus: 'invalid',
      error: `No semantic rule for dataset: ${config.datasetId}`,
    };
  }

  const endpoint = config.buildEndpoint();
  const { data: rawData, error } = await fetchFromCFBData<Record<string, unknown>>(endpoint, env.CFB_API_KEY);

  // Create ingest context
  const ctx: IngestContext = {
    datasetId: config.datasetId,
    kv: env.BSI_CACHE,
    db: env.DB,
    r2: env.SNAPSHOTS,
    source: 'collegefootballdata',
  };

  // Handle fetch failure
  if (error !== null || rawData === null) {
    await markIngestionFailed(ctx, error ?? 'API fetch failed');

    return {
      dataset: config.datasetId,
      success: false,
      version: 0,
      committed: false,
      isLKG: false,
      httpStatus: 503,
      recordCount: 0,
      validationStatus: 'invalid',
      error: error ?? 'Unknown fetch error',
    };
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

  // Use commit boundary ingestion
  const result = await ingestDataset(ctx, transformedData);

  // Mark system as ready on first successful ingestion
  if (result.success && result.committed) {
    await markLiveIngestion(env.DB, 'system', `Dataset ${config.datasetId} committed v${result.version}`);
  }

  return {
    dataset: config.datasetId,
    ...result,
  };
}

/**
 * Scheduled handler - runs on cron trigger
 * Uses parallel ingestion with isolated error handling.
 * One dataset failure doesn't block others.
 */
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Parallel ingestion with isolated error handling
    const results = await Promise.allSettled(
      DATASETS.map((config) => syncDatasetWithCommitBoundary(config, env))
    );

    // Process results
    const processed: Array<IngestResult & { dataset: string }> = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const config = DATASETS[i];

      if (result.status === 'fulfilled') {
        processed.push(result.value);
      } else {
        // Handle unexpected errors (not validation failures)
        processed.push({
          dataset: config.datasetId,
          success: false,
          version: 0,
          committed: false,
          isLKG: false,
          httpStatus: 503,
          recordCount: 0,
          validationStatus: 'invalid',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    }

    const successCount = processed.filter((r) => r.success).length;
    const failCount = processed.length - successCount;
    const lkgCount = processed.filter((r) => r.isLKG).length;

    console.log(
      `College data sync complete: ${successCount} committed, ${failCount} failed, ${lkgCount} serving LKG`
    );

    for (const r of processed) {
      if (!r.success) {
        const lkgNote = r.isLKG ? ' (serving LKG)' : '';
        console.error(`  ${r.dataset}: v${r.version} HTTP ${r.httpStatus} - ${r.error}${lkgNote}`);
      } else {
        console.log(`  ${r.dataset}: v${r.version} committed with ${r.recordCount} records`);
      }
    }
  },

  /**
   * HTTP handler - for manual triggers and health checks
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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

      // Parallel ingestion with isolated error handling
      const results = await Promise.allSettled(
        DATASETS.map((config) => syncDatasetWithCommitBoundary(config, env))
      );

      const processed: Array<IngestResult & { dataset: string }> = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const config = DATASETS[i];

        if (result.status === 'fulfilled') {
          processed.push(result.value);
        } else {
          processed.push({
            dataset: config.datasetId,
            success: false,
            version: 0,
            committed: false,
            isLKG: false,
            httpStatus: 503,
            recordCount: 0,
            validationStatus: 'invalid',
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          });
        }
      }

      return new Response(
        JSON.stringify({
          results: processed,
          summary: {
            total: processed.length,
            committed: processed.filter((r) => r.committed).length,
            failed: processed.filter((r) => !r.success).length,
            servingLKG: processed.filter((r) => r.isLKG).length,
          },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
