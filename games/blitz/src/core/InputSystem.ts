/**
 * Blaze Blitz Football - Enhanced Input System
 *
 * State-machine-driven input handling for all play phases:
 * pre-snap audibles/hot routes, pocket passing, scramble, ball carrier moves.
 * Typed event emitter, configurable bindings, touch gesture support,
 * cooldown management on special moves.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Current phase of play — determines which inputs are active. */
export type InputPhase = 'pre_snap' | 'pocket' | 'scramble' | 'ball_carrier';

/** Every discrete action the input layer can emit. */
export type InputAction =
  // Pre-snap
  | 'select_receiver'
  | 'hot_route_out'
  | 'hot_route_in'
  | 'hot_route_streak'
  | 'hot_route_curl'
  | 'audible'
  // Post-snap QB
  | 'throw'
  | 'pump_fake'
  | 'throw_away'
  | 'move'
  // Ball carrier
  | 'juke'
  | 'spin'
  | 'truck'
  | 'dive';

/** Payload emitted with every input event. */
export interface InputEvent {
  action: InputAction;
  phase: InputPhase;
  /** Movement direction (normalized) when relevant, otherwise zero. */
  direction: Vector3;
  /** 1-4 receiver index for select_receiver, undefined otherwise. */
  receiverIndex?: number;
  /** Timestamp (performance.now) of the event. */
  timestamp: number;
}

/** Per-action key binding. Values are `KeyboardEvent.code` strings. */
export interface KeyBindings {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  selectReceiver1: string;
  selectReceiver2: string;
  selectReceiver3: string;
  selectReceiver4: string;
  audible: string;
  pumpFake: string;
  throwAway: string;
  juke: string;
  spin: string;
  truck: string;
  dive: string;
}

/** Cooldown durations (seconds) for special moves. */
export interface CooldownConfig {
  juke: number;
  spin: number;
  truck: number;
}

/** Full InputSystem configuration. */
export interface InputConfig {
  bindings: KeyBindings;
  cooldowns: CooldownConfig;
  /** Minimum swipe distance in px to register a touch gesture. */
  swipeThreshold: number;
  /** Enable touch/gesture controls. */
  touchEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BINDINGS: KeyBindings = {
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  selectReceiver1: 'Digit1',
  selectReceiver2: 'Digit2',
  selectReceiver3: 'Digit3',
  selectReceiver4: 'Digit4',
  audible: 'KeyA',
  pumpFake: 'KeyR',
  throwAway: 'Space',
  juke: 'KeyJ',
  spin: 'KeyK',
  truck: 'KeyL',
  dive: 'Space',
};

const DEFAULT_COOLDOWNS: CooldownConfig = {
  juke: 0.8,
  spin: 1.2,
  truck: 1.5,
};

const DEFAULT_CONFIG: InputConfig = {
  bindings: DEFAULT_BINDINGS,
  cooldowns: DEFAULT_COOLDOWNS,
  swipeThreshold: 40,
  touchEnabled: true,
};

// ---------------------------------------------------------------------------
// Typed event emitter
// ---------------------------------------------------------------------------

type Listener = (event: InputEvent) => void;

/** Map of action -> array of listeners for typed dispatch. */
type ListenerMap = { [A in InputAction]?: Listener[] };

// ---------------------------------------------------------------------------
// InputSystem
// ---------------------------------------------------------------------------

export class InputSystem {
  private phase: InputPhase = 'pre_snap';
  private config: InputConfig;

  // Key tracking
  private keysDown = new Set<string>();

  // Cooldown trackers (seconds remaining)
  private cooldowns: Record<'juke' | 'spin' | 'truck', number> = {
    juke: 0,
    spin: 0,
    truck: 0,
  };

  // Movement vector rebuilt each frame from held keys
  private moveDirection = Vector3.Zero();

  // Event listeners
  private listeners: ListenerMap = {};
  private globalListeners: Listener[] = [];

  // Touch state
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;

  // Bound handler refs for cleanup
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private handlePointerDown: (e: PointerEvent) => void;
  private handlePointerUp: (e: PointerEvent) => void;
  private handleContextMenu: (e: Event) => void;

  constructor(
    private canvas: HTMLCanvasElement,
    config?: Partial<InputConfig>,
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      bindings: { ...DEFAULT_BINDINGS, ...config?.bindings },
      cooldowns: { ...DEFAULT_COOLDOWNS, ...config?.cooldowns },
    };

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handleContextMenu = (e: Event) => e.preventDefault();

    this.attach();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Transition to a new input phase. Clears held keys to avoid stale state. */
  setPhase(phase: InputPhase): void {
    this.phase = phase;
    this.keysDown.clear();
    this.moveDirection.setAll(0);
  }

  getPhase(): InputPhase {
    return this.phase;
  }

  /** Subscribe to a specific action. Returns an unsubscribe function. */
  on(action: InputAction, listener: Listener): () => void {
    const list = this.listeners[action] ?? (this.listeners[action] = []);
    list.push(listener);
    return () => {
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  /** Subscribe to all actions. Returns an unsubscribe function. */
  onAny(listener: Listener): () => void {
    this.globalListeners.push(listener);
    return () => {
      const idx = this.globalListeners.indexOf(listener);
      if (idx !== -1) this.globalListeners.splice(idx, 1);
    };
  }

  /** Call once per frame with delta time (seconds). Ticks cooldowns & emits move. */
  update(dt: number): void {
    // Tick cooldowns
    for (const key of ['juke', 'spin', 'truck'] as const) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      }
    }

    // Rebuild move direction from held keys
    this.rebuildMoveDirection();

    // Emit continuous move event when direction is non-zero
    if (this.moveDirection.lengthSquared() > 0.001) {
      if (this.phase !== 'pre_snap') {
        this.emit('move', this.moveDirection.clone());
      }
    }
  }

  /** Current normalized movement direction (read-only copy). */
  getMoveDirection(): Vector3 {
    return this.moveDirection.clone();
  }

  /** Whether a special-move cooldown is still active. */
  isOnCooldown(move: 'juke' | 'spin' | 'truck'): boolean {
    return this.cooldowns[move] > 0;
  }

  /** Remaining cooldown in seconds. */
  getCooldown(move: 'juke' | 'spin' | 'truck'): number {
    return this.cooldowns[move];
  }

  /** Hot-swap key bindings at runtime. */
  setBindings(bindings: Partial<KeyBindings>): void {
    Object.assign(this.config.bindings, bindings);
  }

  /** Detach all DOM listeners. Call on teardown. */
  dispose(): void {
    this.detach();
    this.listeners = {};
    this.globalListeners = [];
  }

  // -----------------------------------------------------------------------
  // DOM attachment
  // -----------------------------------------------------------------------

  private attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  // -----------------------------------------------------------------------
  // Keyboard handling
  // -----------------------------------------------------------------------

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    this.keysDown.add(e.code);

    const b = this.config.bindings;

    switch (this.phase) {
      case 'pre_snap':
        this.handlePreSnapKey(e.code, b);
        break;
      case 'pocket':
        this.handlePocketKey(e.code, b);
        break;
      case 'scramble':
        this.handleScrambleKey(e.code, b);
        break;
      case 'ball_carrier':
        this.handleBallCarrierKey(e.code, b);
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  // -- Pre-snap --------------------------------------------------------

  private handlePreSnapKey(code: string, b: KeyBindings): void {
    if (code === b.selectReceiver1) return this.emit('select_receiver', Vector3.Zero(), 1);
    if (code === b.selectReceiver2) return this.emit('select_receiver', Vector3.Zero(), 2);
    if (code === b.selectReceiver3) return this.emit('select_receiver', Vector3.Zero(), 3);
    if (code === b.selectReceiver4) return this.emit('select_receiver', Vector3.Zero(), 4);

    // Hot route directions (arrow keys always active for hot routes pre-snap)
    if (code === 'ArrowLeft')  return this.emit('hot_route_out', Vector3.Left());
    if (code === 'ArrowRight') return this.emit('hot_route_in', Vector3.Right());
    if (code === 'ArrowUp')    return this.emit('hot_route_streak', Vector3.Forward());
    if (code === 'ArrowDown')  return this.emit('hot_route_curl', Vector3.Backward());

    // WASD hot routes (only when not colliding with audible — 'A' dual-mapped)
    if (code === b.moveLeft && code === b.audible) {
      // 'A' key: audible takes priority pre-snap
      return this.emit('audible', Vector3.Zero());
    }
    if (code === b.audible) return this.emit('audible', Vector3.Zero());

    // WASD as hot route fallback (if keys differ from audible)
    if (code === b.moveLeft)  return this.emit('hot_route_out', Vector3.Left());
    if (code === b.moveRight) return this.emit('hot_route_in', Vector3.Right());
    if (code === b.moveUp)    return this.emit('hot_route_streak', Vector3.Forward());
    if (code === b.moveDown)  return this.emit('hot_route_curl', Vector3.Backward());
  }

  // -- Pocket ----------------------------------------------------------

  private handlePocketKey(code: string, b: KeyBindings): void {
    if (code === b.pumpFake) return this.emit('pump_fake', Vector3.Zero());
    if (code === b.throwAway) return this.emit('throw_away', Vector3.Zero());

    // Receiver selection also valid in pocket
    if (code === b.selectReceiver1) return this.emit('select_receiver', Vector3.Zero(), 1);
    if (code === b.selectReceiver2) return this.emit('select_receiver', Vector3.Zero(), 2);
    if (code === b.selectReceiver3) return this.emit('select_receiver', Vector3.Zero(), 3);
    if (code === b.selectReceiver4) return this.emit('select_receiver', Vector3.Zero(), 4);
    // Movement keys handled in update() via rebuildMoveDirection
  }

  // -- Scramble --------------------------------------------------------

  private handleScrambleKey(code: string, b: KeyBindings): void {
    // Still allow throws while scrambling
    if (code === b.pumpFake) return this.emit('pump_fake', Vector3.Zero());
    if (code === b.throwAway) return this.emit('throw_away', Vector3.Zero());
    if (code === b.selectReceiver1) return this.emit('select_receiver', Vector3.Zero(), 1);
    if (code === b.selectReceiver2) return this.emit('select_receiver', Vector3.Zero(), 2);
    if (code === b.selectReceiver3) return this.emit('select_receiver', Vector3.Zero(), 3);
    if (code === b.selectReceiver4) return this.emit('select_receiver', Vector3.Zero(), 4);
  }

  // -- Ball carrier ----------------------------------------------------

  private handleBallCarrierKey(code: string, b: KeyBindings): void {
    if (code === b.juke) return this.trySpecialMove('juke');
    if (code === b.spin || code === 'ShiftLeft' || code === 'ShiftRight') {
      return this.trySpecialMove('spin');
    }
    if (code === b.truck || code === 'ControlLeft' || code === 'ControlRight') {
      return this.trySpecialMove('truck');
    }
    if (code === b.dive) return this.emit('dive', this.moveDirection.clone());
  }

  // -----------------------------------------------------------------------
  // Pointer / touch handling
  // -----------------------------------------------------------------------

  private onPointerDown(e: PointerEvent): void {
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchStartTime = performance.now();

    // Right-click = pump fake in passing phases
    if (e.button === 2) {
      if (this.phase === 'pocket' || this.phase === 'scramble') {
        this.emit('pump_fake', Vector3.Zero());
      }
      return;
    }

    // Left-click in ball_carrier = juke
    if (e.button === 0 && this.phase === 'ball_carrier') {
      this.trySpecialMove('juke');
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.button !== 0) return;

    const dx = e.clientX - this.touchStartX;
    const dy = e.clientY - this.touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = performance.now() - this.touchStartTime;

    // Swipe detection (touch gesture)
    if (this.config.touchEnabled && dist > this.config.swipeThreshold) {
      this.handleSwipe(dx, dy);
      return;
    }

    // Tap = throw in passing phases
    if (elapsed < 300 && dist < 10) {
      if (this.phase === 'pocket' || this.phase === 'scramble') {
        this.emit('throw', Vector3.Zero());
      }
    }
  }

  private handleSwipe(dx: number, dy: number): void {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine primary direction
    let direction: Vector3;
    if (absDx > absDy) {
      direction = dx > 0 ? Vector3.Right() : Vector3.Left();
    } else {
      direction = dy > 0 ? Vector3.Backward() : Vector3.Forward();
    }

    switch (this.phase) {
      case 'pre_snap':
        // Swipe = hot route in swipe direction
        if (absDx > absDy) {
          this.emit(dx > 0 ? 'hot_route_in' : 'hot_route_out', direction);
        } else {
          this.emit(dy < 0 ? 'hot_route_streak' : 'hot_route_curl', direction);
        }
        break;
      case 'ball_carrier':
        // Swipe = directional juke
        this.trySpecialMove('juke', direction);
        break;
      default:
        break;
    }
  }

  // -----------------------------------------------------------------------
  // Movement
  // -----------------------------------------------------------------------

  private rebuildMoveDirection(): void {
    const b = this.config.bindings;
    let x = 0;
    let z = 0;

    if (this.keysDown.has(b.moveLeft) || this.keysDown.has('ArrowLeft'))  x -= 1;
    if (this.keysDown.has(b.moveRight) || this.keysDown.has('ArrowRight')) x += 1;
    if (this.keysDown.has(b.moveUp) || this.keysDown.has('ArrowUp'))      z += 1;
    if (this.keysDown.has(b.moveDown) || this.keysDown.has('ArrowDown'))   z -= 1;

    this.moveDirection.set(x, 0, z);
    if (this.moveDirection.lengthSquared() > 1) {
      this.moveDirection.normalize();
    }
  }

  // -----------------------------------------------------------------------
  // Special moves with cooldown
  // -----------------------------------------------------------------------

  private trySpecialMove(
    move: 'juke' | 'spin' | 'truck',
    direction?: Vector3,
  ): void {
    if (this.cooldowns[move] > 0) return;

    this.cooldowns[move] = this.config.cooldowns[move];
    const dir = direction ?? this.moveDirection.clone();
    this.emit(move, dir);
  }

  // -----------------------------------------------------------------------
  // Event dispatch
  // -----------------------------------------------------------------------

  private emit(
    action: InputAction,
    direction: Vector3,
    receiverIndex?: number,
  ): void {
    const event: InputEvent = {
      action,
      phase: this.phase,
      direction,
      receiverIndex,
      timestamp: performance.now(),
    };

    const actionListeners = this.listeners[action];
    if (actionListeners) {
      for (let i = 0; i < actionListeners.length; i++) {
        actionListeners[i](event);
      }
    }
    for (let i = 0; i < this.globalListeners.length; i++) {
      this.globalListeners[i](event);
    }
  }
}
