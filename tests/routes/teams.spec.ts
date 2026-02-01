import { test, expect } from '@playwright/test';

test.describe('College Baseball Teams', () => {
  test('loads teams page', async ({ page }) => {
    await page.goto('/college-baseball/teams');
    await expect(page.locator('main')).toBeVisible();
  });
});
