'use client';

import { useGameData } from '../GameLayoutClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function PlayByPlayClient() {
  const { game } = useGameData();
  if (!game) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Play-by-Play</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary text-center py-8">Play-by-play data coming soon.</p>
      </CardContent>
    </Card>
  );
}
