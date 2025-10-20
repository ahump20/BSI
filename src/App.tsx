import { useEffect, useState } from 'react';
import SportSwitcher from './components/SportSwitcher';

type HomeAway = 'home' | 'away';

interface EspnTeam {
  displayName?: string;
}

interface EspnCompetitor {
  homeAway?: HomeAway;
  score?: string;
  team?: EspnTeam;
}

interface EspnVenue {
  fullName?: string;
}

interface EspnStatus {
  type?: {
    completed?: boolean;
    detail?: string;
  };
}

interface EspnCompetition {
  competitors?: EspnCompetitor[];
  status?: EspnStatus;
  venue?: EspnVenue;
}

interface EspnEvent {
  id: string;
  competitions?: EspnCompetition[];
}

interface EspnResponse {
  events?: EspnEvent[];
}

function App() {
  const [games, setGames] = useState<EspnEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as EspnResponse;
        setGames(data.events ?? []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    void fetchGames();

    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
          <p className="tagline">Real-time college baseball scores and updates</p>
        </header>
        <div className="loading">
          <div className="spinner" />
          <p>Loading live scores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
        </header>
        <div className="error">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Baseball API
            <br />
            Status: Temporarily unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <h2>Live Scores</h2>
          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map(event => {
                const competition = event.competitions?.[0];
                const homeTeam = competition?.competitors?.find(team => team.homeAway === 'home');
                const awayTeam = competition?.competitors?.find(team => team.homeAway === 'away');
                const status = competition?.status;

                return (
                  <div key={event.id} className="game-card">
                    <div className="game-status">
                      {status?.type?.completed ? 'Final' : status?.type?.detail ?? 'Live'}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <span className="team-name">{awayTeam?.team?.displayName ?? 'Away'}</span>
                        <span className="team-score">{awayTeam?.score ?? '0'}</span>
                      </div>

                      <div className="team">
                        <span className="team-name">{homeTeam?.team?.displayName ?? 'Home'}</span>
                        <span className="team-score">{homeTeam?.score ?? '0'}</span>
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">{competition?.venue?.fullName ?? 'TBD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            Last updated:{' '}
            {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
        </footer>
      </main>

      <SportSwitcher currentSport="baseball" />
    </div>
  );
}

export default App;
