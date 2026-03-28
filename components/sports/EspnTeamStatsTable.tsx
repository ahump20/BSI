/**
 * Shared ESPN team statistics comparison table.
 * Renders away vs home stat comparison from ESPN boxscore data.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { BoxscoreTeam } from './espn-boxscore-types';

interface EspnTeamStatsTableProps {
  away: BoxscoreTeam;
  home: BoxscoreTeam;
  awayLabel?: string;
  homeLabel?: string;
}

export function EspnTeamStatsTable({ away, home, awayLabel = 'Away', homeLabel = 'Home' }: EspnTeamStatsTableProps) {
  return (
    <Card variant="default" padding="md">
      <CardHeader><CardTitle>Team Statistics</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-vintage)]">
                <th className="text-left p-2 text-[rgba(196,184,165,0.5)]">{awayLabel}</th>
                <th className="text-center p-2 text-[rgba(196,184,165,0.5)]">Stat</th>
                <th className="text-right p-2 text-[rgba(196,184,165,0.5)]">{homeLabel}</th>
              </tr>
            </thead>
            <tbody>
              {(away.statistics || []).map((awayStat, idx) => {
                const homeStat = home.statistics?.[idx];
                const label = awayStat.label || awayStat.name || '';
                return (
                  <tr key={idx} className="border-b border-[var(--border-vintage)] last:border-0">
                    <td className="p-2 font-mono text-[var(--bsi-dust)]">{awayStat.displayValue || '-'}</td>
                    <td className="p-2 text-center text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wide">{label}</td>
                    <td className="p-2 text-right font-mono text-[var(--bsi-dust)]">{homeStat?.displayValue || '-'}</td>
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
