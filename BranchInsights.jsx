import React, { useMemo } from 'react';
import './BranchInsights.css';

const formatMatchup = (game) => {
  if (!game) return 'Unknown matchup';
  const awayName = game.awayTeam?.name ?? 'Away';
  const homeName = game.homeTeam?.name ?? 'Home';
  return `${awayName} at ${homeName}`;
};

const safeNumber = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const deriveUniqueProperties = (games = []) => {
  const properties = [];

  games.forEach((game) => {
    if (!game) return;

    const homeScore = safeNumber(game.homeTeam?.score);
    const awayScore = safeNumber(game.awayTeam?.score);
    const runDiff = Math.abs(homeScore - awayScore);
    const totalRuns = homeScore + awayScore;
    const inningNumber = safeNumber(game.inning?.number);
    const matchup = formatMatchup(game);

    const addProperty = (key, title, description) => {
      properties.push({
        key: `${key}-${game.id ?? matchup}`,
        title,
        description,
        matchup,
        status: game.status,
        gameId: game.id,
        priority: key,
      });
    };

    if (game.status === 'live' && inningNumber >= 9 && runDiff === 0) {
      addProperty(
        'walkoff-watch',
        'Walk-off Watch',
        `${matchup} is tied late — every pitch could end it.`
      );
    }

    if (game.status === 'live' && inningNumber > 9) {
      addProperty(
        'extra-innings',
        'Extra-Inning Drama',
        `${matchup} has pushed beyond regulation, showcasing serious resilience.`
      );
    }

    if (runDiff <= 1 && (game.status === 'live' || game.status === 'final')) {
      addProperty(
        'one-run-game',
        'One-Run Pressure',
        `${matchup} is separated by a single run. High-leverage baseball.`
      );
    }

    if (totalRuns >= 12 && game.status !== 'scheduled') {
      addProperty(
        'slugfest',
        'Slugfest Alert',
        `${matchup} has piled up ${totalRuns} runs. Offenses are mashing.`
      );
    }

    if (totalRuns <= 3 && game.status === 'live' && inningNumber >= 5) {
      addProperty(
        'pitchers-duel',
        "Pitcher's Duel",
        `${matchup} is a low-scoring grinder deep into the night.`
      );
    }

    const homeRank = safeNumber(game.homeTeam?.rank);
    const awayRank = safeNumber(game.awayTeam?.rank);
    if (
      (homeRank > 0 && homeRank <= 25) ||
      (awayRank > 0 && awayRank <= 25)
    ) {
      addProperty(
        'top-25',
        'Top 25 Spotlight',
        `${matchup} features a ranked squad. Stakes are heavy.`
      );
    }

    if (game.status === 'scheduled') {
      const timeLabel = game.scheduledTime ?? 'TBD';
      addProperty(
        'on-deck',
        'On-Deck Matchup',
        `${matchup} first pitch at ${timeLabel}. Get scouting reports ready.`
      );
    }

    if (game.status === 'final' && runDiff >= 6) {
      addProperty(
        'statement-win',
        'Statement Win',
        `${matchup} ended in a blowout. File that for resume builders.`
      );
    }
  });

  return properties;
};

const deriveUpgradeOpportunities = (games = []) => {
  const upgradesMap = new Map();

  const register = (key, suggestion) => {
    if (!upgradesMap.has(key)) {
      upgradesMap.set(key, suggestion);
    }
  };

  games.forEach((game) => {
    if (!game) return;

    const matchup = formatMatchup(game);
    const homeScore = safeNumber(game.homeTeam?.score);
    const awayScore = safeNumber(game.awayTeam?.score);
    const runDiff = Math.abs(homeScore - awayScore);
    const inningNumber = safeNumber(game.inning?.number);

    if (game.status === 'live' && runDiff <= 2) {
      register(`win-prob-${game.id ?? matchup}`, {
        title: 'Live Win Probability',
        description: `Overlay a win probability chart for ${matchup} to show leverage swings in real time.`,
        gameId: game.id,
      });
    }

    if (game.status === 'live' && game.currentPitcher) {
      register(`pitch-mix-${game.id ?? matchup}`, {
        title: 'Pitch Mix Overlay',
        description: `Unlock pitch sequencing visuals for ${game.currentPitcher.name} to highlight usage trends by count.`,
        gameId: game.id,
      });
    }

    if (game.status === 'live' && inningNumber >= 7 && (game.situation?.outs ?? 0) >= 2 && runDiff <= 3) {
      register(`bullpen-alert-${game.id ?? matchup}`, {
        title: 'Bullpen Heat Check',
        description: `Surface bullpen readiness and velocity bands as ${matchup} hits late-inning pressure.`,
        gameId: game.id,
      });
    }

    if (game.status === 'final') {
      register(`recap-${game.id ?? matchup}`, {
        title: 'Instant Diamond Recap',
        description: `Auto-generate a verified recap for ${matchup} and ship it straight to subscribers.`,
        gameId: game.id,
      });
    }

    if (game.status === 'scheduled') {
      register(`alerts-${game.id ?? matchup}`, {
        title: 'Lineup Intel Alerts',
        description: `Push projected lineups and matchup notes before ${matchup} starts to keep fans locked in.`,
        gameId: game.id,
      });
    }
  });

  if (!games.some((game) => safeNumber(game.homeTeam?.rank) <= 25 || safeNumber(game.awayTeam?.rank) <= 25)) {
    register('scouting-pro', {
      title: 'Diamond Pro Scouting Packs',
      description: 'Bundle spray charts, platoon splits, and prospect grades behind the paywall to boost conversions.',
    });
  }

  if (games.length > 3) {
    register('multi-view', {
      title: 'Multi-Game Command Center',
      description: 'Allow Diamond Pro users to pin three simultaneous streams with synchronized play-by-play.',
    });
  }

  return Array.from(upgradesMap.values());
};

function BranchInsights({ games = [], onGameSelect }) {
  const uniqueProperties = useMemo(() => deriveUniqueProperties(games), [games]);
  const upgradeOpportunities = useMemo(() => deriveUpgradeOpportunities(games), [games]);

  const handleViewGame = (gameId) => {
    if (!gameId || !onGameSelect) return;
    const targetGame = games.find((item) => item?.id === gameId);
    if (targetGame) {
      onGameSelect(targetGame);
    }
  };

  const hasGames = games && games.length > 0;

  return (
    <div className="branch-insights">
      <section className="insights-section">
        <header className="section-header">
          <div>
            <h2>Unique Game Properties</h2>
            <p className="section-subtitle">
              Snapshot the quirks across today&apos;s slate and surface what matters fast.
            </p>
          </div>
          <span className="badge">Standard over vibes</span>
        </header>

        {!hasGames && (
          <div className="empty-state">
            <p>No games available to analyze yet. Once the slate loads, we&apos;ll chart the storylines.</p>
          </div>
        )}

        {hasGames && uniqueProperties.length === 0 && (
          <div className="empty-state">
            <p>Games are calm for now — no standout trends detected. Keep monitoring.</p>
          </div>
        )}

        <div className="card-grid">
          {uniqueProperties.map((item) => (
            <article key={item.key} className="insight-card">
              <div className="insight-header">
                <h3>{item.title}</h3>
                {item.status && <span className={`status-pill status-${item.status}`}>{item.status}</span>}
              </div>
              <p className="matchup">{item.matchup}</p>
              <p className="description">{item.description}</p>
              {item.gameId && onGameSelect && (
                <button className="cta" onClick={() => handleViewGame(item.gameId)}>
                  Jump to game
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="insights-section">
        <header className="section-header">
          <div>
            <h2>Upgrades on Deck</h2>
            <p className="section-subtitle">
              Diamond Pro hooks to unlock right now based on live context.
            </p>
          </div>
          <span className="badge badge-upgrade">Clarity beats noise</span>
        </header>

        {hasGames && upgradeOpportunities.length === 0 && (
          <div className="empty-state">
            <p>All core tools are active. Monitor the slate for new leverage spots.</p>
          </div>
        )}

        <div className="card-grid upgrades">
          {upgradeOpportunities.map((item, idx) => (
            <article key={`${item.title}-${idx}`} className="insight-card upgrade">
              <h3>{item.title}</h3>
              <p className="description">{item.description}</p>
              {item.gameId && onGameSelect && (
                <button className="cta" onClick={() => handleViewGame(item.gameId)}>
                  Inspect matchup
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BranchInsights;
