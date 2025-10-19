'use client';

import { useMemo, useState } from 'react';
import type { BaseballGame } from '@/lib/baseball/games';

type TabKey = 'box' | 'plays' | 'tendencies';

interface GameCardProps {
  game: BaseballGame & { locked?: boolean };
}

const tabLabels: Record<TabKey, string> = {
  box: 'Box Score',
  plays: 'Plays',
  tendencies: 'Team Tendencies'
};

export function GameCard({ game }: GameCardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('box');
  const locked = game.locked ?? false;

  const formattedStart = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZoneName: 'short'
      }).format(new Date(game.startTimeUtc));
    } catch (error) {
      console.warn('Failed to format start time', error);
      return new Date(game.startTimeUtc).toISOString();
    }
  }, [game.startTimeUtc]);

  return (
    <article className="di-game-card" aria-labelledby={`${game.id}-title`}>
      <header className="di-game-card__header">
        <h2 id={`${game.id}-title`} className="di-game-card__heading">
          {game.away.shortName} @ {game.home.shortName}
        </h2>
        <div className="di-game-card__status">
          <span className={`di-game-card__pill di-game-card__pill--${game.status.toLowerCase()}`}>
            {game.statusLabel}
          </span>
          <span className="di-game-card__start">{formattedStart}</span>
        </div>
        {locked ? (
          <span className="di-game-card__tier di-game-card__tier--locked">Diamond Pro</span>
        ) : (
          <span className="di-game-card__tier">{game.subscriptionTier === 'diamond_pro' ? 'Diamond Pro' : 'Free'}</span>
        )}
      </header>

      <div className="di-game-card__scoreboard">
        {[game.away, game.home].map((team, idx) => (
          <div key={team.id} className="di-game-card__team" aria-label={`${team.name} line score`}>
            <div className="di-game-card__team-meta">
              <span className="di-game-card__team-name" id={`${game.id}-team-${idx}`}>
                {team.name}
              </span>
              <span className="di-game-card__team-record">{team.record ?? 'Record TBA'}</span>
            </div>
            <div className="di-game-card__team-stats" role="group" aria-labelledby={`${game.id}-team-${idx}`}>
              <span className="di-game-card__runs" aria-label="Runs">
                {team.runs}
              </span>
              <span className="di-game-card__stat" aria-label="Hits">
                H {team.hits}
              </span>
              <span className="di-game-card__stat" aria-label="Errors">
                E {team.errors}
              </span>
            </div>
          </div>
        ))}
      </div>

      <nav className="di-game-card__tabs" aria-label={`Game detail tabs for ${game.slug}`}>
        {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`di-game-card__tab${activeTab === tab ? ' di-game-card__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-controls={`${game.id}-${tab}`}
            aria-selected={activeTab === tab}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <section className="di-game-card__panel" id={`${game.id}-${activeTab}`}>
        {activeTab === 'box' && (
          <div className="di-game-card__box" role="table" aria-label="Box score">
            <div className="di-game-card__box-row di-game-card__box-row--head" role="row">
              <span role="columnheader">Team</span>
              <span role="columnheader">Runs</span>
              <span role="columnheader">Hits</span>
              <span role="columnheader">Errors</span>
            </div>
            {[game.away, game.home].map((team) => (
              <div key={team.id} className="di-game-card__box-row" role="row">
                <span role="cell">{team.shortName}</span>
                <span role="cell">{team.runs}</span>
                <span role="cell">{team.hits}</span>
                <span role="cell">{team.errors}</span>
              </div>
            ))}
            <div className="di-game-card__box-footer">
              {game.inningState.inning ? (
                <span>
                  {game.inningState.half === 'TOP' ? 'Top' : 'Bottom'} {game.inningState.inning} ·{' '}
                  {typeof game.inningState.outs === 'number' ? `${game.inningState.outs} outs` : 'In progress'}
                </span>
              ) : (
                <span>First pitch at {formattedStart}</span>
              )}
              {!locked && game.leverageIndex !== null && (
                <span className="di-game-card__leverage">LI {game.leverageIndex.toFixed(2)}</span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plays' && (
          <div className="di-game-card__plays" role="list">
            {locked && <p className="di-game-card__locked">Unlock live plays with Diamond Pro.</p>}
            {!locked && game.plays.length === 0 && <p>No play data yet. Refresh closer to first pitch.</p>}
            {!locked &&
              game.plays.map((play) => (
                <article key={play.createdAt} className="di-game-card__play" role="listitem">
                  <span className="di-game-card__play-desc">{play.description}</span>
                  <span className="di-game-card__play-meta">
                    {new Date(play.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {typeof play.leverageIndex === 'number' && <span> · LI {play.leverageIndex.toFixed(1)}</span>}
                  </span>
                </article>
              ))}
          </div>
        )}

        {activeTab === 'tendencies' && (
          <div className="di-game-card__tendencies">
            {locked && <p className="di-game-card__locked">Upgrade to Diamond Pro to view tendency radar.</p>}
            {!locked && (
              <dl>
                {[game.away, game.home].map((team) => (
                  <div key={team.id} className="di-game-card__tendency-group">
                    <dt>{team.shortName} Tendencies</dt>
                    {team.tendencies.length === 0 ? (
                      <dd>Data sync in progress.</dd>
                    ) : (
                      team.tendencies.map((tendency) => (
                        <dd key={`${team.id}-${tendency.label}`}>
                          <span>{tendency.label}</span>
                          <span>{tendency.value}</span>
                        </dd>
                      ))
                    )}
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </section>
    </article>
  );
}
