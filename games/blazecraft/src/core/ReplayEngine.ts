/**
 * ReplayEngine - Core replay playback controller
 *
 * Manages loading, parsing, and playback of Blazecraft replays.
 * Does NOT handle rendering - that's PixiRenderer's job.
 */

import {
  BlazecraftReplay,
  ReplayTick,
  ReplayMetadata,
  Unit,
  AgentState,
  parseReplay,
  safeParseReplay,
} from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface ReplayEngineConfig {
  /** Default playback speed (ticks per second) */
  defaultSpeed?: number;
  /** Auto-play when replay loads */
  autoPlay?: boolean;
  /** Loop replay when finished */
  loop?: boolean;
}

export interface ReplayEngineEvents {
  onLoad: (metadata: ReplayMetadata) => void;
  onTick: (tick: ReplayTick, tickNumber: number) => void;
  onPlaybackStateChange: (state: PlaybackState) => void;
  onSeek: (tickNumber: number) => void;
  onError: (error: Error) => void;
  onEnd: () => void;
}

const DEFAULT_CONFIG: Required<ReplayEngineConfig> = {
  defaultSpeed: 10,  // 10 ticks/second
  autoPlay: false,
  loop: false,
};

// ─────────────────────────────────────────────────────────────
// ReplayEngine Class
// ─────────────────────────────────────────────────────────────

export class ReplayEngine {
  private replay: BlazecraftReplay | null = null;
  private currentTick: number = 0;
  private playbackState: PlaybackState = 'stopped';
  private playbackSpeed: number;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private tickAccumulator: number = 0;

  private config: Required<ReplayEngineConfig>;
  private events: Partial<ReplayEngineEvents> = {};

  constructor(config: ReplayEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.playbackSpeed = this.config.defaultSpeed;
  }

  // ─────────────────────────────────────────────────────────────
  // Event Registration
  // ─────────────────────────────────────────────────────────────

  public on<K extends keyof ReplayEngineEvents>(
    event: K,
    callback: ReplayEngineEvents[K]
  ): void {
    this.events[event] = callback;
  }

  public off<K extends keyof ReplayEngineEvents>(event: K): void {
    delete this.events[event];
  }

  private emit<K extends keyof ReplayEngineEvents>(
    event: K,
    ...args: Parameters<ReplayEngineEvents[K]>
  ): void {
    const handler = this.events[event];
    if (handler) {
      // @ts-expect-error - TypeScript can't narrow this properly
      handler(...args);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Replay Loading
  // ─────────────────────────────────────────────────────────────

  /**
   * Load replay from JSON object
   */
  public loadFromObject(data: unknown): boolean {
    try {
      this.replay = parseReplay(data);
      this.reset();
      this.emit('onLoad', this.replay.metadata);

      if (this.config.autoPlay) {
        this.play();
      }

      return true;
    } catch (error) {
      this.emit('onError', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Load replay from JSON string
   */
  public loadFromString(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      return this.loadFromObject(data);
    } catch (error) {
      this.emit('onError', new Error(`Failed to parse JSON: ${error}`));
      return false;
    }
  }

  /**
   * Load replay from URL (fetch)
   */
  public async loadFromUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return this.loadFromObject(data);
    } catch (error) {
      this.emit('onError', new Error(`Failed to load from URL: ${error}`));
      return false;
    }
  }

  /**
   * Load replay from File object (file input)
   */
  public async loadFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      return this.loadFromString(text);
    } catch (error) {
      this.emit('onError', new Error(`Failed to read file: ${error}`));
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Playback Control
  // ─────────────────────────────────────────────────────────────

  /**
   * Start or resume playback
   */
  public play(): void {
    if (!this.replay) {
      this.emit('onError', new Error('No replay loaded'));
      return;
    }

    if (this.playbackState === 'playing') return;

    this.playbackState = 'playing';
    this.lastFrameTime = performance.now();
    this.tickAccumulator = 0;
    this.emit('onPlaybackStateChange', 'playing');
    this.startPlaybackLoop();
  }

  /**
   * Pause playback
   */
  public pause(): void {
    if (this.playbackState !== 'playing') return;

    this.playbackState = 'paused';
    this.stopPlaybackLoop();
    this.emit('onPlaybackStateChange', 'paused');
  }

  /**
   * Stop playback and reset to beginning
   */
  public stop(): void {
    this.stopPlaybackLoop();
    this.playbackState = 'stopped';
    this.currentTick = 0;
    this.emit('onPlaybackStateChange', 'stopped');
    this.emitCurrentTick();
  }

  /**
   * Toggle play/pause
   */
  public togglePlayPause(): void {
    if (this.playbackState === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to specific tick
   */
  public seek(tickNumber: number): void {
    if (!this.replay) return;

    const maxTick = this.replay.ticks.length - 1;
    this.currentTick = Math.max(0, Math.min(tickNumber, maxTick));
    this.emit('onSeek', this.currentTick);
    this.emitCurrentTick();
  }

  /**
   * Advance by N ticks (can be negative)
   */
  public step(ticks: number = 1): void {
    if (!this.replay) return;
    this.seek(this.currentTick + ticks);
  }

  /**
   * Jump to start
   */
  public jumpToStart(): void {
    this.seek(0);
  }

  /**
   * Jump to end
   */
  public jumpToEnd(): void {
    if (!this.replay) return;
    this.seek(this.replay.ticks.length - 1);
  }

  /**
   * Set playback speed (ticks per second)
   */
  public setSpeed(ticksPerSecond: number): void {
    this.playbackSpeed = Math.max(1, Math.min(100, ticksPerSecond));
  }

  /**
   * Get playback speed
   */
  public getSpeed(): number {
    return this.playbackSpeed;
  }

  // ─────────────────────────────────────────────────────────────
  // State Accessors
  // ─────────────────────────────────────────────────────────────

  /**
   * Get current tick data
   */
  public getCurrentTick(): ReplayTick | null {
    if (!this.replay) return null;
    return this.replay.ticks[this.currentTick] ?? null;
  }

  /**
   * Get tick at specific number
   */
  public getTickAt(tickNumber: number): ReplayTick | null {
    if (!this.replay) return null;
    return this.replay.ticks[tickNumber] ?? null;
  }

  /**
   * Get current tick number
   */
  public getCurrentTickNumber(): number {
    return this.currentTick;
  }

  /**
   * Get total number of ticks
   */
  public getTotalTicks(): number {
    return this.replay?.ticks.length ?? 0;
  }

  /**
   * Get replay metadata
   */
  public getMetadata(): ReplayMetadata | null {
    return this.replay?.metadata ?? null;
  }

  /**
   * Get playback state
   */
  public getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Is a replay loaded?
   */
  public isLoaded(): boolean {
    return this.replay !== null;
  }

  /**
   * Get progress as percentage (0-100)
   */
  public getProgress(): number {
    if (!this.replay || this.replay.ticks.length === 0) return 0;
    return (this.currentTick / (this.replay.ticks.length - 1)) * 100;
  }

  /**
   * Get units at current tick
   */
  public getCurrentUnits(): Unit[] {
    return this.getCurrentTick()?.units ?? [];
  }

  /**
   * Get agent states at current tick
   */
  public getCurrentAgentStates(): AgentState[] {
    return this.getCurrentTick()?.agentStates ?? [];
  }

  /**
   * Get specific agent state at current tick
   */
  public getAgentState(agentId: string): AgentState | null {
    const states = this.getCurrentAgentStates();
    return states.find(s => s.agentId === agentId) ?? null;
  }

  /**
   * Get unit by ID at current tick
   */
  public getUnit(unitId: string): Unit | null {
    const units = this.getCurrentUnits();
    return units.find(u => u.id === unitId) ?? null;
  }

  // ─────────────────────────────────────────────────────────────
  // Internal Methods
  // ─────────────────────────────────────────────────────────────

  private reset(): void {
    this.currentTick = 0;
    this.playbackState = 'stopped';
    this.tickAccumulator = 0;
    this.stopPlaybackLoop();
  }

  private startPlaybackLoop(): void {
    if (this.animationFrameId !== null) return;

    const loop = (currentTime: number) => {
      if (this.playbackState !== 'playing') return;

      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // Accumulate time and advance ticks
      this.tickAccumulator += deltaTime;
      const msPerTick = 1000 / this.playbackSpeed;

      while (this.tickAccumulator >= msPerTick) {
        this.tickAccumulator -= msPerTick;
        this.advanceTick();

        // Check if we've reached the end
        if (this.currentTick >= (this.replay?.ticks.length ?? 0) - 1) {
          if (this.config.loop) {
            this.currentTick = 0;
          } else {
            this.pause();
            this.emit('onEnd');
            return;
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopPlaybackLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private advanceTick(): void {
    if (!this.replay) return;

    const maxTick = this.replay.ticks.length - 1;
    if (this.currentTick < maxTick) {
      this.currentTick++;
      this.emitCurrentTick();
    }
  }

  private emitCurrentTick(): void {
    const tick = this.getCurrentTick();
    if (tick) {
      this.emit('onTick', tick, this.currentTick);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────

  /**
   * Dispose of engine and release resources
   */
  public dispose(): void {
    this.stopPlaybackLoop();
    this.replay = null;
    this.events = {};
  }
}

// ─────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────

export function createReplayEngine(config?: ReplayEngineConfig): ReplayEngine {
  return new ReplayEngine(config);
}
