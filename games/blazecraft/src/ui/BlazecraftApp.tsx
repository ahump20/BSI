/**
 * BlazecraftApp - Main application component
 * @version 2.0.1 - WC3 City Builder Transformation
 * @buildTime 2026-01-17T19:23:00Z
 *
 * WC3-inspired agent console layout:
 * - Header status bar with counters + LIVE/DEMO toggle
 * - Left sidebar: Hero portrait + Minimap with buildings
 * - Center: PixiJS viewport with control hints
 * - Right sidebar: Event log
 * - Bottom: Ops feed + Command card
 *
 * Modes:
 * - LIVE: SSE connection to /api/events/stream for real Claude Code events
 * - DEMO: Synthetic events generated locally for demonstration
 * - REPLAY: Load and analyze saved replay files
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ReplayEngine, createReplayEngine, PlaybackState } from '@core/ReplayEngine';
import { PixiRenderer, createPixiRenderer } from '@core/PixiRenderer';
import { LiveBridge, ConnectionStatus, AgentEvent } from '@core/LiveBridge';
import { CityState, BuildingKind, createInitialCityState } from '@core/BuildingSystem';
import { HeaderStatusBar } from './HeaderStatusBar';
import { SelectedPanel } from './SelectedPanel';
import { HeroPortrait, AgentHeroStats } from './HeroPortrait';
import { MiniMap } from './MiniMap';
import { EventLog, EventLogEntry, createEventFromDecision } from './EventLog';
import { OpsFeed } from './OpsFeed';
import { CommandCard } from './CommandCard';
import { ControlHints } from './ControlHints';
import { TimelineScrubber } from './TimelineScrubber';
import { FilmGrain } from './FilmGrain';
import { ScoutStrip, createScoutMessage, type ScoutMessage } from './ScoutStrip';
import { TooltipProvider } from './Tooltip';
import type { ReplayMetadata, ReplayTick, Unit, AgentState } from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--bg, #0b0d10)',
    color: 'var(--text, #e8eef6)',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftSidebar: {
    width: '210px',
    background: 'var(--panel, #12161c)',
    borderRight: '1px solid var(--border, #2a313b)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    flexShrink: 0,
  },
  viewport: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'var(--bg, #0b0d10)',
    minWidth: 0,
  },
  rightSidebar: {
    width: '280px',
    background: 'var(--panel, #12161c)',
    borderLeft: '1px solid var(--border, #2a313b)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    flexShrink: 0,
  },
  bottomBar: {
    display: 'flex',
    background: 'var(--panel, #12161c)',
    borderTop: '1px solid var(--border, #2a313b)',
    height: '180px',
    overflow: 'hidden',
  },
  opsFeedSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minWidth: 0,
  },
  commandCardSection: {
    width: '320px',
    flexShrink: 0,
    borderLeft: '1px solid var(--border, #2a313b)',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  dropzone: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '2rem',
    textAlign: 'center' as const,
    background: 'rgba(13, 13, 13, 0.95)',
    zIndex: 5,
  },
  dropzoneTitle: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#BF5700',
    letterSpacing: '0.1em',
  },
  dropzoneText: {
    fontSize: '1rem',
    color: '#888',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#BF5700',
    color: '#FFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  loadingOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(13, 13, 13, 0.9)',
    zIndex: 100,
  },
  timelineSection: {
    padding: '0.5rem 1rem',
    background: 'var(--bg, #0b0d10)',
    borderTop: '1px solid var(--border, #2a313b)',
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

// Build version for cache busting
const BUILD_VERSION = '2.0.1-20260117';
console.log('[BlazeCraft] Build:', BUILD_VERSION);

export function BlazecraftApp(): React.ReactElement {
  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<ReplayEngine | null>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);

  // Core state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ReplayMetadata | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentTick, setCurrentTick] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Event log state
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Session timer
  const [sessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─────────────────────────────────────────────────────────────
  // Live Mode State
  // ─────────────────────────────────────────────────────────────

  const liveBridgeRef = useRef<LiveBridge | null>(null);
  const [appMode, setAppMode] = useState<'live' | 'demo' | 'replay'>('demo');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [cityState, setCityState] = useState<CityState>(createInitialCityState);
  const [liveAgents, setLiveAgents] = useState<Record<string, AgentHeroStats>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // ─────────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────────

  const agentStats = useMemo(() => {
    const stats = { idle: 0, completed: 0, copies: 0, active: 0, errors: 0 };

    for (const state of agentStates) {
      if (state.intent === 'unknown') {
        stats.idle++;
      } else {
        stats.active++;
      }
      if (state.confidence < 0.3) {
        stats.errors++;
      }
    }

    return stats;
  }, [agentStates]);

  const selectedAgentState = useMemo(() => {
    if (!selectedUnit) return null;
    // Find agent state that controls this unit's team
    return agentStates.find((s) => s.agentId.includes(selectedUnit.team)) ?? null;
  }, [selectedUnit, agentStates]);

  // Selected hero for HeroPortrait (live/demo mode)
  const selectedHero = useMemo((): AgentHeroStats | null => {
    if (appMode === 'replay') return null;
    if (selectedAgentId && liveAgents[selectedAgentId]) {
      return liveAgents[selectedAgentId];
    }
    // Default to first agent if none selected
    const agentIds = Object.keys(liveAgents);
    if (agentIds.length > 0) {
      return liveAgents[agentIds[0]];
    }
    return null;
  }, [appMode, selectedAgentId, liveAgents]);

  // Combined stats for header (merges replay and live modes)
  const combinedAgentStats = useMemo(() => {
    if (appMode === 'replay') {
      return agentStats;
    }
    // Live/demo mode: compute from liveAgents
    const stats = { idle: 0, completed: 0, copies: 0, active: 0, errors: 0 };
    for (const agent of Object.values(liveAgents)) {
      if (agent.status === 'idle') stats.idle++;
      else if (agent.status === 'working') stats.active++;
      else if (agent.status === 'error') stats.errors++;
      stats.completed += agent.tasksCompleted;
    }
    stats.copies = Object.keys(liveAgents).length;
    return stats;
  }, [appMode, agentStats, liveAgents]);

  // Agents record for MiniMap (live mode)
  const minimapAgents = useMemo(() => {
    if (appMode === 'replay') return undefined;
    const agents: Record<string, { id: string; name: string; region: string; status: string }> = {};
    for (const agent of Object.values(liveAgents)) {
      agents[agent.id] = {
        id: agent.id,
        name: agent.name,
        region: agent.region,
        status: agent.status,
      };
    }
    return agents;
  }, [appMode, liveAgents]);

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      if (!canvasContainerRef.current) return;

      try {
        // Create engine
        const engine = createReplayEngine({ defaultSpeed: 10 });
        engineRef.current = engine;

        // Create renderer
        const renderer = await createPixiRenderer({
          container: canvasContainerRef.current,
          tileSize: 32,
          showGrid: true,
          showHealthBars: true,
        });
        rendererRef.current = renderer;

        // Wire up events
        engine.on('onLoad', (meta) => {
          setMetadata(meta);
          setTotalTicks(engine.getTotalTicks());
          renderer.setMap(meta.map);
          setEventLog([]); // Clear event log on new replay
        });

        engine.on('onTick', (tick, tickNum) => {
          setCurrentTick(tickNum);
          setAgentStates(tick.agentStates);
          setUnits(tick.units);
          renderer.updateUnits(tick);

          // Add events to log
          for (const agentState of tick.agentStates) {
            if (agentState.intent !== 'unknown') {
              const event = createEventFromDecision(agentState, tickNum);
              setEventLog((prev) => {
                // Deduplicate by checking recent entries
                const recentIds = new Set(prev.slice(-10).map((e) => e.id));
                if (recentIds.has(event.id)) return prev;
                return [...prev, event];
              });
            }
          }
        });

        engine.on('onPlaybackStateChange', setPlaybackState);

        engine.on('onError', (err) => {
          setError(err.message);
          setIsLoading(false);
        });

        renderer.on('onUnitClick', (unit) => {
          setSelectedUnit(unit);
        });

        // Hide loading
        document.getElementById('loading')?.classList.add('hidden');
        setIsInitialized(true);
      } catch (err) {
        setError(`Initialization failed: ${err}`);
      }
    }

    init();

    return () => {
      engineRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // LiveBridge Initialization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const bridge = new LiveBridge();
    liveBridgeRef.current = bridge;

    // Wire up LiveBridge callbacks
    bridge.onStatusChange = (status) => {
      setConnectionStatus(status);
      // Auto-switch to demo if live connection fails
      if (status === 'demo' && appMode === 'live') {
        setAppMode('demo');
      }
    };

    bridge.onEvent = (event) => {
      // Map event types to EventLogEntry types: 'action' | 'decision' | 'event' | 'system'
      const logType: 'action' | 'decision' | 'event' | 'system' =
        event.type === 'error' ? 'system' :
        event.type === 'spawn' ? 'event' :
        event.type === 'task_complete' ? 'action' :
        event.type === 'task_start' ? 'decision' :
        'event';

      // Add to event log
      setEventLog((prev) => [
        ...prev,
        {
          id: `live-${event.type}-${Date.now()}`,
          tick: currentTick,
          timestamp: new Date(event.timestamp).toISOString().slice(11, 19),
          message: event.data?.message || `${event.type}: ${event.agentName}`,
          type: logType,
        },
      ]);
    };

    bridge.onAgentUpdate = (agentId, agent) => {
      setLiveAgents((prev) => {
        const existing = prev[agentId];
        const heroStats: AgentHeroStats = {
          id: agent.id,
          name: agent.name,
          level: existing?.level ?? 1,
          status: agent.status as 'working' | 'hold' | 'idle' | 'error',
          region: agent.region,
          tasksCompleted: existing?.tasksCompleted ?? 0,
          filesModified: existing?.filesModified ?? 0,
          errors: existing?.errors ?? 0,
          tokensUsed: existing?.tokensUsed ?? 0,
          tokenBudget: existing?.tokenBudget ?? 100000,
          spawnedAt: existing?.spawnedAt ?? Date.now(),
          lastUpdate: Date.now(),
        };
        return { ...prev, [agentId]: heroStats };
      });
    };

    bridge.onBuildingUpgrade = (kind, tier) => {
      // Add upgrade event to log (use 'event' type for building upgrades)
      setEventLog((prev) => [
        ...prev,
        {
          id: `upgrade-${kind}-${tier}-${Date.now()}`,
          tick: currentTick,
          timestamp: new Date().toISOString().slice(11, 19),
          message: `Building upgraded: ${kind} → Tier ${tier}`,
          type: 'event' as const,
        },
      ]);
    };

    bridge.onCityStateUpdate = (newCityState) => {
      setCityState(newCityState);
    };

    // Start in demo mode by default
    bridge.setDemoMode(true);

    return () => {
      bridge.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────
  // Mode Switching
  // ─────────────────────────────────────────────────────────────

  const handleModeToggle = useCallback(() => {
    const bridge = liveBridgeRef.current;
    if (!bridge) return;

    if (appMode === 'live') {
      // Switch to demo
      bridge.disconnect();
      bridge.setDemoMode(true);
      setAppMode('demo');
    } else if (appMode === 'demo') {
      // Switch to live
      bridge.setDemoMode(false);
      bridge.connect();
      setAppMode('live');
    }
    // If in replay mode, entering live/demo clears replay
    if (appMode === 'replay') {
      setMetadata(null);
      bridge.setDemoMode(true);
      setAppMode('demo');
    }
  }, [appMode]);

  const enterReplayMode = useCallback(() => {
    const bridge = liveBridgeRef.current;
    if (bridge) {
      bridge.disconnect();
      bridge.setDemoMode(false);
    }
    setAppMode('replay');
  }, []);

  // ─────────────────────────────────────────────────────────────
  // File Loading
  // ─────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    if (!engineRef.current) return;

    // Switch to replay mode when loading a file
    enterReplayMode();
    setIsLoading(true);
    setError(null);

    const success = await engineRef.current.loadFromFile(file);

    setIsLoading(false);

    if (success) {
      const tick = engineRef.current.getCurrentTick();
      if (tick) {
        rendererRef.current?.updateUnits(tick);
        setUnits(tick.units);
      }
    }
  }, [enterReplayMode]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.json')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Demo Loading
  // ─────────────────────────────────────────────────────────────

  const loadDemoReplay = useCallback(async () => {
    if (!engineRef.current) return;

    // Switch to replay mode when loading demo
    enterReplayMode();
    setIsLoading(true);
    setError(null);

    const success = await engineRef.current.loadFromUrl('/sample-replay.json');

    setIsLoading(false);

    if (success) {
      const tick = engineRef.current.getCurrentTick();
      if (tick) {
        rendererRef.current?.updateUnits(tick);
        setUnits(tick.units);
      }
    }
  }, [enterReplayMode]);

  // ─────────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    engineRef.current?.togglePlayPause();
  }, []);

  const handleSeek = useCallback((tick: number) => {
    engineRef.current?.seek(tick);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    engineRef.current?.setSpeed(speed);
  }, []);

  const handleStep = useCallback((direction: 1 | -1) => {
    engineRef.current?.step(direction);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Command Handling
  // ─────────────────────────────────────────────────────────────

  const handleCommand = useCallback((command: string) => {
    console.log(`[Blazecraft] Command executed: ${command}`);
    // In replay mode, commands are informational only
    // Add to event log
    setEventLog((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        tick: currentTick,
        timestamp: new Date().toISOString().slice(11, 19),
        message: `Command: ${command.toUpperCase()}`,
        type: 'system',
      },
    ]);
  }, [currentTick]);

  // ─────────────────────────────────────────────────────────────
  // Keyboard Shortcuts
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!metadata) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          handleStep(-1);
          break;
        case 'ArrowRight':
          handleStep(1);
          break;
        case 'Home':
          handleSeek(0);
          break;
        case 'End':
          handleSeek(totalTicks - 1);
          break;
        case 'Escape':
          setSelectedUnit(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [metadata, totalTicks, handlePlayPause, handleSeek, handleStep]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Header Status Bar */}
      <HeaderStatusBar
        currentTick={currentTick}
        totalTicks={totalTicks}
        playbackState={playbackState}
        elapsedSeconds={elapsedSeconds}
        agentStats={combinedAgentStats}
        onLoadReplay={() => fileInputRef.current?.click()}
        onLoadDemo={loadDemoReplay}
        hasReplay={!!metadata}
        // Live mode props
        appMode={appMode}
        connectionStatus={connectionStatus}
        onModeToggle={handleModeToggle}
      />

      {/* Main Content Area */}
      <main style={styles.main}>
        {/* Left Sidebar */}
        <aside style={styles.leftSidebar} className="wc3-panel">
          {/* Hero Portrait (live/demo) or Selected Panel (replay) */}
          {appMode === 'replay' ? (
            <SelectedPanel
              selectedUnit={selectedUnit}
              agentState={selectedAgentState}
            />
          ) : (
            <HeroPortrait
              agent={selectedHero}
              onClickAgent={(agentId) => setSelectedAgentId(agentId)}
            />
          )}
          {/* MiniMap with buildings in live/demo mode */}
          <MiniMap
            mapData={appMode === 'replay' ? metadata?.map ?? null : null}
            units={appMode === 'replay' ? units : []}
            cityState={appMode !== 'replay' ? cityState : null}
            agents={minimapAgents}
            onClickPosition={(x, y) => {
              console.log(`[Blazecraft] Minimap click: (${x}, ${y})`);
            }}
            onClickBuilding={(kind) => {
              console.log(`[Blazecraft] Building click: ${kind}`);
              // Could select agents in that building's region
            }}
          />
          {/* Fill remaining space */}
          <div style={{ flex: 1, background: '#1A1A1A' }} />
        </aside>

        {/* Center Viewport */}
        <div
          ref={canvasContainerRef}
          style={styles.viewport}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Dropzone when in replay mode with no replay loaded */}
          {appMode === 'replay' && !metadata && !isLoading && (
            <div style={styles.dropzone}>
              <div style={styles.dropzoneTitle}>BlazeCraft</div>
              <p style={styles.dropzoneText}>
                Drop a replay file here or click "DEMO" to explore agent
                decision-making in RTS gameplay.
              </p>
              <button style={styles.button} onClick={loadDemoReplay}>
                Load Demo Replay
              </button>
              <button
                style={{ ...styles.button, marginLeft: '1rem', background: '#2ECC71' }}
                onClick={handleModeToggle}
              >
                Switch to Live Mode
              </button>
            </div>
          )}

          {/* City view welcome in live/demo mode */}
          {appMode !== 'replay' && (
            <div style={{ ...styles.dropzone, background: 'transparent', pointerEvents: 'none' }}>
              <div style={{ ...styles.dropzoneTitle, opacity: 0.5 }}>City View</div>
              <p style={{ ...styles.dropzoneText, opacity: 0.5 }}>
                {connectionStatus === 'live'
                  ? 'Connected to live agent events'
                  : 'Running in demo mode — synthetic events active'}
              </p>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div style={styles.loadingOverlay}>
              <span>Loading replay...</span>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div style={{ ...styles.loadingOverlay, color: '#E74C3C' }}>
              <span>Error: {error}</span>
            </div>
          )}

          {/* Control hints */}
          {metadata && <ControlHints />}
        </div>

        {/* Right Sidebar - Event Log */}
        <aside style={styles.rightSidebar} className="wc3-panel">
          <EventLog entries={eventLog} currentTick={currentTick} />
        </aside>
      </main>

      {/* Bottom Bar */}
      <div style={styles.bottomBar} className="wc3-panel">
        {/* Ops Feed */}
        <div style={styles.opsFeedSection}>
          <OpsFeed
            units={units}
            agentStates={agentStates}
            currentTick={currentTick}
          />
        </div>

        {/* Command Card */}
        <div style={styles.commandCardSection}>
          <CommandCard unit={selectedUnit} onCommand={handleCommand} />
        </div>
      </div>

      {/* Timeline (only when replay loaded) */}
      {metadata && (
        <div style={styles.timelineSection}>
          <TimelineScrubber
            currentTick={currentTick}
            totalTicks={totalTicks}
            playbackState={playbackState}
            playbackSpeed={playbackSpeed}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
            onSpeedChange={handleSpeedChange}
            onStep={handleStep}
          />
        </div>
      )}

      {/* Film grain overlay */}
      <FilmGrain enabled={true} />
    </div>
  );
}
