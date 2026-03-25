import { expect, test } from '@playwright/test';

const routes = ['/', '/about', '/contact'];

test.describe('Portfolio mobile shell', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of routes) {
    test(`${route} loads without horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noOverflow).toBeTruthy();
    });
  }

  test('skip link becomes visible on keyboard focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeVisible();
  });

  test('hamburger opens and closes the mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /navigation menu/i }).click();
    await expect(page.locator('#mobile-nav-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav-menu')).not.toBeVisible();
  });

  test('contact link closes the mobile menu and reaches the contact section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /navigation menu/i }).click();
    await page.locator('#mobile-nav-menu a[href="#contact"]').click();

    await expect(page.locator('#mobile-nav-menu')).not.toBeVisible();
    await expect(page.locator('#contact')).toBeInViewport();
  });
});

test.describe('Tablet shell', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('navigation stays visible without overflow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBeTruthy();
  });
});

test.describe('Contact form', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('submits successfully through the same-origin contact endpoint', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Message received.' }),
      });
    });

    await page.goto('/contact');
    await page.fill('#contact-name', 'Test User');
    await page.fill('#contact-email', 'test@example.com');
    await page.fill('#contact-message', 'Testing the same-origin contact path.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/Message received\. Austin will get back to you\./i)).toBeVisible();
  });

  test('submit button disables while the request is in flight', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Message received.' }),
      });
    });

    await page.goto('/contact');
    await page.fill('#contact-name', 'Test User');
    await page.fill('#contact-email', 'test@example.com');
    await page.fill('#contact-message', 'Testing the disabled state.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('button', { name: /sending\.\.\./i })).toBeDisabled();
  });
});
