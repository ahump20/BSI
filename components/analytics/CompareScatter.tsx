'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useChartResize } from '@/lib/hooks/useChartResize'
import * as d3 from 'd3'
import { Card } from '@/components/ui/Card'
import { ChartTooltip } from '@/components/analytics/ChartTooltip'
import {
  styleAxis,
  drawGridLines,
  drawAxisLabel,
  drawZoneLabel,
  CHART_MARGINS,
  innerDimensions,
  withAlpha,
} from '@/lib/analytics/viz'
import { fmtPct, fmt3 } from '@/lib/analytics/viz'
import type { BatterStats } from '@/lib/analytics/types'

interface TeamBatters {
  name: string
  color: string
  batters: BatterStats[]
}

interface Props {
  teamA: TeamBatters
  teamB: TeamBatters
  onPlayerClick?: (id: string) => void
  className?: string
}

type TaggedBatter = BatterStats & { teamLabel: string; teamColor: string }

/**
 * Head-to-head scatter — both teams' batters on the same K% vs BB% plot.
 * Each team's dots use their primary color. Overlap reveals lineup composition.
 */
export function CompareScatter({ teamA, teamB, onPlayerClick, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useChartResize(containerRef)
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; player: TaggedBatter
  } | null>(null)

  const allBatters = useMemo<TaggedBatter[]>(() => [
    ...teamA.batters
      .filter((b) => b.k_pct != null && b.bb_pct != null && b.pa >= 5)
      .map((b) => ({ ...b, teamLabel: teamA.name, teamColor: teamA.color })),
    ...teamB.batters
      .filter((b) => b.k_pct != null && b.bb_pct != null && b.pa >= 5)
      .map((b) => ({ ...b, teamLabel: teamB.name, teamColor: teamB.color })),
  ], [teamA.batters, teamA.name, teamA.color, teamB.batters, teamB.name, teamB.color])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svg.node() || !containerRef.current || allBatters.length === 0) return
    svg.selectAll('*').interrupt()
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = Math.min(380, width * 0.65)
    svg.attr('height', height)

    const { innerW, innerH } = innerDimensions(width, height)
    const g = svg.append('g').attr('transform', `translate(${CHART_MARGINS.left},${CHART_MARGINS.top})`)

    // Scales
    const kExtent = d3.extent(allBatters, (d) => d.k_pct) as [number, number]
    const bbExtent = d3.extent(allBatters, (d) => d.bb_pct) as [number, number]
    const paExtent = d3.extent(allBatters, (d) => d.pa) as [number, number]

    const xScale = d3.scaleLinear()
      .domain([Math.max(0, (kExtent[0] ?? 0) - 0.02), (kExtent[1] ?? 0.4) + 0.02])
      .range([0, innerW])

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, (bbExtent[0] ?? 0) - 0.02), (bbExtent[1] ?? 0.25) + 0.02])
      .range([innerH, 0])

    const rScale = d3.scaleSqrt()
      .domain(paExtent)
      .range([4, 14])

    // Median crosshairs
    const medianK = d3.median(allBatters, (d) => d.k_pct) ?? 0.2
    const medianBB = d3.median(allBatters, (d) => d.bb_pct) ?? 0.1

    g.append('line')
      .attr('x1', xScale(medianK)).attr('x2', xScale(medianK))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(196,184,165,0.08)')
      .attr('stroke-dasharray', '4,3')

    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(medianBB)).attr('y2', yScale(medianBB))
      .attr('stroke', 'rgba(196,184,165,0.08)')
      .attr('stroke-dasharray', '4,3')

    // Zone labels
    const pad = 8
    drawZoneLabel(g, 'HIGH K / HIGH BB', pad, pad + 10)
    drawZoneLabel(g, 'LOW K / LOW BB', innerW - pad, innerH - pad, { anchor: 'end' })
    drawZoneLabel(g, 'PATIENT POWER', innerW - pad, pad + 10, { anchor: 'end', color: 'rgba(16,185,129,0.25)' })
    drawZoneLabel(g, 'FREE SWINGER', pad, innerH - pad, { color: 'rgba(192,57,43,0.2)' })

    // Grid
    drawGridLines(g, xScale.ticks(6), yScale.ticks(5), xScale, yScale, innerW, innerH)

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((d) => `${((d as number) * 100).toFixed(0)}%`)
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${((d as number) * 100).toFixed(0)}%`)

    const xG = g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
    styleAxis(xG)
    const yG = g.append('g').call(yAxis)
    styleAxis(yG)

    drawAxisLabel(g, 'STRIKEOUT RATE (K%)', innerW / 2, innerH + 40)
    drawAxisLabel(g, 'WALK RATE (BB%)', -42, innerH / 2, -90)

    // Draw team B first (behind), team A on top
    const sorted = [...allBatters].sort((a, b) => {
      // Team A dots render on top
      if (a.teamLabel === teamA.name && b.teamLabel !== teamA.name) return 1
      if (a.teamLabel !== teamA.name && b.teamLabel === teamA.name) return -1
      return 0
    })

    const dots = g.selectAll<SVGCircleElement, TaggedBatter>('.dot')
      .data(sorted)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.k_pct))
      .attr('cy', (d) => yScale(d.bb_pct))
      .attr('r', 0)
      .attr('fill', (d) => d.teamColor)
      .attr('fill-opacity', 0.65)
      .attr('stroke', (d) => d.teamColor)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('cursor', onPlayerClick ? 'pointer' : 'default')

    dots.transition()
      .duration(500)
      .delay((_d, i) => i * 5)
      .ease(d3.easeCubicOut)
      .attr('r', (d) => rScale(d.pa))

    dots
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 2.5)
          .raise()
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, player: d })
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.65).attr('stroke-opacity', 0.4).attr('stroke-width', 1.5)
        setTooltip(null)
      })
      .on('click', (_e, d) => {
        if (d.player_id && onPlayerClick) onPlayerClick(d.player_id)
      })

    return () => {
      svg.selectAll('*').interrupt()
    }
  }, [allBatters, teamA.name, onPlayerClick, containerWidth])

  if (allBatters.length === 0) return null

  return (
    <Card variant="elevated" className={className}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3
              className="text-base uppercase tracking-wider font-bold text-bsi-bone"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Lineup Scatter
            </h3>
            <p className="text-[10px] font-mono mt-0.5 text-bsi-dust">
              K% vs BB% · Bubble size = PA · {allBatters.length} batters
            </p>
          </div>
          {/* Team legend */}
          <div className="flex items-center gap-4">
            {[teamA, teamB].map((t) => (
              <div key={t.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.color, boxShadow: `0 0 6px ${withAlpha(t.color, 0.4)}` }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: t.color }}>
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative px-2 py-2">
        <svg ref={svgRef} width="100%" height={380} className="block" role="img" aria-label="Lineup comparison scatter — head-to-head K% vs BB% by team" />
        {tooltip && (
          <ChartTooltip
            x={tooltip.x}
            y={tooltip.y}
            containerWidth={containerRef.current?.clientWidth ?? 400}
            title={tooltip.player.player_name}
            subtitle={tooltip.player.teamLabel}
            fields={[
              { label: 'K%', value: fmtPct(tooltip.player.k_pct) },
              { label: 'BB%', value: fmtPct(tooltip.player.bb_pct) },
              { label: 'AVG', value: fmt3(tooltip.player.avg) },
              { label: 'PA', value: String(tooltip.player.pa) },
            ]}
          />
        )}
      </div>
    </Card>
  )
}
