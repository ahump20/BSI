'use client';

import Link from 'next/link';

/**
 * CtaSection — final call-to-action before the footer.
 */
export function CtaSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0D12]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide mb-6">
          Ready to{' '}
          <span className="bg-gradient-to-r from-[#BF5700] to-[#FDB913] bg-clip-text text-transparent">
            Go Deeper
          </span>
          ?
        </h2>
        <p className="text-lg text-white/50 mb-10 leading-relaxed">
          Real-time scores, predictive analytics, and the coverage that mainstream media
          won&apos;t touch. All in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/scores"
            className="inline-flex items-center justify-center bg-gradient-to-r from-[#BF5700] to-[#BF5700]/80 hover:from-[#BF5700]/90 hover:to-[#BF5700] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            Live Scores
          </Link>
          <Link
            href="/college-baseball/standings"
            className="inline-flex items-center justify-center border-2 border-white/20 hover:border-[#BF5700] text-white hover:text-[#BF5700] px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            Standings
          </Link>
        </div>
      </div>
    </section>
  );
}
