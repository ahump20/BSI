/**
 * ScoutStrip - Rotating one-line message bar (WC3 "battle report" style)
 *
 * Displays key events in a rotating fashion at the bottom of the viewport.
 * Messages fade in, hold, then fade out before the next message appears.
 */

import React, { useState, useEffect, useRef } from 'react';
import { IconSword, IconShield, IconLightning, IconCompleted, IconFailed } from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ScoutMessage {
  id: string;
  text: string;
  type: 'action' | 'decision' | 'error' | 'success' | 'info';
  timestamp: number;
}

interface ScoutStripProps {
  messages: ScoutMessage[];
  rotationInterval?: number; // ms between messages, default 4000
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, rgba(18, 22, 28, 0.95) 0%, rgba(11, 13, 16, 0.98) 100%)',
    borderTop: '1px solid var(--border, #2a313b)',
    overflow: 'hidden',
    zIndex: 10,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0,
    transform: 'translateY(8px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  innerVisible: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  icon: {
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  text: {
    fontSize: '0.7rem',
    fontWeight: 500,
    color: 'var(--muted, #a7b2c0)',
    whiteSpace: 'nowrap' as const,
    letterSpacing: '0.02em',
  },
  empty: {
    fontSize: '0.65rem',
    color: 'var(--muted, #a7b2c0)',
    opacity: 0.5,
    fontStyle: 'italic' as const,
  },
};

// ─────────────────────────────────────────────────────────────
// Icon mapping by message type
// ─────────────────────────────────────────────────────────────

function getMessageIcon(type: ScoutMessage['type']): React.ReactElement {
  const iconColor = getIconColor(type);

  switch (type) {
    case 'action':
      return <IconSword size={14} color={iconColor} />;
    case 'decision':
      return <IconLightning size={14} color={iconColor} />;
    case 'error':
      return <IconFailed size={14} color={iconColor} />;
    case 'success':
      return <IconCompleted size={14} color={iconColor} />;
    case 'info':
    default:
      return <IconShield size={14} color={iconColor} />;
  }
}

function getIconColor(type: ScoutMessage['type']): string {
  switch (type) {
    case 'action':
      return 'var(--blaze, #E86C2C)';
    case 'decision':
      return 'var(--gold, #C9A227)';
    case 'error':
      return 'var(--bad, #D84C4C)';
    case 'success':
      return 'var(--ok, #48C774)';
    case 'info':
    default:
      return 'var(--muted, #a7b2c0)';
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ScoutStrip({
  messages,
  rotationInterval = 4000,
}: ScoutStripProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the last N messages for rotation (most recent first)
  const recentMessages = messages.slice(-10).reverse();

  useEffect(() => {
    if (recentMessages.length === 0) {
      setIsVisible(false);
      return;
    }

    // Reset to first message when new messages arrive
    setCurrentIndex(0);
    setIsVisible(true);

    const rotate = () => {
      // Fade out
      setIsVisible(false);

      // After fade out, switch message and fade in
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % recentMessages.length);
        setIsVisible(true);
      }, 300); // Match CSS transition duration
    };

    // Set up rotation interval
    const intervalId = setInterval(rotate, rotationInterval);

    return () => {
      clearInterval(intervalId);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [recentMessages.length, rotationInterval]);

  // Handle empty state
  if (recentMessages.length === 0) {
    return (
      <div style={styles.container} className="wc3-scout-strip">
        <span style={styles.empty}>Awaiting reports...</span>
      </div>
    );
  }

  const currentMessage = recentMessages[currentIndex];

  return (
    <div style={styles.container} className="wc3-scout-strip">
      <div
        style={{
          ...styles.inner,
          ...(isVisible ? styles.innerVisible : {}),
        }}
        className="wc3-scout-strip-inner"
      >
        <span style={styles.icon} className="wc3-scout-strip-icon">
          {getMessageIcon(currentMessage.type)}
        </span>
        <span style={styles.text} className="wc3-scout-strip-text">
          {currentMessage.text}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper: Create scout message from event
// ─────────────────────────────────────────────────────────────

export function createScoutMessage(
  text: string,
  type: ScoutMessage['type'] = 'info'
): ScoutMessage {
  return {
    id: `scout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    type,
    timestamp: Date.now(),
  };
}

export type { ScoutMessage };
