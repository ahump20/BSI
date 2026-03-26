#!/usr/bin/env node

/**
 * PostToolUse Hook: Changelog Updater
 *
 * Automatically updates CHANGELOG.md on significant code changes.
 * Follows conventional changelog format with categories.
 *
 * Categories:
 * - Added: New features
 * - Changed: Changes to existing functionality
 * - Deprecated: Soon-to-be removed features
 * - Removed: Removed features
 * - Fixed: Bug fixes
 * - Security: Security improvements
 *
 * Triggers: After Write/Edit operations on source files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = '/Users/AustinHumphrey/BSI/CHANGELOG.md';
const AUTO_UPDATE_MARKER = '<!-- AUTO-GENERATED -->';

const SIGNIFICANT_PATTERNS = {
  added: [
    /export\s+(async\s+)?function\s+\w+/,  // New function exports
    /export\s+class\s+\w+/,                 // New class exports
    /export\s+const\s+\w+\s*=/,             // New const exports
    /<Route\s+path=/,                        // New routes
    /app\.(get|post|put|delete|patch)\(/    // New API endpoints
  ],
  changed: [
    /function\s+\w+.*\{/,  // Function signature changes
    /class\s+\w+/,         // Class modifications
    /interface\s+\w+/      // Interface changes
  ],
  fixed: [
    /fix:|bug:|bugfix:/i,
    /resolve:|resolves:/i
  ],
  security: [
    /security:|cve-|vulnerability/i,
    /sanitize|escape|xss|csrf|sql injection/i
  ]
};

/**
 * Ensure changelog exists
 */
function ensureChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    const initialContent = `# Changelog

All notable changes to Blaze Sports Intel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

${AUTO_UPDATE_MARKER}

`;
    fs.writeFileSync(CHANGELOG_PATH, initialContent);
  }
}

/**
 * Get current date in America/Chicago timezone
 */
function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Detect change category
 */
function detectCategory(filePath, oldContent, newContent) {
  const categories = [];

  // Check for new additions
  for (const pattern of SIGNIFICANT_PATTERNS.added) {
    const oldMatches = (oldContent.match(pattern) || []).length;
    const newMatches = (newContent.match(pattern) || []).length;

    if (newMatches > oldMatches) {
      categories.push('Added');
      break;
    }
  }

  // Check for modifications
  if (oldContent !== newContent && categories.length === 0) {
    for (const pattern of SIGNIFICANT_PATTERNS.changed) {
      if (newContent.match(pattern)) {
        categories.push('Changed');
        break;
      }
    }
  }

  // Check for fixes
  for (const pattern of SIGNIFICANT_PATTERNS.fixed) {
    if (newContent.match(pattern)) {
      categories.push('Fixed');
      break;
    }
  }

  // Check for security changes
  for (const pattern of SIGNIFICANT_PATTERNS.security) {
    if (newContent.match(pattern)) {
      categories.push('Security');
      break;
    }
  }

  return categories.length > 0 ? categories : ['Changed'];
}

/**
 * Generate changelog entry description
 */
function generateDescription(filePath, oldContent, newContent, categories) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  // Try to extract meaningful description from git diff or content
  if (categories.includes('Added')) {
    // Check for new functions/classes
    const newFunctions = (newContent.match(/export\s+(async\s+)?function\s+(\w+)/g) || [])
      .filter(f => !oldContent.includes(f));

    if (newFunctions.length > 0) {
      const funcNames = newFunctions.map(f => f.match(/function\s+(\w+)/)[1]);
      return `Add ${funcNames.join(', ')} to ${fileName}`;
    }

    const newClasses = (newContent.match(/export\s+class\s+(\w+)/g) || [])
      .filter(c => !oldContent.includes(c));

    if (newClasses.length > 0) {
      const classNames = newClasses.map(c => c.match(/class\s+(\w+)/)[1]);
      return `Add ${classNames.join(', ')} class${classNames.length > 1 ? 'es' : ''} to ${fileName}`;
    }
  }

  if (categories.includes('Fixed')) {
    // Try to extract fix description from comments
    const fixComments = newContent.match(/\/\/.*fix:|\/\*.*fix:.*\*\//gi);
    if (fixComments && fixComments.length > 0) {
      return fixComments[0].replace(/\/\/|\/\*|\*\//g, '').trim();
    }

    return `Fix issue in ${fileName}`;
  }

  // Default descriptions
  if (ext === '.js' || ext === '.ts') {
    return `Update ${fileName} implementation`;
  }

  if (ext === '.html') {
    return `Update ${fileName} markup`;
  }

  if (ext === '.css' || ext === '.scss') {
    return `Update ${fileName} styles`;
  }

  return `Update ${fileName}`;
}

/**
 * Update changelog
 */
async function updateChangelog(toolName, args, result) {
  try {
    // Only process Write/Edit operations on source files
    if (!toolName.includes('Write') && !toolName.includes('Edit')) {
      return;
    }

    const filePath = args.file_path || '';
    if (!filePath) return;

    // Skip non-source files
    const ext = path.extname(filePath);
    const sourceExts = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html'];
    if (!sourceExts.includes(ext)) return;

    // Skip files in certain directories
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.claude'];
    if (skipDirs.some(dir => filePath.includes(dir))) return;

    // Get old content for comparison
    let oldContent = '';
    try {
      if (fs.existsSync(filePath)) {
        // Try to get previous version from git
        oldContent = execSync(`git show HEAD:${path.relative(process.cwd(), filePath)}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
      }
    } catch {
      // File might be new or not in git yet
      oldContent = '';
    }

    const newContent = args.content || args.new_string || '';

    // Skip if content hasn't meaningfully changed
    if (oldContent === newContent) return;
    if (newContent.length < 50) return; // Skip trivial files

    // Detect change category
    const categories = detectCategory(filePath, oldContent, newContent);
    const description = generateDescription(filePath, oldContent, newContent, categories);

    // Read current changelog
    ensureChangelog();
    let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

    // Find unreleased section
    const unreleasedMatch = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=## \[|$)/);
    if (!unreleasedMatch) {
      console.error('Could not find [Unreleased] section in CHANGELOG.md');
      return;
    }

    let unreleasedSection = unreleasedMatch[1];

    // Add entries for each category
    categories.forEach(category => {
      const categoryHeader = `### ${category}`;
      const entry = `- ${description}`;

      // Check if entry already exists
      if (unreleasedSection.includes(entry)) return;

      // Find or create category section
      if (unreleasedSection.includes(categoryHeader)) {
        // Add to existing category
        unreleasedSection = unreleasedSection.replace(
          new RegExp(`(${categoryHeader}[\\s\\S]*?)(\\n###|\\n##|${AUTO_UPDATE_MARKER}|$)`),
          `$1\n${entry}$2`
        );
      } else {
        // Create new category section
        const categorySection = `\n${categoryHeader}\n\n${entry}\n`;

        // Insert before auto-generated marker or at end
        if (unreleasedSection.includes(AUTO_UPDATE_MARKER)) {
          unreleasedSection = unreleasedSection.replace(
            AUTO_UPDATE_MARKER,
            categorySection + '\n' + AUTO_UPDATE_MARKER
          );
        } else {
          unreleasedSection += categorySection;
        }
      }
    });

    // Replace unreleased section in changelog
    changelog = changelog.replace(
      /## \[Unreleased\][\s\S]*?(?=## \[|$)/,
      `## [Unreleased]${unreleasedSection}`
    );

    // Write updated changelog
    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.error(`✅ Updated CHANGELOG.md: ${categories.join(', ')} - ${description}`);

  } catch (error) {
    console.error(`Changelog update error: ${error.message}`);
  }
}

/**
 * Create release entry
 */
function createRelease(version, date = null) {
  try {
    ensureChangelog();
    let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

    const releaseDate = date || getCurrentDate();

    // Extract unreleased content
    const unreleasedMatch = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=## \[|$)/);
    if (!unreleasedMatch) {
      console.error('No unreleased changes found');
      return;
    }

    const unreleasedContent = unreleasedMatch[1]
      .replace(AUTO_UPDATE_MARKER, '')
      .trim();

    if (!unreleasedContent || unreleasedContent.length < 10) {
      console.error('No significant unreleased changes to release');
      return;
    }

    // Create new release section
    const releaseSection = `\n## [${version}] - ${releaseDate}\n\n${unreleasedContent}\n`;

    // Reset unreleased section
    const newUnreleased = `## [Unreleased]\n\n${AUTO_UPDATE_MARKER}\n`;

    // Update changelog
    changelog = changelog.replace(
      /## \[Unreleased\][\s\S]*?(?=## \[|$)/,
      newUnreleased + releaseSection
    );

    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.log(`✅ Created release ${version} in CHANGELOG.md`);

  } catch (error) {
    console.error(`Release creation error: ${error.message}`);
  }
}

// Handle CLI invocation
if (require.main === module) {
  const args = JSON.parse(process.argv[2] || '{}');
  const toolName = process.argv[3] || '';
  const result = JSON.parse(process.argv[4] || 'null');

  // Check for release request
  if (args.release) {
    createRelease(args.version, args.date);
    process.exit(0);
  }

  updateChangelog(toolName, args, result)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`Changelog update error: ${error.message}`);
      process.exit(0); // Don't fail on changelog errors
    });
}

module.exports = { updateChangelog, createRelease };
