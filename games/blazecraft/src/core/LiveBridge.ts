/**
 * LiveBridge - SSE client for real-time Claude Code agent events
 *
 * Connects to /api/events/stream for live updates.
 * Falls back to demo mode if SSE fails.
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Demo mode generates synthetic events
 * - Event callbacks for UI updates
 * - Building state synchronization
 */

import type { CityState } from './BuildingSystem';
import { createInitialCityState, processTaskCompletion } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'live' | 'demo';

export interface EventPayload {
  type: 'spawn' | 'task_start' | 'task_complete' | 'error' | 'terminate' | 'command' | 'status';
  agentId: string;
  agentName?: string;
  timestamp: string;
  data?: {
    tool?: string;
    files?: string[];
    region?: string;
    message?: string;
    progress?: number;
  };
}

export interface AgentState {
  id: string;
  name: string;
  status: string;
  region: string;
  spawnedAt: number;
  lastUpdate: number;
}

export interface LiveBridgeCallbacks {
  onEvent?: (event: EventPayload) => void;
  onAgentUpdate?: (agents: Record<string, AgentState>) => void;
  onBuildingUpgrade?: (buildingKind: string) => void;
  onCityStateUpdate?: (state: CityState) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export interface LiveBridgeConfig {
  baseUrl?: string;
  sessionId?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  demoEventInterval?: number;
}

// ─────────────────────────────────────────────────────────────
// Demo Data
// ─────────────────────────────────────────────────────────────

const DEMO_AGENT_NAMES = [
  'Builder-1',
  'Scout-2',
  'Forge-3',
  'Archivist-4',
  'Sentinel-5',
];

const DEMO_FILE_PATHS = [
  'src/core/BuildingSystem.ts',
  'src/core/LiveBridge.ts',
  'src/ui/HeroPortrait.tsx',
  'src/ui/CommandCard.tsx',
  'src/ui/MiniMap.tsx',
  'tests/BuildingSystem.test.ts',
  'tests/LiveBridge.test.ts',
  'workers/blazecraft-events/src/session.ts',
  'docs/README.md',
  'docs/API.md',
  'config/wrangler.toml',
  'package.json',
];

const DEMO_REGIONS = ['workshop', 'market', 'barracks', 'stables', 'library', 'townhall'];

// ─────────────────────────────────────────────────────────────
// LiveBridge Class
// ─────────────────────────────────────────────────────────────

// Re-export EventPayload as AgentEvent for compatibility
export type AgentEvent = EventPayload;

// Phase 2.1: Processing mode for event handling
export type ProcessingMode = 'running' | 'stopped' | 'held';

export class LiveBridge {
  private eventSource: EventSource | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;
  private hasReceivedActivity = false;
  private demoInterval: ReturnType<typeof setInterval> | null = null;
  private demoAgents: Map<string, AgentState> = new Map();
  private cityState: CityState;
  private callbacks: LiveBridgeCallbacks;
  private config: Required<LiveBridgeConfig>;

  // Phase 2.1: Processing control state
  private processingMode: ProcessingMode = 'running';
  private eventBuffer: EventPayload[] = [];

  // Public callback setters for post-construction assignment
  set onEvent(handler: ((event: EventPayload) => void) | undefined) {
    this.callbacks.onEvent = handler;
  }
  set onAgentUpdate(handler: ((agentId: string, agent: AgentState) => void) | undefined) {
    // Adapt from single-agent to multi-agent format
    if (handler) {
      this.callbacks.onAgentUpdate = (agents) => {
        for (const [id, agent] of Object.entries(agents)) {
          handler(id, agent);
        }
      };
    } else {
      this.callbacks.onAgentUpdate = undefined;
    }
  }
  set onBuildingUpgrade(handler: ((kind: string, tier: number) => void) | undefined) {
    if (handler) {
      this.callbacks.onBuildingUpgrade = (kind) => {
        const building = this.cityState.buildings[kind as keyof typeof this.cityState.buildings];
        handler(kind, building?.tier ?? 0);
      };
    } else {
      this.callbacks.onBuildingUpgrade = undefined;
    }
  }
  set onCityStateUpdate(handler: ((state: CityState) => void) | undefined) {
    this.callbacks.onCityStateUpdate = handler;
  }
  set onStatusChange(handler: ((status: ConnectionStatus) => void) | undefined) {
    this.callbacks.onStatusChange = handler;
  }
  set onError(handler: ((error: Error) => void) | undefined) {
    this.callbacks.onError = handler;
  }

  constructor(callbacks: LiveBridgeCallbacks = {}, config: LiveBridgeConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      baseUrl: config.baseUrl ?? '/api/blazecraft/events',  // Updated to correct endpoint
      sessionId: config.sessionId ?? 'main',
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 3,  // Give live connection more chances
      demoEventInterval: config.demoEventInterval ?? 3000,
    };
    this.cityState = createInitialCityState();
  }

  /**
   * Connect to SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.setStatus('connecting');

    try {
      // Connect directly to SSE endpoint (no /stream suffix needed)
      const url = `${this.config.baseUrl}?clientId=${this.config.sessionId}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.hasReceivedActivity = false;
        this.setStatus('live');

        // Start activity timeout - fall back to demo if no meaningful events within 30s
        // Extended from 5s to give real connections time to send events
        this.activityTimeout = setTimeout(() => {
          if (!this.hasReceivedActivity && this.status === 'live') {
            console.log('[LiveBridge] No activity after connect, falling back to demo');
            this.eventSource?.close();
            this.eventSource = null;
            this.startDemoMode();
          }
        }, 30000);
      };

      // Handle 'connected' event from server
      this.eventSource.addEventListener('connected', (e: MessageEvent) => {
        console.log('[LiveBridge] SSE connected:', e.data);
        this.markActivity();
      });

      // Handle 'heartbeat' event - keep connection alive, counts as activity
      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeats confirm connection is alive but don't count as "meaningful" activity
        // We only mark activity on actual events
      });

      // Handle 'message' events (actual game events)
      this.eventSource.addEventListener('message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.markActivity();
          this.handleIncomingEvent(data);
        } catch (err) {
          console.error('[LiveBridge] Failed to parse message:', err);
        }
      });

      // Fallback for unnamed events (backward compatibility)
      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[LiveBridge] Failed to parse message:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.handleDisconnect();
      };
    } catch (err) {
      console.error('[LiveBridge] Failed to connect:', err);
      this.handleDisconnect();
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }

    this.stopDemoMode();
    this.setStatus('disconnected');
  }

  /**
   * Enable demo mode (generates synthetic events)
   */
  setDemoMode(enabled: boolean): void {
    if (enabled) {
      this.startDemoMode();
    } else {
      this.stopDemoMode();
      // Try to reconnect to live
      if (this.status !== 'live') {
        this.connect();
      }
    }
  }

  /**
   * Check if currently in demo mode
   */
  isDemoMode(): boolean {
    return this.status === 'demo';
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get current city state
   */
  getCityState(): CityState {
    return this.cityState;
  }

  /**
   * Get demo agents (for UI display)
   */
  getDemoAgents(): Record<string, AgentState> {
    return Object.fromEntries(this.demoAgents);
  }

  // ─────────────────────────────────────────────────────────────
  // Phase 2.1: Processing Control Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Stop processing events - events are discarded
   */
  stop(): void {
    this.processingMode = 'stopped';
  }

  /**
   * Hold events - buffer but don't process until resume
   */
  hold(): void {
    this.processingMode = 'held';
  }

  /**
   * Resume processing - process buffered events then continue live
   */
  resume(): void {
    // Process any buffered events first
    if (this.eventBuffer.length > 0) {
      for (const event of this.eventBuffer) {
        this.processEvent(event);
      }
      this.eventBuffer = [];
    }
    this.processingMode = 'running';
  }

  /**
   * Get current processing mode
   */
  getProcessingMode(): ProcessingMode {
    return this.processingMode;
  }

  /**
   * Get buffered event count (when in hold mode)
   */
  getBufferedEventCount(): number {
    return this.eventBuffer.length;
  }

  /**
   * Clear buffered events without processing
   */
  clearBuffer(): void {
    this.eventBuffer = [];
  }

  /**
   * E2: Send a command to an agent
   */
  async sendCommand(agentId: string, command: string): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          command,
          session: this.config.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('[LiveBridge] Command send failed:', err);
      this.callbacks.onError?.(err instanceof Error ? err : new Error('Command failed'));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private handleMessage(data: {
    type: string;
    events?: EventPayload[];
    agents?: Record<string, AgentState>;
    regionProgress?: Record<string, number>;
    payload?: EventPayload;
  }): void {
    // Initial state message
    if (data.type === 'init') {
      // Check if there's meaningful data (non-empty events or agents)
      const hasEvents = data.events && data.events.length > 0;
      const hasAgents = data.agents && Object.keys(data.agents).length > 0;

      if (hasEvents || hasAgents) {
        this.markActivity();
      }

      if (data.events) {
        for (const event of data.events) {
          this.processEvent(event);
        }
      }
      if (data.agents) {
        this.callbacks.onAgentUpdate?.(data.agents);
      }
      return;
    }

    // Single event message - always counts as activity
    if (data.type === 'event' && data.payload) {
      this.markActivity();
      this.processEvent(data.payload);
      if (data.agents) {
        this.callbacks.onAgentUpdate?.(data.agents);
      }
      return;
    }

    // Command acknowledgment - counts as activity
    if (data.type === 'command_ack' && data.agents) {
      this.markActivity();
      this.callbacks.onAgentUpdate?.(data.agents);
    }
  }

  private markActivity(): void {
    this.hasReceivedActivity = true;
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  /**
   * Handle events from our live events API endpoint
   * Converts API format to internal EventPayload format
   */
  private handleIncomingEvent(data: {
    type: string;
    agentId: string;
    agentName: string;
    sessionId: string;
    timestamp: string;
    data?: {
      filePath?: string;
      taskDescription?: string;
      buildingKind?: string;
      status?: string;
      message?: string;
    };
  }): void {
    // Map API event types to internal types
    const typeMap: Record<string, EventPayload['type']> = {
      agent_spawn: 'spawn',
      task_start: 'task_start',
      task_complete: 'task_complete',
      file_edit: 'task_complete', // Treat file edits as completions
      error: 'error',
      status: 'status',
    };

    const internalType = typeMap[data.type] || 'status';

    // Build file list from filePath if present
    const files = data.data?.filePath ? [data.data.filePath] : undefined;

    const event: EventPayload = {
      type: internalType,
      agentId: data.agentId,
      agentName: data.agentName,
      timestamp: data.timestamp,
      data: {
        files,
        region: data.data?.buildingKind,
        message: data.data?.message || data.data?.taskDescription,
      },
    };

    this.processEvent(event);

    // Update agent tracking
    const agentState: AgentState = {
      id: data.agentId,
      name: data.agentName,
      status: internalType === 'error' ? 'error' : 'working',
      region: data.data?.buildingKind || 'townhall',
      spawnedAt: Date.now(),
      lastUpdate: Date.now(),
    };

    this.callbacks.onAgentUpdate?.({ [data.agentId]: agentState });
  }

  private processEvent(event: EventPayload): void {
    // Phase 2.1: Check processing mode
    switch (this.processingMode) {
      case 'stopped':
        // Discard event
        return;

      case 'held':
        // Buffer event for later processing
        this.eventBuffer.push(event);
        return;

      case 'running':
        // Process normally
        break;
    }

    // Notify callback
    this.callbacks.onEvent?.(event);

    // Update city state on task completion
    if (event.type === 'task_complete' && event.data?.files) {
      const result = processTaskCompletion(this.cityState, event.data.files);
      this.cityState = result.state;

      // Notify about upgrades
      for (const buildingKind of result.upgrades) {
        this.callbacks.onBuildingUpgrade?.(buildingKind);
      }

      // Notify about state change
      this.callbacks.onCityStateUpdate?.(this.cityState);
    }
  }

  private handleDisconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;

      this.setStatus('connecting');
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      // Fall back to demo mode
      this.startDemoMode();
    }
  }

  private startDemoMode(): void {
    if (this.demoInterval) return;

    this.setStatus('demo');

    // A3: Immediately broadcast initial city state on demo start
    this.callbacks.onCityStateUpdate?.(this.cityState);

    // Spawn initial demo agents
    this.spawnDemoAgent();
    this.spawnDemoAgent();

    // Generate events periodically
    this.demoInterval = setInterval(() => {
      this.generateDemoEvent();
    }, this.config.demoEventInterval);
  }

  private stopDemoMode(): void {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
    this.demoAgents.clear();
  }

  private spawnDemoAgent(): void {
    const id = `demo-agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const name = DEMO_AGENT_NAMES[Math.floor(Math.random() * DEMO_AGENT_NAMES.length)];
    const region = DEMO_REGIONS[Math.floor(Math.random() * DEMO_REGIONS.length)];

    const agent: AgentState = {
      id,
      name,
      status: 'working',
      region,
      spawnedAt: Date.now(),
      lastUpdate: Date.now(),
    };

    this.demoAgents.set(id, agent);

    const event: EventPayload = {
      type: 'spawn',
      agentId: id,
      agentName: name,
      timestamp: new Date().toISOString(),
      data: { region },
    };

    this.processEvent(event);
    this.callbacks.onAgentUpdate?.(Object.fromEntries(this.demoAgents));
  }

  private generateDemoEvent(): void {
    const agents = Array.from(this.demoAgents.values());
    if (agents.length === 0) {
      this.spawnDemoAgent();
      return;
    }

    // Random event type weighted toward task_complete
    const rand = Math.random();
    let eventType: EventPayload['type'];

    if (rand < 0.1 && this.demoAgents.size < 5) {
      eventType = 'spawn';
      this.spawnDemoAgent();
      return;
    } else if (rand < 0.15) {
      eventType = 'task_start';
    } else if (rand < 0.85) {
      eventType = 'task_complete';
    } else if (rand < 0.95) {
      eventType = 'error';
    } else {
      eventType = 'status';
    }

    const agent = agents[Math.floor(Math.random() * agents.length)];
    const files = [DEMO_FILE_PATHS[Math.floor(Math.random() * DEMO_FILE_PATHS.length)]];

    // Sometimes include multiple files
    if (Math.random() > 0.7) {
      files.push(DEMO_FILE_PATHS[Math.floor(Math.random() * DEMO_FILE_PATHS.length)]);
    }

    const event: EventPayload = {
      type: eventType,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString(),
      data: {
        files: eventType === 'task_complete' ? files : undefined,
        region: agent.region,
        message: eventType === 'error' ? 'Simulated error for demo' : undefined,
      },
    };

    // Update agent state
    agent.lastUpdate = Date.now();
    if (eventType === 'error') {
      agent.status = 'error';
    } else {
      agent.status = 'working';
    }

    this.processEvent(event);
    this.callbacks.onAgentUpdate?.(Object.fromEntries(this.demoAgents));
  }
}

/**
 * Factory function for creating LiveBridge instances
 */
export function createLiveBridge(
  callbacks: LiveBridgeCallbacks = {},
  config: LiveBridgeConfig = {}
): LiveBridge {
  return new LiveBridge(callbacks, config);
}
