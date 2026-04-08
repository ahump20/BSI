'use client';

import type { NormalizedDataMeta } from '@/lib/utils/data-meta';
import { formatTimestamp } from '@/lib/utils/timezone';

interface DegradedNoticeProps {
  /** Normalized meta from useSportData — renders notice only when degraded is true */
  meta: NormalizedDataMeta | null;
  /** Optional label for the data section (e.g., "Standings", "Scores") */
  label?: string;
  /** Compact mode for inline sections */
  compact?: boolean;
}

/**
 * Subtle amber notice bar displayed when upstream data sources return
 * degraded responses (partial data, stale cache, provider issues).
 *
 * Trust signal — visitors should know when data might be unreliable.
 * Renders nothing when meta is null or meta.degraded is false.
 */
export function DegradedNotice({ meta, label, compact }: DegradedNoticeProps) {
  if (!meta?.degraded) return null;

  const timeStr = meta.lastUpdated ? formatTimestamp(meta.lastUpdated) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-sm`}
      style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
      }}
    >
      {/* Amber dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: '#F59E0B' }}
      />
      <p
        className="text-[10px] leading-tight font-mono"
        style={{ color: '#F59E0B' }}
      >
        {label ? `${label}: ` : ''}Data may be delayed
        {timeStr ? ` — last updated ${timeStr}` : ''}
      </p>
    </div>
  );
}
