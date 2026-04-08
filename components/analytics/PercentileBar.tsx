'use client';

interface PercentileBarProps {
  /** Percentile value 0-100 */
  value: number;
  /** Stat label */
  label: string;
  /** Raw stat value to display */
  statValue?: string;
  /** Whether higher is better (true for batting, false for ERA-like stats) */
  higherIsBetter?: boolean;
  /** Show numeric value */
  showValue?: boolean;
  className?: string;
}

/**
 * 6-tier percentile color scale matching Baseball Savant conventions.
 * Red = elite, indigo = poor. When higherIsBetter is false, the scale inverts.
 */
export function getPercentileColor(pct: number, higherIsBetter = true): string {
  const effective = higherIsBetter ? pct : 100 - pct;

  if (effective >= 90) return '#ef4444'; // Red — elite
  if (effective >= 75) return '#f97316'; // Orange — great
  if (effective >= 60) return '#eab308'; // Yellow — above average
  if (effective >= 40) return '#8890a4'; // Gray — average
  if (effective >= 25) return '#3b82f6'; // Blue — below average
  return '#6366f1';                      // Indigo — poor
}

/**
 * Savant-style percentile bar with metric label, stat value, bar, and percentile badge.
 * Layout: [LABEL] [BAR with value inside] [PERCENTILE PILL]
 */
export function PercentileBar({
  value,
  label,
  statValue,
  higherIsBetter = true,
  showValue = true,
  className = '',
}: PercentileBarProps) {
  const color = getPercentileColor(value, higherIsBetter);
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Metric label — left side */}
      <span className="text-[11px] text-[var(--svt-text-muted,_#C4B8A5)] font-mono w-16 text-right shrink-0 uppercase tracking-wide">
        {label}
      </span>

      {/* Bar track */}
      <div className="flex-1 h-[10px] rounded-full bg-[var(--svt-border,_rgba(140,98,57,0.12))] overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: color }}
        >
          {/* Stat value inside bar — right-aligned, only if bar is wide enough */}
          {statValue && pct > 25 && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-white/90 tabular-nums leading-none">
              {statValue}
            </span>
          )}
        </div>
        {/* Stat value outside bar if bar is narrow */}
        {statValue && pct <= 25 && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tabular-nums leading-none"
            style={{ left: `calc(${Math.max(3, pct)}% + 6px)`, color }}
          >
            {statValue}
          </span>
        )}
      </div>

      {/* Percentile badge pill */}
      {showValue && (
        <span
          className="text-[11px] font-mono font-bold tabular-nums w-9 text-center shrink-0 rounded-full py-0.5 text-white"
          style={{ backgroundColor: color }}
        >
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}
