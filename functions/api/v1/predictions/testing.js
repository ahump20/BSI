/**
 * Blaze Sports Intel - Model Testing & Validation API
 *
 * Provides endpoints for comprehensive model testing and validation.
 *
 * Endpoints:
 * - POST /api/v1/predictions/testing/backtest?sport=NFL&sampleSize=100
 * - POST /api/v1/predictions/testing/crossvalidate?sport=NFL&folds=5
 * - POST /api/v1/predictions/testing/benchmark
 * - POST /api/v1/predictions/testing/edgecases
 * - POST /api/v1/predictions/testing/fullsuite
 * - GET /api/v1/predictions/testing/results?testId=xxx
 */

import {
  backtestWinProbabilityModel,
  crossValidateModel,
  benchmarkPerformance,
  testEdgeCases,
  runFullTestSuite
} from '../../../../lib/ml/model-performance-tester.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  try {
    let result;

    switch (action) {
      case 'backtest':
        // POST /api/v1/predictions/testing/backtest?sport=NFL&sampleSize=100
        if (request.method !== 'POST') {
          throw new Error('POST method required for backtesting');
        }

        const sport = url.searchParams.get('sport');
        if (!sport) {
          throw new Error('sport parameter required for backtesting');
        }

        const sampleSize = parseInt(url.searchParams.get('sampleSize') || '100');

        result = await backtestWinProbabilityModel(env, sport, sampleSize);

        // Store result in KV for retrieval
        const backtestId = `backtest_${sport}_${Date.now()}`;
        await env.SPORTS_DATA_KV.put(
          `test_result:${backtestId}`,
          JSON.stringify(result),
          { expirationTtl: 86400 } // 24 hour expiration
        );

        result.testId = backtestId;
        break;

      case 'crossvalidate':
        // POST /api/v1/predictions/testing/crossvalidate?sport=NFL&folds=5
        if (request.method !== 'POST') {
          throw new Error('POST method required for cross-validation');
        }

        const cvSport = url.searchParams.get('sport');
        if (!cvSport) {
          throw new Error('sport parameter required for cross-validation');
        }

        const folds = parseInt(url.searchParams.get('folds') || '5');

        result = await crossValidateModel(env, cvSport, folds);

        // Store result in KV
        const cvId = `crossval_${cvSport}_${Date.now()}`;
        await env.SPORTS_DATA_KV.put(
          `test_result:${cvId}`,
          JSON.stringify(result),
          { expirationTtl: 86400 }
        );

        result.testId = cvId;
        break;

      case 'benchmark':
        // POST /api/v1/predictions/testing/benchmark
        if (request.method !== 'POST') {
          throw new Error('POST method required for benchmarking');
        }

        result = await benchmarkPerformance(env);

        // Store result in KV
        const benchmarkId = `benchmark_${Date.now()}`;
        await env.SPORTS_DATA_KV.put(
          `test_result:${benchmarkId}`,
          JSON.stringify(result),
          { expirationTtl: 86400 }
        );

        result.testId = benchmarkId;
        break;

      case 'edgecases':
        // POST /api/v1/predictions/testing/edgecases
        if (request.method !== 'POST') {
          throw new Error('POST method required for edge case testing');
        }

        result = await testEdgeCases(env);

        // Store result in KV
        const edgecaseId = `edgecase_${Date.now()}`;
        await env.SPORTS_DATA_KV.put(
          `test_result:${edgecaseId}`,
          JSON.stringify(result),
          { expirationTtl: 86400 }
        );

        result.testId = edgecaseId;
        break;

      case 'fullsuite':
        // POST /api/v1/predictions/testing/fullsuite
        if (request.method !== 'POST') {
          throw new Error('POST method required for full test suite');
        }

        result = await runFullTestSuite(env);

        // Store result in KV
        const suiteId = `fullsuite_${Date.now()}`;
        await env.SPORTS_DATA_KV.put(
          `test_result:${suiteId}`,
          JSON.stringify(result),
          { expirationTtl: 86400 }
        );

        result.testId = suiteId;
        break;

      case 'results':
        // GET /api/v1/predictions/testing/results?testId=xxx
        const testId = url.searchParams.get('testId');
        if (!testId) {
          throw new Error('testId parameter required to retrieve results');
        }

        const storedResult = await env.SPORTS_DATA_KV.get(`test_result:${testId}`, 'json');

        if (!storedResult) {
          throw new Error(`Test results not found for testId: ${testId}. Results expire after 24 hours.`);
        }

        result = storedResult;
        break;

      case 'history':
        // GET /api/v1/predictions/testing/history?limit=10
        const limit = parseInt(url.searchParams.get('limit') || '10');

        // List all test result keys
        const list = await env.SPORTS_DATA_KV.list({ prefix: 'test_result:', limit: limit });

        const historyResults = [];
        for (const key of list.keys) {
          const testResult = await env.SPORTS_DATA_KV.get(key.name, 'json');
          if (testResult) {
            historyResults.push({
              testId: key.name.replace('test_result:', ''),
              timestamp: testResult.timestamp,
              type: key.name.split('_')[1],
              sport: testResult.sport || 'all',
              summary: {
                accuracy: testResult.overall?.accuracy || testResult.avgAccuracy,
                brierScore: testResult.overall?.avgBrierScore,
                duration: testResult.duration
              }
            });
          }
        }

        result = {
          totalResults: historyResults.length,
          results: historyResults
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}. Valid actions: backtest, crossvalidate, benchmark, edgecases, fullsuite, results, history`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': action === 'results' || action === 'history'
          ? 'public, max-age=300, s-maxage=600'
          : 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Model testing API error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to process testing request',
      message: error.message,
      action: action
    }), {
      status: error.message.includes('required') ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Example usage:
 *
 * // Run backtest for NFL with 100 games
 * const backtestResponse = await fetch('/api/v1/predictions/testing/backtest?sport=NFL&sampleSize=100', {
 *   method: 'POST'
 * });
 * const backtestResult = await backtestResponse.json();
 * console.log('Backtest ID:', backtestResult.testId);
 * console.log('Overall Accuracy:', backtestResult.overall.accuracy);
 *
 * // Run 5-fold cross-validation for MLB
 * const cvResponse = await fetch('/api/v1/predictions/testing/crossvalidate?sport=MLB&folds=5', {
 *   method: 'POST'
 * });
 * const cvResult = await cvResponse.json();
 * console.log('Avg Accuracy:', cvResult.avgAccuracy, '±', cvResult.stdDevAccuracy);
 *
 * // Run performance benchmarks
 * const benchmarkResponse = await fetch('/api/v1/predictions/testing/benchmark', {
 *   method: 'POST'
 * });
 * const benchmarkResult = await benchmarkResponse.json();
 * console.log('Performance Grade:', benchmarkResult.overall.performanceGrade);
 * console.log('Avg Latency:', benchmarkResult.benchmarks.winProbability.avgLatency, 'ms');
 *
 * // Run edge case tests
 * const edgecaseResponse = await fetch('/api/v1/predictions/testing/edgecases', {
 *   method: 'POST'
 * });
 * const edgecaseResult = await edgecaseResponse.json();
 * console.log('Edge Cases Passed:', edgecaseResult.passed, '/', edgecaseResult.totalTests);
 *
 * // Run full test suite (all sports, all tests)
 * const fullsuiteResponse = await fetch('/api/v1/predictions/testing/fullsuite', {
 *   method: 'POST'
 * });
 * const fullsuiteResult = await fullsuiteResponse.json();
 * console.log('Full Suite Duration:', fullsuiteResult.duration, 'seconds');
 * console.log('NFL Accuracy:', fullsuiteResult.sports.NFL.backtest.overall.accuracy);
 *
 * // Retrieve test results by ID
 * const resultsResponse = await fetch(`/api/v1/predictions/testing/results?testId=${backtestResult.testId}`);
 * const results = await resultsResponse.json();
 *
 * // View test history
 * const historyResponse = await fetch('/api/v1/predictions/testing/history?limit=10');
 * const history = await historyResponse.json();
 * console.log('Recent Tests:', history.results);
 */

/**
 * Integration with CI/CD
 *
 * Add to GitHub Actions workflow:
 *
 * - name: Run Model Tests
 *   run: |
 *     # Run full test suite
 *     RESULT=$(curl -X POST https://blazesportsintel.com/api/v1/predictions/testing/fullsuite)
 *     TEST_ID=$(echo $RESULT | jq -r '.testId')
 *
 *     # Check results
 *     RESULTS=$(curl https://blazesportsintel.com/api/v1/predictions/testing/results?testId=$TEST_ID)
 *
 *     # Verify minimum accuracy thresholds
 *     NFL_ACC=$(echo $RESULTS | jq -r '.sports.NFL.backtest.overall.accuracy')
 *     if (( $(echo "$NFL_ACC < 65" | bc -l) )); then
 *       echo "NFL accuracy below threshold: $NFL_ACC%"
 *       exit 1
 *     fi
 *
 *     # Verify performance benchmarks
 *     LATENCY=$(echo $RESULTS | jq -r '.performance.overall.avgLatency')
 *     if (( $(echo "$LATENCY > 100" | bc -l) )); then
 *       echo "Latency exceeds threshold: ${LATENCY}ms"
 *       exit 1
 *     fi
 *
 *     echo "All tests passed!"
 */

/**
 * Scheduled testing via Cron Triggers
 *
 * Add to wrangler.toml:
 *
 * [triggers]
 * crons = ["0 2 * * *"]  # Run daily at 2am
 *
 * export default {
 *   async scheduled(event, env, ctx) {
 *     try {
 *       // Run full test suite
 *       const testResult = await runFullTestSuite(env);
 *
 *       // Store result
 *       const testId = `scheduled_${Date.now()}`;
 *       await env.SPORTS_DATA_KV.put(
 *         `test_result:${testId}`,
 *         JSON.stringify(testResult),
 *         { expirationTtl: 604800 } // 7 days for scheduled tests
 *       );
 *
 *       // Check for regression
 *       const nflAccuracy = testResult.sports.NFL?.backtest?.overall?.accuracy || 0;
 *       const mlbAccuracy = testResult.sports.MLB?.backtest?.overall?.accuracy || 0;
 *
 *       if (nflAccuracy < 65 || mlbAccuracy < 60) {
 *         // Send alert (implement your alerting mechanism)
 *         console.error('Model accuracy regression detected!');
 *         console.error('NFL:', nflAccuracy, '% | MLB:', mlbAccuracy, '%');
 *
 *         // Could integrate with Slack, email, PagerDuty, etc.
 *       }
 *
 *       console.log('Scheduled testing complete. Test ID:', testId);
 *     } catch (error) {
 *       console.error('Scheduled testing failed:', error);
 *     }
 *   }
 * };
 */
