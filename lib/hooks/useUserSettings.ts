'use client';

import { useState, useEffect, useCallback } from 'react';

const TIMEZONE = 'America/Chicago';

interface SettingsState {
  theme: 'dark' | 'light';
  timeFormat: '12h' | '24h';
  timezone: string;
}

interface UserSettings {
  formatDateTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatGame: (startTime: string) => string;
  settings: SettingsState;
  resetSettings: () => void;
  isLoaded: boolean;
}

export function useUserSettings(): UserSettings {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formatDateTime = useCallback((date: Date): string => {
    return (
      date.toLocaleString('en-US', {
        timeZone: TIMEZONE,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const formatTime = useCallback((date: Date): string => {
    return (
      date.toLocaleTimeString('en-US', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  }, []);

  const settings: SettingsState = { theme: 'dark', timeFormat: '12h', timezone: TIMEZONE };
  const resetSettings = useCallback(() => {
    // Settings are currently hardcoded defaults; reset is a no-op
  }, []);

  const formatGame = useCallback((startTime: string): string => {
    return formatTime(new Date(startTime));
  }, [formatTime]);

  return { formatDateTime, formatDate, formatTime, formatGame, settings, resetSettings, isLoaded };
}
