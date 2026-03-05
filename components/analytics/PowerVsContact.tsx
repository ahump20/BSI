'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { CONF_COLORS, getConfColor } from '@/lib/data/conference-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PowerContactPlayer {
  player_name: string;
  team: string;
  conference: string;
  iso: number;
  k_pct: number;
  slg: number;
  pa?: number;
  hr?: number;
  player_id?: string;
}

interface PowerVsContactProps {
  data: PowerContactPlayer[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Conference colors (shared across scatter components)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PowerVsContact({
  data,
  onPlayerClick,
  className = '',
}: PowerVsContactProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    player: PowerContactPlayer;
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

    // Scales — K% on x (inverted: low K% = better contact is on the RIGHT)
    // ISO on y (higher = more power)
    const kExtent = d3.extent(data, d => d.k_pct) as [number, number];
    const isoExtent = d3.extent(data, d => d.iso) as [number, number];
    const paExtent = d3.extent(data, d => d.pa ?? 30) as [number, number];

    const xScale = d3.scaleLinear()
      .domain([Math.max(0, (kExtent[0] ?? 0) - 0.02), (kExtent[1] ?? 0.4) + 0.02])
      .range([0, innerW]);

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, (isoExtent[0] ?? 0) - 0.02), (isoExtent[1] ?? 0.3) + 0.02])
      .range([innerH, 0]);

    const rScale = d3.scaleSqrt()
      .domain(paExtent)
      .range([3, 14]);

    // Median lines
    const medianK = d3.median(data, d => d.k_pct) ?? 0.2;
    const medianISO = d3.median(data, d => d.iso) ?? 0.12;

    // Quadrant backgrounds
    const quadrantAreas = [
      // Top-left: High K%, High ISO = "All-or-Nothing"
      { x1: 0, y1: 0, x2: xScale(medianK), y2: yScale(medianISO), fill: 'rgba(255,107,53,0.03)' },
      // Bottom-left: High K%, Low ISO = "Struggling"
      { x1: 0, y1: yScale(medianISO), x2: xScale(medianK), y2: innerH, fill: 'rgba(192,57,43,0.03)' },
      // Top-right: Low K%, High ISO = "Contact Power" (elite)
      { x1: xScale(medianK), y1: 0, x2: innerW, y2: yScale(medianISO), fill: 'rgba(16,185,129,0.04)' },
      // Bottom-right: Low K%, Low ISO = "Slap Hitter"
      { x1: xScale(medianK), y1: yScale(medianISO), x2: innerW, y2: innerH, fill: 'rgba(170,170,170,0.02)' },
    ];

    for (const qa of quadrantAreas) {
      g.append('rect')
        .attr('x', qa.x1)
        .attr('y', qa.y1)
        .attr('width', qa.x2 - qa.x1)
        .attr('height', qa.y2 - qa.y1)
        .attr('fill', qa.fill);
    }

    // Median lines
    g.append('line')
      .attr('x1', xScale(medianK)).attr('x2', xScale(medianK))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-dasharray', '4,3');

    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(medianISO)).attr('y2', yScale(medianISO))
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-dasharray', '4,3');

    // Quadrant labels
    const qlabelPad = 8;
    const qlabels = [
      { text: 'ALL-OR-NOTHING', x: qlabelPad, y: qlabelPad + 10 },
      { text: 'STRUGGLING', x: qlabelPad, y: innerH - qlabelPad },
      { text: 'CONTACT POWER', x: innerW - qlabelPad, y: qlabelPad + 10, anchor: 'end' },
      { text: 'SLAP HITTER', x: innerW - qlabelPad, y: innerH - qlabelPad, anchor: 'end' },
    ];

    for (const ql of qlabels) {
      g.append('text')
        .attr('x', ql.x)
        .attr('y', ql.y)
        .attr('fill', 'rgba(255,255,255,0.15)')
        .attr('font-family', 'var(--bsi-font-display)')
        .attr('font-size', '9px')
        .attr('letter-spacing', '0.12em')
        .attr('text-anchor', (ql as { anchor?: string }).anchor ?? 'start')
        .text(ql.text);
    }

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => `${(d as number * 100).toFixed(0)}%`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => (d as number).toFixed(3).replace(/^0/, ''));

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
      .text('STRIKEOUT RATE (K%)');

    g.append('text')
      .attr('transform', `translate(-42,${innerH / 2}) rotate(-90)`)
      .attr('fill', 'var(--bsi-text-muted)')
      .attr('font-family', 'var(--bsi-font-display)')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('letter-spacing', '0.08em')
      .text('ISOLATED POWER (ISO)');

    // Data points
    const dots = g.selectAll('.scatter-dot')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('class', 'scatter-dot')
      .attr('cx', d => xScale(d.k_pct))
      .attr('cy', d => yScale(d.iso))
      .attr('r', 0)
      .attr('fill', d => getConfColor(d.conference))
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => getConfColor(d.conference))
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)
      .attr('cursor', onPlayerClick ? 'pointer' : 'default');

    dots.transition()
      .duration(500)
      .delay((_d, i) => i * 3)
      .ease(d3.easeCubicOut)
      .attr('r', d => rScale(d.pa ?? 30));

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
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-opacity', 0.3)
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
            Power vs Contact
          </h3>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            ISO (isolated power) vs K% · Bubble size = plate appearances
          </p>
        </div>
        <select
          aria-label="Filter by conference"
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
                <span className="text-[9px] text-text-muted font-mono">ISO</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {tooltip.player.iso.toFixed(3).replace(/^0/, '')}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-mono">K%</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {(tooltip.player.k_pct * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-mono">SLG</span>
                <span className="block text-xs font-mono font-bold text-text-primary">
                  {tooltip.player.slg.toFixed(3).replace(/^0/, '')}
                </span>
              </div>
              {tooltip.player.hr != null && (
                <div>
                  <span className="text-[9px] text-text-muted font-mono">HR</span>
                  <span className="block text-xs font-mono font-bold text-text-primary">
                    {tooltip.player.hr}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conference legend */}
      <div className="px-5 py-3 border-t border-border-subtle flex flex-wrap items-center justify-center gap-3">
        {Object.entries(CONF_COLORS).slice(0, 8).map(([conf, color]) => (
          <button
            key={conf}
            onClick={() => setSelectedConf(selectedConf === conf ? '' : conf)}
            className={`flex items-center gap-1 transition-opacity ${
              selectedConf && selectedConf !== conf ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-mono text-text-muted">{conf}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
