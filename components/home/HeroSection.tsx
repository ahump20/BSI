'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroScoreStrip } from './HeroScoreStrip';

/**
 * HeroSection — Heritage broadcast-open with logo visual anchor.
 * BSI shield mascot as hero centerpiece, pulsing ember glow,
 * massive headline, score strip as live proof, slogan in marquee.
 */
export function HeroSection() {
  return (
    <section className="heritage-hero relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Scanlines overlay */}
      <div className="scanlines" aria-hidden="true" />
      {/* Warm vignette */}
      <div className="vignette-warm" aria-hidden="true" />

      {/* Pulsing ember glow behind logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-[ember-pulse_4s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(191, 87, 0, 0.12) 0%, rgba(191, 87, 0, 0.04) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 corner-marks py-16 sm:py-24">
        {/* Heritage stamp kicker */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.6s_ease-out_forwards] mb-6">
          <span className="heritage-stamp">
            Est. 2024 <span className="text-bsi-dust">//</span> Five Sports <span className="text-bsi-dust">//</span> One Standard
          </span>
        </div>

        {/* BSI Shield Logo — visual anchor */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-scale-in_0.8s_ease-out_0.1s_forwards] mb-8 flex justify-center">
          <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px]">
            <Image
              src="/images/brand/bsi-mascot-400.png"
              alt="Blaze Sports Intel"
              fill
              className="object-contain drop-shadow-[0_0_40px_rgba(191,87,0,0.3)]"
              priority
            />
          </div>
        </div>

        {/* Section rule */}
        <div className="flex justify-center mb-5 opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.5s_ease-out_0.2s_forwards]">
          <div className="section-rule-thick w-16" />
        </div>

        {/* H1 — Bebas Neue hero display, larger scale */}
        <h1
          className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.25s_forwards] font-bold uppercase tracking-tight leading-none mb-2 text-[var(--bsi-bone)] text-[clamp(3rem,8vw,6rem)]"
          style={{ fontFamily: 'var(--bsi-font-display-hero)', textShadow: '2px 2px 0px rgba(0,0,0,0.7)' }}
        >
          Blaze Sports
        </h1>

        {/* INTEL — text-stroke with amber glow */}
        <h1
          className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.35s_forwards] font-bold uppercase tracking-tight leading-none mb-6 text-[clamp(3rem,8vw,6rem)]"
          style={{
            fontFamily: 'var(--bsi-font-display-hero)',
            WebkitTextStroke: '2px var(--bsi-primary)',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(191, 87, 0, 0.3), 0 0 80px rgba(191, 87, 0, 0.1)',
          }}
        >
          Intel
        </h1>

        {/* Cormorant italic subhead — broadcast chyron style */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.45s_forwards] max-w-2xl mx-auto mb-8 px-6 sm:px-4">
          <p className="font-serif italic text-base sm:text-lg md:text-xl tracking-wide text-[var(--bsi-dust)] leading-relaxed">
            <span className="text-[var(--heritage-bronze)]">&mdash;</span>{' '}
            Analytics for the sports that don&apos;t get the spotlight.
            Five sports deep. College baseball at the core.{' '}
            <span className="text-[var(--heritage-bronze)]">&mdash;</span>
          </p>
        </div>

        {/* Live proof — score strip (moved up for prominence) */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.55s_forwards] mb-10">
          <DataErrorBoundary name="Score Strip" compact>
            <HeroScoreStrip />
          </DataErrorBoundary>
        </div>

        {/* CTAs — heritage button trio */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.65s_forwards] flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/college-baseball" className="btn-heritage-fill px-6 py-3 text-sm">
            College Baseball
          </Link>
          <Link href="/scores" className="btn-heritage px-6 py-3 text-sm">
            Live Scores
          </Link>
          <Link href="/college-baseball/savant" className="btn-heritage px-6 py-3 text-sm">
            BSI Savant
          </Link>
        </div>

        {/* Heritage stat marquee — with slogan */}
        <div className="mt-10 overflow-hidden score-ticker py-2 opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.8s_ease-out_0.9s_forwards]">
          <div className="marquee-track whitespace-nowrap">
            {[0, 1].map((i) => (
              <span key={i} className="inline-flex items-center gap-6 mr-6 text-[10px] uppercase tracking-[0.15em] text-[var(--bsi-dust)]">
                <span className="text-[var(--bsi-primary)] font-semibold">Born to Blaze the Path Beaten Less</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
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
