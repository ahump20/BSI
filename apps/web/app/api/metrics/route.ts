/**
 * Metrics Endpoint for Prometheus/Monitoring
 *
 * Exposes application metrics in Prometheus text format
 *
 * GET /api/metrics
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory metrics storage (would use Redis/DB in production)
const metrics = {
  http_requests_total: 0,
  http_requests_success: 0,
  http_requests_error: 0,
  http_request_duration_seconds: [] as number[],
  page_views: 0,
  active_users: 0,
  api_calls_total: 0,
  cache_hits: 0,
  cache_misses: 0,
};

// Helper to format Prometheus metrics
function formatPrometheusMetrics(): string {
  const lines: string[] = [];

  // HTTP Requests
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total{app="bsi-web"} ${metrics.http_requests_total}`);

  lines.push('# HELP http_requests_success Total number of successful HTTP requests');
  lines.push('# TYPE http_requests_success counter');
  lines.push(`http_requests_success{app="bsi-web"} ${metrics.http_requests_success}`);

  lines.push('# HELP http_requests_error Total number of failed HTTP requests');
  lines.push('# TYPE http_requests_error counter');
  lines.push(`http_requests_error{app="bsi-web"} ${metrics.http_requests_error}`);

  // Request Duration
  if (metrics.http_request_duration_seconds.length > 0) {
    const avg =
      metrics.http_request_duration_seconds.reduce((a, b) => a + b, 0) /
      metrics.http_request_duration_seconds.length;
    const max = Math.max(...metrics.http_request_duration_seconds);
    const min = Math.min(...metrics.http_request_duration_seconds);

    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds summary');
    lines.push(`http_request_duration_seconds_sum{app="bsi-web"} ${avg.toFixed(3)}`);
    lines.push(`http_request_duration_seconds_count{app="bsi-web"} ${metrics.http_request_duration_seconds.length}`);
    lines.push(`http_request_duration_seconds_max{app="bsi-web"} ${max.toFixed(3)}`);
    lines.push(`http_request_duration_seconds_min{app="bsi-web"} ${min.toFixed(3)}`);
  }

  // Page Views
  lines.push('# HELP page_views_total Total number of page views');
  lines.push('# TYPE page_views_total counter');
  lines.push(`page_views_total{app="bsi-web"} ${metrics.page_views}`);

  // Active Users (would be calculated from session data)
  lines.push('# HELP active_users Current number of active users');
  lines.push('# TYPE active_users gauge');
  lines.push(`active_users{app="bsi-web"} ${metrics.active_users}`);

  // API Calls
  lines.push('# HELP api_calls_total Total number of API calls');
  lines.push('# TYPE api_calls_total counter');
  lines.push(`api_calls_total{app="bsi-web"} ${metrics.api_calls_total}`);

  // Cache Metrics
  lines.push('# HELP cache_hits_total Total number of cache hits');
  lines.push('# TYPE cache_hits_total counter');
  lines.push(`cache_hits_total{app="bsi-web"} ${metrics.cache_hits}`);

  lines.push('# HELP cache_misses_total Total number of cache misses');
  lines.push('# TYPE cache_misses_total counter');
  lines.push(`cache_misses_total{app="bsi-web"} ${metrics.cache_misses}`);

  // Cache Hit Rate
  const totalCacheRequests = metrics.cache_hits + metrics.cache_misses;
  const hitRate = totalCacheRequests > 0 ? (metrics.cache_hits / totalCacheRequests) * 100 : 0;
  lines.push('# HELP cache_hit_rate_percentage Cache hit rate percentage');
  lines.push('# TYPE cache_hit_rate_percentage gauge');
  lines.push(`cache_hit_rate_percentage{app="bsi-web"} ${hitRate.toFixed(2)}`);

  // System Metrics (Node.js)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();

    lines.push('# HELP nodejs_memory_heap_used_bytes Node.js heap memory used');
    lines.push('# TYPE nodejs_memory_heap_used_bytes gauge');
    lines.push(`nodejs_memory_heap_used_bytes{app="bsi-web"} ${memory.heapUsed}`);

    lines.push('# HELP nodejs_memory_heap_total_bytes Node.js heap memory total');
    lines.push('# TYPE nodejs_memory_heap_total_bytes gauge');
    lines.push(`nodejs_memory_heap_total_bytes{app="bsi-web"} ${memory.heapTotal}`);

    lines.push('# HELP nodejs_memory_external_bytes Node.js external memory');
    lines.push('# TYPE nodejs_memory_external_bytes gauge');
    lines.push(`nodejs_memory_external_bytes{app="bsi-web"} ${memory.external}`);

    lines.push('# HELP nodejs_uptime_seconds Node.js process uptime in seconds');
    lines.push('# TYPE nodejs_uptime_seconds counter');
    lines.push(`nodejs_uptime_seconds{app="bsi-web"} ${process.uptime()}`);
  }

  // Application Version
  lines.push('# HELP app_version Application version info');
  lines.push('# TYPE app_version gauge');
  lines.push(`app_version{app="bsi-web",version="${process.env.APP_VERSION || '2.0.0'}",node="${process.version}"} 1`);

  return lines.join('\n') + '\n';
}

export async function GET(request: NextRequest) {
  try {
    // Increment request counter
    metrics.http_requests_total++;
    metrics.http_requests_success++;

    const prometheusFormat = formatPrometheusMetrics();

    return new NextResponse(prometheusFormat, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    metrics.http_requests_error++;

    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Increment metrics helper (would be called from middleware)
export function incrementMetric(metric: keyof typeof metrics, value: number = 1) {
  if (typeof metrics[metric] === 'number') {
    (metrics[metric] as number) += value;
  }
}

// Add duration helper
export function recordDuration(durationSeconds: number) {
  metrics.http_request_duration_seconds.push(durationSeconds);

  // Keep only last 1000 entries to prevent memory leak
  if (metrics.http_request_duration_seconds.length > 1000) {
    metrics.http_request_duration_seconds.shift();
  }
}

// Reset metrics (for testing)
export function resetMetrics() {
  metrics.http_requests_total = 0;
  metrics.http_requests_success = 0;
  metrics.http_requests_error = 0;
  metrics.http_request_duration_seconds = [];
  metrics.page_views = 0;
  metrics.active_users = 0;
  metrics.api_calls_total = 0;
  metrics.cache_hits = 0;
  metrics.cache_misses = 0;
}
