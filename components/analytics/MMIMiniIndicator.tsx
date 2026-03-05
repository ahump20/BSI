'use client';

interface MMIMiniIndicatorProps {
  /** MMI value from -100 to +100 */
  value: number;
  /** Show team abbreviation being favored */
  favoredTeam?: string;
  className?: string;
}

/**
 * MMIMiniIndicator — tiny inline momentum arrow + value for score cards.
 *
 * An arrow pointing in the direction of momentum, colored by intensity.
 * Designed to fit inline next to a score without demanding attention
 * unless the momentum is extreme.
 */
export function MMIMiniIndicator({ value, favoredTeam, className = '' }: MMIMiniIndicatorProps) {
  const abs = Math.abs(value);
  const isNeutral = abs <= 10;
  const isHome = value > 0;

  // Intensity scales with magnitude
  let color: string;
  let arrow: string;

  if (isNeutral) {
    color = 'rgba(255,255,255,0.2)';
    arrow = '\u2194'; // ↔
  } else if (abs >= 75) {
    color = isHome ? 'var(--bsi-accent)' : '#6B8DB2';
    arrow = isHome ? '\u25B6\u25B6' : '\u25C0\u25C0'; // ▶▶ or ◀◀
  } else if (abs >= 40) {
    color = isHome ? 'var(--bsi-primary)' : '#6B8DB2';
    arrow = isHome ? '\u25B6' : '\u25C0'; // ▶ or ◀
  } else {
    color = isHome ? 'color-mix(in srgb, var(--bsi-primary) 60%, transparent)' : 'rgba(107,141,178,0.6)';
    arrow = isHome ? '\u25B8' : '\u25C2'; // ▸ or ◂
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono tabular-nums ${className}`}
      style={{ color }}
      title={`MMI: ${value > 0 ? '+' : ''}${value.toFixed(1)}${favoredTeam ? ` (${favoredTeam})` : ''}`}
    >
      <span className="leading-none">{arrow}</span>
      <span className="font-bold">{abs.toFixed(0)}</span>
    </span>
  );
}
