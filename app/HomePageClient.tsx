'use client';

/**
 * Homepage Dashboard — the grown-up version of Labs' Dashboard.
 * Data-first, dense, live. Designed for the sidebar shell.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HeroScoreStrip } from '@/components/home/HeroScoreStrip';
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
  era_minus?: number;
  [key: string]: unknown;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Nav Cards
// ---------------------------------------------------------------------------

const NAV_CARDS = [
  { title: 'Savant', subtitle: 'Batting & pitching leaderboards', href: '/college-baseball/savant/', icon: '◈', color: 'var(--bsi-primary)' },
  { title: 'Live Scores', subtitle: 'Every D1 game, real-time', href: '/scores/', icon: '⚾', color: '#10B981' },
  { title: 'Rankings', subtitle: 'National poll + RPI', href: '/college-baseball/rankings/', icon: '▲', color: '#F59E0B' },
  { title: 'Visuals', subtitle: '16 interactive charts', href: '/college-baseball/savant/visuals/', icon: '◆', color: 'var(--heritage-columbia-blue)' },
  { title: 'Bubble Watch', subtitle: 'Tournament field projection', href: '/college-baseball/savant/bubble/', icon: '◉', color: '#EF4444' },
  { title: 'Ask BSI', subtitle: 'AI-powered baseball analysis', href: '/ask/', icon: '✦', color: '#A855F7' },
] as const;

// ---------------------------------------------------------------------------
// Standout Card
// ---------------------------------------------------------------------------

function StandoutCard({ player, statLabel, statValue, statColor, subtitle }: {
  player: LeaderboardEntry;
  statLabel: string;
  statValue: string;
  statColor: string;
  subtitle: string;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={player.player_id ? `/college-baseball/savant/player/${player.player_id}/` : '/college-baseball/savant/'}
              className="text-base font-bold block truncate transition-colors hover:text-[var(--bsi-primary)]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
            >
              {player.player_name}
            </Link>
            <span className="text-[10px] font-mono block mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
              {player.team}{player.conference ? ` · ${player.conference}` : ''}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span
              className="text-xl font-bold font-mono block"
              style={{ color: statColor }}
            >
              {statValue}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider block" style={{ color: 'var(--bsi-dust)' }}>
              {statLabel}
            </span>
          </div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--bsi-dust)' }}>{subtitle}</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compact Leaderboard Table
// ---------------------------------------------------------------------------

function CompactLeaderboard({ title, data, columns }: {
  title: string;
  data: LeaderboardEntry[];
  columns: { key: string; label: string; format: (v: number) => string }[];
}) {
  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <div className="flex items-center justify-between">
          <h3
            className="text-xs uppercase tracking-wider font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
          >
            {title}
          </h3>
          <Link
            href="/college-baseball/savant/"
            className="text-[10px] font-mono transition-colors hover:text-[var(--bsi-primary)]"
            style={{ color: 'var(--bsi-dust)' }}
          >
            Full leaderboard →
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr style={{ background: 'var(--surface-press-box)' }}>
              <th className="text-left px-4 py-2 font-bold uppercase tracking-wider" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>#</th>
              <th className="text-left px-2 py-2 font-bold uppercase tracking-wider" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>Player</th>
              <th className="text-left px-2 py-2 font-bold uppercase tracking-wider" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>Team</th>
              {columns.map((col) => (
                <th key={col.key} className="text-right px-2 py-2 font-bold uppercase tracking-wider" style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr
                key={row.player_id ?? idx}
                className="border-t transition-colors hover:bg-[rgba(196,184,165,0.04)]"
                style={{ borderColor: 'rgba(196,184,165,0.06)' }}
              >
                <td className="px-4 py-2" style={{ color: 'var(--bsi-dust)' }}>{idx + 1}</td>
                <td className="px-2 py-2">
                  <Link
                    href={row.player_id ? `/college-baseball/savant/player/${row.player_id}/` : '#'}
                    className="transition-colors hover:text-[var(--bsi-primary)]"
                    style={{ color: 'var(--bsi-bone)' }}
                  >
                    {row.player_name}
                  </Link>
                </td>
                <td className="px-2 py-2" style={{ color: 'var(--bsi-dust)' }}>{row.team}</td>
                {columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td key={col.key} className="text-right px-2 py-2" style={{ color: 'var(--bsi-bone)' }}>
                      {typeof val === 'number' ? col.format(val) : '--'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function HomePageClient() {
  const { data: battingRes, loading: battingLoading, meta: battingMeta } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=50', {
      refreshInterval: 300_000,
    });

  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=50', {
      refreshInterval: 300_000,
    });

  const batters = battingRes?.data ?? [];
  const pitchers = pitchingRes?.data ?? [];

  // Top standouts
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

  const isLoading = battingLoading || pitchingLoading;

  return (
    <div className="min-h-screen pb-8">
      {/* Score ticker */}
      <div className="border-b" style={{ borderColor: 'var(--border-vintage)' }}>
        <DataErrorBoundary name="ScoreTicker" compact>
          <HeroScoreStrip />
        </DataErrorBoundary>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 pt-5 space-y-5">
        {/* Hero strip — brand + live indicator */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1
              className="text-xl md:text-2xl font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-hero)', color: 'var(--bsi-bone)' }}
            >
              Blaze Sports Intel
            </h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
              College baseball sabermetrics · live scores · scouting
            </p>
          </div>
          <div className="flex items-center gap-2">
            {battingMeta && (
              <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                Updated {new Date(battingMeta.fetchedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/Chicago',
                })} CT
              </span>
            )}
            <Badge variant="accent" className="text-[9px]">LIVE</Badge>
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {NAV_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all hover:bg-[rgba(196,184,165,0.04)]"
              style={{
                background: 'var(--surface-dugout)',
                border: '1px solid var(--border-vintage)',
              }}
            >
              <span className="text-base shrink-0" style={{ color: card.color }}>
                {card.icon}
              </span>
              <div className="min-w-0">
                <span
                  className="text-xs font-bold uppercase tracking-wider block group-hover:text-[var(--bsi-primary)] transition-colors"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
                >
                  {card.title}
                </span>
                <span className="text-[9px] font-mono block" style={{ color: 'var(--bsi-dust)' }}>
                  {card.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Standouts */}
        {!isLoading && (topHitter || topPitcher) && (
          <div>
            <h2 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--bsi-dust)' }}>
              Today&apos;s Standouts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topHitter && (
                <StandoutCard
                  player={topHitter}
                  statLabel="wRC+"
                  statValue={String(Math.round(topHitter.wrc_plus ?? 0))}
                  statColor="#10B981"
                  subtitle={`${fmt3(topHitter.woba ?? 0)} wOBA · ${fmt3(topHitter.avg ?? 0)} AVG · ${topHitter.pa} PA`}
                />
              )}
              {topPitcher && (
                <StandoutCard
                  player={topPitcher}
                  statLabel="FIP"
                  statValue={fmt2(topPitcher.fip ?? 0)}
                  statColor="var(--heritage-columbia-blue)"
                  subtitle={`${fmt2(topPitcher.era ?? 0)} ERA · ${fmt2(topPitcher.k_9 ?? 0)} K/9 · ${topPitcher.ip} IP`}
                />
              )}
            </div>
          </div>
        )}

        {/* Loading skeleton for standouts */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="flex justify-between">
                  <div>
                    <div className="h-4 w-28 rounded" style={{ background: 'var(--surface-press-box)' }} />
                    <div className="h-3 w-20 rounded mt-2" style={{ background: 'var(--surface-press-box)' }} />
                  </div>
                  <div className="h-8 w-12 rounded" style={{ background: 'var(--surface-press-box)' }} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Batting leaderboard */}
        {!battingLoading && batters.length > 0 && (
          <CompactLeaderboard
            title="Batting Leaders"
            data={batters}
            columns={[
              { key: 'woba', label: 'wOBA', format: fmt3 },
              { key: 'wrc_plus', label: 'wRC+', format: (v) => String(Math.round(v)) },
              { key: 'avg', label: 'AVG', format: fmt3 },
              { key: 'slg', label: 'SLG', format: fmt3 },
            ]}
          />
        )}

        {/* Pitching leaderboard */}
        {!pitchingLoading && pitchers.length > 0 && (
          <CompactLeaderboard
            title="Pitching Leaders"
            data={pitchers}
            columns={[
              { key: 'fip', label: 'FIP', format: fmt2 },
              { key: 'era', label: 'ERA', format: fmt2 },
              { key: 'k_9', label: 'K/9', format: fmt2 },
              { key: 'whip', label: 'WHIP', format: fmt2 },
            ]}
          />
        )}

        {/* Ask BSI entry point */}
        <Card padding="none">
          <Link
            href="/ask/"
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[rgba(196,184,165,0.04)]"
          >
            <span className="text-xl" style={{ color: '#A855F7' }}>✦</span>
            <div className="flex-1 min-w-0">
              <span
                className="text-sm font-bold uppercase tracking-wider block"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
              >
                Ask BSI
              </span>
              <span className="text-[10px] font-mono block mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
                AI-powered college baseball analysis — ask anything about stats, matchups, or scouting
              </span>
            </div>
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0 opacity-40"
              fill="none"
              stroke="var(--bsi-dust)"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </Card>

        {/* Attribution */}
        <div className="text-center py-2">
          <p className="text-[10px] font-mono" style={{ color: 'rgba(196,184,165,0.4)' }}>
            Born to Blaze the Path Beaten Less
          </p>
        </div>
      </div>
    </div>
  );
}
