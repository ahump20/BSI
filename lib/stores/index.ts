/**
 * BSI Stores - Unified State Management
 *
 * Central export for all Zustand stores
 * Usage:
 *   import { useGameStore, useThreeStore } from '@/lib/stores';
 *   const { games, selectGame } = useGameStore();
 */

// Store exports
export {
  useGameStore,
  type Game,
  type GameFilters,
  type Sport,
  type GameStatus,
} from './gameStore';
export {
  usePlayerStore,
  type Player,
  type PlayerStats,
  type Position,
  type PlayerLevel,
} from './playerStore';
export {
  useTeamStore,
  type Team,
  type TeamRecord,
  type Conference,
  type Division,
} from './teamStore';
export {
  useUIStore,
  type ThemeMode,
  type ModalConfig,
  type ToastConfig,
  type Preferences,
} from './uiStore';
export {
  useThreeStore,
  type PerformanceTier,
  type CameraMode,
  type ScenePhase,
  type EffectsConfig,
  type CameraState,
  type SceneConfig,
  type PerformanceMetrics,
} from './threeStore';

// Default exports for convenience
export { default as gameStore } from './gameStore';
export { default as playerStore } from './playerStore';
export { default as teamStore } from './teamStore';
export { default as uiStore } from './uiStore';
export { default as threeStore } from './threeStore';

/**
 * Combined store hook for components that need multiple stores
 * @example
 * const { games, activeScene, showToast } = useBSIStores();
 */
export function useBSIStores() {
  const game = useGameStore();
  const player = usePlayerStore();
  const team = useTeamStore();
  const ui = useUIStore();
  const three = useThreeStore();

  return {
    // Game
    games: game.games,
    selectedGame: game.selectedGame,
    favoriteTeamIds: game.favoriteTeams,
    gameFilters: game.filters,
    getLiveGames: game.getLiveGames,
    selectGame: game.selectGame,
    setGameFilters: game.setFilters,

    // Player
    players: player.players,
    selectedPlayer: player.selectedPlayer,
    watchlist: player.watchlist,
    searchResults: player.searchResults,
    selectPlayer: player.selectPlayer,
    isInWatchlist: player.isInWatchlist,
    toggleWatchlist: player.toggleWatchlist,

    // Team
    teams: team.teams,
    favoriteTeams: team.getFavoriteTeams,
    getStandings: team.getStandings,
    isFavorite: team.isFavorite,
    isOwnerFavorite: team.isOwnerFavorite,

    // UI
    theme: ui.preferences.theme,
    isMobile: ui.isMobile,
    isTablet: ui.isTablet,
    isDesktop: ui.isDesktop,
    modals: ui.modals,
    toasts: ui.toasts,
    showToast: ui.showToast,
    openModal: ui.openModal,
    closeModal: ui.closeModal,
    setTheme: ui.setTheme,
    preferences: ui.preferences,

    // Three
    activeScene: three.activeScene,
    scenePhase: three.scenePhase,
    performanceTier: three.performanceTier,
    camera: three.camera,
    effects: three.effects,
    isContextReady: three.isContextReady,
    setScenePhase: three.setScenePhase,
    setCameraMode: three.setCameraMode,
    flyTo: three.flyTo,
    applyEffectsPreset: three.applyEffectsPreset,
  };
}

/**
 * Reset all stores to initial state
 * Useful for logout or testing
 */
export function resetAllStores() {
  // Note: This only resets the stores, not localStorage
  // To fully reset, call localStorage.clear() first
  useGameStore.setState({
    games: [],
    selectedGame: null,
    isLoading: false,
    error: null,
  });

  usePlayerStore.setState({
    searchResults: [],
    selectedPlayer: null,
    comparisonPlayers: [null, null],
    isSearching: false,
    error: null,
  });

  useUIStore.setState({
    modals: [],
    toasts: [],
    isPageLoading: false,
    isMobileMenuOpen: false,
    isMobileBottomSheetOpen: false,
  });

  useThreeStore.setState({
    scenePhase: 'loading',
    isContextReady: false,
    contextLost: false,
  });
}

// Re-export the stores module
import { useGameStore } from './gameStore';
import { usePlayerStore } from './playerStore';
import { useTeamStore } from './teamStore';
import { useUIStore } from './uiStore';
import { useThreeStore } from './threeStore';
