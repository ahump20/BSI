'use client';

/**
 * BoxScoreTable — renders batting and pitching box score tables for MLB games.
 */

export interface BattingLine {
  player: { id: string; name: string; position?: string };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg?: string;
}

export interface PitchingLine {
  player: { id: string; name: string };
  decision?: string;
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches?: number;
  strikes?: number;
  era?: string;
}

export interface TeamInfo {
  name: string;
  abbreviation: string;
  score: number;
  isWinner?: boolean;
}

export interface Linescore {
  innings: Array<{ away: number | null; home: number | null }>;
  totals: {
    away: { runs: number; hits: number; errors: number };
    home: { runs: number; hits: number; errors: number };
  };
}

export interface BoxScoreData {
  away: { batting: BattingLine[]; pitching: PitchingLine[] };
  home: { batting: BattingLine[]; pitching: PitchingLine[] };
}

export interface BoxScoreTableProps {
  linescore?: Linescore;
  boxscore: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  variant?: 'compact' | 'full';
  showLinescore?: boolean;
}

function TeamBattingTable({ team, batting }: { team: TeamInfo; batting: BattingLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{team.name} batting statistics</caption>
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <th scope="col" className="text-left py-2 px-3 font-medium">
              {team.abbreviation} Batting
            </th>
            <th scope="col" className="text-center py-2 px-2 font-medium">AB</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">R</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">H</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">RBI</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">BB</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">SO</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">AVG</th>
          </tr>
        </thead>
        <tbody>
          {batting.map((b, i) => (
            <tr key={b.player.id || i} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2 px-3 text-white">
                {b.player.name}
                {b.player.position && (
                  <span className="text-white/40 ml-1 text-xs">{b.player.position}</span>
                )}
              </td>
              <td className="text-center py-2 px-2 text-white/70">{b.ab}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.r}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.h}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.rbi}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.bb}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.so}</td>
              <td className="text-center py-2 px-2 text-white/70">{b.avg ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamPitchingTable({ team, pitching }: { team: TeamInfo; pitching: PitchingLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{team.name} pitching statistics</caption>
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <th scope="col" className="text-left py-2 px-3 font-medium">
              {team.abbreviation} Pitching
            </th>
            <th scope="col" className="text-center py-2 px-2 font-medium">IP</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">H</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">R</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">ER</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">BB</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">SO</th>
            <th scope="col" className="text-center py-2 px-2 font-medium">ERA</th>
          </tr>
        </thead>
        <tbody>
          {pitching.map((p, i) => (
            <tr key={p.player.id || i} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2 px-3 text-white">
                {p.player.name}
                {p.decision && (
                  <span
                    className={`ml-1.5 text-xs font-semibold ${
                      p.decision === 'W'
                        ? 'text-green-400'
                        : p.decision === 'L'
                          ? 'text-red-400'
                          : 'text-blue-400'
                    }`}
                  >
                    ({p.decision})
                  </span>
                )}
              </td>
              <td className="text-center py-2 px-2 text-white/70">{p.ip}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.h}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.r}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.er}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.bb}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.so}</td>
              <td className="text-center py-2 px-2 text-white/70">{p.era ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BoxScoreTable({
  linescore,
  boxscore,
  awayTeam,
  homeTeam,
  variant = 'full',
  showLinescore = true,
}: BoxScoreTableProps) {
  return (
    <div className="space-y-6">
      {/* Linescore */}
      {showLinescore && linescore && (
        <div className="bg-graphite rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Linescore</caption>
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs">
                <th scope="col" className="text-left py-2 px-3 w-32 font-medium">Team</th>
                {linescore.innings.map((_, i) => (
                  <th key={i} scope="col" className="text-center py-2 px-2 font-medium">
                    {i + 1}
                  </th>
                ))}
                <th scope="col" className="text-center py-2 px-2 font-bold">R</th>
                <th scope="col" className="text-center py-2 px-2 font-bold">H</th>
                <th scope="col" className="text-center py-2 px-2 font-bold">E</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b border-white/5 ${awayTeam.isWinner ? 'text-white font-semibold' : 'text-white/70'}`}>
                <td className="py-2 px-3">{awayTeam.abbreviation}</td>
                {linescore.innings.map((inn, i) => (
                  <td key={i} className="text-center py-2 px-2">{inn.away ?? '-'}</td>
                ))}
                <td className="text-center py-2 px-2 font-bold">{linescore.totals.away.runs}</td>
                <td className="text-center py-2 px-2">{linescore.totals.away.hits}</td>
                <td className="text-center py-2 px-2">{linescore.totals.away.errors}</td>
              </tr>
              <tr className={awayTeam.isWinner === false ? 'text-white font-semibold' : 'text-white/70'}>
                <td className="py-2 px-3">{homeTeam.abbreviation}</td>
                {linescore.innings.map((inn, i) => (
                  <td key={i} className="text-center py-2 px-2">{inn.home ?? '-'}</td>
                ))}
                <td className="text-center py-2 px-2 font-bold">{linescore.totals.home.runs}</td>
                <td className="text-center py-2 px-2">{linescore.totals.home.hits}</td>
                <td className="text-center py-2 px-2">{linescore.totals.home.errors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Batting Tables */}
      <div className={variant === 'full' ? 'space-y-6' : 'space-y-4'}>
        <div className="bg-graphite rounded-xl p-4">
          <TeamBattingTable team={awayTeam} batting={boxscore.away.batting} />
        </div>
        <div className="bg-graphite rounded-xl p-4">
          <TeamBattingTable team={homeTeam} batting={boxscore.home.batting} />
        </div>
      </div>

      {/* Pitching Tables */}
      <div className={variant === 'full' ? 'space-y-6' : 'space-y-4'}>
        <div className="bg-graphite rounded-xl p-4">
          <TeamPitchingTable team={awayTeam} pitching={boxscore.away.pitching} />
        </div>
        <div className="bg-graphite rounded-xl p-4">
          <TeamPitchingTable team={homeTeam} pitching={boxscore.home.pitching} />
        </div>
      </div>
    </div>
  );
}
