import { test, expect } from '@playwright/test';

test.describe('Public layout regression coverage', () => {
  test('homepage uses the Heritage public layout instead of the app shell', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    await expect(page.getByText('Born to Blaze the Path Beaten Less').first()).toBeVisible();
    await expect(page.locator('img[alt=\"Blaze Sports Intel\"]').first()).toBeVisible();

    const appSidebar = page.locator('aside').filter({ hasText: 'Dashboard' });
    await expect(appSidebar).toHaveCount(0);
  });

  test('college baseball hub keeps the public footer and stays out of the app shell', async ({ page }) => {
    await page.goto('/college-baseball', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    await expect(page.locator('footer')).toContainText('Start Here');
    await expect(page.locator('footer')).toContainText('Ecosystem');

    const appSidebar = page.locator('aside').filter({ hasText: 'Dashboard' });
    await expect(appSidebar).toHaveCount(0);
  });

  test('dashboard still uses the app shell', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    await expect(page.locator('aside').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
  });
});
