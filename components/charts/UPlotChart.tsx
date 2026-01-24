'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Options, AlignedData } from 'uplot';

// BSI Design Tokens
export const BSI_CHART_COLORS = {
  burntOrange: '#BF5700',
  ember: '#FF6B35',
  gold: '#C9A227',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  cream: '#FAF8F5',
  textPrimary: 'rgba(250, 248, 245, 0.9)',
  textSecondary: 'rgba(250, 248, 245, 0.6)',
  textMuted: 'rgba(250, 248, 245, 0.4)',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  axisTick: 'rgba(255, 255, 255, 0.1)',
} as const;

export const SERIES_COLORS = [
  '#BF5700', // Burnt orange
  '#FF6B35', // Ember
  '#C9A227', // Gold
  '#4A90A4', // Teal
  '#8B4513', // Texas soil
  '#6B8E23', // Olive
] as const;

interface UPlotChartProps {
  options: Omit<Options, 'width' | 'height'>;
  data: AlignedData;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Base uPlot wrapper component with BSI styling
 */
export function UPlotChart({
  options,
  data,
  width,
  height = 300,
  className = '',
}: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  const createChart = useCallback(async () => {
    if (!containerRef.current) return;

    // Dynamic import for client-side only
    const uPlot = (await import('uplot')).default;
    await import('uplot/dist/uPlot.min.css');

    const computedWidth = width || containerRef.current.clientWidth || 600;

    const mergedOptions: Options = {
      ...options,
      width: computedWidth,
      height,
    };

    chartRef.current = new uPlot(mergedOptions, data, containerRef.current);
  }, [options, data, width, height]);

  useEffect(() => {
    createChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [createChart]);

  // Update data when it changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setData(data);
    }
  }, [data]);

  // Handle resize
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const handleResize = (): void => {
      if (!chartRef.current || !containerRef.current) return;
      const newWidth = width || containerRef.current.clientWidth;
      chartRef.current.setSize({ width: newWidth, height });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [width, height]);

  return <div ref={containerRef} className={`bsi-chart ${className}`} />;
}

/**
 * Generate default BSI-styled axis configuration
 */
export function getBSIAxes(): Options['axes'] {
  return [
    {
      stroke: BSI_CHART_COLORS.textMuted,
      font: '11px "IBM Plex Mono", monospace',
      grid: {
        stroke: BSI_CHART_COLORS.gridLine,
        width: 1,
      },
      ticks: {
        stroke: BSI_CHART_COLORS.axisTick,
        width: 1,
      },
    },
    {
      stroke: BSI_CHART_COLORS.textMuted,
      font: '11px "IBM Plex Mono", monospace',
      grid: {
        stroke: BSI_CHART_COLORS.gridLine,
        width: 1,
      },
      ticks: {
        stroke: BSI_CHART_COLORS.axisTick,
        width: 1,
      },
    },
  ];
}

export default UPlotChart;
