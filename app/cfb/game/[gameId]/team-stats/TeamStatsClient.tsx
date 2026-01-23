'use client';

import { useGameData } from '../GameLayoutClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function TeamStatsClient() {
  const { game } = useGameData();
  if (!game) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary text-center py-8">Team statistics coming soon.</p>
      </CardContent>
    </Card>
  );
}
