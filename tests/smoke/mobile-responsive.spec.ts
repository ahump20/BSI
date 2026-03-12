/**
 * Mobile Responsive Smoke Tests
 *
 * Verifies that key routes render without horizontal overflow at
 * 375×667 (iPhone SE) and 768×1024 (tablet) viewport sizes.
 */

import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };

const MOBILE_ROUTES = [
  '/',
  '/about/',
  '/contact/',
  '/pricing/',
  '/search/',
  '/status/',
  '/intel/',
  '/scores/',
];

const TABLET_ROUTES = ['/', '/pricing/', '/scores/'];

test.describe('Mobile viewport (375×667)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const route of MOBILE_ROUTES) {
    test(`${route} — loads and has no horizontal scroll`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `Horizontal overflow on ${route}: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('Tablet viewport (768×1024)', () => {
  test.use({ viewport: TABLET_VIEWPORT });

  for (const route of TABLET_ROUTES) {
    test(`${route} — loads and has no horizontal scroll`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `Horizontal overflow on ${route}: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`).toBeLessThanOrEqual(clientWidth);
    });
  }
});
