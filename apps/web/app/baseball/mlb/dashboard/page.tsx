'use client';

import { useState, useEffect } from 'react';

interface GameInfo {
  game_pk: number;
  game_date: string;
  game_time?: string;
  status: string;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  venue?: string;
  home_score?: number;
  away_score?: number;
}

interface ScheduleResponse {
  start_date: string;
  end_date: string;
  games: GameInfo[];
}

interface StatLeader {
  player_name: string;
  player_id: number;
  team?: string;
  value: number;
  stat: string;
}

export default function MLBDashboardPage() {
  const [todaysGames, setTodaysGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchTodaysGames();
    // Refresh every 60 seconds
    const interval = setInterval(fetchTodaysGames, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTodaysGames() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/mlb/schedule?start_date=${today}&end_date=${today}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data: ScheduleResponse = await response.json();
      setTodaysGames(data.games);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    if (status.includes('Final')) return 'text-gray-400';
    if (status.includes('Live') || status.includes('In Progress')) return 'text-green-500';
    if (status.includes('Scheduled') || status.includes('Pre-Game')) return 'text-orange-500';
    if (status.includes('Postponed') || status.includes('Cancelled')) return 'text-red-500';
    return 'text-gray-400';
  }

  function getStatusBadgeColor(status: string): string {
    if (status.includes('Final')) return 'bg-gray-700 text-gray-300';
    if (status.includes('Live') || status.includes('In Progress')) return 'bg-green-900 text-green-300';
    if (status.includes('Scheduled') || status.includes('Pre-Game')) return 'bg-orange-900 text-orange-300';
    if (status.includes('Postponed') || status.includes('Cancelled')) return 'bg-red-900 text-red-300';
    return 'bg-gray-700 text-gray-300';
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">MLB Live Dashboard</h1>
          <p className="text-gray-400">
            Real-time scores, statistics, and game updates
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Games Today</div>
            <div className="text-3xl font-bold text-orange-500">{todaysGames.length}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">In Progress</div>
            <div className="text-3xl font-bold text-green-500">
              {todaysGames.filter(g => g.status.includes('Live') || g.status.includes('In Progress')).length}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Final</div>
            <div className="text-3xl font-bold text-gray-500">
              {todaysGames.filter(g => g.status.includes('Final')).length}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Scheduled</div>
            <div className="text-3xl font-bold text-orange-500">
              {todaysGames.filter(g => g.status.includes('Scheduled') || g.status.includes('Pre-Game')).length}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <a href="/baseball/mlb/leaderboards"
             className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
            Leaderboards
          </a>
          <a href="/baseball/mlb/standings"
             className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
            Standings
          </a>
          <a href="/baseball/mlb/teams"
             className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
            Teams
          </a>
          <a href="/baseball/mlb/players"
             className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
            Players
          </a>
        </div>

        {/* Today's Games */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Today's Games</h2>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <p className="text-gray-400">Loading games...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchTodaysGames}
                className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && todaysGames.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No games scheduled for today</p>
            </div>
          )}

          {!loading && !error && todaysGames.length > 0 && (
            <div className="space-y-4">
              {todaysGames.map((game) => (
                <div
                  key={game.game_pk}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer"
                  onClick={() => window.location.href = `/baseball/mlb/games/${game.game_pk}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(game.status)}`}>
                        {game.status}
                      </span>
                      {game.game_time && (
                        <span className="text-gray-400 text-sm">{game.game_time}</span>
                      )}
                    </div>
                    {game.venue && (
                      <span className="text-gray-400 text-sm">{game.venue}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Away Team */}
                    <div className="text-right">
                      <div className="text-lg font-semibold">{game.away_team}</div>
                    </div>

                    {/* Score */}
                    <div className="text-center">
                      {(game.away_score !== undefined && game.home_score !== undefined) ? (
                        <div className="text-3xl font-bold">
                          <span className={game.away_score > (game.home_score || 0) ? 'text-orange-500' : 'text-gray-400'}>
                            {game.away_score}
                          </span>
                          <span className="text-gray-600 mx-2">-</span>
                          <span className={game.home_score > (game.away_score || 0) ? 'text-orange-500' : 'text-gray-400'}>
                            {game.home_score}
                          </span>
                        </div>
                      ) : (
                        <div className="text-2xl text-gray-600">vs</div>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="text-left">
                      <div className="text-lg font-semibold">{game.home_team}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Batting Leaders */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Batting Leaders</h2>
            <p className="text-gray-400 text-sm mb-4">Top performers this season</p>
            <a href="/baseball/mlb/leaderboards"
               className="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition">
              View Full Leaderboard
            </a>
          </div>

          {/* Pitching Leaders */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Pitching Leaders</h2>
            <p className="text-gray-400 text-sm mb-4">Top pitchers this season</p>
            <a href="/baseball/mlb/leaderboards"
               className="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition">
              View Full Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
