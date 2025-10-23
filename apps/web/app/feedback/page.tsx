import Link from 'next/link';
import './styles.css';

export const metadata = {
  title: 'AI Communication Feedback | Blaze Sports Intel',
  description: 'Real-time AI feedback on communication skills including tone, body language, facial expressions, and speech analysis'
};

export default function FeedbackHub() {
  return (
    <div className="di-shell">
      <main className="di-page">
        <section className="di-section">
          <span className="di-kicker">AI Coaching</span>
          <h1 className="di-page-title">Real-Time Communication Feedback</h1>
          <p className="di-page-subtitle">
            Master your communication with AI-powered analysis of tone, body language, facial expressions, and speech patterns.
            Get instant, actionable feedback to improve confidence, engagement, and clarity.
          </p>

          <div className="di-card-grid" style={{ marginTop: '2.5rem' }}>

            {/* Practice Mode */}
            <Link href="/feedback/practice" className="di-nav-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <svg
                  style={{ width: '32px', height: '32px', color: 'var(--di-accent)', flexShrink: 0 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <h3 className="di-page-title" style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                    Practice Session
                  </h3>
                  <p className="di-page-subtitle" style={{ fontSize: '0.9rem', margin: 0 }}>
                    Start a practice session with real-time feedback on your communication skills
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                <span className="probability-chip" style={{ fontSize: '0.7rem' }}>
                  Tone Analysis
                </span>
                <span className="probability-chip" style={{ fontSize: '0.7rem' }}>
                  Body Language
                </span>
                <span className="probability-chip" style={{ fontSize: '0.7rem' }}>
                  Facial Expressions
                </span>
                <span className="probability-chip" style={{ fontSize: '0.7rem' }}>
                  Speech Analysis
                </span>
              </div>
            </Link>

            {/* Performance History */}
            <div className="di-nav-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <svg
                  style={{ width: '32px', height: '32px', color: 'var(--di-text-muted)', flexShrink: 0 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <h3 className="di-page-title" style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                    Performance History
                  </h3>
                  <p className="di-page-subtitle" style={{ fontSize: '0.9rem', margin: 0 }}>
                    Review past sessions and track your improvement over time
                  </p>
                </div>
              </div>

              <span className="di-pill" style={{ marginTop: '1rem', fontSize: '0.65rem', background: 'rgba(148, 163, 184, 0.15)' }}>
                Coming Soon
              </span>
            </div>

            {/* Baseline Calibration */}
            <div className="di-nav-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <svg
                  style={{ width: '32px', height: '32px', color: 'var(--di-text-muted)', flexShrink: 0 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <div style={{ flex: 1 }}>
                  <h3 className="di-page-title" style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                    Baseline Calibration
                  </h3>
                  <p className="di-page-subtitle" style={{ fontSize: '0.9rem', margin: 0 }}>
                    Establish your personal baseline for more accurate, personalized feedback
                  </p>
                </div>
              </div>

              <span className="di-pill" style={{ marginTop: '1rem', fontSize: '0.65rem', background: 'rgba(148, 163, 184, 0.15)' }}>
                Coming Soon
              </span>
            </div>
          </div>

          {/* Features Section */}
          <div style={{ marginTop: '3.5rem' }}>
            <h2 className="di-page-title" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
              What You'll Get
            </h2>

            <div className="di-card-grid">
              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Multi-Dimensional Scoring
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Track 5 key dimensions: Confidence, Engagement, Clarity, Authenticity, and Professional Presence
                </p>
              </div>

              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Actionable Suggestions
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Get real-time, prioritized suggestions to improve specific aspects of your communication
                </p>
              </div>

              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Facial Expression Analysis
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Track emotions, micro-expressions, eye contact, and smile genuineness in real-time
                </p>
              </div>

              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Body Language Insights
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Analyze posture, gestures, energy level, and professional presence
                </p>
              </div>

              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Voice & Tone Analysis
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Monitor pitch, pace, volume, emotional tone, and stress levels
                </p>
              </div>

              <div className="di-card">
                <div style={{ color: 'var(--di-accent)', marginBottom: '1rem' }}>
                  <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="di-page-title" style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
                  Speech Quality Assessment
                </h3>
                <p className="di-page-subtitle" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Detect filler words, analyze articulation, track speaking rate, and identify dialect patterns
                </p>
              </div>
            </div>
          </div>

          {/* Get Started CTA */}
          <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link href="/feedback/practice" className="di-action" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
              Start Practice Session →
            </Link>
            <p className="di-page-subtitle" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              No account required • Works in your browser • Powered by AI
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
