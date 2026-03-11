import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Terms of Service | Blaze Sports Intel',
  description: 'Terms of service for using Blaze Sports Intel.',
  openGraph: {
    title: 'Terms of Service | Blaze Sports Intel',
    description: 'Terms of service for using Blaze Sports Intel.',
   images: ogImage() },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
