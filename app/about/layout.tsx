import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'About | Blaze Sports Intel',
  description: 'Read the Blaze Sports Intel origin story and platform mission behind data-first coverage for MLB, NFL, NBA, and NCAA sports.',
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
