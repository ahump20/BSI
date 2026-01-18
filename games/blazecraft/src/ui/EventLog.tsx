/**
 * EventLog - Live event feed showing agent actions
 *
 * Displays timestamped events like "Subagent-XX rallied" or
 * "Worker attacked" with auto-scroll and max entry limit.
 */

import React, { useRef, useEffect } from 'react';
import type { AgentState, Action, Unit } from '@data/replay-schema';
import { IconLightning, IconGear } from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EventLogEntry {
  id: string;
  tick: number;
  timestamp: string;
  message: string;
  type: 'action' | 'decision' | 'event' | 'system';
  agentId?: string;
}

interface EventLogProps {
  entries: EventLogEntry[];
  maxEntries?: number;
  currentTick: number;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#1A1A1A',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    minHeight: 0, // Allow flex shrinking
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    borderBottom: '1px solid #333',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  liveBadge: {
    fontSize: '0.55rem',
    fontWeight: 600,
    color: '#2ECC71',
    background: 'rgba(46, 204, 113, 0.15)',
    padding: '0.15rem 0.35rem',
    borderRadius: '3px',
    textTransform: 'uppercase' as const,
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '0.5rem',
  },
  entry: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.35rem 0',
    borderBottom: '1px solid #222',
    fontSize: '0.7rem',
    lineHeight: 1.3,
  },
  timestamp: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: '0.6rem',
    minWidth: '55px',
  },
  icon: {
    fontSize: '0.7rem',
    marginTop: '1px',
  },
  message: {
    flex: 1,
    color: '#AAA',
  },
  agentId: {
    color: '#BF5700',
    fontWeight: 500,
  },
  actionVerb: {
    color: '#F5F5DC',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#555',
    fontSize: '0.75rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getEntryIcon(type: EventLogEntry['type']): React.ReactNode {
  const color = getIconColor(type);
  switch (type) {
    case 'action': return <IconLightning size={10} color={color} />;
    case 'decision': return <IconGear size={10} color={color} />;
    case 'event': return <IconLightning size={10} color={color} />;
    case 'system': return <IconGear size={10} color={color} />;
    default: return '•';
  }
}

function getIconColor(type: EventLogEntry['type']): string {
  switch (type) {
    case 'action': return '#BF5700';
    case 'decision': return '#3498DB';
    case 'event': return '#F1C40F';
    case 'system': return '#888';
    default: return '#888';
  }
}

// ─────────────────────────────────────────────────────────────
// Event Generation Helpers (to be used by parent component)
// ─────────────────────────────────────────────────────────────

export function createEventFromAction(
  action: Action,
  units: Map<string, Unit>,
  tick: number
): EventLogEntry {
  const unit = units.get(action.unitId);
  const unitName = unit ? `${unit.type}-${unit.id.slice(0, 2)}` : action.unitId.slice(0, 6);

  let message = '';
  switch (action.type) {
    case 'move':
      message = `moved to (${action.targetPosition?.x}, ${action.targetPosition?.y})`;
      break;
    case 'attack':
      message = 'attacked';
      break;
    case 'harvest':
      message = 'began harvesting';
      break;
    case 'produce':
      message = `training ${action.producingType}`;
      break;
    case 'build':
      message = 'started construction';
      break;
    case 'idle':
      message = 'idle';
      break;
    default:
      message = action.type;
  }

  return {
    id: `${tick}-${action.unitId}-${action.type}`,
    tick,
    timestamp: formatTickTime(tick),
    message: `${unitName} ${message}`,
    type: 'action',
    agentId: action.unitId,
  };
}

export function createEventFromDecision(
  agentState: AgentState,
  tick: number
): EventLogEntry {
  const shortId = agentState.agentId.slice(0, 8);
  const message = `Subagent-${shortId} ${agentState.intent}.`;

  return {
    id: `${tick}-${agentState.agentId}-decision`,
    tick,
    timestamp: formatTickTime(tick),
    message,
    type: 'decision',
    agentId: agentState.agentId,
  };
}

function formatTickTime(tick: number): string {
  const totalSeconds = tick / 10; // Assuming 10 ticks per second
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function EventLog({
  entries,
  maxEntries = 50,
}: EventLogProps): React.ReactElement {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries.length]);

  const displayEntries = entries.slice(-maxEntries);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.title}>Event Log</span>
          <span style={styles.liveBadge}>Live</span>
        </div>
      </div>

      <div ref={listRef} style={styles.list}>
        {displayEntries.length === 0 ? (
          <div style={styles.empty}>No events yet</div>
        ) : (
          displayEntries.map((entry) => (
            <div key={entry.id} style={styles.entry}>
              <span style={styles.timestamp}>{entry.timestamp}</span>
              <span style={styles.icon}>
                {getEntryIcon(entry.type)}
              </span>
              <span style={styles.message}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
