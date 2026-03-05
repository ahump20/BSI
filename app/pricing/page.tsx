'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

  // Fire paywall_hit when user sees pricing — D1 tracks who hit the gate
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
      });

      const data = (await response.json()) as { error?: string; clientSecret?: string };

      if (data.error) {
        alert(data.error);
        return;
      }

      // Redirect to checkout
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
    <>
      <div>
        {/* Hero */}
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          {/* Ambient video background */}
          <HeroVideo />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.8) 50%, rgba(13,13,13,0.95) 100%)',
            }}
          />

          <Container center className="relative z-10">
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Simple, Transparent Pricing
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                Free to Start. <span className="text-gradient-blaze">Pro</span> When You&apos;re Ready.
              </h1>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Scores, standings, and box scores are free — no signup, no paywall. Pro unlocks
                park-adjusted sabermetrics, conference strength, and the full analytical depth.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Pricing Cards */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {tiers.map((tier, index) => (
                <ScrollReveal key={tier.id} direction="up" delay={index * 100}>
                  <Card
                    padding="lg"
                    className={`relative h-full ${
                      tier.popular ? 'border-burnt-orange border-2' : ''
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="accent">Best Value</Badge>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                        {tier.name}
                      </h2>
                      <p className="text-text-tertiary text-sm">{tier.description}</p>
                    </div>

                    <div className="text-center mb-8">
                      {tier.price === 0 ? (
                        <span className="font-display text-5xl font-bold text-burnt-orange">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="font-display text-5xl font-bold text-burnt-orange">
                            ${tier.price}
                          </span>
                          <span className="text-text-tertiary">/{tier.period}</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-text-secondary text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.directLink ? (
                      <Link href={tier.directLink} className="block">
                        <Button variant="secondary" size="lg" className="w-full">
                          {tier.cta}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={loading !== null}
                      >
                        {loading === tier.id ? 'Loading...' : tier.cta}
                      </Button>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Competitive Comparison */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-3xl font-bold text-center uppercase tracking-display mb-4">
                How BSI <span className="text-gradient-blaze">Compares</span>
              </h2>
              <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
                College baseball analytics options, side by side.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full max-w-3xl mx-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-display uppercase tracking-wider text-text-muted text-xs" />
                      {COMPETITORS.map((c) => (
                        <th
                          key={c.name}
                          className={`text-center py-3 px-4 font-display uppercase tracking-wider text-xs ${
                            c.name === 'BSI Pro' ? 'text-burnt-orange' : 'text-text-muted'
                          }`}
                        >
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text-secondary">Price</td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-3 px-4 text-center text-text-primary font-semibold">{c.price}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text-secondary">Park-Adjusted Metrics</td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-3 px-4 text-center">
                          {c.parkAdjusted ? (
                            <span className="text-green-400 font-bold">Yes</span>
                          ) : (
                            <span className="text-text-muted">No</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text-secondary">Update Frequency</td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-3 px-4 text-center text-text-primary">{c.updateFreq}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text-secondary">Mobile Experience</td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-3 px-4 text-center text-text-primary">{c.mobile}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-text-secondary">Free Access</td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-3 px-4 text-center text-text-primary">{c.free}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Value Props */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-3xl font-bold text-center uppercase tracking-display mb-12">
                Why <span className="text-gradient-blaze">BSI</span>?
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <ScrollReveal key={item.title} direction="up" delay={index * 100}>
                  <Card padding="lg" className="text-center h-full">
                    <h3 className="font-semibold text-text-primary text-lg mb-3">{item.title}</h3>
                    <p className="text-text-tertiary text-sm">{item.description}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg">
          <Container center>
            <ScrollReveal direction="up">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mb-4">
                  Questions?
                </h2>
                <p className="text-text-secondary mb-6">Reach out anytime. I read every email.</p>
                <a
                  href="mailto:Austin@blazesportsintel.com"
                  className="text-burnt-orange hover:text-ember transition-colors font-semibold"
                >
                  Austin@blazesportsintel.com
                </a>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
