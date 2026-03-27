'use client';

/**
 * Homepage Dashboard — operational data surface.
 * Two-column layout: orientation (nav + standouts) left, live data right.
 * No marketing copy. The data IS the homepage.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fmt3, fmt2 } from '@/lib/analytics/viz';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
  player_id?: string;
  player_name: string;
  team: string;
  conference?: string;
  pa?: number;
  ip?: number;
  woba?: number;
  wrc_plus?: number;
  avg?: number;
  obp?: number;
  slg?: number;
  iso?: number;
  k_pct?: number;
  bb_pct?: number;
  fip?: number;
  era?: number;
  whip?: number;
  k_9?: number;
  bb_9?: number;
  [key: string]: unknown;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Nav Items — product entry points
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { title: 'Savant', href: '/college-baseball/savant/', icon: '◈', desc: 'Leaderboards' },
  { title: 'Scores', href: '/scores/', icon: '⚾', desc: 'Live games' },
  { title: 'Rankings', href: '/college-baseball/rankings/', icon: '▲', desc: 'National poll' },
  { title: 'Visuals', href: '/college-baseball/savant/visuals/', icon: '◆', desc: '16 charts' },
  { title: 'Bubble', href: '/college-baseball/savant/bubble/', icon: '◉', desc: 'Tournament' },
  { title: 'Ask BSI', href: '/ask/', icon: '✦', desc: 'AI analysis' },
  { title: 'Standings', href: '/college-baseball/standings/', icon: '≡', desc: 'Conferences' },
  { title: 'Compare', href: '/college-baseball/compare/', icon: '⇔', desc: 'Head-to-head' },
] as const;

// ---------------------------------------------------------------------------
// Compact Leaderboard
// ---------------------------------------------------------------------------

function LeaderboardTable({ title, href, data, columns }: {
  title: string;
  href: string;
  data: LeaderboardEntry[];
  columns: { key: string; label: string; format: (v: number) => string; accent?: boolean }[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h2
          className="text-[11px] uppercase tracking-[0.15em] font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-primary)' }}
        >
          {title}
        </h2>
        <Link
          href={href}
          className="text-[9px] font-mono uppercase tracking-wider transition-colors"
          style={{ color: 'var(--bsi-dust)' }}
        >
          Full board &rarr;
        </Link>
      </div>

      <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--border-vintage)' }}>
        <table className="w-full text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-press-box)' }}>
              <th className="text-left pl-3 pr-1 py-1.5 font-bold" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>#</th>
              <th className="text-left px-1 py-1.5 font-bold" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>PLAYER</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right px-1 py-1.5 font-bold"
                  style={{ color: col.accent ? 'var(--bsi-primary)' : 'var(--bsi-dust)', fontSize: '9px' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr
                key={row.player_id ?? idx}
                className="border-t transition-colors duration-100 hover:bg-[rgba(191,87,0,0.04)]"
                style={{ borderColor: 'rgba(196,184,165,0.06)' }}
              >
                <td className="pl-3 pr-1 py-1.5 tabular-nums" style={{ color: 'var(--bsi-dust)' }}>{idx + 1}</td>
                <td className="px-1 py-1.5">
                  <Link
                    href={row.player_id ? `/college-baseball/savant/player/${row.player_id}/` : '#'}
                    className="transition-colors duration-100 hover:text-[var(--bsi-primary)]"
                    style={{ color: 'var(--bsi-bone)' }}
                  >
                    {row.player_name}
                  </Link>
                  <span className="block text-[9px] mt-px" style={{ color: 'rgba(196,184,165,0.5)' }}>
                    {row.team}
                  </span>
                </td>
                {columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td
                      key={col.key}
                      className="text-right px-1 py-1.5 tabular-nums"
                      style={{ color: col.accent ? 'var(--bsi-bone)' : 'var(--bsi-dust)' }}
                    >
                      {typeof val === 'number' ? col.format(val) : '--'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="border rounded-sm overflow-hidden animate-pulse" style={{ borderColor: 'var(--border-vintage)' }}>
      <div className="h-7" style={{ background: 'var(--surface-press-box)' }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: 'rgba(196,184,165,0.06)' }}>
          <div className="h-3 w-4 rounded" style={{ background: 'rgba(196,184,165,0.08)' }} />
          <div className="h-3 flex-1 rounded" style={{ background: 'rgba(196,184,165,0.1)' }} />
          <div className="h-3 w-10 rounded" style={{ background: 'rgba(196,184,165,0.08)' }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function HomePageClient() {
  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=50', { refreshInterval: 300_000 });
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=50', { refreshInterval: 300_000 });

  const batters = battingRes?.data ?? [];
  const pitchers = pitchingRes?.data ?? [];

  const topHitter = useMemo(() => {
    return [...batters]
      .filter((b) => b.wrc_plus != null && (b.pa ?? 0) >= 30)
      .sort((a, b) => (b.wrc_plus ?? 0) - (a.wrc_plus ?? 0))[0] ?? null;
  }, [batters]);

  const topPitcher = useMemo(() => {
    return [...pitchers]
      .filter((p) => p.fip != null && (p.ip ?? 0) >= 10)
      .sort((a, b) => (a.fip ?? 99) - (b.fip ?? 99))[0] ?? null;
  }, [pitchers]);

  return (
    <div className="min-h-screen">
      {/* ── Main grid: two-column on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 lg:gap-6 p-4 md:p-6">

        {/* ── Left column: orientation ── */}
        <div className="space-y-4">

          {/* Brand mark */}
          <div>
            <h1
              className="text-lg font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-hero)', color: 'var(--bsi-bone)', lineHeight: 1.1 }}
            >
              Blaze Sports Intel
            </h1>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--bsi-dust)' }}>
              D1 baseball sabermetrics &middot; live scores &middot; scouting
            </p>
          </div>

          {/* Nav grid */}
          <nav className="grid grid-cols-2 gap-1.5" aria-label="Quick navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2 px-2.5 py-2 rounded-sm transition-all duration-100
                           hover:bg-[rgba(191,87,0,0.06)] border"
                style={{ borderColor: 'rgba(196,184,165,0.06)', background: 'transparent' }}
              >
                <span className="text-sm shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--bsi-primary)' }}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block group-hover:text-[var(--bsi-primary)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
                  >
                    {item.title}
                  </span>
                  <span className="text-[8px] font-mono block" style={{ color: 'rgba(196,184,165,0.5)' }}>
                    {item.desc}
                  </span>
                </div>
              </Link>
            ))}
          </nav>

          {/* Standout hitter */}
          {topHitter && (
            <div className="border rounded-sm p-3" style={{ borderColor: 'var(--border-vintage)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>
                  Top hitter
                </span>
              </div>
              <Link
                href={topHitter.player_id ? `/college-baseball/savant/player/${topHitter.player_id}/` : '/college-baseball/savant/'}
                className="block group"
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-sm font-bold group-hover:text-[var(--bsi-primary)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
                  >
                    {topHitter.player_name}
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums" style={{ color: '#10B981' }}>
                    {Math.round(topHitter.wrc_plus ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                    {topHitter.team} &middot; {topHitter.pa} PA
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>wRC+</span>
                </div>
              </Link>
              <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(196,184,165,0.06)' }}>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt3(topHitter.woba ?? 0)} wOBA
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt3(topHitter.avg ?? 0)} AVG
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt3(topHitter.iso ?? 0)} ISO
                </span>
              </div>
            </div>
          )}

          {/* Standout pitcher */}
          {topPitcher && (
            <div className="border rounded-sm p-3" style={{ borderColor: 'var(--border-vintage)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--heritage-columbia-blue)' }} />
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>
                  Top pitcher
                </span>
              </div>
              <Link
                href={topPitcher.player_id ? `/college-baseball/savant/player/${topPitcher.player_id}/` : '/college-baseball/savant/'}
                className="block group"
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-sm font-bold group-hover:text-[var(--bsi-primary)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
                  >
                    {topPitcher.player_name}
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums" style={{ color: 'var(--heritage-columbia-blue)' }}>
                    {fmt2(topPitcher.fip ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                    {topPitcher.team} &middot; {topPitcher.ip} IP
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>FIP</span>
                </div>
              </Link>
              <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(196,184,165,0.06)' }}>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt2(topPitcher.era ?? 0)} ERA
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt2(topPitcher.k_9 ?? 0)} K/9
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                  {fmt2(topPitcher.whip ?? 0)} WHIP
                </span>
              </div>
            </div>
          )}

          {/* Ask BSI */}
          <Link
            href="/ask/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all duration-100
                       hover:bg-[rgba(191,87,0,0.04)] hover:border-[rgba(191,87,0,0.2)]"
            style={{ borderColor: 'rgba(196,184,165,0.06)' }}
          >
            <span className="text-base" style={{ color: '#A855F7' }}>✦</span>
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
              >
                Ask BSI
              </span>
              <span className="text-[8px] font-mono" style={{ color: 'rgba(196,184,165,0.5)' }}>
                AI-powered analysis
              </span>
            </div>
          </Link>

          {/* Attribution */}
          <p className="text-[9px] font-mono pt-2" style={{ color: 'rgba(196,184,165,0.3)' }}>
            Born to Blaze the Path Beaten Less
          </p>
        </div>

        {/* ── Right column: live data ── */}
        <div className="space-y-5 mt-4 lg:mt-0">
          <DataErrorBoundary name="BattingLeaderboard" compact>
            {battingLoading ? <TableSkeleton /> : batters.length > 0 ? (
              <LeaderboardTable
                title="Batting Leaders"
                href="/college-baseball/savant/"
                data={batters}
                columns={[
                  { key: 'woba', label: 'wOBA', format: fmt3, accent: true },
                  { key: 'wrc_plus', label: 'wRC+', format: (v) => String(Math.round(v)) },
                  { key: 'avg', label: 'AVG', format: fmt3 },
                  { key: 'slg', label: 'SLG', format: fmt3 },
                ]}
              />
            ) : null}
          </DataErrorBoundary>

          <DataErrorBoundary name="PitchingLeaderboard" compact>
            {pitchingLoading ? <TableSkeleton /> : pitchers.length > 0 ? (
              <LeaderboardTable
                title="Pitching Leaders"
                href="/college-baseball/savant/"
                data={pitchers}
                columns={[
                  { key: 'fip', label: 'FIP', format: fmt2, accent: true },
                  { key: 'era', label: 'ERA', format: fmt2 },
                  { key: 'k_9', label: 'K/9', format: fmt2 },
                  { key: 'whip', label: 'WHIP', format: fmt2 },
                ]}
              />
            ) : null}
          </DataErrorBoundary>
        </div>
      </div>
    </div>
  );
}
