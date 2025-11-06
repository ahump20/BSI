'use client';

import { useEffect, useRef } from 'react';

interface SprayChartProps {
  data: Array<{
    hit_x: number;
    hit_y: number;
    exit_velocity?: number;
    launch_angle?: number;
    hit_type?: string;
    outcome?: string;
  }>;
  width?: number;
  height?: number;
}

export default function SprayChart({ data, width = 600, height = 600 }: SprayChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw field
    drawBaseballField(ctx, width, height);

    // Draw hits
    drawHits(ctx, data, width, height);
  }, [data, width, height]);

  const drawBaseballField = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const centerX = w / 2;
    const centerY = h - 50;

    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw infield
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Home plate to bases (diamond)
    const baseDistance = Math.min(w, h) * 0.25;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY); // Home
    ctx.lineTo(centerX + baseDistance, centerY - baseDistance); // First
    ctx.lineTo(centerX, centerY - baseDistance * 2); // Second
    ctx.lineTo(centerX - baseDistance, centerY - baseDistance); // Third
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Draw outfield arc
    const outfieldRadius = Math.min(w, h) * 0.45;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outfieldRadius, Math.PI, 0, false);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw foul lines
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(20, 20);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(w - 20, 20);
    ctx.stroke();

    // Draw bases
    const baseSize = 8;
    const bases = [
      { x: centerX, y: centerY, label: 'H' }, // Home
      { x: centerX + baseDistance, y: centerY - baseDistance, label: '1B' }, // First
      { x: centerX, y: centerY - baseDistance * 2, label: '2B' }, // Second
      { x: centerX - baseDistance, y: centerY - baseDistance, label: '3B' }, // Third
    ];

    bases.forEach(base => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(base.x - baseSize / 2, base.y - baseSize / 2, baseSize, baseSize);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(base.label, base.x + 10, base.y + 5);
    });

    // Add field labels
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LF', centerX - w * 0.25, h * 0.25);
    ctx.fillText('CF', centerX, h * 0.15);
    ctx.fillText('RF', centerX + w * 0.25, h * 0.25);
  };

  const drawHits = (
    ctx: CanvasRenderingContext2D,
    hits: SprayChartProps['data'],
    w: number,
    h: number
  ) => {
    const centerX = w / 2;
    const centerY = h - 50;

    hits.forEach(hit => {
      // Convert hit coordinates to canvas coordinates
      // Assuming hit_x and hit_y are in feet, scale appropriately
      const scale = Math.min(w, h) / 500;
      const x = centerX + hit.hit_x * scale;
      const y = centerY - hit.hit_y * scale;

      // Determine color based on outcome
      let color = '#ffffff';
      if (hit.outcome) {
        if (hit.outcome.toLowerCase().includes('home_run')) {
          color = '#ef4444'; // Red for home runs
        } else if (hit.outcome.toLowerCase().includes('double') || hit.outcome.toLowerCase().includes('triple')) {
          color = '#f97316'; // Orange for extra base hits
        } else if (hit.outcome.toLowerCase().includes('single')) {
          color = '#22c55e'; // Green for singles
        } else if (hit.outcome.toLowerCase().includes('out')) {
          color = '#6b7280'; // Gray for outs
        }
      }

      // Determine size based on exit velocity
      let size = 5;
      if (hit.exit_velocity) {
        if (hit.exit_velocity >= 100) size = 8;
        else if (hit.exit_velocity >= 95) size = 6;
      }

      // Draw hit marker
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Add glow effect for hard hits
      if (hit.exit_velocity && hit.exit_velocity >= 100) {
        ctx.beginPath();
        ctx.arc(x, y, size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Spray Chart</h3>

      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="mx-auto border border-gray-700 rounded"
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Home Run</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span>Extra Base</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Single</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
          <span>Out</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-red-500"></div>
          <span>100+ mph</span>
        </div>
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-400 py-8">No spray chart data available</p>
      )}
    </div>
  );
}
