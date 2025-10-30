/**
 * PieChart & DoughnutChart Components
 *
 * Beautiful circular charts for proportional data visualization.
 * Usage: <PieChart data={myData} />
 */

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { chartDefaults, graphicsTheme, getChartColor } from '@/lib/graphics/theme';
import { useFadeIn } from '@/lib/graphics/hooks';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  animate?: boolean;
  className?: string;
  cutout?: string; // For doughnut effect
}

export function PieChart({
  data,
  title,
  size = 300,
  showLegend = true,
  showPercentages = true,
  animate = true,
  className = '',
}: PieChartProps) {
  const containerRef = useFadeIn({ duration: 300 });

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item, index) => item.color || getChartColor(index)),
        borderColor: graphicsTheme.colors.background.primary,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: true,
    animation: animate ? chartDefaults.animation : false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
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
      tooltip: {
        ...chartDefaults.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return showPercentages
              ? `${label}: ${value} (${percentage}%)`
              : `${label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`pie-chart-container ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <Pie data={chartData} options={options} />
    </div>
  );
}

/**
 * DoughnutChart - Pie chart with center cutout
 */
export function DoughnutChart({
  data,
  title,
  size = 300,
  showLegend = true,
  showPercentages = true,
  animate = true,
  className = '',
  cutout = '60%',
}: PieChartProps) {
  const containerRef = useFadeIn({ duration: 300 });

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item, index) => item.color || getChartColor(index)),
        borderColor: graphicsTheme.colors.background.primary,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    animation: animate ? chartDefaults.animation : false,
    cutout,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
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
      tooltip: {
        ...chartDefaults.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return showPercentages
              ? `${label}: ${value} (${percentage}%)`
              : `${label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`doughnut-chart-container ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

/**
 * DoughnutChartWithCenter - Doughnut with custom center content
 */
export interface DoughnutWithCenterProps extends PieChartProps {
  centerContent?: React.ReactNode;
  centerValue?: string | number;
  centerLabel?: string;
}

export function DoughnutChartWithCenter({
  data,
  title,
  size = 300,
  showLegend = true,
  showPercentages = true,
  animate = true,
  className = '',
  cutout = '70%',
  centerContent,
  centerValue,
  centerLabel,
}: DoughnutWithCenterProps) {
  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      <DoughnutChart
        data={data}
        title={title}
        size={size}
        showLegend={showLegend}
        showPercentages={showPercentages}
        animate={animate}
        className={className}
        cutout={cutout}
      />
      {(centerContent || centerValue) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerContent || (
            <>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: graphicsTheme.colors.text.primary,
                  fontFamily: graphicsTheme.typography.fontFamily.mono,
                }}
              >
                {centerValue}
              </div>
              {centerLabel && (
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: graphicsTheme.colors.text.secondary,
                    marginTop: '0.25rem',
                  }}
                >
                  {centerLabel}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
