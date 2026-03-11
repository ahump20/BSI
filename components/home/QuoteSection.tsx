'use client';

import Image from 'next/image';
import { ScrollReveal } from '@/components/cinematic';

export function QuoteSection() {
  return (
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
  );
}
