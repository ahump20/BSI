/**
 * BSI Admin Health API
 * Exposes per-dataset health status for operators.
 * Shows when system is degrading gracefully (serving LKG data).
 */

import { getDatasetHealth, getAllCommitRecords, type DatasetHealth } from './dataset-commit';
import { getSystemReadiness, type ReadinessRecord } from './readiness';

/** D1Database interface (Cloudflare Workers) */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
}

/** System-wide health summary */
export interface SystemHealthSummary {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  datasetsHealthy: number;
  datasetsDegraded: number;
  datasetsUnavailable: number;
  totalDatasets: number;
}

/** Complete health report */
export interface HealthReport {
  summary: SystemHealthSummary;
  datasets: DatasetHealth[];
  readiness: ReadinessRecord[];
}

/** Dataset IDs to monitor */
const MONITORED_DATASETS = [
  'cbb-games-live',
  'cbb-games-upcoming',
  'cbb-rankings',
  'cbb-teams',
  'cfb-rankings-ap',
  'cfb-rankings-coaches',
  'cfb-rankings-cfp',
  'cfb-games-live',
  'cfb-teams',
];

/**
 * Get health status for all monitored datasets.
 */
export async function getFullHealthReport(db: D1Database): Promise<HealthReport> {
  const datasets: DatasetHealth[] = [];

  for (const datasetId of MONITORED_DATASETS) {
    const health = await getDatasetHealth(db, datasetId);
    datasets.push(health);
  }

  const readiness = await getSystemReadiness(db);

  // Calculate summary
  let healthy = 0;
  let degraded = 0;
  let unavailable = 0;

  for (const ds of datasets) {
    if (ds.isServingLKG) {
      degraded++;
    } else if (ds.readinessState === 'ready' && ds.commitVersion > 0) {
      healthy++;
    } else if (ds.readinessState === 'unavailable' || ds.consecutiveFailures > 5) {
      unavailable++;
    } else if (ds.readinessState === 'degraded') {
      degraded++;
    } else {
      // initializing or unknown
      unavailable++;
    }
  }

  let overallStatus: 'healthy' | 'degraded' | 'critical';
  if (unavailable > 0) {
    overallStatus = 'critical';
  } else if (degraded > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    summary: {
      timestamp: new Date().toISOString(),
      overallStatus,
      datasetsHealthy: healthy,
      datasetsDegraded: degraded,
      datasetsUnavailable: unavailable,
      totalDatasets: datasets.length,
    },
    datasets,
    readiness,
  };
}

/**
 * Get health for a single dataset.
 */
export async function getSingleDatasetHealth(db: D1Database, datasetId: string): Promise<DatasetHealth | null> {
  if (!MONITORED_DATASETS.includes(datasetId)) {
    return null;
  }

  return getDatasetHealth(db, datasetId);
}

/**
 * Format health report as human-readable text (for CLI/alerts).
 */
export function formatHealthText(report: HealthReport): string {
  const lines: string[] = [];

  lines.push('=== BSI System Health Report ===');
  lines.push(`Timestamp: ${report.summary.timestamp}`);
  lines.push(`Status: ${report.summary.overallStatus.toUpperCase()}`);
  lines.push(`Healthy: ${report.summary.datasetsHealthy}/${report.summary.totalDatasets}`);
  lines.push(`Degraded: ${report.summary.datasetsDegraded}`);
  lines.push(`Unavailable: ${report.summary.datasetsUnavailable}`);
  lines.push('');
  lines.push('--- Dataset Details ---');

  for (const ds of report.datasets) {
    const status = ds.isServingLKG ? 'LKG' : ds.readinessState;
    const version = ds.commitVersion > 0 ? `v${ds.commitVersion}` : 'none';
    const failures = ds.consecutiveFailures > 0 ? ` (${ds.consecutiveFailures} failures)` : '';

    lines.push(`${ds.datasetId}: ${status} ${version} [${ds.recordCount} records]${failures}`);

    if (ds.lastError) {
      lines.push(`  Error: ${ds.lastError}`);
    }
  }

  return lines.join('\n');
}

/**
 * HTTP handler for admin health endpoints.
 */
export async function handleHealthRequest(request: Request, db: D1Database): Promise<Response> {
  const url = new URL(request.url);

  // GET /admin/health - Full health report
  if (url.pathname === '/admin/health' && request.method === 'GET') {
    const report = await getFullHealthReport(db);

    const accept = request.headers.get('Accept') || '';
    if (accept.includes('text/plain')) {
      return new Response(formatHealthText(report), {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'X-BSI-System-Status': report.summary.overallStatus,
      },
    });
  }

  // GET /admin/health/:datasetId - Single dataset health
  const datasetMatch = url.pathname.match(/^\/admin\/health\/([a-z-]+)$/);
  if (datasetMatch && request.method === 'GET') {
    const datasetId = datasetMatch[1];
    const health = await getSingleDatasetHealth(db, datasetId);

    if (!health) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(health, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'X-BSI-Dataset-Status': health.isServingLKG ? 'degraded' : health.readinessState,
      },
    });
  }

  // GET /admin/health/summary - Quick summary only
  if (url.pathname === '/admin/health/summary' && request.method === 'GET') {
    const report = await getFullHealthReport(db);

    return new Response(JSON.stringify(report.summary), {
      headers: {
        'Content-Type': 'application/json',
        'X-BSI-System-Status': report.summary.overallStatus,
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
