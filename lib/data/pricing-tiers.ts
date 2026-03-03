/**
 * Shared pricing tier definitions.
 * Single source of truth — used by both app/pricing/page.tsx and the
 * homepage PricingPreview component.
 *
 * Three tiers: Free (no signup), Pro ($12/mo), Enterprise removed until
 * features are production-ready.
 */

export interface PricingTier {
  id: 'free' | 'pro';
  name: string;
  price: number;
  period: string;
  description: string;
  audience: string;
  features: string[];
  cta: string;
  popular: boolean;
  /** If true, CTA links directly instead of triggering checkout */
  directLink?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'Everything ESPN gives you, but faster and mobile-first. No signup required.',
    audience: 'Casual fans',
    features: [
      'Live scores across MLB, NFL, NBA, NCAA',
      'Conference standings and rankings',
      'Complete box scores with batting/pitching lines',
      'Real-time game updates every 30 seconds',
      'College baseball news and editorial',
    ],
    cta: 'Start Browsing',
    popular: false,
    directLink: '/college-baseball',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    period: 'month',
    description: 'Park-adjusted sabermetrics, conference strength, player comparison, and transfer portal tracking. The analytics depth D1Baseball charges $140/year for.',
    audience: 'Serious fans, analysts, college coaches',
    features: [
      'Everything in Free',
      'Park-adjusted wOBA, wRC+, OPS+',
      'FIP and ERA- for pitchers',
      'Park factors for every D1 venue',
      'Conference strength index',
      'Player comparison tools',
      'Transfer portal tracking',
      'Daily-updated leaderboards',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
];
