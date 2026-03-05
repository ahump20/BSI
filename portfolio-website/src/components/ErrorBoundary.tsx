import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D0D0D',
          color: '#F5F0EB',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.85rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div>
            <p style={{ color: '#BF5700', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Something went wrong
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: 'none',
                border: '1px solid rgba(191,87,0,0.4)',
                color: '#BF5700',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.35rem',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
