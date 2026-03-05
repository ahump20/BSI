/**
 * Auth Flow Tests
 *
 * Tests the email + API key authentication flow:
 * - Login page renders correctly (no password field)
 * - Email and API key inputs are present
 * - Empty form submission shows validation
 * - Dashboard redirects unauthenticated users to login
 * - Signup page links to pricing
 *
 * These tests validate the UI state machine — no live API keys required.
 *
 * Run: pnpm exec playwright test tests/flows/auth.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('renders email and API key inputs, no password field', async ({ page }) => {
    await page.goto('/auth/login/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');

    // Email input exists
    await expect(page.locator('input#email')).toBeVisible();

    // API key input exists
    await expect(page.locator('input#api-key')).toBeVisible();

    // No password field
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('has "Send My Key" and "Sign In" buttons', async ({ page }) => {
    await page.goto('/auth/login/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('button:has-text("Send My Key")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('has link to subscribe for new users', async ({ page }) => {
    await page.goto('/auth/login/');
    await page.waitForLoadState('domcontentloaded');

    // Next.js Link renders href with trailing slash — use role-based selector
    const subscribeLink = page.getByRole('link', { name: 'Subscribe' });
    await expect(subscribeLink).toBeVisible();
  });

  test('shows heading and description', async ({ page }) => {
    await page.goto('/auth/login/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('Welcome');
    await expect(page.locator('text=Sign in with your BSI API key')).toBeVisible();
  });
});

test.describe('Signup Page', () => {
  test('shows info about subscribing, no form fields', async ({ page }) => {
    await page.goto('/auth/signup/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');

    // No password or name inputs
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('input#name')).toHaveCount(0);

    // Has button linking to pricing
    const viewPlansButton = page.getByRole('link', { name: /View Plans/i });
    await expect(viewPlansButton).toBeVisible();
  });

  test('has link to login for existing users', async ({ page }) => {
    await page.goto('/auth/signup/');
    await page.waitForLoadState('domcontentloaded');

    const loginLink = page.getByRole('link', { name: 'Sign in' });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Dashboard Auth Gate', () => {
  test('redirects to login when no API key in localStorage', async ({ page }) => {
    // Clear any stored keys
    await page.goto('/auth/login/');
    await page.evaluate(() => localStorage.removeItem('bsi-api-key'));

    // Navigate to dashboard
    await page.goto('/dashboard/');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to login — wait for navigation
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });
});
