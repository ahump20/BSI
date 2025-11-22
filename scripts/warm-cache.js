#!/usr/bin/env node
/**
 * Cache Warming Script
 *
 * Pre-warms cache for popular teams and frequently accessed endpoints
 * Usage: node warm-cache.js <sport>
 * Example: node warm-cache.js mlb
 */

const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';

const popularTeams = {
  mlb: [
    'cardinals', 'dodgers', 'yankees', 'red-sox', 'cubs', 'giants',
    'braves', 'astros', 'mets', 'phillies',
  ],
  nfl: [
    'titans', 'chiefs', 'cowboys', 'patriots', '49ers', 'packers',
    'eagles', 'bills', 'bengals', 'rams',
  ],
  nba: [
    'lakers', 'warriors', 'celtics', 'nets', 'bucks', 'heat',
    'mavericks', 'suns', 'nuggets', 'clippers',
  ],
  'college-baseball': [
    'texas', 'lsu', 'vanderbilt', 'tennessee', 'arkansas', 'florida',
    'mississippi-state', 'ole-miss', 'stanford', 'oregon-state',
  ],
};

const commonEndpoints = {
  mlb: ['/api/mlb/standings', '/api/mlb/scores'],
  nfl: ['/api/nfl/standings', '/api/nfl/scores'],
  nba: ['/api/nba/standings', '/api/nba/scores'],
  'college-baseball': ['/api/college-baseball/schedule', '/api/college-baseball/rankings'],
};

async function warmEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (response.ok) {
      console.log(`  ✅ Warmed: ${endpoint}`);
      return true;
    } else {
      console.log(`  ⚠️  Failed: ${endpoint} (HTTP ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${endpoint} - ${error.message}`);
    return false;
  }
}

async function warmSport(sport) {
  console.log(`\n🔥 Warming ${sport.toUpperCase()} cache...\n`);

  const teams = popularTeams[sport] || [];
  const endpoints = commonEndpoints[sport] || [];

  // Warm popular teams
  console.log('Popular teams:');
  const teamResults = await Promise.all(
    teams.map((team) => warmEndpoint(`/api/${sport}/${team}`))
  );

  // Warm common endpoints
  console.log('\nCommon endpoints:');
  const endpointResults = await Promise.all(
    endpoints.map(warmEndpoint)
  );

  const totalWarmed = teamResults.filter(Boolean).length + endpointResults.filter(Boolean).length;
  const totalAttempted = teams.length + endpoints.length;

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Warmed ${totalWarmed}/${totalAttempted} endpoints for ${sport.toUpperCase()}\n`);

  return totalWarmed === totalAttempted;
}

async function main() {
  const sport = process.argv[2];

  if (!sport) {
    console.error('Usage: node warm-cache.js <sport>');
    console.error(`Available sports: ${Object.keys(popularTeams).join(', ')}`);
    process.exit(1);
  }

  if (!popularTeams[sport]) {
    console.error(`Unknown sport: ${sport}`);
    console.error(`Available sports: ${Object.keys(popularTeams).join(', ')}`);
    process.exit(1);
  }

  console.log('🔥 Cache Warming Script');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Sport: ${sport.toUpperCase()}`);

  const success = await warmSport(sport);

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
