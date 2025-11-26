#!/usr/bin/env node

/**
 * Blaze Intelligence Data Layer Test Suite
 * Tests all worker endpoints and validates responses
 */

const WORKER_URL = 'https://blaze-data-layer-prod.humphrey-austin20.workers.dev';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test utilities
async function fetchJSON(path) {
  const url = `${WORKER_URL}${path}`;
  console.log(`${colors.cyan}Testing: ${url}${colors.reset}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`${colors.red}✗ Failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function validateSchema(data, schema) {
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(data[key])) {
      throw new Error(`Invalid ${key}: expected ${validator.name}, got ${typeof data[key]}`);
    }
  }
}

// Validators
const isNumber = (x) => typeof x === 'number' && !isNaN(x);
const isString = (x) => typeof x === 'string';
const isArray = (x) => Array.isArray(x);
const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Test cases
const tests = [
  {
    name: 'Health Check',
    path: '/health',
    validate: (data) => {
      assert(data.status === 'ok', 'Status should be ok');
      assert(isString(data.timestamp), 'Timestamp should be a string');
      assert(isString(data.version), 'Version should be a string');
      console.log(`${colors.green}✓ Health: ${data.status}${colors.reset}`);
    },
  },
  {
    name: 'KPI Metrics',
    path: '/kpi',
    validate: (data) => {
      validateSchema(data, {
        predictionsToday: isNumber,
        activeClients: isNumber,
        avgResponseSec: isNumber,
        alertsProcessed: isNumber,
      });
      console.log(
        `${colors.green}✓ KPI: ${data.predictionsToday} predictions today${colors.reset}`
      );
    },
  },
  {
    name: 'Accuracy Analytics',
    path: '/analytics/accuracy',
    validate: (data) => {
      assert(isArray(data.labels), 'Labels should be an array');
      assert(isArray(data.values), 'Values should be an array');
      assert(
        data.labels.length === data.values.length,
        'Labels and values should have same length'
      );
      console.log(`${colors.green}✓ Accuracy: ${data.values.length} data points${colors.reset}`);
    },
  },
  {
    name: 'Alert Buckets',
    path: '/alerts/buckets',
    validate: (data) => {
      assert(isArray(data.labels), 'Labels should be an array');
      assert(isArray(data.counts), 'Counts should be an array');
      const totalAlerts = data.counts.reduce((a, b) => a + b, 0);
      console.log(`${colors.green}✓ Alerts: ${totalAlerts} total alerts${colors.reset}`);
    },
  },
  {
    name: 'MLB Teams',
    path: '/teams/MLB',
    validate: (data) => {
      assert(isArray(data), 'Teams should be an array');
      assert(data.length > 0, 'Should have at least one team');
      data.forEach((team) => {
        assert(isString(team.id), 'Team ID should be a string');
        assert(isString(team.name), 'Team name should be a string');
        assert(team.league === 'MLB', 'League should be MLB');
      });
      console.log(`${colors.green}✓ MLB Teams: ${data.length} teams loaded${colors.reset}`);
    },
  },
  {
    name: 'NFL Teams',
    path: '/teams/NFL',
    validate: (data) => {
      assert(isArray(data), 'Teams should be an array');
      assert(data.length > 0, 'Should have at least one team');
      const titans = data.find((t) => t.name.includes('Titans'));
      assert(titans, 'Should include Tennessee Titans');
      console.log(`${colors.green}✓ NFL Teams: Found ${titans.name}${colors.reset}`);
    },
  },
  {
    name: 'NBA Teams',
    path: '/teams/NBA',
    validate: (data) => {
      assert(isArray(data), 'Teams should be an array');
      const grizzlies = data.find((t) => t.name.includes('Grizzlies'));
      assert(grizzlies, 'Should include Memphis Grizzlies');
      console.log(`${colors.green}✓ NBA Teams: Found ${grizzlies.name}${colors.reset}`);
    },
  },
  {
    name: 'NCAA Teams',
    path: '/teams/NCAA',
    validate: (data) => {
      assert(isArray(data), 'Teams should be an array');
      const longhorns = data.find((t) => t.name.includes('Longhorns'));
      assert(longhorns, 'Should include Texas Longhorns');
      console.log(`${colors.green}✓ NCAA Teams: Found ${longhorns.name}${colors.reset}`);
    },
  },
  {
    name: 'Leaderboard',
    path: '/multiplayer/leaderboard',
    validate: (data) => {
      assert(isArray(data), 'Leaderboard should be an array');
      assert(data.length > 0, 'Should have at least one player');
      data.forEach((player) => {
        assert(isString(player.name), 'Player name should be a string');
        assert(isNumber(player.score), 'Player score should be a number');
      });
      const topPlayer = data.sort((a, b) => b.score - a.score)[0];
      console.log(
        `${colors.green}✓ Leaderboard: ${topPlayer.name} leads with ${topPlayer.score} points${colors.reset}`
      );
    },
  },
  {
    name: 'Yearly Trend',
    path: '/analytics/yearly-trend',
    validate: (data) => {
      assert(isArray(data.labels), 'Labels should be an array');
      assert(isArray(data.values), 'Values should be an array');
      assert(data.labels.length === 12, 'Should have 12 months');
      const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      console.log(`${colors.green}✓ Yearly Trend: ${avg.toFixed(1)} average${colors.reset}`);
    },
  },
];

// Performance test
async function performanceTest() {
  console.log(`\n${colors.blue}=== Performance Test ===${colors.reset}`);

  const endpoints = ['/health', '/kpi', '/analytics/accuracy', '/multiplayer/leaderboard'];
  const times = [];

  for (const endpoint of endpoints) {
    const start = Date.now();
    await fetch(`${WORKER_URL}${endpoint}`);
    const time = Date.now() - start;
    times.push(time);
    console.log(`${endpoint}: ${time}ms`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`${colors.green}Average response time: ${avg.toFixed(0)}ms${colors.reset}`);

  if (avg < 200) {
    console.log(`${colors.green}✓ Excellent performance!${colors.reset}`);
  } else if (avg < 500) {
    console.log(`${colors.yellow}⚠ Good performance, could be optimized${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Performance needs improvement${colors.reset}`);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Blaze Intelligence Data Layer Test Suite║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nWorker URL: ${WORKER_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n${colors.yellow}Running: ${test.name}${colors.reset}`);
    try {
      const data = await fetchJSON(test.path);
      test.validate(data);
      passed++;
    } catch (error) {
      console.error(`${colors.red}✗ ${test.name} failed: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Run performance test
  await performanceTest();

  // Summary
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}`);
    console.log(
      `${colors.green}The Blaze Intelligence Data Layer is fully operational!${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.red}⚠️ Some tests failed. Please check the worker logs.${colors.reset}`
    );
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
