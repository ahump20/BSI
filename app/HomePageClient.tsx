'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

          <p className="text-center text-xs" style={{ color: 'var(--bsi-dust)' }}>
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
// Feature Showcase — tiered: 3 hero + 4 compact
// ────────────────────────────────────────

interface FeatureItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  hero?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    label: 'BSI Savant',
    description: 'Park-adjusted wOBA, wRC+, FIP across 300+ D1 teams. The analytics engine that powers everything.',
    href: '/college-baseball/savant',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" />
      </svg>
    ),
  },
  {
    label: 'Intelligence',
    description: 'AI game briefs, team dossiers, weekly situation reports. Every matchup analyzed before first pitch.',
    href: '/intel',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Editorial',
    description: 'Weekend recaps, series previews, and conference deep dives written by someone who watches every inning.',
    href: '/college-baseball/editorial',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
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
  const heroFeatures = FEATURES.filter(f => f.hero);
  const compactFeatures = FEATURES.filter(f => !f.hero);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative surface-deep accent-glow-warm-right">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04]"
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

        {/* Hero tier — 3 crown jewels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {heroFeatures.map((feat, idx) => (
            <ScrollReveal key={feat.label} direction="up" delay={idx * 80}>
              <Link href={feat.href} className="group block h-full">
                <div
                  className="heritage-card relative p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ borderTop: '2px solid var(--bsi-primary)' }}
                >
                  {/* Icon background watermark */}
                  <div className="absolute top-3 right-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300" aria-hidden="true">
                    <div className="w-20 h-20" style={{ color: 'var(--bsi-primary)' }}>
                      {feat.icon}
                    </div>
                  </div>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: '1px solid rgba(191, 87, 0, 0.35)',
                      borderRadius: '2px',
                      boxShadow: 'inset 0 1px 0 rgba(191, 87, 0, 0.1), 0 0 24px rgba(191, 87, 0, 0.06)',
                    }}
                    aria-hidden="true"
                  />
                  <div className="mb-4 transition-colors" style={{ color: 'var(--bsi-primary)' }}>
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold uppercase tracking-wider mb-2 transition-colors" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}>
                    {feat.label}
                  </h3>
                  <p className="text-sm leading-relaxed font-serif flex-1" style={{ color: 'var(--bsi-dust)' }}>
                    {feat.description}
                  </p>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all" style={{ color: 'var(--bsi-primary)' }}>
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* Compact tier — remaining tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {compactFeatures.map((feat, idx) => {
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

      {/* ─── 3. Savant Preview — MOVED UP: live proof above the fold ─── */}
      <DataErrorBoundary name="Savant Preview" compact>
        <SavantPreviewStrip />
      </DataErrorBoundary>

      {/* ─── Section Break ─── */}
      <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>

      {/* ─── 4. Sports Hub — Our Coverage (redesigned layout) ─── */}
      <section
        className="py-16 px-4 sm:px-6 lg:px-8 relative surface-lifted accent-glow-warm-left"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-8">
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

          {/* College Baseball — flagship hero card */}
          {(() => {
            const flagship = sports[0];
            const FlagshipIcon = flagship.icon;
            return (
          <ScrollReveal direction="up" className="mb-4">
            <Link href={flagship.href} className="group block">
              <div
                className="heritage-card relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  borderLeft: `3px solid ${flagship.color}`,
                  background: `linear-gradient(135deg, var(--surface-dugout) 0%, ${withAlpha(flagship.color, 0.03)} 100%)`,
                }}
              >
                {/* Accent glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    border: `1px solid ${withAlpha(flagship.color, 0.35)}`,
                    borderRadius: '2px',
                    boxShadow: `inset 0 1px 0 ${withAlpha(flagship.color, 0.1)}, 0 0 24px ${withAlpha(flagship.color, 0.06)}`,
                  }}
                  aria-hidden="true"
                />

                <LiveGameBadge
                  live={sportCounts.get('college-baseball')?.live ?? 0}
                  today={sportCounts.get('college-baseball')?.today ?? 0}
                  color={flagship.color}
                />

                <div
                  className="w-16 h-16 flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{ background: withAlpha(flagship.color, 0.06), color: flagship.color }}
                >
                  <FlagshipIcon className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide mb-1 transition-colors" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}>
                    <span className="group-hover:text-[var(--bsi-primary)] transition-colors duration-300">
                      {flagship.name}
                    </span>
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                    {flagship.description}
                  </p>
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all shrink-0" style={{ color: 'var(--bsi-primary)' }}>
                  Explore &rarr;
                </span>
              </div>
            </Link>
          </ScrollReveal>
            );
          })()}

          {/* Remaining 4 sports — 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sports.slice(1).map((sport, index) => {
              const countKey = SPORT_COUNT_KEYS[sport.name];
              const counts = countKey ? sportCounts.get(countKey) : undefined;

              return (
                <ScrollReveal
                  key={sport.name}
                  direction="up"
                  delay={index * 80}
                >
                  <Link href={sport.href} className="group block h-full">
                    <div
                      className="heritage-card relative p-5 h-full flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{
                        borderLeft: `2px solid ${sport.color}`,
                        background: `linear-gradient(135deg, var(--surface-dugout) 0%, ${withAlpha(sport.color, 0.02)} 100%)`,
                      }}
                    >
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
                        className="w-14 h-14 flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ background: withAlpha(sport.color, 0.06), color: sport.color }}
                      >
                        <sport.icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold uppercase tracking-wide mb-1 transition-colors" style={{ color: 'var(--bsi-bone)' }}>
                          <span className="group-hover:text-[var(--bsi-primary)] transition-colors duration-300">
                            {sport.name}
                          </span>
                        </h3>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--bsi-dust)' }}>
                          {sport.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Section Break ─── */}
      <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>

      {/* ─── 5. Feature Showcase — platform tools ─── */}
      <FeatureShowcase />

      {/* ─── 6. Ask BSI — AI-powered question card ─── */}
      <div className="surface-lifted">
        <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>
        <DataErrorBoundary name="Ask BSI" compact>
          <AskBSI />
        </DataErrorBoundary>
      </div>

      {/* ─── 7. Editorial Feed (D1-backed) ─── */}
      <DataErrorBoundary name="Editorial">
        <EditorialPreview />
      </DataErrorBoundary>

      {/* ─── Section Break ─── */}
      <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>

      {/* ─── 8. Trending Intel Feed ─── */}
      <section
        className="py-14 px-4 sm:px-6 lg:px-8 relative surface-lifted accent-glow-cool-center"
      >
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

      {/* ─── Section Break ─── */}
      <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>

      {/* ─── 9. Garrido + Austin Quote — elevated with B watermark ─── */}
      <section
        className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(191, 87, 0, 0.04) 0%, transparent 60%), var(--surface-scoreboard)',
        }}
      >
        {/* Flame B watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" aria-hidden="true">
          <div className="relative w-[300px] h-[300px] opacity-[0.03]">
            <Image
              src="/images/brand/bsi-flame-b.png"
              alt=""
              fill
              className="object-contain"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />

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

                {/* Garrido — display size for emotional impact */}
                <div className="relative">
                  <blockquote className="font-serif text-2xl md:text-4xl leading-relaxed mb-6" style={{ color: 'var(--bsi-bone)' }}>
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

                {/* Gradient divider instead of heritage-divider */}
                <div className="h-px w-full bg-gradient-to-r from-[var(--bsi-primary)] via-[rgba(191,87,0,0.2)] to-transparent" />

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

      {/* ─── Section Break ─── */}
      <div className="section-break" aria-hidden="true"><span className="section-break-diamond" /></div>

      {/* ─── 10. CTA — with shield logo + slogan ─── */}
      <section className="surface-lifted py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <HeroGlow shape="60% 50%" position="50% 40%" intensity={0.04} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.1)] to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            {/* BSI shield as visual anchor */}
            <div className="flex justify-center mb-6">
              <div className="relative w-[64px] h-[64px]">
                <Image
                  src="/images/brand/bsi-shield-mascot.png"
                  alt="Blaze Sports Intel"
                  fill
                  className="object-contain opacity-80"
                />
              </div>
            </div>

            <span className="heritage-stamp mb-4">Get Started</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 mt-4" style={{ color: 'var(--bsi-bone)' }}>
              Pick Your Sport. Go Deep.
            </h2>
            <p className="text-base mb-8 max-w-2xl mx-auto" style={{ color: 'var(--bsi-dust)' }}>
              Live scores across five sports. Park-adjusted sabermetrics. Free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

            {/* Slogan */}
            <p className="font-serif italic text-sm tracking-wide" style={{ color: 'var(--bsi-primary)', opacity: 0.7 }}>
              Born to Blaze the Path Beaten Less
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 11. Platform Vitals ─── */}
      <PlatformVitals />

      {/* ─── 12. Footer ─── */}
      <Footer />
    </div>
  );
}
