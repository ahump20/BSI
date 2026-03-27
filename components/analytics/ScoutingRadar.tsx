'use client';

/**
 * ScoutingRadar — D3 custom radar chart for player scouting profiles.
 * 6 axes: wOBA, ISO, BB%, K% (inverted), BABIP, wRC+.
 * Concentric percentile bands (50th/75th/90th/99th) as faded rings.
 * Player profile as filled polygon, animated from center outward.
 * Ported from BSI Labs — adapted for Next.js static export.
 */
import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useChartResize } from '@/lib/hooks/useChartResize';
import { Card } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/analytics/ChartTooltip';
import { PlayerSelect } from '@/components/analytics/PlayerSelect';
import { getPercentileColor, withAlpha, computePercentile, fmtPct, fmt3, fmtInt } from '@/lib/analytics/viz';
import type { EnrichedBatter, BatterStats } from '@/lib/analytics/types';

interface Axis {
  key: keyof BatterStats;
  label: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
}

const AXES: Axis[] = [
  { key: 'woba', label: 'wOBA', higherIsBetter: true, format: fmt3 },
  { key: 'iso', label: 'ISO', higherIsBetter: true, format: fmt3 },
  { key: 'bb_pct', label: 'BB%', higherIsBetter: true, format: fmtPct },
  { key: 'k_pct', label: 'K%', higherIsBetter: false, format: fmtPct },
  { key: 'babip', label: 'BABIP', higherIsBetter: true, format: fmt3 },
  { key: 'wrc_plus', label: 'wRC+', higherIsBetter: true, format: fmtInt },
];

const BANDS = [50, 75, 90, 99] as const;

interface Props {
  data: EnrichedBatter[];
  onPlayerClick?: (id: string) => void;
  controlledPlayerId?: string;
  onPlayerChange?: (id: string) => void;
  hideSelector?: boolean;
  selectedId?: string;
  className?: string;
}

export function ScoutingRadar({ data, onPlayerClick, controlledPlayerId, onPlayerChange, hideSelector, selectedId, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useChartResize(containerRef);
  const [internalId, setInternalId] = useState(selectedId ?? '');
  const playerId = controlledPlayerId ?? internalId;
  const setPlayerId = (id: string) => { setInternalId(id); onPlayerChange?.(id); };
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; label: string; value: string; pct: number;
  } | null>(null);

  const populations = useMemo(() => {
    const pops: Record<string, number[]> = {};
    for (const axis of AXES) {
      pops[axis.key] = data
        .filter((d) => d[axis.key] != null && isFinite(d[axis.key] as number) && d.pa >= 10)
        .map((d) => d[axis.key] as number);
    }
    return pops;
  }, [data]);

  const qualifying = useMemo(() => {
    return data.filter((d) => d.pa >= 10 && d.woba != null && d.wrc_plus != null);
  }, [data]);

  const player = useMemo(() => {
    if (!playerId) return qualifying[0] ?? null;
    return qualifying.find((d) => d.player_id === playerId) ?? qualifying[0] ?? null;
  }, [playerId, qualifying]);

  const playerPercentiles = useMemo(() => {
    if (!player) return AXES.map(() => 50);
    return AXES.map((axis) => {
      const val = player[axis.key] as number;
      if (val == null || !isFinite(val)) return 50;
      return computePercentile(val, populations[axis.key] ?? [], axis.higherIsBetter);
    });
  }, [player, populations]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node() || !containerRef.current) return;
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const size = Math.min(440, width - 16);
    const height = size;
    svg.attr('width', width).attr('height', height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = (size / 2) - 48;
    const n = AXES.length;
    const angleSlice = (Math.PI * 2) / n;

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    const bandRadii = BANDS.map((pct) => (pct / 100) * radius);
    const bandColors = [
      'var(--radar-band-50, rgba(170,170,170,0.08))',
      'var(--radar-band-75, rgba(91,155,213,0.08))',
      'var(--radar-band-90, rgba(231,76,60,0.08))',
      'var(--radar-band-99, rgba(192,57,43,0.08))',
    ];

    for (let i = bandRadii.length - 1; i >= 0; i--) {
      g.append('circle')
        .attr('cx', 0).attr('cy', 0)
        .attr('r', bandRadii[i])
        .attr('fill', bandColors[i])
        .attr('stroke', 'rgba(196,184,165,0.06)')
        .attr('stroke-width', 0.5);

      g.append('text')
        .attr('x', 4)
        .attr('y', -bandRadii[i] + 10)
        .attr('fill', 'rgba(196,184,165,0.18)')
        .attr('font-size', '8px')
        .attr('font-family', 'var(--font-mono)')
        .text(`${BANDS[i]}th`);
    }

    for (let i = 0; i < n; i++) {
      const angle = angleSlice * i - Math.PI / 2;
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', Math.cos(angle) * radius)
        .attr('y2', Math.sin(angle) * radius)
        .attr('stroke', 'rgba(196,184,165,0.08)')
        .attr('stroke-width', 1);
    }

    for (let i = 0; i < n; i++) {
      const angle = angleSlice * i - Math.PI / 2;
      const labelR = radius + 22;
      const isHighlighted = hoveredAxis === i;
      g.append('text')
        .attr('x', Math.cos(angle) * labelR)
        .attr('y', Math.sin(angle) * labelR)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', isHighlighted ? 'var(--bsi-text)' : 'var(--bsi-text-muted)')
        .attr('font-family', 'var(--font-display)')
        .attr('font-size', isHighlighted ? '12px' : '10px')
        .attr('font-weight', isHighlighted ? 'bold' : 'normal')
        .attr('letter-spacing', '0.08em')
        .attr('cursor', 'pointer')
        .text(AXES[i].label)
        .on('mouseenter', function (event) {
          setHoveredAxis(i);
          const pct = playerPercentiles[i];
          const val = player ? player[AXES[i].key] as number : 0;
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            label: AXES[i].label,
            value: AXES[i].format(val ?? 0),
            pct: Math.round(pct),
          });
        })
        .on('mouseleave', () => {
          setHoveredAxis(null);
          setTooltip(null);
        });
    }

    if (player) {
      const pointsFn = (scale: number) =>
        playerPercentiles.map((pct, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const r = ((pct / 100) * radius) * scale;
          return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];
        });

      const lineGen = d3.line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinearClosed);

      const avgPct = playerPercentiles.reduce((a, b) => a + b, 0) / playerPercentiles.length;
      const polyColor = getPercentileColor(avgPct);

      const polygon = g.append('path')
        .attr('d', lineGen(pointsFn(0)))
        .attr('fill', withAlpha(polyColor, 0.2))
        .attr('stroke', polyColor)
        .attr('stroke-width', 2);

      const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        polygon.attr('d', lineGen(pointsFn(1)));
      } else {
        polygon
          .transition()
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('d', lineGen(pointsFn(1)));
      }

      const vertices = g.selectAll<SVGCircleElement, [number, number]>('.vertex')
        .data(pointsFn(1))
        .enter()
        .append('circle')
        .attr('class', 'vertex')
        .attr('cx', (d) => d[0])
        .attr('cy', (d) => d[1])
        .attr('fill', (_d, i) => getPercentileColor(playerPercentiles[i]))
        .attr('stroke', 'var(--surface-scoreboard)')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer');

      if (prefersReduced) {
        vertices.attr('r', 5);
      } else {
        vertices
          .attr('r', 0)
          .transition()
          .duration(400)
          .delay(400)
          .ease(d3.easeCubicOut)
          .attr('r', 5);
      }

      vertices
        .on('mouseenter', function (event, _d) {
          const i = pointsFn(1).indexOf(_d);
          d3.select(this).attr('r', 7);
          setHoveredAxis(i);
          const pct = playerPercentiles[i];
          const val = player[AXES[i].key] as number;
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            label: AXES[i].label,
            value: AXES[i].format(val ?? 0),
            pct: Math.round(pct),
          });
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 5);
          setHoveredAxis(null);
          setTooltip(null);
        });
    }

    return () => { svg.selectAll('*').interrupt(); };
  }, [player, playerPercentiles, containerWidth, hoveredAxis, data]);

  return (
    <Card variant="elevated" className={className}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3
              className="text-base uppercase tracking-wider font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-text)' }}
            >
              Scouting Radar
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--bsi-text-dim)' }}>
              6-axis percentile profile · {qualifying.length} qualifying batters
            </p>
          </div>
          {!hideSelector && (
            <PlayerSelect
              players={qualifying.map((d) => ({
                player_id: d.player_id,
                player_name: d.player_name,
                team: d.team,
                conference: d.conference,
              }))}
              value={player?.player_id ?? ''}
              onChange={(id) => setPlayerId(id)}
            />
          )}
        </div>

        {player && (
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span
              className="text-lg font-bold cursor-pointer hover:underline"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-primary)' }}
              onClick={() => onPlayerClick?.(player.player_id)}
            >
              {player.player_name}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--bsi-text-muted)' }}>
              {player.team}{player.conference ? ` · ${player.conference}` : ''} · {player.pa} PA
            </span>
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative px-2 py-4">
        <svg ref={svgRef} width="100%" height={440} className="block" role="img" aria-label="Scouting radar — percentile rankings across batting metrics" />
        {tooltip && (
          <ChartTooltip
            x={tooltip.x}
            y={tooltip.y}
            containerWidth={containerRef.current?.clientWidth ?? 400}
            title={tooltip.label}
            subtitle={`${tooltip.pct}th percentile`}
            fields={[
              { label: 'Value', value: tooltip.value },
              { label: 'Pctl', value: `${tooltip.pct}`, color: getPercentileColor(tooltip.pct) },
            ]}
          />
        )}
      </div>

      {player && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-vintage)' }}>
          <div className="flex items-center gap-3 flex-wrap">
            {AXES.map((axis, i) => {
              const pct = Math.round(playerPercentiles[i]);
              return (
                <div
                  key={axis.key}
                  className="flex items-center gap-1.5 cursor-default"
                  onMouseEnter={() => setHoveredAxis(i)}
                  onMouseLeave={() => setHoveredAxis(null)}
                >
                  <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--bsi-text-dim)' }}>
                    {axis.label}
                  </span>
                  <span
                    className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: getPercentileColor(pct),
                      background: withAlpha(getPercentileColor(pct), 0.12),
                    }}
                  >
                    {pct}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
