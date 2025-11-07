'use client';

import { useState, useEffect } from 'react';

interface StatcastMetrics {
  player_id: number;
  player_name: string;
  season: number;
  exit_velocity_avg?: number;
  launch_angle_avg?: number;
  barrel_rate?: number;
  hard_hit_rate?: number;
  whiff_rate?: number;
  chase_rate?: number;
  metrics: Array<Record<string, any>>;
}

interface StatcastPageProps {
  params: {
    playerId: string;
  };
}

export default function PlayerStatcastPage({ params }: StatcastPageProps) {
  const [statcastData, setStatcastData] = useState<StatcastMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 2, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStatcastData();
  }, [params.playerId, dateRange]);

  async function fetchStatcastData() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/mlb/players/${params.playerId}/statcast?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Statcast data');
      }

      const data = await response.json();
      setStatcastData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Calculate summary statistics from the metrics array
  const calculateSummaryStats = () => {
    if (!statcastData || !statcastData.metrics || statcastData.metrics.length === 0) {
      return null;
    }

    const metrics = statcastData.metrics;
    const launchSpeeds = metrics.filter(m => m.launch_speed).map(m => m.launch_speed);
    const launchAngles = metrics.filter(m => m.launch_angle).map(m => m.launch_angle);

    return {
      totalEvents: metrics.length,
      avgExitVelocity: launchSpeeds.length > 0
        ? (launchSpeeds.reduce((a, b) => a + b, 0) / launchSpeeds.length).toFixed(1)
        : 'N/A',
      maxExitVelocity: launchSpeeds.length > 0 ? Math.max(...launchSpeeds).toFixed(1) : 'N/A',
      avgLaunchAngle: launchAngles.length > 0
        ? (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(1)
        : 'N/A',
      hardHitRate: launchSpeeds.length > 0
        ? ((launchSpeeds.filter(v => v >= 95).length / launchSpeeds.length) * 100).toFixed(1)
        : 'N/A'
    };
  };

  const summaryStats = calculateSummaryStats();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href={`/baseball/mlb/players/${params.playerId}`}
             className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to Player Profile
          </a>
          <h1 className="text-4xl font-bold mb-2">
            {statcastData?.player_name || `Player ${params.playerId}`} - Statcast Analysis
          </h1>
          <p className="text-gray-400">
            Advanced tracking data powered by MLB Statcast
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchStatcastData}
                className="w-full px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition"
              >
                Update Range
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-400">Loading Statcast data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Statcast Data */}
        {!loading && !error && statcastData && (
          <>
            {/* Summary Stats */}
            {summaryStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="text-gray-400 text-sm mb-2">Total Events</div>
                  <div className="text-3xl font-bold text-orange-500">{summaryStats.totalEvents}</div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="text-gray-400 text-sm mb-2">Avg Exit Velo</div>
                  <div className="text-3xl font-bold text-orange-500">
                    {summaryStats.avgExitVelocity}
                    {summaryStats.avgExitVelocity !== 'N/A' && <span className="text-lg text-gray-400 ml-1">mph</span>}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="text-gray-400 text-sm mb-2">Max Exit Velo</div>
                  <div className="text-3xl font-bold text-orange-500">
                    {summaryStats.maxExitVelocity}
                    {summaryStats.maxExitVelocity !== 'N/A' && <span className="text-lg text-gray-400 ml-1">mph</span>}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="text-gray-400 text-sm mb-2">Avg Launch Angle</div>
                  <div className="text-3xl font-bold text-orange-500">
                    {summaryStats.avgLaunchAngle}
                    {summaryStats.avgLaunchAngle !== 'N/A' && <span className="text-lg text-gray-400 ml-1">°</span>}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="text-gray-400 text-sm mb-2">Hard Hit Rate</div>
                  <div className="text-3xl font-bold text-orange-500">
                    {summaryStats.hardHitRate}
                    {summaryStats.hardHitRate !== 'N/A' && <span className="text-lg text-gray-400 ml-1">%</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Exit Velocity Distribution */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Exit Velocity Distribution</h3>
                <div className="text-gray-400">
                  <p className="mb-2">Exit velocity measures how hard the ball is hit off the bat.</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong className="text-orange-500">95+ mph:</strong> Hard hit ball</li>
                    <li>• <strong className="text-orange-500">100+ mph:</strong> Elite contact</li>
                    <li>• League average: ~88 mph</li>
                  </ul>
                </div>
              </div>

              {/* Launch Angle Distribution */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Launch Angle Optimization</h3>
                <div className="text-gray-400">
                  <p className="mb-2">Launch angle determines ball trajectory.</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong className="text-orange-500">10-30°:</strong> Optimal for power</li>
                    <li>• <strong className="text-orange-500">25-30°:</strong> Home run zone</li>
                    <li>• League average: ~12°</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Recent Events Table */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Recent Batted Balls</h3>

              {statcastData.metrics && statcastData.metrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Pitch Type</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Exit Velo</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Launch Angle</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Distance</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {statcastData.metrics.slice(0, 50).map((event, idx) => (
                        <tr key={idx} className="hover:bg-gray-800 transition">
                          <td className="px-4 py-3 text-sm">{event.game_date || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">{event.pitch_type || 'N/A'}</td>
                          <td className="px-4 py-3 text-center font-semibold text-orange-500">
                            {event.launch_speed ? `${event.launch_speed.toFixed(1)} mph` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-orange-500">
                            {event.launch_angle ? `${event.launch_angle.toFixed(1)}°` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {event.hit_distance_sc ? `${event.hit_distance_sc} ft` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">{event.events || event.description || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No batted ball events found for this date range</p>
              )}
            </div>

            {/* Statcast Info */}
            <div className="bg-gray-900 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold mb-4">About Statcast</h3>
              <p className="text-gray-400 mb-4">
                Statcast is MLB's advanced tracking technology that measures previously unmeasurable aspects of the game.
                Using high-resolution cameras and radar equipment, Statcast tracks the location and movements of the ball
                and every player on the field.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-orange-500 mb-2">Exit Velocity</h4>
                  <p className="text-gray-400">Speed of the ball off the bat, measured in mph</p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-500 mb-2">Launch Angle</h4>
                  <p className="text-gray-400">Vertical angle at which the ball leaves the bat</p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-500 mb-2">Barrel Rate</h4>
                  <p className="text-gray-400">Percentage of "barreled" balls (optimal contact)</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
