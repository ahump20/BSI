/**
 * BSI React Hooks
 *
 * Centralized export for all custom React hooks.
 *
 * Hooks:
 * - useKeyboardShortcuts: Global keyboard shortcuts system
 * - useSportsData: Sports data fetching with caching
 * - useAnalytics: Analytics and metrics tracking
 */

// Keyboard shortcuts
export { useKeyboardShortcuts, DASHBOARD_SHORTCUTS, type Shortcut } from './useKeyboardShortcuts';

// Sports data hooks
export {
  useData,
  useLiveScores,
  useStandings,
  useRankings,
  useSchedule,
  useBoxScore,
  useOnlineStatus,
  useDebounce,
  usePrevious,
  // Game detail hooks
  useGameDetail,
  usePlayByPlay,
  useGameMedia,
  useHeadlines,
  type DataState,
  type FetchOptions,
  type PollingOptions,
  type GameDetailState,
} from './useSportsData';

// Analytics hooks
export {
  useAnalytics,
  useSportTracking,
  useFeatureTracking,
  usePerformanceTracking,
  useErrorTracking,
  useEngagementTracking,
  initializeAnalytics,
  type AnalyticsEvent,
  type UserProperties,
  type PerformanceMetrics,
} from './useAnalytics';

// Gesture hooks
export { useSwipeGesture, useSwipeRef } from './useSwipeGesture';

// Pitch tracking hooks
export { usePitchData, useAtBatPitches } from './usePitchData';

// User preferences hooks
export {
  useTeamPreferences,
  TEAMS,
  TEAMS_BY_LEAGUE,
  type Team,
  type League,
  type TeamPreferences,
} from './useTeamPreferences';

export {
  useUserSettings,
  type UserSettings,
  type DateFormat,
  type DateStyle,
  type Theme,
} from './useUserSettings';

// Authentication hooks
export {
  useAuth,
  withAuth,
  type AuthUser,
  type AuthSubscription,
  type AuthState,
  type UseAuthOptions,
} from './useAuth';

// Game data hooks
export {
  useGameData,
  type GameData,
  type TeamData,
  type GameStatus,
  type PlayData,
  type UseGameDataResult,
} from './useGameData';

// Player data hooks
export {
  usePlayerData,
  type PlayerData,
  type PlayerBio,
  type PlayerTeam,
  type PlayerStats,
  type UsePlayerDataResult,
} from './usePlayerData';

// Responsive hooks
export {
  useMediaQuery,
  useWindowSize,
  useBreakpoint,
  useMobile,
  useIsTouchDevice,
  usePrefersReducedMotion,
  useOrientation,
  isClient,
  getInitialMobileState,
  getInitialBreakpoint,
  BREAKPOINTS,
  MEDIA_QUERIES,
  type Breakpoint,
  type WindowSize,
  type Orientation,
} from './useResponsive';
