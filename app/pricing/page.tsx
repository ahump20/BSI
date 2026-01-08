'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const tiers = [
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For fans, fantasy players, and amateur coaches who want the edge.',
    features: [
      'Live scores across MLB, NFL, NBA, NCAA',
      'Real-time game updates every 30 seconds',
      'Complete box scores with batting/pitching lines',
      'Game predictions & win probability',
      'Player comparison tools',
      'Conference standings and rankings',
      'Basic analytics dashboard',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For college programs, scouts, and media who need professional-grade intel.',
    features: [
      'Everything in Pro',
      'Advanced player analytics with AI insights',
      'Historical data access (5+ years)',
      'Season projections & Monte Carlo simulations',
      'Custom data exports (CSV, JSON)',
      'API access for integrations',
      'Priority support',
      'Team collaboration tools',
      'Custom dashboards',
    ],
    cta: 'Get Started',
    popular: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (tier: 'pro' | 'enterprise') => {
    setLoading(tier);
    try {
      const response = await fetch('/api/stripe/create-embedded-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
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
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Simple, Transparent Pricing
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                Choose Your <span className="text-gradient-blaze">Plan</span>
              </h1>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Professional sports intelligence at every level. Start with a 14-day free trial on
                Pro, or go straight to Enterprise for the full toolkit.
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
                        <Badge variant="accent">Most Popular</Badge>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h2 className="font-display text-2xl font-bold text-white mb-2">
                        {tier.name}
                      </h2>
                      <p className="text-text-tertiary text-sm">{tier.description}</p>
                    </div>

                    <div className="text-center mb-8">
                      <span className="font-display text-5xl font-bold text-burnt-orange">
                        ${tier.price}
                      </span>
                      <span className="text-text-tertiary">/{tier.period}</span>
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

                    <Button
                      variant={tier.popular ? 'primary' : 'secondary'}
                      size="lg"
                      className="w-full"
                      onClick={() => handleCheckout(tier.id as 'pro' | 'enterprise')}
                      disabled={loading !== null}
                    >
                      {loading === tier.id ? 'Loading...' : tier.cta}
                    </Button>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* FAQ / Value Props */}
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
                    'MLB, NFL, NCAA—all in one platform. Live scores, standings, and analytics across every league we cover. No switching between apps.',
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
