'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { Footer } from '@/components/layout-ds/Footer';
import { PRICING_TIERS, type TierId } from '@/lib/data/pricing-tiers';

const HeroVideo = dynamic(
  () => import('@/components/hero/HeroVideo').then((mod) => ({ default: mod.HeroVideo })),
  { ssr: false }
);

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  const handleCheckout = async (tierId: TierId) => {
    if (tierId === 'free') return;
    setLoading(tierId);
    try {
      const response = await fetch('/api/stripe/create-embedded-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, interval: billingInterval }),
      });

      const data = (await response.json()) as { error?: string; clientSecret?: string };

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.clientSecret) {
        window.location.href = `/checkout?client_secret=${data.clientSecret}`;
      }
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="pt-28 relative overflow-hidden">
          <HeroVideo />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(13,13,18,0.92) 0%, rgba(13,13,18,0.8) 50%, rgba(13,13,18,0.95) 100%)',
            }}
          />

          <Container center className="relative z-10">
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Simple, Transparent Pricing
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                Choose Your <span className="text-gradient-blaze">Plan</span>
              </h1>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Professional sports intelligence at every level. Start free, upgrade when you need
                the edge.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Billing Toggle + Pricing Cards */}
        <Section padding="lg" background="charcoal">
          <Container>
            {/* Monthly/Annual toggle */}
            <div className="flex justify-center mb-10">
              <ToggleGroup
                value={billingInterval}
                onValueChange={setBillingInterval}
                options={[
                  { value: 'monthly' as const, label: 'Monthly' },
                  { value: 'annual' as const, label: 'Annual (Save 31%)' },
                ]}
              />
            </div>

            {/* 4-tier grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {PRICING_TIERS.map((tier, index) => {
                const displayPrice =
                  tier.id === 'pro' && billingInterval === 'annual'
                    ? tier.annualPrice ?? tier.monthlyPrice
                    : tier.monthlyPrice;
                const displayPeriod =
                  tier.id === 'pro' && billingInterval === 'annual' ? 'year' : tier.period;

                return (
                  <ScrollReveal key={tier.id} direction="up" delay={index * 75}>
                    <Card
                      padding="lg"
                      className={`relative h-full flex flex-col ${
                        tier.popular ? 'border-burnt-orange border-2' : ''
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge variant="accent">Most Popular</Badge>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h2 className="font-display text-xl font-bold text-white mb-1">
                          {tier.name}
                        </h2>
                        <p className="text-text-tertiary text-xs">{tier.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        {tier.monthlyPrice === 0 ? (
                          <span className="font-display text-4xl font-bold text-burnt-orange">
                            Free
                          </span>
                        ) : (
                          <>
                            <span className="font-display text-4xl font-bold text-burnt-orange">
                              ${displayPrice}
                            </span>
                            <span className="text-text-tertiary text-sm">/{displayPeriod}</span>
                          </>
                        )}
                      </div>

                      <ul className="space-y-2.5 mb-6 flex-1">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-success flex-shrink-0 mt-0.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-text-secondary text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {tier.id === 'free' ? (
                        <Link href="/">
                          <Button variant="secondary" size="lg" className="w-full">
                            {tier.cta}
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant={tier.popular ? 'primary' : 'secondary'}
                          size="lg"
                          className="w-full"
                          onClick={() => handleCheckout(tier.id)}
                          disabled={loading !== null}
                        >
                          {loading === tier.id ? 'Loading...' : tier.cta}
                        </Button>
                      )}
                    </Card>
                  </ScrollReveal>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* Value Props */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-3xl font-bold text-center uppercase tracking-display mb-12">
                Why <span className="text-gradient-blaze">Blaze Sports Intel</span>?
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Real Data, Real Sources',
                  description:
                    'We pull from official league APIs—MLB, NFL, NBA, NCAA. No scraped garbage, no guesswork.',
                },
                {
                  title: 'Multi-Sport Coverage',
                  description:
                    'MLB, NFL, NCAA—all in one platform. Live scores, standings, and analytics across every league we cover.',
                },
                {
                  title: 'Built by a Fan, for Fans',
                  description:
                    'Created by someone who pitched a perfect game and drove to Austin every Thanksgiving for Longhorn football. This is personal.',
                },
              ].map((item, index) => (
                <ScrollReveal key={item.title} direction="up" delay={index * 100}>
                  <Card padding="lg" className="text-center h-full">
                    <h3 className="font-semibold text-white text-lg mb-3">{item.title}</h3>
                    <p className="text-text-tertiary text-sm">{item.description}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg" background="charcoal">
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
      </main>

      <Footer />
    </>
  );
}
