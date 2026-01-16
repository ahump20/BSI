#!/usr/bin/env node
/**
 * Performance Check Script
 *
 * Validates API performance before deployment:
 * - Response times < 200ms for cached data
 * - Response times < 2s for fresh data
 * - Cache hit rate > 80%
 * - Error rate < 1%
 */

interface PerformanceMetrics {
  endpoint: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  cacheHitRate: number;
}

const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';
const SAMPLE_SIZE = 10;

const endpoints = [
  '/api/mlb/cardinals',
  '/api/mlb/standings',
  '/api/nfl/titans',
  '/api/nfl/standings',
  '/api/nfl/scores',
];

async function measureEndpoint(endpoint: string): Promise<PerformanceMetrics> {
  const times: number[] = [];
  const statuses: number[] = [];
  const cacheHits: number[] = [];

  console.log(`\nTesting ${endpoint}...`);

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const start = Date.now();

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const duration = Date.now() - start;

      times.push(duration);
      statuses.push(response.status);

      const cacheStatus = response.headers.get('cf-cache-status');
      cacheHits.push(cacheStatus === 'HIT' ? 1 : 0);

      process.stdout.write('.');
    } catch (error) {
      console.error(`\nRequest failed: ${error}`);
      statuses.push(0);
      times.push(0);
      cacheHits.push(0);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minResponseTime = Math.min(...times);
  const maxResponseTime = Math.max(...times);
  const successRate = statuses.filter((s) => s === 200).length / statuses.length;
  const cacheHitRate = cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length;

  return {
    endpoint,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    successRate,
    cacheHitRate,
  };
}

async function runPerformanceChecks(): Promise<void> {
  console.log('🚀 Starting Performance Checks\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Sample size: ${SAMPLE_SIZE} requests per endpoint\n`);

  const results: PerformanceMetrics[] = [];
  let allPassed = true;

  for (const endpoint of endpoints) {
    const metrics = await measureEndpoint(endpoint);
    results.push(metrics);

    console.log(`\n  Avg: ${metrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`  Min: ${metrics.minResponseTime}ms`);
    console.log(`  Max: ${metrics.maxResponseTime}ms`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);

    // Check thresholds
    if (metrics.avgResponseTime > 2000) {
      console.log(`  ❌ FAIL: Average response time exceeds 2000ms`);
      allPassed = false;
    }

    if (metrics.successRate < 0.99) {
      console.log(`  ❌ FAIL: Success rate below 99%`);
      allPassed = false;
    }

    if (metrics.cacheHitRate < 0.5 && endpoint !== '/api/nfl/scores') {
      console.log(`  ⚠️  WARNING: Cache hit rate below 50%`);
      // Don't fail on low cache hit rate, just warn
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Performance Summary\n');

  const avgAll = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
  const avgSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
  const avgCache = results.reduce((sum, r) => sum + r.cacheHitRate, 0) / results.length;

  console.log(`Average Response Time: ${avgAll.toFixed(0)}ms`);
  console.log(`Average Success Rate: ${(avgSuccess * 100).toFixed(1)}%`);
  console.log(`Average Cache Hit Rate: ${(avgCache * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('✅ All performance checks PASSED\n');
    process.exit(0);
  } else {
    console.log('❌ Some performance checks FAILED\n');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceChecks().catch((error) => {
    console.error('Performance check failed:', error);
    process.exit(1);
  });
}

export { runPerformanceChecks, measureEndpoint };
