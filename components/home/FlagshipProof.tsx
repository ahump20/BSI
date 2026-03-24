'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
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

// ────────────────────────────────────────
// Count-up stat display
// ────────────────────────────────────────

function StatCounter({ value, visible }: { value: string; visible: boolean }) {
  const [display, setDisplay] = useState(value);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Only count up numeric-led values (e.g. "22", "6h")
    const match = value.match(/^(\d+)(.*)/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const duration = 900;
    const steps = Math.min(target, 24);
    const stepMs = Math.round(duration / steps);
    let current = 0;

    timerRef.current = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        clearInterval(timerRef.current!);
        setDisplay(value);
      } else {
        setDisplay(`${current}${suffix}`);
      }
    }, stepMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, value]);

  return <>{display}</>;
}

// ────────────────────────────────────────
// Individual stat card with scroll-triggered reveal
// ────────────────────────────────────────

function StatCard({ point, delay }: { point: typeof PROOF_POINTS[0]; delay: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger delay via setTimeout
          const t = setTimeout(() => setVisible(true), delay);
          observer.disconnect();
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`heritage-card p-5 sm:p-6 text-center transition-all duration-500 stat-pop-init${visible ? ' stat-visible' : ''}`}
      style={{ borderTop: '2px solid var(--bsi-primary)' }}
    >
      {/* Stat number — LED-scale display */}
      <div
        className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1 stat-led-glow"
        style={{
          fontFamily: 'var(--bsi-font-display-hero)',
          color: 'var(--bsi-primary)',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        <StatCounter value={point.stat} visible={visible} />
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2 mt-2"
        style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}
      >
        {point.label}
      </div>
      <p className="text-xs font-serif leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
        {point.detail}
      </p>
    </div>
  );
}

// ────────────────────────────────────────
// Section
// ────────────────────────────────────────

export function FlagshipProof() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8">
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
            <StatCard key={point.label} point={point} delay={idx * 100} />
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
