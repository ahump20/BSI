'use client';

/**
 * BSI Hero Section - Redesigned
 *
 * Premium editorial hero with:
 * - Three.js ember particle background
 * - Bold typography ("Born to BLAZE The Path Less Beaten")
 * - Establishment badge
 * - Dual CTAs
 * - Brand marquee strip
 */

import Link from 'next/link';
import { HeroEmbers } from '@/components/three/HeroEmbers';
import { Marquee } from '@/components/ui/Marquee';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-true-black flex flex-col">
      {/* Three.js Ember Particles Background */}
      <div className="absolute inset-0 -z-10">
        <HeroEmbers className="" />
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-true-black/60 via-transparent to-true-black/80 pointer-events-none" />

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {/* Establishment Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/70 text-sm font-medium tracking-wide">
            <span className="w-2 h-2 bg-burnt-orange-500 rounded-full animate-pulse" />
            Est. 1995 · Memphis → Texas
          </span>
        </div>

        {/* Main Typography */}
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-none">
            <span className="block text-white/80 mb-2">Born to</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-burnt-orange-400 via-ember to-burnt-orange-500 py-2">
              BLAZE
            </span>
            <span className="block text-white mt-2">The Path Less Beaten</span>
          </h1>

          {/* Tagline */}
          <p className="mt-8 text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Every game matters to someone. We built the coverage fans actually deserve.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/about"
            className="px-8 py-4 bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-semibold text-lg rounded-lg transition-all duration-300 hover:shadow-glow-md"
          >
            Read the Story
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 border border-white/30 hover:border-burnt-orange-500 text-white hover:text-burnt-orange-400 font-semibold text-lg rounded-lg transition-all duration-300"
          >
            Follow the Intel
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <svg
            className="w-6 h-6 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Brand Marquee Strip */}
      <Marquee className="border-t-0" />
    </section>
  );
}

export default HeroSection;
