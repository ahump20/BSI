import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Football Transfer Portal | Blaze Sports Intel',
  description: 'Track college football transfer portal entries with player profiles, stats, star ratings, and destination schools.',
  alternates: { canonical: '/cfb/transfer-portal' },
  openGraph: {
    title: 'College Football Transfer Portal | Blaze Sports Intel',
    description: 'CFB transfer portal tracker with player profiles.',
  },
};

export default function CFBTransferPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
