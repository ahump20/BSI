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
      baseUrl: config.baseUrl ?? '/api/events',
      sessionId: config.sessionId ?? 'main',
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 2,  // A2: Faster demo fallback (was 5)
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
      const url = `${this.config.baseUrl}/stream?session=${this.config.sessionId}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.hasReceivedActivity = false;
        this.setStatus('live');

        // Start activity timeout - fall back to demo if no meaningful events within 5s
        this.activityTimeout = setTimeout(() => {
          if (!this.hasReceivedActivity && this.status === 'live') {
            console.log('[LiveBridge] No activity after connect, falling back to demo');
            this.eventSource?.close();
            this.eventSource = null;
            this.startDemoMode();
          }
        }, 5000);
      };

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

  private processEvent(event: EventPayload): void {
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
