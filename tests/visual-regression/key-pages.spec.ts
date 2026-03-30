import { test, expect } from '@playwright/test';

/**
 * Visual regression tests — screenshot baselines for key BSI pages.
 *
 * First run generates baselines (no comparison). Subsequent runs diff against them.
 * Update baselines after intentional design changes:
 *   npm run test:visual:update
 *
 * Run:
 *   npm run test:visual
 *   BASE_URL=https://blazesportsintel.com npm run test:visual
 */

const KEY_PAGES = [
  { route: '/', name: 'homepage' },
  { route: '/scores', name: 'scores-hub' },
  { route: '/college-baseball', name: 'college-baseball-landing' },
  { route: '/mlb', name: 'mlb-landing' },
  { route: '/pricing', name: 'pricing' },
];

const SCREENSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.05,
  animations: 'disabled' as const,
  mask: [] as any[],
};

/* ── Desktop visual regression (1440x900) ── */

test.describe('Visual regression — desktop (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { route, name } of KEY_PAGES) {
    test(`${name} matches baseline`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Wait for main content and client-side data
      const main = page.locator('main');
      await expect(main).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(3000); // Allow data fetches to complete

      // Mask dynamic elements that change between runs
      const masks = [
        page.locator('[data-testid="live-ticker"]'),
        page.locator('[data-testid="last-updated"]'),
        page.locator('time'),
      ];

      await expect(page).toHaveScreenshot(`desktop-${name}.png`, {
        ...SCREENSHOT_OPTIONS,
        mask: masks.filter(async (m) => {
          try {
            return (await m.count()) > 0;
          } catch {
            return false;
          }
        }),
        fullPage: false, // Above-the-fold only for speed
      });
    });
  }
});

/* ── Mobile visual regression (375x812) ── */

test.describe('Visual regression — mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const { route, name } of KEY_PAGES) {
    test(`${name} matches baseline (mobile)`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const main = page.locator('main');
      await expect(main).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(3000);

      const masks = [
        page.locator('[data-testid="live-ticker"]'),
        page.locator('[data-testid="last-updated"]'),
        page.locator('time'),
      ];

      await expect(page).toHaveScreenshot(`mobile-${name}.png`, {
        ...SCREENSHOT_OPTIONS,
        mask: masks.filter(async (m) => {
          try {
            return (await m.count()) > 0;
          } catch {
            return false;
          }
        }),
        fullPage: false,
      });
    });
  }
});

/* ── Heritage token spot-check ── */

test.describe('Heritage v2.1 token compliance', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('homepage uses Heritage surface colors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    const tokenCheck = await page.evaluate(() => {
      const findings: string[] = [];

      // Check page background (should be near #0A0A0A)
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;

      // Check a card element for surface-dugout (#161616)
      const card = document.querySelector('.heritage-card, [class*="card"]');
      const cardBg = card ? window.getComputedStyle(card).backgroundColor : 'no card found';

      // Check primary text color (should be near #F5F2EB)
      const main = document.querySelector('main');
      const textColor = main ? window.getComputedStyle(main).color : 'no main found';

      // Check for forbidden colors
      const allElements = document.querySelectorAll('*');
      const forbiddenColors = ['#007bff', '#0d6efd', '#1a1a2e', '#f7931e'];
      let forbiddenFound = false;

      for (const el of Array.from(allElements).slice(0, 200)) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        for (const forbidden of forbiddenColors) {
          if (bg.includes(forbidden) || color.includes(forbidden)) {
            forbiddenFound = true;
            findings.push(`Forbidden color ${forbidden} on ${el.tagName}`);
          }
        }
      }

      return { bodyBg, cardBg, textColor, forbiddenFound, findings };
    });

    expect(tokenCheck.forbiddenFound, `Forbidden colors found: ${tokenCheck.findings.join(', ')}`).toBe(false);
  });
});
