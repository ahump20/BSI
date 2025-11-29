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
export {
  useKeyboardShortcuts,
  DASHBOARD_SHORTCUTS,
  type Shortcut,
} from './useKeyboardShortcuts';

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
  type DataState,
  type FetchOptions,
  type PollingOptions,
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
