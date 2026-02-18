/**
 * Shared pricing tier definitions.
 * Single source of truth — used by both app/pricing/page.tsx and the
 * homepage PricingPreview component.
 */

export type TierId = 'free' | 'pro' | 'api' | 'embed';

export interface PricingTier {
  id: TierId;
  name: string;
  monthlyPrice: number;
  annualPrice: number | null;
  period: string;
  description: string;
  audience: string;
  features: string[];
  cta: string;
  popular: boolean;
  apiAccess: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: null,
    period: 'forever',
    description: 'Public scores, standings, and news across all leagues.',
    audience: 'Casual fans',
    features: [
      'Live scores across MLB, NFL, NBA, NCAA',
      'Standings and rankings',
      'News feeds',
      'Basic box scores',
    ],
    cta: 'Get Started',
    popular: false,
    apiAccess: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 12,
    annualPrice: 99,
    period: 'month',
    description: 'For fans, fantasy players, and amateur coaches who want the edge.',
    audience: 'Fans, fantasy players, amateur coaches',
    features: [
      'Everything in Free',
      'Real-time game updates every 30 seconds',
      'Game predictions & win probability',
      'Player comparison tools',
      'Basic analytics dashboard',
      'API key for personal use',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: true,
    apiAccess: true,
  },
  {
    id: 'embed',
    name: 'Embed License',
    monthlyPrice: 79,
    annualPrice: null,
    period: 'month',
    description: 'For publishers and fan sites embedding the BSI live widget.',
    audience: 'Publishers, fan sites, bloggers',
    features: [
      'Everything in Pro',
      'Embeddable live score widget',
      'Customizable widget themes',
      'CORS-whitelisted domains',
      'Embed-specific API key',
      'Usage analytics',
    ],
    cta: 'Get Embed Key',
    popular: false,
    apiAccess: true,
  },
  {
    id: 'api',
    name: 'Data API',
    monthlyPrice: 199,
    annualPrice: null,
    period: 'month',
    description: 'For college programs, scouts, and media who need professional-grade intel.',
    audience: 'College programs, scouts, media, analysts',
    features: [
      'Everything in Pro + Embed',
      'Advanced player analytics with AI insights',
      'Historical data access (5+ years)',
      'Season projections & Monte Carlo simulations',
      'Custom data exports (CSV, JSON)',
      'Full API access — all endpoints',
      'Priority support',
    ],
    cta: 'Get API Access',
    popular: false,
    apiAccess: true,
  },
];
