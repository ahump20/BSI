/**
 * CommandCard - WC3-style 3x3 command panel for agent console
 *
 * Hotkey layout per spec:
 * Row 1: S (STOP) | H (HOLD)    | R (RESUME)
 * Row 2: A (ASSIGN)| I (INSPECT) | X (TERMINATE)
 * Row 3: [RESERVED] | [RESERVED] | [RESERVED]
 *
 * Features:
 * - Stone/metal beveled button styling
 * - Gold/Blaze highlight on hover/active
 * - 6 active commands + 3 reserved "coming soon" slots
 * - Keyboard shortcut support
 * - Sound effects on interaction
 */

import React, { useEffect, useCallback } from 'react';
import type { Unit } from '@data/replay-schema';
import {
  IconStop,
  IconHold,
  IconResume,
  IconAssign,
  IconInspect,
  IconTerminate,
} from './Icons';
import { playClick, initSound } from '@core/ui-sfx';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CommandCardProps {
  unit: Unit | null;
  onCommand?: (command: string) => void;
  disabled?: boolean;
}

interface CommandButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  hotkey: string;
  available: boolean;
  reserved?: boolean;
  color?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────
// Command Definitions - 6 Active + 3 Reserved
// ─────────────────────────────────────────────────────────────

const CONSOLE_COMMANDS: CommandButton[] = [
  // Row 1: S H R - Control
  {
    id: 'stop',
    label: 'STOP',
    icon: <IconStop size={18} />,
    hotkey: 'S',
    available: true,
    color: 'var(--bad, #D84C4C)',
    description: 'Stop current agent task',
  },
  {
    id: 'hold',
    label: 'HOLD',
    icon: <IconHold size={18} />,
    hotkey: 'H',
    available: true,
    color: 'var(--warn, #D4A017)',
    description: 'Pause agent execution',
  },
  {
    id: 'resume',
    label: 'RESUME',
    icon: <IconResume size={18} />,
    hotkey: 'R',
    available: true,
    color: 'var(--ok, #48C774)',
    description: 'Resume agent execution',
  },

  // Row 2: A I X - Assignment
  {
    id: 'assign',
    label: 'ASSIGN',
    icon: <IconAssign size={18} />,
    hotkey: 'A',
    available: true,
    color: 'var(--blaze, #E86C2C)',
    description: 'Assign new task to agent',
  },
  {
    id: 'inspect',
    label: 'INSPECT',
    icon: <IconInspect size={18} />,
    hotkey: 'I',
    available: true,
    color: 'var(--muted, #a7b2c0)',
    description: 'Inspect agent state and context',
  },
  {
    id: 'terminate',
    label: 'TERMINATE',
    icon: <IconTerminate size={18} />,
    hotkey: 'X',
    available: true,
    color: 'var(--bad, #D84C4C)',
    description: 'Terminate agent process',
  },

  // Row 3: Reserved slots
  {
    id: 'reserved-1',
    label: '',
    icon: null,
    hotkey: '',
    available: false,
    reserved: true,
    description: 'Coming soon',
  },
  {
    id: 'reserved-2',
    label: '',
    icon: null,
    hotkey: '',
    available: false,
    reserved: true,
    description: 'Coming soon',
  },
  {
    id: 'reserved-3',
    label: '',
    icon: null,
    hotkey: '',
    available: false,
    reserved: true,
    description: 'Coming soon',
  },
];

// Hotkey mapping for keyboard support
const HOTKEY_MAP: Record<string, string> = {
  KeyS: 'stop',
  KeyH: 'hold',
  KeyR: 'resume',
  KeyA: 'assign',
  KeyI: 'inspect',
  KeyX: 'terminate',
};

// ─────────────────────────────────────────────────────────────
// Styles - Using BlazeCraft tokens
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: 'linear-gradient(180deg, var(--panel, #12161c) 0%, var(--panel2, #0f1318) 100%)',
    border: '2px solid var(--border, #2a313b)',
    boxShadow: 'var(--inner), var(--shadow)',
    borderRadius: '4px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, var(--panel, #12161c) 0%, var(--panel2, #0f1318) 100%)',
    borderBottom: '1px solid var(--border, #2a313b)',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--gold, #C9A227)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    padding: '8px',
    background: 'var(--bg, #0b0d10)',
  },
  button: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px',
    background: 'linear-gradient(180deg, var(--panel, #12161c) 0%, var(--panel2, #0f1318) 100%)',
    border: '2px solid var(--border, #2a313b)',
    boxShadow: 'var(--inner)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    position: 'relative' as const,
    minHeight: '56px',
  },
  buttonHover: {
    background: 'linear-gradient(180deg, #1a1f28 0%, var(--panel, #12161c) 100%)',
    borderColor: 'var(--blaze, #E86C2C)',
    boxShadow: 'inset 0 1px 0 rgba(232, 108, 44, 0.2), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 12px rgba(232, 108, 44, 0.3)',
  },
  buttonActive: {
    background: 'linear-gradient(180deg, var(--panel2, #0f1318) 0%, var(--panel, #12161c) 100%)',
    borderColor: 'var(--gold, #C9A227)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 12px rgba(201, 162, 39, 0.5)',
    transform: 'translateY(1px)',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    filter: 'grayscale(0.5)',
  },
  buttonReserved: {
    background: 'linear-gradient(180deg, #0a0c0f 0%, #050607 100%)',
    borderColor: '#1a1e25',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  icon: {
    lineHeight: 1,
  },
  label: {
    fontSize: '0.5rem',
    fontWeight: 600,
    color: 'var(--muted, #a7b2c0)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  hotkey: {
    position: 'absolute' as const,
    bottom: '4px',
    right: '5px',
    fontSize: '0.55rem',
    fontWeight: 700,
    color: 'var(--gold, #C9A227)',
    fontFamily: 'monospace',
  },
  reservedLabel: {
    position: 'absolute' as const,
    bottom: '4px',
    right: '5px',
    fontSize: '0.4rem',
    fontWeight: 700,
    color: 'var(--muted, #a7b2c0)',
    letterSpacing: '0.05em',
    opacity: 0.7,
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CommandCard({ unit, onCommand, disabled }: CommandCardProps): React.ReactElement {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Initialize sound on first interaction
  useEffect(() => {
    const initOnInteraction = () => {
      initSound();
      window.removeEventListener('click', initOnInteraction);
    };
    window.addEventListener('click', initOnInteraction);
    return () => window.removeEventListener('click', initOnInteraction);
  }, []);

  const handleClick = useCallback((cmd: CommandButton, index: number) => {
    if (!cmd.available || cmd.reserved || disabled) return;

    // Play click sound
    playClick();

    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 150);

    if (onCommand) {
      onCommand(cmd.id);
    }
  }, [onCommand, disabled]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const commandId = HOTKEY_MAP[e.code];
      if (commandId) {
        e.preventDefault();
        const cmdIndex = CONSOLE_COMMANDS.findIndex(cmd => cmd.id === commandId);
        const cmd = CONSOLE_COMMANDS[cmdIndex];
        if (cmd && cmd.available && !cmd.reserved) {
          handleClick(cmd, cmdIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, disabled]);

  return (
    <div style={styles.container} className="wc3-panel wc3-panel-frame">
      <div style={styles.header}>
        <span style={styles.title}>Command Card</span>
        {unit && (
          <span style={{ ...styles.title, color: 'var(--blaze, #E86C2C)' }}>
            {unit.type.toUpperCase()}
          </span>
        )}
      </div>

      <div style={styles.grid} className="wc3-command-grid">
        {CONSOLE_COMMANDS.map((cmd, index) => {
          const isHovered = hoveredIndex === index;
          const isActive = activeIndex === index;
          const isDisabled = !cmd.available || disabled;
          const isReserved = cmd.reserved;

          // Reserved slot rendering
          if (isReserved) {
            return (
              <div
                key={cmd.id}
                style={{
                  ...styles.button,
                  ...styles.buttonReserved,
                }}
                className="wc3-button wc3-command-button wc3-command-reserved"
                title="Coming soon"
              >
                <span style={styles.reservedLabel}>SOON</span>
              </div>
            );
          }

          return (
            <div
              key={cmd.id}
              style={{
                ...styles.button,
                ...(isHovered && !isDisabled ? styles.buttonHover : {}),
                ...(isActive ? styles.buttonActive : {}),
                ...(isDisabled ? styles.buttonDisabled : {}),
              }}
              className="wc3-button wc3-command-button wc3-hover-glow"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(cmd, index)}
              title={`${cmd.label} (${cmd.hotkey}) - ${cmd.description}`}
            >
              {/* Icon */}
              <span
                style={{
                  ...styles.icon,
                  color: cmd.color ?? 'var(--text, #e8eef6)',
                }}
                className="icon"
              >
                {cmd.icon}
              </span>

              {/* Label */}
              <span style={styles.label} className="label">
                {cmd.label}
              </span>

              {/* Hotkey */}
              <span style={styles.hotkey} className="hotkey">
                {cmd.hotkey}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
