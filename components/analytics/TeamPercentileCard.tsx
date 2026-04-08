'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { computePercentile, getConfColor, getPercentileColor, withAlpha, fmt3, fmtPct } from '@/lib/analytics/viz'
import type { BatterStats } from '@/lib/analytics/types'

type EnrichedBatter = BatterStats & { conference: string }

interface TeamAgg {
  team: string
  conference: string
  playerCount: number
  avg_woba: number
  avg_iso: number
  avg_k_pct: number
  avg_bb_pct: number
  avg_avg: number
  avg_babip: number
}

interface StatDef {
  key: keyof TeamAgg
  label: string
  format: (v: number) => string
  higherIsBetter: boolean
}

const STATS: StatDef[] = [
  { key: 'avg_woba', label: 'wOBA', format: fmt3, higherIsBetter: true },
  { key: 'avg_iso', label: 'ISO', format: fmt3, higherIsBetter: true },
  { key: 'avg_avg', label: 'AVG', format: fmt3, higherIsBetter: true },
  { key: 'avg_babip', label: 'BABIP', format: fmt3, higherIsBetter: true },
  { key: 'avg_k_pct', label: 'K%', format: fmtPct, higherIsBetter: false },
  { key: 'avg_bb_pct', label: 'BB%', format: fmtPct, higherIsBetter: true },
]

interface Props {
  data: EnrichedBatter[]
  className?: string
}

/**
 * Team-level percentile card — horizontal bars showing a team's average stats
 * percentiled against all D1 teams. Same Savant color scale as the player card.
 */
export function TeamPercentileCard({ data, className = '' }: Props) {
  const [selectedTeam, setSelectedTeam] = useState('')

  // Aggregate batters by team
  const teams = useMemo(() => {
    const teamMap = new Map<string, { batters: EnrichedBatter[] }>()
    for (const b of data) {
      if (b.pa < 10 || b.woba == null) continue
      const existing = teamMap.get(b.team)
      if (existing) {
        existing.batters.push(b)
      } else {
        teamMap.set(b.team, { batters: [b] })
      }
    }

    const safeAvg = (arr: number[]) => {
      const valid = arr.filter((v) => v != null && isFinite(v))
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
    }

    const result: TeamAgg[] = []
    for (const [team, { batters }] of teamMap) {
      if (batters.length < 3) continue // need at least 3 qualifying batters
      result.push({
        team,
        conference: batters[0].conference,
        playerCount: batters.length,
        avg_woba: safeAvg(batters.map((b) => b.woba)),
        avg_iso: safeAvg(batters.map((b) => b.iso)),
        avg_k_pct: safeAvg(batters.map((b) => b.k_pct)),
        avg_bb_pct: safeAvg(batters.map((b) => b.bb_pct)),
        avg_avg: safeAvg(batters.map((b) => b.avg)),
        avg_babip: safeAvg(batters.map((b) => b.babip)),
      })
    }

    return result.sort((a, b) => b.avg_woba - a.avg_woba)
  }, [data])

  // Pre-compute all values for percentile
  const allValues = useMemo(() => {
    const map: Partial<Record<keyof TeamAgg, number[]>> = {}
    for (const stat of STATS) {
      map[stat.key] = teams.map((t) => t[stat.key] as number).filter((v) => isFinite(v))
    }
    return map
  }, [teams])

  const activeTeam = useMemo(() => {
    if (selectedTeam) return teams.find((t) => t.team === selectedTeam) ?? teams[0]
    return teams[0]
  }, [teams, selectedTeam])

  const percentiles = useMemo(() => {
    if (!activeTeam) return []
    return STATS.map((stat) => {
      const val = activeTeam[stat.key] as number
      const vals = allValues[stat.key] ?? []
      const pct = val != null && vals.length > 0
        ? computePercentile(val, vals, stat.higherIsBetter)
        : 50
      return { ...stat, value: val, percentile: Math.round(pct) }
    })
  }, [activeTeam, allValues])

  if (teams.length === 0 || !activeTeam) return null

  const confColor = getConfColor(activeTeam.conference)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Card variant="elevated" className={className}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3
              className="text-base uppercase tracking-wider font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
            >
              Team Percentile Card
            </h3>
            <p className="text-[10px] font-mono mt-0.5 text-bsi-dust">
              Team batting averages vs all D1 teams · {teams.length} teams
            </p>
          </div>

          {/* Team selector */}
          <select
            value={selectedTeam || activeTeam.team}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-1.5 rounded-[2px] text-xs font-mono cursor-pointer"
            style={{
              background: 'rgba(196,184,165,0.04)',
              border: '1px solid var(--border-vintage)',
              color: 'var(--bsi-bone)',
              maxWidth: 240,
            }}
          >
            {teams.map((t) => (
              <option key={t.team} value={t.team}>
                {t.team} ({t.conference})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Team header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-[2px] flex items-center justify-center"
            style={{
              background: withAlpha(confColor, 0.12),
              border: `1px solid ${withAlpha(confColor, 0.3)}`,
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: confColor }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}>
              {activeTeam.team}
            </div>
            <div className="text-[10px] font-mono text-bsi-dust">
              {activeTeam.conference} · {activeTeam.playerCount} qualifying batters
            </div>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-2.5">
          {percentiles.map((s, i) => {
            const color = getPercentileColor(s.percentile)
            const pct = Math.max(2, s.percentile)
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div
                  className="w-12 text-right text-[10px] uppercase tracking-wider shrink-0"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-dust)' }}
                >
                  {s.label}
                </div>
                <div
                  className="flex-1 h-5 rounded-[2px] relative overflow-hidden"
                  style={{ background: 'rgba(196,184,165,0.03)' }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-[2px]"
                    style={{ backgroundColor: color }}
                    initial={{ width: prefersReducedMotion ? `${pct}%` : '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center px-2"
                    initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.06 + 0.4 }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: s.percentile > 40 ? 'rgba(0,0,0,0.7)' : 'var(--bsi-bone)' }}
                    >
                      {s.format(s.value)}
                    </span>
                  </motion.div>
                </div>
                <motion.div
                  className="w-8 text-right text-xs font-mono font-bold shrink-0"
                 
                  initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.06 + 0.3 }}
                >
                  {s.percentile}
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Color scale legend */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {[0, 15, 30, 50, 70, 85, 100].map((p) => (
            <div key={p} className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getPercentileColor(p) }} />
              <span className="text-[8px] font-mono text-bsi-dust">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
