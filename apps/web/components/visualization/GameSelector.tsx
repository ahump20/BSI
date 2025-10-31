'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Game {
  gameId: string;
  gameName: string;
  gameDate: string;
  status: string;
}

interface GameSelectorProps {
  currentGameId?: string;
}

export default function GameSelector({ currentGameId }: GameSelectorProps) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function loadGames() {
      try {
        const response = await fetch('/api/visualization/games');
        const data = await response.json();
        setGames(data.games || []);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  const handleGameSelect = (gameId: string) => {
    router.push(`/baseball/visualization/${gameId}`);
  };

  const handleSync = async (gameId: string) => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/visualization/sync/${gameId}`);
      const data = await response.json();

      if (data.success) {
        alert(`Successfully synced ${data.pitchCount} pitches for this game!`);
        // Reload the page to show new data
        window.location.reload();
      } else {
        alert('Failed to sync game data. Please try again.');
      }
    } catch (error) {
      console.error('Error syncing game:', error);
      alert('Error syncing game data.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <p className="text-white text-sm">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-md">
      <h3 className="text-white text-lg font-bold mb-3">Select Game</h3>

      {games.length === 0 ? (
        <p className="text-gray-400 text-sm">No games available today</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {games.map((game) => (
            <div
              key={game.gameId}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                currentGameId === game.gameId
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div onClick={() => handleGameSelect(game.gameId)}>
                <div className="text-white font-semibold text-sm">
                  {game.gameName}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {new Date(game.gameDate).toLocaleString()} • {game.status}
                </div>
              </div>

              {currentGameId === game.gameId && (
                <button
                  onClick={() => handleSync(game.gameId)}
                  disabled={syncing}
                  className="mt-2 w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? 'Syncing...' : 'Sync Latest Data'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-gray-500 text-xs">
          Viewing demo data for: <span className="text-white font-mono">{currentGameId || 'demo_game_2024'}</span>
        </p>
      </div>
    </div>
  );
}
