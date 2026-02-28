'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MomentumSnapshot {
  inning: number;
  inning_half: 'top' | 'bottom';
  mmi_value: number;
  direction: 'home' | 'away' | 'neutral';
  magnitude: 'low' | 'medium' | 'high' | 'extreme';
  event_description?: string;
  home_score?: number;
  away_score?: number;
}

interface MomentumFlowProps {
  snapshots: MomentumSnapshot[];
  homeTeam: string;
  awayTeam: string;
  /** Summary stats */
  volatility?: number;
  leadChanges?: number;
  excitementRating?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const HOME_COLOR = 'var(--bsi-primary, #D97706)';
const AWAY_COLOR = '#6B8DB2';
const NEUTRAL_COLOR = 'rgba(255,255,255,0.15)';
const GRID_COLOR = 'rgba(255,255,255,0.06)';
const TEXT_COLOR = 'rgba(255,255,255,0.5)';
const EXTREME_GLOW = 'rgba(217, 119, 6, 0.4)';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MomentumFlow({
  snapshots,
  homeTeam,
  awayTeam,
  volatility,
  leadChanges,
  excitementRating,
  className = '',
}: MomentumFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    snap: MomentumSnapshot;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.min(320, width * 0.45) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // D3 render
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || snapshots.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 36, left: 44 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, snapshots.length - 1])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([-100, 100])
      .range([height, 0]);

    // Grid lines
    const gridValues = [-75, -50, -25, 0, 25, 50, 75];
    g.selectAll('.grid-line')
      .data(gridValues)
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d: number) => yScale(d))
      .attr('y2', (d: number) => yScale(d))
      .attr('stroke', GRID_COLOR)
      .attr('stroke-dasharray', (d: number) => d === 0 ? 'none' : '2,4');

    // Zero line (bolder)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 1);

    // Area generators — split above and below zero
    const areaAbove = d3.area<MomentumSnapshot>()
      .x((_d, i) => xScale(i))
      .y0(yScale(0))
      .y1((d) => yScale(Math.max(0, d.mmi_value)))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const areaBelow = d3.area<MomentumSnapshot>()
      .x((_d, i) => xScale(i))
      .y0(yScale(0))
      .y1((d) => yScale(Math.min(0, d.mmi_value)))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Gradient definitions
    const defs = svg.append('defs');

    const homeGrad = defs.append('linearGradient')
      .attr('id', 'mf-home-grad')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');
    homeGrad.append('stop').attr('offset', '0%').attr('stop-color', HOME_COLOR).attr('stop-opacity', 0);
    homeGrad.append('stop').attr('offset', '100%').attr('stop-color', HOME_COLOR).attr('stop-opacity', 0.35);

    const awayGrad = defs.append('linearGradient')
      .attr('id', 'mf-away-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    awayGrad.append('stop').attr('offset', '0%').attr('stop-color', AWAY_COLOR).attr('stop-opacity', 0);
    awayGrad.append('stop').attr('offset', '100%').attr('stop-color', AWAY_COLOR).attr('stop-opacity', 0.35);

    // Fill areas
    g.append('path')
      .datum(snapshots)
      .attr('d', areaAbove)
      .attr('fill', 'url(#mf-home-grad)');

    g.append('path')
      .datum(snapshots)
      .attr('d', areaBelow)
      .attr('fill', 'url(#mf-away-grad)');

    // Main line
    const line = d3.line<MomentumSnapshot>()
      .x((_d, i) => xScale(i))
      .y((d) => yScale(d.mmi_value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path')
      .datum(snapshots)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.7)')
      .attr('stroke-width', 2);

    // Event dots — only on scoring events or extreme momentum
    g.selectAll('.event-dot')
      .data(snapshots.filter(s => s.event_description || s.magnitude === 'extreme'))
      .join('circle')
      .attr('cx', (d: MomentumSnapshot) => xScale(snapshots.indexOf(d)))
      .attr('cy', (d: MomentumSnapshot) => yScale(d.mmi_value))
      .attr('r', (d: MomentumSnapshot) => d.magnitude === 'extreme' ? 5 : 3.5)
      .attr('fill', (d: MomentumSnapshot) => d.direction === 'home' ? HOME_COLOR : d.direction === 'away' ? AWAY_COLOR : NEUTRAL_COLOR)
      .attr('stroke', 'var(--bsi-midnight, #0C0F1A)')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('filter', (d: MomentumSnapshot) => d.magnitude === 'extreme' ? `drop-shadow(0 0 4px ${EXTREME_GLOW})` : 'none');

    // Invisible hover targets for tooltip
    g.selectAll('.hover-target')
      .data(snapshots)
      .join('rect')
      .attr('x', (_d: MomentumSnapshot, i: number) => xScale(i) - width / snapshots.length / 2)
      .attr('y', 0)
      .attr('width', width / snapshots.length)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', (event: MouseEvent, d: MomentumSnapshot) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            snap: d,
          });
        }
      })
      .on('mouseleave', () => setTooltip(null));

    // Y-axis labels
    g.selectAll('.y-label')
      .data([-100, -50, 0, 50, 100])
      .join('text')
      .attr('x', -8)
      .attr('y', (d: number) => yScale(d))
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', TEXT_COLOR)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .text((d: number) => d > 0 ? `+${d}` : String(d));

    // X-axis: inning labels
    const innings = Array.from(new Set(snapshots.map(s => s.inning))).sort((a, b) => a - b);
    const inningPositions = innings.map(inn => {
      const idx = snapshots.findIndex(s => s.inning === inn);
      return { inning: inn, x: xScale(idx) };
    });

    g.selectAll('.x-label')
      .data(inningPositions)
      .join('text')
      .attr('x', (d: { x: number }) => d.x)
      .attr('y', height + 24)
      .attr('text-anchor', 'middle')
      .attr('fill', TEXT_COLOR)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .text((d: { inning: number }) => String(d.inning));

    // Axis title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('font-size', '9px')
      .text('INNING');

  }, [snapshots, dimensions]);

  // Sample data for empty state
  const hasSampleData = snapshots.length >= 2;

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-sm uppercase tracking-widest text-text-secondary">
            Momentum Flow
          </h3>
          {excitementRating && (
            <span className={`text-[9px] uppercase tracking-wider font-display px-2 py-0.5 rounded-full ${
              excitementRating === 'instant-classic' ? 'bg-burnt-orange/10 text-burnt-orange' :
              excitementRating === 'thriller' ? 'bg-amber-500/10 text-amber-400' :
              excitementRating === 'competitive' ? 'bg-blue-500/10 text-blue-400' :
              'bg-surface-light text-text-muted'
            }`}>
              {excitementRating.replace('-', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B8DB2] font-medium">{awayTeam}</span>
          <div className="flex gap-4 text-text-muted">
            {volatility != null && <span>Vol: {volatility.toFixed(1)}</span>}
            {leadChanges != null && <span>Leads: {leadChanges}</span>}
          </div>
          <span className="text-burnt-orange font-medium">{homeTeam}</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative px-2 pb-2">
        {hasSampleData ? (
          <>
            <svg ref={svgRef} className="w-full" />
            {tooltip && (
              <div
                className="absolute z-10 pointer-events-none bg-surface-medium border border-border-subtle rounded-lg px-3 py-2 shadow-lg"
                style={{
                  left: Math.min(tooltip.x, dimensions.width - 180),
                  top: Math.max(tooltip.y - 70, 0),
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold tabular-nums" style={{
                    color: tooltip.snap.direction === 'home' ? HOME_COLOR : tooltip.snap.direction === 'away' ? AWAY_COLOR : 'white'
                  }}>
                    {tooltip.snap.mmi_value > 0 ? '+' : ''}{tooltip.snap.mmi_value.toFixed(1)}
                  </span>
                  <span className="text-[9px] uppercase text-text-muted">
                    {tooltip.snap.inning_half === 'top' ? 'T' : 'B'}{tooltip.snap.inning}
                  </span>
                </div>
                {tooltip.snap.event_description && (
                  <p className="text-[11px] text-text-tertiary max-w-[160px]">{tooltip.snap.event_description}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-text-muted text-sm">
            Momentum data populates during live games
          </div>
        )}
      </div>
    </div>
  );
}
