/**
 * CoachView - Agent Decision Analysis Panel
 *
 * THE key UI for Blazecraft. Shows WHY agents made decisions:
 * - Current intent
 * - Confidence level
 * - Decision entropy
 * - Human-readable reasoning
 *
 * Inspired by sports coaching breakdowns.
 */

import React, { useMemo } from 'react';
import type { ReplayMetadata, AgentState, AgentInfo } from '@data/replay-schema';
import {
  parseAgentState,
  getIntentDescription,
  getIntentIcon,
  formatConfidence,
  formatDecisionTime,
} from '@core/AgentTraceParser';
import { ActionProbabilities } from './ActionProbabilities';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CoachViewProps {
  metadata: ReplayMetadata;
  agentStates: AgentState[];
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
    overflow: 'hidden',
  },
  header: {
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
  subtitle: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '0.25rem',
  },
  agentList: {
    flex: 1,
    overflow: 'auto',
    padding: '0.5rem',
  },
  agentCard: {
    background: '#0D0D0D',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
    border: '1px solid #333',
  },
  agentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  agentName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  teamIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  agentType: {
    fontSize: '0.7rem',
    color: '#888',
    background: '#1A1A1A',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
  },
  intentSection: {
    marginBottom: '0.75rem',
  },
  intentLabel: {
    fontSize: '0.7rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  },
  intentValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  intentIcon: {
    fontSize: '1.5rem',
  },
  intentDescription: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '0.25rem',
  },
  reasonSection: {
    background: '#1A1A1A',
    borderRadius: '4px',
    padding: '0.75rem',
    marginBottom: '0.75rem',
  },
  reasonLabel: {
    fontSize: '0.65rem',
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
    fontWeight: 600,
  },
  reasonText: {
    fontSize: '0.8rem',
    color: '#F5F5DC',
    lineHeight: 1.4,
    fontStyle: 'italic' as const,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
  },
  metric: {
    background: '#1A1A1A',
    borderRadius: '4px',
    padding: '0.5rem',
    textAlign: 'center' as const,
  },
  metricValue: {
    fontSize: '1rem',
    fontWeight: 700,
  },
  metricLabel: {
    fontSize: '0.65rem',
    color: '#888',
    textTransform: 'uppercase' as const,
  },
  noData: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#888',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getTeamColor(team: string): string {
  switch (team) {
    case '0': return '#3498DB';
    case '1': return '#E74C3C';
    default: return '#888888';
  }
}

function getConfidenceColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return '#2ECC71';
    case 'medium': return '#F39C12';
    case 'low': return '#E74C3C';
  }
}

function getEntropyColor(level: 'certain' | 'normal' | 'uncertain'): string {
  switch (level) {
    case 'certain': return '#2ECC71';
    case 'normal': return '#F39C12';
    case 'uncertain': return '#E74C3C';
  }
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface AgentCardProps {
  agentInfo: AgentInfo;
  state: AgentState | undefined;
}

function AgentCard({ agentInfo, state }: AgentCardProps): React.ReactElement {
  const summary = state ? parseAgentState(state) : null;

  return (
    <div style={styles.agentCard}>
      {/* Agent Header */}
      <div style={styles.agentHeader}>
        <div style={styles.agentName}>
          <div
            style={{
              ...styles.teamIndicator,
              background: getTeamColor(agentInfo.team),
            }}
          />
          {agentInfo.name}
        </div>
        <div style={styles.agentType}>{agentInfo.type}</div>
      </div>

      {summary ? (
        <>
          {/* Intent */}
          <div style={styles.intentSection}>
            <div style={styles.intentLabel}>Current Intent</div>
            <div style={styles.intentValue}>
              <span style={styles.intentIcon}>{getIntentIcon(summary.intent)}</span>
              {summary.intent.toUpperCase()}
            </div>
            <div style={styles.intentDescription}>
              {getIntentDescription(summary.intent)}
            </div>
          </div>

          {/* Reasoning */}
          <div style={styles.reasonSection}>
            <div style={styles.reasonLabel}>Why?</div>
            <div style={styles.reasonText}>"{summary.reason}"</div>
          </div>

          {/* Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <div
                style={{
                  ...styles.metricValue,
                  color: getConfidenceColor(summary.confidenceLevel),
                }}
              >
                {formatConfidence(summary.confidence)}
              </div>
              <div style={styles.metricLabel}>Confidence</div>
            </div>
            <div style={styles.metric}>
              <div
                style={{
                  ...styles.metricValue,
                  color: getEntropyColor(summary.entropyLevel),
                }}
              >
                {summary.entropyLevel}
              </div>
              <div style={styles.metricLabel}>Certainty</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>
                {formatDecisionTime(state?.timeToDecision ?? 0)}
              </div>
              <div style={styles.metricLabel}>Think Time</div>
            </div>
          </div>

          {/* Action Probabilities (if available) */}
          {state?.actionProbabilities && (
            <ActionProbabilities
              probabilities={state.actionProbabilities}
              actionMask={state.actionMask}
            />
          )}
        </>
      ) : (
        <div style={styles.noData}>
          No decision data for this tick
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function CoachView({
  metadata,
  agentStates,
  currentTick,
}: CoachViewProps): React.ReactElement {
  // Map agent states by ID for easy lookup
  const stateMap = useMemo(() => {
    const map = new Map<string, AgentState>();
    for (const state of agentStates) {
      map.set(state.agentId, state);
    }
    return map;
  }, [agentStates]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Coach View</div>
        <div style={styles.subtitle}>
          Agent Decision Analysis • Tick {currentTick}
        </div>
      </div>

      <div style={styles.agentList}>
        {metadata.agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agentInfo={agent}
            state={stateMap.get(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}
