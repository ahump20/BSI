'use client';

import Link from 'next/link';

const GAME_URL = '/games/hotdog-dash/';

export default function HotdogDashPage() {
  return (
    <main className="min-h-screen bg-midnight pt-24 md:pt-28 pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <span
              className="inline-block mb-3 px-3 py-1 rounded text-xs font-display uppercase tracking-widest"
              style={{ background: 'rgba(205, 92, 92, 0.2)', color: '#CD5C5C' }}
            >
              Blaze Hot Dog
            </span>
            <h1 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
              Blaze Hot Dog
            </h1>
            <p className="text-white/60 mt-3 max-w-2xl">
              Dodge obstacles and collect hot dogs. Grow your chonk meter and survive the stadium dash.
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
              style={{ background: '#CD5C5C', color: '#0D0D12' }}
            >
              Open Fullscreen
            </a>
          </div>
        </div>
        <div className="glass-elevated overflow-hidden rounded-2xl aspect-video">
          <iframe
            src={GAME_URL}
            className="w-full h-full border-0"
            loading="lazy"
            title="Blaze Hot Dog"
            allow="autoplay"
          />
        </div>
      </section>
    </main>
  );
}
