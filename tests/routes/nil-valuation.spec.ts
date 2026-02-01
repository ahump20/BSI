import { test, expect } from '@playwright/test';

test.describe('NIL Valuation', () => {
  test('loads NIL valuation page', async ({ page }) => {
    await page.goto('/nil-valuation');
    await expect(page.locator('main')).toBeVisible();
  });
});
