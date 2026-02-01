import { test, expect } from '@playwright/test';

test.describe('Arcade', () => {
  test('loads arcade page', async ({ page }) => {
    await page.goto('/arcade');
    await expect(page.locator('main')).toBeVisible();
  });
});
