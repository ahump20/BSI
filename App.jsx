import React, { useState, useEffect } from 'react';
import LiveGameTracker from './LiveGameTracker';
import BoxScore from './BoxScore';
import Standings from './Standings';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('live');
  const [selectedGame, setSelectedGame] = useState(null);
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live games on mount and set up polling
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveGames = async () => {
    try {
      const response = await fetch('/api/games/live');
      const data = await response.json();
      setLiveGames(data.games);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live games:', error);
      setLoading(false);
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setActiveView('boxscore');
  };

  const renderView = () => {
    switch (activeView) {
      case 'live':
        return (
          <LiveGameTracker 
            games={liveGames} 
            onGameSelect={handleGameSelect}
            loading={loading}
          />
        );
      case 'boxscore':
        return selectedGame ? (
          <BoxScore 
            game={selectedGame} 
            onBack={() => setActiveView('live')}
          />
        ) : (
          <div className="empty-state">Select a game to view details</div>
        );
      case 'standings':
        return <Standings />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-branding">
          <h1
            className="app-title"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            <span role="img" aria-label="fire" className="app-title-icon">
              🔥
            </span>{' '}
            BLAZE SPORTS INTEL
          </h1>
          <p className="tagline">Deep South Sports Authority</p>
          <p className="subtitle">
            NCAA Division I baseball intelligence engineered for coaches, scouts, and die-hard fans.
          </p>
        </div>
        <div className="conference-filter">
          <select>
            <option value="all">All Conferences</option>
            <option value="sec">SEC</option>
            <option value="acc">ACC</option>
            <option value="big12">Big 12</option>
            <option value="pac12">Pac-12</option>
            <option value="big10">Big Ten</option>
          </select>
        </div>
      </header>

      <nav className="bottom-nav">
        <button 
          className={activeView === 'live' ? 'active' : ''}
          onClick={() => setActiveView('live')}
        >
          <span className="nav-icon">⚾</span>
          Live
        </button>
        <button 
          className={activeView === 'boxscore' ? 'active' : ''}
          onClick={() => setActiveView('boxscore')}
        >
          <span className="nav-icon">📊</span>
          Box Score
        </button>
        <button 
          className={activeView === 'standings' ? 'active' : ''}
          onClick={() => setActiveView('standings')}
        >
          <span className="nav-icon">🏆</span>
          Standings
        </button>
      </nav>

      <main className="app-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
