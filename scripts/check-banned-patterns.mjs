#!/usr/bin/env node

/**
 * Pre-commit check: blocks commits containing banned patterns in non-test files.
 * Patterns indicate mock/fake data that should never ship to production.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BANNED_PATTERNS = [
  { pattern: /\bmockGames\b/, label: 'mockGames' },
  { pattern: /\bmockScores\b/, label: 'mockScores' },
  { pattern: /\bmockStandings\b/, label: 'mockStandings' },
  { pattern: /\bmockTeams\b/, label: 'mockTeams' },
  { pattern: /\bsampleData\b/, label: 'sampleData' },
  { pattern: /\blorem ipsum\b/i, label: 'lorem ipsum' },
];

/** Only check staged TS/TSX files under app/, components/, lib/ — skip tests */
const INCLUDE_DIRS = ['app/', 'components/', 'lib/'];
const EXCLUDE_PATTERNS = [/\.test\./, /\.spec\./, /__tests__/, /\.stories\./];

function getStagedFiles() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });
  if (result.status !== 0) return [];
  return result.stdout.split('\0').filter(Boolean);
}

function getStagedContent(filePath) {
  const result = spawnSync('git', ['show', `:${filePath}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });
  return result.status === 0 ? result.stdout : null;
}

function main() {
  const files = getStagedFiles().filter((f) => {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return false;
    if (!INCLUDE_DIRS.some((dir) => f.startsWith(dir))) return false;
    if (EXCLUDE_PATTERNS.some((p) => p.test(f))) return false;
    return true;
  });

  if (files.length === 0) process.exit(0);

  const violations = [];

  for (const file of files) {
    const content = getStagedContent(file);
    if (!content) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, label } of BANNED_PATTERNS) {
        if (pattern.test(lines[i])) {
          violations.push({ file, line: i + 1, label, text: lines[i].trim() });
        }
      }
    }
  }

  if (violations.length === 0) process.exit(0);

  console.error('\n🚫 Banned patterns detected in staged files:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — "${v.label}"`);
    console.error(`    ${v.text.slice(0, 120)}\n`);
  }
  console.error('These patterns indicate mock/fake data that should not ship to production.');
  console.error('Remove them or rename the variables before committing.\n');
  process.exit(1);
}

main();
