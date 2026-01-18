/**
 * UI Sound Effects System - BlazeCraft
 *
 * Lightweight sound manager for UI interactions:
 * - Click, hover, error, complete sounds
 * - Volume control with mute toggle
 * - Respects user preference for reduced motion/sound
 * - Lazy-loads audio assets
 *
 * Sound generation uses Web Audio API for procedural tones
 * (no external audio files required).
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SoundType = 'click' | 'hover' | 'error' | 'complete' | 'notify';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  attack?: number;
  decay?: number;
}

// ─────────────────────────────────────────────────────────────
// Sound Configurations - Procedural tones
// ─────────────────────────────────────────────────────────────

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  click: {
    frequency: 800,
    duration: 0.05,
    type: 'square',
    volume: 0.15,
    attack: 0.005,
    decay: 0.03,
  },
  hover: {
    frequency: 600,
    duration: 0.03,
    type: 'sine',
    volume: 0.08,
    attack: 0.01,
    decay: 0.02,
  },
  error: {
    frequency: 200,
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.2,
    attack: 0.01,
    decay: 0.15,
  },
  complete: {
    frequency: 523.25, // C5
    duration: 0.3,
    type: 'sine',
    volume: 0.2,
    attack: 0.02,
    decay: 0.25,
  },
  notify: {
    frequency: 440,
    duration: 0.15,
    type: 'triangle',
    volume: 0.15,
    attack: 0.01,
    decay: 0.1,
  },
};

// ─────────────────────────────────────────────────────────────
// Sound Manager Class
// ─────────────────────────────────────────────────────────────

class UISoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted = false;
  private masterVolume = 0.5;
  private isInitialized = false;

  /**
   * Initialize audio context on first user interaction
   * (required by browser autoplay policies)
   */
  init(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new AudioContext();
      this.isInitialized = true;
    } catch (err) {
      console.warn('[UI SFX] Failed to initialize AudioContext:', err);
    }
  }

  /**
   * Check if user prefers reduced motion (implies reduced sound)
   */
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Play a procedurally generated tone
   */
  private playTone(config: SoundConfig): void {
    if (!this.audioContext || this.isMuted || this.prefersReducedMotion()) {
      return;
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const { frequency, duration, type, volume, attack = 0.01, decay = 0.1 } = config;
    const now = this.audioContext.currentTime;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Create gain node for envelope
    const gainNode = this.audioContext.createGain();
    const adjustedVolume = volume * this.masterVolume;

    // ADSR-like envelope (Attack-Decay only for short sounds)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Play a specific UI sound
   */
  play(sound: SoundType): void {
    if (!this.isInitialized) {
      this.init();
    }

    const config = SOUND_CONFIGS[sound];
    if (config) {
      this.playTone(config);
    }
  }

  /**
   * Play a two-note "complete" chime (C5 → E5)
   */
  playCompleteChime(): void {
    if (!this.audioContext || this.isMuted || this.prefersReducedMotion()) {
      return;
    }

    // First note
    this.play('complete');

    // Second note (E5, 329.63Hz) slightly delayed
    setTimeout(() => {
      this.playTone({
        frequency: 659.25, // E5
        duration: 0.25,
        type: 'sine',
        volume: 0.18,
        attack: 0.02,
        decay: 0.2,
      });
    }, 150);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Set mute state directly
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Check if muted
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Clean up audio context
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton instance
// ─────────────────────────────────────────────────────────────

export const uiSfx = new UISoundManager();

// ─────────────────────────────────────────────────────────────
// Convenience functions
// ─────────────────────────────────────────────────────────────

export function playClick(): void {
  uiSfx.play('click');
}

export function playHover(): void {
  uiSfx.play('hover');
}

export function playError(): void {
  uiSfx.play('error');
}

export function playComplete(): void {
  uiSfx.play('complete');
}

export function playNotify(): void {
  uiSfx.play('notify');
}

export function playCompleteChime(): void {
  uiSfx.playCompleteChime();
}

export function initSound(): void {
  uiSfx.init();
}

export function toggleMute(): boolean {
  return uiSfx.toggleMute();
}

export function setVolume(volume: number): void {
  uiSfx.setVolume(volume);
}
