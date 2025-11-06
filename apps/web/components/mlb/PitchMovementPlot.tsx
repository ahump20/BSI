'use client';

import { useEffect, useRef } from 'react';

interface PitchData {
  pitch_type: string;
  horizontal_break: number;
  induced_vertical_break: number;
  velocity: number;
  spin_rate?: number;
}

interface PitchMovementPlotProps {
  data: PitchData[];
  width?: number;
  height?: number;
}

const PITCH_COLORS: Record<string, string> = {
  'FF': '#ef4444',  // Four-seam fastball - Red
  'SI': '#f97316',  // Sinker - Orange
  'FC': '#f59e0b',  // Cutter - Amber
  'SL': '#3b82f6',  // Slider - Blue
  'CU': '#8b5cf6',  // Curveball - Purple
  'CH': '#10b981',  // Changeup - Green
  'FS': '#06b6d4',  // Splitter - Cyan
  'KN': '#ec4899',  // Knuckleball - Pink
};

const PITCH_NAMES: Record<string, string> = {
  'FF': 'Four-Seam FB',
  'SI': 'Sinker',
  'FC': 'Cutter',
  'SL': 'Slider',
  'CU': 'Curveball',
  'CH': 'Changeup',
  'FS': 'Splitter',
  'KN': 'Knuckleball',
};

export default function PitchMovementPlot({ data, width = 600, height = 600 }: PitchMovementPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw axes and grid
    drawAxes(ctx, width, height);

    // Draw pitches
    drawPitches(ctx, data, width, height);
  }, [data, width, height]);

  const drawAxes = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const padding = 60;

    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = -20; i <= 20; i += 5) {
      const x = centerX + (i * (w - padding * 2)) / 40;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, h - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = -20; i <= 20; i += 5) {
      const y = centerY - (i * (h - padding * 2)) / 40;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    // Draw main axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(w - padding, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, h - padding);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';

    // X-axis label
    ctx.fillText('Horizontal Break (inches)', centerX, h - 20);

    // Y-axis label
    ctx.save();
    ctx.translate(20, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Induced Vertical Break (inches)', 0, 0);
    ctx.restore();

    // Draw tick marks and values
    ctx.fillStyle = '#999999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // X-axis ticks
    for (let i = -20; i <= 20; i += 10) {
      const x = centerX + (i * (w - padding * 2)) / 40;
      ctx.fillText(i.toString(), x, centerY + 20);
    }

    // Y-axis ticks
    ctx.textAlign = 'right';
    for (let i = -20; i <= 20; i += 10) {
      const y = centerY - (i * (h - padding * 2)) / 40;
      ctx.fillText(i.toString(), centerX - 10, y + 4);
    }

    // Draw quadrant labels
    ctx.fillStyle = '#666666';
    ctx.font = 'italic 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Arm Side / Rising', centerX + (w - padding * 2) / 4, padding - 10);
    ctx.fillText('Glove Side / Rising', centerX - (w - padding * 2) / 4, padding - 10);
    ctx.fillText('Arm Side / Sinking', centerX + (w - padding * 2) / 4, h - padding + 30);
    ctx.fillText('Glove Side / Sinking', centerX - (w - padding * 2) / 4, h - padding + 30);
  };

  const drawPitches = (
    ctx: CanvasRenderingContext2D,
    pitches: PitchData[],
    w: number,
    h: number
  ) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const padding = 60;
    const scale = (w - padding * 2) / 40; // 40 inches total range

    // Group pitches by type
    const pitchGroups: Record<string, PitchData[]> = {};
    pitches.forEach(pitch => {
      if (!pitchGroups[pitch.pitch_type]) {
        pitchGroups[pitch.pitch_type] = [];
      }
      pitchGroups[pitch.pitch_type].push(pitch);
    });

    // Draw each pitch
    Object.entries(pitchGroups).forEach(([pitchType, typePitches]) => {
      const color = PITCH_COLORS[pitchType] || '#ffffff';

      typePitches.forEach((pitch, index) => {
        const x = centerX + pitch.horizontal_break * scale;
        const y = centerY - pitch.induced_vertical_break * scale;

        // Draw pitch marker
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add slight glow
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // Calculate and draw average location
      if (typePitches.length > 1) {
        const avgHBreak = typePitches.reduce((sum, p) => sum + p.horizontal_break, 0) / typePitches.length;
        const avgVBreak = typePitches.reduce((sum, p) => sum + p.induced_vertical_break, 0) / typePitches.length;

        const avgX = centerX + avgHBreak * scale;
        const avgY = centerY - avgVBreak * scale;

        // Draw average marker (larger circle with cross)
        ctx.beginPath();
        ctx.arc(avgX, avgY, 10, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw cross in center
        ctx.beginPath();
        ctx.moveTo(avgX - 6, avgY);
        ctx.lineTo(avgX + 6, avgY);
        ctx.moveTo(avgX, avgY - 6);
        ctx.lineTo(avgX, avgY + 6);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pitchType, avgX, avgY + 25);
      }
    });
  };

  // Calculate pitch statistics
  const pitchStats = data.reduce((acc, pitch) => {
    if (!acc[pitch.pitch_type]) {
      acc[pitch.pitch_type] = {
        count: 0,
        avgVelo: 0,
        avgHBreak: 0,
        avgVBreak: 0,
      };
    }
    acc[pitch.pitch_type].count++;
    acc[pitch.pitch_type].avgVelo += pitch.velocity;
    acc[pitch.pitch_type].avgHBreak += pitch.horizontal_break;
    acc[pitch.pitch_type].avgVBreak += pitch.induced_vertical_break;
    return acc;
  }, {} as Record<string, { count: number; avgVelo: number; avgHBreak: number; avgVBreak: number }>);

  // Calculate averages
  Object.keys(pitchStats).forEach(type => {
    pitchStats[type].avgVelo /= pitchStats[type].count;
    pitchStats[type].avgHBreak /= pitchStats[type].count;
    pitchStats[type].avgVBreak /= pitchStats[type].count;
  });

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Pitch Movement Plot</h3>

      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="mx-auto border border-gray-700 rounded"
        />
      </div>

      {/* Legend and Stats */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {Object.entries(pitchStats).map(([type, stats]) => (
            <div key={type} className="bg-gray-800 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: PITCH_COLORS[type] || '#ffffff' }}
                ></div>
                <span className="font-semibold">{PITCH_NAMES[type] || type}</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Count: {stats.count}</div>
                <div>Avg Velo: {stats.avgVelo.toFixed(1)} mph</div>
                <div>H-Break: {stats.avgHBreak.toFixed(1)}"</div>
                <div>V-Break: {stats.avgVBreak.toFixed(1)}"</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400">
          <p className="mb-2"><strong>How to read this chart:</strong></p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Horizontal Break: Movement from catcher's perspective (positive = arm side)</li>
            <li>Induced Vertical Break: Movement fighting gravity (positive = rising)</li>
            <li>Circle with cross (⊕) represents average movement for that pitch type</li>
            <li>Individual dots show variation in pitch movement</li>
          </ul>
        </div>
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-400 py-8">No pitch movement data available</p>
      )}
    </div>
  );
}
