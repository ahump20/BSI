/**
 * BLAZE SPORTS INTEL - Analytics Hooks
 *
 * React hooks for analytics tracking and metrics.
 * Integrates with Amplitude, Sentry, and Cloudflare Analytics Engine.
 *
 * Features:
 * - User action tracking
 * - Performance monitoring
 * - Error tracking
 * - Feature usage analytics
 *
 * Last Updated: 2025-11-29
 */

import { useCallback, useEffect, useRef } from 'react';
import type { UnifiedSportKey } from '../types/adapters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

export interface UserProperties {
  userId?: string;
  tier?: 'free' | 'basic' | 'diamond_pro';
  favoriteSport?: UnifiedSportKey;
  favoriteTeam?: string;
}

export interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  apiLatency?: number;
  cacheHitRate?: number;
}

export type AnalyticsProvider = 'amplitude' | 'sentry' | 'cloudflare' | 'console';

// ============================================================================
// ANALYTICS CONTEXT (simplified for hooks)
// ============================================================================

const analyticsQueue: AnalyticsEvent[] = [];
let userProps: UserProperties = {};
let isInitialized = false;

// ============================================================================
// CORE ANALYTICS HOOK
// ============================================================================

/**
 * Main analytics hook for tracking events
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          timestamp: Date.now(),
          userTier: userProps.tier,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        },
        timestamp: Date.now(),
      };

      // Add to queue
      analyticsQueue.push(event);

      // Send to analytics providers
      sendToProviders(event);

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventName, properties);
      }
    },
    []
  );

  const setUserProperties = useCallback((props: UserProperties) => {
    userProps = { ...userProps, ...props };

    // Update analytics providers
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.setUserProperties(props);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    trackEvent('page_view', {
      page: pageName,
      ...properties,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    setUserProperties,
    trackPageView,
    isInitialized,
  };
}

// ============================================================================
// SPORT-SPECIFIC TRACKING HOOKS
// ============================================================================

/**
 * Track sport selection and navigation
 */
export function useSportTracking() {
  const { trackEvent } = useAnalytics();

  const trackSportSelect = useCallback(
    (sport: UnifiedSportKey, source: 'nav' | 'tabs' | 'search' | 'direct') => {
      trackEvent('sport_selected', {
        sport,
        source,
      });
    },
    [trackEvent]
  );

  const trackTeamView = useCallback(
    (teamId: string, teamName: string, sport: UnifiedSportKey) => {
      trackEvent('team_viewed', {
        teamId,
        teamName,
        sport,
      });
    },
    [trackEvent]
  );

  const trackGameView = useCallback(
    (gameId: string, sport: UnifiedSportKey, status: string) => {
      trackEvent('game_viewed', {
        gameId,
        sport,
        status,
      });
    },
    [trackEvent]
  );

  const trackBoxScoreView = useCallback(
    (gameId: string, sport: UnifiedSportKey) => {
      trackEvent('boxscore_viewed', {
        gameId,
        sport,
      });
    },
    [trackEvent]
  );

  return {
    trackSportSelect,
    trackTeamView,
    trackGameView,
    trackBoxScoreView,
  };
}

/**
 * Track feature usage
 */
export function useFeatureTracking() {
  const { trackEvent } = useAnalytics();

  const trackFeatureUse = useCallback(
    (
      feature: string,
      properties?: Record<string, unknown>
    ) => {
      trackEvent('feature_used', {
        feature,
        ...properties,
      });
    },
    [trackEvent]
  );

  const trackFilterApply = useCallback(
    (filterType: string, filterValue: string | string[]) => {
      trackEvent('filter_applied', {
        filterType,
        filterValue,
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      trackEvent('search_performed', {
        query,
        resultCount,
      });
    },
    [trackEvent]
  );

  const trackExport = useCallback(
    (format: 'csv' | 'json' | 'pdf', dataType: string) => {
      trackEvent('data_exported', {
        format,
        dataType,
      });
    },
    [trackEvent]
  );

  return {
    trackFeatureUse,
    trackFilterApply,
    trackSearch,
    trackExport,
  };
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Track performance metrics
 */
export function usePerformanceTracking() {
  const { trackEvent } = useAnalytics();
  const metricsRef = useRef<PerformanceMetrics>({});

  const trackLoadTime = useCallback(
    (componentName: string, loadTimeMs: number) => {
      metricsRef.current.loadTime = loadTimeMs;
      trackEvent('component_load', {
        component: componentName,
        loadTimeMs,
        slow: loadTimeMs > 1000,
      });
    },
    [trackEvent]
  );

  const trackApiLatency = useCallback(
    (endpoint: string, latencyMs: number, success: boolean) => {
      metricsRef.current.apiLatency = latencyMs;
      trackEvent('api_request', {
        endpoint,
        latencyMs,
        success,
        slow: latencyMs > 2000,
      });
    },
    [trackEvent]
  );

  const trackCacheMetrics = useCallback(
    (hitRate: number, tier: 'kv' | 'r2' | 'd1' | 'memory') => {
      metricsRef.current.cacheHitRate = hitRate;
      trackEvent('cache_performance', {
        hitRate,
        tier,
      });
    },
    [trackEvent]
  );

  const reportWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigation) {
      trackEvent('web_vitals', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadComplete: navigation.loadEventEnd - navigation.startTime,
        firstByte: navigation.responseStart - navigation.startTime,
        transferSize: navigation.transferSize,
      });
    }
  }, [trackEvent]);

  // Report web vitals on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', reportWebVitals);
      return () => window.removeEventListener('load', reportWebVitals);
    }
  }, [reportWebVitals]);

  return {
    trackLoadTime,
    trackApiLatency,
    trackCacheMetrics,
    reportWebVitals,
    metrics: metricsRef.current,
  };
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track errors and exceptions
 */
export function useErrorTracking() {
  const { trackEvent } = useAnalytics();

  const trackError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      trackEvent('error_occurred', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500),
        ...context,
      });

      // Send to Sentry if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          extra: context,
        });
      }
    },
    [trackEvent]
  );

  const trackApiError = useCallback(
    (endpoint: string, statusCode: number, errorMessage: string) => {
      trackEvent('api_error', {
        endpoint,
        statusCode,
        errorMessage,
      });
    },
    [trackEvent]
  );

  // Global error handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { type: 'unhandled_promise_rejection' }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  return {
    trackError,
    trackApiError,
  };
}

// ============================================================================
// USER ENGAGEMENT TRACKING
// ============================================================================

/**
 * Track user engagement metrics
 */
export function useEngagementTracking() {
  const { trackEvent } = useAnalytics();
  const sessionStartRef = useRef(Date.now());
  const interactionCountRef = useRef(0);

  const trackInteraction = useCallback(
    (interactionType: string, target?: string) => {
      interactionCountRef.current++;
      trackEvent('user_interaction', {
        type: interactionType,
        target,
        sessionDuration: Date.now() - sessionStartRef.current,
        interactionCount: interactionCountRef.current,
      });
    },
    [trackEvent]
  );

  const trackSessionEnd = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartRef.current;
    trackEvent('session_end', {
      duration: sessionDuration,
      totalInteractions: interactionCountRef.current,
    });
  }, [trackEvent]);

  // Track session end on page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', trackSessionEnd);
    return () => window.removeEventListener('beforeunload', trackSessionEnd);
  }, [trackSessionEnd]);

  return {
    trackInteraction,
    sessionDuration: Date.now() - sessionStartRef.current,
    interactionCount: interactionCountRef.current,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendToProviders(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Amplitude
  if ((window as any).amplitude) {
    (window as any).amplitude.track(event.name, event.properties);
  }

  // Cloudflare Analytics (via beacon)
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon(
        '/api/analytics/event',
        JSON.stringify(event)
      );
    } catch {
      // Silently fail
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize analytics on app start
 */
export function initializeAnalytics(config?: {
  amplitudeKey?: string;
  sentryDsn?: string;
  userId?: string;
}): void {
  if (isInitialized) return;

  if (config?.userId) {
    userProps.userId = config.userId;
  }

  // Initialize Amplitude
  if (config?.amplitudeKey && typeof window !== 'undefined') {
    // Amplitude initialization would go here
  }

  // Initialize Sentry
  if (config?.sentryDsn && typeof window !== 'undefined') {
    // Sentry initialization would go here
  }

  isInitialized = true;
}
