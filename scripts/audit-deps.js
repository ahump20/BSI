#!/usr/bin/env node

/**
 * BSI Dependency Audit Script
 *
 * Collects all dependencies from package.json and outputs them in a format
 * suitable for Socket.dev analysis via the Socket MCP tool.
 *
 * Usage:
 *   node scripts/audit-deps.js
 *   node scripts/audit-deps.js --ci (for CI environments)
 *   node scripts/audit-deps.js --json (JSON output only)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const jsonOnly = args.includes('--json');

function loadPackageJson() {
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

function collectDependencies(packageJson) {
  const allDeps = new Map();

  // Collect production dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      allDeps.set(name, {
        depname: name,
        ecosystem: 'npm',
        version: version.replace(/^[\^~]/, ''), // Remove semver prefixes
        type: 'production',
      });
    }
  }

  // Collect dev dependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      allDeps.set(name, {
        depname: name,
        ecosystem: 'npm',
        version: version.replace(/^[\^~]/, ''),
        type: 'development',
      });
    }
  }

  // Collect optional dependencies
  if (packageJson.optionalDependencies) {
    for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
      allDeps.set(name, {
        depname: name,
        ecosystem: 'npm',
        version: version.replace(/^[\^~]/, ''),
        type: 'optional',
      });
    }
  }

  return Array.from(allDeps.values());
}

function formatForSocket(dependencies) {
  return dependencies.map((dep) => ({
    depname: dep.depname,
    ecosystem: dep.ecosystem,
    version: dep.version,
  }));
}

function displayResults(dependencies, packageJson) {
  if (jsonOnly) {
    console.log(JSON.stringify(formatForSocket(dependencies), null, 2));
    return;
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         BSI Dependency Audit - Socket.dev Integration         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Project: ${packageJson.name} v${packageJson.version}`);
  console.log(`Total Dependencies: ${dependencies.length}`);
  console.log('');

  const prodDeps = dependencies.filter((d) => d.type === 'production');
  const devDeps = dependencies.filter((d) => d.type === 'development');
  const optDeps = dependencies.filter((d) => d.type === 'optional');

  console.log(`Production:  ${prodDeps.length}`);
  console.log(`Development: ${devDeps.length}`);
  console.log(`Optional:    ${optDeps.length}`);
  console.log('');
  console.log('─'.repeat(68));
  console.log('');

  if (!isCI) {
    console.log('Dependencies by Type:');
    console.log('');

    if (prodDeps.length > 0) {
      console.log('Production Dependencies:');
      prodDeps.forEach((dep) => {
        console.log(`  • ${dep.depname}@${dep.version}`);
      });
      console.log('');
    }

    if (devDeps.length > 0) {
      console.log('Development Dependencies:');
      devDeps.forEach((dep) => {
        console.log(`  • ${dep.depname}@${dep.version}`);
      });
      console.log('');
    }

    if (optDeps.length > 0) {
      console.log('Optional Dependencies:');
      optDeps.forEach((dep) => {
        console.log(`  • ${dep.depname}@${dep.version}`);
      });
      console.log('');
    }
  }

  console.log('─'.repeat(68));
  console.log('');
  console.log('Socket MCP Payload:');
  console.log('');
  console.log('Socket:depscore({');
  console.log('  packages: [');

  const socketFormat = formatForSocket(dependencies);
  socketFormat.forEach((dep, index) => {
    const comma = index < socketFormat.length - 1 ? ',' : '';
    console.log(
      `    { depname: "${dep.depname}", ecosystem: "${dep.ecosystem}", version: "${dep.version}" }${comma}`
    );
  });

  console.log('  ]');
  console.log('})');
  console.log('');
  console.log('─'.repeat(68));
  console.log('');
  console.log('Next Steps:');
  console.log('1. Copy the Socket:depscore payload above');
  console.log('2. Run it through the Socket MCP tool');
  console.log('3. Review scores for each package (threshold: 70+)');
  console.log('4. Investigate any packages scoring below 70');
  console.log('');
  console.log('Score Thresholds:');
  console.log('  ✅ Healthy:   ≥85 weighted average');
  console.log('  ⚠️  Warning:  70-84 weighted average');
  console.log('  ❌ Critical:  <70 weighted average (block deployment)');
  console.log('');
}

function main() {
  const packageJson = loadPackageJson();
  const dependencies = collectDependencies(packageJson);

  displayResults(dependencies, packageJson);

  if (isCI) {
    console.log('\nCI Mode: Audit data collected successfully.');
    console.log('Run Socket.dev check to validate dependency security.');
  }
}

main();
