'use client';

import Link from 'next/link';
import { isInSeason, SPORT_LABELS, type SportKey } from '@/lib/season';

const ALL_SPORTS: SportKey[] = ['ncaa', 'mlb', 'nfl', 'nba', 'cfb'];

function getBadgeText(): string {
  const inSeason = ALL_SPORTS.filter((s) => isInSeason(s));
  if (inSeason.length === 0) return 'Sports Intelligence Platform';
  if (inSeason.length === 1) return `${SPORT_LABELS[inSeason[0]]} Season Live`;
  if (inSeason.length <= 3) return `${inSeason.map((s) => SPORT_LABELS[s]).join(' \u2022 ')} Live`;
  return `${inSeason.length} Sports In Season`;
}

/**
 * HeroSection — cinematic landing hero with gradient background.
 * Reduced from min-h-screen to min-h-[70vh] so live scores are visible faster.
 */
export function HeroSection() {
  const badgeText = getBadgeText();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(191,87,0,0.15) 0%, rgba(13,13,18,1) 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-fade-in_0.6s_ease-out_forwards] inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-burnt-orange-500/20 text-burnt-orange-400 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {badgeText}
        </div>

        <h1 className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.15s_forwards] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white uppercase tracking-tight leading-none mb-6">
          Born to Blaze
          <br />
          <span className="bg-gradient-to-r from-[#BF5700] to-[#FDB913] bg-clip-text text-transparent">
            the Path Less Beaten
          </span>
        </h1>

        <p className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.3s_forwards] text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
          Every game matters to someone. MLB, NFL, NBA, College Baseball — real analytics, not
          just scores. Built by a fan who got tired of waiting.
        </p>

        <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.45s_forwards] flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#BF5700] to-[#BF5700]/80 hover:from-[#BF5700]/90 hover:to-[#BF5700] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            Launch Dashboard
          </Link>
          <Link
            href="/college-baseball"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-[#BF5700] text-white hover:text-[#BF5700] px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            College Baseball
          </Link>
        </div>
      </div>
    </section>
  );
}
