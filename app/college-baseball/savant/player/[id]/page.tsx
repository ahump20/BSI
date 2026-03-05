import type { Metadata } from 'next';
import SavantPlayerClient from './SavantPlayerClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const title = `${name} | College Baseball Savant Profile | Blaze Sports Intel`;
  const description = `${name} — advanced sabermetric profile with wOBA, FIP, wRC+, percentile bars, and park-adjusted metrics. College Baseball Savant by Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/college-baseball/savant/player/${id}` },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SavantPlayerPage({ params }: PageProps) {
  const { id: _id } = await params;
  return <SavantPlayerClient />;
}
