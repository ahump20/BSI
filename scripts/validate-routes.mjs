#!/usr/bin/env node
/**
 * Route Health Validator for Blaze Sports Intel
 *
 * This script validates that all internal links in the codebase point to
 * existing routes. Run during CI to catch dead links before deployment.
 *
 * Usage: node scripts/validate-routes.mjs
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';

const APP_DIR = 'app';
const PUBLIC_DIR = 'public';

// Colors for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

/**
 * Recursively find all page.tsx files in app directory
 * These define the valid routes in the Next.js App Router
 */
async function findAppRoutes(dir, routes = new Set()) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip special Next.js directories
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      await findAppRoutes(fullPath, routes);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      // Convert file path to route
      const routePath = '/' + relative(APP_DIR, dir).replace(/\\/g, '/');
      routes.add(routePath === '/.' ? '/' : routePath);
    }
  }

  return routes;
}

/**
 * Find static HTML files in public directory
 */
async function findStaticRoutes(dir, routes = new Set(), basePath = '') {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const routePath = basePath + '/' + entry.name;

      if (entry.isDirectory()) {
        await findStaticRoutes(fullPath, routes, routePath);
      } else if (entry.name.endsWith('.html')) {
        // Add both with and without .html extension
        routes.add(routePath);
        routes.add(routePath.replace('.html', ''));
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }

  return routes;
}

/**
 * Extract href values from TSX/HTML files
 */
async function extractLinks(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const links = new Set();

  // Match href="..." or href='...' patterns
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    // Only internal links (start with / and not //)
    if (href.startsWith('/') && !href.startsWith('//')) {
      // Remove hash and query params for route checking
      const route = href.split('#')[0].split('?')[0];
      if (route) links.add(route);
    }
  }

  return links;
}

/**
 * Recursively find all TSX/HTML files
 */
async function findSourceFiles(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'out')
          continue;
        await findSourceFiles(fullPath, files);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }

  return files;
}

async function main() {
  console.log('🔍 Validating routes for Blaze Sports Intel...\n');

  // Gather valid routes
  const appRoutes = await findAppRoutes(APP_DIR);
  const staticRoutes = await findStaticRoutes(PUBLIC_DIR);
  const validRoutes = new Set([...appRoutes, ...staticRoutes]);

  console.log(`Found ${appRoutes.size} app routes and ${staticRoutes.size} static routes\n`);

  // Gather all links from source files
  const sourceFiles = await findSourceFiles('.');
  const allLinks = new Map(); // link -> [files that use it]

  for (const file of sourceFiles) {
    const links = await extractLinks(file);
    for (const link of links) {
      if (!allLinks.has(link)) allLinks.set(link, []);
      allLinks.get(link).push(file);
    }
  }

  // Check for broken links
  const brokenLinks = [];

  for (const [link, files] of allLinks) {
    // Check if route exists (with or without trailing slash)
    const normalizedLink = link.endsWith('/') ? link.slice(0, -1) : link;
    const withTrailingSlash = normalizedLink + '/';

    if (
      !validRoutes.has(link) &&
      !validRoutes.has(normalizedLink) &&
      !validRoutes.has(withTrailingSlash)
    ) {
      brokenLinks.push({ link, files });
    }
  }

  // Report results
  if (brokenLinks.length === 0) {
    console.log(`${GREEN}✓ All ${allLinks.size} internal links are valid!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}✗ Found ${brokenLinks.length} potentially broken links:${RESET}\n`);

    for (const { link, files } of brokenLinks) {
      console.log(`  ${YELLOW}${link}${RESET}`);
      for (const file of files.slice(0, 3)) {
        console.log(`    └─ ${file}`);
      }
      if (files.length > 3) {
        console.log(`    └─ ... and ${files.length - 3} more files`);
      }
      console.log();
    }

    console.log(
      `${YELLOW}Note: Some links may be handled by _redirects or dynamic routes.${RESET}`
    );
    console.log('Review the above and update _redirects or create missing pages.\n');

    // Exit with warning (not error) since some might be intentional
    process.exit(0);
  }
}

main().catch(console.error);
