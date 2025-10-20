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

  const getBoxScoreInsights = () => {
    if (!boxScoreData) return [];

    const insights = [];
    const inningsPlayed = boxScoreData.lineScore?.innings?.length ?? 0;
    const awayLine = boxScoreData.lineScore?.away ?? {};
    const homeLine = boxScoreData.lineScore?.home ?? {};
    const awayRuns = Number(awayLine.runs ?? 0);
    const homeRuns = Number(homeLine.runs ?? 0);
    const runDiff = Math.abs(awayRuns - homeRuns);
    const totalRuns = awayRuns + homeRuns;
    const awayHits = Number(awayLine.hits ?? 0);
    const homeHits = Number(homeLine.hits ?? 0);
    const awayErrors = Number(awayLine.errors ?? 0);
    const homeErrors = Number(homeLine.errors ?? 0);

    if (inningsPlayed > 9) {
      insights.push({
        title: 'Extra innings grind',
        description:
          'Both dugouts have stretched the bullpen. Conditioning and bench depth are being tested.',
      });
    }

    if (runDiff <= 1 && game.status === 'final') {
      insights.push({
        title: 'One-run finish',
        description:
          'Nails were chewed down late. Track leverage index to highlight the swing moments for the recap.',
      });
    }

    if (awayHits === 0 || homeHits === 0) {
      const teamName = awayHits === 0 ? game.awayTeam?.name : game.homeTeam?.name;
      insights.push({
        title: 'No-hit alert',
        description: `${teamName ?? 'A lineup'} was held without a hit. Verify the scoring to confirm history.`,
      });
    }

    if (totalRuns >= 12) {
      insights.push({
        title: 'Offense overload',
        description:
          'The bats never cooled off. Slice through situational hitting numbers for the postgame note.',
      });
    }

    if (awayErrors === 0 && homeErrors === 0) {
      insights.push({
        title: 'Clean gloves',
        description:
          'Zero errors on the ledger. Clip the defensive gems for Diamond Pro subscribers.',
      });
    }

    const pitchingClips = [...(boxScoreData.pitching?.away ?? []), ...(boxScoreData.pitching?.home ?? [])];
    const strikeoutLeader = pitchingClips.reduce(
      (max, pitcher) => (Number(pitcher.k ?? 0) > max ? Number(pitcher.k ?? 0) : max),
      0
    );
    if (strikeoutLeader >= 10) {
      insights.push({
        title: 'Strikeout show',
        description: `A staff member punched out ${strikeoutLeader}. Build a pitch-mix breakdown clip.`,
      });
    }

    const multiHitPlayers = [...(boxScoreData.batting?.away ?? []), ...(boxScoreData.batting?.home ?? [])]
      .filter((player) => Number(player.h ?? 0) >= 3)
      .map((player) => player.name)
      .slice(0, 3);
    if (multiHitPlayers.length > 0) {
      insights.push({
        title: 'Hot bats',
        description: `${multiHitPlayers.join(', ')} stacked 3+ hits. Feature them in the heat map carousel.`,
      });
    }

    return insights.slice(0, 5);
  };

  const boxScoreInsights = getBoxScoreInsights();

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

      {boxScoreInsights.length > 0 && (
        <div className="insights-panel">
          <h3>Game storylines</h3>
          <div className="insights-grid">
            {boxScoreInsights.map((insight, idx) => (
              <div key={`${insight.title}-${idx}`} className="insights-chip">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BoxScore;
