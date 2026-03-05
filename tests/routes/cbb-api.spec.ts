import { test, expect } from '@playwright/test';

const API = process.env.BASE_URL || 'https://blazesportsintel.com';

test.describe('CBB API Endpoints', () => {
  test('/api/cbb/scores returns valid scoreboard', async ({ request }) => {
    const res = await request.get(`${API}/api/cbb/scores`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('games');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.games)).toBe(true);
    expect(data.meta).toHaveProperty('dataSource');
  });

  test('/api/cbb/standings returns standings data', async ({ request }) => {
    const res = await request.get(`${API}/api/cbb/standings`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('standings');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.standings)).toBe(true);
    expect(data.standings.length).toBeGreaterThan(0);
  });

  test('/api/cbb/teams returns teams list', async ({ request }) => {
    const res = await request.get(`${API}/api/cbb/teams`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('teams');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.teams)).toBe(true);
    expect(data.teams.length).toBeGreaterThan(10);

    // Verify team shape
    const team = data.teams[0];
    expect(team).toHaveProperty('name');
    expect(team).toHaveProperty('abbreviation');
  });

  test('/api/cbb/news returns articles', async ({ request }) => {
    const res = await request.get(`${API}/api/cbb/news`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('articles');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.articles)).toBe(true);

    if (data.articles.length > 0) {
      const article = data.articles[0];
      expect(article).toHaveProperty('headline');
      expect(article.headline.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Existing API Endpoints (regression)', () => {
  test('/api/mlb/scores still works', async ({ request }) => {
    const res = await request.get(`${API}/api/mlb/scores`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('games');
    expect(data).toHaveProperty('meta');
  });

  test('/api/nfl/standings still works', async ({ request }) => {
    const res = await request.get(`${API}/api/nfl/standings`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('standings');
  });

  test('/api/nba/scores still works', async ({ request }) => {
    const res = await request.get(`${API}/api/nba/scores`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('games');
  });

  test('/api/cfb/standings still works', async ({ request }) => {
    const res = await request.get(`${API}/api/cfb/standings`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('standings');
    expect(Array.isArray(data.standings)).toBe(true);
  });
});
