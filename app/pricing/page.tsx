'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { PRICING_TIERS, type PricingTier } from '@/lib/data/pricing-tiers';
import { trackPaywallHit } from '@/lib/analytics/tracker';

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account page and your access reverts to Free at the end of the billing period. No penalties, no hoops.',
  },
  {
    q: 'What does "park-adjusted" mean?',
    a: 'A .350 average at a hitter-friendly park like UFCU Disch-Falk is not the same as .350 at a pitcher-friendly venue. BSI adjusts every metric for the ballpark where the at-bat happened.',
  },
  {
    q: 'How often is data updated?',
    a: 'Live scores refresh every 30 seconds during games. Advanced metrics (wOBA, wRC+, FIP, park factors) recompute every 6 hours automatically.',
  },
  {
    q: 'Do I need an account for Free tier?',
    a: 'No. Free access requires zero signup. Just open the site and browse.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      alert('Couldn\'t start checkout — try again in a moment.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen grain-overlay bg-surface-scoreboard text-bsi-bone"
    >
      {/* ================================================================
          HERO — R2 stadium atmosphere behind conversion copy
          ================================================================ */}
      <section
        className="relative overflow-hidden"
        style={{ padding: 'clamp(4rem, 8vw, 7rem) 0 clamp(3rem, 6vw, 5rem)' }}
      >
        {/* R2 stadium photography — subtle atmosphere */}
        <img
          src="/api/assets/images/blaze-stadium-hero.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.12 }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(10,10,10,0.6) 0%,
              rgba(10,10,10,0.4) 40%,
              rgba(10,10,10,0.5) 70%,
              var(--surface-scoreboard) 100%
            )`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(191,87,0,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal direction="up">
            {/* Stamp + Mascot */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image
                src="/images/brand/bsi-mascot-200.png"
                alt="BSI mascot"
                width={48}
                height={48}
                className="opacity-90"
              />
              <span className="heritage-stamp">Pricing</span>
            </div>

            <h1
              className="font-bold uppercase tracking-tight leading-[0.95] mb-5"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'var(--bsi-bone)',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              }}
            >
              Free to start.{' '}
              <span
                style={{
                  color: 'var(--bsi-primary)',
                  backgroundColor: 'rgba(191,87,0,0.12)',
                  padding: '0.05em 0.3em',
                  borderRadius: '3px',
                }}
              >
                Pro
              </span>
              {' '}when you&apos;re ready.
            </h1>

            <p
              className="font-serif italic text-lg leading-relaxed max-w-xl mx-auto text-bsi-dust"
            >
              Live scores and advanced analytics, free for every fan. Pro
              unlocks exports, unlimited comparisons, and transfer portal
              tracking for the ones who go deeper.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          TIER CARDS
          ================================================================ */}
      <section className="relative" style={{ padding: 'clamp(2rem, 4vw, 3rem) 0 clamp(3rem, 6vw, 5rem)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {PRICING_TIERS.map((tier, index) => (
              <ScrollReveal key={tier.id} direction="up" delay={index * 120}>
                <TierCard
                  tier={tier}
                  loading={loading}
                  onCheckout={handleCheckout}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PURPOSE — "Built for the fans nobody built for"
          ================================================================ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) 0',
          background: 'var(--surface-scoreboard)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-3">Why This Exists</span>
            <h2
              className="mt-3 font-bold uppercase tracking-wide mb-6"
              style={{
                fontFamily: 'var(--bsi-font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--bsi-bone)',
              }}
            >
              Built for the fans{' '}
              <span className="text-bsi-primary">nobody built for.</span>
            </h2>
            <p className="text-base md:text-lg leading-[1.8] font-serif text-bsi-dust">
              The coverage gap isn&apos;t an accident. Every platform with the
              resources to close it decided the audience wasn&apos;t worth the
              investment. BSI exists to prove they were wrong &mdash; one game,
              one athlete, one program at a time.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <section
        className="relative"
        style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <span className="heritage-stamp mb-3">FAQ</span>
            <h2
              className="mt-3 font-bold uppercase tracking-wide mb-8"
              style={{
                fontFamily: 'var(--bsi-font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--bsi-bone)',
              }}
            >
              Common Questions
            </h2>
          </ScrollReveal>

          <div className="space-y-0">
            {FAQ_ITEMS.map((item, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 60}>
                <button
                  className="w-full text-left py-5 flex items-start justify-between gap-4 group"
                  style={{
                    borderBottom: '1px solid rgba(140,98,57,0.15)',
                  }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--bsi-font-display)',
                      color: openFaq === i ? 'var(--bsi-primary)' : 'var(--bsi-bone)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.q}
                  </span>
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200"
                    style={{
                      color: 'var(--bsi-dust)',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: openFaq === i ? '200px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <p
                    className="text-sm leading-relaxed font-serif pb-4 text-bsi-dust"
                  >
                    {item.a}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST FOOTER
          ================================================================ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(2.5rem, 5vw, 4rem) 0',
          background: 'var(--surface-scoreboard)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal direction="up">
            <Image
              src="/brand/blaze-roundel.png"
              alt="Blaze Intelligence"
              width={36}
              height={36}
              className="mx-auto mb-4 opacity-75 object-contain"
            />
            <p
              className="text-xs font-mono uppercase tracking-[0.15em] mb-1 text-bsi-dust"
            >
              Blaze Intelligence &middot; blazesportsintel.com
            </p>
            <p
              className="text-[11px] font-serif italic tracking-wide text-bsi-primary opacity-70"
            >
              Born to Blaze the Path Beaten Less
            </p>

            <div className="mt-8">
              <a
                href="mailto:Austin@blazesportsintel.com"
                className="inline-flex items-center gap-2 text-sm tracking-wide transition-colors hover:opacity-80"
                style={{
                  fontFamily: 'var(--bsi-font-data, var(--font-mono))',
                  color: 'var(--bsi-primary)',
                }}
              >
                Austin@blazesportsintel.com
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 8h12M9 3l5 5-5 5" />
                </svg>
              </a>
              <p
                className="text-xs font-serif italic mt-2 text-bsi-dust"
              >
                Questions? I read every email.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}

// ---------------------------------------------------------------------------
// TierCard — extracted for clarity
// ---------------------------------------------------------------------------

function TierCard({
  tier,
  loading,
  onCheckout,
}: {
  tier: PricingTier;
  loading: string | null;
  onCheckout: () => void;
}) {
  const isPro = tier.popular;

  return (
    <div
      className="heritage-card relative p-7 sm:p-8 h-full flex flex-col"
      style={{
        borderTop: isPro
          ? '3px solid var(--bsi-primary)'
          : '3px solid var(--bsi-dust)',
        boxShadow: isPro
          ? '0 0 30px rgba(191,87,0,0.1)'
          : 'none',
      }}
    >
      {/* Tier label */}
      <div className="mb-5">
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{
            fontFamily: 'var(--bsi-font-display)',
            color: isPro ? 'var(--bsi-primary)' : 'var(--bsi-dust)',
          }}
        >
          {tier.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-1">
        {tier.price === 0 ? (
          <span
            className="text-5xl font-bold leading-none"
            style={{
              fontFamily: 'var(--bsi-font-display-hero)',
              color: 'var(--bsi-bone)',
            }}
          >
            $0
          </span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className="text-5xl font-bold leading-none"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                color: 'var(--bsi-bone)',
              }}
            >
              ${tier.price}
            </span>
            <span
              className="text-sm text-bsi-dust"
            >
              /{tier.period}
            </span>
          </div>
        )}
      </div>

      {/* Subtext */}
      <p
        className="text-[11px] tracking-wide mb-6"
        style={{
          fontFamily: 'var(--bsi-font-data, var(--font-mono))',
          color: 'var(--bsi-dust)',
          opacity: 0.7,
        }}
      >
        {tier.price === 0 ? 'forever' : 'cancel anytime'}
      </p>

      {/* Description */}
      <p
        className="text-sm leading-relaxed font-serif mb-6 text-bsi-dust"
      >
        {tier.description}
      </p>

      {/* Features */}
      <ul className="space-y-2.5 mb-8 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: isPro ? 'var(--bsi-primary)' : 'var(--bsi-dust)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span
              className="text-sm font-serif text-bsi-bone"
              style={{ opacity: 0.9 }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto">
        {tier.directLink ? (
          <Link
            href={tier.directLink}
            className="btn-heritage block text-center px-6 py-3"
          >
            {tier.cta}
          </Link>
        ) : (
          <button
            className="btn-heritage-fill w-full px-6 py-3"
            onClick={onCheckout}
            disabled={loading !== null}
          >
            {loading === tier.id ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
                </svg>
                Processing...
              </span>
            ) : (
              tier.cta
            )}
          </button>
        )}
      </div>
    </div>
  );
}
