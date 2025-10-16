#!/usr/bin/env node

/**
 * Route Map Generator for BlazeSportsIntel Legacy Site
 * Extracts all HTML files and infers API routes from functions/
 *
 * Usage: node scripts/route-map.js
 * Output: archive/2025-10-13/designs/routes/route-map.json
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://blazesportsintel.com';
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'archive/2025-10-13/designs/routes');

// Classification rules
const CLASSIFICATION = {
  KEEP: [
    '/',
    '/about',
    '/legal/privacy',
    '/legal/terms',
    '/legal/accessibility',
    '/legal/copyright',
    '/legal/ai-disclosure',
  ],
  PORT: [
    '/analytics',
    '/copilot',
  ],
  REFACTOR: [
    '/mlb',
    '/nfl',
    '/cfb',
    '/cbb',
  ],
  DELETE: [
    '/nba',  // Removed per API issues
    '/features',  // Moved to /features-config
  ]
};

function scanDirectory(dir, baseUrl = '', routes = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    // Skip directories to ignore
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'archive', 'scripts'].includes(entry.name)) {
        continue;
      }
      // Recurse into subdirectories
      scanDirectory(fullPath, baseUrl + '/' + entry.name, routes);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      // Map HTML file to route
      let route = baseUrl;
      if (entry.name === 'index.html') {
        route = baseUrl || '/';
      } else {
        route = baseUrl + '/' + entry.name.replace('.html', '');
      }

      routes.push({
        path: route,
        file: relativePath,
        type: 'static',
        classification: classifyRoute(route)
      });
    }
  }

  return routes;
}

function scanFunctions() {
  const functionsDir = path.join(ROOT_DIR, 'functions');
  if (!fs.existsSync(functionsDir)) return [];

  const routes = [];

  function scanFunctionDir(dir, apiPath = '/api') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanFunctionDir(fullPath, apiPath + '/' + entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        let route = apiPath;

        // Handle [[route]] dynamic segments
        if (entry.name.startsWith('[[') && entry.name.includes(']]')) {
          route += '/*';
        } else if (entry.name !== 'index.js' && entry.name !== '_middleware.js' && entry.name !== '_utils.js') {
          route += '/' + entry.name.replace('.js', '');
        }

        routes.push({
          path: route,
          file: path.relative(ROOT_DIR, fullPath),
          type: 'api',
          classification: classifyRoute(route)
        });
      }
    }
  }

  scanFunctionDir(functionsDir);
  return routes;
}

function classifyRoute(route) {
  // Check explicit classifications
  for (const [classification, paths] of Object.entries(CLASSIFICATION)) {
    if (paths.includes(route)) return classification;

    // Check prefixes
    for (const p of paths) {
      if (route.startsWith(p + '/')) return classification;
    }
  }

  // Default classification rules
  if (route.includes('/nba')) return 'DELETE';
  if (route.includes('/features.html')) return 'DELETE';
  if (route.includes('/legal/')) return 'KEEP';
  if (route.includes('/api/')) return 'REFACTOR';
  if (route.includes('/copilot')) return 'PORT';
  if (route.includes('/analytics')) return 'PORT';

  // Sports pages need refactor for college baseball focus
  if (route.match(/\/(mlb|nfl|cfb|cbb)/)) return 'REFACTOR';

  return 'REFACTOR';  // Default to refactor for safety
}

function generateSummary(routes) {
  const summary = {
    total: routes.length,
    byType: {},
    byClassification: {},
    routes: routes
  };

  routes.forEach(r => {
    summary.byType[r.type] = (summary.byType[r.type] || 0) + 1;
    summary.byClassification[r.classification] = (summary.byClassification[r.classification] || 0) + 1;
  });

  return summary;
}

function main() {
  console.log('🔍 Scanning BlazeSportsIntel routes...\n');

  // Scan HTML files
  const staticRoutes = scanDirectory(ROOT_DIR);
  console.log(`✓ Found ${staticRoutes.length} static routes (HTML)`);

  // Scan API functions
  const apiRoutes = scanFunctions();
  console.log(`✓ Found ${apiRoutes.length} API routes (functions/)\n`);

  // Combine and sort
  const allRoutes = [...staticRoutes, ...apiRoutes].sort((a, b) => a.path.localeCompare(b.path));

  // Generate summary
  const summary = generateSummary(allRoutes);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write JSON
  const jsonPath = path.join(OUTPUT_DIR, 'route-map.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`✓ Wrote route map to ${path.relative(ROOT_DIR, jsonPath)}`);

  // Write human-readable summary
  const summaryText = `
BlazeSportsIntel Route Inventory
Generated: ${new Date().toISOString()}
Total Routes: ${summary.total}

By Type:
${Object.entries(summary.byType).map(([type, count]) => `  ${type}: ${count}`).join('\n')}

By Classification:
${Object.entries(summary.byClassification).map(([cls, count]) => `  ${cls}: ${count}`).join('\n')}

KEEP (${summary.byClassification.KEEP || 0}):
${allRoutes.filter(r => r.classification === 'KEEP').map(r => `  ${r.path}`).join('\n')}

PORT (${summary.byClassification.PORT || 0}):
${allRoutes.filter(r => r.classification === 'PORT').map(r => `  ${r.path}`).join('\n')}

REFACTOR (${summary.byClassification.REFACTOR || 0}):
${allRoutes.filter(r => r.classification === 'REFACTOR').map(r => `  ${r.path}`).join('\n')}

DELETE (${summary.byClassification.DELETE || 0}):
${allRoutes.filter(r => r.classification === 'DELETE').map(r => `  ${r.path}`).join('\n')}
`;

  const summaryPath = path.join(OUTPUT_DIR, 'route-summary.txt');
  fs.writeFileSync(summaryPath, summaryText.trim());
  console.log(`✓ Wrote summary to ${path.relative(ROOT_DIR, summaryPath)}\n`);

  console.log('📊 Summary:');
  console.log(`   Total: ${summary.total}`);
  console.log(`   KEEP: ${summary.byClassification.KEEP || 0}`);
  console.log(`   PORT: ${summary.byClassification.PORT || 0}`);
  console.log(`   REFACTOR: ${summary.byClassification.REFACTOR || 0}`);
  console.log(`   DELETE: ${summary.byClassification.DELETE || 0}\n`);

  console.log('✅ Route map generation complete!');
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFunctions, classifyRoute, generateSummary };
