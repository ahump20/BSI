'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils/timezone';

interface DataFreshnessIndicatorProps {
  /** Date of last data update. Defaults to now if omitted. */
  lastUpdated?: Date;
  /** Data source label (e.g. "ESPN") */
  source?: string;
  /** Auto-refresh interval in seconds — display only */
  refreshInterval?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  /** When true, shows "cached" badge and pulse animation */
  isCached?: boolean;
}

function getTimeAgo(date: Date): string {
  return getRelativeTime(date);
}

function getExactAge(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

function getStatusColor(
  date: Date,
  isCached: boolean
): 'bg-green-400' | 'bg-yellow-400' | 'bg-orange-400' | 'bg-red-400' {
  if (isCached) return 'bg-orange-400';
  const now = new Date();
  const minutesAgo = Math.floor(
    (now.getTime() - date.getTime()) / 1000 / 60
  );

  if (minutesAgo < 1) return 'bg-green-400';
  if (minutesAgo < 5) return 'bg-yellow-400';
  return 'bg-orange-400';
}

export function DataFreshnessIndicator({
  lastUpdated,
  source,
  refreshInterval,
  isRefreshing = false,
  onRefresh,
  isCached = false,
}: DataFreshnessIndicatorProps) {
  // Stable defaults for SSR — defer date-dependent values to useEffect
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const [exactAge, setExactAge] = useState<string>('0s ago');
  const [statusColor, setStatusColor] = useState<string>('bg-green-400');
  const fallbackDate = useRef(new Date());

  useEffect(() => {
    const date = lastUpdated instanceof Date ? lastUpdated : fallbackDate.current;

    const update = () => {
      setTimeAgo(getTimeAgo(date));
      setExactAge(getExactAge(date));
      setStatusColor(getStatusColor(date, isCached));
    };

    update();
    // Tick every 10s for tighter freshness feedback
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [lastUpdated, isCached]);

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
      <span
        className={`w-2 h-2 rounded-full ${statusColor} ${isCached ? 'animate-pulse' : ''}`}
        title={exactAge}
      />
      <span>
        {source ? `${source} data` : 'Data'} updated {timeAgo}
      </span>
      {isCached && (
        <span className="text-orange-400/80 font-medium">· cached</span>
      )}
      {refreshInterval && !isCached && (
        <span className="text-text-muted">· {refreshInterval}s refresh</span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-2 p-1 hover:bg-surface rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh data"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
