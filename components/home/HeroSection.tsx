'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroScoreStrip } from './HeroScoreStrip';

export function HeroSection() {
  return (
    <>
      <section
        data-home-hero
        className="relative isolate overflow-hidden bg-midnight text-[var(--bsi-bone)]"
      >
        <div className="absolute inset-0">
          <Image
            src="/images/baseball-sliders-texas-tech.webp"
            alt="College baseball under the lights"
            fill
            priority
            className="object-cover object-[68%_center]"
          />
        </div>
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.82) 34%, rgba(8,8,8,0.52) 58%, rgba(8,8,8,0.22) 78%, rgba(8,8,8,0.38) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.48) 100%)',
          }}
        />
        <div
          className="absolute -left-20 top-20 h-64 w-64 rounded-full blur-3xl"
          aria-hidden="true"
          style={{ background: 'rgba(191, 87, 0, 0.16)' }}
        />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3.5rem)] w-full min-w-0 max-w-7xl items-end px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
          <div className="grid w-full items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.55fr)]">
            <div className="max-w-3xl">
              <div className="mb-5 overflow-hidden">
                <p
                  className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.55s_ease-out_0.05s_forwards] text-[10px] uppercase tracking-[0.28em] sm:text-xs"
                  style={{ color: 'rgba(245, 240, 235, 0.76)', fontFamily: 'var(--bsi-font-data)' }}
                >
                  Austin, Texas // Est. 2024
                </p>
              </div>

              <div className="mb-1 overflow-hidden">
                <p
                  className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.6s_ease-out_0.12s_forwards] font-display text-lg font-semibold uppercase tracking-[0.22em] sm:text-xl"
                  style={{ color: 'var(--bsi-bone)' }}
                >
                  Blaze Sports Intel
                </p>
              </div>

              <div className="mb-4 overflow-hidden">
                <p
                  className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.6s_ease-out_0.16s_forwards] text-sm italic tracking-wide sm:text-base"
                  style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-body)' }}
                >
                  Born to Blaze the Path Beaten Less
                </p>
              </div>

              <div className="overflow-hidden">
                <h1
                  className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.72s_ease-out_0.2s_forwards] font-bold uppercase leading-[0.92] tracking-[0.01em]"
                  style={{
                    fontFamily: 'var(--bsi-font-display-hero)',
                    fontSize: 'clamp(3.1rem, 8vw, 6.8rem)',
                    textShadow: '0 10px 50px rgba(0,0,0,0.55)',
                  }}
                >
                  The Real Game
                  <span className="block text-[var(--bsi-primary)]">Lives Between</span>
                  <span className="block">The Coasts</span>
                </h1>
              </div>

              <div className="mt-6 max-w-2xl overflow-hidden">
                <p
                  className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.72s_ease-out_0.34s_forwards] font-serif text-base leading-relaxed sm:text-lg"
                  style={{ color: 'rgba(245, 240, 235, 0.88)' }}
                >
                  Live boards, park-adjusted analytics, and original reporting for the programs the prestige platforms keep skipping.
                  BSI treats Tuesday night in the middle of the country like it matters, because it does.
                </p>
              </div>

              <div className="mt-6 overflow-hidden">
                <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.72s_ease-out_0.44s_forwards] flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] sm:text-xs">
                  <span className="heritage-stamp">Live Boards</span>
                  <span style={{ color: 'rgba(245, 240, 235, 0.36)' }}>&#9670;</span>
                  <span style={{ color: 'rgba(245, 240, 235, 0.72)' }}>Park-Adjusted Sabermetrics</span>
                  <span style={{ color: 'rgba(245, 240, 235, 0.36)' }}>&#9670;</span>
                  <span style={{ color: 'rgba(245, 240, 235, 0.72)' }}>330 D1 Programs Tracked</span>
                </div>
              </div>

              <div className="mt-8 overflow-hidden">
                <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.72s_ease-out_0.56s_forwards] flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/scores"
                    className="btn-heritage-fill px-7 py-3.5 text-sm"
                    style={{ boxShadow: '0 18px 48px rgba(191, 87, 0, 0.22)' }}
                  >
                    Open Scores
                  </Link>
                  <Link href="/college-baseball" className="btn-heritage px-7 py-3.5 text-sm">
                    Start With College Baseball
                  </Link>
                  <Link href="/college-baseball/savant" className="btn-heritage px-7 py-3.5 text-sm">
                    See BSI Savant
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative hidden min-h-[360px] lg:block">
              <div
                className="absolute inset-y-8 right-0 w-full rounded-full blur-3xl"
                aria-hidden="true"
                style={{ background: 'radial-gradient(circle, rgba(191, 87, 0, 0.24) 0%, rgba(191, 87, 0, 0.02) 68%, transparent 100%)' }}
              />
              <div className="absolute bottom-0 right-0 h-[380px] w-[300px] opacity-80">
                <Image
                  src="/images/brand/bsi-mascot-400.png"
                  alt=""
                  fill
                  aria-hidden="true"
                  className="object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        data-home-proof-ribbon
        className="relative z-20 mx-auto -mt-8 w-full max-w-6xl px-4 sm:-mt-10 sm:px-6 lg:-mt-12 lg:px-8"
      >
        <DataErrorBoundary name="Score Strip" compact>
          <HeroScoreStrip />
        </DataErrorBoundary>
      </div>
    </>
  );
}
