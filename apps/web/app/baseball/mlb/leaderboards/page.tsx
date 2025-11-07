'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  team?: string;
  position?: string;
  stats: Record<string, any>;
}

interface LeaderboardResponse {
  stat_type: string;
  season: number;
  generated_at: string;
  entries: LeaderboardEntry[];
  total_count: number;
}

export default function MLBLeaderboardsPage() {
  const [statType, setStatType] = useState<'batting' | 'pitching'>('batting');
  const [season, setSeason] = useState(new Date().getFullYear());
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [statType, season]);

  async function fetchLeaderboard() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/mlb/leaderboards/${statType}?season=${season}&limit=100`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Define key stats to display based on stat type
  const keyStats = statType === 'batting'
    ? ['AVG', 'HR', 'RBI', 'OBP', 'SLG', 'OPS', 'wOBA', 'wRC+', 'WAR']
    : ['W', 'L', 'ERA', 'IP', 'SO', 'WHIP', 'FIP', 'K%', 'BB%', 'WAR'];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">MLB Leaderboards</h1>
          <p className="text-gray-400">
            Advanced statistics and traditional metrics for MLB players
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Stat Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatType('batting')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  statType === 'batting'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Batting
              </button>
              <button
                onClick={() => setStatType('pitching')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  statType === 'pitching'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Pitching
              </button>
            </div>

            {/* Season Selector */}
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year} Season
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && leaderboard && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left font-semibold">Player</th>
                    <th className="px-4 py-3 text-left font-semibold">Team</th>
                    {statType === 'batting' && <th className="px-4 py-3 text-left font-semibold">Pos</th>}
                    {keyStats.map((stat) => (
                      <th key={stat} className="px-4 py-3 text-center font-semibold">
                        {stat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.rank}
                      className="hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => window.location.href = `/baseball/mlb/players/${entry.player_id}`}
                    >
                      <td className="px-4 py-3 font-semibold text-orange-500">{entry.rank}</td>
                      <td className="px-4 py-3 font-semibold">{entry.player_name}</td>
                      <td className="px-4 py-3 text-gray-400">{entry.team || '-'}</td>
                      {statType === 'batting' && (
                        <td className="px-4 py-3 text-gray-400">{entry.position || '-'}</td>
                      )}
                      {keyStats.map((stat) => {
                        const value = entry.stats[stat];
                        const formattedValue =
                          value !== undefined && value !== null
                            ? typeof value === 'number'
                              ? value.toFixed(3).replace(/^0\./, '.')
                              : value
                            : '-';

                        return (
                          <td key={stat} className="px-4 py-3 text-center">
                            {formattedValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="bg-gray-800 px-6 py-4 text-sm text-gray-400">
              <p>
                Showing {leaderboard.entries.length} of {leaderboard.total_count} players •
                Data updated: {new Date(leaderboard.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Stats Legend */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Advanced Stats Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {statType === 'batting' ? (
              <>
                <div>
                  <strong className="text-orange-500">wOBA</strong> - Weighted On-Base Average: Measures a player's overall offensive value
                </div>
                <div>
                  <strong className="text-orange-500">wRC+</strong> - Weighted Runs Created Plus: League/park adjusted offensive performance (100 = average)
                </div>
                <div>
                  <strong className="text-orange-500">OPS</strong> - On-Base Plus Slugging: Combined measure of getting on base and power
                </div>
                <div>
                  <strong className="text-orange-500">WAR</strong> - Wins Above Replacement: Total player value in wins
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong className="text-orange-500">FIP</strong> - Fielding Independent Pitching: ERA estimator based on K, BB, HR
                </div>
                <div>
                  <strong className="text-orange-500">K%</strong> - Strikeout Percentage: Percentage of batters faced that strike out
                </div>
                <div>
                  <strong className="text-orange-500">BB%</strong> - Walk Percentage: Percentage of batters faced that walk
                </div>
                <div>
                  <strong className="text-orange-500">WHIP</strong> - Walks plus Hits per Inning Pitched: Lower is better
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
