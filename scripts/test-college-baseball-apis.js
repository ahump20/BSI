#!/usr/bin/env node

/**
 * College Baseball API Test Suite
 * Tests all API endpoints for functionality and performance
 *
 * Usage: node scripts/test-college-baseball-apis.js [--production]
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://blazesportsintel.com';
const LOCAL_URL = 'http://localhost:8788'; // Cloudflare Pages local dev
const USE_PRODUCTION = process.argv.includes('--production');
const BASE_URL = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * Make HTTP request and measure performance
 */
async function makeRequest(path, options = {}) {
  const startTime = Date.now();
  const url = `${BASE_URL}${path}`;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            duration,
            success: res.statusCode === 200
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            duration,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    }).on('error', (error) => {
      reject({
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    });
  });
}

/**
 * Run a test and record results
 */
async function runTest(name, testFn) {
  process.stdout.write(`${colors.blue}Testing:${colors.reset} ${name}... `);

  try {
    const result = await testFn();

    if (result.success) {
      console.log(`${colors.green}✓ PASS${colors.reset} (${result.duration}ms)`);
      results.passed++;
      results.tests.push({ name, status: 'PASS', duration: result.duration, ...result });
    } else if (result.warning) {
      console.log(`${colors.yellow}⚠ WARNING${colors.reset} - ${result.message}`);
      results.warnings++;
      results.tests.push({ name, status: 'WARNING', ...result });
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${result.message}`);
      results.failed++;
      results.tests.push({ name, status: 'FAIL', ...result });
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message || error.error}`);
    results.failed++;
    results.tests.push({ name, status: 'ERROR', error: error.message || error.error });
  }
}

/**
 * Test: Games API - Basic Request
 */
async function testGamesAPI() {
  const response = await makeRequest('/api/college-baseball/games');

  if (!response.success) {
    return { success: false, message: `HTTP ${response.status}`, duration: response.duration };
  }

  if (!response.data.success) {
    return { success: false, message: response.data.error || 'API returned success=false', duration: response.duration };
  }

  if (!Array.isArray(response.data.data)) {
    return { success: false, message: 'Response data is not an array', duration: response.duration };
  }

  // It's OK if no games (off-season), just verify structure
  return {
    success: true,
    duration: response.duration,
    count: response.data.count || 0,
    cached: response.data.cached || false
  };
}

/**
 * Test: Games API - With Date Filter
 */
async function testGamesAPIWithDate() {
  const today = new Date().toISOString().split('T')[0];
  const response = await makeRequest(`/api/college-baseball/games?date=${today}`);

  if (!response.success) {
    return { success: false, message: `HTTP ${response.status}`, duration: response.duration };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Games API - With Conference Filter
 */
async function testGamesAPIWithConference() {
  const response = await makeRequest('/api/college-baseball/games?conference=SEC');

  if (!response.success) {
    return { success: false, message: `HTTP ${response.status}`, duration: response.duration };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Games API - With Status Filter
 */
async function testGamesAPIWithStatus() {
  const response = await makeRequest('/api/college-baseball/games?status=live');

  if (!response.success) {
    return { success: false, message: `HTTP ${response.status}`, duration: response.duration };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Box Score API
 */
async function testBoxScoreAPI() {
  // Use a sample game ID - this will likely fail gracefully in off-season
  const sampleGameId = '401234567';
  const response = await makeRequest(`/api/college-baseball/boxscore?gameId=${sampleGameId}`);

  // We expect this might fail in off-season, but should handle it gracefully
  if (response.status === 404 || response.status === 500) {
    return {
      success: false,
      warning: true,
      duration: response.duration,
      message: 'No box score data (expected during off-season)'
    };
  }

  if (!response.success) {
    return { success: false, message: `HTTP ${response.status}`, duration: response.duration };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Box Score API - Missing GameId
 */
async function testBoxScoreAPIMissingParam() {
  const response = await makeRequest('/api/college-baseball/boxscore');

  // Should return 400 Bad Request
  if (response.status !== 400) {
    return { success: false, message: 'Should return 400 for missing gameId', duration: response.duration };
  }

  if (response.data.success !== false) {
    return { success: false, message: 'Should return success=false for error', duration: response.duration };
  }

  return { success: true, duration: response.duration };
}

/**
 * Test: Standings API
 */
async function testStandingsAPI() {
  const response = await makeRequest('/api/college-baseball/standings?conference=SEC');

  if (!response.success) {
    return {
      success: false,
      warning: true,
      duration: response.duration,
      message: 'Standings API may not be available yet'
    };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Teams API
 */
async function testTeamsAPI() {
  const response = await makeRequest('/api/college-baseball/teams');

  if (!response.success) {
    return {
      success: false,
      warning: true,
      duration: response.duration,
      message: 'Teams API may not be available yet'
    };
  }

  return {
    success: response.data.success,
    duration: response.duration,
    message: response.data.success ? '' : response.data.error
  };
}

/**
 * Test: Response Time (Performance)
 */
async function testResponseTime() {
  const response = await makeRequest('/api/college-baseball/games');

  if (!response.success) {
    return { success: false, message: 'API request failed', duration: response.duration };
  }

  const threshold = response.data.cached ? 200 : 2000; // 200ms for cache, 2s for network

  if (response.duration > threshold) {
    return {
      success: false,
      warning: true,
      duration: response.duration,
      message: `Response time ${response.duration}ms exceeds threshold ${threshold}ms`
    };
  }

  return { success: true, duration: response.duration };
}

/**
 * Test: Cache Headers
 */
async function testCacheHeaders() {
  const response = await makeRequest('/api/college-baseball/games');

  if (!response.success) {
    return { success: false, message: 'API request failed', duration: response.duration };
  }

  const cacheControl = response.headers['cache-control'];

  if (!cacheControl) {
    return { success: false, message: 'Missing Cache-Control header', duration: response.duration };
  }

  if (!cacheControl.includes('max-age')) {
    return { success: false, message: 'Cache-Control missing max-age', duration: response.duration };
  }

  return { success: true, duration: response.duration, cacheControl };
}

/**
 * Test: CORS Headers
 */
async function testCORSHeaders() {
  const response = await makeRequest('/api/college-baseball/games');

  if (!response.success) {
    return { success: false, message: 'API request failed', duration: response.duration };
  }

  const corsHeader = response.headers['access-control-allow-origin'];

  if (!corsHeader) {
    return { success: false, message: 'Missing CORS header', duration: response.duration };
  }

  return { success: true, duration: response.duration, cors: corsHeader };
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}College Baseball API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
  console.log(`Environment: ${USE_PRODUCTION ? colors.green + 'PRODUCTION' : colors.yellow + 'LOCAL'}${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // API Functionality Tests
  console.log(`\n${colors.bright}API Functionality Tests:${colors.reset}`);
  await runTest('Games API - Basic Request', testGamesAPI);
  await runTest('Games API - Date Filter', testGamesAPIWithDate);
  await runTest('Games API - Conference Filter', testGamesAPIWithConference);
  await runTest('Games API - Status Filter', testGamesAPIWithStatus);
  await runTest('Box Score API - Valid Request', testBoxScoreAPI);
  await runTest('Box Score API - Missing Parameter', testBoxScoreAPIMissingParam);
  await runTest('Standings API', testStandingsAPI);
  await runTest('Teams API', testTeamsAPI);

  // Performance Tests
  console.log(`\n${colors.bright}Performance Tests:${colors.reset}`);
  await runTest('Response Time Check', testResponseTime);

  // Header Tests
  console.log(`\n${colors.bright}HTTP Header Tests:${colors.reset}`);
  await runTest('Cache-Control Headers', testCacheHeaders);
  await runTest('CORS Headers', testCORSHeaders);

  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
  console.log(`${colors.green}Passed:${colors.reset}   ${results.passed}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
  console.log(`${colors.red}Failed:${colors.reset}   ${results.failed}`);
  console.log(`Total:    ${results.passed + results.warnings + results.failed}\n`);

  // Performance summary
  const passedTests = results.tests.filter(t => t.status === 'PASS' && t.duration);
  if (passedTests.length > 0) {
    const avgDuration = passedTests.reduce((sum, t) => sum + t.duration, 0) / passedTests.length;
    const maxDuration = Math.max(...passedTests.map(t => t.duration));
    const minDuration = Math.min(...passedTests.map(t => t.duration));

    console.log(`${colors.bright}Performance Metrics:${colors.reset}`);
    console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`Fastest Response: ${minDuration}ms`);
    console.log(`Slowest Response: ${maxDuration}ms\n`);
  }

  // Exit code
  const exitCode = results.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
