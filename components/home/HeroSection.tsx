'use client';

import Link from 'next/link';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroScoreStrip } from './HeroScoreStrip';

/**
 * HeroSection — portfolio-style hero adapted for BSI.
 * Massive Oswald headline with text-stroke "INTEL",
 * Cormorant italic quote, JetBrains Mono section label,
 * editorial button pair, score strip, mono marquee.
 *
 * Updated: multi-sport platform identity (college baseball flagship).
 */
export function HeroSection() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      {/* Atmospheric radial glow behind INTEL */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(191,87,0,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        {/* Section label — JetBrains Mono, burnt-orange, tracked */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.6s_ease-out_forwards] mb-8">
          <span className="section-label">
            Five Sports. One Standard.
          </span>
        </div>

        {/* H1 — Oswald 700, massive, text-stroke on second line */}
        <h1 className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.15s_forwards] font-display font-bold uppercase tracking-tight leading-none mb-8 text-text-primary text-[clamp(4rem,12vw,8rem)]">
          Blaze Sports
          <br />
          <span className="text-stroke text-burnt-orange">
            Intel
          </span>
        </h1>

        {/* Quote — Cormorant italic, muted */}
        <p className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.3s_forwards] font-serif italic text-lg md:text-xl tracking-wide mb-10 text-text-secondary max-w-2xl mx-auto">
          Live scores, advanced analytics, and editorial coverage across college baseball, MLB, NFL, NBA, and college football.
        </p>

        {/* CTAs — Oswald uppercase, editorial button style */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.45s_forwards] flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/college-baseball"
            className="hero-btn-primary"
          >
            College Baseball
          </Link>
          <Link
            href="/scores"
            className="hero-btn-outline"
          >
            Live Scores
          </Link>
        </div>

        {/* Live proof — score strip */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.6s_forwards] mt-12">
          <DataErrorBoundary name="Score Strip" compact>
            <HeroScoreStrip />
          </DataErrorBoundary>
        </div>

        {/* Mono marquee — platform stats */}
        <div className="mt-8 overflow-hidden opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.8s_ease-out_0.8s_forwards]">
          <div className="marquee-track font-mono text-[10px] uppercase tracking-[0.15em] whitespace-nowrap text-[var(--bsi-text-dim)]">
            {/* Duplicated for seamless loop */}
            {[0, 1].map((i) => (
              <span key={i} className="inline-flex items-center gap-8 mr-8">
                <span>Park-Adjusted wOBA</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>wRC+</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>FIP</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>5 Sports</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>Live Scores</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>Editorial</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>300+ D1 Teams</span>
                <span className="text-burnt-orange">&middot;</span>
                <span>Free</span>
                <span className="text-burnt-orange">&middot;</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
