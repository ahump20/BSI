'use client';

import { useMemo } from 'react';

interface Pitch {
  id: string;
  type: string;
  speed: number;
  result: string;
  coordinates?: {
    x: number; // -1.5 to 1.5 (feet from center)
    y: number; // 1.5 to 4.0 (feet from ground)
  };
  isSelected?: boolean;
}

interface StrikeZoneProps {
  pitches: Pitch[];
  /** Highlight specific pitch by ID */
  selectedPitchId?: string;
  /** Callback when pitch is clicked */
  onPitchClick?: (pitchId: string) => void;
  /** Show pitch trails/sequence */
  showSequence?: boolean;
  /** Batter handedness for zone positioning */
  batterSide?: 'L' | 'R';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// Strike zone dimensions (MLB standard)
const ZONE = {
  // Zone boundaries in feet
  left: -0.83,
  right: 0.83,
  top: 3.5,
  bottom: 1.5,
  // SVG viewBox
  viewWidth: 200,
  viewHeight: 250,
  // Margins
  margin: 30,
};

// Pitch type colors
const PITCH_COLORS: Record<string, string> = {
  'Four-Seam Fastball': '#EF4444', // red
  Fastball: '#EF4444',
  FF: '#EF4444',
  Sinker: '#F97316', // orange
  SI: '#F97316',
  Cutter: '#FB923C', // light orange
  FC: '#FB923C',
  Slider: '#FBBF24', // yellow
  SL: '#FBBF24',
  Curveball: '#22C55E', // green
  CU: '#22C55E',
  Changeup: '#3B82F6', // blue
  CH: '#3B82F6',
  Splitter: '#8B5CF6', // purple
  FS: '#8B5CF6',
  'Knuckle Curve': '#06B6D4', // cyan
  KC: '#06B6D4',
  Sweeper: '#EC4899', // pink
  ST: '#EC4899',
  Unknown: '#6B7280', // gray
};

// Result styling
const RESULT_STYLES: Record<string, { fill: string; stroke: string }> = {
  ball: { fill: 'transparent', stroke: '#6B7280' },
  called_strike: { fill: '#EF4444', stroke: '#EF4444' },
  swinging_strike: { fill: '#DC2626', stroke: '#DC2626' },
  foul: { fill: '#F59E0B', stroke: '#F59E0B' },
  hit_into_play: { fill: '#22C55E', stroke: '#22C55E' },
  hit_by_pitch: { fill: '#8B5CF6', stroke: '#8B5CF6' },
};

export function StrikeZone({
  pitches,
  selectedPitchId,
  onPitchClick,
  showSequence = false,
  batterSide = 'R',
  size = 'md',
}: StrikeZoneProps) {
  // Convert pitch coordinates to SVG coordinates
  const convertCoords = useMemo(() => {
    const scaleX = (ZONE.viewWidth - 2 * ZONE.margin) / 3; // 3 feet wide view
    const scaleY = (ZONE.viewHeight - 2 * ZONE.margin) / 3; // 3 feet tall view

    return (x: number, y: number) => ({
      svgX: ZONE.margin + (x + 1.5) * scaleX,
      svgY: ZONE.margin + (4.5 - y) * scaleY,
    });
  }, []);

  // Zone corner coordinates
  const zoneCoords = useMemo(() => {
    const topLeft = convertCoords(ZONE.left, ZONE.top);
    const topRight = convertCoords(ZONE.right, ZONE.top);
    const bottomLeft = convertCoords(ZONE.left, ZONE.bottom);
    const bottomRight = convertCoords(ZONE.right, ZONE.bottom);

    return { topLeft, topRight, bottomLeft, bottomRight };
  }, [convertCoords]);

  // Size classes
  const sizeClasses = {
    sm: 'w-32 h-40',
    md: 'w-48 h-60',
    lg: 'w-64 h-80',
  };

  // Determine result category
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

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg
        viewBox={`0 0 ${ZONE.viewWidth} ${ZONE.viewHeight}`}
        className="w-full h-full"
        aria-label="Strike zone visualization"
      >
        {/* Background */}
        <rect x="0" y="0" width={ZONE.viewWidth} height={ZONE.viewHeight} fill="#0D0D0D" rx="4" />

        {/* Home plate */}
        <polygon
          points={`
            ${ZONE.viewWidth / 2 - 15},${ZONE.viewHeight - 15}
            ${ZONE.viewWidth / 2 + 15},${ZONE.viewHeight - 15}
            ${ZONE.viewWidth / 2 + 15},${ZONE.viewHeight - 10}
            ${ZONE.viewWidth / 2},${ZONE.viewHeight - 5}
            ${ZONE.viewWidth / 2 - 15},${ZONE.viewHeight - 10}
          `}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Strike zone outline */}
        <rect
          x={zoneCoords.topLeft.svgX}
          y={zoneCoords.topLeft.svgY}
          width={zoneCoords.topRight.svgX - zoneCoords.topLeft.svgX}
          height={zoneCoords.bottomLeft.svgY - zoneCoords.topLeft.svgY}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Zone grid (9 boxes) */}
        {[1, 2].map((i) => (
          <g key={`grid-${i}`}>
            {/* Vertical lines */}
            <line
              x1={
                zoneCoords.topLeft.svgX +
                ((zoneCoords.topRight.svgX - zoneCoords.topLeft.svgX) * i) / 3
              }
              y1={zoneCoords.topLeft.svgY}
              x2={
                zoneCoords.topLeft.svgX +
                ((zoneCoords.topRight.svgX - zoneCoords.topLeft.svgX) * i) / 3
              }
              y2={zoneCoords.bottomLeft.svgY}
              stroke="#FFFFFF"
              strokeWidth="0.5"
              opacity="0.3"
            />
            {/* Horizontal lines */}
            <line
              x1={zoneCoords.topLeft.svgX}
              y1={
                zoneCoords.topLeft.svgY +
                ((zoneCoords.bottomLeft.svgY - zoneCoords.topLeft.svgY) * i) / 3
              }
              x2={zoneCoords.topRight.svgX}
              y2={
                zoneCoords.topLeft.svgY +
                ((zoneCoords.bottomLeft.svgY - zoneCoords.topLeft.svgY) * i) / 3
              }
              stroke="#FFFFFF"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </g>
        ))}

        {/* Shadow zone (edge of plate) */}
        <rect
          x={zoneCoords.topLeft.svgX - 8}
          y={zoneCoords.topLeft.svgY - 8}
          width={zoneCoords.topRight.svgX - zoneCoords.topLeft.svgX + 16}
          height={zoneCoords.bottomLeft.svgY - zoneCoords.topLeft.svgY + 16}
          fill="none"
          stroke="#BF5700"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.3"
        />

        {/* Pitch sequence line */}
        {showSequence && pitches.length > 1 && (
          <polyline
            points={pitches
              .filter((p) => p.coordinates)
              .map((p) => {
                const { svgX, svgY } = convertCoords(p.coordinates!.x, p.coordinates!.y);
                return `${svgX},${svgY}`;
              })
              .join(' ')}
            fill="none"
            stroke="#BF5700"
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray="2 2"
          />
        )}

        {/* Pitches */}
        {pitches.map((pitch, index) => {
          if (!pitch.coordinates) return null;

          const { svgX, svgY } = convertCoords(pitch.coordinates.x, pitch.coordinates.y);
          const color = PITCH_COLORS[pitch.type] || PITCH_COLORS['Unknown'];
          const resultStyle =
            RESULT_STYLES[getResultCategory(pitch.result)] || RESULT_STYLES['ball'];
          const isSelected = pitch.id === selectedPitchId || pitch.isSelected;
          const radius = isSelected ? 8 : 6;

          return (
            <g
              key={pitch.id}
              className={onPitchClick ? 'cursor-pointer' : ''}
              onClick={() => onPitchClick?.(pitch.id)}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={radius + 4}
                  fill="none"
                  stroke="#BF5700"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* Pitch dot */}
              <circle
                cx={svgX}
                cy={svgY}
                r={radius}
                fill={resultStyle.fill === 'transparent' ? 'transparent' : color}
                stroke={resultStyle.fill === 'transparent' ? color : 'none'}
                strokeWidth="2"
                opacity={isSelected ? 1 : 0.85}
              />

              {/* Sequence number */}
              {showSequence && (
                <text
                  x={svgX}
                  y={svgY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={resultStyle.fill === 'transparent' ? color : '#FFFFFF'}
                  fontSize="8"
                  fontWeight="bold"
                >
                  {index + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* Batter silhouette indicator */}
        <text
          x={batterSide === 'R' ? 15 : ZONE.viewWidth - 15}
          y={ZONE.viewHeight / 2}
          fill="#FFFFFF"
          fontSize="10"
          opacity="0.3"
          textAnchor="middle"
        >
          {batterSide === 'R' ? 'RHB' : 'LHB'}
        </text>
      </svg>
    </div>
  );
}

/**
 * Compact strike zone for inline display
 */
export function StrikeZoneMini({ pitches }: { pitches: Pitch[] }) {
  return <StrikeZone pitches={pitches} size="sm" />;
}
