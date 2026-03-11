import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Privacy Policy | Blaze Sports Intel',
  description: 'How Blaze Sports Intel collects, uses, and protects your data.',
  openGraph: {
    title: 'Privacy Policy | Blaze Sports Intel',
    description: 'How Blaze Sports Intel collects, uses, and protects your data.',
   images: ogImage() },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
