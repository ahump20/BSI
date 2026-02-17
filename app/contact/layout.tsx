import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact | Blaze Sports Intel',
  description: 'Contact Blaze Sports Intel for partnerships, coaching access, scouting workflows, and platform support.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
