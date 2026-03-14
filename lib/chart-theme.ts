/**
 * BSI Recharts Theme — consistent chart styling across all pages.
 * Import and spread these props onto Recharts components.
 */

export const BSI_CHART_COLORS = {
  primary: '#BF5700', // token: --bsi-primary
  secondary: '#FDB913',
  tertiary: '#5CC8FF',
  success: '#10b981',
  error: '#ef4444',
  grid: 'rgba(148, 163, 184, 0.12)',
  axis: 'var(--chart-axis-text, rgba(245, 240, 235, 0.52))', // Heritage: --bsi-text-dim
  label: 'var(--chart-label, #A89F95)', // Heritage: --bsi-text-muted
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
  tick: { fill: BSI_CHART_COLORS.label, fontSize: 11, fontFamily: 'var(--bsi-font-mono)' },
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
    borderRadius: '2px',
    backdropFilter: 'blur(12px)',
    color: '#fafafa',
    fontSize: '0.75rem',
    fontFamily: 'var(--bsi-font-mono)',
    padding: '0.5rem 0.75rem',
  },
  cursor: { stroke: 'rgba(255, 255, 255, 0.1)' },
} as const;

// ---------------------------------------------------------------------------
// Savant dark-mode chart overrides
// Used by scatter plots and charts inside .savant-theme pages
// ---------------------------------------------------------------------------

export const SAVANT_CHART_COLORS = {
  bg: 'var(--svt-card, #181c26)',
  grid: 'var(--svt-border, rgba(36, 42, 56, 0.5))',
  axis: 'var(--svt-text-muted, #8890a4)',
  label: 'var(--svt-text-dim, #555d73)',
  accent: 'var(--svt-accent, #e85d26)',
  tooltipBg: 'var(--svt-surface, #12151c)',
  tooltipBorder: 'var(--svt-border, #242a38)',
  // Quadrant colors for plate discipline / scatter plots
  quadrantGreen: 'rgba(34, 197, 94, 0.04)',
  quadrantRed: 'rgba(239, 68, 68, 0.04)',
  quadrantYellow: 'rgba(234, 179, 8, 0.03)',
  quadrantGray: 'rgba(136, 144, 164, 0.02)',
} as const;

export const savantXAxisProps = {
  stroke: SAVANT_CHART_COLORS.axis,
  tick: { fill: SAVANT_CHART_COLORS.axis, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  axisLine: { stroke: SAVANT_CHART_COLORS.grid },
  tickLine: false,
} as const;

export const savantYAxisProps = {
  stroke: SAVANT_CHART_COLORS.axis,
  tick: { fill: SAVANT_CHART_COLORS.label, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  axisLine: false,
  tickLine: false,
} as const;

export const savantCartesianGridProps = {
  strokeDasharray: '4 4',
  stroke: SAVANT_CHART_COLORS.grid,
  vertical: false,
} as const;

export const savantTooltipProps = {
  contentStyle: {
    background: SAVANT_CHART_COLORS.tooltipBg,
    border: `1px solid ${SAVANT_CHART_COLORS.tooltipBorder}`,
    borderRadius: '6px',
    backdropFilter: 'blur(12px)',
    color: '#e8eaf0',
    fontSize: '0.75rem',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '0.5rem 0.75rem',
  },
  cursor: { stroke: 'rgba(232, 93, 38, 0.2)' },
} as const;
