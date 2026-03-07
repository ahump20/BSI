'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { TrendingIntelFeed } from '@/components/home/TrendingIntelFeed';
import { Footer } from '@/components/layout-ds/Footer';
import { AskBSI } from '@/components/home/AskBSI';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { BaseballIcon, FootballIcon, BasketballIcon, StadiumIcon } from '@/components/icons/SportIcons';
import { useMultiSportCounts } from '@/lib/hooks/useMultiSportCounts';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3 } from '@/lib/utils/format';
import { withAlpha } from '@/lib/utils/color';
import { getPercentileColor } from '@/components/analytics/PercentileBar';

// ────────────────────────────────────────
// Savant Preview Strip — top 5 wOBA leaders
// ────────────────────────────────────────

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

function SavantPreviewStrip() {
  // Sort by OBP — available on free tier, more analytically meaningful than AVG
  const { data, loading, error } = useSportData<LeaderboardResponse>(
    '/api/savant/batting/leaderboard?limit=5&sort=obp&dir=desc'
  );

  if (loading) {
    return (
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-3 w-16 bg-surface-light rounded animate-pulse mb-2" />
              <div className="h-5 w-52 bg-surface-light rounded animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-surface-light rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 p-3 rounded-xl bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)]"
              >
                <div className="h-3 w-3 bg-surface-light rounded animate-pulse shrink-0" />
                <div className="flex-1 sm:text-center space-y-1.5 min-w-0">
                  <div className="h-3.5 w-20 sm:mx-auto bg-surface-light rounded animate-pulse" />
                  <div className="h-2 w-12 sm:mx-auto bg-surface-light rounded animate-pulse" />
                </div>
                <div className="text-right sm:text-center space-y-1 shrink-0">
                  <div className="h-5 w-10 sm:mx-auto bg-surface-light rounded animate-pulse" />
                  <div className="h-2 w-6 sm:mx-auto bg-surface-light rounded animate-pulse" />
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

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="section-label block mb-1">Live Proof</span>
              <h2 className="font-display text-lg md:text-xl font-bold uppercase tracking-wide text-text-primary">
                Top Hitters — D1 College Baseball
              </h2>
            </div>
            <Link
              href="/college-baseball/savant"
              className="text-burnt-orange text-xs font-semibold uppercase tracking-wider hover:text-ember transition-colors"
            >
              Full Leaderboard &rarr;
            </Link>
          </div>

          {/* Leaderboard strip — #1 gets hero treatment, all get percentile bars */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {rows.map((row, i) => {
              const name = row.player_name || row.name || 'Unknown';
              const obp = row.obp ?? 0;
              const isLeader = i === 0;
              // Map OBP to a rough percentile for color (D1 avg ~.360, elite ~.500+)
              const pctile = Math.min(100, Math.max(0, ((obp - 0.280) / 0.220) * 100));
              const barColor = getPercentileColor(pctile, true);
              return (
                <div
                  key={name + i}
                  className={`relative flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 p-3 rounded-xl transition-all duration-300 overflow-hidden group ${
                    isLeader
                      ? 'bg-burnt-orange/[0.08] border border-burnt-orange/20 shadow-[0_0_20px_rgba(191,87,0,0.06)]'
                      : 'bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)]'
                  }`}
                >
                  {/* Percentile color bar — horizontal fill behind content */}
                  <div
                    className="absolute inset-y-0 left-0 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300"
                    style={{ width: `${pctile}%`, backgroundColor: barColor }}
                    aria-hidden="true"
                  />
                  <span className={`relative font-mono text-xs font-bold w-5 text-center shrink-0 ${
                    isLeader ? 'text-burnt-orange' : 'text-text-muted'
                  }`}>
                    {isLeader ? (
                      <span className="inline-flex flex-col items-center">
                        <svg viewBox="0 0 16 12" className="w-3.5 h-2.5 text-burnt-orange mb-0.5" fill="currentColor" aria-label="Leader">
                          <path d="M8 0l2.5 4 5.5 1-4 3.5 1 5.5L8 11l-5 3 1-5.5L0 5l5.5-1z"/>
                        </svg>
                        <span>1</span>
                      </span>
                    ) : i + 1}
                  </span>
                  <div className="relative flex-1 sm:text-center min-w-0">
                    <div className="text-sm font-semibold truncate text-text-primary">{name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">{row.team || ''}</div>
                  </div>
                  <div className="relative text-right sm:text-center shrink-0">
                    <span className={`font-mono font-bold block ${
                      isLeader ? 'text-xl text-burnt-orange' : 'text-lg text-burnt-orange/80'
                    }`}>
                      {fmt3(obp)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-text-muted">OBP</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-text-muted">
            wOBA, wRC+, FIP, and park factors available on the{' '}
            <Link href="/college-baseball/savant" className="text-burnt-orange hover:text-ember transition-colors">
              full Savant leaderboard
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ────────────────────────────────────────
// Sports Hub data
// ────────────────────────────────────────

const SPORT_COUNT_KEYS: Record<string, string> = {
  'College Baseball': 'college-baseball',
  'MLB': 'mlb',
  'NFL': 'nfl',
  'NBA': 'nba',
  'CFB': 'cfb',
};

interface SportCardData {
  name: string;
  icon: React.FC<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

// ────────────────────────────────────────
// WBC 2026 Feature Banner
// ────────────────────────────────────────

const WBC_START = new Date('2026-03-05T00:00:00-06:00');
const WBC_END = new Date('2026-03-17T23:59:59-05:00');

function WBCBanner() {
  const now = new Date();
  const isWBCPeriod = now >= new Date('2026-02-20') && now <= WBC_END; // Show 2 weeks early
  if (!isWBCPeriod) return null;

  const isLive = now >= WBC_START && now <= WBC_END;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/wbc" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-burnt-orange/20 via-burnt-orange/10 to-ember/5 border border-burnt-orange/30 hover:border-burnt-orange/60 transition-all p-5 sm:p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/5 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-burnt-orange/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2c-2 4-2 8 0 12s2 8 0 12" />
                    <path d="M2 12c4-2 8-2 12 0s8 2 12 0" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-text-primary text-base sm:text-lg uppercase tracking-wide">
                      World Baseball Classic 2026
                    </span>
                    {isLive ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-burnt-orange bg-burnt-orange/10 px-2 py-0.5 rounded-full border border-burnt-orange/20">
                        MAR 5–17
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm">
                    20 nations · Power rankings · Pool previews · EdgeBot v3 betting intelligence
                  </p>
                </div>
              </div>
              <span className="text-burnt-orange font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all shrink-0">
                Explore WBC
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

const sports: SportCardData[] = [
  {
    name: 'College Baseball',
    icon: BaseballIcon,
    href: '/college-baseball',
    description: 'Every D1 team. Live scores, box scores, standings, rankings, portal tracking, and weekly editorial.',
    color: 'var(--bsi-primary)',
  },
  {
    name: 'MLB',
    icon: BaseballIcon,
    href: '/mlb',
    description: 'Live scores, standings, and the advanced metrics — wOBA, FIP, wRC+ — that tell you what the box score won\u2019t.',
    color: '#C41E3A',
  },
  {
    name: 'NFL',
    icon: FootballIcon,
    href: '/nfl',
    description: 'Live scores, standings, and team coverage built for the fan who watches past the primetime window.',
    color: '#013369',
  },
  {
    name: 'NBA',
    icon: BasketballIcon,
    href: '/nba',
    description: 'Live scores, standings, and game analytics across the full league — not just the coasts.',
    color: 'var(--bsi-accent)',
  },
  {
    name: 'CFB',
    icon: StadiumIcon,
    href: '/cfb',
    description: 'Scores, standings, and conference coverage from the Big 12 to the Sun Belt.',
    color: '#D97706',
  },
];

// ────────────────────────────────────────
// Live game badge for sport cards
// ────────────────────────────────────────

function LiveGameBadge({ live, today, color }: { live: number; today: number; color: string }) {
  if (live > 0) {
    return (
      <span
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ backgroundColor: withAlpha(color, 0.15), color }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ backgroundColor: color }}
          />
        </span>
        {live} Live
      </span>
    );
  }

  if (today > 0) {
    return (
      <span
        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ backgroundColor: withAlpha(color, 0.08), color }}
      >
        {today} Today
      </span>
    );
  }

  return null;
}

// ────────────────────────────────────────
// Page Component
// ────────────────────────────────────────

export function HomePageClient() {
  const [sportCounts, setSportCounts] = useState<Map<string, { live: number; today: number }>>(new Map());
  const handleCountsChange = useCallback((counts: Map<string, { live: number; today: number }>) => {
    setSportCounts(counts);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ─── 1. Hero ─── */}
      <DataErrorBoundary name="Hero" compact>
        <HeroSection />
      </DataErrorBoundary>

      {/* ─── 2. Multi-Sport Live Scores Strip ─── */}
      <DataErrorBoundary name="Live Scores" compact>
        <HomeLiveScores onCountsChange={handleCountsChange} />
      </DataErrorBoundary>

      {/* ─── 3. Savant Preview — wOBA leaders as live proof ─── */}
      <DataErrorBoundary name="Savant Preview" compact>
        <SavantPreviewStrip />
      </DataErrorBoundary>

      {/* ─── 3.5. Ask BSI — AI-powered question card ─── */}
      <DataErrorBoundary name="Ask BSI" compact>
        <AskBSI />
      </DataErrorBoundary>

      {/* ─── 4. Editorial Feed (D1-backed) ─── */}
      <DataErrorBoundary name="Editorial">
        <EditorialPreview />
      </DataErrorBoundary>

      {/* ─── 5. WBC 2026 Feature Banner — tournament window Mar 5–17 ─── */}
      <WBCBanner />

      {/* ─── 6. Sports Hub ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="section-label block mb-2">Coverage</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                  Also Covering
                </h2>
              </div>
            </div>
          </ScrollReveal>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {sports.map((sport, index) => {
              const countKey = SPORT_COUNT_KEYS[sport.name];
              const counts = countKey ? sportCounts.get(countKey) : undefined;

              return (
                <ScrollReveal
                  key={sport.name}
                  direction="up"
                  delay={index * 80}
                  className="flex-shrink-0 w-56 sm:w-60 lg:w-auto"
                >
                  <Link href={sport.href} className="group block h-full">
                    <div
                      className="relative p-5 rounded-xl h-full flex flex-col items-center text-center
                        transition-all duration-300 hover:-translate-y-1
                        bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)]
                        hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                        backdrop-blur-sm"
                      style={{
                        ['--card-accent' as string]: sport.color,
                      }}
                    >
                      {/* Accent border glow on hover — uses sport-specific color */}
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          border: `1px solid ${withAlpha(sport.color, 0.35)}`,
                          boxShadow: `inset 0 1px 0 ${withAlpha(sport.color, 0.1)}, 0 0 20px ${withAlpha(sport.color, 0.06)}`,
                        }}
                        aria-hidden="true"
                      />

                      <LiveGameBadge
                        live={counts?.live ?? 0}
                        today={counts?.today ?? 0}
                        color={sport.color}
                      />

                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 bg-surface-light text-text-secondary group-hover:text-white"
                        style={{
                          ['--hover-bg' as string]: withAlpha(sport.color, 0.15),
                        }}
                      >
                        <sport.icon className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      <h3
                        className="text-base font-semibold mb-1.5 transition-colors text-text-primary"
                        style={{ ['--accent' as string]: sport.color }}
                      >
                        <span className="group-hover:text-[var(--card-accent)] transition-colors duration-300">
                          {sport.name}
                        </span>
                      </h3>
                      <p className="text-xs leading-relaxed text-text-secondary line-clamp-2">
                        {sport.description}
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. Trending Intel Feed ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-6">
              <span className="section-label block mb-2">Cross-Sport Intel</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                What&apos;s Happening Now
              </h2>
            </div>
            <DataErrorBoundary name="Intel Feed">
              <TrendingIntelFeed />
            </DataErrorBoundary>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 7. Garrido + Austin Quote ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal direction="left">
            <span className="kicker mb-6 block">The Standard</span>

            <div className="flex gap-6 md:gap-8">
              <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-burnt-orange via-burnt-orange/40 to-transparent" />

              <div className="space-y-10 relative">
                <span
                  className="absolute -top-6 -left-2 leading-none pointer-events-none select-none font-serif text-[8rem] text-burnt-orange/[0.07]"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Garrido */}
                <div className="relative">
                  <blockquote className="font-serif text-xl md:text-2xl leading-relaxed mb-6 text-text-primary/90">
                    &ldquo;Where is that ten-year-old that loved to play baseball? Remember that kid
                    — twelve o&apos;clock game on Saturday morning, sitting on the edge of the bed in
                    uniform at five AM, putting on that glove, can&apos;t wait to get there.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold gradient-brand">
                      AG
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-text-primary">Augie Garrido, 1939&ndash;2018</div>
                      <div className="text-xs text-text-secondary">Winningest coach in college baseball history</div>
                    </div>
                  </div>
                </div>

                <div className="divider-accent h-px w-full" />

                {/* Austin */}
                <div>
                  <blockquote className="font-serif text-lg md:text-xl leading-relaxed mb-6 text-text-secondary">
                    &ldquo;That&apos;s who shows up here. The one checking scores at midnight.
                    The one who cares about the Tuesday game as much as the Saturday showcase.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange to-burnt-orange/70 flex items-center justify-center text-white text-sm font-bold">
                      AH
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-text-primary">Austin Humphrey</div>
                      <div className="text-xs text-text-secondary">Founder, Blaze Sports Intel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 8. CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle radial glow behind CTA */}
        <HeroGlow shape="60% 50%" position="50% 40%" intensity={0.04} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-burnt-orange/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            <span className="section-label block mb-4">Get Started</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-text-primary">
              Start with college baseball. Go from there.
            </h2>
            <p className="text-base mb-10 max-w-2xl mx-auto text-text-secondary">
              Park-adjusted sabermetrics. Live scores. Free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/college-baseball/savant" className="btn-primary px-8 py-4 text-lg">
                Explore BSI Savant
              </Link>
              <Link href="/college-baseball" className="btn-outline px-8 py-4 text-lg">
                College Baseball Hub
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 9. Footer ─── */}
      <Footer />
    </div>
  );
}
