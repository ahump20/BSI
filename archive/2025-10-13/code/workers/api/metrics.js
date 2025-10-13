/**
 * Metrics endpoint for monitoring and observability
 * GET /api/metrics
 */

// In-memory metrics storage (reset on worker restart)
let metrics = {
    requests: {
        total: 0,
        byEndpoint: {},
        byStatus: {},
        byMethod: {}
    },
    cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
    },
    errors: {
        total: 0,
        byType: {},
        recent: []
    },
    performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        responseTimes: []
    },
    startTime: new Date().toISOString(),
    lastReset: new Date().toISOString()
};

// Track response times for percentile calculations
const MAX_RESPONSE_TIME_SAMPLES = 1000;

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Allow resetting metrics with ?reset=true (requires auth in production)
    if (url.searchParams.get('reset') === 'true') {
        // In production, check for auth header
        if (env.ENVIRONMENT === 'production') {
            const authHeader = request.headers.get('Authorization');
            if (authHeader !== `Bearer ${env.METRICS_API_KEY}`) {
                return new Response('Unauthorized', { status: 401 });
            }
        }

        // Reset metrics
        metrics = {
            requests: { total: 0, byEndpoint: {}, byStatus: {}, byMethod: {} },
            cache: { hits: 0, misses: 0, hitRate: 0 },
            errors: { total: 0, byType: {}, recent: [] },
            performance: {
                avgResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                responseTimes: []
            },
            startTime: metrics.startTime,
            lastReset: new Date().toISOString()
        };

        return new Response(JSON.stringify({ message: 'Metrics reset successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Calculate derived metrics
    const uptime = Date.now() - new Date(metrics.startTime).getTime();
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    // Calculate cache hit rate
    const totalCacheRequests = metrics.cache.hits + metrics.cache.misses;
    metrics.cache.hitRate = totalCacheRequests > 0
        ? (metrics.cache.hits / totalCacheRequests * 100).toFixed(2) + '%'
        : '0%';

    // Calculate response time percentiles
    if (metrics.performance.responseTimes.length > 0) {
        const sorted = [...metrics.performance.responseTimes].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);

        metrics.performance.p95ResponseTime = sorted[p95Index] || 0;
        metrics.performance.p99ResponseTime = sorted[p99Index] || 0;
        metrics.performance.avgResponseTime =
            sorted.reduce((a, b) => a + b, 0) / sorted.length;
    }

    // Format response
    const response = {
        platform: 'Blaze Sports Intel',
        version: '2.1.0',
        environment: env.ENVIRONMENT || 'production',
        timestamp: new Date().toISOString(),
        uptime: {
            hours: uptimeHours,
            minutes: uptimeMinutes,
            formatted: `${uptimeHours}h ${uptimeMinutes}m`
        },
        metrics: {
            requests: {
                total: metrics.requests.total,
                byEndpoint: metrics.requests.byEndpoint,
                byStatus: metrics.requests.byStatus,
                byMethod: metrics.requests.byMethod
            },
            cache: {
                hits: metrics.cache.hits,
                misses: metrics.cache.misses,
                hitRate: metrics.cache.hitRate
            },
            errors: {
                total: metrics.errors.total,
                byType: metrics.errors.byType,
                recent: metrics.errors.recent.slice(-10) // Last 10 errors
            },
            performance: {
                avgResponseTime: `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
                p95ResponseTime: `${metrics.performance.p95ResponseTime}ms`,
                p99ResponseTime: `${metrics.performance.p99ResponseTime}ms`,
                sampleSize: metrics.performance.responseTimes.length
            }
        },
        meta: {
            startTime: metrics.startTime,
            lastReset: metrics.lastReset
        }
    };

    // Return formatted metrics
    return new Response(JSON.stringify(response, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}

// Export metrics object for other endpoints to update
export function updateMetrics(data) {
    if (data.request) {
        metrics.requests.total++;

        // Track by endpoint
        const endpoint = data.request.endpoint || 'unknown';
        metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;

        // Track by status
        const status = data.request.status || 'unknown';
        metrics.requests.byStatus[status] = (metrics.requests.byStatus[status] || 0) + 1;

        // Track by method
        const method = data.request.method || 'GET';
        metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
    }

    if (data.cache) {
        if (data.cache.hit) metrics.cache.hits++;
        if (data.cache.miss) metrics.cache.misses++;
    }

    if (data.error) {
        metrics.errors.total++;
        const errorType = data.error.type || 'unknown';
        metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;

        // Keep recent errors for debugging
        metrics.errors.recent.push({
            timestamp: new Date().toISOString(),
            type: errorType,
            message: data.error.message,
            endpoint: data.error.endpoint
        });

        // Limit recent errors array size
        if (metrics.errors.recent.length > 100) {
            metrics.errors.recent = metrics.errors.recent.slice(-100);
        }
    }

    if (data.responseTime) {
        metrics.performance.responseTimes.push(data.responseTime);

        // Limit samples to prevent memory issues
        if (metrics.performance.responseTimes.length > MAX_RESPONSE_TIME_SAMPLES) {
            metrics.performance.responseTimes =
                metrics.performance.responseTimes.slice(-MAX_RESPONSE_TIME_SAMPLES);
        }
    }
}