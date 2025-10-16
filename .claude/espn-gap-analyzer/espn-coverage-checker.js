#!/usr/bin/env node

/**
 * ESPN Coverage Checker
 *
 * Tests ESPN's APIs and endpoints to validate actual coverage levels for each sport.
 * Verifies what features ESPN provides (or doesn't provide) to confirm gap analysis.
 *
 * Checks:
 * - API endpoint availability
 * - Data completeness (box scores, player stats, previews, recaps)
 * - Response structure and content depth
 * - Real-time data freshness
 *
 * Output:
 * - Validated coverage report (actual vs expected)
 * - API response samples
 * - Missing feature documentation
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  OUTPUT_DIR: path.join(__dirname, 'reports', 'coverage-validation'),
  TIMESTAMP_TIMEZONE: 'America/Chicago',

  // ESPN API endpoints to test
  ESPN_ENDPOINTS: {
    'college-baseball': {
      base: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball',
      tests: [
        {
          name: 'Scoreboard',
          path: '/scoreboard',
          check: 'exists'
        },
        {
          name: 'Box Score',
          path: '/summary', // Requires game ID
          check: 'requires_game_id',
          expected_fields: ['boxscore', 'plays', 'article']
        },
        {
          name: 'Teams',
          path: '/teams',
          check: 'exists'
        },
        {
          name: 'Standings',
          path: '/standings',
          check: 'exists'
        }
      ]
    },
    'mlb': {
      base: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
      tests: [
        {
          name: 'Scoreboard',
          path: '/scoreboard',
          check: 'exists'
        },
        {
          name: 'Box Score',
          path: '/summary',
          check: 'requires_game_id',
          expected_fields: ['boxscore', 'plays', 'article']
        },
        {
          name: 'Teams',
          path: '/teams',
          check: 'exists'
        },
        {
          name: 'Standings',
          path: '/standings',
          check: 'exists'
        }
      ]
    },
    'nfl': {
      base: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
      tests: [
        {
          name: 'Scoreboard',
          path: '/scoreboard',
          check: 'exists'
        },
        {
          name: 'Box Score',
          path: '/summary',
          check: 'requires_game_id',
          expected_fields: ['boxscore', 'drives', 'plays', 'article']
        },
        {
          name: 'Teams',
          path: '/teams',
          check: 'exists'
        },
        {
          name: 'Standings',
          path: '/standings',
          check: 'exists'
        }
      ]
    },
    'ncaa-football': {
      base: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football',
      tests: [
        {
          name: 'Scoreboard',
          path: '/scoreboard',
          check: 'exists'
        },
        {
          name: 'Box Score',
          path: '/summary',
          check: 'requires_game_id',
          expected_fields: ['boxscore', 'drives', 'plays', 'article']
        },
        {
          name: 'Teams',
          path: '/teams',
          check: 'exists'
        },
        {
          name: 'Standings',
          path: '/standings',
          check: 'exists'
        }
      ]
    },
    'ncaa-basketball': {
      base: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball',
      tests: [
        {
          name: 'Scoreboard',
          path: '/scoreboard',
          check: 'exists'
        },
        {
          name: 'Box Score',
          path: '/summary',
          check: 'requires_game_id',
          expected_fields: ['boxscore', 'plays', 'article']
        },
        {
          name: 'Teams',
          path: '/teams',
          check: 'exists'
        },
        {
          name: 'Standings',
          path: '/standings',
          check: 'exists'
        }
      ]
    }
  },

  // Feature detection criteria
  FEATURE_CHECKS: {
    'full-box-scores': {
      required_fields: ['boxscore', 'boxscore.players', 'boxscore.teams'],
      depth_check: (data) => {
        // Check if player statistics are present
        if (!data.boxscore || !data.boxscore.players) return 0;

        const playerCount = data.boxscore.players.reduce((sum, team) => {
          return sum + (team.statistics?.length || 0);
        }, 0);

        return playerCount > 0 ? 10 : 0;
      }
    },
    'player-stats': {
      required_fields: ['boxscore.players', 'boxscore.players[0].statistics'],
      depth_check: (data) => {
        if (!data.boxscore?.players?.[0]?.statistics) return 0;

        const statCategories = data.boxscore.players[0].statistics[0]?.stats?.length || 0;
        return Math.min(10, statCategories);
      }
    },
    'game-previews': {
      required_fields: ['article', 'article.story'],
      depth_check: (data) => {
        if (!data.article) return 0;

        const hasPreview = data.article.story?.toLowerCase().includes('preview');
        return hasPreview ? 7 : 0;
      }
    },
    'game-recaps': {
      required_fields: ['article', 'article.story'],
      depth_check: (data) => {
        if (!data.article) return 0;

        const hasRecap = data.article.story?.toLowerCase().includes('recap') ||
                        data.article.headline?.toLowerCase().includes('recap');
        return hasRecap ? 8 : 0;
      }
    },
    'live-play-by-play': {
      required_fields: ['plays', 'plays.items'],
      depth_check: (data) => {
        if (!data.plays?.items) return 0;

        const playCount = data.plays.items.length;
        return Math.min(10, Math.floor(playCount / 10));
      }
    }
  }
};

class ESPNCoverageChecker {
  constructor() {
    this.results = {};
    this.timestamp = new Date().toLocaleString('en-US', {
      timeZone: CONFIG.TIMESTAMP_TIMEZONE
    });
  }

  async check() {
    console.log('🔍 ESPN Coverage Checker');
    console.log('='.repeat(50));
    console.log(`Check Time: ${this.timestamp}`);
    console.log('');

    // Check each sport
    for (const [sportKey, sportConfig] of Object.entries(CONFIG.ESPN_ENDPOINTS)) {
      console.log(`Checking: ${sportKey}`);
      await this.checkSport(sportKey, sportConfig);
    }

    // Generate validation report
    await this.generateReport();

    console.log('\n✅ Coverage check complete. Report saved to:', CONFIG.OUTPUT_DIR);
  }

  async checkSport(sportKey, sportConfig) {
    const sportResults = {
      sport: sportKey,
      base_url: sportConfig.base,
      endpoints: [],
      features_detected: {},
      overall_score: 0
    };

    for (const test of sportConfig.tests) {
      console.log(`  Testing: ${test.name}`);
      const result = await this.testEndpoint(sportConfig.base + test.path, test);

      sportResults.endpoints.push({
        name: test.name,
        path: test.path,
        available: result.available,
        response_time: result.response_time,
        status_code: result.status_code,
        data_sample: result.data_sample
      });

      // Check for specific features if we got data
      if (result.available && result.data) {
        this.detectFeatures(result.data, sportResults.features_detected);
      }
    }

    this.results[sportKey] = sportResults;
    console.log(`  Endpoints working: ${sportResults.endpoints.filter(e => e.available).length}/${sportResults.endpoints.length}`);
  }

  async testEndpoint(url, test) {
    const startTime = Date.now();

    try {
      const data = await this.fetchJSON(url);
      const responseTime = Date.now() - startTime;

      // Check if this endpoint requires a game ID
      if (test.check === 'requires_game_id') {
        // Try to get a game ID from scoreboard
        const scoreboardData = await this.fetchJSON(url.replace('/summary', '/scoreboard'));

        if (scoreboardData?.events?.[0]?.id) {
          const gameId = scoreboardData.events[0].id;
          const gameUrl = url.replace('/summary', `/summary?event=${gameId}`);
          const gameData = await this.fetchJSON(gameUrl);

          return {
            available: true,
            status_code: 200,
            response_time: responseTime,
            data: gameData,
            data_sample: this.extractSample(gameData, test.expected_fields)
          };
        }

        // No game ID available
        return {
          available: false,
          status_code: 404,
          response_time: responseTime,
          error: 'No game ID available for testing'
        };
      }

      return {
        available: true,
        status_code: 200,
        response_time: responseTime,
        data: data,
        data_sample: this.extractSample(data, test.expected_fields)
      };

    } catch (error) {
      return {
        available: false,
        status_code: error.statusCode || 500,
        response_time: Date.now() - startTime,
        error: error.message
      };
    }
  }

  fetchJSON(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'BlazeSportsIntel/1.0' } }, (res) => {
        let data = '';

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      }).on('error', reject);
    });
  }

  extractSample(data, expectedFields) {
    if (!expectedFields) return null;

    const sample = {};
    for (const field of expectedFields) {
      const value = this.getNestedValue(data, field);
      sample[field] = value !== undefined ? 'PRESENT' : 'MISSING';
    }
    return sample;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  detectFeatures(data, featuresDetected) {
    for (const [featureKey, featureCheck] of Object.entries(CONFIG.FEATURE_CHECKS)) {
      // Check if required fields are present
      const fieldsPresent = featureCheck.required_fields.every(field => {
        return this.getNestedValue(data, field) !== undefined;
      });

      if (fieldsPresent) {
        // Run depth check if provided
        const depthScore = featureCheck.depth_check ? featureCheck.depth_check(data) : 5;

        featuresDetected[featureKey] = {
          present: true,
          depth_score: depthScore
        };
      } else {
        featuresDetected[featureKey] = {
          present: false,
          depth_score: 0
        };
      }
    }
  }

  async generateReport() {
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });

    const report = {
      timestamp: this.timestamp,
      timezone: CONFIG.TIMESTAMP_TIMEZONE,
      summary: {
        total_sports_checked: Object.keys(this.results).length,
        validation_complete: true
      },
      results: this.results,
      validation: {
        college_baseball_gaps_confirmed: this.validateCollegeBaseballGaps(),
        coverage_levels: this.calculateCoverageLevels()
      }
    };

    // Save JSON report
    const jsonPath = path.join(CONFIG.OUTPUT_DIR, 'espn-coverage-validation.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const mdReport = this.generateMarkdownReport(report);
    const mdPath = path.join(CONFIG.OUTPUT_DIR, 'espn-coverage-validation.md');
    await fs.writeFile(mdPath, mdReport);

    console.log('\n📄 Validation reports generated:');
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  }

  validateCollegeBaseballGaps() {
    const cbResults = this.results['college-baseball'];
    if (!cbResults) return { validated: false, reason: 'No data' };

    const gaps = {
      full_box_scores: !cbResults.features_detected['full-box-scores']?.present,
      player_stats: !cbResults.features_detected['player-stats']?.present,
      game_previews: !cbResults.features_detected['game-previews']?.present,
      game_recaps: !cbResults.features_detected['game-recaps']?.present,
      live_play_by_play: !cbResults.features_detected['live-play-by-play']?.present
    };

    const gapsConfirmed = Object.values(gaps).filter(Boolean).length;

    return {
      validated: true,
      gaps_confirmed: gapsConfirmed,
      total_checks: Object.keys(gaps).length,
      gaps: gaps,
      conclusion: gapsConfirmed >= 3 ?
        'CONFIRMED: College baseball has significant coverage gaps' :
        'PARTIAL: Some gaps exist but not as severe as expected'
    };
  }

  calculateCoverageLevels() {
    const levels = {};

    for (const [sportKey, sportResults] of Object.entries(this.results)) {
      const features = sportResults.features_detected;
      const featureScores = Object.values(features).map(f => f.depth_score || 0);
      const avgScore = featureScores.length > 0 ?
        featureScores.reduce((sum, score) => sum + score, 0) / featureScores.length :
        0;

      levels[sportKey] = {
        average_coverage: avgScore.toFixed(1),
        features_present: Object.values(features).filter(f => f.present).length,
        features_checked: Object.keys(features).length
      };
    }

    return levels;
  }

  generateMarkdownReport(report) {
    let md = `# ESPN Coverage Validation Report\n\n`;
    md += `**Generated:** ${report.timestamp} (${report.timezone})\n\n`;
    md += `## Summary\n\n`;
    md += `- **Sports Checked:** ${report.summary.total_sports_checked}\n`;
    md += `- **Validation:** ${report.summary.validation_complete ? '✅ Complete' : '⚠️ Incomplete'}\n\n`;

    md += `## College Baseball Gap Validation\n\n`;
    const cbValidation = report.validation.college_baseball_gaps_confirmed;
    if (cbValidation.validated) {
      md += `**Result:** ${cbValidation.conclusion}\n\n`;
      md += `**Gaps Confirmed:** ${cbValidation.gaps_confirmed} of ${cbValidation.total_checks}\n\n`;
      md += `| Feature | Gap Exists |\n`;
      md += `|---------|------------|\n`;
      Object.entries(cbValidation.gaps).forEach(([feature, gapExists]) => {
        md += `| ${feature.replace(/_/g, ' ')} | ${gapExists ? '❌ YES' : '✅ NO'} |\n`;
      });
      md += `\n`;
    }

    md += `## Coverage Levels by Sport\n\n`;
    md += `| Sport | Avg Coverage | Features Present | Features Checked |\n`;
    md += `|-------|--------------|------------------|------------------|\n`;
    Object.entries(report.validation.coverage_levels).forEach(([sport, level]) => {
      md += `| ${sport} | ${level.average_coverage}/10 | ${level.features_present}/${level.features_checked} | ${level.features_checked} |\n`;
    });
    md += `\n`;

    md += `## Detailed Results\n\n`;
    Object.entries(report.results).forEach(([sport, results]) => {
      md += `### ${sport}\n\n`;
      md += `**Base URL:** ${results.base_url}\n\n`;
      md += `**Endpoints:**\n\n`;
      md += `| Name | Path | Available | Response Time |\n`;
      md += `|------|------|-----------|---------------|\n`;
      results.endpoints.forEach(endpoint => {
        md += `| ${endpoint.name} | ${endpoint.path} | ${endpoint.available ? '✅' : '❌'} | ${endpoint.response_time}ms |\n`;
      });
      md += `\n`;
    });

    return md;
  }
}

// Run checker if executed directly
if (require.main === module) {
  const checker = new ESPNCoverageChecker();
  checker.check().catch(console.error);
}

module.exports = { ESPNCoverageChecker, CONFIG };
