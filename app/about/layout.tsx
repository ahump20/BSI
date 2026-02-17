import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'About | BSI',
  description: 'The story behind Blaze Sports Intel.',
  openGraph: { title: 'About | BSI', description: 'The story behind Blaze Sports Intel.' },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <div data-page="about">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Austin Humphrey',
        jobTitle: 'Founder',
        worksFor: { '@type': 'Organization', name: 'Blaze Sports Intel' },
        url: 'https://blazesportsintel.com/about',
      }} />
      {children}
    </div>
  );
}
