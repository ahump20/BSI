#!/usr/bin/env tsx
/**
 * Provider Health Monitoring Script
 *
 * Queries Cloudflare Analytics Engine to track provider failover behavior
 * and circuit breaker status in production.
 *
 * Usage:
 *   npm run monitor:providers              # Last 1 hour
 *   npm run monitor:providers -- --hours 24 # Last 24 hours
 *   npm run monitor:providers -- --live     # Live monitoring mode
 */

interface ProviderMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  circuitBreakerTrips: number;
  avgResponseTime: number;
  lastFailureTime: Date | null;
  successRate: number;
}

interface AnalyticsQuery {
  startTime: Date;
  endTime: Date;
  interval: '1m' | '5m' | '15m' | '1h';
}

/**
 * Fetch provider metrics from Cloudflare Analytics Engine
 */
async function fetchProviderMetrics(query: AnalyticsQuery): Promise<ProviderMetrics[]> {
  // In production, this would query the Analytics Engine API
  // For now, this is a template showing the expected structure

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const datasetName = 'bsi_ingest_analytics';

  if (!accountId || !apiToken) {
    console.error('❌ Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
    process.exit(1);
  }

  const graphqlQuery = `
    query ProviderMetrics($accountTag: String!, $datasetName: String!, $startTime: String!, $endTime: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          analyticsEngineDatasets(filter: { name: $datasetName }) {
            dataPoints(
              filter: {
                timestamp_geq: $startTime
                timestamp_leq: $endTime
              }
              orderBy: [timestamp_ASC]
            ) {
              blob1  # provider name
              blob2  # event type (request_success, request_failure, circuit_breaker_trip)
              double1 # response time (ms)
              index1  # timestamp
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          accountTag: accountId,
          datasetName,
          startTime: query.startTime.toISOString(),
          endTime: query.endTime.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Process raw data points into provider metrics
    return processDataPoints(data.data.viewer.accounts[0].analyticsEngineDatasets[0].dataPoints);
  } catch (error) {
    console.error('❌ Failed to fetch provider metrics:', error);
    throw error;
  }
}

/**
 * Process raw Analytics Engine data points into provider metrics
 */
function processDataPoints(dataPoints: any[]): ProviderMetrics[] {
  const metricsMap = new Map<string, ProviderMetrics>();

  dataPoints.forEach((point) => {
    const provider = point.blob1; // provider name
    const eventType = point.blob2; // event type
    const responseTime = point.double1; // response time
    const timestamp = new Date(point.index1);

    if (!metricsMap.has(provider)) {
      metricsMap.set(provider, {
        provider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        circuitBreakerTrips: 0,
        avgResponseTime: 0,
        lastFailureTime: null,
        successRate: 0,
      });
    }

    const metrics = metricsMap.get(provider)!;

    if (eventType === 'request_success') {
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.avgResponseTime =
        (metrics.avgResponseTime * (metrics.successfulRequests - 1) + responseTime) /
        metrics.successfulRequests;
    } else if (eventType === 'request_failure') {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.lastFailureTime = timestamp;
    } else if (eventType === 'circuit_breaker_trip') {
      metrics.circuitBreakerTrips++;
    }
  });

  // Calculate success rates
  metricsMap.forEach((metrics) => {
    metrics.successRate =
      metrics.totalRequests > 0 ? metrics.successfulRequests / metrics.totalRequests : 0;
  });

  return Array.from(metricsMap.values()).sort((a, b) => b.totalRequests - a.totalRequests);
}

/**
 * Display provider metrics in a formatted table
 */
function displayMetrics(metrics: ProviderMetrics[]): void {
  console.log('\n📊 Provider Health Metrics\n');
  console.log(
    '┌─────────────────┬──────────┬─────────┬────────┬────────────┬────────────┬───────────────┐'
  );
  console.log(
    '│ Provider        │ Requests │ Success │ Failed │ CB Trips   │ Avg RT (ms)│ Success Rate  │'
  );
  console.log(
    '├─────────────────┼──────────┼─────────┼────────┼────────────┼────────────┼───────────────┤'
  );

  metrics.forEach((m) => {
    const successRateColor = m.successRate >= 0.99 ? '🟢' : m.successRate >= 0.95 ? '🟡' : '🔴';
    const successRateStr = `${successRateColor} ${(m.successRate * 100).toFixed(2)}%`;

    console.log(
      `│ ${m.provider.padEnd(15)} │ ${String(m.totalRequests).padStart(8)} │ ` +
        `${String(m.successfulRequests).padStart(7)} │ ${String(m.failedRequests).padStart(6)} │ ` +
        `${String(m.circuitBreakerTrips).padStart(10)} │ ${m.avgResponseTime.toFixed(0).padStart(10)} │ ` +
        `${successRateStr.padEnd(13)} │`
    );
  });

  console.log(
    '└─────────────────┴──────────┴─────────┴────────┴────────────┴────────────┴───────────────┘\n'
  );

  // Display last failure times
  console.log('⏱️  Last Failure Times:\n');
  metrics.forEach((m) => {
    if (m.lastFailureTime) {
      const timeSince = Date.now() - m.lastFailureTime.getTime();
      const minutesAgo = Math.floor(timeSince / 60000);
      console.log(
        `   ${m.provider}: ${minutesAgo} minutes ago (${m.lastFailureTime.toISOString()})`
      );
    } else {
      console.log(`   ${m.provider}: No failures recorded ✅`);
    }
  });
  console.log();
}

/**
 * Detect and alert on anomalies
 */
function detectAnomalies(metrics: ProviderMetrics[]): void {
  const alerts: string[] = [];

  metrics.forEach((m) => {
    // Alert: Success rate below 95%
    if (m.successRate < 0.95 && m.totalRequests > 10) {
      alerts.push(`⚠️  ${m.provider}: Low success rate (${(m.successRate * 100).toFixed(2)}%)`);
    }

    // Alert: Multiple circuit breaker trips
    if (m.circuitBreakerTrips >= 3) {
      alerts.push(`🔴 ${m.provider}: Multiple circuit breaker trips (${m.circuitBreakerTrips})`);
    }

    // Alert: High average response time
    if (m.avgResponseTime > 5000) {
      alerts.push(`⏱️  ${m.provider}: High avg response time (${m.avgResponseTime.toFixed(0)}ms)`);
    }

    // Alert: Recent failures
    if (m.lastFailureTime) {
      const timeSince = Date.now() - m.lastFailureTime.getTime();
      if (timeSince < 300000) {
        // Within last 5 minutes
        alerts.push(`🚨 ${m.provider}: Recent failure (${Math.floor(timeSince / 60000)}min ago)`);
      }
    }
  });

  if (alerts.length > 0) {
    console.log('🚨 ALERTS:\n');
    alerts.forEach((alert) => console.log(`   ${alert}`));
    console.log();
  } else {
    console.log('✅ No anomalies detected - all providers healthy\n');
  }
}

/**
 * Generate health summary
 */
function generateSummary(metrics: ProviderMetrics[]): void {
  const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const totalSuccessful = metrics.reduce((sum, m) => sum + m.successfulRequests, 0);
  const totalFailed = metrics.reduce((sum, m) => sum + m.failedRequests, 0);
  const totalCBTrips = metrics.reduce((sum, m) => sum + m.circuitBreakerTrips, 0);

  const overallSuccessRate = totalRequests > 0 ? totalSuccessful / totalRequests : 0;

  console.log('📈 Overall Summary:\n');
  console.log(`   Total Requests: ${totalRequests.toLocaleString()}`);
  console.log(
    `   Successful: ${totalSuccessful.toLocaleString()} (${(overallSuccessRate * 100).toFixed(2)}%)`
  );
  console.log(`   Failed: ${totalFailed.toLocaleString()}`);
  console.log(`   Circuit Breaker Trips: ${totalCBTrips}`);
  console.log(
    `   Primary Provider (SportsDataIO): ${
      metrics.find((m) => m.provider === 'SportsDataIO')?.successRate
        ? (metrics.find((m) => m.provider === 'SportsDataIO')!.successRate * 100).toFixed(2) + '%'
        : 'N/A'
    }`
  );
  console.log();
}

/**
 * Live monitoring mode - refresh every 30 seconds
 */
async function liveMonitoring(): Promise<void> {
  console.log('🔴 Live Monitoring Mode - Press Ctrl+C to exit\n');

  const refresh = async () => {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000); // Last 1 hour

    try {
      const metrics = await fetchProviderMetrics({
        startTime,
        endTime,
        interval: '1m',
      });

      // Clear console
      console.clear();
      console.log(
        '🔴 Live Monitoring Mode - Last Update: ' + new Date().toLocaleTimeString() + '\n'
      );

      displayMetrics(metrics);
      detectAnomalies(metrics);
      generateSummary(metrics);

      console.log('⏳ Refreshing in 30 seconds...\n');
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
    }
  };

  // Initial fetch
  await refresh();

  // Refresh every 30 seconds
  setInterval(refresh, 30000);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const liveMode = args.includes('--live');
  const hoursArg = args.find((arg) => arg.startsWith('--hours='));
  const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 1;

  if (liveMode) {
    await liveMonitoring();
  } else {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 3600000);

    console.log(`\n🔍 Fetching provider metrics for last ${hours} hour(s)...`);
    console.log(`   From: ${startTime.toISOString()}`);
    console.log(`   To:   ${endTime.toISOString()}\n`);

    try {
      const metrics = await fetchProviderMetrics({
        startTime,
        endTime,
        interval: hours <= 1 ? '1m' : hours <= 6 ? '5m' : '15m',
      });

      displayMetrics(metrics);
      detectAnomalies(metrics);
      generateSummary(metrics);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { fetchProviderMetrics, processDataPoints, ProviderMetrics };
