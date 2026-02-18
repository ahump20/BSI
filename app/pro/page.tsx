'use client';

/**
 * /pro — BSI Subscription Page
 *
 * Conversion-focused page using direct Stripe Payment Links.
 * No embedded checkout — clicking a CTA redirects to Stripe's hosted page.
 *
 * Payment Links (live):
 *   Pro monthly  → https://buy.stripe.com/aFa6oI2JW0QWgc95Jv2Fa02
 *   Pro annual   → https://buy.stripe.com/14AdRaesE1V0gc97RD2Fa03
 *   Data API     → https://buy.stripe.com/14A3cw1FS7fkaRPdbX2Fa04
 *   Embed        → https://buy.stripe.com/aFadRa84g0QW8JH0pb2Fa05
 *
 * After payment, Stripe redirects to /pro/success?session_id={CHECKOUT_SESSION_ID}
 * Configure this in Stripe Dashboard → Payment Links → Confirmation page.
 */

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ---------------------------------------------------------------------------
// Payment Links — public URLs, not secrets
// ---------------------------------------------------------------------------

const LINKS = {
  proMonthly: 'https://buy.stripe.com/aFa6oI2JW0QWgc95Jv2Fa02',
  proAnnual: 'https://buy.stripe.com/14AdRaesE1V0gc97RD2Fa03',
  dataApi: 'https://buy.stripe.com/14A3cw1FS7fkaRPdbX2Fa04',
  embed: 'https://buy.stripe.com/aFadRa84g0QW8JH0pb2Fa05',
} as const;

// ---------------------------------------------------------------------------
// Feature lists
// ---------------------------------------------------------------------------

const FREE_FEATURES = [
  'Live scores: MLB, NFL, NBA, NCAA',
  'Basic standings & schedules',
  'Public rankings & news',
  'Game summaries',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Real-time win probability',
  'Pitch-level data for college baseball',
  'Leverage scores & situation analysis',
  'Historical matchup data',
  'Game predictions with confidence %',
  'Player comparison tools',
  'Priority data refresh (15s)',
];

const API_FEATURES = [
  'Everything in Pro',
  'Full REST API access',
  'Historical database (5+ years)',
  'CSV & JSON data exports',
  'Pitcher tracking: velocity, movement, counts',
  'Monte Carlo season projections',
  'Embed license included',
  'Direct support from Austin',
];

// ---------------------------------------------------------------------------
// Tier card component
// ---------------------------------------------------------------------------

interface TierCardProps {
  name: string;
  price: string;
  subprice?: string;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

function TierCard({
  name,
  price,
  subprice,
  badge,
  features,
  cta,
  href,
  highlighted = false,
}: TierCardProps) {
  return (
    <Card
      padding="lg"
      className={`relative h-full flex flex-col ${
        highlighted ? 'border-burnt-orange border-2' : ''
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="accent">{badge}</Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-2">
          {name}
        </h2>
      </div>

      <div className="text-center mb-8">
        <span className="font-display text-5xl font-bold text-burnt-orange">
          {price}
        </span>
        {subprice && (
          <p className="text-text-tertiary text-sm mt-1">{subprice}</p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
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

      {href === '' ? (
        <Button variant="secondary" size="lg" className="w-full" disabled>
          {cta}
        </Button>
      ) : (
        <a href={href} className="block">
          <Button
            variant={highlighted ? 'primary' : 'secondary'}
            size="lg"
            className="w-full"
          >
            {cta}
          </Button>
        </a>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="pt-28">
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Intelligence-Grade Access
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
                Pick Your <span className="text-gradient-blaze">Plan</span>
              </h1>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                D1Baseball runs $1–5M ARR covering college baseball with a 2005-era product.
                BSI covers it live, with AI, at $12/month.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Annual/monthly toggle */}
        <Section padding="sm" background="charcoal">
          <Container center>
            <div className="flex items-center gap-4 justify-center">
              <span
                className={`text-sm font-medium transition-colors ${
                  !annual ? 'text-white' : 'text-text-tertiary'
                }`}
              >
                Monthly
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                onClick={() => setAnnual((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 focus:ring-offset-charcoal ${
                  annual ? 'bg-burnt-orange' : 'bg-surface-raised'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    annual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors ${
                  annual ? 'text-white' : 'text-text-tertiary'
                }`}
              >
                Annual{' '}
                <span className="text-burnt-orange text-xs font-bold ml-1">
                  Save 31%
                </span>
              </span>
            </div>
          </Container>
        </Section>

        {/* Tier cards */}
        <Section padding="lg" background="charcoal">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <ScrollReveal direction="up" delay={0}>
                <TierCard
                  name="Free"
                  price="$0"
                  subprice="forever"
                  features={FREE_FEATURES}
                  cta="Browse the site"
                  href="/"
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <TierCard
                  name="Pro"
                  price={annual ? '$8.25/mo' : '$12/mo'}
                  subprice={
                    annual
                      ? 'billed $99/year — save $45'
                      : 'billed monthly, cancel anytime'
                  }
                  badge="Most Popular"
                  features={PRO_FEATURES}
                  cta={annual ? 'Get Pro — $99/yr' : 'Get Pro — $12/mo'}
                  href={annual ? LINKS.proAnnual : LINKS.proMonthly}
                  highlighted
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <TierCard
                  name="Data API"
                  price="$199/mo"
                  subprice="for scouts, analysts & media"
                  features={API_FEATURES}
                  cta="Get API Access"
                  href={LINKS.dataApi}
                />
              </ScrollReveal>
            </div>

            {/* Embed license callout */}
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-8 max-w-5xl mx-auto">
                <Card padding="lg" className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">
                      Embed License{' '}
                      <span className="text-burnt-orange">$79/mo</span>
                    </h3>
                    <p className="text-text-secondary text-sm max-w-lg">
                      License the BSI Live Game Widget for your sports site or fan publication.
                      Drop one script tag — get a live, branded scoreboard that updates every 15 seconds.
                    </p>
                  </div>
                  <a href={LINKS.embed} className="flex-shrink-0">
                    <Button variant="secondary" size="lg">
                      Get Embed License
                    </Button>
                  </a>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* B2B callout */}
        <Section padding="lg">
          <Container center>
            <ScrollReveal direction="up">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mb-4">
                  Scouts & Programs
                </h2>
                <p className="text-text-secondary mb-6">
                  We offer 30-day free trials for college programs and MLB scouting departments.
                  Pitcher tracking data for Texas, LSU, Arkansas, Vanderbilt — pitch-by-pitch, live.
                  Nobody else has this.
                </p>
                <a
                  href="mailto:Austin@BlazeSportsIntel.com?subject=BSI%20Data%20API%20Trial"
                  className="text-burnt-orange hover:text-ember transition-colors font-semibold"
                >
                  Austin@BlazeSportsIntel.com
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
