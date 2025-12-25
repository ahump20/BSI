/**
 * BSI Game Store - Live Sports Data State Management
 *
 * Manages live scores, selected games, filters, and real-time updates
 * for MLB, NFL, NCAA, and all covered sports
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa-baseball' | 'ncaa-football' | 'ncaa-basketball';
export type GameStatus = 'scheduled' | 'pregame' | 'live' | 'final' | 'postponed' | 'suspended';

export interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface GameScore {
  runs?: number; // Baseball
  points?: number; // Football/Basketball
  hits?: number;
  errors?: number;
}

export interface Game {
  id: string;
  sport: Sport;
  status: GameStatus;
  startTime: string; // ISO timestamp
  venue?: string;
  broadcast?: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: GameScore;
  awayScore: GameScore;
  inning?: number; // Baseball
  inningHalf?: 'top' | 'bottom';
  quarter?: number; // Football/Basketball
  period?: number;
  timeRemaining?: string;
  outs?: number;
  bases?: [boolean, boolean, boolean]; // [1st, 2nd, 3rd]
  lastUpdated: string;
}

export interface GameFilters {
  sport: Sport | 'all';
  date: string; // YYYY-MM-DD
  status: GameStatus | 'all';
  favoriteTeamsOnly: boolean;
  conference?: string;
  division?: string;
}

interface GameState {
  // Data
  games: Game[];
  selectedGame: Game | null;
  favoriteTeams: string[]; // Team IDs

  // Filters
  filters: GameFilters;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetch: string | null;
  error: string | null;

  // Actions
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
  removeGame: (gameId: string) => void;
  selectGame: (game: Game | null) => void;

  // Filters
  setFilters: (filters: Partial<GameFilters>) => void;
  resetFilters: () => void;

  // Favorites
  addFavoriteTeam: (teamId: string) => void;
  removeFavoriteTeam: (teamId: string) => void;
  toggleFavoriteTeam: (teamId: string) => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getLiveGames: () => Game[];
  getGamesBySport: (sport: Sport) => Game[];
  getFilteredGames: () => Game[];
}

const defaultFilters: GameFilters = {
  sport: 'all',
  date: new Date().toISOString().split('T')[0],
  status: 'all',
  favoriteTeamsOnly: false,
};

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        games: [],
        selectedGame: null,
        favoriteTeams: [],
        filters: defaultFilters,
        isLoading: false,
        isRefreshing: false,
        lastFetch: null,
        error: null,

        // Game actions
        setGames: (games) =>
          set({ games, lastFetch: new Date().toISOString(), error: null }, false, 'setGames'),

        addGame: (game) => set((state) => ({ games: [...state.games, game] }), false, 'addGame'),

        updateGame: (gameId, updates) =>
          set(
            (state) => ({
              games: state.games.map((g) =>
                g.id === gameId ? { ...g, ...updates, lastUpdated: new Date().toISOString() } : g
              ),
              selectedGame:
                state.selectedGame?.id === gameId
                  ? { ...state.selectedGame, ...updates }
                  : state.selectedGame,
            }),
            false,
            'updateGame'
          ),

        removeGame: (gameId) =>
          set(
            (state) => ({
              games: state.games.filter((g) => g.id !== gameId),
              selectedGame: state.selectedGame?.id === gameId ? null : state.selectedGame,
            }),
            false,
            'removeGame'
          ),

        selectGame: (game) => set({ selectedGame: game }, false, 'selectGame'),

        // Filter actions
        setFilters: (filters) =>
          set((state) => ({ filters: { ...state.filters, ...filters } }), false, 'setFilters'),

        resetFilters: () => set({ filters: defaultFilters }, false, 'resetFilters'),

        // Favorite actions
        addFavoriteTeam: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.includes(teamId)
                ? state.favoriteTeams
                : [...state.favoriteTeams, teamId],
            }),
            false,
            'addFavoriteTeam'
          ),

        removeFavoriteTeam: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.filter((id) => id !== teamId),
            }),
            false,
            'removeFavoriteTeam'
          ),

        toggleFavoriteTeam: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.includes(teamId)
                ? state.favoriteTeams.filter((id) => id !== teamId)
                : [...state.favoriteTeams, teamId],
            }),
            false,
            'toggleFavoriteTeam'
          ),

        // Loading actions
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        setRefreshing: (isRefreshing) => set({ isRefreshing }, false, 'setRefreshing'),
        setError: (error) => set({ error }, false, 'setError'),

        // Selectors
        getLiveGames: () => get().games.filter((g) => g.status === 'live'),

        getGamesBySport: (sport) => get().games.filter((g) => g.sport === sport),

        getFilteredGames: () => {
          const { games, filters, favoriteTeams } = get();

          return games.filter((game) => {
            // Sport filter
            if (filters.sport !== 'all' && game.sport !== filters.sport) {
              return false;
            }

            // Status filter
            if (filters.status !== 'all' && game.status !== filters.status) {
              return false;
            }

            // Date filter
            const gameDate = game.startTime.split('T')[0];
            if (gameDate !== filters.date) {
              return false;
            }

            // Favorites filter
            if (filters.favoriteTeamsOnly) {
              const isHomeTeamFavorite = favoriteTeams.includes(game.homeTeam.id);
              const isAwayTeamFavorite = favoriteTeams.includes(game.awayTeam.id);
              if (!isHomeTeamFavorite && !isAwayTeamFavorite) {
                return false;
              }
            }

            return true;
          });
        },
      }),
      {
        name: 'bsi-game-store',
        partialize: (state) => ({
          favoriteTeams: state.favoriteTeams,
          filters: state.filters,
        }),
      }
    ),
    { name: 'GameStore' }
  )
);

export default useGameStore;
