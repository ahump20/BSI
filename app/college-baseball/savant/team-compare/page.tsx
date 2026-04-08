'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { teamMetadata, teamNameToSlug } from '@/lib/data/team-metadata';

interface TeamSaber {
  team: string;
  conference: string;
  woba?: number;
  wrc_plus?: number;
  ops?: number;
  bb_pct?: number;
  k_pct?: number;
  iso?: number;
  babip?: number;
  era?: number;
  fip?: number;
  era_minus?: number;
  whip?: number;
  k_9?: number;
  bb_9?: number;
}

const TEAM_SLUGS = Object.keys(teamMetadata).sort();

const COMPARE_METRICS: {
  key: keyof TeamSaber;
  label: string;
  higherBetter: boolean;
  format: (v: number) => string;
  category: 'batting' | 'pitching';
}[] = [
  { key: 'woba', label: 'wOBA', higherBetter: true, format: (v) => v?.toFixed(3) ?? '—', category: 'batting' },
  { key: 'wrc_plus', label: 'wRC+', higherBetter: true, format: (v) => Math.round(v)?.toString() ?? '—', category: 'batting' },
  { key: 'ops', label: 'OPS', higherBetter: true, format: (v) => v?.toFixed(3) ?? '—', category: 'batting' },
  { key: 'bb_pct', label: 'BB%', higherBetter: true, format: (v) => (v * 100).toFixed(1) + '%', category: 'batting' },
  { key: 'k_pct', label: 'K%', higherBetter: false, format: (v) => (v * 100).toFixed(1) + '%', category: 'batting' },
  { key: 'iso', label: 'ISO', higherBetter: true, format: (v) => v?.toFixed(3) ?? '—', category: 'batting' },
  { key: 'era', label: 'ERA', higherBetter: false, format: (v) => v?.toFixed(2) ?? '—', category: 'pitching' },
  { key: 'fip', label: 'FIP', higherBetter: false, format: (v) => v?.toFixed(2) ?? '—', category: 'pitching' },
  { key: 'whip', label: 'WHIP', higherBetter: false, format: (v) => v?.toFixed(2) ?? '—', category: 'pitching' },
  { key: 'k_9', label: 'K/9', higherBetter: true, format: (v) => v?.toFixed(1) ?? '—', category: 'pitching' },
  { key: 'bb_9', label: 'BB/9', higherBetter: false, format: (v) => v?.toFixed(1) ?? '—', category: 'pitching' },
];

function CompareRow({
  label,
  leftVal,
  rightVal,
  higherBetter,
  format,
}: {
  label: string;
  leftVal: number | undefined;
  rightVal: number | undefined;
  higherBetter: boolean;
  format: (v: number) => string;
}) {
  const lv = leftVal ?? 0;
  const rv = rightVal ?? 0;
  const leftWins = higherBetter ? lv > rv : lv < rv;
  const rightWins = higherBetter ? rv > lv : rv < lv;
  const tied = Math.abs(lv - rv) < 0.001;

  return (
    <div className="flex items-center gap-3 py-3 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span
        className="font-mono text-sm w-16 text-right tabular-nums"
        style={{
          color: tied ? 'var(--bsi-dust)' : leftWins ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
          fontWeight: leftWins ? 700 : 400,
        }}
      >
        {leftVal != null ? format(leftVal) : '—'}
      </span>
      <div className="flex-1 text-center">
        <span className="font-oswald uppercase text-[11px] tracking-wider" style={{ color: 'var(--bsi-dust)' }}>
          {label}
        </span>
      </div>
      <span
        className="font-mono text-sm w-16 tabular-nums"
        style={{
          color: tied ? 'var(--bsi-dust)' : rightWins ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
          fontWeight: rightWins ? 700 : 400,
        }}
      >
        {rightVal != null ? format(rightVal) : '—'}
      </span>
    </div>
  );
}

export default function TeamComparePage() {
  const [leftSlug, setLeftSlug] = useState('texas');
  const [rightSlug, setRightSlug] = useState('lsu');
  const [leftData, setLeftData] = useState<TeamSaber | null>(null);
  const [rightData, setRightData] = useState<TeamSaber | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [lRes, rRes] = await Promise.all([
          fetch(`/api/college-baseball/teams/${leftSlug}/sabermetrics`),
          fetch(`/api/college-baseball/teams/${rightSlug}/sabermetrics`),
        ]);
        const lJson = (await lRes.json()) as TeamSaber & { batting?: TeamSaber };
        const rJson = (await rRes.json()) as TeamSaber & { batting?: TeamSaber };
        setLeftData(lJson.batting ?? lJson);
        setRightData(rJson.batting ?? rJson);
      } catch {
        setLeftData(null);
        setRightData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leftSlug, rightSlug]);

  const leftName = teamMetadata[leftSlug]?.shortName ?? leftSlug;
  const rightName = teamMetadata[rightSlug]?.shortName ?? rightSlug;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-scoreboard, #0A0A0A)' }}>
      <Container>
        <div className="py-10 sm:py-14 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-6" style={{ fontFamily: 'var(--bsi-font-data, monospace)', color: 'var(--bsi-dust, #C4B8A5)' }}>
            <Link href="/" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>Home</Link>
            <span>/</span>
            <Link href="/college-baseball" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>College Baseball</Link>
            <span>/</span>
            <Link href="/college-baseball/savant" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>Savant</Link>
            <span>/</span>
            <span style={{ color: 'var(--bsi-primary, #BF5700)' }}>Team Compare</span>
          </nav>

          <h1
            className="font-oswald uppercase text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-2"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Team Comparison
          </h1>
          <p className="font-cormorant text-base mb-8" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
            Side-by-side advanced metrics for any two D1 programs.
          </p>

          {/* Selectors */}
          <div className="flex items-center gap-4 mb-8">
            <select
              value={leftSlug}
              onChange={(e) => setLeftSlug(e.target.value)}
              className="font-oswald uppercase text-sm tracking-wider px-3 py-2 appearance-none cursor-pointer flex-1"
              style={{
                background: 'var(--surface-dugout, #161616)',
                color: 'var(--bsi-bone)',
                border: '1px solid var(--bsi-primary, #BF5700)',
              }}
              aria-label="Left team"
            >
              {TEAM_SLUGS.map((s) => (
                <option key={s} value={s}>{teamMetadata[s]?.shortName ?? s}</option>
              ))}
            </select>
            <span className="font-oswald uppercase text-sm tracking-widest" style={{ color: 'var(--bsi-dust)' }}>vs</span>
            <select
              value={rightSlug}
              onChange={(e) => setRightSlug(e.target.value)}
              className="font-oswald uppercase text-sm tracking-wider px-3 py-2 appearance-none cursor-pointer flex-1"
              style={{
                background: 'var(--surface-dugout, #161616)',
                color: 'var(--bsi-bone)',
                border: '1px solid var(--heritage-columbia-blue, #4B9CD3)',
              }}
              aria-label="Right team"
            >
              {TEAM_SLUGS.map((s) => (
                <option key={s} value={s}>{teamMetadata[s]?.shortName ?? s}</option>
              ))}
            </select>
          </div>

          {/* Comparison */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bsi-shimmer" style={{ background: 'var(--surface-dugout, #161616)' }} />
              ))}
            </div>
          ) : (
            <div
              className="heritage-card overflow-hidden"
              style={{
                background: 'var(--surface-dugout, #161616)',
                border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}>
                <span className="font-oswald uppercase text-sm font-bold" style={{ color: 'var(--bsi-primary, #BF5700)' }}>{leftName}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--bsi-dust)' }}>Batting</span>
                <span className="font-oswald uppercase text-sm font-bold" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>{rightName}</span>
              </div>

              {COMPARE_METRICS.filter(m => m.category === 'batting').map((m) => (
                <CompareRow
                  key={m.key}
                  label={m.label}
                  leftVal={leftData?.[m.key] as number | undefined}
                  rightVal={rightData?.[m.key] as number | undefined}
                  higherBetter={m.higherBetter}
                  format={m.format}
                />
              ))}

              {/* Pitching header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '2px solid var(--border-vintage, rgba(140,98,57,0.3))', borderBottom: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}>
                <span className="font-oswald uppercase text-sm font-bold" style={{ color: 'var(--bsi-primary, #BF5700)' }}>{leftName}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--bsi-dust)' }}>Pitching</span>
                <span className="font-oswald uppercase text-sm font-bold" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>{rightName}</span>
              </div>

              {COMPARE_METRICS.filter(m => m.category === 'pitching').map((m) => (
                <CompareRow
                  key={m.key}
                  label={m.label}
                  leftVal={leftData?.[m.key] as number | undefined}
                  rightVal={rightData?.[m.key] as number | undefined}
                  higherBetter={m.higherBetter}
                  format={m.format}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
