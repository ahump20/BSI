/**
 * OpsFeed - Operations summary feed
 *
 * Shows high-level status messages like "2 workers executing cleanly"
 * or aggregated agent decision summaries.
 */

import React from 'react';
import type { AgentState, Unit } from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface OpsMessage {
  id: string;
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

interface OpsFeedProps {
  units: Unit[];
  agentStates: AgentState[];
  currentTick: number;
  customMessages?: OpsMessage[];
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
    borderRight: '1px solid #333',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    minWidth: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '0.5rem 0.75rem',
  },
  message: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.35rem 0',
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginTop: '5px',
    flexShrink: 0,
  },
  messageText: {
    color: '#AAA',
    flex: 1,
  },
  empty: {
    padding: '1rem',
    textAlign: 'center' as const,
    color: '#555',
    fontSize: '0.7rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getStatusColor(status: OpsMessage['status']): string {
  switch (status) {
    case 'success': return '#2ECC71';
    case 'warning': return '#F1C40F';
    case 'error': return '#E74C3C';
    case 'info': return '#3498DB';
    default: return '#888';
  }
}

function generateOpsMessages(
  units: Unit[],
  agentStates: AgentState[]
): OpsMessage[] {
  const messages: OpsMessage[] = [];

  // Count workers by action
  const workersByAction: Record<string, number> = {};
  const combatUnitsByTeam: Record<string, number> = {};

  for (const unit of units) {
    if (unit.type === 'worker') {
      const action = unit.currentAction ?? 'idle';
      workersByAction[action] = (workersByAction[action] ?? 0) + 1;
    } else if (unit.type === 'light' || unit.type === 'heavy' || unit.type === 'ranged') {
      combatUnitsByTeam[unit.team] = (combatUnitsByTeam[unit.team] ?? 0) + 1;
    }
  }

  // Worker status
  const harvesting = workersByAction['harvest'] ?? 0;
  const idle = workersByAction['idle'] ?? 0;

  if (harvesting > 0) {
    messages.push({
      id: 'workers-harvesting',
      message: `${harvesting} worker${harvesting !== 1 ? 's' : ''} harvesting resources.`,
      status: 'success',
      timestamp: Date.now(),
    });
  }

  if (idle > 0) {
    messages.push({
      id: 'workers-idle',
      message: `${idle} worker${idle !== 1 ? 's' : ''} idle.`,
      status: idle > 2 ? 'warning' : 'info',
      timestamp: Date.now(),
    });
  }

  // Agent decision summary
  const intentCounts: Record<string, number> = {};
  for (const state of agentStates) {
    intentCounts[state.intent] = (intentCounts[state.intent] ?? 0) + 1;
  }

  for (const [intent, count] of Object.entries(intentCounts)) {
    if (intent !== 'unknown') {
      messages.push({
        id: `intent-${intent}`,
        message: `${count} agent${count !== 1 ? 's' : ''} executing ${intent} strategy.`,
        status: 'info',
        timestamp: Date.now(),
      });
    }
  }

  // Combat units summary
  for (const [team, count] of Object.entries(combatUnitsByTeam)) {
    const teamName = team === '0' ? 'Blue' : 'Red';
    messages.push({
      id: `combat-team-${team}`,
      message: `${teamName} team: ${count} combat unit${count !== 1 ? 's' : ''}.`,
      status: 'info',
      timestamp: Date.now(),
    });
  }

  // Default message if no specific ops
  if (messages.length === 0) {
    messages.push({
      id: 'standby',
      message: 'Systems nominal. Awaiting instructions.',
      status: 'info',
      timestamp: Date.now(),
    });
  }

  return messages;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function OpsFeed({
  units,
  agentStates,
  customMessages,
}: OpsFeedProps): React.ReactElement {
  const generatedMessages = generateOpsMessages(units, agentStates);
  const allMessages = customMessages
    ? [...customMessages, ...generatedMessages]
    : generatedMessages;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Ops Feed</span>
      </div>

      <div style={styles.content}>
        {allMessages.length === 0 ? (
          <div style={styles.empty}>No operations data</div>
        ) : (
          allMessages.map((msg) => (
            <div key={msg.id} style={styles.message}>
              <div
                style={{
                  ...styles.statusDot,
                  background: getStatusColor(msg.status),
                }}
              />
              <span style={styles.messageText}>{msg.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
