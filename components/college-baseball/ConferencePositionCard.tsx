'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt2, fmt3 } from '@/lib/utils/format';

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
    return <div className="h-48 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />;
  }

  if (error) {
    return (
      <div className="bg-[var(--surface-press-box)] border border-border rounded-sm p-6 text-center">
        <p className="text-[rgba(196,184,165,0.35)] text-sm">Conference data temporarily unavailable</p>
      </div>
    );
  }

  if (!data || data.teams.length === 0) return null;

  const lookupId = espnId || teamId;
  const teamRow = data.teams.find((t) => t.team_id === lookupId);
  const teamRank = teamRow?.rank;

  // Find team's position for specific metrics
  const sortedByWoba = [...data.teams].sort((a, b) => b.woba - a.woba);
  const sortedByFip = [...data.teams].sort((a, b) => a.fip - b.fip);
  const wobaRank = sortedByWoba.findIndex((t) => t.team_id === lookupId) + 1;
  const fipRank = sortedByFip.findIndex((t) => t.team_id === lookupId) + 1;

  const confDisplay = conference.toUpperCase();

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {confSlug === 'sec' && (
            <img
              src="https://a.espncdn.com/i/teamlogos/ncaa_conf/500/sec.png"
              alt="SEC"
              className="w-6 h-6 object-contain"
              loading="lazy"
            />
          )}
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
              <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Overall CPI</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: wobaRank <= 3 ? accent : undefined }}>
                {wobaRank || '—'}
              </div>
              <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Batting (wOBA)</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: fipRank <= 3 ? accent : undefined }}>
                {fipRank || '—'}
              </div>
              <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Pitching (FIP)</div>
            </div>
          </div>
        )}

        {/* Conference table — shows team's neighborhood (±2 positions) + full table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
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
                    className={`border-t border-[var(--border-vintage)] transition-colors ${
                      isTeam ? 'bg-[var(--bsi-primary)]/10' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-mono text-[rgba(196,184,165,0.35)]">{t.rank}</td>
                    <td className={`py-2 px-2 font-medium ${isTeam ? 'text-[var(--bsi-primary)]' : 'text-[var(--bsi-bone)]'}`}>
                      {t.team}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[var(--bsi-dust)] text-xs">
                      {t.wins}-{t.losses}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{fmt3(t.woba)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{fmt2(t.fip)}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: isTeam ? accent : undefined }}>
                      {fmt3(t.cpi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Conference size indicator */}
        <div className="mt-3 text-center text-[10px] text-[rgba(196,184,165,0.35)]">
          {data.teams.length} teams · {data.season} season
        </div>
      </CardContent>
    </Card>
  );
}
