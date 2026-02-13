'use client';

/**
 * SVG-based ABS strike zone model showing how Hawk-Eye cameras
 * measure a batter-specific strike zone using skeletal keypoints.
 */

import { useState } from 'react';

interface StrikeZoneModelProps {
  className?: string;
  compact?: boolean;
}

const KEYPOINTS = [
  { id: 'head', cx: 200, cy: 52, label: 'Head' },
  { id: 'neck', cx: 200, cy: 78, label: 'Neck' },
  { id: 'r-shoulder', cx: 170, cy: 98, label: 'R Shoulder' },
  { id: 'l-shoulder', cx: 230, cy: 98, label: 'L Shoulder' },
  { id: 'r-elbow', cx: 148, cy: 130, label: 'R Elbow' },
  { id: 'l-elbow', cx: 250, cy: 125, label: 'L Elbow' },
  { id: 'r-wrist', cx: 138, cy: 80, label: 'R Wrist' },
  { id: 'l-wrist', cx: 262, cy: 100, label: 'L Wrist' },
  { id: 'torso', cx: 200, cy: 130, label: 'Torso' },
  { id: 'r-hip', cx: 182, cy: 168, label: 'R Hip' },
  { id: 'l-hip', cx: 218, cy: 168, label: 'L Hip' },
  { id: 'midpoint', cx: 200, cy: 148, label: 'Midpoint' },
  { id: 'r-knee', cx: 178, cy: 218, label: 'R Knee' },
  { id: 'l-knee', cx: 222, cy: 218, label: 'L Knee' },
  { id: 'r-ankle', cx: 172, cy: 270, label: 'R Ankle' },
  { id: 'l-ankle', cx: 228, cy: 270, label: 'L Ankle' },
  { id: 'hollow-knee', cx: 200, cy: 218, label: 'Hollow of Knee' },
  { id: 'belt', cx: 200, cy: 168, label: 'Belt Line' },
] as const;

const SKELETON_LINES = [
  ['head', 'neck'],
  ['neck', 'r-shoulder'],
  ['neck', 'l-shoulder'],
  ['r-shoulder', 'r-elbow'],
  ['l-shoulder', 'l-elbow'],
  ['r-elbow', 'r-wrist'],
  ['l-elbow', 'l-wrist'],
  ['r-shoulder', 'torso'],
  ['l-shoulder', 'torso'],
  ['torso', 'r-hip'],
  ['torso', 'l-hip'],
  ['r-hip', 'r-knee'],
  ['l-hip', 'l-knee'],
  ['r-knee', 'r-ankle'],
  ['l-knee', 'l-ankle'],
] as const;

function getPoint(id: string) {
  return KEYPOINTS.find((k) => k.id === id);
}

export function StrikeZoneModel({ className = '', compact = false }: StrikeZoneModelProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Strike zone boundaries
  const zoneTop = 130; // midpoint between belt and shoulders
  const zoneBottom = 218; // hollow of the knee
  const zoneLeft = 120;
  const zoneRight = 280;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 320"
        className="w-full h-auto"
        role="img"
        aria-label="ABS Strike Zone Model showing how Hawk-Eye cameras track 18 skeletal keypoints to determine a batter-specific strike zone"
      >
        <defs>
          <linearGradient id="sz-zone-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BF5700" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#BF5700" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="sz-zone-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BF5700" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.6" />
          </linearGradient>
          <filter id="sz-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Home plate */}
        <polygon
          points="160,290 200,305 240,290 240,280 160,280"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        <text x="200" y="296" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">
          HOME
        </text>

        {/* Strike zone rectangle */}
        <rect
          x={zoneLeft}
          y={zoneTop}
          width={zoneRight - zoneLeft}
          height={zoneBottom - zoneTop}
          fill="url(#sz-zone-fill)"
          stroke="url(#sz-zone-stroke)"
          strokeWidth="1.5"
          strokeDasharray="6,3"
          rx="2"
        />

        {/* 9-zone grid inside strike zone */}
        {[1, 2].map((i) => (
          <line
            key={`h-${i}`}
            x1={zoneLeft}
            y1={zoneTop + ((zoneBottom - zoneTop) / 3) * i}
            x2={zoneRight}
            y2={zoneTop + ((zoneBottom - zoneTop) / 3) * i}
            stroke="rgba(191,87,0,0.15)"
            strokeWidth="0.5"
          />
        ))}
        {[1, 2].map((i) => (
          <line
            key={`v-${i}`}
            x1={zoneLeft + ((zoneRight - zoneLeft) / 3) * i}
            y1={zoneTop}
            x2={zoneLeft + ((zoneRight - zoneLeft) / 3) * i}
            y2={zoneBottom}
            stroke="rgba(191,87,0,0.15)"
            strokeWidth="0.5"
          />
        ))}

        {/* Zone labels */}
        <text x={zoneLeft - 8} y={zoneTop + 4} textAnchor="end" fill="#BF5700" fontSize="7" fontFamily="monospace" opacity="0.7">
          TOP
        </text>
        <text x={zoneLeft - 8} y={zoneBottom + 4} textAnchor="end" fill="#BF5700" fontSize="7" fontFamily="monospace" opacity="0.7">
          BOT
        </text>

        {/* Zone dimension annotations */}
        {!compact && (
          <>
            {/* Top of zone = midpoint */}
            <line x1={zoneRight + 12} y1={zoneTop} x2={zoneRight + 30} y2={zoneTop} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1={zoneRight + 12} y1={zoneBottom} x2={zoneRight + 30} y2={zoneBottom} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1={zoneRight + 24} y1={zoneTop} x2={zoneRight + 24} y2={zoneBottom} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" markerEnd="" />
            <text x={zoneRight + 32} y={(zoneTop + zoneBottom) / 2 + 3} fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
              ZONE
            </text>
            <text x={zoneRight + 32} y={(zoneTop + zoneBottom) / 2 + 13} fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">
              Batter-
            </text>
            <text x={zoneRight + 32} y={(zoneTop + zoneBottom) / 2 + 21} fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">
              specific
            </text>

            {/* Width annotation */}
            <line x1={zoneLeft} y1={zoneBottom + 14} x2={zoneRight} y2={zoneBottom + 14} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <text x={200} y={zoneBottom + 26} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">
              17 in (rule book width)
            </text>
          </>
        )}

        {/* Skeleton lines */}
        {SKELETON_LINES.map(([from, to]) => {
          const p1 = getPoint(from);
          const p2 = getPoint(to);
          if (!p1 || !p2) return null;
          const isHighlighted = hoveredPoint === from || hoveredPoint === to;
          return (
            <line
              key={`${from}-${to}`}
              x1={p1.cx}
              y1={p1.cy}
              x2={p2.cx}
              y2={p2.cy}
              stroke={isHighlighted ? '#FF6B35' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isHighlighted ? 1.5 : 1}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Keypoints */}
        {KEYPOINTS.map((point) => {
          const isHovered = hoveredPoint === point.id;
          const isZoneBoundary = point.id === 'hollow-knee' || point.id === 'belt' || point.id === 'midpoint';
          return (
            <g key={point.id}>
              <circle
                cx={point.cx}
                cy={point.cy}
                r={isHovered ? 5 : isZoneBoundary ? 4 : 3}
                fill={isZoneBoundary ? '#BF5700' : isHovered ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
                stroke={isZoneBoundary ? '#FF6B35' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                className="cursor-pointer transition-all duration-200"
                filter={isHovered ? 'url(#sz-glow)' : undefined}
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {isHovered && (
                <text
                  x={point.cx}
                  y={point.cy - 10}
                  textAnchor="middle"
                  fill="#FF6B35"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        {!compact && (
          <g transform="translate(10, 10)">
            <rect x="0" y="0" width="90" height="46" rx="4" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <circle cx="12" cy="14" r="3" fill="#BF5700" stroke="#FF6B35" strokeWidth="0.5" />
            <text x="20" y="17" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">Zone boundary</text>
            <circle cx="12" cy="30" r="3" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <text x="20" y="33" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">Skeletal point</text>
          </g>
        )}
      </svg>

      {/* Caption */}
      <div className="mt-3 text-center">
        <p className="text-text-tertiary text-xs">
          18 skeletal keypoints tracked at 30fps per batter
        </p>
        <p className="text-text-muted text-[10px] mt-1">
          Zone top = midpoint of shoulders &amp; belt | Zone bottom = hollow of knee
        </p>
      </div>
    </div>
  );
}
