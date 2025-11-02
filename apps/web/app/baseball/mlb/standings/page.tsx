import { Suspense } from 'react';
import { ErrorBoundary, ApiErrorDisplay } from '../../../../components/ErrorBoundary';
import { LoadingState, SkeletonTable } from '../../../../components/LoadingState';
import { DataFreshnessIndicator } from '../../../../components/DataFreshnessIndicator';

interface MLBStandingsResponse {
  league: string;
  season: string;
  standings: Array<{
    teamName: string;
    wins: number;
    losses: number;
    winPercentage: number;
    gamesBack: number;
    division: string;
    league: string;
    runsScored: number;
    runsAllowed: number;
    streakCode: string;
  }>;
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
  };
}

async function fetchMLBStandings(): Promise<MLBStandingsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://blazesportsintel.com';
  const res = await fetch(`${baseUrl}/api/mlb/standings`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch MLB standings: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function StandingsTable() {
  const data = await fetchMLBStandings();

  // Group standings by league and division
  const grouped = data.standings.reduce((acc, team) => {
    const key = `${team.league}-${team.division}`;
    if (!acc[key]) {
      acc[key] = {
        league: team.league,
        division: team.division,
        teams: []
      };
    }
    acc[key].teams.push(team);
    return acc;
  }, {} as Record<string, { league: string; division: string; teams: typeof data.standings }>);

  // Sort divisions (AL first, then NL)
  const divisions = Object.values(grouped).sort((a, b) => {
    if (a.league !== b.league) {
      return a.league === 'AL' ? -1 : 1;
    }
    const divOrder = ['East', 'Central', 'West'];
    return divOrder.indexOf(a.division) - divOrder.indexOf(b.division);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {data.season} MLB Standings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Source: {data.meta.dataSource}
          </p>
        </div>
        <DataFreshnessIndicator timestamp={data.meta.lastUpdated} />
      </div>

      {divisions.map((division) => (
        <section key={`${division.league}-${division.division}`} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {division.league} {division.division}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GB
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diff
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {division.teams.map((team, index) => (
                  <tr
                    key={team.teamName}
                    className={index === 0 ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && (
                          <span className="mr-2 text-blue-600 font-bold" title="Division Leader">
                            ★
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {team.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                      {team.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.winPercentage.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.gamesBack === 0 ? '—' : team.gamesBack.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.runsScored}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.runsAllowed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span
                        className={
                          team.runsScored - team.runsAllowed > 0
                            ? 'text-green-600 font-semibold'
                            : team.runsScored - team.runsAllowed < 0
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600'
                        }
                      >
                        {team.runsScored - team.runsAllowed > 0 ? '+' : ''}
                        {team.runsScored - team.runsAllowed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span
                        className={
                          team.streakCode.startsWith('W')
                            ? 'text-green-600 font-medium'
                            : team.streakCode.startsWith('L')
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {team.streakCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="text-sm text-gray-600 mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="font-semibold mb-2">Legend:</p>
        <ul className="space-y-1">
          <li><strong>GB:</strong> Games Back from division leader</li>
          <li><strong>RS:</strong> Runs Scored</li>
          <li><strong>RA:</strong> Runs Allowed</li>
          <li><strong>Diff:</strong> Run Differential</li>
          <li><strong>Streak:</strong> Current winning (W) or losing (L) streak</li>
        </ul>
      </div>
    </div>
  );
}

function StandingsLoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <LoadingState message="Loading MLB standings..." />
      </div>
      <SkeletonTable rows={5} columns={9} />
      <SkeletonTable rows={5} columns={9} />
    </div>
  );
}

export default function MLBStandingsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <div className="mb-8">
          <span className="di-kicker">Diamond Insights · MLB</span>
          <h1 className="di-page-title">MLB Standings</h1>
          <p className="di-page-subtitle">
            Live MLB standings with automatic updates. Data refreshes every 10 minutes throughout the season.
          </p>
        </div>

        <ErrorBoundary
          fallback={
            <ApiErrorDisplay
              error="Failed to load MLB standings. Please try again later."
              title="Standings Unavailable"
            />
          }
        >
          <Suspense fallback={<StandingsLoadingFallback />}>
            <StandingsTable />
          </Suspense>
        </ErrorBoundary>
      </section>
    </main>
  );
}

export const metadata = {
  title: 'MLB Standings | Diamond Insights',
  description: 'Live MLB standings with real-time updates and division rankings',
};
