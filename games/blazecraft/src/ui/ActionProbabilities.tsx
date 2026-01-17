/**
 * ActionProbabilities - Visualize agent policy outputs
 *
 * Shows which actions the agent considered and their relative probabilities.
 * Key component for understanding "what else could have happened?"
 */

import React from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ActionProbabilitiesProps {
  probabilities: number[] | undefined;
  actionMask: boolean[] | undefined;
  actionNames?: string[];
}

// Default action names for MicroRTS-style games
const DEFAULT_ACTION_NAMES = [
  'Idle',
  'Move North',
  'Move South',
  'Move East',
  'Move West',
  'Attack',
  'Harvest',
  'Return',
  'Produce Worker',
  'Produce Light',
  'Produce Heavy',
  'Produce Ranged',
  'Build Base',
  'Build Barracks',
];

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: '#0D0D0D',
    borderRadius: '4px',
    padding: '0.75rem',
    marginTop: '0.5rem',
  },
  title: {
    fontSize: '0.65rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    marginBottom: '0.5rem',
    letterSpacing: '0.05em',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionName: {
    fontSize: '0.7rem',
    color: '#F5F5DC',
    minWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  barContainer: {
    flex: 1,
    height: '12px',
    background: '#1A1A1A',
    borderRadius: '2px',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  bar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  probability: {
    fontSize: '0.65rem',
    color: '#888',
    minWidth: '35px',
    textAlign: 'right' as const,
  },
  masked: {
    opacity: 0.3,
  },
  noData: {
    fontSize: '0.75rem',
    color: '#555',
    textAlign: 'center' as const,
    padding: '0.5rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getBarColor(probability: number, isTopAction: boolean): string {
  if (isTopAction) return '#BF5700';  // Burnt orange for chosen action
  if (probability > 0.3) return '#3498DB';  // Blue for high probability
  if (probability > 0.1) return '#F39C12';  // Yellow for medium
  return '#555';  // Gray for low
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ActionProbabilities({
  probabilities,
  actionMask,
  actionNames = DEFAULT_ACTION_NAMES,
}: ActionProbabilitiesProps): React.ReactElement {
  if (!probabilities || probabilities.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Action Probabilities</div>
        <div style={styles.noData}>No probability data available</div>
      </div>
    );
  }

  // Create sorted list of actions by probability
  const actions = probabilities.map((prob, index) => ({
    index,
    name: actionNames[index] ?? `Action ${index}`,
    probability: prob,
    isMasked: actionMask ? !actionMask[index] : false,
  })).sort((a, b) => b.probability - a.probability);

  // Only show top 6 actions
  const topActions = actions.slice(0, 6);
  const maxProb = Math.max(...topActions.map(a => a.probability));

  return (
    <div style={styles.container}>
      <div style={styles.title}>Action Probabilities</div>
      <div style={styles.actionList}>
        {topActions.map((action, idx) => (
          <div
            key={action.index}
            style={{
              ...styles.actionRow,
              ...(action.isMasked ? styles.masked : {}),
            }}
          >
            <span style={styles.actionName}>{action.name}</span>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${(action.probability / maxProb) * 100}%`,
                  background: getBarColor(action.probability, idx === 0),
                }}
              />
            </div>
            <span style={styles.probability}>
              {(action.probability * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
