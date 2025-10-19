import React, { useState, useEffect, useMemo } from 'react';
import LiveGameTracker from './LiveGameTracker';
import BoxScore from './BoxScore';
import Standings from './Standings';
import MobileNav from './src/components/navigation/MobileNav';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('scores');
  const [selectedGame, setSelectedGame] = useState(null);
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false);

  useEffect(() => {
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateVisibility = () => setIsMobileNavVisible(mediaQuery.matches);

    updateVisibility();
    mediaQuery.addEventListener('change', updateVisibility);

    return () => mediaQuery.removeEventListener('change', updateVisibility);
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

  const handleNavigation = (key, href) => {
    switch (key) {
      case 'scores':
        setActiveView('scores');
        return true;
      case 'teams':
        setActiveView('teams');
        return true;
      case 'standings':
        setActiveView('standings');
        return true;
      case 'search':
        setActiveView('search');
        return true;
      case 'account':
        setActiveView('account');
        return true;
      default:
        window.location.href = href;
        return false;
    }
  };

  const navItems = useMemo(
    () => [
      { key: 'scores', label: 'Scores', href: '/scores', icon: '🏟️' },
      { key: 'teams', label: 'Teams', href: '/teams', icon: '👥' },
      { key: 'standings', label: 'Standings', href: '/standings', icon: '📈' },
      { key: 'search', label: 'Search', href: '/search', icon: '🔍' },
    ],
    [],
  );

  const extendedLinks = useMemo(
    () => [
      { key: 'account', label: 'Account', href: '/account', icon: '👤' },
      { key: 'news', label: 'News', href: '/news', icon: '📰' },
      { key: 'settings', label: 'Settings', href: '/settings', icon: '⚙️' },
    ],
    [],
  );

  const activeNavKey = activeView === 'boxscore' ? 'scores' : activeView;

  const renderView = () => {
    switch (activeView) {
      case 'scores':
        return (
          <LiveGameTracker
            games={liveGames}
            onGameSelect={handleGameSelect}
            loading={loading}
          />
        );
      case 'boxscore':
        return selectedGame ? (
          <BoxScore game={selectedGame} onBack={() => setActiveView('scores')} />
        ) : (
          <div className="empty-state">Select a game to view details</div>
        );
      case 'standings':
        return <Standings />;
      case 'teams':
        return (
          <section className="placeholder-view" aria-labelledby="teams-view-title">
            <h2 id="teams-view-title">Teams Directory</h2>
            <p>
              Explore detailed team capsules, roster intel, and trends. This view is
              currently in development.
            </p>
          </section>
        );
      case 'search':
        return (
          <section className="placeholder-view" aria-labelledby="search-view-title">
            <h2 id="search-view-title">Search Blaze Sports Intel</h2>
            <p>
              Use the global search to surface programs, players, and matchups. The
              search experience will ship alongside the recruiting tracker.
            </p>
          </section>
        );
      case 'account':
        return (
          <section className="placeholder-view" aria-labelledby="account-view-title">
            <h2 id="account-view-title">Sign in to Diamond Pro</h2>
            <p>
              Manage your subscription, notification settings, and personalization
              controls right here.
            </p>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app${isMobileNavVisible ? ' app--mobile-nav' : ''}`}>
      <header className="app-header">
        <h1>College Baseball Live</h1>
        <div className="conference-filter">
          <select aria-label="Filter by conference">
            <option value="all">All Conferences</option>
            <option value="sec">SEC</option>
            <option value="acc">ACC</option>
            <option value="big12">Big 12</option>
            <option value="pac12">Pac-12</option>
            <option value="big10">Big Ten</option>
          </select>
        </div>
      </header>

      <main className="app-content">{renderView()}</main>

      {isMobileNavVisible && (
        <MobileNav
          items={navItems}
          extendedLinks={extendedLinks}
          activeKey={activeNavKey}
          onNavigate={handleNavigation}
        />
      )}
    </div>
  );
}

export default App;
