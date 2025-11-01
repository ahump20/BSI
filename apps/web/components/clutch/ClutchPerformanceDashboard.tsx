/**
 * Clutch Performance Dashboard Component
 *
 * Displays comprehensive clutch performance analytics with wearables integration:
 * - Performance timeline with HRV/recovery overlay
 * - Clutch score trends
 * - Wearables correlation analysis
 * - Game-by-game breakdown
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LineChart } from '../charts/LineChart';

// ============================================================================
// TYPES
// ============================================================================

interface ClutchPerformanceDashboardProps {
  playerId: string;
  season?: string;
}

interface PlayerInfo {
  player_id: string;
  full_name: string;
  team_id: string;
  position: string;
}

interface ClutchGame {
  score_id: string;
  game_id: string;
  game_date: string;
  home_team_name: string;
  away_team_name: string;
  clutch_score: number;
  points_over_expected: number;
  success_rate: number;
  hrv_rmssd_pregame: number | null;
  hrv_baseline_deviation: number | null;
  recovery_score_pregame: number | null;
  has_wearables_data: boolean;
}

interface Summary {
  total_games: number;
  games_with_wearables: number;
  avg_clutch_score: number;
  avg_points_over_expected: number;
}

interface DashboardData {
  player: PlayerInfo;
  season: string;
  summary: Summary;
  games: ClutchGame[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClutchPerformanceDashboard({
  playerId,
  season,
}: ClutchPerformanceDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWearablesOnly, setShowWearablesOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, [playerId, season, showWearablesOnly]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season);
      if (showWearablesOnly) params.append('include_wearables_only', 'true');

      const response = await fetch(
        `/api/players/${playerId}/clutch-performance?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch clutch performance data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading clutch performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.player?.full_name || 'Unknown Player'}
            </h1>
            <p className="text-gray-600 mt-1">
              {data.season} Season • {data.player?.position}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">
              {data.summary.avg_clutch_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Clutch Score</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Clutch Games"
          value={data.summary.total_games}
          subtitle="Total situations"
        />
        <SummaryCard
          title="With Wearables"
          value={data.summary.games_with_wearables}
          subtitle={`${((data.summary.games_with_wearables / data.summary.total_games) * 100).toFixed(0)}% coverage`}
        />
        <SummaryCard
          title="Avg Clutch Score"
          value={data.summary.avg_clutch_score.toFixed(1)}
          subtitle="0-100 scale"
        />
        <SummaryCard
          title="Avg POE"
          value={data.summary.avg_points_over_expected.toFixed(2)}
          subtitle="Points over expected"
          valueColor={data.summary.avg_points_over_expected >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showWearablesOnly}
            onChange={(e) => setShowWearablesOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Show only games with wearables data
          </span>
        </label>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Performance Timeline
        </h2>
        <ClutchTimelineChart games={data.games} />
      </div>

      {/* Wearables Correlation */}
      {data.summary.games_with_wearables > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Wearables Correlation
          </h2>
          <WearablesCorrelationChart games={data.games.filter(g => g.has_wearables_data)} />
        </div>
      )}

      {/* Game Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Game-by-Game</h2>
        <ClutchGamesTable games={data.games} />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SummaryCard({
  title,
  value,
  subtitle,
  valueColor = 'text-gray-900',
}: {
  title: string;
  value: string | number;
  subtitle: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function ClutchTimelineChart({ games }: { games: ClutchGame[] }) {
  // Prepare data for chart
  const chartData = games.map((game) => ({
    date: new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clutch_score: game.clutch_score,
    poe: game.points_over_expected,
    hrv_deviation: game.hrv_baseline_deviation,
    recovery: game.recovery_score_pregame,
  })).reverse(); // Reverse to show chronological order

  return (
    <div className="h-80">
      <LineChart
        data={chartData}
        xKey="date"
        yKeys={['clutch_score', 'poe']}
        colors={['#3b82f6', '#10b981']}
        labels={['Clutch Score', 'POE']}
      />
    </div>
  );
}

function WearablesCorrelationChart({ games }: { games: ClutchGame[] }) {
  // Calculate correlations
  const withHRV = games.filter(g => g.hrv_baseline_deviation !== null);
  const withRecovery = games.filter(g => g.recovery_score_pregame !== null);

  // Group by HRV deviation ranges
  const hrvRanges = [
    { label: '<-20% (Stressed)', min: -100, max: -20, color: 'bg-red-500' },
    { label: '-20% to 0%', min: -20, max: 0, color: 'bg-yellow-500' },
    { label: '0% to +20%', min: 0, max: 20, color: 'bg-green-500' },
    { label: '>+20% (Recovered)', min: 20, max: 100, color: 'bg-blue-500' },
  ];

  const hrvData = hrvRanges.map(range => {
    const gamesInRange = withHRV.filter(g =>
      g.hrv_baseline_deviation! >= range.min && g.hrv_baseline_deviation! < range.max
    );
    const avgClutch = gamesInRange.length > 0
      ? gamesInRange.reduce((sum, g) => sum + g.clutch_score, 0) / gamesInRange.length
      : 0;

    return {
      ...range,
      count: gamesInRange.length,
      avgClutch: avgClutch.toFixed(1),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          HRV Deviation vs Clutch Score
        </h3>
        <div className="space-y-2">
          {hrvData.map((range, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className={`w-24 h-8 ${range.color} rounded flex items-center justify-center text-white text-sm font-medium`}>
                {range.avgClutch}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{range.label}</div>
                <div className="text-xs text-gray-500">{range.count} games</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {withHRV.length > 0 ? (
            <>
              <strong>Insight:</strong> Players with HRV &gt;20% above baseline tend to perform{' '}
              {hrvData[3].avgClutch > hrvData[0].avgClutch ? 'better' : 'worse'} in clutch situations.
            </>
          ) : (
            'Not enough wearables data for correlation analysis.'
          )}
        </p>
      </div>
    </div>
  );
}

function ClutchGamesTable({ games }: { games: ClutchGame[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Opponent
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clutch Score
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              POE
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Success Rate
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              HRV Dev
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recovery
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {games.map((game) => (
            <tr key={game.score_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {new Date(game.game_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {game.home_team_name} vs {game.away_team_name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold">
                {game.clutch_score.toFixed(1)}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                game.points_over_expected >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {game.points_over_expected >= 0 ? '+' : ''}{game.points_over_expected.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {(game.success_rate * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {game.hrv_baseline_deviation !== null ? (
                  <span className={
                    game.hrv_baseline_deviation >= 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {game.hrv_baseline_deviation >= 0 ? '+' : ''}{game.hrv_baseline_deviation.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {game.recovery_score_pregame !== null ? (
                  `${game.recovery_score_pregame.toFixed(0)}%`
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClutchPerformanceDashboard;
