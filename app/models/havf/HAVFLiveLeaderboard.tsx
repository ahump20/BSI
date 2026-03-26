'use client';

import { useSportData } from '@/lib/hooks/useSportData';
import { HAVFLeaderboard } from '@/components/analytics/HAVFLeaderboard';

interface HAVFRow {
  player_id: string;
  player_name: string;
  team: string;
  position: string | null;
  conference: string | null;
  havf_composite: number;
  h_score: number;
  a_score: number;
  v_score: number;
  f_score: number;
}

/**
 * Fetches HAV-F scores from the live API and renders the leaderboard.
 */
export function HAVFLiveLeaderboard() {
  const { data, loading } = useSportData<{ leaderboard: HAVFRow[] }>(
    '/api/analytics/havf/leaderboard?limit=50',
    { timeout: 10000 },
  );

  const players = (data?.leaderboard ?? []).map((row) => ({
    playerId: row.player_id,
    playerName: row.player_name,
    team: row.team,
    position: row.position ?? undefined,
    conference: row.conference ?? undefined,
    composite: row.havf_composite,
    hScore: row.h_score,
    aScore: row.a_score,
    vScore: row.v_score,
    fScore: row.f_score,
  }));

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-light rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        HAV-F scores recompute daily. Data will appear after the next compute cycle.
      </div>
    );
  }

  return <HAVFLeaderboard players={players} title="Scouting Grades — Top 50" initialRows={25} />;
}
