/**
 * BlazeCraft Icon System - Original SVG icons
 *
 * WC3-inspired iconography for:
 * - Resources (gold, wood, skull, lightning, scroll)
 * - Commands (stop, hold, resume, assign, inspect, terminate)
 * - Status indicators (gear, sword, shield, hourglass)
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Resource Icons
// ─────────────────────────────────────────────────────────────

export function IconGold({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconWood({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="8" rx="2" stroke={color} strokeWidth="2" />
      <line x1="8" y1="8" x2="8" y2="16" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.5" />
      <line x1="16" y1="8" x2="16" y2="16" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconSkull({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4C7.58 4 4 7.58 4 12v4c0 1.1.9 2 2 2h2v-4h2v4h4v-4h2v4h2c1.1 0 2-.9 2-2v-4c0-4.42-3.58-8-8-8z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <circle cx="9" cy="11" r="1.5" fill={color} />
      <circle cx="15" cy="11" r="1.5" fill={color} />
    </svg>
  );
}

export function IconLightning({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconScroll({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M8 3v4h8V3" stroke={color} strokeWidth="2" />
      <line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="15" x2="14" y2="15" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Command Icons
// ─────────────────────────────────────────────────────────────

export function IconStop({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" fill={color} />
    </svg>
  );
}

export function IconHold({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="5" width="4" height="14" rx="1" fill={color} />
      <rect x="14" y="5" width="4" height="14" rx="1" fill={color} />
    </svg>
  );
}

export function IconResume({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7L8 5z" fill={color} />
    </svg>
  );
}

export function IconAssign({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M15 6l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInspect({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16 16l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTerminate({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Status/Utility Icons
// ─────────────────────────────────────────────────────────────

export function IconGear({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function IconSword({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 3l-7 7M3 21l7-7M10 14l-4 4M14 10l4-4M5 19l2-2M17 7l2-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 3l2 2-3 3-2-2 3-3z" fill={color} />
    </svg>
  );
}

export function IconShield({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2l8 4v6c0 5.5-3.5 10.5-8 12-4.5-1.5-8-6.5-8-12V6l8-4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconHourglass({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 2h12M6 22h12M7 2v4l5 5 5-5V2M7 22v-4l5-5 5 5v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFiles({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWorkers({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="2" />
      <circle cx="17" cy="9" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M21 21v-1.5a3 3 0 00-3-3h-1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconCompleted({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFailed({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconDuration({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTokens({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="8" rx="7" ry="4" stroke={color} strokeWidth="2" />
      <path d="M5 8v8c0 2.2 3.1 4 7 4s7-1.8 7-4V8" stroke={color} strokeWidth="2" />
      <path d="M5 12c0 2.2 3.1 4 7 4s7-1.8 7-4" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Crest/Logo Icon
// ─────────────────────────────────────────────────────────────

export function IconCrest({ size = 24, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2L4 6v6c0 5.5 3.5 10.5 8 12 4.5-1.5 8-6.5 8-12V6l-8-4z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 6l3 2v3l-3 2-3-2V8l3-2z"
        fill={color}
        opacity="0.7"
      />
      <path
        d="M9 15l3 2 3-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Building Icons
// ─────────────────────────────────────────────────────────────

export function IconCastle({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 21V11l2-2V5h2v2h2V5h4v2h2V5h2v4l2 2v10H4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" stroke={color} strokeWidth="2" />
      <path d="M7 3v2M12 3v2M17 3v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconAnvil({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 14h12M4 18h16M10 10h8l-2 4H8l-2-4h4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V4M8 8l-1-2M16 8l1-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMarket({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 10l9-7 9 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v11h14V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" stroke={color} strokeWidth="2" />
      <path d="M5 7l7-5 7 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHorse({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 4l-4 3 1 3h3l2-3-2-3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7l-3 5-4 1-4 3v4h2l2-3 4-1 5-3v-3l3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="6" r="1" fill={color} />
    </svg>
  );
}

export function IconBooks({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8h4M10 6h4M16 10h4" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconBuilding({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 21V8l8-5 8 5v13H4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8l8-5 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="2" stroke={color} strokeWidth="2" />
      <rect x="9" y="17" width="6" height="4" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconAgent({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="10" r="1.5" fill={color} />
      <circle cx="15" cy="10" r="1.5" fill={color} />
      <path d="M9 15h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 4V2M17 4V2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconGamepad({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="3" stroke={color} strokeWidth="2" />
      <circle cx="7" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="17" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M11 10h2M10 12h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFrame({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <rect x="6" y="6" width="12" height="12" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="9" r="1" fill={color} />
    </svg>
  );
}

export function IconConstruction({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2 20h20M5 20V10l7-6 7 6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-6h4v6" stroke={color} strokeWidth="2" />
      <path d="M8 10h8M12 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPin({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconClipboard({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke={color} strokeWidth="2" />
      <rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <path d="M8 10h8M8 14h8M8 18h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export function IconHammer({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 12L4 14l6 6 2-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6l4-4 4 4-4 4-8 8-4-4 8-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBook({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth="2" />
      <path d="M8 6h8M8 10h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconKeyboard({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <path d="M6 10h2M10 10h2M14 10h2M18 10h1M6 14h1M8 14h8M17 14h1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrophy({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 21h8M12 17v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 3H7a1 1 0 00-1 1v5c0 3.3 2.7 6 6 6s6-2.7 6-6V4a1 1 0 00-1-1z" stroke={color} strokeWidth="2" />
      <path d="M6 4H4v3a2 2 0 002 2M18 4h2v3a2 2 0 01-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCrossedSwords({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3l12 12M6 3L4 5l10 10M6 3v4M18 3L6 15M18 3l2 2L10 15M18 3v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l-3 3 3 3 3-3M17 14l3 3-3 3-3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Transport Control Icons
// ─────────────────────────────────────────────────────────────

export function IconSkipBack({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="19,20 9,12 19,4" fill={color} />
      <line x1="5" y1="4" x2="5" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconStepBack({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="18,20 6,12 18,4" fill={color} />
    </svg>
  );
}

export function IconPlay({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="6,4 20,12 6,20" fill={color} />
    </svg>
  );
}

export function IconPause({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="4" width="5" height="16" rx="1" fill={color} />
      <rect x="14" y="4" width="5" height="16" rx="1" fill={color} />
    </svg>
  );
}

export function IconStepForward({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="6,4 18,12 6,20" fill={color} />
    </svg>
  );
}

export function IconSkipForward({ size = 16, color = 'currentColor', className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="5,4 15,12 5,20" fill={color} />
      <line x1="19" y1="4" x2="19" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Export all icons as a map for dynamic lookup
// ─────────────────────────────────────────────────────────────

export const Icons = {
  gold: IconGold,
  wood: IconWood,
  skull: IconSkull,
  lightning: IconLightning,
  scroll: IconScroll,
  stop: IconStop,
  hold: IconHold,
  resume: IconResume,
  assign: IconAssign,
  inspect: IconInspect,
  terminate: IconTerminate,
  gear: IconGear,
  sword: IconSword,
  shield: IconShield,
  hourglass: IconHourglass,
  files: IconFiles,
  workers: IconWorkers,
  completed: IconCompleted,
  failed: IconFailed,
  duration: IconDuration,
  tokens: IconTokens,
  crest: IconCrest,
  castle: IconCastle,
  anvil: IconAnvil,
  market: IconMarket,
  horse: IconHorse,
  books: IconBooks,
  building: IconBuilding,
  agent: IconAgent,
  gamepad: IconGamepad,
  frame: IconFrame,
  construction: IconConstruction,
  pin: IconPin,
  clipboard: IconClipboard,
  target: IconTarget,
  hammer: IconHammer,
  book: IconBook,
  keyboard: IconKeyboard,
  trophy: IconTrophy,
  crossedSwords: IconCrossedSwords,
  skipBack: IconSkipBack,
  stepBack: IconStepBack,
  play: IconPlay,
  pause: IconPause,
  stepForward: IconStepForward,
  skipForward: IconSkipForward,
} as const;

export type IconName = keyof typeof Icons;
