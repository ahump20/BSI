/**
 * ControlHints - Overlay showing keyboard/mouse controls
 *
 * Positioned at bottom center of viewport.
 * Shows hints like "Drag • select • RMB • assign • Wheel • zoom • MMB • pan"
 */

import React from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ControlHintsProps {
  visible?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'absolute' as const,
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(13, 13, 13, 0.85)',
    border: '1px solid #333',
    borderRadius: '6px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: '0.7rem',
    color: '#888',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none' as const,
    zIndex: 10,
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  key: {
    color: '#BF5700',
    fontWeight: 600,
  },
  action: {
    color: '#AAA',
  },
  separator: {
    color: '#444',
    margin: '0 0.25rem',
  },
};

// ─────────────────────────────────────────────────────────────
// Control Definitions
// ─────────────────────────────────────────────────────────────

const HINTS = [
  { key: 'Drag', action: 'select' },
  { key: 'RMB', action: 'assign' },
  { key: 'Wheel', action: 'zoom' },
  { key: 'MMB', action: 'pan' },
  { key: 'Space', action: 'play/pause' },
  { key: '← →', action: 'step' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ControlHints({ visible = true }: ControlHintsProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div style={styles.container}>
      {HINTS.map((hint, index) => (
        <React.Fragment key={hint.key}>
          {index > 0 && <span style={styles.separator}>•</span>}
          <div style={styles.hint}>
            <span style={styles.key}>{hint.key}</span>
            <span style={styles.action}>{hint.action}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
