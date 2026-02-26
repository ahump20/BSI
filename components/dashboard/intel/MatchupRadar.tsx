'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from 'recharts';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import type { IntelGame } from '@/lib/intel/types';

interface MatchupRadarProps {
  game: IntelGame;
}

export function MatchupRadar({ game }: MatchupRadarProps) {
  const data = game.radar ?? generateDefaultRadar(game);

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Matchup Radar</span>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span style={{ color: BSI_CHART_COLORS.secondary }}>
            {game.away.abbreviation || 'Away'}
          </span>
          <span style={{ color: BSI_CHART_COLORS.primary }}>
            {game.home.abbreviation || 'Home'}
          </span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#737373', fontSize: 10, fontFamily: 'var(--bsi-font-mono)' }}
            />
            <Radar
              name={game.away.abbreviation || 'Away'}
              dataKey="away"
              stroke={BSI_CHART_COLORS.secondary}
              fill={BSI_CHART_COLORS.secondary}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Radar
              name={game.home.abbreviation || 'Home'}
              dataKey="home"
              stroke={BSI_CHART_COLORS.primary}
              fill={BSI_CHART_COLORS.primary}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <ReTooltip {...tooltipProps} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function generateDefaultRadar(game: IntelGame): Array<{ metric: string; away: number; home: number }> {
  // Generate plausible radar data from score differential
  const diff = game.home.score - game.away.score;
  const base = 70;
  const swing = Math.min(Math.abs(diff) * 2, 20);
  const homeUp = diff > 0;

  return [
    { metric: 'OFF', away: base + (homeUp ? -swing : swing), home: base + (homeUp ? swing : -swing) },
    { metric: 'DEF', away: base + (homeUp ? -swing * 0.8 : swing * 0.8), home: base + (homeUp ? swing * 0.8 : -swing * 0.8) },
    { metric: 'PACE', away: base + 5, home: base - 3 },
    { metric: '3PT', away: base + (homeUp ? -swing * 0.5 : swing * 0.5), home: base + (homeUp ? swing * 0.5 : -swing * 0.5) },
    { metric: 'REB', away: base + 2, home: base + (homeUp ? 6 : -2) },
    { metric: 'AST/TO', away: base + (homeUp ? -3 : 5), home: base + (homeUp ? 8 : -5) },
  ];
}
