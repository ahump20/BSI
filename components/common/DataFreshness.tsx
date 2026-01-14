/**
 * Data freshness indicator component
 * Shows when data was last updated and if it's stale
 * 
 * Complements useAutoRefresh hook for visual feedback
 */

export interface DataFreshnessProps {
  /** Timestamp of last data update */
  lastUpdated: Date | null;
  /** Whether data is considered stale */
  isStale?: boolean;
  /** Whether data is currently refreshing */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

export function DataFreshness({
  lastUpdated,
  isStale = false,
  isLoading = false,
  className = '',
}: DataFreshnessProps): JSX.Element | null {
  if (!lastUpdated) return null;

  const timeAgo = formatDistanceToNow(lastUpdated);
  const statusColor = isStale ? 'text-yellow-500' : 'text-green-500';
  const statusText = isStale ? 'Stale data' : 'Live';

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isStale ? 'bg-yellow-500' : 'bg-green-500'
          } ${isLoading ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        <span className={statusColor} aria-label={`Status: ${statusText}`}>
          {statusText}
        </span>
      </div>
      <span className="text-gray-500" aria-label={`Last updated ${timeAgo}`}>
        Updated {timeAgo}
      </span>
    </div>
  );
}

/** Lightweight date formatting utility */
function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
