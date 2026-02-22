'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { EvidenceStrip } from '@/components/home/EvidenceStrip';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

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

interface SportCard {
  name: string;
  icon: React.FC;
  href: string;
  description: string;
  accent: string;
  bgAccent: string;
  flagship?: boolean;
  comingSoon?: boolean;
}

const sports: SportCard[] = [
  {
    name: 'College Baseball',
    icon: BaseballIcon,
    href: '/college-baseball',
    description: 'D1 standings, rankings & complete box scores',
    accent: 'group-hover:text-[#BF5700] group-hover:border-[#BF5700]/50',
    bgAccent: 'group-hover:bg-[#BF5700]/10',
    flagship: true,
  },
  {
    name: 'MLB',
    icon: BaseballIcon,
    href: '/mlb',
    description: 'Live scores, standings & Statcast analytics',
    accent: 'group-hover:text-red-500 group-hover:border-red-500/50',
    bgAccent: 'group-hover:bg-red-500/10',
  },
  {
    name: 'NFL',
    icon: FootballIcon,
    href: '/nfl',
    description: 'Real-time scores, standings & team intel',
    accent: 'group-hover:text-blue-400 group-hover:border-blue-400/50',
    bgAccent: 'group-hover:bg-blue-400/10',
  },
  {
    name: 'NBA',
    icon: BasketballIcon,
    href: '/nba',
    description: 'Live games, standings & performance data',
    accent: 'group-hover:text-orange-400 group-hover:border-orange-400/50',
    bgAccent: 'group-hover:bg-orange-400/10',
  },
  {
    name: 'CFB',
    icon: StadiumIcon,
    href: '/cfb',
    description: 'College football analytics & recruiting',
    accent: 'group-hover:text-amber-500 group-hover:border-amber-500/50',
    bgAccent: 'group-hover:bg-amber-500/10',
    comingSoon: true,
  },
];

// ────────────────────────────────────────
// Page Component
// ────────────────────────────────────────

export function HomePageClient() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0D0D0D]">
      {/* ─── 1. Hero ─── */}
      <HeroSection />

      {/* ─── 2. Live Scores Strip ─── */}
      <HomeLiveScores />

      {/* ─── 3. Sports Hub — Glass Cards ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] relative">
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
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#BF5700] mb-3">
                Coverage
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wide">
                Every Game Matters
              </h2>
              <p className="mt-3 text-base text-white/50 max-w-2xl mx-auto">
                From the College World Series to Sunday Night Football — real analytics, not just
                scores.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {sports.map((sport, index) => (
              <ScrollReveal key={sport.name} direction="up" delay={index * 80}>
                <Link href={sport.href} className="group block h-full">
                  <div
                    className={`relative p-6 rounded-2xl border bg-white/[0.03] backdrop-blur-sm ${
                      sport.flagship
                        ? 'border-[#BF5700]/30 ring-1 ring-[#BF5700]/10'
                        : 'border-white/10'
                    } ${sport.accent} transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.06] h-full flex flex-col items-center text-center`}
                  >
                    {sport.flagship && (
                      <Badge variant="accent" size="sm" className="absolute top-3 right-3">
                        Flagship
                      </Badge>
                    )}
                    {sport.comingSoon && (
                      <Badge variant="warning" size="sm" className="absolute top-3 right-3">
                        Soon
                      </Badge>
                    )}

                    <div
                      className={`w-16 h-16 rounded-xl bg-white/5 ${sport.bgAccent} flex items-center justify-center mb-4 transition-all duration-300 text-white/60 ${sport.accent}`}
                    >
                      <sport.icon />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#BF5700] transition-colors">
                      {sport.name}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed">{sport.description}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Evidence Strip ─── */}
      <EvidenceStrip />

      {/* ─── 5. Editorial Preview ─── */}
      <EditorialPreview />

      {/* ─── 6. Founder Quote ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0D0D] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#BF5700]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal direction="left">
            <div className="flex gap-6 md:gap-8">
              {/* Burnt-orange left border — editorial magazine feel */}
              <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-[#BF5700] to-[#BF5700]/20" />

              <div>
                <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed mb-6">
                  ESPN treats college baseball like an afterthought. Fans check scores at 11 PM and
                  get a paragraph if they&apos;re lucky.
                  <span className="text-[#BF5700]">
                    {' '}
                    I got tired of waiting for someone else to fix it.
                  </span>
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BF5700] to-[#BF5700]/70 flex items-center justify-center text-white text-sm font-bold">
                    AH
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Austin Humphrey</div>
                    <div className="text-white/40 text-xs">Founder, Blaze Sports Intel</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 7. CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Ready to experience real sports intel?
            </h2>
            <p className="text-base text-white/50 mb-10 max-w-2xl mx-auto">
              Join fans who refuse to settle for box scores and headlines. Get the data that actually
              matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#BF5700] to-[#BF5700]/80 hover:from-[#BF5700]/90 hover:to-[#BF5700] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(191,87,0,0.3)]"
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
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-[#BF5700] text-white hover:text-[#BF5700] px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              >
                Learn Our Story
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 8. Footer ─── */}
      <Footer />
    </main>
  );
}
