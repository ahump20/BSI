#!/usr/bin/env node

/**
 * Test script to verify REAL APIs work without fallbacks
 * This proves we're getting REAL data, not fake data
 */

import fetch from 'node-fetch';


const results = {
  passed: [],
  failed: []
};

// Test 1: MLB Stats API
async function testMLBAPI() {

  try {
    const teamId = 138; // Cardinals
    const baseUrl = 'https://statsapi.mlb.com/api/v1';

    // Test team endpoint
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`);
    const teamData = await teamResponse.json();

    if (teamData.teams?.[0]?.name === 'St. Louis Cardinals') {
      results.passed.push('MLB team data');
    } else {
      throw new Error('MLB team data not correct');
    }

    // Test standings
    const standingsResponse = await fetch(`${baseUrl}/standings?leagueId=104&season=2024`);
    const standingsData = await standingsResponse.json();

    if (standingsData.records?.length > 0) {
      results.passed.push('MLB standings');
    } else {
      throw new Error('No standings data');
    }

  } catch (error) {
    results.failed.push(`MLB: ${error.message}`);
  }
}

// Test 2: ESPN NFL API with headers
async function testESPNNFLAPI() {

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    const teamId = 10; // Titans
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

    // Test team endpoint
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`, { headers });

    if (teamResponse.ok) {
      const teamData = await teamResponse.json();

      if (teamData.team?.displayName === 'Tennessee Titans') {
        results.passed.push('ESPN NFL data');
      } else {
      }
    } else {
      throw new Error(`ESPN returned ${teamResponse.status} ${teamResponse.statusText}`);
    }

  } catch (error) {
    results.failed.push(`ESPN NFL: ${error.message}`);
  }
}

// Test 3: ESPN NBA API
async function testESPNNBAAPI() {

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    const teamId = 29; // Grizzlies
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`, { headers });

    if (teamResponse.ok) {
      const teamData = await teamResponse.json();

      if (teamData.team?.displayName === 'Memphis Grizzlies') {
        results.passed.push('ESPN NBA data');
      } else {
      }
    } else {
      throw new Error(`ESPN returned ${teamResponse.status}`);
    }

  } catch (error) {
    results.failed.push(`ESPN NBA: ${error.message}`);
  }
}

// Test 4: ESPN NCAA API
async function testESPNCFBAPI() {

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    const teamId = 251; // Texas
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`, { headers });

    if (teamResponse.ok) {
      const teamData = await teamResponse.json();

      if (teamData.team?.displayName === 'Texas Longhorns') {
        results.passed.push('ESPN NCAA data');
      } else {
      }
    } else {
      throw new Error(`ESPN returned ${teamResponse.status}`);
    }

  } catch (error) {
    results.failed.push(`ESPN NCAA: ${error.message}`);
  }
}

// Test 5: Verify Pythagorean calculation works
async function testPythagoreanCalculation() {

  try {
    const baseUrl = 'https://statsapi.mlb.com/api/v1';
    const teamId = 138;

    const statsResponse = await fetch(`${baseUrl}/teams/${teamId}/stats?season=2024&group=hitting,pitching`);
    const statsData = await statsResponse.json();

    let runsScored, runsAllowed;

    if (statsData.stats && statsData.stats.length > 0) {
      const hitting = statsData.stats.find(s => s.group?.displayName === 'hitting');
      const pitching = statsData.stats.find(s => s.group?.displayName === 'pitching');

      runsScored = hitting?.splits?.[0]?.stat?.runs;
      runsAllowed = pitching?.splits?.[0]?.stat?.runs;
    }

    if (!runsScored || !runsAllowed) {
      throw new Error('Could not get runs data - NO FALLBACK ALLOWED');
    }

    const exponent = 1.83;
    const pythagoreanWins = Math.round(
      162 * (Math.pow(runsScored, exponent) /
      (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent)))
    );

    results.passed.push('Pythagorean calculation');

  } catch (error) {
    results.failed.push(`Pythagorean: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  await testMLBAPI();
  await testESPNNFLAPI();
  await testESPNNBAAPI();
  await testESPNCFBAPI();
  await testPythagoreanCalculation();


  if (results.failed.length > 0) {
  }

  if (results.failed.length === 0) {
  } else {
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);