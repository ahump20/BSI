'use client';

interface BoxScoreTableProps {
  data?: { team: string; players: Array<{ name: string; stats: Record<string, string | number> }> }[];
  sport?: string;
}

export function BoxScoreTable({ data, sport = 'baseball' }: BoxScoreTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-text-tertiary text-sm p-4 text-center">Box score data not available</div>;
  }

  return (
    <div className="overflow-x-auto">
      {data.map((team, i) => (
        <div key={i} className="mb-4">
          <h4 className="text-white font-semibold mb-2">{team.team}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-2 px-3 text-text-tertiary">Player</th>
                {team.players[0] && Object.keys(team.players[0].stats).map((stat) => (
                  <th key={stat} className="text-center py-2 px-2 text-text-tertiary">{stat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.players.map((player, j) => (
                <tr key={j} className="border-b border-border-subtle/50">
                  <td className="py-2 px-3 text-white">{player.name}</td>
                  {Object.values(player.stats).map((val, k) => (
                    <td key={k} className="text-center py-2 px-2 text-text-secondary font-mono">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
