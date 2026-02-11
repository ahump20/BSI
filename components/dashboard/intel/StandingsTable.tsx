'use client';

import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { StandingsTeam, IntelSport } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';

interface StandingsTableProps {
  standings: StandingsTeam[];
  sport: IntelSport;
}

export function StandingsTable({ standings, sport }: StandingsTableProps) {
  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[sport]})`;
  const rows = standings.slice(0, 10);

  if (rows.length === 0) return null;

  return (
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: accent }} />
            Standings
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            Top {rows.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-2 pr-2 text-white/40 font-medium">#</th>
                <th className="pb-2 pr-3 text-white/40 font-medium">Team</th>
                <th className="pb-2 px-2 text-center text-white/40 font-medium">W</th>
                <th className="pb-2 px-2 text-center text-white/40 font-medium">L</th>
                <th className="pb-2 px-2 text-center text-white/40 font-medium">Pct</th>
                <th className="pb-2 pl-2 text-right text-white/40 font-medium">NRtg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team, i) => {
                const pct = team.winPct ?? team.wins / Math.max(team.wins + team.losses, 1);
                const netRtg = team.netRating ?? Math.round((pct - 0.5) * 30 * 10) / 10;
                const shortName = team.abbreviation || team.teamName.split(' ').pop() || team.teamName;
                const displayRank = team.rank ?? i + 1;

                return (
                  <tr
                    key={team.teamName}
                    className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-1.5 pr-2 text-white/30">{displayRank}</td>
                    <td className="py-1.5 pr-3 text-white/80 font-medium truncate max-w-[140px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {team.logo && (
                          <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
                        )}
                        <span className="truncate">
                          {team.rank ? `#${team.rank} ` : ''}{shortName}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center text-white/60">{team.wins}</td>
                    <td className="py-1.5 px-2 text-center text-white/60">{team.losses}</td>
                    <td
                      className="py-1.5 px-2 text-center font-semibold"
                      style={{ color: pct > 0.6 ? accent : 'rgba(255,255,255,0.6)' }}
                    >
                      .{Math.round(pct * 1000)}
                    </td>
                    <td
                      className="py-1.5 pl-2 text-right"
                      style={{ color: netRtg > 0 ? '#10b981' : netRtg < 0 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}
                    >
                      {netRtg > 0 ? '+' : ''}{netRtg.toFixed(1)}
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
