/**
 * UnitInfo - Selected Unit Details Panel
 *
 * Shows information about the currently selected unit.
 * WC3-style unit info card.
 */

import React from 'react';
import type { Unit } from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UnitInfoProps {
  unit: Unit;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0.25rem',
    lineHeight: 1,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1rem',
  },
  unitIcon: {
    width: '64px',
    height: '64px',
    background: '#0D0D0D',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    marginBottom: '1rem',
    border: '2px solid #333',
  },
  unitName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  unitType: {
    fontSize: '0.75rem',
    color: '#888',
    textTransform: 'capitalize' as const,
  },
  section: {
    marginTop: '1.5rem',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    marginBottom: '0.5rem',
    letterSpacing: '0.05em',
  },
  healthBar: {
    width: '100%',
    height: '20px',
    background: '#0D0D0D',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative' as const,
    marginBottom: '0.25rem',
  },
  healthFill: {
    height: '100%',
    transition: 'width 0.2s',
  },
  healthText: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#FFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },
  stat: {
    background: '#0D0D0D',
    borderRadius: '4px',
    padding: '0.75rem',
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '0.65rem',
    color: '#888',
    textTransform: 'uppercase' as const,
  },
  actionSection: {
    background: '#0D0D0D',
    borderRadius: '4px',
    padding: '0.75rem',
    marginTop: '0.5rem',
  },
  actionLabel: {
    fontSize: '0.65rem',
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  },
  actionValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  actionTarget: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '0.25rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getUnitIcon(type: string): string {
  switch (type) {
    case 'base': return '🏰';
    case 'barracks': return '🏭';
    case 'worker': return '⛏️';
    case 'light': return '⚔️';
    case 'heavy': return '🛡️';
    case 'ranged': return '🏹';
    case 'resource': return '💎';
    default: return '❓';
  }
}

function getTeamColor(team: string): string {
  switch (team) {
    case '0': return '#3498DB';
    case '1': return '#E74C3C';
    default: return '#888888';
  }
}

function getHealthColor(percent: number): string {
  if (percent > 0.6) return '#2ECC71';
  if (percent > 0.3) return '#F39C12';
  return '#E74C3C';
}

function formatPosition(x: number, y: number): string {
  return `(${x}, ${y})`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function UnitInfo({ unit, onClose }: UnitInfoProps): React.ReactElement {
  const healthPercent = unit.hp / unit.maxHp;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Unit Info</div>
        <button
          style={styles.closeButton}
          onClick={onClose}
          title="Close"
        >
          ×
        </button>
      </div>

      <div style={styles.content}>
        {/* Unit Icon */}
        <div
          style={{
            ...styles.unitIcon,
            borderColor: getTeamColor(unit.team),
          }}
        >
          {getUnitIcon(unit.type)}
        </div>

        {/* Unit Name */}
        <div style={{ ...styles.unitName, color: getTeamColor(unit.team) }}>
          {unit.type.toUpperCase()}
        </div>
        <div style={styles.unitType}>
          Team {unit.team === '0' ? 'Blue' : unit.team === '1' ? 'Red' : 'Neutral'}
          {' • '} ID: {unit.id.slice(0, 8)}
        </div>

        {/* Health */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Health</div>
          <div style={styles.healthBar}>
            <div
              style={{
                ...styles.healthFill,
                width: `${healthPercent * 100}%`,
                background: getHealthColor(healthPercent),
              }}
            />
            <div style={styles.healthText}>
              {unit.hp} / {unit.maxHp}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Status</div>
          <div style={styles.statGrid}>
            <div style={styles.stat}>
              <div style={styles.statValue}>
                {formatPosition(unit.position.x, unit.position.y)}
              </div>
              <div style={styles.statLabel}>Position</div>
            </div>
            {unit.resources !== undefined && (
              <div style={styles.stat}>
                <div style={styles.statValue}>{unit.resources}</div>
                <div style={styles.statLabel}>Carrying</div>
              </div>
            )}
            {unit.productionProgress !== undefined && (
              <div style={styles.stat}>
                <div style={styles.statValue}>
                  {Math.round(unit.productionProgress * 100)}%
                </div>
                <div style={styles.statLabel}>Production</div>
              </div>
            )}
          </div>
        </div>

        {/* Current Action */}
        {unit.currentAction && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Current Action</div>
            <div style={styles.actionSection}>
              <div style={styles.actionLabel}>Action</div>
              <div style={styles.actionValue}>{unit.currentAction}</div>
              {unit.targetId && (
                <div style={styles.actionTarget}>
                  Target: {unit.targetId.slice(0, 8)}
                </div>
              )}
              {unit.targetPosition && (
                <div style={styles.actionTarget}>
                  Moving to: {formatPosition(unit.targetPosition.x, unit.targetPosition.y)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
