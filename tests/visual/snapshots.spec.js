/**
 * Visual Regression Tests
 *
 * These tests capture screenshots of key pages and compare them against baseline images.
 * Use @visual tag to run only visual tests: npx playwright test --grep @visual
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8788';

// Test configuration
test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  // Wait for fonts to load
  await page.addStyleTag({
    content: `
      * {
        font-family: system-ui, -apple-system, sans-serif !important;
      }
    `
  });
});

test.describe('Homepage Visual Tests', () => {
  test('@visual homepage desktop', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Hide dynamic content
    await page.evaluate(() => {
      document.querySelectorAll('[data-timestamp]').forEach(el => {
        el.style.visibility = 'hidden';
      });
    });

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('@visual homepage mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Sport Hub Visual Tests', () => {
  const sports = [
    { name: 'MLB', path: '/mlb' },
    { name: 'NFL', path: '/nfl' },
    { name: 'NBA', path: '/nba' },
    { name: 'College Baseball', path: '/college-baseball' }
  ];

  for (const sport of sports) {
    test(`@visual ${sport.name} hub`, async ({ page }) => {
      await page.goto(`${BASE_URL}${sport.path}`);
      await page.waitForLoadState('networkidle');

      // Wait for standings table to load
      await page.waitForSelector('table', { timeout: 5000 });

      await expect(page).toHaveScreenshot(`${sport.name.toLowerCase().replace(' ', '-')}-hub.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });
  }
});

test.describe('Analytics Dashboard Visual Tests', () => {
  test('@visual analytics dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Hide live indicators
    await page.evaluate(() => {
      document.querySelectorAll('.live-indicator').forEach(el => {
        el.style.display = 'none';
      });
    });

    await expect(page).toHaveScreenshot('analytics-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('@visual analytics dashboard mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('analytics-dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('AI Copilot Visual Tests', () => {
  test('@visual copilot interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/copilot`);
    await page.waitForLoadState('networkidle');

    // Wait for interface to render
    await page.waitForSelector('[data-copilot]', { timeout: 5000 });

    await expect(page).toHaveScreenshot('copilot-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('@visual copilot with query', async ({ page }) => {
    await page.goto(`${BASE_URL}/copilot`);
    await page.waitForLoadState('networkidle');

    // Enter a sample query
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('Show me Cardinals pitching stats');

    await expect(page).toHaveScreenshot('copilot-with-query.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Historical Data Visual Tests', () => {
  test('@visual historical data page', async ({ page }) => {
    await page.goto(`${BASE_URL}/HistoricalData`);
    await page.waitForLoadState('networkidle');

    // Wait for coverage matrix widget
    await page.waitForSelector('[data-coverage-matrix]', { timeout: 5000 });

    await expect(page).toHaveScreenshot('historical-data.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Legal Pages Visual Tests', () => {
  const legalPages = [
    { name: 'Privacy Policy', path: '/legal/privacy' },
    { name: 'Terms of Service', path: '/legal/terms' },
    { name: 'Cookie Policy', path: '/legal/cookie-policy' },
    { name: 'AI Disclosure', path: '/legal/ai-disclosure' }
  ];

  for (const page of legalPages) {
    test(`@visual ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(`${BASE_URL}${page.path}`);
      await browserPage.waitForLoadState('networkidle');

      await expect(browserPage).toHaveScreenshot(
        `${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        {
          fullPage: true,
          animations: 'disabled'
        }
      );
    });
  }
});

test.describe('Component Visual Tests', () => {
  test('@visual design system buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/design-system-demo`);
    await page.waitForLoadState('networkidle');

    // Focus on button section
    const buttonSection = page.locator('[data-component="button"]');

    await expect(buttonSection).toHaveScreenshot('buttons-component.png', {
      animations: 'disabled'
    });
  });

  test('@visual design system cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/design-system-demo`);
    await page.waitForLoadState('networkidle');

    const cardSection = page.locator('[data-component="card"]');

    await expect(cardSection).toHaveScreenshot('cards-component.png', {
      animations: 'disabled'
    });
  });

  test('@visual design system tables', async ({ page }) => {
    await page.goto(`${BASE_URL}/design-system-demo`);
    await page.waitForLoadState('networkidle');

    const tableSection = page.locator('[data-component="table"]');

    await expect(tableSection).toHaveScreenshot('tables-component.png', {
      animations: 'disabled'
    });
  });

  test('@visual design system modals', async ({ page }) => {
    await page.goto(`${BASE_URL}/design-system-demo`);
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.click('[data-open-modal]');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page).toHaveScreenshot('modal-component.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Responsive Visual Tests', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test(`@visual homepage at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(
        `homepage-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        {
          fullPage: true,
          animations: 'disabled'
        }
      );
    });
  }
});

test.describe('Dark Mode Visual Tests', () => {
  test('@visual homepage dark mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('@visual analytics dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await expect(page).toHaveScreenshot('analytics-dark.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
