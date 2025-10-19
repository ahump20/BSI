import { useState } from 'react'
import type { JSX } from 'react'
import SportSwitcher from '../components/SportSwitcher'
import './basketball.css'

type ActiveView = 'scores' | 'standings' | 'stats'

const BasketballApp = (): JSX.Element => {
  const [activeView, setActiveView] = useState<ActiveView>('scores')

  return (
    <div className="basketball-app">
      <header className="basketball-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon" aria-hidden="true">
              🏀
            </span>
            <h1 className="site-title">Blaze Sports Intel</h1>
          </div>
          <nav className="main-nav" aria-label="Basketball views">
            <div role="tablist" aria-label="Basketball view tabs">
              <button
                className={`nav-button ${activeView === 'scores' ? 'active' : ''}`}
                onClick={() => setActiveView('scores')}
                type="button"
                role="tab"
                aria-selected={activeView === 'scores'}
              >
                Scores
              </button>
              <button
                className={`nav-button ${activeView === 'standings' ? 'active' : ''}`}
                onClick={() => setActiveView('standings')}
                type="button"
                role="tab"
                aria-selected={activeView === 'standings'}
              >
                Standings
              </button>
              <button
                className={`nav-button ${activeView === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveView('stats')}
                type="button"
                role="tab"
                aria-selected={activeView === 'stats'}
              >
                Stats
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="basketball-main">
        <div className="content-container">
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="hero-title">NCAA Basketball Intelligence</h2>
              <p className="hero-subtitle">
                Real-time scores, advanced analytics, and tournament projections
              </p>
            </div>
          </section>

          {activeView === 'scores' ? (
            <section className="scores-section" aria-label="Live scores">
              <h3 className="section-title">Live Scores</h3>
              <div className="scores-grid">
                <div className="game-card">
                  <div className="game-status">Final</div>
                  <div className="game-teams">
                    <div className="team away-team">
                      <span className="team-name">Kentucky</span>
                      <span className="team-score">78</span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
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

                <div className="game-card">
                  <div className="game-status live">Live - 2nd Half</div>
                  <div className="game-teams">
                    <div className="team away-team">
                      <span className="team-name">Duke</span>
                      <span className="team-score">45</span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
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

                <div className="game-card">
                  <div className="game-status">Final</div>
                  <div className="game-teams">
                    <div className="team away-team winner">
                      <span className="team-name">Kansas</span>
                      <span className="team-score">89</span>
                    </div>
                    <div className="game-divider" aria-hidden="true">
                      @
                    </div>
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
          ) : null}

          {activeView === 'standings' ? (
            <section className="standings-section" aria-label="Conference standings">
              <h3 className="section-title">Conference Standings</h3>

              <div className="conference-standings">
                <h4 className="conference-name">SEC</h4>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th scope="col">Team</th>
                      <th scope="col">Conf</th>
                      <th scope="col">Overall</th>
                      <th scope="col">GB</th>
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
                        Texas A&amp;M
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
                      <th scope="col">Team</th>
                      <th scope="col">Conf</th>
                      <th scope="col">Overall</th>
                      <th scope="col">GB</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">1</span>
                        Kansas
                      </td>
                      <td>13-1</td>
                      <td>20-2</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">2</span>
                        Houston
                      </td>
                      <td>12-2</td>
                      <td>19-3</td>
                      <td>1.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">3</span>
                        Baylor
                      </td>
                      <td>11-3</td>
                      <td>18-4</td>
                      <td>2.0</td>
                    </tr>
                    <tr>
                      <td className="team-cell">
                        <span className="rank">4</span>
                        Iowa State
                      </td>
                      <td>10-4</td>
                      <td>17-5</td>
                      <td>3.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeView === 'stats' ? (
            <section className="stats-section" aria-label="Advanced statistics">
              <h3 className="section-title">Advanced Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Top Offensive Efficiency</h4>
                  <ul>
                    <li>Purdue — 1.21 PPP</li>
                    <li>Connecticut — 1.18 PPP</li>
                    <li>Gonzaga — 1.16 PPP</li>
                  </ul>
                </div>
                <div className="stat-card">
                  <h4>Defensive Efficiency Leaders</h4>
                  <ul>
                    <li>Houston — 0.87 PPP</li>
                    <li>Tennessee — 0.89 PPP</li>
                    <li>Virginia — 0.91 PPP</li>
                  </ul>
                </div>
                <div className="stat-card">
                  <h4>Projected #1 Seeds</h4>
                  <ul>
                    <li>UConn Huskies</li>
                    <li>Purdue Boilermakers</li>
                    <li>Kansas Jayhawks</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SportSwitcher currentSport="basketball" />
    </div>
  )
}

export default BasketballApp
