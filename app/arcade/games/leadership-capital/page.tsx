'use client';

import Link from 'next/link';

const GAME_URL = '/games/leadership-capital/';

export default function LeadershipCapitalPage() {
  return (
    <main className="min-h-screen bg-midnight pt-24 md:pt-28 pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <span
              className="inline-block mb-3 px-3 py-1 rounded text-xs font-display uppercase tracking-widest"
              style={{ background: 'rgba(191, 87, 0, 0.2)', color: '#BF5700' }}
            >
              Leadership Analytics
            </span>
            <h1 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
              Leadership Capital Index
            </h1>
            <p className="text-white/60 mt-3 max-w-2xl">
              23 intangible leadership metrics mapped to five validated academic frameworks —
              Ulrich LCI, ISO 30431, Bass &amp; Avolio MLQ 5X, TEIQue, and Antonakis CLTs.
              Adjust the sliders, compare preset archetypes, and quantify the &ldquo;It Factor.&rdquo;
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/arcade"
              className="btn-secondary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
            >
              Back to Arcade
            </Link>
            <a
              href={GAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
              style={{ background: '#BF5700', color: '#FAFAFA' }}
            >
              Open Fullscreen
            </a>
          </div>
        </div>
        <div className="glass-elevated overflow-hidden rounded-2xl" style={{ aspectRatio: '16 / 10' }}>
          <iframe
            src={GAME_URL}
            className="w-full h-full border-0"
            loading="lazy"
            title="Intangible Leadership Capital Index"
            allow="autoplay"
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/50">
            Ulrich LCI 2015
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/50">
            ISO/TS 30431
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/50">
            Bass &amp; Avolio MLQ 5X
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/50">
            TEIQue
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/50">
            Antonakis CLTs
          </span>
        </div>
      </section>
    </main>
  );
}
