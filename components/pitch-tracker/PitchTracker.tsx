'use client';

import { useState, useMemo } from 'react';
// ---------------------------------------------------------------------------
// Inline stubs — StrikeZone and PitchList were planned but never created.
// These minimal implementations keep the component functional until the full
// pitch-visualization work lands.
// ---------------------------------------------------------------------------

interface ZonePitch {
  id: string;
  type: string;
  speed: number;
  result: string;
  coordinates?: { x: number; y: number };
  isSelected?: boolean;
}

function StrikeZone({
  pitches,
  selectedPitchId,
  onPitchClick,
  batterSide: _batterSide,
  size: _size,
}: {
  pitches: ZonePitch[];
  selectedPitchId?: string;
  onPitchClick: (id: string | null) => void;
  showSequence?: boolean;
  batterSide?: 'L' | 'R';
  size?: string;
}) {
  return (
    <div className="relative w-48 h-60 bg-charcoal rounded-lg border border-white/10">
      {/* Zone outline */}
      <div className="absolute inset-6 border border-white/20 rounded" />
      {/* Pitch dots */}
      {pitches.map((p) => {
        const x = p.coordinates ? (p.coordinates.x / 250) * 100 : 50;
        const y = p.coordinates ? (p.coordinates.y / 250) * 100 : 50;
        const isStrike = p.result.toLowerCase().includes('strike') || p.result.toLowerCase().includes('foul');
        return (
          <button
            key={p.id}
            onClick={() => onPitchClick(p.id === selectedPitchId ? null : p.id)}
            className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all ${
              p.isSelected ? 'ring-2 ring-white scale-150' : ''
            } ${isStrike ? 'bg-burnt-orange' : 'bg-white/40'}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${p.type} — ${p.speed} mph — ${p.result}`}
          />
        );
      })}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/30">
        Strike Zone
      </span>
    </div>
  );
}

interface PitchListPitch {
  id: string;
  pitchNumber: number;
  type: string;
  speed: number;
  result: string;
  spinRate?: number;
  breakAngle?: number;
  breakLength?: number;
}

function PitchList({
  pitches,
  selectedPitchId,
  onPitchSelect,
  showAdvanced: _showAdvanced,
}: {
  pitches: PitchListPitch[];
  selectedPitchId?: string;
  onPitchSelect: (id: string | null) => void;
  showAdvanced?: boolean;
}) {
  return (
    <div className="space-y-1 max-h-80 overflow-y-auto">
      {pitches.map((p) => (
        <button
          key={p.id}
          onClick={() => onPitchSelect(p.id === selectedPitchId ? null : p.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            p.id === selectedPitchId ? 'bg-burnt-orange/20 text-white' : 'hover:bg-white/5 text-white/70'
          }`}
        >
          <span className="text-xs text-white/40 w-4 font-mono">{p.pitchNumber}</span>
          <span className="flex-1 text-sm">{p.type}</span>
          <span className="text-xs font-mono text-burnt-orange">{p.speed} mph</span>
          <span className="text-xs text-white/50 w-16 text-right truncate">{p.result}</span>
        </button>
      ))}
    </div>
  );
}

export interface AtBat {
  atBatIndex: number;
  batter: {
    id: number;
    name: string;
  };
  pitcher: {
    id: number;
    name: string;
  };
  result: string;
  description: string;
  pitches: Pitch[];
  rbi: number;
  isScoring: boolean;
}

export interface Pitch {
  id: string;
  pitchNumber: number;
  type: string;
  speed: number;
  spinRate?: number;
  result: string;
  zone?: number;
  coordinates?: {
    x: number;
    y: number;
  };
  breakAngle?: number;
  breakLength?: number;
}

interface PitchTrackerProps {
  atBats: AtBat[];
  /** Current at-bat index (for live games) */
  currentAtBatIndex?: number;
  /** Batter handedness */
  batterSide?: 'L' | 'R';
  /** Show advanced metrics */
  showAdvanced?: boolean;
  /** Loading state */
  loading?: boolean;
}

export function PitchTracker({
  atBats,
  currentAtBatIndex,
  batterSide = 'R',
  showAdvanced = true,
  loading = false,
}: PitchTrackerProps) {
  const [selectedAtBat, setSelectedAtBat] = useState<number | null>(
    currentAtBatIndex ?? (atBats.length > 0 ? atBats.length - 1 : null)
  );
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);

  // Get current at-bat data
  const currentAtBat = useMemo(() => {
    if (selectedAtBat === null || !atBats[selectedAtBat]) return null;
    return atBats[selectedAtBat];
  }, [atBats, selectedAtBat]);

  // Transform pitches for StrikeZone component
  const zonePitches = useMemo(() => {
    if (!currentAtBat) return [];
    return currentAtBat.pitches.map((p, i) => ({
      id: p.id || `pitch-${i}`,
      type: p.type,
      speed: p.speed,
      result: p.result,
      coordinates: p.coordinates,
      isSelected: p.id === selectedPitchId,
    }));
  }, [currentAtBat, selectedPitchId]);

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex gap-4">
          <div className="skeleton w-48 h-60 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton w-full h-10 rounded" />
            <div className="skeleton w-full h-8 rounded" />
            <div className="skeleton w-full h-8 rounded" />
            <div className="skeleton w-full h-8 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (atBats.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12 bg-charcoal rounded-lg">
          <svg
            className="w-12 h-12 mx-auto text-white/20 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeWidth="1.5" d="M12 6v6l4 2" />
          </svg>
          <p className="text-white/50">No pitch data available</p>
          <p className="text-white/30 text-sm mt-1">
            Pitch tracking data will appear here during live games
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* At-bat selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {atBats.slice(-10).map((ab, i) => {
          const index = atBats.length - 10 + i;
          const isSelected = selectedAtBat === index;
          const isLive = index === currentAtBatIndex;

          return (
            <button
              key={index}
              onClick={() => setSelectedAtBat(index)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-all ${
                isSelected
                  ? 'bg-burnt-orange text-white'
                  : 'bg-charcoal text-white/70 hover:bg-charcoal/80'
              } ${isLive ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="font-medium truncate max-w-24">{ab.batter.name.split(' ').pop()}</div>
              <div className="text-[10px] opacity-60 truncate">
                vs {ab.pitcher.name.split(' ').pop()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      {currentAtBat && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strike zone visualization */}
          <div className="flex flex-col items-center">
            <StrikeZone
              pitches={zonePitches}
              selectedPitchId={selectedPitchId || undefined}
              onPitchClick={setSelectedPitchId}
              showSequence
              batterSide={batterSide}
              size="lg"
            />

            {/* At-bat result */}
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-center ${
                currentAtBat.isScoring
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-charcoal text-white/70'
              }`}
            >
              <div className="text-sm font-medium">{currentAtBat.result || 'In Progress'}</div>
              <div className="text-xs text-white/50 mt-0.5 max-w-64 truncate">
                {currentAtBat.description}
              </div>
            </div>
          </div>

          {/* Pitch list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">{currentAtBat.batter.name}</h3>
              <span className="text-xs text-white/40">vs {currentAtBat.pitcher.name}</span>
            </div>
            <PitchList
              pitches={currentAtBat.pitches.map((p, i) => ({
                ...p,
                id: p.id || `pitch-${i}`,
                pitchNumber: i + 1,
              }))}
              selectedPitchId={selectedPitchId || undefined}
              onPitchSelect={setSelectedPitchId}
              showAdvanced={showAdvanced}
            />
          </div>
        </div>
      )}

      {/* Pitch type summary */}
      <PitchTypeSummary atBats={atBats} />
    </div>
  );
}

/**
 * Summary of pitch types thrown in the game
 */
function PitchTypeSummary({ atBats }: { atBats: AtBat[] }) {
  const summary = useMemo(() => {
    const pitchCounts: Record<string, { count: number; avgSpeed: number; totalSpeed: number }> = {};

    atBats.forEach((ab) => {
      ab.pitches.forEach((p) => {
        if (!pitchCounts[p.type]) {
          pitchCounts[p.type] = { count: 0, avgSpeed: 0, totalSpeed: 0 };
        }
        pitchCounts[p.type].count++;
        pitchCounts[p.type].totalSpeed += p.speed;
      });
    });

    // Calculate averages
    Object.keys(pitchCounts).forEach((type) => {
      pitchCounts[type].avgSpeed = pitchCounts[type].totalSpeed / pitchCounts[type].count;
    });

    // Sort by count
    return Object.entries(pitchCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6);
  }, [atBats]);

  const totalPitches = summary.reduce((sum, [, data]) => sum + data.count, 0);

  if (summary.length === 0) return null;

  return (
    <div className="bg-charcoal rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Pitch Arsenal</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {summary.map(([type, data]) => {
          const percentage = ((data.count / totalPitches) * 100).toFixed(0);

          return (
            <div key={type} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">{type}</span>
                  <span className="text-xs text-white/40">{percentage}%</span>
                </div>
                <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burnt-orange rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/40">{data.count} pitches</span>
                  <span className="text-[10px] text-burnt-orange">
                    {data.avgSpeed.toFixed(1)} mph
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
