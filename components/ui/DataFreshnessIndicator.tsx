'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface DataFreshnessIndicatorProps {
  /** Date of last data update. Defaults to now if omitted. */
  lastUpdated?: Date;
  /** Data source label (e.g. "ESPN") */
  source?: string;
  /** Auto-refresh interval in seconds — display only */
  refreshInterval?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return 'just now';

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
}

function getStatusColor(
  date: Date
): 'text-green-400' | 'text-yellow-400' | 'text-orange-400' {
  const now = new Date();
  const minutesAgo = Math.floor(
    (now.getTime() - date.getTime()) / 1000 / 60
  );

  if (minutesAgo < 5) return 'text-green-400';
  if (minutesAgo < 30) return 'text-yellow-400';
  return 'text-orange-400';
}

export function DataFreshnessIndicator({
  lastUpdated,
  source,
  refreshInterval,
  isRefreshing = false,
  onRefresh,
}: DataFreshnessIndicatorProps) {
  // Safe default — always a valid Date even during SSR prerender
  const safeDate = lastUpdated instanceof Date ? lastUpdated : new Date();

  const [timeAgo, setTimeAgo] = useState<string>(() => getTimeAgo(safeDate));
  const [statusColor, setStatusColor] = useState<string>(() =>
    getStatusColor(safeDate)
  );

  useEffect(() => {
    // Recalculate immediately on mount (fixes SSR hydration drift)
    setTimeAgo(getTimeAgo(safeDate));
    setStatusColor(getStatusColor(safeDate));

    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(safeDate));
      setStatusColor(getStatusColor(safeDate));
    }, 30000);

    return () => clearInterval(interval);
  }, [safeDate]);

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-white/60">
      <span className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span>
        {source ? `${source} data` : 'Data'} updated {timeAgo}
      </span>
      {refreshInterval && (
        <span className="text-white/30">· {refreshInterval}s refresh</span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-2 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
