import { useEffect, useState } from 'react';
import SportSwitcher from '../components/SportSwitcher';

type FootballWeek = 'current' | 'previous' | 'next';

interface FootballTeamDetails {
  team: {
    name?: string;
  };
  record?: string;
  score?: number | string;
  rank?: number;
}

interface FootballTeams {
  home: FootballTeamDetails;
  away: FootballTeamDetails;
}

interface FootballStatus {
  completed?: boolean;
  shortDetail?: string;
}

interface FootballOdds {
  spread?: string;
  overUnder?: string;
}

interface FootballVenue {
  name?: string;
}

interface FootballGame {
  id: string;
  teams: FootballTeams;
  status: FootballStatus;
  venue?: FootballVenue;
  broadcast?: string;
  odds?: FootballOdds;
}

interface FootballApiResponse {
  games?: FootballGame[];
}

function FootballApp(): JSX.Element {
  const [games, setGames] = useState<FootballGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<FootballWeek>('current');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/football/scores?week=${currentWeek}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as FootballApiResponse;
        setGames(data.games ?? []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch football games:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    void fetchGames();

    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [currentWeek]);

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>🏈 College Football Live</h1>
          <p className="tagline">Real-time college football scores and updates</p>
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
          <h1>🏈 College Football Live</h1>
        </header>
        <div className="error">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Football API
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
        <h1>🏈 College Football Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <div className="section-header">
            <h2>Live Scores</h2>
            <div className="week-selector">
              <button
                className={currentWeek === 'current' ? 'active' : ''}
                onClick={() => setCurrentWeek('current')}
              >
                Current Week
              </button>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map(game => {
                const { home, away } = game.teams;

                return (
                  <div key={game.id} className="game-card football">
                    <div className="game-status">
                      {game.status.completed ? 'Final' : game.status.shortDetail ?? 'Live'}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <div className="team-info">
                          {away.rank && <span className="rank">#{away.rank}</span>}
                          <span className="team-name">{away.team.name ?? 'Away'}</span>
                          <span className="team-record">{away.record}</span>
                        </div>
                        <span className="team-score">{away.score ?? '0'}</span>
                      </div>

                      <div className="team">
                        <div className="team-info">
                          {home.rank && <span className="rank">#{home.rank}</span>}
                          <span className="team-name">{home.team.name ?? 'Home'}</span>
                          <span className="team-record">{home.record}</span>
                        </div>
                        <span className="team-score">{home.score ?? '0'}</span>
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">{game.venue?.name ?? 'TBD'}</span>
                      {game.broadcast && <span className="broadcast"> • {game.broadcast}</span>}
                    </div>

                    {game.odds && (
                      <div className="odds">
                        Spread: {game.odds.spread} • O/U: {game.odds.overUnder}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Football API
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

      <SportSwitcher currentSport="football" />
    </div>
  );
}

export default FootballApp;
