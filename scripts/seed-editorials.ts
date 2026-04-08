/**
 * Seed the editorials D1 table from static editorial page metadata.
 *
 * Reads all editorial page files, extracts title/description/date from
 * metadata exports or layout files, and generates SQL INSERT statements.
 *
 * Usage:
 *   npx tsx scripts/seed-editorials.ts > /tmp/editorial-seed.sql
 *   wrangler d1 execute bsi-prod-db --remote --file=/tmp/editorial-seed.sql
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EDITORIAL_DIR = path.join(__dirname, '..', 'app', 'college-baseball', 'editorial');

interface EditorialMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

function extractFromFile(content: string, slug: string): EditorialMeta | null {
  // Try extracting title from metadata export
  let title = '';
  let description = '';
  let date = '';

  // Match title: 'something' or title: "something"
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  if (titleMatch) title = titleMatch[1];

  // Match description — handle multiline and escaped quotes
  const descMatch = content.match(/description:\s*\n?\s*['"`]([\s\S]*?)['"`]\s*[,;)]/);
  if (descMatch) description = descMatch[1].replace(/\s+/g, ' ').trim();

  // Match publishedTime or date
  const dateMatch = content.match(/publishedTime:\s*['"](\d{4}-\d{2}-\d{2})['"]/);
  if (dateMatch) date = dateMatch[1];
  if (!date) {
    const dateMatch2 = content.match(/datePublished:\s*['"](\d{4}-\d{2}-\d{2})['"]/);
    if (dateMatch2) date = dateMatch2[1];
  }
  if (!date) {
    // Try extracting from date strings like 'March 25, 2026'
    const dateStrMatch = content.match(/date:\s*['"]([A-Z][a-z]+ \d+, \d{4})['"]/);
    if (dateStrMatch) {
      const d = new Date(dateStrMatch[1]);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0];
      }
    }
  }

  if (!title) return null;
  if (!date) date = '2026-01-01'; // fallback

  // Categorize
  let category = 'article';
  if (slug.includes('recap')) category = 'recap';
  else if (slug.includes('preview')) category = 'preview';
  else if (slug.includes('draft-profile')) category = 'draft-profile';
  else if (slug.match(/^[a-z]+-2026$/)) category = 'team-preview';
  else if (slug.includes('opening-weekend')) category = 'recap';

  return {
    slug,
    title: title.replace(/\| BSI$/, '').replace(/\| Blaze Sports Intel$/, '').trim(),
    description: description.slice(0, 500),
    date,
    category,
  };
}

function main() {
  const dirs = fs.readdirSync(EDITORIAL_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'daily')
    .map(d => d.name);

  const metas: EditorialMeta[] = [];

  for (const slug of dirs) {
    const pageFile = path.join(EDITORIAL_DIR, slug, 'page.tsx');
    const layoutFile = path.join(EDITORIAL_DIR, slug, 'layout.tsx');

    let meta: EditorialMeta | null = null;

    // Try layout first (has Metadata export)
    if (fs.existsSync(layoutFile)) {
      const content = fs.readFileSync(layoutFile, 'utf-8');
      meta = extractFromFile(content, slug);
    }

    // Then try page
    if (!meta && fs.existsSync(pageFile)) {
      const content = fs.readFileSync(pageFile, 'utf-8');
      meta = extractFromFile(content, slug);
    }

    if (meta) {
      metas.push(meta);
    } else {
      process.stderr.write(`WARN: Could not extract metadata for ${slug}\n`);
    }
  }

  // Sort by date descending
  metas.sort((a, b) => b.date.localeCompare(a.date));

  // Generate SQL
  console.log('-- Editorial seed data generated from static page metadata');
  console.log(`-- ${metas.length} articles found\n`);

  for (const m of metas) {
    const title = m.title.replace(/\\'/g, "'").replace(/'/g, "''");
    const desc = m.description.replace(/\\'/g, "'").replace(/'/g, "''");
    console.log(
      `INSERT OR IGNORE INTO editorials (slug, date, title, preview, category) VALUES ('${m.slug}', '${m.date}', '${title}', '${desc}', '${m.category}');`
    );
  }
}

main();
