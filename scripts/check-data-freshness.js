#!/usr/bin/env node
/**
 * Data Freshness Check Script
 *
 * Verifies that API endpoints return data updated within the last 24 hours
 * Usage: node check-data-freshness.js <sport>
 * Example: node check-data-freshness.js mlb
 */

const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';
const MAX_AGE_HOURS = 24;

const endpoints = {
  mlb: ['/api/mlb/cardinals', '/api/mlb/standings', '/api/mlb/players?teamId=138'],
  nfl: ['/api/nfl/titans', '/api/nfl/standings', '/api/nfl/scores'],
  nba: ['/api/nba/teams', '/api/nba/standings'],
  'college-baseball': ['/api/college-baseball/teams', '/api/college-baseball/schedule'],
};

async function checkFreshness(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
      console.error(`  ❌ ${endpoint}: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();

    if (!data.lastUpdated) {
      console.error(`  ❌ ${endpoint}: No lastUpdated field`);
      return false;
    }

    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const ageHours = (now - lastUpdated) / (1000 * 60 * 60);

    if (ageHours > MAX_AGE_HOURS) {
      console.error(
        `  ❌ ${endpoint}: Data is ${ageHours.toFixed(1)} hours old (> ${MAX_AGE_HOURS} hours)`
      );
      return false;
    }

    console.log(`  ✅ ${endpoint}: Data is ${ageHours.toFixed(1)} hours old`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${endpoint}: ${error.message}`);
    return false;
  }
}

async function checkSport(sport) {
  console.log(`\n📊 Checking ${sport.toUpperCase()} data freshness...\n`);

  const sportEndpoints = endpoints[sport];
  if (!sportEndpoints) {
    console.error(`Unknown sport: ${sport}`);
    console.error(`Available sports: ${Object.keys(endpoints).join(', ')}`);
    process.exit(1);
  }

  const results = await Promise.all(sportEndpoints.map(checkFreshness));
  const allFresh = results.every((r) => r);

  console.log('\n' + '='.repeat(60));

  if (allFresh) {
    console.log(`✅ All ${sport.toUpperCase()} endpoints have fresh data\n`);
    return true;
  } else {
    console.log(`❌ Some ${sport.toUpperCase()} endpoints have stale data\n`);
    return false;
  }
}

async function main() {
  const sport = process.argv[2];

  if (!sport) {
    console.error('Usage: node check-data-freshness.js <sport>');
    console.error(`Available sports: ${Object.keys(endpoints).join(', ')}`);
    process.exit(1);
  }

  console.log('🔍 Data Freshness Check');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Max age: ${MAX_AGE_HOURS} hours`);

  const success = await checkSport(sport);

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
