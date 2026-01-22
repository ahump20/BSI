/**
 * BSI College Data Sync Worker
 * Scheduled worker for ingesting college sports data with HTTP safety metadata.
 * Uses collegefootballdata.com API for CFB data.
 */

import { validateDataset, getRule } from '../../lib/semantic-validation';
import { createKVSafetyMetadata, wrapWithSafetyMetadata, type KVSafeData } from '../../lib/kv-safety';
import { mapToHTTPStatus, determineLifecycleState } from '../../lib/http-correctness';

/** Environment bindings */
interface Env {
  BSI_CACHE: KVNamespace;
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

/** Cache TTL based on HTTP status */
const CACHE_TTL = {
  ELIGIBLE: 3600,     // 1 hour for valid, cacheable data
  INELIGIBLE: 300,    // 5 minutes for non-cacheable data
} as const;

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
 * Sync a single dataset with safe KV write pattern
 */
async function syncDataset(
  config: DatasetConfig,
  env: Env,
  isFirstIngestion: boolean
): Promise<{ success: boolean; httpStatus: number; reason: string }> {
  const rule = getRule(config.datasetId);

  if (!rule) {
    return {
      success: false,
      httpStatus: 503,
      reason: `No semantic rule for dataset: ${config.datasetId}`,
    };
  }

  const endpoint = config.buildEndpoint();
  const { data: rawData, error } = await fetchFromCFBData<Record<string, unknown>>(endpoint, env.CFB_API_KEY);

  if (error !== null || rawData === null) {
    const failureMeta = createKVSafetyMetadata({
      httpStatusAtWrite: 503,
      lifecycleState: 'unavailable',
      recordCount: 0,
      validationStatus: 'invalid',
      datasetId: config.datasetId,
      expectedMinCount: rule.minRecordCount,
    });

    const failureData = wrapWithSafetyMetadata<Record<string, unknown>>([], failureMeta);

    await env.BSI_CACHE.put(config.cacheKey, JSON.stringify(failureData), {
      expirationTtl: CACHE_TTL.INELIGIBLE,
    });

    return {
      success: false,
      httpStatus: 503,
      reason: error ?? 'Unknown error',
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

  // Validate the transformed data
  const validation = validateDataset(config.datasetId, transformedData);

  // Determine lifecycle state
  const lifecycle = determineLifecycleState(validation, transformedData.length > 0, isFirstIngestion);

  // Map to HTTP status
  const httpResult = mapToHTTPStatus({
    validationResult: validation,
    lifecycleState: lifecycle,
    recordCount: transformedData.length,
    rule,
  });

  // Create safety metadata
  const meta = createKVSafetyMetadata({
    httpStatusAtWrite: httpResult.httpStatus,
    lifecycleState: lifecycle,
    recordCount: transformedData.length,
    validationStatus: validation.status,
    datasetId: config.datasetId,
    expectedMinCount: rule.minRecordCount,
  });

  // Wrap and write to KV
  const safeData: KVSafeData<Record<string, unknown>> = wrapWithSafetyMetadata(transformedData, meta);

  await env.BSI_CACHE.put(config.cacheKey, JSON.stringify(safeData), {
    expirationTtl: httpResult.cacheEligible ? CACHE_TTL.ELIGIBLE : CACHE_TTL.INELIGIBLE,
  });

  return {
    success: httpResult.httpStatus === 200,
    httpStatus: httpResult.httpStatus,
    reason: httpResult.reason,
  };
}

/**
 * Check if this is the first ingestion for a dataset
 */
async function checkFirstIngestion(cacheKey: string, kv: KVNamespace): Promise<boolean> {
  const existing = await kv.get(cacheKey);
  return existing === null;
}

/**
 * Scheduled handler - runs on cron trigger
 */
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const results: Array<{ dataset: string; success: boolean; httpStatus: number; reason: string }> = [];

    for (const config of DATASETS) {
      const isFirstIngestion = await checkFirstIngestion(config.cacheKey, env.BSI_CACHE);
      const result = await syncDataset(config, env, isFirstIngestion);

      results.push({
        dataset: config.datasetId,
        ...result,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(`College data sync complete: ${successCount} succeeded, ${failCount} failed`);

    for (const r of results) {
      if (!r.success) {
        console.error(`  ${r.dataset}: HTTP ${r.httpStatus} - ${r.reason}`);
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

      const results: Array<{ dataset: string; success: boolean; httpStatus: number; reason: string }> = [];

      for (const config of DATASETS) {
        const isFirstIngestion = await checkFirstIngestion(config.cacheKey, env.BSI_CACHE);
        const result = await syncDataset(config, env, isFirstIngestion);

        results.push({
          dataset: config.datasetId,
          ...result,
        });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
