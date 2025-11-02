/**
 * Health Check Endpoint for Next.js Application
 *
 * Provides comprehensive health status including:
 * - Application status
 * - Dependency checks
 * - System metrics
 * - Response time
 *
 * GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: string;
  statusCode?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  application: string;
  version: string;
  environment: string;
  responseTime: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  system?: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    node: string;
  };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const health: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    application: 'Blaze Sports Intel - Next.js App',
    version: process.env.APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: '',
    checks: [],
    summary: {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
    },
  };

  // Check 1: API Endpoints (if configured)
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const apiStart = Date.now();
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });

      health.checks.push({
        service: 'API Backend',
        status: apiResponse.ok ? 'healthy' : 'degraded',
        statusCode: apiResponse.status,
        responseTime: `${Date.now() - apiStart}ms`,
      });
    } catch (error: any) {
      health.checks.push({
        service: 'API Backend',
        status: 'unhealthy',
        error: error.message,
      });
      health.status = 'degraded';
    }
  }

  // Check 2: Sentry Integration
  try {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      health.checks.push({
        service: 'Sentry Error Tracking',
        status: 'healthy',
      });
    }
  } catch (error: any) {
    health.checks.push({
      service: 'Sentry Error Tracking',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // Check 3: Datadog RUM
  try {
    if (process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN) {
      health.checks.push({
        service: 'Datadog RUM',
        status: 'healthy',
      });
    }
  } catch (error: any) {
    health.checks.push({
      service: 'Datadog RUM',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // Check 4: External API - MLB Stats (public API)
  try {
    const mlbStart = Date.now();
    const mlbResponse = await fetch('https://statsapi.mlb.com/api/v1/teams/138', {
      signal: AbortSignal.timeout(5000),
    });

    health.checks.push({
      service: 'MLB Stats API',
      status: mlbResponse.ok ? 'healthy' : 'degraded',
      statusCode: mlbResponse.status,
      responseTime: `${Date.now() - mlbStart}ms`,
    });
  } catch (error: any) {
    health.checks.push({
      service: 'MLB Stats API',
      status: 'degraded',
      error: error.message,
    });
    // Don't fail entire health check for external API
  }

  // System metrics (Node.js only)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();
    health.system = {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      },
      node: process.version,
    };

    // Check memory usage
    if (health.system.memory.percentage > 90) {
      health.checks.push({
        service: 'Memory Usage',
        status: 'unhealthy',
        error: `Memory usage at ${health.system.memory.percentage}%`,
      });
      health.status = 'degraded';
    } else if (health.system.memory.percentage > 75) {
      health.checks.push({
        service: 'Memory Usage',
        status: 'degraded',
        error: `Memory usage at ${health.system.memory.percentage}%`,
      });
      health.status = 'degraded';
    } else {
      health.checks.push({
        service: 'Memory Usage',
        status: 'healthy',
        responseTime: `${health.system.memory.percentage}%`,
      });
    }
  }

  // Calculate summary
  health.responseTime = `${Date.now() - startTime}ms`;
  health.summary.total = health.checks.length;
  health.summary.healthy = health.checks.filter((c) => c.status === 'healthy').length;
  health.summary.degraded = health.checks.filter((c) => c.status === 'degraded').length;
  health.summary.unhealthy = health.checks.filter((c) => c.status === 'unhealthy').length;

  // Determine overall status
  const unhealthyCount = health.summary.unhealthy;
  const degradedCount = health.summary.degraded;

  if (unhealthyCount > 0 && unhealthyCount === health.summary.total) {
    health.status = 'unhealthy';
  } else if (unhealthyCount > 0 || degradedCount > 0) {
    health.status = 'degraded';
  }

  // Set appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
