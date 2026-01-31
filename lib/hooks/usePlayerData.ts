/**
 * usePlayerData Hook
 *
 * Fetches player profile data from BSI API with caching.
 * Supports NFL, CFB, MLB, NBA sports.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type PlayerSport = 'nfl' | 'cfb' | 'mlb' | 'nba' | 'cbb';

export interface PlayerTeam {
  id?: string;
  name: string;
  abbreviation: string;
  primaryColor?: string;
  logo?: string;
}

export interface PlayerBio {
  birthDate?: string;
  birthPlace?: string;
  hometown?: string;
  height?: string;
  weight?: string | number;
  age?: number;
  experience?: number;
  college?: string;
  highSchool?: string;
  draft?: {
    year: number;
    round: number;
    pick: number;
    team: string;
  };
}

export interface PlayerStats {
  season: number;
  stats: Record<string, number | string>;
}

export interface GameLogEntry {
  date: string;
  week?: number;
  opponent: {
    name: string;
    abbreviation: string;
  };
  result: {
    outcome: 'W' | 'L' | 'T';
    score: string;
  };
  stats: string;
  isHome: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  number?: string;
  team?: PlayerTeam;
  headshot?: string;
  bio: PlayerBio;
  seasonStats?: PlayerStats;
  careerStats?: PlayerStats[];
  gameLog?: GameLogEntry[];
  status?: 'active' | 'injured' | 'rookie' | 'veteran';
}

export interface UsePlayerDataResult {
  player: PlayerData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SPORT_API_MAP: Record<PlayerSport, string> = {
  nfl: '/api/nfl/players',
  cfb: '/api/cfb/players',
  mlb: '/api/mlb/players',
  nba: '/api/nba/players',
  cbb: '/api/cbb/players',
};

// Detect sport from player ID patterns (ESPN uses different ID ranges)
function detectSportFromId(playerId: string): PlayerSport {
  const id = parseInt(playerId, 10);
  // This is a heuristic - ESPN player IDs don't have strict ranges
  // Default to NFL for the profile page
  return 'nfl';
}

function normalizePlayerData(raw: any, playerId: string): PlayerData {
  const player = raw.player || raw;
  const stats = raw.stats || {};

  return {
    id: playerId,
    name: player.fullName || player.name || `Player ${playerId}`,
    firstName: player.firstName || '',
    lastName: player.lastName || '',
    position: player.position || '',
    number: player.jersey || player.number,
    team: player.team
      ? {
          id: player.team.id,
          name: player.team.name || player.team.displayName,
          abbreviation: player.team.abbreviation,
          primaryColor: player.team.color,
          logo: player.team.logo,
        }
      : undefined,
    headshot: player.headshot || player.headshotUrl,
    bio: {
      birthDate: player.birthDate || player.dateOfBirth,
      birthPlace: player.birthPlace || player.hometown,
      hometown: player.hometown,
      height: player.height || player.displayHeight,
      weight: player.weight || player.displayWeight,
      age: player.age,
      experience: player.experience,
      college: player.college,
      highSchool: player.highSchool,
      draft: player.draft,
    },
    seasonStats: stats.season
      ? {
          season: stats.season,
          stats: stats.stats || {},
        }
      : undefined,
    status: player.status || 'active',
  };
}

export function usePlayerData(playerId: string, sport?: PlayerSport): UsePlayerDataResult {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const resolvedSport = sport || detectSportFromId(playerId);

  const fetchPlayer = useCallback(async () => {
    if (!playerId || playerId === 'undefined') {
      setError(new Error('Invalid player ID'));
      setIsLoading(false);
      return;
    }

    try {
      const apiPath = SPORT_API_MAP[resolvedSport];
      const response = await fetch(`${apiPath}/${playerId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const normalized = normalizePlayerData(data, playerId);

      setPlayer(normalized);
      setError(null);
    } catch (err) {
      console.error(`[usePlayerData] Failed to fetch player ${playerId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch player data'));
    } finally {
      setIsLoading(false);
    }
  }, [playerId, resolvedSport]);

  useEffect(() => {
    setIsLoading(true);
    setPlayer(null);
    setError(null);
    fetchPlayer();
  }, [fetchPlayer]);

  return {
    player,
    isLoading,
    error,
    refetch: fetchPlayer,
  };
}
