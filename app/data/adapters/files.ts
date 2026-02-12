// File-based data adapter for local JSON files

import { schema, type Team, type PortfolioItem, type SeriesData } from '../schema';

const BASE_PATH = '/data';

async function loadJSON<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_PATH}/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getTeams(league: string): Promise<Team[]> {
  try {
    const data = await loadJSON<any>(`teams/${league.toLowerCase()}.json`);
    return schema.teams(data);
  } catch (_error) {
    // Fallback to all teams if specific league not found
    const allTeams = await loadJSON<any>('teams/all.json');
    const filtered = allTeams.filter((t: any) => t.league === league);
    return schema.teams(filtered);
  }
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
  const data = await loadJSON<any>('portfolio.json');
  return schema.portfolio(data);
}

export async function getHistoricalData(): Promise<SeriesData> {
  const data = await loadJSON<any>('historical-analytics.json');
  return schema.accuracySeries(data);
}

// Preload static data on initialization
export async function preloadStaticData(): Promise<void> {
  try {
    await Promise.all([
      loadJSON('teams/mlb.json'),
      loadJSON('teams/nfl.json'),
      loadJSON('teams/nba.json'),
      loadJSON('portfolio.json'),
    ]);
    // preload complete
  } catch (_error) {
    // handled by UI state
  }
}
