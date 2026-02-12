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
}

function getTimeAgo(date: Date): string {
  return getRelativeTime(date);
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
  // Stable defaults for SSR — defer date-dependent values to useEffect
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const [statusColor, setStatusColor] = useState<string>('text-green-400');
  const fallbackDate = useRef(new Date());

  useEffect(() => {
    const date = lastUpdated instanceof Date ? lastUpdated : fallbackDate.current;
    setTimeAgo(getTimeAgo(date));
    setStatusColor(getStatusColor(date));

    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(date));
      setStatusColor(getStatusColor(date));
    }, 30000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

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
