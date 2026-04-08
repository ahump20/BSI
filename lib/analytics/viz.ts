/**
 * Shared D3 visualization utilities.
 * Ported from BSI Labs — axis factories, conference colors, tooltip positioning,
 * scale helpers, percentile computation, z-score normalization.
 * Every scatter/heatmap/bubble/radar component imports from here.
 */
import * as d3 from 'd3'

// ---------------------------------------------------------------------------
// Conference Colors — used for scatter dot fills & legend
// ---------------------------------------------------------------------------

export const CONF_COLORS: Record<string, string> = {
  SEC: '#BF5700',
  'Big 12': '#D4722A',
  ACC: '#5b9bd5',
  'Big Ten': '#2980b9',
  'Pac-12': '#6B8E23',
  AAC: '#c0392b',
  'Sun Belt': '#F59E0B',
  'C-USA': '#aaaaaa',
  MWC: '#e74c3c',
  MAC: '#8B4513',
  WCC: '#10B981',
  MVC: '#9b59b6',
  Colonial: '#34495e',
  'Big East': '#e67e22',
  'A-10': '#1abc9c',
  Southern: '#7f8c8d',
  Independents: '#555555',
  SWAC: '#d35400',
  MEAC: '#2c3e50',
  'Big South': '#c0392b',
  OVC: '#16a085',
  Horizon: '#8e44ad',
  Summit: '#27ae60',
  Patriot: '#2c3e50',
  'America East': '#e74c3c',
  NEC: '#7f8c8d',
  WAC: '#f39c12',
  ASUN: '#3498db',
  'Big West': '#1abc9c',
  CAA: '#34495e',
  Southland: '#d35400',
  'Missouri Valley': '#9b59b6',
}

export function getConfColor(conf: string): string {
  return CONF_COLORS[conf] ?? '#666666'
}

// ---------------------------------------------------------------------------
// Axis Styling — applies BSI dark Heritage aesthetic to D3 axes
// ---------------------------------------------------------------------------

export function styleAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  options?: { tickColor?: string },
) {
  const tickColor = options?.tickColor ?? 'var(--bsi-text-muted)'
  g.selectAll('text')
    .attr('fill', tickColor)
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '10px')
  g.selectAll('line').attr('stroke', 'rgba(196,184,165,0.08)')
  g.select('.domain').attr('stroke', 'rgba(196,184,165,0.08)')
}

export function drawGridLines(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  xTicks: number[],
  yTicks: number[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  innerW: number,
  innerH: number,
) {
  for (const t of xTicks) {
    g.append('line')
      .attr('x1', xScale(t)).attr('x2', xScale(t))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(196,184,165,0.04)')
  }
  for (const t of yTicks) {
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(t)).attr('y2', yScale(t))
      .attr('stroke', 'rgba(196,184,165,0.04)')
  }
}

// ---------------------------------------------------------------------------
// Axis Label — centered, uppercase, spaced
// ---------------------------------------------------------------------------

export function drawAxisLabel(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  x: number,
  y: number,
  rotation?: number,
) {
  const label = g.append('text')
    .attr('fill', 'var(--bsi-text-muted)')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '11px')
    .attr('text-anchor', 'middle')
    .attr('letter-spacing', '0.08em')
    .text(text)

  if (rotation) {
    label.attr('transform', `translate(${x},${y}) rotate(${rotation})`)
  } else {
    label.attr('x', x).attr('y', y)
  }
}

// ---------------------------------------------------------------------------
// Zone Labels — faint quadrant/region text
// ---------------------------------------------------------------------------

export function drawZoneLabel(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  x: number,
  y: number,
  options?: { anchor?: string; color?: string },
) {
  g.append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('fill', options?.color ?? 'rgba(196,184,165,0.15)')
    .attr('font-family', 'var(--font-display)')
    .attr('font-size', '9px')
    .attr('letter-spacing', '0.12em')
    .attr('text-anchor', options?.anchor ?? 'start')
    .text(text)
}

// ---------------------------------------------------------------------------
// Tooltip Positioning — keeps tooltip inside container bounds
// ---------------------------------------------------------------------------

export function tooltipPosition(
  mouseX: number,
  containerWidth: number,
): { left: number; transform: string } {
  const flipThreshold = containerWidth / 2
  return {
    left: mouseX + 12,
    transform: mouseX > flipThreshold ? 'translateX(-110%)' : 'none',
  }
}

// ---------------------------------------------------------------------------
// Chart Margins — standard for scatter/bubble
// ---------------------------------------------------------------------------

export const CHART_MARGINS = { top: 24, right: 24, bottom: 48, left: 56 } as const

export function innerDimensions(
  width: number,
  height: number,
  margins = CHART_MARGINS,
) {
  return {
    innerW: width - margins.left - margins.right,
    innerH: height - margins.top - margins.bottom,
  }
}

// ---------------------------------------------------------------------------
// Percentile Computation
// ---------------------------------------------------------------------------

export function computePercentile(
  value: number,
  allValues: number[],
  higherIsBetter = true,
): number {
  if (!isFinite(value) || allValues.length === 0) return 50
  const below = allValues.filter((v) => v < value).length
  const equal = allValues.filter((v) => v === value).length
  const raw = ((below + equal * 0.5) / allValues.length) * 100
  return higherIsBetter ? raw : 100 - raw
}

// ---------------------------------------------------------------------------
// Z-Score Normalization — for multi-stat distance computation
// ---------------------------------------------------------------------------

export function zScore(value: number, allValues: number[]): number {
  const n = allValues.length
  if (n === 0) return 0
  const mean = allValues.reduce((a, b) => a + b, 0) / n
  const variance = allValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
  const sd = Math.sqrt(variance)
  return sd === 0 ? 0 : (value - mean) / sd
}

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

export function withAlpha(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`
}

export function getPercentileColor(pct: number, higherIsBetter = true): string {
  const effective = higherIsBetter ? pct : 100 - pct
  if (effective >= 90) return '#c0392b'
  if (effective >= 75) return '#e74c3c'
  if (effective >= 60) return '#d4775c'
  if (effective >= 40) return '#aaaaaa'
  if (effective >= 25) return '#5b9bd5'
  if (effective >= 10) return '#2980b9'
  return '#1a5276'
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

const ok = (v: number): boolean => v != null && isFinite(v)

/** .345 format — leading zero stripped */
export const fmt3 = (v: number): string => ok(v) ? v.toFixed(3).replace(/^0/, '') : '--'

/** 3.45 format */
export const fmt2 = (v: number): string => ok(v) ? v.toFixed(2) : '--'

/** 3.5 format */
export const fmt1 = (v: number): string => ok(v) ? v.toFixed(1) : '--'

/** 34.5% format */
export const fmtPct = (v: number): string => ok(v) ? `${(v * 100).toFixed(1)}%` : '--'

/** Rounded integer */
export const fmtInt = (v: number): string => ok(v) ? String(Math.round(v)) : '--'
