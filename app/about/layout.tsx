import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | BSI',
  description: 'The story behind Blaze Sports Intel.',
  openGraph: { title: 'About | BSI', description: 'The story behind Blaze Sports Intel.' },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <div data-page="about">{children}</div>;
}
