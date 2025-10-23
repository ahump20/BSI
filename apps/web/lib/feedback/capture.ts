/**
 * Video and Audio Capture Module
 *
 * Handles MediaStream API for camera/microphone access,
 * frame extraction, audio processing, and WebSocket streaming
 */

export interface CaptureConfig {
  video: {
    enabled: boolean;
    width: number;
    height: number;
    frameRate: number;
    facingMode?: 'user' | 'environment';
  };
  audio: {
    enabled: boolean;
    sampleRate: number;
    channelCount: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
  };
}

export interface CaptureCallbacks {
  onFrame?: (frameData: Blob, timestamp: number) => void;
  onAudioChunk?: (audioData: Float32Array, timestamp: number) => void;
  onError?: (error: Error) => void;
  onStreamStarted?: () => void;
  onStreamStopped?: () => void;
}

export class MediaCapture {
  private config: CaptureConfig;
  private callbacks: CaptureCallbacks;

  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;

  private audioContext: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioWorklet: AudioWorkletNode | null = null;

  private frameInterval: number | null = null;
  private isCapturing: boolean = false;
  private frameNumber: number = 0;

  constructor(config: CaptureConfig, callbacks: CaptureCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Initialize and start media capture
   */
  async start(): Promise<void> {
    try {
      // Request media permissions
      const constraints: MediaStreamConstraints = {
        video: this.config.video.enabled ? {
          width: { ideal: this.config.video.width },
          height: { ideal: this.config.video.height },
          frameRate: { ideal: this.config.video.frameRate },
          facingMode: this.config.video.facingMode || 'user'
        } : false,
        audio: this.config.audio.enabled ? {
          sampleRate: this.config.audio.sampleRate,
          channelCount: this.config.audio.channelCount,
          echoCancellation: this.config.audio.echoCancellation,
          noiseSuppression: this.config.audio.noiseSuppression,
          autoGainControl: true
        } : false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Setup video capture
      if (this.config.video.enabled) {
        await this.setupVideoCapture();
      }

      // Setup audio capture
      if (this.config.audio.enabled) {
        await this.setupAudioCapture();
      }

      this.isCapturing = true;
      this.callbacks.onStreamStarted?.();

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Stop media capture and cleanup resources
   */
  stop(): void {
    this.isCapturing = false;

    // Stop frame capture
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Stop audio processing
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet = null;
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.callbacks.onStreamStopped?.();
  }

  /**
   * Setup video capture with canvas for frame extraction
   */
  private async setupVideoCapture(): Promise<void> {
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;

    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      if (this.videoElement) {
        this.videoElement.onloadedmetadata = () => resolve();
      }
    });

    // Create canvas for frame extraction
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = this.config.video.width;
    this.canvasElement.height = this.config.video.height;
    this.canvasContext = this.canvasElement.getContext('2d');

    // Start frame capture
    const frameIntervalMs = 1000 / this.config.video.frameRate;
    this.frameInterval = window.setInterval(() => {
      this.captureFrame();
    }, frameIntervalMs);
  }

  /**
   * Capture a single frame from video
   */
  private captureFrame(): void {
    if (!this.isCapturing || !this.videoElement || !this.canvasElement || !this.canvasContext) {
      return;
    }

    try {
      // Draw video frame to canvas
      this.canvasContext.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Convert to blob (JPEG)
      this.canvasElement.toBlob((blob) => {
        if (blob && this.callbacks.onFrame) {
          const timestamp = Date.now();
          this.callbacks.onFrame(blob, timestamp);
        }
      }, 'image/jpeg', 0.85);

      this.frameNumber++;

    } catch (error) {
      console.error('Frame capture error:', error);
    }
  }

  /**
   * Setup audio capture with Web Audio API
   */
  private async setupAudioCapture(): Promise<void> {
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: this.config.audio.sampleRate
    });

    // Create source from media stream
    this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream!);

    // Try to use AudioWorklet for better performance (if available)
    if (this.audioContext.audioWorklet) {
      try {
        await this.setupAudioWorklet();
        return;
      } catch (error) {
        console.warn('AudioWorklet not available, falling back to ScriptProcessor');
      }
    }

    // Fallback to ScriptProcessor
    this.setupScriptProcessor();
  }

  /**
   * Setup AudioWorklet for audio processing (modern approach)
   */
  private async setupAudioWorklet(): Promise<void> {
    if (!this.audioContext || !this.audioSource) {
      throw new Error('Audio context not initialized');
    }

    // Load audio worklet processor
    // Note: In production, you'd load this from a separate file
    const audioWorkletCode = `
      class AudioCaptureProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.chunkSize = 4096;
          this.buffer = new Float32Array(this.chunkSize);
          this.bufferIndex = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const channel = input[0];

            for (let i = 0; i < channel.length; i++) {
              this.buffer[this.bufferIndex++] = channel[i];

              if (this.bufferIndex >= this.chunkSize) {
                // Send chunk to main thread
                this.port.postMessage({
                  type: 'audioChunk',
                  data: this.buffer.slice(0),
                  timestamp: currentTime
                });

                this.bufferIndex = 0;
              }
            }
          }

          return true;
        }
      }

      registerProcessor('audio-capture-processor', AudioCaptureProcessor);
    `;

    // Create blob URL for worklet
    const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    await this.audioContext.audioWorklet.addModule(workletUrl);

    // Create worklet node
    this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

    // Listen for audio chunks
    this.audioWorklet.port.onmessage = (event) => {
      if (event.data.type === 'audioChunk') {
        this.callbacks.onAudioChunk?.(event.data.data, event.data.timestamp * 1000);
      }
    };

    // Connect nodes
    this.audioSource.connect(this.audioWorklet);
    this.audioWorklet.connect(this.audioContext.destination);

    URL.revokeObjectURL(workletUrl);
  }

  /**
   * Setup ScriptProcessor for audio processing (legacy fallback)
   */
  private setupScriptProcessor(): void {
    if (!this.audioContext || !this.audioSource) {
      throw new Error('Audio context not initialized');
    }

    const bufferSize = 4096;
    this.audioProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.audioProcessor.onaudioprocess = (event) => {
      if (!this.isCapturing) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const timestamp = Date.now();

      // Convert to Float32Array and send
      const audioChunk = new Float32Array(inputData);
      this.callbacks.onAudioChunk?.(audioChunk, timestamp);
    };

    // Connect nodes
    this.audioSource.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }

  /**
   * Get current video element for preview
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Get current frame number
   */
  getFrameNumber(): number {
    return this.frameNumber;
  }

  /**
   * Check if currently capturing
   */
  isActive(): boolean {
    return this.isCapturing;
  }

  /**
   * Take a snapshot of current frame
   */
  async takeSnapshot(): Promise<Blob | null> {
    if (!this.canvasElement) {
      return null;
    }

    return new Promise((resolve) => {
      this.canvasElement!.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  }

  /**
   * Get available devices
   */
  static async getDevices(): Promise<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      videoDevices: devices.filter(d => d.kind === 'videoinput'),
      audioDevices: devices.filter(d => d.kind === 'audioinput')
    };
  }

  /**
   * Check if browser supports required APIs
   */
  static isSupported(): {
    supported: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      missing.push('getUserMedia');
    }

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missing.push('AudioContext');
    }

    if (!HTMLCanvasElement.prototype.toBlob) {
      missing.push('Canvas.toBlob');
    }

    return {
      supported: missing.length === 0,
      missing
    };
  }
}

/**
 * Default capture configuration
 */
export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  video: {
    enabled: true,
    width: 1280,
    height: 720,
    frameRate: 30,
    facingMode: 'user'
  },
  audio: {
    enabled: true,
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
};

/**
 * Lightweight capture configuration (for lower-end devices)
 */
export const LIGHTWEIGHT_CAPTURE_CONFIG: CaptureConfig = {
  video: {
    enabled: true,
    width: 640,
    height: 480,
    frameRate: 15,
    facingMode: 'user'
  },
  audio: {
    enabled: true,
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
};
