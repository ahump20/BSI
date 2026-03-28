import { test, expect } from '@playwright/test';

/* ── Shared overflow evaluator ── */

function createOverflowEvaluator() {
  return () => {
    const viewportWidth = window.innerWidth;
    const docOverflow = document.documentElement.scrollWidth - viewportWidth;
    const bodyOverflow = document.body.scrollWidth - viewportWidth;

    const offenders: string[] = [];
    const main = document.querySelector('main');
    const nodes = main ? Array.from(main.querySelectorAll<HTMLElement>('*')) : [];

    for (const node of nodes) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }

      if (rect.left < -1 || rect.right - viewportWidth > 1) {
        const className = typeof node.className === 'string' ? node.className.trim().replace(/\s+/g, '.') : '';
        offenders.push(`${node.tagName.toLowerCase()}${className ? `.${className}` : ''}`);
      }

      if (offenders.length >= 8) {
        break;
      }
    }

    return { docOverflow, bodyOverflow, offenders };
  };
}

/* ── Route lists ── */

const MOBILE_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/search',
  '/status',
  '/intel',
  '/scores',
  '/college-baseball',
  '/college-baseball/scores',
  '/mlb',
  '/nfl',
  '/nba',
  '/arcade',
];

const TABLET_ROUTES = ['/', '/college-baseball', '/scores', '/mlb'];

const IPHONE_14_PRO_MAX_ROUTES = ['/', '/scores', '/college-baseball'];

/* ── Mobile overflow (375x812) ── */

test.describe('Mobile overflow regression checks', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of MOBILE_ROUTES) {
    test(`${route} does not produce horizontal overflow on 375px viewport`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(1000);

      const overflowReport = await page.evaluate(createOverflowEvaluator());

      expect(overflowReport.docOverflow, `document overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
      expect(overflowReport.bodyOverflow, `body overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
    });
  }
});

/* ── Tablet overflow (768x1024) ── */

test.describe('Tablet overflow regression checks (768x1024)', () => {
  for (const route of TABLET_ROUTES) {
    test(`${route} does not produce horizontal overflow on tablet viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(1000);

      const overflowReport = await page.evaluate(createOverflowEvaluator());

      expect(overflowReport.docOverflow, `document overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
      expect(overflowReport.bodyOverflow, `body overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
    });
  }
});

/* ── iPhone 14 Pro Max overflow (428x926) ── */

test.describe('iPhone 14 Pro Max overflow regression checks (428x926)', () => {
  for (const route of IPHONE_14_PRO_MAX_ROUTES) {
    test(`${route} does not produce horizontal overflow on iPhone 14 Pro Max viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 428, height: 926 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(1000);

      const overflowReport = await page.evaluate(createOverflowEvaluator());

      expect(overflowReport.docOverflow, `document overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
      expect(overflowReport.bodyOverflow, `body overflow offenders: ${overflowReport.offenders.join(', ')}`).toBeLessThanOrEqual(1);
    });
  }
});

/* ── Bottom nav visibility (375x667) ── */

test.describe('Mobile bottom navigation visibility', () => {
  test('bottom nav visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Use college-baseball page which always has the SiteFrame layout
    await page.goto('/college-baseball', { waitUntil: 'domcontentloaded' });

    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible({ timeout: 15000 });
  });
});
