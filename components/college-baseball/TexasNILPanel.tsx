'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSportData } from '@/lib/hooks/useSportData';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NILPlayer {
  player_id: string;
  name: string;
  team: string;
  position: string;
  nil_index: number;
  nil_range_low: number;
  nil_range_high: number;
  war?: number;
  performance_score?: number;
  exposure_score?: number;
}

interface NILLeaderboardResponse {
  players: NILPlayer[];
  season: number;
  meta: { source: string; fetched_at: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCENT = 'var(--bsi-primary)';

function fmtDollar(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TexasNILPanelProps {
  limit?: number;
}

export function TexasNILPanel({ limit = 15 }: TexasNILPanelProps) {
  const { data, loading, error } = useSportData<NILLeaderboardResponse>(
    '/api/nil/leaderboard?conference=sec',
    { timeout: 10000 },
  );

  const texasPlayers = useMemo(() => {
    if (!data?.players) return [];
    return data.players
      .filter((p) => p.team?.toLowerCase().includes('texas') && !p.team?.toLowerCase().includes('a&m'))
      .sort((a, b) => b.nil_index - a.nil_index)
      .slice(0, limit);
  }, [data, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface-light rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || texasPlayers.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-text-muted text-sm">NIL data unavailable for Texas players.</p>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Texas NIL Intelligence</span>
          <Badge variant="accent" size="sm">{texasPlayers.length} players</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-left py-2 px-2">Pos</th>
                <th className="text-right py-2 px-2">NIL Index</th>
                <th className="text-right py-2 px-2">Est. Range</th>
                {texasPlayers.some((p) => p.war !== undefined) && (
                  <th className="text-right py-2 px-2">WAR</th>
                )}
              </tr>
            </thead>
            <tbody>
              {texasPlayers.map((p) => (
                <tr key={p.player_id} className="border-t border-border-subtle">
                  <td className="py-2 px-2 text-text-primary font-medium">{p.name}</td>
                  <td className="py-2 px-2 text-text-muted text-xs">{p.position}</td>
                  <td
                    className="py-2 px-2 text-right font-mono font-semibold"
                    style={{ color: p.nil_index >= 70 ? ACCENT : undefined }}
                  >
                    {p.nil_index.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-text-secondary text-xs">
                    {fmtDollar(p.nil_range_low)}–{fmtDollar(p.nil_range_high)}
                  </td>
                  {texasPlayers.some((pl) => pl.war !== undefined) && (
                    <td className="py-2 px-2 text-right font-mono text-text-secondary">
                      {p.war !== undefined ? p.war.toFixed(1) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
