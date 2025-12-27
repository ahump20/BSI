#!/usr/bin/env node

/**
 * BSI Single Package Dependency Check
 * 
 * Check a single package before installation using Socket.dev scoring.
 * 
 * Usage:
 *   node scripts/check-new-dep.cjs <package-name> [version]
 *   node scripts/check-new-dep.cjs express
 *   node scripts/check-new-dep.cjs express 4.18.2
 *   node scripts/check-new-dep.cjs @types/node latest
 */


// Scoring configuration
const SCORING_WEIGHTS = {
  vulnerability: 0.35,  // 35%
  supplyChain: 0.25,    // 25%
  maintenance: 0.20,    // 20%
  quality: 0.15,        // 15%
  license: 0.05         // 5%
};

const THRESHOLDS = {
  healthy: 85,    // ✅ Healthy: weighted avg ≥ 85
  warning: 70,    // ⚠️  Warning: weighted avg 70-84
  critical: 70    // ❌ Critical: weighted avg < 70 (block deployment)
};

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          BSI Single Package Dependency Checker               ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  node scripts/check-new-dep.cjs <package-name> [version]

Examples:
  node scripts/check-new-dep.cjs express
  node scripts/check-new-dep.cjs express 4.18.2
  node scripts/check-new-dep.cjs @types/node latest
  node scripts/check-new-dep.cjs zod ^3.22.0

Arguments:
  package-name    Required. The npm package name to check
  version         Optional. The version to check (default: latest)
`);
}

/**
 * Display scoring information
 */
function displayScoringInfo() {
  console.log('\n📊 Socket.dev Scoring System:\n');
  console.log('   Each package receives 5 scores (0-100):');
  console.log('   • Vulnerability - Known security vulnerabilities');
  console.log('   • Supply Chain - Package integrity & trustworthiness');
  console.log('   • Maintenance - Update frequency & maintenance quality');
  console.log('   • Quality - Code quality & best practices');
  console.log('   • License - License compatibility & compliance\n');
  
  console.log('📐 Weighted Average Formula:');
  console.log(`   score = (vuln × ${SCORING_WEIGHTS.vulnerability}) + (supply × ${SCORING_WEIGHTS.supplyChain}) + (maint × ${SCORING_WEIGHTS.maintenance}) + (qual × ${SCORING_WEIGHTS.quality}) + (lic × ${SCORING_WEIGHTS.license})`);
  console.log('');
}

/**
 * Display decision matrix
 */
function displayDecisionMatrix() {
  console.log('🎯 Decision Matrix:\n');
  console.log(`   ✅ APPROVE (≥ ${THRESHOLDS.healthy}):  Install without restrictions`);
  console.log(`      - All scores above ${THRESHOLDS.healthy}`);
  console.log('      - No known security issues');
  console.log('      - Well-maintained and high quality\n');
  
  console.log(`   ⚠️  REVIEW (${THRESHOLDS.critical}-${THRESHOLDS.healthy - 1}):   Manual review required`);
  console.log(`      - Weighted average ${THRESHOLDS.critical}-${THRESHOLDS.healthy - 1}`);
  console.log('      - Check specific low scores');
  console.log('      - Consider alternatives\n');
  
  console.log(`   ❌ BLOCK (< ${THRESHOLDS.critical}):    Do not install`);
  console.log(`      - Weighted average below ${THRESHOLDS.critical}`);
  console.log('      - Critical security or supply chain issues');
  console.log('      - Find alternative packages\n');
}

/**
 * Display example output
 */
function displayExampleOutput() {
  console.log('📋 Example Socket.dev Response:\n');
  console.log('   {');
  console.log('     "package": "express@4.18.2",');
  console.log('     "scores": {');
  console.log('       "vulnerability": 98,');
  console.log('       "supplyChain": 95,');
  console.log('       "maintenance": 92,');
  console.log('       "quality": 88,');
  console.log('       "license": 100');
  console.log('     },');
  console.log('     "weightedAverage": 94.15,');
  console.log('     "decision": "✅ APPROVE"');
  console.log('   }\n');
}

/**
 * Create Socket.dev payload for a single package
 */
function createSocketPayload(packageName, version = 'latest') {
  return {
    packages: [
      {
        name: packageName,
        version: version,
        ecosystem: 'npm'
      }
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      timezone: 'America/Chicago',
      repo: 'ahump20/BSI',
      scan_type: 'single_package_check'
    }
  };
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  }
  
  const packageName = args[0];
  const version = args[1] || 'latest';
  
  // Validate package name
  if (!packageName || packageName.startsWith('-')) {
    console.error('❌ Error: Package name is required\n');
    displayHelp();
    process.exit(1);
  }
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          BSI Single Package Dependency Checker               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📦 Checking: ${packageName}@${version}\n`);
  
  displayScoringInfo();
  displayDecisionMatrix();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📤 Socket.dev API Payload:\n');
  
  const payload = createSocketPayload(packageName, version);
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Next Steps:\n');
  console.log('   1. Copy the payload above');
  console.log('   2. Send to Socket.dev depscore API:');
  console.log('      POST https://api.socket.dev/v0/depscore');
  console.log('   3. Review the weighted score:');
  console.log(`      • ≥ ${THRESHOLDS.healthy}: Approve installation`);
  console.log(`      • ${THRESHOLDS.critical}-${THRESHOLDS.healthy - 1}: Manual review required`);
  console.log(`      • < ${THRESHOLDS.critical}: Block installation`);
  console.log('   4. If approved: npm install ' + packageName + (version !== 'latest' ? `@${version}` : ''));
  console.log('');
  
  displayExampleOutput();
  
  console.log('📚 Socket.dev Resources:');
  console.log('   • API Docs: https://docs.socket.dev/reference/depscore');
  console.log('   • Package Search: https://socket.dev/npm/package/' + packageName);
  console.log('');
}

// Run the script
main();
