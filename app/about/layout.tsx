import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'About | Blaze Sports Intel',
  description:
    'Founded by Austin Humphrey. Advanced analytics and independent editorial for the athletes, programs, and fans that mainstream media overlook.',
  openGraph: {
    title: 'About Blaze Sports Intel',
    description:
      'Advanced analytics and independent editorial for the athletes and fans that mainstream media overlook. Built by one person to close the coverage gap.',
    images: ogImage(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Blaze Sports Intel',
    description:
      'Advanced analytics and independent editorial for the athletes and fans that mainstream media overlook. Built by one person to close the coverage gap.',
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
          'Independent sports analytics platform. Live scores, advanced analytics, and editorial across college baseball, MLB, NFL, NBA, and college football — built for the athletes and fans that bigger platforms overlook.',
        areaServed: 'United States',
        sameAs: [
          'https://austinhumphrey.com',
        ],
      }} />
      {children}
    </div>
  );
}
