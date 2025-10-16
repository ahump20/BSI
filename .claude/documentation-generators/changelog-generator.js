#!/usr/bin/env node

/**
 * Changelog Generator
 *
 * Automatically generates comprehensive changelogs from git commit history
 * following the Conventional Commits specification and Keep a Changelog format.
 *
 * Features:
 * - Parses git commits using Conventional Commits format
 * - Groups changes by type (features, fixes, breaking changes, etc.)
 * - Generates semantic version recommendations
 * - Creates GitHub release notes
 * - Maintains CHANGELOG.md in Keep a Changelog format
 * - Identifies breaking changes automatically
 * - Links to issues and pull requests
 *
 * Output:
 * - CHANGELOG.md (complete project history)
 * - Release notes (for GitHub releases)
 * - Version recommendation (semantic versioning)
 * - Migration guide (for breaking changes)
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  // Input
  REPO_DIR: path.join(__dirname, '../..'),

  // Output
  OUTPUT_DIR: path.join(__dirname, '../../docs'),
  CHANGELOG_FILE: 'CHANGELOG.md',
  RELEASE_NOTES_DIR: 'releases',

  // Timezone
  TIMEZONE: 'America/Chicago',

  // Commit types (Conventional Commits)
  COMMIT_TYPES: {
    feat: {
      title: 'Features',
      emoji: '✨',
      semver: 'minor',
      description: 'New features and enhancements'
    },
    fix: {
      title: 'Bug Fixes',
      emoji: '🐛',
      semver: 'patch',
      description: 'Bug fixes and corrections'
    },
    perf: {
      title: 'Performance',
      emoji: '⚡',
      semver: 'patch',
      description: 'Performance improvements'
    },
    refactor: {
      title: 'Code Refactoring',
      emoji: '♻️',
      semver: 'patch',
      description: 'Code refactoring without functional changes'
    },
    style: {
      title: 'Styles',
      emoji: '🎨',
      semver: 'patch',
      description: 'Code style changes (formatting, etc.)'
    },
    test: {
      title: 'Tests',
      emoji: '✅',
      semver: 'patch',
      description: 'Test additions and modifications'
    },
    docs: {
      title: 'Documentation',
      emoji: '📚',
      semver: 'patch',
      description: 'Documentation updates'
    },
    build: {
      title: 'Build System',
      emoji: '🏗️',
      semver: 'patch',
      description: 'Build system and dependency changes'
    },
    ci: {
      title: 'Continuous Integration',
      emoji: '👷',
      semver: 'patch',
      description: 'CI/CD configuration changes'
    },
    chore: {
      title: 'Chores',
      emoji: '🔧',
      semver: 'patch',
      description: 'Maintenance tasks'
    },
    revert: {
      title: 'Reverts',
      emoji: '⏪',
      semver: 'patch',
      description: 'Reverted changes'
    }
  },

  // Breaking change indicators
  BREAKING_INDICATORS: [
    'BREAKING CHANGE',
    'BREAKING',
    '!:',
    'breaking:'
  ],

  // GitHub integration
  GITHUB_REPO: 'ahump20/BSI',
  GITHUB_URL: 'https://github.com/ahump20/BSI'
};

class ChangelogGenerator {
  constructor() {
    this.commits = [];
    this.versions = [];
    this.currentVersion = null;
    this.timestamp = new Date().toLocaleString('en-US', {
      timeZone: CONFIG.TIMEZONE
    });
  }

  /**
   * Main execution method
   */
  async generate(options = {}) {
    console.log('📝 Changelog Generator');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${this.timestamp}`);
    console.log('');

    try {
      // 1. Get current version
      console.log('1. Detecting current version...');
      this.currentVersion = await this.getCurrentVersion();
      console.log(`   Current version: ${this.currentVersion}`);

      // 2. Parse git commits
      console.log('2. Parsing git commit history...');
      await this.parseCommits(options.since, options.until);
      console.log(`   Parsed ${this.commits.length} commits`);

      // 3. Group commits by version
      console.log('3. Grouping commits by version...');
      await this.groupCommitsByVersion();
      console.log(`   Found ${this.versions.length} versions`);

      // 4. Analyze changes
      console.log('4. Analyzing changes...');
      await this.analyzeChanges();

      // 5. Generate changelog
      console.log('5. Generating CHANGELOG.md...');
      await this.generateChangelog();

      // 6. Generate release notes
      console.log('6. Generating release notes...');
      await this.generateReleaseNotes();

      // 7. Generate version recommendation
      console.log('7. Generating version recommendation...');
      const recommendation = await this.recommendVersion();
      console.log(`   Recommended next version: ${recommendation.version} (${recommendation.reason})`);

      console.log('');
      console.log('✅ Changelog generation complete!');
      console.log(`   Output: ${CONFIG.OUTPUT_DIR}`);

    } catch (error) {
      console.error('❌ Changelog generation failed:', error);
      throw error;
    }
  }

  /**
   * Get current version from package.json or git tags
   */
  async getCurrentVersion() {
    try {
      // Try package.json first
      const packagePath = path.join(CONFIG.REPO_DIR, 'package.json');
      const packageData = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(packageData);

      if (pkg.version) {
        return pkg.version;
      }
    } catch (error) {
      // package.json not found or invalid
    }

    try {
      // Fall back to latest git tag
      const latestTag = execSync('git describe --tags --abbrev=0', {
        cwd: CONFIG.REPO_DIR,
        encoding: 'utf-8'
      }).trim();

      return latestTag.replace(/^v/, '');
    } catch (error) {
      // No tags found
      return '0.0.0';
    }
  }

  /**
   * Parse git commits
   */
  async parseCommits(since, until = 'HEAD') {
    const sinceArg = since || await this.getLastTagCommit();

    const gitLog = execSync(
      `git log ${sinceArg}..${until} --pretty=format:"%H|%an|%ae|%at|%s|%b"`,
      {
        cwd: CONFIG.REPO_DIR,
        encoding: 'utf-8'
      }
    ).trim();

    if (!gitLog) {
      console.warn('   ⚠️  No commits found');
      return;
    }

    const lines = gitLog.split('\n');

    for (const line of lines) {
      const [hash, author, email, timestamp, subject, body] = line.split('|');

      const commit = this.parseCommit({
        hash,
        author,
        email,
        timestamp: parseInt(timestamp) * 1000,
        subject,
        body: body || ''
      });

      this.commits.push(commit);
    }
  }

  /**
   * Get last tag commit
   */
  async getLastTagCommit() {
    try {
      return execSync('git rev-list --tags --max-count=1', {
        cwd: CONFIG.REPO_DIR,
        encoding: 'utf-8'
      }).trim();
    } catch (error) {
      // No tags, use first commit
      return execSync('git rev-list --max-parents=0 HEAD', {
        cwd: CONFIG.REPO_DIR,
        encoding: 'utf-8'
      }).trim();
    }
  }

  /**
   * Parse individual commit
   */
  parseCommit(raw) {
    const commit = {
      hash: raw.hash,
      shortHash: raw.hash.substring(0, 7),
      author: raw.author,
      email: raw.email,
      date: new Date(raw.timestamp),
      subject: raw.subject,
      body: raw.body,
      type: null,
      scope: null,
      description: null,
      breaking: false,
      breakingDescription: null,
      references: []
    };

    // Parse conventional commit format
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
    const match = commit.subject.match(conventionalRegex);

    if (match) {
      commit.type = match[1];
      commit.scope = match[2] || null;
      commit.breaking = !!match[3];
      commit.description = match[4];
    } else {
      // Non-conventional commit
      commit.type = 'chore';
      commit.description = commit.subject;
    }

    // Check for breaking changes in body
    for (const indicator of CONFIG.BREAKING_INDICATORS) {
      if (commit.body.includes(indicator)) {
        commit.breaking = true;

        // Extract breaking change description
        const breakingRegex = new RegExp(`${indicator}:?\\s*(.+)`, 'i');
        const breakingMatch = commit.body.match(breakingRegex);
        if (breakingMatch) {
          commit.breakingDescription = breakingMatch[1].trim();
        }
        break;
      }
    }

    // Extract issue/PR references
    const refRegex = /#(\d+)/g;
    let refMatch;

    while ((refMatch = refRegex.exec(commit.subject + ' ' + commit.body)) !== null) {
      commit.references.push({
        type: 'issue',
        number: refMatch[1],
        url: `${CONFIG.GITHUB_URL}/issues/${refMatch[1]}`
      });
    }

    return commit;
  }

  /**
   * Group commits by version (tags)
   */
  async groupCommitsByVersion() {
    try {
      // Get all tags with their commits
      const tagsOutput = execSync(
        'git tag -l --sort=-version:refname --format="%(refname:short)|%(objectname)"',
        {
          cwd: CONFIG.REPO_DIR,
          encoding: 'utf-8'
        }
      ).trim();

      const tags = tagsOutput.split('\n').map(line => {
        const [tag, commit] = line.split('|');
        return {
          name: tag.replace(/^v/, ''),
          commit: commit,
          date: this.getTagDate(commit)
        };
      });

      // Group commits by version
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const nextTag = tags[i + 1];

        const versionCommits = this.commits.filter(commit => {
          const commitDate = commit.date.getTime();
          const tagDate = tag.date.getTime();
          const nextTagDate = nextTag ? nextTag.date.getTime() : 0;

          return commitDate <= tagDate && commitDate > nextTagDate;
        });

        this.versions.push({
          version: tag.name,
          date: tag.date,
          commits: versionCommits
        });
      }

      // Add unreleased commits
      const unreleasedCommits = this.commits.filter(commit => {
        return !this.versions.some(v => v.commits.includes(commit));
      });

      if (unreleasedCommits.length > 0) {
        this.versions.unshift({
          version: 'Unreleased',
          date: new Date(),
          commits: unreleasedCommits
        });
      }

    } catch (error) {
      // No tags found, all commits are unreleased
      this.versions.push({
        version: 'Unreleased',
        date: new Date(),
        commits: this.commits
      });
    }
  }

  /**
   * Get tag date
   */
  getTagDate(commit) {
    try {
      const timestamp = execSync(
        `git show -s --format=%ct ${commit}`,
        {
          cwd: CONFIG.REPO_DIR,
          encoding: 'utf-8'
        }
      ).trim();

      return new Date(parseInt(timestamp) * 1000);
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Analyze changes in commits
   */
  async analyzeChanges() {
    for (const version of this.versions) {
      // Group commits by type
      version.changes = {};

      for (const commit of version.commits) {
        const type = commit.type || 'chore';

        if (!version.changes[type]) {
          version.changes[type] = [];
        }

        version.changes[type].push(commit);
      }

      // Separate breaking changes
      version.breaking = version.commits.filter(c => c.breaking);

      // Calculate statistics
      version.stats = {
        totalCommits: version.commits.length,
        breaking: version.breaking.length,
        features: (version.changes.feat || []).length,
        fixes: (version.changes.fix || []).length,
        contributors: [...new Set(version.commits.map(c => c.author))].length
      };
    }
  }

  /**
   * Generate CHANGELOG.md
   */
  async generateChangelog() {
    let changelog = `# Changelog\n\n`;
    changelog += `All notable changes to Blaze Sports Intel will be documented in this file.\n\n`;
    changelog += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
    changelog += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

    for (const version of this.versions) {
      // Version header
      const versionHeader = version.version === 'Unreleased'
        ? `## [Unreleased]`
        : `## [${version.version}] - ${this.formatDate(version.date)}`;

      changelog += `${versionHeader}\n\n`;

      // Statistics
      if (version.stats.totalCommits > 0) {
        changelog += `**${version.stats.totalCommits} commits**`;
        if (version.stats.contributors > 1) {
          changelog += ` from ${version.stats.contributors} contributors`;
        }
        changelog += `\n\n`;
      }

      // Breaking changes (most important)
      if (version.breaking.length > 0) {
        changelog += `### ⚠️ BREAKING CHANGES\n\n`;

        for (const commit of version.breaking) {
          changelog += `- ${commit.description}`;
          if (commit.breakingDescription) {
            changelog += `\n  - ${commit.breakingDescription}`;
          }
          changelog += ` ([${commit.shortHash}](${CONFIG.GITHUB_URL}/commit/${commit.hash}))`;
          changelog += `\n`;
        }
        changelog += `\n`;
      }

      // Changes by type
      const sortedTypes = Object.keys(version.changes).sort((a, b) => {
        const orderA = CONFIG.COMMIT_TYPES[a]?.semver === 'minor' ? 0 : 1;
        const orderB = CONFIG.COMMIT_TYPES[b]?.semver === 'minor' ? 0 : 1;
        return orderA - orderB;
      });

      for (const type of sortedTypes) {
        const commits = version.changes[type];
        const typeConfig = CONFIG.COMMIT_TYPES[type];

        if (!typeConfig || commits.length === 0) continue;

        changelog += `### ${typeConfig.emoji} ${typeConfig.title}\n\n`;

        for (const commit of commits) {
          if (commit.breaking) continue; // Already listed in breaking changes

          changelog += `- `;
          if (commit.scope) {
            changelog += `**${commit.scope}**: `;
          }
          changelog += commit.description;

          // Add references
          if (commit.references.length > 0) {
            changelog += ` (`;
            changelog += commit.references.map(ref => `[#${ref.number}](${ref.url})`).join(', ');
            changelog += `)`;
          }

          changelog += ` ([${commit.shortHash}](${CONFIG.GITHUB_URL}/commit/${commit.hash}))`;
          changelog += `\n`;
        }
        changelog += `\n`;
      }
    }

    // Write to file
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(CONFIG.OUTPUT_DIR, CONFIG.CHANGELOG_FILE),
      changelog
    );
  }

  /**
   * Generate release notes for each version
   */
  async generateReleaseNotes() {
    const releaseNotesDir = path.join(CONFIG.OUTPUT_DIR, CONFIG.RELEASE_NOTES_DIR);
    await fs.mkdir(releaseNotesDir, { recursive: true });

    for (const version of this.versions) {
      if (version.version === 'Unreleased') continue;

      let notes = `# Release ${version.version}\n\n`;
      notes += `**Released:** ${this.formatDate(version.date)}\n\n`;

      // Summary
      notes += `## Summary\n\n`;
      notes += `This release includes:\n`;
      notes += `- ${version.stats.features} new features\n`;
      notes += `- ${version.stats.fixes} bug fixes\n`;
      notes += `- ${version.stats.totalCommits} total changes\n\n`;

      // Breaking changes
      if (version.breaking.length > 0) {
        notes += `## ⚠️ Breaking Changes\n\n`;
        notes += `This release contains breaking changes that may require migration:\n\n`;

        for (const commit of version.breaking) {
          notes += `### ${commit.description}\n\n`;
          if (commit.breakingDescription) {
            notes += `${commit.breakingDescription}\n\n`;
          }
          notes += `**Migration required**: Yes\n\n`;
        }

        notes += `See the [Migration Guide](#migration-guide) below for detailed instructions.\n\n`;
      }

      // Highlights
      const highlights = this.selectHighlights(version);
      if (highlights.length > 0) {
        notes += `## Highlights\n\n`;

        for (const commit of highlights) {
          const typeConfig = CONFIG.COMMIT_TYPES[commit.type];
          notes += `${typeConfig.emoji} **${commit.description}**\n\n`;
          if (commit.body) {
            notes += `${commit.body.substring(0, 200)}...\n\n`;
          }
        }
      }

      // Full changelog
      notes += `## Full Changelog\n\n`;
      notes += `For complete details, see [CHANGELOG.md](../CHANGELOG.md#${version.version.replace(/\./g, '')}).\n\n`;

      // Contributors
      const contributors = [...new Set(version.commits.map(c => c.author))];
      if (contributors.length > 1) {
        notes += `## Contributors\n\n`;
        notes += `Thank you to all contributors:\n\n`;
        for (const contributor of contributors) {
          notes += `- ${contributor}\n`;
        }
        notes += `\n`;
      }

      // Migration guide (if breaking changes)
      if (version.breaking.length > 0) {
        notes += `## Migration Guide\n\n`;
        notes += await this.generateMigrationGuide(version);
      }

      // Write release notes
      await fs.writeFile(
        path.join(releaseNotesDir, `${version.version}.md`),
        notes
      );
    }
  }

  /**
   * Select highlights from version
   */
  selectHighlights(version) {
    const highlights = [];

    // Add breaking changes
    highlights.push(...version.breaking.slice(0, 2));

    // Add major features
    const features = version.changes.feat || [];
    highlights.push(...features.slice(0, 3));

    // Add significant fixes
    const fixes = version.changes.fix || [];
    const significantFixes = fixes.filter(commit =>
      commit.description.toLowerCase().includes('critical') ||
      commit.description.toLowerCase().includes('security')
    );
    highlights.push(...significantFixes.slice(0, 2));

    return highlights.slice(0, 5); // Max 5 highlights
  }

  /**
   * Generate migration guide for breaking changes
   */
  async generateMigrationGuide(version) {
    let guide = `### Upgrading to ${version.version}\n\n`;

    for (const commit of version.breaking) {
      guide += `#### ${commit.description}\n\n`;

      if (commit.breakingDescription) {
        guide += `**What changed:** ${commit.breakingDescription}\n\n`;
      }

      guide += `**Action required:**\n\n`;
      guide += `1. Review your code for usage of affected features\n`;
      guide += `2. Update according to new API or behavior\n`;
      guide += `3. Test thoroughly before deploying\n\n`;

      guide += `**Need help?** [Open an issue](${CONFIG.GITHUB_URL}/issues/new)\n\n`;
    }

    return guide;
  }

  /**
   * Recommend next version based on commits
   */
  async recommendVersion() {
    const unreleased = this.versions.find(v => v.version === 'Unreleased');

    if (!unreleased || unreleased.commits.length === 0) {
      return {
        version: this.currentVersion,
        reason: 'No unreleased changes'
      };
    }

    // Parse current version
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);

    // Determine version bump
    if (unreleased.breaking.length > 0) {
      return {
        version: `${major + 1}.0.0`,
        reason: `Breaking changes detected (${unreleased.breaking.length})`
      };
    }

    const features = unreleased.changes.feat || [];
    if (features.length > 0) {
      return {
        version: `${major}.${minor + 1}.0`,
        reason: `New features added (${features.length})`
      };
    }

    return {
      version: `${major}.${minor}.${patch + 1}`,
      reason: `Bug fixes and improvements (${unreleased.commits.length} changes)`
    };
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}

// Run generator if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--since' && args[i + 1]) {
      options.since = args[i + 1];
      i++;
    } else if (args[i] === '--until' && args[i + 1]) {
      options.until = args[i + 1];
      i++;
    }
  }

  const generator = new ChangelogGenerator();
  generator.generate(options).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ChangelogGenerator, CONFIG };
