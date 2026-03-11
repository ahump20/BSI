'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { HeroGlow } from '@/components/ui/HeroGlow';

export function HomeCTA() {
  return (
    <section className="surface-lifted py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <HeroGlow shape="60% 50%" position="50% 40%" intensity={0.04} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.1)] to-transparent" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <ScrollReveal direction="up">
          {/* BSI shield as visual anchor */}
          <div className="flex justify-center mb-6">
            <div className="relative w-[64px] h-[64px]">
              <Image
                src="/images/brand/bsi-mascot-200.png"
                alt="Blaze Sports Intel"
                fill
                className="object-contain opacity-80"
              />
            </div>
          </div>

          <span className="heritage-stamp mb-4">Every Day</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 mt-4" style={{ color: 'var(--bsi-bone)' }}>
            See You Tomorrow
          </h2>
          <p className="text-base mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
            Scores update every 30 seconds during live games. Savant refreshes every six hours.
            Editorial drops every weekend. There&apos;s always something new.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/scores" className="btn-heritage-fill px-8 py-4 text-lg">
              Live Scores
            </Link>
            <Link href="/college-baseball" className="btn-heritage px-8 py-4 text-lg">
              College Baseball
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
  );
}
