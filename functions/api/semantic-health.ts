/**
 * Semantic Health Dashboard Endpoint
 * GET /api/semantic-health
 *
 * Returns validation status for all defined datasets.
 * Called by truth-state.js to display data integrity status in the UI.
 *
 * Response shape (matches what BSITruthState.fetchHealth expects):
 * {
 *   overallStatus: 'truth' | 'partial' | 'failure',
 *   truthScore: number (0-100),
 *   datasets: DatasetHealth[],
 *   checkedAt: string
 * }
 */

import {
  SEMANTIC_RULES,
  validateDataset,
  isWithinSeason,
  type DatasetStatus as BaseDatasetStatus,
  type SemanticRule,
} from '../../lib/semantic-validation';

// Extended status that includes 'unavailable' for this endpoint
type DatasetStatus = BaseDatasetStatus | 'unavailable';

interface Env {
  CACHE?: KVNamespace;
  KV?: KVNamespace;
  KV_CACHE?: KVNamespace;
  DB?: D1Database;
}

interface KVNamespace {
  get(key: string, options?: { type?: 'json' | 'text' }): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

interface CachedData {
  data: unknown[];
  fetchedAt?: string;
  recordCount?: number;
}

interface DatasetHealth {
  datasetId: string;
  description: string;
  sport: string;
  expectedMin: number;
  actualCount: number;
  inSeason: boolean;
  status: DatasetStatus;
  lastValidated: string | null;
  lastFailureReason: string | null;
  source: 'kv' | 'd1' | 'unavailable';
}

interface HealthResponse {
  overallStatus: 'truth' | 'partial' | 'failure';
  truthScore: number;
  datasets: DatasetHealth[];
  checkedAt: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json',
};

// D1 table mappings for datasets stored in database
const D1_DATASET_QUERIES: Record<string, string> = {
  'cbb-rankings-d1': 'SELECT COUNT(*) as count FROM college_baseball_rankings WHERE season = ?',
  'cbb-teams': 'SELECT COUNT(*) as count FROM college_baseball_teams',
  'cfb-rankings-ap':
    'SELECT COUNT(*) as count FROM college_football_rankings WHERE source = ? AND season = ?',
};

async function checkD1Dataset(
  db: D1Database,
  datasetId: string,
  _rule: SemanticRule
): Promise<{ count: number; source: 'd1' | 'unavailable'; error: string | null }> {
  try {
    const currentYear = new Date().getFullYear();

    switch (datasetId) {
      case 'cbb-rankings-d1': {
        const result = await db
          .prepare('SELECT COUNT(*) as count FROM college_baseball_rankings WHERE season = ?')
          .bind(currentYear)
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      case 'cbb-teams': {
        const result = await db
          .prepare('SELECT COUNT(*) as count FROM college_baseball_teams')
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      case 'cfb-rankings-ap': {
        const result = await db
          .prepare(
            'SELECT COUNT(*) as count FROM college_football_rankings WHERE source = ? AND season = ?'
          )
          .bind('ap', currentYear)
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      case 'cfb-rankings-cfp': {
        const result = await db
          .prepare(
            'SELECT COUNT(*) as count FROM college_football_rankings WHERE source = ? AND season = ?'
          )
          .bind('cfp', currentYear)
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      case 'cfb-rankings-coaches': {
        const result = await db
          .prepare(
            'SELECT COUNT(*) as count FROM college_football_rankings WHERE source = ? AND season = ?'
          )
          .bind('coaches', currentYear)
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      case 'cfb-teams': {
        const result = await db
          .prepare('SELECT COUNT(*) as count FROM college_football_teams')
          .first<{ count: number }>();
        return { count: result?.count || 0, source: 'd1', error: null };
      }
      default:
        return { count: 0, source: 'unavailable', error: 'No D1 mapping for dataset' };
    }
  } catch (e) {
    return {
      count: 0,
      source: 'unavailable',
      error: e instanceof Error ? e.message : 'D1 query failed',
    };
  }
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;

  const kv = env.CACHE || env.KV || env.KV_CACHE;
  const db = env.DB;

  const datasets: DatasetHealth[] = [];

  // Check each defined dataset
  for (const [datasetId, rule] of SEMANTIC_RULES.entries()) {
    let actualCount = 0;
    let status: DatasetStatus = 'unavailable';
    let lastValidated: string | null = null;
    let lastFailureReason: string | null = null;
    let source: 'kv' | 'd1' | 'unavailable' = 'unavailable';

    // College sports data is stored in D1
    const isCollegeData = datasetId.startsWith('cbb-') || datasetId.startsWith('cfb-');

    if (isCollegeData && db) {
      // Check D1 database for college data
      const d1Result = await checkD1Dataset(db, datasetId, rule);
      actualCount = d1Result.count;
      source = d1Result.source;

      if (d1Result.error) {
        lastFailureReason = d1Result.error;
      } else if (actualCount >= rule.minRecordCount) {
        status = 'valid';
        lastValidated = new Date().toISOString();
      } else if (actualCount > 0) {
        status = 'invalid';
        lastFailureReason = `Insufficient data: ${actualCount}/${rule.minRecordCount} records`;
      } else {
        status = 'unavailable';
        lastFailureReason = 'No data in D1 database';
      }
    } else if (kv) {
      // Check KV for other datasets
      const cacheKey = `data:${datasetId}`;
      try {
        const cached = (await kv.get(cacheKey, { type: 'json' })) as CachedData | null;

        if (cached?.data) {
          actualCount = Array.isArray(cached.data) ? cached.data.length : 0;
          const records = Array.isArray(cached.data) ? cached.data : [];
          const validation = validateDataset(datasetId, records as Record<string, unknown>[]);
          status = validation.status === 'empty' ? 'unavailable' : validation.status;
          source = 'kv';
          lastValidated = cached.fetchedAt || new Date().toISOString();

          if (status !== 'valid' && validation.errors.length > 0) {
            lastFailureReason = validation.errors.join('; ');
          }
        } else {
          lastFailureReason = 'No data in KV cache';
        }
      } catch (e) {
        status = 'invalid';
        lastFailureReason = e instanceof Error ? e.message : 'Unknown error reading cache';
      }
    } else {
      lastFailureReason = 'No storage binding available';
    }

    // Extract sport from datasetId (e.g., 'cbb-games-live' -> 'cbb')
    const sport = datasetId.split('-')[0] || 'unknown';

    datasets.push({
      datasetId,
      description: rule.description,
      sport,
      expectedMin: rule.minRecordCount,
      actualCount,
      inSeason: rule.seasonMonths ? isWithinSeason(rule.seasonMonths) : true,
      status,
      lastValidated,
      lastFailureReason,
      source,
    });
  }

  // Calculate truth score
  const validCount = datasets.filter((d) => d.status === 'valid').length;
  const totalCount = datasets.length;
  const truthScore = totalCount > 0 ? Math.round((validCount / totalCount) * 100) : 0;

  // Determine overall status
  let overallStatus: 'truth' | 'partial' | 'failure' = 'failure';
  if (truthScore === 100) {
    overallStatus = 'truth';
  } else if (truthScore >= 70) {
    overallStatus = 'partial';
  }

  const response: HealthResponse = {
    overallStatus,
    truthScore,
    datasets,
    checkedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Truth-Score': String(truthScore),
      'X-Overall-Status': overallStatus,
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}
