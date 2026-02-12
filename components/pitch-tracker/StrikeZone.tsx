'use client';

/**
 * StrikeZone — visualize pitch locations on a strike zone
 * TODO: Implement full visualization
 */

interface StrikeZonePitch {
  id: string;
  type: string;
  speed: number;
  result: string;
  coordinates?: {
    x: number;
    y: number;
  };
  isSelected?: boolean;
}

interface StrikeZoneProps {
  pitches: StrikeZonePitch[];
  batterSide?: 'L' | 'R';
  selectedPitchId?: string;
  onPitchSelect?: (pitchId: string) => void;
  onPitchClick?: (pitchId: string) => void;
  showSequence?: boolean;
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  height?: number;
}

export function StrikeZone({
  pitches,
  batterSide = 'R',
  selectedPitchId,
  onPitchSelect,
  onPitchClick,
  showSequence = false,
  size = 'md',
  width = 300,
  height = 400,
}: StrikeZoneProps) {
  const handleClick = onPitchClick || onPitchSelect;
  
  return (
    <div className="strike-zone" style={{ width, height }}>
      <div className="text-sm text-gray-500">
        Strike Zone ({size}) - {pitches.length} pitches (Batter: {batterSide})
      </div>
      {showSequence && (
        <div className="text-xs text-gray-400 mt-1">
          Sequence visualization enabled
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        Visualization coming soon
      </div>
    </div>
  );
}

export function StrikeZoneMini({
  pitches,
  width = 150,
  height = 200,
}: Pick<StrikeZoneProps, 'pitches' | 'width' | 'height'>) {
  return (
    <div className="strike-zone-mini" style={{ width, height }}>
      <div className="text-xs text-gray-500">{pitches.length} pitches</div>
    </div>
  );
}
