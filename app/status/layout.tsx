import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'System Status | Blaze Sports Intel',
  description: 'Real-time status of BSI services, APIs, and data pipelines.',
  openGraph: {
    title: 'System Status | Blaze Sports Intel',
    description: 'Real-time status of BSI services, APIs, and data pipelines.',
   images: ogImage() },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
