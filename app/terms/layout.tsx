import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Blaze Sports Intel',
  description: 'Terms of service for using Blaze Sports Intel.',
  openGraph: {
    title: 'Terms of Service | Blaze Sports Intel',
    description: 'Terms of service for using Blaze Sports Intel.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
