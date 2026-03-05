import { test, expect } from '@playwright/test';

test.describe('College Baseball Players', () => {
  test('loads players page', async ({ page }) => {
    await page.goto('/college-baseball/players');
    await expect(page.locator('main')).toBeVisible();
  });
});
