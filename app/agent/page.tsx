import type { Metadata } from 'next';
import { AgentChat } from './AgentChat';

export const metadata: Metadata = {
  title: 'Baseball Agent | Blaze Sports Intel',
  description:
    'AI-powered college baseball analyst. Ask about scores, standings, rankings, team stats, and advanced sabermetrics — all backed by live BSI data.',
};

export default function AgentPage() {
  return <AgentChat />;
}
