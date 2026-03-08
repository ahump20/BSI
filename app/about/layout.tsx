import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'About Blaze Sports Intel | Independent College Baseball & Pro Sports Analytics',
  description:
    'Founded by Austin Humphrey. Live scores, advanced sabermetrics, and independent editorial for college baseball, MLB, NFL, NBA, and college football. One platform. Every game.',
  openGraph: {
    title: 'About Blaze Sports Intel',
    description:
      'Live scores, advanced sabermetrics, and independent editorial across 5 sports. Built by one person for the fans mainstream media forgot.',
    images: ogImage(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Blaze Sports Intel',
    description:
      'Live scores, advanced sabermetrics, and independent editorial across 5 sports. Built by one person for the fans mainstream media forgot.',
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
        jobTitle: 'Founder & CEO',
        worksFor: { '@type': 'Organization', name: 'Blaze Sports Intel' },
        url: 'https://blazesportsintel.com/about',
        description:
          'Founder of Blaze Sports Intel. UT Austin graduate. Covers college baseball, MLB, NFL, NBA, and college football with advanced sabermetrics and independent editorial.',
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
          'Independent sports analytics platform covering college baseball, MLB, NFL, NBA, and college football with live scores, advanced sabermetrics, and original editorial.',
        areaServed: 'United States',
        sameAs: [
          'https://austinhumphrey.com',
        ],
      }} />
      {children}
    </div>
  );
}
