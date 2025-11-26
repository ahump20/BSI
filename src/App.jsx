import { useState, useEffect, useMemo } from 'react';
import SportSwitcher from './components/SportSwitcher';

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch live college baseball games from ESPN API
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setGames(data.events || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const categorizedGames = useMemo(() => {
    const buckets = {
      live: [],
      final: [],
      upcoming: [],
      other: [],
    };

    games.forEach((event) => {
      const competition = event.competitions?.[0];
      const status = competition?.status;
      const state = status?.type?.state;

      if (status?.type?.completed) {
        buckets.final.push(event);
      } else if (state === 'in') {
        buckets.live.push(event);
      } else if (state === 'pre') {
        buckets.upcoming.push(event);
      } else {
        buckets.other.push(event);
      }
    });

    return buckets;
  }, [games]);

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, [games]);

  const renderGameCard = (event) => {
    const competition = event.competitions?.[0];
    const homeTeam = competition?.competitors?.find((c) => c.homeAway === 'home');
    const awayTeam = competition?.competitors?.find((c) => c.homeAway === 'away');
    const status = competition?.status;
    const state = status?.type?.state;

    const statusLabel = status?.type?.completed
      ? 'Final'
      : status?.type?.shortDetail || status?.type?.detail || 'Scheduled';

    const tone = status?.type?.completed
      ? 'final'
      : state === 'in'
        ? 'live'
        : state === 'pre'
          ? 'upcoming'
          : 'other';

    const firstPitch = competition?.date || event.date;
    const formattedStart = firstPitch
      ? new Date(firstPitch).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Chicago',
        })
      : 'TBD';

    return (
      <article key={event.id} className="game-card" role="listitem">
        <div className={`game-status badge-${tone}`}>{statusLabel}</div>

        <div className="game-teams">
          <div className="team">
            <div className="team-meta">
              <span className="team-seed">{awayTeam?.records?.[0]?.summary || '—'}</span>
              <span className="team-name">{awayTeam?.team?.displayName || 'Away'}</span>
            </div>
            <span className="team-score">{awayTeam?.score ?? '0'}</span>
          </div>

          <div className="team">
            <div className="team-meta">
              <span className="team-seed">{homeTeam?.records?.[0]?.summary || '—'}</span>
              <span className="team-name">{homeTeam?.team?.displayName || 'Home'}</span>
            </div>
            <span className="team-score">{homeTeam?.score ?? '0'}</span>
          </div>
        </div>

        <div className="game-meta">
          <div className="meta-item">
            <span className="meta-label">Venue</span>
            <span className="meta-value">{competition?.venue?.fullName || 'TBD'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">First pitch</span>
            <span className="meta-value">{formattedStart}</span>
          </div>
          {status?.type?.description && (
            <div className="meta-item">
              <span className="meta-label">Situation</span>
              <span className="meta-value">{status.type.description}</span>
            </div>
          )}
        </div>
      </article>
    );
  };

  const renderLoading = (message) => (
    <div className="state-shell">
      <div className="loading">
        <div className="spinner" aria-hidden="true"></div>
        <p>{message}</p>
      </div>
    </div>
  );

  const renderError = (details) => (
    <div className="state-shell">
      <div className="error" role="alert">
        <h2>⚠️ Failed to load live data</h2>
        <p className="error-detail">{details}</p>
        <p className="error-hint">
          Data source: ESPN College Baseball API
          <br />
          Status: Temporarily unavailable
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container">
        <header>
          <div className="header-content">
            <div className="title-block">
              <p className="kicker">College Baseball Control Room</p>
              <h1>Live Scoreboard</h1>
            </div>
            <p className="tagline">
              Burnt orange grit. Powder blue calm. Every pitch tracked in real time.
            </p>
          </div>
        </header>
        {renderLoading('Pulling the latest scores...')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <div className="header-content">
            <div className="title-block">
              <p className="kicker">College Baseball Control Room</p>
              <h1>Live Scoreboard</h1>
            </div>
            <p className="tagline">
              Burnt orange grit. Powder blue calm. Every pitch tracked in real time.
            </p>
          </div>
        </header>
        {renderError(error)}
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="title-block">
            <p className="kicker">College Baseball Control Room</p>
            <h1>Live Scoreboard</h1>
          </div>
          <p className="tagline">
            Burnt orange grit. Powder blue calm. Every pitch tracked in real time.
          </p>
        </div>
        <div className="header-metrics" role="status" aria-live="polite">
          <div className="metric">
            <span className="metric-value">{categorizedGames.live.length}</span>
            <span className="metric-label">Live</span>
          </div>
          <div className="metric">
            <span className="metric-value">{categorizedGames.final.length}</span>
            <span className="metric-label">Final</span>
          </div>
          <div className="metric">
            <span className="metric-value">{categorizedGames.upcoming.length}</span>
            <span className="metric-label">Upcoming</span>
          </div>
        </div>
      </header>

      <main>
        <section className="live-scores">
          <div className="section-header">
            <div>
              <h2>Scoreboard Pulse</h2>
              <p className="section-subtitle">
                Track live counts, recent finals, and what’s next on the slate.
              </p>
            </div>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch live" aria-hidden="true"></span>Live
              </span>
              <span className="legend-item">
                <span className="legend-swatch final" aria-hidden="true"></span>Final
              </span>
              <span className="legend-item">
                <span className="legend-swatch upcoming" aria-hidden="true"></span>Upcoming
              </span>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid" role="list">
              {games.map((event) => renderGameCard(event))}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            Last updated: {lastUpdated}
          </p>
        </footer>
      </main>

      <SportSwitcher currentSport="baseball" />
    </div>
  );
}

export default App;
