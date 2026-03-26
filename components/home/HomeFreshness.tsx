'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { TrendingIntelFeed } from './TrendingIntelFeed';
import { useSportData } from '@/lib/hooks/useSportData';
import {
  type Editorial,
  type EditorialListResponse,
  getEditorialHref,
  readTime,
} from '@/lib/editorial';

const FALLBACK_FEATURED: Editorial = {
  id: 2,
  slug: 'texas-week-6-recap',
  date: '2026-03-24',
  title: 'Texas Week 6: Punched, Then Answered',
  preview:
    'The read was simple: Texas got tested, responded inside the game, and looked like a club with enough balance to hold up once league play turns heavy.',
  teams: ['Texas'],
  wordCount: 1850,
  createdAt: '2026-03-24',
};

export function HomeFreshness() {
  const { data } = useSportData<EditorialListResponse>('/api/college-baseball/editorial/list', {
    refreshInterval: 300_000,
  });

  const featured = useMemo(() => data?.editorials?.[0] ?? FALLBACK_FEATURED, [data]);

  return (
    <section data-home-freshness className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal direction="up">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="heritage-stamp">What&apos;s Moving Now</span>
              <h2
                className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.05em] sm:text-4xl"
                style={{ color: 'var(--bsi-bone)' }}
              >
                Freshness Is The Return Value
              </h2>
            </div>
            <p className="max-w-2xl font-serif text-base leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
              One featured read for context. One fast intel rail for movement. Enough signal to know whether it is time to stay or click deeper.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollReveal direction="up" delay={80}>
            <Link href={getEditorialHref(featured)} className="group block">
              <article className="relative overflow-hidden border-t border-[rgba(245,240,235,0.1)] pt-6">
                <div
                  className="absolute left-0 top-6 h-20 w-px"
                  aria-hidden="true"
                  style={{ background: 'linear-gradient(180deg, rgba(191,87,0,1) 0%, rgba(191,87,0,0) 100%)' }}
                />
                <div className="pl-5 sm:pl-6">
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                    Featured Editorial
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-bold uppercase leading-snug tracking-[0.05em] text-[var(--bsi-bone)] transition-colors group-hover:text-burnt-orange sm:text-3xl">
                    {featured.title}
                  </h3>
                  <p className="mt-4 max-w-2xl font-serif text-base leading-relaxed sm:text-lg" style={{ color: 'var(--bsi-dust)' }}>
                    {featured.preview}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    <span>{featured.date}</span>
                    <span>&#9670;</span>
                    <span>{readTime(featured.wordCount)}</span>
                    <span>&#9670;</span>
                    <span>{featured.teams?.[0] || 'National'}</span>
                  </div>

                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--heritage-columbia-blue)' }}>
                    Read The Latest &rarr;
                  </p>
                </div>
              </article>
            </Link>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <TrendingIntelFeed />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
