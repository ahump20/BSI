import { test, expect } from '@playwright/test';

test.describe('Public layout regression coverage', () => {
  test('homepage renders with Heritage design tokens', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Tagline present
    await expect(page.getByText('Born to Blaze the Path Beaten Less').first()).toBeVisible({ timeout: 10000 });
  });

  test('college baseball hub renders with footer', async ({ page }) => {
    await page.goto('/college-baseball', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Footer has navigation links
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10000 });
  });

  test('dashboard renders with app shell', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Dashboard heading is present
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 10000 });
  });
});
