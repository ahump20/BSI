'use client';

import { useSportData } from '@/lib/hooks/useSportData';
import { Skeleton } from '@/components/ui/Skeleton';
import { DegradedNotice } from '@/components/ui/DegradedNotice';
import { ScrollReveal } from '@/components/cinematic';
import { formatTimestamp } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamRanking {
  rank: number;
  team: string;
  teamId: string | null;
  conference: string;
  score: number;
  movement: number | null;
  metrics: {
    wrcPlus: number;
    teamFIP: number;
    teamWOBA: number;
    teamERA: number;
    sosIndex: number;
  };
  sampleSize: { batters: number; pitchers: number };
}

interface PowerRankingsData {
  rankings: TeamRanking[];
  computedAt: string;
  season: number;
  methodology: string;
}

// ---------------------------------------------------------------------------
// Movement indicator
// ---------------------------------------------------------------------------

function MovementBadge({ movement }: { movement: number | null }) {
  if (movement == null) {
    return (
      <span
        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm"
        style={{ color: 'var(--bsi-dust)', background: 'rgba(196,184,165,0.1)', fontFamily: 'var(--bsi-font-data)' }}
      >
        NEW
      </span>
    );
  }
  if (movement === 0) return <span className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>—</span>;
  if (movement > 0) {
    return (
      <span className="text-[10px] font-bold" style={{ color: 'var(--bsi-teal, #00B2A9)', fontFamily: 'var(--bsi-font-data)' }}>
        ▲{movement}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold" style={{ color: 'var(--heritage-oiler-red, #C41E3A)', fontFamily: 'var(--bsi-font-data)' }}>
      ▼{Math.abs(movement)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rank number styling
// ---------------------------------------------------------------------------

function RankNumber({ rank }: { rank: number }) {
  const isTop5 = rank <= 5;
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-sm font-bold"
      style={{
        fontFamily: 'var(--bsi-font-display)',
        color: isTop5 ? 'var(--surface-scoreboard)' : 'var(--bsi-bone)',
        background: isTop5 ? 'var(--bsi-primary)' : 'rgba(255,255,255,0.05)',
      }}
    >
      {rank}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Conference badge
// ---------------------------------------------------------------------------

function ConferenceBadge({ conference }: { conference: string }) {
  return (
    <span
      className="text-[9px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded-sm"
      style={{
        color: 'var(--heritage-columbia-blue)',
        background: 'rgba(75,156,211,0.1)',
        fontFamily: 'var(--bsi-font-data)',
      }}
    >
      {conference}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Metric cell
// ---------------------------------------------------------------------------

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p
        className="text-xs font-bold"
        style={{
          color: highlight ? 'var(--bsi-primary)' : 'var(--bsi-bone)',
          fontFamily: 'var(--bsi-font-data)',
        }}
      >
        {value}
      </p>
      <p
        className="text-[8px] uppercase tracking-[0.15em] mt-0.5"
        style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
      >
        {label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PowerRankingsClient() {
  const { data, meta, loading, error, retry } = useSportData<PowerRankingsData>(
    '/api/college-baseball/power-rankings'
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-scoreboard)' }}>
      {/* Hero */}
      <section className="pt-8 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <span className="heritage-stamp mb-3 inline-block">College Baseball</span>
            <h1
              className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider mt-2"
              style={{ color: 'var(--bsi-bone)' }}
            >
              BSI Power Rankings
            </h1>
            <p className="mt-2 text-sm font-serif leading-relaxed max-w-xl" style={{ color: 'var(--bsi-dust)' }}>
              Computed from BSI Savant sabermetrics — wRC+, FIP, and conference strength of schedule.
              Not borrowed. Earned.
            </p>
            {meta?.lastUpdated && (
              <p className="mt-2 text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                Last computed: {formatTimestamp(meta.lastUpdated)}
              </p>
            )}
          </ScrollReveal>
        </div>
      </section>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <DegradedNotice meta={meta} label="Power Rankings" />

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          )}

          {error && (
            <div className="heritage-card p-6 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--heritage-oiler-red)' }}>
                {error}
              </p>
              <button onClick={retry} className="btn-heritage text-xs">
                Retry
              </button>
            </div>
          )}

          {data && data.rankings.length === 0 && (
            <div className="heritage-card p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--bsi-bone)' }}>
                Rankings not yet available
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--bsi-dust)' }}>
                Savant data needs at least one compute cycle. Check back soon.
              </p>
            </div>
          )}

          {data && data.rankings.length > 0 && (
            <>
              {/* Rankings table */}
              <div className="heritage-card overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--surface-press-box)' }}>
                  <span className="heritage-stamp">Top {Math.min(data.rankings.length, 50)}</span>
                  <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    {data.season} Season
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: 'rgba(140,98,57,0.12)' }}>
                  {data.rankings.slice(0, 50).map((team) => (
                    <div
                      key={team.team}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <RankNumber rank={team.rank} />
                      <MovementBadge movement={team.movement} />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--bsi-bone)' }}>
                          {team.team}
                        </p>
                        <ConferenceBadge conference={team.conference} />
                      </div>

                      {/* Key metrics — hidden on mobile */}
                      <div className="hidden sm:flex items-center gap-4">
                        <MetricCell label="wRC+" value={team.metrics.wrcPlus.toFixed(0)} highlight={team.metrics.wrcPlus >= 120} />
                        <MetricCell label="FIP" value={team.metrics.teamFIP.toFixed(2)} highlight={team.metrics.teamFIP <= 3.50} />
                        <MetricCell label="SoS" value={team.metrics.sosIndex.toFixed(2)} />
                      </div>

                      {/* Composite score */}
                      <div className="text-right">
                        <p
                          className="text-lg font-bold"
                          style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-display)' }}
                        >
                          {team.score.toFixed(1)}
                        </p>
                        <p className="text-[8px] uppercase tracking-[0.15em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                          BSI Score
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology */}
              <div className="mt-6 heritage-card p-4">
                <span className="heritage-stamp text-[9px]">Methodology</span>
                <p className="mt-2 text-xs leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>
                  {data.methodology}
                </p>
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  );
}
