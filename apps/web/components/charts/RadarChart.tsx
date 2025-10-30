/**
 * RadarChart Component
 *
 * Multi-dimensional data visualization for comparing metrics.
 * Perfect for player stats, team performance analysis.
 * Usage: <RadarChart data={playerStats} />
 */

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { chartDefaults, graphicsTheme, getChartColor, hexToRgba } from '@/lib/graphics/theme';
import { useFadeIn } from '@/lib/graphics/hooks';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface RadarChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface RadarChartProps {
  labels: string[];
  datasets: RadarChartDataset[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  fill?: boolean;
  animate?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function RadarChart({
  labels,
  datasets,
  title,
  size = 400,
  showLegend = true,
  fill = true,
  animate = true,
  min = 0,
  max,
  className = '',
}: RadarChartProps) {
  const containerRef = useFadeIn({ duration: 300 });

  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => {
      const color = dataset.color || getChartColor(index);

      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: fill ? hexToRgba(color, 0.2) : 'transparent',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: graphicsTheme.colors.background.primary,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: graphicsTheme.colors.background.primary,
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 3,
      };
    }),
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    animation: animate ? chartDefaults.animation : false,
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
      r: {
        min,
        max,
        ticks: {
          color: graphicsTheme.colors.text.secondary,
          backdropColor: 'transparent',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        pointLabels: {
          color: graphicsTheme.colors.text.primary,
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
      className={`radar-chart-container ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <Radar data={chartData} options={options} />
    </div>
  );
}

/**
 * PlayerComparisonRadar - Specialized radar for player stat comparisons
 */
export interface PlayerStats {
  name: string;
  speed: number;
  power: number;
  accuracy: number;
  defense: number;
  stamina: number;
  color?: string;
}

export interface PlayerComparisonProps {
  players: PlayerStats[];
  title?: string;
  size?: number;
  className?: string;
}

export function PlayerComparisonRadar({
  players,
  title = 'Player Comparison',
  size = 400,
  className = '',
}: PlayerComparisonProps) {
  const labels = ['Speed', 'Power', 'Accuracy', 'Defense', 'Stamina'];

  const datasets = players.map((player) => ({
    label: player.name,
    data: [player.speed, player.power, player.accuracy, player.defense, player.stamina],
    color: player.color,
  }));

  return (
    <RadarChart
      labels={labels}
      datasets={datasets}
      title={title}
      size={size}
      max={100}
      className={className}
    />
  );
}
