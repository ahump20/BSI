import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { SportHubJsonLd } from '@/components/seo/SportHubJsonLd';

export const metadata: Metadata = {
  title: 'College Baseball | Blaze Sports Intel',
  description:
    'Live college baseball scores, standings, rankings, teams, players, and advanced sabermetrics from Blaze Sports Intel.',
  alternates: { canonical: '/college-baseball' },
  openGraph: {
    title: 'College Baseball | Blaze Sports Intel',
    description:
      'Live college baseball scores, standings, rankings, teams, players, and advanced sabermetrics from Blaze Sports Intel.',
    type: 'website',
    url: 'https://blazesportsintel.com/college-baseball',
    siteName: 'Blaze Sports Intel',
    images: ogImage('/images/og-college-baseball.png', 'BSI College Baseball'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball | Blaze Sports Intel',
    description:
      'Live college baseball scores, standings, rankings, teams, players, and advanced sabermetrics from Blaze Sports Intel.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function CollegeBaseballLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SportHubJsonLd
        sport="College Baseball"
        url="/college-baseball"
        description="Live college baseball scores, standings, rankings, teams, players, and advanced sabermetrics from Blaze Sports Intel."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'College Baseball', url: '/college-baseball' },
        ]}
      />
      {children}
    </>
  );
}
