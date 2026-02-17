import { test, expect } from '@playwright/test';

test.describe('Homepage Landing Upgrade — 5 Additions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('all 5 new sections render in correct order', async ({ page }) => {
    // Sections should appear in this order top-to-bottom:
    // Hero (with score strip) → StatsBand → PersonaSwitch → LiveScores → Sports Hub (with IntelSignup) → About → Pricing → Transparency → CTA

    const personaSwitch = page.getByText('Start Here');
    const pricingPreview = page.getByText('Plans').first();
    const transparencyBlock = page.getByText('How BSI Stays Accurate');
    const intelSignup = page.getByText('Get the Intel Drop');

    await expect(personaSwitch).toBeVisible();
    await expect(pricingPreview).toBeVisible();
    await expect(transparencyBlock).toBeVisible();
    await expect(intelSignup).toBeVisible();

    // Verify ordering: PersonaSwitch appears before PricingPreview
    const personaY = (await personaSwitch.boundingBox())!.y;
    const pricingY = (await pricingPreview.boundingBox())!.y;
    const transparencyY = (await transparencyBlock.boundingBox())!.y;
    expect(personaY).toBeLessThan(pricingY);
    expect(pricingY).toBeLessThan(transparencyY);
  });

  test('HeroScoreStrip shows skeleton or gracefully hides', async ({ page }) => {
    // The strip either renders skeletons (loading), game cards (loaded), or nothing (no games)
    // It should not cause layout errors regardless
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // No uncaught errors from the strip
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Wait for potential fetch to complete
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => e.includes('hero-scores'))).toHaveLength(0);
  });

  test('PersonaSwitch toggles persist across reload', async ({ page }) => {
    test.setTimeout(60000);

    // Find the persona toggle buttons by their text content
    const scoutButton = page.locator('button', { hasText: 'Scout' });
    await expect(scoutButton).toBeVisible();

    // Default should be Fan — verify Fan content is showing
    await expect(page.getByText('Live Scores', { exact: false }).first()).toBeVisible();

    // Switch to Scout
    await scoutButton.click();
    await page.waitForTimeout(500);

    // Scout-specific content should be visible
    await expect(page.getByText('Player Database')).toBeVisible({ timeout: 5000 });

    // Verify aria-checked updated
    await expect(scoutButton).toHaveAttribute('aria-checked', 'true');

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for localStorage hydration

    await expect(page.getByText('Player Database')).toBeVisible({ timeout: 5000 });
  });

  test('PricingPreview links route to /pricing', async ({ page }) => {
    const compareLink = page.getByText('Compare all features');
    await expect(compareLink).toBeVisible();
    const href = await compareLink.getAttribute('href');
    expect(href).toMatch(/^\/pricing\/?$/);

    // CTA buttons should also link to /pricing
    const pricingSection = page.locator('section').filter({ hasText: 'Plans' });
    const ctaLinks = pricingSection.locator('a[href^="/pricing"]');
    const count = await ctaLinks.count();
    // 2 tier CTAs + 1 compare link = 3
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('IntelSignup form posts to /api/newsletter', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.getByRole('button', { name: 'Subscribe' });

    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Submit with valid email — intercept the network request
    let requestMade = false;
    let requestBody = '';
    page.on('request', (req) => {
      if (req.url().includes('/api/newsletter') && req.method() === 'POST') {
        requestMade = true;
        requestBody = req.postData() || '';
      }
    });

    await emailInput.fill('test@example.com');
    await submitButton.click();

    // Wait for request to be made
    await page.waitForTimeout(2000);
    expect(requestMade).toBe(true);
    expect(requestBody).toContain('test@example.com');
    expect(requestBody).toContain('"consent":true');
  });

  test('mobile: no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone dimensions
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that body doesn't overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px tolerance
  });
});
