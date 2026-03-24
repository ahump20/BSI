'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroScoreStrip } from './HeroScoreStrip';

/**
 * HeroSection — Heritage broadcast-open with logo visual anchor.
 * BSI shield mascot as hero centerpiece, pulsing ember glow,
 * massive headline, score strip as live proof, slogan front-and-center.
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

      <div className="relative z-10 w-full min-w-0 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 corner-marks py-16 sm:py-24">
        {/* Heritage stamp kicker */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.6s_ease-out_forwards] mb-6 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)', opacity: 0.7 }}>
            Est. 2024
          </span>
          <span className="heritage-stamp">
            Courage <span className="text-bsi-dust">//</span> Grit <span className="text-bsi-dust">//</span> Leadership
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
        <h1 className="font-bold uppercase tracking-tight leading-none mb-6 text-[clamp(3rem,8vw,6rem)]" style={{ fontFamily: 'var(--bsi-font-display-hero)' }}>
          <span
            className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.25s_forwards] block mb-2 text-[var(--bsi-bone)]"
            style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.7)' }}
          >
            Blaze Sports
          </span>
          <span
            className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.35s_forwards] block"
            style={{
              WebkitTextStroke: '2px var(--bsi-primary)',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(191, 87, 0, 0.3), 0 0 80px rgba(191, 87, 0, 0.1)',
            }}
          >
            Intel
          </span>
        </h1>

        {/* Slogan — front and center */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.4s_forwards] mb-5 sm:mb-6">
          <p
            className="font-serif italic tracking-wide leading-none"
            style={{
              fontSize: 'clamp(1.05rem, 3vw, 1.5rem)',
              color: 'var(--bsi-primary)',
              textShadow: '0 0 30px rgba(191, 87, 0, 0.22)',
              opacity: 0.92,
            }}
          >
            Born to Blaze the Path Beaten Less
          </p>
        </div>

        {/* Cormorant italic subhead — what's here today, why come back */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.5s_forwards] max-w-[22rem] sm:max-w-2xl mx-auto mb-8 px-4 sm:px-4">
          <p
            className="font-serif italic text-[15px] sm:text-lg md:text-xl tracking-[0.04em] leading-7 sm:leading-relaxed"
            style={{
              color: 'rgba(245, 240, 235, 0.82)',
              textShadow: '0 1px 12px rgba(0, 0, 0, 0.28)',
            }}
          >
            <span className="text-[var(--heritage-bronze)]">&mdash;</span>{' '}
            Park-adjusted sabermetrics across college baseball, college football, MLB, NBA &amp; NFL &mdash; built for athletes, fans, and front offices who trust data on game day.{' '}
            <span className="text-[var(--heritage-bronze)]">&mdash;</span>
          </p>
        </div>

        {/* Live proof — score strip */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.55s_forwards] mb-10">
          <DataErrorBoundary name="Score Strip" compact>
            <HeroScoreStrip />
          </DataErrorBoundary>
        </div>

        {/* CTAs — 1 primary + 2 supporting */}
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.65s_forwards] flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/scores" className="btn-heritage-fill px-6 py-3 text-sm">
            Live Scores
          </Link>
          <Link href="/college-baseball" className="btn-heritage px-6 py-3 text-sm">
            College Baseball
          </Link>
          <Link href="/college-baseball/savant" className="btn-heritage px-6 py-3 text-sm">
            BSI Savant
          </Link>
        </div>

        {/* Heritage stat marquee — no slogan repetition */}
        <div className="mt-10 overflow-hidden score-ticker py-2 opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.8s_ease-out_0.9s_forwards]">
          <div className="marquee-track whitespace-nowrap">
            {[0, 1].map((i) => (
              <span key={i} className="inline-flex items-center gap-6 mr-6 text-[10px] uppercase tracking-[0.15em] text-[var(--bsi-dust)]">
                <span>Free</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Every D1 Team</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>wOBA</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>wRC+</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>FIP</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Live Scores</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>Editorial</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
                <span>5 Sports</span>
                <span className="text-[var(--heritage-bronze)]">&#9670;</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
