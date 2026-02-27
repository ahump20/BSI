'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EraFipPitcher {
  player_name: string;
  team: string;
  conference: string;
  era: number;
  fip: number;
  ip?: number;
  k_9?: number;
  player_id?: string;
}

interface EraFipGapProps {
  data: EraFipPitcher[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Conference colors
// ---------------------------------------------------------------------------

const CONF_COLORS: Record<string, string> = {
  SEC: '#BF5700',
  'Big 12': '#D4722A',
  ACC: '#5b9bd5',
  'Big Ten': '#2980b9',
  'Pac-12': '#6B8E23',
  AAC: '#c0392b',
  'Mountain West': '#e74c3c',
  'Sun Belt': '#F59E0B',
  'Conference USA': '#aaaaaa',
  WCC: '#10B981',
};

function getConfColor(conf: string): string {
  return CONF_COLORS[conf] ?? '#666666';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EraFipGap({
  data,
  onPlayerClick,
  className = '',
}: EraFipGapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    player: EraFipPitcher;
    gap: number;
  } | null>(null);
  const [selectedConf, setSelectedConf] = useState<string>('');

  const conferences = useMemo(() => {
    const confs = new Set<string>();
    for (const p of data) {
      if (p.conference) confs.add(p.conference);
    }
    return ['', ...Array.from(confs).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    if (!selectedConf) return data;
    return data.filter(p => p.conference === selectedConf);
  }, [data, selectedConf]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node() || !containerRef.current) return;

    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = Math.min(480, width * 0.75);
    svg.attr('height', height);

    const margin = { top: 24, right: 24, bottom: 48, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales — FIP on x, ERA on y
    const allValues = [...data.map(d => d.era), ...data.map(d => d.fip)];
    const valExtent = d3.extent(allValues) as [number, number];
    const ipExtent = d3.extent(data, d => d.ip ?? 10) as [number, number];

    const domainMin = Math.max(0, (valExtent[0] ?? 0) - 0.5);
    const domainMax = (valExtent[1] ?? 10) + 0.5;

    const xScale = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([0, innerW]);

    const yScale = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([innerH, 0]);

    const rScale = d3.scaleSqrt()
      .domain(ipExtent)
      .range([3, 12]);

    // Diagonal reference line — ERA = FIP
    g.append('line')
      .attr('x1', xScale(domainMin))
      .attr('y1', yScale(domainMin))
      .attr('x2', xScale(domainMax))
      .attr('y2', yScale(domainMax))
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4');

    // Zone labels — above line = ERA > FIP (unlucky/underperforming)
    // below line = ERA < FIP (lucky/overperforming)
    g.append('text')
      .attr('x', innerW - 8)
      .attr('y', 16)
      .attr('fill', 'rgba(192,57,43,0.25)')
      .attr('font-family', 'var(--bsi-font-display)')
      .attr('font-size', '9px')
      .attr('letter-spacing', '0.12em')
      .attr('text-anchor', 'end')
      .text('ERA > FIP — REGRESSION CANDIDATE');

    g.append('text')
      .attr('x', 8)
      .attr('y', innerH - 8)
      .attr('fill', 'rgba(16,185,129,0.25)')
      .attr('font-family', 'var(--bsi-font-display)')
      .attr('font-size', '9px')
      .attr('letter-spacing', '0.12em')
      .text('ERA < FIP — OUTPERFORMING');

    // Grid lines
    const xTicks = xScale.ticks(6);
    for (const t of xTicks) {
      g.append('line')
        .attr('x1', xScale(t)).attr('x2', xScale(t))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', 'rgba(255,255,255,0.04)');
    }
    const yTicks = yScale.ticks(6);
    for (const t of yTicks) {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(t)).attr('y2', yScale(t))
        .attr('stroke', 'rgba(255,255,255,0.04)');
    }

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => (d as number).toFixed(1));

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => (d as number).toFixed(1));

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call(g => {
        g.selectAll('text').attr('fill', 'var(--bsi-text-muted)').attr('font-family', 'var(--bsi-font-mono)').attr('font-size', '10px');
        g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.08)');
        g.select('.domain').attr('stroke', 'rgba(255,255,255,0.08)');
      });

    g.append('g')
      .call(yAxis)
      .call(g => {
        g.selectAll('text').attr('fill', 'var(--bsi-text-muted)').attr('font-family', 'var(--bsi-font-mono)').attr('font-size', '10px');
        g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.08)');
        g.select('.domain').attr('stroke', 'rgba(255,255,255,0.08)');
      });

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 40)
      .attr('fill', 'var(--bsi-text-muted)')
      .attr('font-family', 'var(--bsi-font-display)')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('letter-spacing', '0.08em')
      .text('FIP (FIELDING INDEPENDENT PITCHING)');

    g.append('text')
      .attr('transform', `translate(-42,${innerH / 2}) rotate(-90)`)
      .attr('fill', 'var(--bsi-text-muted)')
      .attr('font-family', 'var(--bsi-font-display)')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('letter-spacing', '0.08em')
      .text('ERA');

    // Data points — color based on gap magnitude
    const dots = g.selectAll('.scatter-dot')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('class', 'scatter-dot')
      .attr('cx', d => xScale(d.fip))
      .attr('cy', d => yScale(d.era))
      .attr('r', 0)
      .attr('fill', d => {
        const gap = d.era - d.fip;
        if (gap > 1.0) return '#c0392b'; // ERA much higher than FIP — regression candidate
        if (gap > 0.3) return '#d4775c';
        if (gap < -1.0) return '#10B981'; // ERA much lower — outperforming
        if (gap < -0.3) return '#5b9bd5';
        return getConfColor(d.conference); // Close to line — neutral
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => getConfColor(d.conference))
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
      .attr('cursor', onPlayerClick ? 'pointer' : 'default');

    dots.transition()
      .duration(500)
      .delay((_d, i) => i * 4)
      .ease(d3.easeCubicOut)
      .attr('r', d => rScale(d.ip ?? 10));

    dots
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 2);

        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          player: d,
          gap: d.era - d.fip,
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', 1);
        setTooltip(null);
      })
      .on('click', (_event, d) => {
        if (d.player_id && onPlayerClick) {
          onPlayerClick(d.player_id);
        }
      });

  }, [filteredData, data, onPlayerClick]);

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-base uppercase tracking-wider text-text-primary">
            ERA vs FIP Gap
          </h3>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            Points above the diagonal = ERA exceeds FIP (regression candidate) · Bubble size = innings pitched
          </p>
        </div>
        <select
          value={selectedConf}
          onChange={(e) => setSelectedConf(e.target.value)}
          className="bg-surface-light border border-border rounded-md px-2.5 py-1.5 text-xs text-text-tertiary font-mono appearance-none cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-burnt-orange/40"
        >
          {conferences.map(c => (
            <option key={c} value={c} className="bg-background-secondary text-text-primary">
              {c || 'All Conferences'}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative px-2 py-2">
        <svg
          ref={svgRef}
          width="100%"
          height={480}
          className="block"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-background-secondary border border-border shadow-xl rounded-lg px-3 py-2"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 10,
              transform: tooltip.x > (containerRef.current?.clientWidth ?? 400) / 2 ? 'translateX(-110%)' : 'none',
            }}
          >
            <div className="text-sm text-text-primary font-medium">{tooltip.player.player_name}</div>
            <div className="text-[10px] text-text-muted">{tooltip.player.team} · {tooltip.player.conference}</div>
            <div className="flex gap-3 mt-1.5">
              <div>
                <span className="text-[9px] text-text-muted font-mono">ERA</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {tooltip.player.era.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-mono">FIP</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {tooltip.player.fip.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-mono">Gap</span>
                <span className={`block text-xs font-mono font-bold ${
                  tooltip.gap > 0.3 ? 'text-red-400' : tooltip.gap < -0.3 ? 'text-green-400' : 'text-text-primary'
                }`}>
                  {tooltip.gap > 0 ? '+' : ''}{tooltip.gap.toFixed(2)}
                </span>
              </div>
              {tooltip.player.ip != null && (
                <div>
                  <span className="text-[9px] text-text-muted font-mono">IP</span>
                  <span className="block text-xs font-mono font-bold text-text-primary">
                    {tooltip.player.ip.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border-subtle flex flex-wrap items-center justify-center gap-4">
        {[
          { label: 'Overperforming (ERA < FIP)', color: '#10B981' },
          { label: 'Neutral', color: '#aaaaaa' },
          { label: 'Regression candidate (ERA > FIP)', color: '#c0392b' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-mono text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
