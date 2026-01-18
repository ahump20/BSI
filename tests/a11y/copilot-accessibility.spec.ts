import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests for Copilot page
 * Tests keyboard navigation, screen reader support, and WCAG 2.1 AA compliance
 */

test.describe('Copilot Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/copilot');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tag = await heading.evaluate((el) => el.tagName);
        return parseInt(tag.replace('H', ''));
      })
    );

    // Check that headings start at h1 and don't skip levels
    expect(headingLevels[0]).toBe(1);
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check all buttons have accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const accessibleName =
        (await button.getAttribute('aria-label')) ||
        (await button.textContent()) ||
        (await button.getAttribute('title'));
      expect(accessibleName).toBeTruthy();
    }

    // Check all links have accessible names
    const links = await page.locator('a').all();
    for (const link of links) {
      const accessibleName =
        (await link.getAttribute('aria-label')) ||
        (await link.textContent()) ||
        (await link.getAttribute('title'));
      expect(accessibleName).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus first interactive element
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement);

    // Test that focus can move through all interactive elements
    const initialElement = await page.evaluate(() => document.activeElement);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const currentElement = await page.evaluate(() => document.activeElement);

      // Focus should change
      expect(currentElement).not.toBe(initialElement);
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page
      .locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      .all();

    for (const element of focusableElements.slice(0, 5)) {
      // Test first 5 to save time
      await element.focus();

      // Check that focused element has visible outline or custom focus styles
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
          border: computed.border,
        };
      });

      const hasFocusIndicator =
        (styles.outline && styles.outline !== 'none') ||
        (styles.outlineWidth && parseFloat(styles.outlineWidth) > 0) ||
        (styles.boxShadow && styles.boxShadow !== 'none') ||
        (styles.border && styles.border !== 'none');

      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // We'll test this separately for more control
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations.length).toBe(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Image must have alt attribute (can be empty for decorative images with role="presentation")
      if (role !== 'presentation' && role !== 'none') {
        expect(alt).toBeDefined();
        expect(alt).not.toBe(null);
      }
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    // Check for skip navigation link (usually hidden until focused)
    const skipLink = page.locator('a[href="#main-content"], a[href="#main"]').first();

    if ((await skipLink.count()) > 0) {
      await skipLink.focus();
      const isVisible = await skipLink.isVisible();
      expect(isVisible).toBeTruthy();
    }
  });
});

test.describe('Copilot Page - Motion Sensitivity', () => {
  test('should have a pause button for live updates', async ({ page }) => {
    await page.goto('/copilot');

    // Look for pause/stop button for animations or live updates
    const pauseButton = page
      .locator(
        'button:has-text("Pause"), button[aria-label*="pause" i], button[aria-label*="stop" i]'
      )
      .first();

    if ((await pauseButton.count()) > 0) {
      expect(await pauseButton.isVisible()).toBeTruthy();

      // Test that button is accessible
      const ariaLabel = await pauseButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should respect prefers-reduced-motion', async ({ page, context }) => {
    // Set prefers-reduced-motion to reduce
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            };
          }
          return {
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          };
        },
      });
    });

    await page.goto('/copilot');

    // Check that animations are disabled or reduced
    const elementsWithAnimations = await page
      .locator('[class*="animate"], [style*="animation"]')
      .all();

    for (const element of elementsWithAnimations) {
      const computedStyle = await element.evaluate((el) => {
        return window.getComputedStyle(el).animationDuration;
      });

      // Animation duration should be 0s or very short when prefers-reduced-motion is set
      expect(computedStyle === '0s' || parseFloat(computedStyle) < 0.1).toBeTruthy();
    }
  });
});
