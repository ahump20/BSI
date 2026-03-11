'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { TrendingIntelFeed } from '@/components/home/TrendingIntelFeed';
import { Footer } from '@/components/layout-ds/Footer';
import { AskBSI } from '@/components/home/AskBSI';
import { PlatformVitals } from '@/components/home/PlatformVitals';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { BaseballIcon, FootballIcon, BasketballIcon, StadiumIcon } from '@/components/icons/SportIcons';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3 } from '@/lib/utils/format';
import { withAlpha } from '@/lib/utils/color';
import { getPercentileColor } from '@/components/analytics/PercentileBar';

// ────────────────────────────────────────
// Savant Preview Strip — top 5 OBP leaders
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

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
                  className="heritage-card relative flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 p-3 transition-all duration-300 overflow-hidden group"
                  style={isLeader ? { borderLeft: '2px solid var(--bsi-primary)' } : undefined}
                >
                  {/* Percentile color bar — horizontal fill behind content */}
                  <div
                    className="absolute inset-y-0 left-0 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300"
                    style={{ width: `${pctile}%`, backgroundColor: barColor }}
                    aria-hidden="true"
                  />
                  <span className="relative text-xs font-bold w-5 text-center shrink-0" style={{
                    fontFamily: 'var(--bsi-font-data)',
                    color: isLeader ? 'var(--bsi-primary)' : 'var(--bsi-dust)',
                  }}>
                    {isLeader ? (
                      <span className="inline-flex flex-col items-center">
                        <svg viewBox="0 0 16 12" className="w-3.5 h-2.5 mb-0.5" fill="var(--bsi-primary)" aria-label="Leader">
                          <path d="M8 0l2.5 4 5.5 1-4 3.5 1 5.5L8 11l-5 3 1-5.5L0 5l5.5-1z"/>
                        </svg>
                        <span>1</span>
                      </span>
                    ) : i + 1}
                  </span>
                  <div className="relative flex-1 sm:text-center min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--bsi-bone)' }}>{name}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>{row.team || ''}</div>
                  </div>
                  <div className="relative text-right sm:text-center shrink-0">
                    <span className="led-stat font-bold block" style={{
                      fontSize: isLeader ? '1.25rem' : '1.125rem',
                    }}>
                      {fmt3(obp)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>OBP</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--bsi-dust)' }}>
            wOBA, wRC+, FIP, and park factors available on the{' '}
            <Link href="/college-baseball/savant" className="transition-colors" style={{ color: 'var(--heritage-columbia-blue)' }}>
              full Savant leaderboard
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ────────────────────────────────────────
// Feature Showcase — surfaces orphaned features
// ────────────────────────────────────────

interface FeatureItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureItem[] = [
  {
    label: 'BSI Savant',
    description: 'Park-adjusted wOBA, wRC+, FIP across 300+ D1 teams.',
    href: '/college-baseball/savant',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" />
      </svg>
    ),
  },
  {
    label: 'Intelligence',
    description: 'AI game briefs, team dossiers, weekly situation reports.',
    href: '/intel',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Editorial',
    description: 'Weekend recaps, series previews, and conference deep dives.',
    href: '/college-baseball/editorial',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h5" />
      </svg>
    ),
  },
  {
    label: 'Transfer Portal',
    description: 'Track who is moving, where, and what it means.',
    href: '/college-baseball/transfer-portal',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3h5v5M14 10l7-7M8 21H3v-5M10 14l-7 7" />
      </svg>
    ),
  },
  {
    label: 'NIL Valuation',
    description: 'Market value analytics for the NIL era.',
    href: '/nil-valuation',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: 'Models',
    description: 'Win probability, Monte Carlo sims, data quality scoring.',
    href: '/models',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Arcade',
    description: 'College baseball browser games. Play as your team.',
    href: 'https://arcade.blazesportsintel.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4m-2-2v4M15 11h.01M18 13h.01" />
      </svg>
    ),
  },
];

function FeatureShowcase() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 relative" style={{ background: 'var(--surface-dugout)' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #BF5700, transparent 70%)' }}
        />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-2">Tools &amp; Intel</span>
          <div className="flex items-center gap-3 mt-2 mb-8">
            <div className="section-rule-thick" />
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
              Platform
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {FEATURES.map((feat, idx) => {
            const isExternal = feat.href.startsWith('http');
            const Tag = isExternal ? 'a' : Link;
            const extra = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <ScrollReveal key={feat.label} direction="up" delay={idx * 60}>
                <Tag
                  href={feat.href}
                  {...extra}
                  className="group heritage-card flex items-start gap-3 p-4 hover:border-[rgba(191,87,0,0.4)] transition-all duration-300"
                >
                  <div className="mt-0.5 shrink-0 transition-colors" style={{ color: 'var(--bsi-dust)' }}>
                    {feat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider transition-colors" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}>
                        {feat.label}
                      </span>
                      {isExternal && (
                        <span className="text-[9px] opacity-40" style={{ color: 'var(--bsi-dust)' }}>{'\u2197'}</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>
                      {feat.description}
                    </p>
                  </div>
                  <span className="shrink-0 mt-1 transition-colors" style={{ color: 'rgba(191, 87, 0, 0.3)' }}>
                    &rarr;
                  </span>
                </Tag>
              </ScrollReveal>
            );
          })}
        </div>
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

const WBC_START_MS = new Date('2026-03-05T00:00:00-06:00').getTime();
const WBC_END_MS = new Date('2026-03-18T23:59:59-05:00').getTime();
const WBC_SHOW_MS = new Date('2026-02-20T00:00:00-06:00').getTime();

function WBCBanner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render nothing on server/first paint to avoid hydration mismatch from new Date()
  if (!mounted) return null;

  const now = Date.now();
  const isWBCPeriod = now >= WBC_SHOW_MS && now <= WBC_END_MS;
  if (!isWBCPeriod) return null;

  const isLive = now >= WBC_START_MS && now <= WBC_END_MS;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/wbc" className="group block">
          <div
            className="heritage-card relative overflow-hidden p-5 sm:p-6"
            style={{ borderLeft: '3px solid var(--bsi-primary)' }}
          >
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'rgba(191, 87, 0, 0.12)' }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="var(--bsi-primary)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2c-2 4-2 8 0 12s2 8 0 12" />
                    <path d="M2 12c4-2 8-2 12 0s8 2 12 0" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-base sm:text-lg uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                      World Baseball Classic 2026
                    </span>
                    {isLive ? (
                      <span className="heritage-stamp" style={{ padding: '1px 8px', fontSize: '9px', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                          </span>
                          LIVE
                        </span>
                      </span>
                    ) : (
                      <span className="heritage-stamp" style={{ padding: '1px 8px', fontSize: '9px' }}>
                        MAR 5-17
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--bsi-dust)' }}>
                    20 nations · Power rankings · Pool previews · EdgeBot v3 betting intelligence
                  </p>
                </div>
              </div>
              <span className="font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all shrink-0" style={{ color: 'var(--bsi-primary)' }}>
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
    description: 'Live scores, standings, and the advanced metrics \u2014 wOBA, FIP, wRC+ \u2014 that tell you what the box score won\u2019t.',
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
    description: 'Live scores, standings, and game analytics across the full league \u2014 not just the coasts.',
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
        className="absolute top-3 right-3 heritage-stamp"
        style={{ padding: '1px 8px', fontSize: '9px', backgroundColor: withAlpha(color, 0.12), color, borderColor: withAlpha(color, 0.3) }}
      >
        <span className="inline-flex items-center gap-1.5">
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
      </span>
    );
  }

  if (today > 0) {
    return (
      <span
        className="absolute top-3 right-3 heritage-stamp"
        style={{ padding: '1px 8px', fontSize: '9px', backgroundColor: withAlpha(color, 0.08), color, borderColor: withAlpha(color, 0.2) }}
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
    <div className="min-h-screen grain-overlay">
      {/* ─── 1. Hero ─── */}
      <DataErrorBoundary name="Hero" compact>
        <HeroSection />
      </DataErrorBoundary>

      {/* ─── 1.5. WBC 2026 — time-boxed Mar 5–17 ─── */}
      <WBCBanner />

      {/* ─── 2. Multi-Sport Live Scores Strip ─── */}
      <DataErrorBoundary name="Live Scores" compact>
        <HomeLiveScores onCountsChange={handleCountsChange} />
      </DataErrorBoundary>

      {/* ─── 3. Sports Hub — Our Coverage ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative" style={{ background: 'var(--surface-dugout)' }}>
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="heritage-stamp mb-2">Coverage</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="section-rule-thick" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                    Our Sports
                  </h2>
                </div>
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
                      className="heritage-card relative p-5 h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
                      style={{ borderTop: `2px solid ${sport.color}` }}
                    >
                      {/* Accent border glow on hover — uses sport-specific color */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          border: `1px solid ${withAlpha(sport.color, 0.35)}`,
                          borderRadius: '2px',
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
                        className="w-14 h-14 flex items-center justify-center mb-3 transition-all duration-300"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--bsi-dust)' }}
                      >
                        <sport.icon className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      <h3 className="text-base font-semibold mb-1.5 transition-colors" style={{ color: 'var(--bsi-bone)' }}>
                        <span className="group-hover:text-[var(--bsi-primary)] transition-colors duration-300">
                          {sport.name}
                        </span>
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--bsi-dust)' }}>
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

      {/* ─── 4. Feature Showcase — platform tools ─── */}
      <FeatureShowcase />

      {/* ─── 5. Savant Preview — wOBA leaders as live proof ─── */}
      <DataErrorBoundary name="Savant Preview" compact>
        <SavantPreviewStrip />
      </DataErrorBoundary>

      {/* ─── 5.5. Ask BSI — AI-powered question card ─── */}
      <DataErrorBoundary name="Ask BSI" compact>
        <AskBSI />
      </DataErrorBoundary>

      {/* ─── 6. Editorial Feed (D1-backed) ─── */}
      <DataErrorBoundary name="Editorial">
        <EditorialPreview />
      </DataErrorBoundary>

      {/* ─── 7. Trending Intel Feed ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-6">
              <span className="heritage-stamp mb-2">Cross-Sport Intel</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="section-rule-thick" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                  What&apos;s Happening Now
                </h2>
              </div>
            </div>
            <DataErrorBoundary name="Intel Feed">
              <TrendingIntelFeed />
            </DataErrorBoundary>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 8. Garrido + Austin Quote ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal direction="left">
            <span className="heritage-stamp mb-6">The Standard</span>

            <div className="flex gap-6 md:gap-8 mt-4">
              <div className="w-1 flex-shrink-0 bg-gradient-to-b from-[var(--bsi-primary)] via-[rgba(191,87,0,0.4)] to-transparent" style={{ borderRadius: '1px' }} />

              <div className="space-y-10 relative">
                <span
                  className="absolute -top-6 -left-2 leading-none pointer-events-none select-none font-serif text-[8rem]"
                  style={{ color: 'rgba(191, 87, 0, 0.07)' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Garrido */}
                <div className="relative">
                  <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed mb-6" style={{ color: 'var(--bsi-bone)' }}>
                    &ldquo;Where is that ten-year-old that loved to play baseball? Remember that kid
                    — twelve o&apos;clock game on Saturday morning, sitting on the edge of the bed in
                    uniform at five AM, putting on that glove, can&apos;t wait to get there.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div
                      className="heritage-card w-10 h-10 flex items-center justify-center text-sm font-bold"
                      style={{ color: 'var(--bsi-bone)', background: 'var(--surface-press-box)' }}
                    >
                      AG
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--bsi-bone)' }}>Augie Garrido, 1939&ndash;2018</div>
                      <div className="text-xs" style={{ color: 'var(--bsi-dust)' }}>Winningest coach in college baseball history</div>
                    </div>
                  </div>
                </div>

                <div className="heritage-divider" />

                {/* Austin */}
                <div>
                  <blockquote className="font-serif text-lg md:text-xl leading-relaxed mb-6" style={{ color: 'var(--bsi-dust)' }}>
                    &ldquo;That&apos;s who shows up here. The one checking scores at midnight.
                    The one who cares about the Tuesday game as much as the Saturday showcase.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div
                      className="heritage-card w-10 h-10 flex items-center justify-center text-sm font-bold"
                      style={{ color: 'var(--bsi-bone)', background: 'var(--bsi-primary)' }}
                    >
                      AH
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--bsi-bone)' }}>Austin Humphrey</div>
                      <div className="text-xs" style={{ color: 'var(--bsi-dust)' }}>Founder, Blaze Sports Intel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 9. CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle radial glow behind CTA */}
        <HeroGlow shape="60% 50%" position="50% 40%" intensity={0.04} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.1)] to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-4">Get Started</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 mt-4" style={{ color: 'var(--bsi-bone)' }}>
              Pick Your Sport. Go Deep.
            </h2>
            <p className="text-base mb-10 max-w-2xl mx-auto" style={{ color: 'var(--bsi-dust)' }}>
              Live scores across five sports. Park-adjusted sabermetrics. Free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/college-baseball" className="btn-heritage-fill px-8 py-4 text-lg">
                College Baseball Hub
              </Link>
              <Link href="/scores" className="btn-heritage px-8 py-4 text-lg">
                Live Scores
              </Link>
              <Link href="/college-baseball/savant" className="btn-heritage px-8 py-4 text-lg">
                BSI Savant
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 9.5. Platform Vitals ─── */}
      <PlatformVitals />

      {/* ─── 10. Footer ─── */}
      <Footer />
    </div>
  );
}
