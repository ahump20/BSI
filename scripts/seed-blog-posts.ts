/**
 * Seed script: blog_posts D1 table + R2 content
 *
 * Run: npx tsx scripts/seed-blog-posts.ts
 *
 * Env required:
 *   CLOUDFLARE_API_TOKEN   — API token with D1:Edit + R2:Edit permissions
 *   CLOUDFLARE_ACCOUNT_ID  — Your Cloudflare account ID
 *
 * What this does:
 *   1. Uploads Texas Week 1 Recap markdown → R2 blog-posts/{slug}.md
 *   2. Inserts published row for article #1 into D1 via wrangler (spawnSync)
 *   3. Inserts draft (published=0) stub rows for articles #2-6
 */

import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_BUCKET = 'bsi-game-assets';
const D1_DB = 'bsi-prod-db';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Article definitions
// ---------------------------------------------------------------------------

const TEXAS_SLUG =
  'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026';
const MARKDOWN_SOURCE = join(
  process.env.HOME ?? '',
  'Austin-Writing---Communication-Style-Archive',
  'texas-baseball-week1-recap-lamar-preview-msu-series-2026.md'
);

const posts = [
  {
    slug: TEXAS_SLUG,
    title:
      'Texas Baseball Week 1: UC Davis Sweep + Lamar Preview + Michigan State Series',
    subtitle:
      'Week 1 distilled: what the numbers say, Tuesday preview, and Weekend 2 keys',
    description:
      'Texas opens 3-0 with a UC Davis sweep. What the numbers actually say, plus a Tuesday matchup preview vs Lamar and a Weekend 2 series look at Michigan State.',
    author: 'Austin Humphrey',
    category: 'sports-editorial',
    tags: JSON.stringify(['Texas Longhorns', 'NCAA Baseball', 'SEC', 'Preview', 'Recap']),
    featured: 1,
    published: 1,
    published_at: '2026-02-17T12:00:00.000Z',
    read_time_mins: 6,
    word_count: 850,
    source_context: 'Original reporting — Blaze Sports Intel',
    hasContent: true,
  },
  {
    slug: 'cardinals-strategic-intelligence-framework',
    title: 'Cardinals Strategic Intelligence Framework',
    subtitle: 'How the organization builds sustainable competitive advantage',
    description:
      'A systems-level analysis of how the St. Louis Cardinals construct long-term organizational intelligence — from draft philosophy to pitching development infrastructure.',
    author: 'Austin Humphrey',
    category: 'sports-business',
    tags: JSON.stringify(['St. Louis Cardinals', 'MLB', 'Front Office', 'Analytics']),
    featured: 0,
    published: 0,
    published_at: '2026-02-01T12:00:00.000Z',
    read_time_mins: 12,
    word_count: 3200,
    source_context: 'Full Sail MAN6224 — needs editorial adaptation',
    hasContent: false,
  },
  {
    slug: 'texas-longhorns-revenue-transformation-sec-era',
    title: 'Texas Longhorns Revenue Transformation in the SEC Era',
    subtitle: 'What the move means beyond TV money',
    description:
      'Conference realignment is a business story. Texas joining the SEC reshapes revenue streams, recruiting leverage, and brand equity in ways the box score will never show.',
    author: 'Austin Humphrey',
    category: 'sports-business',
    tags: JSON.stringify(['Texas Longhorns', 'SEC', 'Revenue', 'Conference Realignment']),
    featured: 0,
    published: 0,
    published_at: '2026-01-15T12:00:00.000Z',
    read_time_mins: 10,
    word_count: 2800,
    source_context: 'Full Sail MAN6224 — needs editorial adaptation',
    hasContent: false,
  },
  {
    slug: 'championship-leadership-nick-saban-systems',
    title: "Championship Leadership Through Systems — Nick Saban",
    subtitle: "What 'the process' actually means at the organizational level",
    description:
      "Saban's dynasty isn't about discipline — it's about systems that make discipline inevitable. A breakdown of the structure behind the results.",
    author: 'Austin Humphrey',
    category: 'leadership',
    tags: JSON.stringify(['Nick Saban', 'Alabama', 'Leadership', 'CFB']),
    featured: 0,
    published: 0,
    published_at: '2026-01-05T12:00:00.000Z',
    read_time_mins: 9,
    word_count: 2500,
    source_context: 'Full Sail EXL-O — needs editorial adaptation',
    hasContent: false,
  },
  {
    slug: 'augie-garrido-legacy-of-leadership',
    title: 'Augie Garrido — A Legacy of Leadership',
    subtitle: 'What five national championships taught us about coaching philosophy',
    description:
      "Garrido's program was built on one idea: control what you can control. That principle scaled from individual at-bats to 37-year careers.",
    author: 'Austin Humphrey',
    category: 'leadership',
    tags: JSON.stringify(['Augie Garrido', 'Texas Longhorns', 'College Baseball', 'Coaching']),
    featured: 0,
    published: 0,
    published_at: '2025-12-20T12:00:00.000Z',
    read_time_mins: 8,
    word_count: 2200,
    source_context: 'Full Sail EXL-O — needs editorial adaptation',
    hasContent: false,
  },
  {
    slug: 'nil-revolution-college-athletics-analysis',
    title: 'NIL Revolution — What Actually Changed in College Athletics',
    subtitle: 'Two years in: who won, who lost, what the market revealed',
    description:
      'NIL was supposed to redistribute power to athletes. The data shows something more complicated — and more interesting.',
    author: 'Austin Humphrey',
    category: 'sports-business',
    tags: JSON.stringify(['NIL', 'College Athletics', 'NCAA', 'Revenue', 'Players']),
    featured: 0,
    published: 0,
    published_at: '2025-12-10T12:00:00.000Z',
    read_time_mins: 11,
    word_count: 3000,
    source_context: 'Full Sail LSP-O — needs editorial adaptation',
    hasContent: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Step 1: Upload Texas recap markdown to R2 via Cloudflare REST API
// ---------------------------------------------------------------------------

async function uploadToR2(slug: string, content: string): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/blog-posts%2F${slug}.md`;

  console.log(`[R2] Uploading blog-posts/${slug}.md …`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'text/markdown; charset=utf-8',
    },
    body: content,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  console.log(`[R2] ✓ Uploaded blog-posts/${slug}.md`);
}

// ---------------------------------------------------------------------------
// Step 2: Seed D1 rows via wrangler (spawnSync, no shell injection)
// ---------------------------------------------------------------------------

function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

function buildInsertSql(post: (typeof posts)[number]): string {
  return (
    `INSERT OR IGNORE INTO blog_posts` +
    ` (slug, title, subtitle, description, author, category, tags,` +
    `  featured, published, published_at, read_time_mins, word_count, source_context)` +
    ` VALUES` +
    ` ('${escSql(post.slug)}',` +
    `  '${escSql(post.title)}',` +
    `  '${escSql(post.subtitle)}',` +
    `  '${escSql(post.description)}',` +
    `  '${escSql(post.author)}',` +
    `  '${escSql(post.category)}',` +
    `  '${escSql(post.tags)}',` +
    `  ${post.featured}, ${post.published},` +
    `  '${post.published_at}',` +
    `  ${post.read_time_mins}, ${post.word_count},` +
    `  '${escSql(post.source_context)}')`
  );
}

function runD1(sql: string, label: string): void {
  console.log(`[D1] ${label} …`);

  // spawnSync with argument array — no shell, no injection surface
  const result = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', D1_DB, '--remote', '--command', sql],
    { stdio: 'inherit', encoding: 'utf-8', cwd: process.cwd() }
  );

  if (result.status !== 0) {
    throw new Error(`[D1] wrangler d1 execute failed for: ${label}`);
  }
  console.log(`[D1] ✓ ${label}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== BSI Blog Post Seed ===\n');

  // 1. Upload Texas recap content to R2
  const texasPost = posts[0];
  try {
    let markdownContent = readFileSync(MARKDOWN_SOURCE, 'utf-8');
    // Strip YAML frontmatter before storing
    markdownContent = markdownContent.replace(/^---[\s\S]*?---\n/, '');
    await uploadToR2(texasPost.slug, markdownContent);
  } catch (err) {
    console.error('[R2] Upload error:', err);
    console.log('[R2] Continuing with D1 seed…');
  }

  // 2. Seed all D1 rows
  for (const post of posts) {
    const sql = buildInsertSql(post);
    runD1(sql, `INSERT ${post.slug}`);
  }

  console.log('\n=== Seed complete ===');
  console.log(`Published: ${posts.filter((p) => p.published).length}`);
  console.log(`Drafts:    ${posts.filter((p) => !p.published).length}`);
  console.log('\nVerify:');
  console.log(
    `  npx wrangler d1 execute ${D1_DB} --remote --command="SELECT slug, title, published FROM blog_posts;"`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
