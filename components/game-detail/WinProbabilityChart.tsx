'use client';

import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface WinProbabilityChartProps {
  data: {
    timestamp: number;
    homeWinProbability: number;
    description?: string;
  }[];
  homeTeam: string;
  awayTeam: string;
  sport: string;
}

export function WinProbabilityChart({ data, homeTeam, awayTeam, sport }: WinProbabilityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isBaseball = sport === 'mlb' || sport === 'cbb' || sport === 'college-baseball';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(191, 87, 0, 0.1)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight * (1 - y));
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight * (1 - y));
      ctx.stroke();
    });

    // Draw 50% baseline
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight * 0.5);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [100, 75, 50, 25, 0].forEach((val, i) => {
      const y = padding.top + (i / 4) * chartHeight;
      ctx.fillText(`${val}%`, padding.left - 8, y);
    });

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xLabels = isBaseball
      ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'F']
      : ['Q1', 'Q2', 'Q3', 'Q4', 'F'];
    xLabels.forEach((label, i) => {
      const x = padding.left + (i / (xLabels.length - 1)) * chartWidth;
      ctx.fillText(label, x, height - padding.bottom + 8);
    });

    // Draw area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0)');
    gradient.addColorStop(0.5, 'rgba(201, 162, 39, 0)');
    gradient.addColorStop(1, 'rgba(201, 162, 39, 0.4)');

    if (data.length > 0) {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);

      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding.top + (1 - point.homeWinProbability) * chartHeight;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw probability line
      ctx.beginPath();
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding.top + (1 - point.homeWinProbability) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw key moment dots
      const keyMoments = data.filter((d, i, arr) => {
        if (i === 0 || i === arr.length - 1) return true;
        const prevDiff = Math.abs(d.homeWinProbability - arr[i - 1].homeWinProbability);
        return prevDiff > 0.1;
      });

      keyMoments.forEach((point) => {
        const i = data.indexOf(point);
        const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding.top + (1 - point.homeWinProbability) * chartHeight;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ff6b35';
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [data, isBaseball]);

  const currentProb = data.length > 0 ? data[data.length - 1].homeWinProbability : 0.5;
  const homePercent = Math.round(currentProb * 100);
  const awayPercent = 100 - homePercent;

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-burnt-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          Win Probability
        </CardTitle>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-text-tertiary">{homeTeam}</p>
              <p className="text-lg font-bold text-burnt-orange">{homePercent}%</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-text-tertiary">{awayTeam}</p>
              <p className="text-lg font-bold text-gold">{awayPercent}%</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative h-[250px] bg-bg-secondary/50 rounded-lg border border-border-subtle">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-text-tertiary text-sm">Win probability data not available</p>
            </div>
          )}
        </div>

        {/* Key Plays Legend */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
              Key Moments
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data
                .filter((d, i, arr) => {
                  if (i === 0) return false;
                  const prevDiff = Math.abs(d.homeWinProbability - arr[i - 1].homeWinProbability);
                  return prevDiff > 0.1 && d.description;
                })
                .slice(-5)
                .map((moment, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div
                      className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        moment.homeWinProbability > 0.5 ? 'bg-burnt-orange' : 'bg-gold'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{moment.description}</p>
                      <p className="text-xs text-text-tertiary">
                        {homeTeam}: {Math.round(moment.homeWinProbability * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
