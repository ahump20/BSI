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
    description: 'For fans, fantasy players, and amateur coaches who want the edge.',
    audience: 'Fans, fantasy players, amateur coaches',
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
    audience: 'College programs, scouts, media',
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
