import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Blaze Sports Intel/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Coverage for the sports the spotlight skips\./i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start with College Baseball/i })).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    // Use domcontentloaded instead of networkidle — live score polling keeps the network active
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Allow initial fetches to complete
    // Filter expected noise: favicon 404s and API endpoint 404s (Pages Functions not served by next dev)
    const unexpected = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource')
    );
    expect(unexpected).toHaveLength(0);
  });
});
