'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3 } from '@/lib/utils/format';
import { getPercentileColor } from '@/components/analytics/PercentileBar';

interface LeaderboardRow {
  player_name?: string;
  name?: string;
  team?: string;
  avg?: number;
  obp?: number;
  slg?: number;
  woba?: number | null;
  [key: string]: unknown;
}

interface LeaderboardResponse {
  data: LeaderboardRow[];
  meta?: { source: string; fetched_at: string; timezone: string };
}

export function SavantPreviewStrip() {
  const { data, loading, error } = useSportData<LeaderboardResponse>(
    '/api/savant/batting/leaderboard?limit=5&sort=obp&dir=desc'
  );

  if (loading) {
    return (
      <section className="py-8 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--surface-scoreboard)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-3 w-16 skeleton mb-2" />
              <div className="h-5 w-52 skeleton" />
            </div>
            <div className="h-3 w-24 skeleton" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="heritage-card flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 p-3"
              >
                <div className="h-3 w-3 skeleton shrink-0" />
                <div className="flex-1 sm:text-center space-y-1.5 min-w-0">
                  <div className="h-3.5 w-20 sm:mx-auto skeleton" />
                  <div className="h-2 w-12 sm:mx-auto skeleton" />
                </div>
                <div className="text-right sm:text-center space-y-1 shrink-0">
                  <div className="h-5 w-10 sm:mx-auto skeleton" />
                  <div className="h-2 w-6 sm:mx-auto skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.data?.length) return null;

  const rows = data.data;
  const leader = rows[0];
  const leaderName = leader.player_name || leader.name || 'Unknown';
  const leaderObp = leader.obp ?? 0;
  const leaderPctile = Math.min(100, Math.max(0, ((leaderObp - 0.280) / 0.220) * 100));
  const leaderBarColor = getPercentileColor(leaderPctile, true);

  return (
    <section
      className="py-8 px-4 sm:px-6 lg:px-8 relative"
      style={{
        background: 'var(--surface-scoreboard)',
        borderTop: '1px solid var(--border-vintage)',
        borderBottom: '1px solid var(--border-vintage)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="heritage-stamp mb-1">Live Proof</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="section-rule-thick" />
                <h2 className="font-display text-lg md:text-xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                  Top Hitters — D1 College Baseball
                </h2>
              </div>
            </div>
            <Link
              href="/college-baseball/savant"
              className="text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{ color: 'var(--heritage-columbia-blue)' }}
            >
              Full Leaderboard &rarr;
            </Link>
          </div>

          {/* Leader #1 gets hero treatment */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 mb-4">
            <div
              className="heritage-card relative p-5 flex items-center gap-5 overflow-hidden group"
              style={{ borderLeft: '3px solid var(--bsi-primary)' }}
            >
              <div
                className="absolute inset-y-0 left-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300"
                style={{ width: `${leaderPctile}%`, backgroundColor: leaderBarColor }}
                aria-hidden="true"
              />
              <span className="relative text-sm font-bold shrink-0" style={{
                fontFamily: 'var(--bsi-font-data)',
                color: 'var(--bsi-primary)',
              }}>
                <span className="inline-flex flex-col items-center">
                  <svg viewBox="0 0 16 12" className="w-4 h-3 mb-0.5" fill="var(--bsi-primary)" aria-label="Leader">
                    <path d="M8 0l2.5 4 5.5 1-4 3.5 1 5.5L8 11l-5 3 1-5.5L0 5l5.5-1z"/>
                  </svg>
                  <span>#1</span>
                </span>
              </span>
              <div className="relative flex-1 min-w-0">
                <div className="text-lg font-semibold truncate" style={{ color: 'var(--bsi-bone)' }}>{leaderName}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>{leader.team || ''}</div>
              </div>
              <div className="relative text-right shrink-0">
                <span className="led-stat font-bold block" style={{ fontSize: '1.75rem' }}>
                  {fmt3(leaderObp)}
                </span>
                <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>OBP</span>
              </div>
            </div>

            {/* Cards 2-5 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rows.slice(1).map((row, i) => {
                const name = row.player_name || row.name || 'Unknown';
                const obp = row.obp ?? 0;
                const pctile = Math.min(100, Math.max(0, ((obp - 0.280) / 0.220) * 100));
                const barColor = getPercentileColor(pctile, true);
                return (
                  <div
                    key={name + i}
                    className="heritage-card relative flex flex-col items-center gap-1.5 p-3 transition-all duration-300 overflow-hidden group"
                  >
                    <div
                      className="absolute inset-y-0 left-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300"
                      style={{ width: `${pctile}%`, backgroundColor: barColor }}
                      aria-hidden="true"
                    />
                    <span className="relative text-xs font-bold" style={{
                      fontFamily: 'var(--bsi-font-data)',
                      color: 'var(--bsi-dust)',
                    }}>
                      {i + 2}
                    </span>
                    <div className="relative text-center min-w-0 w-full">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--bsi-bone)' }}>{name}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>{row.team || ''}</div>
                    </div>
                    <div className="relative text-center shrink-0">
                      <span className="led-stat font-bold block" style={{ fontSize: '1.125rem' }}>
                        {fmt3(obp)}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>OBP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
              Source: BSI Savant
              {data.meta?.fetched_at && (
                <> · Updated {new Date(data.meta.fetched_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CT</>
              )}
            </p>
            <p className="text-center text-xs" style={{ color: 'var(--bsi-dust)' }}>
              wOBA, wRC+, FIP, and park factors on the{' '}
              <Link href="/college-baseball/savant" className="transition-colors" style={{ color: 'var(--heritage-columbia-blue)' }}>
                full leaderboard
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
