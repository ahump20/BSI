'use client';

import { useState } from 'react';

interface Pitch {
  id: string;
  pitchNumber: number;
  type: string;
  speed: number;
  spinRate?: number;
  result: string;
  zone?: number;
  breakAngle?: number;
  breakLength?: number;
}

interface PitchListProps {
  pitches: Pitch[];
  selectedPitchId?: string;
  onPitchSelect?: (pitchId: string) => void;
  /** Show advanced metrics */
  showAdvanced?: boolean;
}

// Pitch type abbreviations
const PITCH_ABBREV: Record<string, string> = {
  'Four-Seam Fastball': 'FF',
  Fastball: 'FB',
  Sinker: 'SI',
  Cutter: 'FC',
  Slider: 'SL',
  Curveball: 'CU',
  Changeup: 'CH',
  Splitter: 'FS',
  'Knuckle Curve': 'KC',
  Sweeper: 'ST',
  Knuckleball: 'KN',
};

// Pitch type colors (matching StrikeZone)
const PITCH_COLORS: Record<string, string> = {
  'Four-Seam Fastball': 'bg-red-500',
  Fastball: 'bg-red-500',
  FF: 'bg-red-500',
  Sinker: 'bg-orange-500',
  SI: 'bg-orange-500',
  Cutter: 'bg-orange-400',
  FC: 'bg-orange-400',
  Slider: 'bg-yellow-500',
  SL: 'bg-yellow-500',
  Curveball: 'bg-green-500',
  CU: 'bg-green-500',
  Changeup: 'bg-blue-500',
  CH: 'bg-blue-500',
  Splitter: 'bg-purple-500',
  FS: 'bg-purple-500',
  'Knuckle Curve': 'bg-cyan-500',
  KC: 'bg-cyan-500',
  Sweeper: 'bg-pink-500',
  ST: 'bg-pink-500',
};

// Result styling
const RESULT_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  ball: { bg: 'bg-white/10', text: 'text-white/60', label: 'Ball' },
  called_strike: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Called' },
  swinging_strike: { bg: 'bg-red-600/20', text: 'text-red-500', label: 'Swing' },
  foul: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Foul' },
  hit_into_play: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'In Play' },
  hit_by_pitch: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'HBP' },
};

export function PitchList({
  pitches,
  selectedPitchId,
  onPitchSelect,
  showAdvanced = false,
}: PitchListProps) {
  const [hoveredPitch, setHoveredPitch] = useState<string | null>(null);

  // Get result category
  const getResultCategory = (result: string): string => {
    const r = result.toLowerCase();
    if (r.includes('ball') && !r.includes('foul')) return 'ball';
    if (r.includes('called')) return 'called_strike';
    if (r.includes('swinging') || r.includes('missed')) return 'swinging_strike';
    if (r.includes('foul')) return 'foul';
    if (r.includes('play') || r.includes('hit')) return 'hit_into_play';
    if (r.includes('hbp')) return 'hit_by_pitch';
    return 'ball';
  };

  // Calculate pitch summary stats
  const summary = pitches.reduce(
    (acc, pitch) => {
      const category = getResultCategory(pitch.result);
      if (category === 'ball') acc.balls++;
      else acc.strikes++;
      acc.totalSpeed += pitch.speed;
      if (pitch.spinRate) acc.totalSpin += pitch.spinRate;
      return acc;
    },
    { balls: 0, strikes: 0, totalSpeed: 0, totalSpin: 0 }
  );

  const avgSpeed = pitches.length > 0 ? (summary.totalSpeed / pitches.length).toFixed(1) : '0';
  const avgSpin =
    pitches.filter((p) => p.spinRate).length > 0
      ? Math.round(summary.totalSpin / pitches.filter((p) => p.spinRate).length)
      : null;

  if (pitches.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <p>No pitch data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-charcoal rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-white/50">Count: </span>
            <span className="text-white font-mono">
              {summary.balls}-{summary.strikes}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-white/50">Pitches: </span>
            <span className="text-white font-mono">{pitches.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-white/50">Avg Velo: </span>
            <span className="text-burnt-orange font-mono">{avgSpeed}</span>
            <span className="text-white/30 text-xs ml-0.5">mph</span>
          </div>
          {avgSpin && showAdvanced && (
            <div className="text-sm">
              <span className="text-white/50">Avg Spin: </span>
              <span className="text-burnt-orange font-mono">{avgSpin}</span>
              <span className="text-white/30 text-xs ml-0.5">rpm</span>
            </div>
          )}
        </div>
      </div>

      {/* Pitch list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {pitches.map((pitch) => {
          const abbrev = PITCH_ABBREV[pitch.type] || pitch.type.substring(0, 2).toUpperCase();
          const color = PITCH_COLORS[pitch.type] || PITCH_COLORS[abbrev] || 'bg-gray-500';
          const resultCategory = getResultCategory(pitch.result);
          const resultBadge = RESULT_BADGES[resultCategory] || RESULT_BADGES.ball;
          const isSelected = pitch.id === selectedPitchId;
          const isHovered = pitch.id === hoveredPitch;

          return (
            <button
              key={pitch.id}
              onClick={() => onPitchSelect?.(pitch.id)}
              onMouseEnter={() => setHoveredPitch(pitch.id)}
              onMouseLeave={() => setHoveredPitch(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isSelected
                  ? 'bg-burnt-orange/20 ring-1 ring-burnt-orange'
                  : isHovered
                    ? 'bg-white/5'
                    : 'bg-transparent hover:bg-white/5'
              }`}
            >
              {/* Pitch number */}
              <span className="w-5 text-xs text-white/40 font-mono">{pitch.pitchNumber}</span>

              {/* Pitch type badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${color}`}>
                {abbrev}
              </span>

              {/* Velocity */}
              <span className="w-12 text-sm font-mono text-white">
                {pitch.speed.toFixed(0)}
                <span className="text-white/30 text-xs ml-0.5">mph</span>
              </span>

              {/* Advanced metrics */}
              {showAdvanced && pitch.spinRate && (
                <span className="w-16 text-xs text-white/50 font-mono">
                  {pitch.spinRate}
                  <span className="text-white/30 ml-0.5">rpm</span>
                </span>
              )}

              {/* Result badge */}
              <span
                className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${resultBadge.bg} ${resultBadge.text}`}
              >
                {resultBadge.label}
              </span>

              {/* Zone indicator */}
              {pitch.zone && (
                <span className="w-5 h-5 flex items-center justify-center text-[10px] text-white/30 bg-white/5 rounded">
                  {pitch.zone}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pitch type legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        {Object.entries(PITCH_ABBREV)
          .filter(([type]) => pitches.some((p) => p.type === type))
          .map(([type, abbrev]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${PITCH_COLORS[type] || 'bg-gray-500'}`} />
              <span className="text-[10px] text-white/40">{type}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Compact pitch sequence for at-bat display
 */
export function PitchSequence({ pitches }: { pitches: Pitch[] }) {
  return (
    <div className="flex items-center gap-1">
      {pitches.map((pitch) => {
        const abbrev = PITCH_ABBREV[pitch.type] || pitch.type.substring(0, 2).toUpperCase();
        const color = PITCH_COLORS[pitch.type] || PITCH_COLORS[abbrev] || 'bg-gray-500';
        const resultCategory = pitch.result.toLowerCase();
        const isStrike = resultCategory.includes('strike') || resultCategory.includes('foul');

        return (
          <div
            key={pitch.id}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${color} ${
              !isStrike ? 'opacity-50' : ''
            }`}
            title={`${pitch.type} - ${pitch.speed}mph - ${pitch.result}`}
          >
            {abbrev}
          </div>
        );
      })}
    </div>
  );
}
