/**
 * Enhanced health check endpoint with dependency monitoring
 * GET /api/health
 */

export async function onRequest(context) {
    const { request, env } = context;
    const startTime = Date.now();

    // Initialize health response
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        platform: 'Blaze Sports Intel',
        version: '2.1.0',
        environment: env.ENVIRONMENT || 'production',
        responseTime: null,
        checks: []
    };

    // Check MLB Stats API
    try {
        const mlbStart = Date.now();
        const mlbResponse = await fetch('https://statsapi.mlb.com/api/v1/teams/138', {
            signal: AbortSignal.timeout(5000)
        });

        health.checks.push({
            service: 'MLB Stats API',
            status: mlbResponse.ok ? 'healthy' : 'degraded',
            statusCode: mlbResponse.status,
            responseTime: `${Date.now() - mlbStart}ms`
        });
    } catch (error) {
        health.checks.push({
            service: 'MLB Stats API',
            status: 'unhealthy',
            error: error.message
        });
        health.status = 'degraded';
    }

    // Check SportsDataIO if key is configured
    if (env.SPORTSDATAIO_KEY) {
        try {
            const sdioStart = Date.now();
            const sdioResponse = await fetch(
                `https://api.sportsdata.io/v3/nfl/scores/json/Teams?key=${env.SPORTSDATAIO_KEY}`,
                { signal: AbortSignal.timeout(5000) }
            );

            health.checks.push({
                service: 'SportsDataIO',
                status: sdioResponse.ok ? 'healthy' : 'degraded',
                statusCode: sdioResponse.status,
                responseTime: `${Date.now() - sdioStart}ms`
            });
        } catch (error) {
            health.checks.push({
                service: 'SportsDataIO',
                status: 'unhealthy',
                error: error.message
            });
            health.status = 'degraded';
        }
    }

    // Check Cloudflare KV if available
    if (env.KV_CACHE) {
        try {
            const kvStart = Date.now();
            const testKey = '__health_check__';
            await env.KV_CACHE.put(testKey, Date.now().toString(), { expirationTtl: 60 });
            const kvValue = await env.KV_CACHE.get(testKey);

            health.checks.push({
                service: 'Cloudflare KV',
                status: kvValue ? 'healthy' : 'unhealthy',
                responseTime: `${Date.now() - kvStart}ms`
            });
        } catch (error) {
            health.checks.push({
                service: 'Cloudflare KV',
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    // Calculate summary
    health.responseTime = `${Date.now() - startTime}ms`;
    health.summary = {
        total: health.checks.length,
        healthy: health.checks.filter(c => c.status === 'healthy').length,
        degraded: health.checks.filter(c => c.status === 'degraded').length,
        unhealthy: health.checks.filter(c => c.status === 'unhealthy').length
    };

    // Determine overall health status
    const unhealthyCount = health.summary.unhealthy;
    const degradedCount = health.summary.degraded;

    if (unhealthyCount > 0 && unhealthyCount === health.summary.total) {
        health.status = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > 0) {
        health.status = 'degraded';
    }

    // Set appropriate HTTP status code
    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 503 : 500;

    return new Response(JSON.stringify(health, null, 2), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}
