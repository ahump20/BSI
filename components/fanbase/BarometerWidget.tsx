'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import type { FanbaseSentiment, SentimentTrend } from '../../lib/fanbase/types';

export interface BarometerWidgetProps {
  sentiment: FanbaseSentiment;
  trend?: SentimentTrend;
  schoolName?: string;
  primaryColor?: string;
  showVolatility?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Map sentiment value (-1 to 1) to temperature zone
 */
function getSentimentZone(value: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (value >= 0.6) {
    return {
      label: 'Hot',
      color: '#ef4444', // error red
      bgColor: 'bg-error/20',
      description: 'Extremely optimistic',
    };
  }
  if (value >= 0.3) {
    return {
      label: 'Warm',
      color: '#FF6B35', // ember
      bgColor: 'bg-ember/20',
      description: 'Positive sentiment',
    };
  }
  if (value >= 0) {
    return {
      label: 'Neutral',
      color: '#BF5700', // burnt-orange
      bgColor: 'bg-burnt-orange/20',
      description: 'Cautiously optimistic',
    };
  }
  if (value >= -0.3) {
    return {
      label: 'Cool',
      color: '#3b82f6', // info blue
      bgColor: 'bg-info/20',
      description: 'Concerned',
    };
  }
  return {
    label: 'Cold',
    color: '#6366f1', // indigo
    bgColor: 'bg-indigo-500/20',
    description: 'Pessimistic',
  };
}

function TrendIcon({ trend, className = '' }: { trend: SentimentTrend; className?: string }) {
  if (trend === 'rising') {
    return <TrendingUp className={`text-success ${className}`} />;
  }
  if (trend === 'falling') {
    return <TrendingDown className={`text-error ${className}`} />;
  }
  return <Minus className={`text-white/50 ${className}`} />;
}

/**
 * Vertical thermometer-style barometer.
 */
export function BarometerWidget({
  sentiment,
  trend,
  schoolName,
  primaryColor = '#BF5700',
  showVolatility = true,
  size = 'md',
  className = '',
}: BarometerWidgetProps) {
  const controls = useAnimation();
  const zone = getSentimentZone(sentiment.overall);

  // Normalize -1..1 to 0..100 for fill percentage
  const fillPercent = ((sentiment.overall + 1) / 2) * 100;

  // Pulse animation for volatile sentiment
  useEffect(() => {
    if (sentiment.volatility > 0.7) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    } else {
      controls.stop();
      controls.set({ scale: 1 });
    }
  }, [sentiment.volatility, controls]);

  const sizeConfig = {
    sm: { width: 60, height: 160, bulbSize: 40, tubeWidth: 20, fontSize: 'text-xs' },
    md: { width: 80, height: 200, bulbSize: 50, tubeWidth: 26, fontSize: 'text-sm' },
    lg: { width: 100, height: 260, bulbSize: 60, tubeWidth: 32, fontSize: 'text-base' },
  };

  const config = sizeConfig[size];
  const tubeHeight = config.height - config.bulbSize - 10;
  const fillHeight = (tubeHeight * fillPercent) / 100;

  return (
    <motion.div animate={controls} className={`flex flex-col items-center ${className}`}>
      {/* School name */}
      {schoolName && (
        <p className={`${config.fontSize} font-medium text-white/70 mb-3`}>{schoolName}</p>
      )}

      {/* Thermometer SVG */}
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="overflow-visible"
        >
          {/* Background tube */}
          <rect
            x={(config.width - config.tubeWidth) / 2}
            y={10}
            width={config.tubeWidth}
            height={tubeHeight}
            rx={config.tubeWidth / 2}
            fill="rgba(255,255,255,0.1)"
          />

          {/* Fill gradient definition */}
          <defs>
            <linearGradient
              id={`barometer-gradient-${schoolName || 'default'}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="25%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#BF5700" />
              <stop offset="75%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Fill tube (animated) */}
          <motion.rect
            x={(config.width - config.tubeWidth) / 2}
            y={10 + tubeHeight - fillHeight}
            width={config.tubeWidth}
            height={fillHeight}
            rx={config.tubeWidth / 2}
            fill={`url(#barometer-gradient-${schoolName || 'default'})`}
            initial={{ height: 0, y: 10 + tubeHeight }}
            animate={{ height: fillHeight, y: 10 + tubeHeight - fillHeight }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Bulb (base) */}
          <circle
            cx={config.width / 2}
            cy={config.height - config.bulbSize / 2}
            r={config.bulbSize / 2}
            fill="rgba(255,255,255,0.1)"
          />
          <motion.circle
            cx={config.width / 2}
            cy={config.height - config.bulbSize / 2}
            r={config.bulbSize / 2 - 4}
            fill={zone.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />

          {/* Temperature markers */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const y = 10 + tubeHeight - (tubeHeight * mark) / 100;
            return (
              <g key={mark}>
                <line
                  x1={(config.width - config.tubeWidth) / 2 - 8}
                  y1={y}
                  x2={(config.width - config.tubeWidth) / 2 - 2}
                  y2={y}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </svg>

        {/* Current value indicator */}
        <motion.div
          className="absolute right-0 flex items-center gap-1"
          style={{ top: 10 + tubeHeight - fillHeight - 8 }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
          <span className={`${config.fontSize} font-bold text-white`}>
            {sentiment.overall > 0 ? '+' : ''}
            {(sentiment.overall * 100).toFixed(0)}
          </span>
        </motion.div>
      </div>

      {/* Zone label */}
      <motion.div
        className={`mt-4 px-3 py-1.5 rounded-full ${zone.bgColor}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <span className={`${config.fontSize} font-medium`} style={{ color: zone.color }}>
          {zone.label}
        </span>
      </motion.div>

      {/* Description */}
      <p className={`${config.fontSize} text-white/50 mt-2 text-center`}>{zone.description}</p>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          <TrendIcon trend={trend} className="w-4 h-4" />
          <span className="text-xs text-white/50 capitalize">{trend}</span>
        </div>
      )}

      {/* Volatility indicator */}
      {showVolatility && sentiment.volatility > 0.5 && (
        <motion.div
          className="flex items-center gap-1 mt-2 px-2 py-1 bg-warning/10 rounded-full"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Flame className="w-3 h-3 text-warning" />
          <span className="text-xs text-warning">Volatile</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export interface BarometerCompactProps {
  value: number; // -1 to 1
  label?: string;
  color?: string;
  className?: string;
}

/**
 * Compact horizontal barometer for inline use.
 */
export function BarometerCompact({ value, label, color, className = '' }: BarometerCompactProps) {
  const zone = getSentimentZone(value);
  const fillPercent = ((value + 1) / 2) * 100;
  const displayColor = color || zone.color;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-white/70">{label}</span>
          <span className="font-medium" style={{ color: displayColor }}>
            {zone.label}
          </span>
        </div>
      )}
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(to right, #6366f1, #3b82f6, #BF5700, #FF6B35, #ef4444)',
          }}
        />
        {/* Fill indicator */}
        <motion.div
          className="absolute top-0 h-full rounded-full"
          style={{ backgroundColor: displayColor, left: 0 }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Current position marker */}
        <motion.div
          className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg"
          initial={{ left: 0 }}
          animate={{ left: `calc(${fillPercent}% - 2px)` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/40">
        <span>Cold</span>
        <span>Hot</span>
      </div>
    </div>
  );
}
