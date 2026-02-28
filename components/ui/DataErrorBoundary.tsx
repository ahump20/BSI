'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface DataErrorBoundaryProps {
  children: ReactNode;
  /** Label shown in the fallback UI (e.g. "Live Scores", "Editorial") */
  name?: string;
  /** Compact mode for inline sections vs full-width panels */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for live-data sections.
 * Prevents a single broken API response or bad data shape from
 * white-screening the entire page. Shows a graceful fallback with retry.
 */
export class DataErrorBoundary extends Component<DataErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[DataError${this.props.name ? `: ${this.props.name}` : ''}]`,
      error,
      info.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { name, compact } = this.props;
      const label = name ? `${name} temporarily unavailable` : 'Section temporarily unavailable';

      return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-12 px-4'}`}>
          <p className="text-xs font-display font-bold uppercase tracking-wider text-text-muted mb-3">
            {label}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold font-display cursor-pointer transition-all bg-burnt-orange/10 border border-burnt-orange/25 text-burnt-orange hover:bg-burnt-orange/20"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
