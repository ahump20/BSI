import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status | Blaze Sports Intel',
  description: 'Real-time status of BSI services, APIs, and data pipelines.',
  openGraph: {
    title: 'System Status | Blaze Sports Intel',
    description: 'Real-time status of BSI services, APIs, and data pipelines.',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
