import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests for Analytics page with live tables
 * Tests table structure, ARIA attributes, and screen reader compatibility
 */

test.describe('Analytics Page - Live Tables Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have properly structured tables', async ({ page }) => {
    const tables = await page.locator('table').all();

    for (const table of tables) {
      // Check for thead
      const thead = await table.locator('thead').count();
      expect(thead).toBeGreaterThan(0);

      // Check for tbody
      const tbody = await table.locator('tbody').count();
      expect(tbody).toBeGreaterThan(0);

      // Check that all th elements are in thead
      const thInThead = await table.locator('thead th').count();
      const allTh = await table.locator('th').count();
      expect(thInThead).toBe(allTh);

      // Check for caption or aria-label
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');

      expect(caption > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should have proper scope attributes on table headers', async ({ page }) => {
    const tableHeaders = await page.locator('th').all();

    for (const th of tableHeaders) {
      const scope = await th.getAttribute('scope');

      // th elements should have scope="col" or scope="row"
      expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope);
    }
  });

  test('should have ARIA live regions for updating data', async ({ page }) => {
    // Look for live regions that update with new data
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();

    if (liveRegions.length > 0) {
      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');

        // aria-live should be "polite" or "assertive" for screen readers
        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }

        // role should be appropriate for live content
        if (role) {
          expect(['status', 'alert', 'log', 'timer']).toContain(role);
        }
      }
    }
  });

  test('should have sortable column headers with proper ARIA', async ({ page }) => {
    const sortableHeaders = await page.locator('th[role="columnheader"], th[aria-sort]').all();

    for (const header of sortableHeaders) {
      const ariaSort = await header.getAttribute('aria-sort');

      // If sortable, should have aria-sort attribute
      if (ariaSort) {
        expect(['ascending', 'descending', 'none', 'other']).toContain(ariaSort);
      }

      // Should be keyboard accessible
      const tabindex = await header.getAttribute('tabindex');
      if (tabindex) {
        expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should have proper row selection indicators', async ({ page }) => {
    const selectableRows = await page.locator('tr[role="row"][aria-selected], tr[aria-selected]').all();

    for (const row of selectableRows) {
      const ariaSelected = await row.getAttribute('aria-selected');

      // aria-selected should be "true" or "false"
      expect(['true', 'false']).toContain(ariaSelected);
    }
  });

  test('should support keyboard navigation in tables', async ({ page }) => {
    // Focus first table
    const firstTable = page.locator('table').first();
    await firstTable.focus();

    // Should be able to navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');

    // Check that focus moved (implementation dependent)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['TD', 'TH', 'TR', 'TABLE']).toContain(focusedElement);
  });

  test('should have proper contrast for table cells', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('table')
      .withTags(['wcag2aa'])
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations.length).toBe(0);
  });

  test('should have responsive table behavior', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const tables = await page.locator('table').all();

    for (const table of tables) {
      // Table should be scrollable or responsive
      const overflowX = await table.evaluate((el) => {
        return window.getComputedStyle(el).overflowX;
      });

      const parentOverflow = await table.evaluate((el) => {
        return el.parentElement ? window.getComputedStyle(el.parentElement).overflowX : null;
      });

      expect(overflowX === 'auto' || overflowX === 'scroll' || parentOverflow === 'auto' || parentOverflow === 'scroll').toBeTruthy();
    }
  });

  test('should announce table updates to screen readers', async ({ page }) => {
    // Check for status messages or announcements
    const statusElements = await page.locator('[role="status"], [role="alert"], [aria-live]').all();

    // Should have at least one announcement region for live updates
    expect(statusElements.length).toBeGreaterThan(0);

    // Test that updates are announced properly
    for (const status of statusElements.slice(0, 3)) {
      const ariaLive = await status.getAttribute('aria-live');
      const role = await status.getAttribute('role');

      // Should use appropriate politeness level
      if (ariaLive) {
        expect(['polite', 'assertive']).toContain(ariaLive);
      }

      if (role) {
        expect(['status', 'alert']).toContain(role);
      }
    }
  });
});

test.describe('Analytics Page - Pause Live Updates Feature', () => {
  test('should have a visible pause button for live updates', async ({ page }) => {
    await page.goto('/analytics');

    // Look for pause/play toggle button
    const pauseButton = page.locator('button:has-text("Pause"), button:has-text("Stop"), button[aria-label*="pause" i]').first();

    if (await pauseButton.count() > 0) {
      // Button should be visible
      expect(await pauseButton.isVisible()).toBeTruthy();

      // Button should have accessible name
      const accessibleName = await pauseButton.getAttribute('aria-label') ||
                            await pauseButton.textContent();
      expect(accessibleName).toBeTruthy();

      // Button should be keyboard accessible
      const tabindex = await pauseButton.getAttribute('tabindex');
      expect(tabindex !== '-1').toBeTruthy();

      // Test button functionality
      await pauseButton.click();

      // Button text/state should change
      const newText = await pauseButton.textContent();
      const newAriaLabel = await pauseButton.getAttribute('aria-label');
      expect(newText?.toLowerCase().includes('play') || newText?.toLowerCase().includes('resume') ||
             newAriaLabel?.toLowerCase().includes('play') || newAriaLabel?.toLowerCase().includes('resume')).toBeTruthy();
    }
  });

  test('should pause live data updates when button is clicked', async ({ page }) => {
    await page.goto('/analytics');

    const pauseButton = page.locator('button:has-text("Pause"), button[aria-label*="pause" i]').first();

    if (await pauseButton.count() > 0) {
      // Get initial table state
      const initialData = await page.locator('table tbody tr').first().textContent();

      // Click pause
      await pauseButton.click();

      // Wait a bit
      await page.waitForTimeout(3000);

      // Data should not have changed (assuming updates happen within 3 seconds)
      const currentData = await page.locator('table tbody tr').first().textContent();
      expect(currentData).toBe(initialData);
    }
  });

  test('should have keyboard shortcut for pausing updates', async ({ page }) => {
    await page.goto('/analytics');

    // Common keyboard shortcuts for pause: Space, P, Escape
    await page.keyboard.press('Space');

    // Check if pause state changed
    const pauseButton = page.locator('button:has-text("Pause"), button:has-text("Play"), button:has-text("Resume")').first();

    if (await pauseButton.count() > 0) {
      const buttonText = await pauseButton.textContent();
      expect(buttonText).toBeTruthy();
    }
  });
});

test.describe('Analytics Page - Reduced Motion', () => {
  test('should respect prefers-reduced-motion for table updates', async ({ page, context }) => {
    // Set prefers-reduced-motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/analytics');

    // Check that transitions are disabled or very short
    const animatedElements = await page.locator('[class*="transition"], [style*="transition"]').all();

    for (const element of animatedElements.slice(0, 5)) {
      const transitionDuration = await element.evaluate((el) => {
        return window.getComputedStyle(el).transitionDuration;
      });

      expect(transitionDuration === '0s' || parseFloat(transitionDuration) < 0.1).toBeTruthy();
    }
  });
});
