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
}

interface ReadinessResponse {
  system: ReadinessRecord | null;
  datasets: ReadinessRecord[];
  summary: ReadinessSummary;
  timestamp: string;
}

function calculateSummary(records: ReadinessRecord[]): ReadinessSummary {
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
  };
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
    const allRecords = await getSystemReadiness(env.DB);

    // Separate system scope from dataset scopes
    const systemRecord = allRecords.find((r) => r.scope === 'system') ?? null;
    const datasetRecords = allRecords.filter((r) => r.scope !== 'system');

    const response: ReadinessResponse = {
      system: systemRecord,
      datasets: datasetRecords,
      summary: calculateSummary(allRecords),
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
