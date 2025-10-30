/**
 * AreaChart Component
 *
 * Line charts with filled areas for trend visualization.
 * Perfect for showing cumulative data and comparisons over time.
 * Usage: <AreaChart data={trendData} />
 */

'use client';

import React from 'react';
import { LineChart, LineChartProps } from './LineChart';

/**
 * AreaChart - Line chart with filled area
 * Uses LineChart component with fill enabled
 */
export interface AreaChartProps extends Omit<LineChartProps, 'fill'> {
  gradient?: boolean;
}

export function AreaChart({ gradient = false, ...props }: AreaChartProps) {
  return <LineChart {...props} fill={true} smooth={true} />;
}

/**
 * StackedAreaChart - Multiple areas stacked on top of each other
 */
export interface StackedAreaChartProps extends Omit<LineChartProps, 'fill' | 'stacked'> {}

export function StackedAreaChart(props: StackedAreaChartProps) {
  return <LineChart {...props} fill={true} stacked={true} smooth={true} />;
}
