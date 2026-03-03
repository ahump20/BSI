#!/usr/bin/env node
/**
 * Reads the BSI test count from vitest output and updates Hero.tsx marquee.
 * Run before build to keep the portfolio stats in sync with BSI.
 *
 * Usage: node scripts/sync-bsi-stats.js
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BSI_PATH = resolve(__dirname, '../../BSI-local');
const HERO_PATH = resolve(__dirname, '../src/components/Hero.tsx');

try {
  // Run BSI tests and capture the count
  const output = execSync('npx vitest run --reporter=verbose 2>&1', {
    cwd: BSI_PATH,
    timeout: 120000,
    encoding: 'utf-8',
  });

  // Strip ANSI escape codes, then parse "Tests  539 passed (539)"
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
  const match = clean.match(/^\s+Tests\s+(\d+)\s+passed/m);
  if (!match) {
    console.log('Could not parse test count from vitest output, skipping sync');
    process.exit(0);
  }

  const testCount = parseInt(match[1], 10);
  console.log(`BSI test count: ${testCount}`);

  // Read Hero.tsx and update the marquee item
  let hero = readFileSync(HERO_PATH, 'utf-8');
  const updated = hero.replace(
    /'\d+ Tests Passing'/,
    `'${testCount} Tests Passing'`
  );

  if (updated !== hero) {
    writeFileSync(HERO_PATH, updated);
    console.log(`Updated Hero.tsx marquee: ${testCount} Tests Passing`);
  } else {
    console.log('Hero.tsx already up to date');
  }
} catch (err) {
  console.error('BSI stats sync failed (non-fatal):', err.message);
  process.exit(0); // Don't block the build
}
