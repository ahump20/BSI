import { useState } from 'react';
import SportSwitcher from '../components/SportSwitcher';
import './basketball.css';

/**
 * Basketball App Component
 *
 * NCAA Basketball-focused view with:
 * - Live scores and standings
 * - Team and player statistics
 * - Conference rankings
 * - Tournament projections
 */
function BasketballApp() {
  const [activeView, setActiveView] = useState('scores');

  return (
    <div className="basketball-app">
      {/* Header */}
      <header className="basketball-header" role="banner">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon" aria-hidden="true">
              🏀
            </span>
            <h1 className="site-title">Blaze Sports Intel</h1>
          </div>
          <nav className="main-nav" role="navigation" aria-label="Main navigation">
            <button
              className={`nav-button ${activeView === 'scores' ? 'active' : ''}`}
              onClick={() => setActiveView('scores')}
              aria-pressed={activeView === 'scores'}
              aria-label="View live scores"
              role="tab"
              aria-selected={activeView === 'scores'}
            >
              Scores
            </button>
            <button
              className={`nav-button ${activeView === 'standings' ? 'active' : ''}`}
              onClick={() => setActiveView('standings')}
              aria-pressed={activeView === 'standings'}
              aria-label="View conference standings"
              role="tab"
              aria-selected={activeView === 'standings'}
            >
              Standings
            </button>
            <button
              className={`nav-button ${activeView === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveView('stats')}
              aria-pressed={activeView === 'stats'}
              aria-label="View player statistics"
              role="tab"
              aria-selected={activeView === 'stats'}
            >
              Stats
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="basketball-main" role="main">
        <div className="content-container">
          {/* Hero Section */}
          <section className="hero-section" aria-label="Page introduction">
            <div className="hero-content">
              <h2 className="hero-title">NCAA Basketball Intelligence</h2>
              <p className="hero-subtitle">
                Real-time scores, advanced analytics, and tournament projections
              </p>
            </div>
          </section>

          {/* Scores View */}
          {activeView === 'scores' && (
            <section className="scores-section" role="tabpanel" aria-label="Live scores">
              <h3 className="section-title">Live Scores</h3>
              <div className="scores-grid" role="list" aria-label="Basketball games">
                {/* Game Card 1 */}
                <article
                  className="game-card"
                  role="listitem"
                  aria-label="Kentucky at Tennessee, Final, Tennessee won 82 to 78"
                >
                  <div className="game-status" role="status">
                    Final
                  </div>
                  <div className="game-teams" role="group" aria-label="Teams and scores">
                    <div
                      className="team away-team"
                      role="group"
                      aria-label="Away team: Kentucky, 78 points"
                    >
                      <span className="team-name">Kentucky</span>
                      <span className="team-score" aria-label="Score: 78">
                        78
                      </span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
                    <div
                      className="team home-team winner"
                      role="group"
                      aria-label="Home team: Tennessee, 82 points, winner"
                    >
                      <span className="team-name">Tennessee</span>
                      <span className="team-score" aria-label="Score: 82">
                        82
                      </span>
                    </div>
                  </div>
                  <div className="game-info" role="group" aria-label="Game details">
                    <span className="game-venue">Thompson-Boling Arena</span>
                    <span className="game-date">October 15, 2025</span>
                  </div>
                </article>

                {/* Game Card 2 */}
                <article
                  className="game-card"
                  role="listitem"
                  aria-label="Duke at North Carolina, Live, 2nd Half, North Carolina leading 48 to 45"
                >
                  <div className="game-status live" role="status" aria-live="polite">
                    Live - 2nd Half
                  </div>
                  <div className="game-teams" role="group" aria-label="Teams and scores">
                    <div
                      className="team away-team"
                      role="group"
                      aria-label="Away team: Duke, 45 points"
                    >
                      <span className="team-name">Duke</span>
                      <span className="team-score" aria-label="Score: 45">
                        45
                      </span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
                    <div
                      className="team home-team"
                      role="group"
                      aria-label="Home team: North Carolina, 48 points"
                    >
                      <span className="team-name">North Carolina</span>
                      <span className="team-score" aria-label="Score: 48">
                        48
                      </span>
                    </div>
                  </div>
                  <div className="game-info" role="group" aria-label="Game details">
                    <span className="game-venue">Dean Smith Center</span>
                    <span className="game-time">12:43 2H</span>
                  </div>
                </article>

                {/* Game Card 3 */}
                <article
                  className="game-card"
                  role="listitem"
                  aria-label="Kansas at Texas, Final, Kansas won 89 to 85"
                >
                  <div className="game-status" role="status">
                    Final
                  </div>
                  <div className="game-teams" role="group" aria-label="Teams and scores">
                    <div
                      className="team away-team winner"
                      role="group"
                      aria-label="Away team: Kansas, 89 points, winner"
                    >
                      <span className="team-name">Kansas</span>
                      <span className="team-score" aria-label="Score: 89">
                        89
                      </span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
                    <div
                      className="team home-team"
                      role="group"
                      aria-label="Home team: Texas, 85 points"
                    >
                      <span className="team-name">Texas</span>
                      <span className="team-score" aria-label="Score: 85">
                        85
                      </span>
                    </div>
                  </div>
                  <div className="game-info" role="group" aria-label="Game details">
                    <span className="game-venue">Moody Center</span>
                    <span className="game-date">October 15, 2025</span>
                  </div>
                </article>
              </div>
            </section>
          )}

          {/* Standings View */}
          {activeView === 'standings' && (
            <section
              className="standings-section"
              role="tabpanel"
              aria-label="Conference standings"
            >
              <h3 className="section-title">Conference Standings</h3>

              <div className="conference-standings">
                <h4 className="conference-name">SEC</h4>
                <table
                  className="standings-table"
                  role="table"
                  aria-label="SEC conference standings"
                >
                  <thead>
                    <tr>
                      <th scope="col">Team</th>
                      <th scope="col">Conf</th>
                      <th scope="col">Overall</th>
                      <th scope="col" abbr="Games Behind">
                        GB
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 1">
                          1
                        </span>
                        Tennessee
                      </td>
                      <td aria-label="Conference record: 12 wins, 2 losses">12-2</td>
                      <td aria-label="Overall record: 18 wins, 3 losses">18-3</td>
                      <td aria-label="Games behind: none">-</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 2">
                          2
                        </span>
                        Kentucky
                      </td>
                      <td aria-label="Conference record: 11 wins, 3 losses">11-3</td>
                      <td aria-label="Overall record: 17 wins, 4 losses">17-4</td>
                      <td aria-label="Games behind: 1">1.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 3">
                          3
                        </span>
                        Auburn
                      </td>
                      <td aria-label="Conference record: 10 wins, 4 losses">10-4</td>
                      <td aria-label="Overall record: 16 wins, 5 losses">16-5</td>
                      <td aria-label="Games behind: 2">2.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 4">
                          4
                        </span>
                        Texas A&M
                      </td>
                      <td aria-label="Conference record: 9 wins, 5 losses">9-5</td>
                      <td aria-label="Overall record: 15 wins, 6 losses">15-6</td>
                      <td aria-label="Games behind: 3">3.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="conference-standings">
                <h4 className="conference-name">Big 12</h4>
                <table
                  className="standings-table"
                  role="table"
                  aria-label="Big 12 conference standings"
                >
                  <thead>
                    <tr>
                      <th scope="col">Team</th>
                      <th scope="col">Conf</th>
                      <th scope="col">Overall</th>
                      <th scope="col" abbr="Games Behind">
                        GB
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 1">
                          1
                        </span>
                        Kansas
                      </td>
                      <td aria-label="Conference record: 13 wins, 1 loss">13-1</td>
                      <td aria-label="Overall record: 19 wins, 2 losses">19-2</td>
                      <td aria-label="Games behind: none">-</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 2">
                          2
                        </span>
                        Iowa State
                      </td>
                      <td aria-label="Conference record: 11 wins, 3 losses">11-3</td>
                      <td aria-label="Overall record: 17 wins, 4 losses">17-4</td>
                      <td aria-label="Games behind: 2">2.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 3">
                          3
                        </span>
                        Texas
                      </td>
                      <td aria-label="Conference record: 10 wins, 4 losses">10-4</td>
                      <td aria-label="Overall record: 16 wins, 5 losses">16-5</td>
                      <td aria-label="Games behind: 3">3.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell" scope="row">
                        <span className="rank" aria-label="Rank 4">
                          4
                        </span>
                        Baylor
                      </td>
                      <td aria-label="Conference record: 9 wins, 5 losses">9-5</td>
                      <td aria-label="Overall record: 15 wins, 6 losses">15-6</td>
                      <td aria-label="Games behind: 4">4.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Stats View */}
          {activeView === 'stats' && (
            <section className="stats-section" role="tabpanel" aria-label="Player statistics">
              <h3 className="section-title">Player Leaders</h3>

              <div className="stats-grid" role="group" aria-label="Statistical leaders">
                <div className="stat-category" role="region" aria-label="Points per game leaders">
                  <h4 className="stat-title">Points Per Game</h4>
                  <ol className="stat-list" role="list">
                    <li role="listitem" aria-label="Zach Edey, Purdue, 24.5 points per game">
                      <span className="player-name">Zach Edey</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value" aria-label="24.5 points per game">
                        24.5
                      </span>
                    </li>
                    <li role="listitem" aria-label="Hunter Dickinson, Kansas, 23.8 points per game">
                      <span className="player-name">Hunter Dickinson</span>
                      <span className="player-team">Kansas</span>
                      <span className="stat-value" aria-label="23.8 points per game">
                        23.8
                      </span>
                    </li>
                    <li role="listitem" aria-label="Tyler Kolek, Marquette, 22.1 points per game">
                      <span className="player-name">Tyler Kolek</span>
                      <span className="player-team">Marquette</span>
                      <span className="stat-value" aria-label="22.1 points per game">
                        22.1
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="stat-category" role="region" aria-label="Rebounds per game leaders">
                  <h4 className="stat-title">Rebounds Per Game</h4>
                  <ol className="stat-list" role="list">
                    <li role="listitem" aria-label="Zach Edey, Purdue, 12.4 rebounds per game">
                      <span className="player-name">Zach Edey</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value" aria-label="12.4 rebounds per game">
                        12.4
                      </span>
                    </li>
                    <li
                      role="listitem"
                      aria-label="Ryan Kalkbrenner, Creighton, 11.8 rebounds per game"
                    >
                      <span className="player-name">Ryan Kalkbrenner</span>
                      <span className="player-team">Creighton</span>
                      <span className="stat-value" aria-label="11.8 rebounds per game">
                        11.8
                      </span>
                    </li>
                    <li
                      role="listitem"
                      aria-label="Coleman Hawkins, Illinois, 10.9 rebounds per game"
                    >
                      <span className="player-name">Coleman Hawkins</span>
                      <span className="player-team">Illinois</span>
                      <span className="stat-value" aria-label="10.9 rebounds per game">
                        10.9
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="stat-category" role="region" aria-label="Assists per game leaders">
                  <h4 className="stat-title">Assists Per Game</h4>
                  <ol className="stat-list" role="list">
                    <li role="listitem" aria-label="Tyler Kolek, Marquette, 8.7 assists per game">
                      <span className="player-name">Tyler Kolek</span>
                      <span className="player-team">Marquette</span>
                      <span className="stat-value" aria-label="8.7 assists per game">
                        8.7
                      </span>
                    </li>
                    <li role="listitem" aria-label="Braden Smith, Purdue, 7.9 assists per game">
                      <span className="player-name">Braden Smith</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value" aria-label="7.9 assists per game">
                        7.9
                      </span>
                    </li>
                    <li role="listitem" aria-label="Caleb Love, Arizona, 7.5 assists per game">
                      <span className="player-name">Caleb Love</span>
                      <span className="player-team">Arizona</span>
                      <span className="stat-value" aria-label="7.5 assists per game">
                        7.5
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="basketball-footer" role="contentinfo">
        <div className="footer-content">
          <p className="footer-text">© 2025 Blaze Sports Intel • NCAA Basketball Analytics</p>
          <p className="footer-disclaimer">
            Data provided for informational purposes • Real-time integration in development
          </p>
        </div>
      </footer>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="basketball" />
    </div>
  );
}

export default BasketballApp;
