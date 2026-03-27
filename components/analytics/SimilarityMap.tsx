'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useChartResize } from '@/lib/hooks/useChartResize'
import * as d3 from 'd3'
import { Card } from '@/components/ui/Card'
import { ChartTooltip } from '@/components/analytics/ChartTooltip'
import { getConfColor, zScore, CONF_COLORS, withAlpha } from '@/lib/analytics/viz'
import { PlayerSelect } from '@/components/analytics/PlayerSelect'
import { fmt3, fmtPct, fmtInt } from '@/lib/analytics/viz'
import type { BatterStats, PitcherStats, EnrichedBatter, EnrichedPitcher } from '@/lib/analytics/types'

// Stats used for batter similarity
const BATTER_KEYS: (keyof BatterStats)[] = ['woba', 'iso', 'k_pct', 'bb_pct', 'babip', 'avg']
const PITCHER_KEYS: (keyof PitcherStats)[] = ['fip', 'k_9', 'bb_9', 'era', 'whip']

type PlayerType = 'batting' | 'pitching'

interface SimilarPlayer {
  player_id: string
  player_name: string
  team: string
  conference: string
  distance: number
  similarity: number // 0-100, 100 = identical
}

function computeSimilarity<T extends Record<string, unknown>>(
  target: T,
  candidates: T[],
  keys: string[],
  allData: T[],
): SimilarPlayer[] {
  // Pre-compute z-score populations
  const populations: Record<string, number[]> = {}
  for (const key of keys) {
    populations[key] = allData
      .map((d) => d[key] as number)
      .filter((v) => v != null && isFinite(v))
  }

  // Z-score the target
  const targetZ: number[] = keys.map((k) => {
    const val = target[k] as number
    return val != null ? zScore(val, populations[k]) : 0
  })

  // Compute distances
  const results: SimilarPlayer[] = []
  for (const c of candidates) {
    if (c.player_id === target.player_id) continue

    const cZ = keys.map((k) => {
      const val = c[k] as number
      return val != null ? zScore(val, populations[k]) : 0
    })

    // Euclidean distance in z-score space
    let sumSq = 0
    for (let i = 0; i < targetZ.length; i++) {
      sumSq += (targetZ[i] - cZ[i]) ** 2
    }
    const dist = Math.sqrt(sumSq)

    // Convert to 0-100 similarity: exp(-dist) scaled
    const sim = Math.round(Math.max(0, Math.min(100, 100 * Math.exp(-dist / 2))))

    results.push({
      player_id: c.player_id as string,
      player_name: c.player_name as string,
      team: c.team as string,
      conference: (c as Record<string, string>).conference ?? '',
      distance: dist,
      similarity: sim,
    })
  }

  return results.sort((a, b) => a.distance - b.distance).slice(0, 10)
}

interface Props {
  batters: EnrichedBatter[]
  pitchers: EnrichedPitcher[]
  onPlayerClick?: (id: string) => void
  className?: string
}

export function SimilarityMap({ batters, pitchers, onPlayerClick, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useChartResize(containerRef)
  const [playerType, setPlayerType] = useState<PlayerType>('batting')
  const [centerId, setCenterId] = useState('')
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; player: SimilarPlayer
  } | null>(null)

  const keys = playerType === 'batting' ? BATTER_KEYS : PITCHER_KEYS

  const qualified = useMemo(() => {
    if (playerType === 'batting') {
      return batters.filter((b) => b.pa >= 10 && b.woba != null)
    }
    return pitchers.filter((p) => p.ip >= 5 && p.fip != null)
  }, [batters, pitchers, playerType])

  const topPlayers = useMemo(() => {
    if (playerType === 'batting') {
      return [...(qualified as EnrichedBatter[])].sort((a, b) => (b.woba ?? 0) - (a.woba ?? 0))
    }
    return [...(qualified as EnrichedPitcher[])].sort((a, b) => (a.fip ?? 99) - (b.fip ?? 99))
  }, [qualified, playerType])

  const center = useMemo(() => {
    if (!centerId) return topPlayers[0] ?? null
    return qualified.find((p) => p.player_id === centerId) ?? topPlayers[0] ?? null
  }, [qualified, centerId, topPlayers])

  const similar = useMemo(() => {
    if (!center) return []
    return computeSimilarity(
      center as unknown as Record<string, unknown>,
      qualified as unknown as Record<string, unknown>[],
      keys as string[],
      qualified as unknown as Record<string, unknown>[],
    )
  }, [center, qualified, keys])

  const handleRecenter = useCallback((id: string) => {
    setCenterId(id)
  }, [])

  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svg.node() || !containerRef.current || !center || similar.length === 0) return
    svg.selectAll('*').interrupt()
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const size = Math.min(460, width - 20)
    const height = size
    svg.attr('height', height)

    const cx = width / 2
    const cy = height / 2

    // Defs first -- filter definitions before content elements
    const defs = svg.append('defs')
    const glowFilter = defs.append('filter').attr('id', 'center-glow')
    glowFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '4')

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    // Max radius for layout
    const maxR = size / 2 - 50

    // Distance scale -- closest = smallest radius, furthest = maxR
    const maxDist = d3.max(similar, (d) => d.distance) ?? 1
    const rScale = d3.scaleLinear().domain([0, maxDist]).range([maxR * 0.3, maxR])

    // Concentric distance guide rings
    for (const pct of [0.33, 0.66, 1.0]) {
      g.append('circle')
        .attr('r', maxR * pct)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(196,184,165,0.06)')
        .attr('stroke-dasharray', '2,4')
    }

    // Lines from center to each satellite
    for (let i = 0; i < similar.length; i++) {
      const s = similar[i]
      const angle = (i / similar.length) * 2 * Math.PI - Math.PI / 2
      const r = rScale(s.distance)
      const sx = Math.cos(angle) * r
      const sy = Math.sin(angle) * r

      // Connection line
      const line = g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 0).attr('y2', 0)
        .attr('stroke', withAlpha(getConfColor(s.conference), 0.4))
        .attr('stroke-width', Math.max(1, 3 - s.distance * 0.4))

      line.transition()
        .duration(prefersReducedMotion ? 0 : 600)
        .delay(prefersReducedMotion ? 0 : i * 60)
        .ease(d3.easeCubicOut)
        .attr('x2', sx)
        .attr('y2', sy)

      // Similarity badge on line
      const badgeX = sx * 0.5
      const badgeY = sy * 0.5
      g.append('text')
        .attr('x', badgeX)
        .attr('y', badgeY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--bsi-dust)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '8px')
        .attr('opacity', 0)
        .text(`${s.similarity}`)
        .transition()
        .duration(prefersReducedMotion ? 0 : 400)
        .delay(prefersReducedMotion ? 0 : i * 60 + 400)
        .attr('opacity', 0.6)

      // Satellite dot
      const confColor = getConfColor(s.conference)
      const dot = g.append('circle')
        .attr('cx', 0).attr('cy', 0)
        .attr('r', 0)
        .attr('fill', confColor)
        .attr('fill-opacity', 0.8)
        .attr('stroke', confColor)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')

      dot.transition()
        .duration(prefersReducedMotion ? 0 : 600)
        .delay(prefersReducedMotion ? 0 : i * 60)
        .ease(d3.easeCubicOut)
        .attr('cx', sx)
        .attr('cy', sy)
        .attr('r', 7)

      // Player label
      const labelOffset = r > maxR * 0.7 ? -14 : 14
      g.append('text')
        .attr('x', sx)
        .attr('y', sy + labelOffset)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(196,184,165,0.5)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '9px')
        .attr('opacity', 0)
        .text(s.player_name.split(' ').pop() ?? '')
        .transition()
        .duration(prefersReducedMotion ? 0 : 400)
        .delay(prefersReducedMotion ? 0 : i * 60 + 300)
        .attr('opacity', 1)

      // Hover + click interactions
      const hitArea = g.append('circle')
        .attr('cx', sx).attr('cy', sy)
        .attr('r', 20)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')

      hitArea
        .on('mouseenter', (event) => {
          dot.attr('fill-opacity', 1).attr('stroke-opacity', 1).attr('r', 10)
          if (!containerRef.current) return
          const rect = containerRef.current.getBoundingClientRect()
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            player: s,
          })
        })
        .on('mouseleave', () => {
          dot.attr('fill-opacity', 0.8).attr('stroke-opacity', 0.3).attr('r', 7)
          setTooltip(null)
        })
        .on('touchstart', (event: unknown) => {
          const touch = (event as TouchEvent).touches?.[0]
          if (!touch || !containerRef.current) return
          dot.attr('fill-opacity', 1).attr('stroke-opacity', 1).attr('r', 10)
          const rect = containerRef.current.getBoundingClientRect()
          setTooltip({ x: touch.clientX - rect.left, y: touch.clientY - rect.top, player: s })
        })
        .on('touchend', () => {
          dot.attr('fill-opacity', 0.8).attr('stroke-opacity', 0.3).attr('r', 7)
          setTimeout(() => setTooltip(null), 1500)
        })
        .on('click', () => handleRecenter(s.player_id))
    }

    // Center node -- the selected player
    g.append('circle')
      .attr('r', 0)
      .attr('fill', 'var(--bsi-primary)')
      .attr('fill-opacity', 0.9)
      .attr('stroke', 'var(--bsi-primary)')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 3)
      .transition()
      .duration(prefersReducedMotion ? 0 : 500)
      .ease(d3.easeBackOut)
      .attr('r', 14)

    // Center glow -- uses filter defined in defs above
    g.append('circle')
      .attr('r', 0)
      .attr('fill', 'var(--bsi-primary)')
      .attr('opacity', 0.2)
      .style('filter', 'url(#center-glow)')
      .transition()
      .duration(prefersReducedMotion ? 0 : 500)
      .ease(d3.easeBackOut)
      .attr('r', 14)

    g.append('text')
      .attr('y', -22)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--bsi-bone)')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(center.player_name)

    g.append('text')
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--bsi-dust)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '9px')
      .text(center.team)

    return () => {
      svg.selectAll('*').interrupt()
    }
  }, [center, similar, handleRecenter, containerWidth, prefersReducedMotion])

  if (qualified.length === 0) return null

  return (
    <Card variant="elevated" className={className}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3
              className="text-base uppercase tracking-wider font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
            >
              Player Similarity
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
              Euclidean distance across z-scored stats · Click satellites to re-center
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Type toggle */}
            <div className="flex gap-1">
              {(['batting', 'pitching'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setPlayerType(t); setCenterId('') }}
                  className={`px-2.5 py-1 rounded-[2px] text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                    t === playerType
                      ? 'text-[var(--bsi-bone)]'
                      : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)]'
                  }`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: t === playerType ? 'rgba(191, 87, 0, 0.12)' : 'transparent',
                    border: t === playerType ? '1px solid rgba(191, 87, 0, 0.2)' : '1px solid transparent',
                  }}
                >
                  {t === 'batting' ? 'Batters' : 'Pitchers'}
                </button>
              ))}
            </div>

            {/* Player selector */}
            <PlayerSelect
              players={topPlayers.slice(0, 100).map((p) => ({
                player_id: p.player_id,
                player_name: p.player_name,
                team: p.team,
                conference: (p as EnrichedBatter & EnrichedPitcher).conference,
              }))}
              value={centerId || (center?.player_id ?? '')}
              onChange={setCenterId}
            />
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative px-2 py-2">
        <svg ref={svgRef} width="100%" className="block" role="img" aria-label="Player similarity map — nearest statistical neighbors by Euclidean distance" />
        {tooltip && (
          <ChartTooltip
            x={tooltip.x}
            y={tooltip.y}
            containerWidth={containerRef.current?.clientWidth ?? 400}
            title={tooltip.player.player_name}
            subtitle={`${tooltip.player.team} · ${tooltip.player.conference}`}
            fields={[
              { label: 'Similarity', value: `${tooltip.player.similarity}%`, color: tooltip.player.similarity > 70 ? '#10B981' : tooltip.player.similarity > 40 ? '#F59E0B' : '#e74c3c' },
              { label: 'Distance', value: tooltip.player.distance.toFixed(2) },
            ]}
          />
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 rounded" style={{ background: 'rgba(196,184,165,0.3)' }} />
            <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>Thin = distant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-1 rounded" style={{ background: 'rgba(196,184,165,0.5)' }} />
            <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>Thick = close match</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--bsi-primary)' }} />
            <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>Center player</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {Object.entries(CONF_COLORS).slice(0, 8).map(([conf, color]) => (
            <div key={conf} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[8px] font-mono" style={{ color: 'var(--bsi-dust)' }}>{conf}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
            Click any node to re-center · Stats: {playerType === 'batting' ? BATTER_KEYS.join(', ') : PITCHER_KEYS.join(', ')}
          </span>
        </div>
      </div>
    </Card>
  )
}
