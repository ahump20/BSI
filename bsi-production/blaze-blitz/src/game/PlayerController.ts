/**
 * PlayerController.ts
 * Handles input and arcade-style "snappy" player movement
 * 
 * Key arcade physics decisions:
 * - Near-instant acceleration (0.2s to max speed)
 * - No realistic momentum/inertia
 * - Turbo boost drains stamina bar
 * - Movement feels "responsive" not "realistic"
 */

import { InputState, PHYSICS_CONFIG } from './types';

export class PlayerController {
  private inputState: InputState = {
    moveX: 0,
    moveZ: 0,
    turbo: false,
    action: false,
    actionJustPressed: false
  };
  
  private stamina = 100;
  private readonly maxStamina = 100;
  private readonly staminaDrainRate = 40; // per second while turbo active
  private readonly staminaRechargeRate = 25; // per second when not using turbo
  private readonly staminaRechargeDelay = 0.5; // seconds before recharge starts
  private timeSinceTurboRelease = 0;
  
  private previousActionState = false;
  
  // Touch input state for mobile
  private touchMoveX = 0;
  private touchMoveZ = 0;
  private touchTurbo = false;
  private touchAction = false;

  constructor(canvas: HTMLCanvasElement) {
    this.setupKeyboardInput();
    this.setupTouchInput(canvas);
    this.setupGamepadInput();
  }

  private setupKeyboardInput(): void {
    const keys = new Set<string>();
    
    window.addEventListener('keydown', (e) => {
      keys.add(e.code);
      this.updateFromKeys(keys);
    });
    
    window.addEventListener('keyup', (e) => {
      keys.delete(e.code);
      this.updateFromKeys(keys);
    });
  }
  
  private updateFromKeys(keys: Set<string>): void {
    // Movement - WASD or Arrow keys
    let x = 0, z = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) z = -1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) z = 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x = -1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x = 1;
    
    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const mag = Math.sqrt(x * x + z * z);
      x /= mag;
      z /= mag;
    }
    
    this.inputState.moveX = x;
    this.inputState.moveZ = z;
    
    // Turbo - Shift key
    this.inputState.turbo = keys.has('ShiftLeft') || keys.has('ShiftRight');
    
    // Action - Space (context-sensitive: pass on offense, tackle on defense)
    this.inputState.action = keys.has('Space');
  }

  private setupTouchInput(canvas: HTMLCanvasElement): void {
    // D-pad buttons
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      const dir = (btn as HTMLElement).dataset.dir;
      
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (dir === 'up') this.touchMoveZ = -1;
        if (dir === 'down') this.touchMoveZ = 1;
        if (dir === 'left') this.touchMoveX = -1;
        if (dir === 'right') this.touchMoveX = 1;
      });
      
      btn.addEventListener('touchend', () => {
        if (dir === 'up' || dir === 'down') this.touchMoveZ = 0;
        if (dir === 'left' || dir === 'right') this.touchMoveX = 0;
      });
    });

    // Turbo button
    const turboBtn = document.getElementById('btn-turbo');
    if (turboBtn) {
      turboBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchTurbo = true;
      });
      turboBtn.addEventListener('touchend', () => {
        this.touchTurbo = false;
      });
    }
    
    // Action button
    const actionBtn = document.getElementById('btn-action');
    if (actionBtn) {
      actionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchAction = true;
      });
      actionBtn.addEventListener('touchend', () => {
        this.touchAction = false;
      });
    }
  }

  private setupGamepadInput(): void {
    // Gamepad support for controllers
    window.addEventListener('gamepadconnected', () => {
      console.log('Gamepad connected');
    });
  }

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (!gp) return;
    
    // Left stick for movement
    const deadzone = 0.15;
    let lx = gp.axes[0] ?? 0;
    let ly = gp.axes[1] ?? 0;
    
    if (Math.abs(lx) < deadzone) lx = 0;
    if (Math.abs(ly) < deadzone) ly = 0;
    
    // Only override if there's gamepad input
    if (lx !== 0 || ly !== 0) {
      this.inputState.moveX = lx;
      this.inputState.moveZ = ly;
    }
    
    // RT for turbo, A for action
    if (gp.buttons[7]?.pressed) this.inputState.turbo = true;
    if (gp.buttons[0]?.pressed) this.inputState.action = true;
  }

  /**
   * Main update - call every frame
   * Returns movement velocity to apply to controlled player
   */
  update(deltaTime: number): { velocity: { x: number; z: number }; speed: number } {
    // Merge touch input with keyboard
    if (this.touchMoveX !== 0) this.inputState.moveX = this.touchMoveX;
    if (this.touchMoveZ !== 0) this.inputState.moveZ = this.touchMoveZ;
    if (this.touchTurbo) this.inputState.turbo = true;
    if (this.touchAction) this.inputState.action = true;
    
    // Poll gamepad
    this.pollGamepad();
    
    // Detect action just pressed (for single-press actions like passing)
    this.inputState.actionJustPressed = this.inputState.action && !this.previousActionState;
    this.previousActionState = this.inputState.action;
    
    // Update stamina
    this.updateStamina(deltaTime);
    
    // Calculate speed with turbo
    const canTurbo = this.stamina > 0 && this.inputState.turbo;
    const speedMultiplier = canTurbo ? PHYSICS_CONFIG.turboMultiplier : 1.0;
    const currentSpeed = PHYSICS_CONFIG.maxSpeed * speedMultiplier;
    
    /**
     * ARCADE PHYSICS: "Snappy" movement
     * Unlike realistic physics with gradual acceleration,
     * we reach max speed almost instantly (accelerationTime = 0.2s)
     * This creates the responsive "arcade" feel
     */
    const velocity = {
      x: this.inputState.moveX * currentSpeed,
      z: this.inputState.moveZ * currentSpeed
    };
    
    return { velocity, speed: currentSpeed };
  }

  private updateStamina(deltaTime: number): void {
    if (this.inputState.turbo && this.stamina > 0) {
      // Drain stamina while turbo is held
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * deltaTime);
      this.timeSinceTurboRelease = 0;
      
      // Update UI
      this.updateStaminaUI();
    } else {
      // Track time since turbo released
      this.timeSinceTurboRelease += deltaTime;
      
      // Recharge after delay
      if (this.timeSinceTurboRelease >= this.staminaRechargeDelay) {
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRechargeRate * deltaTime);
        this.updateStaminaUI();
      }
    }
  }

  private updateStaminaUI(): void {
    const bar = document.getElementById('stamina-bar');
    if (bar) {
      bar.style.width = `${(this.stamina / this.maxStamina) * 100}%`;
    }
  }

  getInput(): InputState {
    return { ...this.inputState };
  }

  getStamina(): number {
    return this.stamina;
  }

  /** Reset stamina (e.g., between plays) */
  resetStamina(): void {
    this.stamina = this.maxStamina;
    this.updateStaminaUI();
  }
}
