'use client';

/**
 * PitchList — list of pitches with details
 * TODO: Implement full pitch-by-pitch list
 */

interface PitchData {
  id: string;
  pitchNumber: number;
  type: string;
  speed: number;
  result: string;
  spinRate?: number;
}

interface PitchListProps {
  pitches: PitchData[];
  selectedPitchId?: string | null;
  onPitchSelect?: (pitchId: string) => void;
  showAdvanced?: boolean;
}

export function PitchList({
  pitches,
  selectedPitchId,
  onPitchSelect,
  showAdvanced = false,
}: PitchListProps) {
  return (
    <div className="pitch-list">
      <div className="text-sm font-semibold mb-2">
        Pitch Sequence ({pitches.length})
      </div>
      <div className="space-y-1">
        {pitches.map((pitch) => (
          <div
            key={pitch.id}
            className={`text-xs p-2 rounded cursor-pointer ${
              pitch.id === selectedPitchId ? 'bg-blue-100' : 'bg-gray-50'
            }`}
            onClick={() => onPitchSelect?.(pitch.id)}
          >
            #{pitch.pitchNumber}: {pitch.type} - {pitch.speed}mph - {pitch.result}
            {showAdvanced && pitch.spinRate && (
              <span className="text-gray-500 ml-2">{pitch.spinRate} rpm</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PitchSequence({
  pitches,
}: Pick<PitchListProps, 'pitches'>) {
  return (
    <div className="pitch-sequence text-xs">
      {pitches.map((p, i) => (
        <span key={p.id} className="mr-2">
          {i + 1}. {p.type}
        </span>
      ))}
    </div>
  );
}
