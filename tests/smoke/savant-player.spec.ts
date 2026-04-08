import { test, expect } from '@playwright/test';

/**
 * Savant Player Profile — visual verification tests.
 * Run against production: BASE_URL=https://blazesportsintel.com npx playwright test tests/smoke/savant-player.spec.ts
 */

const PLAYER_URL = '/college-baseball/savant/player/tex-robbins-43/';

test.describe('Savant Player Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLAYER_URL, { waitUntil: 'networkidle' });
  });

  test('renders player name and team', async ({ page }) => {
    // Player name should be visible in the hero
    const playerName = page.locator('h1');
    await expect(playerName).toBeVisible();
    const nameText = await playerName.textContent();
    expect(nameText?.toLowerCase()).toContain('robbins');

    // Team name should appear
    await expect(page.getByText('Texas Longhorns')).toBeVisible();
  });

  test('shows correct team logo (not broken image)', async ({ page }) => {
    // Find all img tags — none should be broken
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');

      // Skip decorative images (empty alt)
      if (alt === '') continue;

      // No broken image indicators
      const naturalWidth = await img.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth,
      );
      // A broken image has naturalWidth of 0
      if (src && !src.startsWith('data:')) {
        expect(naturalWidth, `Image broken: ${src}`).toBeGreaterThan(0);
      }
    }
  });

  test('no broken headshot img tag', async ({ page }) => {
    // There should be no img with alt text matching the player name
    // (headshots don't exist for college baseball — should use silhouette)
    const headshotImg = page.locator('img[alt="Aiden Robbins"]');
    await expect(headshotImg).toHaveCount(0);
  });

  test('displays headline stats with real values', async ({ page }) => {
    // wOBA or AVG stat card should show a real number, not null/undefined
    const statCards = page.locator('[class*="font-mono"][class*="font-bold"][class*="tabular"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await statCards.nth(i).textContent();
      expect(text).not.toContain('null');
      expect(text).not.toContain('undefined');
      expect(text).not.toBe('');
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('percentile bars render with labels', async ({ page }) => {
    // Batting percentiles section should exist
    await expect(page.getByText('Batting Percentiles')).toBeVisible();

    // Should have metric labels like AVG, OBP, SLG
    await expect(page.getByText('AVG').first()).toBeVisible();
    await expect(page.getByText('OBP').first()).toBeVisible();
    await expect(page.getByText('SLG').first()).toBeVisible();
  });

  test('scouting grades section renders', async ({ page }) => {
    await expect(page.getByText('Scouting Grades')).toBeVisible();

    // Grade numbers should be in the 20-80 range
    const gradeCards = page.locator('text=/^[2-8]0$/');
    const count = await gradeCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('YouTube highlights link exists and points to correct search', async ({ page }) => {
    const highlightLink = page.locator('a[href*="youtube.com/results"]');
    await expect(highlightLink).toBeVisible();

    const href = await highlightLink.getAttribute('href');
    expect(href).toContain('Robbins');
    expect(href).toContain('Texas');
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(PLAYER_URL, { waitUntil: 'networkidle' });

    // Filter out known benign errors (e.g. favicon, third-party scripts)
    const realErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('third-party') &&
        !e.includes('Failed to load resource') &&
        !e.includes('net::ERR'),
    );
    expect(realErrors).toHaveLength(0);
  });

  test('conference badge shows SEC', async ({ page }) => {
    await expect(page.getByText('SEC')).toBeVisible();
  });

  test('position silhouette renders (SVG present)', async ({ page }) => {
    // The position icon should be an SVG inside the avatar area
    const svgs = page.locator('svg[viewBox="0 0 120 120"]');
    const count = await svgs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('team logo is the correct Longhorns logo', async ({ page }) => {
    // The logo img should use ESPN CDN with the correct logoId (251 for Texas)
    const logoImg = page.locator('img[alt*="Texas"]');
    await expect(logoImg.first()).toBeVisible();

    const src = await logoImg.first().getAttribute('src');
    // Texas uses localLogo (/images/teams/texas/) or ESPN CDN with logoId 251
    expect(src).toMatch(/texas|251/);
  });

  test('page does not show PLAYER NOT FOUND', async ({ page }) => {
    await expect(page.getByText('Player not found')).not.toBeVisible();
    await expect(page.getByText('PLAYER NOT FOUND')).not.toBeVisible();
  });
});
