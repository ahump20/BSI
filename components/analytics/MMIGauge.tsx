'use client';

import { motion } from 'framer-motion';

interface MMIGaugeProps {
  /** Momentum value from -100 (away) to +100 (home) */
  value: number;
  /** Away team name */
  awayTeam: string;
  /** Home team name */
  homeTeam: string;
  /** Magnitude classification */
  magnitude?: 'low' | 'medium' | 'high' | 'extreme';
  /** Show numeric value */
  showValue?: boolean;
  /** Compact mode for inline use */
  compact?: boolean;
  className?: string;
}

function getMagnitudeConfig(mag: string): { label: string; color: string } {
  switch (mag) {
    case 'extreme': return { label: 'EXTREME', color: 'var(--bsi-accent)' };
    case 'high': return { label: 'HIGH', color: 'var(--bsi-primary)' };
    case 'medium': return { label: 'MEDIUM', color: 'rgba(255,255,255,0.6)' };
    default: return { label: 'LOW', color: 'rgba(255,255,255,0.3)' };
  }
}

/**
 * MMIGauge — horizontal momentum tug-of-war visualization.
 *
 * Left edge = full away momentum (-100). Center = neutral. Right edge = full home momentum (+100).
 * The indicator slides smoothly between positions. Color intensity follows magnitude.
 *
 * Framer Motion handles transitions so live updates during games feel fluid
 * rather than jumping between values.
 */
export function MMIGauge({
  value,
  awayTeam,
  homeTeam,
  magnitude = 'low',
  showValue = true,
  compact = false,
  className = '',
}: MMIGaugeProps) {
  // Normalize -100..100 to 0..100 for positioning
  const position = ((value + 100) / 200) * 100;
  const isAway = value < -10;
  const isHome = value > 10;
  const magConfig = getMagnitudeConfig(magnitude);

  // Color: away momentum = steel blue, neutral = white, home momentum = burnt orange
  const indicatorColor = isAway ? '#6B8DB2' : isHome ? 'var(--bsi-primary)' : 'rgba(255,255,255,0.5)';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-[10px] text-text-muted w-8 text-right truncate">{awayTeam}</span>
        <div className="flex-1 h-[6px] rounded-full bg-surface-light relative overflow-hidden min-w-[80px]">
          {/* Away fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-l-full"
            style={{ backgroundColor: '#6B8DB2' }}
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(0, 50 - position / 2 + 25)}%`, opacity: isAway ? 0.6 : 0.1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
          {/* Home fill */}
          <motion.div
            className="absolute inset-y-0 right-0 rounded-r-full"
            style={{ backgroundColor: 'var(--bsi-primary)' }}
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(0, position / 2 + 25 - 50 + 50 - 25)}%`, opacity: isHome ? 0.6 : 0.1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
          {/* Indicator dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: indicatorColor, boxShadow: `0 0 6px ${indicatorColor}` }}
            initial={{ left: '50%' }}
            animate={{ left: `${position}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>
        <span className="text-[10px] text-text-muted w-8 truncate">{homeTeam}</span>
      </div>
    );
  }

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display text-sm uppercase tracking-widest text-text-secondary">
          Momentum
        </h4>
        <div className="flex items-center gap-2">
          {showValue && (
            <span
              className="font-mono text-sm font-bold tabular-nums"
              style={{ color: indicatorColor }}
            >
              {value > 0 ? '+' : ''}{value.toFixed(1)}
            </span>
          )}
          <span
            className="text-[9px] uppercase tracking-wider font-display px-2 py-0.5 rounded-full"
            style={{ color: magConfig.color, backgroundColor: `${magConfig.color}15` }}
          >
            {magConfig.label}
          </span>
        </div>
      </div>

      {/* Team labels */}
      <div className="flex justify-between mb-2">
        <span className={`text-xs font-medium transition-colors ${isAway ? 'text-[#6B8DB2]' : 'text-text-muted'}`}>
          {awayTeam}
        </span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Neutral</span>
        <span className={`text-xs font-medium transition-colors ${isHome ? 'text-burnt-orange' : 'text-text-muted'}`}>
          {homeTeam}
        </span>
      </div>

      {/* Gauge track */}
      <div className="relative h-3 rounded-full bg-surface-light overflow-hidden">
        {/* Away half gradient */}
        <div
          className="absolute inset-y-0 left-0 w-1/2 rounded-l-full"
          style={{
            background: 'linear-gradient(to right, rgba(107,141,178,0.3), transparent)',
            opacity: isAway ? 1 : 0.2,
          }}
        />
        {/* Home half gradient */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 rounded-r-full"
          style={{
            background: 'linear-gradient(to left, color-mix(in srgb, var(--bsi-primary) 30%, transparent), transparent)',
            opacity: isHome ? 1 : 0.2,
          }}
        />
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-surface" />

        {/* Indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
          style={{
            backgroundColor: indicatorColor,
            borderColor: 'var(--bsi-midnight)',
            boxShadow: `0 0 10px ${indicatorColor}80`,
          }}
          initial={{ left: '50%', x: '-50%' }}
          animate={{ left: `${position}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-text-muted tabular-nums">-100</span>
        <span className="text-[9px] font-mono text-text-muted tabular-nums">0</span>
        <span className="text-[9px] font-mono text-text-muted tabular-nums">+100</span>
      </div>
    </div>
  );
}
