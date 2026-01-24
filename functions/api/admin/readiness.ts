/**
 * BSI Admin Readiness Endpoint
 * Exposes readiness state for monitoring and client branching.
 *
 * GET /api/admin/readiness         - All scopes
 * GET /api/admin/readiness?scope=X - Single scope
 */

import {
  getSystemReadiness,
  getScopeReadiness,
  type ReadinessRecord,
  type ReadinessState,
} from '../../../lib/readiness';
import {
  getAllCurrentVersions,
  getDatasetsServingLKG,
  type DatasetCurrentVersion,
} from '../../../lib/dataset-commit';

interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

interface ReadinessSummary {
  total: number;
  ready: number;
  initializing: number;
  degraded: number;
  unavailable: number;
  readinessScore: number;
  servingLKG: number;
}

/** Extended dataset info with version and LKG status */
interface DatasetWithVersionInfo {
  scope: string;
  readinessState: ReadinessState;
  lastTransitionAt: string;
  reason: string | null;
  snapshotValidatedAt: string | null;
  liveIngestionAt: string | null;
  isServingLKG: boolean;
  lkgVersion: number | null;
  lkgReason: string | null;
  currentVersion: number | null;
  lastCommittedAt: string | null;
}

interface ReadinessResponse {
  system: ReadinessRecord | null;
  datasets: DatasetWithVersionInfo[];
  summary: ReadinessSummary;
  timestamp: string;
}

function calculateSummary(records: ReadinessRecord[], lkgCount: number): ReadinessSummary {
  const counts: Record<ReadinessState, number> = {
    ready: 0,
    initializing: 0,
    degraded: 0,
    unavailable: 0,
  };

  for (const record of records) {
    counts[record.readinessState]++;
  }

  const total = records.length;
  const readinessScore = total > 0 ? Math.round((counts.ready / total) * 100) : 0;

  return {
    total,
    ready: counts.ready,
    initializing: counts.initializing,
    degraded: counts.degraded,
    unavailable: counts.unavailable,
    readinessScore,
    servingLKG: lkgCount,
  };
}

/** Merge readiness records with version info */
function mergeWithVersionInfo(
  readinessRecords: ReadinessRecord[],
  versionRecords: DatasetCurrentVersion[]
): DatasetWithVersionInfo[] {
  const versionMap = new Map<string, DatasetCurrentVersion>();
  for (const v of versionRecords) {
    versionMap.set(v.datasetId, v);
  }

  return readinessRecords.map((r) => {
    const version = versionMap.get(r.scope);
    return {
      scope: r.scope,
      readinessState: r.readinessState,
      lastTransitionAt: r.lastTransitionAt,
      reason: r.reason,
      snapshotValidatedAt: r.snapshotValidatedAt,
      liveIngestionAt: r.liveIngestionAt,
      isServingLKG: version?.isServingLKG ?? false,
      lkgVersion: version?.isServingLKG ? version.lastCommittedVersion : null,
      lkgReason: version?.lkgReason ?? null,
      currentVersion: version?.currentVersion ?? null,
      lastCommittedAt: version?.lastCommittedAt ?? null,
    };
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const scopeParam = url.searchParams.get('scope');

  try {
    // Single scope query
    if (scopeParam) {
      const record = await getScopeReadiness(env.DB, scopeParam);

      if (!record) {
        return new Response(
          JSON.stringify({
            error: 'Scope not found',
            scope: scopeParam,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 404,
            headers: corsHeaders,
          }
        );
      }

      return new Response(
        JSON.stringify({
          ...record,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    // All scopes query
    const [allRecords, versionRecords, lkgRecords] = await Promise.all([
      getSystemReadiness(env.DB),
      getAllCurrentVersions(env.DB),
      getDatasetsServingLKG(env.DB),
    ]);

    // Separate system scope from dataset scopes
    const systemRecord = allRecords.find((r) => r.scope === 'system') ?? null;
    const datasetRecords = allRecords.filter((r) => r.scope !== 'system');

    // Merge readiness with version info
    const datasetsWithVersion = mergeWithVersionInfo(datasetRecords, versionRecords);

    const response: ReadinessResponse = {
      system: systemRecord,
      datasets: datasetsWithVersion,
      summary: calculateSummary(allRecords, lkgRecords.length),
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch readiness state',
        message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
