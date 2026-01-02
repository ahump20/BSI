'use client';

interface CitationFooterProps {
  /** Data source name (e.g., "ESPN", "Baseball-Reference") */
  source: string;
  /** ISO timestamp when data was fetched */
  fetchedAt: string;
  /** Timezone abbreviation (defaults to CT for Central Time) */
  timezone?: string;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * CitationFooter - Required data attribution on all sports data views
 *
 * BSI policy: Every data view must cite its source with timestamp.
 * This builds credibility and helps users understand data freshness.
 */
export function CitationFooter({
  source,
  fetchedAt,
  timezone = 'CT',
  className = '',
}: CitationFooterProps) {
  const formatted = new Date(fetchedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });

  const time = new Date(fetchedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });

  return (
    <footer
      className={`p-4 text-center text-[11px] text-gray-500 border-t border-gray-700 ${className}`.trim()}
    >
      Data: {source} | {formatted} {time} {timezone}
    </footer>
  );
}

export default CitationFooter;
