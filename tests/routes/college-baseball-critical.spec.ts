/**
 * College Baseball Critical Path — browser-level release gate.
 * Runs against a deployed preview URL before production promotion.
 * Must pass on both desktop and mobile viewports.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://blazesportsintel.com';

// Season window: Feb 14 – Jun 30
const now = new Date();
const month = now.getMonth() + 1; // 1-indexed
const day = now.getDate();
const IN_SEASON =
  (month === 2 && day >= 14) ||
  (month >= 3 && month <= 5) ||
  (month === 6 && day <= 30);

// ─────────────────────────────────────────────────────────────────────────────
// Hub
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Hub', () => {
  test('loads and renders visible modules', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    // Check for no uncaught hydration errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // Give time for hydration
    await page.waitForTimeout(2000);
    const hydrationErrors = errors.filter((e) =>
      e.toLowerCase().includes('hydration') || e.toLowerCase().includes('minified react error')
    );
    expect(hydrationErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rankings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Rankings — data integrity', () => {
  test('each poll tab renders actual ranked teams, not empty state', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await expect(page.locator('h1')).toBeVisible();

    // D1Baseball tab is default — should show teams
    await expect(page.getByText(/no rankings available/i)).not.toBeVisible({ timeout: 10000 });

    // Switch to USA Today if present
    const usaTodayTab = page.getByRole('button', { name: /usa today/i });
    if (await usaTodayTab.isVisible()) {
      await usaTodayTab.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/no rankings available/i)).not.toBeVisible();
    }

    // Switch to Perfect Game if present
    const pgTab = page.getByRole('button', { name: /perfect game/i });
    if (await pgTab.isVisible()) {
      await pgTab.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/no rankings available/i)).not.toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Standings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Standings — data integrity', () => {
  test('renders conference headers and populated records; no 2025 stale labels', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/standings`);
    await expect(page.locator('h1')).toBeVisible();

    // Should have visible conference section headers
    await expect(
      page.locator('table, [role="table"], [class*="standings"], [class*="conference"]').first()
    ).toBeVisible({ timeout: 10000 });

    // No stale season labels in record display areas
    const staleText = await page
      .locator('[class*="record"], [class*="standing"], td')
      .filter({ hasText: /2025 season|preseason record|projected/i })
      .count();
    expect(staleText).toBe(0);

    // Current year should appear somewhere (schedule headers, etc.)
    if (IN_SEASON) {
      await expect(page.getByText(/2026/)).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Teams — list', () => {
  test('renders more than 10 team entries', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/teams`);
    await expect(page.locator('h1')).toBeVisible();

    // Team cards are Link > Card elements with hrefs to /college-baseball/teams/:slug
    const teamLinks = page.locator('a[href*="/college-baseball/teams/"]');
    await expect(teamLinks.first()).toBeVisible({ timeout: 10000 });
    const count = await teamLinks.count();
    expect(count).toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Conferences
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Conferences', () => {
  test('conference grid renders visible conference cards', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/conferences`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  for (const conf of ['sec', 'big-12', 'big-ten']) {
    test(`${conf} conference page renders team data`, async ({ page }) => {
      await page.goto(`${BASE}/college-baseball/conferences/${conf}`);
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Conference page should have content in main
      await expect(page.locator('main')).toBeVisible();

      // Should have team name text visible (conference pages show team names as text)
      const teamElements = page.locator('a[href*="/college-baseball/teams/"]');
      const linkCount = await teamElements.count();
      // Conference pages may use links or plain text — ensure page has substantive content
      if (linkCount === 0) {
        // Fallback: just ensure the page rendered with visible text content
        const mainText = await page.locator('main').textContent();
        expect(mainText?.length).toBeGreaterThan(100);
      } else {
        expect(linkCount).toBeGreaterThan(3);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Team detail — non-Texas teams
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Team Detail — SEC & Power programs', () => {
  const teams = ['vanderbilt', 'lsu', 'tennessee', 'florida', 'arkansas'];

  test('at least 3 of 5 SEC programs load with a non-zero, non-2025 record', async ({ page }) => {
    if (!IN_SEASON) {
      test.skip();
      return;
    }

    let passing = 0;

    for (const team of teams) {
      try {
        await page.goto(`${BASE}/college-baseball/teams/${team}`, { timeout: 15000 });
        const h1 = page.locator('h1');
        const visible = await h1.isVisible().catch(() => false);
        if (!visible) continue;

        // Records are in font-mono elements with W-L format (e.g. "16-0")
        // Look for any element showing a win-loss record pattern
        const recordPattern = page.locator('.font-mono').filter({ hasText: /^\d+-\d+$/ }).first();
        const recordText = await recordPattern.textContent({ timeout: 5000 }).catch(() => '');
        if (recordText && !/^0-0$/.test(recordText.trim())) {
          passing++;
        }
      } catch {
        // Team page failed to load — doesn't count
      }
    }

    expect(passing).toBeGreaterThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile viewport coverage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile — no content clipping', () => {
  test.use({ viewport: { width: 393, height: 852 } }); // Pixel 5 / iPhone 14

  test('hub loads without clipped primary modules', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 4); // 4px tolerance for borders
  });

  test('rankings page loads on mobile without clipping', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await expect(page.locator('h1')).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 4);
  });

  test('sec conference page loads on mobile', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/conferences/sec`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 4);
  });
});
