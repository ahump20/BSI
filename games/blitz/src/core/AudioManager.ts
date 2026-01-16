/**
 * Blaze Blitz Football - Audio Manager
 * Handles all game audio: music, SFX, crowd ambience
 * Mobile-friendly with user interaction requirement
 */

import { Scene } from '@babylonjs/core';

/** Audio configuration */
interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
}

/** SFX types available for football */
type SFXType =
  | 'snap'
  | 'tackle'
  | 'tackle_big'
  | 'catch'
  | 'incomplete'
  | 'whistle'
  | 'crowd_cheer'
  | 'crowd_gasp'
  | 'crowd_ambient'
  | 'touchdown'
  | 'first_down'
  | 'turbo_boost'
  | 'game_start'
  | 'game_over'
  | 'pass_throw'
  | 'hit_impact'
  | 'fumble'
  | 'stiff_arm'
  | 'juke';

/** Default audio config */
const DEFAULT_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.8,
  ambientVolume: 0.3,
};

/**
 * AudioManager - Handles all game audio for Blitz Football
 * Uses Web Audio API for procedurally generated sounds
 */
export class AudioManager {
  private scene: Scene;
  private config: AudioConfig;
  private isUnlocked: boolean = false;

  // Synthesized audio (no external files needed)
  private audioContext: AudioContext | null = null;

  // Ambient sound references
  private _ambientNoise: AudioBufferSourceNode | null = null;
  private _ambientLfo: OscillatorNode | null = null;

  constructor(scene: Scene, config: Partial<AudioConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initAudioContext();
  }

  /** Initialize Web Audio context */
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /** Unlock audio (required for mobile) - call on first user interaction */
  public async unlock(): Promise<void> {
    if (this.isUnlocked) return;

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Play silent buffer to unlock
    if (this.audioContext) {
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }

    this.isUnlocked = true;
  }

  /** Check if audio is unlocked */
  public get unlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Play a synthesized sound effect
   * Uses Web Audio API to generate sounds procedurally
   */
  public playSFX(type: SFXType): void {
    if (!this.audioContext || !this.isUnlocked) return;

    const volume = this.config.masterVolume * this.config.sfxVolume;

    switch (type) {
      case 'snap':
        this.playSnap(volume);
        break;
      case 'tackle':
        this.playTackle(volume);
        break;
      case 'tackle_big':
        this.playBigTackle(volume);
        break;
      case 'catch':
        this.playCatch(volume);
        break;
      case 'incomplete':
        this.playIncomplete(volume);
        break;
      case 'whistle':
        this.playWhistle(volume);
        break;
      case 'crowd_cheer':
        this.playCrowdCheer(volume);
        break;
      case 'crowd_gasp':
        this.playCrowdGasp(volume);
        break;
      case 'touchdown':
        this.playTouchdown(volume);
        break;
      case 'first_down':
        this.playFirstDown(volume);
        break;
      case 'turbo_boost':
        this.playTurboBoost(volume);
        break;
      case 'game_start':
        this.playGameStart(volume);
        break;
      case 'game_over':
        this.playGameOver(volume);
        break;
      case 'pass_throw':
        this.playPassThrow(volume);
        break;
      case 'hit_impact':
        this.playHitImpact(volume);
        break;
      case 'fumble':
        this.playFumble(volume);
        break;
      case 'stiff_arm':
        this.playStiffArm(volume);
        break;
      case 'juke':
        this.playJuke(volume);
        break;
      default:
        break;
    }
  }

  /** Ball snap - quick leather pop */
  private playSnap(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Quick burst
    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Standard tackle impact */
  private playTackle(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Impact noise
    const noiseBuffer = this.createNoiseBuffer(0.12);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Low thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.5, now);
    oscGain.gain.exponentialDecayTo(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Big hit tackle - more impactful */
  private playBigTackle(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Heavy impact
    const noiseBuffer = this.createNoiseBuffer(0.2);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Deep bass thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.7, now);
    oscGain.gain.exponentialDecayTo(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Add crowd gasp
    setTimeout(() => this.playCrowdGasp(volume * 0.5), 100);
  }

  /** Ball catch - leather thud */
  private playCatch(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.06);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Incomplete pass */
  private playIncomplete(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Soft thud as ball hits ground
    const noiseBuffer = this.createNoiseBuffer(0.08);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Crowd disappointment
    setTimeout(() => this.playCrowdGasp(volume * 0.3), 50);
  }

  /** Referee whistle */
  private playWhistle(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // High pitched whistle
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.setValueAtTime(2800, now + 0.1);
    osc.frequency.setValueAtTime(3000, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
    gain.gain.setValueAtTime(volume * 0.3, now + 0.25);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Crowd cheer - layered noise with modulation */
  private playCrowdCheer(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const duration = 1.5;

    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;

    // Modulation for "crowd wave" effect
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    lfo.stop(now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.2);
    gain.gain.setValueAtTime(volume * 0.5, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Crowd gasp - quick intake */
  private playCrowdGasp(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.4);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Touchdown fanfare */
  private playTouchdown(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Triumphant chord
    const notes = [261.63, 329.63, 392.0, 523.25, 659.26];
    const delays = [0, 0.05, 0.1, 0.15, 0.2];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + delays[i] + 0.05);
      gain.gain.exponentialDecayTo(0.001, now + delays[i] + 1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 1.2);
    });

    // Big crowd cheer
    setTimeout(() => this.playCrowdCheer(volume * 1.5), 150);
  }

  /** First down sound */
  private playFirstDown(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Quick ascending arpeggio
    const notes = [392.0, 493.88, 587.33];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(volume * 0.2, startTime);
      gain.gain.exponentialDecayTo(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  /** Turbo boost activation */
  private playTurboBoost(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Whoosh sound
    const noiseBuffer = this.createNoiseBuffer(0.15);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.15);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Game start sound */
  private playGameStart(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Horn-like sound
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.1);
    gain.gain.setValueAtTime(volume * 0.4, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);

    // Quick crowd roar
    setTimeout(() => this.playCrowdCheer(volume * 0.5), 200);
  }

  /** Game over sound */
  private playGameOver(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Final horn
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  }

  /** Pass throw whoosh */
  private playPassThrow(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.2);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1500, now + 0.2);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Hit impact - for collisions */
  private playHitImpact(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.08);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Fumble sound */
  private playFumble(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Descending tone
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Crowd gasp
    this.playCrowdGasp(volume * 0.6);
  }

  /** Stiff arm success */
  private playStiffArm(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Quick impact
    const noiseBuffer = this.createNoiseBuffer(0.06);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Juke move success */
  private playJuke(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Quick swoosh
    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1500, now + 0.1);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Create white noise buffer */
  private createNoiseBuffer(duration: number): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /** Start ambient crowd noise loop */
  public startAmbientCrowd(): void {
    if (!this.audioContext || !this.isUnlocked) return;

    const ctx = this.audioContext;
    const volume = this.config.masterVolume * this.config.ambientVolume;

    // Create continuous filtered noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.3;

    // Subtle modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this._ambientNoise = noise;
    this._ambientLfo = lfo;
  }

  /** Stop ambient crowd */
  public stopAmbientCrowd(): void {
    if (this._ambientNoise) {
      this._ambientNoise.stop();
      this._ambientNoise = null;
    }
    if (this._ambientLfo) {
      this._ambientLfo.stop();
      this._ambientLfo = null;
    }
  }

  /** Set master volume */
  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /** Set SFX volume */
  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /** Cleanup */
  public dispose(): void {
    this.stopAmbientCrowd();
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
  }
}

// Add exponentialDecayTo helper to GainNode
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

if (!AudioParam.prototype.exponentialDecayTo) {
  AudioParam.prototype.exponentialDecayTo = function (value: number, endTime: number): void {
    this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
  };
}
