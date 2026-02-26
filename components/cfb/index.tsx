'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * CFB placeholder components — college football is under active development.
 */

interface CFBGamesListProps {
  limit?: number;
}

export function CFBGamesList({ limit = 6 }: CFBGamesListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
        <Card key={i} variant="default" padding="md" className="text-center">
          <div className="py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-surface-light rounded-full flex items-center justify-center">
              <span className="text-2xl">🏈</span>
            </div>
            <p className="text-text-muted text-sm">Game data coming soon</p>
            <Badge variant="warning" className="mt-3">
              Off-Season
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface CFBArticleListProps {
  type: 'preview' | 'recap';
  limit?: number;
}

export function CFBArticleList({ type, limit = 6 }: CFBArticleListProps) {
  const label = type === 'preview' ? 'Game Previews' : 'Game Recaps';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
        <Card key={i} variant="default" padding="md">
          <div className="py-6 text-center">
            <div className="w-10 h-10 mx-auto mb-3 bg-surface-light rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <p className="text-text-muted text-sm">{label} coming soon</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
