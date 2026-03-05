/**
 * WCAG 2.1 AA Compliance Tests
 *
 * Runs axe-core against critical pages to catch accessibility violations.
 * Checks: color contrast, missing alt text, ARIA roles, form labels, heading order.
 *
 * Run: pnpm exec playwright test tests/a11y/
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CRITICAL_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/scores/', name: 'Scores' },
  { path: '/college-baseball/standings/', name: 'College Baseball Standings' },
  { path: '/college-baseball/teams/', name: 'College Baseball Teams' },
];

const IGNORED_RULES = new Set(['scrollable-region-focusable']);

for (const page of CRITICAL_PAGES) {
  test.describe(`${page.name} (${page.path})`, () => {
    test('passes WCAG 2.1 AA automated checks', async ({ page: browserPage }) => {
      await browserPage.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        // Exclude known third-party widgets that we don't control
        .exclude('.posthog-widget')
        .analyze();

      // Log violations for debugging (visible in CI artifacts)
      if (results.violations.length > 0) {
        console.log(
          `[a11y] ${page.name} — ${results.violations.length} violation(s):`,
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
            helpUrl: v.helpUrl,
          })),
        );
      }

      // Fail on serious and critical violations (excluding rules we don't enforce in CI)
      const criticalViolations = results.violations.filter(
        (v) => (v.impact === 'critical' || v.impact === 'serious') && !IGNORED_RULES.has(v.id),
      );

      expect(criticalViolations).toHaveLength(0);
    });

    test('has no images without alt text', async ({ page: browserPage }) => {
      await browserPage.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: browserPage })
        .withRules(['image-alt'])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });
  });
}
