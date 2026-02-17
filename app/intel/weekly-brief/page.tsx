import type { Metadata } from 'next';
import { WeeklyBriefClient } from './WeeklyBriefClient';

export const metadata: Metadata = {
  title: 'Weekly Intel Brief | BSI',
  description: 'BSI weekly content intelligence brief — decisions, priorities, and editorial operating system.',
};

export default function WeeklyBriefPage() {
  return <WeeklyBriefClient />;
}
