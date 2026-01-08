/**
 * BLAZE SPORTS INTEL - User Settings Hook
 *
 * Unified React hook for managing all user preferences:
 * - Timezone detection and selection
 * - Date/time format preferences
 * - Dashboard layout preferences
 *
 * Uses localStorage for persistence with SSR safety.
 * Integrates with useTeamPreferences for team-related settings.
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BSI_TIMEZONE,
  detectUserTimezone,
  isValidTimezone,
  formatInTimezone,
  formatGameTime,
  formatTimeInTimezone,
  formatDateInTimezone,
  getRelativeTime,
  type FormatOptions,
} from '@/lib/utils/timezone';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DateFormat = '12h' | '24h';
export type DateStyle = 'short' | 'medium' | 'long';
export type Theme = 'dark' | 'light' | 'system';

export interface UserSettings {
  /** User's preferred timezone (IANA format) */
  timezone: string;
  /** Auto-detected timezone (for comparison) */
  detectedTimezone: string | null;
  /** Whether to use auto-detected timezone */
  useAutoTimezone: boolean;
  /** 12-hour or 24-hour time format */
  timeFormat: DateFormat;
  /** Date display style preference */
  dateStyle: DateStyle;
  /** Show relative times (e.g., "in 2 hours") */
  showRelativeTime: boolean;
  /** Theme preference */
  theme: Theme;
  /** Last updated timestamp */
  lastUpdated: string | null;
}

const STORAGE_KEY = 'bsi_user_settings';

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultSettings: UserSettings = {
  timezone: BSI_TIMEZONE, // Default to BSI's canonical timezone
  detectedTimezone: null,
  useAutoTimezone: true,
  timeFormat: '12h',
  dateStyle: 'medium',
  showRelativeTime: true,
  theme: 'dark',
  lastUpdated: null,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing user settings
 *
 * @example
 * const { settings, setTimezone, formatDate, formatTime } = useUserSettings();
 *
 * // Format a game time in user's timezone
 * const displayTime = formatTime('2025-01-07T19:05:00');
 * // => "7:05 PM CT" (if user is in Central)
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  // Load from localStorage and detect timezone on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Detect user's timezone
      const detected = detectUserTimezone();

      // Load stored settings
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          detectedTimezone: detected,
          // If using auto timezone, update to current detected
          timezone: parsed.useAutoTimezone !== false ? detected : (parsed.timezone ?? BSI_TIMEZONE),
        }));
      } else {
        // First visit - use detected timezone
        setSettings((prev) => ({
          ...prev,
          timezone: detected,
          detectedTimezone: detected,
          useAutoTimezone: true,
        }));
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }, [settings, isLoaded]);

  // ========================================================================
  // SETTERS
  // ========================================================================

  /**
   * Set timezone manually (disables auto-detection)
   */
  const setTimezone = useCallback((tz: string) => {
    if (!isValidTimezone(tz)) {
      console.warn(`Invalid timezone: ${tz}`);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      timezone: tz,
      useAutoTimezone: false,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Enable auto-timezone detection
   */
  const enableAutoTimezone = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      timezone: prev.detectedTimezone ?? BSI_TIMEZONE,
      useAutoTimezone: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Set time format (12h or 24h)
   */
  const setTimeFormat = useCallback((format: DateFormat) => {
    setSettings((prev) => ({
      ...prev,
      timeFormat: format,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Set date style preference
   */
  const setDateStyle = useCallback((style: DateStyle) => {
    setSettings((prev) => ({
      ...prev,
      dateStyle: style,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Toggle relative time display
   */
  const setShowRelativeTime = useCallback((show: boolean) => {
    setSettings((prev) => ({
      ...prev,
      showRelativeTime: show,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Set theme preference
   */
  const setTheme = useCallback((theme: Theme) => {
    setSettings((prev) => ({
      ...prev,
      theme,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(() => {
    const detected = typeof window !== 'undefined' ? detectUserTimezone() : BSI_TIMEZONE;
    setSettings({
      ...defaultSettings,
      timezone: detected,
      detectedTimezone: detected,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ========================================================================
  // FORMATTERS (bound to user's timezone)
  // ========================================================================

  /**
   * Format a date/time in user's timezone
   */
  const formatDateTime = useCallback(
    (input: string | Date, options?: Omit<FormatOptions, 'timezone'>) => {
      return formatInTimezone(input, { ...options, timezone: settings.timezone });
    },
    [settings.timezone]
  );

  /**
   * Format just the time in user's timezone
   */
  const formatTime = useCallback(
    (input: string | Date, includeTimezone: boolean = true) => {
      return formatTimeInTimezone(input, settings.timezone, includeTimezone);
    },
    [settings.timezone]
  );

  /**
   * Format just the date in user's timezone
   */
  const formatDate = useCallback(
    (input: string | Date, format?: FormatOptions['format']) => {
      return formatDateInTimezone(input, settings.timezone, format ?? settings.dateStyle);
    },
    [settings.timezone, settings.dateStyle]
  );

  /**
   * Format a game time (optimized for sports display)
   */
  const formatGame = useCallback(
    (input: string | Date) => {
      return formatGameTime(input, settings.timezone);
    },
    [settings.timezone]
  );

  /**
   * Get relative time string (e.g., "in 2 hours")
   */
  const getRelative = useCallback(
    (input: string | Date) => {
      if (!settings.showRelativeTime) {
        return formatTime(input);
      }
      return getRelativeTime(input, settings.timezone);
    },
    [settings.timezone, settings.showRelativeTime, formatTime]
  );

  // ========================================================================
  // MEMOIZED VALUES
  // ========================================================================

  /**
   * Whether user's detected timezone differs from BSI default
   */
  const isNonCentralTimezone = useMemo(() => {
    return settings.detectedTimezone !== BSI_TIMEZONE && settings.detectedTimezone !== null;
  }, [settings.detectedTimezone]);

  /**
   * Current effective timezone (for display purposes)
   */
  const effectiveTimezone = settings.timezone;

  return {
    // State
    settings,
    isLoaded,
    effectiveTimezone,
    isNonCentralTimezone,

    // Setters
    setTimezone,
    enableAutoTimezone,
    setTimeFormat,
    setDateStyle,
    setShowRelativeTime,
    setTheme,
    resetSettings,

    // Formatters
    formatDateTime,
    formatTime,
    formatDate,
    formatGame,
    getRelative,
  };
}

export default useUserSettings;
