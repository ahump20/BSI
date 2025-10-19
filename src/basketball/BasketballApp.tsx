import { useState } from 'react'
import SportSwitcher from '../components/SportSwitcher'
import './basketball.css'

type BasketballView = 'scores' | 'standings' | 'stats';

/**
 * Basketball App Component
 *
 * NCAA Basketball-focused view with:
 * - Live scores and standings
 * - Team and player statistics
 * - Conference rankings
 * - Tournament projections
 */
function BasketballApp(): JSX.Element {
  const [activeView, setActiveView] = useState<BasketballView>('scores')

  return (
    <div className="basketball-app">
      {/* Header */}
      <header className="basketball-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">🏀</span>
            <h1 className="site-title">Blaze Sports Intel</h1>
          </div>
          <nav className="main-nav">
            <button
              className={`nav-button ${activeView === 'scores' ? 'active' : ''}`}
              onClick={() => setActiveView('scores')}
            >
              Scores
            </button>
            <button
              className={`nav-button ${activeView === 'standings' ? 'active' : ''}`}
              onClick={() => setActiveView('standings')}
            >
              Standings
            </button>
            <button
              className={`nav-button ${activeView === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveView('stats')}
            >
              Stats
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="basketball-main">
        <div className="content-container">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="hero-title">NCAA Basketball Intelligence</h2>
              <p className="hero-subtitle">
                Real-time scores, advanced analytics, and tournament projections
              </p>
            </div>
          </section>

          {/* Scores View */}
          {activeView === 'scores' && (
            <section className="scores-section">
              <h3 className="section-title">Live Scores</h3>
              <div className="scores-grid">
                {/* Game Card 1 */}
                <div className="game-card">
                  <div className="game-status">Final</div>
                  <div className="game-teams">
                    <div className="team away-team">
                      <span className="team-name">Kentucky</span>
                      <span className="team-score">78</span>
                    </div>
                    <div className="game-divider">@</div>
                    <div className="team home-team winner">
                      <span className="team-name">Tennessee</span>
                      <span className="team-score">82</span>
                    </div>
                  </div>
                  <div className="game-info">
                    <span className="game-venue">Thompson-Boling Arena</span>
                    <span className="game-date">October 15, 2025</span>
                  </div>
                </div>

                {/* Game Card 2 */}
                <div className="game-card">
                  <div className="game-status live">Live - 2nd Half</div>
                  <div className="game-teams">
                    <div className="team away-team">
                      <span className="team-name">Duke</span>
                      <span className="team-score">45</span>
                    </div>
                    <div className="game-divider">@</div>
                    <div className="team home-team">
                      <span className="team-name">North Carolina</span>
                      <span className="team-score">48</span>
                    </div>
                  </div>
                  <div className="game-info">
                    <span className="game-venue">Dean Smith Center</span>
                    <span className="game-time">12:43 2H</span>
                  </div>
                </div>

                {/* Game Card 3 */}
                <div className="game-card">
                  <div className="game-status">Final</div>
                  <div className="game-teams">
                    <div className="team away-team winner">
                      <span className="team-name">Kansas</span>
                      <span className="team-score">89</span>
                    </div>
                    <div className="game-divider">@</div>
                    <div className="team home-team">
                      <span className="team-name">Texas</span>
                      <span className="team-score">85</span>
                    </div>
                  </div>
                  <div className="game-info">
                    <span className="game-venue">Moody Center</span>
                    <span className="game-date">October 15, 2025</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Standings View */}
          {activeView === 'standings' && (
            <section className="standings-section">
              <h3 className="section-title">Conference Standings</h3>

              <div className="conference-standings">
                <h4 className="conference-name">SEC</h4>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Conf</th>
                      <th>Overall</th>
                      <th>GB</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">1</span>
                        Tennessee
                      </td>
                      <td>12-2</td>
                      <td>18-3</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">2</span>
                        Kentucky
                      </td>
                      <td>11-3</td>
                      <td>17-4</td>
                      <td>1.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">3</span>
                        Auburn
                      </td>
                      <td>10-4</td>
                      <td>16-5</td>
                      <td>2.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">4</span>
                        Texas A&M
                      </td>
                      <td>9-5</td>
                      <td>15-6</td>
                      <td>3.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="conference-standings">
                <h4 className="conference-name">Big 12</h4>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Conf</th>
                      <th>Overall</th>
                      <th>GB</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">1</span>
                        Kansas
                      </td>
                      <td>13-1</td>
                      <td>19-2</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">2</span>
                        Iowa State
                      </td>
                      <td>11-3</td>
                      <td>17-4</td>
                      <td>2.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">3</span>
                        Texas
                      </td>
                      <td>10-4</td>
                      <td>16-5</td>
                      <td>3.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">4</span>
                        Baylor
                      </td>
                      <td>9-5</td>
                      <td>15-6</td>
                      <td>4.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Stats View */}
          {activeView === 'stats' && (
            <section className="stats-section">
              <h3 className="section-title">Player Leaders</h3>

              <div className="stats-grid">
                <div className="stat-category">
                  <h4 className="stat-title">Points Per Game</h4>
                  <ol className="stat-list">
                    <li>
                      <span className="player-name">Zach Edey</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value">24.5</span>
                    </li>
                    <li>
                      <span className="player-name">Hunter Dickinson</span>
                      <span className="player-team">Kansas</span>
                      <span className="stat-value">23.8</span>
                    </li>
                    <li>
                      <span className="player-name">Tyler Kolek</span>
                      <span className="player-team">Marquette</span>
                      <span className="stat-value">22.1</span>
                    </li>
                  </ol>
                </div>

                <div className="stat-category">
                  <h4 className="stat-title">Rebounds Per Game</h4>
                  <ol className="stat-list">
                    <li>
                      <span className="player-name">Zach Edey</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value">12.4</span>
                    </li>
                    <li>
                      <span className="player-name">Ryan Kalkbrenner</span>
                      <span className="player-team">Creighton</span>
                      <span className="stat-value">11.8</span>
                    </li>
                    <li>
                      <span className="player-name">Coleman Hawkins</span>
                      <span className="player-team">Illinois</span>
                      <span className="stat-value">10.9</span>
                    </li>
                  </ol>
                </div>

                <div className="stat-category">
                  <h4 className="stat-title">Assists Per Game</h4>
                  <ol className="stat-list">
                    <li>
                      <span className="player-name">Tyler Kolek</span>
                      <span className="player-team">Marquette</span>
                      <span className="stat-value">8.7</span>
                    </li>
                    <li>
                      <span className="player-name">Braden Smith</span>
                      <span className="player-team">Purdue</span>
                      <span className="stat-value">7.9</span>
                    </li>
                    <li>
                      <span className="player-name">Caleb Love</span>
                      <span className="player-team">Arizona</span>
                      <span className="stat-value">7.5</span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="basketball-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2025 Blaze Sports Intel • NCAA Basketball Analytics
          </p>
          <p className="footer-disclaimer">
            Data provided for informational purposes • Real-time integration in development
          </p>
        </div>
      </footer>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="basketball" />
    </div>
  )
}

export default BasketballApp
