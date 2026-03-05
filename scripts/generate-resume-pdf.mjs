#!/usr/bin/env node
/**
 * Generate a print-quality PDF from the HTML resume.
 * Uses Playwright's Chromium to honor @page CSS rules.
 *
 * Usage: node scripts/generate-resume-pdf.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(
  '/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Docs/Austin Humphrey/AustinHumphrey.com/Austin_Humphrey_Resume_MAIN.html'
);
const OUTPUT = path.resolve(__dirname, '..', 'Austin_Humphrey_Resume.pdf');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`file://${INPUT}`, { waitUntil: 'networkidle' });

  // Wait for Google Fonts to load
  await page.waitForTimeout(2000);

  await page.pdf({
    path: OUTPUT,
    preferCSSPageSize: true,   // honor @page { size: A4; margin: 8mm }
    printBackground: true,      // preserve dark hero background
  });

  console.log(`PDF generated: ${OUTPUT}`);
  await browser.close();
}

main().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
