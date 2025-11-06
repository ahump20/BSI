'use client';

import { useEffect, useRef } from 'react';

interface VelocityData {
  pitch_type: string;
  velocity: number;
}

interface VelocityDistributionProps {
  data: VelocityData[];
  width?: number;
  height?: number;
}

const PITCH_COLORS: Record<string, string> = {
  'FF': '#ef4444',
  'SI': '#f97316',
  'FC': '#f59e0b',
  'SL': '#3b82f6',
  'CU': '#8b5cf6',
  'CH': '#10b981',
  'FS': '#06b6d4',
  'KN': '#ec4899',
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

export default function VelocityDistribution({ data, width = 800, height = 400 }: VelocityDistributionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw histogram
    drawHistogram(ctx, data, width, height);
  }, [data, width, height]);

  const drawHistogram = (
    ctx: CanvasRenderingContext2D,
    velocities: VelocityData[],
    w: number,
    h: number
  ) => {
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = w - padding.left - padding.right;
    const chartHeight = h - padding.top - padding.bottom;

    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Group data by pitch type
    const pitchGroups: Record<string, number[]> = {};
    velocities.forEach(v => {
      if (!pitchGroups[v.pitch_type]) {
        pitchGroups[v.pitch_type] = [];
      }
      pitchGroups[v.pitch_type].push(v.velocity);
    });

    // Find overall min/max velocity
    const allVelocities = velocities.map(v => v.velocity);
    const minVelo = Math.floor(Math.min(...allVelocities) / 5) * 5;
    const maxVelo = Math.ceil(Math.max(...allVelocities) / 5) * 5;

    // Create bins (1 mph increments)
    const binSize = 1;
    const numBins = Math.ceil((maxVelo - minVelo) / binSize);

    // Draw axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;

    // Vertical grid lines (every 5 mph)
    for (let v = minVelo; v <= maxVelo; v += 5) {
      const x = padding.left + ((v - minVelo) / (maxVelo - minVelo)) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
    }

    // Draw histogram bars for each pitch type
    const pitchTypes = Object.keys(pitchGroups).sort();
    const barWidth = chartWidth / numBins;
    const groupSpacing = barWidth / (pitchTypes.length + 1);

    pitchTypes.forEach((pitchType, typeIndex) => {
      const velos = pitchGroups[pitchType];
      const color = PITCH_COLORS[pitchType] || '#ffffff';

      // Create histogram bins
      const bins = new Array(numBins).fill(0);
      velos.forEach(v => {
        const binIndex = Math.floor((v - minVelo) / binSize);
        if (binIndex >= 0 && binIndex < numBins) {
          bins[binIndex]++;
        }
      });

      const maxCount = Math.max(...bins);

      // Draw bars
      bins.forEach((count, binIndex) => {
        if (count === 0) return;

        const x = padding.left + (binIndex * barWidth) + (typeIndex * groupSpacing);
        const barHeight = (count / maxCount) * chartHeight * 0.8;
        const y = h - padding.bottom - barHeight;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, groupSpacing, barHeight);

        // Add outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, groupSpacing, barHeight);
      });
    });

    // Draw X-axis labels (velocity)
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    for (let v = minVelo; v <= maxVelo; v += 5) {
      const x = padding.left + ((v - minVelo) / (maxVelo - minVelo)) * chartWidth;
      ctx.fillText(`${v}`, x, h - padding.bottom + 20);
    }

    // X-axis label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Velocity (mph)', w / 2, h - 20);

    // Y-axis label
    ctx.save();
    ctx.translate(20, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency', 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Velocity Distribution by Pitch Type', w / 2, 25);
  };

  // Calculate statistics
  const pitchStats = data.reduce((acc, pitch) => {
    if (!acc[pitch.pitch_type]) {
      acc[pitch.pitch_type] = {
        count: 0,
        velocities: [],
      };
    }
    acc[pitch.pitch_type].count++;
    acc[pitch.pitch_type].velocities.push(pitch.velocity);
    return acc;
  }, {} as Record<string, { count: number; velocities: number[] }>);

  const stats = Object.entries(pitchStats).map(([type, data]) => {
    const sorted = [...data.velocities].sort((a, b) => a - b);
    return {
      type,
      count: data.count,
      min: Math.min(...data.velocities),
      max: Math.max(...data.velocities),
      avg: data.velocities.reduce((a, b) => a + b, 0) / data.count,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  });

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Velocity Distribution</h3>

      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="mx-auto border border-gray-700 rounded"
        />
      </div>

      {/* Statistics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Pitch Type</th>
              <th className="px-4 py-2 text-center">Count</th>
              <th className="px-4 py-2 text-center">Min</th>
              <th className="px-4 py-2 text-center">Avg</th>
              <th className="px-4 py-2 text-center">Median</th>
              <th className="px-4 py-2 text-center">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {stats.map(stat => (
              <tr key={stat.type} className="hover:bg-gray-800">
                <td className="px-4 py-2 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: PITCH_COLORS[stat.type] || '#ffffff' }}
                  ></div>
                  <span className="font-semibold">{PITCH_NAMES[stat.type] || stat.type}</span>
                </td>
                <td className="px-4 py-2 text-center">{stat.count}</td>
                <td className="px-4 py-2 text-center">{stat.min.toFixed(1)}</td>
                <td className="px-4 py-2 text-center font-semibold text-orange-500">
                  {stat.avg.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-center">{stat.median.toFixed(1)}</td>
                <td className="px-4 py-2 text-center">{stat.max.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-400 py-8">No velocity data available</p>
      )}
    </div>
  );
}
