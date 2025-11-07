#!/usr/bin/env node

/**
 * BUILD VERIFICATION SCRIPT
 * Ensures TypeScript compilation produces expected JavaScript files
 * Staff Engineer Orchestrator: Deployment Safety Protocol
 */

import { existsSync, statSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';

const REQUIRED_BUILDS = [
  'lib/api/mlb.js',
  'lib/api/nfl.js',
  'lib/adapters/mlb.js',
  'lib/adapters/nfl.js',
  'lib/utils/cache.js',
  'lib/utils/errors.js'
];

const VALIDATION_RULES = {
  minFileSize: 100, // bytes
  requiredExports: ['getNflTeam', 'getNflStandings', 'getMlbTeam', 'getMlbStandings'],
};

async function verifyBuild() {

  const errors = [];
  const warnings = [];

  // Phase 1: File Existence Check
  for (const file of REQUIRED_BUILDS) {
    const fullPath = join(process.cwd(), file);
    if (!existsSync(fullPath)) {
      errors.push(`MISSING: ${file} - TypeScript compilation failed`);
    } else {
      const stats = statSync(fullPath);
      if (stats.size < VALIDATION_RULES.minFileSize) {
        warnings.push(`SMALL: ${file} (${stats.size} bytes) - Possible compilation issue`);
      } else {
      }
    }
  }

  // Phase 2: Source Map Verification
  for (const file of REQUIRED_BUILDS) {
    const mapFile = file + '.map';
    const fullPath = join(process.cwd(), mapFile);
    if (!existsSync(fullPath)) {
      warnings.push(`NO_MAP: ${mapFile} - Debugging will be limited`);
    } else {
    }
  }

  // Phase 3: Import Path Verification
  const testFiles = [
    'test-nfl-typescript.js',
    'index.html'
  ];

  for (const testFile of testFiles) {
    const fullPath = join(process.cwd(), testFile);
    if (existsSync(fullPath)) {
    } else {
      warnings.push(`TEST_MISSING: ${testFile} - Cannot verify imports`);
    }
  }

  // Phase 4: TypeScript Artifacts Cleanup Check
  const libDir = join(process.cwd(), 'lib');
  if (existsSync(libDir)) {
    const checkCleanup = async (dir) => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await checkCleanup(fullPath);
        } else if (entry.name.endsWith('.d.ts')) {
          // Skip .d.ts files - they are declaration files, not source files
        } else if (extname(entry.name) === '.ts') {
          // For each .ts file, verify corresponding .js exists
          const jsFile = fullPath.replace('.ts', '.js');
          if (!existsSync(jsFile)) {
            errors.push(`UNCOMPILED: ${fullPath} has no corresponding .js file`);
          } else {
          }
        }
      }
    };
    await checkCleanup(libDir);
  }

  // Results Summary

  if (warnings.length > 0) {
  }

  if (errors.length > 0) {
    process.exit(1);
  }

}

verifyBuild().catch(error => {
  console.error('🚨 Build verification failed:', error);
  process.exit(1);
});