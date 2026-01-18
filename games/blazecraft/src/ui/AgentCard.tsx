/**
 * AgentCard - Enhanced agent display for sidebar
 *
 * Shows agent status, current task, and progress.
 * Part of Phase 1.3: Tight Feedback Loop
 */

import React from 'react';
import type { AgentState } from '@core/LiveBridge';
import { IconWorkers, IconGear, IconCompleted, IconFailed, IconPin } from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AgentCardProps {
  agent: AgentState;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  card: {
    padding: '0.6rem',
    background: '#0D0D0D',
    borderRadius: '6px',
    border: '1px solid #333',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#BF5700',
    background: 'rgba(191, 87, 0, 0.1)',
    boxShadow: '0 0 8px rgba(191, 87, 0, 0.3)',
  },
  cardHover: {
    borderColor: '#444',
    transform: 'translateY(-1px)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.4rem',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#F5F5DC',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  region: {
    fontSize: '0.65rem',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  statusBadge: {
    display: 'inline-flex',
    padding: '0.15rem 0.4rem',
    borderRadius: '3px',
    fontSize: '0.55rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  statusWorking: {
    background: 'rgba(46, 204, 113, 0.2)',
    color: '#2ECC71',
  },
  statusIdle: {
    background: 'rgba(243, 156, 18, 0.2)',
    color: '#F39C12',
  },
  statusError: {
    background: 'rgba(231, 76, 60, 0.2)',
    color: '#E74C3C',
  },
  taskSection: {
    marginTop: '0.5rem',
    padding: '0.4rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
  },
  taskLabel: {
    fontSize: '0.6rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  taskFile: {
    fontSize: '0.7rem',
    color: '#BF5700',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  progressBar: {
    width: '100%',
    height: '3px',
    background: '#333',
    borderRadius: '2px',
    marginTop: '0.3rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #BF5700, #FF6B35)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  activityIndicator: {
    position: 'absolute' as const,
    top: '0.5rem',
    right: '0.5rem',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#2ECC71',
  },
  pulsingDot: {
    animation: 'agentPulse 1.5s infinite',
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AgentCard({ agent, isSelected, onClick, onDoubleClick }: AgentCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = React.useState(false);

  // Determine status style
  const getStatusStyle = (): React.CSSProperties => {
    switch (agent.status) {
      case 'working':
        return styles.statusWorking;
      case 'error':
        return styles.statusError;
      default:
        return styles.statusIdle;
    }
  };

  // Get status icon
  const getStatusIcon = (): React.ReactNode => {
    switch (agent.status) {
      case 'working':
        return <IconGear size={10} color="#2ECC71" />;
      case 'error':
        return <IconFailed size={10} color="#E74C3C" />;
      default:
        return <IconCompleted size={10} color="#F39C12" />;
    }
  };

  // Format region name
  const formatRegion = (region: string): string => {
    return region.charAt(0).toUpperCase() + region.slice(1);
  };

  // Calculate time since last update
  const getTimeSinceUpdate = (): string => {
    const now = Date.now();
    const diff = now - agent.lastUpdate;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <div
        style={{
          ...styles.card,
          ...(isSelected ? styles.cardSelected : {}),
          ...(isHovered && !isSelected ? styles.cardHover : {}),
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`${agent.name} - ${agent.status}\nRegion: ${formatRegion(agent.region)}\nLast active: ${getTimeSinceUpdate()}`}
      >
        {/* Activity indicator */}
        {agent.status === 'working' && (
          <div
            style={{
              ...styles.activityIndicator,
              ...styles.pulsingDot,
            }}
          />
        )}

        {/* Header: Avatar + Name */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            <IconWorkers size={14} color="#FFF" />
          </div>
          <div style={styles.nameContainer}>
            <div style={styles.name}>{agent.name}</div>
            <div style={styles.region}>
              <IconPin size={10} color="#888" />
              {formatRegion(agent.region)}
            </div>
          </div>
          <div style={{ ...styles.statusBadge, ...getStatusStyle() }}>
            {getStatusIcon()}
            <span style={{ marginLeft: '0.2rem' }}>{agent.status}</span>
          </div>
        </div>

        {/* Task section (shows current work if working) */}
        {agent.status === 'working' && (
          <div style={styles.taskSection}>
            <div style={styles.taskLabel}>Working on</div>
            <div style={styles.taskFile}>
              {agent.region === 'workshop' && 'src/core/BuildingSystem.ts'}
              {agent.region === 'market' && 'src/ui/CityBuilderApp.tsx'}
              {agent.region === 'barracks' && 'tests/BuildingSystem.test.ts'}
              {agent.region === 'stables' && 'workers/blazecraft-events/src/index.ts'}
              {agent.region === 'library' && 'docs/README.md'}
              {agent.region === 'townhall' && 'package.json'}
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.random() * 60 + 20}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS for pulsing animation */}
      <style>{`
        @keyframes agentPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </>
  );
}

export default AgentCard;
