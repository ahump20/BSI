'use client';

import Link from 'next/link';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroScoreStrip } from './HeroScoreStrip';

/**
 * HeroSection — Heritage Vintage broadcast-open aesthetic.
 * Multi-radial gradient, film grain, scanlines, corner marks,
 * heritage-stamp kicker, massive Oswald headline with text-shadow
 * extrusion, text-stroke "INTEL", Cormorant italic subhead,
 * heritage button pair, score ticker, stat marquee.
 *
 * "It's October 1998 in the press box at the Liberty Bowl."
 */
export function HeroSection() {
  return (
    <section className="heritage-hero relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Scanlines overlay */}
      <div className="scanlines" aria-hidden="true" />
      {/* Warm vignette */}
      <div className="vignette-warm" aria-hidden="true" />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 corner-marks py-16 sm:py-20">
        {/* Heritage stamp kicker */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.6s_ease-out_forwards] mb-8">
          <span className="heritage-stamp">
            Est. 2024 <span className="text-bsi-dust">//</span> Five Sports <span className="text-bsi-dust">//</span> One Standard
          </span>
        </div>

        {/* Section rule */}
        <div className="flex justify-center mb-6 opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.5s_ease-out_0.1s_forwards]">
          <div className="section-rule-thick" />
        </div>

        {/* H1 — Bebas Neue hero display, single-layer text shadow */}
        <h1
          className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.15s_forwards] font-bold uppercase tracking-tight leading-none mb-2 text-[var(--bsi-bone)] text-[clamp(2.5rem,6vw,5rem)]"
          style={{ fontFamily: 'var(--bsi-font-display-hero)', textShadow: '2px 2px 0px rgba(0,0,0,0.7)' }}
        >
          Blaze Sports
        </h1>

        {/* INTEL — text-stroke with amber glow */}
        <h1
          className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.25s_forwards] font-bold uppercase tracking-tight leading-none mb-8 text-[clamp(2.5rem,6vw,5rem)]"
          style={{
            fontFamily: 'var(--bsi-font-display-hero)',
            WebkitTextStroke: '2px var(--bsi-primary)',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(191, 87, 0, 0.3), 0 0 80px rgba(191, 87, 0, 0.1)',
          }}
        >
          Intel
        </h1>

        {/* Cormorant italic subhead with pull-quote left bar treatment */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.35s_forwards] max-w-2xl mx-auto mb-10">
          <div className="flex items-start gap-3 text-left sm:text-center sm:block">
            <div className="w-0.5 h-12 bg-gradient-to-b from-[var(--heritage-bronze)] to-transparent rounded-full shrink-0 sm:hidden" />
            <p className="font-serif italic text-lg md:text-xl tracking-wide text-[var(--bsi-dust)] leading-relaxed">
              Analytics for the sports that don&apos;t get the spotlight.
              Five sports deep. College baseball at the core.
            </p>
          </div>
        </div>

        {/* CTAs — heritage button pair */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.45s_forwards] flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/college-baseball" className="btn-heritage-fill">
            College Baseball
          </Link>
          <Link href="/scores" className="btn-heritage">
            Live Scores
          </Link>
        </div>

        {/* Live proof — score strip */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.6s_forwards] mt-12">
          <DataErrorBoundary name="Score Strip" compact>
            <HeroScoreStrip />
          </DataErrorBoundary>
        </div>

        {/* Heritage stat marquee — IBM Plex Mono with bronze separators */}
        <div className="mt-8 overflow-hidden score-ticker py-2 opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.8s_ease-out_0.8s_forwards]">
          <div className="marquee-track whitespace-nowrap">
            {[0, 1].map((i) => (
              <span key={i} className="inline-flex items-center gap-6 mr-6 text-[10px] uppercase tracking-[0.15em] text-[var(--bsi-dust)]">
                <span>5 Sports</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Park-Adjusted wOBA</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>wRC+</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>FIP</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Live Scores</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Editorial</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>300+ D1 Teams</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Free</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
