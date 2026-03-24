'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

/**
 * FlagshipProof — dedicated section showing why BSI is
 * differentiated in college baseball. Absorbs the thesis
 * that SavantPreviewStrip hints at and makes it explicit.
 */

const PROOF_POINTS = [
  {
    stat: 'Every',
    label: 'D1 Team',
    detail: 'Every conference, every team — not just the coastal powers.',
  },
  {
    stat: 'Park-Adjusted',
    label: 'Sabermetrics',
    detail: 'Park-adjusted sabermetrics, live scores, and original editorial for college baseball.',
  },
  {
    stat: '6h',
    label: 'Refresh Cycle',
    detail: 'Stats recomputed every six hours during the season.',
  },
  {
    stat: '22',
    label: 'Conferences',
    detail: 'Full standings, rankings, and editorial across every D1 conference.',
  },
];

export function FlagshipProof() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-2">Flagship</span>
          <div className="flex items-center gap-3 mt-2 mb-8">
            <div className="section-rule-thick" />
            <h2
              className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide"
              style={{ color: 'var(--bsi-bone)' }}
            >
              College Baseball at the Core
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {PROOF_POINTS.map((point, idx) => (
            <ScrollReveal key={point.label} direction="up" delay={idx * 80}>
              <div
                className="heritage-card p-5 text-center"
                style={{ borderTop: '2px solid var(--bsi-primary)' }}
              >
                <div
                  className="text-2xl md:text-3xl font-bold mb-1"
                  style={{ fontFamily: 'var(--bsi-font-display-hero)', color: 'var(--bsi-primary)' }}
                >
                  {point.stat}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-2"
                  style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}
                >
                  {point.label}
                </div>
                <p className="text-xs font-serif leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                  {point.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={320}>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/college-baseball/savant" className="btn-heritage-fill px-5 py-2.5 text-sm">
              BSI Savant
            </Link>
            <Link href="/college-baseball/rankings" className="btn-heritage px-5 py-2.5 text-sm">
              Rankings
            </Link>
            <Link href="/college-baseball/transfer-portal" className="btn-heritage px-5 py-2.5 text-sm">
              Transfer Portal
            </Link>
            <Link href="/college-baseball/editorial" className="btn-heritage px-5 py-2.5 text-sm">
              Editorial
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
