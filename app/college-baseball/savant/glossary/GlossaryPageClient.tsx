'use client';

import Link from 'next/link';
import { SavantGlossary } from '@/components/analytics/SavantGlossary';
import { Footer } from '@/components/layout-ds/Footer';

export function GlossaryPageClient() {
  return (
    <>
      <div className="savant-ambient min-h-screen">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-8" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--svt-text-muted)' }}>
            <Link href="/" className="transition-colors hover:text-[var(--svt-text)]">Home</Link>
            <span>/</span>
            <Link href="/college-baseball" className="transition-colors hover:text-[var(--svt-text)]">College Baseball</Link>
            <span>/</span>
            <Link href="/college-baseball/savant" className="transition-colors hover:text-[var(--svt-text)]">Savant</Link>
            <span>/</span>
            <span style={{ color: 'var(--svt-accent)' }}>Glossary</span>
          </nav>

          {/* Hero */}
          <div className="mb-10 savant-fade-in">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-sm"
              style={{ backgroundColor: 'rgba(232, 93, 38, 0.1)', color: 'var(--svt-accent)' }}
            >
              Reference
            </span>
            <h1
              className="mt-4 font-savant-display font-bold uppercase tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--svt-text)' }}
            >
              Sabermetrics <span style={{ color: 'var(--svt-accent)' }}>Glossary</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed font-savant-body" style={{ color: 'var(--svt-text-muted)' }}>
              Every advanced metric on BSI Savant explained in plain English. Tap any
              metric to expand its definition, typical ranges, and what it means for
              evaluating college baseball players.
            </p>
          </div>

          {/* Glossary */}
          <SavantGlossary />

          {/* Footer links */}
          <div className="mt-12 pt-6 border-t border-[var(--svt-border)]">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/college-baseball/savant"
                className="text-[11px] font-mono uppercase tracking-wider transition-colors"
                style={{ color: 'var(--svt-accent)' }}
              >
                Back to Leaderboards
              </Link>
              <span style={{ color: 'var(--svt-text-dim)' }}>&middot;</span>
              <Link
                href="/college-baseball/savant/visuals"
                className="text-[11px] font-mono uppercase tracking-wider transition-colors"
                style={{ color: 'var(--svt-accent)' }}
              >
                Interactive Visuals
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
