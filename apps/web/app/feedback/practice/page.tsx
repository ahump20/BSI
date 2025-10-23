'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeedbackDashboard from '@/components/feedback/FeedbackDashboard';
import { DEFAULT_CAPTURE_CONFIG } from '@/lib/feedback/capture';
import '../styles.css';

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

        // Navigate to results page (or home)
        router.push('/feedback');
      }

    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="di-shell">
        <main className="di-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="di-section" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '3px solid rgba(148, 163, 184, 0.2)', borderTopColor: 'var(--di-accent)', borderRadius: '50%', animation: 'feedback-spin 0.8s linear infinite', marginBottom: '1.5rem' }} />
            <p className="di-page-subtitle" style={{ color: 'var(--di-text-muted)' }}>
              Starting feedback session...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !sessionId) {
    return (
      <div className="di-shell">
        <main className="di-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="di-section">
            <div className="di-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '2rem' }}>
              <svg
                style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', color: 'var(--di-accent-strong)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              <h2 className="di-page-title" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                Session Error
              </h2>

              <p className="di-page-subtitle" style={{ marginBottom: '2rem', color: 'var(--di-text-muted)' }}>
                {error || 'Failed to start session'}
              </p>

              <button
                onClick={startNewSession}
                className="di-action"
                style={{ display: 'inline-flex' }}
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
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
