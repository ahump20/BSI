'use client';

import React, { useEffect, useState } from 'react';

interface DataFreshnessIndicatorProps {
  timestamp: string | Date;
  className?: string;
  showIcon?: boolean;
  format?: 'relative' | 'absolute' | 'both';
}

type FreshnessLevel = 'fresh' | 'recent' | 'stale' | 'very-stale';

interface FreshnessConfig {
  level: FreshnessLevel;
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

/**
 * Data Freshness Indicator Component
 * Displays when data was last updated with color-coded staleness indicators
 *
 * Freshness Levels:
 * - Fresh: < 5 minutes (green)
 * - Recent: 5-60 minutes (blue)
 * - Stale: 1-4 hours (orange)
 * - Very Stale: > 4 hours (red)
 */
export function DataFreshnessIndicator({
  timestamp,
  className = '',
  showIcon = true,
  format = 'relative'
}: DataFreshnessIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [freshnessConfig, setFreshnessConfig] = useState<FreshnessConfig>(
    getFreshnessConfig(0)
  );

  useEffect(() => {
    const updateTimeAgo = () => {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      // Update time ago text
      setTimeAgo(formatTimeAgo(diffMinutes));

      // Update freshness level
      setFreshnessConfig(getFreshnessConfig(diffMinutes));
    };

    // Initial update
    updateTimeAgo();

    // Update every minute
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const absoluteTime = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${freshnessConfig.bgColor} ${freshnessConfig.color} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Data last updated ${timeAgo}`}
      title={`Last updated: ${absoluteTime} (${freshnessConfig.label})`}
    >
      {showIcon && (
        <span className="text-base" aria-hidden="true">
          {freshnessConfig.icon}
        </span>
      )}
      <span className="font-medium">
        {format === 'relative' && `Updated ${timeAgo}`}
        {format === 'absolute' && absoluteTime}
        {format === 'both' && (
          <>
            <span className="block">{timeAgo}</span>
            <span className="block text-xs opacity-75">{absoluteTime}</span>
          </>
        )}
      </span>
    </div>
  );
}

/**
 * Compact version for tight spaces (e.g., table headers)
 */
export function DataFreshnessCompact({
  timestamp,
  className = ''
}: Pick<DataFreshnessIndicatorProps, 'timestamp' | 'className'>) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  const config = getFreshnessConfig(diffMinutes);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${config.color} ${className}`}
      title={`Last updated: ${date.toLocaleString()}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{formatTimeAgo(diffMinutes)}</span>
    </span>
  );
}

/**
 * Badge-style indicator for minimal UI footprint
 */
export function DataFreshnessBadge({
  timestamp,
  className = ''
}: Pick<DataFreshnessIndicatorProps, 'timestamp' | 'className'>) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  const config = getFreshnessConfig(diffMinutes);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${config.bgColor} ${config.color} text-xs font-medium ${className}`}
      title={`Last updated: ${date.toLocaleString()}`}
    >
      <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
      <span>{formatTimeAgo(diffMinutes)}</span>
    </div>
  );
}

// Helper Functions

function getFreshnessConfig(diffMinutes: number): FreshnessConfig {
  if (diffMinutes < 5) {
    return {
      level: 'fresh',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: '✓',
      label: 'Fresh data'
    };
  } else if (diffMinutes < 60) {
    return {
      level: 'recent',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      icon: '●',
      label: 'Recent data'
    };
  } else if (diffMinutes < 240) {
    return {
      level: 'stale',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      icon: '◐',
      label: 'Data may be stale'
    };
  } else {
    return {
      level: 'very-stale',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      icon: '!',
      label: 'Stale data'
    };
  }
}

function formatTimeAgo(diffMinutes: number): string {
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes === 1) {
    return '1 minute ago';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffMinutes < 120) {
    return '1 hour ago';
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hours ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
}
