'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { fmt3 } from '@/lib/utils/format';

interface STStandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  league: 'Cactus' | 'Grapefruit' | null;
  wins: number;
  losses: number;
  winPct: number;
  runsFor?: number;
  runsAgainst?: number;
}

interface SpringTrainingStandingsTableProps {
  title: string;
  teams: STStandingsTeam[];
}

export function SpringTrainingStandingsTable({ title, teams }: SpringTrainingStandingsTableProps) {
  const sorted = [...teams].sort((a, b) => b.winPct - a.winPct);

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Team</th>
                <th className="text-right px-4 py-3">W</th>
                <th className="text-right px-4 py-3">L</th>
                <th className="text-right px-4 py-3">PCT</th>
                <th className="text-right px-4 py-3">RS</th>
                <th className="text-right px-4 py-3">RA</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, i) => (
                <tr
                  key={team.id}
                  className="border-b border-[var(--border-vintage)] hover:bg-[var(--surface-press-box)] transition-colors"
                >
                  <td className="px-4 py-3 text-[rgba(196,184,165,0.35)] font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt=""
                          className="w-5 h-5 object-contain"
                          loading="lazy"
                        />
                      )}
                      <span className="text-[var(--bsi-bone)] font-medium">{team.name}</span>
                      <span className="text-[rgba(196,184,165,0.35)] text-xs">{team.abbreviation}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--bsi-bone)]">{team.wins}</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--bsi-dust)]">{team.losses}</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--bsi-primary)] font-semibold">
                    {fmt3(team.winPct)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[rgba(196,184,165,0.35)]">
                    {team.runsFor ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[rgba(196,184,165,0.35)]">
                    {team.runsAgainst ?? '—'}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[rgba(196,184,165,0.35)]">
                    Standings update once games are underway
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
