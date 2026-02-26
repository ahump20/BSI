'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { EvidenceStrip } from '@/components/home/EvidenceStrip';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { TrendingIntelFeed } from '@/components/home/TrendingIntelFeed';
import { Footer } from '@/components/layout-ds/Footer';
import { useMultiSportCounts } from '@/lib/hooks/useMultiSportCounts';

// ────────────────────────────────────────
// SVG Sport Icons (crisp at any size)
// ────────────────────────────────────────

const BaseballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5 12C5 12 8 9 12 9C16 9 19 12 19 12" />
    <path d="M5 12C5 12 8 15 12 15C16 15 19 12 19 12" />
  </svg>
);

const FootballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
    <path d="M12 7L12 17M9 10L15 14M15 10L9 14" />
  </svg>
);

const BasketballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2V22M2 12H22" />
    <path d="M4.5 4.5C8 8 8 16 4.5 19.5M19.5 4.5C16 8 16 16 19.5 19.5" />
  </svg>
);

const StadiumIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 21V10L12 3L21 10V21" />
    <path d="M3 14H21" />
    <rect x="8" y="14" width="8" height="7" />
  </svg>
);

// ────────────────────────────────────────
// Sports Hub data
// ────────────────────────────────────────

/** Map sport card names to the keys used by useMultiSportCounts */
const SPORT_COUNT_KEYS: Record<string, string> = {
  'College Baseball': 'college-baseball',
  'MLB': 'mlb',
  'NFL': 'nfl',
  'NBA': 'nba',
  'CFB': 'cfb',
};

interface SportCardData {
  name: string;
  icon: React.FC;
  href: string;
  description: string;
  accent: string;
  bgAccent: string;
  color: string;
}

const sports: SportCardData[] = [
  {
    name: 'College Baseball',
    icon: BaseballIcon,
    href: '/college-baseball',
    description: 'Roster intelligence, portal tracking & pro projections',
    accent: 'group-hover:text-burnt-orange group-hover:border-burnt-orange/50',
    bgAccent: 'group-hover:bg-burnt-orange/10',
    color: 'var(--bsi-primary)',
  },
  {
    name: 'MLB',
    icon: BaseballIcon,
    href: '/mlb',
    description: 'Live scores, standings & Statcast analytics',
    accent: 'group-hover:text-red-500 group-hover:border-red-500/50',
    bgAccent: 'group-hover:bg-red-500/10',
    color: '#C41E3A',
  },
  {
    name: 'NFL',
    icon: FootballIcon,
    href: '/nfl',
    description: 'Real-time scores, standings & team intel',
    accent: 'group-hover:text-blue-400 group-hover:border-blue-400/50',
    bgAccent: 'group-hover:bg-blue-400/10',
    color: '#013369',
  },
  {
    name: 'NBA',
    icon: BasketballIcon,
    href: '/nba',
    description: 'Live games, standings & performance data',
    accent: 'group-hover:text-orange-400 group-hover:border-orange-400/50',
    bgAccent: 'group-hover:bg-orange-400/10',
    color: 'var(--bsi-accent)',
  },
  {
    name: 'CFB',
    icon: StadiumIcon,
    href: '/cfb',
    description: 'College football analytics & recruiting',
    accent: 'group-hover:text-amber-500 group-hover:border-amber-500/50',
    bgAccent: 'group-hover:bg-amber-500/10',
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
        style={{ backgroundColor: `${color}25`, color }}
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
        style={{ backgroundColor: `${color}15`, color }}
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
  const sportCounts = useMultiSportCounts();

  return (
    <main id="main-content" className="min-h-screen bg-background-primary">
      {/* ─── 1. Hero ─── */}
      <HeroSection />

      {/* ─── 2. Multi-Sport Live Scores Strip ─── */}
      <HomeLiveScores />

      {/* ─── 3. Sports Hub — Glass Cards with live badges ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-primary to-background-secondary relative">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-burnt-orange mb-3">
                Intelligence
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary uppercase tracking-wide">
                Six Sports. One Platform.
              </h2>
              <p className="mt-3 text-base text-text-tertiary max-w-2xl mx-auto">
                College baseball roster intelligence leads. MLB, NFL, NBA, and college football
                analytics round out the picture.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {sports.map((sport, index) => {
              const countKey = SPORT_COUNT_KEYS[sport.name];
              const counts = countKey ? sportCounts.get(countKey) : undefined;

              const isLast = index === sports.length - 1;

              return (
                <ScrollReveal
                  key={sport.name}
                  direction="up"
                  delay={index * 80}
                  className={isLast ? 'sm:col-span-2 md:col-span-1' : undefined}
                >
                  <Link href={sport.href} className="group block h-full">
                    <div
                      className={`relative p-6 rounded-2xl border bg-surface-light backdrop-blur-sm border-border ${sport.accent} transition-all duration-500 hover:scale-[1.02] hover:bg-surface-medium h-full flex flex-col items-center text-center`}
                    >
                      {/* Live game badge — replaces static Flagship/Soon badges */}
                      <LiveGameBadge
                        live={counts?.live ?? 0}
                        today={counts?.today ?? 0}
                        color={sport.color}
                      />

                      <div
                        className={`w-16 h-16 rounded-xl bg-surface-light ${sport.bgAccent} flex items-center justify-center mb-4 transition-all duration-300 text-text-secondary ${sport.accent}`}
                      >
                        <sport.icon />
                      </div>

                      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">
                        {sport.name}
                      </h3>
                      <p className="text-sm text-text-tertiary leading-relaxed">{sport.description}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. Editorial Feed (D1-backed) ─── */}
      <EditorialPreview />

      {/* ─── 5. Evidence Strip ─── */}
      <EvidenceStrip />

      {/* ─── 6. Trending Intel Feed ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-primary to-background-secondary">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-8">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-burnt-orange mb-3">
                Cross-Sport Intel
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary uppercase tracking-wide">
                What&apos;s Happening Now
              </h2>
            </div>
            <TrendingIntelFeed />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 7. Founder Quote ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background-primary relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-burnt-orange/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal direction="left">
            <div className="flex gap-6 md:gap-8">
              {/* Burnt-orange left border — editorial magazine feel */}
              <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-burnt-orange to-burnt-orange/20" />

              <div>
                <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-text-primary/90 leading-relaxed mb-6">
                  ESPN shows you scores. They don&apos;t tell you which portal pickup just changed a
                  conference race, or which freshman&apos;s exit velo projects him as a day-two pick.
                  <span className="text-burnt-orange">
                    {' '}
                    That&apos;s what I built BSI to do.
                  </span>
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange to-burnt-orange/70 flex items-center justify-center text-white text-sm font-bold">
                    AH
                  </div>
                  <div>
                    <div className="text-text-primary font-semibold text-sm">Austin Humphrey</div>
                    <div className="text-text-muted text-xs">Founder, Blaze Sports Intel</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 8. CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
              Built for the people who run the game.
            </h2>
            <p className="text-base text-text-tertiary mb-10 max-w-2xl mx-auto">
              Join fans, scouts, and analysts who track roster markets, not just scoreboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(191,87,0,0.3)]"
              >
                Start Free Trial
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 border-2 border-border hover:border-burnt-orange text-text-primary hover:text-burnt-orange px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              >
                Learn Our Story
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 9. Footer ─── */}
      <Footer />
    </main>
  );
}
