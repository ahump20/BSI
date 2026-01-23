'use client';

import { useGameData } from '../GameLayoutClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function BoxScoreClient() {
  const { game } = useGameData();
  if (!game) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Box Score</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary text-center py-8">Detailed box score coming soon.</p>
      </CardContent>
    </Card>
  );
}
