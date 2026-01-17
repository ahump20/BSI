/**
 * HeaderStatusBar - WC3-inspired status bar
 *
 * Shows: crest logo, title, resource counters (Completed, Files, Workers,
 * Failed, Duration, Tokens), tick counter, LOG/DEMO buttons.
 *
 * Resource counter spec:
 * - Completed: tasks completed
 * - Files: files modified
 * - Workers: active agents
 * - Failed: errors
 * - Duration: elapsed time
 * - Tokens: tokens used
 */

import React, { useState, useEffect, useRef } from 'react';
import type { PlaybackState } from '@core/ReplayEngine';
import {
  IconCrest,
  IconCompleted,
  IconFiles,
  IconWorkers,
  IconFailed,
  IconDuration,
  IconTokens,
} from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type AppMode = 'live' | 'demo' | 'replay';
type ConnectionStatus = 'disconnected' | 'connecting' | 'live' | 'demo';

interface HeaderStatusBarProps {
  currentTick: number;
  totalTicks: number;
  playbackState: PlaybackState;
  elapsedSeconds: number;
  agentStats: {
    idle: number;
    completed: number;
    copies: number;
    active: number;
    errors: number;
  };
  onLoadReplay: () => void;
  onLoadDemo: () => void;
  hasReplay: boolean;
  // Live mode props
  appMode?: AppMode;
  connectionStatus?: ConnectionStatus;
  onModeToggle?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Styles - Using BlazeCraft tokens
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(180deg, var(--panel, #12161c) 0%, var(--bg, #0b0d10) 100%)',
    borderBottom: '1px solid var(--border, #2a313b)',
    height: '48px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    color: 'var(--gold, #C9A227)',
  },
  logoText: {
    fontFamily: "'Cinzel', serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--gold, #C9A227)',
    letterSpacing: '0.05em',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  sessionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--panel2, #0f1318)',
    border: '1px solid var(--border, #2a313b)',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  sessionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    boxShadow: '0 0 6px currentColor',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  resourceCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--panel2, #0f1318)',
    border: '1px solid var(--border, #2a313b)',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 500,
    transition: 'background 0.3s ease',
  },
  resourceIcon: {
    flexShrink: 0,
  },
  resourceLabel: {
    color: 'var(--muted, #a7b2c0)',
    fontSize: '0.6rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  resourceValue: {
    color: 'var(--text, #e8eef6)',
    fontWeight: 600,
    fontFamily: "'Inter', monospace",
    minWidth: '2ch',
    textAlign: 'right' as const,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tickBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--panel2, #0f1318)',
    border: '1px solid var(--border, #2a313b)',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 500,
  },
  tickDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--blaze, #E86C2C)',
    boxShadow: '0 0 4px var(--blaze, #E86C2C)',
  },
  tickValue: {
    color: 'var(--text, #e8eef6)',
    fontFamily: "'Inter', monospace",
  },
  button: {
    padding: '6px 12px',
    background: 'transparent',
    color: 'var(--muted, #a7b2c0)',
    border: '1px solid var(--border, #2a313b)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    transition: 'all 0.15s ease',
  },
  buttonPrimary: {
    background: 'var(--blaze, #E86C2C)',
    color: '#FFF',
    border: '1px solid var(--blaze, #E86C2C)',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Resource Counter with flash animation
// ─────────────────────────────────────────────────────────────

interface ResourceCounterProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
  title?: string;
}

function ResourceCounter({ icon, label, value, color, title }: ResourceCounterProps): React.ReactElement {
  const [flashClass, setFlashClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value > prevValueRef.current) {
      setFlashClass('wc3-counter-flash-gold');
      const timer = setTimeout(() => setFlashClass(''), 500);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div style={styles.resourceCounter} className={flashClass} title={title}>
      <span style={{ ...styles.resourceIcon, color: color ?? 'var(--muted)' }}>
        {icon}
      </span>
      <span style={styles.resourceValue}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function HeaderStatusBar({
  currentTick,
  playbackState,
  elapsedSeconds,
  agentStats,
  onLoadReplay,
  onLoadDemo,
  hasReplay,
  appMode = 'demo',
  connectionStatus = 'demo',
  onModeToggle,
}: HeaderStatusBarProps): React.ReactElement {
  // Status logic: prioritize appMode if provided
  const isLiveMode = appMode === 'live';
  const isDemoMode = appMode === 'demo';
  const isReplayMode = appMode === 'replay';
  const isConnected = connectionStatus === 'live';
  const isConnecting = connectionStatus === 'connecting';

  // Legacy fallback for replay state
  const isPlaying = playbackState === 'playing';

  return (
    <header style={styles.container} className="wc3-metal-strip">
      {/* Left: Crest + Title + Session Badge */}
      <div style={styles.leftSection}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>
            <IconCrest size={24} />
          </span>
          <span style={styles.logoText}>BlazeCraft</span>
        </div>

        {/* Session status badge */}
        <div
          style={{
            ...styles.sessionBadge,
            color: isConnected
              ? 'var(--ok, #48C774)'
              : isConnecting
              ? 'var(--warn, #D4A017)'
              : isDemoMode
              ? 'var(--blaze, #E86C2C)'
              : 'var(--muted, #a7b2c0)',
          }}
        >
          <div
            style={{
              ...styles.sessionDot,
              background: isConnected
                ? 'var(--ok, #48C774)'
                : isConnecting
                ? 'var(--warn, #D4A017)'
                : isDemoMode
                ? 'var(--blaze, #E86C2C)'
                : 'var(--muted, #a7b2c0)',
              animation: isConnecting ? 'pulse 1s infinite' : undefined,
            }}
          />
          {isReplayMode
            ? isPlaying
              ? 'REPLAY'
              : 'PAUSED'
            : isConnected
            ? 'LIVE'
            : isConnecting
            ? 'CONNECTING'
            : isDemoMode
            ? 'DEMO'
            : 'IDLE'}
        </div>
      </div>

      {/* Center: Resource counters */}
      <div style={styles.centerSection}>
        {/* Completed */}
        <ResourceCounter
          icon={<IconCompleted size={14} />}
          label="Completed"
          value={agentStats.completed}
          color="var(--ok, #48C774)"
          title="Tasks completed"
        />

        {/* Files (using copies as proxy) */}
        <ResourceCounter
          icon={<IconFiles size={14} />}
          label="Files"
          value={agentStats.copies}
          color="var(--muted, #a7b2c0)"
          title="Files modified"
        />

        {/* Workers (active agents) */}
        <ResourceCounter
          icon={<IconWorkers size={14} />}
          label="Workers"
          value={agentStats.active}
          color="var(--blaze, #E86C2C)"
          title="Active agents"
        />

        {/* Failed (errors) */}
        <ResourceCounter
          icon={<IconFailed size={14} />}
          label="Failed"
          value={agentStats.errors}
          color="var(--bad, #D84C4C)"
          title="Errors"
        />

        {/* Duration */}
        <ResourceCounter
          icon={<IconDuration size={14} />}
          label="Duration"
          value={elapsedSeconds}
          color="var(--muted, #a7b2c0)"
          title="Session duration"
        />

        {/* Tokens (using tick as proxy) */}
        <ResourceCounter
          icon={<IconTokens size={14} />}
          label="Tokens"
          value={currentTick * 10} // Simulated token count
          color="var(--gold, #C9A227)"
          title="Tokens used"
        />
      </div>

      {/* Right: Tick + Buttons */}
      <div style={styles.rightSection}>
        {/* Tick counter */}
        <div style={styles.tickBadge}>
          <div style={styles.tickDot} />
          <span style={styles.tickValue}>T{currentTick}</span>
        </div>

        <button
          style={styles.button}
          onClick={onLoadReplay}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--blaze, #E86C2C)';
            e.currentTarget.style.color = 'var(--text, #e8eef6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border, #2a313b)';
            e.currentTarget.style.color = 'var(--muted, #a7b2c0)';
          }}
        >
          LOG
        </button>
        {/* Mode toggle button: LIVE ↔ DEMO */}
        {onModeToggle && !isReplayMode && (
          <button
            style={{
              ...styles.button,
              ...(isLiveMode ? styles.buttonPrimary : {}),
              background: isLiveMode ? 'var(--ok, #48C774)' : undefined,
              borderColor: isLiveMode ? 'var(--ok, #48C774)' : undefined,
            }}
            onClick={onModeToggle}
            title={isLiveMode ? 'Switch to Demo mode' : 'Switch to Live mode'}
          >
            {isLiveMode ? 'LIVE' : 'DEMO'}
          </button>
        )}
        {/* Fallback for replay mode */}
        {isReplayMode && (
          <button
            style={{ ...styles.button, ...(hasReplay ? {} : styles.buttonPrimary) }}
            onClick={onLoadDemo}
            onMouseEnter={(e) => {
              if (!hasReplay) return;
              e.currentTarget.style.borderColor = 'var(--blaze, #E86C2C)';
              e.currentTarget.style.color = 'var(--text, #e8eef6)';
            }}
            onMouseLeave={(e) => {
              if (!hasReplay) return;
              e.currentTarget.style.borderColor = 'var(--border, #2a313b)';
              e.currentTarget.style.color = 'var(--muted, #a7b2c0)';
            }}
          >
            DEMO
          </button>
        )}
      </div>
    </header>
  );
}
