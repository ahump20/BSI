#!/usr/bin/env node

/**
 * BSI New Dependency Checker
 * 
 * Checks a single package before adding it to dependencies.
 * Use this script before running npm install for any new package.
 * 
 * Usage:
 *   node scripts/check-new-dep.js <package-name>
 *   node scripts/check-new-dep.js <package-name> <version>
 *   node scripts/check-new-dep.js hono
 *   node scripts/check-new-dep.js hono 4.11.1
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Error: Package name required');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/check-new-dep.js <package-name>');
  console.error('  node scripts/check-new-dep.js <package-name> <version>');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/check-new-dep.js hono');
  console.error('  node scripts/check-new-dep.js hono 4.11.1');
  process.exit(1);
}

const packageName = args[0];
const specifiedVersion = args[1];

async function getLatestVersion(packageName) {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error fetching latest version for ${packageName}:`, error.message);
    return 'unknown';
  }
}

async function getPackageInfo(packageName) {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} --json`);
    return JSON.parse(stdout);
  } catch (error) {
    console.warn(`Could not fetch package info: ${error.message}`);
    return null;
  }
}

function displayPackageInfo(packageName, version, packageInfo) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       BSI New Dependency Check - Socket.dev Integration       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Package: ${packageName}`);
  console.log(`Version: ${version}`);
  console.log('');
  
  if (packageInfo) {
    console.log('Package Information:');
    console.log(`  Description: ${packageInfo.description || 'N/A'}`);
    console.log(`  License: ${packageInfo.license || 'N/A'}`);
    console.log(`  Repository: ${packageInfo.repository?.url || 'N/A'}`);
    console.log(`  Homepage: ${packageInfo.homepage || 'N/A'}`);
    console.log(`  Author: ${packageInfo.author?.name || packageInfo.author || 'N/A'}`);
    
    if (packageInfo.maintainers && packageInfo.maintainers.length > 0) {
      console.log(`  Maintainers: ${packageInfo.maintainers.length}`);
    }
    
    if (packageInfo.keywords && packageInfo.keywords.length > 0) {
      console.log(`  Keywords: ${packageInfo.keywords.slice(0, 5).join(', ')}${packageInfo.keywords.length > 5 ? '...' : ''}`);
    }
    console.log('');
  }
  
  console.log('─'.repeat(68));
  console.log('');
  console.log('Socket MCP Check:');
  console.log('');
  console.log('Socket:depscore({');
  console.log('  packages: [');
  console.log(`    { depname: "${packageName}", ecosystem: "npm", version: "${version}" }`);
  console.log('  ]');
  console.log('})');
  console.log('');
  console.log('─'.repeat(68));
  console.log('');
  console.log('Decision Criteria:');
  console.log('  ✅ Proceed:  Weighted score ≥70');
  console.log('  ❌ Block:    Weighted score <70');
  console.log('');
  console.log('Score Weights:');
  console.log('  • Vulnerability:  35%  (Known CVEs, security issues)');
  console.log('  • Supply Chain:   25%  (Typosquatting, hijacking risk)');
  console.log('  • Maintenance:    20%  (Active development, updates)');
  console.log('  • Quality:        15%  (Code quality indicators)');
  console.log('  • License:        5%   (OSS compliance)');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Copy the Socket:depscore payload above');
  console.log('2. Run it through the Socket MCP tool');
  console.log('3. If weighted score ≥70, proceed with installation:');
  console.log(`   npm install ${packageName}${specifiedVersion ? '@' + specifiedVersion : ''}`);
  console.log('4. If score <70, investigate alternatives or mitigations');
  console.log('');
}

async function main() {
  console.log('Checking package information...\n');
  
  let version = specifiedVersion;
  let packageInfo = null;
  
  if (!version) {
    version = await getLatestVersion(packageName);
  }
  
  packageInfo = await getPackageInfo(packageName);
  
  displayPackageInfo(packageName, version, packageInfo);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
