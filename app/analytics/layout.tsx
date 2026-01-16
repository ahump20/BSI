import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Hub | Blaze Sports Intel',
  description:
    'Professional sports analytics tools including win probability, Pythagorean expectations, player comparisons, and predictive models for MLB, NFL, and NCAA.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
