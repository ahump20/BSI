import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Blaze Sports Intel',
  description:
    'Get in touch with Blaze Sports Intel. Questions about college baseball coverage, partnerships, or just want to talk baseball.',
  openGraph: {
    title: 'Contact | Blaze Sports Intel',
    description: 'Get in touch with Blaze Sports Intel.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
