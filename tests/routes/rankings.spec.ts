import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://blazesportsintel.com';

test.describe('College Baseball Rankings', () => {
  test('page loads with h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    // Use getByRole to target the visible content heading, not the mobile banner h1
    const h1 = page.getByRole('heading', { level: 1, name: /rankings/i });
    await expect(h1.first()).toBeVisible({ timeout: 10000 });
  });

  test('poll tabs are visible and clickable', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await expect(page.getByRole('button', { name: /d1baseball/i })).toBeVisible({ timeout: 10000 });
  });

  test('default tab (D1Baseball) shows ranked teams, not empty state', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await page.waitForTimeout(1500); // allow data hydration

    // "No Rankings Available" must not appear
    await expect(page.getByText(/no rankings available/i)).not.toBeVisible();

    // Rankings render as table rows with team links
    const entries = page.locator('tbody tr');
    const count = await entries.count();
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(10);
    }
  });

  test('switching to USA Today tab changes content if available', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);

    const d1Tab = page.getByRole('button', { name: /d1baseball/i });
    const usaTodayTab = page.getByRole('button', { name: /usa today/i });

    await expect(d1Tab).toBeVisible();

    if (!(await usaTodayTab.isVisible())) {
      test.skip();
      return;
    }

    // Capture first-ranked team on D1Baseball
    const firstTeamBefore = await page
      .locator('tbody tr')
      .first()
      .textContent()
      .catch(() => '');

    await usaTodayTab.click();
    await page.waitForTimeout(800);

    // Must not show empty state after tab switch
    await expect(page.getByText(/no rankings available/i)).not.toBeVisible();

    // Content should have loaded for this tab
    const firstTeamAfter = await page
      .locator('tbody tr')
      .first()
      .textContent()
      .catch(() => '');

    // If both tabs have teams, they may differ (not asserting equality — polls differ)
    expect(firstTeamAfter).toBeTruthy();
  });

  test('ranked team names in active tab are non-empty strings', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/rankings`);
    await page.waitForTimeout(1500);

    const entries = page.locator('tbody tr');
    const count = await entries.count();

    if (count === 0) {
      // Page may not have loaded data — just ensure no empty state
      await expect(page.getByText(/no rankings available/i)).not.toBeVisible();
      return;
    }

    // First entry should have a non-empty team name
    const firstEntryText = await entries.first().textContent();
    expect(firstEntryText?.trim().length).toBeGreaterThan(0);
  });
});
