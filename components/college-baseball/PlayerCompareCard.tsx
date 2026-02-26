'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatRadarChart } from './StatRadarChart';

interface PlayerInfo {
  player: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    jerseyNumber?: string;
    height?: string;
    weight?: number;
    team?: { id: number; name: string; shortName?: string; conference?: { name: string } };
  } | null;
  statistics: {
    batting?: {
      games: number; atBats: number; runs: number; hits: number; doubles: number;
      triples: number; homeRuns: number; rbi: number; walks: number; strikeouts: number;
      stolenBases: number; battingAverage: number; onBasePercentage: number;
      sluggingPercentage: number; ops: number;
    };
    pitching?: {
      games: number; gamesStarted: number; wins: number; losses: number; saves: number;
      inningsPitched: number; hits: number; earnedRuns: number; walks: number;
      strikeouts: number; era: number; whip: number;
    };
  } | null;
  meta?: { dataSource?: string; lastUpdated?: string };
}

interface Comparison {
  type: 'batting' | 'pitching' | 'mixed';
  differentials: Record<string, number>;
}

interface PlayerCompareCardProps {
  player1: PlayerInfo;
  player2: PlayerInfo;
  comparison: Comparison;
}

interface StatRow {
  label: string;
  key: string;
  p1: number | string;
  p2: number | string;
  diff: number;
  /** If true, lower is better (e.g. ERA, WHIP, strikeouts for batters) */
  lowerIsBetter?: boolean;
  format?: 'decimal3' | 'decimal2' | 'decimal1' | 'int';
}

function fmt(val: number | string, format: StatRow['format']): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return String(val);
  switch (format) {
    case 'decimal3': return n.toFixed(3);
    case 'decimal2': return n.toFixed(2);
    case 'decimal1': return n.toFixed(1);
    default: return String(Math.round(n));
  }
}

function diffColor(diff: number, lowerIsBetter: boolean): string {
  if (diff === 0) return 'text-text-secondary';
  const positive = lowerIsBetter ? diff < 0 : diff > 0;
  return positive ? 'text-green-400' : 'text-red-400';
}

function buildBattingRows(p1Stats: PlayerInfo['statistics'], p2Stats: PlayerInfo['statistics'], diffs: Record<string, number>): StatRow[] {
  const b1 = p1Stats?.batting;
  const b2 = p2Stats?.batting;
  if (!b1 || !b2) return [];

  return [
    { label: 'AVG', key: 'batting_battingAverage', p1: b1.battingAverage, p2: b2.battingAverage, diff: diffs.batting_battingAverage ?? 0, format: 'decimal3' },
    { label: 'OBP', key: 'batting_onBasePercentage', p1: b1.onBasePercentage, p2: b2.onBasePercentage, diff: diffs.batting_onBasePercentage ?? 0, format: 'decimal3' },
    { label: 'SLG', key: 'batting_sluggingPercentage', p1: b1.sluggingPercentage, p2: b2.sluggingPercentage, diff: diffs.batting_sluggingPercentage ?? 0, format: 'decimal3' },
    { label: 'OPS', key: 'batting_ops', p1: b1.ops, p2: b2.ops, diff: diffs.batting_ops ?? 0, format: 'decimal3' },
    { label: 'HR', key: 'batting_homeRuns', p1: b1.homeRuns, p2: b2.homeRuns, diff: diffs.batting_homeRuns ?? 0, format: 'int' },
    { label: 'RBI', key: 'batting_rbi', p1: b1.rbi, p2: b2.rbi, diff: diffs.batting_rbi ?? 0, format: 'int' },
    { label: 'H', key: 'batting_hits', p1: b1.hits, p2: b2.hits, diff: diffs.batting_hits ?? 0, format: 'int' },
    { label: 'R', key: 'batting_runs', p1: b1.runs, p2: b2.runs, diff: diffs.batting_runs ?? 0, format: 'int' },
    { label: 'BB', key: 'batting_walks', p1: b1.walks, p2: b2.walks, diff: diffs.batting_walks ?? 0, format: 'int' },
    { label: 'SO', key: 'batting_strikeouts', p1: b1.strikeouts, p2: b2.strikeouts, diff: diffs.batting_strikeouts ?? 0, format: 'int', lowerIsBetter: true },
    { label: 'SB', key: 'batting_stolenBases', p1: b1.stolenBases, p2: b2.stolenBases, diff: diffs.batting_stolenBases ?? 0, format: 'int' },
  ];
}

function buildPitchingRows(p1Stats: PlayerInfo['statistics'], p2Stats: PlayerInfo['statistics'], diffs: Record<string, number>): StatRow[] {
  const p1 = p1Stats?.pitching;
  const p2 = p2Stats?.pitching;
  if (!p1 || !p2) return [];

  return [
    { label: 'ERA', key: 'pitching_era', p1: p1.era, p2: p2.era, diff: diffs.pitching_era ?? 0, format: 'decimal2', lowerIsBetter: true },
    { label: 'WHIP', key: 'pitching_whip', p1: p1.whip, p2: p2.whip, diff: diffs.pitching_whip ?? 0, format: 'decimal2', lowerIsBetter: true },
    { label: 'W', key: 'pitching_wins', p1: p1.wins, p2: p2.wins, diff: diffs.pitching_wins ?? 0, format: 'int' },
    { label: 'L', key: 'pitching_losses', p1: p1.losses, p2: p2.losses, diff: diffs.pitching_losses ?? 0, format: 'int', lowerIsBetter: true },
    { label: 'SV', key: 'pitching_saves', p1: p1.saves, p2: p2.saves, diff: diffs.pitching_saves ?? 0, format: 'int' },
    { label: 'IP', key: 'pitching_inningsPitched', p1: p1.inningsPitched, p2: p2.inningsPitched, diff: diffs.pitching_inningsPitched ?? 0, format: 'decimal1' },
    { label: 'K', key: 'pitching_strikeouts', p1: p1.strikeouts, p2: p2.strikeouts, diff: diffs.pitching_strikeouts ?? 0, format: 'int' },
    { label: 'BB', key: 'pitching_walks', p1: p1.walks, p2: p2.walks, diff: diffs.pitching_walks ?? 0, format: 'int', lowerIsBetter: true },
    { label: 'ER', key: 'pitching_earnedRuns', p1: p1.earnedRuns, p2: p2.earnedRuns, diff: diffs.pitching_earnedRuns ?? 0, format: 'int', lowerIsBetter: true },
  ];
}

function buildRadarData(
  rows: StatRow[],
  _p1Name: string,
  _p2Name: string
): Array<{ stat: string; player1: number; player2: number; fullMark: number }> {
  return rows
    .filter((r) => r.format === 'decimal3' || r.format === 'decimal2' || ['HR', 'RBI', 'K', 'SV', 'W', 'SB'].includes(r.label))
    .map((r) => {
      const v1 = typeof r.p1 === 'number' ? r.p1 : parseFloat(String(r.p1));
      const v2 = typeof r.p2 === 'number' ? r.p2 : parseFloat(String(r.p2));
      const max = Math.max(v1, v2, 0.001);
      return {
        stat: r.label,
        player1: v1,
        player2: v2,
        fullMark: Math.ceil(max * 1.2 * 1000) / 1000,
      };
    });
}

export function PlayerCompareCard({ player1, player2, comparison }: PlayerCompareCardProps) {
  const p1 = player1.player;
  const p2 = player2.player;
  const diffs = comparison.differentials;

  const battingRows = buildBattingRows(player1.statistics, player2.statistics, diffs);
  const pitchingRows = buildPitchingRows(player1.statistics, player2.statistics, diffs);
  const allRows = [...battingRows, ...pitchingRows];

  const p1Name = p1?.name ?? 'Player 1';
  const p2Name = p2?.name ?? 'Player 2';

  const radarData = buildRadarData(allRows, p1Name, p2Name);

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {/* Header — player names side by side */}
      <CardHeader className="bg-background-secondary">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Player 1 */}
          <div className="text-left">
            <CardTitle size="md" className="text-burnt-orange">{p1Name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              {p1?.position && <Badge variant="primary" size="sm">{p1.position}</Badge>}
              {p1?.team && <span className="text-xs text-text-muted">{p1.team.name}</span>}
            </div>
          </div>

          {/* VS divider */}
          <div className="text-text-muted font-display text-lg font-bold uppercase tracking-wider">VS</div>

          {/* Player 2 */}
          <div className="text-right">
            <CardTitle size="md" className="text-ember">{p2Name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1 justify-end">
              {p2?.position && <Badge variant="accent" size="sm">{p2.position}</Badge>}
              {p2?.team && <span className="text-xs text-text-muted">{p2.team.name}</span>}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Radar Chart */}
      {radarData.length >= 3 && (
        <CardContent className="border-b border-border">
          <StatRadarChart player1Name={p1Name} player2Name={p2Name} data={radarData} />
        </CardContent>
      )}

      {/* Batting Stats Table */}
      {battingRows.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-background-secondary/50 border-b border-border">
            <h3 className="text-sm font-display uppercase tracking-wider text-text-secondary">Batting</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Batting comparison">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase w-1/4">{p1Name.split(' ').pop()}</th>
                  <th scope="col" className="py-2 px-4 text-center text-xs font-semibold text-text-muted uppercase w-1/4">Stat</th>
                  <th scope="col" className="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase w-1/4">{p2Name.split(' ').pop()}</th>
                  <th scope="col" className="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase w-1/4">+/-</th>
                </tr>
              </thead>
              <tbody>
                {battingRows.map((row) => (
                  <tr key={row.key} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                    <td className="py-2 px-4 text-left text-text-primary font-mono text-sm">{fmt(row.p1, row.format)}</td>
                    <td className="py-2 px-4 text-center text-text-secondary text-xs font-semibold uppercase">{row.label}</td>
                    <td className="py-2 px-4 text-right text-text-primary font-mono text-sm">{fmt(row.p2, row.format)}</td>
                    <td className={`py-2 px-4 text-right font-mono text-sm ${diffColor(row.diff, row.lowerIsBetter ?? false)}`}>
                      {row.diff > 0 ? '+' : ''}{fmt(row.diff, row.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pitching Stats Table */}
      {pitchingRows.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-background-secondary/50 border-b border-border">
            <h3 className="text-sm font-display uppercase tracking-wider text-text-secondary">Pitching</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Pitching comparison">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase w-1/4">{p1Name.split(' ').pop()}</th>
                  <th scope="col" className="py-2 px-4 text-center text-xs font-semibold text-text-muted uppercase w-1/4">Stat</th>
                  <th scope="col" className="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase w-1/4">{p2Name.split(' ').pop()}</th>
                  <th scope="col" className="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase w-1/4">+/-</th>
                </tr>
              </thead>
              <tbody>
                {pitchingRows.map((row) => (
                  <tr key={row.key} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                    <td className="py-2 px-4 text-left text-text-primary font-mono text-sm">{fmt(row.p1, row.format)}</td>
                    <td className="py-2 px-4 text-center text-text-secondary text-xs font-semibold uppercase">{row.label}</td>
                    <td className="py-2 px-4 text-right text-text-primary font-mono text-sm">{fmt(row.p2, row.format)}</td>
                    <td className={`py-2 px-4 text-right font-mono text-sm ${diffColor(row.diff, row.lowerIsBetter ?? false)}`}>
                      {row.diff > 0 ? '+' : ''}{fmt(row.diff, row.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No stats fallback */}
      {allRows.length === 0 && (
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">
            No comparable statistics available for these players.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
