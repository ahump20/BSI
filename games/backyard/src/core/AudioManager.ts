/**
 * Blaze Backyard Baseball - Audio Manager
 * Handles all game audio: music, SFX, crowd ambience
 * Mobile-friendly with user interaction requirement
 */

import { Sound, Scene } from '@babylonjs/core';

/** Audio configuration */
interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
}

/** SFX types available */
type SFXType =
  | 'bat_crack'
  | 'bat_miss'
  | 'ball_catch'
  | 'crowd_cheer'
  | 'crowd_gasp'
  | 'crowd_ambient'
  | 'home_run'
  | 'strike'
  | 'out'
  | 'game_start'
  | 'game_over'
  | 'pitch_throw'
  | 'ball_hit_ground'
  | 'single'
  | 'double'
  | 'triple';

/** Default audio config */
const DEFAULT_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.8,
  ambientVolume: 0.3,
};

/**
 * AudioManager - Handles all game audio
 * Uses Web Audio API via Babylon.js Sound class
 */
export class AudioManager {
  private scene: Scene;
  private config: AudioConfig;
  private isUnlocked: boolean = false;

  // Sound instances
  private backgroundMusic: Sound | null = null;
  private crowdAmbient: Sound | null = null;
  private sfxSounds: Map<SFXType, Sound> = new Map();

  // Synthesized audio (no external files needed)
  private audioContext: AudioContext | null = null;

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
      case 'bat_crack':
        this.playBatCrack(volume);
        break;
      case 'bat_miss':
        this.playBatMiss(volume);
        break;
      case 'ball_catch':
        this.playBallCatch(volume);
        break;
      case 'crowd_cheer':
        this.playCrowdCheer(volume);
        break;
      case 'crowd_gasp':
        this.playCrowdGasp(volume);
        break;
      case 'home_run':
        this.playHomeRun(volume);
        break;
      case 'strike':
        this.playStrike(volume);
        break;
      case 'out':
        this.playOut(volume);
        break;
      case 'game_start':
        this.playGameStart(volume);
        break;
      case 'game_over':
        this.playGameOver(volume);
        break;
      case 'pitch_throw':
        this.playPitchThrow(volume);
        break;
      case 'single':
      case 'double':
      case 'triple':
        this.playHitCheer(volume, type);
        break;
      default:
        break;
    }
  }

  /** Bat crack - sharp attack, quick decay */
  private playBatCrack(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Impact noise burst
    const noiseBuffer = this.createNoiseBuffer(0.08);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Filter for "crack" character
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 2;

    // Sharp envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Low "thud" component
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.6, now);
    oscGain.gain.exponentialDecayTo(0.001, now + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Bat miss - whoosh sound */
  private playBatMiss(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.15);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(400, now + 0.15);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.03);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Ball catch - soft thud */
  private playBallCatch(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.06);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialDecayTo(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Crowd cheer - layered noise with modulation */
  private playCrowdCheer(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const duration = 1.5;

    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Filter for "voice-like" quality
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

    // Envelope
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

  /** Home run fanfare */
  private playHomeRun(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Triumphant chord progression
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    const delays = [0, 0.1, 0.2, 0.3];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + delays[i] + 0.05);
      gain.gain.exponentialDecayTo(0.001, now + delays[i] + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 1);
    });

    // Add crowd cheer on top
    setTimeout(() => this.playCrowdCheer(volume * 1.2), 200);
  }

  /** Strike sound - umpire-like */
  private playStrike(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Out sound - descending tone */
  private playOut(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // Crowd gasp
    this.playCrowdGasp(volume * 0.5);
  }

  /** Game start jingle */
  private playGameStart(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Quick ascending arpeggio
    const notes = [261.63, 329.63, 392.0, 523.25, 659.26];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.02);
      gain.gain.exponentialDecayTo(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /** Game over sound */
  private playGameOver(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Descending melody
    const notes = [523.25, 392.0, 329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.25;
      gain.gain.setValueAtTime(volume * 0.25, startTime);
      gain.gain.exponentialDecayTo(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  /** Pitch throw whoosh */
  private playPitchThrow(volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.2);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.2);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Hit cheer - scaled by hit type */
  private playHitCheer(volume: number, type: 'single' | 'double' | 'triple'): void {
    const intensityMap = { single: 0.5, double: 0.7, triple: 0.9 };
    const intensity = intensityMap[type];
    this.playCrowdCheer(volume * intensity);
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
    const bufferSize = ctx.sampleRate * 2; // 2 second loop
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
    gain.gain.value = volume * 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    // Store reference for cleanup
    (this as any)._ambientNoise = noise;
    (this as any)._ambientLfo = lfo;
  }

  /** Stop ambient crowd */
  public stopAmbientCrowd(): void {
    if ((this as any)._ambientNoise) {
      (this as any)._ambientNoise.stop();
      (this as any)._ambientNoise = null;
    }
    if ((this as any)._ambientLfo) {
      (this as any)._ambientLfo.stop();
      (this as any)._ambientLfo = null;
    }
  }

  /** Set master volume */
  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /** Set music volume */
  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.config.masterVolume * this.config.musicVolume);
    }
  }

  /** Set SFX volume */
  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /** Cleanup */
  public dispose(): void {
    this.stopAmbientCrowd();
    this.backgroundMusic?.dispose();
    this.crowdAmbient?.dispose();
    this.sfxSounds.forEach((sound) => sound.dispose());
    this.sfxSounds.clear();

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

AudioParam.prototype.exponentialDecayTo = function (value: number, endTime: number): void {
  // exponentialRampToValueAtTime can't go to 0, so use small value
  this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};
