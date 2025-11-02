/**
 * LineChart Component
 *
 * Simple, elegant line chart with sensible defaults.
 * Usage: <LineChart data={myData} />
 */

'use client';

import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { chartDefaults, graphicsTheme, getChartColor, hexToRgba } from '@/lib/graphics/theme';
import { useFadeIn } from '@/lib/graphics/hooks';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface LineChartDataset {
  label: string;
  data: number[];
  color?: string;
  fill?: boolean;
}

export interface LineChartProps {
  labels: string[];
  datasets: LineChartDataset[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  fill?: boolean;
  stacked?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  animate?: boolean;
  className?: string;
}

export function LineChart({
  labels,
  datasets,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  smooth = true,
  fill = false,
  stacked = false,
  yAxisLabel,
  xAxisLabel,
  animate = true,
  className = '',
}: LineChartProps) {
  const containerRef = useFadeIn({ duration: 300 });

  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => {
      const color = dataset.color || getChartColor(index);

      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: dataset.fill !== false && fill
          ? hexToRgba(color, 0.1)
          : 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderColor: graphicsTheme.colors.background.primary,
        pointBorderWidth: 2,
        tension: smooth ? 0.4 : 0,
        fill: dataset.fill !== false && fill,
      };
    }),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? chartDefaults.animation : false,
    interaction: chartDefaults.interaction,
    plugins: {
      legend: {
        display: showLegend,
        ...chartDefaults.plugins.legend,
      },
      title: {
        display: !!title,
        text: title || '',
        color: graphicsTheme.colors.text.primary,
        font: {
          size: 16,
          weight: '600',
          family: graphicsTheme.typography.fontFamily.body,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: chartDefaults.plugins.tooltip,
    },
    scales: {
      x: {
        ...chartDefaults.scales.x,
        stacked,
        grid: {
          ...chartDefaults.scales.x.grid,
          display: showGrid,
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel || '',
          color: graphicsTheme.colors.text.secondary,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      y: {
        ...chartDefaults.scales.y,
        stacked,
        grid: {
          ...chartDefaults.scales.y.grid,
          display: showGrid,
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel || '',
          color: graphicsTheme.colors.text.secondary,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`line-chart-container ${className}`}
      style={{ height: `${height}px` }}
    >
      <Line data={chartData} options={options} />
    </div>
  );
}

/**
 * Sparkline - Minimal line chart for inline metrics
 */
export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showTooltip?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  color = graphicsTheme.colors.primary,
  width = 100,
  height = 30,
  showTooltip = true,
  className = '',
}: SparklineProps) {
  const chartData = {
    labels: data.map((_, i) => `${i}`),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: hexToRgba(color, 0.1),
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: color,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: showTooltip,
        ...chartDefaults.plugins.tooltip,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 1.5,
      },
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div
      className={`sparkline-container ${className}`}
      style={{ width: `${width}px`, height: `${height}px`, display: 'inline-block' }}
    >
      <Line data={chartData} options={options} />
    </div>
  );
}
