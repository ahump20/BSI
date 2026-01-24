'use client';

import { useMemo } from 'react';
import { UPlotChart, BSI_CHART_COLORS, getBSIAxes } from './UPlotChart';
import type { Options, AlignedData } from 'uplot';

interface WinProbabilityChartProps {
  /** Array of timestamps (Unix seconds or play numbers) */
  timestamps: number[];
  /** Home team win probability (0-1) */
  homeProbability: number[];
  /** Away team win probability (0-1) - computed if not provided */
  awayProbability?: number[];
  /** Home team name for legend */
  homeTeam?: string;
  /** Away team name for legend */
  awayTeam?: string;
  /** Home team color (defaults to burnt orange) */
  homeColor?: string;
  /** Away team color (defaults to gold) */
  awayColor?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Win Probability Chart - specialized line chart for game win probability
 *
 * @example
 * <WinProbabilityChart
 *   timestamps={[0, 1, 2, 3, 4]}
 *   homeProbability={[0.5, 0.55, 0.62, 0.58, 0.71]}
 *   homeTeam="Texas"
 *   awayTeam="Arkansas"
 * />
 */
export function WinProbabilityChart({
  timestamps,
  homeProbability,
  awayProbability,
  homeTeam = 'Home',
  awayTeam = 'Away',
  homeColor = BSI_CHART_COLORS.burntOrange,
  awayColor = BSI_CHART_COLORS.gold,
  height = 200,
  className = '',
}: WinProbabilityChartProps) {
  // Compute away probability if not provided
  const computedAwayProb = useMemo(() => {
    if (awayProbability) return awayProbability;
    return homeProbability.map((p) => 1 - p);
  }, [homeProbability, awayProbability]);

  const data: AlignedData = useMemo(
    () => [timestamps, homeProbability, computedAwayProb],
    [timestamps, homeProbability, computedAwayProb]
  );

  const options: Omit<Options, 'width' | 'height'> = useMemo(
    () => ({
      series: [
        {},
        {
          label: homeTeam,
          stroke: homeColor,
          width: 2,
          fill: `${homeColor}20`,
          points: { show: false },
        },
        {
          label: awayTeam,
          stroke: awayColor,
          width: 2,
          fill: `${awayColor}20`,
          points: { show: false },
        },
      ],
      axes: [
        {
          ...getBSIAxes()?.[0],
          grid: { show: false },
        },
        {
          stroke: BSI_CHART_COLORS.textMuted,
          font: '11px "IBM Plex Mono", monospace',
          values: (_u: uPlot, vals: number[]) => vals.map((v) => `${(v * 100).toFixed(0)}%`),
          grid: {
            stroke: BSI_CHART_COLORS.gridLine,
            width: 1,
          },
        },
      ],
      scales: {
        y: { min: 0, max: 1 },
      },
      cursor: {
        show: true,
        drag: { x: true, y: false },
      },
      legend: {
        show: true,
      },
    }),
    [homeTeam, awayTeam, homeColor, awayColor]
  );

  return (
    <div className={`win-probability-chart ${className}`}>
      <UPlotChart options={options} data={data} height={height} />
    </div>
  );
}

export default WinProbabilityChart;
