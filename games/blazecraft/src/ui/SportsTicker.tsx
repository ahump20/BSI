/**
 * SportsTicker - WC3-style live sports scores display
 *
 * Shows live scores below the minimap in the bottom bar.
 * Highlights favorite teams with gold border.
 * Part of Phase 4: BSI Sports Data Integration.
 */

import React from 'react';
import type { ScoreState, ConnectionStatus } from '@core/GameBridge';
import type { SportType } from '@core/GameEventContract';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SportsTickerProps {
  scores: ScoreState[];
  status: ConnectionStatus;
  favoriteTeams?: string[];
  onTeamClick?: (team: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SPORT_BADGES: Record<SportType, { icon: string; color: string; label: string }> = {
  mlb: { icon: '⚾', color: '#C41E3A', label: 'MLB' },
  nfl: { icon: '🏈', color: '#013369', label: 'NFL' },
  nba: { icon: '🏀', color: '#C9082A', label: 'NBA' },
  'college-baseball': { icon: '⚾', color: '#BF5700', label: 'CBB' },
  'college-football': { icon: '🏈', color: '#BF5700', label: 'CFB' },
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0.25rem',
    maxHeight: '100%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.25rem',
    marginBottom: '2px',
  },
  headerTitle: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  gameCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 6px',
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.65rem',
  },
  gameCardLive: {
    borderColor: '#2ECC71',
    background: 'rgba(46, 204, 113, 0.05)',
  },
  gameCardFavorite: {
    borderColor: '#FFD700',
    boxShadow: '0 0 4px rgba(255, 215, 0, 0.3)',
  },
  sportBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '3px',
    fontSize: '0.7rem',
  },
  teamsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    minWidth: 0,
  },
  teamRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
  },
  teamName: {
    fontSize: '0.6rem',
    color: '#F5F5DC',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '80px',
  },
  teamNameFavorite: {
    color: '#FFD700',
  },
  score: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#F5F5DC',
    minWidth: '16px',
    textAlign: 'right' as const,
  },
  scoreWinning: {
    color: '#2ECC71',
  },
  statusBadge: {
    fontSize: '0.5rem',
    fontWeight: 600,
    padding: '1px 4px',
    borderRadius: '2px',
    textTransform: 'uppercase' as const,
  },
  statusLive: {
    background: 'rgba(46, 204, 113, 0.2)',
    color: '#2ECC71',
  },
  statusFinal: {
    background: 'rgba(136, 136, 136, 0.2)',
    color: '#888',
  },
  statusScheduled: {
    background: 'rgba(52, 152, 219, 0.2)',
    color: '#3498DB',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '0.6rem',
    padding: '0.5rem',
  },
  inningClock: {
    fontSize: '0.5rem',
    color: '#888',
    marginLeft: '4px',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getStatusBadgeStyle(status: ScoreState['status']): React.CSSProperties {
  switch (status) {
    case 'in_progress':
      return styles.statusLive;
    case 'final':
      return styles.statusFinal;
    default:
      return styles.statusScheduled;
  }
}

function getStatusText(score: ScoreState): string {
  if (score.status === 'in_progress') {
    if (score.period) return score.period;
    if (score.clock) return score.clock;
    return 'LIVE';
  }
  if (score.status === 'final') return 'FINAL';
  if (score.status === 'delayed') return 'DELAY';
  return 'SOON';
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function SportsTicker({
  scores,
  status,
  favoriteTeams = [],
  onTeamClick,
}: SportsTickerProps): React.ReactElement {
  const favoriteSet = new Set(favoriteTeams);

  // Sort: live games first, then favorites, then by sport
  const sortedScores = [...scores].sort((a, b) => {
    // Live games first
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

    // Favorites second
    const aFav = favoriteSet.has(a.homeTeam) || favoriteSet.has(a.awayTeam);
    const bFav = favoriteSet.has(b.homeTeam) || favoriteSet.has(b.awayTeam);
    if (aFav && !bFav) return -1;
    if (bFav && !aFav) return 1;

    // Then by sport order
    const sportOrder: SportType[] = ['mlb', 'nfl', 'nba', 'college-baseball', 'college-football'];
    return sportOrder.indexOf(a.sport) - sportOrder.indexOf(b.sport);
  });

  const getConnectionColor = (): string => {
    switch (status) {
      case 'connected':
        return '#2ECC71';
      case 'error':
        return '#E74C3C';
      default:
        return '#888';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Live Scores</span>
        <div
          style={{
            ...styles.statusDot,
            background: getConnectionColor(),
            animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
          }}
          title={`Sports: ${status}`}
        />
      </div>

      {sortedScores.length === 0 ? (
        <div style={styles.emptyState}>
          {status === 'connected' ? 'No games right now' : 'Connecting...'}
        </div>
      ) : (
        sortedScores.slice(0, 5).map((game) => {
          const badge = SPORT_BADGES[game.sport];
          const isLive = game.status === 'in_progress';
          const homeWinning = game.homeScore > game.awayScore;
          const awayWinning = game.awayScore > game.homeScore;
          const homeFavorite = favoriteSet.has(game.homeTeam);
          const awayFavorite = favoriteSet.has(game.awayTeam);
          const hasFavorite = homeFavorite || awayFavorite;

          return (
            <div
              key={game.gameId}
              style={{
                ...styles.gameCard,
                ...(isLive ? styles.gameCardLive : {}),
                ...(hasFavorite ? styles.gameCardFavorite : {}),
              }}
              onClick={() => onTeamClick?.(homeFavorite ? game.homeTeam : game.awayTeam)}
              title={`${game.awayTeam} @ ${game.homeTeam}`}
            >
              {/* Sport Badge */}
              <div
                style={{
                  ...styles.sportBadge,
                  background: badge.color,
                }}
                title={badge.label}
              >
                {badge.icon}
              </div>

              {/* Teams & Scores */}
              <div style={styles.teamsContainer}>
                {/* Away Team */}
                <div style={styles.teamRow}>
                  <span
                    style={{
                      ...styles.teamName,
                      ...(awayFavorite ? styles.teamNameFavorite : {}),
                    }}
                  >
                    {game.awayTeam}
                  </span>
                  <span
                    style={{
                      ...styles.score,
                      ...(awayWinning ? styles.scoreWinning : {}),
                    }}
                  >
                    {game.awayScore}
                  </span>
                </div>

                {/* Home Team */}
                <div style={styles.teamRow}>
                  <span
                    style={{
                      ...styles.teamName,
                      ...(homeFavorite ? styles.teamNameFavorite : {}),
                    }}
                  >
                    {game.homeTeam}
                  </span>
                  <span
                    style={{
                      ...styles.score,
                      ...(homeWinning ? styles.scoreWinning : {}),
                    }}
                  >
                    {game.homeScore}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  ...styles.statusBadge,
                  ...getStatusBadgeStyle(game.status),
                }}
              >
                {getStatusText(game)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
