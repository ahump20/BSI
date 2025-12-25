/**
 * BSI Player Store - Athlete Data & Search State Management
 *
 * Manages player profiles, search, comparisons, and watchlists
 * Privacy-compliant: redacts minors' full names per CLAUDE.md
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Sport } from './gameStore';

// Types
export type Position =
  // Baseball
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH'
  | 'RP'
  | 'SP'
  // Football
  | 'QB'
  | 'RB'
  | 'WR'
  | 'TE'
  | 'OL'
  | 'DL'
  | 'LB'
  | 'CB'
  | 'S'
  | 'K'
  | 'P'
  // Basketball
  | 'PG'
  | 'SG'
  | 'SF'
  | 'PF'
  | 'C';

export type PlayerLevel = 'professional' | 'college' | 'high-school' | 'youth';

export interface PlayerStats {
  // Baseball batting
  avg?: number;
  hr?: number;
  rbi?: number;
  ops?: number;
  war?: number;

  // Baseball pitching
  era?: number;
  wins?: number;
  losses?: number;
  strikeouts?: number;
  whip?: number;

  // Football
  passingYards?: number;
  rushingYards?: number;
  receivingYards?: number;
  touchdowns?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;

  // Basketball
  ppg?: number;
  rpg?: number;
  apg?: number;
  spg?: number;
  bpg?: number;
  fgPct?: number;

  // Generic
  gamesPlayed?: number;
  [key: string]: number | undefined;
}

export interface Player {
  id: string;
  name: string; // Full name for adults, initials/jersey for minors
  displayName: string;
  isMinor: boolean;
  sport: Sport;
  level: PlayerLevel;
  position: Position;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
  };
  number?: number;
  height?: string;
  weight?: number;
  birthDate?: string; // ISO date, redacted for minors
  hometown?: string;
  college?: string;
  highSchool?: string;
  imageUrl?: string;
  stats: PlayerStats;
  lastUpdated: string;
}

export interface PlayerComparison {
  id: string;
  playerIds: [string, string];
  createdAt: string;
}

export interface PlayerSearchFilters {
  query: string;
  sport: Sport | 'all';
  level: PlayerLevel | 'all';
  position: Position | 'all';
  team?: string;
}

interface PlayerState {
  // Data
  players: Map<string, Player>;
  recentSearches: string[];
  watchlist: string[]; // Player IDs
  comparisons: PlayerComparison[];

  // Search
  searchFilters: PlayerSearchFilters;
  searchResults: Player[];

  // Selected
  selectedPlayer: Player | null;
  comparisonPlayers: [Player | null, Player | null];

  // Loading states
  isSearching: boolean;
  isLoadingProfile: boolean;
  error: string | null;

  // Actions - Data
  setPlayer: (player: Player) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;

  // Actions - Search
  setSearchFilters: (filters: Partial<PlayerSearchFilters>) => void;
  setSearchResults: (results: Player[]) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Actions - Selection
  selectPlayer: (player: Player | null) => void;
  setComparisonPlayer: (index: 0 | 1, player: Player | null) => void;
  swapComparisonPlayers: () => void;
  clearComparison: () => void;

  // Actions - Watchlist
  addToWatchlist: (playerId: string) => void;
  removeFromWatchlist: (playerId: string) => void;
  toggleWatchlist: (playerId: string) => void;
  isInWatchlist: (playerId: string) => boolean;

  // Actions - Comparisons
  saveComparison: () => void;
  loadComparison: (comparison: PlayerComparison) => void;
  deleteComparison: (comparisonId: string) => void;

  // Loading
  setSearching: (searching: boolean) => void;
  setLoadingProfile: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getPlayer: (playerId: string) => Player | undefined;
  getWatchlistPlayers: () => Player[];
  getPlayersByTeam: (teamId: string) => Player[];
}

const defaultSearchFilters: PlayerSearchFilters = {
  query: '',
  sport: 'all',
  level: 'all',
  position: 'all',
};

export const usePlayerStore = create<PlayerState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        players: new Map(),
        recentSearches: [],
        watchlist: [],
        comparisons: [],
        searchFilters: defaultSearchFilters,
        searchResults: [],
        selectedPlayer: null,
        comparisonPlayers: [null, null],
        isSearching: false,
        isLoadingProfile: false,
        error: null,

        // Data actions
        setPlayer: (player) =>
          set(
            (state) => {
              const newPlayers = new Map(state.players);
              newPlayers.set(player.id, player);
              return { players: newPlayers };
            },
            false,
            'setPlayer'
          ),

        setPlayers: (players) =>
          set(
            (state) => {
              const newPlayers = new Map(state.players);
              players.forEach((p) => newPlayers.set(p.id, p));
              return { players: newPlayers };
            },
            false,
            'setPlayers'
          ),

        updatePlayer: (playerId, updates) =>
          set(
            (state) => {
              const player = state.players.get(playerId);
              if (!player) return state;

              const newPlayers = new Map(state.players);
              newPlayers.set(playerId, {
                ...player,
                ...updates,
                lastUpdated: new Date().toISOString(),
              });

              return {
                players: newPlayers,
                selectedPlayer:
                  state.selectedPlayer?.id === playerId
                    ? { ...state.selectedPlayer, ...updates }
                    : state.selectedPlayer,
              };
            },
            false,
            'updatePlayer'
          ),

        removePlayer: (playerId) =>
          set(
            (state) => {
              const newPlayers = new Map(state.players);
              newPlayers.delete(playerId);
              return {
                players: newPlayers,
                selectedPlayer: state.selectedPlayer?.id === playerId ? null : state.selectedPlayer,
                watchlist: state.watchlist.filter((id) => id !== playerId),
              };
            },
            false,
            'removePlayer'
          ),

        // Search actions
        setSearchFilters: (filters) =>
          set(
            (state) => ({ searchFilters: { ...state.searchFilters, ...filters } }),
            false,
            'setSearchFilters'
          ),

        setSearchResults: (results) => set({ searchResults: results }, false, 'setSearchResults'),

        addRecentSearch: (query) =>
          set(
            (state) => ({
              recentSearches: [query, ...state.recentSearches.filter((q) => q !== query)].slice(
                0,
                10
              ),
            }),
            false,
            'addRecentSearch'
          ),

        clearRecentSearches: () => set({ recentSearches: [] }, false, 'clearRecentSearches'),

        // Selection actions
        selectPlayer: (player) => set({ selectedPlayer: player }, false, 'selectPlayer'),

        setComparisonPlayer: (index, player) =>
          set(
            (state) => {
              const newComparison = [...state.comparisonPlayers] as [Player | null, Player | null];
              newComparison[index] = player;
              return { comparisonPlayers: newComparison };
            },
            false,
            'setComparisonPlayer'
          ),

        swapComparisonPlayers: () =>
          set(
            (state) => ({
              comparisonPlayers: [state.comparisonPlayers[1], state.comparisonPlayers[0]],
            }),
            false,
            'swapComparisonPlayers'
          ),

        clearComparison: () => set({ comparisonPlayers: [null, null] }, false, 'clearComparison'),

        // Watchlist actions
        addToWatchlist: (playerId) =>
          set(
            (state) => ({
              watchlist: state.watchlist.includes(playerId)
                ? state.watchlist
                : [...state.watchlist, playerId],
            }),
            false,
            'addToWatchlist'
          ),

        removeFromWatchlist: (playerId) =>
          set(
            (state) => ({
              watchlist: state.watchlist.filter((id) => id !== playerId),
            }),
            false,
            'removeFromWatchlist'
          ),

        toggleWatchlist: (playerId) =>
          set(
            (state) => ({
              watchlist: state.watchlist.includes(playerId)
                ? state.watchlist.filter((id) => id !== playerId)
                : [...state.watchlist, playerId],
            }),
            false,
            'toggleWatchlist'
          ),

        isInWatchlist: (playerId) => get().watchlist.includes(playerId),

        // Comparison management
        saveComparison: () =>
          set(
            (state) => {
              const [player1, player2] = state.comparisonPlayers;
              if (!player1 || !player2) return state;

              const comparison: PlayerComparison = {
                id: `${player1.id}-${player2.id}-${Date.now()}`,
                playerIds: [player1.id, player2.id],
                createdAt: new Date().toISOString(),
              };

              return {
                comparisons: [...state.comparisons, comparison].slice(-20), // Keep last 20
              };
            },
            false,
            'saveComparison'
          ),

        loadComparison: (comparison) => {
          const state = get();
          const player1 = state.players.get(comparison.playerIds[0]) || null;
          const player2 = state.players.get(comparison.playerIds[1]) || null;
          set({ comparisonPlayers: [player1, player2] }, false, 'loadComparison');
        },

        deleteComparison: (comparisonId) =>
          set(
            (state) => ({
              comparisons: state.comparisons.filter((c) => c.id !== comparisonId),
            }),
            false,
            'deleteComparison'
          ),

        // Loading actions
        setSearching: (isSearching) => set({ isSearching }, false, 'setSearching'),
        setLoadingProfile: (isLoadingProfile) =>
          set({ isLoadingProfile }, false, 'setLoadingProfile'),
        setError: (error) => set({ error }, false, 'setError'),

        // Selectors
        getPlayer: (playerId) => get().players.get(playerId),

        getWatchlistPlayers: () => {
          const { players, watchlist } = get();
          return watchlist.map((id) => players.get(id)).filter((p): p is Player => p !== undefined);
        },

        getPlayersByTeam: (teamId) => {
          const { players } = get();
          return Array.from(players.values()).filter((p) => p.team?.id === teamId);
        },
      }),
      {
        name: 'bsi-player-store',
        partialize: (state) => ({
          recentSearches: state.recentSearches,
          watchlist: state.watchlist,
          comparisons: state.comparisons,
        }),
        // Custom serializer for Map
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            return {
              ...data,
              state: {
                ...data.state,
                players: new Map(),
              },
            };
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    { name: 'PlayerStore' }
  )
);

export default usePlayerStore;
