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
    description: 'Live scores, standings, and park-adjusted analytics across five sports. No signup required.',
    audience: 'Casual fans',
    features: [
      'Live scores across MLB, NFL, NBA, NCAA',
      'Conference standings and rankings',
      'Park-adjusted wOBA, wRC+, FIP, xFIP leaderboards',
      'Expected stats (xBA, xSLG, xwOBA)',
      'Conference strength index and weekly pulse',
      'HAV-F scouting grades',
      '80+ original editorial pieces',
      'Real-time game updates every 30 seconds',
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
      'K/BB ratio and LOB% advanced metrics',
      'CSV data export for all leaderboards',
      'Player comparison tools (unlimited)',
      'Transfer portal tracking with history',
      'Priority API access',
      'Remove ads and attribution notices',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
];
