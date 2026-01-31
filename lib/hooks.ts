'use client';

import { useState, useEffect, useCallback } from 'react';

const TIMEZONE = 'America/Chicago';

interface UserSettings {
  formatDateTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
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

  return { formatDateTime, formatDate, formatTime, isLoaded };
}
