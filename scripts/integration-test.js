#!/usr/bin/env node

/**
 * INTEGRATION TEST SUITE
 * Staff Engineer Orchestrator: Comprehensive System Validation
 * Tests TypeScript → JavaScript compilation and runtime functionality
 */

import { getMlbTeam, getMlbStandings } from '../lib/api/mlb.js';
import { toTeamCardView as mlbTeamView, toStandingsView as mlbStandingsView } from '../lib/adapters/mlb.js';
import { getNflTeam, getNflStandings } from '../lib/api/nfl.js';
import { toTeamCardView as nflTeamView, toStandingsView as nflStandingsView } from '../lib/adapters/nfl.js';

const TEST_CONFIGS = {
  MLB: {
    teamId: '138', // St. Louis Cardinals
    sport: 'MLB',
    expectation: 'Cardinals'
  },
  NFL: {
    teamId: '10', // Tennessee Titans
    sport: 'NFL',
    expectation: 'Titans'
  }
};

class IntegrationTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.startTime = Date.now();
  }

  async assert(condition, message, level = 'error') {
    if (condition) {
      this.results.passed++;
      return true;
    } else {
      if (level === 'warning') {
        this.results.warnings++;
      } else {
        this.results.failed++;
        this.results.errors.push(message);
      }
      return false;
    }
  }

  async testMlbIntegration() {

    try {
      // Test API layer
      const teamData = await getMlbTeam(TEST_CONFIGS.MLB.teamId);

      await this.assert(
        teamData && typeof teamData === 'object',
        'MLB team API returns valid object'
      );

      await this.assert(
        teamData.team && teamData.team.name,
        'MLB team data contains team.name field'
      );

      const standingsData = await getMlbStandings();
      await this.assert(
        standingsData && Array.isArray(standingsData.divisions),
        'MLB standings API returns divisions array'
      );

      // Test adapter layer
      const teamViewModel = mlbTeamView(teamData);

      await this.assert(
        teamViewModel.name.includes(TEST_CONFIGS.MLB.expectation),
        `MLB team view model contains "${TEST_CONFIGS.MLB.expectation}"`
      );

      await this.assert(
        teamViewModel.dataSource && teamViewModel.dataSource.length > 0,
        'MLB team view model has data source'
      );

      const standingsViewModel = mlbStandingsView(standingsData);
      await this.assert(
        standingsViewModel.division && standingsViewModel.division.length > 0,
        'MLB standings view model has division data'
      );


    } catch (error) {
      await this.assert(false, `MLB Integration failed: ${error.message}`);
    }
  }

  async testNflIntegration() {

    try {
      // Test API layer
      const teamData = await getNflTeam(TEST_CONFIGS.NFL.teamId);

      await this.assert(
        teamData && typeof teamData === 'object',
        'NFL team API returns valid object'
      );

      await this.assert(
        teamData.team && teamData.team.name,
        'NFL team data contains team.name field'
      );

      const standingsData = await getNflStandings();
      await this.assert(
        standingsData && typeof standingsData === 'object',
        'NFL standings API returns valid object'
      );

      // Test adapter layer
      const teamViewModel = nflTeamView(teamData);

      await this.assert(
        teamViewModel.name.includes(TEST_CONFIGS.NFL.expectation),
        `NFL team view model contains "${TEST_CONFIGS.NFL.expectation}"`
      );

      await this.assert(
        teamViewModel.dataSource && teamViewModel.dataSource.length > 0,
        'NFL team view model has data source'
      );

      const standingsViewModel = nflStandingsView(standingsData);
      await this.assert(
        standingsViewModel.conference && standingsViewModel.conference.length > 0,
        'NFL standings view model has conference data'
      );


    } catch (error) {
      await this.assert(false, `NFL Integration failed: ${error.message}`);
    }
  }

  async testTypeScriptCompilation() {

    // Test that imports resolve correctly
    await this.assert(
      typeof getMlbTeam === 'function',
      'MLB API functions imported correctly'
    );

    await this.assert(
      typeof getNflTeam === 'function',
      'NFL API functions imported correctly'
    );

    await this.assert(
      typeof mlbTeamView === 'function',
      'MLB adapter functions imported correctly'
    );

    await this.assert(
      typeof nflTeamView === 'function',
      'NFL adapter functions imported correctly'
    );

  }

  async testErrorHandling() {

    try {
      // Test invalid team ID
      const invalidTeamResult = await getMlbTeam('99999');
      await this.assert(
        invalidTeamResult !== null,
        'Invalid team ID returns fallback data (not null)',
        'warning'
      );

      // Test adapter with null data
      const nullAdapterResult = mlbTeamView(null);
      await this.assert(
        nullAdapterResult && nullAdapterResult.name,
        'Adapter handles null input gracefully'
      );


    } catch (error) {
      await this.assert(false, `Error handling test failed: ${error.message}`);
    }
  }

  async runAll() {

    await this.testTypeScriptCompilation();
    await this.testMlbIntegration();
    await this.testNflIntegration();
    await this.testErrorHandling();

    // Summary
    const duration = Date.now() - this.startTime;

    if (this.results.failed > 0) {
      process.exit(1);
    }

  }
}

// Run the test suite
const runner = new IntegrationTestRunner();
runner.runAll().catch(error => {
  console.error('🚨 Test runner failed:', error);
  process.exit(1);
});