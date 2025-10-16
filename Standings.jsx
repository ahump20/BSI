import React, { useState, useEffect } from 'react';
import './Standings.css';

function Standings() {
  const [conference, setConference] = useState('sec');
  const [standingsData, setStandingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, [conference]);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/standings/${conference}`);
      const data = await response.json();
      setStandingsData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching standings:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading standings...</div>;
  }

  return (
    <div className="standings">
      <div className="standings-header">
        <h2>Conference Standings</h2>
        <select 
          value={conference} 
          onChange={(e) => setConference(e.target.value)}
          className="conference-select"
        >
          <option value="sec">SEC</option>
          <option value="acc">ACC</option>
          <option value="big12">Big 12</option>
          <option value="pac12">Pac-12</option>
          <option value="big10">Big Ten</option>
        </select>
      </div>

      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th className="team-col">Team</th>
              <th>Conf</th>
              <th>Overall</th>
              <th>RPI</th>
              <th className="hide-mobile">Home</th>
              <th className="hide-mobile">Away</th>
              <th className="hide-mobile">Streak</th>
            </tr>
          </thead>
          <tbody>
            {standingsData.teams.map((team, idx) => (
              <tr key={team.id} className={idx < 2 ? 'tournament-team' : ''}>
                <td className="rank-col">{idx + 1}</td>
                <td className="team-col">
                  <span className="team-name">{team.name}</span>
                </td>
                <td className="record">
                  <span className="wins">{team.confWins}</span>-
                  <span className="losses">{team.confLosses}</span>
                  {team.confPct && (
                    <span className="pct">{team.confPct}</span>
                  )}
                </td>
                <td className="record">
                  <span className="wins">{team.overallWins}</span>-
                  <span className="losses">{team.overallLosses}</span>
                  {team.overallPct && (
                    <span className="pct">{team.overallPct}</span>
                  )}
                </td>
                <td className="rpi">
                  <span className="rpi-rank">{team.rpiRank}</span>
                  <span className="rpi-value">({team.rpiValue})</span>
                </td>
                <td className="hide-mobile record-small">
                  {team.homeWins}-{team.homeLosses}
                </td>
                <td className="hide-mobile record-small">
                  {team.awayWins}-{team.awayLosses}
                </td>
                <td className="hide-mobile streak">
                  <span className={team.streak.startsWith('W') ? 'win-streak' : 'loss-streak'}>
                    {team.streak}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="standings-legend">
        <span className="tournament-indicator">■</span> NCAA Tournament Position
      </div>

      <div className="stat-leaders">
        <h3>Conference Leaders</h3>
        <div className="leaders-grid">
          <div className="leader-category">
            <h4>Batting Average</h4>
            {standingsData.leaders.batting.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.avg}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>Home Runs</h4>
            {standingsData.leaders.homeruns.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.hr}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>ERA</h4>
            {standingsData.leaders.era.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.era}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>Strikeouts</h4>
            {standingsData.leaders.strikeouts.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Standings;
