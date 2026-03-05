import { test, expect } from '@playwright/test';

test.describe('College Baseball Rankings', () => {
  test('loads rankings page', async ({ page }) => {
    await page.goto('/college-baseball/rankings');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Top 25')).toBeVisible();
  });

  test('has poll selector buttons', async ({ page }) => {
    await page.goto('/college-baseball/rankings');
    await expect(page.locator('text=D1Baseball')).toBeVisible();
  });
});
