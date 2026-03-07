import { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Contact | Blaze Sports Intel',
  description:
    'Get in touch with Blaze Sports Intel. Questions about sports coverage, partnerships, or platform features.',
  openGraph: {
    title: 'Contact | Blaze Sports Intel',
    description: 'Get in touch with Blaze Sports Intel.',
   images: ogImage() },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
