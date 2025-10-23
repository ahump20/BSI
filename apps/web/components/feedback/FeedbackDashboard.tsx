'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaCapture, DEFAULT_CAPTURE_CONFIG, CaptureConfig } from '@/lib/feedback/capture';
import {
  FeedbackWebSocketClient,
  createFeedbackWebSocket,
  FeedbackMessage,
  FeedbackScores,
  FeedbackSuggestion
} from '@/lib/feedback/websocket-client';

interface FeedbackDashboardProps {
  sessionId: string;
  userId: string;
  onSessionEnd?: (summary: any) => void;
  captureConfig?: CaptureConfig;
}

export default function FeedbackDashboard({
  sessionId,
  userId,
  onSessionEnd,
  captureConfig = DEFAULT_CAPTURE_CONFIG
}: FeedbackDashboardProps) {
  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scores, setScores] = useState<FeedbackScores>({
    confidence: 0,
    engagement: 0,
    clarity: 0,
    authenticity: 0,
    professionalPresence: 0
  });

  const [suggestions, setSuggestions] = useState<FeedbackSuggestion[]>([]);
  const [trends, setTrends] = useState({ confidenceDelta: 0, engagementDelta: 0, clarityDelta: 0 });
  const [stats, setStats] = useState({ framesProcessed: 0, audioChunksProcessed: 0 });

  // Refs
  const videoPreviewRef = useRef<HTMLDivElement>(null);
  const mediaCaptureRef = useRef<MediaCapture | null>(null);
  const wsClientRef = useRef<FeedbackWebSocketClient | null>(null);

  /**
   * Initialize session
   */
  useEffect(() => {
    startSession();

    return () => {
      stopSession();
    };
  }, []);

  /**
   * Start feedback session
   */
  const startSession = async () => {
    try {
      setError(null);

      // Check browser support
      const support = MediaCapture.isSupported();
      if (!support.supported) {
        throw new Error(`Browser missing required APIs: ${support.missing.join(', ')}`);
      }

      // Start WebSocket connection
      const wsClient = await createFeedbackWebSocket(sessionId, {
        onFeedback: handleFeedback,
        onConnected: () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        },
        onDisconnected: () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        },
        onError: (err) => {
          console.error('WebSocket error:', err);
          setError(err.message);
        }
      });

      wsClientRef.current = wsClient;

      // Start media capture
      const mediaCapture = new MediaCapture(captureConfig, {
        onFrame: async (frameBlob, timestamp) => {
          if (wsClient.isConnected()) {
            await wsClient.sendFrame(frameBlob, timestamp, mediaCapture.getFrameNumber());
            setStats(prev => ({ ...prev, framesProcessed: prev.framesProcessed + 1 }));
          }
        },
        onAudioChunk: (audioData, timestamp) => {
          if (wsClient.isConnected()) {
            wsClient.sendAudio(audioData, timestamp, captureConfig.audio.sampleRate);
            setStats(prev => ({ ...prev, audioChunksProcessed: prev.audioChunksProcessed + 1 }));
          }
        },
        onError: (err) => {
          console.error('Media capture error:', err);
          setError(err.message);
        },
        onStreamStarted: () => {
          console.log('Media capture started');
          setIsCapturing(true);

          // Attach video preview
          const videoElement = mediaCapture.getVideoElement();
          if (videoElement && videoPreviewRef.current) {
            videoPreviewRef.current.appendChild(videoElement);
          }
        },
        onStreamStopped: () => {
          console.log('Media capture stopped');
          setIsCapturing(false);
        }
      });

      await mediaCapture.start();
      mediaCaptureRef.current = mediaCapture;

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      console.error('Failed to start session:', error);
    }
  };

  /**
   * Stop feedback session
   */
  const stopSession = async () => {
    // Stop media capture
    if (mediaCaptureRef.current) {
      mediaCaptureRef.current.stop();
      mediaCaptureRef.current = null;
    }

    // Disconnect WebSocket
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    setIsCapturing(false);
    setIsConnected(false);

    // Call session end callback
    onSessionEnd?.({
      sessionId,
      stats
    });
  };

  /**
   * Handle feedback message from server
   */
  const handleFeedback = (feedback: FeedbackMessage) => {
    if (feedback.scores) {
      setScores(feedback.scores);
    }

    if (feedback.suggestions) {
      setSuggestions(feedback.suggestions);
    }

    if (feedback.trends) {
      setTrends(feedback.trends);
    }
  };

  /**
   * Get score level (high/medium/low)
   */
  const getScoreLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  /**
   * Get delta direction
   */
  const getDeltaDirection = (delta: number): 'up' | 'down' | 'neutral' => {
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'neutral';
  };

  /**
   * Render score card
   */
  const ScoreCard = ({ label, score, delta }: { label: string; score: number; delta?: number }) => {
    const level = getScoreLevel(score);
    const direction = delta !== undefined ? getDeltaDirection(delta) : 'neutral';

    return (
      <div className="feedback-score-card">
        <div className="feedback-score-label">{label}</div>
        <div className="feedback-score-value" data-level={level}>
          {Math.round(score)}
        </div>
        {delta !== undefined && delta !== 0 && (
          <div className="feedback-score-delta" data-direction={direction}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(Math.round(delta))}
          </div>
        )}
        <div className="feedback-score-progress">
          <div
            className="feedback-score-progress-fill"
            data-level={level}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="feedback-page">
      {/* Header */}
      <header className="feedback-header">
        <div className="feedback-header-content">
          <div className="feedback-header-left">
            <h1 className="feedback-header-title">Real-Time Communication Feedback</h1>
            <p className="feedback-header-subtitle">Session: {sessionId.slice(0, 8)}</p>
          </div>
          <div className="feedback-header-right">
            <div className="feedback-status" data-connected={isConnected}>
              <span className="feedback-status-dot" />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button onClick={stopSession} className="feedback-end-btn">
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="feedback-main">
        <div className="feedback-container">

          {/* Left Column: Video Preview */}
          <div className="feedback-video-section">
            <div className="feedback-video-card">
              <div ref={videoPreviewRef} className="feedback-video-preview">
                {!isCapturing && (
                  <div className="feedback-video-placeholder">
                    <svg className="feedback-video-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="feedback-video-text">Initializing camera...</p>
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="feedback-video-stats">
                <div className="feedback-stat">
                  <span className="feedback-stat-label">Frames</span>
                  <span className="feedback-stat-value">{stats.framesProcessed}</span>
                </div>
                <div className="feedback-stat">
                  <span className="feedback-stat-label">Audio</span>
                  <span className="feedback-stat-value">{stats.audioChunksProcessed}</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="feedback-error">
                <svg className="feedback-error-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="feedback-error-content">
                  <h3 className="feedback-error-title">Error</h3>
                  <p className="feedback-error-message">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scores and Feedback */}
          <div className="feedback-scores-section">

            {/* Performance Scores */}
            <div>
              <div className="feedback-section-header">
                <h2 className="feedback-section-title">Performance Scores</h2>
              </div>

              <div className="feedback-scores-grid">
                <ScoreCard
                  label="Confidence"
                  score={scores.confidence}
                  delta={trends.confidenceDelta}
                />
                <ScoreCard
                  label="Engagement"
                  score={scores.engagement}
                  delta={trends.engagementDelta}
                />
                <ScoreCard
                  label="Clarity"
                  score={scores.clarity}
                  delta={trends.clarityDelta}
                />
                <ScoreCard
                  label="Authenticity"
                  score={scores.authenticity}
                />
                <ScoreCard
                  label="Professional Presence"
                  score={scores.professionalPresence}
                />
              </div>
            </div>

            {/* Suggestions */}
            <div className="feedback-suggestions-section">
              <div className="feedback-section-header">
                <h2 className="feedback-section-title">Suggestions</h2>
                {suggestions.length > 0 && (
                  <span className="feedback-section-count">({suggestions.length})</span>
                )}
              </div>

              {suggestions.length === 0 ? (
                <div className="feedback-suggestions-empty">
                  <svg className="feedback-suggestions-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="feedback-suggestions-empty-text">You're doing great! Keep it up.</p>
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="feedback-suggestion-card"
                    data-priority={suggestion.priority}
                  >
                    <div className="feedback-suggestion-header">
                      <span className="feedback-suggestion-category">
                        {suggestion.category}
                      </span>
                      <span
                        className="feedback-suggestion-priority"
                        data-level={suggestion.priority}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="feedback-suggestion-message">{suggestion.message}</p>
                    <p className="feedback-suggestion-improvement">{suggestion.improvement}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
