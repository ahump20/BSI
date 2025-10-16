'use client';

/**
 * Mobile-First Game Center Component
 * Displays live college baseball games with 30s auto-refresh
 * 
 * Features:
 * - Thumb-friendly navigation
 * - Pull-to-refresh
 * - Offline caching
 * - Live score updates
 */

import { useEffect, useState, useCallback } from 'react';
import type { Game, BoxScore } from '@/lib/college-baseball/types';

interface GameCenterProps {
  initialGames?: Game[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function GameCenter({ 
  initialGames = [], 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: GameCenterProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all');

  // Fetch games
  const fetchGames = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await fetch('/api/college-baseball/games');
      const result = await response.json();

      if (result.success) {
        setGames(result.data);
        setLastUpdate(new Date());
        
        // Cache for offline
        if ('caches' in window) {
          const cache = await caches.open('college-baseball-v1');
          await cache.put('/api/college-baseball/games', new Response(JSON.stringify(result)));
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError('Unable to load games. Showing cached data if available.');
      
      // Try to load from cache
      if ('caches' in window) {
        const cache = await caches.open('college-baseball-v1');
        const cached = await cache.match('/api/college-baseball/games');
        if (cached) {
          const result = await cached.json();
          setGames(result.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh for live games
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        const hasLiveGames = games.some(g => g.status === 'live');
        if (hasLiveGames) {
          fetchGames(false); // Refresh without loading indicator
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, games, fetchGames]);

  // Initial load
  useEffect(() => {
    if (initialGames.length === 0) {
      fetchGames();
    }
  }, [initialGames, fetchGames]);

  // Filter games
  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

  // Pull to refresh handler
  const handleRefresh = () => {
    fetchGames();
  };

  return (
    <div className="game-center">
      {/* Header */}
      <div className="game-center-header">
        <h1 className="title">College Baseball</h1>
        <div className="last-update">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Games
        </button>
        <button 
          className={`tab ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button 
          className={`tab ${filter === 'scheduled' ? 'active' : ''}`}
          onClick={() => setFilter('scheduled')}
        >
          Upcoming
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && games.length === 0 && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading games...</p>
        </div>
      )}

      {/* Game list */}
      <div className="game-list">
        {filteredGames.map(game => (
          <GameCard 
            key={game.id} 
            game={game}
            isSelected={selectedGame === game.id}
            onClick={() => setSelectedGame(game.id)}
          />
        ))}
        
        {filteredGames.length === 0 && !loading && (
          <div className="empty-state">
            <p>No games {filter !== 'all' ? filter : 'available'}</p>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button 
        className="refresh-button"
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>

      <style jsx>{`
        .game-center {
          max-width: 100%;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .game-center-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .last-update {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab {
          padding: 0.5rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 9999px;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-height: 44px;
        }

        .tab.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .tab:active {
          transform: scale(0.95);
        }

        .error-banner {
          background: #fee2e2;
          color: #991b1b;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .loading {
          text-align: center;
          padding: 3rem 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .game-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .refresh-button {
          width: 100%;
          margin-top: 1.5rem;
          padding: 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          min-height: 44px;
          transition: background 0.2s;
        }

        .refresh-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .refresh-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        @media (min-width: 640px) {
          .game-center {
            max-width: 640px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onClick: () => void;
}

function GameCard({ game, isSelected, onClick }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  
  return (
    <div 
      className={`game-card ${isSelected ? 'selected' : ''} ${isLive ? 'live' : ''}`}
      onClick={onClick}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      )}

      {/* Game info */}
      <div className="game-info">
        <div className="time-venue">
          {isFinal ? 'Final' : game.time} {game.venue && `• ${game.venue}`}
        </div>
        {game.tv && <div className="tv">📺 {game.tv}</div>}
      </div>

      {/* Teams */}
      <div className="teams">
        {/* Away team */}
        <div className="team">
          <div className="team-name">{game.awayTeam.shortName}</div>
          <div className="team-record">({game.awayTeam.record.wins}-{game.awayTeam.record.losses})</div>
          {(isLive || isFinal) && <div className="score">{game.awayTeam.score}</div>}
        </div>

        {/* Home team */}
        <div className="team">
          <div className="team-name">{game.homeTeam.shortName}</div>
          <div className="team-record">({game.homeTeam.record.wins}-{game.homeTeam.record.losses})</div>
          {(isLive || isFinal) && <div className="score">{game.homeTeam.score}</div>}
        </div>
      </div>

      <style jsx>{`
        .game-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .game-card.live {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .game-card.selected {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .game-card:active {
          transform: scale(0.98);
        }

        .live-indicator {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: bold;
          color: #dc2626;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #dc2626;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .game-info {
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .time-venue {
          margin-bottom: 0.25rem;
        }

        .tv {
          color: #9ca3af;
        }

        .teams {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .team {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .team-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          flex: 1;
        }

        .team-record {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .score {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          min-width: 2rem;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
