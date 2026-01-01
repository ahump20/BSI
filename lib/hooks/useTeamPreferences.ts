/**
 * BLAZE SPORTS INTEL - Team Preferences Hook
 *
 * React hook for managing favorite teams across all sports.
 * Persists to localStorage for instant response, with optional KV sync.
 *
 * Features:
 * - Multi-sport team selection (MLB, NFL, NBA, NCAA)
 * - localStorage persistence with SSR safety
 * - Type-safe team data structure
 * - Easy integration with dashboard personalization
 *
 * Last Updated: 2025-12-28
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type League = 'mlb' | 'nfl' | 'nba' | 'ncaa';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  league: League;
  colors: {
    primary: string;
    secondary: string;
  };
  logoUrl?: string;
}

export interface TeamPreferences {
  favoriteTeams: Record<League, string | null>; // team id per league
  lastUpdated: string | null;
}

const STORAGE_KEY = 'bsi_team_preferences';

// ============================================================================
// TEAM DATA
// ============================================================================

export const TEAMS: Team[] = [
  // MLB Teams (subset of most popular + Austin's team)
  {
    id: 'stl',
    name: 'St. Louis Cardinals',
    shortName: 'Cardinals',
    city: 'St. Louis',
    league: 'mlb',
    colors: { primary: '#C41E3A', secondary: '#0C2340' },
  },
  {
    id: 'nyy',
    name: 'New York Yankees',
    shortName: 'Yankees',
    city: 'New York',
    league: 'mlb',
    colors: { primary: '#003087', secondary: '#E4002C' },
  },
  {
    id: 'lad',
    name: 'Los Angeles Dodgers',
    shortName: 'Dodgers',
    city: 'Los Angeles',
    league: 'mlb',
    colors: { primary: '#005A9C', secondary: '#EF3E42' },
  },
  {
    id: 'bos',
    name: 'Boston Red Sox',
    shortName: 'Red Sox',
    city: 'Boston',
    league: 'mlb',
    colors: { primary: '#BD3039', secondary: '#0C2340' },
  },
  {
    id: 'chc',
    name: 'Chicago Cubs',
    shortName: 'Cubs',
    city: 'Chicago',
    league: 'mlb',
    colors: { primary: '#0E3386', secondary: '#CC3433' },
  },
  {
    id: 'hou',
    name: 'Houston Astros',
    shortName: 'Astros',
    city: 'Houston',
    league: 'mlb',
    colors: { primary: '#002D62', secondary: '#EB6E1F' },
  },
  {
    id: 'tex',
    name: 'Texas Rangers',
    shortName: 'Rangers',
    city: 'Texas',
    league: 'mlb',
    colors: { primary: '#003278', secondary: '#C0111F' },
  },
  {
    id: 'atl',
    name: 'Atlanta Braves',
    shortName: 'Braves',
    city: 'Atlanta',
    league: 'mlb',
    colors: { primary: '#CE1141', secondary: '#13274F' },
  },

  // NFL Teams
  {
    id: 'ten',
    name: 'Tennessee Titans',
    shortName: 'Titans',
    city: 'Tennessee',
    league: 'nfl',
    colors: { primary: '#0C2340', secondary: '#4B92DB' },
  },
  {
    id: 'dal',
    name: 'Dallas Cowboys',
    shortName: 'Cowboys',
    city: 'Dallas',
    league: 'nfl',
    colors: { primary: '#041E42', secondary: '#869397' },
  },
  {
    id: 'kc',
    name: 'Kansas City Chiefs',
    shortName: 'Chiefs',
    city: 'Kansas City',
    league: 'nfl',
    colors: { primary: '#E31837', secondary: '#FFB81C' },
  },
  {
    id: 'phi',
    name: 'Philadelphia Eagles',
    shortName: 'Eagles',
    city: 'Philadelphia',
    league: 'nfl',
    colors: { primary: '#004C54', secondary: '#A5ACAF' },
  },
  {
    id: 'sf',
    name: 'San Francisco 49ers',
    shortName: '49ers',
    city: 'San Francisco',
    league: 'nfl',
    colors: { primary: '#AA0000', secondary: '#B3995D' },
  },
  {
    id: 'buf',
    name: 'Buffalo Bills',
    shortName: 'Bills',
    city: 'Buffalo',
    league: 'nfl',
    colors: { primary: '#00338D', secondary: '#C60C30' },
  },
  {
    id: 'det',
    name: 'Detroit Lions',
    shortName: 'Lions',
    city: 'Detroit',
    league: 'nfl',
    colors: { primary: '#0076B6', secondary: '#B0B7BC' },
  },
  {
    id: 'hou-nfl',
    name: 'Houston Texans',
    shortName: 'Texans',
    city: 'Houston',
    league: 'nfl',
    colors: { primary: '#03202F', secondary: '#A71930' },
  },

  // NBA Teams
  {
    id: 'mem',
    name: 'Memphis Grizzlies',
    shortName: 'Grizzlies',
    city: 'Memphis',
    league: 'nba',
    colors: { primary: '#5D76A9', secondary: '#12173F' },
  },
  {
    id: 'bos-nba',
    name: 'Boston Celtics',
    shortName: 'Celtics',
    city: 'Boston',
    league: 'nba',
    colors: { primary: '#007A33', secondary: '#BA9653' },
  },
  {
    id: 'lal',
    name: 'Los Angeles Lakers',
    shortName: 'Lakers',
    city: 'Los Angeles',
    league: 'nba',
    colors: { primary: '#552583', secondary: '#FDB927' },
  },
  {
    id: 'gsw',
    name: 'Golden State Warriors',
    shortName: 'Warriors',
    city: 'Golden State',
    league: 'nba',
    colors: { primary: '#1D428A', secondary: '#FFC72C' },
  },
  {
    id: 'mia',
    name: 'Miami Heat',
    shortName: 'Heat',
    city: 'Miami',
    league: 'nba',
    colors: { primary: '#98002E', secondary: '#F9A01B' },
  },
  {
    id: 'den',
    name: 'Denver Nuggets',
    shortName: 'Nuggets',
    city: 'Denver',
    league: 'nba',
    colors: { primary: '#0E2240', secondary: '#FEC524' },
  },
  {
    id: 'okc',
    name: 'Oklahoma City Thunder',
    shortName: 'Thunder',
    city: 'Oklahoma City',
    league: 'nba',
    colors: { primary: '#007AC1', secondary: '#EF3B24' },
  },
  {
    id: 'sa',
    name: 'San Antonio Spurs',
    shortName: 'Spurs',
    city: 'San Antonio',
    league: 'nba',
    colors: { primary: '#C4CED4', secondary: '#000000' },
  },

  // NCAA Teams (major programs)
  {
    id: 'texas',
    name: 'Texas Longhorns',
    shortName: 'Longhorns',
    city: 'Austin',
    league: 'ncaa',
    colors: { primary: '#BF5700', secondary: '#FFFFFF' },
  },
  {
    id: 'tamu',
    name: 'Texas A&M Aggies',
    shortName: 'Aggies',
    city: 'College Station',
    league: 'ncaa',
    colors: { primary: '#500000', secondary: '#FFFFFF' },
  },
  {
    id: 'alabama',
    name: 'Alabama Crimson Tide',
    shortName: 'Alabama',
    city: 'Tuscaloosa',
    league: 'ncaa',
    colors: { primary: '#9E1B32', secondary: '#828A8F' },
  },
  {
    id: 'georgia',
    name: 'Georgia Bulldogs',
    shortName: 'Georgia',
    city: 'Athens',
    league: 'ncaa',
    colors: { primary: '#BA0C2F', secondary: '#000000' },
  },
  {
    id: 'ohio-state',
    name: 'Ohio State Buckeyes',
    shortName: 'Ohio State',
    city: 'Columbus',
    league: 'ncaa',
    colors: { primary: '#BB0000', secondary: '#666666' },
  },
  {
    id: 'michigan',
    name: 'Michigan Wolverines',
    shortName: 'Michigan',
    city: 'Ann Arbor',
    league: 'ncaa',
    colors: { primary: '#00274C', secondary: '#FFCB05' },
  },
  {
    id: 'lsu',
    name: 'LSU Tigers',
    shortName: 'LSU',
    city: 'Baton Rouge',
    league: 'ncaa',
    colors: { primary: '#461D7C', secondary: '#FDD023' },
  },
  {
    id: 'oklahoma',
    name: 'Oklahoma Sooners',
    shortName: 'Oklahoma',
    city: 'Norman',
    league: 'ncaa',
    colors: { primary: '#841617', secondary: '#FDF9D8' },
  },
];

// Group teams by league for easier access
export const TEAMS_BY_LEAGUE: Record<League, Team[]> = {
  mlb: TEAMS.filter((t) => t.league === 'mlb'),
  nfl: TEAMS.filter((t) => t.league === 'nfl'),
  nba: TEAMS.filter((t) => t.league === 'nba'),
  ncaa: TEAMS.filter((t) => t.league === 'ncaa'),
};

const LEAGUE_LABELS: Record<League, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  ncaa: 'College',
};

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultPreferences: TeamPreferences = {
  favoriteTeams: {
    mlb: null,
    nfl: null,
    nba: null,
    ncaa: null,
  },
  lastUpdated: null,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing team preferences
 *
 * @example
 * const { preferences, setFavoriteTeam, getFavoriteTeam, clearPreferences } = useTeamPreferences();
 *
 * // Set a favorite
 * setFavoriteTeam('mlb', 'stl');
 *
 * // Get favorite team object
 * const cardinals = getFavoriteTeam('mlb');
 */
export function useTeamPreferences() {
  const [preferences, setPreferences] = useState<TeamPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TeamPreferences;
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load team preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when preferences change
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save team preferences:', error);
    }
  }, [preferences, isLoaded]);

  /**
   * Set favorite team for a league
   */
  const setFavoriteTeam = useCallback((league: League, teamId: string | null) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteTeams: {
        ...prev.favoriteTeams,
        [league]: teamId,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Get the full Team object for a league's favorite
   */
  const getFavoriteTeam = useCallback(
    (league: League): Team | null => {
      const teamId = preferences.favoriteTeams[league];
      if (!teamId) return null;
      return TEAMS.find((t) => t.id === teamId) ?? null;
    },
    [preferences.favoriteTeams]
  );

  /**
   * Get all favorite teams as Team objects
   */
  const getAllFavorites = useCallback((): Partial<Record<League, Team>> => {
    const favorites: Partial<Record<League, Team>> = {};
    for (const league of Object.keys(preferences.favoriteTeams) as League[]) {
      const team = getFavoriteTeam(league);
      if (team) {
        favorites[league] = team;
      }
    }
    return favorites;
  }, [preferences.favoriteTeams, getFavoriteTeam]);

  /**
   * Check if user has any favorites set
   */
  const hasFavorites = useCallback((): boolean => {
    return Object.values(preferences.favoriteTeams).some((id) => id !== null);
  }, [preferences.favoriteTeams]);

  /**
   * Clear all preferences
   */
  const clearPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    preferences,
    isLoaded,
    setFavoriteTeam,
    getFavoriteTeam,
    getAllFavorites,
    hasFavorites,
    clearPreferences,
    teams: TEAMS,
    teamsByLeague: TEAMS_BY_LEAGUE,
    leagueLabels: LEAGUE_LABELS,
  };
}

export default useTeamPreferences;
