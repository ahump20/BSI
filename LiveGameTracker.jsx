import React, { useState } from 'react';
import './LiveGameTracker.css';
import WinProbabilityTimeline from './components/WinProbabilityTimeline';
import PitchTunnelOverlay from './components/PitchTunnelOverlay';

function LiveGameTracker({ games, onGameSelect, loading }) {
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [pitchTunnelVisibility, setPitchTunnelVisibility] = useState({});

  const handleExpandToggle = (gameId) => {
    setExpandedGameId((previous) => {
      if (previous === gameId) {
        setPitchTunnelVisibility((state) => ({ ...state, [gameId]: false }));
        return null;
      }
      return gameId;
    });
  };

  const handlePitchTunnelToggle = (gameId) => {
    setExpandedGameId(gameId);
    setPitchTunnelVisibility((state) => ({
      ...state,
      [gameId]: !state[gameId],
    }));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading live games...</p>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="empty-state">
        <p>No live games right now</p>
        <span className="empty-icon">⚾</span>
      </div>
    );
  }

  const getGameStatus = (game) => {
    if (game.status === 'live') {
      return `${game.inning.half} ${game.inning.number}`;
    }
    if (game.status === 'final') {
      return 'Final';
    }
    return game.scheduledTime;
  };

  const getGameStatusClass = (status) => {
    if (status === 'live') return 'status-live';
    if (status === 'final') return 'status-final';
    return 'status-scheduled';
  };

  return (
    <div className="live-game-tracker">
      <div className="games-header">
        <h2>Live Games</h2>
        <span className="live-indicator">● LIVE</span>
      </div>
      
      <div className="games-list">
        {games.map((game) => (
          <div key={game.id} className={`game-card ${getGameStatusClass(game.status)}`}>
            <div className="game-status">
              <span className="status-text">{getGameStatus(game)}</span>
              {game.status === 'live' && game.situation && (
                <span className="situation">
                  {game.situation.outs} Out · {game.situation.runners}
                </span>
              )}
            </div>

            <div className="game-teams">
              <div className={`team ${game.awayTeam.score > game.homeTeam.score ? 'leading' : ''}`}>
                <div className="team-info">
                  <span className="team-name">{game.awayTeam.name}</span>
                  <span className="team-record">({game.awayTeam.record})</span>
                </div>
                <span className="team-score">{game.awayTeam.score}</span>
              </div>

              <div className={`team ${game.homeTeam.score > game.awayTeam.score ? 'leading' : ''}`}>
                <div className="team-info">
                  <span className="team-name">{game.homeTeam.name}</span>
                  <span className="team-record">({game.homeTeam.record})</span>
                </div>
                <span className="team-score">{game.homeTeam.score}</span>
              </div>
            </div>

            {game.status === 'live' && game.currentPitcher && (
              <div className="pitcher-info">
                <span className="label">P:</span>
                <span className="pitcher-name">{game.currentPitcher.name}</span>
                <span className="pitcher-stats">
                  {game.currentPitcher.pitches}P · {game.currentPitcher.era} ERA
                </span>
              </div>
            )}

            {game.status === 'live' && game.currentBatter && (
              <div className="batter-info">
                <span className="label">AB:</span>
                <span className="batter-name">{game.currentBatter.name}</span>
                <span className="batter-stats">{game.currentBatter.avg} AVG</span>
              </div>
            )}

            <div className="game-venue">
              <span>{game.venue}</span>
            </div>

            <div className="game-actions">
              <button
                type="button"
                className="action-button primary"
                onClick={() => onGameSelect(game)}
              >
                View Box Score
              </button>
              {game.liveWinProbability && (
                <button
                  type="button"
                  className={`action-button ${
                    expandedGameId === game.id ? 'active' : ''
                  }`}
                  onClick={() => handleExpandToggle(game.id)}
                >
                  {expandedGameId === game.id ? 'Hide Timeline' : 'Win Probability'}
                </button>
              )}
              {game.liveWinProbability?.pitchTracking && (
                <button
                  type="button"
                  className={`action-button ${
                    pitchTunnelVisibility[game.id] ? 'active' : ''
                  }`}
                  onClick={() => handlePitchTunnelToggle(game.id)}
                >
                  {pitchTunnelVisibility[game.id] ? 'Hide Tunnel' : 'Pitch Tunnel'}
                </button>
              )}
            </div>

            {expandedGameId === game.id && game.liveWinProbability && (
              <div className="game-analytics">
                <WinProbabilityTimeline
                  data={game.liveWinProbability}
                  homeTeam={game.homeTeam.name}
                  awayTeam={game.awayTeam.name}
                />

                {pitchTunnelVisibility[game.id] && (
                  <PitchTunnelOverlay
                    releasePoints={
                      game.liveWinProbability.pitchTracking?.releasePoints || []
                    }
                    plateLocations={
                      game.liveWinProbability.pitchTracking?.plateLocations || []
                    }
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveGameTracker;
