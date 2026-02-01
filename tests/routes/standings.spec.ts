import { test, expect } from '@playwright/test';

test.describe('College Baseball Standings', () => {
  test('loads standings page', async ({ page }) => {
    await page.goto('/college-baseball/standings');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('renders table structure', async ({ page }) => {
    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
