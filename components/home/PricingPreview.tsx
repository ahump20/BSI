'use client';

import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/data/pricing-tiers';

/**
 * PricingPreview — compact 2-card preview of pricing tiers.
 * Links to /pricing for full details. No checkout logic here.
 */
export function PricingPreview() {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-display text-text-primary uppercase tracking-wide mb-8 text-center">
        <span className="text-gradient-brand">Plans</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`glass-default rounded-2xl p-6 sm:p-8 relative border transition-all duration-300 hover:shadow-glow-sm ${
              tier.popular
                ? 'border-burnt-orange/50 hover:border-burnt-orange'
                : 'border-border-subtle hover:border-border-strong'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-burnt-orange text-white">
                Popular
              </span>
            )}

            <div className="text-center mb-4">
              <h3 className="text-lg font-display text-text-primary uppercase tracking-wide mb-1">
                {tier.name}
              </h3>
              <p className="text-xs text-text-muted">{tier.audience}</p>
            </div>

            <div className="text-center mb-6">
              <span className="text-4xl font-display font-bold text-burnt-orange">
                ${tier.price}
              </span>
              <span className="text-text-muted text-sm">/{tier.period}</span>
            </div>

            <Link
              href="/pricing"
              className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                tier.popular
                  ? 'bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white'
                  : 'border border-border-strong hover:border-burnt-orange text-text-primary hover:text-text-primary'
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
          className="text-sm text-text-muted hover:text-burnt-orange transition-colors"
        >
          Compare all features &rarr;
        </Link>
      </div>
    </div>
  );
}
