#!/usr/bin/env node
/**
 * Sitemap generator for blazesportsintel.com
 *
 * Scans app/ directory for page.tsx files, maps them to URLs,
 * and generates a sitemap.xml with appropriate changefreq/priority.
 *
 * Run: node scripts/generate-sitemap.mjs
 * Wired into: npm run build (post-build step)
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE_URL = 'https://blazesportsintel.com';
const APP_DIR = join(import.meta.dirname, '..', 'app');
const OUT_PATH = join(import.meta.dirname, '..', 'public', 'sitemap.xml');

// Routes excluded from sitemap (auth, admin, internal)
const EXCLUDED_PREFIXES = [
  '/auth/',
  '/settings',
  '/dashboard/admin',
  '/checkout/',
  '/vision-AI-Intelligence',
];

// Dynamic route segments — excluded (they need generateStaticParams, not sitemap entries)
const DYNAMIC_SEGMENT_RE = /\[.+\]/;

/**
 * Determine changefreq and priority based on route path.
 */
function routeMeta(route) {
  // Homepage
  if (route === '/') return { changefreq: 'daily', priority: '1.0' };

  // Live data pages — scores update constantly
  if (/\/scores\/?$/.test(route) || route === '/live-scoreboards/')
    return { changefreq: 'hourly', priority: '0.9' };

  // Standings/rankings change daily during season
  if (/\/(standings|rankings)\/?$/.test(route))
    return { changefreq: 'hourly', priority: '0.9' };

  // Flagship: college baseball hub
  if (route === '/college-baseball/')
    return { changefreq: 'daily', priority: '0.9' };

  // Sport hubs
  if (/^\/(mlb|nfl|nba|cfb|college-baseball)\/?$/.test(route))
    return { changefreq: 'daily', priority: '0.8' };

  // Sport sub-pages (games, teams, players, news, stats, transfer-portal)
  if (/^\/(mlb|nfl|nba|cfb|college-baseball)\/[^/]+\/?$/.test(route))
    return { changefreq: 'daily', priority: '0.8' };

  // Intel pages
  if (route.startsWith('/intel/'))
    return { changefreq: 'daily', priority: '0.7' };

  // Models/methodology
  if (route.startsWith('/models/'))
    return { changefreq: 'weekly', priority: '0.6' };

  // Editorial content
  if (/\/editorial\//.test(route) || /\/preseason\//.test(route))
    return { changefreq: 'weekly', priority: '0.7' };

  // Dashboard
  if (route === '/dashboard/')
    return { changefreq: 'daily', priority: '0.7' };

  // Pricing
  if (route === '/pricing/')
    return { changefreq: 'weekly', priority: '0.7' };

  // NIL valuation
  if (route.startsWith('/nil-valuation/'))
    return { changefreq: 'daily', priority: '0.7' };

  // Arcade
  if (route.startsWith('/arcade/'))
    return { changefreq: 'weekly', priority: '0.5' };

  // Static pages (about, contact, privacy, terms)
  if (/^\/(about|contact|for-coaches|for-scouts)\/?$/.test(route))
    return { changefreq: 'monthly', priority: '0.5' };

  if (/^\/(privacy|terms)\/?$/.test(route))
    return { changefreq: 'monthly', priority: '0.3' };

  // Default
  return { changefreq: 'weekly', priority: '0.5' };
}

/**
 * Recursively find all page.tsx files under a directory.
 */
function findPages(dir, pages = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      findPages(full, pages);
    } else if (entry === 'page.tsx' || entry === 'page.ts') {
      pages.push(full);
    }
  }
  return pages;
}

/**
 * Convert a page.tsx file path to a URL route.
 * app/college-baseball/scores/page.tsx -> /college-baseball/scores/
 */
function fileToRoute(filePath) {
  const rel = relative(APP_DIR, filePath)
    .split(sep)
    .join('/');
  // Remove page.tsx from end
  const dir = rel.replace(/\/page\.tsx?$/, '').replace(/^page\.tsx?$/, '');
  if (!dir) return '/';
  return `/${dir}/`;
}

// --- Main ---

const pageFiles = findPages(APP_DIR);
const routes = pageFiles
  .map(fileToRoute)
  .filter((route) => {
    // Exclude routes with dynamic segments
    if (DYNAMIC_SEGMENT_RE.test(route)) return false;
    // Exclude blocked prefixes
    if (EXCLUDED_PREFIXES.some((prefix) => route.startsWith(prefix))) return false;
    return true;
  })
  .sort();

const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const { changefreq, priority } = routeMeta(route);
    return `  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

writeFileSync(OUT_PATH, xml, 'utf-8');
console.log(`✓ Sitemap generated: ${routes.length} URLs → public/sitemap.xml`);
