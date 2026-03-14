'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { PRICING_TIERS } from '@/lib/data/pricing-tiers';
import { trackPaywallHit } from '@/lib/analytics/tracker';

// Lazy-load HeroVideo — decorative background, not LCP-critical on pricing page
const HeroVideo = dynamic(
  () => import('@/components/hero/HeroVideo').then((mod) => ({ default: mod.HeroVideo })),
  { ssr: false }
);

const tiers = PRICING_TIERS;

// ---------------------------------------------------------------------------
// Competitive comparison data
// ---------------------------------------------------------------------------

const COMPETITORS = [
  {
    name: 'BSI Pro',
    price: '$12/mo',
    parkAdjusted: true,
    updateFreq: 'Every 6 hours',
    mobile: 'Mobile-first',
    free: 'Generous free tier',
  },
  {
    name: 'D1Baseball',
    price: '$140/yr',
    parkAdjusted: false,
    updateFreq: 'Daily',
    mobile: '2.0-star app',
    free: 'Limited free content',
  },
  {
    name: 'FanGraphs',
    price: 'Free',
    parkAdjusted: false,
    updateFreq: 'Weekly',
    mobile: 'Desktop-oriented',
    free: 'Free (no park adjustment)',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    trackPaywallHit('/pricing');
  }, []);

  const handleCheckout = async () => {
    setLoading('pro');
    try {
      const response = await fetch('/api/stripe/create-embedded-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro' }),
        signal: AbortSignal.timeout(8000),
      });

      const data = (await response.json()) as { error?: string; clientSecret?: string };

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.clientSecret) {
        window.location.href = `/checkout?client_secret=${data.clientSecret}`;
      }
    } catch (_error) {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen grain-overlay" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <HeroVideo />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(to bottom, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.8) 50%, rgba(13,13,13,0.95) 100%)',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-4">Simple, Transparent Pricing</span>
            <h1
              className="mt-4 font-bold uppercase tracking-tight leading-none mb-4"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'var(--bsi-bone)',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              }}
            >
              Free to Start. <span style={{ color: 'var(--bsi-primary)' }}>Pro</span> When You&apos;re Ready.
            </h1>
            <div className="flex justify-center mb-6">
              <div className="section-rule-thick w-16" />
            </div>
            <p className="font-serif italic text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--bsi-dust)' }}>
              Scores, standings, and box scores are free — no signup, no paywall. Pro unlocks
              park-adjusted sabermetrics, conference strength, and the full analytical depth.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="surface-lifted relative" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers.map((tier, index) => (
              <ScrollReveal key={tier.id} direction="up" delay={index * 100}>
                <div
                  className="heritage-card relative p-8 h-full"
                  style={tier.popular ? { borderTop: '3px solid var(--bsi-primary)' } : {}}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="heritage-stamp" style={{ padding: '2px 12px', fontSize: '10px' }}>Best Value</span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h2
                      className="text-2xl font-bold uppercase tracking-wide mb-2"
                      style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
                    >
                      {tier.name}
                    </h2>
                    <p className="text-sm font-serif" style={{ color: 'var(--bsi-dust)' }}>{tier.description}</p>
                  </div>

                  <div className="text-center mb-8">
                    {tier.price === 0 ? (
                      <span className="text-5xl font-bold" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-primary)' }}>
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-5xl font-bold" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-primary)' }}>
                          ${tier.price}
                        </span>
                        <span style={{ color: 'var(--bsi-dust)' }}>/{tier.period}</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-sm font-serif" style={{ color: 'var(--bsi-dust)' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.directLink ? (
                    <Link href={tier.directLink} className="btn-heritage block text-center px-6 py-3">
                      {tier.cta}
                    </Link>
                  ) : (
                    <button
                      className="btn-heritage-fill w-full px-6 py-3"
                      onClick={handleCheckout}
                      disabled={loading !== null}
                    >
                      {loading === tier.id ? 'Loading...' : tier.cta}
                    </button>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Comparison */}
      <section className="relative" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--surface-scoreboard)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-3">Side by Side</span>
            <h2
              className="mt-3 font-bold uppercase tracking-wide mb-4"
              style={{ fontFamily: 'var(--bsi-font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--bsi-bone)' }}
            >
              How BSI Compares
            </h2>
            <p className="text-sm font-serif mb-10" style={{ color: 'var(--bsi-dust)' }}>
              College baseball analytics options, side by side.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full max-w-3xl mx-auto text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)', borderBottom: '1px solid var(--border-vintage)' }} />
                    {COMPETITORS.map((c) => (
                      <th
                        key={c.name}
                        className="text-center py-3 px-4 text-xs uppercase tracking-wider"
                        style={{
                          fontFamily: 'var(--bsi-font-display)',
                          color: c.name === 'BSI Pro' ? 'var(--bsi-primary)' : 'var(--bsi-dust)',
                          borderBottom: c.name === 'BSI Pro' ? '2px solid var(--bsi-primary)' : '1px solid var(--border-vintage)',
                          background: c.name === 'BSI Pro' ? 'rgba(191, 87, 0, 0.06)' : 'transparent',
                        }}
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Price', render: (c: typeof COMPETITORS[0]) => <span className="font-semibold">{c.price}</span> },
                    { label: 'Park-Adjusted Metrics', render: (c: typeof COMPETITORS[0]) => c.parkAdjusted
                      ? <svg className="w-5 h-5 mx-auto" style={{ color: 'var(--bsi-primary)' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : <svg className="w-5 h-5 mx-auto" style={{ color: 'var(--bsi-dust)', opacity: 0.4 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 10h10" /></svg>
                    },
                    { label: 'Update Frequency', render: (c: typeof COMPETITORS[0]) => <span>{c.updateFreq}</span> },
                    { label: 'Mobile Experience', render: (c: typeof COMPETITORS[0]) => <span>{c.mobile}</span> },
                    { label: 'Free Access', render: (c: typeof COMPETITORS[0]) => <span>{c.free}</span> },
                  ].map((row, ri, arr) => (
                    <tr key={row.label}>
                      <td className="py-3 px-4" style={{ color: 'var(--bsi-dust)', borderBottom: ri < arr.length - 1 ? '1px solid rgba(140,98,57,0.15)' : 'none' }}>
                        {row.label}
                      </td>
                      {COMPETITORS.map((c) => (
                        <td
                          key={c.name}
                          className="py-3 px-4 text-center"
                          style={{
                            color: 'var(--bsi-bone)',
                            borderBottom: ri < arr.length - 1 ? '1px solid rgba(140,98,57,0.15)' : 'none',
                            background: c.name === 'BSI Pro' ? 'rgba(191, 87, 0, 0.06)' : 'transparent',
                          }}
                        >
                          {row.render(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Value Props */}
      <section className="surface-lifted relative" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-3">The Case</span>
            <h2
              className="mt-3 font-bold uppercase tracking-wide mb-10"
              style={{ fontFamily: 'var(--bsi-font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--bsi-bone)' }}
            >
              Why BSI?
            </h2>
          </ScrollReveal>

          <div className="space-y-0">
            {[
              {
                title: 'Park-Adjusted, Not Just Raw',
                description:
                  'A .350 average at UFCU Disch-Falk is not the same as .350 at Baum-Walker. BSI adjusts for context. Nobody else does this for college baseball — publicly, for free.',
              },
              {
                title: 'Updated Every 6 Hours',
                description:
                  'FanGraphs updates college data weekly. D1Baseball updates daily. BSI recomputes wOBA, wRC+, FIP, park factors, and conference strength every 6 hours via automated pipeline.',
              },
              {
                title: 'Built by a Fan, for Fans',
                description:
                  'Created by someone who pitched a perfect game and drove to Austin every Thanksgiving for Longhorn football. This is personal.',
              },
            ].map((item, index) => (
              <ScrollReveal key={item.title} direction="up" delay={index * 80}>
                <div className="flex gap-5 py-8" style={{ borderBottom: '1px solid rgba(140,98,57,0.15)' }}>
                  <span
                    className="text-3xl font-bold leading-none pt-1 select-none shrink-0 w-8 text-right"
                    style={{ fontFamily: 'var(--bsi-font-data)', color: 'rgba(191, 87, 0, 0.3)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3
                      className="text-lg font-bold uppercase tracking-wide mb-2"
                      style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>{item.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--surface-scoreboard)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal direction="up">
            <div className="flex justify-center mb-8">
              <div className="section-rule-thick w-12" />
            </div>
            <p className="font-serif italic text-lg leading-relaxed mb-6" style={{ color: 'var(--bsi-dust)' }}>
              Questions? Reach out anytime. I read every email.
            </p>
            <a
              href="mailto:Austin@blazesportsintel.com"
              className="inline-flex items-center gap-2 text-sm tracking-wide transition-colors"
              style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-primary)' }}
            >
              Austin@blazesportsintel.com
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8h12M9 3l5 5-5 5" />
              </svg>
            </a>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
