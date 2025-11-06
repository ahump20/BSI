import { Metadata } from 'next';

interface TeamPageProps {
  params: {
    teamId: string;
  };
}

interface RosterPlayer {
  person: {
    id: number;
    fullName: string;
  };
  jerseyNumber?: string;
  position: {
    name: string;
    type: string;
    abbreviation: string;
  };
  status: {
    description: string;
  };
}

async function getTeamRoster(teamId: string, season: number = new Date().getFullYear()): Promise<any> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/mlb/teams/${teamId}/roster?season=${season}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return null;
  }
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  return {
    title: `Team ${params.teamId} Roster | Blaze Sports Intel`,
    description: `View complete roster and statistics for MLB team ${params.teamId}`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const currentSeason = new Date().getFullYear();
  const roster = await getTeamRoster(params.teamId, currentSeason);

  if (!roster || !roster.players) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Team Not Found</h1>
          <p className="text-gray-400">The requested team roster could not be found.</p>
        </div>
      </div>
    );
  }

  // Group players by position
  const groupedPlayers: Record<string, RosterPlayer[]> = {
    'Pitchers': [],
    'Catchers': [],
    'Infielders': [],
    'Outfielders': [],
    'Designated Hitters': []
  };

  roster.players.forEach((player: RosterPlayer) => {
    const posType = player.position.type;
    const posAbbr = player.position.abbreviation;

    if (posType === 'Pitcher') {
      groupedPlayers['Pitchers'].push(player);
    } else if (posAbbr === 'C') {
      groupedPlayers['Catchers'].push(player);
    } else if (['1B', '2B', '3B', 'SS'].includes(posAbbr)) {
      groupedPlayers['Infielders'].push(player);
    } else if (['LF', 'CF', 'RF', 'OF'].includes(posAbbr)) {
      groupedPlayers['Outfielders'].push(player);
    } else if (posAbbr === 'DH') {
      groupedPlayers['Designated Hitters'].push(player);
    }
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/baseball/mlb"
             className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to MLB Home
          </a>
          <h1 className="text-4xl font-bold mb-2">{roster.team_name}</h1>
          <p className="text-gray-400">{currentSeason} Season Roster</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Players</div>
            <div className="text-3xl font-bold text-orange-500">{roster.players.length}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Pitchers</div>
            <div className="text-3xl font-bold text-orange-500">{groupedPlayers['Pitchers'].length}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Catchers</div>
            <div className="text-3xl font-bold text-orange-500">{groupedPlayers['Catchers'].length}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Infielders</div>
            <div className="text-3xl font-bold text-orange-500">{groupedPlayers['Infielders'].length}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Outfielders</div>
            <div className="text-3xl font-bold text-orange-500">{groupedPlayers['Outfielders'].length}</div>
          </div>
        </div>

        {/* Roster by Position */}
        {Object.entries(groupedPlayers).map(([group, players]) => {
          if (players.length === 0) return null;

          return (
            <div key={group} className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{group}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Player</th>
                      <th className="px-4 py-3 text-left font-semibold">Position</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {players.map((player) => (
                      <tr key={player.person.id} className="hover:bg-gray-800 transition">
                        <td className="px-4 py-3 font-semibold text-orange-500">
                          {player.jerseyNumber || '-'}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {player.person.fullName}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {player.position.abbreviation}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            player.status.description === 'Active'
                              ? 'bg-green-900 text-green-300'
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {player.status.description}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/baseball/mlb/players/${player.person.id}`}
                            className="text-orange-500 hover:text-orange-400 text-sm font-semibold"
                          >
                            View Profile →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Team Analysis Links */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Team Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href={`/baseball/mlb/teams/${params.teamId}/stats`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Team Stats
            </a>
            <a href={`/baseball/mlb/teams/${params.teamId}/schedule`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Schedule
            </a>
            <a href={`/baseball/mlb/teams/${params.teamId}/depth-chart`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Depth Chart
            </a>
            <a href={`/baseball/mlb/standings`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Standings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
