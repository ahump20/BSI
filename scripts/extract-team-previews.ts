/**
 * Extract team preview data from editorial page.tsx files into JSON.
 *
 * Reads each app/college-baseball/editorial/*-2026/page.tsx that uses
 * SECTeamPreviewTemplate, extracts the seoConfig and TeamPreviewData
 * objects, and writes them as content/team-previews-2026/{slug}.json.
 *
 * Run: npx tsx scripts/extract-team-previews.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EDITORIAL_DIR = path.join(ROOT, 'app', 'college-baseball', 'editorial');
const OUTPUT_DIR = path.join(ROOT, 'content', 'team-previews-2026');

// ── Helpers ──────────────────────────────────────────────────────────

/** Brace-counting extractor: given source and a start pattern like
 *  `const seoConfig = {`, returns the full object literal string
 *  (including outer braces). */
function extractObjectLiteral(source: string, startPattern: string): string {
  const idx = source.indexOf(startPattern);
  if (idx === -1) throw new Error(`Pattern not found: ${startPattern}`);

  // Find the opening brace
  const braceStart = source.indexOf('{', idx);
  if (braceStart === -1) throw new Error(`No opening brace after: ${startPattern}`);

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let escaped = false;

  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (inSingleQuote) {
      if (ch === "'") inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (ch === '"') inDoubleQuote = false;
      continue;
    }
    if (inTemplateLiteral) {
      if (ch === '`') inTemplateLiteral = false;
      continue;
    }

    if (ch === "'") { inSingleQuote = true; continue; }
    if (ch === '"') { inDoubleQuote = true; continue; }
    if (ch === '`') { inTemplateLiteral = true; continue; }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  throw new Error(`Unbalanced braces for: ${startPattern}`);
}

/** Convert a TypeScript object literal string to valid JSON. */
function tsObjectToJson(tsLiteral: string): unknown {
  let s = tsLiteral;

  // Step 1: Replace single-quoted strings with double-quoted strings.
  // This is tricky because of apostrophes inside strings like `Vaughn's`.
  // Strategy: walk character by character and convert.
  s = convertQuotes(s);

  // Step 2: Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Step 3: Quote unquoted keys. TS allows `keyName:` but JSON requires `"keyName":`
  // Match word characters (and dots? no) at start of key position
  s = s.replace(/(?<=[\{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '"$1"$2');

  // Step 4: Handle single-word string values that might not be quoted
  // (unlikely in these files, but safe)

  try {
    return JSON.parse(s);
  } catch (e) {
    // Try a more aggressive cleanup
    throw new Error(`JSON parse failed: ${(e as Error).message}\n\nInput:\n${s.slice(0, 500)}...`);
  }
}

/** Convert single-quoted strings to double-quoted strings, handling
 *  escaped single quotes (apostrophes) inside strings like `don\'t`. */
function convertQuotes(input: string): string {
  const chars: string[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === "'") {
      // Start of a single-quoted string — convert to double-quoted
      chars.push('"');
      i++;
      while (i < input.length) {
        const c = input[i];
        if (c === '\\' && i + 1 < input.length) {
          const next = input[i + 1];
          if (next === "'") {
            // Escaped single quote inside single-quoted string → just an apostrophe
            // In JSON double-quoted string, apostrophe doesn't need escaping
            chars.push("'");
            i += 2;
          } else if (next === '"') {
            // Literal double quote inside — needs escaping in JSON
            chars.push('\\"');
            i += 2;
          } else {
            chars.push(c, next);
            i += 2;
          }
        } else if (c === '"') {
          // Unescaped double quote inside single-quoted string — escape it
          chars.push('\\"');
          i++;
        } else if (c === "'") {
          // End of single-quoted string
          chars.push('"');
          i++;
          break;
        } else {
          chars.push(c);
          i++;
        }
      }
    } else if (ch === '"') {
      // Already a double-quoted string — pass through
      chars.push(ch);
      i++;
      while (i < input.length) {
        const c = input[i];
        if (c === '\\' && i + 1 < input.length) {
          chars.push(c, input[i + 1]);
          i += 2;
        } else if (c === '"') {
          chars.push(c);
          i++;
          break;
        } else {
          chars.push(c);
          i++;
        }
      }
    } else {
      chars.push(ch);
      i++;
    }
  }

  return chars.join('');
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const dirs = fs.readdirSync(EDITORIAL_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.endsWith('-2026'))
    .map(d => d.name)
    .sort();

  let extracted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dirName of dirs) {
    const filePath = path.join(EDITORIAL_DIR, dirName, 'page.tsx');
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP (no page.tsx): ${dirName}`);
      skipped++;
      continue;
    }

    const source = fs.readFileSync(filePath, 'utf-8');

    // Only process files that use SECTeamPreviewTemplate
    if (!source.includes('SECTeamPreviewTemplate')) {
      console.log(`SKIP (not team preview): ${dirName}`);
      skipped++;
      continue;
    }

    try {
      // Extract seoConfig
      const seoRaw = extractObjectLiteral(source, 'const seoConfig = {');
      const seo = tsObjectToJson(seoRaw);

      // Extract data: TeamPreviewData
      // Handle both `const data: TeamPreviewData = {` and `const data = {`
      let dataPattern = 'const data: TeamPreviewData = {';
      if (!source.includes(dataPattern)) {
        dataPattern = 'const data = {';
      }
      const dataRaw = extractObjectLiteral(source, dataPattern);
      const data = tsObjectToJson(dataRaw);

      // Write JSON
      const outPath = path.join(OUTPUT_DIR, `${dirName}.json`);
      const json = { seo, data };
      fs.writeFileSync(outPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');

      console.log(`OK: ${dirName}`);
      extracted++;
    } catch (err) {
      const msg = `ERROR: ${dirName} — ${(err as Error).message}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`Extracted: ${extracted}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Errors:    ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nFailed files:');
    errors.forEach(e => console.log(`  ${e}`));
    process.exit(1);
  }
}

main();
