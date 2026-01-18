/**
 * Blaze Blitz Football - Player Controller
 *
 * Snappy, arcade-style controls:
 * - WASD movement with instant acceleration
 * - Turbo boost with stamina management
 * - Tackle mechanics with late-hit window
 * - Context-sensitive actions (snap, throw, tackle)
 */

import { Vector3 } from '@babylonjs/core';

/** Input state */
export interface InputState {
  moveX: number; // -1 to 1 (A/D or left/right)
  moveZ: number; // -1 to 1 (W/S or up/down)
  turbo: boolean; // Shift held
  action: boolean; // Space pressed
  actionHoldTime: number; // How long action button held
  selectReceiver: number | null; // Which receiver to target (0-4)
  mouseX: number; // Mouse position for aiming
  mouseZ: number;
}

/** Player movement configuration */
export interface PlayerControlConfig {
  baseSpeed: number; // Normal movement speed (yards/sec)
  turboMultiplier: number; // Speed boost when turbo active
  accelerationTime: number; // Time to reach max speed (seconds)
  maxStamina: number; // Total stamina pool
  staminaDrainRate: number; // Stamina drain per second when turbo
  staminaRegenRate: number; // Stamina regen per second when not turbo
  tackleRadius: number; // How close to tackle
  tackleImpulse: number; // Knockback force on tackle
  lateHitWindow: number; // Seconds after whistle tackles still work
}

const DEFAULT_CONFIG: PlayerControlConfig = {
  baseSpeed: 15, // 15 yards/sec (fast arcade feel)
  turboMultiplier: 1.5, // 50% speed boost
  accelerationTime: 0.2, // Nearly instant acceleration
  maxStamina: 100,
  staminaDrainRate: 25, // 4 seconds of full turbo
  staminaRegenRate: 15, // Slower regen
  tackleRadius: 1.5, // 1.5 yard tackle range
  tackleImpulse: 8, // Knockback force
  lateHitWindow: 1.5, // 1.5 seconds of late-hit drama
};

/** Player controller class */
export class PlayerController {
  private config: PlayerControlConfig;
  private inputState: InputState;

  // Movement state
  private velocity: Vector3 = Vector3.Zero();
  private position: Vector3;
  private rotation: number = 0; // Facing direction (radians)

  // Stamina
  private stamina: number;
  private isTurboActive: boolean = false;

  // Action state
  private isActionPressed: boolean = false;
  private actionPressTime: number = 0;
  private canAct: boolean = true;

  // Tackle state
  private isTackling: boolean = false;
  private tackleTimer: number = 0;
  private whistleBlown: boolean = false;
  private whistleTime: number = 0;

  // Keyboard state tracking
  private keysDown: Set<string> = new Set();

  constructor(startPosition: Vector3, config: Partial<PlayerControlConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.position = startPosition.clone();
    this.stamina = this.config.maxStamina;

    this.inputState = {
      moveX: 0,
      moveZ: 0,
      turbo: false,
      action: false,
      actionHoldTime: 0,
      selectReceiver: null,
      mouseX: 0,
      mouseZ: 0,
    };

    this.setupInputHandlers();
  }

  /** Setup keyboard and mouse input handlers */
  private setupInputHandlers(): void {
    // Keyboard down
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);

      // Track action press time
      if (e.code === 'Space' && !this.isActionPressed) {
        this.isActionPressed = true;
        this.actionPressTime = performance.now();
      }

      // Receiver selection (1-5 keys)
      if (e.code >= 'Digit1' && e.code <= 'Digit5') {
        this.inputState.selectReceiver = parseInt(e.code.slice(-1)) - 1;
      }

      this.updateInputState();
    });

    // Keyboard up
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);

      if (e.code === 'Space') {
        this.isActionPressed = false;
        this.inputState.actionHoldTime = (performance.now() - this.actionPressTime) / 1000;
      }

      this.updateInputState();
    });

    // Mouse move for aiming
    window.addEventListener('mousemove', (e) => {
      // Convert screen coordinates to field coordinates
      // This will need to be updated based on camera setup
      this.inputState.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.inputState.mouseZ = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Mouse click for receiver selection
    window.addEventListener('click', (e) => {
      // Will be used for clicking on receivers to select
      this.inputState.action = true;
    });
  }

  /** Update input state from keyboard state */
  private updateInputState(): void {
    // Movement (WASD)
    this.inputState.moveX = 0;
    this.inputState.moveZ = 0;

    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      this.inputState.moveX -= 1;
    }
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      this.inputState.moveX += 1;
    }
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) {
      this.inputState.moveZ += 1; // Forward is positive Z
    }
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) {
      this.inputState.moveZ -= 1;
    }

    // Turbo (Shift)
    this.inputState.turbo = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');

    // Action (Space)
    this.inputState.action = this.keysDown.has('Space');
  }

  /** Update player movement (call every frame) */
  public update(deltaTime: number): void {
    // Handle stamina
    this.updateStamina(deltaTime);

    // Calculate movement
    this.updateMovement(deltaTime);

    // Update tackle timer
    if (this.isTackling) {
      this.tackleTimer -= deltaTime;
      if (this.tackleTimer <= 0) {
        this.isTackling = false;
      }
    }

    // Reset one-frame inputs
    this.inputState.selectReceiver = null;
  }

  /** Update stamina based on turbo usage */
  private updateStamina(deltaTime: number): void {
    if (this.inputState.turbo && this.stamina > 0) {
      // Drain stamina when using turbo
      this.stamina -= this.config.staminaDrainRate * deltaTime;
      this.stamina = Math.max(0, this.stamina);
      this.isTurboActive = this.stamina > 0;
    } else {
      // Regenerate stamina when not using turbo
      this.stamina += this.config.staminaRegenRate * deltaTime;
      this.stamina = Math.min(this.config.maxStamina, this.stamina);
      this.isTurboActive = false;
    }
  }

  /** Update player movement based on input */
  private updateMovement(deltaTime: number): void {
    // Get movement input
    const inputDir = new Vector3(this.inputState.moveX, 0, this.inputState.moveZ);

    // Normalize if moving diagonally
    if (inputDir.length() > 0) {
      inputDir.normalize();
    }

    // Calculate target speed
    let targetSpeed = this.config.baseSpeed;
    if (this.isTurboActive) {
      targetSpeed *= this.config.turboMultiplier;
    }

    // Target velocity
    const targetVelocity = inputDir.scale(targetSpeed);

    // Snappy acceleration (almost instant)
    const lerpFactor = 1 - Math.pow(0.01, deltaTime / this.config.accelerationTime);
    this.velocity = Vector3.Lerp(this.velocity, targetVelocity, lerpFactor);

    // Update position
    this.position.addInPlace(this.velocity.scale(deltaTime));

    // Update rotation to face movement direction
    if (this.velocity.length() > 0.5) {
      this.rotation = Math.atan2(this.velocity.x, this.velocity.z);
    }
  }

  /** Attempt a tackle */
  public attemptTackle(): boolean {
    if (this.isTackling) return false;

    this.isTackling = true;
    this.tackleTimer = 0.3; // Tackle animation duration

    return true;
  }

  /** Check if we can tackle a target */
  public canTackle(targetPosition: Vector3): boolean {
    // Check late hit window
    if (this.whistleBlown) {
      const timeSinceWhistle = (performance.now() - this.whistleTime) / 1000;
      if (timeSinceWhistle > this.config.lateHitWindow) {
        return false;
      }
    }

    const distance = Vector3.Distance(this.position, targetPosition);
    return distance <= this.config.tackleRadius;
  }

  /** Calculate tackle impulse direction */
  public getTackleImpulse(targetPosition: Vector3): Vector3 {
    const direction = targetPosition.subtract(this.position).normalize();
    return direction.scale(this.config.tackleImpulse);
  }

  /** Mark whistle blown (play is dead) */
  public blowWhistle(): void {
    this.whistleBlown = true;
    this.whistleTime = performance.now();
  }

  /** Reset for new play */
  public resetForNewPlay(): void {
    this.velocity = Vector3.Zero();
    this.isTackling = false;
    this.tackleTimer = 0;
    this.whistleBlown = false;
    this.canAct = true;
    this.isActionPressed = false;
    this.inputState.actionHoldTime = 0;
  }

  /** Get current position */
  public getPosition(): Vector3 {
    return this.position.clone();
  }

  /** Set position (for teleporting/reset) */
  public setPosition(pos: Vector3): void {
    this.position = pos.clone();
  }

  /** Get current velocity */
  public getVelocity(): Vector3 {
    return this.velocity.clone();
  }

  /** Get facing rotation */
  public getRotation(): number {
    return this.rotation;
  }

  /** Get current stamina (0-100) */
  public getStamina(): number {
    return this.stamina;
  }

  /** Is turbo currently active */
  public isTurboOn(): boolean {
    return this.isTurboActive;
  }

  /** Get current input state */
  public getInputState(): InputState {
    return { ...this.inputState };
  }

  /** Is action button pressed */
  public isActionDown(): boolean {
    return this.inputState.action;
  }

  /** Get action hold time (for bullet pass) */
  public getActionHoldTime(): number {
    return this.inputState.actionHoldTime;
  }

  /** Get selected receiver index */
  public getSelectedReceiver(): number | null {
    return this.inputState.selectReceiver;
  }

  /** Is player currently tackling */
  public isTacklingNow(): boolean {
    return this.isTackling;
  }

  /** Update configuration */
  public updateConfig(config: Partial<PlayerControlConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Dispose input handlers */
  public dispose(): void {
    // Remove event listeners if needed
    // In a real implementation, we'd store references to remove them
    this.keysDown.clear();
  }
}

/**
 * Touch controls for mobile with visual feedback and haptics
 */
export class TouchController {
  private canvas: HTMLCanvasElement;
  private virtualJoystickCenter: { x: number; y: number } | null = null;
  private virtualJoystickCurrent: { x: number; y: number } | null = null;
  private virtualJoystickActive: boolean = false;
  private touchStartTime: number = 0;
  private actionTouchId: number | null = null;
  private joystickTouchId: number | null = null;

  // Visual elements
  private joystickOuter: HTMLDivElement | null = null;
  private joystickInner: HTMLDivElement | null = null;
  private actionButton: HTMLDivElement | null = null;
  private turboButton: HTMLDivElement | null = null;

  // Output state
  public moveX: number = 0;
  public moveZ: number = 0;
  public turbo: boolean = false;
  public action: boolean = false;
  public selectedReceiver: number | null = null;

  // Configuration
  private readonly JOYSTICK_SIZE = 120;
  private readonly JOYSTICK_INNER_SIZE = 50;
  private readonly BUTTON_SIZE = 80;
  private readonly HAPTIC_TAP = [10];
  private readonly HAPTIC_HEAVY = [30];
  private readonly HAPTIC_DOUBLE = [10, 50, 10];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.createVisualControls();
    this.setupTouchHandlers();
  }

  /** Create visual touch control overlays */
  private createVisualControls(): void {
    // Create container for touch controls
    const container = document.createElement('div');
    container.id = 'touchControls';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
      display: none;
    `;
    document.body.appendChild(container);

    // Virtual joystick outer ring
    this.joystickOuter = document.createElement('div');
    this.joystickOuter.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 40px;
      width: ${this.JOYSTICK_SIZE}px;
      height: ${this.JOYSTICK_SIZE}px;
      border-radius: 50%;
      border: 3px solid rgba(57, 255, 20, 0.5);
      background: rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      touch-action: none;
    `;
    container.appendChild(this.joystickOuter);

    // Virtual joystick inner knob
    this.joystickInner = document.createElement('div');
    this.joystickInner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${this.JOYSTICK_INNER_SIZE}px;
      height: ${this.JOYSTICK_INNER_SIZE}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(57, 255, 20, 0.8) 0%, rgba(57, 255, 20, 0.4) 100%);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 15px rgba(57, 255, 20, 0.6);
      transition: transform 0.05s ease-out;
    `;
    this.joystickOuter.appendChild(this.joystickInner);

    // Action button (throw/snap)
    this.actionButton = document.createElement('div');
    this.actionButton.style.cssText = `
      position: absolute;
      bottom: 100px;
      right: 40px;
      width: ${this.BUTTON_SIZE}px;
      height: ${this.BUTTON_SIZE}px;
      border-radius: 50%;
      border: 3px solid rgba(255, 110, 199, 0.6);
      background: rgba(255, 110, 199, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Russo One', sans-serif;
      font-size: 12px;
      color: white;
      text-transform: uppercase;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
    `;
    this.actionButton.textContent = 'THROW';
    container.appendChild(this.actionButton);

    // Turbo button
    this.turboButton = document.createElement('div');
    this.turboButton.style.cssText = `
      position: absolute;
      bottom: 200px;
      right: 40px;
      width: ${this.BUTTON_SIZE * 0.8}px;
      height: ${this.BUTTON_SIZE * 0.8}px;
      border-radius: 50%;
      border: 3px solid rgba(255, 215, 0, 0.6);
      background: rgba(255, 215, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Russo One', sans-serif;
      font-size: 10px;
      color: white;
      text-transform: uppercase;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
    `;
    this.turboButton.textContent = 'TURBO';
    container.appendChild(this.turboButton);

    // Show controls on mobile
    if ('ontouchstart' in window) {
      container.style.display = 'block';
    }
  }

  /** Trigger haptic feedback */
  private haptic(pattern: number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  private setupTouchHandlers(): void {
    // Joystick touch handlers
    this.joystickOuter?.addEventListener('touchstart', this.handleJoystickStart.bind(this), {
      passive: false,
    });
    this.joystickOuter?.addEventListener('touchmove', this.handleJoystickMove.bind(this), {
      passive: false,
    });
    this.joystickOuter?.addEventListener('touchend', this.handleJoystickEnd.bind(this), {
      passive: false,
    });
    this.joystickOuter?.addEventListener('touchcancel', this.handleJoystickEnd.bind(this), {
      passive: false,
    });

    // Action button handlers
    this.actionButton?.addEventListener('touchstart', this.handleActionStart.bind(this), {
      passive: false,
    });
    this.actionButton?.addEventListener('touchend', this.handleActionEnd.bind(this), {
      passive: false,
    });
    this.actionButton?.addEventListener('touchcancel', this.handleActionEnd.bind(this), {
      passive: false,
    });

    // Turbo button handlers
    this.turboButton?.addEventListener('touchstart', this.handleTurboStart.bind(this), {
      passive: false,
    });
    this.turboButton?.addEventListener('touchend', this.handleTurboEnd.bind(this), {
      passive: false,
    });
    this.turboButton?.addEventListener('touchcancel', this.handleTurboEnd.bind(this), {
      passive: false,
    });

    // Fallback: Canvas touch for areas without visual controls
    this.canvas.addEventListener('touchstart', this.handleCanvasTouch.bind(this), {
      passive: false,
    });
  }

  private handleJoystickStart(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;
    this.virtualJoystickActive = true;

    const rect = this.joystickOuter!.getBoundingClientRect();
    this.virtualJoystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    this.virtualJoystickCurrent = {
      x: touch.clientX,
      y: touch.clientY,
    };

    this.haptic(this.HAPTIC_TAP);
    this.updateJoystickVisual();
  }

  private handleJoystickMove(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId && this.virtualJoystickCenter) {
        this.virtualJoystickCurrent = {
          x: touch.clientX,
          y: touch.clientY,
        };

        const dx = touch.clientX - this.virtualJoystickCenter.x;
        const dy = touch.clientY - this.virtualJoystickCenter.y;

        const maxRadius = this.JOYSTICK_SIZE / 2 - this.JOYSTICK_INNER_SIZE / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 8) {
          // Dead zone
          const clampedDist = Math.min(distance, maxRadius);
          this.moveX = (dx / maxRadius) * Math.min(1, clampedDist / maxRadius);
          this.moveZ = (-dy / maxRadius) * Math.min(1, clampedDist / maxRadius); // Invert Y
        } else {
          this.moveX = 0;
          this.moveZ = 0;
        }

        this.updateJoystickVisual();
        break;
      }
    }
  }

  private handleJoystickEnd(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.virtualJoystickActive = false;
        this.moveX = 0;
        this.moveZ = 0;
        this.resetJoystickVisual();
        break;
      }
    }
  }

  private handleActionStart(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.action = true;
    this.touchStartTime = performance.now();
    this.actionTouchId = e.changedTouches[0].identifier;

    // Visual feedback
    if (this.actionButton) {
      this.actionButton.style.background = 'rgba(255, 110, 199, 0.7)';
      this.actionButton.style.boxShadow = '0 0 30px rgba(255, 110, 199, 0.8)';
      this.actionButton.style.transform = 'scale(0.95)';
    }

    this.haptic(this.HAPTIC_HEAVY);
  }

  private handleActionEnd(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.actionTouchId) {
        this.action = false;
        this.actionTouchId = null;

        // Reset visual
        if (this.actionButton) {
          this.actionButton.style.background = 'rgba(255, 110, 199, 0.3)';
          this.actionButton.style.boxShadow = 'none';
          this.actionButton.style.transform = 'scale(1)';
        }
        break;
      }
    }
  }

  private handleTurboStart(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.turbo = true;

    // Visual feedback
    if (this.turboButton) {
      this.turboButton.style.background = 'rgba(255, 215, 0, 0.6)';
      this.turboButton.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
      this.turboButton.style.transform = 'scale(0.95)';
    }

    this.haptic(this.HAPTIC_DOUBLE);
  }

  private handleTurboEnd(e: TouchEvent): void {
    e.preventDefault();

    this.turbo = false;

    // Reset visual
    if (this.turboButton) {
      this.turboButton.style.background = 'rgba(255, 215, 0, 0.2)';
      this.turboButton.style.boxShadow = 'none';
      this.turboButton.style.transform = 'scale(1)';
    }
  }

  private handleCanvasTouch(e: TouchEvent): void {
    // Only handle touches that aren't on the visual controls
    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    // If touch is in receiver selection area (top of screen), select receiver
    if (touch.clientY < 150) {
      const receiverIndex = Math.floor((x / rect.width) * 5);
      this.selectedReceiver = Math.min(4, Math.max(0, receiverIndex));
      this.haptic(this.HAPTIC_TAP);
    }
  }

  private updateJoystickVisual(): void {
    if (!this.joystickInner || !this.virtualJoystickCenter || !this.virtualJoystickCurrent) return;

    const maxOffset = (this.JOYSTICK_SIZE - this.JOYSTICK_INNER_SIZE) / 2;
    const dx = this.virtualJoystickCurrent.x - this.virtualJoystickCenter.x;
    const dy = this.virtualJoystickCurrent.y - this.virtualJoystickCenter.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(distance, maxOffset);
    const angle = Math.atan2(dy, dx);

    const offsetX = Math.cos(angle) * clampedDist;
    const offsetY = Math.sin(angle) * clampedDist;

    this.joystickInner.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;

    // Glow intensity based on distance
    const intensity = clampedDist / maxOffset;
    this.joystickInner.style.boxShadow = `0 0 ${15 + intensity * 20}px rgba(57, 255, 20, ${0.6 + intensity * 0.4})`;
  }

  private resetJoystickVisual(): void {
    if (this.joystickInner) {
      this.joystickInner.style.transform = 'translate(-50%, -50%)';
      this.joystickInner.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.6)';
    }
  }

  /** Get action hold time */
  public getActionHoldTime(): number {
    if (!this.action) return 0;
    return (performance.now() - this.touchStartTime) / 1000;
  }

  /** Get selected receiver and clear */
  public getSelectedReceiver(): number | null {
    const receiver = this.selectedReceiver;
    this.selectedReceiver = null;
    return receiver;
  }

  /** Show/hide touch controls */
  public setVisible(visible: boolean): void {
    const container = document.getElementById('touchControls');
    if (container) {
      container.style.display = visible ? 'block' : 'none';
    }
  }

  /** Trigger haptic for game events */
  public triggerHaptic(type: 'light' | 'heavy' | 'success' | 'error'): void {
    switch (type) {
      case 'light':
        this.haptic([10]);
        break;
      case 'heavy':
        this.haptic([50]);
        break;
      case 'success':
        this.haptic([20, 50, 30, 50, 40]);
        break;
      case 'error':
        this.haptic([100, 50, 100]);
        break;
    }
  }

  /** Cleanup */
  public dispose(): void {
    const container = document.getElementById('touchControls');
    if (container) {
      container.remove();
    }
  }
}
