'use client';

import { useMemo } from 'react';
import { UPlotChart, BSI_CHART_COLORS } from './UPlotChart';
import type { Options, AlignedData } from 'uplot';

interface SparklineProps {
  /** Array of values to display */
  data: number[];
  /** Line color (defaults to burnt orange) */
  color?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Show area fill under line */
  fill?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sparkline - minimal inline chart for compact data visualization
 *
 * @example
 * <Sparkline data={[12, 15, 8, 22, 18, 25]} />
 * <Sparkline data={stats} color="#4A90A4" height={24} />
 */
export function Sparkline({
  data,
  color = BSI_CHART_COLORS.burntOrange,
  width,
  height = 30,
  fill = true,
  className = '',
}: SparklineProps): JSX.Element {
  // Generate x values as indices
  const chartData: AlignedData = useMemo(() => [data.map((_, i) => i), data], [data]);

  const options: Omit<Options, 'width' | 'height'> = useMemo(
    () => ({
      series: [
        {},
        {
          stroke: color,
          width: 1.5,
          fill: fill ? `${color}20` : undefined,
          points: { show: false },
        },
      ],
      axes: [{ show: false }, { show: false }],
      legend: { show: false },
      cursor: { show: false },
      padding: [0, 0, 0, 0],
    }),
    [color, fill]
  );

  return (
    <div
      className={`sparkline inline-block ${className}`}
      style={{ width: width || '100%', height }}
    >
      <UPlotChart options={options} data={chartData} width={width} height={height} />
    </div>
  );
}

export default Sparkline;
