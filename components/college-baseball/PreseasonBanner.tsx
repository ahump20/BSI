'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';

interface PreseasonBannerProps {
  teamId: string;
}

export function PreseasonBanner({ teamId }: PreseasonBannerProps) {
  const data = preseason2026[teamId];
  if (!data) return null;

  const tierLabel = getTierLabel(data.tier);

  return (
    <Card
      variant="default"
      padding="lg"
      className={
        data.tier === 'elite'
          ? 'border-burnt-orange/40 bg-gradient-to-r from-burnt-orange/10 to-transparent'
          : 'border-border'
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-burnt-orange">#{data.rank}</span>
          <div>
            <span className="text-text-primary font-semibold text-sm">Preseason Power 25</span>
            <div className="text-text-muted text-xs">BSI 2026 Rankings</div>
          </div>
        </div>
        <Badge variant={data.tier === 'elite' ? 'primary' : 'secondary'}>
          {tierLabel}
        </Badge>
      </div>

      <div className="text-text-muted text-sm mb-3">
        2025: {data.record2025} | {data.postseason2025}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {data.keyPlayers.map((player) => (
          <span
            key={player}
            className="text-xs bg-surface-light px-2 py-1 rounded text-text-muted"
          >
            {player}
          </span>
        ))}
      </div>

      <p className="text-text-muted text-sm leading-relaxed mb-4">{data.outlook}</p>

      <div className="flex flex-wrap gap-4">
        {data.editorialLink && (
          <Link
            href={data.editorialLink}
            className="text-sm text-burnt-orange hover:text-ember transition-colors font-medium"
          >
            Read Full Preview →
          </Link>
        )}
        <Link
          href="/college-baseball/preseason/power-25"
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          View Preseason Power 25 →
        </Link>
      </div>
    </Card>
  );
}
