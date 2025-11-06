'use client';

import { useState } from 'react';

interface PlayerProfile {
  bio: {
    mlbam_id: number;
    full_name: string;
    position?: string;
    team_name?: string;
    bat_side?: string;
    throw_arm?: string;
  };
  season_stats?: {
    stats: Record<string, any>;
  };
}

export default function PlayerComparisonPage() {
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [player1, setPlayer1] = useState<PlayerProfile | null>(null);
  const [player2, setPlayer2] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(new Date().getFullYear());

  async function loadPlayers() {
    if (!player1Id || !player2Id) {
      setError('Please enter both player IDs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const [response1, response2] = await Promise.all([
        fetch(`${apiUrl}/mlb/players/${player1Id}?season=${season}`),
        fetch(`${apiUrl}/mlb/players/${player2Id}?season=${season}`)
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to load players');
      }

      const data1 = await response1.json();
      const data2 = await response2.json();

      setPlayer1(data1);
      setPlayer2(data2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Define stats to compare
  const battingStats = ['AVG', 'OBP', 'SLG', 'OPS', 'HR', 'RBI', 'SB', 'wOBA', 'wRC+', 'WAR'];
  const pitchingStats = ['W', 'L', 'ERA', 'IP', 'SO', 'WHIP', 'FIP', 'K%', 'BB%', 'WAR'];

  const getStatValue = (player: PlayerProfile | null, stat: string): string | number => {
    if (!player || !player.season_stats || !player.season_stats.stats) return '-';
    const value = player.season_stats.stats[stat];
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number') {
      // Format numbers appropriately
      if (stat === 'AVG' || stat === 'OBP' || stat === 'SLG' || stat === 'OPS' || stat === 'wOBA') {
        return value.toFixed(3).replace(/^0\./, '.');
      }
      if (stat === 'ERA' || stat === 'FIP' || stat === 'WHIP' || stat === 'WAR') {
        return value.toFixed(2);
      }
      if (stat === 'K%' || stat === 'BB%') {
        return value.toFixed(1) + '%';
      }
      return value;
    }
    return value;
  };

  const compareValues = (val1: string | number, val2: string | number, higherIsBetter: boolean = true): number => {
    if (val1 === '-' || val2 === '-') return 0;
    const num1 = typeof val1 === 'number' ? val1 : parseFloat(val1.toString().replace('%', ''));
    const num2 = typeof val2 === 'number' ? val2 : parseFloat(val2.toString().replace('%', ''));

    if (higherIsBetter) {
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    } else {
      if (num1 < num2) return 1;
      if (num1 > num2) return -1;
    }
    return 0;
  };

  const areBothPitchers = player1?.bio.position === 'P' && player2?.bio.position === 'P';
  const statsToCompare = areBothPitchers ? pitchingStats : battingStats;

  // Stats where lower is better
  const lowerIsBetter = ['ERA', 'WHIP', 'FIP', 'BB%'];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Player Comparison Tool</h1>
          <p className="text-gray-400">
            Compare statistics and performance metrics between two MLB players
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Select Players</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Player 1 ID</label>
              <input
                type="text"
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                placeholder="e.g., 545361"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Player 2 ID</label>
              <input
                type="text"
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                placeholder="e.g., 660271"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                onClick={loadPlayers}
                disabled={loading}
                className="w-full px-8 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Compare Players'}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            Tip: Find player IDs by searching on the <a href="/baseball/mlb/players" className="text-orange-500 hover:text-orange-400">Players page</a>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Comparison Results */}
        {player1 && player2 && (
          <>
            {/* Player Headers */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Player 1 Card */}
              <div className="bg-gray-900 rounded-lg p-8">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold mb-2">{player1.bio.full_name}</h2>
                  <p className="text-xl text-orange-500">
                    {player1.bio.position} • {player1.bio.team_name || 'Free Agent'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {player1.bio.bat_side && (
                    <div>
                      <div className="text-gray-400">Bats</div>
                      <div className="font-semibold">{player1.bio.bat_side}</div>
                    </div>
                  )}
                  {player1.bio.throw_arm && (
                    <div>
                      <div className="text-gray-400">Throws</div>
                      <div className="font-semibold">{player1.bio.throw_arm}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="bg-gray-900 rounded-lg p-8">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold mb-2">{player2.bio.full_name}</h2>
                  <p className="text-xl text-orange-500">
                    {player2.bio.position} • {player2.bio.team_name || 'Free Agent'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {player2.bio.bat_side && (
                    <div>
                      <div className="text-gray-400">Bats</div>
                      <div className="font-semibold">{player2.bio.bat_side}</div>
                    </div>
                  )}
                  {player2.bio.throw_arm && (
                    <div>
                      <div className="text-gray-400">Throws</div>
                      <div className="font-semibold">{player2.bio.throw_arm}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Comparison Table */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-lg">
                      {player1.bio.full_name.split(' ')[player1.bio.full_name.split(' ').length - 1]}
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-lg">Stat</th>
                    <th className="px-6 py-4 text-center font-bold text-lg">
                      {player2.bio.full_name.split(' ')[player2.bio.full_name.split(' ').length - 1]}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {statsToCompare.map((stat) => {
                    const val1 = getStatValue(player1, stat);
                    const val2 = getStatValue(player2, stat);
                    const comparison = compareValues(val1, val2, !lowerIsBetter.includes(stat));

                    return (
                      <tr key={stat} className="hover:bg-gray-800 transition">
                        <td className={`px-6 py-4 text-center text-xl font-bold ${
                          comparison === 1 ? 'text-green-500' : comparison === -1 ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {val1}
                          {comparison === 1 && <span className="ml-2">✓</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-orange-500">{stat}</td>
                        <td className={`px-6 py-4 text-center text-xl font-bold ${
                          comparison === -1 ? 'text-green-500' : comparison === 1 ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {val2}
                          {comparison === -1 && <span className="ml-2">✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="bg-gray-900 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold mb-4">How to Read This Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <span className="text-green-500">✓ Green values</span> indicate the better stat in each category
                </div>
                <div>
                  <span className="text-gray-500">Gray values</span> indicate the lower stat in each category
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!player1 && !player2 && !loading && (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">Enter two player IDs above to begin comparison</p>
            <p className="text-sm text-gray-500">
              You can find player IDs by using the player search feature
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
