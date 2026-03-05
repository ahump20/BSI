'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { getPercentileColor } from './PercentileBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PercentileStat {
  key: string;
  label: string;
  value: number;
  /** Percentile 0–100 */
  percentile: number;
  /** Whether higher raw values are better */
  higherIsBetter: boolean;
  /** Format function for raw value display */
  format?: (v: number) => string;
}

export interface StatGroup {
  label: string;
  stats: PercentileStat[];
}

interface PercentilePlayerCardProps {
  playerName: string;
  team: string;
  position?: string;
  groups: StatGroup[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAR_HEIGHT = 22;
const BAR_GAP = 4;
const LABEL_WIDTH = 52;
const VALUE_WIDTH = 48;
const PCTL_WIDTH = 28;
const GROUP_LABEL_HEIGHT = 28;
const PADDING = { top: 12, right: 12, bottom: 8, left: 12 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PercentilePlayerCard({
  playerName,
  team,
  position,
  groups,
  className = '',
}: PercentilePlayerCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate total height from groups
  const totalStats = groups.reduce((acc, g) => acc + g.stats.length, 0);
  const totalGroupHeaders = groups.length;
  const contentHeight =
    totalStats * (BAR_HEIGHT + BAR_GAP) +
    totalGroupHeaders * GROUP_LABEL_HEIGHT +
    PADDING.top + PADDING.bottom;

  // Memoize flattened stats for stable reference
  const allStats = useMemo(() => groups.flatMap(g => g.stats), [groups]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    svg.selectAll('*').remove();

    const width = svgRef.current!.clientWidth;
    const barAreaWidth = width - PADDING.left - PADDING.right - LABEL_WIDTH - VALUE_WIDTH - PCTL_WIDTH;

    const g = svg.append('g').attr('transform', `translate(${PADDING.left}, ${PADDING.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, barAreaWidth]);

    let yOffset = 0;

    for (const group of groups) {
      // Group label
      g.append('text')
        .attr('x', 0)
        .attr('y', yOffset + 16)
        .attr('fill', 'var(--bsi-text-muted)')
        .attr('font-family', 'var(--bsi-font-display)')
        .attr('font-size', '10px')
        .attr('text-transform', 'uppercase')
        .attr('letter-spacing', '0.1em')
        .text(group.label.toUpperCase());

      // Separator line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width - PADDING.left - PADDING.right)
        .attr('y1', yOffset + GROUP_LABEL_HEIGHT - 6)
        .attr('y2', yOffset + GROUP_LABEL_HEIGHT - 6)
        .attr('stroke', 'rgba(255,255,255,0.06)')
        .attr('stroke-width', 1);

      yOffset += GROUP_LABEL_HEIGHT;

      for (const stat of group.stats) {
        const barY = yOffset;
        const color = getPercentileColor(stat.percentile, stat.higherIsBetter);
        const barWidth = xScale(stat.percentile);
        const fmt = stat.format ?? ((v: number) => v.toFixed(stat.value >= 10 ? 0 : 3));

        // Stat label
        g.append('text')
          .attr('x', 0)
          .attr('y', barY + BAR_HEIGHT / 2 + 4)
          .attr('fill', 'var(--bsi-text-muted)')
          .attr('font-family', 'var(--bsi-font-mono)')
          .attr('font-size', '10px')
          .attr('text-anchor', 'start')
          .text(stat.label);

        // Track background
        g.append('rect')
          .attr('x', LABEL_WIDTH)
          .attr('y', barY + 2)
          .attr('width', barAreaWidth)
          .attr('height', BAR_HEIGHT - 4)
          .attr('rx', 3)
          .attr('fill', 'rgba(255,255,255,0.03)');

        // Percentile bar
        g.append('rect')
          .attr('x', LABEL_WIDTH)
          .attr('y', barY + 2)
          .attr('width', 0)
          .attr('height', BAR_HEIGHT - 4)
          .attr('rx', 3)
          .attr('fill', color)
          .attr('opacity', 0.8)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr('width', Math.max(4, barWidth));

        // Raw value
        g.append('text')
          .attr('x', LABEL_WIDTH + barAreaWidth + 8)
          .attr('y', barY + BAR_HEIGHT / 2 + 4)
          .attr('fill', 'var(--bsi-text)')
          .attr('font-family', 'var(--bsi-font-mono)')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('text-anchor', 'start')
          .text(fmt(stat.value));

        // Percentile number
        g.append('text')
          .attr('x', width - PADDING.left - PADDING.right)
          .attr('y', barY + BAR_HEIGHT / 2 + 4)
          .attr('fill', color)
          .attr('font-family', 'var(--bsi-font-mono)')
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('text-anchor', 'end')
          .text(Math.round(stat.percentile));

        yOffset += BAR_HEIGHT + BAR_GAP;
      }
    }
  }, [groups, allStats]);

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg uppercase tracking-wider text-text-primary font-bold">
              {playerName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-muted">{team}</span>
              {position && (
                <span className="text-[10px] font-mono text-text-muted uppercase px-1.5 py-0.5 rounded bg-surface-light">
                  {position}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-display uppercase tracking-widest text-text-muted">Percentile Rankings</span>
          </div>
        </div>
      </div>

      {/* D3 SVG canvas */}
      <div className="px-2 py-2">
        <svg
          ref={svgRef}
          width="100%"
          height={contentHeight}
          className="block"
          style={{ minWidth: 300 }}
        />
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-center gap-4">
        {[
          { label: 'Elite', color: '#c0392b' },
          { label: 'Great', color: '#e74c3c' },
          { label: 'Avg', color: '#aaaaaa' },
          { label: 'Below', color: '#5b9bd5' },
          { label: 'Poor', color: '#1a5276' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] font-mono text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
