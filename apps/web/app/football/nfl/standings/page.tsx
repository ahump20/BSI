import { Suspense } from 'react';
import { ErrorBoundary, ApiErrorDisplay } from '../../../../components/ErrorBoundary';
import { LoadingState, SkeletonTable } from '../../../../components/LoadingState';
import { DataFreshnessIndicator } from '../../../../components/DataFreshnessIndicator';

interface NFLStandingsResponse {
  league: string;
  season: string;
  standings: Array<{
    teamName: string;
    wins: number;
    losses: number;
    ties: number;
    winPercentage: number;
    division: string;
    conference: string;
    pointsFor: number;
    pointsAgainst: number;
  }>;
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
  };
}

async function fetchNFLStandings(): Promise<NFLStandingsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://blazesportsintel.com';
  const res = await fetch(`${baseUrl}/api/nfl/standings`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch NFL standings: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function StandingsTable() {
  const data = await fetchNFLStandings();

  // Group standings by conference and division
  const grouped = data.standings.reduce((acc, team) => {
    const key = `${team.conference}-${team.division}`;
    if (!acc[key]) {
      acc[key] = {
        conference: team.conference,
        division: team.division,
        teams: []
      };
    }
    acc[key].teams.push(team);
    return acc;
  }, {} as Record<string, { conference: string; division: string; teams: typeof data.standings }>);

  // Sort divisions
  const divisions = Object.values(grouped).sort((a, b) => {
    if (a.conference !== b.conference) {
      return a.conference.localeCompare(b.conference);
    }
    return a.division.localeCompare(b.division);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {data.season} NFL Standings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Source: {data.meta.dataSource}
          </p>
        </div>
        <DataFreshnessIndicator timestamp={data.meta.lastUpdated} />
      </div>

      {divisions.map((division) => (
        <section key={`${division.conference}-${division.division}`} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {division.conference} - {division.division}
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
                    T
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diff
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.ties}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.winPercentage.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.pointsFor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.pointsAgainst}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span
                        className={
                          team.pointsFor - team.pointsAgainst > 0
                            ? 'text-green-600 font-semibold'
                            : team.pointsFor - team.pointsAgainst < 0
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600'
                        }
                      >
                        {team.pointsFor - team.pointsAgainst > 0 ? '+' : ''}
                        {team.pointsFor - team.pointsAgainst}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function StandingsLoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <LoadingState message="Loading NFL standings..." />
      </div>
      <SkeletonTable rows={8} columns={8} />
      <SkeletonTable rows={8} columns={8} />
    </div>
  );
}

export default function NFLStandingsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <div className="mb-8">
          <span className="di-kicker">Diamond Insights · NFL</span>
          <h1 className="di-page-title">NFL Standings</h1>
          <p className="di-page-subtitle">
            Live NFL standings with automatic updates. Data refreshes every 5 minutes during game days.
          </p>
        </div>

        <ErrorBoundary
          fallback={
            <ApiErrorDisplay
              error="Failed to load NFL standings. Please try again later."
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
  title: 'NFL Standings | Diamond Insights',
  description: 'Live NFL standings with real-time updates and division rankings',
};
