/**
 * AnalystManager - Worker management panel
 *
 * Shows all analysts with their status, fatigue, and assigned tasks.
 * Allows recruiting new analysts and viewing task progress.
 */

import React from 'react';
import type {
  Analyst,
  TaskProgress,
  BuildingEffects,
} from '@core/AnalystSystem';
import {
  getAnalystStatusText,
  getFatigueLevel,
  formatDuration,
} from '@core/AnalystSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AnalystManagerProps {
  analysts: Analyst[];
  workingAnalysts: TaskProgress[];
  capacity: { current: number; max: number };
  effects: BuildingEffects;
  onRecruit?: () => void;
  onUnassign?: (analystId: string) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  panel: {
    width: '600px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    background: '#1A1A1A',
    borderRadius: '8px',
    border: '1px solid #333',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #333',
    background: '#0D0D0D',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#F5F5DC',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
  content: {
    flex: 1,
    padding: '1rem',
    overflow: 'auto',
  },
  capacityBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  capacityText: {
    fontSize: '0.8rem',
    color: '#888',
  },
  capacityCount: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#F5F5DC',
  },
  recruitButton: {
    padding: '0.5rem 1rem',
    background: '#BF5700',
    border: 'none',
    borderRadius: '4px',
    color: '#F5F5DC',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  recruitButtonDisabled: {
    background: '#333',
    color: '#666',
    cursor: 'not-allowed',
  },
  analystList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  analystCard: {
    padding: '1rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    border: '1px solid #333',
  },
  analystHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  analystName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
  },
  analystSpecialty: {
    fontSize: '0.65rem',
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    marginLeft: '0.5rem',
  },
  statusBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '3px',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  statusIdle: {
    background: 'rgba(46, 204, 113, 0.15)',
    color: '#2ECC71',
  },
  statusWorking: {
    background: 'rgba(52, 152, 219, 0.15)',
    color: '#3498DB',
  },
  statusResting: {
    background: 'rgba(241, 196, 15, 0.15)',
    color: '#F1C40F',
  },
  statsRow: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '0.75rem',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.2rem',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: '#666',
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: '0.8rem',
    color: '#AAA',
  },
  progressSection: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #333',
  },
  taskTitle: {
    fontSize: '0.75rem',
    color: '#888',
    marginBottom: '0.5rem',
  },
  progressBar: {
    height: '6px',
    background: '#333',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#3498DB',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    color: '#666',
    marginTop: '0.3rem',
  },
  fatigueBar: {
    height: '4px',
    background: '#333',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '0.25rem',
  },
  fatigueFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  unassignButton: {
    background: 'none',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#888',
    fontSize: '0.7rem',
    padding: '0.3rem 0.6rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.2s ease',
  },
  effectsSection: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    border: '1px dashed #333',
  },
  effectsTitle: {
    fontSize: '0.7rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: '0.5rem',
  },
  effectItem: {
    fontSize: '0.75rem',
    color: '#2ECC71',
    marginBottom: '0.25rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AnalystManager({
  analysts,
  workingAnalysts,
  capacity,
  effects,
  onRecruit,
  onUnassign,
  onClose,
}: AnalystManagerProps): React.ReactElement {
  function getStatusStyle(status: Analyst['status']): React.CSSProperties {
    switch (status) {
      case 'idle':
        return { ...styles.statusBadge, ...styles.statusIdle };
      case 'working':
      case 'assigned':
        return { ...styles.statusBadge, ...styles.statusWorking };
      case 'resting':
        return { ...styles.statusBadge, ...styles.statusResting };
    }
  }

  function getFatigueColor(fatigue: number): string {
    if (fatigue < 30) return '#2ECC71';
    if (fatigue < 70) return '#F1C40F';
    return '#E74C3C';
  }

  function getProgress(analystId: string): TaskProgress | undefined {
    return workingAnalysts.find((p) => p.analyst.id === analystId);
  }

  return (
    <div id="analyst-panel" style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Analyst Management</div>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5DC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.capacityBar}>
            <div>
              <div style={styles.capacityText}>Analyst Roster</div>
              <div style={styles.capacityCount}>
                {capacity.current} / {capacity.max}
              </div>
            </div>
            <button
              style={{
                ...styles.recruitButton,
                ...(capacity.current >= capacity.max ? styles.recruitButtonDisabled : {}),
              }}
              onClick={onRecruit}
              disabled={capacity.current >= capacity.max}
            >
              {capacity.current >= capacity.max ? 'At Capacity' : '+ Recruit Analyst'}
            </button>
          </div>

          <div style={styles.analystList}>
            {analysts.map((analyst) => {
              const progress = getProgress(analyst.id);
              const fatigueLevel = getFatigueLevel(analyst.fatigue);

              return (
                <div key={analyst.id} style={styles.analystCard}>
                  <div style={styles.analystHeader}>
                    <div>
                      <span style={styles.analystName}>{analyst.name}</span>
                      <span style={styles.analystSpecialty}>
                        {analyst.specialty === 'general' ? 'General' : analyst.specialty.toUpperCase()}
                      </span>
                    </div>
                    <span style={getStatusStyle(analyst.status)}>
                      {getAnalystStatusText(analyst)}
                    </span>
                  </div>

                  <div style={styles.statsRow}>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Efficiency</span>
                      <span style={styles.statValue}>
                        {Math.round(analyst.efficiency * 100)}%
                      </span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Tasks Done</span>
                      <span style={styles.statValue}>{analyst.tasksCompleted}</span>
                    </div>
                    <div style={{ ...styles.stat, flex: 1 }}>
                      <span style={styles.statLabel}>
                        Fatigue ({fatigueLevel})
                      </span>
                      <div style={styles.fatigueBar}>
                        <div
                          style={{
                            ...styles.fatigueFill,
                            width: `${analyst.fatigue}%`,
                            background: getFatigueColor(analyst.fatigue),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {progress && (
                    <div style={styles.progressSection}>
                      <div style={styles.taskTitle}>
                        Working on: {progress.task.title}
                      </div>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${progress.progress * 100}%`,
                          }}
                        />
                      </div>
                      <div style={styles.progressText}>
                        <span>{Math.round(progress.progress * 100)}%</span>
                        <span>{formatDuration(progress.remainingSeconds)} remaining</span>
                      </div>
                      {onUnassign && (
                        <button
                          style={styles.unassignButton}
                          onClick={() => onUnassign(analyst.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#888';
                            e.currentTarget.style.color = '#F5F5DC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#555';
                            e.currentTarget.style.color = '#888';
                          }}
                        >
                          Cancel Task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {(effects.durationMultiplier < 1 || effects.rewardMultiplier > 1) && (
            <div style={styles.effectsSection}>
              <div style={styles.effectsTitle}>Active Bonuses</div>
              {effects.durationMultiplier < 1 && (
                <div style={styles.effectItem}>
                  Workshop: -{Math.round((1 - effects.durationMultiplier) * 100)}% task duration
                </div>
              )}
              {effects.rewardMultiplier > 1 && (
                <div style={styles.effectItem}>
                  Library: +{Math.round((effects.rewardMultiplier - 1) * 100)}% task rewards
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalystManager;
