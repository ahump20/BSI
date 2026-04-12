import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'About | Blaze Sports Intel',
  description:
    'The coverage gap in sports media isn\u2019t an accident. BSI exists to close it \u2014 built by Austin Humphrey for the athletes, programs, and fans that bigger platforms overlook.',
  openGraph: {
    title: 'About Blaze Sports Intel',
    description:
      'The coverage gap isn\u2019t an accident. BSI exists to close it \u2014 one game, one athlete, one program at a time.',
    images: ogImage(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Blaze Sports Intel',
    description:
      'The coverage gap isn\u2019t an accident. BSI exists to close it \u2014 one game, one athlete, one program at a time.',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <div data-page="about">
      {/* Person structured data */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Austin Humphrey',
        jobTitle: 'Builder',
        worksFor: { '@type': 'Organization', name: 'Blaze Sports Intel' },
        url: 'https://blazesportsintel.com/about',
        description:
          'Builder of Blaze Sports Intel. UT Austin graduate. Advanced analytics and independent editorial across college baseball, MLB, NFL, NBA, and college football.',
        alumniOf: [
          { '@type': 'CollegeOrUniversity', name: 'University of Texas at Austin' },
          { '@type': 'CollegeOrUniversity', name: 'Full Sail University' },
        ],
        knowsAbout: [
          'Sports Analytics',
          'Sabermetrics',
          'College Baseball',
          'Sports Media',
          'Data Engineering',
        ],
        sameAs: [
          'https://austinhumphrey.com',
        ],
      }} />
      {/* Organization structured data */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Blaze Sports Intel',
        url: 'https://blazesportsintel.com',
        logo: 'https://blazesportsintel.com/images/bsi-logo.png',
        foundingDate: '2024',
        founder: {
          '@type': 'Person',
          name: 'Austin Humphrey',
        },
        description:
          'The coverage gap in sports media isn\u2019t an accident. BSI exists to close it \u2014 live scores, advanced analytics, and editorial across college baseball, MLB, NFL, NBA, and college football for every athlete, program, and fan bigger platforms overlook.',
        areaServed: 'United States',
        sameAs: [
          'https://austinhumphrey.com',
        ],
      }} />
      {children}
    </div>
  );
}
