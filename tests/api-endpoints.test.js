#!/usr/bin/env node

/**
 * API Endpoints Test Suite
 * Tests all enhanced API endpoints for functionality and data integrity
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';
const TEST_RESULTS = [];

class APITester {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    await this.testHealthEndpoint();
    await this.testTeamsEndpoints();
    await this.testPlayersEndpoints();
    await this.testGamesEndpoints();
    await this.testStandingsEndpoints();
    await this.testAnalyticsEndpoints();
    await this.testFallbackLogic();

    this.printSummary();
  }

  async test(name, testFunction) {
    this.totalTests++;
    try {
      const result = await testFunction();
      if (result) {
        this.passedTests++;
        TEST_RESULTS.push({ name, status: 'PASS', error: null });
      } else {
        this.failedTests++;
        TEST_RESULTS.push({ name, status: 'FAIL', error: 'Test returned false' });
      }
    } catch (error) {
      this.failedTests++;
      TEST_RESULTS.push({ name, status: 'FAIL', error: error.message });
    }
  }

  async apiCall(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  async testHealthEndpoint() {
    await this.test('Health endpoint responds', async () => {
      const health = await this.apiCall('/health');
      return health.status === 'healthy' && health.database === 'connected';
    });
  }

  async testTeamsEndpoints() {
    await this.test('Teams list endpoint', async () => {
      const teams = await this.apiCall('/api/teams');
      return teams.success && Array.isArray(teams.teams) && teams.teams.length > 0;
    });

    await this.test('Teams filtering by sport', async () => {
      const mlbTeams = await this.apiCall('/api/teams?sport=MLB');
      return mlbTeams.success && mlbTeams.teams.every((team) => team.sport === 'MLB');
    });

    await this.test('Individual team by ID', async () => {
      const team = await this.apiCall('/api/teams/1');
      return team.success && team.team && team.team.id === 1;
    });

    await this.test('Individual team by external ID', async () => {
      const team = await this.apiCall('/api/teams/138');
      return team.success && team.team && team.team.external_id === '138';
    });
  }

  async testPlayersEndpoints() {
    await this.test('Players list endpoint', async () => {
      const players = await this.apiCall('/api/players');
      return players.success && Array.isArray(players.players) && players.players.length > 0;
    });

    await this.test('Players filtering by sport', async () => {
      const mlbPlayers = await this.apiCall('/api/players?sport=MLB');
      return mlbPlayers.success && mlbPlayers.players.every((player) => player.sport === 'MLB');
    });

    await this.test('Players filtering by position', async () => {
      const qbs = await this.apiCall('/api/players?position=QB');
      return qbs.success && qbs.players.every((player) => player.position === 'QB');
    });

    await this.test('Player has required fields', async () => {
      const players = await this.apiCall('/api/players?limit=1');
      const player = players.players[0];
      return player.first_name && player.last_name && player.sport && player.team_name;
    });
  }

  async testGamesEndpoints() {
    await this.test('Games list endpoint', async () => {
      const games = await this.apiCall('/api/games');
      return games.success && Array.isArray(games.games);
    });

    await this.test('Games filtering by sport', async () => {
      const mlbGames = await this.apiCall('/api/games?sport=MLB');
      return (
        mlbGames.success &&
        (mlbGames.games.length === 0 || mlbGames.games.every((game) => game.sport === 'MLB'))
      );
    });

    await this.test('Games include team names', async () => {
      const games = await this.apiCall('/api/games?limit=1');
      if (games.games.length === 0) return true; // No games is acceptable
      const game = games.games[0];
      return game.home_team_name && game.away_team_name;
    });
  }

  async testStandingsEndpoints() {
    await this.test('MLB standings endpoint', async () => {
      const standings = await this.apiCall('/api/standings/MLB');
      return standings.success && standings.sport === 'MLB' && Array.isArray(standings.standings);
    });

    await this.test('NFL standings endpoint', async () => {
      const standings = await this.apiCall('/api/standings/NFL');
      return standings.success && standings.sport === 'NFL' && Array.isArray(standings.standings);
    });

    await this.test('Standings include win/loss records', async () => {
      const standings = await this.apiCall('/api/standings/MLB');
      if (standings.standings.length === 0) return true;
      const team = standings.standings[0];
      return team.wins !== undefined && team.losses !== undefined;
    });
  }

  async testAnalyticsEndpoints() {
    await this.test('Team analytics by ID', async () => {
      const analytics = await this.apiCall('/api/analytics/team/1');
      // May return null team if no data, which is acceptable
      return analytics.success !== false; // Just check it doesn't fail completely
    });

    await this.test('Team analytics includes game statistics', async () => {
      const analytics = await this.apiCall('/api/analytics/team/1');
      return analytics.game_statistics !== undefined && analytics.calculated_metrics !== undefined;
    });
  }

  async testFallbackLogic() {
    await this.test('MLB endpoint handles external API failure', async () => {
      const mlb = await this.apiCall('/api/mlb/138');
      // Should succeed with fallback data and stale warning
      return mlb.success && mlb.stale_data_warning === true;
    });

    await this.test('NFL endpoint handles external API failure', async () => {
      const nfl = await this.apiCall('/api/nfl/10');
      // Should succeed with fallback data and stale warning
      return nfl.success && nfl.stale_data_warning === true;
    });

    await this.test('Fallback includes data source attribution', async () => {
      const mlb = await this.apiCall('/api/mlb/138');
      return mlb.dataSource && mlb.dataSource.includes('unavailable');
    });
  }

  printSummary() {
    if (this.failedTests > 0) {
      TEST_RESULTS.filter((result) => result.status === 'FAIL').forEach((result) => {});
    }

    // Exit with appropriate code
    process.exit(this.failedTests === 0 ? 0 : 1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester();

  // Check if server is running
  fetch(`${API_BASE}/health`)
    .then(() => {
      tester.runAllTests();
    })
    .catch((error) => {
      console.error('❌ API server is not running!');
      console.error('Please start the server first: node api/enhanced-server.js');
      process.exit(1);
    });
}

export default APITester;
