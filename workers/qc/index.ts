/**
 * Sports Data QC Worker - Production Deployment
 *
 * Cloudflare Worker for validating sports data quality before D1 ingestion.
 * Provides both HTTP API and scheduled batch processing.
 *
 * Endpoints:
 * - POST /qc/validate - Real-time validation API
 * - GET /qc/report/:id - Retrieve QC report
 * - GET /qc/reports - List recent reports
 * - GET /health - Health check
 *
 * Scheduled Jobs:
 * - 0 3 * * * : Daily batch QC at 3am UTC
 *
 * Deploy: wrangler deploy
 */

import { runQCPipeline, runQCPipelineBatch } from '../../lib/skills/sports-data-qc/scripts/qc_analysis';
import {
  saveReportToKV,
  getReportFromKV,
  listRecentReports,
  formatReportJSON,
  formatReportMarkdown,
  formatReportHTML,
  formatReportConsole
} from '../../lib/skills/sports-data-qc/scripts/qc_reporting';
import type { GameData, PlayerStats, SimulationResults } from '../../lib/skills/sports-data-qc/scripts/qc_core';

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

interface Env {
  // Cloudflare KV for QC report storage
  CACHE: KVNamespace;

  // R2 for long-term report archival
  R2_BUCKET: R2Bucket;

  // Analytics Engine
  ANALYTICS?: AnalyticsEngineDataset;

  // API Authentication
  QC_API_SECRET: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface QCValidateRequest {
  games?: any[];
  player_stats?: any[];
  simulations?: any[];
  data_source: string;
  config?: {
    mad_threshold?: number;
    auto_reject_failures?: boolean;
    auto_reject_outliers?: boolean;
    include_flagged?: boolean;
    min_confidence_score?: number;
  };
}

// ============================================================================
// WORKER HANDLER
// ============================================================================

export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for public API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Route: GET /health
      if (url.pathname === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'sports-data-qc',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Route: POST /qc/validate
      if (url.pathname === '/qc/validate' && request.method === 'POST') {
        return handleValidate(request, env, ctx, corsHeaders);
      }

      // Route: GET /qc/report/:id
      if (url.pathname.startsWith('/qc/report/') && request.method === 'GET') {
        return handleGetReport(request, env, corsHeaders);
      }

      // Route: GET /qc/reports
      if (url.pathname === '/qc/reports' && request.method === 'GET') {
        return handleListReports(request, env, corsHeaders);
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('[QC Worker] Error:', error);

      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  /**
   * Handle scheduled cron jobs
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;

    console.log(`[QC Worker] Scheduled job triggered: ${cron}`);

    try {
      if (cron === '0 3 * * *') {
        // Daily batch QC at 3am UTC
        await runDailyBatchQC(env, ctx);
      }
    } catch (error) {
      console.error('[QC Worker] Scheduled job failed:', error);

      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['qc_scheduled_error', cron],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown']
        });
      }

      throw error;
    }
  }
};

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /qc/validate - Validate sports data
 */
async function handleValidate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Authenticate request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.QC_API_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders
    });
  }

  // Parse request body
  const body = await request.json() as QCValidateRequest;

  if (!body.games && !body.player_stats && !body.simulations) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: 'Must provide at least one of: games, player_stats, simulations'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  if (!body.data_source) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: 'data_source is required'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const startTime = Date.now();

    // Run QC pipeline
    const { report, filtered_data } = await runQCPipeline({
      games: body.games,
      player_stats: body.player_stats,
      simulations: body.simulations,
      data_source: body.data_source
    }, body.config || {
      mad_threshold: 5.0,
      auto_reject_failures: true,
      auto_reject_outliers: false,
      include_flagged: true,
      min_confidence_score: 0.7
    });

    const duration = Date.now() - startTime;

    // Save report to KV
    ctx.waitUntil(saveReportToKV(report, env.CACHE, 7 * 24 * 60 * 60)); // 7 days

    // Save to R2 for long-term storage
    ctx.waitUntil(
      env.R2_BUCKET.put(
        `qc-reports/${report.report_id}.json`,
        formatReportJSON(report),
        {
          customMetadata: {
            data_source: body.data_source,
            total_records: report.total_records.toString(),
            records_rejected: report.records_rejected.toString(),
            timestamp: report.timestamp
          }
        }
      )
    );

    // Track in Analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['qc_validate', body.data_source],
        doubles: [
          report.total_records,
          report.records_passed,
          report.records_flagged,
          report.records_rejected,
          duration
        ],
        indexes: [report.report_id]
      });
    }

    // Log summary
    console.log(`[QC Worker] Validation complete: ${report.report_id}`);
    console.log(`[QC Worker] Passed: ${report.records_passed}, Flagged: ${report.records_flagged}, Rejected: ${report.records_rejected}`);
    console.log(`[QC Worker] Duration: ${duration}ms`);

    // Return response
    return new Response(JSON.stringify({
      success: true,
      report_id: report.report_id,
      summary: {
        total_records: report.total_records,
        records_passed: report.records_passed,
        records_flagged: report.records_flagged,
        records_rejected: report.records_rejected,
        failure_rate: (report.records_rejected / report.total_records).toFixed(4)
      },
      filtered_data: {
        games_count: filtered_data.games?.length || 0,
        player_stats_count: filtered_data.player_stats?.length || 0,
        simulations_count: filtered_data.simulations?.length || 0
      },
      report_url: `/qc/report/${report.report_id}`,
      duration_ms: duration,
      recommendations: report.recommendations
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[QC Worker] Validation failed:', error);

    return new Response(JSON.stringify({
      error: 'Validation Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /qc/report/:id - Retrieve QC report
 */
async function handleGetReport(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const reportId = url.pathname.split('/').pop();

  if (!reportId) {
    return new Response(JSON.stringify({ error: 'Missing report ID' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Try KV first (recent reports)
    let report = await getReportFromKV(reportId, env.CACHE);

    // If not in KV, try R2 (archived reports)
    if (!report) {
      const r2Object = await env.R2_BUCKET.get(`qc-reports/${reportId}.json`);
      if (r2Object) {
        const reportText = await r2Object.text();
        report = JSON.parse(reportText);
      }
    }

    if (!report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Check for format parameter
    const format = url.searchParams.get('format') || 'json';

    switch (format.toLowerCase()) {
      case 'html':
        return new Response(formatReportHTML(report), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });

      case 'markdown':
      case 'md':
        return new Response(formatReportMarkdown(report), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/markdown' }
        });

      case 'json':
      default:
        return new Response(formatReportJSON(report), {
          status: 200,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('[QC Worker] Get report failed:', error);

    return new Response(JSON.stringify({
      error: 'Failed to retrieve report',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /qc/reports - List recent reports
 */
async function handleListReports(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  try {
    const reportIds = await listRecentReports(env.CACHE, Math.min(limit, 100));

    return new Response(JSON.stringify({
      reports: reportIds,
      count: reportIds.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[QC Worker] List reports failed:', error);

    return new Response(JSON.stringify({
      error: 'Failed to list reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Run daily batch QC (scheduled at 3am UTC)
 */
async function runDailyBatchQC(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[QC Worker] Starting daily batch QC...');

  // In production, this would load yesterday's scraped data from staging
  // For now, this is a placeholder implementation

  console.log('[QC Worker] Daily batch QC complete');
}
