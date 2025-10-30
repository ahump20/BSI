/**
 * WebSocket Client for Real-Time Feedback Streaming
 *
 * Manages WebSocket connection, sends video/audio data,
 * and receives real-time feedback
 */

export interface FeedbackScores {
  confidence: number;
  engagement: number;
  clarity: number;
  authenticity: number;
  professionalPresence: number;
}

export interface FeedbackMetrics {
  facial?: any;
  body?: any;
  voice?: any;
  speech?: any;
}

export interface FeedbackSuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  improvement: string;
  triggerMetric?: string;
  triggerValue?: number;
  targetValue?: number;
}

export interface FeedbackTrends {
  confidenceDelta: number;
  engagementDelta: number;
  clarityDelta: number;
}

export interface FeedbackMessage {
  type: 'feedback' | 'error' | 'ack' | 'connected';
  timestamp_ms?: number;
  session_id?: string;
  scores?: FeedbackScores;
  metrics?: FeedbackMetrics;
  suggestions?: FeedbackSuggestion[];
  trends?: FeedbackTrends;
  message?: string;
}

export interface WebSocketClientCallbacks {
  onFeedback?: (feedback: FeedbackMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export class FeedbackWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private callbacks: WebSocketClientCallbacks;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: number | null = null;
  private isIntentionallyClosed: boolean = false;

  constructor(
    sessionId: string,
    callbacks: WebSocketClientCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.callbacks = callbacks;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(wsUrl?: string): Promise<void> {
    const url = wsUrl || this.getDefaultWebSocketUrl();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          const err = new Error('WebSocket connection error');
          this.callbacks.onError?.(err);
          reject(err);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.stopHeartbeat();
          this.callbacks.onDisconnected?.();

          // Attempt reconnection unless intentionally closed
          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);

            setTimeout(() => {
              this.connect(url);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.callbacks.onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send video frame to server
   */
  async sendFrame(frameBlob: Blob, timestamp: number, frameNumber?: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    // Convert blob to base64
    const base64Data = await this.blobToBase64(frameBlob);

    const message = {
      type: 'frame',
      timestamp_ms: timestamp,
      frame_number: frameNumber,
      data: base64Data
    };

    this.send(message);
  }

  /**
   * Send audio chunk to server
   */
  sendAudio(audioData: Float32Array, timestamp: number, sampleRate: number = 16000): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    // Convert Float32Array to base64
    const buffer = audioData.buffer as ArrayBuffer;
    const base64Data = this.arrayBufferToBase64(buffer);

    const message = {
      type: 'audio',
      timestamp_ms: timestamp,
      sample_rate: sampleRate,
      data: base64Data
    };

    this.send(message);
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      return;
    }

    const message = {
      type: 'heartbeat',
      timestamp_ms: Date.now()
    };

    this.send(message);
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message from server
   */
  private handleMessage(data: string): void {
    try {
      const message: FeedbackMessage = JSON.parse(data);

      switch (message.type) {
        case 'feedback':
          this.callbacks.onFeedback?.(message);
          break;

        case 'connected':
          console.log('Server acknowledged connection:', message.message);
          break;

        case 'ack':
          // Heartbeat acknowledgment
          break;

        case 'error':
          console.error('Server error:', message.message);
          this.callbacks.onError?.(new Error(message.message || 'Server error'));
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }

    } catch (error) {
      console.error('Error parsing message:', error);
      this.callbacks.onError?.(new Error('Failed to parse server message'));
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, 5000); // Send heartbeat every 5 seconds
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get default WebSocket URL based on environment
   */
  private getDefaultWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    return `${protocol}//${host}/api/v1/feedback/stream/${this.sessionId}`;
  }

  /**
   * Convert Blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    sessionId: string;
  } {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      sessionId: this.sessionId
    };
  }
}

/**
 * Create and connect feedback WebSocket client
 */
export async function createFeedbackWebSocket(
  sessionId: string,
  callbacks: WebSocketClientCallbacks = {},
  wsUrl?: string
): Promise<FeedbackWebSocketClient> {
  const client = new FeedbackWebSocketClient(sessionId, callbacks);
  await client.connect(wsUrl);
  return client;
}
