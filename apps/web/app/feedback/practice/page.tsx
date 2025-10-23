'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeedbackDashboard from '@/components/feedback/FeedbackDashboard';
import { DEFAULT_CAPTURE_CONFIG } from '@/lib/feedback/capture';

export default function PracticePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Get actual user ID from auth context
  const userId = 'demo-user-123';

  /**
   * Start a new feedback session
   */
  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call API to start session
      const response = await fetch('/api/v1/feedback/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          session_type: 'practice',
          title: 'Practice Session',
          description: 'Communication practice with real-time feedback'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setSessionId(data.session_id);

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      console.error('Failed to start session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle session end
   */
  const handleSessionEnd = async (summary: any) => {
    try {
      if (!sessionId) return;

      // Call API to stop session
      const response = await fetch(`/api/v1/feedback/sessions/${sessionId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session ended:', data);

        // Navigate to results page
        router.push(`/feedback/results/${sessionId}`);
      }

    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Starting feedback session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Failed to start session'}</p>
            <button
              onClick={startNewSession}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <FeedbackDashboard
      sessionId={sessionId}
      userId={userId}
      onSessionEnd={handleSessionEnd}
      captureConfig={DEFAULT_CAPTURE_CONFIG}
    />
  );
}
