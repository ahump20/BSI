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
  mlbamId?: number; // MLB Advanced Media ID for headshots
  sport: string;
  name: string;
  team: string;
  position: string;
  number?: string;
  headshotUrl?: string; // Official league headshot URL
  stats: Record<string, any>;
  dataSource: string;
  dataStamp: string;
}

// MLB headshot URL generator (official MLB CDN)
const MLB_IMG_BASE = 'https://img.mlbstatic.com';
export function getMLBHeadshotUrl(mlbamId: number, size: number = 300): string {
  return `${MLB_IMG_BASE}/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${size},q_auto:best/v1/people/${mlbamId}/headshot/67/current`;
}

// NFL headshot URL generator (ESPN CDN)
export function getNFLHeadshotUrl(espnId: string | number): string {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${espnId}.png&w=350&h=254`;
}

export interface FetchPlayersOptions {
  limit?: number;
  offset?: number;
  team?: string;
  position?: string;
  sortBy?: string;
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
 * Now supports pagination and includes headshot URLs from official MLB CDN
 *
 * @param options - Pagination and filter options
 * @param options.limit - Number of players to fetch (default: 200, max: 1000)
 * @param options.offset - Number of players to skip for pagination
 * @param options.team - Filter by team abbreviation
 * @param options.sortBy - Sort by stat (default: WAR)
 */
export async function fetchMLBPlayers(
  options: FetchPlayersOptions = {}
): Promise<ApiResponse<Player[]>> {
  const { limit = 200, offset = 0, team, sortBy = 'WAR' } = options;

  try {
    // Build URL with pagination - FanGraphs supports up to 1000 players per request
    const params = new URLSearchParams({
      limit: Math.min(limit, 1000).toString(),
      sortby: sortBy,
    });

    if (team) params.append('team', team);

    const response = await fetch(`${API_ENDPOINTS.mlb.leaderboards}/batting?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`MLB API Error: ${response.status}`);
    }

    const result = await response.json();

    // Extract player data from leaderboard response
    const leaderboardData = result.data?.data || [];

    // Apply offset for client-side pagination if needed
    const paginatedData =
      offset > 0 ? leaderboardData.slice(offset, offset + limit) : leaderboardData;

    // Transform FanGraphs leaderboard data to our Player interface
    const players: Player[] = paginatedData.map((player: any) => {
      // Clean player name (remove HTML tags)
      const cleanName = player.Name?.replace(/<[^>]*>/g, '') || 'Unknown';
      const cleanTeam = player.Team?.replace(/<[^>]*>/g, '') || 'Unknown';
      const mlbamId = player.xMLBAMID || null;

      return {
        id: `mlb_${mlbamId || player.playerid}`,
        mlbamId: mlbamId,
        sport: 'baseball',
        name: cleanName,
        team: cleanTeam,
        position: player.Pos || 'Unknown',
        number: '',
        // Generate headshot URL from official MLB CDN if we have MLBAM ID
        headshotUrl: mlbamId ? getMLBHeadshotUrl(mlbamId) : undefined,
        stats: {
          AVG: player.AVG ? Number(player.AVG.toFixed(3)) : 0,
          HR: player.HR || 0,
          RBI: player.RBI || 0,
          OPS: player.OPS ? Number(player.OPS.toFixed(3)) : 0,
          WAR: player.WAR ? Number(player.WAR.toFixed(1)) : 0,
          'wRC+': player['wRC+'] || 0,
          G: player.G || 0,
          AB: player.AB || 0,
          H: player.H || 0,
          '2B': player['2B'] || 0,
          '3B': player['3B'] || 0,
          BB: player.BB || 0,
          SO: player.SO || 0,
          SB: player.SB || 0,
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
 * Includes headshot URLs from ESPN CDN
 */
export async function fetchNFLPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const response = await fetch(API_ENDPOINTS.nfl.players);

    if (!response.ok) {
      throw new Error(`NFL API Error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our Player interface
    const players: Player[] = data.map((player: any) => {
      const espnId = player.id;
      // Use ESPN's headshot URL if provided, otherwise generate from CDN
      const headshotUrl = player.headshot?.href || (espnId ? getNFLHeadshotUrl(espnId) : undefined);

      return {
        id: `nfl_${espnId}`,
        sport: 'football',
        name: player.displayName || player.fullName || player.name,
        team: player.team?.displayName || player.team || 'Free Agent',
        position: player.position?.abbreviation || player.position || 'Unknown',
        number: player.jersey?.toString(),
        headshotUrl,
        stats: {
          YDS: player.stats?.passing?.yards || player.stats?.rushing?.yards || 0,
          TD: player.stats?.passing?.touchdowns || player.stats?.rushing?.touchdowns || 0,
          QBR: player.stats?.passing?.qbRating || 0,
          Rating: player.stats?.rating || 0,
        },
        dataSource: DATA_SOURCES.ESPN_API.name,
        dataStamp: getDataStamp(),
      };
    });

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
 * College Baseball headshot URL generator (ESPN CDN)
 */
export function getCollegeBaseballHeadshotUrl(espnId: string | number): string {
  return `https://a.espncdn.com/i/headshots/college-baseball/players/full/${espnId}.png`;
}

/**
 * College Football headshot URL generator (ESPN CDN)
 */
export function getCollegeFootballHeadshotUrl(espnId: string | number): string {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/${espnId}.png&w=350&h=254`;
}

/**
 * Fetch College Baseball players from your Cloudflare Worker
 * Returns current college players (filters out drafted players)
 */
export async function fetchCollegeBaseballPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const response = await fetch(API_ENDPOINTS.collegeBaseball.players);

    if (!response.ok) {
      throw new Error(`College Baseball API Error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our Player interface
    const players: Player[] = data.map((player: any) => {
      const espnId = player.espn_id || player.id;
      const headshotUrl =
        player.headshot_url || (espnId ? getCollegeBaseballHeadshotUrl(espnId) : undefined);

      return {
        id: `cbb_${espnId}`,
        sport: 'collegeBaseball',
        name: player.name || `${player.first_name} ${player.last_name}`,
        team: player.team || player.school || 'Unknown',
        position: player.position || 'Unknown',
        number: player.jersey?.toString(),
        headshotUrl,
        stats: {
          AVG: player.stats?.batting?.average || 0,
          HR: player.stats?.batting?.homeRuns || 0,
          RBI: player.stats?.batting?.rbi || 0,
          ERA: player.stats?.pitching?.era || 0,
          Class: player.experience || player.year || 'Unknown',
          Age: player.age || 0,
        },
        dataSource: 'ESPN College Baseball via Blaze API',
        dataStamp: getDataStamp(),
      };
    });

    return {
      success: true,
      data: players,
      error: null,
      source: 'ESPN College Baseball',
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('College Baseball API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: 'ESPN College Baseball',
      timestamp: getDataStamp(),
    };
  }
}

/**
 * Fetch College Football players from your Cloudflare Worker
 * Uses CFBD (College Football Data) as primary source
 */
export async function fetchCollegeFootballPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const response = await fetch(API_ENDPOINTS.collegeFootball.players);

    if (!response.ok) {
      throw new Error(`College Football API Error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our Player interface
    const players: Player[] = data.map((player: any) => {
      const espnId = player.espn_id || player.id;
      const headshotUrl =
        player.headshot_url || (espnId ? getCollegeFootballHeadshotUrl(espnId) : undefined);

      return {
        id: `cfb_${espnId}`,
        sport: 'collegeFootball',
        name: player.name || `${player.first_name} ${player.last_name}`,
        team: player.team || player.school || 'Unknown',
        position: player.position || 'Unknown',
        number: player.jersey?.toString(),
        headshotUrl,
        stats: {
          YDS: player.stats?.passing?.yards || player.stats?.rushing?.yards || 0,
          TD: player.stats?.passing?.touchdowns || player.stats?.rushing?.touchdowns || 0,
          INT: player.stats?.passing?.interceptions || 0,
          QBR: player.stats?.passing?.qbRating || 0,
          Class: player.year || player.experience || 'Unknown',
          Height: player.height || '',
          Weight: player.weight || '',
        },
        dataSource: 'CFBD via Blaze API',
        dataStamp: getDataStamp(),
      };
    });

    return {
      success: true,
      data: players,
      error: null,
      source: 'College Football Data (CFBD)',
      timestamp: getDataStamp(),
    };
  } catch (error) {
    console.error('College Football API Error:', error);
    return {
      success: false,
      data: null,
      error: (error as Error).message,
      source: 'College Football Data (CFBD)',
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
