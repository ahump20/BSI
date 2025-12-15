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
