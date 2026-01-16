import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Blaze Sports Intel',
  description:
    'Get in touch with Blaze Sports Intel. Questions about sports coverage, partnerships, or platform features.',
  openGraph: {
    title: 'Contact | Blaze Sports Intel',
    description: 'Get in touch with Blaze Sports Intel.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
