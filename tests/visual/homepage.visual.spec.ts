/**
 * Visual Regression Tests - Homepage
 * Tests visual consistency of the Blaze Sports Intel homepage
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for initial content to load
    await page.waitForSelector('header');
    await page.waitForLoadState('networkidle');

    // Disable animations for consistent snapshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // Hide dynamic timestamps
    await page.evaluate(() => {
      document
        .querySelectorAll('[data-timestamp], .last-updated, .generated-at')
        .forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'));
    });
  });

  test('@visual Homepage - Mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Homepage - Tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Homepage - Desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Homepage - Large Desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('homepage-large-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Hero Section', async ({ page }) => {
    const hero = page.locator('.hero-section');
    await expect(hero).toHaveScreenshot('hero-section.png', {
      animations: 'disabled',
    });
  });

  test('@visual Sports Dashboard Cards', async ({ page }) => {
    const dashboard = page.locator('#sports-dashboard');
    await expect(dashboard).toHaveScreenshot('sports-dashboard.png', {
      animations: 'disabled',
    });
  });

  test('@visual Proof Badges', async ({ page }) => {
    const proofBadges = page.locator('.hero-proof');
    await expect(proofBadges).toBeVisible();
    await expect(proofBadges).toHaveScreenshot('proof-badges.png', {
      animations: 'disabled',
    });
  });

  test('@visual Navigation Menu', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('navigation.png', {
      animations: 'disabled',
    });
  });

  test('@visual Navigation Menu - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Open mobile menu
    const hamburger = page.locator('.nav-toggle');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300); // Wait for menu animation

      const mobileMenu = page.locator('.nav-menu');
      await expect(mobileMenu).toHaveScreenshot('mobile-menu.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png', {
      animations: 'disabled',
    });
  });

  test('@visual Dark Mode Support', async ({ page }) => {
    // Enable dark mode if supported
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual High Contrast Mode', async ({ page }) => {
    // Test high contrast for accessibility
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
