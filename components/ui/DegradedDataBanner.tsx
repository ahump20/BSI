'use client';

interface DegradedDataBannerProps {
  degraded: boolean;
  source?: string;
}

/**
 * Amber warning banner shown when an upstream data source reports degraded/stale data.
 * Renders nothing when `degraded` is false.
 */
export function DegradedDataBanner({ degraded, source }: DegradedDataBannerProps) {
  if (!degraded) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-sm border"
      style={{
        background: 'rgba(245, 158, 11, 0.06)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: 'var(--bsi-warning, #F59E0B)' }}
      />
      <p className="text-sm" style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-warning, #F59E0B)' }}>
        <span className="font-oswald uppercase text-xs tracking-wider font-medium">
          Degraded
        </span>
        {' \u2014 '}
        <span className="font-cormorant">
          Showing basic data — detailed stats updating shortly{source ? ` (${source})` : ''}
        </span>
      </p>
    </div>
  );
}
