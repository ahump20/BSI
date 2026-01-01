/**
 * API Client for Blaze Sports Intel
 *
 * Connects to existing Cloudflare Functions endpoints
 * All API routes are in /functions/api/*
 */

const BASE_URL =
  typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL || '' : '';

export interface APIError {
  message: string;
  status: number;
  code?: string;
}

export interface APIResponse<T> {
  data: T;
  meta?: {
    dataSource: string;
    lastUpdated: string;
    timezone: 'America/Chicago';
    cached?: boolean;
  };
}

/**
 * Generic API client with error handling
 */
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: APIError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };

    // Try to get error details from response body
    try {
      const body = (await response.json()) as { error?: string; code?: string };
      if (body.error) {
        error.message = body.error;
        error.code = body.code;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw error;
  }

  return response.json();
}

// ============================================================================
// MLB API
// ============================================================================

export interface MLBPlayer {
  id: string;
  name: string;
  team: string;
  teamFull: string;
  position: string;
  stats: {
    AVG?: string;
    HR?: number;
    RBI?: number;
    OPS?: string;
    WAR?: number;
    ERA?: string;
    WHIP?: string;
    K?: number;
    W?: number;
    L?: number;
  };
  image?: string;
}

export interface MLBGame {
  id: string;
  away: { team: string; score: number };
  home: { team: string; score: number };
  status: 'scheduled' | 'live' | 'final';
  inning?: number;
  outs?: number;
  startTime: string;
}

export interface MLBStandings {
  division: string;
  teams: Array<{
    team: string;
    wins: number;
    losses: number;
    pct: string;
    gb: string;
    streak: string;
  }>;
}

export const mlbApi = {
  getScores: (date?: string) =>
    apiClient<{ games: MLBGame[] }>(`/mlb/scores${date ? `?date=${date}` : ''}`),
  getStandings: () => apiClient<{ standings: MLBStandings[] }>('/mlb/standings'),
  getPlayers: () => apiClient<{ players: MLBPlayer[] }>('/mlb/players'),
  getTeam: (teamId: string) => apiClient<{ team: unknown }>(`/mlb/${teamId}`),
};

// ============================================================================
// NFL API
// ============================================================================

export interface NFLPlayer {
  id: string;
  name: string;
  team: string;
  teamFull: string;
  position: string;
  stats: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    tackles?: number;
    sacks?: number;
    interceptions?: number;
  };
  image?: string;
}

export interface NFLGame {
  id: string;
  away: { team: string; score: number };
  home: { team: string; score: number };
  status: 'scheduled' | 'live' | 'final';
  quarter?: number;
  timeRemaining?: string;
  startTime: string;
}

export const nflApi = {
  getScores: (week?: number) =>
    apiClient<{ games: NFLGame[] }>(`/nfl/scores${week ? `?week=${week}` : ''}`),
  getStandings: () => apiClient<{ standings: unknown[] }>('/nfl/standings'),
  getPlayers: () => apiClient<{ players: NFLPlayer[] }>('/nfl/players'),
};

// ============================================================================
// NBA API
// ============================================================================

export interface NBAPlayer {
  id: string;
  name: string;
  team: string;
  teamFull: string;
  position: string;
  stats: {
    PPG?: number;
    RPG?: number;
    APG?: number;
    FGPct?: string;
    ThreePct?: string;
  };
  image?: string;
}

export interface NBAGame {
  id: string;
  away: { team: string; score: number };
  home: { team: string; score: number };
  status: 'scheduled' | 'live' | 'final';
  quarter?: number;
  timeRemaining?: string;
  startTime: string;
}

export const nbaApi = {
  getScores: (date?: string) =>
    apiClient<{ games: NBAGame[] }>(`/nba/scores${date ? `?date=${date}` : ''}`),
  getStandings: () => apiClient<{ standings: unknown[] }>('/nba/standings'),
  getPlayers: () => apiClient<{ players: NBAPlayer[] }>('/nba/players'),
};

// ============================================================================
// NCAA API
// ============================================================================

export interface NCAAGame {
  id: string;
  away: { team: string; score: number };
  home: { team: string; score: number };
  status: 'scheduled' | 'live' | 'final';
  conference: string;
  startTime: string;
}

export const ncaaApi = {
  getBaseballGames: (date?: string) =>
    apiClient<{ games: NCAAGame[] }>(`/college-baseball/games${date ? `?date=${date}` : ''}`),
  getBaseballStandings: (conference?: string) =>
    apiClient<{ standings: unknown[] }>(
      `/college-baseball/standings${conference ? `?conference=${conference}` : ''}`
    ),
  getFootballGames: (week?: number) =>
    apiClient<{ games: NCAAGame[] }>(`/college-football/games${week ? `?week=${week}` : ''}`),
  getFootballStandings: () => apiClient<{ standings: unknown[] }>('/college-football/standings'),
};

// ============================================================================
// Unified Sport Type
// ============================================================================

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa-baseball' | 'ncaa-football';

export function getSportApi(sport: Sport) {
  switch (sport) {
    case 'mlb':
      return mlbApi;
    case 'nfl':
      return nflApi;
    case 'nba':
      return nbaApi;
    case 'ncaa-baseball':
    case 'ncaa-football':
      return ncaaApi;
    default:
      throw new Error(`Unknown sport: ${sport}`);
  }
}
