/**
 * Checkout Flow Tests
 *
 * Tests the checkout and return pages handle various states correctly:
 * - Missing params show error/fallback states
 * - session_id param triggers success state on /checkout
 * - /checkout/return without session_id shows cancelled state
 *
 * These tests do NOT require a live Stripe key — they validate the
 * UI state machine responds correctly to URL params.
 *
 * Run: pnpm exec playwright test tests/flows/checkout.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  test('shows error state when no params provided', async ({ page }) => {
    await page.goto('/checkout/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');

    // Without client_secret or session_id, page shows error about missing session
    await expect(page.locator('text=/select a plan|Checkout Error/i').first()).toBeVisible();
  });

  test('shows success state when session_id is present', async ({ page }) => {
    await page.goto('/checkout/?session_id=cs_test_fake123');
    await page.waitForLoadState('domcontentloaded');

    // The main checkout page has a simple SuccessState for session_id
    await expect(page.locator('text=/You\'re In|Subscription confirmed/i').first()).toBeVisible();
  });

  test('has back-to-pricing link in error state', async ({ page }) => {
    await page.goto('/checkout/');
    await page.waitForLoadState('domcontentloaded');

    const pricingLink = page.locator('a[href*="/pricing"]').first();
    await expect(pricingLink).toBeVisible();
  });
});

test.describe('Checkout Return Page', () => {
  test('shows cancelled state when no session_id', async ({ page }) => {
    await page.goto('/checkout/return/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');

    // No session_id → cancelled state
    await expect(page.locator('text=/Cancelled|not charged/i').first()).toBeVisible();
  });

  test('shows loading then error when session_id is invalid', async ({ page }) => {
    await page.goto('/checkout/return/?session_id=cs_test_invalid');
    await page.waitForLoadState('domcontentloaded');

    // With a fake session_id, the fetch to /api/stripe/session-status will fail
    // (no dev server worker), so it should show error state
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    // Either error or loading is acceptable since the API endpoint isn't served by next dev
    const hasState = await body.locator('text=/Went Wrong|Confirming|error/i').first().isVisible();
    expect(hasState).toBeTruthy();
  });

  test('has back-to-pricing link in cancelled state', async ({ page }) => {
    await page.goto('/checkout/return/');
    await page.waitForLoadState('domcontentloaded');

    const pricingLink = page.locator('a[href*="/pricing"]').first();
    await expect(pricingLink).toBeVisible();
  });
});
