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
import { GameBridge, createGameBridge, ScoreState, ConnectionStatus as GameConnectionStatus, CityEventMapping } from '@core/GameBridge';
import { AnyGameEvent, isGameUpdateEvent, isGameStartEvent, isGameFinalEvent, GameUpdatePayload } from '@core/GameEventContract';
// SportsBridge retained for reference until migration verified
// import { SportsBridge, createSportsBridge, SportsScore, SportsEvent } from '@core/SportsBridge';
import { CityState, BuildingKind, createInitialCityState, BUILDING_CONFIGS, getCityLevel, getTierProgress, getBuildingFromPath, calculateBuildingModifiers, getUpgradeCost, BUILDING_FUNCTIONS } from '@core/BuildingSystem';
import { ProgressionSystem, createProgressionSystem, getLevelTitle, Achievement } from '@core/ProgressionSystem';
import { ResourceSystem, createResourceSystem, Resources, ResourceEvent as ResourceHistoryEvent } from '@core/ResourceSystem';
import { TechTree, createTechTree, TechNodeId, ActiveEffects } from '@core/TechTree';
import { AnalystSystem, createAnalystSystem, Analyst, Task, TaskProgress } from '@core/AnalystSystem';
import { TutorialSystem, createTutorialSystem, TutorialStep } from '@core/TutorialSystem';
import { calculateEventReward, shouldGenerateTask } from '@core/GameEventContract';
import { ResourceBar } from './ResourceBar';
import { TechTreePanel } from './TechTreePanel';
import { AnalystManager } from './AnalystManager';
import { TaskList } from './TaskList';
import { FilmGrain } from './FilmGrain';
import { CommandCard } from './CommandCard';
import {
  IconCompleted,
  IconFailed,
  IconGear,
  IconFiles,
  IconWorkers,
  IconSword,
  IconCastle,
  IconAnvil,
  IconMarket,
  IconHorse,
  IconBooks,
  IconBuilding,
  IconAgent,
  IconGamepad,
  IconFrame,
  IconConstruction,
  IconPin,
  IconClipboard,
  IconTarget,
  IconHammer,
  IconBook,
  IconKeyboard,
  IconTrophy,
  IconCrossedSwords,
} from './Icons';
import { uiSfx, playClick, playComplete, playError, playNotify, initSound } from '@core/ui-sfx';
import { PerformanceHUD } from './PerformanceHUD';
import { TutorialOverlay } from './TutorialOverlay';
import { AgentCard } from './AgentCard';
import { SportsTicker } from './SportsTicker';
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

// Phase 1.2: Toast notification types
type ToastType = 'upgrade' | 'task' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  file?: string;
  timestamp: number;
}

// Phase 1.4: Persistent state interface
interface SavedCityState {
  buildings: Record<string, { tier: number; completions: number }>;
  totalCompletions: number;
  lastSaved: number;
  sessionCount: number;
}

const STORAGE_KEY = 'blazecraft_city_state';

// Load saved state from localStorage
function loadSavedState(): SavedCityState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as SavedCityState;
  } catch {
    return null;
  }
}

// Save state to localStorage
function saveState(state: CityState, sessionCount: number): void {
  try {
    const saved: SavedCityState = {
      buildings: Object.fromEntries(
        Object.entries(state.buildings).map(([id, b]) => [id, { tier: b.tier, completions: b.completions }])
      ),
      totalCompletions: state.totalCompletions,
      lastSaved: Date.now(),
      sessionCount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // localStorage might be full or disabled
  }
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

  // Phase 1.2: Toast Queue
  toastContainer: {
    position: 'fixed' as const,
    bottom: '140px',
    right: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 1000,
    maxHeight: '50vh',
    overflow: 'hidden',
  },
  toast: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    minWidth: '280px',
    maxWidth: '340px',
    animation: 'toastSlideIn 0.3s ease-out',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  toastUpgrade: {
    background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95))',
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  toastTask: {
    background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.95), rgba(255, 107, 53, 0.95))',
    borderColor: 'rgba(191, 87, 0, 0.4)',
  },
  toastError: {
    background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95))',
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  toastInfo: {
    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(41, 128, 185, 0.95))',
    borderColor: 'rgba(52, 152, 219, 0.4)',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  toastTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#FFF',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  toastSubtitle: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  toastFile: {
    fontSize: '0.65rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    marginTop: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  toastProgress: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    height: '3px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '0 0 8px 8px',
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

const BUILDING_ICONS: Record<BuildingKind, React.ReactElement> = {
  townhall: <IconCastle size={18} color="#FFD700" />,
  workshop: <IconAnvil size={18} color="#BF5700" />,
  market: <IconMarket size={18} color="#2ECC71" />,
  barracks: <IconCrossedSwords size={18} color="#E74C3C" />,
  stables: <IconHorse size={18} color="#3498DB" />,
  library: <IconBooks size={18} color="#9B59B6" />,
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CityBuilderApp(): React.ReactElement {
  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CityRenderer | null>(null);
  const bridgeRef = useRef<LiveBridge | null>(null);
  const gameBridgeRef = useRef<GameBridge | null>(null);
  const initRef = useRef(false);

  // Gameplay system refs
  const resourceSystemRef = useRef<ResourceSystem | null>(null);
  const techTreeRef = useRef<TechTree | null>(null);
  const analystSystemRef = useRef<AnalystSystem | null>(null);
  const tutorialSystemRef = useRef<TutorialSystem | null>(null);

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cameraState, setCameraState] = useState({ x: 0, y: 0, zoom: 1.0 });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);  // D2: For command card

  // Phase 4: Sports integration state (via GameBridge)
  const [sportsScores, setSportsScores] = useState<ScoreState[]>([]);
  const [sportsStatus, setSportsStatus] = useState<GameConnectionStatus>('disconnected');

  // Gameplay systems state
  const [resources, setResources] = useState<Resources>({ intel: 0, influence: 0, momentum: 0 });
  const [resourceHistory, setResourceHistory] = useState<ResourceHistoryEvent[]>([]);
  const [techEffects, setTechEffects] = useState<ActiveEffects | null>(null);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [workingAnalysts, setWorkingAnalysts] = useState<TaskProgress[]>([]);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<TutorialStep | null>(null);

  // Modal states
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [agentsModalOpen, setAgentsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [techTreeOpen, setTechTreeOpen] = useState(false);
  const [analystManagerOpen, setAnalystManagerOpen] = useState(false);

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
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [hasShownWelcomeBack, setHasShownWelcomeBack] = useState(false);

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
              playClick();
            },
            onBuildingDeleted: (kind, gridX, gridY) => {
              addEvent('building_placed', `Removed ${BUILDING_CONFIGS[kind].name} at (${gridX}, ${gridY})`);
              playClick();
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

            // Phase 1.2: Add toast notification
            addToast('upgrade', `${config.name} Upgraded!`, `Now: ${config.tierNames[tier]}`);

            // Phase 1.1: Trigger flash effect on renderer
            if (rendererRef.current && 'playTierUpgradeEffect' in rendererRef.current) {
              (rendererRef.current as CityWorldRenderer).playTierUpgradeEffect(buildingKind as BuildingKind);
            }

            addEvent('task_complete', `${config.name} upgraded to ${config.tierNames[tier]}`);
            playComplete(); // Victory chime for upgrade
          },
          onStatusChange: (s) => {
            setStatus(s);
            addEvent('status', `Connection: ${s}`);
          },
        }, {
          // E1: Production SSE URL configuration
          // Hooks send to /api/blazecraft/events - match that path
          baseUrl: window.location.hostname.includes('localhost')
            ? '/api/blazecraft/events'
            : 'https://blazecraft.app/api/blazecraft/events',
          sessionId: 'main',
        });
        bridgeRef.current = bridge;

        // Production detection: default to demo mode immediately on blazecraft.app
        // since there's no real SSE backend in production. Users were experiencing
        // 30-second delays waiting for the activity timeout fallback.
        const isProduction = window.location.hostname === 'blazecraft.app' || 
                             window.location.hostname.endsWith('.pages.dev');
        const forceDemoMode = import.meta.env.VITE_FORCE_DEMO === 'true';

        if (isProduction || forceDemoMode) {
          // Immediate demo mode for production - no waiting for SSE timeout
          bridge.setDemoMode(true);
          addEvent('status', isProduction ? 'Demo mode (production)' : 'Demo mode (env)');
        } else {
          // Development: try live backend first, LiveBridge handles fallback
          bridge.connect();
        }

        // Initialize gameplay systems
        const resourceSystem = createResourceSystem({
          onResourceChange: (res, delta, source) => {
            setResources({ ...res });
            setResourceHistory((prev) => [
              { type: delta.intel! < 0 ? 'spend' : 'gain', delta, source, timestamp: Date.now() },
              ...prev.slice(0, 49),
            ]);
          },
          onMilestone: (resource, milestone) => {
            addToast('info', `${resource.charAt(0).toUpperCase() + resource.slice(1)} Milestone`, `Reached ${milestone} ${resource}!`);
          },
        });
        resourceSystemRef.current = resourceSystem;
        setResources(resourceSystem.getResources());
        setResourceHistory(resourceSystem.getHistory());

        const techTree = createTechTree({
          onNodeUnlock: (node) => {
            addToast('upgrade', 'Tech Unlocked', node.name);
            playComplete();
          },
          onEffectApply: () => {
            setTechEffects(techTree.getActiveEffects());
          },
        });
        techTreeRef.current = techTree;
        setTechEffects(techTree.getActiveEffects());

        const analystSystem = createAnalystSystem({
          onTaskComplete: (task, analyst, reward) => {
            resourceSystem.addResources(reward, `task:${task.type}`);
            addToast('task', 'Task Complete', `${analyst.name} finished ${task.title}`);
            playComplete();
            tutorialSystemRef.current?.notifyTaskCompleted();
          },
          onTaskExpired: (task) => {
            addEvent('status', `Task expired: ${task.title}`);
          },
          onAnalystFatigued: (analyst) => {
            addEvent('status', `${analyst.name} is resting`);
          },
          onNewTaskAvailable: () => {
            setAvailableTasks(analystSystem.getAvailableTasks());
          },
        });
        analystSystemRef.current = analystSystem;
        setAnalysts(analystSystem.getAnalysts());
        setAvailableTasks(analystSystem.getAvailableTasks());

        // Update analyst system with building modifiers
        analystSystem.updateBuildingEffects(cityState.buildings as Record<BuildingKind, { tier: 0 | 1 | 2 }>);

        const tutorialSystem = createTutorialSystem({
          onStepStart: (step) => setCurrentTutorialStep(step),
          onStepComplete: () => setCurrentTutorialStep(null),
          onTutorialComplete: () => {
            localStorage.setItem('blazecraft_tutorial_complete', 'true');
            setShowTutorial(false);
            addToast('info', 'Tutorial Complete', 'You\'re ready to manage your HQ!');
          },
        });
        tutorialSystemRef.current = tutorialSystem;
        if (tutorialSystem.shouldAutoStart()) {
          tutorialSystem.start();
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
      gameBridgeRef.current?.disconnect();
      resourceSystemRef.current?.destroy();
      analystSystemRef.current?.destroy();
    };
    // Note: addToast is stable and defined later, but used in closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            playClick();
          } else if (settingsOpen) {
            setSettingsOpen(false);
            playClick();
          } else if (contextMenu) {
            setContextMenu(null);
            playClick();
          } else if (placementMode) {
            setPlacementMode(null);
            (rendererRef.current as CityWorldRenderer)?.setPlacementMode?.(null);
            playClick();
          } else if (selectedDistrict) {
            setSelectedDistrict(null);
            setSelectedBuilding(null);
            playClick();
          } else if (tasksModalOpen || agentsModalOpen || profileModalOpen) {
            setTasksModalOpen(false);
            setAgentsModalOpen(false);
            setProfileModalOpen(false);
            playClick();
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
            playClick();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placementMode, selectedDistrict, isPaused, tasksModalOpen, agentsModalOpen, profileModalOpen, shortcutOverlayOpen, settingsOpen, contextMenu, addEvent]);

  // Periodic update for analyst task progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (analystSystemRef.current) {
        setAnalysts(analystSystemRef.current.getAnalysts());
        setWorkingAnalysts(analystSystemRef.current.getWorkingAnalysts());
        setAvailableTasks(analystSystemRef.current.getAvailableTasks());
      }
      // Update tutorial with current resources
      if (tutorialSystemRef.current && resourceSystemRef.current) {
        tutorialSystemRef.current.notifyResources(resourceSystemRef.current.getResources());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update building modifiers when city state changes
  useEffect(() => {
    if (analystSystemRef.current) {
      analystSystemRef.current.updateBuildingEffects(
        cityState.buildings as Record<BuildingKind, { tier: 0 | 1 | 2 }>
      );
    }
    if (resourceSystemRef.current) {
      resourceSystemRef.current.updateModifiers(
        cityState.buildings as Record<BuildingKind, { tier: 0 | 1 | 2 }>
      );
    }
  }, [cityState]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const showNotification = useCallback((title: string, subtitle: string) => {
    setNotification({ title, subtitle });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  // Phase 1.2: Toast queue management
  const addToast = useCallback((type: ToastType, title: string, subtitle?: string, file?: string) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      subtitle,
      file,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev.slice(-4), toast]); // Keep max 5 toasts

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  }, []);

  // Gameplay action handlers
  const handleAssignTask = useCallback((taskId: string, analystId: string) => {
    if (!analystSystemRef.current) return;

    const success = analystSystemRef.current.assignTask(analystId, taskId);
    if (success) {
      const analyst = analystSystemRef.current.getAnalysts().find((a) => a.id === analystId);
      addToast('task', 'Task Assigned', `${analyst?.name ?? 'Analyst'} is now working`);
      playClick();
      setAvailableTasks(analystSystemRef.current.getAvailableTasks());
      setAnalysts(analystSystemRef.current.getAnalysts());
      tutorialSystemRef.current?.notifyTaskAssigned();
    }
  }, [addToast]);

  const handleUnlockTech = useCallback((nodeId: TechNodeId) => {
    if (!techTreeRef.current || !resourceSystemRef.current) return;

    const cost = techTreeRef.current.unlock(nodeId, resourceSystemRef.current.getResources());
    if (cost) {
      resourceSystemRef.current.spend(cost);
      setTechEffects(techTreeRef.current.getActiveEffects());
      setResources(resourceSystemRef.current.getResources());
      tutorialSystemRef.current?.notifyTechUnlocked(nodeId);
    }
  }, []);

  const handleRecruitAnalyst = useCallback(() => {
    if (!analystSystemRef.current) return;

    const analyst = analystSystemRef.current.createAnalyst('general');
    if (analyst) {
      addToast('info', 'Analyst Recruited', analyst.name);
      playComplete();
      setAnalysts(analystSystemRef.current.getAnalysts());
      tutorialSystemRef.current?.notifyAnalystCount(analystSystemRef.current.getAnalysts().length);
    }
  }, [addToast]);

  const handleUnassignAnalyst = useCallback((analystId: string) => {
    if (!analystSystemRef.current) return;

    analystSystemRef.current.unassignAnalyst(analystId);
    setAnalysts(analystSystemRef.current.getAnalysts());
    setAvailableTasks(analystSystemRef.current.getAvailableTasks());
  }, []);

  // Phase 4: Initialize GameBridge for BSI live scores (proxied via backend)
  // Separate useEffect because addToast must be defined first
  useEffect(() => {
    if (!isReady || gameBridgeRef.current) return;

    const gameBridge = createGameBridge({
      onScoreUpdate: (scores) => setSportsScores(scores),
      onGameEvent: (event) => {
        // Extract sport from payload for display
        const payload = event.payload as { sport?: string; homeTeam?: string; awayTeam?: string; homeScore?: number; awayScore?: number; playType?: string };
        const sport = payload.sport ?? 'game';
        const sportIcon = sport === 'mlb' ? '⚾' : sport === 'nfl' ? '🏈' : sport === 'nba' ? '🏀' : '🎮';

        // Build description based on event type
        let description = '';
        if (isGameStartEvent(event)) {
          description = `${payload.awayTeam} @ ${payload.homeTeam} started`;
        } else if (isGameFinalEvent(event)) {
          description = `Final: ${payload.awayTeam} ${payload.awayScore} @ ${payload.homeTeam} ${payload.homeScore}`;
        } else if (isGameUpdateEvent(event)) {
          const updatePayload = event.payload as GameUpdatePayload;
          description = updatePayload.playDescription ?? `${payload.homeTeam} ${payload.homeScore} - ${payload.awayTeam} ${payload.awayScore}`;
        } else {
          description = event.type;
        }

        addEvent('status', `${sportIcon} ${description}`);

        // Add resources from game event
        if (resourceSystemRef.current) {
          const isFavorite = gameBridgeRef.current?.isFavoriteTeam(payload.homeTeam ?? '') ||
                            gameBridgeRef.current?.isFavoriteTeam(payload.awayTeam ?? '');
          const reward = calculateEventReward(event, isFavorite);
          if (reward.intel > 0 || reward.influence > 0 || reward.momentum > 0) {
            resourceSystemRef.current.addResources(reward, `game:${event.type}`);
          }
        }

        // Generate task from game event
        if (analystSystemRef.current && shouldGenerateTask(event) && payload.sport) {
          const sportType = payload.sport as 'mlb' | 'nfl' | 'nba' | 'college-baseball' | 'college-football';
          const gameId = (event.payload as { gameId?: string }).gameId ?? `game-${Date.now()}`;
          analystSystemRef.current.createTaskFromGame(
            'monitor_game',
            gameId,
            sportType,
            `Monitor ${payload.homeTeam} vs ${payload.awayTeam}`
          );
          setAvailableTasks(analystSystemRef.current.getAvailableTasks());
        }

        // Notify tutorial
        tutorialSystemRef.current?.notifyEvent(event.type);
      },
      onCityEffect: (effect, event) => {
        // Trigger building flash effect
        if (rendererRef.current && 'flashBuilding' in rendererRef.current) {
          (rendererRef.current as CityWorldRenderer).flashBuilding(effect.buildingKind, effect.flashColor);
        }
        const payload = event.payload as { sport?: string };
        const sport = payload.sport?.toUpperCase() ?? 'GAME';
        addToast('task', `${sport}: Score update`, `+${effect.upgradePoints} progress`);
      },
      onStatusChange: setSportsStatus,
    }, {
      baseUrl: '/api/game/events',
      enabledSports: ['mlb', 'nfl', 'nba'],
      tier: null, // Free tier by default
      demoFallbackTimeout: 30000,
    });
    gameBridge.connect();
    gameBridgeRef.current = gameBridge;
    addEvent('status', 'GameBridge initialized');
  }, [isReady, addEvent, addToast]);

  // Helper to get toast icon
  const getToastIcon = (type: ToastType): React.ReactNode => {
    switch (type) {
      case 'upgrade':
        return <IconTrophy size={16} color="#FFF" />;
      case 'task':
        return <IconCompleted size={16} color="#FFF" />;
      case 'error':
        return <IconFailed size={16} color="#FFF" />;
      case 'info':
        return <IconGear size={16} color="#FFF" />;
    }
  };

  // Helper to get toast style
  const getToastStyle = (type: ToastType): React.CSSProperties => {
    switch (type) {
      case 'upgrade':
        return styles.toastUpgrade;
      case 'task':
        return styles.toastTask;
      case 'error':
        return styles.toastError;
      case 'info':
        return styles.toastInfo;
    }
  };

  // Phase 1.4: Load saved state on mount
  useEffect(() => {
    const savedState = loadSavedState();
    if (savedState && savedState.totalCompletions > 0) {
      // Restore saved state
      const restoredState = createInitialCityState();
      for (const [id, saved] of Object.entries(savedState.buildings)) {
        const building = restoredState.buildings[id as BuildingKind];
        if (building) {
          building.tier = saved.tier as 0 | 1 | 2;
          building.completions = saved.completions;
        }
      }
      restoredState.totalCompletions = savedState.totalCompletions;
      setCityState(restoredState);

      // Update session count
      const newSessionCount = (savedState.sessionCount || 0) + 1;
      setSessionCount(newSessionCount);

      // Show welcome back notification (only once per session)
      if (!hasShownWelcomeBack) {
        setHasShownWelcomeBack(true);
        setTimeout(() => {
          const timeSince = Date.now() - savedState.lastSaved;
          const hoursAgo = Math.floor(timeSince / (1000 * 60 * 60));
          const timeStr = hoursAgo > 24
            ? `${Math.floor(hoursAgo / 24)}d ago`
            : hoursAgo > 0
            ? `${hoursAgo}h ago`
            : 'recently';

          addToast('info', 'Welcome back!', `Session #${newSessionCount} • Last seen ${timeStr}`);
          addEvent('status', `Restored city state: ${savedState.totalCompletions} total tasks`);
        }, 500);
      }
    }
  }, [hasShownWelcomeBack, addToast, addEvent]);

  // Phase 1.4: Auto-save when city state changes
  useEffect(() => {
    if (cityState.totalCompletions > 0) {
      saveState(cityState, sessionCount);
    }
  }, [cityState, sessionCount]);

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
          <div style={styles.logoIcon}><IconCrossedSwords size={20} color="#FFF" /></div>
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
              <span style={styles.statIcon}><IconCastle size={14} color="#FFD700" /></span>
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
            <span style={styles.statIcon}><IconBuilding size={14} color="#C9A227" /></span>
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
            onClick={() => { setTasksModalOpen(true); playClick(); }}
            title="Click to view tasks"
          >
            <span style={styles.statIcon}><IconCompleted size={14} color="#48C774" /></span>
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
            onClick={() => { setAgentsModalOpen(true); playClick(); }}
            title="Click to view agents"
          >
            <span style={styles.statIcon}><IconAgent size={14} color="#9B59B6" /></span>
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
            {renderMode === '3d' ? <IconGamepad size={12} /> : <IconFrame size={12} />} {renderMode.toUpperCase()}
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
            onClick={() => { setSettingsOpen(!settingsOpen); playClick(); }}
            title="Settings (press ? for shortcuts)"
          >
            <IconGear size={16} />
          </button>
        </div>
      </header>

      {/* Resource Bar */}
      <ResourceBar
        resources={resources}
        history={resourceHistory}
        analystCount={{
          idle: analysts.filter((a) => a.status === 'idle').length,
          total: analysts.length,
        }}
        onResourceClick={(resource) => {
          if (resource === 'intel') setTechTreeOpen(true);
        }}
      />

      {/* Main Content */}
      <main style={styles.main}>
        {/* Left Sidebar */}
        <aside style={styles.leftSidebar}>
          <div
            style={styles.heroSection}
            onClick={() => setProfileModalOpen(true)}
            title="Click to view profile"
          >
            <div style={styles.heroPortrait}><IconConstruction size={64} color="#BF5700" /></div>
            <div style={styles.heroName}>Master Builder</div>
            <div style={styles.heroLevel}>Level {cityLevel}</div>
          </div>

          <div style={styles.agentList}>
            {Object.entries(agents).map(([id, agent]) => (
              <AgentCard
                key={id}
                agent={agent}
                isSelected={selectedAgent === id}
                onClick={() => handleAgentClick(id, agent)}
                onDoubleClick={() => {
                  // Pan camera to agent's building on double-click
                  const regionToBuilding: Record<string, BuildingKind> = {
                    'workshop': 'workshop',
                    'market': 'market',
                    'barracks': 'barracks',
                    'stables': 'stables',
                    'library': 'library',
                    'townhall': 'townhall',
                  };
                  const building = regionToBuilding[agent.region] || 'townhall';
                  setSelectedDistrict(building);
                  addEvent('status', `Focused on ${agent.name}'s location`);
                }}
              />
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
              <IconConstruction size={14} color="#FFF" /> Placing: {BUILDING_CONFIGS[placementMode].name} (ESC to cancel)
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
              // Phase 2.1: Wire commands to LiveBridge
              const bridge = bridgeRef.current;
              if (!bridge) return;

              switch (cmd) {
                case 'stop':
                  bridge.stop();
                  addToast('info', 'Events Stopped', 'Incoming events are being discarded');
                  addEvent('status', 'Event processing stopped');
                  break;

                case 'hold':
                  bridge.hold();
                  addToast('info', 'Events Held', 'Events are being buffered');
                  addEvent('status', 'Event processing held (buffering)');
                  break;

                case 'resume':
                  const bufferedCount = bridge.getBufferedEventCount();
                  bridge.resume();
                  if (bufferedCount > 0) {
                    addToast('task', 'Resumed', `Processing ${bufferedCount} buffered events`);
                  } else {
                    addToast('info', 'Resumed', 'Live event processing resumed');
                  }
                  addEvent('status', `Event processing resumed${bufferedCount > 0 ? ` (${bufferedCount} buffered)` : ''}`);
                  break;

                case 'inspect':
                  // Show agent details
                  if (selectedAgent && agents[selectedAgent]) {
                    const agent = agents[selectedAgent];
                    addToast('info', `Agent: ${agent.name}`, `Region: ${agent.region} | Status: ${agent.status}`);
                  }
                  addEvent('status', `Inspecting ${selectedAgent ? agents[selectedAgent]?.name : 'city state'}`);
                  break;

                case 'terminate':
                  if (selectedAgent) {
                    addToast('error', 'Agent Terminated', agents[selectedAgent]?.name ?? 'Unknown');
                    addEvent('status', `Terminated agent ${agents[selectedAgent]?.name}`);
                    setSelectedAgent(null);
                  }
                  break;

                case 'assign':
                  addToast('info', 'Assign Mode', 'Click a building to assign agent');
                  addEvent('status', `Assign mode activated for ${selectedAgent ? agents[selectedAgent]?.name : 'agent'}`);
                  break;

                default:
                  addEvent('status', `Command: ${cmd}${selectedAgent ? ` → ${agents[selectedAgent]?.name}` : ''}`);
              }
            }}
            disabled={false} // Enable all commands even without agent selected
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

              {/* Viewport rectangle - includes camera position */}
              <rect
                x={50 + (cameraState.x / 400) * 50 - 15 / cameraState.zoom}
                y={50 + (cameraState.y / 400) * 50 - 10 / cameraState.zoom}
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

        {/* Task List Section */}
        <div style={{
          width: '260px',
          padding: '0.5rem',
          borderRight: '1px solid #333',
          overflow: 'auto',
        }}>
          <TaskList
            tasks={availableTasks}
            idleAnalysts={analysts.filter((a) => a.status === 'idle')}
            onAssign={handleAssignTask}
            maxVisible={3}
          />
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #333',
          }}>
            <button
              id="tech-tree-button"
              style={{
                flex: 1,
                padding: '0.4rem',
                background: '#0D0D0D',
                border: '1px solid #3498DB',
                borderRadius: '4px',
                color: '#3498DB',
                fontSize: '0.65rem',
                cursor: 'pointer',
              }}
              onClick={() => { setTechTreeOpen(true); playClick(); }}
            >
              Tech Tree
            </button>
            <button
              style={{
                flex: 1,
                padding: '0.4rem',
                background: '#0D0D0D',
                border: '1px solid #9B59B6',
                borderRadius: '4px',
                color: '#9B59B6',
                fontSize: '0.65rem',
                cursor: 'pointer',
              }}
              onClick={() => { setAnalystManagerOpen(true); playClick(); }}
            >
              Analysts ({analysts.length})
            </button>
          </div>
        </div>

        {/* Sports Ticker - Below Minimap */}
        {sportsScores.length > 0 && (
          <div style={{
            width: '180px',
            padding: '0.25rem',
            borderRight: '1px solid #333',
            overflow: 'hidden',
          }}>
            <SportsTicker
              scores={sportsScores}
              status={sportsStatus}
              favoriteTeams={gameBridgeRef.current?.getFavoriteTeams()}
              onTeamClick={(team) => gameBridgeRef.current?.addFavoriteTeam(team)}
            />
          </div>
        )}

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
            <div style={styles.modalTitle}><IconClipboard size={16} color="#C9A227" /> Tasks ({totalCompletions} completed)</div>
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
            <button style={styles.modalClose} onClick={() => { setTasksModalOpen(false); playClick(); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Agents Modal */}
      {agentsModalOpen && (
        <div style={styles.modal} onClick={() => setAgentsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}><IconAgent size={16} color="#9B59B6" /> Agents ({activeAgentCount} active)</div>
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
            <button style={styles.modalClose} onClick={() => { setAgentsModalOpen(false); playClick(); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {/* Tech Tree Panel */}
      {techTreeOpen && techTreeRef.current && (
        <TechTreePanel
          techTree={techTreeRef.current}
          resources={resources}
          onUnlock={handleUnlockTech}
          onClose={() => setTechTreeOpen(false)}
        />
      )}

      {/* Analyst Manager Panel */}
      {analystManagerOpen && analystSystemRef.current && (
        <AnalystManager
          analysts={analysts}
          workingAnalysts={workingAnalysts}
          capacity={analystSystemRef.current.getCapacity()}
          effects={analystSystemRef.current.getBuildingEffects()}
          onRecruit={handleRecruitAnalyst}
          onUnassign={handleUnassignAnalyst}
          onClose={() => setAnalystManagerOpen(false)}
        />
      )}

      {profileModalOpen && (
        <div style={styles.modal} onClick={() => setProfileModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}><IconConstruction size={16} color="#BF5700" /> Master Builder Profile</div>
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
            <button style={styles.modalClose} onClick={() => { setProfileModalOpen(false); playClick(); }}>
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
            <IconClipboard size={12} /> View Details
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
            <IconHammer size={12} /> Build More
          </div>
          <div style={styles.contextMenuDivider} />
          <div
            style={styles.contextMenuItem}
            onClick={() => {
              const building = contextMenu.building!;
              (rendererRef.current as CityWorldRenderer)?.panToBuilding?.(building);
              addEvent('status', `Focused on ${BUILDING_CONFIGS[building].name}`);
              playClick();
              setContextMenu(null);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <IconTarget size={12} /> Focus Camera
          </div>
        </div>
      )}

      {/* Phase 2: Settings Panel */}
      {settingsOpen && (
        <div
          style={styles.settingsPanel}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.settingsTitle}><IconGear size={16} color="#BF5700" /> Settings</div>
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
            <IconBook size={14} /> Replay Tutorial
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
            onClick={() => { setSettingsOpen(false); playClick(); }}
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
          <div style={styles.shortcutTitle}><IconKeyboard size={16} color="#BF5700" /> Keyboard Shortcuts</div>
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
            <span style={styles.notificationIcon}><IconTrophy size={24} color="#FFD700" /></span>
            <div>
              <div style={styles.notificationTitle}>{notification.title}</div>
              <div style={styles.notificationSubtitle}>{notification.subtitle}</div>
            </div>
          </div>
          <div style={styles.notificationProgress} />
        </div>
      )}

      {/* Phase 1.2: Toast Queue */}
      {toasts.length > 0 && (
        <div style={styles.toastContainer}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                ...styles.toast,
                ...getToastStyle(toast.type),
              }}
            >
              <div style={styles.toastHeader}>
                {getToastIcon(toast.type)}
                <span style={styles.toastTitle}>{toast.title}</span>
              </div>
              {toast.subtitle && (
                <div style={styles.toastSubtitle}>{toast.subtitle}</div>
              )}
              {toast.file && (
                <div style={styles.toastFile}>{toast.file}</div>
              )}
              <div
                style={{
                  ...styles.toastProgress,
                  animation: 'toastProgress 4s linear',
                }}
              />
            </div>
          ))}
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
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
