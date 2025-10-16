import React, { useState, useEffect } from 'react';
import './BoxScore.css';

function BoxScore({ game, onBack }) {
  const [activeTab, setActiveTab] = useState('batting');
  const [boxScoreData, setBoxScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoxScore();
    // Poll for updates if game is live
    if (game.status === 'live') {
      const interval = setInterval(fetchBoxScore, 15000);
      return () => clearInterval(interval);
    }
  }, [game.id]);

  const fetchBoxScore = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}/boxscore`);
      const data = await response.json();
      setBoxScoreData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching box score:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading box score...</div>;
  }

  const renderLineScore = () => {
    const innings = boxScoreData.lineScore.innings;
    return (
      <div className="line-score">
        <table>
          <thead>
            <tr>
              <th className="team-header"></th>
              {innings.map((_, idx) => (
                <th key={idx}>{idx + 1}</th>
              ))}
              <th className="total-header">R</th>
              <th className="total-header">H</th>
              <th className="total-header">E</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="team-name">{game.awayTeam.name}</td>
              {boxScoreData.lineScore.away.innings.map((runs, idx) => (
                <td key={idx} className="inning-score">{runs}</td>
              ))}
              <td className="total-score">{boxScoreData.lineScore.away.runs}</td>
              <td className="total-score">{boxScoreData.lineScore.away.hits}</td>
              <td className="total-score">{boxScoreData.lineScore.away.errors}</td>
            </tr>
            <tr>
              <td className="team-name">{game.homeTeam.name}</td>
              {boxScoreData.lineScore.home.innings.map((runs, idx) => (
                <td key={idx} className="inning-score">{runs}</td>
              ))}
              <td className="total-score">{boxScoreData.lineScore.home.runs}</td>
              <td className="total-score">{boxScoreData.lineScore.home.hits}</td>
              <td className="total-score">{boxScoreData.lineScore.home.errors}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderBattingStats = () => {
    return (
      <div className="batting-stats">
        <div className="team-stats">
          <h3>{game.awayTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Player</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>RBI</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.batting.away.map((player) => (
                  <tr key={player.id}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      <span className="player-pos">{player.position}</span>
                    </td>
                    <td>{player.ab}</td>
                    <td>{player.r}</td>
                    <td>{player.h}</td>
                    <td>{player.rbi}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td className="avg">{player.seasonAvg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="team-stats">
          <h3>{game.homeTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Player</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>RBI</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.batting.home.map((player) => (
                  <tr key={player.id}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      <span className="player-pos">{player.position}</span>
                    </td>
                    <td>{player.ab}</td>
                    <td>{player.r}</td>
                    <td>{player.h}</td>
                    <td>{player.rbi}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td className="avg">{player.seasonAvg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPitchingStats = () => {
    return (
      <div className="pitching-stats">
        <div className="team-stats">
          <h3>{game.awayTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Pitcher</th>
                  <th>IP</th>
                  <th>H</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>PC</th>
                  <th>ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.pitching.away.map((player) => (
                  <tr key={player.id} className={player.decision ? 'decision-pitcher' : ''}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      {player.decision && (
                        <span className="decision">{player.decision}</span>
                      )}
                    </td>
                    <td>{player.ip}</td>
                    <td>{player.h}</td>
                    <td>{player.r}</td>
                    <td>{player.er}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td>{player.pitches}</td>
                    <td className="era">{player.seasonEra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="team-stats">
          <h3>{game.homeTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Pitcher</th>
                  <th>IP</th>
                  <th>H</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>PC</th>
                  <th>ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.pitching.home.map((player) => (
                  <tr key={player.id} className={player.decision ? 'decision-pitcher' : ''}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      {player.decision && (
                        <span className="decision">{player.decision}</span>
                      )}
                    </td>
                    <td>{player.ip}</td>
                    <td>{player.h}</td>
                    <td>{player.r}</td>
                    <td>{player.er}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td>{player.pitches}</td>
                    <td className="era">{player.seasonEra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="box-score">
      <div className="box-score-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="game-info">
          <h2>{game.awayTeam.name} at {game.homeTeam.name}</h2>
          <span className="game-date">{game.date}</span>
        </div>
      </div>

      {renderLineScore()}

      <div className="stats-tabs">
        <button 
          className={activeTab === 'batting' ? 'active' : ''}
          onClick={() => setActiveTab('batting')}
        >
          Batting
        </button>
        <button 
          className={activeTab === 'pitching' ? 'active' : ''}
          onClick={() => setActiveTab('pitching')}
        >
          Pitching
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'batting' ? renderBattingStats() : renderPitchingStats()}
      </div>
    </div>
  );
}

export default BoxScore;
