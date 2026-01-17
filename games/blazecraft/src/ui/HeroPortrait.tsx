/**
 * HeroPortrait - WC3-style hero portrait panel
 *
 * Replaces SelectedPanel with a proper hero portrait:
 * - Gold decorative frame with corner brackets
 * - Agent name + level display
 * - HP bar (green gradient, red < 30%)
 * - MP bar (blue gradient) - represents agent "energy"/token budget
 * - Stat grid: Tasks Completed, Files Modified, Errors, Tokens Used
 *
 * HP = (tasks completed) / (tasks completed + errors) as percentage
 * MP = (tokens remaining) / (token budget) as percentage
 */

import React, { useMemo } from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AgentHeroStats {
  id: string;
  name: string;
  level: number;
  status: 'working' | 'hold' | 'idle' | 'error';
  region: string;
  tasksCompleted: number;
  filesModified: number;
  errors: number;
  tokensUsed: number;
  tokenBudget: number;
  spawnedAt: number;
  lastUpdate: number;
}

interface HeroPortraitProps {
  agent: AgentHeroStats | null;
  onSelect?: () => void;
  onClickAgent?: (agentId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: 'linear-gradient(180deg, #1a1612 0%, #0f0d0a 100%)',
    border: '3px solid #4a3c2a',
    boxShadow: 'inset 0 1px 0 #3a2e20, inset 0 -1px 0 #0a0806, 0 2px 4px rgba(0,0,0,0.5)',
    borderRadius: '2px',
    padding: '0.75rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid #4a3c2a',
  },
  title: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  statusBadge: {
    fontSize: '0.5rem',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  content: {
    display: 'flex',
    gap: '0.75rem',
  },
  portraitWrapper: {
    position: 'relative' as const,
    flexShrink: 0,
  },
  portrait: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #0f0d0a 0%, #1a1612 100%)',
    border: '3px solid #B8860B',
    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8), 0 0 8px rgba(255,215,0,0.3), inset 0 0 0 1px #0a0806',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    position: 'relative' as const,
  },
  cornerBracket: {
    position: 'absolute' as const,
    width: '10px',
    height: '10px',
    border: '2px solid #FFD700',
  },
  cornerTL: {
    top: '-4px',
    left: '-4px',
    borderRight: 'none',
    borderBottom: 'none',
  },
  cornerTR: {
    top: '-4px',
    right: '-4px',
    borderLeft: 'none',
    borderBottom: 'none',
  },
  cornerBL: {
    bottom: '-4px',
    left: '-4px',
    borderRight: 'none',
    borderTop: 'none',
  },
  cornerBR: {
    bottom: '-4px',
    right: '-4px',
    borderLeft: 'none',
    borderTop: 'none',
  },
  levelBadge: {
    position: 'absolute' as const,
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    color: '#0f0d0a',
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '2px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
    border: '1px solid #FFD700',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
    minWidth: 0,
  },
  agentName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#F5F5DC',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  regionTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.55rem',
    fontWeight: 500,
    color: '#BF5700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  barLabel: {
    fontSize: '0.55rem',
    fontWeight: 600,
    color: '#888',
    width: '18px',
  },
  barTrack: {
    flex: 1,
    height: '6px',
    background: '#0a0806',
    border: '1px solid #4a3c2a',
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
  },
  barFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease',
    boxShadow: '0 0 4px currentColor',
  },
  barValue: {
    fontSize: '0.5rem',
    fontWeight: 600,
    color: '#F5F5DC',
    fontFamily: 'monospace',
    minWidth: '32px',
    textAlign: 'right' as const,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '4px',
    marginTop: '0.5rem',
  },
  statBox: {
    background: '#0a0806',
    border: '1px solid #4a3c2a',
    padding: '4px 6px',
    borderRadius: '2px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '0.5rem',
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  statValue: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#F5F5DC',
    fontFamily: 'monospace',
  },
  noAgent: {
    textAlign: 'center' as const,
    padding: '1.5rem',
    color: '#555',
    fontSize: '0.75rem',
    fontStyle: 'italic' as const,
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getAgentIcon(status: string): string {
  switch (status) {
    case 'working': return '🤖';
    case 'hold': return '⏸️';
    case 'idle': return '😴';
    case 'error': return '⚠️';
    default: return '?';
  }
}

function getStatusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case 'working': return { bg: 'rgba(46, 204, 113, 0.2)', color: '#2ECC71' };
    case 'hold': return { bg: 'rgba(241, 196, 15, 0.2)', color: '#F1C40F' };
    case 'idle': return { bg: 'rgba(136, 136, 136, 0.2)', color: '#888' };
    case 'error': return { bg: 'rgba(231, 76, 60, 0.2)', color: '#E74C3C' };
    default: return { bg: 'rgba(136, 136, 136, 0.2)', color: '#888' };
  }
}

function getHPColor(percent: number): string {
  if (percent > 0.6) return 'linear-gradient(180deg, #4ade80 0%, #2ECC71 50%, #22c55e 100%)';
  if (percent > 0.3) return 'linear-gradient(180deg, #fbbf24 0%, #F39C12 50%, #d97706 100%)';
  return 'linear-gradient(180deg, #f87171 0%, #E74C3C 50%, #dc2626 100%)';
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function HeroPortrait({ agent, onSelect, onClickAgent }: HeroPortraitProps): React.ReactElement {
  // Calculate HP and MP percentages
  const { hpPercent, mpPercent } = useMemo(() => {
    if (!agent) return { hpPercent: 0, mpPercent: 0 };

    const totalTasks = agent.tasksCompleted + agent.errors;
    const hp = totalTasks > 0 ? agent.tasksCompleted / totalTasks : 1;
    const mp = agent.tokenBudget > 0 ? 1 - (agent.tokensUsed / agent.tokenBudget) : 1;

    return { hpPercent: hp, mpPercent: Math.max(0, mp) };
  }, [agent]);

  if (!agent) {
    return (
      <div style={styles.container} className="wc3-panel">
        <div style={styles.header}>
          <span style={styles.title}>Hero Portrait</span>
        </div>
        <div style={styles.noAgent}>No agent selected</div>
      </div>
    );
  }

  const statusColors = getStatusColor(agent.status);

  const handleClick = () => {
    onSelect?.();
    if (agent && onClickAgent) {
      onClickAgent(agent.id);
    }
  };

  return (
    <div
      style={{ ...styles.container, cursor: 'pointer' }}
      className="wc3-panel wc3-hero-portrait"
      onClick={handleClick}
    >
      <div style={styles.header}>
        <span style={styles.title}>Hero Portrait</span>
        <span
          style={{
            ...styles.statusBadge,
            background: statusColors.bg,
            color: statusColors.color,
            border: `1px solid ${statusColors.color}`,
          }}
        >
          {agent.status}
        </span>
      </div>

      <div style={styles.content}>
        {/* Portrait with gold frame */}
        <div style={styles.portraitWrapper}>
          <div style={styles.portrait} className="wc3-frame-gold">
            {getAgentIcon(agent.status)}
            {/* Corner brackets */}
            <div style={{ ...styles.cornerBracket, ...styles.cornerTL }} />
            <div style={{ ...styles.cornerBracket, ...styles.cornerTR }} />
            <div style={{ ...styles.cornerBracket, ...styles.cornerBL }} />
            <div style={{ ...styles.cornerBracket, ...styles.cornerBR }} />
          </div>
          {/* Level badge */}
          <div style={styles.levelBadge}>LV {agent.level}</div>
        </div>

        {/* Info section */}
        <div style={styles.info}>
          {/* Agent name */}
          <div style={styles.agentName}>{agent.name}</div>

          {/* Region tag */}
          <div style={styles.regionTag}>
            <span>📍</span>
            <span>{agent.region}</span>
          </div>

          {/* HP Bar */}
          <div style={styles.barContainer}>
            <span style={{ ...styles.barLabel, color: '#2ECC71' }}>HP</span>
            <div style={styles.barTrack} className="wc3-bar-container">
              <div
                style={{
                  ...styles.barFill,
                  width: `${hpPercent * 100}%`,
                  background: getHPColor(hpPercent),
                  color: hpPercent > 0.3 ? '#2ECC71' : '#E74C3C',
                }}
                className={`wc3-hp-bar ${hpPercent <= 0.3 ? 'low' : hpPercent <= 0.6 ? 'medium' : ''}`}
              />
            </div>
            <span style={styles.barValue}>
              {agent.tasksCompleted}/{agent.tasksCompleted + agent.errors}
            </span>
          </div>

          {/* MP Bar */}
          <div style={styles.barContainer}>
            <span style={{ ...styles.barLabel, color: '#3498DB' }}>MP</span>
            <div style={styles.barTrack} className="wc3-bar-container">
              <div
                style={{
                  ...styles.barFill,
                  width: `${mpPercent * 100}%`,
                  background: 'linear-gradient(180deg, #60a5fa 0%, #3498DB 50%, #2563eb 100%)',
                  color: '#3498DB',
                }}
                className="wc3-mana-bar"
              />
            </div>
            <span style={styles.barValue}>
              {formatNumber(Math.max(0, agent.tokenBudget - agent.tokensUsed))}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid} className="wc3-hero-stats">
        <div style={styles.statBox} className="wc3-hero-stat">
          <span style={styles.statLabel}>Tasks</span>
          <span style={{ ...styles.statValue, color: '#2ECC71' }}>
            {agent.tasksCompleted}
          </span>
        </div>
        <div style={styles.statBox} className="wc3-hero-stat">
          <span style={styles.statLabel}>Files</span>
          <span style={{ ...styles.statValue, color: '#BF5700' }}>
            {agent.filesModified}
          </span>
        </div>
        <div style={styles.statBox} className="wc3-hero-stat">
          <span style={styles.statLabel}>Errors</span>
          <span style={{ ...styles.statValue, color: '#E74C3C' }}>
            {agent.errors}
          </span>
        </div>
        <div style={styles.statBox} className="wc3-hero-stat">
          <span style={styles.statLabel}>Tokens</span>
          <span style={{ ...styles.statValue, color: '#3498DB' }}>
            {formatNumber(agent.tokensUsed)}
          </span>
        </div>
      </div>
    </div>
  );
}
