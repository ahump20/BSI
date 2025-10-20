import { expect, test } from '@playwright/test';

test.describe('D1 baseball games grid', () => {
  test('renders fallback cards with tabs and statuses', async ({ page }) => {
    await page.goto('/baseball/ncaab/games');

    await expect(page.getByRole('heading', { name: 'VU @ LSU' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NCST @ WAKE' })).toBeVisible();
    await expect(page.getByText('Postponed · Weather')).toBeVisible();

    const playsTab = page.getByRole('button', { name: 'Plays' }).first();
    await playsTab.click();
    await expect(page.getByText('Unlock live plays with Diamond Pro.')).toBeVisible();

    const tendenciesTab = page.getByRole('button', { name: 'Team Tendencies' }).first();
    await tendenciesTab.click();
    await expect(page.getByText('Upgrade to Diamond Pro to view tendency radar.')).toBeVisible();
  });
});

test.describe('Games API contract', () => {
  test('enforces tiering and fallback payload structure', async ({ request }) => {
    const response = await request.get('/api/v1/games');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.meta).toMatchObject({ tier: 'free' });
    expect(Array.isArray(body.games)).toBe(true);
    expect(body.games.length).toBeGreaterThan(0);

    const liveGame = body.games.find((game: any) => game.status === 'LIVE');
    expect(liveGame.locked).toBe(true);
    expect(liveGame.plays).toEqual([]);

    const proResponse = await request.get('/api/v1/games', {
      headers: { 'x-bsi-subscription': 'diamond_pro' }
    });
    expect(proResponse.ok()).toBeTruthy();
    const proBody = await proResponse.json();
    expect(proBody.meta).toMatchObject({ tier: 'diamond_pro' });
    const proLiveGame = proBody.games.find((game: any) => game.status === 'LIVE');
    expect(proLiveGame.locked).toBe(false);
    expect(proLiveGame.plays.length).toBeGreaterThan(0);
    const statuses = proBody.games.map((game: any) => game.status);
    expect(statuses).toEqual(expect.arrayContaining(['LIVE', 'FINAL', 'POSTPONED']));
  });
});
