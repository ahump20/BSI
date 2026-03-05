'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { getPercentileColor } from './PercentileBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConferenceHeatmapRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

interface ConferenceHeatmapProps {
  data: ConferenceHeatmapRow[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Metric columns
// ---------------------------------------------------------------------------

const METRICS = [
  { key: 'strength_index', label: 'STR', higherIsBetter: true, format: (v: number) => v.toFixed(0) },
  { key: 'avg_era', label: 'ERA', higherIsBetter: false, format: (v: number) => v.toFixed(2) },
  { key: 'avg_woba', label: 'wOBA', higherIsBetter: true, format: (v: number) => v.toFixed(3) },
  { key: 'avg_ops', label: 'OPS', higherIsBetter: true, format: (v: number) => v.toFixed(3) },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConferenceHeatmap({
  data,
  className = '',
}: ConferenceHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    conf: string;
    metric: string;
    value: number;
    percentile: number;
  } | null>(null);

  // Sort by strength index
  const sorted = [...data].sort((a, b) => b.strength_index - a.strength_index);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node() || !containerRef.current) return;

    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const rowHeight = 32;
    const headerHeight = 40;
    const labelWidth = 100;
    const cellPad = 2;
    const totalHeight = headerHeight + sorted.length * rowHeight + 12;

    svg.attr('height', totalHeight);

    const g = svg.append('g');

    const cellWidth = (width - labelWidth - 24) / METRICS.length;

    // Compute percentiles per metric
    const percentileMaps: Record<string, Map<string, number>> = {};
    for (const metric of METRICS) {
      const vals = sorted.map(d => d[metric.key as keyof ConferenceHeatmapRow] as number);
      const sortedVals = [...vals].sort((a, b) => a - b);
      const map = new Map<string, number>();
      for (const row of sorted) {
        const v = row[metric.key as keyof ConferenceHeatmapRow] as number;
        const below = sortedVals.filter(sv => sv < v).length;
        const pctl = sortedVals.length > 1 ? (below / (sortedVals.length - 1)) * 100 : 50;
        map.set(row.conference, pctl);
      }
      percentileMaps[metric.key] = map;
    }

    // Header labels
    for (let mi = 0; mi < METRICS.length; mi++) {
      const metric = METRICS[mi];
      g.append('text')
        .attr('x', labelWidth + mi * cellWidth + cellWidth / 2)
        .attr('y', 24)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--bsi-text-muted)')
        .attr('font-family', 'var(--bsi-font-display)')
        .attr('font-size', '10px')
        .attr('letter-spacing', '0.1em')
        .text(metric.label);
    }

    // Rows
    for (let ri = 0; ri < sorted.length; ri++) {
      const row = sorted[ri];
      const y = headerHeight + ri * rowHeight;

      // Conference label
      g.append('text')
        .attr('x', 12)
        .attr('y', y + rowHeight / 2 + 4)
        .attr('fill', 'var(--bsi-text)')
        .attr('font-family', 'var(--bsi-font-mono)')
        .attr('font-size', '11px')
        .text(row.conference);

      // P5 badge
      if (row.is_power === 1) {
        g.append('text')
          .attr('x', labelWidth - 8)
          .attr('y', y + rowHeight / 2 + 3)
          .attr('text-anchor', 'end')
          .attr('fill', 'var(--bsi-primary)')
          .attr('font-family', 'var(--bsi-font-mono)')
          .attr('font-size', '7px')
          .text('P5');
      }

      // Metric cells
      for (let mi = 0; mi < METRICS.length; mi++) {
        const metric = METRICS[mi];
        const value = row[metric.key as keyof ConferenceHeatmapRow] as number;
        const pctl = percentileMaps[metric.key].get(row.conference) ?? 50;
        const color = getPercentileColor(pctl, metric.higherIsBetter);

        const cellX = labelWidth + mi * cellWidth + cellPad;
        const cellY = y + cellPad;
        const cw = cellWidth - cellPad * 2;
        const ch = rowHeight - cellPad * 2;

        // Cell background
        g.append('rect')
          .attr('x', cellX)
          .attr('y', cellY)
          .attr('width', cw)
          .attr('height', ch)
          .attr('rx', 4)
          .attr('fill', color)
          .attr('fill-opacity', 0)
          .attr('cursor', 'pointer')
          .on('mouseenter', function (event) {
            d3.select(this).attr('fill-opacity', 0.25);
            const rect = containerRef.current!.getBoundingClientRect();
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              conf: row.conference,
              metric: metric.label,
              value,
              percentile: pctl,
            });
          })
          .on('mouseleave', function () {
            d3.select(this).attr('fill-opacity', 0.15);
            setTooltip(null);
          })
          .transition()
          .duration(500)
          .delay(ri * 30 + mi * 60)
          .attr('fill-opacity', 0.15);

        // Value text
        g.append('text')
          .attr('x', cellX + cw / 2)
          .attr('y', cellY + ch / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .attr('font-family', 'var(--bsi-font-mono)')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('pointer-events', 'none')
          .text(metric.format(value));
      }
    }

  }, [sorted]);

  const totalHeight = 40 + sorted.length * 32 + 12;

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <h3 className="font-display text-base uppercase tracking-wider text-text-primary">
          Conference Strength Heatmap
        </h3>
        <p className="text-[10px] font-mono text-text-muted mt-0.5">
          Ranked by composite strength index · Cell color = percentile among all conferences
        </p>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative px-2 py-2 overflow-x-auto">
        <svg
          ref={svgRef}
          width="100%"
          height={totalHeight}
          className="block"
          style={{ minWidth: 380 }}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-background-secondary border border-border shadow-xl rounded-lg px-3 py-2"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 10,
            }}
          >
            <div className="text-sm text-text-primary font-medium">{tooltip.conf}</div>
            <div className="flex gap-3 mt-1">
              <div>
                <span className="text-[9px] text-text-muted font-mono">{tooltip.metric}</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {tooltip.value.toFixed(tooltip.metric === 'STR' ? 0 : tooltip.metric === 'ERA' ? 2 : 3)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-mono">Percentile</span>
                <span
                  className="block text-xs font-mono font-bold"
                  style={{ color: getPercentileColor(tooltip.percentile, true) }}
                >
                  {Math.round(tooltip.percentile)}th
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-center gap-4">
        {[
          { label: 'Elite', color: '#c0392b' },
          { label: 'Above Avg', color: '#d4775c' },
          { label: 'Average', color: '#aaaaaa' },
          { label: 'Below Avg', color: '#5b9bd5' },
          { label: 'Poor', color: '#1a5276' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-mono text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
