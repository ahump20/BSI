#!/usr/bin/env node
/**
 * Generate unique OG images for BSI editorial articles.
 * Uses SVG templates rendered to 1200x630 PNG via sharp.
 *
 * Each article gets a visually distinct card based on:
 *  - Article type (recap, preview, team analysis, conference, draft)
 *  - Unique color accent shifted per article
 *  - Layout variant (diagonal, split, centered)
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'images', 'og');
const EDITORIAL_DIR = join(ROOT, 'app', 'college-baseball', 'editorial');
const MLB_EDITORIAL_DIR = join(ROOT, 'app', 'mlb', 'editorial');

// Ensure output dir
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─── Brand colors ───────────────────────────────────────────
const MIDNIGHT = '#0D0D0D';
const CHARCOAL = '#1A1A1A';
const BURNT_ORANGE = '#BF5700';
const EMBER = '#FF6B35';
const TEXAS_SOIL = '#8B4513';
const BONE = '#F5F0EB';
const WARM_GRAY = '#A89F95';

// ─── Article metadata extraction ────────────────────────────
function extractMetadata(filePath) {
  const src = readFileSync(filePath, 'utf-8');

  // Extract title from metadata block
  const titleMatch = src.match(/title:\s*['"`]([^'"`]+?)(?:\s*\|\s*Blaze Sports Intel)?['"`]/);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extract description
  const descMatch = src.match(/description:\s*\n?\s*['"`]([^'"`]+?)['"`]/);
  const desc = descMatch ? descMatch[1].trim() : null;

  return { title, desc };
}

// ─── Classify article type ──────────────────────────────────
function classifyArticle(slug) {
  if (slug.includes('recap')) return 'recap';
  if (slug.includes('preview')) return 'preview';
  if (slug.includes('draft-profile')) return 'draft';
  if (slug.includes('opening-weekend')) return 'opening';
  if (slug.match(/^(sec|big-12|big-ten|acc)$/)) return 'conference';
  if (slug.includes('what-two-weekends')) return 'analysis';
  if (slug.match(/-2026$/)) return 'team';
  return 'analysis';
}

// ─── Color themes per type ──────────────────────────────────
const TYPE_THEMES = {
  recap: { primary: '#BF5700', secondary: '#FF6B35', accent: '#D97B38', label: 'RECAP' },
  preview: { primary: '#2D5A27', secondary: '#4A8C3F', accent: '#6B8E23', label: 'PREVIEW' },
  draft: { primary: '#355E3B', secondary: '#4A8C3F', accent: '#228B22', label: 'DRAFT PROFILE' },
  opening: { primary: '#8B4513', secondary: '#BF5700', accent: '#D97B38', label: 'OPENING WEEKEND' },
  conference: { primary: '#4A2C6B', secondary: '#6B3FA0', accent: '#8B5CF6', label: 'CONFERENCE PREVIEW' },
  team: { primary: '#1E3A5F', secondary: '#2563EB', accent: '#3B82F6', label: 'TEAM PREVIEW' },
  analysis: { primary: '#BF5700', secondary: '#8B4513', accent: '#D97B38', label: 'ANALYSIS' },
};

// ─── Layout variants ────────────────────────────────────────
// Each article gets a deterministic layout based on slug hash
function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── SVG generators ─────────────────────────────────────────
function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line.length > 0) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 3); // Max 3 lines
}

function generateSvg(slug, title, type, layoutIdx) {
  const theme = TYPE_THEMES[type] || TYPE_THEMES.analysis;
  const lines = wrapText(title || slug.replace(/-/g, ' '), 28);
  const layout = layoutIdx % 3;

  // Angle and position for decorative elements based on hash
  const h = hashSlug(slug);
  const angle = (h % 60) - 30; // -30 to 30 degrees
  const xShift = (h % 200) + 600;

  // Common elements
  const bsiLogo = `
    <text x="60" y="570" font-family="sans-serif" font-weight="700" font-size="14" letter-spacing="4" fill="${BONE}" opacity="0.9">BSI</text>
    <text x="108" y="570" font-family="serif" font-size="11" fill="${WARM_GRAY}" opacity="0.7">BLAZE SPORTS INTEL</text>
  `;

  const labelBadge = `
    <rect x="60" y="${layout === 2 ? 200 : 180}" width="${theme.label.length * 11 + 24}" height="28" rx="4" fill="${theme.primary}" opacity="0.9"/>
    <text x="72" y="${layout === 2 ? 219 : 199}" font-family="monospace" font-weight="600" font-size="11" letter-spacing="2" fill="white">${escapeXml(theme.label)}</text>
  `;

  const titleBlock = lines.map((line, i) => {
    const y = (layout === 2 ? 280 : 260) + i * 62;
    return `<text x="60" y="${y}" font-family="sans-serif" font-weight="700" font-size="52" letter-spacing="-0.5" fill="${BONE}">${escapeXml(line)}</text>`;
  }).join('\n');

  // Layout 0: Diagonal accent stripe
  if (layout === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="${MIDNIGHT}"/>
      <rect x="0" y="0" width="1200" height="630" fill="url(#grad0)"/>
      <defs>
        <linearGradient id="grad0" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${MIDNIGHT}"/>
          <stop offset="60%" stop-color="${CHARCOAL}"/>
          <stop offset="100%" stop-color="${MIDNIGHT}"/>
        </linearGradient>
      </defs>
      <!-- Diagonal accent -->
      <polygon points="${xShift},0 ${xShift + 180},0 ${xShift - 200},630 ${xShift - 380},630" fill="${theme.primary}" opacity="0.12"/>
      <polygon points="${xShift + 40},0 ${xShift + 60},0 ${xShift - 340},630 ${xShift - 360},630" fill="${theme.accent}" opacity="0.25"/>
      <!-- Top accent line -->
      <rect x="0" y="0" width="1200" height="4" fill="${theme.primary}"/>
      <!-- Bottom accent -->
      <rect x="60" y="530" width="120" height="3" rx="1.5" fill="${theme.primary}" opacity="0.8"/>
      ${labelBadge}
      ${titleBlock}
      ${bsiLogo}
      <!-- Corner mark -->
      <text x="1100" y="580" font-family="monospace" font-size="10" fill="${WARM_GRAY}" opacity="0.4" text-anchor="end">blazesportsintel.com</text>
    </svg>`;
  }

  // Layout 1: Left accent bar with gradient field
  if (layout === 1) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="${MIDNIGHT}"/>
      <!-- Radial glow -->
      <circle cx="900" cy="300" r="400" fill="${theme.primary}" opacity="0.06"/>
      <circle cx="200" cy="500" r="300" fill="${theme.secondary}" opacity="0.04"/>
      <!-- Left bar -->
      <rect x="0" y="0" width="8" height="630" fill="${theme.primary}"/>
      <!-- Horizontal rule -->
      <line x1="60" y1="530" x2="400" y2="530" stroke="${theme.primary}" stroke-width="1" opacity="0.4"/>
      <!-- Grid lines -->
      <line x1="0" y1="160" x2="1200" y2="160" stroke="white" stroke-width="0.5" opacity="0.03"/>
      <line x1="0" y1="440" x2="1200" y2="440" stroke="white" stroke-width="0.5" opacity="0.03"/>
      ${labelBadge}
      ${titleBlock}
      ${bsiLogo}
      <text x="1100" y="580" font-family="monospace" font-size="10" fill="${WARM_GRAY}" opacity="0.4" text-anchor="end">blazesportsintel.com</text>
    </svg>`;
  }

  // Layout 2: Centered with geometric frame
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${MIDNIGHT}"/>
    <defs>
      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.primary}" stop-opacity="0.08"/>
        <stop offset="50%" stop-color="${MIDNIGHT}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${theme.secondary}" stop-opacity="0.06"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#grad2)"/>
    <!-- Frame corners -->
    <line x1="40" y1="40" x2="160" y2="40" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
    <line x1="40" y1="40" x2="40" y2="120" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
    <line x1="1040" y1="590" x2="1160" y2="590" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
    <line x1="1160" y1="510" x2="1160" y2="590" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
    <!-- Diamond accent -->
    <polygon points="1080,100 1100,130 1080,160 1060,130" fill="${theme.accent}" opacity="0.15"/>
    ${labelBadge}
    ${titleBlock}
    ${bsiLogo}
    <text x="1100" y="580" font-family="monospace" font-size="10" fill="${WARM_GRAY}" opacity="0.4" text-anchor="end">blazesportsintel.com</text>
  </svg>`;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  const dirs = [
    { base: EDITORIAL_DIR, prefix: 'cbb' },
  ];

  // Also handle MLB editorial if it exists
  if (existsSync(MLB_EDITORIAL_DIR)) {
    dirs.push({ base: MLB_EDITORIAL_DIR, prefix: 'mlb' });
  }

  let generated = 0;
  const updates = []; // Track which articles need metadata updates

  for (const { base, prefix } of dirs) {
    const entries = readdirSync(base).filter(e => {
      const full = join(base, e);
      return statSync(full).isDirectory() && existsSync(join(full, 'page.tsx'));
    });

    for (const slug of entries) {
      if (slug === 'daily') continue; // Skip daily route
      const pagePath = join(base, slug, 'page.tsx');
      const { title } = extractMetadata(pagePath);
      if (!title) {
        console.log(`  SKIP ${slug} (no title found)`);
        continue;
      }

      const type = classifyArticle(slug);
      const layoutIdx = hashSlug(slug);
      const svg = generateSvg(slug, title, type, layoutIdx);
      const outName = `${prefix}-${slug}.png`;
      const outPath = join(OUT_DIR, outName);

      try {
        await sharp(Buffer.from(svg))
          .resize(1200, 630)
          .png({ quality: 90 })
          .toFile(outPath);

        generated++;
        updates.push({ slug, prefix, imagePath: `/images/og/${outName}`, pagePath });
      } catch (err) {
        console.error(`  ERROR ${slug}: ${err.message}`);
      }
    }
  }

  console.log(`\nGenerated ${generated} OG images in ${OUT_DIR}`);

  // Now update page.tsx metadata to point to unique images
  let updated = 0;
  for (const { slug, imagePath, pagePath } of updates) {
    let src = readFileSync(pagePath, 'utf-8');

    // Replace generic OG image with unique one
    const oldOgPattern = /images:\s*\[\{\s*url:\s*['"]\/images\/og-(?:college-baseball|mlb)\.png['"]/g;
    const oldTwitterPattern = /images:\s*\['\/images\/og-(?:college-baseball|mlb)\.png'\]/g;

    if (oldOgPattern.test(src) || oldTwitterPattern.test(src)) {
      src = src.replace(
        /images:\s*\[\{\s*url:\s*['"]\/images\/og-(?:college-baseball|mlb)\.png['"]/g,
        `images: [{ url: '${imagePath}'`
      );
      src = src.replace(
        /images:\s*\['\/images\/og-(?:college-baseball|mlb)\.png'\]/g,
        `images: ['${imagePath}']`
      );
      writeFileSync(pagePath, src);
      updated++;
    }
  }

  console.log(`Updated ${updated} page.tsx files with unique OG image paths`);
}

main().catch(console.error);
