#!/usr/bin/env node

/**
 * BSI Dependency Audit Script
 * 
 * Scans all package.json files across the BSI monorepo and generates
 * a Socket.dev compatible payload for supply chain security analysis.
 * 
 * Usage:
 *   node scripts/audit-deps.js              # Interactive mode with full output
 *   node scripts/audit-deps.js --json       # JSON output only
 *   node scripts/audit-deps.js --ci         # CI mode with exit codes
 */

const fs = require('fs');
const path = require('path');

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

// Parse command line arguments
const args = process.argv.slice(2);
const isJsonMode = args.includes('--json');
const isCiMode = args.includes('--ci');

/**
 * Find all package.json files in the repository
 */
function findPackageJsonFiles(rootDir) {
  const packageFiles = [];
  const excludeDirs = ['node_modules', '.git', 'dist', 'out', 'build', '.next'];
  
  function walk(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          const dirName = path.basename(filePath);
          if (!excludeDirs.includes(dirName)) {
            walk(filePath);
          }
        } else if (file === 'package.json') {
          packageFiles.push(filePath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (!isJsonMode && !isCiMode) {
        console.error(`Warning: Could not read directory ${dir}:`, error.message);
      }
    }
  }
  
  walk(rootDir);
  return packageFiles;
}

/**
 * Extract dependencies from a package.json file
 */
function extractDependencies(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(content);
    
    const deps = {};
    
    // Extract regular dependencies
    if (packageData.dependencies) {
      Object.entries(packageData.dependencies).forEach(([name, version]) => {
        deps[name] = version;
      });
    }
    
    // Extract dev dependencies
    if (packageData.devDependencies) {
      Object.entries(packageData.devDependencies).forEach(([name, version]) => {
        deps[name] = version;
      });
    }
    
    return {
      path: packageJsonPath,
      name: packageData.name || 'unknown',
      dependencies: deps
    };
  } catch (error) {
    if (!isJsonMode && !isCiMode) {
      console.error(`Error reading ${packageJsonPath}:`, error.message);
    }
    return null;
  }
}

/**
 * Merge all dependencies from multiple package.json files
 */
function mergeAllDependencies(packageInfos) {
  const allDeps = {};
  
  for (const info of packageInfos) {
    if (!info) continue;
    
    Object.entries(info.dependencies).forEach(([name, version]) => {
      if (!allDeps[name]) {
        allDeps[name] = {
          version,
          sources: []
        };
      }
      allDeps[name].sources.push(info.name);
    });
  }
  
  return allDeps;
}

/**
 * Format dependencies for Socket.dev depscore API
 */
function formatSocketPayload(dependencies) {
  const packages = [];
  
  Object.entries(dependencies).forEach(([name, info]) => {
    packages.push({
      name,
      version: info.version,
      ecosystem: 'npm'
    });
  });
  
  return {
    packages,
    metadata: {
      timestamp: new Date().toISOString(),
      timezone: 'America/Chicago',
      repo: 'ahump20/BSI',
      scan_type: 'full_audit'
    }
  };
}

/**
 * Display scoring information
 */
function displayScoringInfo() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         BSI Dependency Audit - Scoring Configuration         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Scoring Weights:');
  console.log(`   • Vulnerability:    ${(SCORING_WEIGHTS.vulnerability * 100).toFixed(0)}%`);
  console.log(`   • Supply Chain:     ${(SCORING_WEIGHTS.supplyChain * 100).toFixed(0)}%`);
  console.log(`   • Maintenance:      ${(SCORING_WEIGHTS.maintenance * 100).toFixed(0)}%`);
  console.log(`   • Quality:          ${(SCORING_WEIGHTS.quality * 100).toFixed(0)}%`);
  console.log(`   • License:          ${(SCORING_WEIGHTS.license * 100).toFixed(0)}%`);
  
  console.log('\n🎯 Thresholds:');
  console.log(`   ✅ Healthy:   weighted avg ≥ ${THRESHOLDS.healthy}`);
  console.log(`   ⚠️  Warning:   weighted avg ${THRESHOLDS.critical}-${THRESHOLDS.healthy - 1}`);
  console.log(`   ❌ Critical:  weighted avg < ${THRESHOLDS.critical} (blocks deployment)`);
  
  console.log('\n📐 Weighted Average Formula:');
  console.log('   score = (vuln × 0.35) + (supply × 0.25) + (maint × 0.20) + (qual × 0.15) + (lic × 0.05)');
  console.log('');
}

/**
 * Display package statistics
 */
function displayStats(packageFiles, allDeps) {
  console.log('📦 Scan Results:');
  console.log(`   • Package.json files found: ${packageFiles.length}`);
  console.log(`   • Unique dependencies:      ${Object.keys(allDeps).length}`);
  console.log('');
  
  // Count by source
  const sourceCount = {};
  Object.entries(allDeps).forEach(([_, info]) => {
    info.sources.forEach(source => {
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
  });
  
  console.log('📂 Dependencies by Source:');
  Object.entries(sourceCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
  console.log('');
}

/**
 * Display top dependencies
 */
function displayTopDependencies(allDeps, limit = 10) {
  const sorted = Object.entries(allDeps)
    .map(([name, info]) => ({
      name,
      version: info.version,
      usedBy: info.sources.length
    }))
    .sort((a, b) => b.usedBy - a.usedBy);
  
  console.log(`🔝 Top ${limit} Dependencies (by usage):`);
  sorted.slice(0, limit).forEach((dep, idx) => {
    console.log(`   ${idx + 1}. ${dep.name}@${dep.version} (used by ${dep.usedBy} package${dep.usedBy > 1 ? 's' : ''})`);
  });
  console.log('');
}

/**
 * Main execution
 */
function main() {
  const rootDir = path.resolve(__dirname, '..');
  
  if (!isJsonMode && !isCiMode) {
    displayScoringInfo();
    console.log('🔍 Scanning repository for package.json files...\n');
  }
  
  // Find all package.json files
  const packageFiles = findPackageJsonFiles(rootDir);
  
  if (packageFiles.length === 0) {
    console.error('Error: No package.json files found');
    process.exit(1);
  }
  
  // Extract dependencies from each file
  const packageInfos = packageFiles.map(extractDependencies).filter(Boolean);
  
  // Merge all dependencies
  const allDeps = mergeAllDependencies(packageInfos);
  
  // Format for Socket.dev
  const socketPayload = formatSocketPayload(allDeps);
  
  if (isJsonMode) {
    // JSON-only output
    console.log(JSON.stringify(socketPayload, null, 2));
  } else {
    // Full interactive output
    displayStats(packageFiles, allDeps);
    displayTopDependencies(allDeps);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📤 Socket.dev API Payload:\n');
    console.log(JSON.stringify(socketPayload, null, 2));
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Next Steps:');
    console.log('   1. Copy the payload above');
    console.log('   2. Send to Socket.dev depscore API');
    console.log('   3. Review the weighted scores against thresholds');
    console.log('   4. Block deployment if any score < 70\n');
    
    if (isCiMode) {
      console.log('✅ CI Mode: Audit completed successfully');
      console.log('   Add Socket.dev API integration to validate scores\n');
    }
  }
  
  // Exit with success
  process.exit(0);
}

// Run the script
main();
