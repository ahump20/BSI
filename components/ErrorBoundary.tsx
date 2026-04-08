'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-surface-scoreboard"
        >
          <p
            className="text-base font-display uppercase tracking-widest mb-6"
            style={{ color: 'var(--bsi-bone, #F5F2EB)', fontFamily: 'Oswald, sans-serif' }}
          >
            Something went wrong — reload to try again
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-heritage-fill px-6 py-2 text-sm uppercase tracking-wider font-bold"
            style={{
              fontFamily: 'Oswald, sans-serif',
              background: 'var(--bsi-primary, #BF5700)',
              color: 'var(--bsi-bone, #F5F2EB)',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
