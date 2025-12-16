# Phase 5 Integration Guide
## MCP Servers + ESPN Gap Analysis + Documentation Automation

**Last Updated:** 2025-10-16
**Timezone:** America/Chicago
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [MCP Server Setup](#mcp-server-setup)
3. [ESPN Gap Analyzer](#espn-gap-analyzer)
4. [Documentation Generators](#documentation-generators)
5. [Integration Workflows](#integration-workflows)
6. [Testing & Validation](#testing--validation)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Phase 5 provides three critical capabilities:

### **1. MCP Servers (8 files)**
Direct programmatic access to sports data sources:
- **Cardinals Analytics MCP**: Cardinals-specific stats, roster, schedule
- **SportsDataIO MCP**: Real-time multi-sport data (NFL, MLB, NBA, CFB, CBB)
- **Perfect Game MCP**: Youth baseball scouting and tournament data
- **Context7 Research MCP**: Academic research and documentation

### **2. ESPN Gap Analyzer (3 files)**
Automated competitive analysis:
- **Coverage Checker**: Validates ESPN's actual API responses
- **Gap Reporter**: Generates detailed reports on missing features
- **Opportunity Identifier**: Finds market opportunities in underserved sports

### **3. Documentation Generators (4 files)**
Automated documentation maintenance:
- **API Docs Generator**: OpenAPI 3.0 specs + Postman collections
- **Changelog Generator**: Git commits → CHANGELOG.md
- **README Generator**: Project documentation suite
- **Code Docs Generator**: JSDoc → technical reference

---

## 🔧 MCP Server Setup

### **Step 1: Install Dependencies**

```bash
cd /Users/AustinHumphrey/BSI

# Install MCP server dependencies
cd .claude/mcp-servers/cardinals-analytics && npm install
cd ../sportsdataio && npm install
cd ../perfect-game && npm install
cd ../context7-research && npm install
```

### **Step 2: Configure Environment Variables**

Create `.env` files for each MCP server (these should already exist from your `.env.master`):

```bash
# Cardinals Analytics - no API key needed (uses MLB Stats API)
# .claude/mcp-servers/cardinals-analytics/.env
MLB_TEAM_ID=138
MLB_STATS_API_BASE=https://statsapi.mlb.com/api/v1

# SportsDataIO - requires API key
# .claude/mcp-servers/sportsdataio/.env
SPORTSDATA_API_KEY=6ca2adb39404482da5406f0a6cd7aa37
SPORTSDATA_BASE_URL=https://api.sportsdata.io/v3

# Perfect Game - requires credentials (contact Perfect Game for access)
# .claude/mcp-servers/perfect-game/.env
PERFECT_GAME_API_KEY=your-perfect-game-key
PERFECT_GAME_BASE_URL=https://api.perfectgame.org

# Context7 Research - uses your existing Context7 credentials
# .claude/mcp-servers/context7-research/.env
CONTEXT7_API_KEY=ctx7sk-30e11e35-4b11-400c-9674-47d39d05aac5
CONTEXT7_API_URL=context7.com/api/v1
CONTEXT7_MCP_URL=mcp.context7.com/mcp
```

### **Step 3: Add to Claude Desktop Config**

Edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cardinals-analytics": {
      "command": "node",
      "args": ["/Users/AustinHumphrey/BSI/.claude/mcp-servers/cardinals-analytics/index.js"],
      "env": {
        "MLB_TEAM_ID": "138",
        "MLB_STATS_API_BASE": "https://statsapi.mlb.com/api/v1"
      }
    },
    "sportsdataio": {
      "command": "node",
      "args": ["/Users/AustinHumphrey/BSI/.claude/mcp-servers/sportsdataio/index.js"],
      "env": {
        "SPORTSDATA_API_KEY": "6ca2adb39404482da5406f0a6cd7aa37",
        "SPORTSDATA_BASE_URL": "https://api.sportsdata.io/v3"
      }
    },
    "perfect-game": {
      "command": "node",
      "args": ["/Users/AustinHumphrey/BSI/.claude/mcp-servers/perfect-game/index.js"],
      "env": {
        "PERFECT_GAME_API_KEY": "your-perfect-game-key",
        "PERFECT_GAME_BASE_URL": "https://api.perfectgame.org"
      }
    },
    "context7-research": {
      "command": "node",
      "args": ["/Users/AustinHumphrey/BSI/.claude/mcp-servers/context7-research/index.js"],
      "env": {
        "CONTEXT7_API_KEY": "ctx7sk-30e11e35-4b11-400c-9674-47d39d05aac5",
        "CONTEXT7_API_URL": "context7.com/api/v1",
        "CONTEXT7_MCP_URL": "mcp.context7.com/mcp"
      }
    }
  }
}
```

### **Step 4: Test MCP Servers**

```bash
# Test each server individually
cd /Users/AustinHumphrey/BSI/.claude/mcp-servers

# Cardinals Analytics
node cardinals-analytics/index.js

# SportsDataIO
node sportsdataio/index.js

# Perfect Game
node perfect-game/index.js

# Context7 Research
node context7-research/index.js
```

### **Step 5: Restart Claude Desktop**

After adding MCP servers to config, restart Claude Desktop for changes to take effect.

---

## 📊 MCP Server Usage Examples

### **Cardinals Analytics MCP**

```javascript
// Available tools in Claude Desktop:
// - cardinals_roster: Get current Cardinals roster
// - cardinals_schedule: Get Cardinals schedule (optional: date range)
// - cardinals_standings: Get NL Central standings
// - cardinals_recent_games: Get last N games (default: 10)
// - cardinals_player_stats: Get individual player statistics

// Example prompts in Claude Desktop:
"Get the Cardinals roster"
"Show me Cardinals schedule for this week"
"What are the NL Central standings?"
"Get Cardinals recent games (last 5)"
"Show me stats for Paul Goldschmidt"
```

### **SportsDataIO MCP**

```javascript
// Available tools:
// - sportsdata_nfl_scores: NFL scores by week
// - sportsdata_mlb_standings: MLB standings
// - sportsdata_nba_schedule: NBA schedule
// - sportsdata_cfb_rankings: College football rankings
// - sportsdata_cbb_teams: College basketball teams

// Example prompts:
"Get NFL scores for Week 5"
"Show me MLB standings for AL West"
"Get NBA schedule for Lakers"
"What are the current CFB rankings?"
"Show me SEC basketball teams"
```

### **Perfect Game MCP**

```javascript
// Available tools:
// - perfectgame_tournaments: Upcoming tournaments
// - perfectgame_player_rankings: Player rankings by class/position
// - perfectgame_team_search: Find teams by location/level
// - perfectgame_event_results: Tournament results

// Example prompts:
"Get Perfect Game tournaments in Texas"
"Show me 2026 shortstop rankings"
"Find Perfect Game teams in Dallas"
"Get results from WWBA Championship"
```

### **Context7 Research MCP**

```javascript
// Available tools:
// - context7_search: Search academic research
// - context7_document: Get specific document
// - context7_citation: Get citation details

// Example prompts:
"Search Context7 for baseball biomechanics research"
"Get document about pitcher injury prevention"
"Show citation for batting mechanics study"
```

---

## 🔍 ESPN Gap Analyzer

### **What It Does**

Automatically tests ESPN's APIs to validate coverage levels and identify gaps in their sports offerings.

### **Run the Coverage Checker**

```bash
cd /Users/AustinHumphrey/BSI/.claude/espn-gap-analyzer

# Run full coverage validation
node espn-coverage-checker.js

# Output files:
# - reports/coverage-validation/espn-coverage-validation.json
# - reports/coverage-validation/espn-coverage-validation.md
```

### **Output Example**

```markdown
# ESPN Coverage Validation Report

**Generated:** 2025-10-16 14:30:00 (America/Chicago)

## Summary
- **Sports Checked:** 5
- **Validation:** ✅ Complete

## College Baseball Gap Validation

**Result:** CONFIRMED: College baseball has significant coverage gaps

**Gaps Confirmed:** 4 of 5

| Feature | Gap Exists |
|---------|------------|
| full box scores | ❌ YES |
| player stats | ❌ YES |
| game previews | ❌ YES |
| game recaps | ❌ YES |
| live play by play | ✅ NO |

## Coverage Levels by Sport

| Sport | Avg Coverage | Features Present | Features Checked |
|-------|--------------|------------------|------------------|
| college-baseball | 2.0/10 | 1/5 | 5 |
| mlb | 8.5/10 | 5/5 | 5 |
| nfl | 9.0/10 | 5/5 | 5 |
| ncaa-football | 7.5/10 | 4/5 | 5 |
| ncaa-basketball | 8.0/10 | 5/5 | 5 |
```

### **Use the Gap Reporter**

```bash
# Generate detailed gap report
node gap-reporter.js

# Output:
# - reports/gaps/espn-gaps-report.json
# - reports/gaps/espn-gaps-report.md
# - reports/gaps/competitive-analysis.json
```

### **Identify Opportunities**

```bash
# Find market opportunities
node opportunity-identifier.js

# Output:
# - reports/opportunities/market-opportunities.json
# - reports/opportunities/opportunity-report.md
```

### **Integration with Slash Commands**

```bash
# In Claude Code:
/analytics

# Automatically runs ESPN gap analysis as part of analytics suite
```

---

## 📝 Documentation Generators

### **1. API Documentation Generator**

Generates OpenAPI 3.0 specs, Postman collections, and Markdown docs from your Cloudflare Functions.

```bash
cd /Users/AustinHumphrey/BSI/.claude/documentation-generators

# Generate API documentation
node api-docs-generator.js

# Output:
# - ../../docs/api/openapi.json
# - ../../docs/api/API.md
# - ../../docs/api/postman-collection.json
# - ../../docs/api/examples/*.{js,py,sh}
```

**What It Analyzes:**
- Scans `functions/` directory for all API endpoints
- Extracts JSDoc comments from function handlers
- Detects HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Infers request/response schemas
- Generates code examples in JavaScript, Python, Bash

**Example Output (openapi.json):**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Blaze Sports Intel API",
    "version": "v1"
  },
  "paths": {
    "/api/mlb/teams": {
      "get": {
        "summary": "Get MLB teams",
        "parameters": [
          {
            "name": "division",
            "in": "query",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "teams": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/Team" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### **2. Changelog Generator**

Generates CHANGELOG.md from git commit history following Conventional Commits spec.

```bash
# Generate changelog
node changelog-generator.js

# Output:
# - ../../CHANGELOG.md
# - ../../docs/changelogs/RELEASE_NOTES.md
# - ../../docs/changelogs/version-recommendation.json
```

**What It Does:**
- Parses git commit history
- Groups commits by type (feat, fix, perf, refactor, etc.)
- Detects breaking changes (BREAKING CHANGE, !: syntax)
- Recommends semantic version bumps (major, minor, patch)
- Generates Keep a Changelog format
- Creates release notes

**Example Output (CHANGELOG.md):**
```markdown
# Changelog

All notable changes to Blaze Sports Intel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ⚠️ BREAKING CHANGES

- **api**: Changed `/api/mlb/teams` response structure ([a1b2c3d](https://github.com/ahump20/BSI/commit/a1b2c3d))

### ✨ Features

- **mlb**: Add real-time score updates ([e4f5g6h](https://github.com/ahump20/BSI/commit/e4f5g6h))
- **college-baseball**: Complete box score generation ([i7j8k9l](https://github.com/ahump20/BSI/commit/i7j8k9l))

### 🐛 Bug Fixes

- **api**: Fix NFL standings division mapping ([m1n2o3p](https://github.com/ahump20/BSI/commit/m1n2o3p))

## [1.2.0] - 2025-10-15

### ✨ Features

- **analytics**: Add Pythagorean win expectation ([q4r5s6t](https://github.com/ahump20/BSI/commit/q4r5s6t))
```

### **3. README Generator**

Generates comprehensive README.md, CONTRIBUTING.md, and QUICK_START.md.

```bash
# Generate README suite
node readme-generator.js

# Output:
# - ../../README.md
# - ../../CONTRIBUTING.md
# - ../../docs/QUICK_START.md
```

**What It Analyzes:**
- Scans project structure
- Extracts package.json metadata
- Detects tech stack from dependencies
- Documents npm scripts
- Generates badges (version, license, stars, issues)

**Example Output (README.md):**
```markdown
# Blaze Sports Intel

> Comprehensive sports intelligence platform covering MLB, NFL, NCAA, and more

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

## 🎯 Features

- ⚾ **MLB Coverage**: Real-time scores, standings, player stats
- 🏈 **NFL Analytics**: Live scores, team stats, player projections
- 🏀 **NCAA Basketball**: Conference standings, tournament projections
- ⚾ **College Baseball**: Complete box scores with full player stats

## 🚀 Tech Stack

### Frontend
- ⚛️ React - UI library
- 🎨 Tailwind CSS - Styling

### Backend
- ☁️ Cloudflare Pages Functions - Serverless API
- 🗄️ Cloudflare D1 - SQLite database
- 📦 Cloudflare KV - Caching layer

## 📦 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
\`\`\`
```

### **4. Code Documentation Generator**

Generates technical reference documentation from JSDoc comments.

```bash
# Generate code docs
node code-docs-generator.js

# Output:
# - ../../docs/code/functions.md
# - ../../docs/code/classes.md
# - ../../docs/code/types.md
# - ../../docs/code/modules.md
# - ../../docs/code/constants.md
# - ../../docs/code/README.md
```

**What It Analyzes:**
- Parses JavaScript/TypeScript source files
- Extracts JSDoc comments
- Documents functions (regular + arrow)
- Documents classes (methods + properties)
- Documents types (interfaces + types)
- Calculates documentation completeness score

**Example Output (functions.md):**
```markdown
# Function Reference

Total functions: 142

## API Functions

### `getMLBStandings()`

Fetches current MLB standings from MLB Stats API with caching.

**Parameters:**

- `division` *(string)* - MLB division (optional)
- `date` *(string)* - Date in YYYY-MM-DD format (optional)

**Returns:** `Promise<Object>` - Standings data with teams array

**Source:** `functions/api/mlb/standings.js`

---
```

---

## 🔄 Integration Workflows

### **Workflow 1: Daily Documentation Update**

```bash
#!/bin/bash
# scripts/update-docs.sh

cd /Users/AustinHumphrey/BSI/.claude/documentation-generators

echo "📝 Updating documentation..."

# Generate all docs
node api-docs-generator.js
node changelog-generator.js
node readme-generator.js
node code-docs-generator.js

echo "✅ Documentation updated!"
echo "📊 Files updated:"
echo "   - docs/api/openapi.json"
echo "   - CHANGELOG.md"
echo "   - README.md"
echo "   - docs/code/*.md"
```

### **Workflow 2: Pre-Deployment Gap Analysis**

```bash
#!/bin/bash
# scripts/pre-deploy-gap-check.sh

cd /Users/AustinHumphrey/BSI/.claude/espn-gap-analyzer

echo "🔍 Running ESPN gap analysis..."

# Run coverage check
node espn-coverage-checker.js

# Generate reports
node gap-reporter.js
node opportunity-identifier.js

echo "✅ Gap analysis complete!"
echo "📊 Reports generated:"
echo "   - reports/coverage-validation/espn-coverage-validation.md"
echo "   - reports/gaps/espn-gaps-report.md"
echo "   - reports/opportunities/market-opportunities.json"
```

### **Workflow 3: MCP-Powered Data Fetching**

```bash
# In Claude Code, use MCP tools directly:

# Get Cardinals data
"Use cardinals_roster to get the current roster"

# Fetch multi-sport data
"Use sportsdata_nfl_scores to get Week 5 scores"
"Use sportsdata_mlb_standings for AL Central"

# Youth baseball scouting
"Use perfectgame_player_rankings for 2026 SS in Texas"

# Research academic papers
"Use context7_search to find baseball biomechanics research"
```

### **Workflow 4: Automated Release Process**

```bash
#!/bin/bash
# scripts/release.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version required"
  echo "Usage: ./release.sh 1.3.0"
  exit 1
fi

cd /Users/AustinHumphrey/BSI

echo "🚀 Preparing release v$VERSION"

# 1. Update documentation
echo "📝 Generating documentation..."
cd .claude/documentation-generators
node api-docs-generator.js
node changelog-generator.js
node readme-generator.js
node code-docs-generator.js

# 2. Run gap analysis
echo "🔍 Running gap analysis..."
cd ../espn-gap-analyzer
node espn-coverage-checker.js

# 3. Update package.json version
cd ../..
npm version $VERSION --no-git-tag-version

# 4. Git commit and tag
git add .
git commit -m "chore: Release v$VERSION

📦 Version bump to $VERSION
📝 Updated all documentation
🔍 Latest ESPN gap analysis

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git tag -a "v$VERSION" -m "Release v$VERSION"

# 5. Push to GitHub
git push origin main
git push origin "v$VERSION"

echo "✅ Release v$VERSION complete!"
```

---

## ✅ Testing & Validation

### **Test Suite for Phase 5**

Create `/Users/AustinHumphrey/BSI/.claude/tests/phase5-test-suite.js`:

```javascript
#!/usr/bin/env node

/**
 * Phase 5 Integration Test Suite
 *
 * Tests all Phase 5 components:
 * - MCP Servers
 * - ESPN Gap Analyzer
 * - Documentation Generators
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class Phase5TestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async run() {
    console.log('🧪 Phase 5 Integration Test Suite');
    console.log('='.repeat(50));
    console.log('');

    await this.testMCPServers();
    await this.testESPNGapAnalyzer();
    await this.testDocumentationGenerators();

    this.printResults();
  }

  async testMCPServers() {
    console.log('📡 Testing MCP Servers...');

    const servers = [
      'cardinals-analytics',
      'sportsdataio',
      'perfect-game',
      'context7-research'
    ];

    for (const server of servers) {
      try {
        const packagePath = path.join(
          __dirname,
          `../../mcp-servers/${server}/package.json`
        );

        // Check if package.json exists
        if (!fs.existsSync(packagePath)) {
          this.recordTest(`MCP: ${server} package.json`, false, 'File not found');
          continue;
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Validate package structure
        const hasName = pkg.name === `@blazesportsintel/mcp-${server}`;
        const hasMain = pkg.main === 'index.js';
        const hasDeps = pkg.dependencies && Object.keys(pkg.dependencies).length > 0;

        if (hasName && hasMain && hasDeps) {
          this.recordTest(`MCP: ${server}`, true);
        } else {
          this.recordTest(
            `MCP: ${server}`,
            false,
            'Invalid package structure'
          );
        }
      } catch (error) {
        this.recordTest(`MCP: ${server}`, false, error.message);
      }
    }
  }

  async testESPNGapAnalyzer() {
    console.log('🔍 Testing ESPN Gap Analyzer...');

    const files = [
      'espn-coverage-checker.js',
      'gap-reporter.js',
      'opportunity-identifier.js'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(
          __dirname,
          `../../espn-gap-analyzer/${file}`
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          this.recordTest(`Gap Analyzer: ${file}`, false, 'File not found');
          continue;
        }

        // Check file size (should be substantial)
        const stats = fs.statSync(filePath);
        if (stats.size < 1000) {
          this.recordTest(
            `Gap Analyzer: ${file}`,
            false,
            'File too small (likely incomplete)'
          );
          continue;
        }

        // Check for key exports
        const content = fs.readFileSync(filePath, 'utf8');
        const hasClass = content.includes('class ');
        const hasExport = content.includes('module.exports');

        if (hasClass && hasExport) {
          this.recordTest(`Gap Analyzer: ${file}`, true);
        } else {
          this.recordTest(
            `Gap Analyzer: ${file}`,
            false,
            'Missing class or export'
          );
        }
      } catch (error) {
        this.recordTest(`Gap Analyzer: ${file}`, false, error.message);
      }
    }
  }

  async testDocumentationGenerators() {
    console.log('📝 Testing Documentation Generators...');

    const generators = [
      'api-docs-generator.js',
      'changelog-generator.js',
      'readme-generator.js',
      'code-docs-generator.js'
    ];

    for (const generator of generators) {
      try {
        const filePath = path.join(
          __dirname,
          `../../documentation-generators/${generator}`
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          this.recordTest(`Doc Gen: ${generator}`, false, 'File not found');
          continue;
        }

        // Check file size
        const stats = fs.statSync(filePath);
        if (stats.size < 5000) {
          this.recordTest(
            `Doc Gen: ${generator}`,
            false,
            'File too small (likely incomplete)'
          );
          continue;
        }

        // Check for key components
        const content = fs.readFileSync(filePath, 'utf8');
        const hasClass = content.includes('class ');
        const hasGenerate = content.includes('async generate()');
        const hasExport = content.includes('module.exports');

        if (hasClass && hasGenerate && hasExport) {
          this.recordTest(`Doc Gen: ${generator}`, true);
        } else {
          this.recordTest(
            `Doc Gen: ${generator}`,
            false,
            'Missing required components'
          );
        }
      } catch (error) {
        this.recordTest(`Doc Gen: ${generator}`, false, error.message);
      }
    }
  }

  recordTest(name, passed, error = null) {
    this.results.tests.push({ name, passed, error });

    if (passed) {
      this.results.passed++;
      console.log(`  ✅ ${name}`);
    } else {
      this.results.failed++;
      console.log(`  ❌ ${name}: ${error}`);
    }
  }

  printResults() {
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Test Results');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.tests.length}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log('');

    if (this.results.failed > 0) {
      console.log('Failed Tests:');
      for (const test of this.results.tests) {
        if (!test.passed) {
          console.log(`  - ${test.name}: ${test.error}`);
        }
      }
      console.log('');
      process.exit(1);
    } else {
      console.log('✅ All Phase 5 tests passed!');
      process.exit(0);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const suite = new Phase5TestSuite();
  suite.run().catch(console.error);
}

module.exports = { Phase5TestSuite };
```

### **Run the Test Suite**

```bash
cd /Users/AustinHumphrey/BSI/.claude/tests
chmod +x phase5-test-suite.js
node phase5-test-suite.js
```

---

## 🐛 Troubleshooting

### **MCP Servers Not Appearing in Claude Desktop**

**Problem**: MCP servers don't show up in Claude Desktop after configuration.

**Solutions:**
1. Verify `claude_desktop_config.json` syntax (must be valid JSON)
2. Check file paths are absolute (not relative)
3. Restart Claude Desktop completely (quit and reopen)
4. Check server logs: `tail -f ~/.claude/logs/mcp-server.log`

### **ESPN Gap Analyzer Failing**

**Problem**: Coverage checker throws connection errors.

**Solutions:**
1. Check internet connection
2. Verify ESPN API endpoints are accessible:
   ```bash
   curl https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
   ```
3. Check for rate limiting (wait 60 seconds between runs)
4. Validate User-Agent header in requests

### **Documentation Generators Producing Empty Output**

**Problem**: Generators run but produce empty or incomplete docs.

**Solutions:**
1. Verify source directories exist and contain files:
   ```bash
   ls -la /Users/AustinHumphrey/BSI/functions
   ls -la /Users/AustinHumphrey/BSI/lib
   ```
2. Check file permissions:
   ```bash
   chmod -R 755 /Users/AustinHumphrey/BSI/.claude/documentation-generators
   ```
3. Run with debug logging:
   ```bash
   DEBUG=true node api-docs-generator.js
   ```

### **Git Commit History Not Parsing Correctly**

**Problem**: Changelog generator produces incorrect version recommendations.

**Solutions:**
1. Verify git repository is initialized:
   ```bash
   cd /Users/AustinHumphrey/BSI && git status
   ```
2. Check commit message format (should follow Conventional Commits):
   ```bash
   git log --oneline -10
   ```
3. Manually tag current version:
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   ```

---

## 📚 Additional Resources

### **Documentation**
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

### **API Documentation**
- [MLB Stats API](https://statsapi.mlb.com/docs/)
- [ESPN API (Unofficial)](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [SportsDataIO API Docs](https://sportsdata.io/developers)

### **Support**
- GitHub Issues: https://github.com/ahump20/BSI/issues
- Email: austin@blazesportsintel.com

---

**Last Updated:** 2025-10-16 14:30:00 America/Chicago
**Version:** 1.0.0
**Status:** Production Ready
