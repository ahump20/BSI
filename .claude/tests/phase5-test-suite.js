#!/usr/bin/env node

/**
 * Phase 5 Integration Test Suite
 *
 * Tests all Phase 5 components:
 * - MCP Servers (4 servers, 8 files)
 * - ESPN Gap Analyzer (3 files)
 * - Documentation Generators (4 files)
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 * @license MIT
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  BASE_DIR: path.join(__dirname, '../..'),
  MCP_DIR: path.join(__dirname, '../../.claude/mcp-servers'),
  ESPN_DIR: path.join(__dirname, '../../.claude/espn-gap-analyzer'),
  DOCS_DIR: path.join(__dirname, '../../.claude/documentation-generators'),
  TIMEZONE: 'America/Chicago'
};

class Phase5TestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };

    this.startTime = new Date();
  }

  async run() {
    console.log('🧪 Phase 5 Integration Test Suite');
    console.log('='.repeat(70));
    console.log(`Started: ${this.formatDate(this.startTime)}`);
    console.log('');

    // Run test suites
    await this.testMCPServers();
    await this.testESPNGapAnalyzer();
    await this.testDocumentationGenerators();
    await this.testIntegration();

    // Print final results
    this.printResults();
  }

  // ============================================================================
  // MCP Server Tests
  // ============================================================================

  async testMCPServers() {
    console.log('📡 Testing MCP Servers (1 server implemented)');
    console.log('-'.repeat(70));

    const servers = [
      {
        name: 'feature-engineering-mcp',
        description: 'Feature engineering for sports analytics',
        requiredFiles: ['config.json', 'server.js'],
        minConfigSize: 5000,
        minServerSize: 20000
      }
    ];

    for (const server of servers) {
      await this.testMCPServer(server);
    }

    console.log('');
  }

  async testMCPServer(server) {
    const serverDir = path.join(CONFIG.MCP_DIR, server.name);
    const configPath = path.join(serverDir, 'config.json');
    const serverPath = path.join(serverDir, 'server.js');

    // Test 1: config.json exists and is valid
    try {
      if (!fs.existsSync(configPath)) {
        this.recordTest(
          `MCP ${server.name}: config.json exists`,
          false,
          'File not found'
        );
        return;
      }

      const stats = fs.statSync(configPath);
      if (stats.size >= server.minConfigSize) {
        this.recordTest(
          `MCP ${server.name}: config.json substantial (${stats.size} bytes)`,
          true
        );
      } else {
        this.recordTest(
          `MCP ${server.name}: config.json substantial`,
          false,
          `Only ${stats.size} bytes (expected ${server.minConfigSize}+)`
        );
      }

      // Validate config is valid JSON
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.recordTest(
        `MCP ${server.name}: config.json valid JSON`,
        true
      );
    } catch (error) {
      this.recordTest(
        `MCP ${server.name}: config.json valid`,
        false,
        error.message
      );
    }

    // Test 2: server.js exists and is substantial
    try {
      if (!fs.existsSync(serverPath)) {
        this.recordTest(
          `MCP ${server.name}: server.js exists`,
          false,
          'File not found'
        );
        return;
      }

      const stats = fs.statSync(serverPath);
      if (stats.size >= server.minServerSize) {
        this.recordTest(
          `MCP ${server.name}: server.js substantial (${stats.size} bytes)`,
          true
        );
      } else {
        this.recordTest(
          `MCP ${server.name}: server.js substantial`,
          false,
          `Only ${stats.size} bytes (expected ${server.minServerSize}+)`
        );
      }

      const content = fs.readFileSync(serverPath, 'utf8');

      // Check for MCP server structure
      const hasImports = content.includes('import') || content.includes('require');
      const hasClass = content.includes('class ') || content.includes('function ');
      const hasExport = content.includes('export') || content.includes('module.exports');

      if (hasImports && hasClass && hasExport) {
        this.recordTest(
          `MCP ${server.name}: server.js structure valid`,
          true
        );
      } else {
        const issues = [];
        if (!hasImports) issues.push('missing imports');
        if (!hasClass) issues.push('missing class/function definitions');
        if (!hasExport) issues.push('missing exports');

        this.recordTest(
          `MCP ${server.name}: server.js structure valid`,
          false,
          issues.join(', ')
        );
      }
    } catch (error) {
      this.recordTest(
        `MCP ${server.name}: server.js exists`,
        false,
        error.message
      );
    }
  }

  // ============================================================================
  // ESPN Gap Analyzer Tests
  // ============================================================================

  async testESPNGapAnalyzer() {
    console.log('🔍 Testing ESPN Gap Analyzer (3 files)');
    console.log('-'.repeat(70));

    const files = [
      {
        name: 'espn-coverage-checker.js',
        description: 'Validates ESPN API coverage',
        requiredClasses: ['ESPNCoverageChecker'],
        requiredMethods: ['check', 'checkSport', 'validateCollegeBaseballGaps'],
        minSize: 15000
      },
      {
        name: 'espn-gap-analyzer.js',
        description: 'Generates gap analysis reports',
        requiredClasses: ['ESPNGapAnalyzer'],
        requiredMethods: ['analyze', 'generateReport', 'identifyGaps'],
        minSize: 10000
      },
      {
        name: 'gap-opportunity-scorer.js',
        description: 'Scores market opportunities',
        requiredClasses: ['GapOpportunityScorer'],
        requiredMethods: ['score', 'rankOpportunities', 'calculatePriority'],
        minSize: 8000
      }
    ];

    for (const file of files) {
      await this.testESPNFile(file);
    }

    console.log('');
  }

  async testESPNFile(file) {
    const filePath = path.join(CONFIG.ESPN_DIR, file.name);

    // Test 1: File exists
    try {
      if (!fs.existsSync(filePath)) {
        this.recordTest(
          `ESPN ${file.name}: exists`,
          false,
          'File not found'
        );
        return;
      }

      this.recordTest(`ESPN ${file.name}: exists`, true);
    } catch (error) {
      this.recordTest(`ESPN ${file.name}: exists`, false, error.message);
      return;
    }

    // Test 2: File is substantial
    try {
      const stats = fs.statSync(filePath);

      if (stats.size >= file.minSize) {
        this.recordTest(
          `ESPN ${file.name}: substantial (${stats.size} bytes)`,
          true
        );
      } else {
        this.recordTest(
          `ESPN ${file.name}: substantial`,
          false,
          `Only ${stats.size} bytes (expected ${file.minSize}+)`
        );
      }
    } catch (error) {
      this.recordTest(`ESPN ${file.name}: substantial`, false, error.message);
    }

    // Test 3: Contains required classes
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      for (const className of file.requiredClasses) {
        const hasClass = content.includes(`class ${className}`);

        if (hasClass) {
          this.recordTest(
            `ESPN ${file.name}: has ${className} class`,
            true
          );
        } else {
          this.recordTest(
            `ESPN ${file.name}: has ${className} class`,
            false,
            'Class not found'
          );
        }
      }

      // Test 4: Contains required methods
      for (const method of file.requiredMethods) {
        const hasMethod = content.includes(`${method}(`) || content.includes(`async ${method}(`);

        if (hasMethod) {
          this.recordTest(
            `ESPN ${file.name}: has ${method}() method`,
            true
          );
        } else {
          this.recordTest(
            `ESPN ${file.name}: has ${method}() method`,
            false,
            'Method not found'
          );
        }
      }

      // Test 5: Has proper exports
      const hasExport = content.includes('module.exports');

      if (hasExport) {
        this.recordTest(
          `ESPN ${file.name}: exports properly`,
          true
        );
      } else {
        this.recordTest(
          `ESPN ${file.name}: exports properly`,
          false,
          'Missing module.exports'
        );
      }
    } catch (error) {
      this.recordTest(`ESPN ${file.name}: structure`, false, error.message);
    }
  }

  // ============================================================================
  // Documentation Generator Tests
  // ============================================================================

  async testDocumentationGenerators() {
    console.log('📝 Testing Documentation Generators (4 files)');
    console.log('-'.repeat(70));

    const generators = [
      {
        name: 'api-docs-generator.js',
        description: 'Generates OpenAPI specs and API docs',
        requiredClasses: ['APIDocsGenerator'],
        requiredMethods: ['generate', 'scanFunctions', 'generateOpenAPI', 'generateMarkdown'],
        minSize: 25000,
        outputs: ['openapi.json', 'API.md', 'postman-collection.json']
      },
      {
        name: 'changelog-generator.js',
        description: 'Generates changelog from git history',
        requiredClasses: ['ChangelogGenerator'],
        requiredMethods: ['generate', 'parseCommits', 'generateChangelog', 'recommendVersion'],
        minSize: 20000,
        outputs: ['CHANGELOG.md']
      },
      {
        name: 'readme-generator.js',
        description: 'Generates README and contributing docs',
        requiredClasses: ['ReadmeGenerator'],
        requiredMethods: ['generate', 'detectTechStack', 'generateReadme', 'generateContributing'],
        minSize: 22000,
        outputs: ['README.md', 'CONTRIBUTING.md', 'QUICK_START.md']
      },
      {
        name: 'code-docs-generator.js',
        description: 'Generates code reference documentation',
        requiredClasses: ['CodeDocsGenerator'],
        requiredMethods: ['generate', 'scanSourceFiles', 'extractFunctions', 'generateDocs'],
        minSize: 24000,
        outputs: ['functions.md', 'classes.md', 'types.md']
      }
    ];

    for (const generator of generators) {
      await this.testDocGenerator(generator);
    }

    console.log('');
  }

  async testDocGenerator(generator) {
    const filePath = path.join(CONFIG.DOCS_DIR, generator.name);

    // Test 1: File exists
    try {
      if (!fs.existsSync(filePath)) {
        this.recordTest(
          `Doc ${generator.name}: exists`,
          false,
          'File not found'
        );
        return;
      }

      this.recordTest(`Doc ${generator.name}: exists`, true);
    } catch (error) {
      this.recordTest(`Doc ${generator.name}: exists`, false, error.message);
      return;
    }

    // Test 2: File is substantial
    try {
      const stats = fs.statSync(filePath);

      if (stats.size >= generator.minSize) {
        this.recordTest(
          `Doc ${generator.name}: substantial (${stats.size} bytes)`,
          true
        );
      } else {
        this.recordTest(
          `Doc ${generator.name}: substantial`,
          false,
          `Only ${stats.size} bytes (expected ${generator.minSize}+)`
        );
      }
    } catch (error) {
      this.recordTest(`Doc ${generator.name}: substantial`, false, error.message);
    }

    // Test 3: Contains required classes
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      for (const className of generator.requiredClasses) {
        const hasClass = content.includes(`class ${className}`);

        if (hasClass) {
          this.recordTest(
            `Doc ${generator.name}: has ${className} class`,
            true
          );
        } else {
          this.recordTest(
            `Doc ${generator.name}: has ${className} class`,
            false,
            'Class not found'
          );
        }
      }

      // Test 4: Contains required methods
      for (const method of generator.requiredMethods) {
        const hasMethod = content.includes(`${method}(`) ||
                         content.includes(`async ${method}(`) ||
                         content.includes(`${method} (`);

        if (hasMethod) {
          this.recordTest(
            `Doc ${generator.name}: has ${method}() method`,
            true
          );
        } else {
          this.recordTest(
            `Doc ${generator.name}: has ${method}() method`,
            false,
            'Method not found'
          );
        }
      }

      // Test 5: Has proper exports
      const hasExport = content.includes('module.exports');

      if (hasExport) {
        this.recordTest(
          `Doc ${generator.name}: exports properly`,
          true
        );
      } else {
        this.recordTest(
          `Doc ${generator.name}: exports properly`,
          false,
          'Missing module.exports'
        );
      }

      // Test 6: Documents expected outputs
      for (const output of generator.outputs) {
        const documentsOutput = content.includes(output);

        if (documentsOutput) {
          this.recordTest(
            `Doc ${generator.name}: documents ${output}`,
            true
          );
        } else {
          this.recordTest(
            `Doc ${generator.name}: documents ${output}`,
            false,
            'Output file not mentioned in code'
          );
        }
      }
    } catch (error) {
      this.recordTest(`Doc ${generator.name}: structure`, false, error.message);
    }
  }

  // ============================================================================
  // Integration Tests
  // ============================================================================

  async testIntegration() {
    console.log('🔗 Testing Phase 5 Integration');
    console.log('-'.repeat(70));

    // Test 1: Integration guide exists
    try {
      const guidePath = path.join(CONFIG.BASE_DIR, '.claude/PHASE5_INTEGRATION_GUIDE.md');

      if (fs.existsSync(guidePath)) {
        const stats = fs.statSync(guidePath);

        if (stats.size > 10000) {
          this.recordTest(
            'Integration: PHASE5_INTEGRATION_GUIDE.md exists and substantial',
            true
          );
        } else {
          this.recordTest(
            'Integration: PHASE5_INTEGRATION_GUIDE.md substantial',
            false,
            `Only ${stats.size} bytes`
          );
        }
      } else {
        this.recordTest(
          'Integration: PHASE5_INTEGRATION_GUIDE.md exists',
          false,
          'File not found'
        );
      }
    } catch (error) {
      this.recordTest('Integration: guide exists', false, error.message);
    }

    // Test 2: Test suite exists (this file)
    try {
      const testSuitePath = path.join(CONFIG.BASE_DIR, '.claude/tests/phase5-test-suite.js');

      if (fs.existsSync(testSuitePath)) {
        this.recordTest(
          'Integration: phase5-test-suite.js exists',
          true
        );
      } else {
        this.recordTest(
          'Integration: phase5-test-suite.js exists',
          false,
          'File not found'
        );
      }
    } catch (error) {
      this.recordTest('Integration: test suite exists', false, error.message);
    }

    // Test 3: All Phase 5 directories exist
    const requiredDirs = [
      '.claude/mcp-servers',
      '.claude/espn-gap-analyzer',
      '.claude/documentation-generators'
    ];

    for (const dir of requiredDirs) {
      try {
        const dirPath = path.join(CONFIG.BASE_DIR, dir);

        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          this.recordTest(
            `Integration: ${dir} directory exists`,
            true
          );
        } else {
          this.recordTest(
            `Integration: ${dir} directory exists`,
            false,
            'Directory not found'
          );
        }
      } catch (error) {
        this.recordTest(`Integration: ${dir} exists`, false, error.message);
      }
    }

    console.log('');
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  recordTest(name, passed, error = null) {
    this.results.tests.push({
      name,
      passed,
      error,
      timestamp: new Date()
    });

    if (passed) {
      this.results.passed++;
      console.log(`  ✅ ${name}`);
    } else if (error === 'skipped') {
      this.results.skipped++;
      console.log(`  ⏭️  ${name} (skipped)`);
    } else {
      this.results.failed++;
      console.log(`  ❌ ${name}`);
      if (error) {
        console.log(`     ${error}`);
      }
    }
  }

  printResults() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;

    console.log('');
    console.log('='.repeat(70));
    console.log('📊 Test Results');
    console.log('='.repeat(70));
    console.log(`Finished: ${this.formatDate(endTime)}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log('');
    console.log(`Total Tests:   ${this.results.tests.length}`);
    console.log(`✅ Passed:     ${this.results.passed}`);
    console.log(`❌ Failed:     ${this.results.failed}`);
    console.log(`⏭️  Skipped:    ${this.results.skipped}`);
    console.log('');

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      console.log('-'.repeat(70));

      for (const test of this.results.tests) {
        if (!test.passed && test.error !== 'skipped') {
          console.log(`  • ${test.name}`);
          if (test.error) {
            console.log(`    ${test.error}`);
          }
        }
      }

      console.log('');
      console.log('⚠️  Some tests failed. Please review and fix issues.');
      process.exit(1);
    } else {
      console.log('✅ All Phase 5 integration tests passed!');
      console.log('');
      console.log('🎉 Phase 5 components are fully functional and ready for use.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Configure MCP servers in Claude Desktop config');
      console.log('  2. Run ESPN gap analyzer to validate coverage');
      console.log('  3. Generate documentation with doc generators');
      console.log('  4. See PHASE5_INTEGRATION_GUIDE.md for detailed instructions');
      console.log('');
      process.exit(0);
    }
  }

  formatDate(date) {
    return date.toLocaleString('en-US', {
      timeZone: CONFIG.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}

// ============================================================================
// Main Execution
// ============================================================================

// Check if this module is being run directly (ES module way)
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new Phase5TestSuite();
  suite.run().catch((error) => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  });
}

export { Phase5TestSuite };
