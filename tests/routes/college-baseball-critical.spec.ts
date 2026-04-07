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
  test('default poll tab (D1Baseball) renders ranked teams', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // D1Baseball tab is default — should show teams (table with rows)
    // Wait for data to hydrate — either a table row or the "no rankings" message
    const tableRow = page.locator('table tbody tr').first();
    const noData = page.getByText(/no rankings available/i);
    await Promise.race([
      tableRow.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      noData.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ]);
    // During season, D1Baseball should have data
    if (IN_SEASON) {
      await expect(tableRow).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Standings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CBB Standings — data integrity', () => {
  test('renders conference headers and populated records; no 2025 stale labels', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/standings`);
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 });

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
      await expect(page.getByText(/2026/).first()).toBeVisible();
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
  test('conference index page renders with visible content', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/conferences`);
    // h1 may be hidden on some viewports (hidden sm:block), so check for any heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
    // Page should have substantive content (conference names, links)
    const mainText = await page.locator('main').textContent();
    expect(mainText?.length).toBeGreaterThan(50);
  });

  for (const conf of ['sec', 'big-12', 'big-ten']) {
    test(`${conf} conference page renders with content`, async ({ page }) => {
      await page.goto(`${BASE}/college-baseball/conferences/${conf}`, { timeout: 15000 });
      // Use flexible heading selector — h1 may be responsive-hidden
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main')).toBeVisible();

      // Conference page should have substantive content — team links, tables, or text
      const mainText = await page.locator('main').textContent();
      expect(mainText?.length).toBeGreaterThan(100);
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
    await page.goto(`${BASE}/college-baseball`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 4); // 4px tolerance for borders
  });

  test('rankings page loads on mobile without major clipping', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`, { waitUntil: 'networkidle' });
    // Multiple headings exist — find a visible one
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    // Rankings tables use overflow-x-auto so minor horizontal scroll is acceptable
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('sec conference page loads on mobile', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/conferences/sec`, { waitUntil: 'networkidle' });
    // h1 has hidden sm:block — find a visible heading on mobile
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
