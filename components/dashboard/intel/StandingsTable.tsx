'use client';

import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { StandingsTeam, IntelSport } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';

interface StandingsTableProps {
  standings: StandingsTeam[];
  sport: IntelSport;
}

export function StandingsTable({ standings, sport }: StandingsTableProps) {
  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[sport]})`;
  const rows = [...standings]
    .sort((a, b) => {
      const pctA = a.winPct ?? a.wins / Math.max(a.wins + a.losses, 1);
      const pctB = b.winPct ?? b.wins / Math.max(b.wins + b.losses, 1);
      return pctB - pctA;
    })
    .slice(0, 10);

  if (rows.length === 0) return null;

  return (
    <div className="intel-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="intel-section-label">
          <Trophy className="h-4 w-4" style={{ color: accent }} />
          Standings
        </div>
        <Badge variant="outline" className="text-[10px]" style={{ fontFamily: 'var(--intel-mono)' }}>
          Top {rows.length}
        </Badge>
      </div>

      <hr className="intel-rule mx-4 mt-3" />

      <div className="px-4 pb-4 pt-3 overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: 'var(--intel-mono)', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--intel-border-rule)' }}>
              <th className="pb-2 pr-2 font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>#</th>
              <th className="pb-2 pr-3 font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>Team</th>
              <th className="pb-2 px-2 text-center font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>W</th>
              <th className="pb-2 px-2 text-center font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>L</th>
              <th className="pb-2 px-2 text-center font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>Pct</th>
              <th className="pb-2 pl-2 text-right font-medium" style={{ fontFamily: 'var(--intel-display)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--intel-text-caption)' }}>NRtg</th>
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
                  className="transition-colors hover:bg-[var(--intel-bg-elevated)]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td className="py-1.5 pr-2" style={{ color: 'var(--intel-text-caption)', fontVariantNumeric: 'tabular-nums' }}>{displayRank}</td>
                  <td className="py-1.5 pr-3" style={{ maxWidth: 140 }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {team.logo && (
                        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
                      )}
                      <span className="intel-team-name text-[0.7rem] truncate">
                        {team.rank ? `#${team.rank} ` : ''}{shortName}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-center" style={{ color: 'var(--intel-text-body)', fontVariantNumeric: 'tabular-nums' }}>{team.wins}</td>
                  <td className="py-1.5 px-2 text-center" style={{ color: 'var(--intel-text-body)', fontVariantNumeric: 'tabular-nums' }}>{team.losses}</td>
                  <td
                    className="py-1.5 px-2 text-center font-semibold"
                    style={{ color: pct > 0.6 ? accent : 'var(--intel-text-body)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    .{Math.round(pct * 1000)}
                  </td>
                  <td
                    className="py-1.5 pl-2 text-right"
                    style={{ color: netRtg > 0 ? '#10b981' : netRtg < 0 ? '#ef4444' : 'var(--intel-text-caption)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {netRtg > 0 ? '+' : ''}{netRtg.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
