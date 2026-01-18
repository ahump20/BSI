/**
 * CityBuilderApp - Warcraft-style agent city builder
 *
 * Main application for the city builder mode where real Claude Code
 * agent events drive building upgrades on a floating island city.
 *
 * Layout:
 * - Header: BlazeCraft title + connection status
 * - Left: Hero portrait + stats
 * - Center: Isometric city view
 * - Right: Event log
 * - Bottom: Minimap + building cards
 *
 * Version 2.1.0:
 * - Interactive building placement
 * - Camera zoom/pan controls
 * - Functional nav buttons
 * - Minimap navigation
 * - Event logging
 * - Keyboard shortcuts
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CityWorldRenderer, createCityWorldRenderer } from '@core/CityWorldRenderer';
import { IsometricWorldRenderer, createIsometricWorldRenderer } from '@core/IsometricWorldRenderer';
import { LiveBridge, createLiveBridge, ConnectionStatus, EventPayload, AgentState } from '@core/LiveBridge';
import { CityState, BuildingKind, createInitialCityState, BUILDING_CONFIGS, getCityLevel, getTierProgress, getBuildingFromPath } from '@core/BuildingSystem';
import { FilmGrain } from './FilmGrain';
import { CommandCard } from './CommandCard';
import { IconCompleted, IconFailed, IconGear, IconFiles, IconWorkers, IconSword } from './Icons';
import { uiSfx, playClick, playComplete, playError, playNotify, initSound } from '@core/ui-sfx';
import { PerformanceHUD } from './PerformanceHUD';
import { TutorialOverlay } from './TutorialOverlay';
import '@styles/wc3-theme.css';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type RenderMode = '2d' | '3d';

/** Union type for both renderer implementations */
type CityRenderer = CityWorldRenderer | IsometricWorldRenderer;

interface GameEvent {
  id: string;
  type: 'building_placed' | 'building_selected' | 'camera_change' | 'spawn' | 'task_start' | 'task_complete' | 'error' | 'status' | 'agent_update';
  message: string;
  timestamp: string;
  agentName?: string;
  agentId?: string;
  data?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

function getRenderMode(): RenderMode {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('render');
  if (urlParam === '3d' || urlParam === '2d') {
    return urlParam;
  }
  // Fall back to env var default, then '2d'
  const envDefault = import.meta.env.VITE_DEFAULT_RENDER;
  return envDefault === '3d' ? '3d' : '2d';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false });
}

/** D3: Format relative time like "2m ago" */
function formatRelativeTime(timestamp: string): string {
  // Parse HH:MM:SS format
  const [hours, minutes, seconds] = timestamp.split(':').map(Number);
  const now = new Date();
  const eventTime = new Date();
  eventTime.setHours(hours, minutes, seconds, 0);

  const diffMs = now.getTime() - eventTime.getTime();
  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
}

/** D3: Get icon for event type */
function getEventIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    task_complete: <IconCompleted size={12} color="var(--ok, #48C774)" />,
    task_start: <IconGear size={12} color="var(--muted, #a7b2c0)" />,
    spawn: <IconWorkers size={12} color="var(--ok, #48C774)" />,
    error: <IconFailed size={12} color="var(--bad, #D84C4C)" />,
    building_placed: <IconFiles size={12} color="var(--blaze, #E86C2C)" />,
    building_selected: <IconSword size={12} color="var(--gold, #C9A227)" />,
    agent_update: <IconWorkers size={12} color="#9B59B6" />,
  };
  return icons[type] ?? <IconGear size={12} color="var(--muted, #a7b2c0)" />;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#0D0D0D',
    color: '#F5F5DC',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },

  // Header
  header: {
    height: '50px',
    background: '#1A1A1A',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#BF5700',
    letterSpacing: '0.05em',
  },
  logoSubtext: {
    fontSize: '0.6rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.6rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statCounterHover: {
    background: '#1A1A1A',
    borderColor: '#444',
  },
  statIcon: {
    fontSize: '0.9rem',
  },
  statValue: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#F5F5DC',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: '#666',
    textTransform: 'uppercase' as const,
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 0.7rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  renderModeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  // Main content
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },

  // Left sidebar
  leftSidebar: {
    width: '220px',
    background: '#1A1A1A',
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroSection: {
    padding: '0.75rem',
    borderBottom: '1px solid #333',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  heroPortrait: {
    width: '100%',
    aspectRatio: '1',
    background: '#0D0D0D',
    borderRadius: '8px',
    border: '2px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4rem',
    marginBottom: '0.5rem',
  },
  heroName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
    textAlign: 'center' as const,
    marginBottom: '0.25rem',
  },
  heroLevel: {
    fontSize: '0.7rem',
    color: '#BF5700',
    textAlign: 'center' as const,
    fontWeight: 600,
  },
  agentList: {
    flex: 1,
    padding: '0.5rem',
    overflow: 'auto',
  },
  agentCard: {
    padding: '0.5rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  agentName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.2rem',
  },
  agentRegion: {
    fontSize: '0.65rem',
    color: '#888',
  },
  agentStatus: {
    display: 'inline-flex',
    padding: '0.15rem 0.4rem',
    borderRadius: '3px',
    fontSize: '0.55rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginTop: '0.3rem',
  },

  // Center viewport
  viewport: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    background: '#0D0D0D',
    minWidth: 0,
  },
  viewportCanvas: {
    width: '100%',
    height: '100%',
  },
  placementModeIndicator: {
    position: 'absolute' as const,
    top: '0.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.4rem 0.8rem',
    background: 'rgba(191, 87, 0, 0.9)',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#FFF',
    zIndex: 100,
  },
  controlHints: {
    position: 'absolute' as const,
    bottom: '0.5rem',
    left: '0.5rem',
    padding: '0.4rem 0.6rem',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    fontSize: '0.6rem',
    color: '#888',
    zIndex: 100,
  },
  zoomControls: {
    position: 'absolute' as const,
    bottom: '0.5rem',
    right: '0.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    zIndex: 100,
  },
  zoomButton: {
    width: '28px',
    height: '28px',
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#F5F5DC',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Right sidebar
  rightSidebar: {
    width: '260px',
    background: '#1A1A1A',
    borderLeft: '1px solid #333',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    flexShrink: 0,
  },
  eventLogHeader: {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLogTitle: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.6rem',
    color: '#2ECC71',
  },
  eventFilterBar: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.4rem 0.5rem',
    borderBottom: '1px solid #333',
    background: '#111',
  },
  eventFilterBtn: {
    padding: '0.2rem 0.5rem',
    fontSize: '0.6rem',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '3px',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  eventFilterBtnActive: {
    background: '#BF5700',
    borderColor: '#BF5700',
    color: '#fff',
  },
  eventLogContent: {
    flex: 1,
    padding: '0.5rem',
    overflow: 'auto',
  },
  eventItem: {
    padding: '0.5rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    marginBottom: '0.4rem',
    borderLeft: '3px solid',
  },
  eventTime: {
    fontSize: '0.6rem',
    color: '#666',
    marginBottom: '0.15rem',
  },
  eventMessage: {
    fontSize: '0.75rem',
    color: '#F5F5DC',
  },
  eventAgent: {
    fontSize: '0.6rem',
    color: '#888',
    marginTop: '0.15rem',
  },

  // Bottom bar
  bottomBar: {
    height: '120px',
    background: '#1A1A1A',
    borderTop: '1px solid #333',
    display: 'flex',
    gap: '1px',
  },
  minimapSection: {
    width: '220px',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  minimapTitle: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.35rem',
  },
  minimapCanvas: {
    flex: 1,
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    position: 'relative' as const,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  buildingGrid: {
    flex: 1,
    padding: '0.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '0.5rem',
  },
  buildingCard: {
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '2px solid #333',
    padding: '0.4rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buildingCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  buildingCardSelected: {
    borderColor: '#BF5700',
    background: 'rgba(191, 87, 0, 0.1)',
  },
  buildingIcon: {
    fontSize: '1.2rem',
    marginBottom: '0.2rem',
  },
  buildingName: {
    fontSize: '0.55rem',
    color: '#F5F5DC',
    textAlign: 'center' as const,
    marginBottom: '0.15rem',
  },
  buildingTier: {
    fontSize: '0.5rem',
    color: '#888',
  },
  progressBar: {
    width: '100%',
    height: '3px',
    background: '#333',
    borderRadius: '2px',
    marginTop: '0.2rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },

  // Modals
  modal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#1A1A1A',
    borderRadius: '8px',
    border: '1px solid #333',
    padding: '1.5rem',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '1rem',
  },
  modalBody: {
    fontSize: '0.85rem',
    color: '#888',
    marginBottom: '1rem',
  },
  modalClose: {
    padding: '0.5rem 1rem',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#F5F5DC',
    cursor: 'pointer',
  },

  // Notifications
  // Phase 2: Enhanced Notification
  notification: {
    position: 'fixed' as const,
    top: '80px',
    right: '16px',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.95), rgba(255, 107, 53, 0.95))',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(191, 87, 0, 0.3)',
    zIndex: 1000,
    textAlign: 'left' as const,
    minWidth: '200px',
    maxWidth: '300px',
    animation: 'slideIn 0.3s ease-out',
  },
  notificationIcon: {
    fontSize: '1.5rem',
    marginRight: '0.75rem',
    display: 'inline-block',
  },
  notificationTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#FFF',
    marginBottom: '0.25rem',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  notificationSubtitle: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  notificationProgress: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    height: '3px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '0 0 8px 8px',
    animation: 'notificationProgress 2.5s linear',
  },

  // Phase 2: Tooltip
  tooltip: {
    position: 'absolute' as const,
    background: 'rgba(13, 13, 13, 0.95)',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.75rem',
    zIndex: 1001,
    pointerEvents: 'none' as const,
    maxWidth: '250px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  tooltipTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tooltipDesc: {
    fontSize: '0.75rem',
    color: '#888',
    marginBottom: '0.5rem',
    lineHeight: 1.4,
  },
  tooltipStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.25rem',
    fontSize: '0.7rem',
    color: '#666',
  },
  tooltipStat: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  // Phase 2: Context Menu
  contextMenu: {
    position: 'fixed' as const,
    background: '#1A1A1A',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.25rem',
    zIndex: 1002,
    minWidth: '150px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  contextMenuItem: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.8rem',
    color: '#F5F5DC',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background 0.15s ease',
  },
  contextMenuItemHover: {
    background: 'rgba(191, 87, 0, 0.2)',
  },
  contextMenuDivider: {
    height: '1px',
    background: '#333',
    margin: '0.25rem 0',
  },

  // Phase 2: Settings Panel
  settingsPanel: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#1A1A1A',
    border: '1px solid #444',
    borderRadius: '12px',
    padding: '1.5rem',
    zIndex: 1003,
    width: '350px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  },
  settingsTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  settingsSection: {
    marginBottom: '1rem',
  },
  settingsLabel: {
    fontSize: '0.8rem',
    color: '#888',
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  settingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #333',
  },
  toggle: {
    width: '40px',
    height: '22px',
    background: '#333',
    borderRadius: '11px',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  toggleOn: {
    background: '#BF5700',
  },
  toggleKnob: {
    width: '18px',
    height: '18px',
    background: '#F5F5DC',
    borderRadius: '50%',
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    transition: 'transform 0.2s ease',
  },
  toggleKnobOn: {
    transform: 'translateX(18px)',
  },

  // Phase 2: Keyboard Shortcut Overlay
  shortcutOverlay: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(13, 13, 13, 0.95)',
    border: '1px solid #444',
    borderRadius: '12px',
    padding: '1.5rem',
    zIndex: 1003,
    minWidth: '400px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  },
  shortcutTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#BF5700',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  shortcutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  shortcutKey: {
    padding: '0.3rem 0.6rem',
    background: '#333',
    border: '1px solid #444',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#F5F5DC',
    fontFamily: 'monospace',
    minWidth: '30px',
    textAlign: 'center' as const,
  },
  shortcutAction: {
    fontSize: '0.8rem',
    color: '#888',
  },

  // Phase 2: Resource Counter (top bar)
  resourceBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0 0.75rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    marginRight: '0.5rem',
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.75rem',
  },
  resourceIcon: {
    fontSize: '0.9rem',
  },
  resourceValue: {
    fontWeight: 600,
    color: '#F5F5DC',
  },
};

// ─────────────────────────────────────────────────────────────
// Building Icons
// ─────────────────────────────────────────────────────────────

const BUILDING_ICONS: Record<BuildingKind, string> = {
  townhall: '🏰',
  workshop: '⚒️',
  market: '🏪',
  barracks: '⚔️',
  stables: '🐎',
  library: '📚',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CityBuilderApp(): React.ReactElement {
  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CityRenderer | null>(null);
  const bridgeRef = useRef<LiveBridge | null>(null);
  const initRef = useRef(false);

  // Render mode (determined once at mount)
  const [renderMode] = useState<RenderMode>(getRenderMode);

  // State
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [cityState, setCityState] = useState<CityState>(createInitialCityState);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<BuildingKind | null>(null);
  const [placementMode, setPlacementMode] = useState<BuildingKind | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [notification, setNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<BuildingKind | null>(null);
  const [cameraState, setCameraState] = useState({ x: 0, y: 0, zoom: 1.0 });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);  // D2: For command card

  // Modal states
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [agentsModalOpen, setAgentsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Phase 2: UI enhancement states
  const [tooltipData, setTooltipData] = useState<{
    building: BuildingKind;
    x: number;
    y: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    building: BuildingKind | null;
    x: number;
    y: number;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shortcutOverlayOpen, setShortcutOverlayOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingKind | null>(null);
  const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial on first visit only
    return !localStorage.getItem('blazecraft_tutorial_complete');
  });
  const [eventFilter, setEventFilter] = useState<'all' | 'tasks' | 'buildings' | 'agents' | 'system'>('all');

  // Computed values
  const cityLevel = useMemo(() => getCityLevel(cityState), [cityState]);
  const totalCompletions = cityState.totalCompletions;
  const activeAgentCount = Object.keys(agents).length;

  // Filter events based on selected category
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return gameEvents;

    const filterMap: Record<string, GameEvent['type'][]> = {
      tasks: ['task_start', 'task_complete'],
      buildings: ['building_placed', 'building_selected'],
      agents: ['spawn', 'agent_update'],
      system: ['status', 'error', 'camera_change'],
    };

    const allowedTypes = filterMap[eventFilter] ?? [];
    return gameEvents.filter((e) => allowedTypes.includes(e.type));
  }, [gameEvents, eventFilter]);

  // ─────────────────────────────────────────────────────────────
  // Event Logging
  // ─────────────────────────────────────────────────────────────

  const addEvent = useCallback((type: GameEvent['type'], message: string, data?: Record<string, unknown>) => {
    const event: GameEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: formatTime(new Date()),
      data,
    };
    setGameEvents((prev) => [...prev.slice(-49), event]);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!viewportRef.current || initRef.current) return;
    initRef.current = true;

    async function init() {
      if (!viewportRef.current) return;

      try {
        // Create renderer based on mode
        let renderer: CityRenderer;

        if (renderMode === '3d') {
          // 3D Three.js renderer
          renderer = await createIsometricWorldRenderer({
            container: viewportRef.current,
            onDistrictClick: (id) => {
              setSelectedDistrict(id as BuildingKind);
              addEvent('building_selected', `Selected ${BUILDING_CONFIGS[id as BuildingKind].name}`);
            },
            onDistrictHover: () => { /* hover handled internally */ },
            onReady: () => setIsReady(true),
          });
        } else {
          // 2D Pixi.js renderer (default)
          renderer = await createCityWorldRenderer({
            container: viewportRef.current,
            onDistrictClick: (district) => {
              setSelectedDistrict(district);
              setSelectedAgent(null); // Deselect agent when clicking district
              addEvent('building_selected', `Selected ${BUILDING_CONFIGS[district].name}`);
            },
            onBuildingPlaced: (kind, gridX, gridY) => {
              addEvent('building_placed', `Placed ${BUILDING_CONFIGS[kind].name} at (${gridX}, ${gridY})`);
              setPlacementMode(null);
              playClick(); // Sound feedback
            },
            onCameraChange: (x, y, zoom) => {
              setCameraState({ x, y, zoom });
            },
            // C3: Agent click from viewport
            onAgentClick: (agentId) => {
              setSelectedAgent(agentId);
              addEvent('agent_update', `Selected agent ${agentId}`);
            },
            onReady: () => setIsReady(true),
          });
        }

        rendererRef.current = renderer;

        // A1: Immediate initial render with Tier 0 buildings
        // Fix blank viewport by pushing initial state to renderer synchronously
        const initialState = createInitialCityState();
        setCityState(initialState);
        void renderer.updateCityState(initialState);

        addEvent('status', 'City renderer initialized');

        // Initialize sound system on user interaction
        initSound();

        // Create live bridge
        const bridge = createLiveBridge({
          onEvent: (event) => {
            addEvent(
              event.type as GameEvent['type'],
              event.type === 'task_complete'
                ? `Completed: ${event.data?.files?.[0] ?? 'task'}`
                : event.type === 'spawn'
                ? `Agent spawned: ${event.agentName}`
                : event.type.replace('_', ' '),
              event.data as Record<string, unknown>
            );
          },
          onAgentUpdate: (newAgents) => {
            setAgents(newAgents);

            // C3: Sync agents to renderer
            if (rendererRef.current && 'addAgent' in rendererRef.current) {
              const renderer = rendererRef.current as CityWorldRenderer;
              const existingIds = renderer.getAgentIds();
              const newIds = Object.keys(newAgents);

              // Add new agents
              for (const [id, agent] of Object.entries(newAgents)) {
                // Map region string to BuildingKind
                const region = (agent.region as BuildingKind) || 'townhall';
                if (!existingIds.includes(id)) {
                  renderer.addAgent(id, agent.name, region);
                } else {
                  renderer.updateAgentRegion(id, region);
                  renderer.setAgentStatus(id, agent.status === 'working' ? 'working' : 'idle');
                }
              }

              // Remove departed agents
              for (const id of existingIds) {
                if (!newIds.includes(id)) {
                  renderer.removeAgent(id);
                }
              }
            }

            if (Object.keys(newAgents).length > 0) {
              addEvent('agent_update', `${Object.keys(newAgents).length} agents active`);
            }
          },
          onCityStateUpdate: (state) => {
            setCityState(state);
            void rendererRef.current?.updateCityState(state);
          },
          onBuildingUpgrade: (buildingKind) => {
            const config = BUILDING_CONFIGS[buildingKind as BuildingKind];
            const tier = bridgeRef.current?.getCityState()?.buildings[buildingKind as BuildingKind]?.tier ?? 0;
            showNotification(`${config.name} Upgraded!`, `Now: ${config.tierNames[tier]}`);
            addEvent('task_complete', `${config.name} upgraded to ${config.tierNames[tier]}`);
            playComplete(); // Victory chime for upgrade
          },
          onStatusChange: (s) => {
            setStatus(s);
            addEvent('status', `Connection: ${s}`);
          },
        }, {
          // E1: Production SSE URL configuration
          baseUrl: window.location.hostname.includes('localhost')
            ? '/api/events'
            : 'https://blazecraft.app/api/events',
          sessionId: 'main',
        });
        bridgeRef.current = bridge;

        // Mode is controlled by VITE_FORCE_DEMO env var (not hostname)
        // Set VITE_FORCE_DEMO=true in Cloudflare Pages to force demo mode
        // Set VITE_FORCE_DEMO=false (or omit) to try live first
        const forceDemoMode = import.meta.env.VITE_FORCE_DEMO === 'true';

        if (forceDemoMode) {
          bridge.setDemoMode(true);
          addEvent('status', 'Demo mode active (env)');
        } else {
          // Try to connect to live backend first
          bridge.connect();

          // Fallback to demo mode after 5 seconds if not connected
          setTimeout(() => {
            if (bridgeRef.current && !bridgeRef.current.isDemoMode()) {
              bridgeRef.current.setDemoMode(true);
              addEvent('status', 'Demo mode activated (fallback)');
            }
          }, 5000);
        }

      } catch (error) {
        console.error('[CityBuilderApp] Init failed:', error);
        addEvent('error', `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    init();

    return () => {
      rendererRef.current?.dispose();
      bridgeRef.current?.disconnect();
    };
  }, [renderMode, addEvent]);

  // ─────────────────────────────────────────────────────────────
  // Keyboard Shortcuts
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'Escape':
          if (shortcutOverlayOpen) {
            setShortcutOverlayOpen(false);
          } else if (settingsOpen) {
            setSettingsOpen(false);
          } else if (contextMenu) {
            setContextMenu(null);
          } else if (placementMode) {
            setPlacementMode(null);
            (rendererRef.current as CityWorldRenderer)?.setPlacementMode?.(null);
          } else if (selectedDistrict) {
            setSelectedDistrict(null);
            setSelectedBuilding(null);
          } else if (tasksModalOpen || agentsModalOpen || profileModalOpen) {
            setTasksModalOpen(false);
            setAgentsModalOpen(false);
            setProfileModalOpen(false);
          }
          break;
        case '?':
          setShortcutOverlayOpen((prev) => !prev);
          break;
        case 'F3':
          e.preventDefault();
          setShowPerformanceHUD((prev) => !prev);
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((p) => !p);
          addEvent('status', isPaused ? 'Resumed' : 'Paused');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          const buildingIndex = parseInt(e.key) - 1;
          const buildingKinds: BuildingKind[] = ['townhall', 'workshop', 'market', 'barracks', 'stables', 'library'];
          if (buildingIndex < buildingKinds.length) {
            handleBuildingCardClick(buildingKinds[buildingIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placementMode, selectedDistrict, isPaused, tasksModalOpen, agentsModalOpen, profileModalOpen, shortcutOverlayOpen, settingsOpen, contextMenu, addEvent]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const showNotification = useCallback((title: string, subtitle: string) => {
    setNotification({ title, subtitle });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  const handleBuildingCardClick = useCallback((buildingKind: BuildingKind) => {
    if (placementMode === buildingKind) {
      // Toggle off
      setPlacementMode(null);
      (rendererRef.current as CityWorldRenderer)?.setPlacementMode?.(null);
    } else {
      // Enter placement mode
      setPlacementMode(buildingKind);
      (rendererRef.current as CityWorldRenderer)?.setPlacementMode?.(buildingKind);
      addEvent('status', `Placement mode: ${BUILDING_CONFIGS[buildingKind].name}`);
    }
  }, [placementMode, addEvent]);

  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Convert minimap position to world position
    const worldX = (x - 0.5) * 400;
    const worldY = (y - 0.5) * 400;

    (rendererRef.current as CityWorldRenderer)?.panTo?.(-worldX, -worldY);
    addEvent('camera_change', `Camera moved to (${Math.round(worldX)}, ${Math.round(worldY)})`);
  }, [addEvent]);

  const handleZoom = useCallback((delta: number) => {
    const newZoom = cameraState.zoom + delta;
    (rendererRef.current as CityWorldRenderer)?.setZoom?.(newZoom);
  }, [cameraState.zoom]);

  const handleAgentClick = useCallback((agentId: string, agent: AgentState) => {
    // D2: Select agent for command card
    setSelectedAgent(agentId);

    // Center camera on agent's region/building
    const regionToBuilding: Record<string, BuildingKind> = {
      'core': 'workshop',
      'ui': 'market',
      'tests': 'barracks',
      'api': 'stables',
      'docs': 'library',
      'config': 'townhall',
      'workshop': 'workshop',
      'market': 'market',
      'barracks': 'barracks',
      'stables': 'stables',
      'library': 'library',
      'townhall': 'townhall',
    };
    const building = regionToBuilding[agent.region] || 'townhall';
    setSelectedDistrict(building);
    addEvent('building_selected', `Selected agent ${agent.name} at ${BUILDING_CONFIGS[building].name}`);
  }, [addEvent]);

  const getStatusStyle = (s: ConnectionStatus) => {
    const colors = {
      live: { bg: 'rgba(46, 204, 113, 0.15)', color: '#2ECC71', border: '1px solid rgba(46, 204, 113, 0.3)' },
      demo: { bg: 'rgba(243, 156, 18, 0.15)', color: '#F39C12', border: '1px solid rgba(243, 156, 18, 0.3)' },
      connecting: { bg: 'rgba(52, 152, 219, 0.15)', color: '#3498DB', border: '1px solid rgba(52, 152, 219, 0.3)' },
      disconnected: { bg: 'rgba(231, 76, 60, 0.15)', color: '#E74C3C', border: '1px solid rgba(231, 76, 60, 0.3)' },
    };
    return colors[s];
  };

  const getEventColor = (type: string): string => {
    const colors: Record<string, string> = {
      building_placed: '#2ECC71',
      building_selected: '#3498DB',
      spawn: '#2ECC71',
      task_start: '#3498DB',
      task_complete: '#BF5700',
      error: '#E74C3C',
      status: '#888',
      camera_change: '#666',
      agent_update: '#9B59B6',
    };
    return colors[type] ?? '#888';
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const statusStyle = getStatusStyle(status);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚔️</div>
          <div>
            <div style={styles.logoText}>BlazeCraft</div>
            <div style={styles.logoSubtext}>Agent City Builder</div>
          </div>
        </div>

        <div style={styles.statusSection}>
          {/* City Level with XP Progress */}
          <div
            style={{
              ...styles.statCounter,
              ...(hoveredCard === 'townhall' ? styles.statCounterHover : {}),
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.35rem 0.75rem',
            }}
            onClick={() => setProfileModalOpen(true)}
            onMouseEnter={() => setHoveredCard('townhall')}
            onMouseLeave={() => setHoveredCard(null)}
            title={`City Level ${cityLevel} - ${totalCompletions} XP total\nClick to view stats`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={styles.statIcon}>🏰</span>
              <div style={styles.statValue}>Lv.{cityLevel}</div>
            </div>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '2px',
              marginTop: '0.25rem',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (totalCompletions % 10) * 10)}%`,
                background: 'linear-gradient(90deg, #BF5700, #FF6B35)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Buildings */}
          <div
            style={styles.statCounter}
            title="Total building tiers"
          >
            <span style={styles.statIcon}>🏛️</span>
            <div>
              <div style={styles.statValue}>
                {Object.values(cityState.buildings).reduce((sum, b) => sum + b.tier, 0)}
              </div>
              <div style={styles.statLabel}>Tiers</div>
            </div>
          </div>

          {/* Tasks */}
          <div
            style={{
              ...styles.statCounter,
              ...(tasksModalOpen ? styles.statCounterHover : {}),
            }}
            onClick={() => setTasksModalOpen(true)}
            title="Click to view tasks"
          >
            <span style={styles.statIcon}>✅</span>
            <div>
              <div style={styles.statValue}>{totalCompletions}</div>
              <div style={styles.statLabel}>Tasks</div>
            </div>
          </div>

          {/* Agents */}
          <div
            style={{
              ...styles.statCounter,
              ...(agentsModalOpen ? styles.statCounterHover : {}),
            }}
            onClick={() => setAgentsModalOpen(true)}
            title="Click to view agents"
          >
            <span style={styles.statIcon}>🤖</span>
            <div>
              <div style={styles.statValue}>{activeAgentCount}</div>
              <div style={styles.statLabel}>Agents</div>
            </div>
          </div>

          {/* Render Mode */}
          <div
            style={{
              ...styles.renderModeBadge,
              background: renderMode === '3d' ? 'rgba(155, 89, 182, 0.2)' : 'rgba(52, 152, 219, 0.2)',
              color: renderMode === '3d' ? '#9B59B6' : '#3498DB',
              border: `1px solid ${renderMode === '3d' ? 'rgba(155, 89, 182, 0.4)' : 'rgba(52, 152, 219, 0.4)'}`,
            }}
          >
            {renderMode === '3d' ? '🎮' : '🖼️'} {renderMode.toUpperCase()}
          </div>

          {/* Connection Status / LIVE Button */}
          <div
            style={{ ...styles.connectionStatus, ...statusStyle, cursor: 'pointer' }}
            onClick={() => {
              if (status === 'demo' || status === 'disconnected') {
                bridgeRef.current?.connect();
              } else {
                setIsPaused((p) => !p);
              }
            }}
            title={status === 'live' ? 'Click to pause/resume' : 'Click to reconnect'}
          >
            <div
              style={{
                ...styles.statusDot,
                background: statusStyle.color,
                animation: status === 'live' && !isPaused ? 'pulse 2s infinite' : 'none',
              }}
            />
            {isPaused ? 'PAUSED' : status.toUpperCase()}
          </div>

          {/* Settings Button */}
          <button
            style={{
              background: settingsOpen ? '#333' : 'transparent',
              border: '1px solid #444',
              color: '#ccc',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Settings (press ? for shortcuts)"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Left Sidebar */}
        <aside style={styles.leftSidebar}>
          <div
            style={styles.heroSection}
            onClick={() => setProfileModalOpen(true)}
            title="Click to view profile"
          >
            <div style={styles.heroPortrait}>🏗️</div>
            <div style={styles.heroName}>Master Builder</div>
            <div style={styles.heroLevel}>Level {cityLevel}</div>
          </div>

          <div style={styles.agentList}>
            {Object.entries(agents).map(([id, agent]) => (
              <div
                key={id}
                style={styles.agentCard}
                onClick={() => handleAgentClick(id, agent)}
                title="Click to focus on agent"
              >
                <div style={styles.agentName}>{agent.name}</div>
                <div style={styles.agentRegion}>📍 {agent.region}</div>
                <div
                  style={{
                    ...styles.agentStatus,
                    background: agent.status === 'working' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                    color: agent.status === 'working' ? '#2ECC71' : '#F39C12',
                  }}
                >
                  {agent.status}
                </div>
              </div>
            ))}
            {Object.keys(agents).length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '0.75rem', padding: '1rem' }}>
                No active agents
                <div style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
                  (Demo mode will spawn agents)
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center Viewport */}
        <div ref={viewportRef} style={styles.viewport}>
          {/* Placement Mode Indicator */}
          {placementMode && (
            <div style={styles.placementModeIndicator}>
              🏗️ Placing: {BUILDING_CONFIGS[placementMode].name} (ESC to cancel)
            </div>
          )}

          {/* Control Hints */}
          <div style={styles.controlHints}>
            WASD: Pan | Scroll: Zoom | Q/E: Rotate | 1-6: Build | ESC: Cancel | ?: Shortcuts
          </div>

          {/* Zoom Controls */}
          <div style={styles.zoomControls}>
            <button style={styles.zoomButton} onClick={() => handleZoom(0.1)} title="Zoom In">
              +
            </button>
            <button style={styles.zoomButton} onClick={() => handleZoom(-0.1)} title="Zoom Out">
              -
            </button>
          </div>
        </div>

        {/* Right Sidebar - Event Log */}
        <aside style={styles.rightSidebar}>
          <div style={styles.eventLogHeader}>
            <span style={styles.eventLogTitle}>Event Log</span>
            {status === 'live' && !isPaused && (
              <span style={styles.liveIndicator}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC71' }} />
                LIVE
              </span>
            )}
          </div>
          {/* Filter buttons */}
          <div style={styles.eventFilterBar}>
            {(['all', 'tasks', 'buildings', 'agents', 'system'] as const).map((filter) => (
              <button
                key={filter}
                style={{
                  ...styles.eventFilterBtn,
                  ...(eventFilter === filter ? styles.eventFilterBtnActive : {}),
                }}
                onClick={() => setEventFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.eventLogContent}>
            {filteredEvents.slice().reverse().map((event) => (
              <div
                key={event.id}
                style={{ ...styles.eventItem, borderLeftColor: getEventColor(event.type) }}
              >
                {/* D3: Event header with icon and relative time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  {getEventIcon(event.type)}
                  <span style={styles.eventTime}>{formatRelativeTime(event.timestamp)}</span>
                </div>
                <div style={styles.eventMessage}>{event.message}</div>
                {event.agentName && (
                  <div style={styles.eventAgent}>{event.agentName}</div>
                )}
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '0.75rem', padding: '1rem' }}>
                {eventFilter === 'all' ? 'Events will appear here' : `No ${eventFilter} events`}
                <div style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
                  Place buildings or wait for agent activity
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Bottom Bar */}
      <div style={styles.bottomBar} className="wc3-bottom-bar">
        {/* D2: Command Card */}
        <div style={{ width: '140px', padding: '0.5rem', borderRight: '1px solid #333' }}>
          <CommandCard
            unit={selectedAgent ? { id: selectedAgent, type: 'worker', team: '0', position: { x: 0, y: 0 }, hp: 100, maxHp: 100 } : null}
            onCommand={(cmd) => {
              // Handle command - could send to bridge in production
              addEvent('status', `Command: ${cmd}${selectedAgent ? ` → ${agents[selectedAgent]?.name}` : ''}`);
              if (cmd === 'terminate' && selectedAgent) {
                setSelectedAgent(null);
              }
            }}
            disabled={!selectedAgent}
          />
        </div>

        {/* Minimap */}
        <div style={styles.minimapSection}>
          <div style={styles.minimapTitle}>Minimap (click to navigate)</div>
          <div style={styles.minimapCanvas} onClick={handleMinimapClick}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* Island background */}
              <polygon points="50,5 95,50 50,95 5,50" fill="#4A6741" stroke="#333" strokeWidth="1" />

              {/* District dots */}
              {Object.entries(cityState.buildings).map(([id, state]) => {
                const positions: Record<string, [number, number]> = {
                  townhall: [50, 50],
                  workshop: [30, 35],
                  market: [70, 35],
                  barracks: [70, 65],
                  stables: [30, 65],
                  library: [50, 80],
                };
                const [cx, cy] = positions[id] ?? [50, 50];
                const config = BUILDING_CONFIGS[id as BuildingKind];
                const size = 5 + state.tier * 2;
                const isSelected = selectedDistrict === id || placementMode === id;

                return (
                  <circle
                    key={id}
                    cx={cx}
                    cy={cy}
                    r={size}
                    fill={config.color}
                    stroke={isSelected ? '#FFF' : '#333'}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDistrict(id as BuildingKind);
                    }}
                  />
                );
              })}

              {/* Viewport rectangle */}
              <rect
                x={50 - 15 / cameraState.zoom}
                y={50 - 10 / cameraState.zoom}
                width={30 / cameraState.zoom}
                height={20 / cameraState.zoom}
                fill="none"
                stroke="#BF5700"
                strokeWidth="1"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* Building Cards */}
        <div style={styles.buildingGrid}>
          {Object.entries(cityState.buildings).map(([id, state]) => {
            const config = BUILDING_CONFIGS[id as BuildingKind];
            const progress = getTierProgress(state.completions);
            const isSelected = placementMode === id;
            const isHovered = hoveredCard === id;

            return (
              <div
                key={id}
                style={{
                  ...styles.buildingCard,
                  ...(isHovered ? styles.buildingCardHover : {}),
                  ...(isSelected ? styles.buildingCardSelected : {}),
                  ...(selectedBuilding === id ? { boxShadow: '0 0 0 2px #BF5700' } : {}),
                }}
                onClick={() => handleBuildingCardClick(id as BuildingKind)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ building: id as BuildingKind, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={() => setHoveredCard(id as BuildingKind)}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  setTooltipData(null);
                }}
                onMouseMove={(e) => {
                  setTooltipData({ building: id as BuildingKind, x: e.clientX, y: e.clientY });
                }}
              >
                <div style={styles.buildingIcon}>{BUILDING_ICONS[id as BuildingKind]}</div>
                <div style={styles.buildingName}>{config.name}</div>
                <div style={styles.buildingTier}>{config.tierNames[state.tier]}</div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progress * 100}%`,
                      background: config.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks Modal */}
      {tasksModalOpen && (
        <div style={styles.modal} onClick={() => setTasksModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>📋 Tasks ({totalCompletions} completed)</div>
            <div style={styles.modalBody}>
              {totalCompletions === 0 ? (
                <div>No tasks completed yet. Place buildings or wait for agent activity.</div>
              ) : (
                <div>
                  <div>Total completions: {totalCompletions}</div>
                  {Object.entries(cityState.buildings).map(([id, state]) => (
                    <div key={id} style={{ marginTop: '0.5rem' }}>
                      {BUILDING_ICONS[id as BuildingKind]} {BUILDING_CONFIGS[id as BuildingKind].name}: {state.completions} tasks
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button style={styles.modalClose} onClick={() => setTasksModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Agents Modal */}
      {agentsModalOpen && (
        <div style={styles.modal} onClick={() => setAgentsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>🤖 Agents ({activeAgentCount} active)</div>
            <div style={styles.modalBody}>
              {activeAgentCount === 0 ? (
                <div>No active agents. Agents will appear when Claude Code is running.</div>
              ) : (
                Object.entries(agents).map(([id, agent]) => (
                  <div key={id} style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#0D0D0D', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600 }}>{agent.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Region: {agent.region}</div>
                    <div style={{ fontSize: '0.8rem', color: agent.status === 'working' ? '#2ECC71' : '#F39C12' }}>
                      Status: {agent.status}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button style={styles.modalClose} onClick={() => setAgentsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModalOpen && (
        <div style={styles.modal} onClick={() => setProfileModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>🏗️ Master Builder Profile</div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>City Level:</strong> {cityLevel}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Total Tasks:</strong> {totalCompletions}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Active Agents:</strong> {activeAgentCount}
              </div>
              <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                <strong>Buildings:</strong>
                {Object.entries(cityState.buildings).map(([id, state]) => (
                  <div key={id} style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    {BUILDING_ICONS[id as BuildingKind]} {BUILDING_CONFIGS[id as BuildingKind].name}:{' '}
                    {BUILDING_CONFIGS[id as BuildingKind].tierNames[state.tier]}
                  </div>
                ))}
              </div>
            </div>
            <button style={styles.modalClose} onClick={() => setProfileModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Building Tooltip */}
      {tooltipData && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltipData.x + 16,
            top: tooltipData.y + 16,
          }}
        >
          <div style={styles.tooltipTitle}>
            {BUILDING_ICONS[tooltipData.building]} {BUILDING_CONFIGS[tooltipData.building].name}
          </div>
          <div style={styles.tooltipDesc}>{BUILDING_CONFIGS[tooltipData.building].description}</div>
          <div style={styles.tooltipStats}>
            <div style={styles.tooltipStat}>
              <span>Tier</span>
              <span>{cityState.buildings[tooltipData.building]?.tier ?? 0}/2</span>
            </div>
            <div style={styles.tooltipStat}>
              <span>Tasks</span>
              <span>{cityState.buildings[tooltipData.building]?.completions ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Context Menu */}
      {contextMenu && contextMenu.building && (
        <div
          style={{
            ...styles.contextMenu,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div
            style={styles.contextMenuItem}
            onClick={() => {
              setSelectedDistrict(contextMenu.building);
              setContextMenu(null);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            📋 View Details
          </div>
          <div
            style={styles.contextMenuItem}
            onClick={() => {
              handleBuildingCardClick(contextMenu.building!);
              setContextMenu(null);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            🔨 Build More
          </div>
          <div style={styles.contextMenuDivider} />
          <div
            style={styles.contextMenuItem}
            onClick={() => {
              addEvent('status', `Focused on ${BUILDING_CONFIGS[contextMenu.building!].name}`);
              setContextMenu(null);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            🎯 Focus Camera
          </div>
        </div>
      )}

      {/* Phase 2: Settings Panel */}
      {settingsOpen && (
        <div
          style={styles.settingsPanel}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.settingsTitle}>⚙️ Settings</div>
          <div style={styles.settingsSection}>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}>Sound Effects</span>
              <div
                style={{
                  ...styles.toggle,
                  ...(soundEnabled ? styles.toggleOn : {}),
                }}
                onClick={() => {
                  const newState = !soundEnabled;
                  setSoundEnabled(newState);
                  uiSfx.setMuted(!newState); // Sync with sound manager
                  if (newState) playClick(); // Feedback when enabling
                }}
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    ...(soundEnabled ? styles.toggleKnobOn : {}),
                  }}
                />
              </div>
            </div>
            <div style={styles.settingsRow}>
              <span style={styles.settingsLabel}>Auto Demo Mode</span>
              <div
                style={{
                  ...styles.toggle,
                  ...(bridgeRef.current?.isDemoMode() ? styles.toggleOn : {}),
                }}
                onClick={() => {
                  if (bridgeRef.current) {
                    bridgeRef.current.setDemoMode(!bridgeRef.current.isDemoMode());
                  }
                }}
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    ...(bridgeRef.current?.isDemoMode() ? styles.toggleKnobOn : {}),
                  }}
                />
              </div>
            </div>
          </div>
          <button
            style={{
              background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem',
              width: '100%',
              fontWeight: 600,
            }}
            onClick={() => {
              setShowTutorial(true);
              setSettingsOpen(false);
              playClick();
            }}
          >
            📖 Replay Tutorial
          </button>
          <button
            style={{
              background: '#333',
              border: '1px solid #444',
              color: '#ccc',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem',
              width: '100%',
            }}
            onClick={() => setSettingsOpen(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* Phase 2: Keyboard Shortcut Overlay */}
      {shortcutOverlayOpen && (
        <div
          style={styles.shortcutOverlay}
          onClick={() => setShortcutOverlayOpen(false)}
        >
          <div style={styles.shortcutTitle}>⌨️ Keyboard Shortcuts</div>
          <div style={styles.shortcutGrid}>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>1-6</span>
              <span style={styles.shortcutAction}>Select Building</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>Space</span>
              <span style={styles.shortcutAction}>Pause/Resume</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>Esc</span>
              <span style={styles.shortcutAction}>Cancel/Close</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>?</span>
              <span style={styles.shortcutAction}>Show Shortcuts</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>Q/E</span>
              <span style={styles.shortcutAction}>Rotate Camera</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>Scroll</span>
              <span style={styles.shortcutAction}>Zoom In/Out</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>WASD</span>
              <span style={styles.shortcutAction}>Pan Camera</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>+/-</span>
              <span style={styles.shortcutAction}>Zoom Keys</span>
            </div>
            <div style={styles.shortcutItem}>
              <span style={styles.shortcutKey}>F3</span>
              <span style={styles.shortcutAction}>Performance HUD</span>
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#666', textAlign: 'center' as const }}>
            Press Escape or click anywhere to close
          </div>
        </div>
      )}

      {/* Phase 2: Enhanced Notification */}
      {notification && (
        <div style={styles.notification}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={styles.notificationIcon}>🏆</span>
            <div>
              <div style={styles.notificationTitle}>{notification.title}</div>
              <div style={styles.notificationSubtitle}>{notification.subtitle}</div>
            </div>
          </div>
          <div style={styles.notificationProgress} />
        </div>
      )}

      {/* Performance HUD (F3 to toggle) */}
      <PerformanceHUD visible={showPerformanceHUD} position="top-left" />

      {/* Tutorial Overlay (first visit or reopened from settings) */}
      <TutorialOverlay
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          localStorage.setItem('blazecraft_tutorial_complete', 'true');
          setShowTutorial(false);
          playNotify(); // Celebratory sound on tutorial completion
        }}
      />

      {/* Film grain */}
      <FilmGrain enabled={true} />

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes notificationProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
