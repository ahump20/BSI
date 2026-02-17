import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

test.describe('Resume assets verification', () => {
  test('HTML resume renders correctly with all sections', async ({ page }) => {
    const htmlPath = resolve(ROOT, 'public/Austin_Humphrey_Resume.html');
    await page.goto(`file://${htmlPath}`);

    // Page title
    await expect(page).toHaveTitle('Austin Humphrey | Resume');

    // Hero header content
    await expect(page.locator('h1')).toHaveText('Austin Humphrey');
    await expect(page.locator('.hero-title')).toContainText(
      'Sports Intelligence'
    );
    await expect(page.locator('.summary')).toContainText(
      'sports intelligence systems'
    );

    // Contact pills: phone, email, LinkedIn, AustinHumphrey.com, BlazeSportsIntel.com
    const contactLinks = page.locator('.contact a');
    await expect(contactLinks).toHaveCount(5);
    // 5 links + 1 span (Boerne, TX) = 6 total contact items
    const contactItems = page.locator('.contact span, .contact a');
    expect(await contactItems.count()).toBe(6);

    // Experience section
    await expect(page.locator('h2:has-text("Experience")')).toBeVisible();
    await expect(
      page.locator('.role:has-text("Founder & Builder")')
    ).toBeVisible();
    await expect(
      page.locator('.role:has-text("Advertising Account Executive")')
    ).toBeVisible();
    await expect(
      page.locator('.role:has-text("Financial Representative")')
    ).toBeVisible();

    // What I've Built section
    await expect(
      page.locator('h2:has-text("What I\'ve Built")')
    ).toBeVisible();
    const impactCards = page.locator('.impact-card');
    await expect(impactCards).toHaveCount(4);

    // Right column sections
    await expect(
      page.locator('h2:has-text("Core Capabilities")')
    ).toBeVisible();
    await expect(
      page.locator('h2:has-text("Technical Stack")')
    ).toBeVisible();
    await expect(page.locator('h2:has-text("Education")')).toBeVisible();
    await expect(page.locator('h2:has-text("Leadership")')).toBeVisible();

    // Skill chips rendered
    const chips = page.locator('.chip');
    expect(await chips.count()).toBeGreaterThanOrEqual(10);

    // Education entries
    await expect(
      page.locator('.edu-title:has-text("AI & Machine Learning")')
    ).toBeVisible();
    await expect(
      page.locator('.edu-title:has-text("M.S. Entertainment Business")')
    ).toBeVisible();
    await expect(
      page.locator('.edu-title:has-text("B.A. International Relations")')
    ).toBeVisible();

    // Footer
    await expect(page.locator('.footer')).toContainText(
      'References available upon request'
    );

    // Take a screenshot for visual verification
    await page.screenshot({
      path: resolve(ROOT, 'test-results/resume-html-render.png'),
      fullPage: true,
    });
  });

  test('PDF file exists and has reasonable size', async () => {
    const pdfPath = resolve(ROOT, 'public/Austin_Humphrey_Resume.pdf');
    const pdf = readFileSync(pdfPath);

    // PDF header check
    expect(pdf.slice(0, 5).toString()).toBe('%PDF-');

    // Size: should be between 50KB and 1MB (current is ~253KB)
    expect(pdf.length).toBeGreaterThan(50_000);
    expect(pdf.length).toBeLessThan(1_000_000);
  });

  test('Portfolio site public dir has both resume files', async () => {
    const htmlPath = resolve(
      ROOT,
      'portfolio-website/public/Austin_Humphrey_Resume.html'
    );
    const pdfPath = resolve(
      ROOT,
      'portfolio-website/public/Austin_Humphrey_Resume.pdf'
    );

    const html = readFileSync(htmlPath, 'utf-8');
    const pdf = readFileSync(pdfPath);

    // HTML is valid
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Austin Humphrey');
    expect(html).toContain('@page');

    // PDF is valid
    expect(pdf.slice(0, 5).toString()).toBe('%PDF-');

    // Both match the BSI copies
    const bsiHtml = readFileSync(
      resolve(ROOT, 'public/Austin_Humphrey_Resume.html'),
      'utf-8'
    );
    const bsiPdf = readFileSync(
      resolve(ROOT, 'public/Austin_Humphrey_Resume.pdf')
    );

    expect(html).toBe(bsiHtml);
    expect(pdf.equals(bsiPdf)).toBe(true);
  });

  test('Old executive resume is removed from portfolio', async () => {
    const oldPath = resolve(
      ROOT,
      'portfolio-website/public/Austin_Humphrey_Resume_Executive_v2.pdf'
    );
    let exists = true;
    try {
      readFileSync(oldPath);
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });

  test('BSI about page build output contains resume section', async () => {
    const aboutHtml = readFileSync(
      resolve(ROOT, 'out/about/index.html'),
      'utf-8'
    );

    // Resume section markers
    expect(aboutHtml).toContain('Austin_Humphrey_Resume.html');
    expect(aboutHtml).toContain('Austin_Humphrey_Resume.pdf');
    expect(aboutHtml).toContain('View Resume');
    expect(aboutHtml).toContain('Download Resume');
    expect(aboutHtml).toContain('Meet the');
  });

  test('BSI build output includes resume files in out/', async () => {
    const htmlPath = resolve(ROOT, 'out/Austin_Humphrey_Resume.html');
    const pdfPath = resolve(ROOT, 'out/Austin_Humphrey_Resume.pdf');

    const html = readFileSync(htmlPath, 'utf-8');
    const pdf = readFileSync(pdfPath);

    expect(html).toContain('Austin Humphrey');
    expect(pdf.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('Portfolio Hero.tsx download link points to correct PDF', async () => {
    const hero = readFileSync(
      resolve(ROOT, 'portfolio-website/src/components/Hero.tsx'),
      'utf-8'
    );

    // Should reference the new PDF, not the old executive version
    expect(hero).toContain('/Austin_Humphrey_Resume.pdf');
    expect(hero).not.toContain('Executive_v2');
    expect(hero).toContain('download');
  });
});
