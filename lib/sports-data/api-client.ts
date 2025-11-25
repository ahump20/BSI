/**
 * BLAZE SPORTS INTEL | API Client
 * Fetches real data from Cloudflare Workers
 *
 * @module api-client
 * @version 10.0.0
 */

import { API_ENDPOINTS, DATA_SOURCES } from './config';
import { getDataStamp } from './utils';

export interface Player {
  id: string;
  sport: string;
  name: string;
  team: string;
  position: string;
  number?: string;
  stats: Record<string, any>;
  dataSource: string;
  dataStamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  source: string;
  timestamp: string;
}

/**
 * Fetch MLB players from leaderboards endpoint
 */
export async function fetchMLBPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const response = await fetch(`${API_ENDPOINTS.mlb.leaderboards}/batting?limit=50&sortby=WAR`);

    if (!response.ok) {
      throw new Error(`MLB API Error: ${response.status}`);
    }

    const result = await response.json();

    // Extract player data from leaderboard response
    const leaderboardData = result.data?.data || [];

    // Transform FanGraphs leaderboard data to our Player interface
    const players: Player[] = leaderboardData.map((player: any) => {
      // Clean player name (remove HTML tags)
      const cleanName = player.Name?.replace(/<[^>]*>/g, '') || 'Unknown';
      const cleanTeam = player.Team?.replace(/<[^>]*>/g, '') || 'Unknown';

      return {
        id: `mlb_${player.xMLBAMID || player.playerid}`,
        sport: 'baseball',
        name: cleanName,
        team: cleanTeam,
        position: player.Pos || 'Unknown',
        number: '',
        stats: {
          AVG: player.AVG ? Number(player.AVG.toFixed(3)) : 0,
          HR: player.HR || 0,
          RBI: player.RBI || 0,
          OPS: player.OPS ? Number(player.OPS.toFixed(3)) : 0,
          WAR: player.WAR ? Number(player.WAR.toFixed(1)) : 0,
          'wRC+': player['wRC+'] || 0,
        },
        dataSource: 'FanGraphs via Blaze API',
        dataStamp: getDataStamp(),
      };
    });

    return {
      success: true,
      data: players,
      error: null,
      source: 'FanGraphs',
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('MLB API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: 'FanGraphs',
      timestamp: getDataStamp(),
    };
  }
}

/**
 * Fetch NFL players from your Cloudflare Worker
 */
export async function fetchNFLPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const response = await fetch(API_ENDPOINTS.nfl.players);

    if (!response.ok) {
      throw new Error(`NFL API Error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our Player interface
    const players: Player[] = data.map((player: any) => ({
      id: `nfl_${player.id}`,
      sport: 'football',
      name: player.displayName || player.fullName || player.name,
      team: player.team?.displayName || player.team || 'Free Agent',
      position: player.position?.abbreviation || player.position || 'Unknown',
      number: player.jersey?.toString(),
      stats: {
        YDS: player.stats?.passing?.yards || player.stats?.rushing?.yards || 0,
        TD: player.stats?.passing?.touchdowns || player.stats?.rushing?.touchdowns || 0,
        QBR: player.stats?.passing?.qbRating || 0,
        Rating: player.stats?.rating || 0,
      },
      dataSource: DATA_SOURCES.ESPN_API.name,
      dataStamp: getDataStamp(),
    }));

    return {
      success: true,
      data: players,
      error: null,
      source: DATA_SOURCES.ESPN_API.name,
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('NFL API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: DATA_SOURCES.ESPN_API.name,
      timestamp: getDataStamp(),
    };
  }
}

/**
 * Fetch sports odds from your Cloudflare Worker
 */
export async function fetchOdds(sport: string = 'baseball_mlb'): Promise<ApiResponse<any[]>> {
  try {
    const url =
      sport === 'all' ? API_ENDPOINTS.odds.current : `${API_ENDPOINTS.odds.current}?sport=${sport}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Odds API Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
      error: null,
      source: DATA_SOURCES.THEODDS_API.name,
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('Odds API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: DATA_SOURCES.THEODDS_API.name,
      timestamp: getDataStamp(),
    };
  }
}

/**
 * Fetch sports news from your Cloudflare Worker
 */
export async function fetchNews(sport: string = 'mlb'): Promise<ApiResponse<any[]>> {
  try {
    const url = `${API_ENDPOINTS.news.feed}?sport=${sport}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
      error: null,
      source: DATA_SOURCES.ESPN_API.name,
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('News API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: DATA_SOURCES.ESPN_API.name,
      timestamp: getDataStamp(),
    };
  }
}

/**
 * Generic fetch with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
