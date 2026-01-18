/**
 * BSI Icon System - Custom SVG icons
 *
 * Ported from BlazeCraft with BSI-specific additions.
 * Zero dependencies - pure React SVG components.
 */

import type { FC, ReactElement } from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Sports/Analytics Icons
// ─────────────────────────────────────────────────────────────

export function IconTrophy({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 21h8M12 17v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 3H7a1 1 0 00-1 1v5c0 3.3 2.7 6 6 6s6-2.7 6-6V4a1 1 0 00-1-1z" stroke={color} strokeWidth="2" />
      <path d="M6 4H4v3a2 2 0 002 2M18 4h2v3a2 2 0 01-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconChart({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDashboard({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconBrain({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4.5C9.5 4.5 7.5 6 7 8c-1.5.5-2.5 2-2.5 3.5 0 1.5.5 2.5 1.5 3.5-.5 1-.5 2 0 3 .5 1 1.5 1.5 2.5 1.5h7c1 0 2-.5 2.5-1.5.5-1 .5-2 0-3 1-1 1.5-2 1.5-3.5 0-1.5-1-3-2.5-3.5-.5-2-2.5-3.5-5-3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 4.5v15M8 8c1.5 1 3 1 4 0M16 8c-1.5 1-3 1-4 0" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconLayers({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSparkle({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Resource Icons
// ─────────────────────────────────────────────────────────────

export function IconGold({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <path d="M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLightning({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function IconShield({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2l8 4v6c0 5.5-3.5 10.5-8 12-4.5-1.5-8-6.5-8-12V6l8-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Command Icons
// ─────────────────────────────────────────────────────────────

export function IconStop({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1" fill={color} />
    </svg>
  );
}

export function IconPlay({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="6,4 20,12 6,20" fill={color} />
    </svg>
  );
}

export function IconPause({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="4" width="5" height="16" rx="1" fill={color} />
      <rect x="14" y="4" width="5" height="16" rx="1" fill={color} />
    </svg>
  );
}

export function IconInspect({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16 16l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTerminate({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M6 18L18 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Status/Utility Icons
// ─────────────────────────────────────────────────────────────

export function IconGear({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function IconSword({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19 3l-7 7M3 21l7-7M10 14l-4 4M14 10l4-4M5 19l2-2M17 7l2-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 3l2 2-3 3-2-2 3-3z" fill={color} />
    </svg>
  );
}

export function IconCrossedSwords({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3l12 12M6 3L4 5l10 10M6 3v4M18 3L6 15M18 3l2 2L10 15M18 3v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l-3 3 3 3 3-3M17 14l3 3-3 3-3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHourglass({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 2h12M6 22h12M7 2v4l5 5 5-5V2M7 22v-4l5-5 5 5v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDuration({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCompleted({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFailed({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export function IconFiles({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWorkers({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="2" />
      <circle cx="17" cy="9" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M21 21v-1.5a3 3 0 00-3-3h-1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconPin({ size = 16, color = "currentColor", className }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Icon Map for Dynamic Lookup
// ─────────────────────────────────────────────────────────────

export const Icons = {
  trophy: IconTrophy,
  chart: IconChart,
  dashboard: IconDashboard,
  brain: IconBrain,
  layers: IconLayers,
  sparkle: IconSparkle,
  gold: IconGold,
  lightning: IconLightning,
  shield: IconShield,
  stop: IconStop,
  play: IconPlay,
  pause: IconPause,
  inspect: IconInspect,
  terminate: IconTerminate,
  gear: IconGear,
  sword: IconSword,
  crossedSwords: IconCrossedSwords,
  hourglass: IconHourglass,
  duration: IconDuration,
  completed: IconCompleted,
  failed: IconFailed,
  target: IconTarget,
  files: IconFiles,
  workers: IconWorkers,
  pin: IconPin,
} as const;

export type IconName = keyof typeof Icons;

// ─────────────────────────────────────────────────────────────
// Icon Component (backward-compatible with existing BSI usage)
// ─────────────────────────────────────────────────────────────

interface IconComponentProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const Icon: FC<IconComponentProps> = ({ name, size = 16, color = "currentColor", className }) => {
  const Component = Icons[name];
  return <Component size={size} color={color} className={className} />;
};
