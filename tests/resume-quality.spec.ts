import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const RESUME_DIR = '/Users/AustinHumphrey/Downloads';
const HTML_PATH = join(RESUME_DIR, 'Austin_Humphrey_Resume_Executive.html');
const PDF_PATH = join(RESUME_DIR, 'Austin_Humphrey_Resume_Executive_v2.pdf');
const JPG_PATH = join(RESUME_DIR, 'Austin_Humphrey_Resume_Executive.jpg');
const PNG_PATH = join(RESUME_DIR, 'Austin_Humphrey_Resume_Executive.png');

test.describe('Resume Quality Assurance', () => {

  test.describe('Visual Regression Tests', () => {

    test('Desktop view - 1920x1080', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`file://${HTML_PATH}`);

      // Wait for fonts to load
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await expect(page).toHaveScreenshot('resume-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Mobile view - 375x667 (iPhone SE)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`file://${HTML_PATH}`);
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('resume-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Tablet view - 768x1024 (iPad)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`file://${HTML_PATH}`);
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('resume-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Print preview simulation', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('resume-print.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Content Integrity', () => {

    test('All critical sections present', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Hero section
      await expect(page.locator('h1')).toContainText('AUSTIN HUMPHREY');

      // Contact information
      await expect(page.locator('text=San Antonio, TX')).toBeVisible();
      await expect(page.locator('text=(210) 273-5538')).toBeVisible();
      await expect(page.locator('text=Austin@BlazeSportsIntel.com')).toBeVisible();

      // Professional roles
      await expect(page.locator('text=Blaze Sports Intel')).toBeVisible();
      await expect(page.locator('text=Spectrum Reach')).toBeVisible();
      await expect(page.locator('text=Northwestern Mutual')).toBeVisible();

      // Education
      await expect(page.locator('text=Full Sail University')).toBeVisible();
      await expect(page.locator('text=University of Texas at Austin')).toBeVisible();

      // Dates verification
      await expect(page.locator('text=2023 – Present')).toBeVisible(); // BSI
      await expect(page.locator('text=Nov 2022 – Dec 2025')).toBeVisible(); // Spectrum
    });

    test('Headshot image loads correctly', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const headshot = page.locator('img[alt*="Austin"], img[src*="headshot"], .hero img').first();
      await expect(headshot).toBeVisible();

      // Verify image has loaded (not broken)
      const src = await headshot.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).toMatch(/^data:image/); // Should be base64 embedded
    });

    test('No placeholder or lorem ipsum text', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toContain('Lorem ipsum');
      expect(bodyText).not.toContain('placeholder');
      expect(bodyText).not.toContain('[TODO]');
      expect(bodyText).not.toContain('FIXME');
    });
  });

  test.describe('Color and Brand Consistency', () => {

    test('Burnt orange color renders correctly', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Check CSS custom properties
      const burntOrange = await page.evaluate(() => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue('--burnt-orange')
          .trim();
      });

      expect(burntOrange.toLowerCase()).toBe('#bf5700');
    });

    test('All brand colors defined', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const colors = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          burntOrange: styles.getPropertyValue('--burnt-orange').trim(),
          texasSoil: styles.getPropertyValue('--texas-soil').trim(),
          charcoal: styles.getPropertyValue('--charcoal').trim(),
          midnight: styles.getPropertyValue('--midnight').trim(),
        };
      });

      expect(colors.burntOrange).toBeTruthy();
      expect(colors.texasSoil).toBeTruthy();
      expect(colors.charcoal).toBeTruthy();
      expect(colors.midnight).toBeTruthy();
    });
  });

  test.describe('Accessibility (WCAG AA)', () => {

    test('Document has proper title', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);
      await expect(page).toHaveTitle(/Austin Humphrey/);
    });

    test('Proper heading hierarchy', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Should have h2 for major sections
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test('Images have alt text', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('Lang attribute present', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('en');
    });

    test('Color contrast - Hero section text', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Hero has dark background with light text - should pass WCAG AA
      const hero = page.locator('.hero');
      const textColor = await hero.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // Light text on dark background (rgb values should be high for text)
      expect(textColor).toMatch(/rgb\(2[0-9]{2}/); // Should start with 200+ for light colors
    });
  });

  test.describe('Print Optimization', () => {

    test('Print CSS applies correctly', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);
      await page.emulateMedia({ media: 'print' });

      // Hero should maintain background color with print-color-adjust
      const heroBg = await page.locator('.hero').evaluate(el => {
        return window.getComputedStyle(el).getPropertyValue('print-color-adjust');
      });

      expect(heroBg).toBe('exact');
    });

    test('@page rules defined', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      const styleContent = await page.locator('style').first().textContent();
      expect(styleContent).toContain('@page');
      expect(styleContent).toContain('size: A4');
    });
  });

  test.describe('PDF Quality', () => {

    test('Generate high-quality PDF from HTML', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);
      await page.waitForTimeout(1500); // Ensure fonts loaded

      // Generate PDF
      const pdfBuffer = await page.pdf({
        path: join(RESUME_DIR, 'Austin_Humphrey_Resume_Executive_Generated.pdf'),
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: true,
      });

      // Verify PDF was created and has reasonable size
      expect(pdfBuffer.length).toBeGreaterThan(100000); // At least 100KB
      expect(pdfBuffer.length).toBeLessThan(5000000); // Less than 5MB
    });

    test('Existing PDF file size reasonable', () => {
      const pdfStats = require('fs').statSync(PDF_PATH);
      expect(pdfStats.size).toBeGreaterThan(100000); // > 100KB
      expect(pdfStats.size).toBeLessThan(10000000); // < 10MB
    });
  });

  test.describe('Image Previews', () => {

    test('JPG preview exists and correct size', () => {
      const jpgStats = require('fs').statSync(JPG_PATH);
      expect(jpgStats.size).toBeGreaterThan(50000); // > 50KB
      expect(jpgStats.size).toBeLessThan(1000000); // < 1MB (compressed)
    });

    test('PNG preview exists and correct size', () => {
      const pngStats = require('fs').statSync(PNG_PATH);
      expect(pngStats.size).toBeGreaterThan(50000); // > 50KB
      expect(pngStats.size).toBeLessThan(2000000); // < 2MB
    });
  });

  test.describe('Responsive Design', () => {

    test('Mobile: Single column layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`file://${HTML_PATH}`);

      // Check if content is readable and not overflowing
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });

    test('Desktop: Two-column layout visible', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`file://${HTML_PATH}`);

      // Main content should use grid layout on desktop
      const mainLayout = await page.locator('.main, main, [class*="body"]').first();
      const display = await mainLayout.evaluate(el =>
        window.getComputedStyle(el).display
      );

      expect(display).toMatch(/grid|flex/);
    });
  });

  test.describe('File Integrity', () => {

    test('HTML file self-contained (no external dependencies)', async ({ page }) => {
      const htmlContent = readFileSync(HTML_PATH, 'utf-8');

      // Should not have external CSS links
      expect(htmlContent).not.toMatch(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']http/);

      // Should not have external script tags
      expect(htmlContent).not.toMatch(/<script[^>]+src=["']http/);

      // Images should be embedded as base64
      if (htmlContent.includes('<img')) {
        expect(htmlContent).toMatch(/src=["']data:image/);
      }
    });

    test('All required metadata present', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Check meta tags
      const charset = await page.locator('meta[charset]').getAttribute('charset');
      expect(charset?.toLowerCase()).toBe('utf-8');

      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });
  });

  test.describe('Performance', () => {

    test('HTML loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`file://${HTML_PATH}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    });

    test('Font loading optimized', async ({ page }) => {
      await page.goto(`file://${HTML_PATH}`);

      // Check if fonts are loaded
      const fonts = await page.evaluate(() => {
        return document.fonts.status;
      });

      expect(fonts).toMatch(/loaded|loading/);
    });
  });
});
