'use client';

import { useRef, useEffect, useState, useMemo } from 'react'
import { useChartResize } from '@/lib/hooks/useChartResize'
import * as d3 from 'd3'
import { Card } from '@/components/ui/Card'
import {
  getConfColor,
  styleAxis,
  drawAxisLabel,
  CHART_MARGINS,
  withAlpha,
} from '@/lib/analytics/viz'
import { fmt3, fmtPct } from '@/lib/analytics/viz'
import type { BatterStats, EnrichedBatter } from '@/lib/analytics/types'

interface MetricDef {
  key: keyof BatterStats
  label: string
  format: (v: number) => string
  domain?: [number, number]
  higherIsBetter: boolean
}

const METRICS: MetricDef[] = [
  { key: 'woba', label: 'wOBA', format: fmt3, higherIsBetter: true },
  { key: 'avg', label: 'AVG', format: fmt3, higherIsBetter: true },
  { key: 'iso', label: 'ISO', format: fmt3, higherIsBetter: true },
  { key: 'k_pct', label: 'K%', format: fmtPct, domain: [0, 0.5], higherIsBetter: false },
  { key: 'bb_pct', label: 'BB%', format: fmtPct, domain: [0, 0.25], higherIsBetter: true },
  { key: 'babip', label: 'BABIP', format: fmt3, higherIsBetter: true },
  { key: 'slg', label: 'SLG', format: fmt3, higherIsBetter: true },
  { key: 'obp', label: 'OBP', format: fmt3, higherIsBetter: true },
]

interface Props {
  data: EnrichedBatter[]
  className?: string
}

/**
 * Kernel Density Estimation with Gaussian kernel.
 * Returns an array of [x, density] points for smooth curve rendering.
 */
function kernelDensity(values: number[], bandwidth: number, nPoints = 120): [number, number][] {
  const ext = d3.extent(values) as [number, number]
  const pad = (ext[1] - ext[0]) * 0.1
  const lo = ext[0] - pad
  const hi = ext[1] + pad
  const step = (hi - lo) / nPoints
  const points: [number, number][] = []

  for (let x = lo; x <= hi; x += step) {
    let sum = 0
    for (const v of values) {
      const u = (x - v) / bandwidth
      sum += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI))
    }
    points.push([x, sum / values.length])
  }
  return points
}

export function StatDistribution({ data, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useChartResize(containerRef)
  const [metricIdx, setMetricIdx] = useState(0)
  const [highlightConf, setHighlightConf] = useState('')

  const metric = METRICS[metricIdx]

  const qualified = useMemo(() => {
    return data.filter((b) => {
      const v = b[metric.key] as number
      return v != null && !isNaN(v) && b.pa >= 10
    })
  }, [data, metric.key])

  const allValues = useMemo(() => qualified.map((b) => b[metric.key] as number), [qualified, metric.key])
  const confValues = useMemo(() => {
    if (!highlightConf) return []
    return qualified.filter((b) => b.conference === highlightConf).map((b) => b[metric.key] as number)
  }, [qualified, highlightConf, metric.key])

  const conferences = useMemo(() => {
    const set = new Set<string>()
    for (const b of data) if (b.conference) set.add(b.conference)
    return Array.from(set).sort()
  }, [data])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svg.node() || !containerRef.current || allValues.length < 5) return
    svg.selectAll('*').interrupt()
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = Math.min(360, width * 0.55)
    svg.attr('height', height)

    const margins = { ...CHART_MARGINS, bottom: 56 }
    const innerW = width - margins.left - margins.right
    const innerH = height - margins.top - margins.bottom
    const g = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`)

    // Compute KDE
    const range = d3.extent(allValues) as [number, number]
    const bandwidth = (range[1] - range[0]) * 0.08
    const density = kernelDensity(allValues, bandwidth)

    // Scales
    const xScale = d3.scaleLinear()
      .domain(metric.domain ?? [density[0][0], density[density.length - 1][0]])
      .range([0, innerW])

    const maxDensity = d3.max(density, (d) => d[1]) ?? 1
    const yScale = d3.scaleLinear()
      .domain([0, maxDensity * 1.1])
      .range([innerH, 0])

    // Gradient fill
    const defs = svg.append('defs')
    const gradId = 'density-grad'
    const grad = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(191, 87, 0, 0.25)')
    grad.append('stop').attr('offset', '70%').attr('stop-color', 'rgba(191, 87, 0, 0.06)')
    grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(191, 87, 0, 0.0)')

    // Area
    const area = d3.area<[number, number]>()
      .x((d) => xScale(d[0]))
      .y0(innerH)
      .y1((d) => yScale(d[1]))
      .curve(d3.curveBasis)

    const line = d3.line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveBasis)

    // League distribution -- filled area
    g.append('path')
      .datum(density)
      .attr('d', area)
      .attr('fill', `url(#${gradId})`)

    // League curve -- the line
    const curvePath = g.append('path')
      .datum(density)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'var(--bsi-primary)')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .style('filter', 'drop-shadow(0 0 4px rgba(191, 87, 0, 0.3))')

    // Animate the curve drawing
    const totalLength = (curvePath.node() as SVGPathElement)?.getTotalLength() ?? 1000
    curvePath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)

    // Conference overlay
    if (highlightConf && confValues.length >= 3) {
      const confBandwidth = (range[1] - range[0]) * 0.1
      const confDensity = kernelDensity(confValues, confBandwidth)
      // Scale conference density to be proportional to its share
      const scaleFactor = confValues.length / allValues.length
      const confMax = d3.max(confDensity, (d) => d[1]) ?? 1
      const scaleY = d3.scaleLinear()
        .domain([0, confMax / scaleFactor])
        .range([innerH, 0])

      const confColor = getConfColor(highlightConf)

      const confGradId = 'conf-density-grad'
      const confGrad = defs.append('linearGradient')
        .attr('id', confGradId)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')
      confGrad.append('stop').attr('offset', '0%').attr('stop-color', withAlpha(confColor, 0.3))
      confGrad.append('stop').attr('offset', '100%').attr('stop-color', withAlpha(confColor, 0.0))

      const confArea = d3.area<[number, number]>()
        .x((d) => xScale(d[0]))
        .y0(innerH)
        .y1((d) => scaleY(d[1]))
        .curve(d3.curveBasis)

      g.append('path')
        .datum(confDensity)
        .attr('d', confArea)
        .attr('fill', `url(#${confGradId})`)
        .attr('opacity', 0)
        .transition()
        .duration(600)
        .attr('opacity', 1)

      g.append('path')
        .datum(confDensity)
        .attr('d', d3.line<[number, number]>()
          .x((d) => xScale(d[0]))
          .y((d) => scaleY(d[1]))
          .curve(d3.curveBasis))
        .attr('fill', 'none')
        .attr('stroke', confColor)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0)
        .transition()
        .duration(600)
        .attr('stroke-opacity', 0.9)
    }

    // League average vertical line
    const mean = d3.mean(allValues) ?? 0
    g.append('line')
      .attr('x1', xScale(mean)).attr('x2', xScale(mean))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(196,184,165,0.2)')
      .attr('stroke-dasharray', '3,3')

    g.append('text')
      .attr('x', xScale(mean))
      .attr('y', -6)
      .attr('fill', 'rgba(196,184,165,0.3)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .text(`AVG ${metric.format(mean)}`)

    // Player distribution rug plot -- tiny marks on x-axis
    g.selectAll('.rug')
      .data(allValues)
      .enter()
      .append('line')
      .attr('class', 'rug')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', innerH)
      .attr('y2', innerH + 4)
      .attr('stroke', 'rgba(191, 87, 0, 0.15)')
      .attr('stroke-width', 0.5)

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => metric.format(d as number))
    const xG = g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
    styleAxis(xG)

    drawAxisLabel(g, metric.label, innerW / 2, innerH + 44)

    // Y axis -- just a faint label, no ticks (density units aren't meaningful to users)
    g.append('text')
      .attr('transform', `translate(-36,${innerH / 2}) rotate(-90)`)
      .attr('fill', 'var(--bsi-dust)')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('letter-spacing', '0.08em')
      .text('DENSITY')

    return () => {
      svg.selectAll('*').interrupt()
    }
  }, [allValues, confValues, highlightConf, metric, containerWidth])

  return (
    <Card variant="elevated" className={className}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3
              className="text-base uppercase tracking-wider font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
            >
              Stat Distribution
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
              KDE density curve · {qualified.length} batters
              {highlightConf && ` · ${highlightConf} overlay`}
            </p>
          </div>

          {/* Metric selector pills */}
          <div className="flex flex-wrap gap-1">
            {METRICS.map((m, i) => (
              <button
                key={m.key}
                onClick={() => setMetricIdx(i)}
                aria-pressed={i === metricIdx}
                className={`px-2.5 py-1 rounded-[2px] text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  i === metricIdx
                    ? 'text-bsi-bone'
                    : 'text-bsi-dust hover:text-bsi-bone'
                }`}
                style={{
                  fontFamily: 'var(--font-display)',
                  background: i === metricIdx ? 'rgba(191, 87, 0, 0.12)' : 'transparent',
                  border: i === metricIdx ? '1px solid rgba(191, 87, 0, 0.2)' : '1px solid transparent',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative px-2 py-2">
        <svg ref={svgRef} width="100%" height={360} className="block" role="img" aria-label="Stat distribution density curve — league-wide KDE with conference overlay" />
      </div>

      {/* Conference filter -- click to overlay a conference distribution */}
      {conferences.length > 0 && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-vintage)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono text-bsi-dust uppercase tracking-wider shrink-0">
              Overlay:
            </span>
            <div className="flex flex-wrap gap-1">
              {conferences.map((c) => (
                <button
                  key={c}
                  onClick={() => setHighlightConf(highlightConf === c ? '' : c)}
                  aria-pressed={highlightConf === c}
                  className="px-2 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer"
                  style={{
                    color: highlightConf === c ? getConfColor(c) : 'var(--bsi-dust)',
                    background: highlightConf === c ? withAlpha(getConfColor(c), 0.12) : 'transparent',
                    border: highlightConf === c ? `1px solid ${withAlpha(getConfColor(c), 0.3)}` : '1px solid transparent',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
