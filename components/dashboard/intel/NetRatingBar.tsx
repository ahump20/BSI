'use client';

import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BSI_CHART_COLORS, tooltipProps, cartesianGridProps } from '@/lib/chart-theme';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { StandingsTeam } from '@/lib/intel/types';

interface NetRatingBarProps {
  standings: StandingsTeam[];
}

export function NetRatingBar({ standings }: NetRatingBarProps) {
  // Compute synthetic net rating from win percentage
  const data = standings.slice(0, 8).map((t) => {
    const pct = t.winPct ?? t.wins / Math.max(t.wins + t.losses, 1);
    const netRtg = t.netRating ?? Math.round((pct - 0.5) * 30 * 10) / 10;
    const shortName = t.teamName.split(' ').pop() || t.teamName;
    return {
      name: t.abbreviation || shortName,
      rating: netRtg,
      wins: t.wins,
      losses: t.losses,
    };
  }).sort((a, b) => b.rating - a.rating);

  if (data.length === 0) return null;

  return (
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" style={{ color: 'var(--bsi-gold, #FDB913)' }} />
            Net Rating
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            Top {data.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid {...cartesianGridProps} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#737373', fontSize: 10, fontFamily: 'var(--bsi-font-mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#a3a3a3', fontSize: 11, fontFamily: 'var(--bsi-font-mono)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <ReTooltip {...tooltipProps} />
              <defs>
                <linearGradient id="netRtgGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BSI_CHART_COLORS.primary} />
                  <stop offset="100%" stopColor={BSI_CHART_COLORS.secondary} />
                </linearGradient>
              </defs>
              <Bar
                dataKey="rating"
                name="Net Rtg"
                fill="url(#netRtgGrad)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
