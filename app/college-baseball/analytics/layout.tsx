import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | College Baseball | Blaze Sports Intel',
  description:
    'College baseball analytics tools — advanced metric breakdowns, performance modeling, and data-driven scouting.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
