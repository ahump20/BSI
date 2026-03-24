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
    try {
      const ph = (window as unknown as Record<string, { capture?: (event: string, props: Record<string, unknown>) => void }>).posthog;
      ph?.capture?.('react_error_boundary', {
        error_message: error.message,
        error_name: error.name,
        component_stack: info.componentStack?.slice(0, 1000),
      });
    } catch {
      // PostHog not loaded — acceptable
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-boundary-container">
          <div>
            <p className="error-boundary-label">
              This section hit a snag
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="error-boundary-btn"
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
