'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { HeroVideo } from '@/components/hero/HeroVideo';

type PaidTier = 'pro' | 'enterprise';

type PricingTier = {
  id: 'free' | PaidTier;
  name: string;
  priceLabel: string;
  description: string;
  audience: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0/mo',
    description: 'Live scores and baseline coverage for daily tracking.',
    audience: 'Fans and casual analysts',
    features: [
      'Basic live scores across MLB, NFL, NBA, and NCAA coverage',
      'Top-line standings snapshots',
      'Daily highlights and news stream',
      'One-click access to team pages',
    ],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$29/mo',
    description: 'Full analytics with live context for coaches, scouts, and power users.',
    audience: 'High-volume analysts and program staff',
    features: [
      'Everything in Free',
      'Advanced analytics dashboards with matchup context',
      'API access for internal workflows and exports',
      'Player comparison, trend tracking, and watchlists',
      '14-day trial included',
    ],
    cta: 'Start 14-Day Trial',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$199/mo',
    description: 'Custom intelligence workflows for organizations and media teams.',
    audience: 'Scouting departments and enterprise operations',
    features: [
      'Everything in Pro',
      'Custom dashboards for coaches and scouts',
      'NIL valuation tooling and organizational reporting',
      'Priority support with implementation guidance',
      'Role-based collaboration for multi-user teams',
    ],
    cta: 'Launch Enterprise',
  },
];

const valueProps = [
  {
    title: 'Built For Coaches',
    detail:
      'Translate game data into weekly prep: matchup splits, role trends, and actionable roster decisions.',
  },
  {
    title: 'Built For Scouts',
    detail:
      'Track prospects across conferences with searchable historical context and export-ready data.',
  },
  {
    title: 'Built For Operators',
    detail:
      'Consolidate scores, standings, rankings, and NIL intel in one platform instead of stitching five tools together.',
  },
];

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);

  const handleCheckout = async (tier: PaidTier) => {
    setLoadingTier(tier);

    try {
      const response = await fetch('/api/stripe/create-embedded-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const payload = (await response.json()) as { error?: string; clientSecret?: string };
      if (payload.error) {
        window.alert(payload.error);
        return;
      }

      if (payload.clientSecret) {
        window.location.href = `/checkout?client_secret=${encodeURIComponent(payload.clientSecret)}`;
      } else {
        window.location.href = '/checkout';
      }
    } catch {
      window.alert('Unable to start checkout right now. Please retry.');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-28 relative overflow-hidden">
          <HeroVideo />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(13,13,18,0.92) 0%, rgba(13,13,18,0.84) 45%, rgba(13,13,18,0.95) 100%)',
            }}
          />

          <Container center className="relative z-10">
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Plans For Every Stage
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                Pricing That <span className="text-gradient-blaze">Scales With You</span>
              </h1>
              <p className="text-text-secondary text-center max-w-3xl mx-auto mb-6">
                Start free for core scores, upgrade to Pro for full analytics and API access, or run
                Enterprise for custom dashboards and NIL tooling.
              </p>
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-lg bg-burnt-orange px-6 py-3 font-semibold text-white transition-colors hover:bg-ember"
              >
                Start Your 14-Day Trial
              </Link>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {tiers.map((tier, index) => (
                <ScrollReveal key={tier.id} direction="up" delay={index * 80}>
                  <Card
                    padding="lg"
                    className={`h-full flex flex-col ${tier.featured ? 'border-burnt-orange border-2' : ''}`}
                  >
                    <div className="mb-6">
                      {tier.featured && <Badge variant="accent" className="mb-3">Most Popular</Badge>}
                      <h2 className="font-display text-2xl font-bold text-white mb-1">{tier.name}</h2>
                      <p className="text-burnt-orange font-semibold">{tier.priceLabel}</p>
                      <p className="text-text-tertiary mt-2 text-sm">{tier.description}</p>
                      <p className="text-xs text-text-tertiary mt-2 uppercase tracking-wider">{tier.audience}</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-text-secondary text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.id === 'free' ? (
                      <Link href="/dashboard" className="w-full">
                        <Button variant="secondary" size="lg" className="w-full">
                          {tier.cta}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant={tier.featured ? 'primary' : 'secondary'}
                        size="lg"
                        className="w-full"
                        onClick={() => handleCheckout(tier.id)}
                        disabled={loadingTier !== null}
                      >
                        {loadingTier === tier.id ? 'Loading...' : tier.cta}
                      </Button>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-3xl font-bold text-center uppercase tracking-display mb-10">
                Why Teams Choose <span className="text-gradient-blaze">BSI</span>
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {valueProps.map((item, index) => (
                <ScrollReveal key={item.title} direction="up" delay={index * 80}>
                  <Card padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-text-tertiary">{item.detail}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
