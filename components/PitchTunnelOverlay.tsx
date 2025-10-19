import React, { useMemo } from 'react';

type PitchPoint = {
  pitchId: string;
  pitchType: string;
  velocity: number;
  side?: number;
  height?: number;
  extension?: number;
  x?: number;
  y?: number;
  outcome?: string;
};

type PitchTunnelOverlayProps = {
  releasePoints: PitchPoint[];
  plateLocations: PitchPoint[];
};

const colorPalette: Record<string, string> = {
  FF: '#facc15',
  SL: '#38bdf8',
  CH: '#f472b6',
  CB: '#34d399',
  SI: '#e879f9',
};

const scaleValue = (
  value: number,
  [domainMin, domainMax]: [number, number],
  [rangeMin, rangeMax]: [number, number]
) => {
  const clamped = Math.min(Math.max(value, domainMin), domainMax);
  const ratio = (clamped - domainMin) / (domainMax - domainMin || 1);
  return rangeMin + ratio * (rangeMax - rangeMin);
};

const PitchTunnelOverlay: React.FC<PitchTunnelOverlayProps> = ({
  releasePoints,
  plateLocations,
}) => {
  const combined = useMemo(() => {
    const plateMap = new Map(plateLocations.map((point) => [point.pitchId, point]));
    return releasePoints
      .map((release) => {
        const plate = plateMap.get(release.pitchId);
        if (!plate) return null;
        const color = colorPalette[release.pitchType] || '#60a5fa';
        return {
          id: release.pitchId,
          type: release.pitchType,
          velocity: release.velocity,
          outcome: plate.outcome,
          color,
          release,
          plate,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      type: string;
      velocity: number;
      outcome?: string;
      color: string;
      release: PitchPoint;
      plate: PitchPoint;
    }>;
  }, [releasePoints, plateLocations]);

  if (!combined.length) {
    return <div className="pitch-tunnel-empty">Pitch tracking is not available.</div>;
  }

  const width = 360;
  const height = 220;

  return (
    <div className="pitch-tunnel-card">
      <div className="pitch-tunnel-header">
        <div>
          <h4>Pitch Tunnel Overlay</h4>
          <p className="pitch-tunnel-subtitle">Release extension vs. plate entry</p>
        </div>
        <div className="pitch-tunnel-legend">
          {Array.from(new Set(combined.map((sample) => sample.type))).map((type) => (
            <span key={type} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: colorPalette[type] || '#60a5fa' }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>
      <div className="pitch-tunnel-body">
        <svg
          className="pitch-tunnel-canvas"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Pitch release and plate location overlay"
        >
          <defs>
            <linearGradient id="tunnelTrail" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="16"
            ry="16"
            fill="rgba(17, 24, 39, 0.75)"
            stroke="rgba(255, 255, 255, 0.05)"
          />
          <line
            x1={width / 2}
            y1={16}
            x2={width / 2}
            y2={height - 16}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="6 6"
          />
          <text x={width / 4} y={24} className="overlay-axis-label">
            Release
          </text>
          <text x={(3 * width) / 4} y={24} className="overlay-axis-label">
            Plate
          </text>
          {combined.map((sample) => {
            const releaseX = scaleValue(sample.release.side ?? 0, [-3, 3], [32, width / 2 - 32]);
            const releaseY = scaleValue(sample.release.height ?? 5.5, [3, 7], [height - 32, 48]);
            const plateX = scaleValue(sample.plate.x ?? 0, [-0.8, 0.8], [width / 2 + 32, width - 32]);
            const plateY = scaleValue(sample.plate.y ?? 0.5, [-0.5, 3.5], [height - 32, 48]);

            return (
              <g key={sample.id} className="pitch-tunnel-path">
                <path
                  d={`M${releaseX},${releaseY} C${releaseX + 40},${releaseY} ${plateX - 40},${plateY} ${plateX},${plateY}`}
                  fill="none"
                  stroke={sample.color}
                  strokeWidth={2.2}
                  strokeOpacity={0.7}
                />
                <circle cx={releaseX} cy={releaseY} r={6} fill={sample.color} fillOpacity={0.9} />
                <circle cx={plateX} cy={plateY} r={6} fill={sample.color} fillOpacity={0.9} />
                <text x={releaseX} y={releaseY - 12} className="overlay-pitch-label">
                  {Math.round(sample.velocity)}
                </text>
                {sample.outcome && (
                  <text x={plateX} y={plateY + 18} className="overlay-outcome-label">
                    {sample.outcome}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default PitchTunnelOverlay;
