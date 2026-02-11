/**
 * BSI Recharts Theme — consistent chart styling across all pages.
 * Import and spread these props onto Recharts components.
 */

export const BSI_CHART_COLORS = {
  primary: '#BF5700',
  secondary: '#FDB913',
  tertiary: '#5CC8FF',
  success: '#10b981',
  error: '#ef4444',
  grid: 'rgba(148, 163, 184, 0.12)',
  axis: '#737373',
  tooltipBg: '#12141C',
  tooltipBorder: 'rgba(255, 255, 255, 0.12)',
} as const;

export const BSI_CHART_PALETTE = [
  BSI_CHART_COLORS.primary,
  BSI_CHART_COLORS.secondary,
  BSI_CHART_COLORS.tertiary,
  BSI_CHART_COLORS.success,
  '#8b5cf6',
  '#ec4899',
];

export const xAxisProps = {
  stroke: BSI_CHART_COLORS.axis,
  tick: { fill: BSI_CHART_COLORS.axis, fontSize: 11, fontFamily: 'var(--bsi-font-mono)' },
  axisLine: { stroke: BSI_CHART_COLORS.grid },
  tickLine: false,
} as const;

export const yAxisProps = {
  stroke: BSI_CHART_COLORS.axis,
  tick: { fill: BSI_CHART_COLORS.axis, fontSize: 11, fontFamily: 'var(--bsi-font-mono)' },
  axisLine: false,
  tickLine: false,
} as const;

export const cartesianGridProps = {
  strokeDasharray: '3 3',
  stroke: BSI_CHART_COLORS.grid,
  vertical: false,
} as const;

export const tooltipProps = {
  contentStyle: {
    background: BSI_CHART_COLORS.tooltipBg,
    border: `1px solid ${BSI_CHART_COLORS.tooltipBorder}`,
    borderRadius: '0.75rem',
    backdropFilter: 'blur(12px)',
    color: '#fafafa',
    fontSize: '0.75rem',
    fontFamily: 'var(--bsi-font-mono)',
    padding: '0.5rem 0.75rem',
  },
  cursor: { stroke: 'rgba(255, 255, 255, 0.1)' },
} as const;
