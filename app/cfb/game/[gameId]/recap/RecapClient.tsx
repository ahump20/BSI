'use client';

import { useGameData } from '../GameLayoutClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function RecapClient() {
  const { game } = useGameData();
  if (!game) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Recap</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary text-center py-8">Game recap coming soon.</p>
      </CardContent>
    </Card>
  );
}
