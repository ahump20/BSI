'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

export function HomeCTA() {
  return (
    <section
      data-home-cta
      className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(18,14,10,1) 100%)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.12)] to-transparent" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-4">Return To The Site</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 mt-4 uppercase tracking-[0.05em]" style={{ color: 'var(--bsi-bone)' }}>
            Come Back Because The Boards Move
          </h2>
          <p className="text-base mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
            Scores refresh during the game. Analytics recompute on cadence. Editorial keeps the week stitched together.
            BSI earns the repeat visit by staying fresh, visible, and source-tagged.
          </p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-[0.22em] sm:text-xs" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
            <span>Live during games</span>
            <span style={{ color: 'rgba(245,240,235,0.24)' }}>&#9670;</span>
            <span>6h analytics cadence</span>
            <span style={{ color: 'rgba(245,240,235,0.24)' }}>&#9670;</span>
            <span>Original editorial</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/scores" className="btn-heritage-fill px-8 py-4 text-sm sm:text-base">
              Open Today&apos;s Boards
            </Link>
            <Link href="/college-baseball" className="btn-heritage px-8 py-4 text-sm sm:text-base">
              Go To College Baseball
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
