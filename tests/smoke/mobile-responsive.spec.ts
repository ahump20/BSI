import { test, expect } from '@playwright/test';

const mobileRoutes = [
  '/', '/about', '/contact', '/pricing', '/search',
  '/status', '/intel', '/scores', '/college-baseball',
  '/mlb', '/nfl', '/nba', '/arcade',
];

test.describe('Mobile responsive — 375x667', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of mobileRoutes) {
    test(`${route} — loads without horizontal scroll`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (response && response.status() === 404) {
        test.skip(true, `${route} returned 404 — skipping`);
        return;
      }

      await expect(page.locator('body')).toBeVisible();
      const noHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noHScroll).toBeTruthy();
    });
  }

  test('bottom nav visible on mobile homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').first()).toBeVisible();
  });
});

const tabletRoutes = ['/', '/pricing', '/scores', '/college-baseball', '/mlb'];

test.describe('Tablet responsive — 768x1024', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  for (const route of tabletRoutes) {
    test(`${route} — loads without horizontal scroll at tablet`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (response && response.status() === 404) {
        test.skip(true, `${route} returned 404 — skipping`);
        return;
      }

      await expect(page.locator('body')).toBeVisible();
      const noHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noHScroll).toBeTruthy();
    });
  }
});

test.describe('Large mobile — 428x926 (iPhone 14 Pro Max)', () => {
  test.use({ viewport: { width: 428, height: 926 } });

  for (const route of ['/', '/scores', '/college-baseball']) {
    test(`${route} — no overflow at 428px`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const noHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noHScroll).toBeTruthy();
    });
  }
});
