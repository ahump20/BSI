'use client';

interface PercentileBarProps {
  /** Percentile value 0-100 */
  value: number;
  /** Stat label */
  label: string;
  /** Whether higher is better (true for batting, false for ERA-like stats) */
  higherIsBetter?: boolean;
  /** Show numeric value */
  showValue?: boolean;
  className?: string;
}

/**
 * Baseball Savant-style percentile bar.
 * Red-white-blue gradient: blue = poor, white = average, red = elite.
 * When higherIsBetter is false (e.g., ERA), the gradient inverts.
 */
export function getPercentileColor(pct: number, higherIsBetter: boolean): string {
  const effective = higherIsBetter ? pct : 100 - pct;

  if (effective >= 90) return '#c0392b'; // Deep red — elite
  if (effective >= 75) return '#e74c3c'; // Red — great
  if (effective >= 60) return '#d4775c'; // Salmon — above average
  if (effective >= 40) return '#aaaaaa'; // Gray — average
  if (effective >= 25) return '#5b9bd5'; // Light blue — below average
  if (effective >= 10) return '#2980b9'; // Blue — poor
  return '#1a5276';                      // Deep blue — very poor
}

export function PercentileBar({
  value,
  label,
  higherIsBetter = true,
  showValue = true,
  className = '',
}: PercentileBarProps) {
  const color = getPercentileColor(value, higherIsBetter);
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-[11px] text-white/40 font-mono w-16 text-right shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-[8px] rounded-full bg-white/[0.04] overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span
          className="text-xs font-mono font-bold tabular-nums w-8 text-right shrink-0"
          style={{ color }}
        >
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}
