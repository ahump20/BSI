/**
 * SelectedPanel - Shows currently selected unit/entity info
 *
 * Compact panel showing unit icon, name, and basic status.
 * Positioned above the minimap in the left sidebar.
 */

import React from 'react';
import type { Unit, AgentState } from '@data/replay-schema';
import { IconCastle, IconCrossedSwords, IconShield } from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SelectedPanelProps {
  selectedUnit: Unit | null;
  agentState: AgentState | null;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: '#1A1A1A',
    borderBottom: '1px solid #333',
    padding: '0.75rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  },
  info: {
    flex: 1,
  },
  unitName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.25rem',
  },
  noSelection: {
    fontSize: '0.8rem',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.7rem',
    color: '#888',
  },
  healthBar: {
    flex: 1,
    height: '4px',
    background: '#333',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.2s ease',
  },
  actionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.15rem 0.4rem',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: '3px',
    fontSize: '0.6rem',
    fontWeight: 500,
    color: '#BF5700',
    textTransform: 'uppercase' as const,
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getUnitIcon(type: string): React.ReactNode {
  switch (type) {
    case 'base': return <IconCastle size={20} color="#FFD700" />;
    case 'barracks': return <IconCrossedSwords size={20} color="#E74C3C" />;
    case 'worker': return <IconCrossedSwords size={20} color="#3498DB" />;
    case 'light': return <IconCrossedSwords size={20} color="#BF5700" />;
    case 'heavy': return <IconShield size={20} color="#9B59B6" />;
    case 'ranged': return <IconCrossedSwords size={20} color="#2ECC71" />;
    case 'resource': return <IconCastle size={20} color="#F1C40F" />;
    default: return '?';
  }
}

function getUnitDisplayName(unit: Unit): string {
  const typeNames: Record<string, string> = {
    base: 'Town Hall',
    barracks: 'Barracks',
    worker: 'Worker',
    light: 'Infantry',
    heavy: 'Knight',
    ranged: 'Archer',
    resource: 'Gold Mine',
  };
  return typeNames[unit.type] ?? unit.type;
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

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function SelectedPanel({
  selectedUnit,
  agentState,
}: SelectedPanelProps): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Selected</span>
      </div>

      <div style={styles.content}>
        <div
          style={{
            ...styles.iconBox,
            borderColor: selectedUnit ? getTeamColor(selectedUnit.team) : '#333',
          }}
        >
          {selectedUnit ? getUnitIcon(selectedUnit.type) : '?'}
        </div>

        <div style={styles.info}>
          {selectedUnit ? (
            <>
              <div style={styles.unitName}>
                {getUnitDisplayName(selectedUnit)}
              </div>
              <div style={styles.statusRow}>
                <span>HP</span>
                <div style={styles.healthBar}>
                  <div
                    style={{
                      ...styles.healthFill,
                      width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%`,
                      background: getHealthColor(selectedUnit.hp / selectedUnit.maxHp),
                    }}
                  />
                </div>
                <span>
                  {selectedUnit.hp}/{selectedUnit.maxHp}
                </span>
              </div>
              {selectedUnit.currentAction && (
                <div style={{ marginTop: '0.35rem' }}>
                  <span style={styles.actionBadge}>
                    {selectedUnit.currentAction}
                  </span>
                </div>
              )}
              {agentState && (
                <div style={{ marginTop: '0.35rem' }}>
                  <span style={{ ...styles.actionBadge, color: '#2ECC71' }}>
                    {agentState.intent}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={styles.noSelection}>No selection</div>
          )}
        </div>
      </div>
    </div>
  );
}
