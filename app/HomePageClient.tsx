'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { TrendingIntelFeed } from '@/components/home/TrendingIntelFeed';
import { Footer } from '@/components/layout-ds/Footer';
import { useMultiSportCounts } from '@/lib/hooks/useMultiSportCounts';
import { withAlpha } from '@/lib/utils/color';

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
  color: string;
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
  const sportCounts = useMultiSportCounts();

  return (
    <div className="min-h-screen">
      {/* ─── 1. Hero ─── */}
      <HeroSection />

      {/* ─── 2. Multi-Sport Live Scores Strip ─── */}
      <HomeLiveScores />

      {/* ─── 3. Sports Hub — Portfolio-style cards ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <span className="section-label block mb-3">Coverage</span>
              <h2
                className="text-3xl md:text-4xl font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                Five Sports. No Blind Spots.
              </h2>
              <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                College baseball is the flagship. MLB, NFL, NBA, and college football round out the coverage.
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
                      className="relative p-6 rounded-xl h-full flex flex-col items-center text-center
                        transition-all duration-300 hover:-translate-y-1
                        bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)]
                        hover:border-burnt-orange/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                        backdrop-blur-sm"
                      style={{ ['--card-accent' as string]: sport.color }}
                    >
                      <LiveGameBadge
                        live={counts?.live ?? 0}
                        today={counts?.today ?? 0}
                        color={sport.color}
                      />

                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                        style={{
                          background: 'rgba(255, 255, 255, 0.025)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <sport.icon />
                      </div>

                      <h3
                        className="text-lg font-semibold mb-2 transition-colors group-hover:text-burnt-orange"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {sport.name}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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

      {/* ─── 4. Editorial Feed (D1-backed) ─── */}
      <EditorialPreview />

      {/* ─── 5. Trending Intel Feed ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-8">
              <span className="section-label block mb-3">Cross-Sport Intel</span>
              <h2
                className="text-3xl md:text-4xl font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                What&apos;s Happening Now
              </h2>
            </div>
            <TrendingIntelFeed />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 6. Garrido + Austin Quote ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal direction="left">
            <span className="kicker mb-6 block">The Standard</span>

            <div className="flex gap-6 md:gap-8">
              <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-burnt-orange via-burnt-orange/40 to-transparent" />

              <div className="space-y-10 relative">
                <span
                  className="absolute -top-6 -left-2 leading-none pointer-events-none select-none"
                  style={{ fontFamily: 'var(--bsi-font-body)', fontSize: '8rem', color: 'rgba(191, 87, 0, 0.07)' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Garrido */}
                <div className="relative">
                  <blockquote
                    className="text-xl md:text-2xl leading-relaxed mb-6"
                    style={{ fontFamily: 'var(--bsi-font-body)', color: 'rgba(245, 240, 235, 0.9)' }}
                  >
                    &ldquo;Where is that ten-year-old that loved to play baseball? Remember that kid
                    — twelve o&apos;clock game on Saturday morning, sitting on the edge of the bed in
                    uniform at five AM, putting on that glove, can&apos;t wait to get there.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #bf5700, #cc6600)' }}>
                      AG
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Augie Garrido, 1939&ndash;2018</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Winningest coach in college baseball history</div>
                    </div>
                  </div>
                </div>

                <div className="divider-accent h-px w-full" />

                {/* Austin */}
                <div>
                  <blockquote
                    className="text-lg md:text-xl leading-relaxed mb-6"
                    style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--color-text-secondary)' }}
                  >
                    &ldquo;That&apos;s who shows up here. The one checking scores at midnight.
                    The one who cares about the Tuesday game as much as the Saturday showcase.&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange to-burnt-orange/70 flex items-center justify-center text-white text-sm font-bold">
                      AH
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Austin Humphrey</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Founder, Blaze Sports Intel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 7. CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'var(--bsi-bg-secondary)' }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            <span className="section-label block mb-4">Get Started</span>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
            >
              Start with college baseball. Go from there.
            </h2>
            <p className="text-base mb-10 max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Five sports. Live scores. Real analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn-primary px-8 py-4 text-lg">
                Start Free Trial
              </Link>
              <Link href="/about" className="btn-outline px-8 py-4 text-lg">
                About BSI
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 8. Footer ─── */}
      <Footer />
    </div>
  );
}
