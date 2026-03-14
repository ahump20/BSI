import type { Metadata } from 'next';
import TexasMediaClient from './TexasMediaClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns Media Archive | BSI',
  description:
    'Video highlights, news articles, and social content for Texas Longhorns baseball — curated and live-aggregated.',
};

export default function TexasMediaPage() {
  return <TexasMediaClient />;
}
