/**
 * Shared pricing tier definitions.
 * Single source of truth — used by both app/pricing/page.tsx and the
 * homepage PricingPreview component.
 */

export interface PricingTier {
  id: 'pro' | 'enterprise';
  name: string;
  price: number;
  period: string;
  description: string;
  audience: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    period: 'month',
    description: 'For fans and analysts who want roster intelligence and real-time college baseball data.',
    audience: 'Fans, analysts, fantasy players',
    features: [
      'Live scores across MLB, NFL, NBA, NCAA',
      'Real-time game updates every 30 seconds',
      'Transfer portal tracking',
      'Player pro-projection comps',
      'Complete box scores with batting/pitching lines',
      'Conference standings and rankings',
      'Player comparison tools',
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
    description: 'For programs, scouts, and agents who need roster-market intelligence at depth.',
    audience: 'College programs, scouts, agents',
    features: [
      'Everything in Pro',
      'Roster construction optimizer',
      'NIL market intelligence',
      'Advanced player analytics with AI insights',
      'Historical data access (5+ years)',
      'Season projections & Monte Carlo simulations',
      'Custom data exports (CSV, JSON)',
      'API access for integrations',
      'Priority support',
    ],
    cta: 'Get Started',
    popular: true,
  },
];
