import React, { useState, useEffect } from 'react';

interface LiveGame {
  id: string;
  home_team: string;
  away_team: string;
  home_division: string;
  away_division: string;
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
  home_epa: number;
  away_epa: number;
  home_success_rate: number;
  away_success_rate: number;
  home_win_probability: number;
  upset_probability: number;
}

interface LiveGamesWidgetProps {
  apiBaseUrl?: string;
  refreshInterval?: number;
  className?: string;
}

/**
 * Live College Football Games Widget
 *
 * Displays real-time CFB games with FCS/Group-of-Five priority,
 * EPA analytics, and upset probability alerts.
 */
export function LiveGamesWidget({
  apiBaseUrl = 'https://blaze-cfb-intelligence.workers.dev',
  refreshInterval = 30000, // 30 seconds
  className = ''
}: LiveGamesWidgetProps) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchGames = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/cfb/games/live`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setGames(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch live games:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();

    const interval = setInterval(fetchGames, refreshInterval);

    return () => clearInterval(interval);
  }, [apiBaseUrl, refreshInterval]);

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (loading) {
    return (
      <div className={`live-games-widget ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading live games...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`live-games-widget ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Failed to load games
              </h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchGames}
            className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`live-games-widget ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Live College Football
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
            <span>Live</span>
          </div>
          {lastUpdate && (
            <span className="ml-3 text-gray-400">
              Updated {formatTimeAgo(lastUpdate)}
            </span>
          )}
        </div>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No live games
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back during game days for live updates.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Game Card Component
 */
function GameCard({ game }: { game: LiveGame }) {
  const isUpsetAlert = game.upset_probability > 0.3;
  const winningTeam =
    game.home_score > game.away_score
      ? 'home'
      : game.away_score > game.home_score
      ? 'away'
      : null;

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
        isUpsetAlert ? 'ring-2 ring-orange-500' : ''
      }`}
    >
      {/* Upset Alert Badge */}
      {isUpsetAlert && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center animate-pulse">
            <span className="mr-1">🚨</span>
            UPSET ALERT
          </div>
        </div>
      )}

      {/* Game Status Bar */}
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
        <div className="flex items-center justify-between">
          <span>
            Q{game.quarter} - {game.time_remaining}
          </span>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5"></div>
            <span className="text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="p-4">
        {/* Away Team */}
        <div
          className={`flex items-center justify-between py-3 ${
            winningTeam === 'away' ? 'font-bold' : ''
          }`}
        >
          <div className="flex-1">
            <div className="text-lg">{game.away_team}</div>
            <div className="text-xs text-gray-500">{game.away_division}</div>
          </div>
          <div className="text-2xl font-bold ml-4">{game.away_score}</div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-1"></div>

        {/* Home Team */}
        <div
          className={`flex items-center justify-between py-3 ${
            winningTeam === 'home' ? 'font-bold' : ''
          }`}
        >
          <div className="flex-1">
            <div className="text-lg">{game.home_team}</div>
            <div className="text-xs text-gray-500">{game.home_division}</div>
          </div>
          <div className="text-2xl font-bold ml-4">{game.home_score}</div>
        </div>
      </div>

      {/* Analytics Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">EPA</div>
            <div className="font-medium">
              {game.away_epa > game.home_epa ? (
                <span className="text-blue-600">
                  {game.away_team.split(' ').pop()}: +
                  {Math.abs(game.away_epa).toFixed(2)}
                </span>
              ) : (
                <span className="text-blue-600">
                  {game.home_team.split(' ').pop()}: +
                  {Math.abs(game.home_epa).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Win Prob</div>
            <div className="font-medium">
              <span className="text-green-600">
                {(game.home_win_probability * 100).toFixed(0)}% Home
              </span>
            </div>
          </div>
        </div>

        {/* Upset Probability */}
        {isUpsetAlert && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Upset Probability</span>
              <span className="font-bold text-orange-600">
                {(game.upset_probability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${game.upset_probability * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
