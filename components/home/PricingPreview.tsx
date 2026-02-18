'use client';

import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/data/pricing-tiers';

// Show Pro and Data API on the homepage — the two anchor tiers
const PREVIEW_TIERS = PRICING_TIERS.filter((t) => t.id === 'pro' || t.id === 'api');

/**
 * PricingPreview — compact 2-card preview of pricing tiers.
 * Links to /pricing for full details. No checkout logic here.
 */
export function PricingPreview() {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-display text-white uppercase tracking-wide mb-8 text-center">
        <span className="text-gradient-brand">Plans</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PREVIEW_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`glass-default rounded-2xl p-6 sm:p-8 relative border transition-all duration-300 hover:shadow-glow-sm ${
              tier.popular
                ? 'border-[#BF5700]/50 hover:border-[#BF5700]'
                : 'border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#BF5700] text-white">
                Popular
              </span>
            )}

            <div className="text-center mb-4">
              <h3 className="text-lg font-display text-white uppercase tracking-wide mb-1">
                {tier.name}
              </h3>
              <p className="text-xs text-white/40">{tier.audience}</p>
            </div>

            <div className="text-center mb-6">
              <span className="text-4xl font-display font-bold text-[#BF5700]">
                ${tier.monthlyPrice}
              </span>
              <span className="text-white/40 text-sm">/{tier.period}</span>
            </div>

            <Link
              href="/pricing"
              className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                tier.popular
                  ? 'bg-gradient-to-r from-[#BF5700] to-[#BF5700]/80 hover:from-[#BF5700]/90 hover:to-[#BF5700] text-white'
                  : 'border border-white/20 hover:border-[#BF5700] text-white/80 hover:text-white'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          href="/pricing"
          className="text-sm text-white/40 hover:text-[#BF5700] transition-colors"
        >
          Compare all features &rarr;
        </Link>
      </div>
    </div>
  );
}
