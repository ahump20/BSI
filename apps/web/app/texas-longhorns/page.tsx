import Link from 'next/link';
import { Metadata } from 'next';
import baseballData from '../../../../mcp/texas-longhorns/feeds/baseball.json';
import footballData from '../../../../mcp/texas-longhorns/feeds/football.json';
import basketballData from '../../../../mcp/texas-longhorns/feeds/basketball.json';
import trackFieldData from '../../../../mcp/texas-longhorns/feeds/track-field.json';
import './longhorns.css';

export const metadata: Metadata = {
  title: 'Texas Longhorns Sports Intelligence | Blaze Sports Intel',
  description:
    'Comprehensive Texas Longhorns historical data across Baseball, Football, Basketball, and Track & Field. National championships, legendary players, Olympic athletes, and program records.',
  openGraph: {
    title: 'Texas Longhorns Sports Intelligence',
    description: 'Complete historical data for Texas Longhorns across all major sports',
  },
};

export default function TexasLonghornsPage() {
  return (
    <div className="di-shell">
      <main className="di-container">
        {/* Hero Section */}
        <section className="di-hero">
          <span className="di-pill">Texas Longhorns Intelligence</span>
          <h1 className="di-title">
            Hook &apos;Em: Complete Longhorns Sports History
          </h1>
          <p className="di-subtitle">
            Deep dive into championship glory across Baseball, Football, Basketball, and Track & Field. From Darrell Royal to Steve Sarkisian, Roger Clemens to Sanya Richards-Ross—all the legendary moments that built the Texas tradition.
          </p>
        </section>

        {/* Quick Stats Overview */}
        <section className="di-section">
          <h2 className="di-page-title">Championship Legacy</h2>
          <div className="di-card-grid">
            <article className="di-card di-card--highlight">
              <div className="di-stat-badge">6</div>
              <h3>Baseball National Championships</h3>
              <p className="di-years">1949, 1950, 1975, 1983, 2002, 2005</p>
              <p>38 College World Series appearances • 85 conference titles</p>
            </article>
            <article className="di-card di-card--highlight">
              <div className="di-stat-badge">4</div>
              <h3>Football National Championships</h3>
              <p className="di-years">1963, 1969, 1970, 2005</p>
              <p>2 Heisman Trophy winners • 950-391-33 all-time record</p>
            </article>
            <article className="di-card di-card--highlight">
              <div className="di-stat-badge">1</div>
              <h3>Women&apos;s Basketball Championship</h3>
              <p className="di-years">1986 (Perfect 34-0 Season)</p>
              <p>9 Final Four appearances • Back-to-back 2023-2024</p>
            </article>
            <article className="di-card di-card--highlight">
              <div className="di-stat-badge">40</div>
              <h3>Olympic Medals in Track & Field</h3>
              <p className="di-years">22 Women&apos;s • 18 Men&apos;s</p>
              <p>14 Gold Medalists • 16 NCAA Team Championships</p>
            </article>
          </div>
        </section>

        {/* Baseball Section */}
        <section className="di-section">
          <div className="di-section-header">
            <span className="di-kicker">Diamond Insights</span>
            <h2 className="di-page-title">Baseball: America&apos;s Winningest Program</h2>
            <p className="di-page-subtitle">
              6 national championships, 38 CWS appearances, and legends who dominated from Omaha to the MLB
            </p>
          </div>

          {/* National Championships */}
          <article className="di-card">
            <h3>National Championships</h3>
            <div className="di-championship-grid">
              {baseballData.nationalChampionships.map((championship) => (
                <div key={championship.year} className="di-championship-card">
                  <div className="di-championship-year">{championship.year}</div>
                  <div className="di-championship-details">
                    <div className="di-label">Record</div>
                    <div className="di-value">{championship.record}</div>
                  </div>
                  <div className="di-championship-details">
                    <div className="di-label">CWS</div>
                    <div className="di-value">{championship.cwsRecord}</div>
                  </div>
                  <div className="di-championship-coach">{championship.coach}</div>
                </div>
              ))}
            </div>
          </article>

          {/* Legendary Players */}
          <article className="di-card">
            <h3>Legendary Players</h3>
            <div className="di-player-grid">
              {baseballData.legendaryPlayers.slice(0, 6).map((player) => (
                <div key={player.id} className="di-player-card">
                  <div className="di-player-name">{player.name}</div>
                  <div className="di-player-position">{player.position} • {player.years}</div>
                  <div className="di-player-accolades">
                    {player.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                  {player.mlbDraft && (
                    <div className="di-player-draft">{player.mlbDraft}</div>
                  )}
                </div>
              ))}
            </div>
          </article>

          {/* Program Stats */}
          <div className="di-stats-row">
            <div className="di-stat-card">
              <div className="di-stat-value">{baseballData.programStats.allTimeRecord}</div>
              <div className="di-stat-label">All-Time Record</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{(baseballData.programStats.winningPercentage * 100).toFixed(1)}%</div>
              <div className="di-stat-label">Winning Percentage</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{baseballData.programStats.collegeWorldSeriesAppearances}</div>
              <div className="di-stat-label">CWS Appearances</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{baseballData.programStats.conferenceChampionships}</div>
              <div className="di-stat-label">Conference Titles</div>
            </div>
          </div>
        </section>

        {/* Football Section */}
        <section className="di-section">
          <div className="di-section-header">
            <span className="di-kicker">Gridiron Glory</span>
            <h2 className="di-page-title">Football: Championship Tradition</h2>
            <p className="di-page-subtitle">
              4 national titles, 2 Heisman winners, and a legacy that spans from the Darrell Royal era to the SEC
            </p>
          </div>

          {/* National Championships */}
          <article className="di-card">
            <h3>National Championships</h3>
            <div className="di-championship-grid">
              {footballData.nationalChampionships.map((championship) => (
                <div key={championship.year} className="di-championship-card">
                  <div className="di-championship-year">{championship.year}</div>
                  <div className="di-championship-details">
                    <div className="di-label">Record</div>
                    <div className="di-value">{championship.record}</div>
                  </div>
                  <div className="di-championship-details">
                    <div className="di-label">Bowl Game</div>
                    <div className="di-value">{championship.bowl.split(' - ')[0]}</div>
                  </div>
                  <div className="di-championship-coach">{championship.coach}</div>
                  <div className="di-championship-note">{championship.notes}</div>
                </div>
              ))}
            </div>
          </article>

          {/* Heisman Winners */}
          <article className="di-card">
            <h3>Heisman Trophy Winners</h3>
            <div className="di-heisman-grid">
              {footballData.heismanWinners.map((winner) => (
                <div key={winner.year} className="di-heisman-card">
                  <div className="di-heisman-trophy">🏆</div>
                  <div className="di-heisman-year">{winner.year}</div>
                  <div className="di-heisman-name">{winner.name}</div>
                  <div className="di-heisman-position">{winner.position}</div>
                  <div className="di-heisman-stats">
                    <div>{winner.stats.rushingYards} rushing yards</div>
                    <div>{winner.stats.touchdowns} touchdowns</div>
                    <div>{winner.stats.yardsPerCarry} YPC</div>
                  </div>
                  <div className="di-heisman-nfl">{winner.nflCareer}</div>
                </div>
              ))}
            </div>
          </article>

          {/* Legendary Players */}
          <article className="di-card">
            <h3>Legendary Players</h3>
            <div className="di-player-grid">
              {footballData.legendaryPlayers.slice(0, 6).map((player) => (
                <div key={player.id} className="di-player-card">
                  <div className="di-player-name">{player.name}</div>
                  <div className="di-player-position">{player.position} • {player.years}</div>
                  <div className="di-player-accolades">
                    {player.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                  {player.nflDraft && (
                    <div className="di-player-draft">{player.nflDraft}</div>
                  )}
                </div>
              ))}
            </div>
          </article>

          {/* Program Stats */}
          <div className="di-stats-row">
            <div className="di-stat-card">
              <div className="di-stat-value">{footballData.programStats.allTimeRecord}</div>
              <div className="di-stat-label">All-Time Record</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{(footballData.programStats.winningPercentage * 100).toFixed(1)}%</div>
              <div className="di-stat-label">Winning Percentage</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{footballData.programStats.consensusAllAmericans}</div>
              <div className="di-stat-label">All-Americans</div>
            </div>
            <div className="di-stat-card">
              <div className="di-stat-value">{footballData.programStats.bowlAppearances}</div>
              <div className="di-stat-label">Bowl Games</div>
            </div>
          </div>
        </section>

        {/* Basketball Section */}
        <section className="di-section">
          <div className="di-section-header">
            <span className="di-kicker">Hardwood Excellence</span>
            <h2 className="di-page-title">Basketball: Men&apos;s & Women&apos;s Dominance</h2>
            <p className="di-page-subtitle">
              From Kevin Durant to Jody Conradt&apos;s perfect season—Texas basketball excellence spans generations
            </p>
          </div>

          {/* Men's Basketball */}
          <article className="di-card">
            <h3>Men&apos;s Basketball</h3>
            <div className="di-program-header">
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[0].programStats.allTimeRecord}</span>
                <span className="di-program-stat-label">All-Time Record</span>
              </div>
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[0].programStats.finalFourAppearances}</span>
                <span className="di-program-stat-label">Final Fours</span>
              </div>
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[0].programStats.ncaaTournamentAppearances}</span>
                <span className="di-program-stat-label">NCAA Tournaments</span>
              </div>
            </div>

            <div className="di-player-grid">
              {basketballData.programs[0].legendaryPlayers.slice(0, 4).map((player) => (
                <div key={player.id} className="di-player-card">
                  <div className="di-player-name">{player.name}</div>
                  <div className="di-player-position">{player.position} • {player.years}</div>
                  <div className="di-player-accolades">
                    {player.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                  {'nbaDraft' in player && player.nbaDraft && (
                    <div className="di-player-draft">{player.nbaDraft}</div>
                  )}
                </div>
              ))}
            </div>
          </article>

          {/* Women's Basketball */}
          <article className="di-card di-card--highlight">
            <h3>Women&apos;s Basketball — 1986 National Champions</h3>
            <div className="di-championship-highlight">
              <div className="di-championship-year-large">1986</div>
              <div className="di-championship-record">Perfect 34-0 Season</div>
              <div className="di-championship-note">First undefeated season in women&apos;s basketball history</div>
            </div>

            <div className="di-program-header">
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[1].programStats.allTimeRecord}</span>
                <span className="di-program-stat-label">All-Time Record</span>
              </div>
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[1].programStats.finalFourAppearances}</span>
                <span className="di-program-stat-label">Final Fours</span>
              </div>
              <div className="di-program-stat">
                <span className="di-program-stat-value">{basketballData.programs[1].programStats.wnbaFirstRoundPicks}</span>
                <span className="di-program-stat-label">WNBA 1st Rounders</span>
              </div>
            </div>

            <div className="di-player-grid">
              {basketballData.programs[1].legendaryPlayers.slice(0, 4).map((player) => (
                <div key={player.id} className="di-player-card">
                  <div className="di-player-name">{player.name}</div>
                  <div className="di-player-position">{player.position} • {player.years}</div>
                  <div className="di-player-accolades">
                    {player.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Track & Field Section */}
        <section className="di-section">
          <div className="di-section-header">
            <span className="di-kicker">Olympic Excellence</span>
            <h2 className="di-page-title">Track & Field: Olympic Powerhouse</h2>
            <p className="di-page-subtitle">
              40 Olympic medals, 16 NCAA team championships, and legendary athletes who brought home gold
            </p>
          </div>

          {/* Olympic Highlights */}
          <article className="di-card di-card--highlight">
            <h3>Olympic Medal Count</h3>
            <div className="di-olympic-stats">
              <div className="di-olympic-medal">
                <div className="di-medal-icon">🥇</div>
                <div className="di-medal-count">14</div>
                <div className="di-medal-label">Gold Medals</div>
              </div>
              <div className="di-olympic-medal">
                <div className="di-medal-icon">🥈</div>
                <div className="di-medal-count">14</div>
                <div className="di-medal-label">Silver Medals</div>
              </div>
              <div className="di-olympic-medal">
                <div className="di-medal-icon">🥉</div>
                <div className="di-medal-count">12</div>
                <div className="di-medal-label">Bronze Medals</div>
              </div>
              <div className="di-olympic-medal">
                <div className="di-medal-icon">🏅</div>
                <div className="di-medal-count">40</div>
                <div className="di-medal-label">Total Medals</div>
              </div>
            </div>
          </article>

          {/* Women's Track Legends */}
          <article className="di-card">
            <h3>Women&apos;s Track & Field Legends</h3>
            <p className="di-card-subtitle">14 NCAA Team Championships • 22 Olympic Medals</p>
            <div className="di-athlete-grid">
              {trackFieldData.programs[0].legendaryAthletes.slice(0, 5).map((athlete, idx) => (
                <div key={idx} className="di-athlete-card">
                  <div className="di-athlete-name">{athlete.name}</div>
                  <div className="di-athlete-event">{athlete.event} • {athlete.years}</div>
                  <div className="di-athlete-accolades">
                    {athlete.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Men's Track Legends */}
          <article className="di-card">
            <h3>Men&apos;s Track & Field Legends</h3>
            <p className="di-card-subtitle">2 NCAA Team Championships • 18 Olympic Medals</p>
            <div className="di-athlete-grid">
              {trackFieldData.programs[1].legendaryAthletes.slice(0, 5).map((athlete, idx) => (
                <div key={idx} className="di-athlete-card">
                  <div className="di-athlete-name">{athlete.name}</div>
                  <div className="di-athlete-event">{athlete.event} • {athlete.years}</div>
                  <div className="di-athlete-accolades">
                    {athlete.accolades.slice(0, 2).map((accolade, idx) => (
                      <div key={idx} className="di-accolade">{accolade}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Call to Action */}
        <section className="di-section">
          <article className="di-card di-card--cta">
            <h2>Explore More Texas Longhorns Intelligence</h2>
            <p>
              This is just the beginning. Access real-time stats, advanced analytics, and exclusive scouting reports across all sports.
            </p>
            <div className="di-actions">
              <Link className="di-action" href="/baseball/ncaab/hub">
                Explore Baseball Hub
              </Link>
              <Link className="di-action di-action--secondary" href="/">
                Return to Diamond Insights
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
