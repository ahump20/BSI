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
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.transform = 'scaleX(-1)'; // Mirror video
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
   * Get score color based on value
   */
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  /**
   * Render score card
   */
  const ScoreCard = ({ label, score, delta }: { label: string; score: number; delta?: number }) => (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
        {Math.round(score)}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div className={`text-sm mt-1 ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}
        </div>
      )}
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time Communication Feedback</h1>
            <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={stopSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Video Preview */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                ref={videoPreviewRef}
                className="relative aspect-video bg-gray-900"
              >
                {!isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg">Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Frames:</span>
                    <span className="ml-2 font-semibold">{stats.framesProcessed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Audio:</span>
                    <span className="ml-2 font-semibold">{stats.audioChunksProcessed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scores and Feedback */}
          <div className="col-span-8 space-y-6">
            {/* Scores Grid */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Scores</h2>
              <div className="grid grid-cols-3 gap-4">
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
              </h2>

              {suggestions.length === 0 ? (
                <div className="bg-white rounded-lg p-8 shadow-md text-center">
                  <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">You're doing great! Keep it up.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              {suggestion.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              suggestion.priority === 'high' ? 'bg-red-200' :
                              suggestion.priority === 'medium' ? 'bg-yellow-200' :
                              'bg-blue-200'
                            }`}>
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className="font-medium mb-1">{suggestion.message}</p>
                          <p className="text-sm opacity-90">{suggestion.improvement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
