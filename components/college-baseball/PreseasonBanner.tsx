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
          ? 'border-[#BF5700]/40 bg-gradient-to-r from-[#BF5700]/10 to-transparent'
          : 'border-white/10'
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-[#BF5700]">#{data.rank}</span>
          <div>
            <span className="text-white font-semibold text-sm">Preseason Power 25</span>
            <div className="text-white/30 text-xs">BSI 2026 Rankings</div>
          </div>
        </div>
        <Badge variant={data.tier === 'elite' ? 'primary' : 'secondary'}>
          {tierLabel}
        </Badge>
      </div>

      <div className="text-white/40 text-sm mb-3">
        2025: {data.record2025} | {data.postseason2025}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {data.keyPlayers.map((player) => (
          <span
            key={player}
            className="text-xs bg-white/5 px-2 py-1 rounded text-white/50"
          >
            {player}
          </span>
        ))}
      </div>

      <p className="text-white/50 text-sm leading-relaxed mb-4">{data.outlook}</p>

      <div className="flex flex-wrap gap-4">
        {data.editorialLink && (
          <Link
            href={data.editorialLink}
            className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors font-medium"
          >
            Read Full Preview →
          </Link>
        )}
        <Link
          href="/college-baseball/preseason/power-25"
          className="text-sm text-white/30 hover:text-white transition-colors"
        >
          View Preseason Power 25 →
        </Link>
      </div>
    </Card>
  );
}
