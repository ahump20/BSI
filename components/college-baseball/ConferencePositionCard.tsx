'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSportData } from '@/lib/hooks/useSportData';

// ─── Types ─────────────────────────────────────────────────────────────────

interface CPITeam {
  rank: number;
  team_id: string;
  team: string;
  wins: number;
  losses: number;
  conf_wins: number;
  conf_losses: number;
  win_pct: number;
  conf_win_pct: number;
  wrc_plus: number;
  fip: number;
  woba: number;
  cpi: number;
}

interface ConferencePowerIndex {
  conference: string;
  season: number;
  teams: CPITeam[];
  meta?: { source?: string; fetched_at?: string };
}

// ─── Component ─────────────────────────────────────────────────────────────

interface ConferencePositionCardProps {
  teamId: string;
  /** ESPN numeric ID to match against CPI team_id */
  espnId?: string;
  /** Conference slug for the API (e.g., 'sec', 'big-12') */
  conference: string;
  accent?: string;
}

export function ConferencePositionCard({
  teamId,
  espnId,
  conference,
  accent = 'var(--bsi-primary)',
}: ConferencePositionCardProps) {
  const confSlug = conference.toLowerCase().replace(/\s+/g, '-');
  const { data, loading, error } = useSportData<ConferencePowerIndex>(
    `/api/college-baseball/conferences/${confSlug}/power-index`,
    { timeout: 10000 },
  );

  if (loading) {
    return <div className="h-48 bg-surface-light rounded-lg animate-pulse" />;
  }

  if (error || !data || data.teams.length === 0) return null;

  const lookupId = espnId || teamId;
  const teamRow = data.teams.find((t) => t.team_id === lookupId);
  const teamRank = teamRow?.rank;

  // Find team's position for specific metrics
  const sortedByWoba = [...data.teams].sort((a, b) => b.woba - a.woba);
  const sortedByFip = [...data.teams].sort((a, b) => a.fip - b.fip);
  const wobaRank = sortedByWoba.findIndex((t) => t.team_id === lookupId) + 1;
  const fipRank = sortedByFip.findIndex((t) => t.team_id === lookupId) + 1;

  const fmt2 = (n: number) => n.toFixed(2);
  const fmt3 = (n: number) => n.toFixed(3);
  const confDisplay = conference.toUpperCase();

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>{confDisplay} Conference Position</span>
          <Badge variant="accent" size="sm">Power Index</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary ranks */}
        {teamRow && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>
                {teamRank}
              </div>
              <div className="text-text-muted text-xs mt-1">Overall CPI</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: wobaRank <= 3 ? accent : undefined }}>
                {wobaRank || '—'}
              </div>
              <div className="text-text-muted text-xs mt-1">Batting (wOBA)</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: fipRank <= 3 ? accent : undefined }}>
                {fipRank || '—'}
              </div>
              <div className="text-text-muted text-xs mt-1">Pitching (FIP)</div>
            </div>
          </div>
        )}

        {/* Conference table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                <th className="text-center py-2 px-2 w-8">#</th>
                <th className="text-left py-2 px-2">Team</th>
                <th className="text-center py-2 px-2">Record</th>
                <th className="text-right py-2 px-2">wOBA</th>
                <th className="text-right py-2 px-2">FIP</th>
                <th className="text-right py-2 px-2">CPI</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((t) => {
                const isTeam = t.team_id === lookupId;
                return (
                  <tr
                    key={t.team_id}
                    className={`border-t border-border-subtle transition-colors ${
                      isTeam ? 'bg-burnt-orange/10' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-mono text-text-muted">{t.rank}</td>
                    <td className={`py-2 px-2 font-medium ${isTeam ? 'text-burnt-orange' : 'text-text-primary'}`}>
                      {t.team}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-text-secondary text-xs">
                      {t.wins}-{t.losses}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmt3(t.woba)}</td>
                    <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmt2(t.fip)}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: isTeam ? accent : undefined }}>
                      {fmt3(t.cpi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
