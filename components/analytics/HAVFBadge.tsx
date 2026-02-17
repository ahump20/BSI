'use client';

interface HAVFBadgeProps {
  /** Composite score 0-100 */
  score: number;
  /** Optional label (e.g., player name) */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreConfig(score: number): { color: string; bg: string; tier: string } {
  if (score >= 80) return { color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', tier: 'ELITE' };
  if (score >= 65) return { color: '#BF5700', bg: 'rgba(191,87,0,0.12)', tier: 'ABOVE AVG' };
  if (score >= 45) return { color: 'rgba(255,255,255,0.65)', bg: 'rgba(255,255,255,0.06)', tier: 'AVERAGE' };
  if (score >= 25) return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', tier: 'BELOW AVG' };
  return { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.03)', tier: 'POOR' };
}

const SIZE_CLASSES = {
  sm: { badge: 'text-xs px-2 py-0.5', score: 'text-xs' },
  md: { badge: 'text-sm px-3 py-1', score: 'text-sm' },
  lg: { badge: 'text-base px-4 py-1.5', score: 'text-lg' },
} as const;

/**
 * HAVFBadge — compact score indicator with color intensity tied to value.
 *
 * Low scores are dim and quiet. High scores glow. The visual weight
 * communicates the tier before you read the number.
 */
export function HAVFBadge({ score, label, size = 'md', className = '' }: HAVFBadgeProps) {
  const config = getScoreConfig(score);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold tabular-nums ${sizeClass.badge} ${className}`}
      style={{ color: config.color, backgroundColor: config.bg }}
      title={`HAV-F: ${score.toFixed(1)} (${config.tier})`}
    >
      <span className={sizeClass.score}>{score.toFixed(1)}</span>
      {label && (
        <span
          className="text-[9px] uppercase tracking-wider font-display"
          style={{ color: config.color, opacity: 0.7 }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
