'use client';

import Link from 'next/link';

/**
 * HeroSection — cinematic landing hero with gradient background.
 * Used by HomePageClient via dynamic import (SSR disabled).
 */
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--bsi-primary) 15%, transparent) 0%, var(--bsi-midnight) 70%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] z-[1]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-burnt-orange-500/20 text-burnt-orange-400 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live Sports Intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-text-primary uppercase tracking-tight leading-none mb-6">
          Born to Blaze
          <br />
          <span className="bg-gradient-to-r from-burnt-orange to-[#FDB913] bg-clip-text text-transparent">
            the Path Beaten Less
          </span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
          Every game matters to someone. MLB, NFL, NBA, College Baseball — real analytics, not
          just scores. Built by a fan who got tired of waiting.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            Launch Dashboard
          </Link>
          <Link
            href="/college-baseball"
            className="inline-flex items-center justify-center gap-2 border-2 border-border-strong hover:border-burnt-orange text-white hover:text-burnt-orange px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            College Baseball
          </Link>
        </div>
      </div>
    </section>
  );
}
