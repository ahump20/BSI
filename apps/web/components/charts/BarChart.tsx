/**
 * BarChart Component
 *
 * Simple, elegant bar chart with sensible defaults.
 * Usage: <BarChart data={myData} />
 */

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { chartDefaults, graphicsTheme, getChartColor, hexToRgba } from '@/lib/graphics/theme';
import { useFadeIn } from '@/lib/graphics/hooks';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface BarChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface BarChartProps {
  labels: string[];
  datasets: BarChartDataset[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  animate?: boolean;
  className?: string;
}

export function BarChart({
  labels,
  datasets,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  horizontal = false,
  stacked = false,
  yAxisLabel,
  xAxisLabel,
  animate = true,
  className = '',
}: BarChartProps) {
  const containerRef = useFadeIn({ duration: 300 });

  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => {
      const color = dataset.color || getChartColor(index);

      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: hexToRgba(color, 0.8),
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: color,
      };
    }),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
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
          display: horizontal ? showGrid : false,
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
          display: horizontal ? false : showGrid,
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
      className={`bar-chart-container ${className}`}
      style={{ height: `${height}px` }}
    >
      <Bar data={chartData} options={options} />
    </div>
  );
}

/**
 * SimpleBarChart - Even simpler version with just data array
 */
export interface SimpleBarChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  title?: string;
  className?: string;
}

export function SimpleBarChart({
  data,
  labels,
  color = graphicsTheme.colors.primary,
  height = 200,
  title,
  className = '',
}: SimpleBarChartProps) {
  const chartLabels = labels || data.map((_, i) => `${i + 1}`);

  return (
    <BarChart
      labels={chartLabels}
      datasets={[
        {
          label: title || 'Data',
          data,
          color,
        },
      ]}
      height={height}
      title={title}
      showLegend={false}
      className={className}
    />
  );
}
