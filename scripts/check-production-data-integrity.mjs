#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGET_DIRS = [
  'app/scores',
  'app/college-baseball',
  'app/mlb',
  'app/intel',
  'app/about',
];

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const EXCLUDED_FILE_PATTERNS = [/\.test\./, /\.spec\./, /__tests__/, /\.stories\./];

const BANNED_PATTERNS = [
  { label: 'Math.random(', pattern: /\bMath\.random\s*\(/ },
  { label: 'mockData', pattern: /\bmockData\b/i },
  { label: 'fake sports data reference', pattern: /\bfake\s+(?:sports\s+)?(?:data|scores?|standings?|players?)\b/i },
  { label: 'hardcoded player array', pattern: /(?:const|let|var)\s+\w*(?:players|playerList)\w*\s*=\s*\[/i },
  { label: 'hardcoded standings table', pattern: /(?:const|let|var)\s+\w*standings\w*\s*=\s*\[/i },
  { label: 'hardcoded freshness claim "updated today"', pattern: /updated\s+today/i },
];

function collectFiles(dir) {
  const absoluteDir = path.join(repoRoot, dir);
  let files = [];

  if (!statSafe(absoluteDir)?.isDirectory()) {
    return files;
  }

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const absoluteEntry = path.join(absoluteDir, entry.name);
    const relativeEntry = path.relative(repoRoot, absoluteEntry);

    if (entry.isDirectory()) {
      files = files.concat(collectFiles(relativeEntry));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativeEntry))) continue;
    files.push(relativeEntry);
  }

  return files;
}

function statSafe(filePath) {
  try {
    return statSync(filePath);
  } catch {
    return null;
  }
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) => collectFiles(dir));
  const violations = [];

  for (const relativePath of files) {
    const content = readFileSync(path.join(repoRoot, relativePath), 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { label, pattern } of BANNED_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({ file: relativePath, line: index + 1, label, snippet: line.trim() });
        }
      }
    });
  }

  if (violations.length === 0) {
    console.log('✅ Production data integrity scan passed.');
    return;
  }

  console.error('\n🚫 Production data integrity violations detected:\n');
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line} — ${violation.label}`);
    console.error(`    ${violation.snippet.slice(0, 160)}\n`);
  }

  console.error('Remove mock/fake/hardcoded data patterns from production routes before merging.');
  process.exit(1);
}

main();
