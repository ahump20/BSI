/**
 * TaskList - Available tasks display
 *
 * Shows tasks that can be assigned to analysts, with reward info
 * and expiration timers. Used in the command card area.
 */

import React from 'react';
import type { Task, Analyst } from '@core/AnalystSystem';
import { formatDuration, TASK_CONFIG } from '@core/AnalystSystem';
import { formatResourceDelta } from '@core/ResourceSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TaskListProps {
  tasks: Task[];
  idleAnalysts: Analyst[];
  onAssign: (taskId: string, analystId: string) => void;
  maxVisible?: number;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  count: {
    fontSize: '0.65rem',
    color: '#666',
  },
  taskCard: {
    padding: '0.75rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  taskCardHover: {
    borderColor: '#BF5700',
    background: 'rgba(191, 87, 0, 0.05)',
  },
  taskCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  taskIcon: {
    fontSize: '1rem',
    marginRight: '0.5rem',
  },
  taskTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#F5F5DC',
    flex: 1,
  },
  taskSport: {
    fontSize: '0.6rem',
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    background: 'rgba(191, 87, 0, 0.15)',
    padding: '0.15rem 0.4rem',
    borderRadius: '3px',
    marginLeft: '0.5rem',
  },
  taskDescription: {
    fontSize: '0.7rem',
    color: '#888',
    marginBottom: '0.5rem',
    lineHeight: 1.3,
  },
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.65rem',
  },
  metaIcon: {
    fontSize: '0.75rem',
  },
  metaLabel: {
    color: '#666',
  },
  metaValue: {
    color: '#AAA',
    fontWeight: 500,
  },
  rewardBadge: {
    background: 'rgba(46, 204, 113, 0.15)',
    color: '#2ECC71',
    padding: '0.2rem 0.4rem',
    borderRadius: '3px',
    fontSize: '0.65rem',
    fontWeight: 500,
  },
  expiryWarning: {
    color: '#E74C3C',
  },
  assignSection: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #222',
  },
  assignLabel: {
    fontSize: '0.6rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: '0.3rem',
  },
  analystButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  analystButton: {
    padding: '0.3rem 0.6rem',
    background: '#1A1A1A',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#AAA',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  analystButtonHover: {
    borderColor: '#BF5700',
    color: '#F5F5DC',
    background: 'rgba(191, 87, 0, 0.1)',
  },
  empty: {
    padding: '1.5rem',
    textAlign: 'center' as const,
    color: '#555',
    fontSize: '0.75rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    border: '1px dashed #333',
  },
  emptyIcon: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    opacity: 0.5,
  },
};

// ─────────────────────────────────────────────────────────────
// Task Icons
// ─────────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, string> = {
  monitor_game: '📺',
  research_matchup: '🔬',
  compile_report: '📝',
  scout_player: '👁️',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function TaskList({
  tasks,
  idleAnalysts,
  onAssign,
  maxVisible = 4,
}: TaskListProps): React.ReactElement {
  const [hoveredTask, setHoveredTask] = React.useState<string | null>(null);
  const [hoveredAnalyst, setHoveredAnalyst] = React.useState<string | null>(null);
  const [expandedTask, setExpandedTask] = React.useState<string | null>(null);

  const visibleTasks = tasks.slice(0, maxVisible);
  const hasIdleAnalysts = idleAnalysts.length > 0;

  function getTimeRemaining(expiresAt: number | null): string {
    if (!expiresAt) return '';
    const remaining = Math.max(0, expiresAt - Date.now());
    const seconds = Math.floor(remaining / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  }

  function isExpiringSoon(expiresAt: number | null): boolean {
    if (!expiresAt) return false;
    return expiresAt - Date.now() < 60000; // Less than 1 minute
  }

  function handleTaskClick(taskId: string): void {
    if (!hasIdleAnalysts) return;
    setExpandedTask(expandedTask === taskId ? null : taskId);
  }

  function handleAssign(taskId: string, analystId: string): void {
    onAssign(taskId, analystId);
    setExpandedTask(null);
  }

  if (tasks.length === 0) {
    return (
      <div id="task-list" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Available Tasks</span>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📋</div>
          <div>No tasks available</div>
          <div style={{ marginTop: '0.25rem', color: '#444' }}>
            Tasks appear when games are active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="task-list" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Available Tasks</span>
        <span style={styles.count}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          {tasks.length > maxVisible && ` (${maxVisible} shown)`}
        </span>
      </div>

      {visibleTasks.map((task) => {
        const isHovered = hoveredTask === task.id;
        const isExpanded = expandedTask === task.id;
        const expiring = isExpiringSoon(task.expiresAt);
        const config = TASK_CONFIG[task.type];

        return (
          <div
            key={task.id}
            style={{
              ...styles.taskCard,
              ...(isHovered && hasIdleAnalysts ? styles.taskCardHover : {}),
              ...(!hasIdleAnalysts ? styles.taskCardDisabled : {}),
            }}
            onClick={() => handleTaskClick(task.id)}
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            <div style={styles.taskHeader}>
              <span style={styles.taskIcon}>{TASK_ICONS[task.type] || '📋'}</span>
              <span style={styles.taskTitle}>{task.title}</span>
              {task.sport && <span style={styles.taskSport}>{task.sport}</span>}
            </div>

            <div style={styles.taskDescription}>{task.description}</div>

            <div style={styles.taskMeta}>
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>⏱️</span>
                <span style={styles.metaValue}>{formatDuration(task.duration)}</span>
              </div>

              <div style={styles.rewardBadge}>
                {formatResourceDelta(task.reward)}
              </div>

              {task.expiresAt && (
                <div style={{ ...styles.metaItem, ...(expiring ? styles.expiryWarning : {}) }}>
                  <span style={styles.metaIcon}>{expiring ? '⚠️' : '⌛'}</span>
                  <span style={{ ...(expiring ? styles.expiryWarning : styles.metaValue) }}>
                    {getTimeRemaining(task.expiresAt)}
                  </span>
                </div>
              )}
            </div>

            {isExpanded && hasIdleAnalysts && (
              <div style={styles.assignSection}>
                <div style={styles.assignLabel}>Assign Analyst</div>
                <div style={styles.analystButtons}>
                  {idleAnalysts.map((analyst) => (
                    <button
                      key={analyst.id}
                      style={{
                        ...styles.analystButton,
                        ...(hoveredAnalyst === analyst.id ? styles.analystButtonHover : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(task.id, analyst.id);
                      }}
                      onMouseEnter={() => setHoveredAnalyst(analyst.id)}
                      onMouseLeave={() => setHoveredAnalyst(null)}
                    >
                      {analyst.name}
                      {task.sport && analyst.specialty === task.sport && (
                        <span style={{ color: '#2ECC71', marginLeft: '0.25rem' }}>★</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!hasIdleAnalysts && (
        <div style={{ ...styles.empty, padding: '0.75rem' }}>
          No idle analysts - wait for one to finish
        </div>
      )}
    </div>
  );
}

export default TaskList;
