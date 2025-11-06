'use client';

import { useState, useEffect } from 'react';
import SprayChart from '@/components/mlb/SprayChart';
import PitchMovementPlot from '@/components/mlb/PitchMovementPlot';
import VelocityDistribution from '@/components/mlb/VelocityDistribution';

interface StatcastPageProps {
  params: {
    playerId: string;
  };
}

interface StatcastData {
  player_id: number;
  player_name: string;
  season: number;
  metrics: Array<Record<string, any>>;
}

export default function PlayerVisualizationsPage({ params }: StatcastPageProps) {
  const [statcastData, setStatcastData] = useState<StatcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 2, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isPitcher, setIsPitcher] = useState(false);

  useEffect(() => {
    // Determine if player is a pitcher
    fetchPlayerType();
  }, [params.playerId]);

  useEffect(() => {
    if (isPitcher !== undefined) {
      fetchStatcastData();
    }
  }, [params.playerId, dateRange, isPitcher]);

  async function fetchPlayerType() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/mlb/players/${params.playerId}`);

      if (response.ok) {
        const data = await response.json();
        setIsPitcher(data.bio.position === 'P');
      }
    } catch (err) {
      console.error('Error fetching player type:', err);
    }
  }

  async function fetchStatcastData() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/mlb/players/${params.playerId}/statcast?start_date=${dateRange.start}&end_date=${dateRange.end}&is_pitcher=${isPitcher}`
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

  // Prepare data for different visualizations
  const prepareSprayChartData = () => {
    if (!statcastData || !statcastData.metrics) return [];

    return statcastData.metrics
      .filter(m => m.hc_x && m.hc_y) // Filter for hits with coordinates
      .map(m => ({
        hit_x: m.hc_x || 0,
        hit_y: m.hc_y || 0,
        exit_velocity: m.launch_speed,
        launch_angle: m.launch_angle,
        hit_type: m.bb_type,
        outcome: m.events || m.description
      }));
  };

  const preparePitchMovementData = () => {
    if (!statcastData || !statcastData.metrics) return [];

    return statcastData.metrics
      .filter(m => m.pfx_x !== undefined && m.pfx_z !== undefined)
      .map(m => ({
        pitch_type: m.pitch_type || 'UN',
        horizontal_break: (m.pfx_x || 0) * 12, // Convert to inches
        induced_vertical_break: (m.pfx_z || 0) * 12, // Convert to inches
        velocity: m.release_speed || m.effective_speed || 0,
        spin_rate: m.release_spin_rate
      }));
  };

  const prepareVelocityData = () => {
    if (!statcastData || !statcastData.metrics) return [];

    return statcastData.metrics
      .filter(m => (m.release_speed || m.effective_speed))
      .map(m => ({
        pitch_type: m.pitch_type || 'UN',
        velocity: m.release_speed || m.effective_speed || 0
      }));
  };

  const sprayChartData = prepareSprayChartData();
  const pitchMovementData = preparePitchMovementData();
  const velocityData = prepareVelocityData();

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
            {statcastData?.player_name || `Player ${params.playerId}`} - Advanced Visualizations
          </h1>
          <p className="text-gray-400">
            Interactive charts and plots powered by MLB Statcast technology
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
            <p className="text-gray-400">Loading visualizations...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Visualizations */}
        {!loading && !error && statcastData && (
          <div className="space-y-8">
            {/* Spray Chart (for batters) */}
            {!isPitcher && sprayChartData.length > 0 && (
              <SprayChart data={sprayChartData} />
            )}

            {/* Pitch Movement Plot (for pitchers) */}
            {isPitcher && pitchMovementData.length > 0 && (
              <PitchMovementPlot data={pitchMovementData} />
            )}

            {/* Velocity Distribution (for pitchers) */}
            {isPitcher && velocityData.length > 0 && (
              <VelocityDistribution data={velocityData} />
            )}

            {/* No Data Message */}
            {statcastData.metrics.length === 0 && (
              <div className="bg-gray-900 rounded-lg p-12 text-center">
                <p className="text-gray-400">No Statcast data available for the selected date range</p>
              </div>
            )}

            {/* Data Info */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Data Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Total Events</div>
                  <div className="text-2xl font-bold text-orange-500">
                    {statcastData.metrics.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Date Range</div>
                  <div className="text-sm font-semibold">
                    {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Player Type</div>
                  <div className="text-sm font-semibold">
                    {isPitcher ? 'Pitcher' : 'Position Player'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Season</div>
                  <div className="text-sm font-semibold">{statcastData.season}</div>
                </div>
              </div>
            </div>

            {/* About Statcast */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">About These Visualizations</h3>
              <div className="text-gray-400 space-y-3 text-sm">
                {!isPitcher && (
                  <div>
                    <strong className="text-white">Spray Chart:</strong> Shows the location of all batted balls
                    on the field. Color indicates outcome (HR, XBH, Single, Out). Size indicates exit velocity.
                  </div>
                )}
                {isPitcher && (
                  <>
                    <div>
                      <strong className="text-white">Pitch Movement Plot:</strong> Displays horizontal and vertical
                      break of each pitch type. The ⊕ symbol shows the average movement for that pitch.
                    </div>
                    <div>
                      <strong className="text-white">Velocity Distribution:</strong> Histogram showing velocity
                      ranges for each pitch type, helping identify command consistency.
                    </div>
                  </>
                )}
                <div>
                  All data powered by MLB's Statcast technology, which uses high-resolution cameras and
                  radar equipment to track every movement on the field.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
